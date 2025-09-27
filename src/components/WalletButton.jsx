import { FiLogOut } from "react-icons/fi";

export default function WalletButton({ account, shortAddress, connectWallet, disconnectWallet }) {
  if(!account){
    return <button onClick={connectWallet} style={{padding:"10px 20px",backgroundColor:"#35d07f",color:"#fff",border:"none",borderRadius:"8px",cursor:"pointer"}}>Connect Wallet</button>
  }
  return (
    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
      <p>{shortAddress}</p>
      <button onClick={disconnectWallet} style={{background:"none",border:"none",padding:"6px",borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseOver={e=>e.currentTarget.style.background="#f5b70022"} onMouseOut={e=>e.currentTarget.style.background="none"}>
        <FiLogOut size={22} color="#f5b700"/>
      </button>
    </div>
  )
}
