export default function Tile({ value }) {
  const colors = {
    0: "#f7f9f7",
    2: "#d4f7d4",
    4: "#aef0af",
    8: "#7fe97f",
    16: "#57e257",
    32: "#35d07f",
    64: "#2bb368",
    128: "#229f58",
    256: "#198a48",
    512: "#116438",
    1024: "#0a4027",
    2048: "#053018",
  };

  return (
    <div style={{
      width: "80px",
      height: "80px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors[value] || "#3c3a32",
      borderRadius: "8px",
      fontWeight: "bold",
      fontSize: "24px",
      color: value <= 8 ? "#000" : "#fff",
      boxShadow: "2px 2px 5px rgba(0,0,0,0.2)",
      transition: "all 0.2s ease"
    }}>
      {value !== 0 ? value : ""}
    </div>
  );
}
