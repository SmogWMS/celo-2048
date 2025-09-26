import GameBoard from "./GameBoard";
import celoLogo from "./assets/celo-logo.jpg";

export default function App() {
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "100vh",
      backgroundColor: "#fff8e1" 
    }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
        <img src={celoLogo} alt="Celo Logo" style={{ width: "60px", height: "60px", marginRight: "10px" }} />
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#000000" }}>
          Celo 2048
        </h1>
      </div>

      <GameBoard />
    </div>
  );
}
