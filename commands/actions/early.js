const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { state, saveState } = require('../../state.js');
const { endRound } = require('../../game.js');

const choices = [
	{ name: 'Yes', value: 'yes' },
	{ name: 'No', value: 'no' },
];

const early = async function(guild, player, choice) {
	if (!state.started) {
		return ('The game hasn\'t started yet.');
	}
	if (state.ended) {
		return ('The game is over.');
	}

	const playerState = state.players.find(p => p.id === player.id);

	if (!playerState.alive) {
		return ('Dead players don\'t have a say in this.');
	}

	playerState.early = choice === 'yes';
	await saveState();

	if (state.players.filter(p => p.alive).length === state.players.filter(p => p.alive && p.early).length) {
		await endRound(guild);
	}
	else {
		return ('Your preference has been noted.');
	}
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('early')
		.setDescription('End early or not.')
		.addStringOption((option) => option.setName('choice').setDescription('Yes or No.').setRequired(true).setChoices(choices)),
	async execute(interaction) {
		const player = interaction.user;
		const choice = interaction.options.getString('choice', true).toLowerCase();
		try {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			const message = await early(interaction.guild, player, choice);

			if (message) {
				await interaction.editReply({ content: message, flags: MessageFlags.Ephemeral });
			}
			else {
				await interaction.deleteReply();
			}
		}
		catch (error) {
			console.error(error);
			await interaction.editReply({ content: `There was an error:\n\`${error}\``, flags: MessageFlags.Ephemeral });
		}
	},
};