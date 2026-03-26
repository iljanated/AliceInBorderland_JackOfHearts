const { SlashCommandBuilder } = require('discord.js');
const { state, saveState } = require('../../state.js');
const { playChannelNames, suits, playerChannelPrefix } = require('../../config.json');
const { kill } = require('../../game.js');
const { executeAction } = require('../../executeAction.js');
const { pick } = require('../../utils.js');
const { safeChannelName } = require('../../channel.js');

const shoot = async function (interaction) {
	const guild = interaction.guild;
	const player = interaction.user;
	const target = interaction.options.getUser('target', true);

	const playerState = state.players.find(p => p.id === player.id);

	const shareChannel = guild.channels.cache.find(c => playChannelNames.includes(c.name) && c.members.find(m => m.user.id === player.id) && c.members.find(m => m.user.id === target.id));

	if (!shareChannel) {
		return ('You can\'t target people through walls.');
	}

	const targetPlayerState = state.players.find(p => p.id === target.id);
	if (!(targetPlayerState && targetPlayerState.alive)) {
		return ('You can only target live players.');
	}

	const scrambleIndex = playerState.powers.findIndex(p => p.name === 'scramble');
	if (scrambleIndex >= 0) {
		const oldId = playerState.powers[scrambleIndex].target;
		playerState.powers[scrambleIndex].target = target.id;
		await saveState();

		const oldName = state.players.find(p => p.id === oldId).name;
		const newName = state.players.find(p => p.id === target.id).name;

		const oldPrivateChannel = guild.channels.cache.find(c => c.name === safeChannelName(`${playerChannelPrefix}${oldName}`));
		const newPrivateChannel = guild.channels.cache.find(c => c.name === safeChannelName(`${playerChannelPrefix}${newName}`));

		if (state.anonymous) {
			if (oldId !== player.id) {
				await shareChannel.send(`***Someone unscrambled <@${oldId}>'s collar.***`);
			}
			await shareChannel.send(`***Someone scrambled <@${target.id}>'s collar.***`);

			await oldPrivateChannel.send('***Someone unscrambled your collar.***');
			await newPrivateChannel.send('***Someone scrambled your collar.***');
		}
		else {
			await shareChannel.send(`***<@${player.id}> unscrambled <@${oldId}>'s collar.***`);
			await shareChannel.send(`***<@${player.id}> scrambled <@${target.id}>'s collar.***`);

			await oldPrivateChannel.send(`***<@${player.id}> unscrambled your collar.***`);
			await newPrivateChannel.send(`***<@${player.id}> scrambled your collar.***`);
		}
		return (`You scrambled <@${target.id}>.`);
	}

	const tamperIndex = playerState.powers.findIndex(p => p.name === 'tamper');
	if (tamperIndex >= 0) {
		const targetPlayerState = state.players.find(p => p.id === target.id);
		targetPlayerState.suit = pick(Object.values(suits).map(s => s.name));
		playerState.powers.splice(tamperIndex, 1);
		await saveState();

		const privateChannel = guild.channels.cache.find(c => c.name === safeChannelName(`${playerChannelPrefix}${target.username}`));

		if (state.anonymous) {
			await shareChannel.send(`***Someone tampered with <@${target.id}>'s collar.
His suit has changed.***`);
			await privateChannel.send(`***Someone tampered with your collar.
Your suit has changed.***`);
		}
		else {
			await shareChannel.send(`***<@${player.id}> tampered with <@${target.id}>'s collar.
His suit has changed.***`);
			await privateChannel.send(`***<@${player.id}> tampered with your collar.
Your suit has changed.***`);
		}

		return (`You tampered with <@${target.id}>'s collar.`);
	}

	const switchIndex = playerState.powers.findIndex(p => p.name === 'switch');
	if (switchIndex >= 0) {
		const targetSuit = targetPlayerState.suit;
		targetPlayerState.suit = playerState.suit;
		playerState.suit = targetSuit;
		playerState.powers.splice(switchIndex, 1);
		await saveState();

		const privateChannel = guild.channels.cache.find(c => c.name === safeChannelName(`${playerChannelPrefix}${target.username}`));

		if (state.anonymous) {
			await shareChannel.send(`***Someone switched his suit with <@${target.id}>'s collar.
His suit has changed.***`);
			await privateChannel.send(`***Someone switched his suit with your collar.
Your suit has changed.***`);
		}
		else {
			await shareChannel.send(`***<@${player.id}> switched his suit with <@${target.id}>'s collar.
His suit has changed.***`);
			await privateChannel.send(`***<@${player.id}> switched his suit with your collar.
Your suit has changed.***`);
		}

		return (`You switched your suit with <@${target.id}>'s collar.`);
	}

	const powerIndex = playerState.powers.findIndex(p => p.name === 'shoot');

	if (powerIndex < 0) {
		state.busy = false;
		await saveState();
		return ('You don\'t have a gun.');
	}

	playerState.powers.splice(powerIndex, 1);
	await saveState();

	if (state.anonymous) {
		await shareChannel.send(`***Someone pulls out a gun and shoots <@${target.id}>.***`);
	}
	else {
		await shareChannel.send(`***<@${player.id}> pulls out a gun and shoots <@${target.id}>.***`);
	}

	const otherChannels = guild.channels.cache.filter(c => playChannelNames.includes(c.name) && !(c.id === shareChannel.id));

	for ([id, channel] of otherChannels) {
		await channel.send('***There is a loud BANG.\nSomeone fired a gun!***');
	}

	state.busy = true;
	await saveState();

	await kill(guild, target);

	state.busy = false;
	await saveState();

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