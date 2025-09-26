import GameBoard from "./GameBoard";

export default function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-100">
      <h1 className="text-4xl font-bold mb-6">🎉 2048 Game</h1>
      <GameBoard />
    </div>
  );
}