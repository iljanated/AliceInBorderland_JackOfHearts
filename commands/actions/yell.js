const { SlashCommandBuilder } = require('discord.js');

const yell = async function(guild, player, choice) {
	return 'success';
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('yell')
		.setDescription('Yell something really loudly.')
		.addStringOption((option) => option.setName('message').setDescription('The message to yell.').setRequired(true)),
	async execute(interaction) {
		const player = interaction.user;
		const yellMessage = interaction.options.getString('message', true);
		try {
			await interaction.deferReply();

			const message = await yell(interaction.guild, player, yellMessage);

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