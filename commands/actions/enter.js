const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { config } = require('../config.json');
const { state } = require('../../state.js');
const { removePlayerFromChannel, addPlayerToChannel } = require('../../game');

const choices = [
	{ name: 'Corridor', value: 'corridor' },
	{ name: 'Red', value: 'red' },
	{ name: 'Green', value: 'green' },
	{ name: 'Blue', value: 'blue' },
];

const enter = async function(guild, player, choice) {
	const playerState = state.players.find(p => p.id === player.id);

	if (!playerState.alive) {
		return ('Dead players can\'t enter rooms.');
	}

	const powerIndex = playerState.powers.findIndex(p => p.name === 'immobile');

	if(powerIndex >= 0) {
		return ('You are immobilized and can\'t leave the room.');
	}

	if (config.modIds.includes(player.id)) {
		return ('GM\'s don\'t leave rooms.');
	}

	const playerChannel = guild.channels.cache.find(c => config.playChannels.includes(c.name) && c.members.find(m => m.user.id === player.id));

	if (!playerChannel) {
		return ('You are not in a valid room.');
	}

	if (playerChannel.name === choice) {
		return ('You are alredy in that room.');
	}

	if (playerChannel.name !== 'corridor' && choice !== 'corridor') {
		return ('There are no doors between these rooms.');
	}

	const targetChannel = guild.channels.cache.find(c => c.name === choice);

	await playerChannel.send(`***<@${player.id}> leaves the room through door "${choice}".***`);

	await removePlayerFromChannel(player, playerChannel);
	await addPlayerToChannel(player, targetChannel);

	await targetChannel.send(`***<@${player.id}> enters the room.***`);

	return (`You entered room "${choice}"`);
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('enter')
		.setDescription('Go to another room.')
		.addStringOption((option) => option.setName('door').setDescription('The label on the door.').setRequired(true).setChoices(choices)),
	async execute(interaction) {
		const player = interaction.user;
		const door = interaction.options.getString('door', true).toLowerCase();
		try {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			const message = await enter(interaction.guild, player, door);

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