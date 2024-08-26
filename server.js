const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let gameState = [];
let currentPlayer = 'A';

const initializeGame = () => {
    gameState = [
        ['A-P1', 'A-P2', 'A-H1', 'A-H2', 'A-H3'],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
        ['', '', '', '', ''],
        ['B-P1', 'B-P2', 'B-H1', 'B-H2', 'B-H3']
    ];
    currentPlayer = 'A';
};

const isValidMove = (from, to) => {
    // Example validation logic; modify as needed
    const [fromRow, fromCol] = from.split('-').map(Number);
    const [toRow, toCol] = to.split('-').map(Number);

    // Check if from/to coordinates are within bounds
    if (fromRow < 0 || fromRow >= 5 || toRow < 0 || toRow >= 5 ||
        fromCol < 0 || fromCol >= 5 || toCol < 0 || toCol >= 5) {
        return false;
    }

    // Check if move is made by the current player
    const piece = gameState[fromRow][fromCol];
    if (!piece || piece.charAt(0) !== currentPlayer) {
        return false;
    }

    // Check if the destination cell is empty
    if (gameState[toRow][toCol] !== '') {
        return false;
    }

    // Add more move logic as needed

    return true;
};

const updateGameState = (from, to) => {
    const [fromRow, fromCol] = from.split('-').map(Number);
    const [toRow, toCol] = to.split('-').map(Number);

    gameState[toRow][toCol] = gameState[fromRow][fromCol];
    gameState[fromRow][fromCol] = '';

    // Switch players
    currentPlayer = currentPlayer === 'A' ? 'B' : 'A';
};

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.send(JSON.stringify({ type: 'init', gameState, currentPlayer }));

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);

        if (parsedMessage.type === 'initialize') {
            initializeGame();
            wss.clients.forEach(client => client.send(JSON.stringify({ type: 'update', gameState, currentPlayer })));
        } else if (parsedMessage.type === 'move') {
            const { from, to } = parsedMessage;
            if (isValidMove(from, to)) {
                updateGameState(from, to);
                wss.clients.forEach(client => client.send(JSON.stringify({ type: 'update', gameState, currentPlayer })));
            } else {
                ws.send(JSON.stringify({ type: 'invalid', reason: 'Invalid move' }));
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

server.listen(8080, () => {
    console.log('Server is running on port 8080');
});
