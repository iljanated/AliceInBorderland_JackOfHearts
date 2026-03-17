const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { modIds, playerChannelPrefix, startImages, centralChannelName } = require('../../config.json');
const { startRound } = require('../../game.js');
const { state, saveState } = require('../../state.js');
const { addPlayerToChannel, createChannel } = require('../../channel.js');
const { executeAction } = require('../../executeAction.js');

const start = async function(interaction) {
	const guild = interaction.guild;

	const members = await guild.members.fetch();

	const players = [];

	for ([id, member] of members) {
		if (!modIds.includes(member.id)) {
			const channel = await createChannel(guild, `${playerChannelPrefix}${member.user.username}`, true, true);

			await addPlayerToChannel(member.user, channel, true);

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
	state.started = true;
	saveState();

	const centralChannel = guild.channels.cache.find(c => c.name === centralChannelName);

	for (image of startImages) {
		startAttachment = new AttachmentBuilder(`./assets/${image}`);

		const hallwaySent = await centralChannel.send({
			files: [startAttachment],
		});
		await hallwaySent.pin();
	}

	await startRound(guild);

	return 'Game started.';
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Start the game.'),
	async execute(interaction) {
		await executeAction(interaction, start, true, false, false);
	},
};