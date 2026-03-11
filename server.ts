import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = Number(process.env.PORT) || 3000;

  // In-memory storage
  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("create-room", ({ name, avatar, sessionId }) => {
      const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
      const roomData = {
        code: roomCode,
        hostId: socket.id,
        players: [{ id: socket.id, sessionId, name, avatar, ready: false, board: null, lines: 0, won: false, isHost: true }],
        gameState: "waiting", // waiting, starting, arranging, playing, finished
        calledNumbers: [],
        currentTurnIndex: 0,
      };
      rooms.set(roomCode, roomData);
      socket.join(roomCode);
      socket.emit("room-created", roomData);
    });

    socket.on("join-room", ({ roomCode, name, avatar, sessionId }) => {
      const room = rooms.get(roomCode);
      if (!room) {
        socket.emit("error", "No room found with this code.");
        return;
      }
      
      // Check if player already in room with this session
      const existingPlayer = room.players.find(p => p.sessionId === sessionId);
      if (existingPlayer) {
        existingPlayer.id = socket.id; // Update socket ID
        socket.join(roomCode);
        socket.emit("room-joined", room);
        io.to(roomCode).emit("player-reconnected", room);
        return;
      }

      if (room.gameState !== "waiting") {
        socket.emit("error", "Game already in progress");
        return;
      }
      if (room.players.length >= 10) {
        socket.emit("error", "Room is full");
        return;
      }

      const newPlayer = { id: socket.id, sessionId, name, avatar, ready: false, board: null, lines: 0, won: false, isHost: false };
      room.players.push(newPlayer);
      socket.join(roomCode);
      socket.emit("room-joined", room);
      io.to(roomCode).emit("player-joined", room);
    });

    socket.on("start-game-request", ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (!room || room.hostId !== socket.id) return;
      if (room.players.length < 2) {
        socket.emit("error", "Need at least 2 players to start");
        return;
      }

      room.gameState = "starting";
      io.to(roomCode).emit("game-starting", room);
      
      // After 3.5 seconds (countdown), move to arranging
      setTimeout(() => {
        const currentRoom = rooms.get(roomCode);
        if (currentRoom && currentRoom.gameState === "starting") {
          currentRoom.gameState = "arranging";
          io.to(roomCode).emit("game-arranging", currentRoom);
        }
      }, 3500);
    });

    socket.on("set-ready", ({ roomCode, board }) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      const player = room.players.find((p) => p.id === socket.id);
      if (player) {
        player.ready = true;
        player.board = board;
      }

      const allReady = room.players.every((p) => p.ready);
      if (allReady && room.gameState === "arranging") {
        room.gameState = "playing";
        io.to(roomCode).emit("game-started", room);
      } else {
        io.to(roomCode).emit("player-ready-update", room);
      }
    });

    socket.on("call-number", ({ roomCode, number }) => {
      const room = rooms.get(roomCode);
      if (!room || room.gameState !== "playing") return;

      const currentPlayer = room.players[room.currentTurnIndex];
      if (currentPlayer.id !== socket.id) {
        socket.emit("error", "It's not your turn!");
        return;
      }

      if (!room.calledNumbers.includes(number)) {
        room.calledNumbers.push(number);
        room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
        io.to(roomCode).emit("number-called", { room, calledNumber: number });
      }
    });

    socket.on("check-bingo", ({ roomCode, lines }) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      const player = room.players.find((p) => p.id === socket.id);
      if (player) {
        player.lines = lines;
        if (lines >= 5) {
          player.won = true;
          room.gameState = "finished";
          io.to(roomCode).emit("game-over", { room, winner: player });
        } else {
          io.to(roomCode).emit("player-lines-update", room);
        }
      }
    });

    socket.on("play-again", ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (!room || room.hostId !== socket.id) return;

      room.gameState = "arranging";
      room.calledNumbers = [];
      room.currentTurnIndex = 0;
      room.players.forEach((p) => {
        p.ready = false;
        p.board = null;
        p.lines = 0;
        p.won = false;
      });

      io.to(roomCode).emit("game-arranging", room);
    });

    socket.on("leave-room", ({ roomCode }) => {
      socket.leave(roomCode);
      handleDisconnect(socket, roomCode);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      rooms.forEach((room, roomCode) => {
        if (room.players.some((p) => p.id === socket.id)) {
          // We don't immediately remove the player to allow reconnection
          // But for this simple implementation, we'll notify others
          io.to(roomCode).emit("player-disconnected", socket.id);
          
          // If all players disconnected, cleanup
          const anyConnected = room.players.some(p => io.sockets.sockets.get(p.id));
          if (!anyConnected) {
             // Optional: delay cleanup
          }
        }
      });
    });
  });

  function handleDisconnect(socket, roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;

    const leavingPlayer = room.players.find(p => p.id === socket.id);
    room.players = room.players.filter((p) => p.id !== socket.id);
    
    if (room.players.length === 0) {
      rooms.delete(roomCode);
    } else {
      // If host left, assign new host
      if (room.hostId === socket.id) {
        room.hostId = room.players[0].id;
        room.players[0].isHost = true;
      }

      if (room.gameState === "playing") {
        if (room.players.length === 1) {
          room.gameState = "finished";
          room.players[0].won = true;
          io.to(roomCode).emit("opponent-left-win", { room, winner: room.players[0] });
        } else {
          room.currentTurnIndex = room.currentTurnIndex % room.players.length;
          io.to(roomCode).emit("player-left-message", { room, name: leavingPlayer?.name });
        }
      } else {
        io.to(roomCode).emit("player-left", room);
      }
    }
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
