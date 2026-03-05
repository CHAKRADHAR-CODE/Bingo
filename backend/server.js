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
        room.winner = player;
        io.to(roomCode).emit("winner", room);
      }
    }
  });

  socket.on("leaveRoom", ({ roomCode, sessionId }) => {
    const room = rooms[roomCode];
    if (room) {
      room.players = room.players.filter(p => p.sessionId !== sessionId);
      socket.leave(roomCode);
      if (room.players.length === 0) {
        delete rooms[roomCode];
      } else {
        io.to(roomCode).emit("playersUpdate", room);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Optional: Add a timeout for reconnection if needed, but keeping it simple as per request
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
