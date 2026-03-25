const { suits } = require('./config.json');

const powers = {
	// shoot: {
	//	name: 'shoot',
	//	description: () => {
	//		return ('You have a gun.\nUse the command "/shoot" to kill a player.\nPlayers in the same room will see you ***(if the lights are on)***.\nPlayers in other rooms will hear you.\nYou can use your gun once.\nIf you haven\'t used your gun before the end of the round you die.');
	//	},
	//	target: false,
	//	startRound: 2,
	// },
	// blind: {
	//	name: 'blind',
	//	description: () => {
	//		return ('You are blinded.\nYou can no longer see the suit on another player\'s collar.\nThe effect dissipates at the end of the round.');
	//	},
	//	target: false,
	//	startRound: 1,
	// },
	blur: {
		name: 'blur',
		description: () => {
			return ('Your vision is blurred.\nYou can only see the color of the suit on another player\'s collar.\nThe effect dissipates at the end of the round.');
		},
		target: false,
		startRound: 1,
	},
	// telepath: {
	//	name: 'telepath',
	//	description: () => {
	//		return ('You can read other people\'s thoughts.\nWhen you use the command **/status**, you can see the suits other people have submitted.\nThe effect dissipates at the end of the round.');
	//	},
	//	target: false,
	//	startRound: 1,
	// },
	//	amplify: {
	//		name: 'amplify',
	//		description: () => {
	//			return ('A megaphone protrudes from your collar.\nYou can only use the command **/yell** to communicate.\nCommands are only available in your private channel.\nThe effect dissipates at the end of the round.');
	//		},
	//		target: false,
	//		startRound: 2,
	//	},
	random: {
		name: 'random',
		description: () => {
			return ('Your results are randomised.\nWhen you use the command "/look", 50% chance you get the correct suit, 50% chance you get the suit of a random player\'s collar. \nThe effect dissipates at the end of the round.');
		},
		target: false,
		startRound: 1,
	},
	// reveal: {
	//	name: 'reveal',
	//	description: playerState => {
	//		return (`The suit on your collar for this round is **${suits[playerState.suit].label}**.`);
	//	},
	//	target: false,
	//	startRound: 1,
	// },
	// link: {
	//	name: 'link',
	//	description: playerState => {
	//		const powerState = playerState.powers.find(p => p.name === 'link');
	//		return (`Your fate is linked to <@${powerState.target}>.\nIf he/she doesn't survive this round, you won't either.\nThe effect dissipates at the end of the round.`);
	//	},
	//	target: true,
	//	startRound: 1,
	// },
	mutex: {
		name: 'mutex',
		description: playerState => {
			const powerState = playerState.powers.find(p => p.name === 'mutex');
			return (`Your fate is mutually exclusive linked to <@${powerState.target}>.\nIf he/she survives this round, you won't.\nThe effect dissipates at the end of the round.`);
		},
		target: true,
		startRound: 2,
	},
	earpiece: {
		name: 'earpiece',
		description: playerState => {
			const powerState = playerState.powers.find(p => p.name === 'earpiece');
			return (`You have an invisible earpiece and the microphone in your collar is activated.\nYou initiate a private chat with <@${powerState.target}>.\nThe chat ends at the end of the round.`);
		},
		target: true,
		startRound: 1,
	},
	anonymous: {
		name: 'anonymous',
		description: () => {
			return ('When using the command **/whisper**, instead of whispering, you send an anonymous message to a player\'s private channel.\nThe effect dissipates at the end of the round.');
		},
		target: false,
		startRound: 1,
	},
	tamper: {
		name: 'tamper',
		description: () => {
			return ('When you use the command **/shoot**, the target player\'s suit changes for the rest of the round.\nAny previous \'looks\' at the collar should be considered invalid.\nPlayers in the same room will see you do it ***(if the lights are on)***.\nYou can tamper only one collar.\nIf you haven\'t tampered any collar by the end of the round you die.\nThe effect dissipates at the end of the round.');
		},
		target: false,
		startRound: 3,
	},
	// immobile: {
	//	name: 'immobile',
	//	description: () => {
	//		return ('You are immobilised.\nYou cannot enter any other rooms.\nThe effect dissipates at the end of the round.');
	//	},
	//	target: false,
	//	startRound: 1,
	// },
	//	mute: {
	//		name: 'mute',
	//		description: () => {
	//			return ('You are muted.\nYou can only use the command **/whisper** to communicate.\nCommands are only available in your private channel.\nThe effect dissipates at the end of the round.');
	//		},
	//		target: false,
	//		startRound: 1,
	//	},
	//	glitch: {
	//		name: 'glitch',
	//		description: () => {
	//			return ('Your collar glitches.\nWhen players look at your collar they get their own suit instead of yours.\nHowever if their suit is the same as yours, they get an error message instead.\nThe effect dissipates at the end of the round.');
	//		},
	//		target: false,
	//		startRound: 1,
	//	},
	scramble: {
		name: 'scramble',
		description: () => {
			return ('Your collar is scrambled.\nWhen players look at your collar they get an error.\nWhen you use the command **/shoot**, your collar starts working correctly, but your target\'s collar will be scrambled.\nPeople in the same room see you scramble your target\'s collar ***(if the lights are on)***.\nYou can change your target during the round.\nThe effect dissipates at the end of the round.');
		},
		target: false,
		startRound: 2,
	},
	switch: {
		name: 'switch',
		description: () => {
			return ('When you use the command **/shoot**, you take your target\'s suit and he/she takes yours.\nPlayers in the same room will see you do it ***(if the lights are on)***.\nYou can switch only one collar.\nIf you haven\'t switched any collar by the end of the round you die.\nThe effect dissipates at the end of the round.');
		},
		target: false,
		startRound: 3,
	},
};


module.exports = {
	powers,
};