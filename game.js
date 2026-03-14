const { ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { config } = require('./config.json');
const { powers } = require('./power.js');
const { shuffle, pick } = require('./utils.js');
const { state, saveState } = require('./state.js');

const createChannel = async function(guild, name, allowCommands, addDead) {

	const globalDeny = [PermissionsBitField.Flags.ViewChannel];

	if (!allowCommands) {
		globalDeny.push(PermissionsBitField.Flags.UseApplicationCommands);
	}

	const permissionOverwrites = [
		{
			id: guild.id,
			deny: globalDeny,
		},
	];

	for (modId of config.modIds) {
		permissionOverwrites.push(
			{
				id: modId,
				allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
			});
	}

	if (addDead) {
		const roles = await guild.roles.fetch();
		const role = roles.find(r => r.name === 'dead');

		permissionOverwrites.push(
			{
				id: role.id,
				allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
				deny: [PermissionsBitField.Flags.SendMessages],
			},
		);
	}

	const channel = await guild.channels.create({
		name: name,
		type: ChannelType.GuildText,
		permissionOverwrites: permissionOverwrites,
	});

	return channel;
};

const addPlayerToChannel = async function(player, channel, history) {
	await channel.permissionOverwrites.create(player.id, {
		ViewChannel: true,
		SendMessages: true,
		ReadMessageHistory: history,
	});
};

const removePlayerFromChannel = async function(player, channel) {
	await channel.permissionOverwrites.create(player.id, {
		ViewChannel: false,
		SendMessages: false,
	});
};

const kill = async function(guild, player) {
	const channels = guild.channels.cache.filter(c => config.playChannels.includes(c.name));

	const playerState = state.players.find(s => s.name === player.username);

	for ([id, channel] of channels) {
		await removePlayerFromChannel(player, channel);
		const sent = await channel.send(`***<@${playerState.name}> died.***\nThere are ${state.players.filter(p => p.alive).length} players left.`);
		sent.pin();
	}

	const deadChannel = guild.channels.cache.find(c => c.name === 'dead');
	await addPlayerToChannel(player, deadChannel, true);

	playerState.alive = false;
	await saveState();
};

const endRound = async function(guild) {
	const playerStates = state.players.filter(p => p.alive);

	for (playerState of playerStates) {
		if (playerState.suit !== playerState.suitChoice) {
			const player = guild.members.cache.find(p => p.user.id === playerState.id).user;
			await kill(guild, player);
		}
	}

	const powersArray = Object.values(powers);

	for (power of powersArray) {
		for (playerState of playerStates) {
			if (playerState.alive && playerState.powers.find(p => p.name === power.name)) {
				if (!power.evaluate(playerState, playerStates)) {
					const player = guild.members.cache.find(p => p.user.id === playerState.id);
					await kill(guild, player);
				}
			}
		}
	}

	if (playerStates.filter(p => p.alive) > 1) {
		await startRound(guild);
	}
};

const startRound = async function(guild) {
	const playerStates = state.players.filter(p => p.alive);
	const shuffledPowers = [...Object.values(powers)];
	shuffle(shuffledPowers);
	for (let i = 0; i < playerStates.length; i++) {
		const playerState = playerStates[i];
		playerState.suit = pick(['diamonds', 'hearts', 'clubs', 'spades']);
		playerState.early = false;
		playerState.suitChoice = undefined;

		const power = shuffledPowers[i % shuffledPowers.length];

		let target = playerState.id;
		if (power.target) {
			while (target === playerState.id) {
				target = pick(playerStates).id;
			}
 		}

		const playerPower = {
			name: power.name,
			target: target,
		};
		playerStates[i].powers = [playerPower];
	}
	state.round++;
	await saveState();

	const playChannels = guild.channels.cache.filter(c => config.playChannels.includes(c.name));
	for ([id, channel] of playChannels) {
		for ([id, member] of channel.members) {
			if (!config.modIds.includes(member.user.id)) {
				await removePlayerFromChannel(member.user, channel);
			}
		}
	}

	const corridorChannel = guild.channels.cache.find(c => c.name === 'corridor');

	for (playerState of playerStates) {
		const members = await guild.members.fetch({ query: playerState.name, limit: 1 });
		const player = members.first().user;
		await addPlayerToChannel(player, corridorChannel);

		const privateEmbed = new EmbedBuilder()
			.setColor(0x0099ff)
			.setTitle(`Round ${state.round}`)
			.setTimestamp()
			.setFooter({ text: 'Good luck!' });

		const playerChannel = guild.channels.cache.find(c => c.name === `player_${player.username}`);
		for (power of playerState.powers) {
			const powerDefinition = powers[power.name];
			const description = powerDefinition.description(playerState);

			privateEmbed.addFields(
				{ name: `Power: ${power.name}`, value: description },
			);
		}

		const sent = await playerChannel.send({ embeds: [privateEmbed] });
		sent.pin();
	}
};

module.exports = {
	createChannel,
	addPlayerToChannel,
	removePlayerFromChannel,
	startRound,
	endRound,
	kill,
};