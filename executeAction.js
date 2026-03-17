const { MessageFlags } = require('discord.js');
const { modIds } = require('./config.json');


const executeAction = async (interaction, actionFunction, isRestricted) => {
	const channelId = interaction.channel.id;

	let message = undefined;

	try {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		if (restricted && !modIds.includes(interaction.user.id)) {
			throw 'access denied';
		}

		message = await actionfunction(interaction);
	}
	catch (error) {
		console.error(error);
		message = `There was an error:\n\`${error}\``;
	}
	finally {
		const oldChannel = interaction.guild.channels.cache.find(c => c.id === channelId);

		if (oldChannel) {
			if (message) {
				await interaction.editReply(message);
			}
			else {
				await interaction.deleteReply();
			}
		}
	}
};

module.exports = {
	executeAction,
};