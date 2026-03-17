const { SlashCommandBuilder } = require('discord.js');
const { endRound } = require('../../game.js');
const { executeAction } = require('../../executeAction.js');

const end = async function(interaction) {
	const guild = interaction.guild;

	await endRound(guild);

	return 'Round ended.';
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('end')
		.setDescription('End the round.'),
	async execute(interaction) {
		await executeAction(interaction, end, true, false, false);
	},
};