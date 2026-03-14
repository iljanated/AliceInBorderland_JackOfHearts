const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const { modIds, generalChannelNames, playChannelNames, deadChannelName } = require('../../config.json');
const { clearState } = require('../../state.js');
const { createChannel, createPublicChannel } = require('../../channel.js');

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

	const rulesChannel = await createPublicChannel(guild, 'rules');

	const rulesEmbed = new EmbedBuilder()
		.setColor(0x0099ff)
		.setTitle('Rulebook')
		.setTimestamp()
		.setFooter({ text: 'Good luck!' });

	rulesEmbed.addFields(
		{
			name: 'Commands',
			value: `You can execute actions using slash-commands.

			The available player-commands are:
			- /enter
			- /look
			- /shoot
			- /suit
			- /whisper
			- /yell
			Find out what they do and use them at the right time and/or place!

			There are 2 helper commands available:
			- /early: indicate if you want to end the round early (yes/no)
			- status: get an overview of the game status and your personal status
			
			Commands will only work once the game has started.`,
		},
		{
			name: 'Channels',
			value: `The game takes place in multiple channels.
			The channels available to you might change based on your actions or the state of the game.
			You might discover you suddenly no longer have access to the channel you were in.
			If something doesn't seem right:
			- check the channels available to you
			- check for any messages in your private channel
			- use /status to get an overview of the game state`,
		},
		{
			name: 'Betrayal',
			value: `This is a game about betrayal.
			***Every player apart from the possible winner will die by betrayal.***
			What happens in the game, stays in the game.
			If at any point someone feels a boundery has been crossed, the game ends immediatly.
			Respect each other and enjoy the game.`,
		},
		{
			name: 'Beta software',
			value: `This is beta software.
			I'm still figuring out how discord bot programming works and have no idea what will happen when multiple concurrent players join the server.
			If the bot goes down for a large amount of time - causing an unfair disadvantage for players from different timezones - the deadline for that round will be moved.
			
			***Please don't try to game the system.***
			If you spot a bug, contact me immediatly, so the game isn't ruined for everyone.`,
		},
	);

	const sent = await rulesChannel.send({ embeds: [rulesEmbed] });
	sent.pin();

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