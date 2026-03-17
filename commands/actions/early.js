const { SlashCommandBuilder } = require('discord.js');
const { state, saveState } = require('../../state.js');
const { endRound } = require('../../game.js');
const { executeAction } = require('../../executeAction.js');

const choices = [
	{ name: 'Yes', value: 'yes' },
	{ name: 'No', value: 'no' },
];

const early = async function(interaction) {
	const player = interaction.user;
	const choice = interaction.options.getString('choice', true).toLowerCase();

	const playerState = state.players.find(p => p.id === player.id);

	playerState.early = choice === 'yes';
	await saveState();

	if (state.players.filter(p => p.alive).length === state.players.filter(p => p.alive && p.early).length) {
		await endRound(guild);
	}
	else {
		return ('Your preference has been noted.');
	}
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('early')
		.setDescription('End early or not.')
		.addStringOption((option) => option.setName('choice').setDescription('Yes or No.').setRequired(true).setChoices(choices)),
	async execute(interaction) {
		await executeAction(interaction, early, false, true, true);
	},
};