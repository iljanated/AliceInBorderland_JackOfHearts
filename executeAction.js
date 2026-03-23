const { MessageFlags } = require('discord.js');
const { modIds, playerChannelPrefix } = require('./config.json');
const { state } = require('./state.js');
const { safeChannelName } = require('./channel.js');

const executeAction = async (interaction, actionFunction, isRestricted, inGameOnly, livePlayerOnly) => {
	const channelId = interaction.channel.id;

	let message = undefined;

	try {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		if (state.busy) {
			throw 'The gamestate is being updated, please try again later.';
		}

		if (inGameOnly && !state.started) {
			throw 'The game hasn\'t started yet.';
		}
		if (inGameOnly && state.ended) {
			throw 'The game is over.';
		}

		const playerState = state.players.find(p => p.id === interaction.user.id);

		if (livePlayerOnly && !(playerState && playerState.alive)) {
			throw 'You are not a live player.';
		}


		if (isRestricted && !modIds.includes(interaction.user.id)) {
			throw 'access denied';
		}

		message = await actionFunction(interaction);
	}
	catch (error) {
		console.error(error);
		message = `There was an error:\n\`${error}\``;
	}
	finally {
		const oldChannel = interaction.guild.channels.cache.find(c => c.id === channelId);

		if (oldChannel) {
			if (message) {
				await interaction.editReply(message);
			}
			else {
				await interaction.deleteReply();
			}
		}

		const playerChannel = interaction.guild.channels.cache.find(c => c.name === safeChannelName(`${playerChannelPrefix}${interaction.user.username}`));
		if (playerChannel) {
			await playerChannel.send(message);
		}
	}
};

module.exports = {
	executeAction,
};