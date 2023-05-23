// state object to store the game state
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

// object to store the UI elements
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

// fetch flags from the API
async function fetchFlags() {
  try {
    const response = await fetch("https://restcountries.com/v2/all");
    const data = await response.json();
    state.flags = data.map((country) => {
      if (!country.flags || !country.flags.png)
        throw new Error("Invalid country data");
      return {
        country: country.name,
        flagUrl: country.flags.png,
      };
    });
  } catch (error) {
    console.error("Failed to fetch flags:", error);
  }
}

// start the game
function startGame() {
  elements.startButton.style.display = "none";
  elements.stats.style.display = "block";
  elements.game.style.display = "block";
  elements.flag.style.display = "block";
  fadeIn(elements.flag); // Fade in the flag
  nextFlag();
  updateUI();
  startTimer();
}

// reset the game state and update UI
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
  elements.wikiIframe.src = "";
  updateUI();
}

// update the UI based on the game state
function updateUI() {
  elements.currentStreak.textContent = state.currentStreak;
  elements.bestStreak.textContent = state.bestStreak;
  elements.timer.textContent = state.timeLeft;
}

// start the timer
function startTimer() {
  if (state.timer) clearInterval(state.timer); // Ensure no other timer is running

  state.timer = setInterval(() => {
    state.timeLeft--;
    updateUI();
    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      endGame();
    }
  }, 1000);
}

function getGoogleMapsLink(country) {
  var encodedCountry = encodeURIComponent(country);
  return `https://www.google.com/maps/search/?api=1&query=${encodedCountry}`;
}

// end the game
function endGame() {
  clearInterval(state.timer);
  elements.game.style.display = "none"; // hide the game container
  elements.stats.style.display = "none"; // hide the stats
  elements.flag.style.display = "none"; // hide the flag
  elements.endScreen.style.display = "block";
  elements.finalScore.textContent = state.currentStreak;

  // create and append missed flag
  let img = document.createElement("img");
  img.src = state.currentFlag.flagUrl;
  img.alt = state.currentFlag.country;
  elements.missedFlag.appendChild(img);

  let p = document.createElement("p");
  p.textContent = state.currentFlag.country;
  elements.missedFlag.appendChild(p);

  state.correctFlags.forEach((flag) => {
    let div = document.createElement("div");
    let img = document.createElement("img");
    img.src = flag.flagUrl;
    img.alt = flag.country;
    let p = document.createElement("p");
    p.textContent = flag.country;
    div.appendChild(img);
    div.appendChild(p);
    elements.correctAnswers.appendChild(div);
  });

  // Set the link for the wiki page and make it visible
  elements.wikiLink.href = `https://en.wikipedia.org/wiki/${state.currentFlag.country.replace(
    " ",
    "_"
  )}`;
  elements.wikiLink.textContent = `Learn more about ${state.currentFlag.country}`;
  elements.wikiLink.style.display = "block";

  // Set the link for the Google Maps page and make it visible
  elements.mapsLink.href = getGoogleMapsLink(state.currentFlag.country);
  elements.mapsLink.textContent = `See ${state.currentFlag.country} on Google Maps`;
  elements.mapsLink.style.display = "block";

  fadeIn(elements.endScreen); // Fade in the end screen
  elements.restartEndButton.style.display = "block";
}

// get the next flag and display options
function nextFlag() {
  // if there are no more flags, end the game
  if (state.flags.length === 0) {
    endGame();
    return;
  }

  // select a random flag
  const flagIndex = Math.floor(Math.random() * state.flags.length);
  const flag = state.flags[flagIndex];
  state.currentFlag = flag;

  fadeOut(elements.flag, () => {
    // Fade out the current flag
    elements.flag.src = flag.flagUrl; // Display the new flag image
    fadeIn(elements.flag); // Fade in the new flag
  });

  // remove the selected flag from the array
  state.flags.splice(flagIndex, 1);
  state.usedFlags.push(flag);

  // reset the timer and start a new one
  clearInterval(state.timer);
  state.timeLeft = 16;
  startTimer();

  // display options
  displayOptions();
}

// display the options for the current flag
function displayOptions() {
  elements.options.innerHTML = "";

  // create an array of options
  const options = [state.currentFlag, ...getRandomFlags(3)];

  // shuffle the options
  shuffleArray(options);

  // create a button for each option
  options.forEach((option) => {
    const button = document.createElement("button");
    button.textContent = option.country;
    button.addEventListener("click", () => handleGuess(option));
    elements.options.appendChild(button);
  });
}

// get n random flags from the remaining flags
function getRandomFlags(n) {
  const flags = [...state.flags];
  const randomFlags = [];

  for (let i = 0; i < n; i++) {
    if (flags.length === 0) break;
    const flagIndex = Math.floor(Math.random() * flags.length);
    const flag = flags[flagIndex];
    flags.splice(flagIndex, 1);
    randomFlags.push(flag);
  }

  return randomFlags;
}

// handle the user's guess
function handleGuess(guess) {
  // get all the buttons
  const buttons = Array.from(elements.options.children);
  // find the button with the correct answer
  const correctButton = buttons.find(
    (button) => button.textContent === state.currentFlag.country
  );

  if (guess === state.currentFlag) {
    // correct guess
    correctButton.classList.add("correct");
    state.currentStreak++;
    if (state.currentStreak > state.bestStreak) {
      state.bestStreak = state.currentStreak;
      localStorage.setItem("bestStreak", JSON.stringify(state.bestStreak));
    }
    state.correctFlags.push(state.currentFlag);
    setTimeout(() => {
      fadeOut(elements.flag, () => {
        // Fade out the current flag
        nextFlag(); // Move to the next flag
      });
    }, 1000); // wait for 1 second before displaying the next flag
  } else {
    // wrong guess
    correctButton.classList.add("correct");
    const wrongButton = buttons.find(
      (button) => button.textContent === guess.country
    );
    wrongButton.classList.add("wrong");
    wrongButton.classList.add("shake"); // Add shake animation
    setTimeout(() => {
      wrongButton.classList.remove("shake"); // Remove shake animation after it plays
      endGame();
    }, 1000); // wait for 1 second before ending the game
  }
  // disable all buttons to prevent further clicks
  buttons.forEach((button) => (button.disabled = true));
  updateUI();
}

// shuffle an array in place
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// fade in an element
function fadeIn(element) {
  element.style.opacity = "0";
  element.style.display = "block";
  let opacity = 0;
  const duration = 300; // 300 milliseconds
  const interval = 10; // 10 milliseconds
  const increment = interval / duration;

  const fade = () => {
    opacity += increment;
    element.style.opacity = opacity;
    if (opacity >= 1) {
      element.style.opacity = 1;
      element.style.display = "block";
      return;
    }
    setTimeout(fade, interval);
  };

  fade();
}

// fade out an element
function fadeOut(element, callback) {
  element.style.opacity = "1";
  let opacity = 1;
  const duration = 300; // 300 milliseconds
  const interval = 10; // 10 milliseconds
  const decrement = interval / duration;

  const fade = () => {
    opacity -= decrement;
    element.style.opacity = opacity;
    if (opacity <= 0) {
      element.style.opacity = 0;
      element.style.display = "none";
      if (callback && typeof callback === "function") {
        callback();
      }
      return;
    }
    setTimeout(fade, interval);
  };

  fade();
}

// event listeners
elements.startButton.addEventListener("click", startGame);

elements.restartButton.addEventListener("click", function () {
  location.reload();
});
elements.restartEndButton.addEventListener("click", function () {
  location.reload();
});

// initial fetch of the flags
fetchFlags();
