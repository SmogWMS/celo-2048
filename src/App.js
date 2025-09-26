import { useState } from "react";
import GameBoard from "./GameBoard";
import Web3 from "web3";
import CeloClickerABI from "./CeloClicker.json"; 
import celoLogo from "./assets/celo-logo.jpg";

function LeaderboardPopup({ leaderboard, onClose }) {
  return (
    <div style={{
      position:"fixed",
      top:0,left:0,right:0,bottom:0,
      backgroundColor:"rgba(0,0,0,0.5)",
      display:"flex",
      justifyContent:"center",
      alignItems:"center",
      zIndex:100
    }}>
      <div style={{
        backgroundColor:"#fff",
        padding:"20px",
        borderRadius:"12px",
        width:"400px",
        maxHeight:"80vh",
        overflowY:"auto"
      }}>
        <h2 style={{textAlign:"center"}}>Leaderboard</h2>
        <table style={{width:"100%", borderCollapse:"collapse"}}>
          <thead>
            <tr>
              <th>#</th>
              <th>Adresse</th>
              <th>Score</th>
              <th>Temps</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={4} style={{textAlign:"center"}}>Aucun score encore</td>
              </tr>
            ) : leaderboard.map((entry,i)=>(
              <tr key={i} style={{textAlign:"center", borderBottom:"1px solid #ddd"}}>
                <td>{i+1}</td>
                <td>{entry.player.slice(0,6)}...{entry.player.slice(-4)}</td>
                <td>{entry.score}</td>
                <td>{entry.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={onClose} style={{
          marginTop:"15px",
          padding:"8px 16px",
          backgroundColor:"#35d07f",
          color:"#fff",
          border:"none",
          borderRadius:"8px",
          cursor:"pointer",
          display:"block",
          marginLeft:"auto",
          marginRight:"auto"
        }}>Fermer</button>
      </div>
    </div>
  )
}

export default function App() {
  const [account,setAccount] = useState(null);
  const [shortAddress,setShortAddress] = useState("");
  const [leaderboard,setLeaderboard] = useState([]);
  const [contract,setContract] = useState(null);
  const [showLeaderboard,setShowLeaderboard] = useState(false);

  const connectWallet = async ()=>{
    if(window.ethereum){
      try{
        await window.ethereum.request({method:"eth_requestAccounts"});
        const web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);
        setShortAddress(accounts[0].slice(0,6)+"..."+accounts[0].slice(-4));

        const clickerContract = new web3.eth.Contract(
          CeloClickerABI,
          "0x9ca48c428000a4abd84fb60b22c74e2bf7d65323"
        );
        setContract(clickerContract);
      }catch(e){
        console.error(e);
      }
    }
  };

  const fetchLeaderboard = async ()=>{
    if(contract){
      try{
        const data = await contract.methods.getLeaderboard().call();
        const formatted = data.map(d=>({player:d.player, score:d.score, time:d.time || "00:00"}));
        setLeaderboard(formatted);
        setShowLeaderboard(true);
      }catch(e){
        console.error(e);
        setLeaderboard([]);
        setShowLeaderboard(true);
      }
    }else{
      setLeaderboard([]);
      setShowLeaderboard(true);
    }
  };

  return (
    <div style={{
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      justifyContent:"flex-start",
      minHeight:"100vh",
      padding:"20px",
      backgroundColor:"#fff8e1",
      fontFamily:"Arial, sans-serif",
      overflow:"hidden"
    }}>
      {/* Logo et titre */}
      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"20px" }}>
        <img src={celoLogo} alt="Celo Logo" style={{ width:"50px", height:"50px" }} />
        <h1>Celo 2048</h1>
      </div>

      {/* Connect Wallet / Adresse */}
      {!account ? (
        <button onClick={connectWallet} style={{
          padding:"10px 20px",
          backgroundColor:"#35d07f",
          color:"#fff",
          border:"none",
          borderRadius:"8px",
          cursor:"pointer",
          marginBottom:"20px"
        }}>Connect Wallet</button>
      ) : (
        <div style={{ marginBottom:"20px", textAlign:"center" }}>
          <p>Adresse : {shortAddress}</p>
        </div>
      )}

      {/* Leaderboard */}
      <button onClick={fetchLeaderboard} style={{
        padding:"8px 16px",
        backgroundColor:"#f5b700",
        color:"#fff",
        border:"none",
        borderRadius:"8px",
        cursor:"pointer",
        marginBottom:"20px"
      }}>Leaderboard</button>

      {/* Plateau de jeu */}
      <GameBoard account={account} contract={contract} setLeaderboard={setLeaderboard} />

      {showLeaderboard && (
        <LeaderboardPopup leaderboard={leaderboard} onClose={()=>setShowLeaderboard(false)} />
      )}
    </div>
  );
}
