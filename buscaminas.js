document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid');
    const mineCounter = document.getElementById('mine-counter');
    const timerDisplay = document.getElementById('timer');
    const smileyFace = document.getElementById('smiley-face');

    const ROWS = 9;
    const COLS = 9;
    const MINES_COUNT = 10;

    let board = [];
    let minesLeft = MINES_COUNT;
    let timer;
    let seconds = 0;
    let gameOver = false;
    let firstClick = true;


    function init() {
  
        board = [];
        minesLeft = MINES_COUNT;
        seconds = 0;
        gameOver = false;
        firstClick = true;
        grid.innerHTML = '';
        smileyFace.innerText = '🙂';
        mineCounter.innerText = formatCounter(minesLeft);
        timerDisplay.innerText = formatCounter(seconds);
        clearInterval(timer);

        for (let r = 0; r < ROWS; r++) {
            board.push(Array(COLS).fill({ isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0 }));
        }

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.addEventListener('click', handleCellClick);
                cell.addEventListener('contextmenu', handleRightClick);
                grid.appendChild(cell);
            }
        }
    }


    function placeMines(firstRow, firstCol) {
        let minesPlaced = 0;
        while (minesPlaced < MINES_COUNT) {
            const r = Math.floor(Math.random() * ROWS);
            const c = Math.floor(Math.random() * COLS);
            if (!(r === firstRow && c === firstCol) && !board[r][c].isMine) {
                board[r][c] = { ...board[r][c], isMine: true };
                minesPlaced++;
            }
        }
        calculateAdjacentMines();
    }
    function calculateAdjacentMines() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c].isMine) continue;
                let count = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        const newRow = r + i;
                        const newCol = c + j;
                        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && board[newRow][newCol].isMine) {
                            count++;
                        }
                    }
                }
                board[r][c] = { ...board[r][c], adjacentMines: count };
            }
        }
    }

    function handleCellClick(e) {
        if (gameOver) return;
        const cell = e.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (firstClick) {
            placeMines(row, col);
            startTimer();
            firstClick = false;
        }

        if (board[row][col].isFlagged || board[row][col].isRevealed) return;
        
        smileyFace.innerText = '😮';
        setTimeout(() => { if (!gameOver) smileyFace.innerText = '🙂'; }, 200);

        revealCell(row, col);
        checkWinCondition();
    }

    function handleRightClick(e) {
        e.preventDefault();
        if (gameOver) return;
        const cell = e.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (board[row][col].isRevealed) return;

        board[row][col] = { ...board[row][col], isFlagged: !board[row][col].isFlagged };

        if (board[row][col].isFlagged) {
            cell.innerText = '🚩';
            minesLeft--;
        } else {
            cell.innerText = '';
            minesLeft++;
        }
        mineCounter.innerText = formatCounter(minesLeft);
    }
    
    function revealCell(row, col) {
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS || board[row][col].isRevealed) {
            return;
        }

        board[row][col] = { ...board[row][col], isRevealed: true };
        const cell = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
        cell.classList.add('revealed');

        if (board[row][col].isMine) {
            cell.innerText = '💣';
            cell.classList.add('mine');
            endGame(false);
            return;
        }

        if (board[row][col].adjacentMines > 0) {
            cell.innerText = board[row][col].adjacentMines;
            cell.classList.add(`c${board[row][col].adjacentMines}`);
        } else {

            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    revealCell(row + i, col + j);
                }
            }
        }
    }

    function checkWinCondition() {
        let revealedCount = 0;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c].isRevealed) {
                    revealedCount++;
                }
            }
        }
        if (revealedCount === ROWS * COLS - MINES_COUNT) {
            endGame(true);
        }
    }

    function endGame(isWin) {
        gameOver = true;
        clearInterval(timer);
        if (isWin) {
            smileyFace.innerText = '😎';
        } else {
            smileyFace.innerText = '😵';
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (board[r][c].isMine) {
                        const cell = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
                        if (!board[r][c].isRevealed) cell.innerText = '💣';
                    }
                }
            }
        }
    }

    function startTimer() {
        timer = setInterval(() => {
            seconds++;
            timerDisplay.innerText = formatCounter(seconds);
        }, 1000);
    }

    function formatCounter(num) {
        return num.toString().padStart(3, '0');
    }

    smileyFace.addEventListener('click', init);

    init();
});
