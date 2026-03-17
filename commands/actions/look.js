const { SlashCommandBuilder } = require('discord.js');
const { state } = require('../../state.js');
const { modIds, playChannelNames, suits } = require('../../config.json');
const { pick } = require('../../utils.js');
const { executeAction } = require('../../executeAction.js');

const look = async function(interaction) {
	const guild = interaction.guild;
	const player = interaction.user;
	const target = interaction.options.getUser('target', true);

	if (!state.started) {
		return ('The game hasn\'t started yet.');
	}
	if (state.ended) {
		return ('The game is over.');
	}

	if (player.id === target.id) {
		return ('No cheating!');
	}

	if (modIds.includes(target.id)) {
		return ('The GM is not a participant in the game.');
	}

	const targetPlayerState = state.players.find(p => p.id === target.id);

	if (!targetPlayerState.alive) {
		return (`<@${target.id}> is dead.`);
	}

	const playerState = state.players.find(p => p.id === player.id);

	if (!playerState.alive) {
		return (`<@${target.id}>'s suit is "${targetPlayerState.suit}".`);
	}

	const shareChannel = guild.channels.cache.find(c => playChannelNames.includes(c.name) && c.members.find(m => m.user.id === player.id) && c.members.find(m => m.user.id === target.id));

	if (!shareChannel) {
		return ('You can\'t see through walls.');
	}

	const blindPowerIndex = playerState.powers.findIndex(p => p.name === 'blind');

	if (blindPowerIndex >= 0) {
		return ('You are blind.');
	}

	const randomPowerIndex = playerState.powers.findIndex(p => p.name === 'random');

	const finalTargetPlayerState = randomPowerIndex < 0 ? targetPlayerState : pick(state.players);

	const blurPowerIndex = playerState.powers.findIndex(p => p.name === 'blur');

	if (blurPowerIndex >= 0) {
		const suit = suits[finalTargetPlayerState.suit].color;
		return (`<@${target.id}>'s suit is ${suit}.`);
	}

	return (`<@${target.id}>'s suit is "${finalTargetPlayerState.suit}".`);
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('look')
		.setDescription('Look at the suit on someone else\'s collar.')
		.addUserOption((option) => option.setName('target').setDescription('The player to check.').setRequired(true)),
	async execute(interaction) {
		await executeAction(interaction, look, false);
	},
};