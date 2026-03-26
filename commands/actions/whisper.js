const { SlashCommandBuilder } = require('discord.js');
const { modIds, playChannelNames, playerChannelPrefix } = require('../../config.json');
const { state } = require('../../state.js');
const { scramble } = require('../../utils.js');
const { executeAction } = require('../../executeAction.js');
const { safeChannelName } = require('../../channel.js');

const whisper = async function(interaction) {
	const guild = interaction.guild;
	const player = interaction.user;
	const target = interaction.options.getUser('target', true);
	const whisperMessage = interaction.options.getString('message', true);

	const playerState = state.players.find(p => p.id === player.id);

	// testing method to fix Sfick bug
	if (!playerState || !playerState.alive) {
		const privateChannelName = safeChannelName(`${playerChannelPrefix}${target.username}`);
		const privateChannel = guild.channels.cache.find(c => c.name === privateChannelName);
		if (privateChannel) {
			throw 'access denied';
		}
		throw 'access denied';
	}

	const powerIndex = playerState.powers.findIndex(p => p.name === 'amplify');

	if (powerIndex >= 0) {
		return ('You can\'t whisper.');
	}


	if (modIds.includes(target.id)) {
		return ('You don\'t need to whisper to the GM. Just mention him in your private channel.');
	}

	const targetPlayerState = state.players.find(p => p.id === target.id);

	if (!(targetPlayerState && targetPlayerState.alive)) {
		return ('You can only target live players.');
	}

	const anonymousPowerIndex = playerState.powers.findIndex(p => p.name === 'anonymous');

	if (anonymousPowerIndex >= 0) {
		const privateChannel = guild.channels.cache.find(c => c.name === safeChannelName(`${playerChannelPrefix}${target.username}`));
		await privateChannel.send(`***You receive an anonymous message:***\n${whisperMessage}`);

		return (`You sent '${whisperMessage}' anonymously to <@${target.id}>.`);
	}

	const shareChannel = guild.channels.cache.find(c => playChannelNames.includes(c.name) && c.members.find(m => m.user.id === player.id) && c.members.find(m => m.user.id === target.id));

	if (!shareChannel) {
		return ('You can\'t whisper through walls. Try \'/Yell\'.');
	}

	if (state.anonymous) {
		await shareChannel.send(`***Someone whispers to <@${target.id}>:***\n${scramble(whisperMessage, 0.8 - (state.round * 0.1))}`);
	}
	else {
		await shareChannel.send(`***<@${player.id}> whispers to <@${target.id}>:***\n${scramble(whisperMessage, 0.8 - (state.round * 0.1))}`);
	}
	const privateChannel = guild.channels.cache.find(c => c.name === safeChannelName(`${playerChannelPrefix}${target.username}`));

	await privateChannel.send(`***<@${player.id}> whispers to you:***\n${whisperMessage}`);

	return (`You whispered '${whisperMessage}' to <@${target.id}>.`);
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('whisper')
		.setDescription('Whisper something to another player.')
		.addUserOption((option) => option.setName('target').setDescription('The player to whisper to.').setRequired(true))
		.addStringOption((option) => option.setName('message').setDescription('The message to whisper.').setRequired(true)),
	async execute(interaction) {
		await executeAction(interaction, whisper, false, true, false);
	},
};