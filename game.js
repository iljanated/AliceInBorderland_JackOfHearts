const { EmbedBuilder } = require('discord.js');
const { modIds, playChannelNames, centralChannelName, deadChannelName, suits } = require('./config.json');
const { powers } = require('./power.js');
const { shuffle, pick } = require('./utils.js');
const { state, saveState } = require('./state.js');
const { removePlayerFromChannel, addPlayerToChannel } = require('./channel.js');

const kill = async function(guild, player, gameShouldEnd = true) {
	const channels = guild.channels.cache.filter(c => playChannels.includes(c.name));

	const playerState = state.players.find(s => s.name === player.username);

	for ([id, channel] of channels) {
		await removePlayerFromChannel(player, channel);
		const sent = await channel.send(`***<@${playerState.name}> died.***\nThere are ${state.players.filter(p => p.alive).length} players left.`);
		sent.pin();
	}

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

	const corridorChannel = guild.channels.cache.find(c => c.name === centralChannelName);

	for (playerState of playerStates) {
		const members = await guild.members.fetch({ query: playerState.name, limit: 1 });
		const player = members.first().user;

		const powerIndex = playerState.powers.findIndex(p => p.name === 'mute' || p.name === 'amplify');

		await addPlayerToChannel(player, corridorChannel, false, powerIndex < 0);

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

const endGame = async function(guild) {
	state.ended = true;
	saveState();

	const winner = state.players.find(p => p.alive);

	const message = winner ? `***The game is over.\nThe winner is <@${winner.id}>!***` : '***The game is over.\nThere was no winner.***';

	const playChannels = guild.channels.cache.filter(c => playChannelNames.includes(c.name));
	for ([id, channel] of playChannels) {
		const sent = await channel.send(message);
		sent.pin();
	}
};

module.exports = {
	startRound,
	endRound,
	kill,
};