import { io, Socket } from "socket.io-client";

const ENV_URL = (import.meta as any).env?.VITE_SERVER_URL;
const SOCKET_URL = ENV_URL || window.location.origin || '';
export const socket: Socket = io(SOCKET_URL, { autoConnect: false });

export function connectSocket() {
  if (!socket.connected) socket.connect();
}

export function disconnectSocket() {
  if (socket.connected) socket.disconnect();
}

export const createRoom = (name: string, avatar: string, sessionId: string) => {
  connectSocket();
  socket.emit("create-room", { name, avatar, sessionId });
};

export const joinRoom = (roomCode: string, name: string, avatar: string, sessionId: string) => {
  connectSocket();
  socket.emit("join-room", { roomCode, name, avatar, sessionId });
};

export const readyPlayer = (roomCode: string, board: number[][]) => {
  socket.emit("set-ready", { roomCode, board });
};

export const callNumber = (roomCode: string, number: number) => {
  socket.emit("call-number", { roomCode, number });
};

export const leaveRoom = (roomCode: string) => {
  socket.emit("leave-room", { roomCode });
};

export const startGame = (roomCode: string) => {
  socket.emit("start-game-request", { roomCode });
};

export const checkBingo = (roomCode: string, lines: number) => {
  socket.emit("check-bingo", { roomCode, lines });
};

export const playAgain = (roomCode: string) => {
  socket.emit("play-again", { roomCode });
};
