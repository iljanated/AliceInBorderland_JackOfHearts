const { SlashCommandBuilder } = require('discord.js');
const { modIds, playChannelNames } = require('../../config.json');
const { state } = require('../../state.js');
const { executeAction } = require('../../executeAction.js');

const yell = async function(interaction) {
	const guild = interaction.guild;
	const player = interaction.user;
	const yellMessage = interaction.options.getString('message', true);

	if (modIds.includes(player.id)) {
		return ('GM\'s don\'t yell.');
	}

	const playerState = state.players.find(p => p.id === player.id);

	if (!playerState.alive) {
		return ('Dead players can\'t yell.');
	}

	const powerIndex = playerState.powers.findIndex(p => p.name === 'mute');

	if (powerIndex >= 0) {
		return ('You can\'t yell.');
	}

	const channels = guild.channels.cache.filter(c => playChannelNames.includes(c.name));

	for ([id, channel] of channels) {
		channel.send(`***<@${player.id}> yells:***\n**${yellMessage.toUpperCase()}**`);
	}

	return (`You yelled '${yellMessage}'.`);
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('yell')
		.setDescription('Yell something really loudly.')
		.addStringOption((option) => option.setName('message').setDescription('The message to yell.').setRequired(true)),
	async execute(interaction) {
		await executeAction(interaction, yell, false, true);
	},
};