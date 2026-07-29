import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { socket, connectSocket, disconnectSocket } from './socket';
import { Player, Room, ThemeMode, MoveLog, GameScreen } from './types';
import { generateRandomBoard, calculateCompletedLines, getCompletedLinePositions, chooseAiNumber } from './services/aiBot';
import type { LinePosition } from './services/aiBot';
import { DesktopHeader } from './components/DesktopHeader';
import { IntroScreen } from './components/IntroScreen';
import { NameEntryModal } from './components/NameEntryModal';
import { MainChoiceMenu } from './components/MainChoiceMenu';
import { RoomHubModal } from './components/RoomHubModal';
import { LobbyScreen } from './components/LobbyScreen';
import { MoveLogBanner } from './components/MoveLogBanner';

import { Trophy, ArrowLeft, Shuffle, Play, Bot, Swords, UserMinus } from 'lucide-react';

export function App() {
  const [theme, setTheme] = useState<ThemeMode>(() =>
    (localStorage.getItem('bingo_theme') as ThemeMode) || 'dark'
  );
  const [screen, setScreen] = useState<GameScreen>('intro');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('bingo_player_name') || '');
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('bingo_session_id');
    if (!id) { id = Math.random().toString(36).substring(2, 9); localStorage.setItem('bingo_session_id', id); }
    return id;
  });
  const [socketId, setSocketId] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [room, setRoom] = useState<Room | null>(null);
  const [myBoard, setMyBoard] = useState<number[][] | null>(() => generateRandomBoard(5));
  const [linesCount, setLinesCount] = useState(0);

  const [isSingleplayer, setIsSingleplayer] = useState(false);
  const [spCalledNumbers, setSpCalledNumbers] = useState<number[]>([]);
  const [spTurnIndex, setSpTurnIndex] = useState(0);
  const [spPlayers, setSpPlayers] = useState<Player[]>([]);
  const [moveLogs, setMoveLogs] = useState<MoveLog[]>([]);
  const [spWinner, setSpWinner] = useState<Player | null>(null);
  const [onlineCountdown, setOnlineCountdown] = useState<number | null>(null);
  const [completedLines, setCompletedLines] = useState<LinePosition[]>([]);

  const boardRef = useRef(myBoard);
  boardRef.current = myBoard;

  useEffect(() => { localStorage.setItem('bingo_theme', theme); }, [theme]);
  useEffect(() => { if (playerName) localStorage.setItem('bingo_player_name', playerName); }, [playerName]);

  // Network status detection
  useEffect(() => {
    const onOnline = () => { setIsOnline(true); };
    const onOffline = () => { setIsOnline(false); };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  // Socket connection tracking
  useEffect(() => {
    const onConnect = () => { setSocketId(socket.id || ''); };
    const onDisconnect = () => { setSocketId(''); };
    const onConnectError = () => { setSocketId(''); };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    if (socket.connected) setSocketId(socket.id || '');
    return () => { socket.off('connect', onConnect); socket.off('disconnect', onDisconnect); socket.off('connect_error', onConnectError); };
  }, []);

  const handleCallNumber = useCallback((num: number, callerName?: string) => {
    setSpCalledNumbers(prev => {
      if (prev.includes(num)) return prev;
      const caller = spPlayers[spTurnIndex];
      const name = callerName || caller?.name || playerName;
      const log: MoveLog = {
        id: Date.now().toString(), playerName: name, calledNumber: num,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setMoveLogs(prevLogs => [...prevLogs, log]);
      const updatedCalled = [...prev, num];
      let winnerFound: Player | null = null;
      const updatedPlayers = spPlayers.map(p => {
        if (!p.board) return p;
        const l = calculateCompletedLines(p.board, updatedCalled);
        const won = l >= 5;
        if (won && !winnerFound) winnerFound = { ...p, lines: l, won: true };
        return { ...p, lines: l, won };
      });
      setSpPlayers(updatedPlayers);
      if (boardRef.current) setLinesCount(calculateCompletedLines(boardRef.current, updatedCalled));
      if (winnerFound) {
        setSpWinner(winnerFound);
        if ((winnerFound as Player).id === 'human') confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } else {
        setSpTurnIndex(prev => (prev + 1) % spPlayers.length);
      }
      return updatedCalled;
    });
  }, [spPlayers, spTurnIndex, playerName]);

  const handleOnlineCallNumber = useCallback((num: number) => {
    if (!room) return;
    socket.emit('call-number', { roomCode: room.code, number: num });
  }, [room]);

  useEffect(() => {
    socket.on('room-created', (roomData: Room) => { setRoom(roomData); setMyBoard(generateRandomBoard(5)); setScreen('lobby'); });
    socket.on('room-joined', (roomData: Room) => { setRoom(roomData); setMyBoard(generateRandomBoard(5)); setScreen('lobby'); });
    socket.on('player-joined', (roomData: Room) => setRoom(roomData));
    socket.on('player-ready-update', (roomData: Room) => setRoom(roomData));
    socket.on('player-left', (roomData: Room) => setRoom(roomData));

    socket.on('game-starting', (roomData: Room) => { setRoom(roomData); setOnlineCountdown(3); });

    socket.on('game-arranging', (roomData: Room) => {
      setRoom(roomData);
      setOnlineCountdown(null);
      const currentBoard = boardRef.current;
      if (currentBoard) socket.emit('set-ready', { roomCode: roomData.code, board: currentBoard });
    });

    socket.on('game-started', (roomData: Room) => {
      setRoom(roomData);
      setScreen('gameplay');
      setMoveLogs([]);
      setOnlineCountdown(null);
      setSpCalledNumbers([]);
      setLinesCount(0);
      setSpWinner(null);
      setCompletedLines([]);
      const sp: Player[] = roomData.players.map(p => ({
        ...p, isAi: p.sessionId === 'bot_1' || p.sessionId === 'bot_2',
      }));
      setSpPlayers(sp);
      const humanPlayer = roomData.players.find(p => p.sessionId === sessionId);
      if (humanPlayer) {
        setMyBoard(humanPlayer.board || generateRandomBoard(5));
        setSpTurnIndex(roomData.currentTurnIndex || 0);
      }
    });

    socket.on('number-called', ({ room: roomData, calledNumber }: { room: Room; calledNumber: number }) => {
      setRoom(roomData);
      const callerIdx = (roomData.currentTurnIndex - 1 + roomData.players.length) % roomData.players.length;
      const caller = roomData.players[callerIdx];
      const log: MoveLog = {
        id: Date.now().toString(), playerName: caller?.name || 'Player', calledNumber,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setMoveLogs(prev => [...prev, log]);
      setSpCalledNumbers(prev => {
        if (prev.includes(calledNumber)) return prev;
        const updated = [...prev, calledNumber];
        if (myBoard) {
          const l = calculateCompletedLines(myBoard, updated);
          setLinesCount(l);
          if (l >= 5 && room) socket.emit('check-bingo', { roomCode: room.code, lines: l });
        }
        return updated;
      });
      setSpTurnIndex(roomData.currentTurnIndex);
    });

    socket.on('game-over', ({ room: roomData, winner }: { room: Room; winner: Player }) => {
      setRoom(roomData);
      if (winner.sessionId === sessionId) confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setSpWinner(winner);
    });

    socket.on('opponent-left-win', ({ room: roomData, winner }: { room: Room; winner: Player }) => {
      setRoom(roomData);
      if (winner.sessionId === sessionId) confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setSpWinner(winner);
    });

    socket.on('play-again-accepted', (roomData: Room) => {
      setRoom(roomData);
      setSpWinner(null);
      setScreen('lobby');
      setSpCalledNumbers([]);
      setLinesCount(0);
      setCompletedLines([]);
      setMoveLogs([]);
    });

    socket.on('player-lines-update', (roomData: Room) => setRoom(roomData));

    socket.on('error', (msg: string) => alert(msg));

    return () => {
      socket.off('room-created'); socket.off('room-joined'); socket.off('player-joined');
      socket.off('player-ready-update'); socket.off('player-left'); socket.off('game-started');
      socket.off('game-starting'); socket.off('game-arranging');
      socket.off('number-called'); socket.off('game-over'); socket.off('error');
      socket.off('opponent-left-win'); socket.off('play-again-accepted'); socket.off('player-lines-update');
    };
  }, [sessionId, myBoard]);

  useEffect(() => {
    if (!myBoard) { setCompletedLines([]); return; }
    const calledNums = isSingleplayer ? spCalledNumbers : (room?.calledNumbers || []);
    setCompletedLines(getCompletedLinePositions(myBoard, calledNums));
  }, [myBoard, spCalledNumbers, room?.calledNumbers, isSingleplayer]);

  useEffect(() => {
    if (onlineCountdown === null || onlineCountdown <= 0) return;
    const t = setTimeout(() => setOnlineCountdown(prev => prev !== null ? prev - 1 : null), 1000);
    return () => clearTimeout(t);
  }, [onlineCountdown]);

  const handleIntroEnter = () => { if (!playerName.trim()) setScreen('name_prompt'); else setScreen('main_menu'); };
  const handleSaveName = (name: string) => { setPlayerName(name); setScreen('main_menu'); };
  const handleShuffleBoard = () => setMyBoard(generateRandomBoard(5));

  const startSingleplayerMatch = () => {
    setIsSingleplayer(true);
    const board = myBoard || generateRandomBoard(5);
    setMyBoard(board);
    setLinesCount(0);
    setMoveLogs([]);
    setSpCalledNumbers([]);
    setSpTurnIndex(0);
    setSpWinner(null);
    setCompletedLines([]);
    const human: Player = {
      id: "human", sessionId, name: playerName || "Player",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Felix",
      ready: true, board, lines: 0, won: false, isHost: true,
    };
    const ai1: Player = {
      id: "ai_1", sessionId: "bot_1", name: "CyberBot",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Milo",
      ready: true, board: generateRandomBoard(5), lines: 0, won: false, isHost: false, isAi: true,
    };
    const ai2: Player = {
      id: "ai_2", sessionId: "bot_2", name: "Valkyrie",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Sophie",
      ready: true, board: generateRandomBoard(5), lines: 0, won: false, isHost: false, isAi: true,
    };
    setSpPlayers([human, ai1, ai2]);
    setScreen('gameplay');
  };

  useEffect(() => {
    if (!isSingleplayer || screen !== 'gameplay' || spWinner) return;
    const current = spPlayers[spTurnIndex];
    if (current?.isAi) {
      const timer = setTimeout(() => {
        const num = chooseAiNumber(current, spCalledNumbers, 'cyber');
        handleCallNumber(num, current.name);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isSingleplayer, screen, spTurnIndex, spCalledNumbers, spWinner, spPlayers, handleCallNumber]);

  const dark = theme === 'dark';
  const bg = dark ? 'bg-[#090d16] text-white' : 'bg-slate-50 text-slate-900';
  const card = dark ? 'bg-[#0f1623] border-white/8' : 'bg-white border-slate-200 shadow-sm';
  const isCountingDown = onlineCountdown !== null && onlineCountdown > 0;
  const isOnlineHost = !isSingleplayer && !!room && room.hostId === socketId;

  const handlePlayAgain = () => {
    if (isSingleplayer) {
      setSpWinner(null);
      startSingleplayerMatch();
    } else if (room) {
      socket.emit('play-again', { roomCode: room.code });
    }
  };

  const handleExitGame = () => {
    setSpWinner(null);
    if (isSingleplayer) {
      setIsSingleplayer(false);
    } else if (room) {
      socket.emit('leave-room', { roomCode: room.code });
      disconnectSocket();
      setRoom(null);
    }
    setScreen('main_menu');
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${bg} pt-12`}>
      <DesktopHeader theme={theme} onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} playerName={playerName} />



      {screen === 'intro' && <IntroScreen theme={theme} onEnter={handleIntroEnter} />}
      {screen === 'name_prompt' && <NameEntryModal theme={theme} onSaveName={handleSaveName} />}

      {screen === 'main_menu' && (
        <MainChoiceMenu
          theme={theme}
          playerName={playerName}
          isOnline={isOnline}
          onChangeName={() => setScreen('name_prompt')}
          onSelectRoom={() => {
            if (!isOnline) {
              return;
            }
            connectSocket();
            setScreen('room_hub');
          }}
          onSelectAi={() => { setMyBoard(generateRandomBoard(5)); setScreen('offline_lobby'); }}
        />
      )}

      {screen === 'room_hub' && (
        <RoomHubModal
          theme={theme}
          isOnline={isOnline}
          onBack={() => setScreen('main_menu')}
          onCreateRoom={() => { connectSocket(); socket.emit('create-room', { name: playerName, avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Felix", sessionId }); }}
          onJoinRoom={(code) => { connectSocket(); socket.emit('join-room', { roomCode: code, name: playerName, avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Felix", sessionId }); }}
        />
      )}

      {screen === 'lobby' && room && (
        <>
          <LobbyScreen
            theme={theme}
            room={room}
            myPlayerId={socketId}
            isHost={room.hostId === socketId}
            myBoard={myBoard}
            onShuffleBoard={handleShuffleBoard}
            onToggleReady={() => socket.emit('set-ready', { roomCode: room.code, board: boardRef.current })}
            onStartGame={() => socket.emit('start-game-request', { roomCode: room.code })}
            onLeaveRoom={() => {
              socket.emit('leave-room', { roomCode: room.code });
              setRoom(null); setScreen('main_menu');
            }}
          />
          {isCountingDown && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className={`rounded-2xl border p-10 text-center ${dark ? 'bg-[#0f1623] border-white/10' : 'bg-white border-slate-200'}`}>
                <p className={`text-sm font-bold mb-2 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>GAME STARTING</p>
                <p className="text-6xl font-black text-amber-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>{onlineCountdown}</p>
                <p className={`text-xs mt-3 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Get ready to play!</p>
              </div>
            </div>
          )}
        </>
      )}

      {screen === 'offline_lobby' && (
        <div className="w-full max-w-3xl mx-auto px-4 py-8">
          <button onClick={() => setScreen('main_menu')} className={`flex items-center gap-2 text-xs font-semibold mb-8 transition-colors ${dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'}`}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className={`rounded-2xl border p-6 sm:p-8 mb-6 ${card}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-slate-600/15 border border-slate-500/15' : 'bg-slate-100 border border-slate-200'}`}>
                <Swords className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className={`text-lg font-black ${dark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>VS AI</h2>
                <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Solo match against 2 AI opponents</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`rounded-2xl border p-6 flex flex-col ${card}`}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-base">Your Board</h3>
                <span className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>5x5 Grid</span>
              </div>
              <p className={`text-xs mb-5 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Shuffle until you find a board you like.</p>
              {myBoard && (
                <div className={`grid grid-cols-5 gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl border mb-5 ${dark ? 'bg-[#090d16] border-white/6' : 'bg-slate-50 border-slate-200'}`}>
                  {myBoard.map((row, r) => row.map((num, c) => (
                    <div key={`${r}-${c}`} className={`aspect-square rounded-lg flex items-center justify-center font-bold text-sm sm:text-base transition-all ${dark ? 'bg-[#141b2d] text-slate-300 border border-white/6' : 'bg-white text-slate-700 border border-slate-200 shadow-sm'}`}>{num}</div>
                  )))}
                </div>
              )}
              <div className="flex gap-3 mt-auto">
                <button onClick={handleShuffleBoard} className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all duration-200 ${dark ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/8 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}>
                  <Shuffle className="w-4 h-4" /> Shuffle
                </button>
                <button onClick={startSingleplayerMatch} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-emerald-600/20">
                  <Play className="w-4 h-4 fill-white" /> Start Match
                </button>
              </div>
            </div>
            <div className={`rounded-2xl border p-6 flex flex-col ${card}`}>
              <h3 className="font-bold text-base mb-4">Opponents</h3>
              <div className="space-y-3">
                {[{ name: 'CyberBot', seed: 'Milo', tag: 'TACTICAL' }, { name: 'Valkyrie', seed: 'Sophie', tag: 'AGGRESSIVE' }].map((ai) => (
                  <div key={ai.name} className={`flex items-center gap-3 p-3 rounded-xl border ${dark ? 'bg-white/3 border-white/6' : 'bg-slate-50 border-slate-200'}`}>
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${ai.seed}`} alt="" className="w-9 h-9 rounded-lg shrink-0 bg-slate-900" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{ai.name}</p>
                      <p className={`text-[10px] font-medium ${dark ? 'text-slate-600' : 'text-slate-400'}`}>{ai.tag}</p>
                    </div>
                    <Bot className={`w-4 h-4 ${dark ? 'text-slate-600' : 'text-slate-400'}`} />
                  </div>
                ))}
              </div>
              <p className={`text-[10px] mt-4 ${dark ? 'text-slate-700' : 'text-slate-400'}`}>AI opponents take turns calling numbers. First to complete 5 lines wins.</p>
            </div>
          </div>
        </div>
      )}

      {screen === 'gameplay' && (
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {isCountingDown && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className={`rounded-2xl border p-10 text-center ${dark ? 'bg-[#0f1623] border-white/10' : 'bg-white border-slate-200'}`}>
                <p className={`text-sm font-bold mb-2 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>GET READY</p>
                <p className="text-6xl font-black text-amber-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>{onlineCountdown}</p>
              </div>
            </div>
          )}

          <div className={`flex items-center justify-between mb-4 sm:mb-5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border ${card}`}>
            <button onClick={handleExitGame} className={`flex items-center gap-2 text-xs font-semibold transition-colors ${dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'}`}>
              <ArrowLeft className="w-4 h-4" /> Exit
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className={`text-xs font-semibold ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isSingleplayer ? 'Solo vs AI' : `Room ${room?.code || ''}`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            <div className="lg:col-span-2 flex flex-col items-center">
              {/* B-I-N-G-O line tracker */}
              <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
                {['B', 'I', 'N', 'G', 'O'].map((letter, idx) => {
                  const done = linesCount > idx;
                  return (
                    <div key={letter} className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-sm sm:text-base transition-all duration-500 ${
                      done
                        ? 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/30'
                        : dark ? 'bg-[#141b2d] text-slate-700 border border-white/6' : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {letter}
                      {done && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#090d16] flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {myBoard && (
                <div className="w-full max-w-lg">
                  <div className={`relative grid grid-cols-5 gap-2 sm:gap-2.5 p-3 sm:p-5 rounded-2xl border overflow-visible ${card}`}>
                    {myBoard.map((row, r) => row.map((num, c) => {
                      const calledNumbers = isSingleplayer ? spCalledNumbers : (room?.calledNumbers || []);
                      const isCalled = calledNumbers.includes(num);
                      const cellLines = completedLines.filter(line => line.cells.some(cell => cell.r === r && cell.c === c));
                      const isInCompletedLine = cellLines.length > 0;
                      let isMyTurn = false;
                      if (isSingleplayer) { isMyTurn = spPlayers[spTurnIndex]?.id === 'human'; }
                      else if (room) { isMyTurn = room.players[room.currentTurnIndex]?.id === socketId; }
                      const handleClick = () => {
                        if (isCalled || !isMyTurn) return;
                        if (isSingleplayer) handleCallNumber(num);
                        else handleOnlineCallNumber(num);
                      };
                      return (
                        <button key={`${r}-${c}`} onClick={handleClick} disabled={!isMyTurn || isCalled}
                          className={`relative aspect-square rounded-xl font-bold text-sm sm:text-lg transition-all duration-200 flex items-center justify-center ${
                            isCalled
                              ? isInCompletedLine
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-95 cell-pop ring-2 ring-emerald-300/50'
                                : 'bg-blue-600 text-white shadow-md scale-95 cell-pop'
                              : isMyTurn
                                ? dark ? 'bg-[#141b2d] border border-white/10 text-slate-200 hover:bg-[#1c2540] hover:border-blue-500/40 hover:scale-105 active:scale-95 cursor-pointer'
                                  : 'bg-white border border-slate-200 text-slate-800 hover:border-blue-400 hover:scale-105 active:scale-95 shadow-sm cursor-pointer'
                                : dark ? 'bg-[#0d1220] border border-white/5 text-slate-700 cursor-not-allowed'
                                  : 'bg-slate-50 border border-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {isInCompletedLine && cellLines.map((line, li) => {
                            return (
                              <React.Fragment key={`${line.type}-${li}`}>
                                {line.type === 'row' && (
                                  <>
                                    <div className="line-strike" style={{ width: '140%', left: '-20%', top: 'calc(50% - 1.5px)' }} />
                                    <div className="line-glow" style={{ width: '140%', left: '-20%', top: 'calc(50% - 3.5px)' }} />
                                  </>
                                )}
                                {line.type === 'col' && (
                                  <div style={{ position: 'absolute', inset: 0, transform: 'rotate(90deg)', pointerEvents: 'none' }}>
                                    <div className="line-strike" style={{ width: '140%', left: '-20%', top: 'calc(50% - 1.5px)' }} />
                                    <div className="line-glow" style={{ width: '140%', left: '-20%', top: 'calc(50% - 3.5px)' }} />
                                  </div>
                                )}
                                {line.type === 'diag1' && (
                                  <div style={{ position: 'absolute', inset: 0, transform: 'rotate(45deg)', pointerEvents: 'none' }}>
                                    <div className="line-strike" style={{ width: '170%', left: '-35%', top: 'calc(50% - 1.5px)' }} />
                                    <div className="line-glow" style={{ width: '170%', left: '-35%', top: 'calc(50% - 3.5px)' }} />
                                  </div>
                                )}
                                {line.type === 'diag2' && (
                                  <div style={{ position: 'absolute', inset: 0, transform: 'rotate(-45deg)', pointerEvents: 'none' }}>
                                    <div className="line-strike" style={{ width: '170%', left: '-35%', top: 'calc(50% - 1.5px)' }} />
                                    <div className="line-glow" style={{ width: '170%', left: '-35%', top: 'calc(50% - 3.5px)' }} />
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                          {num}
                        </button>
                      );
                    }))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 sm:space-y-4">
              <MoveLogBanner theme={theme} logs={moveLogs} />

              <div className={`rounded-2xl border p-3.5 sm:p-4 ${card}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2.5 sm:mb-3 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Current Turn</p>
                {(() => {
                  let currentPlayer: Player | undefined;
                  let isMyTurn = false;
                  let turnLabel = '';
                  if (isSingleplayer) {
                    currentPlayer = spPlayers[spTurnIndex];
                    isMyTurn = currentPlayer?.id === 'human';
                    turnLabel = isMyTurn ? 'Your turn — pick a number' : 'AI is choosing…';
                  } else if (room) {
                    currentPlayer = room.players[room.currentTurnIndex];
                    isMyTurn = currentPlayer?.id === socketId;
                    turnLabel = isMyTurn ? 'Your turn — pick a number' : `${currentPlayer?.name || 'Player'}'s turn`;
                  }
                  return currentPlayer ? (
                    <div className="flex items-center gap-3">
                      <img src={currentPlayer.avatar} alt="" className="w-10 h-10 rounded-xl shrink-0 bg-slate-900" />
                      <div>
                        <p className="font-bold text-sm">{currentPlayer.name}</p>
                        <p className={`text-xs font-medium ${isMyTurn ? 'text-blue-500' : dark ? 'text-slate-500' : 'text-slate-400'}`}>{turnLabel}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              <div className={`rounded-2xl border p-3.5 sm:p-4 ${card}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2.5 sm:mb-3 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                  Called Numbers <span className="font-mono">({(isSingleplayer ? spCalledNumbers : (room?.calledNumbers || [])).length})</span>
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
                  {(isSingleplayer ? spCalledNumbers : (room?.calledNumbers || [])).length === 0 && (
                    <p className={`text-xs ${dark ? 'text-slate-700' : 'text-slate-400'}`}>None yet.</p>
                  )}
                  {(isSingleplayer ? spCalledNumbers : (room?.calledNumbers || [])).map((n, i) => (
                    <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-blue-600 text-white">{n}</div>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl border p-3.5 sm:p-4 ${card}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2.5 sm:mb-3 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>Scoreboard</p>
                <div className="space-y-2">
                  {(isSingleplayer ? spPlayers : (room?.players || [])).map(p => {
                    const activeTurnId = isSingleplayer ? spPlayers[spTurnIndex]?.id : room?.players[room?.currentTurnIndex]?.id;
                    const pLines = p.lines || 0;
                    return (
                      <div key={p.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all ${activeTurnId === p.id ? dark ? 'bg-blue-600/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200' : dark ? 'bg-white/3 border border-white/5' : 'bg-slate-50 border border-slate-100'}`}>
                        <img src={p.avatar} alt="" className="w-7 h-7 rounded-lg shrink-0 bg-slate-900" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{p.name}</p>
                          <p className={`text-[10px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>{p.isAi ? 'AI' : 'Player'}</p>
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={`w-1.5 h-4 rounded-sm transition-all duration-300 ${i < pLines ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30' : dark ? 'bg-white/8' : 'bg-slate-200'}`} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {spWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl border p-7 shadow-2xl text-center ${dark ? 'bg-[#0f1623] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-2xl font-black mb-1">
              {spWinner.id === 'human' || spWinner.sessionId === sessionId ? 'You Won!' : 'Game Over'}
            </h2>
            <p className={`text-sm mb-6 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              {spWinner.id === 'human' || spWinner.sessionId === sessionId
                ? `Congratulations ${playerName}! BINGO!`
                : spWinner.name === 'Opponent left'
                  ? 'Your opponent left the game. You win!'
                  : `${spWinner.name} got BINGO first.`}
            </p>
            <div className="flex gap-2.5">
              {(isSingleplayer || isOnlineHost) && (
                <button onClick={handlePlayAgain} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all">
                  Play Again
                </button>
              )}
              <button onClick={handleExitGame} className={`flex-1 py-3 rounded-xl font-semibold text-sm border transition-all ${dark ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/8' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                {isSingleplayer || isOnlineHost ? 'Menu' : 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
