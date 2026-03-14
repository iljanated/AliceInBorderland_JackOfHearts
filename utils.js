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

module.exports = {
	shuffle,
	pick,
	scramble,
};