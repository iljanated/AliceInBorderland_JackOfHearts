const { SlashCommandBuilder } = require('discord.js');
const { state } = require('../../state.js');
const { modIds, playChannelNames, suits } = require('../../config.json');
const { pick } = require('../../utils.js');
const { executeAction } = require('../../executeAction.js');

const look = async function(interaction) {
	const guild = interaction.guild;
	const player = interaction.user;
	const target = interaction.options.getUser('target', true);

	if (player.id === target.id) {
		return ('No cheating!');
	}

	const targetPlayerState = state.players.find(p => p.id === target.id);

	const playerState = state.players.find(p => p.id === player.id);

	if (!(playerState && playerState.alive)) {
		return (`<@${target.id}>'s suit is **${suits[targetPlayerState.suit].label}**.`);
	}

	const shareChannel = guild.channels.cache.find(c => playChannelNames.includes(c.name) && c.members.find(m => m.user.id === player.id) && c.members.find(m => m.user.id === target.id));

	if (!shareChannel) {
		return ('You can\'t see through walls.');
	}

	const blindPowerIndex = playerState.powers.findIndex(p => p.name === 'blind');

	if (blindPowerIndex >= 0) {
		return ('You are blind.');
	}

	const scramblePlayerIndex = state.players.findIndex(pl => {
		const powerIndex = pl.powers.findIndex(p => p.name === 'scramble' && p.target === target.id);
		return powerIndex >= 0;
	});

	if (scramblePlayerIndex >= 0) {
		throw 'The collar is scrambled.';
	}

	let finalTargetPlayerState = targetPlayerState;

	const randomPowerIndex = playerState.powers.findIndex(p => p.name === 'random');

	if (randomPowerIndex >= 0 && Math.random() > 0.5) {
		finalTargetPlayerState = pick(state.players.filter(p => p.alive));
	}

	const glitchPowerIndex = targetPlayerState.powers.findIndex(p => p.name === 'glitch');

	if (glitchPowerIndex >= 0) {
		if (targetPlayerState.suit === playerState.suit) {
			throw 'Collar display malfunctioned.';
		}
		else {
			finalTargetPlayerState = playerState;
		}
	}

	const blurPowerIndex = playerState.powers.findIndex(p => p.name === 'blur');

	if (blurPowerIndex >= 0) {
		return (`<@${target.id}>'s suit is **${suits[finalTargetPlayerState.suit].colorLabel}**.`);
	}

	return (`<@${target.id}>'s suit is **${suits[finalTargetPlayerState.suit].label}**.`);
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('look')
		.setDescription('Look at the suit on someone else\'s collar.')
		.addUserOption((option) => option.setName('target').setDescription('The player to check.').setRequired(true)),
	async execute(interaction) {
		await executeAction(interaction, look, false, true, false);
	},
};