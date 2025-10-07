import React, { useState, useEffect, useRef } from "react";
import Tile from "./Tile";
import { getSize, emptyGrid, addRandomTile, isGameOver, moveGrid } from "../utils/gameLogic";
import { useAccount } from "wagmi";
import { getAppKit, openConnectModal } from "../librairies/appKit";

export default function GameBoard({ gameMode }) {
    const { address, isConnected } = useAccount();
    const appKit = getAppKit();

    const touchStartRef = useRef(null);
    const touchEndRef = useRef(null);

    const size = getSize(gameMode);
    const [grid, setGrid] = useState(() => addRandomTile(addRandomTile(emptyGrid(size))));
    const [mergedGrid, setMergedGrid] = useState(() => emptyGrid(size));
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [timer, setTimer] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [contract, setContract] = useState(null);
    const [scoreSaved, setScoreSaved] = useState(false); 

    // Swipe helpers
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
    const handleTouchStart = (e) => { if (e.touches && e.touches.length === 1) touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const handleTouchEnd = (e) => {
        if (e.changedTouches && e.changedTouches.length === 1) {
            touchEndRef.current = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
            const dir = getSwipeDirection(touchStartRef.current, touchEndRef.current);
            if (dir) handleMove(dir);
        }
    };

    // Init contract
    useEffect(() => {
        if (!appKit || !isConnected) return;
        const network = appKit.networks?.[0];
        if (!network || !network.contractAddress || !appKit.adapters?.[0]?.web3) return;
        const web3 = appKit.adapters[0].web3;
        const c = new web3.eth.Contract(network.abi, network.contractAddress);
        setContract(c);
    }, [appKit, isConnected]);

    // Fetch best score
    useEffect(() => {
        const fetchBestScore = async () => {
            if (!contract || !address) return;
            try {
                const bestRaw = await contract.methods.getBestScores().call();
                if (bestRaw?.[0] && bestRaw?.[1]) {
                    const index = bestRaw[0].findIndex(addr => addr.toLowerCase() === address.toLowerCase());
                    setBestScore(index !== -1 ? parseInt(bestRaw[1][index]) : 0);
                }
            } catch (err) { console.error(err); }
        };
        fetchBestScore();
    }, [contract, address]);

    // Reset game on size/mode change
    useEffect(() => {
        setGrid(addRandomTile(addRandomTile(emptyGrid(size))));
        setMergedGrid(emptyGrid(size));
        setScore(0);
        setTimer(0);
        setTimerActive(false);
        setGameOver(false);
        setScoreSaved(false);
    }, [size, gameMode]);

    // Timer
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

    // Keyboard
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

    // Move grid
    const handleMove = (dir) => {
        if (!timerActive) setTimerActive(true);
        const result = moveGrid(grid, dir);
        if (!result) return;
        setScore(prev => { const n = prev + result.gainedScore; if (n > bestScore) setBestScore(n); return n; });
        if (JSON.stringify(result.grid) !== JSON.stringify(grid)) {
            setGrid(addRandomTile(result.grid));
            setMergedGrid(result.merged);
            if (isGameOver(result.grid)) setGameOver(true);
        } else setMergedGrid(emptyGrid(size));
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
        if (!contract || !isConnected || scoreSaved) return;
        try { await contract.methods.saveScore(score, timer).send({ from: address }); setScoreSaved(true); }
        catch (err) { console.error(err); }
    };

    const connectAndSave = async () => {
        if (!isConnected) await openConnectModal();
        else saveScore();
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
                            {!isConnected ? (
                                <button onClick={connectAndSave} style={{ padding: "10px 20px", backgroundColor: "#f5b700", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>Connect & Save</button>
                            ) : (
                                <button onClick={saveScore} style={{ padding: "10px 20px", backgroundColor: "#f5b700", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>{scoreSaved ? "Score Saved" : "Save"}</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Score Panel */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginBottom: "15px" }}>
                {/** Score */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#fff", padding: "6px 12px", borderRadius: "10px", boxShadow: "0 3px 8px rgba(0,0,0,0.1)", minWidth: "60px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: "#666" }}>Score</span>
                    <span style={{ fontSize: "16px", fontWeight: "bold", color: "#222" }}>{score}</span>
                </div>
                {/** Best Score */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#fff", padding: "6px 12px", borderRadius: "10px", boxShadow: "0 3px 8px rgba(0,0,0,0.1)", minWidth: "60px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: "#666" }}>Best Score</span>
                    <span style={{ fontSize: "16px", fontWeight: "bold", color: "#222" }}>{bestScore}</span>
                </div>
                {/** Time */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#fff", padding: "6px 12px", borderRadius: "10px", boxShadow: "0 3px 8px rgba(0,0,0,0.1)", minWidth: "60px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: "#666" }}>Time</span>
                    <span style={{ fontSize: "16px", fontWeight: "bold", color: "#222" }}>{gameMode === "time" ? `${Math.max(0, 60 - timer)}s` : `${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, "0")}`}</span>
                </div>
            </div>

            {/* Game Board Grid */}
            <div className="game-board-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${size}, minmax(0, 80px))`, gap: window.innerWidth <= 600 ? "6px" : "10px", backgroundColor: "#fff8e1", padding: window.innerWidth <= 600 ? "8px" : "16px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.15)", justifyContent: "center" }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                {grid.map((row, i) => row.map((val, j) => <Tile key={`${i}-${j}`} value={val} merged={mergedGrid[i][j]} />))}
            </div>
        </>
    );
}
