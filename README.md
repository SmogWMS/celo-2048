# 🎮 Celo 2048  

# A Decentralized 2048 Game on Celo

A decentralized version of the famous **2048 puzzle game**, built with **React** and integrated with the **Celo blockchain**. Connect your wallet, play, and save your scores directly on-chain!

👉 **Live Demo**: [celo-2048.vercel.app](https://celo-2048.vercel.app/)

---

## 🚀 Features

- 🎲 **Classic 2048 gameplay** with smooth animations and scoring system
- 🏆 **Leaderboard** showing best and total scores from the smart contract
- 💾 **Save your best score on-chain** (Celo Mainnet or Celo Sepolia Testnet)
- 🔗 **Wallet connection** with automatic network switching (defaults to Celo Mainnet)
- ⏱️ Built-in **timer** that stops when the game is over
- 🔁 **Replay option** resets the board and allows new score saving
- 🔒 **One-time save per game** (button disabled after saving)

---

## 🛠️ Tech Stack

### Frontend
- **React** – Game UI
- **Framer Motion** – Animations
- **Web3.js** – Blockchain integration
- **Custom Hooks** – Wallet & contract logic (`useWeb3.js`)

### Smart Contracts
- **Solidity** – Celo2048Leaderboard contract
- **Celo Blockchain** – Score storage

---

## 📦 Installation & Usage

Clone the repository:
```bash
git clone https://github.com/KillianDlds/celo-2048.git
cd celo-2048
```

Install dependencies:
```bash
npm install
```

Run the app locally:
```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

---

## 🔗 Smart Contract

The project uses the **Celo2048Leaderboard** smart contract to save scores and times, and to track best and total scores for each player.

### Contract Functions

- `saveScore(uint256 score, uint256 time)` – Save player score and time
- `getBestScores()` – Get leaderboard best scores (returns addresses, best scores, times)
- `getTotalScores()` – Get leaderboard total scores (returns addresses, total scores, games played)

1. **Open the app**
	- [Live Demo](https://celo-2048.vercel.app/) or run locally at [http://localhost:3000](http://localhost:3000)

2. **Connect your wallet**
	- Use MetaMask (with Celo RPC) or any Celo-compatible wallet
	- Click "Connect Wallet" (network defaults to Mainnet, you can switch to Sepolia)

3. **Play 2048**
	- Use your keyboard arrow keys:
	  - ⬅️ Left
	  - ➡️ Right
	  - ⬆️ Up
	  - ⬇️ Down

4. **Game Over**
	- If connected: click **Save Score** (button disables after saving)
	- If not connected: click **Connect & Save** to connect and save

5. **Leaderboard**
	- Click "Leaderboards" to view best and total scores from all players
	- Compare your scores with others

6. **Replay**
	- Click "Replay" to start a new game and save a new score

