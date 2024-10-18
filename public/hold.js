let stopwatchInterval;
let stopwatchStartTime;
let stopwatchElapsedTime = 0; 

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
 * Updates the stopwatch every second.
 */
  stopwatchElapsedTime = Math.floor((Date.now() - stopwatchStartTime) / 1000); 

  const minutes = Math.floor(stopwatchElapsedTime / 60).toString().padStart(2, '0');
  const seconds = (stopwatchElapsedTime % 60).toString().padStart(2, '0');

  document.getElementById('stopwatch').innerText = `Time: ${minutes}:${seconds}`;
}

function startInteraction() {
  /**
 * Initiates by starting the stopwatch and keyboard/mouse pressing.
 */
  startInteractionInitated = true;
  startStopwatch(); 
  document.addEventListener("click", handleMouseClick);
  document.addEventListener("keydown", handleKeyPress);
}

function stopInteraction() {
    /**
 * Stops by stopping the stopwatch and keyboard/mouse pressing.
 */
  stopStopwatch(); 
  document.removeEventListener("click", handleMouseClick);
  document.removeEventListener("keydown", handleKeyPress);
}

function checkWinLose(guess, tiles) {
/**
 * Checks if the player's guess matches the target colour.
 * If the guess is correct, show win alert. Otherwise, shows correct hex code.
 *
 * @param guess - The player's guessed hex code.
 * @param tiles - The tiles used for the current guess.
 */
  if (`${guess}` === targetColor) {
    showAlert("You Win", 5000);
    danceTiles(tiles);
    const res = 'win';
    socket.emit('submitWinLose', { res, room });
    stopInteraction();
    return;
  }

  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
  if (remainingTiles.length === 14) {
    shakeTiles(tiles);
    showAlert(`The correct hex code was #${targetColor.toUpperCase()}`, null);
    const res = 'lose';
    socket.emit('submitWinLose', { res, room });
    stopInteraction();
  }
}
