const fsp = require('fs/promises');
const state = require('./state.json');

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
	}
	await saveState();
};


module.exports = {
	saveState,
	state,
	clearState,
};