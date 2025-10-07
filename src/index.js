import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { sdk } from "@farcaster/miniapp-sdk";
import { AppKitProvider } from "./librairies/appKit";
import ConnectButton from "./components/ConnectButton";
import GameBoard from "./components/GameBoard";
import LeaderboardPopup from "./components/LeaderboardPopup";
import celoLogo from "./assets/celo-logo.jpg";
import "./index.css";

function Root() {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState({
    bestScores: [],
    totalScores: [],
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  // Responsive
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Init Farcaster SDK
  useEffect(() => {
    async function initFarcaster() {
      if (!sdk?.actions) return;
      try {
        await sdk.actions.ready({ disableNativeGestures: true });
        const context = await sdk.context.get().catch(() => null);

        if (context?.client?.added === false && !localStorage.getItem("farcasterPromptShown")) {
          const confirmAdd = window.confirm(
            "Add Celo 2048 to your Farcaster Mini Apps for quick access?"
          );
          if (confirmAdd) {
            try {
              await sdk.actions.addMiniApp();
              console.log("Mini App added");
            } catch (e) {
              console.error("addMiniApp failed", e);
            }
          }
          localStorage.setItem("farcasterPromptShown", "true");
        }
      } catch (e) {
        console.warn("Farcaster SDK error", e);
      }
    }

    initFarcaster();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        padding: "20px",
        backgroundColor: "#fff8e1",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <img src={celoLogo} alt="Celo Logo" style={{ width: "50px", height: "50px" }} />
        <h1 style={{ fontSize: "1.8rem", fontWeight: "bold" }}>Celo 2048</h1>
      </div>

      {/* Connect Wallet */}
      <ConnectButton />

      {/* Leaderboard */}
      <button
        onClick={() => setShowLeaderboard(true)}
        style={{
          padding: "8px 16px",
          backgroundColor: "#f5b700",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          margin: "20px 0",
        }}
      >
        Leaderboards
      </button>

      {/* Jeu principal */}
      <GameBoard />

      {/* Popup leaderboard */}
      {showLeaderboard && (
        <LeaderboardPopup
          leaderboardData={leaderboardData}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppKitProvider>
      <Root />
    </AppKitProvider>
  </React.StrictMode>
);
