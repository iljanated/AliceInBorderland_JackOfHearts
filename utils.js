function shuffle(array) {
	let currentIndex = array.length;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {

		// Pick a remaining element...
		const randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
}

function pick(array) {
	return array[Math.floor(Math.random() * array.length)];
}

function scramble(text, chance = 0.7, character = '.') {
	return text
		.split('')
		.map(char => {
			if (char === ' ') return ' ';
			return Math.random() < chance ? character : char;
		})
		.join('');
}

function capitalizeOnlyFirst(text) {
	if (!text) { return (''); }
	return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function formattedTimestamp() {
	const now = new Date();

	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	const hour = String(now.getHours()).padStart(2, '0');
	const minute = String(now.getMinutes()).padStart(2, '0');
	const second = String(now.getSeconds()).padStart(2, '0');
	const ms = String(now.getMilliseconds()).padStart(3, '0');

	return `${year}_${month}_${day}_${hour}_${minute}_${second}_${ms}`;
}

module.exports = {
	shuffle,
	pick,
	scramble,
	capitalizeOnlyFirst,
	formattedTimestamp
};