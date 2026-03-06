/// <reference types="vite/client" />
import React, { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { 
  User, 
  Users, 
  Trophy, 
  Settings, 
  LogOut, 
  Plus, 
  LogIn, 
  Info, 
  Volume2, 
  VolumeX, 
  WifiOff,
  RefreshCw,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Types ---
interface Player {
  id: string;
  sessionId: string;
  name: string;
  avatar: string;
  ready: boolean;
  boardNumbers: number[];
  lines: number;
}

interface Room {
  code: string;
  players: Player[];
  gameStarted: boolean;
  currentTurnIndex: number;
  calledNumbers: number[];
  winner: Player | null;
}

const AVATARS = [
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Felix",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Max",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Luna",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Milo",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Leo",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Mia",
];

function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="w-12 h-12 bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-indigo-500/20">
        <div className="grid grid-cols-2 gap-1">
          <div className="w-2 h-2 bg-white rounded-sm" />
          <div className="w-2 h-2 bg-white/50 rounded-sm" />
          <div className="w-2 h-2 bg-white/50 rounded-sm" />
          <div className="w-2 h-2 bg-white rounded-sm" />
        </div>
      </div>
      <h1 className="text-4xl font-black bingo-logo tracking-tighter">BINGO</h1>
    </div>
  );
}

