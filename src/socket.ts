/// <reference types="vite/client" />
import { io, Socket } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

export const socket: Socket = io(SERVER_URL);

export const createRoom = (playerName: string, avatar: string, sessionId: string) => {
  socket.emit("createRoom", { playerName, avatar, sessionId });
};

export const joinRoom = (roomCode: string, playerName: string, avatar: string, sessionId: string) => {
  socket.emit("joinRoom", { roomCode, playerName, avatar, sessionId });
};

export const readyPlayer = (roomCode: string, boardNumbers: number[]) => {
  socket.emit("playerReady", { roomCode, boardNumbers });
};

export const selectNumber = (roomCode: string, number: number) => {
  socket.emit("selectNumber", { roomCode, number });
};

export const bingoComplete = (roomCode: string) => {
  socket.emit("bingoComplete", { roomCode });
};

export const leaveRoom = (roomCode: string, sessionId: string) => {
  socket.emit("leaveRoom", { roomCode, sessionId });
};
