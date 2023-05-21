// state object to store the game state
const state = {
  flags: [], // array to store all the flags fetched from the API
  usedFlags: [], // array to store the flags that have been used in the game
  correctFlags: [], // array to store the flags that have been correctly guessed
  currentFlag: null, // object to store the current flag being displayed
  currentStreak: 0, // number to track the current streak of correct guesses
  bestStreak: JSON.parse(localStorage.getItem("bestStreak")) || 0, // number to track the best streak of correct guesses, retrieved from local storage
  timeLeft: 15, // number to track the time left in seconds
  timer: null, // variable to store the timer interval ID
};

// object to store the UI elements
const elements = {
  stats: document.getElementById("stats"), // reference to the stats container element
  game: document.getElementById("game"), // reference to the game container element
  flag: document.getElementById("flag"), // reference to the flag image element
  options: document.getElementById("options"), // reference to the options container element
  startButton: document.getElementById("start"), // reference to the start button element
  restartButton: document.getElementById("restart"), // reference to the restart button element
  restartEndButton: document.getElementById("restart-end"), // reference to the restart button on the end screen element
  currentStreak: document.getElementById("current-streak"), // reference to the current streak element
  bestStreak: document.getElementById("best-streak"), // reference to the best streak element
  timer: document.getElementById("timer"), // reference to the timer element
  endScreen: document.getElementById("end-screen"), // reference to the end screen element
  finalScore: document.getElementById("final-score"), // reference to the final score element
  correctAnswers: document.getElementById("correct-answers"), // reference to the container for correct answers element
};

// fetch flags from the API
async function fetchFlags() {
  try {
    const response = await fetch("https://restcountries.com/v2/all"); // make a request to the API to fetch all country flags
    const data = await response.json(); // parse the response as JSON
    state.flags = data.map((country) => {
      if (!country.flags || !country.flags.png)
        throw new Error("Invalid country data"); // if the country data doesn't contain flag information, throw an error
      return {
        country: country.name, // store the country name
        flagUrl: country.flags.png, // store the URL of the flag image
      };
    });
  } catch (error) {
    console.error("Failed to fetch flags:", error); // log an error message if fetching flags fails
  }
}

// start the game
function startGame() {
  elements.startButton.style.display = "none"; // hide the start button
  elements.stats.style.display = "block"; // show the stats container
  elements.game.style.display = "block"; // show the game container
  elements.flag.style.display = "block"; // show the flag image
  fadeIn(elements.flag); // fade in the flag image
  nextFlag(); // display the next flag
  updateUI(); // update the UI elements
  startTimer(); // start the timer
}

// reset the game state and update UI
function resetState() {
  state.flags = [...state.usedFlags, ...state.correctFlags, ...state.flags]; // combine the used flags, correct flags, and remaining flags
  state.usedFlags = []; // clear the used flags
  state.correctFlags = []; // clear the correct flags
  state.currentFlag = null; // clear the current flag
  state.currentStreak = 0; // reset the current streak
  state.timeLeft = 15; // reset the time left
  if (state.timer) clearInterval(state.timer); // clear the timer interval if it exists
  elements.endScreen.style.display = "none"; // hide the end screen
  elements.restartButton.style.display = "none"; // hide the restart button
  elements.startButton.style.display = "block"; // show the start button
  elements.options.innerHTML = ""; // clear the options container
  elements.correctAnswers.innerHTML = ""; // clear the correct answers container
  elements.flag.style.display = "none"; // hide the flag image
  elements.stats.style.display = "none"; // hide the stats container
  elements.game.style.display = "none"; // hide the game container
  updateUI(); // update the UI elements
}

// update the UI based on the game state
function updateUI() {
  elements.currentStreak.textContent = state.currentStreak; // update the current streak text
  elements.bestStreak.textContent = state.bestStreak; // update the best streak text
  elements.timer.textContent = state.timeLeft; // update the timer text
}

// start the timer
function startTimer() {
  if (state.timer) clearInterval(state.timer); // clear any existing timer

  state.timer = setInterval(() => {
    state.timeLeft--; // decrement the time left
    updateUI(); // update the UI elements
    if (state.timeLeft <= 0) {
      clearInterval(state.timer); // clear the timer interval
      endGame(); // end the game when time runs out
    }
  }, 1000); // run the timer every second (1000 milliseconds)
}

// end the game
function endGame() {
  clearInterval(state.timer); // clear the timer interval
  elements.game.style.display = "none"; // hide the game container
  elements.stats.style.display = "none"; // hide the stats container
  elements.flag.style.display = "none"; // hide the flag image
  elements.endScreen.style.display = "block"; // show the end screen
  elements.finalScore.textContent = state.currentStreak; // display the final score
  state.correctFlags.forEach((flag) => {
    let div = document.createElement("div"); // create a div element
    let img = document.createElement("img"); // create an img element
    img.src = flag.flagUrl; // set the flag image source
    img.alt = flag.country; // set the alt text for the flag image
    let p = document.createElement("p"); // create a p element
    p.textContent = flag.country; // set the text content for the p element
    div.appendChild(img); // append the img element to the div
    div.appendChild(p); // append the p element to the div
    elements.correctAnswers.appendChild(div); // append the div to the correct answers container
  });
  fadeIn(elements.endScreen); // fade in the end screen
  elements.restartButton.style.display = "block"; // show the restart button
}

