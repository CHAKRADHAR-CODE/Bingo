import { Player } from "../types";

export function generateRandomBoard(size: number = 5): number[][] {
  const maxNum = size * size;
  const numbers = Array.from({ length: maxNum }, (_, i) => i + 1);
  
  // Shuffle array
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  const board: number[][] = [];
  for (let i = 0; i < size; i++) {
    board.push(numbers.slice(i * size, (i + 1) * size));
  }
  return board;
}

export function calculateCompletedLines(board: number[][], calledNumbers: number[]): number {
  if (!board) return 0;
  const size = board.length;
  const calledSet = new Set(calledNumbers);
  let lines = 0;

  for (let r = 0; r < size; r++) {
    if (board[r].every((num) => calledSet.has(num))) lines++;
  }
  for (let c = 0; c < size; c++) {
    let colComplete = true;
    for (let r = 0; r < size; r++) {
      if (!calledSet.has(board[r][c])) { colComplete = false; break; }
    }
    if (colComplete) lines++;
  }
  let diag1 = true, diag2 = true;
  for (let i = 0; i < size; i++) {
    if (!calledSet.has(board[i][i])) diag1 = false;
    if (!calledSet.has(board[i][size - 1 - i])) diag2 = false;
  }
  if (diag1) lines++;
  if (diag2) lines++;
  return lines;
}

export type LinePosition = {
  type: 'row' | 'col' | 'diag1' | 'diag2';
  index: number;
  cells: { r: number; c: number }[];
};

export function getCompletedLinePositions(board: number[][], calledNumbers: number[]): LinePosition[] {
  if (!board) return [];
  const size = board.length;
  const calledSet = new Set(calledNumbers);
  const result: LinePosition[] = [];

  for (let r = 0; r < size; r++) {
    if (board[r].every((num) => calledSet.has(num))) {
      result.push({ type: 'row', index: r, cells: Array.from({ length: size }, (_, c) => ({ r, c })) });
    }
  }
  for (let c = 0; c < size; c++) {
    let ok = true;
    for (let r = 0; r < size; r++) {
      if (!calledSet.has(board[r][c])) { ok = false; break; }
    }
    if (ok) {
      result.push({ type: 'col', index: c, cells: Array.from({ length: size }, (_, r) => ({ r, c })) });
    }
  }
  let d1 = true, d2 = true;
  for (let i = 0; i < size; i++) {
    if (!calledSet.has(board[i][i])) d1 = false;
    if (!calledSet.has(board[i][size - 1 - i])) d2 = false;
  }
  if (d1) {
    result.push({ type: 'diag1', index: 0, cells: Array.from({ length: size }, (_, i) => ({ r: i, c: i })) });
  }
  if (d2) {
    result.push({ type: 'diag2', index: 0, cells: Array.from({ length: size }, (_, i) => ({ r: i, c: size - 1 - i })) });
  }
  return result;
}

export function chooseAiNumber(
  bot: Player,
  calledNumbers: number[],
  difficulty: "rookie" | "cyber" | "master" = "cyber"
): number {
  if (!bot.board) return Math.floor(Math.random() * 25) + 1;
  const size = bot.board.length;
  const calledSet = new Set(calledNumbers);

  // Collect uncalled numbers on bot board
  const uncalledOnBoard: { num: number; r: number; c: number; score: number }[] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const num = bot.board[r][c];
      if (!calledSet.has(num)) {
        uncalledOnBoard.push({ num, r, c, score: 0 });
      }
    }
  }

  if (uncalledOnBoard.length === 0) {
    // Pick any remaining uncalled number from 1 to size*size
    const all = Array.from({ length: size * size }, (_, i) => i + 1).filter(
      (n) => !calledSet.has(n)
    );
    return all[Math.floor(Math.random() * all.length)] || 1;
  }

  if (difficulty === "rookie") {
    // Pick randomly from uncalled on board
    return uncalledOnBoard[Math.floor(Math.random() * uncalledOnBoard.length)].num;
  }

  // Calculate scores for Cyber / Master AI
  uncalledOnBoard.forEach((item) => {
    let score = 0;
    // Row score: count how many numbers in this row are already called
    const rowCalled = bot.board![item.r].filter((n) => calledSet.has(n)).length;
    score += Math.pow(2, rowCalled);

    // Col score
    let colCalled = 0;
    for (let r = 0; r < size; r++) {
      if (calledSet.has(bot.board![r][item.c])) colCalled++;
    }
    score += Math.pow(2, colCalled);

    // Diagonals
    if (item.r === item.c) {
      let d1 = 0;
      for (let i = 0; i < size; i++) if (calledSet.has(bot.board![i][i])) d1++;
      score += Math.pow(2, d1);
    }

    if (item.r + item.c === size - 1) {
      let d2 = 0;
      for (let i = 0; i < size; i++) if (calledSet.has(bot.board![i][size - 1 - i])) d2++;
      score += Math.pow(2, d2);
    }

    item.score = score;
  });

  // Sort by score descending
  uncalledOnBoard.sort((a, b) => b.score - a.score);

  if (difficulty === "master") {
    return uncalledOnBoard[0].num;
  }

  // Cyber difficulty: 80% pick best, 20% pick top 3
  if (Math.random() < 0.8 || uncalledOnBoard.length <= 2) {
    return uncalledOnBoard[0].num;
  } else {
    const topIdx = Math.floor(Math.random() * Math.min(3, uncalledOnBoard.length));
    return uncalledOnBoard[topIdx].num;
  }
}
