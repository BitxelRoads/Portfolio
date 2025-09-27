document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN DEL JUEGO ---
    const ROWS = 9;
    const COLS = 9;
    const MINES = 10;

    // --- ELEMENTOS DEL DOM ---
    const boardElement = document.getElementById('game-board');
    const mineCounterElement = document.getElementById('mine-counter');
    const timerElement = document.getElementById('timer');
    const resetButton = document.getElementById('reset-button');
    const smileyElement = resetButton.querySelector('.sprite');

    // --- VARIABLES DE ESTADO ---
    let board = [];
    let mineLocations = [];
    let flagsPlaced = 0;
    let revealedCells = 0;
    let timerInterval;
    let seconds = 0;
    let isGameOver = false;
    let firstClick = true;

    // --- FUNCIONES PRINCIPALES ---

    function initGame() {
        isGameOver = false;
        firstClick = true;
        flagsPlaced = 0;
        revealedCells = 0;
        seconds = 0;
        board = [];
        mineLocations = [];

        boardElement.innerHTML = '';
        boardElement.style.gridTemplateColumns = `repeat(${COLS}, 16px)`;
        smileyElement.className = 'sprite smiley-normal';
        updateMineCounter();
        resetTimer();

        for (let r = 0; r < ROWS; r++) {
            const row = [];
            for (let c = 0; c < COLS; c++) {
                const cellElement = document.createElement('div');
                cellElement.classList.add('cell');
                
                const cell = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    adjacentMines: 0,
                    element: cellElement,
                    // Guardamos las funciones de los listeners para poder quitarlas después
                    listeners: {} 
                };

                cell.listeners.click = () => handleCellClick(r, c);
                cell.listeners.contextmenu = (e) => {
                    e.preventDefault();
                    handleRightClick(r, c);
                };
                cell.listeners.mousedown = () => {
                    if (!isGameOver) smileyElement.className = 'sprite smiley-scared';
                };
                cell.listeners.mouseup = () => {
                    if (!isGameOver) smileyElement.className = 'sprite smiley-normal';
                };

                // Añadimos los listeners al elemento
                cell.element.addEventListener('click', cell.listeners.click);
                cell.element.addEventListener('contextmenu', cell.listeners.contextmenu);
                cell.element.addEventListener('mousedown', cell.listeners.mousedown);
                cell.element.addEventListener('mouseup', cell.listeners.mouseup);

                boardElement.appendChild(cell.element);
                row.push(cell);
            }
            board.push(row);
        }
    }

    function placeMines(initialRow, initialCol) {
        let minesToPlace = MINES;
        while (minesToPlace > 0) {
            const r = Math.floor(Math.random() * ROWS);
            const c = Math.floor(Math.random() * COLS);
            if ((r === initialRow && c === initialCol) || board[r][c].isMine) {
                continue;
            }
            board[r][c].isMine = true;
            mineLocations.push([r, c]);
            minesToPlace--;
        }
    }

    function calculateAdjacentMines() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c].isMine) continue;
                let count = 0;
                forEachNeighbor(r, c, (nr, nc) => {
                    if (board[nr][nc].isMine) {
                        count++;
                    }
                });
                board[r][c].adjacentMines = count;
            }
        }
    }
    
    // --- MANEJO DE EVENTOS ---

    function handleCellClick(r, c) {
        const cell = board[r][c];
        if (isGameOver || cell.isFlagged) return;

        if (firstClick) {
            placeMines(r, c);
            calculateAdjacentMines();
            startTimer();
            firstClick = false;
        }

        if (cell.isRevealed) {
            handleChordClick(r, c); // Lógica de "acorde" si se pica en una ya revelada
        } else {
            revealCell(r, c);
        }
        
        if (!isGameOver) {
            checkWinCondition();
        }
    }

    function handleRightClick(r, c) {
        if (isGameOver || board[r][c].isRevealed) return;
        
        const cell = board[r][c];
        cell.isFlagged = !cell.isFlagged;
        
        if (cell.isFlagged) {
            cell.element.innerHTML = '<div class="sprite flag"></div>';
            flagsPlaced++;
        } else {
            cell.element.innerHTML = '';
            flagsPlaced--;
        }
        updateMineCounter();
    }
    
    function handleChordClick(r, c) {
        const cell = board[r][c];
        if (cell.adjacentMines === 0) return;

        let adjacentFlags = 0;
        forEachNeighbor(r, c, (nr, nc) => {
            if (board[nr][nc].isFlagged) {
                adjacentFlags++;
            }
        });

        if (adjacentFlags === cell.adjacentMines) {
            forEachNeighbor(r, c, (nr, nc) => {
                if (!board[nr][nc].isRevealed && !board[nr][nc].isFlagged) {
                    revealCell(nr, nc);
                }
            });
        }
    }

    // --- LÓGICA DEL JUEGO ---

    function revealCell(r, c) {
        const cell = board[r][c];
        if (cell.isRevealed || cell.isFlagged) return;
        
        if (cell.isMine) {
            gameOver(false, r, c);
            return;
        }

        cell.isRevealed = true;
        cell.element.classList.add('revealed');
        revealedCells++;

        if (cell.adjacentMines > 0) {
            cell.element.textContent = cell.adjacentMines;
            cell.element.dataset.adjacent = cell.adjacentMines;
        } else {
            // Expansión recursiva si la celda está vacía
            forEachNeighbor(r, c, (nr, nc) => {
                revealCell(nr, nc);
            });
        }
    }
    
    function gameOver(isWin, clickedRow, clickedCol) {
        if (isGameOver) return; // Evita que la función se ejecute varias veces
        isGameOver = true;
        stopTimer();
        smileyElement.className = isWin ? 'sprite smiley-win' : 'sprite smiley-lose';

        // Congela el tablero quitando los listeners para evitar más interacciones
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = board[r][c];
                cell.element.removeEventListener('click', cell.listeners.click);
                cell.element.removeEventListener('contextmenu', cell.listeners.contextmenu);
                cell.element.removeEventListener('mousedown', cell.listeners.mousedown);
                cell.element.removeEventListener('mouseup', cell.listeners.mouseup);
            }
        }
        
        if (isWin) {
            mineLocations.forEach(([r, c]) => {
                if (!board[r][c].isFlagged) {
                    board[r][c].element.innerHTML = '<div class="sprite flag"></div>';
                }
            });
            mineCounterElement.textContent = '000';
        } else {
            // Muestra todas las minas al perder
            board.forEach((row, r) => row.forEach((cell, c) => {
                if (cell.isMine && !cell.isFlagged) {
                    cell.element.innerHTML = '<div class="sprite mine"></div>';
                }
                if (!cell.isMine && cell.isFlagged) {
                    cell.element.innerHTML = '<div class="sprite mine-wrong"></div>';
                }
            }));
            // Marca la mina que se ha clicado
            board[clickedRow][clickedCol].element.innerHTML = '<div class="sprite mine-exploded"></div>';
        }
    }

    function checkWinCondition() {
        if (revealedCells === (ROWS * COLS) - MINES) {
            gameOver(true);
        }
    }
    
    // --- UTILIDADES ---

    function forEachNeighbor(r, c, callback) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                    callback(nr, nc);
                }
            }
        }
    }

    function updateMineCounter() {
        const remaining = MINES - flagsPlaced;
        mineCounterElement.textContent = String(remaining).padStart(3, '0');
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            seconds++;
            if (seconds <= 999) {
                timerElement.textContent = String(seconds).padStart(3, '0');
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }
    
    function resetTimer() {
        stopTimer();
        seconds = 0;
        timerElement.textContent = '000';
    }

    // --- INICIO ---
    resetButton.addEventListener('click', initGame);
    initGame();
});