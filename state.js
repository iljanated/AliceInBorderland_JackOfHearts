const fs = require('fs');
const fsp = require('fs/promises');
const { formattedTimestamp } = require('./utils.js');
const path = './state.json';
const state = JSON.parse(fs.readFileSync(path));

const saveState = async function() {
	await fsp.writeFile(path, JSON.stringify(state, null, 2));

	const backupPath = `./backups/state_${formattedTimestamp()}.json`;
	await fsp.writeFile(backupPath, JSON.stringify(state, null, 2));
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
		state.busy = false;
	}
	await saveState();
	console.log(JSON.stringify(state));
};


module.exports = {
	saveState,
	state,
	clearState,
};