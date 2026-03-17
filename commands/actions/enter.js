const { SlashCommandBuilder } = require('discord.js');
const { modIds, playChannelNames, centralChannelName } = require('../../config.json');
const { state } = require('../../state.js');
const { removePlayerFromChannel, addPlayerToChannel } = require('../../channel.js');
const { refreshCell } = require('../../game.js');
const { capitalizeOnlyFirst } = require('../../utils.js');
const { executeAction } = require('../../executeAction.js');

const choices = playChannelNames.map(c => { return ({ name: capitalizeOnlyFirst(c), value: c }); });

const enter = async function(interaction) {
	const player = interaction.user;
	const choice = interaction.options.getString('door', true).toLowerCase();
	const guild = interaction.guild;

	if (!state.started) {
		return ('The game hasn\'t started yet.');
	}
	if (state.ended) {
		return ('The game is over.');
	}

	if (modIds.includes(player.id)) {
		return ('GM\'s can\'t enter rooms.');
	}

	const playerState = state.players.find(p => p.id === player.id);

	if (!playerState.alive) {
		return ('Dead players can\'t enter rooms.');
	}

	const powerIndex = playerState.powers.findIndex(p => p.name === 'immobile');

	if (powerIndex >= 0) {
		return ('You are immobilized and can\'t leave the room.');
	}

	if (modIds.includes(player.id)) {
		return ('GM\'s don\'t leave rooms.');
	}

	const playerChannel = guild.channels.cache.find(c => playChannelNames.includes(c.name) && c.members.find(m => m.user.id === player.id));

	if (!playerChannel) {
		return ('You are not in a valid room.');
	}

	if (playerChannel.name === choice) {
		return ('You are alredy in that room.');
	}

	if (playerChannel.name !== centralChannelName && choice !== centralChannelName) {
		return ('There are no doors between these rooms.');
	}

	const targetChannel = guild.channels.cache.find(c => c.name === choice);

	await playerChannel.send(`***<@${player.id}> leaves the room through door "${choice}".***`);

	await removePlayerFromChannel(player, playerChannel);

	if (playerChannel.name !== centralChannelName) {
		await refreshCell(guild, playerChannel.name);
	}

	const mutePowerIndex = playerState.powers.findIndex(p => p.name === 'mute' || p.name === 'amplify');

	await addPlayerToChannel(player, targetChannel, true, mutePowerIndex < 0);

	await targetChannel.send(`***<@${player.id}> enters the room.***`);

	return (`You entered room "${choice}"`);
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('enter')
		.setDescription('Go to another room.')
		.addStringOption((option) => option.setName('door').setDescription('The label on the door.').setRequired(true).setChoices(choices)),
	async execute(interaction) {
		await executeAction(interaction, enter, false);
	},
};