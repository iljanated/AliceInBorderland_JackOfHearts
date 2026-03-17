const { SlashCommandBuilder } = require('discord.js');
const { state } = require('../../state.js');
const { suits } = require('../../config.json');
const { executeAction } = require('../../executeAction.js');

const status = async function(interaction) {
	const player = interaction.user;

	const playerState = state.players.find(p => p.id === player.id);

	const alive = playerState && playerState.alive;

	const alivePlayers = state.players.filter(p => p.alive).sort((a, b) => a.name.localeCompare(b.name));
	const earlyPlayers = alivePlayers.filter(p => p.early).sort((a, b) => a.name.localeCompare(b.name));
	const submitPlayers = alivePlayers.filter(p => p.suitChoice).sort((a, b) => a.name.localeCompare(b.name));

	let result = `${alivePlayers.length} out of ${state.players.length} players are still alive:\n`;
	for (alivePlayer of alivePlayers) {
		result += `- ${alivePlayer.name}\n`;
	}

	if (earlyPlayers.length > 0) {
		result += '\nThe following players want to end early:\n';
		for (earlyPlayer of earlyPlayers) {
			result += `- ${earlyPlayer.name}\n`;
		}
	}
	else {
		result += '\nNo one wants to end early yet.\n';
	}

	if (submitPlayers.length > 0) {
		result += '\nThe following players have submitted a suit:\n';

		const telepath = alive && playerState.powers.find(p => p.name === 'telepath');

		for (submitPlayer of submitPlayers) {
			if (telepath) {
				result += `- ${submitPlayer.name}: **${suits[submitPlayer.suitChoice].label}**\n`;
			} else if (!alive) {
				result += `- ${submitPlayer.name}: **${suits[submitPlayer.suitChoice].label}** (Collar: **${suits[submitPlayer.suit].label})**\n`;
			}
			else {
				result += `- ${submitPlayer.name}\n`;
			}
		}
	}
	else {
		result += '\nNo one has submitted a suit yet.\n';
	}

	if (alive) {
		if (playerState.suitChoice) {
			result += `\nYour currently submitted suit is **${suits[playerState.suitChoice].label}**.\n`;
		}
		else {
			result += '\nYou haven\'t submitted a suit yet.\n';
		}

		result += playerState.early ? '\nYou want to end early.\n' : '\nYou don\'t want to end early.\n';
		if (playerState.powers.length > 0) {
			result += `\nYour remaining powers are:\n- ${playerState.powers.map(p => p.name).join('\n- ')}\n`;
		}
		else {
			result += '\nYou don\'t have any more powers this round.\n';
		}
	}

	return (result);
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('status')
		.setDescription('Give the current status of the game.'),
	async execute(interaction) {
		await executeAction(interaction, status, false, false, false);
	},
};