const powers = {
	shoot: {
		name: 'shoot',
		description: () => {
			return ('You have a gun.\nUse the command "/shoot" to kill a player.\nPlayers in the same room will see you.\nPlayers in other rooms will hear you.\nYou can use it once.\nIf you haven\'t used your gun before the end of the round you die.');
		},
		target: false,
	},
	blind: {
		name: 'blind',
		description: () => {
			return ('You are blinded.\nYou can no longer see the suit on another player\'s collar.\nThe effect dissipates at the end of the round.');
		},
		target: false,
	},
	blur: {
		name: 'blur',
		description: () => {
			return ('Your vision is blurred.\nYou can only see the color of the suit on another player\'s collar.\nThe effect dissipates at the end of the round.');
		},
		target: false,
	},
	amplify: {
		name: 'amplify',
		description: () => {
			return ('A megaphone protrudes from your collar.\nYou can only use the command "/yell" to communicate.\nCommands are only available in your private channel.\nThe effect dissipates at the end of the round.');
		},
		target: false,
	},
	random: {
		name: 'random',
		description: () => {
			return ('Your results are randomised.\nWhen you use the command "/look", you get the suit of a random player\'s collar. \nThe effect dissipates at the end of the round.');
		},
		target: false,
	},
	reveal: {
		name: 'reveal',
		description: playerState => {
			return (`The suit on your collar for this round is ${playerState.suit}.`);
		},
		target: false,
	},
	link: {
		name: 'link',
		description: playerState => {
			const powerState = playerState.powers.find(p => p.name === 'link');
			return (`Your fate is linked to <@${powerState.target}>.\nIf he/she doesn't survive this round, you won't either.\nThe effect dissipates at the end of the round.`);
		},
		target: true,
	},
	mutex: {
		name: 'mutex',
		description: playerState => {
			const powerState = playerState.powers.find(p => p.name === 'mutex');
			return (`Your fate is mutually exclusive linked to <@${powerState.target}>.\nIf he/she survives this round, you won't.\nThe effect dissipates at the end of the round.`);
		},
		target: true,
	},
	earpiece: {
		name: 'earpiece',
		description: playerState => {
			const powerState = playerState.powers.find(p => p.name === 'earpiece');
			return (`The microphone in your collar is activated.\nYou initiate a private chat with <@${powerState.target}>.\nThe chat ends at the end of the round.`);
		},
		target: true,
	},
	anonymous: {
		name: 'anonymous',
		description: () => {
			return ('When using the command "/whisper", instead of whispering, you send an anonymous message to a player\'s private channel.\nThe effect dissipates at the end of the round.');
		},
		target: false,
	},
	immobile: {
		name: 'immobile',
		description: () => {
			return ('You are immobilised.\nYou cannot enter any other rooms.\nThe effect dissipates at the end of the round.');
		},
		target: false,
	},
	mute: {
		name: 'mute',
		description: () => {
			return ('You are muted.\nYou can only use the command "/whisper" to communicate.\nCommands are only available in your private channel.\nThe effect dissipates at the end of the round.');
		},
		target: false,
	},
};


module.exports = {
	powers,
};