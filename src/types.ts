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
  isAi?: boolean;
}

export interface MoveLog {
  id: string;
  playerName: string;
  calledNumber: number;
  timestamp: string;
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  gameState: "waiting" | "starting" | "arranging" | "playing" | "finished";
  calledNumbers: number[];
  currentTurnIndex: number;
  moveLogs?: MoveLog[];
}

export type GameScreen = "intro" | "name_prompt" | "main_menu" | "room_hub" | "lobby" | "arranging" | "gameplay" | "offline_lobby";

export type ThemeMode = "dark" | "light";

export const AVATARS = [
  "https://api.dicebear.com/7.x/notionists/svg?seed=Felix",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Milo",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Oscar",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Toby",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Heidi",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Bella",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Sophie",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Chloe",
];
