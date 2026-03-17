const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { generalChannelNames, playChannelNames, deadChannelName, introImages, generalChannelName, earpieceChannelName } = require('../../config.json');
const { clearState } = require('../../state.js');
const { createChannel, createPublicChannel } = require('../../channel.js');
const { executeAction } = require('../../executeAction.js');

const initialise = async function(interaction) {
	const guild = interaction.guild;
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
		.setFooter({ text: 'Enjoy the game and good luck!' });

	rulesEmbed.addFields(
		{
			name: 'The game',
			value:
`- First of all, this is NOT a mafia game
- Players are not grouped in any way before the game starts
- Contrary to the source material everyone has the same wincon 
- There is no night phase
- There can be at most one winner
- Rounds end each night 8PM GWT
- Each player has a private channel invisible to all other players
- Dead players can view all channels but should not interact in any way!

The basic premise will be revealed once the first round starts.
The rest you have to figure out along the way.`,
		},
		{
			name: 'Commands',
			value:
`You can execute actions using slash-commands.

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
- /status: get an overview of the game status and your personal status

All other commands are off limits and considered cheating!

Commands will only work once the game has started.`,
		},
		{
			name: 'Channels',
			value:
`The game takes place in multiple channels.
- The channels available to you might change based on your actions or the state of the game
- You might discover you suddenly no longer have access to the channel you were in just before

If something doesn't seem right:
- check the channels available to you
- check for any messages in your private channel
- use '/status' to get an overview of the game state
- if all other channels are blocked, you can still use your private channel to launch commands`,
		},
		{
			name: 'Betrayal',
			value:
`This is a game about betrayal.
Every player apart from the possible winner will die by betrayal.
What happens in the game, stays in the game.

***If at any point someone feels a boundery has been crossed, the game ends immediatly.***

Respect each other and enjoy the game.`,
		},
		{
			name: 'Beta software',
			value:
`This is beta software.
I'm still figuring out how discord bot programming works and have no idea what will happen when multiple concurrent players join the server.
If the bot goes down for a large amount of time - causing an unfair disadvantage for players from different timezones - the deadline for that round will be moved.

***Please don't try to game the system.***
If you spot a bug, or seem to have access to an action or information you shouldn't have access to, contact me immediatly, so the game isn't ruined for everyone.

Setting this up was a lot of work so:
***TRY NOT ALL TO DIE ON DAY ONE !!!***`,
		},
	);

	const rulesSent = await rulesChannel.send({ embeds: [rulesEmbed] });
	await rulesSent.pin();

	await createChannel(guild, deadChannelName, false, false);

	await createChannel(guild, earpieceChannelName, true, true);

	for (channelName of playChannelNames) {
		await createChannel(guild, channelName, true, true);
	}

	const generalChannel = guild.channels.cache.find(c => c.name === generalChannelName);

	for (image of introImages) {
		introAttachment = new AttachmentBuilder(`./assets/${image}`);

		const hallwaySent = await generalChannel.send({
			files: [introAttachment],
		});
		await hallwaySent.pin();
	}
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('initialise')
		.setDescription('Reset the server.'),
	async execute(interaction) {
		await executeAction(interaction, initialise, true);
	},
};