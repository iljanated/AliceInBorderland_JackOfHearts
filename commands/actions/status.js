const { SlashCommandBuilder } = require('discord.js');
const { state } = require('../../state.js');
const { executeAction } = require('../../executeAction.js');

const status = async function(interaction) {
	const player = interaction.user;

	const playerState = state.players.find(p => p.id === player.id);

	const alivePlayers = state.players.filter(p => p.alive);
	const earlyPlayers = alivePlayers.filter(p => p.early);

	let result = `${alivePlayers.length} out of ${state.players.length} players are still alive.`;
	result += `\n${earlyPlayers.length} player want(s) to end early.`;
	if (playerState.alive) {
		result += playerState.early ? '\nYou want to end early.' : '\nYou don\'t want to end early.';
		if (playerState.powers.length > 0) {
			result += `\nYour remaining powers are:\n- ${playerState.powers.map(p => p.name).join('\n- ')}`;
		}
		else {
			result += '\nYou don\'t have any more powers this round.';
		}

		if (playerState.suit) {
			result += `\nYour currently submitted suit is **${playerState.suitChoice}**.`;
		}
		else {
			result += '\nYou haven\'t submitted a suit yet.';
		}
	}

	return (result);
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('status')
		.setDescription('Give the current status of the game.'),
	async execute(interaction) {
		await executeAction(interaction, status, false, true);
	},
};