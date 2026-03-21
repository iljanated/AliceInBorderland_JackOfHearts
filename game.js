const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { modIds, playChannelNames, centralChannelName, deadChannelName, suits, earpieceChannelName, roundImages, deadImages } = require('./config.json');
const { powers } = require('./power.js');
const { shuffle, pick } = require('./utils.js');
const { state, saveState } = require('./state.js');
const { removePlayerFromChannel, addPlayerToChannel } = require('./channel.js');

const refreshCell = async function (guild, channelName) {
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

const kill = async function (guild, player, gameShouldEnd = true) {
	const playerState = state.players.find(p => p.id === player.id);
	playerState.alive = false;
	await saveState();

	const channels = guild.channels.cache.filter(c => playChannelNames.includes(c.name));

	for ([id, channel] of channels) {
		if (channel.members.find(m => m.user.id === player.id)) {
			await removePlayerFromChannel(player, channel);

			if (channel.name !== centralChannelName) {
				await refreshCell(guild, channel.name);
			}
		}
	}

	const earpieceChannel = guild.channels.cache.find(c => c.name === earpieceChannelName);
	await removePlayerFromChannel(player, earpieceChannel);


	const deadChannel = guild.channels.cache.find(c => c.name === deadChannelName);
	await addPlayerToChannel(player, deadChannel, true);

	const deadRole = guild.roles.cache.find(r => r.name === 'dead');
	const member = await guild.members.fetch(player.id);
	await member.roles.add(deadRole);

	const corridorChannel = guild.channels.cache.find(c => c.name === centralChannelName);

	const sent = await corridorChannel.send(`***<@${playerState.name}> died.***\nThere are ${state.players.filter(p => p.alive).length} players left.`);
	await sent.pin();

	const deadImage = pick(deadImages);
	const deadAttachment = new AttachmentBuilder(`./assets/${deadImage}`);

	const deadSent = await corridorChannel.send({
		files: [deadAttachment],
	});
	await deadSent.pin();

	const playerChannel = guild.channels.cache.find(c => c.name === `player_${player.username}`);
	const playerSent = await playerChannel.send('***You died, game over.***');
	await playerSent.pin();


	if (state.players.filter(p => p.alive).length <= 1 && gameShouldEnd) {
		await endGame(guild);
	}
};

const endRound = async function (guild) {
	const playerStates = state.players.filter(p => p.alive);

	for (playerState of playerStates) {
		if (playerState.suit !== playerState.suitChoice) {
			const member = await guild.members.fetch(playerState.id);;
			await kill(guild, member.user, false);
		}
	}

	const powersArray = Object.values(powers);

	for (power of powersArray) {
		for (playerState of playerStates) {
			if (playerState.alive && playerState.powers.find(p => p.name === power.name)) {
				if (power.name === 'shoot') {
					const member = await guild.members.fetch(playerState.id);
					await kill(guild, member.user, false);
				}
				else if (power.name === 'link') {
					const powerState = playerState.powers.find(p => p.name === power.name);
					const targetState = playerStates.find(p => p.id === powerState.target);
					if (!targetState) {
						const member = await guild.members.fetch(playerState.id);
						await kill(guild, member.user, false);
					}
				}
				else if (power.name === 'mutex') {
					const powerState = playerState.powers.find(p => p.name === power.name);
					const targetState = playerStates.find(p => p.id === powerState.target);
					if (targetState) {
						const member = await guild.members.fetch(playerState.id);;
						await kill(guild, member.user, false);
					}
				}
			}
		}
	}

	if (state.players.filter(p => p.alive).length > 1) {
		await startRound(guild);
	}
	else {
		await endGame(guild);
	}
};

const startRound = async function (guild) {
	state.round++;

	const earpieceChannel = guild.channels.cache.find(c => c.name === earpieceChannelName);
	const newEarpieceChannel = await earpieceChannel.clone();
	await newEarpieceChannel.setPosition(earpieceChannel.position);
	await earpieceChannel.delete();

	const sent = await newEarpieceChannel.send(
		`***You have an invisible earpiece and the microphone in your collar is activated.
You are now member of an exclusive private chat.
The chat ends at the end of the round.
All chat history will be removed at the end of the round.
Any limitations on communication are not applicable to this channel.***`);
	await sent.pin();

	const playerStates = state.players.filter(p => p.alive);
	const shuffledPowers = [...Object.values(powers)].filter(p => state.round >= p.startRound);
	shuffle(shuffledPowers);

	if (state.round > 1 && playerStates.length > 3) {
		const killIndex = shuffledPowers.findIndex(p => ['shoot', 'mutex'].includes(p.name));
		if (killIndex >= playerStates.length) {
			const newIndex = Math.floor(Math.random() * playerStates.length);
			[shuffledPowers[killIndex], shuffledPowers[newIndex]] = [shuffledPowers[newIndex], shuffledPowers[killIndex]];
		}
	}

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

		if (power.name === 'earpiece') {
			const member = await guild.members.fetch(playerState.id);
			const player = member.user;
			await addPlayerToChannel(player, newEarpieceChannel, true, true);
			const targetMember = await guild.members.fetch(playerPower.target);
			const targetPlayer = targetMember.user;
			await addPlayerToChannel(targetPlayer, newEarpieceChannel, true, true);
			const earpieceSent = await newEarpieceChannel.send(`***<@${player.id}> and <@${targetPlayer.id}> entered the chat.***`);
			await earpieceSent.pin();
		}
	}
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
		const member = await guild.members.fetch(playerState.id);
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

	if (state.round <= roundImages.length) {
		for (image of roundImages[state.round - 1]) {
			const roundAttachment = new AttachmentBuilder(`./assets/${image}`);

			const roundSent = await corridorChannel.send({
				files: [roundAttachment],
			});
			await roundSent.pin();
		}
	}

	const roundStartedSent = await corridorChannel.send(
		`**Round ${state.round}**
There are ${playerStates.length} players left.
Good luck!`);
	await roundStartedSent.pin();

};

const endGame = async function (guild) {
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