import { NETWORKS } from "../hooks/useWeb3";

export default function NetworkSelector({ network, setNetwork, switchNetwork }) {
  const handleChange = async (e) => {
    const newNet = e.target.value;
    await switchNetwork(newNet);
    setNetwork(newNet);
  };

  return (
    <select value={network} onChange={handleChange} style={{padding:"10px 18px",borderRadius:"10px",border:"1.5px solid #35d07f",backgroundColor:"#f7fff7",fontWeight:"bold",fontSize:"16px",outline:"none",cursor:"pointer"}}>
      {Object.keys(NETWORKS).map(net => <option key={net} value={net}>{NETWORKS[net].chainName}</option>)}
    </select>
  )
}
