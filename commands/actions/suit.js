const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { state, saveState } = require('../../state.js');
const { suits } = require('../../config.json');
const { capitalizeOnlyFirst } = require('../../utils.js');

const choices = Object.values(suits).map(s => { return ({ name: capitalizeOnlyFirst(s.name), value: s.name }); });

const suit = async function(guild, player, choice) {
	const playerState = state.players.find(p => p.id === player.id);

	if (!playerState.alive) {
		return ('Dead players don\'t have to do this.');
	}

	playerState.suitChoice = choice;
	await saveState();

	return ('Your choice has been noted.');
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('suit')
		.setDescription('Commit your suit.')
		.addStringOption((option) => option.setName('suit').setDescription('The suit on your collar.').setRequired(true).setChoices(choices)),
	async execute(interaction) {
		const player = interaction.user;
		const choice = interaction.options.getString('suit', true).toLowerCase();
		try {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			const message = await suit(interaction.guild, player, choice);

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