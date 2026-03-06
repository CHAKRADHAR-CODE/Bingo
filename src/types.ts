export interface Player {
  id: string;
  sessionId: string;
  name: string;
  avatar: string;
  ready: boolean;
  board: number[][] | null;
  lines: number;
  won: boolean;
  isHost: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  gameState: "waiting" | "starting" | "arranging" | "playing" | "finished";
  calledNumbers: number[];
  currentTurnIndex: number;
}

export const AVATARS = [
  "https://api.dicebear.com/7.x/notionists/svg?seed=Felix", // Boy 1
  "https://api.dicebear.com/7.x/notionists/svg?seed=Milo",  // Boy 2
  "https://api.dicebear.com/7.x/notionists/svg?seed=Oscar", // Boy 3
  "https://api.dicebear.com/7.x/notionists/svg?seed=Toby",  // Boy 4
  "https://api.dicebear.com/7.x/notionists/svg?seed=Heidi", // Girl 1
  "https://api.dicebear.com/7.x/notionists/svg?seed=Bella", // Girl 2
  "https://api.dicebear.com/7.x/notionists/svg?seed=Sophie",// Girl 3
  "https://api.dicebear.com/7.x/notionists/svg?seed=Chloe", // Girl 4
];
