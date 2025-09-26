import { useState } from "react";
import GameBoard from "./GameBoard";
import celoLogo from "./assets/celo-logo.jpg";

export default function App() {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
      } catch (err) {
        console.error(err);
      }
    } else {
      alert("Installez un wallet compatible !");
    }
  };

  const shortAddress = account ? `${account.slice(0,6)}...${account.slice(-3)}` : "";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#fff8e1",
      fontFamily: "sans-serif",
      padding: "20px",
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
        <img src={celoLogo} alt="Celo Logo" style={{ width:"50px", height:"50px" }} />
        <h1 style={{ margin:0, fontSize:"2rem" }}>Celo 2048</h1>
      </div>

      {/* Wallet connect */}
      {!account && (
        <button onClick={connectWallet} style={{
          padding:"10px 20px",
          backgroundColor:"#35d07f",
          color:"#fff",
          border:"none",
          borderRadius:"8px",
          cursor:"pointer",
          marginBottom:"20px"
        }}>Connect Wallet</button>
      )}

      {/* Score + Adresse + Timer seront affichés dans GameBoard */}
      <GameBoard account={account} shortAddress={shortAddress} />
    </div>
  );
}
