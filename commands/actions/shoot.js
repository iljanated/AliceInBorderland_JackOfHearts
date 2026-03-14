const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { state, saveState } = require('../../state.js');
const { modIds, playChannelNames } = require('../../config.json');
const { kill } = require('../../game.js');

const shoot = async function(guild, player, target) {

	if (modIds.includes(player.id)) {
		return ('The GM doesn\'t shoot players.');
	}

	const playerState = state.players.find(p => p.id === player.id);

	if (!playerState.alive) {
		return ('Dead players can\'t shoot');
	}

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
		const player = interaction.user;
		const target = interaction.options.getUser('target', true);
		try {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			const message = await shoot(interaction.guild, player, target);

			if (message) {
				await interaction.editReply(message);
			}
			else {
				await interaction.deleteReply();
			}
		}
		catch (error) {
			console.error(error);
			await interaction.editReply(`There was an error:\n\`${error}\``);
		}
	},
};