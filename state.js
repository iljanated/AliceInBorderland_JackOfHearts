const fs = require('fs');
const fsp = require('fs/promises');
const path = './state.json';

const state = JSON.parse(fs.readFileSync(path));

const saveState = async function() {
	await fsp.writeFile(path, JSON.stringify(state));
};

const clearState = async function() {
	for (const variableKey in state) {
		if (Object.prototype.hasOwnProperty.call(state, variableKey)) {
			delete state[variableKey];
		}
		state.players = [];
		state.round = 0;
		state.started = false;
		state.ended = false;
	}
	await saveState();
};


module.exports = {
	saveState,
	state,
	clearState,
};