// get the next flag and display options
function nextFlag() {
  if (state.flags.length === 0) {
    // if there are no more flags, end the game
    endGame();
    return;
  }

  const flagIndex = Math.floor(Math.random() * state.flags.length); // generate a random index to select a flag
  const flag = state.flags[flagIndex]; // get the flag at the random index
  state.currentFlag = flag; // set the current flag

  fadeOut(elements.flag, () => {
    // fade out the current flag
    elements.flag.src = flag.flagUrl; // set the source of the flag image to the new flag
    fadeIn(elements.flag); // fade in the new flag
  });

  state.flags.splice(flagIndex, 1); // remove the selected flag from the flags array
  state.usedFlags.push(flag); // add the flag to the used flags array

  clearInterval(state.timer); // clear the timer interval
  state.timeLeft = 15; // reset the time left
  startTimer(); // start a new timer

  displayOptions(); // display the options for the current flag
}

// display the options for the current flag
function displayOptions() {
  elements.options.innerHTML = ""; // clear the options container

  const options = [state.currentFlag, ...getRandomFlags(3)]; // create an array of options (current flag + 3 random flags)

  shuffleArray(options); // shuffle the options array

  options.forEach((option) => {
    const button = document.createElement("button"); // create a button element
    button.textContent = option.country; // set the button text to the country name
    button.addEventListener("click", () => handleGuess(option)); // add a click event listener to the button
    elements.options.appendChild(button); // append the button to the options container
  });
}

// get n random flags from the remaining flags
function getRandomFlags(n) {
  const flags = [...state.flags]; // create a copy of the flags array
  const randomFlags = [];

  for (let i = 0; i < n; i++) {
    if (flags.length === 0) break; // break the loop if there are no more flags
    const flagIndex = Math.floor(Math.random() * flags.length); // generate a random index to select a flag
    const flag = flags[flagIndex]; // get the flag at the random index
    flags.splice(flagIndex, 1); // remove the selected flag from the flags array
    randomFlags.push(flag); // add the flag to the random flags array
  }

  return randomFlags; // return the array of random flags
}

// handle the user's guess
function handleGuess(guess) {
  const buttons = Array.from(elements.options.children); // get all the buttons
  const correctButton = buttons.find(
    (button) => button.textContent === state.currentFlag.country
  ); // find the button with the correct answer

  if (guess === state.currentFlag) {
    // if the guess is correct
    correctButton.classList.add("correct"); // add the "correct" class to the correct button
    state.currentStreak++; // increment the current streak
    if (state.currentStreak > state.bestStreak) {
      state.bestStreak = state.currentStreak; // update the best streak if the current streak is greater
      localStorage.setItem("bestStreak", JSON.stringify(state.bestStreak)); // store the best streak in local storage
    }
    state.correctFlags.push(state.currentFlag); // add the current flag to the correct flags array
    setTimeout(() => {
      fadeOut(elements.flag, () => {
        // fade out the current flag
        nextFlag(); // display the next flag
      });
    }, 1000); // wait for 1 second before displaying the next flag
  } else {
    // if the guess is wrong
    correctButton.classList.add("correct"); // add the "correct" class to the correct button
    const wrongButton = buttons.find(
      (button) => button.textContent === guess.country
    ); // find the button with the wrong answer
    wrongButton.classList.add("wrong"); // add the "wrong" class to the wrong button
    wrongButton.classList.add("shake"); // add the "shake" class for shake animation
    setTimeout(() => {
      wrongButton.classList.remove("shake"); // remove the "shake" class after the animation completes
      endGame(); // end the game
    }, 1000); // wait for 1 second before ending the game
  }

  buttons.forEach((button) => (button.disabled = true)); // disable all buttons to prevent further clicks
  updateUI(); // update the UI elements
}

// shuffle an array in place
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // swap elements to shuffle the array
  }
}

// fade in an element
function fadeIn(element) {
  element.style.opacity = "0"; // set initial opacity to 0
  element.style.display = "block"; // show the element
  let opacity = 0;
  const duration = 300; // duration of the fade animation in milliseconds
  const interval = 10; // interval for each frame of the animation in milliseconds
  const increment = interval / duration; // opacity increment for each frame

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
  element.style.opacity = "1"; // set initial opacity to 1
  let opacity = 1;
  const duration = 300; // duration of the fade animation in milliseconds
  const interval = 10; // interval for each frame of the animation in milliseconds
  const decrement = interval / duration; // opacity decrement for each frame

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
elements.startButton.addEventListener("click", startGame); // listen for click event on the start button
elements.restartButton.addEventListener("click", resetState); // listen for click event on the restart button
elements.restartEndButton.addEventListener("click", resetState); // listen for click event on the restart button on the end screen

// initial fetch of the flags
fetchFlags();
