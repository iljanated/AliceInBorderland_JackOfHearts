const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { modIds, generalChannelNames, playChannelNames, deadChannelName } = require('../../config.json');
const { clearState } = require('../../state.js');
const { createChannel } = require('../../channel.js');

const initialise = async function(guild) {
	await clearState();

	const channels = await guild.channels.fetch();

	for ([id, channel] of channels) {
		if (generalChannelNames.includes(channel.name)) {
			const newChannel = await channel.clone({
				reason: 'reset gameserver',
			});
			await newChannel.setPosition(channel.position);
			await channel.delete();
		}
		else {
			await channel.delete();
		}
	}

	await createChannel(guild, deadChannelName, false, false);
	for (channelName of playChannelNames) {
		await createChannel(guild, channelName, true, true);
	}
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('initialise')
		.setDescription('Reset the server.'),
	async execute(interaction) {
		try {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			if (!modIds.includes(interaction.user.id)) {
				throw 'access denied';
			}

			const message = await initialise(interaction.guild);

			if (message) {
				await interaction.editReply(message);
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