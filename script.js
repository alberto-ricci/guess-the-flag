// State object to store the game state
const state = {
	flags: [],
	usedFlags: [],
	correctFlags: [],
	currentFlag: null,
	currentStreak: 0,
	bestStreak: JSON.parse(localStorage.getItem("bestStreak")) || 0,
	timeLeft: 16,
	timer: null,
};

// Object to store the UI elements
const elements = {
	stats: document.getElementById("stats"),
	game: document.getElementById("game"),
	flag: document.getElementById("flag"),
	options: document.getElementById("options"),
	startButton: document.getElementById("start"),
	restartButton: document.getElementById("restart"),
	restartEndButton: document.getElementById("restart-end"),
	currentStreak: document.getElementById("current-streak"),
	bestStreak: document.getElementById("best-streak"),
	timer: document.getElementById("timer"),
	endScreen: document.getElementById("end-screen"),
	finalScore: document.getElementById("final-score"),
	correctAnswers: document.getElementById("correct-answers"),
	missedFlag: document.getElementById("missed-flag"),
	wikiLink: document.getElementById("wiki-link"),
	mapsLink: document.getElementById("maps-link"),
};

// Fetch flags from the API
async function fetchFlags() {
	try {
		const response = await fetch("https://restcountries.com/v3.1/all");
		const data = await response.json();
		state.flags = data
			.filter((country) => country.flags?.png && country.name?.common)
			.map((country) => ({
				country: country.name.common,
				flagUrl: country.flags.png,
			}));
	} catch (error) {
		console.error("Failed to fetch flags:", error);
	}
}

// Start the game
function startGame() {
	elements.startButton.style.display = "none";
	elements.stats.style.display = "block";
	elements.game.style.display = "block";
	elements.flag.style.display = "block";
	fadeIn(elements.flag);
	nextFlag();
	updateUI();
	startTimer();
}

// Reset the game state and update UI
function resetState() {
	state.flags = [...state.usedFlags, ...state.correctFlags, ...state.flags];
	state.usedFlags = [];
	state.correctFlags = [];
	state.currentFlag = null;
	state.currentStreak = 0;
	state.timeLeft = 15;
	if (state.timer) clearInterval(state.timer);

	elements.endScreen.style.display = "none";
	elements.restartButton.style.display = "none";
	elements.startButton.style.display = "block";
	elements.options.innerHTML = "";
	elements.correctAnswers.innerHTML = "";
	elements.flag.style.display = "none";
	elements.stats.style.display = "none";
	elements.game.style.display = "none";
	elements.wikiLink.style.display = "none";
	elements.mapsLink.style.display = "none";
	updateUI();
}

// Update the UI based on the game state
function updateUI() {
	elements.currentStreak.textContent = state.currentStreak;
	elements.bestStreak.textContent = state.bestStreak;
	elements.timer.textContent = state.timeLeft;
}

// Start the countdown timer
function startTimer() {
	if (state.timer) clearInterval(state.timer);
	state.timer = setInterval(() => {
		state.timeLeft--;
		updateUI();
		if (state.timeLeft <= 0) {
			clearInterval(state.timer);
			endGame();
		}
	}, 1000);
}

