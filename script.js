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
	loadingMessage: document.getElementById("loading-message"),
};

elements.startButton.disabled = true;

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
		if (state.flags.length > 0) {
			elements.loadingMessage.style.display = "none";
			elements.startButton.disabled = false;
		}
	} catch (error) {
		console.error("Failed to fetch flags:", error);
		elements.loadingMessage.textContent =
			"Failed to load flags. Please refresh.";
	}
}

function startGame() {
	if (state.flags.length === 0) {
		alert("Flags are still loading. Please wait.");
		return;
	}
	elements.startButton.style.display = "none";
	elements.stats.style.display = "block";
	elements.game.style.display = "block";
	elements.flag.style.display = "block";
	fadeIn(elements.flag);
	nextFlag();
	updateUI();
	startTimer();
}

function nextFlag() {
	if (state.flags.length === 0) {
		endGame();
		return;
	}
	const index = Math.floor(Math.random() * state.flags.length);
	const flag = state.flags.splice(index, 1)[0];
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

function getRandomFlags(n) {
	const copy = [...state.flags];
	const selected = [];
	while (selected.length < n && copy.length) {
		const i = Math.floor(Math.random() * copy.length);
		selected.push(copy.splice(i, 1)[0]);
	}
	return selected;
}

function handleGuess(guess) {
	const buttons = Array.from(elements.options.children);
	const correctBtn = buttons.find(
		(btn) => btn.textContent === state.currentFlag.country
	);

	if (guess.country === state.currentFlag.country) {
		correctBtn.classList.add("correct");
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
		correctBtn.classList.add("correct");
		const wrongBtn = buttons.find(
			(btn) => btn.textContent === guess.country
		);
		wrongBtn.classList.add("wrong", "shake");
		setTimeout(() => {
			wrongBtn.classList.remove("shake");
			endGame();
		}, 1000);
	}
	buttons.forEach((btn) => (btn.disabled = true));
	updateUI();
}

function endGame() {
	clearInterval(state.timer);
	elements.game.style.display = "none";
	elements.stats.style.display = "none";
	elements.flag.style.display = "none";
	elements.endScreen.style.display = "block";
	elements.finalScore.textContent = state.currentStreak;

	const missedImg = document.createElement("img");
	missedImg.src = state.currentFlag.flagUrl;
	missedImg.alt = state.currentFlag.country;
	const missedLabel = document.createElement("p");
	missedLabel.textContent = state.currentFlag.country;
	elements.missedFlag.appendChild(missedImg);
	elements.missedFlag.appendChild(missedLabel);

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

	elements.mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
		state.currentFlag.country
	)}`;
	elements.mapsLink.textContent = `See ${state.currentFlag.country} on Google Maps`;
	elements.mapsLink.style.display = "block";

	fadeIn(elements.endScreen);
	elements.restartEndButton.style.display = "block";
}

function updateUI() {
	elements.currentStreak.textContent = state.currentStreak;
	elements.bestStreak.textContent = state.bestStreak;
	elements.timer.textContent = state.timeLeft;
}

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

function fadeIn(el) {
	el.style.opacity = "0";
	el.style.display = "block";
	let op = 0;
	const fade = () => {
		op += 0.05;
		el.style.opacity = op;
		if (op < 1) setTimeout(fade, 10);
	};
	fade();
}

function fadeOut(el, cb) {
	el.style.opacity = "1";
	let op = 1;
	const fade = () => {
		op -= 0.05;
		el.style.opacity = op;
		if (op <= 0) {
			el.style.display = "none";
			if (cb) cb();
			return;
		}
		setTimeout(fade, 10);
	};
	fade();
}

elements.startButton.addEventListener("click", startGame);
elements.restartButton.addEventListener("click", () => location.reload());
elements.restartEndButton.addEventListener("click", () => location.reload());

fetchFlags();
