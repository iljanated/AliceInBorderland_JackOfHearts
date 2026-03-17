const { SlashCommandBuilder } = require('discord.js');
const { state, saveState } = require('../../state.js');
const { suits } = require('../../config.json');
const { executeAction } = require('../../executeAction.js');

const choices = Object.values(suits).map(s => { return ({ name: s.label, value: s.name }); });

const suit = async function(interaction) {
	const player = interaction.user;
	const choice = interaction.options.getString('suit', true).toLowerCase();

	const playerState = state.players.find(p => p.id === player.id);

	playerState.suitChoice = choice;
	await saveState();

	return ('Your choice has been noted.');
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('suit')
		.setDescription('Commit your suit.')
		.addStringOption((option) => option.setName('suit').setDescription('The suit on your collar.').setRequired(true).setChoices(choices)),
	async execute(interaction) {
		await executeAction(interaction, suit, false, true, true);
	},
};