// Build Google Maps URL
function getGoogleMapsLink(country) {
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
		country
	)}`;
}

// End the game and show the result screen
function endGame() {
	clearInterval(state.timer);
	elements.game.style.display = "none";
	elements.stats.style.display = "none";
	elements.flag.style.display = "none";
	elements.endScreen.style.display = "block";
	elements.finalScore.textContent = state.currentStreak;

	// Missed flag
	const missedImg = document.createElement("img");
	missedImg.src = state.currentFlag.flagUrl;
	missedImg.alt = state.currentFlag.country;
	const missedLabel = document.createElement("p");
	missedLabel.textContent = state.currentFlag.country;
	elements.missedFlag.appendChild(missedImg);
	elements.missedFlag.appendChild(missedLabel);

	// Correct flags list
	state.correctFlags.forEach((flag) => {
		const div = document.createElement("div");
		const img = document.createElement("img");
		img.src = flag.flagUrl;
		img.alt = flag.country;
		const p = document.createElement("p");
		p.textContent = flag.country;
		div.appendChild(img);
		div.appendChild(p);
		elements.correctAnswers.appendChild(div);
	});

	elements.wikiLink.href = `https://en.wikipedia.org/wiki/${state.currentFlag.country.replaceAll(
		" ",
		"_"
	)}`;
	elements.wikiLink.textContent = `Learn more about ${state.currentFlag.country}`;
	elements.wikiLink.style.display = "block";

	elements.mapsLink.href = getGoogleMapsLink(state.currentFlag.country);
	elements.mapsLink.textContent = `See ${state.currentFlag.country} on Google Maps`;
	elements.mapsLink.style.display = "block";

	fadeIn(elements.endScreen);
	elements.restartEndButton.style.display = "block";
}

// Get the next flag and update UI
function nextFlag() {
	if (state.flags.length === 0) {
		endGame();
		return;
	}

	const flagIndex = Math.floor(Math.random() * state.flags.length);
	const flag = state.flags.splice(flagIndex, 1)[0];
	state.usedFlags.push(flag);
	state.currentFlag = flag;

	fadeOut(elements.flag, () => {
		elements.flag.src = flag.flagUrl;
		fadeIn(elements.flag);
	});

	clearInterval(state.timer);
	state.timeLeft = 16;
	startTimer();

	displayOptions();
}

// Display options to choose from
function displayOptions() {
	elements.options.innerHTML = "";
	const options = [state.currentFlag, ...getRandomFlags(3)];
	shuffleArray(options);

	options.forEach((option) => {
		const button = document.createElement("button");
		button.textContent = option.country;
		button.addEventListener("click", () => handleGuess(option));
		elements.options.appendChild(button);
	});
}

// Get n random flags
function getRandomFlags(n) {
	const copy = [...state.flags];
	const selected = [];

	while (selected.length < n && copy.length) {
		const index = Math.floor(Math.random() * copy.length);
		selected.push(copy.splice(index, 1)[0]);
	}

	return selected;
}

// Handle user guess
function handleGuess(guess) {
	const buttons = Array.from(elements.options.children);
	const correctButton = buttons.find(
		(btn) => btn.textContent === state.currentFlag.country
	);

	if (guess.country === state.currentFlag.country) {
		correctButton.classList.add("correct");
		state.currentStreak++;
		if (state.currentStreak > state.bestStreak) {
			state.bestStreak = state.currentStreak;
			localStorage.setItem(
				"bestStreak",
				JSON.stringify(state.bestStreak)
			);
		}
		state.correctFlags.push(state.currentFlag);
		setTimeout(() => fadeOut(elements.flag, nextFlag), 1000);
	} else {
		correctButton.classList.add("correct");
		const wrongButton = buttons.find(
			(btn) => btn.textContent === guess.country
		);
		wrongButton.classList.add("wrong", "shake");
		setTimeout(() => {
			wrongButton.classList.remove("shake");
			endGame();
		}, 1000);
	}

	buttons.forEach((btn) => (btn.disabled = true));
	updateUI();
}

// Shuffle array in-place
function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

// Fade in an element
function fadeIn(element) {
	element.style.opacity = "0";
	element.style.display = "block";
	let opacity = 0;
	const duration = 300;
	const interval = 10;
	const increment = interval / duration;

	const fade = () => {
		opacity += increment;
		element.style.opacity = opacity;
		if (opacity >= 1) return;
		setTimeout(fade, interval);
	};

	fade();
}

// Fade out an element
function fadeOut(element, callback) {
	element.style.opacity = "1";
	let opacity = 1;
	const duration = 300;
	const interval = 10;
	const decrement = interval / duration;

	const fade = () => {
		opacity -= decrement;
		element.style.opacity = opacity;
		if (opacity <= 0) {
			element.style.display = "none";
			if (typeof callback === "function") callback();
			return;
		}
		setTimeout(fade, interval);
	};

	fade();
}

// Event listeners
elements.startButton.addEventListener("click", startGame);
elements.restartButton.addEventListener("click", () => location.reload());
elements.restartEndButton.addEventListener("click", () => location.reload());

// Initial fetch
fetchFlags();
