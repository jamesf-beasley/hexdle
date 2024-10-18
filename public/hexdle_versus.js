let stopwatchInterval;
let stopwatchStartTime;
let stopwatchElapsedTime = 0;

const socket = io(); 

socket.on('waitingForPlayer', (message) => {
  console.log(message);
  showAlert(message, 2000);
});

socket.on('gameStart', (message) => {
  console.log(message);
  startInteraction(); 
  showAlert(message);
});

socket.on('assignPlayerNumber', (data) => {
  const playerNumber = data.number; 
  document.getElementById('playerNumber').textContent = `You are Player ${playerNumber}`;
});

socket.on('receiveHexCode', (hexCode) => {
  targetColor = hexCode;
});

socket.on('receiveGuess', ({ guess, player }) => {
  console.log(`Received guess from player ${player}: ${guess}`);
  showAlert(`Opponent's guess: ${guess}`);
});

socket.on('roomFull', (message) => {
  alert(message); 
});

socket.on('receiveWinLose', ({ res, time, player }) => {
  if (res === 'win') {
    showAlert(`Your opponent guessed the hex correctly in ${time} seconds`);
  } else {
    showAlert(`Your opponent was unable to guess the hex and took ${time} seconds`);
  }
});

socket.on('finishGame', ({ message }) => {
  showAlertWL(message);
});

const room = prompt('Enter room name to join or create:');
socket.emit('joinRoom', room);

const WORD_LENGTH = 6; 
const FLIP_ANIMATION_DURATION = 500;
const DANCE_ANIMATION_DURATION = 500;
const keyboard = document.querySelector("[data-keyboard]");
const alertContainer = document.querySelector("[data-alert-container]");
const guessGrid = document.querySelector("[data-guess-grid]");
let currentRowIndex = 0; 

function startInteraction() {
  /**
 * Starts user interaction by initialising mouse clicks and key presses,
 * and initialises the stopwatch.
 */
  document.addEventListener("click", handleMouseClick);
  document.addEventListener("keydown", handleKeyPress);
  startStopwatch(); 
}

function stopInteraction() {
  /**
 * Stops user interaction by removing event listeners.
 */
  document.removeEventListener("click", handleMouseClick);
  document.removeEventListener("keydown", handleKeyPress);
}

function startStopwatch() {
  /**
 * Starts the stopwatch.
 */
  if (stopwatchInterval) return; 
  stopwatchStartTime = Date.now() - stopwatchElapsedTime * 1000;
  stopwatchInterval = setInterval(updateStopwatchDisplay, 1000);
}

function stopStopwatch() {
  /**
 * Stops the stopwatch.
 */
  if (!stopwatchInterval) return; 
  clearInterval(stopwatchInterval);
  stopwatchInterval = null;
}

function resetStopwatch() {
  /**
 * Resets the stopwatch.
 */
  stopStopwatch();
  stopwatchElapsedTime = 0; 
  updateStopwatchDisplay(); 
}

function updateStopwatchDisplay() {
  /**
 * Updates the display for the stopwatch.
 */
  stopwatchElapsedTime = Math.floor((Date.now() - stopwatchStartTime) / 1000); 
  const minutes = Math.floor(stopwatchElapsedTime / 60).toString().padStart(2, '0');
  const seconds = (stopwatchElapsedTime % 60).toString().padStart(2, '0');
  document.getElementById('stopwatch').innerText = `Time: ${minutes}:${seconds}`;
}

function handleMouseClick(e) {
  /**
 * Handles mouse clicks.
 * @param e - Initialises the mouse event.
 */
  if (e.target.matches("[data-key]")) {
    pressKey(e.target.dataset.key);
    return;
  }

  if (e.target.matches("[data-enter]")) {
    submitGuess();
    return;
  }

  if (e.target.matches("[data-delete]")) {
    deleteKey();
    return;
  }
}

function handleKeyPress(e) {
  /**
 * Handles keyboard presses.
 * @param e - Initialises the keyboard events.
 */
  if (e.key === "Enter") {
    submitGuess();
    return;
  }

  if (e.key === "Backspace" || e.key === "Delete") {
    deleteKey();
    return;
  }

  if (e.key.match(/^[a-fA-F0-9]$/)) { 
    pressKey(e.key);
    return;
  }
}

