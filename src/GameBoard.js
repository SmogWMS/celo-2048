import { useState, useEffect } from "react";
import Tile from "./Tile";

const SIZE = 4;

const emptyGrid = () =>
  Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));

const addRandomTile = (grid) => {
  const emptyCells = [];
  grid.forEach((row, i) =>
    row.forEach((cell, j) => { if (cell === 0) emptyCells.push([i, j]); })
  );
  if (emptyCells.length === 0) return grid;

  const [x, y] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  grid[x][y] = Math.random() < 0.9 ? 2 : 4;
  return grid;
};

export default function GameBoard() {
  const [grid, setGrid] = useState(addRandomTile(addRandomTile(emptyGrid())));
  const [score, setScore] = useState(0);

  const slideLeft = (grid) => {
    let newGrid = grid.map((row) => {
      let arr = row.filter((val) => val !== 0);
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
          arr[i] *= 2;
          setScore((s) => s + arr[i]);
          arr[i + 1] = 0;
        }
      }
      arr = arr.filter((val) => val !== 0);
      while (arr.length < SIZE) arr.push(0);
      return arr;
    });
    return newGrid;
  };

  const rotateGrid = (grid) => grid[0].map((_, i) => grid.map(row => row[i]));

  const move = (direction) => {
    let newGrid = JSON.parse(JSON.stringify(grid));
    if (direction === "left") newGrid = slideLeft(newGrid);
    if (direction === "right") {
      newGrid = newGrid.map(row => row.reverse());
      newGrid = slideLeft(newGrid);
      newGrid = newGrid.map(row => row.reverse());
    }
    if (direction === "up") {
      newGrid = rotateGrid(newGrid);
      newGrid = slideLeft(newGrid);
      newGrid = rotateGrid(newGrid);
    }
    if (direction === "down") {
      newGrid = rotateGrid(newGrid);
      newGrid = newGrid.map(row => row.reverse());
      newGrid = slideLeft(newGrid);
      newGrid = newGrid.map(row => row.reverse());
      newGrid = rotateGrid(newGrid);
    }
    if (JSON.stringify(newGrid) !== JSON.stringify(grid))
      setGrid(addRandomTile(newGrid));
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowLeft") move("left");
      if (e.key === "ArrowRight") move("right");
      if (e.key === "ArrowUp") move("up");
      if (e.key === "ArrowDown") move("down");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  return (
    <div style={{
  display: "grid",
  gridTemplateColumns: `repeat(${SIZE}, 80px)`,
  gap: "10px",
  backgroundColor: "#fff8e1",
  padding: "16px",
  borderRadius: "12px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
}}>
  {grid.map((row, i) =>
    row.map((val, j) => <Tile key={`${i}-${j}`} value={val} />)
  )}
</div>

  );
}
