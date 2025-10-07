import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { AppKitProvider } from "./librairies/appKit";
import ConnectButton from "./components/ConnectButton";
import GameBoard from "./components/GameBoard";
import LeaderboardPopup from "./components/LeaderboardPopup";
import celoLogo from "./assets/celo-logo.jpg";
import "./index.css";
import Web3 from "web3";
import Celo_2048_ABI from "./Celo2048_ABI.json";

function Root() {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState({
    bestScores: [],
    totalScores: [],
  });

  // Récupérer scores depuis le smart contract
  useEffect(() => {
    async function fetchLeaderboard() {
      if (!window.ethereum) return;

      try {
        const web3 = new Web3(window.ethereum);
        const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS_CELO_SEPOLIA;
        const contract = new web3.eth.Contract(Celo_2048_ABI, contractAddress);

        // Best Scores
        const bestRaw = await contract.methods.getBestScores().call();
        const bestAddrs = bestRaw[0];
        const bestScoresArr = bestRaw[1];
        const bestTimes = bestRaw[2];

        const bestScores = bestAddrs.map((addr, i) => ({
          player: addr,
          score: parseInt(bestScoresArr[i]),
          time: parseInt(bestTimes[i]),
        }));

        // Total Scores
        const totalRaw = await contract.methods.getTotalScores().call();
        const totalAddrs = totalRaw[0];
        const totalScoresArr = totalRaw[1];
        const totalGames = totalRaw[2];

        const totalScores = totalAddrs.map((addr, i) => ({
          player: addr,
          scoreTotal: parseInt(totalScoresArr[i]),
          gamesPlayed: parseInt(totalGames[i]),
        }));

        setLeaderboardData({ bestScores, totalScores });
      } catch (err) {
        console.error("Erreur récupération leaderboard:", err);
      }
    }

    fetchLeaderboard();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        padding: "20px",
        backgroundColor: "#fff8e1",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <img src={celoLogo} alt="Celo Logo" style={{ width: "50px", height: "50px" }} />
        <h1 style={{ fontSize: "1.8rem", fontWeight: "bold" }}>Celo 2048</h1>
      </div>

      {/* Connect Wallet */}
      <ConnectButton />

      {/* Leaderboard */}
      <button
        onClick={() => setShowLeaderboard(true)}
        style={{
          padding: "8px 16px",
          backgroundColor: "#f5b700",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          margin: "20px 0",
        }}
      >
        Leaderboards
      </button>

      {/* GameBoard */}
      <GameBoard />

      {/* Popup leaderboard */}
      {showLeaderboard && (
        <LeaderboardPopup
          leaderboardData={leaderboardData}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppKitProvider>
      <Root />
    </AppKitProvider>
  </React.StrictMode>
);
