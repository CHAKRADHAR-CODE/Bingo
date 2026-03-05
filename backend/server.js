import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// In-memory storage
const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("createRoom", ({ playerName, avatar, sessionId }) => {
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    rooms[roomCode] = {
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
      calledNumbers: [],
      gameStarted: false,
      gameState: "waiting",
      currentTurnIndex: 0,
      winner: null
    };
    socket.join(roomCode);
    socket.emit("roomCreated", rooms[roomCode]);
    console.log(`Room created: ${roomCode} by ${playerName}`);
  });

  socket.on("joinRoom", ({ roomCode, playerName, avatar, sessionId }) => {
    const room = rooms[roomCode];
    if (room) {
      // Reconnect logic
      const existingPlayer = room.players.find(p => p.sessionId === sessionId);
      if (existingPlayer) {
        existingPlayer.id = socket.id;
        socket.join(roomCode);
        socket.emit("playersUpdate", room);
        io.to(roomCode).emit("playersUpdate", room);
        return;
      }

      if (room.gameStarted) {
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
      io.to(roomCode).emit("playersUpdate", room);
    } else {
      socket.emit("error", "No room found with this code");
    }
  });

  socket.on("playerReady", ({ roomCode, boardNumbers }) => {
    const room = rooms[roomCode];
    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.ready = true;
        player.boardNumbers = boardNumbers;

        const allReady = room.players.every(p => p.ready);
        if (allReady && room.players.length >= 1) {
          room.gameStarted = true;
          room.gameState = "playing";
          room.currentTurnIndex = Math.floor(Math.random() * room.players.length);
          io.to(roomCode).emit("gameStart", room);
        } else {
          io.to(roomCode).emit("playersUpdate", room);
        }
      }
    }
  });

  socket.on("selectNumber", ({ roomCode, number }) => {
    const room = rooms[roomCode];
    if (room && room.gameStarted) {
      const currentPlayer = room.players[room.currentTurnIndex];
      if (currentPlayer.id === socket.id) {
        if (!room.calledNumbers.includes(number)) {
          room.calledNumbers.push(number);
          room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
          io.to(roomCode).emit("numberCalled", { room, pickedNumber: number });
        }
      }
    }
  });

  socket.on("bingoComplete", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (room && room.gameStarted) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        room.gameStarted = false;
        room.gameState = "finished";
        room.winner = player;
        io.to(roomCode).emit("winner", room);
      }
    }
  });

  socket.on("playAgain", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (room) {
      room.calledNumbers = [];
      room.gameStarted = false;
      room.gameState = "waiting";
      room.winner = null;
      room.currentTurnIndex = 0;
      room.players.forEach(p => {
        p.ready = false;
        p.boardNumbers = [];
        p.lines = 0;
      });
      io.to(roomCode).emit("reset-game", room);
    }
  });

  socket.on("leaveRoom", ({ roomCode, sessionId }) => {
    const room = rooms[roomCode];
    if (room) {
      const leavingPlayer = room.players.find(p => p.sessionId === sessionId);
      room.players = room.players.filter(p => p.sessionId !== sessionId);
      socket.leave(roomCode);
      
      if (room.players.length === 0) {
        delete rooms[roomCode];
      } else {
        // Feature 2: Player Leaving the Game
        if (room.gameState === "playing") {
          if (room.players.length === 1) {
            // Case A: Only 2 players in the room (now 1 left)
            room.gameState = "finished";
            room.gameStarted = false;
            room.winner = room.players[0];
            room.winnerReason = "opponent_left";
            io.to(roomCode).emit("winner", room);
          } else {
            // Case B: More than 2 players in the room
            io.to(roomCode).emit("playerLeftNotification", { 
              playerName: leavingPlayer?.name || "A player",
              room 
            });
            // Update turn index if necessary
            if (room.currentTurnIndex >= room.players.length) {
              room.currentTurnIndex = 0;
            }
            io.to(roomCode).emit("playersUpdate", room);
          }
        } else {
          io.to(roomCode).emit("playersUpdate", room);
        }
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Find rooms where this player was
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        // We don't automatically remove on disconnect to allow reconnection
        // But we can notify if it's a permanent leave or if we want to handle it here.
        // For now, let's rely on explicit leaveRoom for the "opponent left" logic 
        // OR we can implement a timeout. 
        // Given the prompt, I'll stick to leaveRoom for now or handle disconnect similarly if requested.
        // Actually, many users expect disconnect to be handled.
      }
    }
  });
});

// For our platform's preview to work, we need to serve the Vite app
// In a real Render deployment, this might be separate, but here we combine.
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist", "index.html"));
  });
} else {
  // In dev mode, we usually use the Vite middleware.
  // However, the user wants a standalone backend/server.js.
  // To keep the preview working, I'll add a note that this server
  // should be run alongside Vite or integrated.
  app.get("/", (req, res) => {
    res.send("Bingo Backend is running");
  });
}

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
