const gameBoard = document.getElementById('game-board');
const gameStatus = document.getElementById('game-status');
const moveButtons = document.getElementById('move-buttons');
const moveLog = document.getElementById('move-log');

const socket = new WebSocket('ws://localhost:8080');

let currentPlayer = 'A';
let selectedCell = null;
let gameState = [];

socket.onopen = () => {
    console.log('Connected to server');
};

socket.onmessage = event => {
    const data = JSON.parse(event.data);
    console.log('Received data from server:', data);
    
    if (data.type === 'init' || data.type === 'update') {
        gameState = data.gameState;
        currentPlayer = data.currentPlayer;
        updateUI();
    } else if (data.type === 'invalid') {
        alert(`Invalid move: ${data.reason}`);
    }
};

function updateUI() {
    console.log('Updating UI with game state:', gameState);
    gameBoard.innerHTML = '';
    gameStatus.textContent = `Player ${currentPlayer}'s Turn`;

    gameState.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('cell');
            cellDiv.textContent = cell;
            cellDiv.onclick = () => onCellClick(rowIndex, colIndex);
            gameBoard.appendChild(cellDiv);
        });
    });
}

function onCellClick(rowIndex, colIndex) {
    const selectedCharacter = gameState[rowIndex][colIndex];
    if (selectedCharacter.startsWith(currentPlayer)) {
        selectedCell = { rowIndex, colIndex };
        showMoveOptions(rowIndex, colIndex);
    }
}

function showMoveOptions(rowIndex, colIndex) {
    moveButtons.innerHTML = '';

    const character = gameState[rowIndex][colIndex];
    const moves = getMoveOptions(character, rowIndex, colIndex);

    moves.forEach(move => {
        const moveButton = document.createElement('button');
        moveButton.textContent = move.label;
        moveButton.onclick = () => makeMove(move.toRow, move.toCol);
        moveButtons.appendChild(moveButton);
    });
}

function getMoveOptions(character, rowIndex, colIndex) {
    const moves = [];

    if (character.includes('P1') || character.includes('H1')) {
        if (rowIndex > 0 && gameState[rowIndex - 1][colIndex] === "") {
            moves.push({ label: 'Forward', toRow: rowIndex - 1, toCol: colIndex });
        }
        if (rowIndex < 4 && gameState[rowIndex + 1][colIndex] === "") {
            moves.push({ label: 'Backward', toRow: rowIndex + 1, toCol: colIndex });
        }
        if (colIndex > 0 && gameState[rowIndex][colIndex - 1] === "") {
            moves.push({ label: 'Left', toRow: rowIndex, toCol: colIndex - 1 });
        }
        if (colIndex < 4 && gameState[rowIndex][colIndex + 1] === "") {
            moves.push({ label: 'Right', toRow: rowIndex, toCol: colIndex + 1 });
        }
    }

    if (character.includes('H2')) {
        if (rowIndex > 0 && colIndex > 0 && gameState[rowIndex - 1][colIndex - 1] === "") {
            moves.push({ label: 'Forward-Left', toRow: rowIndex - 1, toCol: colIndex - 1 });
        }
        if (rowIndex > 0 && colIndex < 4 && gameState[rowIndex - 1][colIndex + 1] === "") {
            moves.push({ label: 'Forward-Right', toRow: rowIndex - 1, toCol: colIndex + 1 });
        }
        if (rowIndex < 4 && colIndex > 0 && gameState[rowIndex + 1][colIndex - 1] === "") {
            moves.push({ label: 'Backward-Left', toRow: rowIndex + 1, toCol: colIndex - 1 });
        }
        if (rowIndex < 4 && colIndex < 4 && gameState[rowIndex + 1][colIndex + 1] === "") {
            moves.push({ label: 'Backward-Right', toRow: rowIndex + 1, toCol: colIndex + 1 });
        }
    }

    return moves;
}

function makeMove(toRow, toCol) {
    if (selectedCell) {
        console.log(`Sending move from ${selectedCell.rowIndex}-${selectedCell.colIndex} to ${toRow}-${toCol}`);
        socket.send(JSON.stringify({
            type: 'move',
            from: `${selectedCell.rowIndex}-${selectedCell.colIndex}`,
            to: `${toRow}-${toCol}`
        }));
        selectedCell = null;
        moveButtons.innerHTML = '';
    }
}
