export const SIZE = 4;

export const emptyGrid = () => Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));

export const addRandomTile = (grid) => {
  const emptyCells = [];
  grid.forEach((row, i) => row.forEach((cell, j) => { if (cell === 0) emptyCells.push([i, j]); }));
  if (emptyCells.length === 0) return grid;
  const [x, y] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  grid[x][y] = Math.random() < 0.9 ? 2 : 4;
  return grid;
};

export const isGameOver = (grid) => {
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (grid[i][j] === 0) return false;
      if (i < SIZE - 1 && grid[i][j] === grid[i + 1][j]) return false;
      if (j < SIZE - 1 && grid[i][j] === grid[i][j + 1]) return false;
    }
  }
  return true;
};

// Fusionne une ligne vers la gauche
const mergeLine = (line) => {
  let newLine = line.filter(v => v !== 0);
  let merged = Array(SIZE).fill(false);
  let gainedScore = 0;

  for (let i = 0; i < newLine.length - 1; i++) {
    if (newLine[i] === newLine[i + 1]) {
      newLine[i] *= 2;
      gainedScore += newLine[i];
      newLine[i + 1] = 0;
      merged[i] = true;
    }
  }
  newLine = newLine.filter(v => v !== 0);
  while (newLine.length < SIZE) newLine.push(0);

  return { newLine, merged, gainedScore };
};

// Applique la fusion à la grille entière
const slideLeft = (grid) => {
  let newGrid = [];
  let mergedGrid = [];
  let totalScore = 0;

  for (let i = 0; i < SIZE; i++) {
    const { newLine, merged, gainedScore } = mergeLine(grid[i]);
    newGrid.push(newLine);
    mergedGrid.push(merged);
    totalScore += gainedScore;
  }

  return { grid: newGrid, merged: mergedGrid, gainedScore: totalScore };
};

// Transpose la grille
const transpose = (grid) => grid[0].map((_, i) => grid.map(row => row[i]));

// Renverse les lignes
const reverseRows = (grid) => grid.map(row => [...row].reverse());

// Déplacement selon la direction
export const moveGrid = (grid, direction) => {
  let workingGrid = JSON.parse(JSON.stringify(grid));
  let result;

  switch (direction) {
    case "left":
      result = slideLeft(workingGrid);
      break;
    case "right":
      result = slideLeft(reverseRows(workingGrid));
      result.grid = reverseRows(result.grid);
      result.merged = reverseRows(result.merged);
      break;
    case "up":
      workingGrid = transpose(workingGrid);
      result = slideLeft(workingGrid);
      result.grid = transpose(result.grid);
      result.merged = transpose(result.merged);
      break;
    case "down":
      workingGrid = transpose(workingGrid);
      result = slideLeft(reverseRows(workingGrid));
      result.grid = transpose(reverseRows(result.grid));
      result.merged = transpose(reverseRows(result.merged));
      break;
    default:
      return null;
  }

  return result;
};
