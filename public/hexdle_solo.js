const WORD_LENGTH = 6; 
const FLIP_ANIMATION_DURATION = 500;
const DANCE_ANIMATION_DURATION = 500;
const keyboard = document.querySelector("[data-keyboard]");
const alertContainer = document.querySelector("[data-alert-container]");
const guessGrid = document.querySelector("[data-guess-grid]");
const targetColour = generateRandomHexCode();
let currentRowIndex = 0; 

startInteraction();

function startInteraction() {
  /**
 * Initializes event listeners for mouse and keyboard to register presses.
 */
  document.addEventListener("click", handleMouseClick);
  document.addEventListener("keydown", handleKeyPress);
}

function stopInteraction() {
  /**
 * Stops/removes event listeners to stop mouse and keyboard presses registering.
 */
  document.removeEventListener("click", handleMouseClick);
  document.removeEventListener("keydown", handleKeyPress);
}

function handleMouseClick(e) {
  /**
 * Handles mouse click events on keyboard.
 * @param e - The button being clicked.
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
 * Handles keyboard events.
 * @param e - The keyboard event.
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
 *  Pressed key goes into the current tile.
 * @param key - The key pressed by the user.
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
 * Deletes the last letter from the tiles.
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
 * Submits the current guess and calculates how accurate it is.
 */
  const activeTiles = [...getActiveTiles()];
  if (activeTiles.length !== WORD_LENGTH) {
    showAlert("Not enough characters");
    shakeTiles(activeTiles);
    return;
  }

  const guess = activeTiles.reduce((colour, tile) => colour + tile.dataset.letter, "");

  const accuracy = colourAccuracyPercentage(`#${guess}`, `#${targetColour}`);
  showAlert(`Your guess is ${accuracy}% accurate.`); 

  const colourDisplay = guessGrid.querySelectorAll('[data-colour-display]')[currentRowIndex];
  if (colourDisplay) {
    colourDisplay.style.backgroundColour = `#${guess}`;
  }

  stopInteraction();
  activeTiles.forEach((tile, index, array) => flipTile(tile, index, array, guess));

  currentRowIndex++;
}

function flipTile(tile, index, array, guess) {
  /**
 * Flips the tile and updates its coloue based on how correct it is.
 * @param tile - The tile to flip.
 * @param index - The index of the tile.
 * @param array - The array of tiles in the current guess.
 * @param guess - The user's entire guess.
 */
  const letter = tile.dataset.letter;
  const key = keyboard.querySelector(`[data-key="${letter}"i]`);
  setTimeout(() => {
    tile.classList.add("flip");
  }, (index * FLIP_ANIMATION_DURATION) / 2);

  const targetCount = {};
  const guessCount = {};

  for (let i = 0; i < targetColour.length; i++) {
    const targetLetter = targetColour[i];
    targetCount[targetLetter] = (targetCount[targetLetter] || 0) + 1;
    const guessLetter = guess[i];
    guessCount[guessLetter] = (guessCount[guessLetter] || 0) + 1;
  }

  tile.addEventListener(
    "transitionend",
    () => {
      tile.classList.remove("flip");

      if (targetColour[index].toLowerCase() === letter.toLowerCase()) {
        tile.dataset.state = "correct";
        key.classList.add("correct");
      } else if (targetColour.toLowerCase().includes(letter.toLowerCase()) && guessCount[letter] <= targetCount[letter]) {
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
 * Retrieves the active tiles in the current row.
 * @returns - Active tiles in the current row.
 */
  return guessGrid.querySelectorAll(`[data-state="active"]:nth-child(n + ${currentRowIndex * 7 + 1}):nth-child(-n + ${(currentRowIndex + 2) * 7})`);
}

function getRowTiles(rowIndex) {
  /**
 * Retrieves all tiles in a specified row.
 * @param rowIndex - The index of the row.
 * @returns - Tiles in the specified row.
 */
  const allTiles = guessGrid.querySelectorAll(".tile");
  return Array.from(allTiles).slice(rowIndex * WORD_LENGTH, (rowIndex + 1) * WORD_LENGTH);
}

function showAlert(message, duration = 1000) {
  /**
 * Displays an alert message for a specified duration.
 * @param message - The message to display.
 * @param duration - The duration of displaying the message.
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

function shakeTiles(tiles) {
  /**
 * Shakes tiles if incorrect guess.
 * @param tiles - Tiles to shake.
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
 * Tiles bounce to show a correct guess.
 * @param tiles - Tiles to bounce.
 */
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance")
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("dance")
        },
        { once: true }
      )
    }, (index * DANCE_ANIMATION_DURATION) / 5)
  })
}

function checkWinLose(guess, tiles) {
  /**
 * Checks if the user has won or lost the game.
 * @param guess - The user's recent guess.
 * @param tiles - Tiles in the current guess.
 */
  if (`${guess}` === targetColour) {
    showAlert("You Win", 5000);
    danceTiles(tiles);
    stopInteraction();
    return;
  }

  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
  if (remainingTiles.length === 14) {
    shakeTiles(tiles);
    showAlert(`The correct hex code was #${targetColour.toUpperCase()}`, null);
    stopInteraction();
  }
}

function hexToRgb(hex) {
  /**
 * Converts a hexadecimal colour code to RGB.
 * @param hex - The hex colour code to convert.
 * @returns - Array of RGB values.
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

function colourDifference(hex1, hex2) {
  /**
 * Calculates the colour difference between the target and guessed colour codes.
 * @param hex1 - The first hex code.
 * @param hex2 - The second hex code.
 * @returns - The calculated difference.
 */
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);

  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function colourAccuracyPercentage(hexGuess, hexTarget) {
  /**
 * Calculates accuracy of a guessed hex code compared to the target code.
 * @param hexGuess - The guessed hex code.
 * @param hexTarget - The target hex code.
 * @returns - The accuracy percentage.
 */
  const difference = colourDifference(hexGuess, hexTarget);

  const maxDifference = Math.sqrt(3 * 255 * 255);

  const accuracyPercentage = ((maxDifference - difference) / maxDifference) * 100;

  return accuracyPercentage.toFixed(2); 
}

function generateRandomHexCode() {
  /**
 * Generates a random hex code.
 * @returns - Randomly generated hex code.
 */
  const letters = '0123456789abcdef';
  let colour = '';
  for (let i = 0; i < 6; i++) {
    colour += letters[Math.floor(Math.random() * 16)];
  }
  return colour; 
}