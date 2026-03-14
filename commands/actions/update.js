const { SlashCommandBuilder } = require('discord.js');
const { modIds } = require('../../config.json');

const update = async function(guild, player, choice) {
	return 'success';
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('update')
		.setDescription('Give the game a little nudge.'),
	async execute(interaction) {
		try {
			await interaction.deferReply();

			if (!modIds.includes(interaction.user.id)) {
				throw 'access denied';
			}

			const message = await update(interaction.guild);

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