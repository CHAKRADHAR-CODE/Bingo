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

    socket.on("createRoom", ({ playerName, avatar, sessionId }) => {
      const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
      const room = {
        code: roomCode,
        players: [{ 
          id: socket.id, 
          sessionId,
          name: playerName, 
          avatar, 
          ready: false, 
          boardNumbers: [], 
          lines: 0
        }],
        gameStarted: false,
        gameState: "waiting",
        currentTurnIndex: 0,
        calledNumbers: [],
        winner: null,
      };
      rooms.set(roomCode, room);
      socket.join(roomCode);
      socket.emit("roomCreated", room);
      console.log(`Room created: ${roomCode} by ${playerName} (${sessionId})`);
    });

    socket.on("joinRoom", ({ roomCode, playerName, avatar, sessionId }) => {
      const room = rooms.get(roomCode);
      if (room) {
        // Check if player is already in room (rejoining)
        const existingPlayer = room.players.find((p: any) => p.sessionId === sessionId);
        
        if (existingPlayer) {
          existingPlayer.id = socket.id; // Update socket ID
          socket.join(roomCode);
          socket.emit("roomJoined", room);
          io.to(roomCode).emit("playersUpdate", room);
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
          ready: false, 
          boardNumbers: [], 
          lines: 0
        };
        room.players.push(newPlayer);
        socket.join(roomCode);
        socket.emit("roomJoined", room);
        io.to(roomCode).emit("playersUpdate", room);
        console.log(`Player ${playerName} joined room ${roomCode}`);
      } else {
        socket.emit("error", "No room found with this code.");
      }
    });

    socket.on("playerReady", ({ roomCode, boardNumbers }) => {
      const room = rooms.get(roomCode);
      if (room) {
        const player = room.players.find((p: any) => p.id === socket.id);
        if (player) {
          player.ready = true;
          player.boardNumbers = boardNumbers;
          
          const allReady = room.players.every((p: any) => p.ready);
          if (allReady && room.players.length >= 2) { 
            room.gameState = "playing";
            room.gameStarted = true;
            room.currentTurnIndex = Math.floor(Math.random() * room.players.length);
            io.to(roomCode).emit("gameStart", room);
          } else {
            io.to(roomCode).emit("playersUpdate", room);
          }
        }
      }
    });

    socket.on("selectNumber", ({ roomCode, number }) => {
      const room = rooms.get(roomCode);
      if (room && room.gameState === "playing") {
        const currentPlayer = room.players[room.currentTurnIndex];
        if (currentPlayer.id === socket.id) {
          if (!room.calledNumbers.includes(number)) {
            room.calledNumbers.push(number);
            
            // Update turn
            room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
            
            io.to(roomCode).emit("numberCalled", { room, pickedNumber: number });
          }
        }
      }
    });

    socket.on("bingoComplete", ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (room && room.gameState === "playing") {
        const player = room.players.find((p: any) => p.id === socket.id);
        if (player) {
          room.gameState = "finished";
          room.winner = player;
          io.to(roomCode).emit("winner", room);
        }
      }
    });

    socket.on("playAgain", ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (room) {
        room.gameState = "waiting";
        room.gameStarted = false;
        room.calledNumbers = [];
        room.winner = null;
        room.players.forEach((p: any) => {
          p.ready = false;
          p.boardNumbers = [];
          p.lines = 0;
        });
        io.to(roomCode).emit("reset-game", room);
      }
    });

    socket.on("leaveRoom", ({ roomCode, sessionId }) => {
      const room = rooms.get(roomCode);
      if (room) {
        const leavingPlayer = room.players.find((p: any) => p.sessionId === sessionId);
        room.players = room.players.filter((p: any) => p.sessionId !== sessionId);
        socket.leave(roomCode);
        
        if (room.players.length === 0) {
          rooms.delete(roomCode);
        } else {
          if (leavingPlayer) {
            io.to(roomCode).emit("playerLeftNotification", { playerName: leavingPlayer.name, room });
          }
          io.to(roomCode).emit("playersUpdate", room);

          // If game was playing and only 1 player left, they win
          if (room.gameState === "playing" && room.players.length === 1) {
            room.gameState = "finished";
            room.winner = room.players[0];
            room.winnerReason = "opponent_left";
            io.to(roomCode).emit("winner", room);
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
              const leavingPlayerName = p.name;
              currentRoom.players = currentRoom.players.filter((p: any) => p.sessionId !== player.sessionId);
              
              if (currentRoom.players.length === 0) {
                rooms.delete(roomCode);
              } else {
                io.to(roomCode).emit("playerLeftNotification", { playerName: leavingPlayerName, room: currentRoom });
                io.to(roomCode).emit("playersUpdate", currentRoom);
                
                if (currentRoom.gameState === "playing") {
                  // If only 1 player left, they win
                  if (currentRoom.players.length === 1) {
                    currentRoom.gameState = "finished";
                    currentRoom.winner = currentRoom.players[0];
                    currentRoom.winnerReason = "opponent_left";
                    io.to(roomCode).emit("winner", currentRoom);
                  } else {
                    if (currentRoom.currentTurnIndex >= currentRoom.players.length) {
                      currentRoom.currentTurnIndex = 0;
                    }
                    io.to(roomCode).emit("playersUpdate", currentRoom);
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
