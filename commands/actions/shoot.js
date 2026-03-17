const { SlashCommandBuilder } = require('discord.js');
const { state, saveState } = require('../../state.js');
const { modIds, playChannelNames } = require('../../config.json');
const { kill } = require('../../game.js');
const { executeAction } = require('../../executeAction.js');

const shoot = async function(interaction) {
	const guild = interaction.guild;
	const player = interaction.user;
	const target = interaction.options.getUser('target', true);

	const playerState = state.players.find(p => p.id === player.id);

	const powerIndex = playerState.powers.findIndex(p => p.name === 'shoot');

	if (powerIndex < 0) {
		return ('You don\'t have a gun.');
	}

	if (modIds.includes(target.id)) {
		return ('You can\'t shoot the GM.');
	}

	const targetPlayerState = state.players.find(p => p.id === target.id);

	if (!targetPlayerState.alive) {
		return ('You can\'t shoot dead people.');
	}

	const shareChannel = guild.channels.cache.find(c => playChannelNames.includes(c.name) && c.members.find(m => m.user.id === player.id) && c.members.find(m => m.user.id === target.id));

	if (!shareChannel) {
		return ('You can\'t shoot people through walls.');
	}

	playerState.powers.splice(powerIndex, 1);
	await saveState();

	await shareChannel.send(`***<@${player.id}> pulls out a gun and shoots <@${target.id}>.***`);

	const otherChannels = guild.channels.cache.filter(c => playChannelNames.includes(c.name) && !(c.id === shareChannel.id));

	for ([id, channel] of otherChannels) {
		await channel.send('***There is a loud BANG.\nSomeone fired a gun!***');
	}

	await kill(guild, target);

	return (`You shot <@${target.id}>.`);
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shoot')
		.setDescription('Shoot and see what happens.')
		.addUserOption((option) => option.setName('target').setDescription('The player to shoot.').setRequired(true)),
	async execute(interaction) {
		await executeAction(interaction, shoot, false, true, true);
	},
};