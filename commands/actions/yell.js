const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { modIds, playChannels } = require('../../config.json');
const { state } = require('../../state.js');

const yell = async function(guild, player, yellMessage) {
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

	const channels = guild.channels.cache.filter(c => playChannels.includes(c.name));

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
		const player = interaction.user;
		const yellMessage = interaction.options.getString('message', true);
		try {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			const message = await yell(interaction.guild, player, yellMessage);

			if (message) {
				await interaction.editReply(message);
			}
			else {
				await interaction.deleteReply();
			}
		}
		catch (error) {
			console.error(error);
			await interaction.editReply(
				`There was an error:\n\`${error}\``,
			);
		}
	},
};