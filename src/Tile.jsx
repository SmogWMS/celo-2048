export default function Tile({ value }) {
  const colors = {
    0: "#eee4da",
    2: "#eee4da",
    4: "#ede0c8",
    8: "#f2b179",
    16: "#f59563",
    32: "#f67c5f",
    64: "#f65e3b",
    128: "#edcf72",
    256: "#edcc61",
    512: "#edc850",
    1024: "#edc53f",
    2048: "#edc22e",
  };
  return (
    <div style={{
      width: "80px",
      height: "80px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors[value] || "#3c3a32",
      fontSize: "24px",
      fontWeight: "bold",
      borderRadius: "5px",
    }}>
      {value !== 0 ? value : ""}
    </div>
  );
}
