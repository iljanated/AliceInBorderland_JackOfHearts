const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { state } = require('../../state.js');
const { modIds, playChannels } = require('../../config.json');

const look = async function(guild, player, target) {
	if (modIds.includes(target.id)) {
		return ('The GM is not a participant in the game.');
	}

	const targetPlayerState = state.players.find(p => p.id === target.id);

	if (!targetPlayerState.alive) {
		return (`<@${target.id}> is dead.`);
	}

	if (!playerState.alive) {
		return (`<@${target.id}>'s suit is "${targetPlayerState.suit}".`);
	}

	const shareChannel = guild.channels.cache.find(c => playChannels.includes(c.name) && c.members.find(m => m.user.id === player.id) && c.members.find(m => m.user.id === target.id));

	if (!shareChannel) {
		return ('You can\'t see through walls.');
	}

	return (`<@${target.id}>'s suit is "${targetPlayerState.suit}".`);
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('look')
		.setDescription('Look at the suit on someone else\'s collar.')
		.addUserOption((option) => option.setName('target').setDescription('The player to check.').setRequired(true)),
	async execute(interaction) {
		const player = interaction.user;
		const target = interaction.options.getUser('target', true);
		try {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			const message = await look(interaction.guild, player, target);

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