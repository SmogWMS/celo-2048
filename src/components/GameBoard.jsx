import React, { useState, useEffect, useRef } from "react";
import Tile from "./Tile";
import { getSize, emptyGrid, addRandomTile, isGameOver, moveGrid } from "../utils/gameLogic";

export default function GameBoard({ account, contract, scoreSaved, setScoreSaved, connectWallet, gameMode }) {
    // Mobile swipe
    const touchStartRef = useRef(null);
    const touchEndRef = useRef(null);

    const getSwipeDirection = (start, end) => {
        if (!start || !end) return null;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 30) return "right";
            if (dx < -30) return "left";
        } else {
            if (dy > 30) return "down";
            if (dy < -30) return "up";
        }
        return null;
    };

    const handleTouchStart = (e) => {
        if (e.touches && e.touches.length === 1) {
            touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    };

    const handleTouchEnd = (e) => {
        if (e.changedTouches && e.changedTouches.length === 1) {
            touchEndRef.current = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
            const direction = getSwipeDirection(touchStartRef.current, touchEndRef.current);
            if (direction) handleMove(direction);
        }
    };

    const size = getSize(gameMode);

    const [grid, setGrid] = useState(() => addRandomTile(addRandomTile(emptyGrid(size))));
    const [mergedGrid, setMergedGrid] = useState(() => emptyGrid(size));
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [timer, setTimer] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
        const fetchBestScore = async () => {
            if (!contract) return;
            try {
                const bestRaw = await contract.methods.getBestScores().call();
                if (bestRaw && bestRaw[1] && bestRaw[1].length > 0) {

                    const scores = bestRaw[1].map(s => parseInt(s));
                    const maxScore = Math.max(...scores);
                    setBestScore(maxScore);
                }
            } catch (err) {
                console.error("Failed to fetch best score:", err);
            }
        };
        fetchBestScore();
    }, [contract]);

    // Réinitialise grille, score et timer si le mode ou la taille change
    useEffect(() => {
        setGrid(addRandomTile(addRandomTile(emptyGrid(size))));
        setMergedGrid(emptyGrid(size));
        setScore(0);
        setGameOver(false);
        setTimer(0);
        setTimerActive(false);
    }, [size, gameMode]);

    // Timer effect
    useEffect(() => {
        if (!timerActive || gameOver) return;
        const interval = setInterval(() => {
            setTimer(prev => {
                if (gameMode === "time" && prev >= 59) {
                    clearInterval(interval);
                    setGameOver(true);
                    setTimerActive(false);
                    return 60;
                }
                return prev + 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timerActive, gameOver, gameMode]);

    // Keyboard controls
    useEffect(() => {
        const handleKey = (e) => {
            if (gameOver) return;
            if (e.key === "ArrowLeft") handleMove("left");
            if (e.key === "ArrowRight") handleMove("right");
            if (e.key === "ArrowUp") handleMove("up");
            if (e.key === "ArrowDown") handleMove("down");
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [grid, gameOver]);

    const handleMove = (dir) => {
        if (!timerActive) setTimerActive(true);

        const result = moveGrid(grid, dir);
        if (!result) return;

        setScore(prev => {
            const newScore = prev + result.gainedScore;
            if (newScore > bestScore) setBestScore(newScore);
            return newScore;
        });

        if (JSON.stringify(result.grid) !== JSON.stringify(grid)) {
            setGrid(addRandomTile(result.grid));
            setMergedGrid(result.merged);
            if (isGameOver(result.grid)) setGameOver(true);
        } else {
            setMergedGrid(emptyGrid(size));
        }
    };

    const restartGame = () => {
        setGrid(addRandomTile(addRandomTile(emptyGrid(size))));
        setMergedGrid(emptyGrid(size));
        setScore(0);
        setTimer(0);
        setTimerActive(false);
        setGameOver(false);
        setScoreSaved(false);
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
        await connectWallet();
        setTimeout(() => saveScore(), 500);
    };

    return (
        <>
            {/* Game Over Popup */}
            {gameOver && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.7)", display: "flex",
                    justifyContent: "center", alignItems: "center", zIndex: 100
                }}>
                    <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "12px", textAlign: "center", width: "300px" }}>
                        <h2>Game Over !</h2>
                        <p>Score: {score}</p>
                        <p>Time: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}</p>
                        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "15px" }}>
                            <button onClick={restartGame} style={{ padding: "10px 20px", backgroundColor: "#35d07f", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>Replay</button>
                            {!account ? (
                                <button onClick={connectAndSave} disabled={scoreSaved} style={{ padding: "10px 20px", backgroundColor: scoreSaved ? "#ccc" : "#f5b700", color: "#fff", border: "none", borderRadius: "8px", cursor: scoreSaved ? "not-allowed" : "pointer" }}>
                                    {scoreSaved ? "Score Saved" : "Connect & Save"}
                                </button>
                            ) : (
                                <button onClick={saveScore} disabled={scoreSaved || !contract} style={{ padding: "10px 20px", backgroundColor: scoreSaved ? "#ccc" : "#f5b700", color: "#fff", border: "none", borderRadius: "8px", cursor: scoreSaved ? "not-allowed" : "pointer" }}>
                                    {scoreSaved ? "Score Saved" : "Save"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Score / Best Score / Time Panel */}
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "20px",
                marginBottom: "15px",
            }}>
                {/** Score */}
                <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    background: "#fff", padding: "6px 12px", borderRadius: "10px",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.1)", minWidth: "60px",
                }}>
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: "#666" }}>Score</span>
                    <span style={{ fontSize: "16px", fontWeight: "bold", color: "#222" }}>{score}</span>
                </div>

                {/** Best Score */}
                <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    background: "#fff", padding: "6px 12px", borderRadius: "10px",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.1)", minWidth: "60px",
                }}>
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: "#666" }}>Best Score</span>
                    <span style={{ fontSize: "16px", fontWeight: "bold", color: "#222" }}>{bestScore}</span>
                </div>

                {/** Time */}
                <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    background: "#fff", padding: "6px 12px", borderRadius: "10px",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.1)", minWidth: "60px",
                }}>
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: "#666" }}>Time</span>
                    <span style={{ fontSize: "16px", fontWeight: "bold", color: "#222" }}>
                        {gameMode === "time"
                            ? `${Math.max(0, 60 - timer)}s`
                            : `${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, "0")}`}
                    </span>
                </div>
            </div>

            {/* Game Board Grid */}
            <div
                className="game-board-grid"
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${size}, minmax(0, 80px))`,
                    gap: window.innerWidth <= 600 ? "6px" : "10px",
                    backgroundColor: "#fff8e1",
                    padding: window.innerWidth <= 600 ? "8px" : "16px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                    justifyContent: "center",
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {grid.map((row, i) => row.map((val, j) => (
                    <Tile key={`${i}-${j}`} value={val} merged={mergedGrid[i][j]} />
                )))}
            </div>
        </>
    );
}
