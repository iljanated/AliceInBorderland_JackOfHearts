const { ChannelType, PermissionsBitField } = require('discord.js');
const { modIds } = require('./config.json');

const createPublicChannel = async function(guild, name) {
	const channel = await guild.channels.create({
		name: name,
		type: ChannelType.GuildText,
	});
	return channel;
};

const createChannel = async function(guild, name, allowCommands, addDead) {

	const globalDeny = [PermissionsBitField.Flags.ViewChannel];

	if (!allowCommands) {
		globalDeny.push(PermissionsBitField.Flags.UseApplicationCommands);
	}

	const permissionOverwrites = [
		{
			id: guild.id,
			deny: globalDeny,
		},
	];

	for (modId of modIds) {
		permissionOverwrites.push(
			{
				id: modId,
				allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
			});
	}

	if (addDead) {
		const role = guild.roles.cache.find(r => r.name === 'dead');

		permissionOverwrites.push(
			{
				id: role.id,
				allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
				deny: [PermissionsBitField.Flags.SendMessages],
			},
		);
	}

	const channel = await guild.channels.create({
		name: name,
		type: ChannelType.GuildText,
		permissionOverwrites: permissionOverwrites,
	});

	return channel;
};

const addPlayerToChannel = async function(player, channel, history = true, send = true) {
	await channel.permissionOverwrites.create(player.id, {
		ViewChannel: true,
		SendMessages: send,
		ReadMessageHistory: history,
	});
};

const removePlayerFromChannel = async function(player, channel) {
	await channel.permissionOverwrites.delete(player.id);
	// await channel.permissionOverwrites.create(player.id, {
	//	ViewChannel: false,
	//	SendMessages: false,
	// });
};

const safeChannelName = function(name) {
	return name.replaceAll('.', '');
}

module.exports = {
	createPublicChannel,
	createChannel,
	addPlayerToChannel,
	removePlayerFromChannel,
	safeChannelName,
};
