const { SlashCommandBuilder } = require('discord.js');
const { state, saveState } = require('../../state.js');
const { centralChannelName } = require('./config.json');
const { endRound } = require('../../game.js');
const { executeAction } = require('../../executeAction.js');

const choices = [
	{ name: 'Yes', value: 'yes' },
	{ name: 'No', value: 'no' },
];

const early = async function (interaction) {
	const guild = interaction.guild;
	const player = interaction.user;
	const choice = interaction.options.getString('choice', true).toLowerCase();

	const playerState = state.players.find(p => p.id === player.id);

	playerState.early = choice === 'yes';
	await saveState();

	const corridorChannel = guild.channels.cache.find(c => c.name === centralChannelName);

	if (playerState.early) {
		const sent = await corridorChannel.send(`***<@${playerState.name}> wants to end early.***\n${state.players.filter(p => p.alive && p.early).length}/${state.players.filter(p => p.alive).length} players want to end early.`);
		await sent.pin();

	}
	else {
		const sent = await corridorChannel.send(`***<@${playerState.name}> does not want to end early.***\n${state.players.filter(p => p.alive && p.early).length}/${state.players.filter(p => p.alive).length} players want to end early.`);
		await sent.pin();

	}

	if (state.players.filter(p => p.alive).length === state.players.filter(p => p.alive && p.early).length) {
		state.busy = true;
		await saveState();
		await endRound(guild);
		state.busy = false;
		await saveState();
	}
	else {
		return ('Your preference has been saved.');
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