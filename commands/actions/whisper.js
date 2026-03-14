const { SlashCommandBuilder } = require('discord.js');

const whisper = async function(guild, player, target, whisperMessage) {
	return 'success';
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('whisper')
		.setDescription('Whisper something to another player.')
		.addUserOption((option) => option.setName('target').setDescription('The player to check.').setRequired(true))
		.addStringOption((option) => option.setName('message').setDescription('The message to whisper.').setRequired(true)),
	async execute(interaction) {
		const player = interaction.user;
		const target = interaction.options.getUser('target', true);
		const whisperMessage = interaction.options.getString('message', true);
		try {
			await interaction.deferReply();

			const message = await yell(interaction.guild, player, target, whisperMessage);

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