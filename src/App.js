import { useState } from "react";
import GameBoard from "./GameBoard";
import Web3 from "web3";
import CeloClickerABI from "./CeloClicker.json";
import celoLogo from "./assets/celo-logo.jpg";

function LeaderboardPopup({ leaderboardData, onClose }) {
  const [activeTab, setActiveTab] = useState("best"); // 'best' ou 'total'

  const renderTable = () => {
    const data = activeTab === "best" ? leaderboardData.bestScores : leaderboardData.totalScores;
    if (!data || data.length === 0) {
      return (
        <tr>
          <td colSpan={activeTab === "best" ? 4 : 4} style={{ textAlign: "center" }}>
            Aucun score encore
          </td>
        </tr>
      );
    }

    return data.map((entry, i) => (
      <tr key={i} style={{ textAlign: "center", borderBottom: "1px solid #ddd" }}>
        <td>{i + 1}</td>
        <td>{entry.player.slice(0, 6)}...{entry.player.slice(-4)}</td>
        {activeTab === "best" ? (
          <>
            <td>{entry.score}</td>
            <td>{entry.time}</td>
          </>
        ) : (
          <>
            <td>{entry.scoreTotal}</td>
            <td>{entry.gamesPlayed}</td>
          </>
        )}
      </tr>
    ));
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100
    }}>
      <div style={{
        backgroundColor: "#fff", padding: "20px", borderRadius: "12px",
        width: "600px", maxHeight: "80vh", overflowY: "auto"
      }}>
        <h2 style={{ textAlign: "center" }}>Leaderboard</h2>

        {/* Mini header toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px", gap: "10px" }}>
          <button
            onClick={() => setActiveTab("best")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: activeTab === "best" ? "2px solid #35d07f" : "1px solid #ddd",
              backgroundColor: activeTab === "best" ? "#e0ffe4" : "#f8f8f8",
              cursor: "pointer"
            }}
          >Meilleur score</button>
          <button
            onClick={() => setActiveTab("total")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: activeTab === "total" ? "2px solid #35d07f" : "1px solid #ddd",
              backgroundColor: activeTab === "total" ? "#e0ffe4" : "#f8f8f8",
              cursor: "pointer"
            }}
          >Cumul total</button>
        </div>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Adresse</th>
              {activeTab === "best" ? <>
                <th>Score</th><th>Temps</th>
              </> : <>
                <th>Score total</th><th>Parties jouées</th>
              </>}
            </tr>
          </thead>
          <tbody>
            {renderTable()}
          </tbody>
        </table>

        <button onClick={onClose} style={{
          marginTop: "15px",
          padding: "8px 16px",
          backgroundColor: "#35d07f",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          display: "block",
          marginLeft: "auto",
          marginRight: "auto"
        }}>Fermer</button>
      </div>
    </div>
  );
}


export default function App() {
  const [account, setAccount] = useState(null);
  const [shortAddress, setShortAddress] = useState("");
  const [contract, setContract] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState({ bestScores: [], totalScores: [] });

  const CONTRACT_ADDRESS = "0xfd897a7523f99122ae3ca9b118cf7628dd9c471d";

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Wallet non trouvé");
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);
      setShortAddress(accounts[0].slice(0, 6) + "..." + accounts[0].slice(-4));
      const clickerContract = new web3.eth.Contract(CeloClickerABI, CONTRACT_ADDRESS);
      setContract(clickerContract);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    try {
      const web3 = new Web3("https://forno.celo-sepolia.celo-testnet.org/");
      const readOnlyContract = new web3.eth.Contract(CeloClickerABI, CONTRACT_ADDRESS);

      // Récupération des meilleurs scores et total
      const bestRaw = await readOnlyContract.methods.getBestScores().call();
      const totalRaw = await readOnlyContract.methods.getTotalScores().call();

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

      setLeaderboardData({ bestScores, totalScores });
      setShowLeaderboard(true);
    } catch (e) {
      console.error(e);
      setLeaderboardData({ bestScores: [], totalScores: [] });
      setShowLeaderboard(true);
    }
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-start",
      minHeight: "100vh", padding: "20px",
      backgroundColor: "#fff8e1", fontFamily: "Arial, sans-serif"
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <img src={celoLogo} alt="Celo Logo" style={{ width: "50px", height: "50px" }} />
        <h1>Celo 2048</h1>
      </div>

      {/* Adresse / connect */}
      {!account ? (
        <button onClick={connectWallet} style={{
          padding: "10px 20px", backgroundColor: "#35d07f",
          color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer",
          marginBottom: "20px"
        }}>Connect Wallet</button>
      ) : <p>Adresse : {shortAddress}</p>}

      {/* Leaderboard */}
      <button onClick={fetchLeaderboard} style={{
        padding: "8px 16px", backgroundColor: "#f5b700",
        color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer",
        marginBottom: "20px"
      }}>Leaderboard</button>

      {/* GameBoard */}
      <GameBoard account={account} contract={contract} setLeaderboard={setLeaderboardData} connectWallet={connectWallet} />

      {showLeaderboard && (
        <LeaderboardPopup leaderboardData={leaderboardData} onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
}