// --- Components ---

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerInfo, setPlayerInfo] = useState<{ name: string; avatar: string; sessionId: string } | null>(() => {
    const saved = localStorage.getItem("bingo_player");
    return saved ? JSON.parse(saved) : null;
  });
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [socketConnected, setSocketConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [myBoard, setMyBoard] = useState<number[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [lastLeaver, setLastLeaver] = useState<string | null>(null);

  const sessionId = useRef(localStorage.getItem("bingo_session") || Math.random().toString(36).substring(2, 15));
  const audioRef = useRef<any>({});

  // Handle Logout
  const handleLogout = useCallback(() => {
    if (socket && room) {
      socket.emit("leave-room", { roomCode: room.code, sessionId: sessionId.current });
    }
    localStorage.removeItem("bingo_player");
    localStorage.removeItem("bingo_room_code");
    localStorage.removeItem("bingo_session");
    sessionStorage.clear();
    setPlayerInfo(null);
    setRoom(null);
    setIsReady(false);
    setMyBoard([]);
  }, [socket, room]);

  // Handle Leave Room
  const handleLeaveRoom = useCallback(() => {
    if (socket && room) {
      socket.emit("leave-room", { roomCode: room.code, sessionId: sessionId.current });
    }
    localStorage.removeItem("bingo_room_code");
    setRoom(null);
    setIsReady(false);
    setMyBoard([]);
  }, [socket, room]);

  useEffect(() => {
    localStorage.setItem("bingo_session", sessionId.current);
  }, []);

  // Initialize Socket
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
    console.log("Connecting to socket at:", backendUrl);
    const newSocket = io(backendUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      // Try to restore session if we have player info and room code
      const savedPlayer = localStorage.getItem("bingo_player");
      const savedRoomCode = localStorage.getItem("bingo_room_code");
      if (savedPlayer && savedRoomCode) {
        const player = JSON.parse(savedPlayer);
        newSocket.emit("join-room", { 
          roomCode: savedRoomCode, 
          playerName: player.name, 
          avatar: player.avatar,
          sessionId: sessionId.current
        });
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError("Connection error. Please check if the server is running.");
    });

    newSocket.on("room-created", (room: Room) => {
      console.log("Room created successfully:", room);
      setRoom(room);
      localStorage.setItem("bingo_room_code", room.code);
    });
    newSocket.on("room-joined", (room: Room) => {
      setRoom(room);
      localStorage.setItem("bingo_room_code", room.code);
    });
    newSocket.on("player-joined", (room: Room) => {
      setRoom(room);
    });
    newSocket.on("player-ready", (room: Room) => {
      setRoom(room);
    });
    newSocket.on("player-updated", (room: Room) => {
      setRoom(room);
      localStorage.setItem("bingo_room_code", room.code);
      
      // If game is already playing, restore board if possible
      const myPlayer = room.players.find(p => p.sessionId === sessionId.current);
      if (myPlayer && myPlayer.boardNumbers.length === 25) {
        setMyBoard(myPlayer.boardNumbers);
        setIsReady(myPlayer.ready);
      }
    });
    newSocket.on("game-started", (room: Room) => {
      setRoom(room);
      startCountdown();
    });
    newSocket.on("number-picked", ({ room, pickedNumber }: { room: Room; pickedNumber: number }) => {
      setRoom(room);
      if (soundEnabled) playSound("select");
    });
    newSocket.on("game-over", (room: Room) => {
      setRoom(room);
      if (soundEnabled) playSound("win");
    });
    newSocket.on("turn-updated", (room: Room) => {
      setRoom(room);
    });
    newSocket.on("player-left", (room: Room) => {
      // Find who left by comparing with current room players
      setRoom((prevRoom) => {
        if (prevRoom && prevRoom.players.length > room.players.length) {
          const leaver = prevRoom.players.find(p => !room.players.find(rp => rp.sessionId === p.sessionId));
          if (leaver) {
            setNotification(`Player ${leaver.name} has left the game.`);
            setTimeout(() => setNotification(null), 3000);
          }
        }
        return room;
      });
    });
    newSocket.on("reset-game", (room: Room) => {
      setRoom(room);
      setIsReady(false);
      setMyBoard([]);
    });
    newSocket.on("error", (msg: string) => {
      setError(msg);
      setTimeout(() => setError(null), 3000);
    });

    // Network detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Preload sounds
    audioRef.current = {
      select: new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"),
      win: new Audio("https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3"),
      countdown: new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"),
    };

    return () => {
      newSocket.close();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    setSocketConnected(socket.connected);
    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  const playSound = (key: string) => {
    if (soundEnabled && audioRef.current[key]) {
      audioRef.current[key].currentTime = 0;
      audioRef.current[key].play().catch(() => {});
    }
  };

  const startCountdown = () => {
    setCountdown(3);
    if (soundEnabled) playSound("countdown");
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const createRoom = () => {
    console.log("Attempting to create room...", { playerInfo, socketConnected: socket?.connected });
    if (playerInfo && socket && socket.connected) {
      socket.emit("create-room", { 
        playerName: playerInfo.name, 
        avatar: playerInfo.avatar,
        sessionId: sessionId.current
      });
    } else if (!socket?.connected) {
      setError("Not connected to server. Please wait...");
    }
  };

  const joinRoom = (code: string) => {
    if (playerInfo && socket && code.length === 6) {
      socket.emit("join-room", { 
        roomCode: code, 
        playerName: playerInfo.name, 
        avatar: playerInfo.avatar,
        sessionId: sessionId.current
      });
    }
  };

  const handleReady = () => {
    if (socket && room && myBoard.length === 25) {
      setIsReady(true);
      socket.emit("ready", { roomCode: room.code, board: myBoard });
    }
  };

  const pickNumber = (num: number) => {
    if (socket && room && room.gameState === "playing") {
      const currentPlayer = room.players[room.currentTurnIndex];
      if (currentPlayer.id === socket.id && !room.calledNumbers.includes(num)) {
        socket.emit("pick-number", { roomCode: room.code, number: num });
      }
    }
  };

  const checkBingo = useCallback(() => {
    if (!room || !myBoard.length) return 0;
    
    const size = 5;
    let lines = 0;
    const called = room.calledNumbers;

    // Rows
    for (let i = 0; i < size; i++) {
      if (myBoard.slice(i * size, (i + 1) * size).every(n => called.includes(n))) lines++;
    }
    // Cols
    for (let i = 0; i < size; i++) {
      let col = true;
      for (let j = 0; j < size; j++) {
        if (!called.includes(myBoard[i + j * size])) {
          col = false;
          break;
        }
      }
      if (col) lines++;
    }
    // Diagonals
    let d1 = true, d2 = true;
    for (let i = 0; i < size; i++) {
      if (!called.includes(myBoard[i * (size + 1)])) d1 = false;
      if (!called.includes(myBoard[(i + 1) * (size - 1)])) d2 = false;
    }
    if (d1) lines++;
    if (d2) lines++;

    return lines;
  }, [room?.calledNumbers, myBoard]);

  useEffect(() => {
    const lines = checkBingo();
    if (lines >= 5 && room?.gameState === "playing" && socket) {
      socket.emit("bingo", { roomCode: room.code });
    }
  }, [checkBingo, room?.gameState, socket]);

  // --- Render Helpers ---

  useEffect(() => {
    if (room && myBoard.length === 0) {
      const nums = Array.from({ length: 25 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
      setMyBoard(nums);
    }
  }, [room?.code, myBoard.length]);

  if (!isOnline) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
        <div className="glass-card text-center max-w-sm mx-4">
          <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Internet Connection</h2>
          <p className="text-gray-400 mb-6">Please check your network and reconnect to continue playing.</p>
          <div className="flex justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00ff88]" />
          </div>
        </div>
      </div>
    );
  }

  if (!playerInfo) {
    return <EntryScreen onConfirm={setPlayerInfo} />;
  }

  if (!room) {
    return (
      <LobbyScreen 
        playerInfo={playerInfo} 
        onCreate={createRoom} 
        onJoin={joinRoom} 
        onLogout={handleLogout}
        error={error}
        socketConnected={socketConnected}
      />
    );
  }

  return (
    <GameScreen 
      room={room} 
      socketId={socket?.id || ""} 
      sessionId={sessionId.current}
      myBoard={myBoard}
      setMyBoard={setMyBoard}
      isReady={isReady}
      onReady={handleReady}
      onPick={pickNumber}
      countdown={countdown}
      onPlayAgain={() => socket?.emit("play-again", { roomCode: room.code })}
      onExit={handleLeaveRoom}
      soundEnabled={soundEnabled}
      onToggleSound={() => setSoundEnabled(!soundEnabled)}
      notification={notification}
    />
  );
}

// --- Sub-Screens ---

function EntryScreen({ onConfirm }: { onConfirm: (info: { name: string; avatar: string; sessionId: string }) => void }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);

  const handleConfirm = () => {
    if (name) {
      const sessionId = localStorage.getItem("bingo_session") || Math.random().toString(36).substring(2, 15);
      const info = { name, avatar, sessionId };
      localStorage.setItem("bingo_player", JSON.stringify(info));
      onConfirm(info);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card w-full max-w-md"
      >
        <Logo className="mb-10" />

        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Your Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter nickname"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Choose Avatar</label>
            <div className="grid grid-cols-4 gap-4">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  onClick={() => setAvatar(av)}
                  className={`relative aspect-square rounded-full transition-all duration-300 group ${
                    avatar === av 
                      ? "scale-110 z-10 shadow-[0_0_25px_rgba(79,70,229,0.4)] border-4 border-indigo-500" 
                      : "border-2 border-transparent grayscale hover:grayscale-0 hover:scale-105 hover:shadow-lg"
                  }`}
                >
                  <img src={av} alt="Avatar" className="w-full h-full object-cover rounded-full bg-slate-50" referrerPolicy="no-referrer" />
                  {avatar === av && (
                    <motion.div 
                      layoutId="selected-glow"
                      className="absolute -inset-1 rounded-full bg-indigo-500/10 -z-10"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleConfirm}
            disabled={!name}
            className="btn-primary w-full py-5 text-lg"
          >
            Start Playing
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function LobbyScreen({ playerInfo, onCreate, onJoin, onLogout, error, socketConnected }: any) {
  const [code, setCode] = useState("");

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column: Dashboard */}
        <div className="flex-1 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="premium-card"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={playerInfo.avatar} alt="" className="w-16 h-16 rounded-full border-2 border-white shadow-md bg-white" referrerPolicy="no-referrer" />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${socketConnected ? "bg-emerald-500" : "bg-red-500"} border-2 border-white rounded-full`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{playerInfo.name}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {socketConnected ? "Online" : "Connecting..."}
                  </p>
                </div>
              </div>
              <button onClick={onLogout} className="p-3 text-slate-400 hover:text-red-500 transition-colors">
                <LogOut className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={onCreate} className="btn-accent w-full">
                <Plus className="w-5 h-5" /> Create Room
              </button>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Room Code"
                  maxLength={6}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 focus:outline-none focus:border-indigo-500 transition-all font-bold tracking-widest uppercase"
                />
                <button 
                  onClick={() => onJoin(code)}
                  disabled={code.length !== 6}
                  className="btn-primary px-6"
                >
                  Join
                </button>
              </div>
            </div>
          </motion.div>

          {/* Rules Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="premium-card"
          >
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-6 h-6 text-indigo-500" />
              <h3 className="text-lg font-bold text-slate-800">Game Rules</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Each player arranges numbers from 1 to 25 in a 5×5 grid.",
                "Players select numbers one by one during the game.",
                "Selected numbers turn red on every board.",
                "When a row, column, or diagonal completes, it counts as one line.",
                "Each completed line lights one letter in B I N G O.",
                "The first player to complete B I N G O wins the game."
              ].map((rule, i) => (
                <li key={i} className="flex gap-4 text-sm text-slate-600 leading-relaxed">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">{i + 1}</span>
                  {rule}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Right Column: Logo & Branding */}
        <div className="hidden md:flex w-80 flex-col items-center justify-center">
          <Logo />
          <p className="text-slate-400 font-medium text-center mt-6 px-8">
            The ultimate multiplayer bingo experience. Connect with friends and play now.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl shadow-xl flex items-center gap-3 font-bold"
          >
            <XCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoomScreen({ room, socketId, onLeave }: any) {
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card"
      >
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Game Lobby</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Room Code:</span>
                <span className="text-lg font-black text-indigo-600 tracking-widest">{room.code}</span>
              </div>
            </div>
          </div>
          <button onClick={onLeave} className="btn-danger">
            Leave Room
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 mb-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Players ({room.players.length})</h3>
            <span className="text-xs font-medium text-slate-400 italic">Waiting for players to ready up...</span>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {room.players.map((p: any, idx: number) => (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.95, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: 10 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="player-row"
                >
                  <div className="relative">
                    <img 
                      src={p.avatar} 
                      alt="" 
                      className={`w-12 h-12 rounded-full border-2 bg-white ${p.isReady ? "border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "border-slate-200"}`} 
                      referrerPolicy="no-referrer" 
                    />
                    {p.isReady && (
                      <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-white">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{p.name}</span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md uppercase tracking-wider">Host</span>
                      )}
                      {p.id === socketId && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md uppercase tracking-wider">You</span>
                      )}
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest border ${
                    p.isReady 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                      : "bg-slate-50 text-slate-400 border-slate-100"
                  }`}>
                    {p.isReady ? "READY" : "WAITING"}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function GameScreen({ 
  room, 
  socketId, 
  sessionId,
  myBoard, 
  setMyBoard, 
  isReady, 
  onReady, 
  onPick, 
  countdown,
  onPlayAgain,
  onExit,
  soundEnabled,
  onToggleSound,
  notification
}: any) {
  const currentPlayer = room.players[room.currentTurnIndex];
  const isMyTurn = currentPlayer?.id === socketId;

  // Bingo Progress
  const checkLines = useCallback(() => {
    if (!myBoard.length) return 0;
    const size = 5;
    let lines = 0;
    const called = room.calledNumbers;
    for (let i = 0; i < size; i++) {
      if (myBoard.slice(i * size, (i + 1) * size).every(n => called.includes(n))) lines++;
    }
    for (let i = 0; i < size; i++) {
      let col = true;
      for (let j = 0; j < size; j++) {
        if (!called.includes(myBoard[i + j * size])) { col = false; break; }
      }
      if (col) lines++;
    }
    let d1 = true, d2 = true;
    for (let i = 0; i < size; i++) {
      if (!called.includes(myBoard[i * (size + 1)])) d1 = false;
      if (!called.includes(myBoard[(i + 1) * (size - 1)])) d2 = false;
    }
    if (d1) lines++;
    if (d2) lines++;
    return lines;
  }, [room.calledNumbers, myBoard]);

  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  const handleCellClick = (index: number) => {
    if (room.gameState === "waiting" && !isReady) {
      if (selectedCell === null) {
        setSelectedCell(index);
      } else {
        const newBoard = [...myBoard];
        const temp = newBoard[selectedCell];
        newBoard[selectedCell] = newBoard[index];
        newBoard[index] = temp;
        setMyBoard(newBoard);
        setSelectedCell(null);
      }
    } else if (room.gameState === "playing" && isMyTurn) {
      onPick(myBoard[index]);
    }
  };

  const shuffleBoard = () => {
    const nums = Array.from({ length: 25 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    setMyBoard(nums);
    setSelectedCell(null);
  };

  const linesCount = checkLines();
  const bingoLetters = "BINGO".split("");

  return (
    <div className="min-h-screen p-4 flex flex-col max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-12 w-full gap-2">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="bg-white border border-slate-200 py-2 px-3 md:px-4 rounded-xl text-xs md:sm font-bold text-indigo-600 shadow-sm">{room.code}</div>
          <button onClick={onToggleSound} className="p-2 md:p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
            {soundEnabled ? <Volume2 className="w-4 h-4 md:w-5 md:h-5" /> : <VolumeX className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
        </div>
        
        <div className="flex gap-1 md:gap-2">
          {bingoLetters.map((letter, i) => (
            <div 
              key={i} 
              className={`bingo-letter ${i < linesCount ? "active" : "inactive"}`}
            >
              {letter}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={onExit}
            className="p-2 md:p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 transition-all shadow-sm group"
            title="Leave Game"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
          </button>
          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Players</p>
            <p className="text-lg font-black text-slate-800 leading-none">{room.players.length}</p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
            <Users className="w-4 h-4 md:w-5 md:h-5" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10 w-full">
        {room.gameState === "playing" && (
          <div className="w-full max-w-md text-center">
            <motion.div 
              animate={isMyTurn ? { y: [0, -5, 0] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`bg-white border-2 rounded-3xl mb-6 py-4 px-6 shadow-xl transition-all ${isMyTurn ? "border-indigo-500" : "border-slate-100 opacity-60"}`}
            >
              <div className="flex items-center justify-center gap-4">
                <div className="relative">
                  <img src={currentPlayer.avatar} alt="" className={`w-12 h-12 rounded-full border-2 bg-white ${isMyTurn ? "border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)]" : "border-slate-200"}`} referrerPolicy="no-referrer" />
                  {isMyTurn && <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white animate-pulse"></div>}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                    {isMyTurn ? "Your Turn" : "Their Turn"}
                  </p>
                  <span className="font-bold text-slate-800 text-xl leading-none">
                    {isMyTurn ? "Pick a number" : currentPlayer.name}
                  </span>
                </div>
              </div>
            </motion.div>
            
            <div className="h-24 flex flex-col items-center justify-center bg-white/50 rounded-3xl border border-slate-100 mb-4">
              {room.calledNumbers.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={room.calledNumbers[room.calledNumbers.length - 1]}
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="text-center"
                  >
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Call</p>
                    <div className="text-5xl font-black text-indigo-600">{room.calledNumbers[room.calledNumbers.length - 1]}</div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <p className="text-slate-400 font-bold italic">Waiting for first pick...</p>
              )}
            </div>
          </div>
        )}

        {/* Board */}
        <div className="w-full max-w-md relative">
          {room.gameState === "waiting" && !isReady && (
            <p className="text-center text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest">
              Click two cells to swap positions
            </p>
          )}
          <div className="bingo-grid p-4 premium-card relative">
            {myBoard.length === 0 ? (
              Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className="bingo-cell empty" />
              ))
            ) : (
              myBoard.map((num, i) => {
                const isCalled = room.calledNumbers.includes(num);
                const size = 5;
                const row = Math.floor(i / size);
                const col = i % size;
                const rowComplete = myBoard.slice(row * size, (row + 1) * size).every(n => room.calledNumbers.includes(n));
                const colComplete = Array.from({ length: size }).every((_, r) => room.calledNumbers.includes(myBoard[col + r * size]));
                const d1Complete = i % (size + 1) === 0 && Array.from({ length: size }).every((_, idx) => room.calledNumbers.includes(myBoard[idx * (size + 1)]));
                const d2Complete = i > 0 && i < 24 && i % (size - 1) === 0 && Array.from({ length: size }).every((_, idx) => room.calledNumbers.includes(myBoard[(idx + 1) * (size - 1)]));
                
                const isCompleted = rowComplete || colComplete || d1Complete || d2Complete;
                const isSelectedForSwap = selectedCell === i;

                return (
                  <motion.div 
                    key={i}
                    whileHover={!isReady && room.gameState === "waiting" ? { scale: 1.05 } : {}}
                    whileTap={!isReady && room.gameState === "waiting" ? { scale: 0.95 } : {}}
                    onClick={() => handleCellClick(i)}
                    className={`bingo-cell ${
                      isCalled 
                        ? (isCompleted ? "completed" : "selected") 
                        : (isSelectedForSwap ? "border-indigo-500 border-4 text-indigo-500 bg-indigo-50" : "")
                    }`}
                  >
                    {num}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Setup Controls */}
        {room.gameState === "waiting" && (
          <div className="w-full max-w-md space-y-4">
            {!isReady ? (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={shuffleBoard} className="btn-secondary">
                  <RefreshCw className="w-5 h-5" /> Shuffle
                </button>
                <button 
                  onClick={onReady} 
                  disabled={myBoard.length !== 25}
                  className="btn-accent"
                >
                  Ready
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Waiting for players...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="text-[12rem] font-black text-indigo-600 drop-shadow-2xl"
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner Overlay */}
      <AnimatePresence>
        {room.gameState === "finished" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md text-center relative overflow-hidden shadow-2xl p-8 border border-white/20"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              
              <motion.div 
                initial={{ rotate: -10, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="w-24 h-24 bg-yellow-400/10 rounded-3xl flex items-center justify-center mx-auto mb-6 relative"
              >
                <Trophy className="w-12 h-12 text-yellow-500" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-yellow-400/20 rounded-3xl blur-xl"
                />
              </motion.div>
              
              {room.winner?.sessionId === sessionId ? (
                <>
                  <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">
                    {room.players.length === 1 ? "Victory!" : "🎉 Congratulations!"}
                  </h2>
                  <p className="text-indigo-600 font-bold text-lg mb-8">
                    {room.players.length === 1 ? "Your opponent left the match. You win!" : "You won the match!"}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Game Over</h2>
                  <p className="text-slate-500 font-bold text-lg mb-8">
                    {`Player ${room.winner?.name} has won the match.`}
                  </p>
                </>
              )}
              
              <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100 flex flex-col items-center gap-4">
                <div className="relative">
                  <img src={room.winner?.avatar} alt="" className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-white" referrerPolicy="no-referrer" />
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute -inset-1 rounded-full border-2 border-indigo-500/30"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 leading-tight">{room.winner?.name}</h3>
                  <p className="text-emerald-500 font-bold text-xs uppercase tracking-widest mt-1">Match Winner</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={onPlayAgain} 
                  className="btn-primary py-4 text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                >
                  Play Again
                </button>
                <button 
                  onClick={onExit} 
                  className="btn-secondary py-4 text-sm uppercase tracking-widest hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all"
                >
                  Exit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-8 left-1/2 z-[110] px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 font-bold border border-white/10"
          >
            <Info className="w-5 h-5 text-indigo-400" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
