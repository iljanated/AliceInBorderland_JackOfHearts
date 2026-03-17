const { EmbedBuilder } = require('discord.js');
const { modIds, playChannelNames, centralChannelName, deadChannelName, suits, earpieceChannelName } = require('./config.json');
const { powers } = require('./power.js');
const { shuffle, pick } = require('./utils.js');
const { state, saveState } = require('./state.js');
const { removePlayerFromChannel, addPlayerToChannel } = require('./channel.js');

const refreshCell = async function(guild, channelName) {
	const channel = guild.channels.cache.find(c => c.name === channelName);
	const playerIds = state.players.filter(p => p.alive).map(p => p.id);
	if (channel.members.filter(m => playerIds.includes(m.user.id)) > 0) {
		return false;
	}
	const newChannel = await channel.clone();
	await newChannel.setPosition(channel.position);
	await channel.delete();

	const embed = new EmbedBuilder()
		.setColor(0x0099ff)
		.setTitle(channelName)
		.setTimestamp();

	embed.addFields(
		{ name: 'Doors', value: `There is only one door.\nIt is marked ${centralChannelName}.` },
	);
	embed.addFields(
		{ name: 'History', value: `When the last player leaves ${channelName}, the channel is reset and all chat history is gone forever.` },
	);

	const sent = await newChannel.send({ embeds: [embed] });
	await sent.pin();

	return true;
};

const kill = async function(guild, player, gameShouldEnd = true) {
	const channels = guild.channels.cache.filter(c => playChannelNames.includes(c.name));

	const playerState = state.players.find(s => s.name === player.username);

	for ([id, channel] of channels) {
		await removePlayerFromChannel(player, channel);

		const channelId = channel.id;

		if (channel.name !== centralChannelName) {
			await refreshCell(guild, channel.name);
		}

		if (guild.channels.cache.find(c => c.id === channelId)) {
			const sent = await channel.send(`***<@${playerState.name}> died.***\nThere are ${state.players.filter(p => p.alive).length} players left.`);
			await sent.pin();
		}
	}

	const earpieceChannel = guild.channels.cache.find(c => c.name === earpieceChannelName);
	await removePlayerFromChannel(player, earpieceChannel);


	const deadChannel = guild.channels.cache.find(c => c.name === deadChannelName);
	await addPlayerToChannel(player, deadChannel, true);

	playerState.alive = false;
	await saveState();

	if (state.players.filter(p => p.alive) <= 1 && gameShouldEnd) {
		await endGame(guild);
	}
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
				if (power.name === 'link') {
					const powerState = playerState.powers.find(p => p.name === power.name);
					const targetState = playerStates.find(p => p.id === powerState.target);
					if (!targetState.alive) {
						await kill(guild, player);
					}
				}
				else if (power.name === 'mutex') {
					const powerState = playerState.powers.find(p => p.name === power.name);
					const targetState = playerStates.find(p => p.id === powerState.target);
					if (targetState.alive) {
						await kill(guild, player, false);
					}
				}
			}
		}
	}

	if (state.players.filter(p => p.alive) <= 1) {
		await endGame(guild);
	}
	else {
		startRound(guild);
	}
};

const startRound = async function(guild) {
	const earpieceChannel = guild.channels.cache.find(c => c.name === earpieceChannelName);
	const newEarpieceChannel = await earpieceChannel.clone();
	await newEarpieceChannel.setPosition(earpieceChannel.position);
	await earpieceChannel.delete();

	const sent = await newEarpieceChannel.send(
		`***The microphone in your collar is activated.
You are now member of an exclusive private chat.
The chat ends at the end of the round.
All chat history will be removed at the end of the round.
Any limitations on communication are not applicable in this channel.***`);
	await sent.pin();

	const playerStates = state.players.filter(p => p.alive);
	const shuffledPowers = [...Object.values(powers)];
	shuffle(shuffledPowers);
	for (let i = 0; i < playerStates.length; i++) {
		const playerState = playerStates[i];
		playerState.suit = pick(Object.values(suits).map(s => s.name));
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

		if (power.name === 'earpice') {
			const member = guild.members.cache.find(m => m.user.username === playerState.name);
			const player = member.user;
			await addPlayerToChannel(player, newEarpieceChannel, true, true);
			const targetMember = guild.members.cache.find(m => m.user.username === playerState.name);
			const targetPlayer = targetMember.user;
			await addPlayerToChannel(targetPlayer, newEarpieceChannel, true, true);
		}
	}
	state.round++;
	await saveState();

	const playChannels = guild.channels.cache.filter(c => playChannelNames.includes(c.name));
	for ([id, channel] of playChannels) {
		for ([id, member] of channel.members) {
			if (!modIds.includes(member.user.id)) {
				await removePlayerFromChannel(member.user, channel);
			}
		}
	}

	for (channelName of playChannelNames) {
		if (channelName !== centralChannelName) {
			await refreshCell(guild, channelName);
		}
	}

	const corridorChannel = guild.channels.cache.find(c => c.name === centralChannelName);

	for (playerState of playerStates) {
		const member = guild.members.cache.find(m => m.user.username === playerState.name);
		const player = member.user;

		const powerIndex = playerState.powers.findIndex(p => p.name === 'mute' || p.name === 'amplify');

		await addPlayerToChannel(player, corridorChannel, true, powerIndex < 0);

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

		const privateSent = await playerChannel.send({ embeds: [privateEmbed] });
		await privateSent.pin();
	}
};

const endGame = async function(guild) {
	state.ended = true;
	saveState();

	const winner = state.players.find(p => p.alive);

	const message = winner ? `***The game is over.\nThe winner is <@${winner.id}>!***` : '***The game is over.\nThere was no winner.***';

	const playChannels = guild.channels.cache.filter(c => playChannelNames.includes(c.name));
	for ([id, channel] of playChannels) {
		const sent = await channel.send(message);
		await sent.pin();
	}
};

module.exports = {
	startRound,
	endRound,
	kill,
	refreshCell,
};