function pressKey(key) {
  /**
 * Adds key to the current row if theres space.
 * @param key - The key to be added to the guess.
 */
  const activeTiles = getActiveTiles();
  if (activeTiles.length >= WORD_LENGTH) return;
  const currentRowTiles = getRowTiles(currentRowIndex);
  const nextTile = currentRowTiles[activeTiles.length];
  nextTile.dataset.letter = key.toLowerCase();
  nextTile.textContent = key;
  nextTile.dataset.state = "active";
}

function deleteKey() {
  /**
 * Deletes the last character from the grid.
 */
  const activeTiles = getActiveTiles();
  const lastTile = activeTiles[activeTiles.length - 1];
  if (lastTile == null) return;
  lastTile.textContent = "";
  delete lastTile.dataset.state;
  delete lastTile.dataset.letter;
}

function submitGuess() {
  /**
 * Submits the current guess.
 */
  const activeTiles = [...getActiveTiles()];
  if (activeTiles.length !== WORD_LENGTH) {
    showAlert("Not enough characters");
    shakeTiles(activeTiles);
    return;
  }

  const guess = activeTiles.reduce((color, tile) => color + tile.dataset.letter, "");
  res = guess.toUpperCase();
  socket.emit('submitGuess', { res, room });
  const accuracy = colorAccuracyPercentage(`#${guess}`, `#${targetColor}`);
  showAlert(`Your guess is ${accuracy}% accurate.`); 
  const colorDisplay = guessGrid.querySelectorAll('[data-color-display]')[currentRowIndex];
  if (colorDisplay) {
    colorDisplay.style.backgroundColor = `#${guess}`;
  }

  stopInteraction();

  activeTiles.forEach((tile, index, array) => flipTile(tile, index, array, guess));
  currentRowIndex++;
}

function flipTile(tile, index, array, guess) {
  /**
 * Flips tile to show result.
 * @param tile - The tile being flipped.
 * @param index - The index of the currently guessed tile.
 * @param array - The array of all tiles in the guess.
 * @param guess - The guess being evaluated.
 */
  const letter = tile.dataset.letter;
  const key = keyboard.querySelector(`[data-key="${letter}"i]`);
  setTimeout(() => {
    tile.classList.add("flip");
  }, (index * FLIP_ANIMATION_DURATION) / 2);

  const targetCount = {};
  const guessCount = {};

  for (let i = 0; i < targetColor.length; i++) {
    const targetLetter = targetColor[i];
    targetCount[targetLetter] = (targetCount[targetLetter] || 0) + 1;
    const guessLetter = guess[i];
    guessCount[guessLetter] = (guessCount[guessLetter] || 0) + 1;
  }

  tile.addEventListener(
    "transitionend",
    () => {
      tile.classList.remove("flip");

      if (targetColor[index].toLowerCase() === letter.toLowerCase()) {
        tile.dataset.state = "correct";
        key.classList.add("correct");
      } else if (targetColor.toLowerCase().includes(letter.toLowerCase()) && guessCount[letter] <= targetCount[letter]) {
        tile.dataset.state = "wrong-location";
        key.classList.add("wrong-location");
      } else {
        tile.dataset.state = "wrong";
        key.classList.add("wrong");
      }

      if (index === array.length - 1) {
        tile.addEventListener(
          "transitionend",
          () => {
            startInteraction();
            checkWinLose(guess, array);
          },
          { once: true }
        );
      }
    },
    { once: true }
  );
}

function getActiveTiles() {
  /**
 * Retrieves all tiles in the current  row.
 * @returns - List of active tile elements.
 */
  return guessGrid.querySelectorAll(`[data-state="active"]:nth-child(n + ${currentRowIndex * 7 + 1}):nth-child(-n + ${(currentRowIndex + 2) * 7})`);
}

