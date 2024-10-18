const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/hexdle_solo.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'hexdle_solo.html'));
});

app.get('/hexdle_versus.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'hexdle_versus.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'hexdle_solo.html'));
});

const rooms = {};

function generateRandomHexCode() {
    /**
 * Generates a random hex code.
 * 
 * @returns - The generated hex code.
 */
    const letters = '0123456789abcdef';
    let colour = '';
    for (let i = 0; i < 6; i++) {
        colour += letters[Math.floor(Math.random() * 16)];
    }
    return colour;
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    /**
     * Handles a player joining a room, and if the room doesn't exist, it creates it.
     * @param room - The room ID.
     */
    socket.on('joinRoom', (room) => {
        if (!rooms[room]) {
            rooms[room] = { players: [], hexCode: generateRandomHexCode(), finished: 0, results: {} };
        }

        rooms[room].players.push(socket.id);
        socket.join(room);
        console.log(`${socket.id} joined room ${room}`);

        rooms[room].results[socket.id] = { win: false, time: 0 };

        socket.to(room).emit('playerJoined', `${socket.id} has joined the room`);

        socket.emit('receiveHexCode', rooms[room].hexCode);

        const playerNumber = rooms[room].players.length; 

        if (playerNumber === 1) {
            socket.emit('assignPlayerNumber', { number: 1 }); 
        } else if (playerNumber === 2) {
            socket.emit('assignPlayerNumber', { number: 2 }); 
        }

        if (rooms[room].players.length === 2) {
            io.to(room).emit('gameStart', 'Both players have joined. The game is starting now.');
        } else {
            socket.emit('waitingForPlayer', 'Waiting for another player to join...');
        }
    });


    socket.on('submitWinLose', ({ res, room, time }) => {
        /**
     * Handles win/loss submission for a player.
     *
     * @param res - The result of the game.
     * @param room - The room ID.
     * @param time - The time taken by the player.
     */
        if (!rooms[room]) return;

        rooms[room].finished += 1;
        rooms[room].results[socket.id].win = (res === 'win');
        rooms[room].results[socket.id].time = time;

        console.log(`Player ${socket.id} result in room ${room}: ${res} with time ${time} seconds`);

        if (rooms[room].finished === 2) {
            const [player1, player2] = rooms[room].players;
            const result1 = rooms[room].results[player1];
            const result2 = rooms[room].results[player2];

            let winner;
            if (result1.win && result2.win) {

                winner = result1.time <= result2.time ? player1 : player2;
                io.to(room).emit('finishGame', {
                    message: `Player ${winner === player1 ? 1 : 2} wins with a time of ${rooms[room].results[winner].time} seconds!`,
                });
            } else if (result1.win) {

                io.to(room).emit('finishGame', {
                    message: `Player 1 is the winner with a time of ${result1.time} seconds!`,
                });
            } else if (result2.win) {

                io.to(room).emit('finishGame', {
                    message: `Player 2 is the winner with a time of ${result2.time} seconds!`,
                });
            } else {

                io.to(room).emit('finishGame', {
                    message: `Neither player guessed correctly. It's a draw!`,
                });
            }
            delete rooms[room]; 
        }
    });

    socket.on('disconnect', () => {
        /**
     * Handles user disconnection.
     */
        console.log('User disconnected:', socket.id);

        for (let room in rooms) {
            if (rooms[room].players.includes(socket.id)) {
                const index = rooms[room].players.indexOf(socket.id);
                if (index > -1) {
                    rooms[room].players.splice(index, 1);
                }

                if (rooms[room].players.length === 0) {
                    delete rooms[room];
                }

                break;
            }
        }
    });
});

/**
 * Starts the server.
 */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
