Hexdle

Hexdle is a fun take on the hit game 'Wordle', in which players must attempt to guess hexadecimal colour codes. The project supports both solo and multiplayer modes, where players can compete against each other to guess the correct hex colour code faster. 


Project Features

Solo Mode: Play individually and try to guess the correct hexadecimal colour code, with helpful prompts telling you how accurate your guesses are.
Versus Mode: Two players must race against one another to guess the hex code first.
Real-time Updates: Immediate updates about wins and losses occur using websockets.
Interactive Design: 'Wordle' clone design for familiarity.
Stopwatch: Track how long it takes for players to guess the hex code to add a competitive edge.


Installation

Prerequisites - Ensure the following are installed before proceeding further:
Node.js 
npm 

1. Clone the repository:
    git clone https://github.com/jamesf-beasley/hexdle.git
2. Install dependencies:
    npm install
3. Start the server:
    node server.js
4. Access the game: 
    Go to http://localhost:3000 on your browser to play.


Usage

Solo Mode
To play solo:
1. Go to http://localhost:3000/hexdle_solo.html.
2. Start guessing the hex code by entering values and reading the accuracy for hints.
3. The game ends when you guess the correct hex code.
4. Refresh the page to play again.

Versus Mode
To play versus:
1. Both players go to http://localhost:3000/hexdle_versus.html.
2. Both players choose a room name (i.e. 'Athena')
3. The game will start automatically, so you must race to win. Once both players have finished, a prompt will appear stating the winner.
4. Refresh the page and enter a new (or the same room name) to play again.
