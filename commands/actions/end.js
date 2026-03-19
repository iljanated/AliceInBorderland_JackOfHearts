const { SlashCommandBuilder } = require('discord.js');
const { endRound } = require('../../game.js');
const { executeAction } = require('../../executeAction.js');
const { state, saveState } = require('../../state.js');

const end = async function(interaction) {
	const guild = interaction.guild;

	state.busy = true;
	await saveState();
	await endRound(guild);
	state.busy = false;
	await saveState();

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