import { useState } from "react";
import Web3 from "web3";
import { CELO_CHAIN_ID, CELO_PARAMS } from "./celoConfig";
import celoLogo from "./assets/celo-logo.jpg";
import GameBoard from "./GameBoard";

export default function App() {
  const [account, setAccount] = useState(null);
  const [score, setScore] = useState(0);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Installez Metamask ou un wallet compatible Celo !");
    const web3 = new Web3(window.ethereum);

    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== CELO_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: CELO_CHAIN_ID }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [CELO_PARAMS],
            });
          } else {
            console.error(switchError);
            return;
          }
        }
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      window.ethereum.on("accountsChanged", (accounts) => setAccount(accounts[0] || null));
    } catch (err) {
      console.error(err);
      alert("Erreur connexion wallet: " + err.message);
    }
  };

  const shortAddress = (addr) => {
    if (!addr) return "";
    return addr.slice(0, 4) + "..." + addr.slice(-3);
  };

  return (
    <div style={{
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  minHeight: "100vh",
  backgroundColor: "#fff8e1", // couleur jaunée Celo
  overflow: "hidden",
  padding: "20px",
}}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
        <img src={celoLogo} alt="Celo Logo" style={{ width: "50px", height: "50px", marginRight: "10px" }} />
        <h1 style={{ color: "#35d07f", margin: 0 }}>Celo 2048</h1>
      </div>

      {/* Score et wallet */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        maxWidth: "400px",
        marginBottom: "30px"
      }}>
        <div style={{ fontWeight: "bold", fontSize: "1.2rem", color: "#35d07f" }}>
          Score: {score}
        </div>

        {!account ? (
          <button onClick={connectWallet} style={{
            padding: "8px 15px",
            backgroundColor: "#35d07f",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}>
            Connect Wallet
          </button>
        ) : (
          <p style={{ fontWeight: "bold" }}>Addr: {shortAddress(account)}</p>
        )}
      </div>

      {/* Plateau de jeu centré */}
      <div style={{
        flexGrow: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%"
      }}>
        <GameBoard setScore={setScore} />
      </div>
    </div>
  );
}
