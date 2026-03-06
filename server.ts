import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = 3000;

  // In-memory storage
  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("create-room", ({ playerName, avatar, sessionId }) => {
      try {
        console.log(`Received create-room request from ${playerName} (${sessionId})`);
        const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
        const room = {
          code: roomCode,
          players: [{ 
            id: socket.id, 
            sessionId,
            name: playerName, 
            avatar, 
            isReady: false, 
            board: [], 
            lines: 0, 
            pickedNumbers: [] 
          }],
          gameState: "waiting",
          currentTurnIndex: 0,
          calledNumbers: [],
          winner: null,
        };
        rooms.set(roomCode, room);
        socket.join(roomCode);
        socket.emit("room-created", room);
        console.log(`Room created successfully: ${roomCode} by ${playerName}`);
      } catch (error) {
        console.error("Error creating room:", error);
        socket.emit("error", "Failed to create room. Please try again.");
      }
    });

    socket.on("join-room", ({ roomCode, playerName, avatar, sessionId }) => {
      const room = rooms.get(roomCode);
      if (room) {
        // Check if player is already in room (rejoining)
        const existingPlayer = room.players.find((p: any) => p.sessionId === sessionId);
        
        if (existingPlayer) {
          existingPlayer.id = socket.id; // Update socket ID
          socket.join(roomCode);
          socket.emit("room-joined", room);
          io.to(roomCode).emit("player-updated", room);
          console.log(`Player ${playerName} rejoined room ${roomCode}`);
          return;
        }

        if (room.gameState !== "waiting") {
          socket.emit("error", "Game already in progress");
          return;
        }
        
        const newPlayer = { 
          id: socket.id, 
          sessionId,
          name: playerName, 
          avatar, 
          isReady: false, 
          board: [], 
          lines: 0, 
          pickedNumbers: [] 
        };
        room.players.push(newPlayer);
        socket.join(roomCode);
        socket.emit("room-joined", room);
        io.to(roomCode).emit("player-joined", room);
        console.log(`Player ${playerName} joined room ${roomCode}`);
      } else {
        socket.emit("error", "No room found with this code.");
      }
    });

    socket.on("ready", ({ roomCode, board }) => {
      const room = rooms.get(roomCode);
      if (room) {
        const player = room.players.find((p: any) => p.id === socket.id);
        if (player) {
          player.isReady = true;
          player.board = board;
          
          const allReady = room.players.every((p: any) => p.isReady);
          if (allReady && room.players.length >= 1) { // Allow solo for testing if needed, but usually 2+
            room.gameState = "playing";
            room.currentTurnIndex = Math.floor(Math.random() * room.players.length);
            io.to(roomCode).emit("game-started", room);
          } else {
            io.to(roomCode).emit("player-ready", room);
          }
        }
      }
    });

    socket.on("pick-number", ({ roomCode, number }) => {
      const room = rooms.get(roomCode);
      if (room && room.gameState === "playing") {
        const currentPlayer = room.players[room.currentTurnIndex];
        if (currentPlayer.id === socket.id) {
          if (!room.calledNumbers.includes(number)) {
            room.calledNumbers.push(number);
            
            // Update turn
            room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
            
            io.to(roomCode).emit("number-picked", { room, pickedNumber: number });
          }
        }
      }
    });

    socket.on("bingo", ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (room && room.gameState === "playing") {
        const player = room.players.find((p: any) => p.id === socket.id);
        if (player) {
          room.gameState = "finished";
          room.winner = player;
          io.to(roomCode).emit("game-over", room);
        }
      }
    });

    socket.on("play-again", ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (room) {
        room.gameState = "waiting";
        room.calledNumbers = [];
        room.winner = null;
        room.players.forEach((p: any) => {
          p.isReady = false;
          p.board = [];
          p.lines = 0;
        });
        io.to(roomCode).emit("reset-game", room);
      }
    });

    socket.on("leave-room", ({ roomCode, sessionId }) => {
      const room = rooms.get(roomCode);
      if (room) {
        room.players = room.players.filter((p: any) => p.sessionId !== sessionId);
        socket.leave(roomCode);
        if (room.players.length === 0) {
          rooms.delete(roomCode);
        } else {
          // If game was playing and now only 1 player left, they win
          if (room.gameState === "playing" && room.players.length === 1) {
            room.gameState = "finished";
            room.winner = room.players[0];
            io.to(roomCode).emit("game-over", room);
          } else {
            io.to(roomCode).emit("player-left", room);
          }
        }
        console.log(`Player with session ${sessionId} left room ${roomCode}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      rooms.forEach((room, roomCode) => {
        const player = room.players.find((p: any) => p.id === socket.id);
        if (player) {
          // Instead of removing immediately, wait a bit to allow for refresh/reconnect
          setTimeout(() => {
            const currentRoom = rooms.get(roomCode);
            if (!currentRoom) return;

            const p = currentRoom.players.find((p: any) => p.sessionId === player.sessionId);
            // If the player's socket ID is still the same, they haven't reconnected
            if (p && p.id === socket.id) {
              currentRoom.players = currentRoom.players.filter((p: any) => p.sessionId !== player.sessionId);
              
              if (currentRoom.players.length === 0) {
                rooms.delete(roomCode);
              } else {
                // If game was playing and now only 1 player left, they win
                if (currentRoom.gameState === "playing" && currentRoom.players.length === 1) {
                  currentRoom.gameState = "finished";
                  currentRoom.winner = currentRoom.players[0];
                  io.to(roomCode).emit("game-over", currentRoom);
                } else {
                  io.to(roomCode).emit("player-left", currentRoom);
                  if (currentRoom.gameState === "playing") {
                    if (currentRoom.currentTurnIndex >= currentRoom.players.length) {
                      currentRoom.currentTurnIndex = 0;
                    }
                    io.to(roomCode).emit("turn-updated", currentRoom);
                  }
                }
              }
              console.log(`Player ${player.name} removed from room ${roomCode} after timeout`);
            }
          }, 5000); // 5 second grace period for refresh
        }
      });
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
