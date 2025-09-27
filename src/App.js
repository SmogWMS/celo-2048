import { useState, useEffect } from "react";
import GameBoard from "./GameBoard";
import Web3 from "web3";
import CeloClickerABI from "./CeloClicker.json";
import celoLogo from "./assets/celo-logo.jpg";

/* --- Réseaux supportés --- */
const NETWORKS = {
  mainnet: {
    chainId: "0xa4ec",
    chainName: "Celo Mainnet",
    rpcUrls: ["https://forno.celo.org"],
    blockExplorerUrls: ["https://celoscan.io"],
    nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
    contractAddress: "0x8e1198805653809F72dA42b8CF049f6337EE65Ed",
  },
  sepolia: {
    chainId: "0xAA044C",
    chainName: "Celo Sepolia Testnet",
    rpcUrls: ["https://forno.celo-sepolia.celo-testnet.org/"],
    blockExplorerUrls: ["https://celoscan.io"],
    nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
    contractAddress: "0xfd897a7523f99122ae3ca9b118cf7628dd9c471d",
  },
};

function LeaderboardPopup({ leaderboardData, onClose }) {
  const [activeTab, setActiveTab] = useState("best");

  const renderTable = () => {
    const data = activeTab === "best" ? leaderboardData.bestScores : leaderboardData.totalScores;
    if (!data || data.length === 0) {
      return (
        <tr>
          <td colSpan={4} style={{ textAlign: "center" }}>No scores yet</td>
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
            <td>{Math.floor(entry.time / 60)}:{(entry.time % 60).toString().padStart(2, '0')}</td>
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
          >Best Score</button>
          <button
            onClick={() => setActiveTab("total")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: activeTab === "total" ? "2px solid #35d07f" : "1px solid #ddd",
              backgroundColor: activeTab === "total" ? "#e0ffe4" : "#f8f8f8",
              cursor: "pointer"
            }}
          >Total Score</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Address</th>
              {activeTab === "best" ? <><th>Score</th><th>Time</th></> : <><th>Total Score</th><th>Games</th></>}
            </tr>
          </thead>
          <tbody>{renderTable()}</tbody>
        </table>
        <button onClick={onClose} style={{
          marginTop: "15px", padding: "8px 16px",
          backgroundColor: "#35d07f", color: "#fff",
          border: "none", borderRadius: "8px",
          cursor: "pointer", display: "block",
          marginLeft: "auto", marginRight: "auto"
        }}>Close</button>
      </div>
    </div>
  );
}

export default function App() {
  const [account, setAccount] = useState(null);
  const [shortAddress, setShortAddress] = useState("");
  const [contract, setContract] = useState(null);
  const [network, setNetwork] = useState("mainnet");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState({ bestScores: [], totalScores: [] });
  const [scoreSaved, setScoreSaved] = useState(false);

  const switchNetwork = async (net) => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: NETWORKS[net].chainId }] });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({ method: "wallet_addEthereumChain", params: [NETWORKS[net]] });
      } else console.error(switchError);
    }
  };

  const connectWallet = async () => {
    const defaultNetwork = "mainnet";
    await switchNetwork(defaultNetwork);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);
      setShortAddress(accounts[0].slice(0, 6) + "..." + accounts[0].slice(-4));
      setContract(new web3.eth.Contract(CeloClickerABI, NETWORKS[defaultNetwork].contractAddress));
      localStorage.setItem("connectedAccount", accounts[0]);
      setNetwork(defaultNetwork);
    } catch (e) { if (e.code !== 4001) console.error(e); }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setShortAddress("");
    setContract(null);
    localStorage.removeItem("connectedAccount");
  };

  useEffect(() => {
    const init = async () => {
      const storedAccount = localStorage.getItem("connectedAccount");
      if (storedAccount && window.ethereum) {
        await switchNetwork("mainnet");
        const web3 = new Web3(window.ethereum);
        setAccount(storedAccount);
        setShortAddress(storedAccount.slice(0, 6) + "..." + storedAccount.slice(-4));
        setContract(new web3.eth.Contract(CeloClickerABI, NETWORKS["mainnet"].contractAddress));
        setNetwork("mainnet");
      }
    };
    init();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const web3 = new Web3(NETWORKS[network].rpcUrls[0]);
      const readOnlyContract = new web3.eth.Contract(CeloClickerABI, NETWORKS[network].contractAddress);

      const bestRaw = await readOnlyContract.methods.getBestScores().call();
      const totalRaw = await readOnlyContract.methods.getTotalScores().call();

      const bestScores = bestRaw[0].map((_, i) => ({
        player: bestRaw[0][i],
        score: parseInt(bestRaw[1][i]),
        time: parseInt(bestRaw[2][i])
      })).sort((a, b) => b.score - a.score);

      const totalScores = totalRaw[0].map((_, i) => ({
        player: totalRaw[0][i],
        scoreTotal: parseInt(totalRaw[1][i]),
        gamesPlayed: parseInt(totalRaw[2][i])
      })).sort((a, b) => b.scoreTotal - a.scoreTotal);

      setLeaderboardData({ bestScores, totalScores });
      setShowLeaderboard(true);
    } catch (e) {
      console.error(e);
      setLeaderboardData({ bestScores: [], totalScores: [] });
      setShowLeaderboard(true);
    }
  };

  const handleNewGame = () => setScoreSaved(false);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-start",
      minHeight: "100vh", padding: "20px",
      backgroundColor: "#fff8e1", fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <img src={celoLogo} alt="Celo Logo" style={{ width: "50px", height: "50px" }} />
        <h1>Celo 2048</h1>
      </div>

      {!account ? (
        <button onClick={connectWallet} style={{
          padding: "10px 20px", backgroundColor: "#35d07f",
          color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer",
          marginBottom: "20px"
        }}>Connect Wallet</button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <p>Addr: {shortAddress}</p>
          <button onClick={disconnectWallet} style={{
            padding: "6px 12px", cursor: "pointer",
            borderRadius: "8px", border: "1px solid #ddd", backgroundColor: "#f8f8f8"
          }}>Disconnect</button>
        </div>
      )}

      <div style={{
        position: "absolute",
        top: 24,
        left: 24,
        zIndex: 10,
        display: "flex",
        justifyContent: "flex-start"
      }}>
        <div style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 4px 16px rgba(53,208,127,0.10)",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          gap: "18px",
          minWidth: "220px"
        }}>
          <span style={{ fontWeight: "bold", fontSize: "15px", color: "#35d07f", marginRight: "8px", letterSpacing: "1px" }}>Network</span>
          <select
            value={network}
            onChange={async (e) => {
              const newNet = e.target.value;
              await switchNetwork(newNet);
              setNetwork(newNet);
              const web3 = new Web3(window.ethereum);
              setContract(new web3.eth.Contract(CeloClickerABI, NETWORKS[newNet].contractAddress));
            }}
            onKeyDown={e => e.preventDefault()}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: "1.5px solid #35d07f",
              backgroundColor: "#f7fff7",
              color: "#222",
              fontWeight: "bold",
              fontSize: "16px",
              boxShadow: "0 2px 8px rgba(53,208,127,0.08)",
              outline: "none",
              cursor: "pointer",
              transition: "border 0.2s, box-shadow 0.2s",
              width: "100%"
            }}
          >
            <option value="mainnet">Celo Mainnet</option>
            <option value="sepolia">Celo Sepolia</option>
          </select>
        </div>
      </div>

      <button onClick={fetchLeaderboard} style={{
        padding: "8px 16px", backgroundColor: "#f5b700",
        color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer",
        marginBottom: "20px"
      }}>Leaderboards</button>

      <GameBoard
        account={account}
        contract={contract}
        setLeaderboard={setLeaderboardData}
        connectWallet={connectWallet}
        scoreSaved={scoreSaved}
        setScoreSaved={setScoreSaved}
        handleNewGame={handleNewGame}
        network={network}
        NETWORKS={NETWORKS}
      />

      {showLeaderboard && (
        <LeaderboardPopup leaderboardData={leaderboardData} onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
}