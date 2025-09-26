import { useState, useEffect } from "react";
import Tile from "./Tile";

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

export default function GameBoard({ account, contract, setLeaderboard, connectWallet }) {
    const [grid, setGrid] = useState(addRandomTile(addRandomTile(emptyGrid())));
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [gameOver, setGameOver] = useState(false);

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

    useEffect(() => {
        let interval = null;
        if (timerActive) interval = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, [timerActive]);

    const slideLeft = (grid) => {
        let newGrid = grid.map(row => {
            let arr = row.filter(v => v !== 0);
            let rowScore = 0;
            for (let i = 0; i < arr.length - 1; i++) {
                if (arr[i] === arr[i + 1]) {
                    arr[i] *= 2;
                    rowScore += arr[i];
                    arr[i + 1] = 0;
                }
            }
            arr = arr.filter(v => v !== 0);
            while (arr.length < SIZE) arr.push(0);
            setScore(prev => prev + rowScore);
            return arr;
        });
        return newGrid;
    };

    const rotateGrid = (grid) => grid[0].map((_, i) => grid.map(row => row[i]));

    const move = (dir) => {
        if (!timerActive) setTimerActive(true);
        let newGrid = JSON.parse(JSON.stringify(grid));
        if (dir === "left") newGrid = slideLeft(newGrid);
        if (dir === "right") { newGrid = newGrid.map(r => r.reverse()); newGrid = slideLeft(newGrid); newGrid = newGrid.map(r => r.reverse()); }
        if (dir === "up") { newGrid = rotateGrid(newGrid); newGrid = slideLeft(newGrid); newGrid = rotateGrid(newGrid); }
        if (dir === "down") { newGrid = rotateGrid(newGrid); newGrid = newGrid.map(r => r.reverse()); newGrid = slideLeft(newGrid); newGrid = newGrid.map(r => r.reverse()); newGrid = rotateGrid(newGrid); }
        if (JSON.stringify(newGrid) !== JSON.stringify(grid)) setGrid(addRandomTile(newGrid));
        if (isGameOver(newGrid)) {
            setGameOver(true);
            setTimerActive(false);
        }
    };

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
        setScore(0);
        setTimer(0);
        setTimerActive(false);
        setGameOver(false);
    };

    const switchToCeloSepolia = async () => {
        if (!window.ethereum) return;
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xAA044C' }], // CELO_CHAIN_ID
            });
        } catch (switchError) {
            // Si le réseau n'existe pas dans MetaMask, l'ajouter
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0xAA044C',
                        chainName: 'Celo Sepolia Testnet',
                        nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
                        rpcUrls: ['https://forno.celo-sepolia.celo-testnet.org/'],
                        blockExplorerUrls: ['https://celoscan.io']
                    }],
                });
            } else {
                console.error(switchError);
            }
        }
    };

    const saveScoreOnChain = async () => {
        if (!contract || !account) return alert("Wallet non connecté ou contrat indisponible");

        try {
            await switchToCeloSepolia();

            // Envoie de la transaction
            await contract.methods.saveScore(score, timer).send({ from: account });

            // Mise à jour du leaderboard après sauvegarde
            const bestRaw = await contract.methods.getBestScores().call();
            const totalRaw = await contract.methods.getTotalScores().call();

            const bestScores = bestRaw[0].map((_, i) => ({
                player: bestRaw[0][i],
                score: parseInt(bestRaw[1][i]),
                time: parseInt(bestRaw[2][i])
            }));

            const totalScores = totalRaw[0].map((_, i) => ({
                player: totalRaw[0][i],
                scoreTotal: parseInt(totalRaw[1][i]),
                gamesPlayed: parseInt(totalRaw[2][i])
            }));

            setLeaderboard({ bestScores, totalScores });
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la sauvegarde : " + (e.message || e));
        }
    };


    return (
        <>
            {gameOver && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100
                }}>
                    <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "12px", textAlign: "center", width: "300px" }}>
                        <h2>Game Over !</h2>
                        <p>Score: {score}</p>
                        <p>Temps: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}</p>
                        <button onClick={restartGame} style={{
                            padding: "10px 20px",
                            backgroundColor: "#35d07f",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            marginTop: "15px",
                            marginRight: "10px"
                        }}>Rejouer</button>

                        {!account && (
                            <button
                                onClick={async () => {
                                    await connectWallet(); // se connecter
                                    if (account && contract) {
                                        await saveScoreOnChain(); // puis sauvegarder
                                    }
                                }}
                                style={{
                                    padding: "10px 20px",
                                    backgroundColor: "#3498db",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    marginTop: "15px"
                                }}
                            >
                                Connecter et sauvegarder
                            </button>
                        )}

                        {account && (
                            <button onClick={saveScoreOnChain} style={{
                                padding: "10px 20px",
                                backgroundColor: "#f5b700",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                marginTop: "15px"
                            }}>Sauvegarder</button>
                        )}
                    </div>
                </div>
            )}

            <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginBottom: "20px", fontWeight: "bold" }}>
                <p>Score: {score}</p>
                <p>Temps: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}</p>
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${SIZE},80px)`,
                    gap: "10px",
                    backgroundColor: "#fff8e1",
                    padding: "16px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
                }}>
                    {grid.map((row, i) => row.map((val, j) => <Tile key={`${i}-${j}`} value={val} />))}
                </div>
            </div>
        </>
    );
}
