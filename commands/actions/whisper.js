const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { modIds, playChannels } = require('../../config.json');
const { state } = require('../../state.js');
const { scramble } = require('../../utils');

const whisper = async function(guild, player, target, whisperMessage) {
	if (modIds.includes(player.id)) {
		return ('GM\'s don\'t whisper.');
	}

	const playerState = state.players.find(p => p.id === player.id);

	if (!playerState.alive) {
		return ('Dead players can\'t whisper.');
	}

	if (modIds.includes(target.id)) {
		return ('You don\'t need to whisper to the GM. Just mention him in your private channel.');
	}

	const targetPlayerState = state.players.find(p => p.id === target.id);

	if (!targetPlayerState.alive) {
		return ('You can\'t whisper to dead people.');
	}

	const shareChannel = guild.channels.cache.find(c => playChannels.includes(c.name) && c.members.find(m => m.user.id === player.id) && c.members.find(m => m.user.id === target.id));

	if (!shareChannel) {
		return ('You can\'t whisper through walls. Try \'/Yell\'.');
	}

	shareChannel.send(`***<@${player.id}> whispers to <@${target.id}>:***\n${scramble(whisperMessage)}`);

	const privateChannel = guild.channels.cache.find(c => c.name === `player_${target.username}`);

	privateChannel.send(`***<@${player.id}> whispers to you:***\n${whisperMessage}`);

	return (`You whispered '${whisperMessage}' to <@${target.id}>.`);
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('whisper')
		.setDescription('Whisper something to another player.')
		.addUserOption((option) => option.setName('target').setDescription('The player to whisper to.').setRequired(true))
		.addStringOption((option) => option.setName('message').setDescription('The message to whisper.').setRequired(true)),
	async execute(interaction) {
		const player = interaction.user;
		const target = interaction.options.getUser('target', true);
		const whisperMessage = interaction.options.getString('message', true);
		try {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			const message = await whisper(interaction.guild, player, target, whisperMessage);

			if (message) {
				await interaction.editReply(message);
			}
			else {
				await interaction.deleteReply();
			}
		}
		catch (error) {
			console.error(error);
			await interaction.editReply(
				`There was an error:\n\`${error}\``,
			);
		}
	},
};