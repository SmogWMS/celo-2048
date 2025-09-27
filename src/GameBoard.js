import { useState, useEffect } from "react";
import Tile from "./Tile";
import Web3 from "web3";
import Celo2048Leaderboard from "./CeloClicker.json";

const SIZE = 4;
const emptyGrid = () => Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));

const addRandomTile = (grid) => {
    const emptyCells = [];
    grid.forEach((row, i) => row.forEach((cell, j) => { if (cell === 0) emptyCells.push([i, j]); }));
    if (emptyCells.length === 0) return grid;
    const [x, y] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    grid[x][y] = Math.random() < 0.9 ? 2 : 4;
    return grid;
};

export default function GameBoard({ handleNewGame, account, setAccount, contract, setContract, scoreSaved, setScoreSaved, network, NETWORKS, connectWallet }) {
    const [grid, setGrid] = useState(addRandomTile(addRandomTile(emptyGrid())));
    const [mergedGrid, setMergedGrid] = useState(emptyGrid());
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
        let interval = null;
        if (timerActive && !gameOver) {
            interval = setInterval(() => setTimer(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive, gameOver]);

    const isGameOver = (grid) => {
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {
                if (grid[i][j] === 0) return false;
                if (i < SIZE - 1 && grid[i][j] === grid[i + 1][j]) return false;
                if (j < SIZE - 1 && grid[i][j] === grid[i][j + 1]) return false;
            }
        }
        return true;
    };

    const slideLeft = (grid) => {
        const newMerged = emptyGrid();
        const newGrid = grid.map((row, i) => {
            let arr = row.filter(v => v !== 0);
            let rowScore = 0;
            let mergedRow = Array(SIZE).fill(false);
            for (let j = 0; j < arr.length - 1; j++) {
                if (arr[j] === arr[j + 1]) {
                    arr[j] *= 2;
                    rowScore += arr[j];
                    arr[j + 1] = 0;
                    mergedRow[j] = true;
                }
            }
            arr = arr.filter(v => v !== 0);
            while (arr.length < SIZE) arr.push(0);
            setScore(prev => prev + rowScore);
            for (let k = 0; k < SIZE; k++) newMerged[i][k] = mergedRow[k];
            return arr;
        });
        return { grid: newGrid, merged: newMerged };
    };

    const rotateGrid = (grid) => grid[0].map((_, i) => grid.map(row => row[i]));

    const move = (dir) => {
        if (!timerActive) setTimerActive(true);
        let workingGrid = JSON.parse(JSON.stringify(grid));
        let mergedResult;
        if (dir === "left") mergedResult = slideLeft(workingGrid);
        else if (dir === "right") {
            workingGrid = workingGrid.map(r => r.reverse());
            mergedResult = slideLeft(workingGrid);
            mergedResult.grid = mergedResult.grid.map(r => r.reverse());
            mergedResult.merged = mergedResult.merged.map(r => r.reverse());
        } else if (dir === "up") {
            workingGrid = rotateGrid(workingGrid);
            mergedResult = slideLeft(workingGrid);
            mergedResult.grid = rotateGrid(mergedResult.grid);
            mergedResult.merged = rotateGrid(mergedResult.merged);
        } else if (dir === "down") {
            workingGrid = rotateGrid(workingGrid);
            workingGrid = workingGrid.map(r => r.reverse());
            mergedResult = slideLeft(workingGrid);
            mergedResult.grid = mergedResult.grid.map(r => r.reverse());
            mergedResult.merged = mergedResult.merged.map(r => r.reverse());
            mergedResult.grid = rotateGrid(mergedResult.grid);
            mergedResult.merged = rotateGrid(mergedResult.merged);
        }

        if (mergedResult && JSON.stringify(mergedResult.grid) !== JSON.stringify(grid)) {
            setGrid(addRandomTile(mergedResult.grid));
            setMergedGrid(mergedResult.merged);
            if (isGameOver(mergedResult.grid)) setGameOver(true);
        } else setMergedGrid(emptyGrid());
    };

    // Keyboard
    useEffect(() => {
        const handleKey = (e) => {
            if (gameOver) return;
            if (e.key === "ArrowLeft") move("left");
            if (e.key === "ArrowRight") move("right");
            if (e.key === "ArrowUp") move("up");
            if (e.key === "ArrowDown") move("down");
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [grid, gameOver]);

    const restartGame = () => {
        setGrid(addRandomTile(addRandomTile(emptyGrid())));
        setMergedGrid(emptyGrid());
        setScore(0);
        setTimer(0);
        setTimerActive(false);
        setGameOver(false);
        setScoreSaved(false);
        handleNewGame();
    };

    const saveScore = async () => {
        if (!contract || scoreSaved || !account) return;
        try {
            await contract.methods.saveScore(score, timer).send({ from: account });
            setScoreSaved(true);
        } catch (err) {
            console.error(err);
        }
    };

    const connectAndSave = async () => {
        if (!window.ethereum) return alert("Veuillez installer un wallet");
        try {
            await connectWallet();
            setTimeout(() => {
                saveScore();
            }, 500);
        } catch (err) {
            console.error(err);
        }
    };

    // ...existing code...

    return (
        <>
            {gameOver && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
                    <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "12px", textAlign: "center", width: "300px" }}>
                        <h2>Game Over !</h2>
                        <p>Score: {score}</p>
                        <p>Time: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}</p>
                        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "15px" }}>
                            <button
                                onClick={restartGame}
                                style={{ padding: "10px 20px", backgroundColor: "#35d07f", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
                            >
                                Replay
                            </button>

                            {!account ? (
                                <button
                                    onClick={connectAndSave}
                                    disabled={scoreSaved}
                                    style={{ padding: "10px 20px", backgroundColor: scoreSaved ? "#ccc" : "#f5b700", color: "#fff", border: "none", borderRadius: "8px", cursor: scoreSaved ? "not-allowed" : "pointer" }}
                                >
                                    {scoreSaved ? "Score Saved" : "Connect & Save"}
                                </button>
                            ) : (
                                <button
                                    onClick={saveScore}
                                    disabled={scoreSaved || !contract}
                                    style={{
                                        padding: "10px 20px",
                                        backgroundColor: scoreSaved ? "#ccc" : "#f5b700",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: scoreSaved ? "not-allowed" : "pointer"
                                    }}
                                >
                                    {scoreSaved ? "Score Saved" : "Save"}
                                </button>
                            )}

                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginBottom: "20px", fontWeight: "bold" }}>
                <p>Score: {score}</p>
                <p>Time: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}</p>
            </div>

            {/* Plateau */}
            <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${SIZE},80px)`,
                gap: "10px",
                backgroundColor: "#fff8e1",
                padding: "16px",
                borderRadius: "12px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                justifyContent: "center"
            }}>
                {grid.map((row, i) =>
                    row.map((val, j) => <Tile key={`${i}-${j}`} value={val} merged={mergedGrid[i][j]} />)
                )}
            </div>
        </>
    );
}
