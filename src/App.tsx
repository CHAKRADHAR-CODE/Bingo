import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  LogOut, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Play, 
  Info, 
  CheckCircle2,
  Trophy,
  WifiOff,
  LayoutGrid,
  Shuffle,
  Copy,
  Check,
  Crown,
  User
} from "lucide-react";
import confetti from "canvas-confetti";
import { Player, Room, AVATARS } from "./types";
import { 
  socket, 
  createRoom, 
  joinRoom, 
  readyPlayer, 
  callNumber, 
  leaveRoom, 
  startGame, 
  checkBingo, 
  playAgain 
} from "./socket";

const getSessionId = () => {
  let id = localStorage.getItem("bingo_session_id");
  if (!id) {
    id = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("bingo_session_id", id);
  }
  return id;
};

export default function App() {
  const [sessionId, setSessionId] = useState(getSessionId());
  const [view, setView] = useState<"entry" | "lobby" | "room" | "game">("entry");
  const [name, setName] = useState(localStorage.getItem("bingo_name") || "");
  const [avatar, setAvatar] = useState(localStorage.getItem("bingo_avatar") || AVATARS[0]);
  const [roomCode, setRoomCode] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [board, setBoard] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sound effects
  const playSound = useCallback((type: "click" | "win" | "countdown" | "bingo") => {
    if (!soundEnabled) return;
    const sounds: Record<string, string> = {
      click: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
      win: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3",
      countdown: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
      bingo: "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
    };
    const audio = new Audio(sounds[type]);
    audio.play().catch(() => {});
  }, [soundEnabled]);

  const initializeBoard = useCallback(() => {
    const nums = Array.from({ length: 25 }, (_, i) => i + 1);
    const shuffled = [...nums].sort(() => Math.random() - 0.5);
    const newBoard = [];
    for (let i = 0; i < 5; i++) {
      newBoard.push(shuffled.slice(i * 5, (i + 1) * 5));
    }
    setBoard(newBoard);
    playSound("click");
  }, [playSound]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // URL Parameter support
    const urlParams = new URLSearchParams(window.location.search);
    const urlRoomCode = urlParams.get("room");
    if (urlRoomCode && urlRoomCode.length === 6) {
      setRoomCode(urlRoomCode);
    }

    socket.on("room-created", (roomData: Room) => {
      setRoom(roomData);
      setRoomCode(roomData.code);
      setView("room");
      localStorage.setItem("bingo_room_code", roomData.code);
      // Update URL without reload
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?room=' + roomData.code;
      window.history.pushState({ path: newUrl }, '', newUrl);
    });

    socket.on("room-joined", (roomData: Room) => {
      setRoom(roomData);
      setRoomCode(roomData.code);
      setView("room");
      localStorage.setItem("bingo_room_code", roomData.code);
      
      // Sync board if player already has one
      const me = roomData.players.find(p => p.sessionId === sessionId);
      if (me?.board) {
        setBoard(me.board);
      } else if (roomData.gameState === "arranging" || roomData.gameState === "playing") {
        // If we are in these states but have no board, initialize one
        initializeBoard();
      }

      // Update URL without reload
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?room=' + roomData.code;
      window.history.pushState({ path: newUrl }, '', newUrl);
    });

    socket.on("player-joined", (roomData: Room) => {
      setRoom(roomData);
      playSound("click");
    });

    socket.on("player-reconnected", (roomData: Room) => {
      setRoom(roomData);
      const me = roomData.players.find(p => p.sessionId === sessionId);
      if (me?.board) {
        setBoard(me.board);
      }
      if (roomData.gameState === "playing") {
        setView("game");
      } else if (roomData.gameState === "arranging" || roomData.gameState === "waiting") {
        setView("room");
      }
    });

    socket.on("player-ready-update", (roomData: Room) => {
      setRoom(roomData);
    });

    socket.on("game-starting", (roomData: Room) => {
      setRoom(roomData);
      setCountdown(3);
    });

    socket.on("game-arranging", (roomData: Room) => {
      setRoom(roomData);
      initializeBoard(); // Auto-initialize board for everyone
      setView("room");
    });

    socket.on("game-started", (roomData: Room) => {
      setRoom(roomData);
      const me = roomData.players.find(p => p.sessionId === sessionId);
      if (me?.board) {
        setBoard(me.board);
      }
      setView("game");
      setCountdown(null);
    });

    socket.on("number-called", ({ room: roomData, calledNumber }: { room: Room; calledNumber: number }) => {
      setRoom(roomData);
      playSound("click");
      // Optional: show a toast or animation for the new number
    });

    socket.on("player-lines-update", (roomData: Room) => {
      setRoom(roomData);
    });

    socket.on("game-over", ({ room: roomData, winner }: { room: Room; winner: Player }) => {
      setRoom(roomData);
      if (winner.id === socket.id) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
        playSound("win");
      }
    });

    socket.on("opponent-left-win", ({ room: roomData, winner }: { room: Room; winner: Player }) => {
      setRoom(roomData);
      if (winner.id === socket.id) {
        setError("Your opponent left the match. You win!");
        confetti({
          particleCount: 100,
          spread: 50,
          origin: { y: 0.6 }
        });
        playSound("win");
      }
    });

    socket.on("player-left-message", ({ room: roomData, name: leaverName }: { room: Room; name: string }) => {
      setRoom(roomData);
      setError(`Player ${leaverName} has left the game.`);
      setTimeout(() => setError(null), 3000);
    });

    socket.on("player-left", (roomData: Room) => {
      setRoom(roomData);
    });

    socket.on("player-disconnected", (socketId: string) => {
      // Optional: show visual indicator of disconnection
    });

    socket.on("error", (msg: string) => {
      setError(msg);
      setTimeout(() => setError(null), 3000);
    });

    // Auto-reconnect logic
    const savedRoomCode = localStorage.getItem("bingo_room_code");
    const savedName = localStorage.getItem("bingo_name");
    const savedAvatar = localStorage.getItem("bingo_avatar");
    
    // Only auto-reconnect if we are not trying to join a specific room from URL
    if (!urlRoomCode && savedRoomCode && savedName && savedAvatar) {
      joinRoom(savedRoomCode, savedName, savedAvatar, sessionId);
    } else if (urlRoomCode && savedName && savedAvatar) {
      // If we have a URL code and user info, join automatically
      joinRoom(urlRoomCode, savedName, savedAvatar, sessionId);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      socket.off("room-created");
      socket.off("room-joined");
      socket.off("player-joined");
      socket.off("player-reconnected");
      socket.off("player-ready-update");
      socket.off("game-starting");
      socket.off("game-arranging");
      socket.off("game-started");
      socket.off("number-called");
      socket.off("player-lines-update");
      socket.off("game-over");
      socket.off("opponent-left-win");
      socket.off("player-left-message");
      socket.off("player-left");
      socket.off("player-disconnected");
      socket.off("error");
    };
  }, [playSound, initializeBoard, sessionId]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        playSound("countdown");
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      const timer = setTimeout(() => {
        setCountdown(null);
        setView("game");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [countdown, playSound]);

  // Bingo Logic
  const checkBingoLines = useCallback((calledNumbers: number[], currentBoard: number[][]) => {
    let lines = 0;
    const size = 5;

    // Rows
    for (let r = 0; r < size; r++) {
      if (currentBoard[r].every(num => calledNumbers.includes(num))) lines++;
    }
    // Columns
    for (let c = 0; c < size; c++) {
      let colFilled = true;
      for (let r = 0; r < size; r++) {
        if (!calledNumbers.includes(currentBoard[r][c])) {
          colFilled = false;
          break;
        }
      }
      if (colFilled) lines++;
    }
    // Diagonals
    let diag1 = true;
    let diag2 = true;
    for (let i = 0; i < size; i++) {
      if (!calledNumbers.includes(currentBoard[i][i])) diag1 = false;
      if (!calledNumbers.includes(currentBoard[i][size - 1 - i])) diag2 = false;
    }
    if (diag1) lines++;
    if (diag2) lines++;

    return lines;
  }, []);

  useEffect(() => {
    if (room && room.gameState === "playing" && board.length > 0) {
      const lines = checkBingoLines(room.calledNumbers, board);
      const currentPlayer = room.players.find(p => p.id === socket.id);
      if (currentPlayer && currentPlayer.lines !== lines) {
        socket.emit("check-bingo", { roomCode: room.code, lines });
        if (lines > (currentPlayer.lines || 0)) {
          playSound("bingo");
          // Confetti for completing a line
          confetti({
            particleCount: 50,
            spread: 40,
            origin: { y: 0.8 },
            colors: ['#10B981', '#4F46E5']
          });
        }
      }
    }
  }, [room?.calledNumbers, board, room?.code, room?.gameState, checkBingoLines, playSound]);

  const handleStartPlaying = () => {
    if (name.trim()) {
      setView("lobby");
      playSound("click");
    } else {
      setError("Please enter your name");
      setTimeout(() => setError(null), 2000);
    }
  };

  const handleCreateRoom = () => {
    if (name.trim()) {
      createRoom(name, avatar, sessionId);
      playSound("click");
    }
  };

  const handleJoinRoom = () => {
    if (roomCode.length === 6 && name.trim()) {
      joinRoom(roomCode, name, avatar, sessionId);
      playSound("click");
    } else if (!name.trim()) {
      setError("Please enter your name first");
      setView("entry");
      setTimeout(() => setError(null), 2000);
    } else {
      setError("Enter a 6-digit code");
      setTimeout(() => setError(null), 2000);
    }
  };

  const handleCellClick = (rOrNum: number, c?: number) => {
    if (c !== undefined) {
      const r = rOrNum;
      if (room?.gameState === "playing") {
        const num = board[r][c];
        const isMyTurn = room.players[room.currentTurnIndex].id === socket.id;
        if (isMyTurn && !room.calledNumbers.includes(num)) {
          socket.emit("call-number", { roomCode: room.code, number: num });
        }
        return;
      }

      if (selectedCell) {
        const newBoard = [...board.map(row => [...row])];
        const temp = newBoard[r][c];
        newBoard[r][c] = newBoard[selectedCell.r][selectedCell.c];
        newBoard[selectedCell.r][selectedCell.c] = temp;
        setBoard(newBoard);
        setSelectedCell(null);
        playSound("click");
      } else {
        setSelectedCell({ r, c });
      }
    } else {
      const num = rOrNum;
      const isMyTurn = room?.players[room?.currentTurnIndex || 0].id === socket.id;
      if (isMyTurn && !room?.calledNumbers.includes(num)) {
        socket.emit("call-number", { roomCode: room?.code, number: num });
      }
    }
  };

  const handleLogout = () => {
    if (room?.code) {
      leaveRoom(room.code);
    }
    localStorage.clear();
    // Clear URL
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.pushState({ path: newUrl }, '', newUrl);
    window.location.reload();
  };

  const copyRoomCode = () => {
    if (room?.code) {
      const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      playSound("click");
    }
  };

  const handleStartGame = () => {
    if (room?.code) {
      socket.emit("start-game-request", { roomCode: room.code });
    }
  };

  const handleReady = () => {
    if (board.length === 0) return;
    socket.emit("set-ready", { roomCode: room?.code, board });
    playSound("click");
  };

  const handleLeave = () => {
    if (room?.code) {
      leaveRoom(room.code);
      localStorage.removeItem("bingo_room_code");
      // Clear URL
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
    setRoom(null);
    setRoomCode("");
    setView("lobby");
    playSound("click");
  };

  const handlePlayAgain = () => {
    socket.emit("play-again", { roomCode: room?.code });
    playSound("click");
  };

  const premiumVariants = {
    initial: { opacity: 0, scale: 0.96, y: 10, filter: "blur(10px)" },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 1.04, 
      y: -10, 
      filter: "blur(10px)",
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const childVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  };

  const renderEntry = () => (
    <motion.div 
      variants={premiumVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-md w-full glass-card p-10 rounded-[3rem] flex flex-col items-center gap-10 relative overflow-hidden"
    >
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-brand-secondary/10 rounded-full blur-3xl" />

      <motion.div variants={childVariants} className="flex flex-col items-center gap-3 relative z-10">
        <div className="w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
          <LayoutGrid size={40} />
        </div>
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">BINGO</h1>
          <p className="text-slate-400 font-medium tracking-widest text-[10px] uppercase mt-1">Premium Multiplayer</p>
        </div>
      </motion.div>

      <motion.div variants={childVariants} className="w-full space-y-6 relative z-10">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Player Identity</label>
          <div className="relative group">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors" size={20} />
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full bg-white/50 border-2 border-slate-100 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:border-brand-primary focus:bg-white transition-all shadow-sm focus:shadow-md text-lg font-semibold"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Select Avatar</label>
          <div className="grid grid-cols-4 gap-4 p-2">
            {AVATARS.map((av) => (
              <button
                key={av}
                onClick={() => {
                  setAvatar(av);
                  playSound("click");
                }}
                className={`avatar-card ${avatar === av ? 'selected' : ''}`}
              >
                <img src={av} alt="avatar" className="w-full h-full rounded-full bg-slate-50" referrerPolicy="no-referrer" />
                {avatar === av && (
                  <motion.div 
                    layoutId="avatar-glow"
                    className="absolute inset-0 rounded-full ring-4 ring-brand-primary/20 animate-pulse"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.button 
        variants={childVariants}
        onClick={handleStartPlaying}
        className="w-full premium-btn btn-primary text-lg py-5 relative z-10 group"
      >
        <span className="relative z-10">START PLAYING</span>
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      </motion.button>
    </motion.div>
  );

  const renderLobby = () => (
    <motion.div 
      variants={premiumVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-2xl w-full glass-card p-10 rounded-[3rem] space-y-10 relative overflow-hidden"
    >
      <motion.div variants={childVariants} className="flex items-center gap-6 p-6 bg-white/40 rounded-[2rem] border border-white/60">
        <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg">
          <img src={avatar} alt="avatar" className="w-full h-full" referrerPolicy="no-referrer" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-2xl text-slate-800">{name}</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Session</span>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="p-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm hover:shadow-md"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </motion.div>

      <motion.div variants={childVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={childVariants} className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">New Game</label>
          <button 
            onClick={handleCreateRoom}
            className="w-full premium-btn btn-accent flex items-center justify-center gap-3 py-5 shadow-xl shadow-emerald-100"
          >
            <Play size={20} fill="currentColor" />
            CREATE ROOM
          </button>
        </motion.div>
        
        <motion.div variants={childVariants} className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Join Friends</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input 
              type="text" 
              placeholder="CODE"
              maxLength={6}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="flex-1 bg-white/50 border-2 border-slate-100 rounded-2xl px-4 py-4 sm:py-0 font-display font-bold tracking-[0.3em] text-center focus:outline-none focus:border-brand-primary transition-all text-lg min-w-0"
            />
            <button 
              onClick={handleJoinRoom}
              className="premium-btn btn-primary px-6 py-4 sm:py-0 shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:scale-105 active:scale-95 transition-all whitespace-nowrap flex items-center gap-2"
            >
              <Play size={16} fill="currentColor" />
              JOIN
            </button>
          </div>
        </motion.div>
      </motion.div>

      <div className="p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50 space-y-4">
        <div className="flex items-center gap-2 text-brand-primary">
          <Info size={18} />
          <h3 className="font-bold text-sm uppercase tracking-wider">Quick Rules</h3>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            "5x5 Grid (1-25)",
            "Complete 5 lines to win",
            "Real-time multiplayer",
            "Host starts the match"
          ].map((rule, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
  const renderRoom = () => {
    if (room?.gameState === "arranging") {
      return (
        <motion.div 
          variants={premiumVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="max-w-2xl w-full space-y-8"
        >
          <motion.div variants={childVariants} className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-800">Arrange Your Board</h2>
            <p className="text-slate-400 text-sm">Select two numbers to swap or shuffle for a new layout</p>
          </motion.div>

          <motion.div variants={childVariants} className="flex flex-col items-center gap-8">
            <div className="grid grid-cols-5 gap-2 sm:gap-3 p-4 bg-white/40 backdrop-blur-sm rounded-[2.5rem] border border-white/60 shadow-xl">
              {board.length > 0 ? board.map((row, r) => (
                row.map((num, c) => (
                  <motion.div
                    key={`${r}-${c}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCellClick(r, c)}
                    className={`bingo-cell ${selectedCell?.r === r && selectedCell?.c === c ? 'ring-4 ring-brand-primary' : 'bingo-cell-filled'}`}
                  >
                    {num}
                  </motion.div>
                ))
              )) : (
                Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className="bingo-cell bingo-cell-empty" />
                ))
              )}
            </div>

            <div className="flex gap-4 w-full max-w-md">
              <button onClick={initializeBoard} className="flex-1 premium-btn btn-outline py-4">
                <Shuffle size={20} />
                SHUFFLE
              </button>
              <button 
                onClick={handleReady}
                disabled={board.length === 0 || room.players.find(p => p.id === socket.id)?.ready}
                className="flex-1 premium-btn btn-accent py-4 shadow-xl shadow-emerald-100"
              >
                <CheckCircle2 size={20} />
                {room.players.find(p => p.id === socket.id)?.ready ? 'READY!' : 'I\'M READY'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        variants={premiumVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-2xl w-full space-y-8"
      >
        <motion.div variants={childVariants} className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-sm border border-white/60 flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Invite Link</span>
                <span className="font-display font-bold text-2xl text-brand-primary tracking-widest">{room?.code}</span>
              </div>
              <button 
                onClick={copyRoomCode}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-brand-primary"
              >
                {copied ? <Check size={20} className="text-brand-accent" /> : <Copy size={20} />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleLeave} className="premium-btn btn-outline py-3 px-6">
              <LogOut size={18} />
              LEAVE
            </button>
            {room?.hostId === socket.id && room?.gameState === "waiting" && (
              <button 
                onClick={handleStartGame}
                disabled={room.players.length < 2}
                className="premium-btn btn-primary py-3 px-8 shadow-xl shadow-indigo-100"
              >
                <Play size={18} fill="currentColor" />
                START GAME
              </button>
            )}
          </div>
        </motion.div>

        <motion.div variants={childVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Players ({room?.players.length}/10)</h3>
              <span className="text-[10px] font-bold text-brand-accent animate-pulse">Waiting for friends...</span>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              <AnimatePresence mode="popLayout">
                {room?.players.map((p) => (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`player-row ${p.id === socket.id ? 'active' : ''}`}
                  >
                    <div className="relative">
                      <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                      {p.isHost && (
                        <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-0.5 rounded-full shadow-sm">
                          <Crown size={10} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">{p.name}</span>
                        {p.isHost && <span className="host-badge">Host</span>}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{p.id === socket.id ? 'You' : 'Player'}</span>
                    </div>
                    <div className={`status-badge ${p.ready ? 'status-ready' : 'status-waiting'}`}>
                      {p.ready ? 'Ready' : 'Waiting'}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 rounded-[2rem] space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Game Info</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Mode</span>
                  <span className="font-bold text-slate-700">Classic 5x5</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Players</span>
                  <span className="font-bold text-slate-700">{room?.players.length}</span>
                </div>
                <div className="h-px bg-slate-100" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Match will start when the host clicks the start button. Minimum 2 players required.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };
  const renderGame = () => {
    const currentPlayer = room?.players.find(p => p.id === socket.id);
    const activePlayer = room?.players[room.currentTurnIndex];
    const isMyTurn = activePlayer?.id === socket.id;
    const bingoLetters = "BINGO".split("");

    return (
      <motion.div 
        variants={premiumVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-6xl w-full space-y-8 px-4"
      >
        {/* Header */}
        <motion.div variants={childVariants} className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-2xl shadow-sm border border-white/60 flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Room</span>
              <span className="font-display font-bold text-brand-primary">{room?.code}</span>
            </div>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center text-slate-400 hover:text-brand-primary transition-all shadow-sm hover:shadow-md"
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>

          <div className="flex gap-3">
            {bingoLetters.map((letter, i) => (
              <motion.div 
                key={letter}
                animate={{ 
                  scale: (currentPlayer?.lines || 0) > i ? [1, 1.2, 1.1] : 1,
                  backgroundColor: (currentPlayer?.lines || 0) > i ? "#10B981" : "#FFFFFF"
                }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black transition-all duration-500 shadow-sm ${
                  (currentPlayer?.lines || 0) > i 
                    ? 'text-white shadow-emerald-200' 
                    : 'text-slate-200 border border-white/60'
                }`}
              >
                {letter}
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-2xl shadow-sm border border-white/60 flex items-center gap-3">
              <Users size={18} className="text-slate-400" />
              <span className="font-bold text-slate-700">{room?.players.length}</span>
            </div>
            <button onClick={handleLeave} className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm hover:shadow-md">
              <LogOut size={20} />
            </button>
          </div>
        </motion.div>

        {/* Turn Indicator & Last Called */}
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`px-8 py-4 rounded-[2rem] shadow-xl flex items-center gap-4 border-2 transition-all duration-500 ${
              isMyTurn 
                ? 'bg-brand-primary border-brand-primary text-white shadow-indigo-200' 
                : 'bg-white border-slate-100 text-slate-600'
            }`}
          >
            {isMyTurn ? (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                <span className="font-display font-bold tracking-widest text-sm sm:text-base">YOUR TURN</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <img src={activePlayer?.avatar} alt="" className="w-8 h-8 rounded-full border-2 border-slate-100" referrerPolicy="no-referrer" />
                <span className="font-bold text-sm sm:text-base">{activePlayer?.name}'s Turn</span>
              </div>
            )}
          </motion.div>

          {room?.calledNumbers.length > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={room.calledNumbers[room.calledNumbers.length - 1]}
              className="flex flex-col items-center"
            >
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Last Called</span>
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full border-4 border-brand-accent flex items-center justify-center shadow-2xl shadow-emerald-100 relative overflow-hidden">
                <motion.div 
                  initial={{ y: 40 }}
                  animate={{ y: 0 }}
                  className="text-3xl sm:text-4xl font-black text-slate-800 relative z-10"
                >
                  {room.calledNumbers[room.calledNumbers.length - 1]}
                </motion.div>
                <div className="absolute inset-0 bg-brand-accent/5 animate-pulse" />
              </div>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Players List */}
          <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Opponents</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
              {room?.players.map((p) => (
                <div 
                  key={p.id} 
                  className={`player-row ${p.id === activePlayer?.id ? 'active' : ''} ${p.id === socket.id ? 'opacity-60' : ''}`}
                >
                  <div className="relative">
                    <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                    {p.id === activePlayer?.id && (
                      <div className="absolute -inset-1 rounded-full border-2 border-brand-primary animate-ping" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-700 truncate">{p.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-1.5 h-1.5 rounded-full ${p.lines > i ? 'bg-brand-accent' : 'bg-slate-200'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center: Board */}
          <div className="lg:col-span-6 flex flex-col items-center gap-8 order-1 lg:order-2">
            <div className="grid grid-cols-5 gap-2 sm:gap-4 p-5 bg-white/40 backdrop-blur-sm rounded-[3rem] border border-white/60 shadow-2xl">
              {board.map((row, r) => row.map((num, c) => {
                const isCalled = room?.calledNumbers.includes(num);
                return (
                  <motion.div
                    key={`${r}-${c}`}
                    whileHover={isMyTurn && !isCalled ? { scale: 1.05 } : {}}
                    whileTap={isMyTurn && !isCalled ? { scale: 0.95 } : {}}
                    onClick={() => handleCellClick(num)}
                    className={`bingo-cell ${
                      isCalled ? 'bingo-cell-called' : 'bingo-cell-filled'
                    } ${!isMyTurn && !isCalled ? 'cursor-not-allowed opacity-80' : ''}`}
                  >
                    {num}
                  </motion.div>
                );
              }))}
            </div>
          </div>

          {/* Right: History/Stats */}
          <div className="lg:col-span-3 space-y-6 order-3">
            <div className="glass-card p-6 rounded-[2rem] space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Called Numbers</h3>
              <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-hide">
                <AnimatePresence mode="popLayout">
                  {[...room?.calledNumbers || []].reverse().map((num) => (
                    <motion.div
                      key={num}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="aspect-square rounded-xl bg-red-50 text-red-500 flex items-center justify-center font-bold text-sm border border-red-100 shadow-sm"
                    >
                      {num}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {room?.calledNumbers.length === 0 && (
                <p className="text-[10px] text-slate-400 text-center py-4 italic">No numbers called yet</p>
              )}
            </div>

            <div className="glass-card p-6 rounded-[2rem] space-y-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-indigo-200">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Your Progress</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Lines Completed</span>
                  <span className="text-2xl font-black">{currentPlayer?.lines || 0}/5</span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentPlayer?.lines || 0) / 5) * 100}%` }}
                    className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      <div className="bg-blob blob-3" />

      <audio ref={audioRef} />

      {/* Premium Flash Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.2, 0] }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-white pointer-events-none"
        />
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === "entry" && renderEntry()}
        {view === "lobby" && renderLobby()}
        {view === "room" && renderRoom()}
        {view === "game" && renderGame()}
      </AnimatePresence>

      {/* Overlays */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <div className="glass-card p-10 rounded-[3rem] text-center space-y-6 max-w-sm">
              <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <WifiOff size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800">Connection Lost</h2>
                <p className="text-slate-500">You are offline. Please check your internet connection.</p>
              </div>
            </div>
          </motion.div>
        )}

        {countdown !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-primary/90 backdrop-blur-md flex items-center justify-center"
          >
            <motion.span 
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 3, opacity: 0 }}
              className="text-[12rem] font-black text-white font-display"
            >
              {countdown === 0 ? "GO!" : countdown}
            </motion.span>
          </motion.div>
        )}

        {room?.gameState === "finished" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card p-12 rounded-[3.5rem] text-center space-y-8 max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent" />
              
              <div className="space-y-4">
                <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-amber-100/50">
                  <Trophy size={48} />
                </div>
                {room.players.find(p => p.won)?.id === socket.id ? (
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black text-slate-800">VICTORY!</h2>
                    <p className="text-slate-500">🎉 Congratulations! You won the match!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-800">MATCH OVER</h2>
                    <p className="text-slate-500">
                      Player <span className="font-bold text-brand-primary">{room.players.find(p => p.won)?.name}</span> has won the match.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {room.hostId === socket.id ? (
                  <button onClick={handlePlayAgain} className="premium-btn btn-primary py-5 text-lg">
                    <RotateCcw size={20} />
                    PLAY AGAIN
                  </button>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-400 font-medium">
                    Waiting for host to restart...
                  </div>
                )}
                <button onClick={handleLeave} className="premium-btn btn-outline py-4">
                  EXIT TO LOBBY
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]"
          >
            <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
              <Info size={20} className="text-brand-secondary" />
              <span className="font-medium">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