function getRowTiles(rowIndex) {
  /**
 * Retrieves all tiles in current row.
 * @param rowIndex - The index of the row to retrieve tiles from.
 * @returns - Tile elements in the row.
 */
  const allTiles = guessGrid.querySelectorAll(".tile");
  return Array.from(allTiles).slice(rowIndex * WORD_LENGTH, (rowIndex + 1) * WORD_LENGTH);
}

function showAlert(message, duration = 1000) {
  /**
 * Shows an alert on the screen for a specific duration.
 * @param message - The message to display.
 * @param duration - The duration to display the message.
 */
  const alert = document.createElement("div");
  alert.textContent = message;
  alert.classList.add("alert");
  alertContainer.prepend(alert);
  if (duration == null) return;

  setTimeout(() => {
    alert.classList.add("hide");
    alert.addEventListener("transitionend", () => {
      alert.remove();
    });
  }, duration);
}

function showAlertWL(message, duration = 99999) {
  /**
 * Displays a message permanently on the screen to show winner.
 *
 * @param message - The message to display.
 * @param duration=99999 - The time to display for.
 */
  const alertwl = document.createElement("div");
  alertwl.textContent = message;
  alertwl.classList.add("alertwl");
  alertContainer.prepend(alertwl);
  if (duration == null) return;

  setTimeout(() => {
    alertwl.classList.add("hide");
    alertwl.addEventListener("transitionend", () => {
      alertwl.remove();
    });
  }, duration);
}

function shakeTiles(tiles) {
  /**
 * Shakes the tiles if incorrect guess.
 * @param tiles - The tiles to shake.
 */
  tiles.forEach(tile => {
    tile.classList.add("shake");
    tile.addEventListener(
      "animationend",
      () => {
        tile.classList.remove("shake");
      },
      { once: true }
    );
  });
}

function danceTiles(tiles) {
  /**
 * Bounces the tiles for a correct guess.
 * @param tiles - The tiles to bounce.
 */
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance");
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("dance");
        },
        { once: true }
      );
    }, (index * DANCE_ANIMATION_DURATION) / 5);
  });
}

function checkWinLose(guess, tiles) {
  /**
 * Checks if the user has won or lost and sends the result to the server.
 * @param guess - The player's current guess.
 * @param array - All tiles in the current guess.
 */
  if (guess.toLowerCase() === targetColor.toLowerCase()) {
    showAlert("You Win!", 5000);
    danceTiles(tiles);shakeTiles
    stopStopwatch();
    socket.emit('submitWinLose', { res: 'win', room, time: stopwatchElapsedTime });
    stopInteraction();
    return;
  }

  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
  if (remainingTiles.length === 14) {
    shakeTiles(tiles);
    showAlert(`The correct hex code was #${targetColor.toUpperCase()}`, null);
    stopStopwatch();
    socket.emit('submitWinLose', { res: 'lose', room, time: stopwatchElapsedTime });
    stopInteraction();
  }
}

function hexToRgb(hex) {
  /**
 * Converts a hex color code to an RGB object.
 * @param hex - The hex code.
 * @returns  - The RGB values.
 */
  let r = 0, g = 0, b = 0;

  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  }

  else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }

  return [r, g, b];
}

function colorDifference(hex1, hex2) {
  /**
 * Calculates the Euclidean distance between two colors in RGB space.
 * @param  hex1 - The first hex code.
 * @param hex2 - The second hex code.
 * @returns - The Euclidean distance between the two colors.
 */
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);

  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function colorAccuracyPercentage(hexGuess, hexTarget) {
  /**
 * Calculates the accuracy of a color guess compared to the target color.
 * @param guess - The guessed color.
 * @param target - The target color.
 * @returns - The accuracy percentage.
 */
  const difference = colorDifference(hexGuess, hexTarget);

  const maxDifference = Math.sqrt(3 * 255 * 255);

  const accuracyPercentage = ((maxDifference - difference) / maxDifference) * 100;

  return accuracyPercentage.toFixed(2); 
}

function generateRandomHexCode() {
  /**
 * Generates a random hex code.
 *
 * @returns - A randomly generated hex code.
 */
  const letters = '0123456789abcdef';
  let color = '';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color; 
}
