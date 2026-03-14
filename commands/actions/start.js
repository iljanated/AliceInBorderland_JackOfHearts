const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { modIds } = require('../../config.json');
const { createChannel, addPlayerToChannel, startRound } = require('../../game.js');
const { state, saveState } = require('../../state.js');

const start = async function(guild) {
	const members = await guild.members.fetch();

	const players = [];

	for ([id, member] of members) {
		if (!modIds.includes(member.id)) {
			const channel = await createChannel(guild, `player_${member.user.username}`, true, true);

			addPlayerToChannel(member.user, channel, true);

			players.push({
				id: member.id,
				name: member.user.username,
				alive: true,
				powers: [],
				suit: undefined,
				suitChoice: undefined,
				early: false,
			});
		}
	}

	state.round = 0;
	state.players = players;
	saveState();

	await startRound(guild);

	return 'Game started.';
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Start the game.'),
	async execute(interaction) {
		try {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			if (!modIds.includes(interaction.user.id)) {
				throw 'access denied';
			}

			const message = await start(interaction.guild);

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