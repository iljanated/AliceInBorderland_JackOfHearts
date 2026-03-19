const fs = require('fs');
const fsp = require('fs/promises');
const { formattedTimestamp } = require('./utils.js');
const path = './state.json';
const parsedState = JSON.parse(fs.readFileSync(path));
const state = { ...parsedState };

const saveState = async function() {
	console.log(process.cwd());
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
};

const validateState = async function() {
	const fields = ['players', 'round', 'started', 'ended', 'busy'];
	console.log(Object.keys(state));
	return fields.every(prop => {
		console.log(prop);
		return Object.hasOwn(state, prop);
	});
};

module.exports = {
	saveState,
	state,
	clearState,
	validateState,
};