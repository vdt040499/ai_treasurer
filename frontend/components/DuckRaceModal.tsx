import React, { useState, useEffect, useRef, useCallback } from 'react';

type GamePhase = 'input' | 'countdown' | 'racing' | 'paused' | 'result';

interface RaceHistory {
  id: string;
  date: string;
  foods: string[];
  winner: string;
  duration: number;
}

interface DuckRaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Duck colors - vibrant colors for each duck
const DUCK_COLORS = [
  { body: '#FFD700', beak: '#FF8C00', wing: '#FFA500', label: 'bg-yellow-500' },    // Yellow
  { body: '#FF7F50', beak: '#FF4500', wing: '#FF6347', label: 'bg-orange-500' },    // Orange
  { body: '#FF6B6B', beak: '#DC143C', wing: '#FF4757', label: 'bg-red-500' },       // Red
  { body: '#32CD32', beak: '#228B22', wing: '#3CB371', label: 'bg-green-500' },     // Green
  { body: '#4DA6FF', beak: '#0066CC', wing: '#5DADE2', label: 'bg-blue-500' },      // Blue
  { body: '#9B59B6', beak: '#8E44AD', wing: '#A569BD', label: 'bg-purple-500' },    // Purple
  { body: '#FF69B4', beak: '#FF1493', wing: '#FF85C1', label: 'bg-pink-500' },      // Pink
  { body: '#20B2AA', beak: '#008B8B', wing: '#48D1CC', label: 'bg-teal-500' },      // Teal
];

// SVG Duck Component
const DuckSVG: React.FC<{ color: typeof DUCK_COLORS[0], size?: number, isAnimating?: boolean }> = ({ color, size = 60, isAnimating = false }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
    {/* Water splash behind duck */}
    <ellipse cx="50" cy="85" rx="40" ry="12" fill="white" opacity="0.6">
      {isAnimating && <animate attributeName="rx" values="35;45;35" dur="0.3s" repeatCount="indefinite" />}
    </ellipse>
    <ellipse cx="50" cy="85" rx="30" ry="8" fill="white" opacity="0.8" />

    {/* Duck body */}
    <ellipse cx="50" cy="60" rx="35" ry="28" fill={color.body}>
      {isAnimating && <animateTransform attributeName="transform" type="rotate" values="-3 50 60;3 50 60;-3 50 60" dur="0.3s" repeatCount="indefinite" />}
    </ellipse>

    {/* Wing */}
    <ellipse cx="55" cy="55" rx="18" ry="15" fill={color.wing} />

    {/* Head */}
    <circle cx="75" cy="35" r="22" fill={color.body}>
      {isAnimating && <animateTransform attributeName="transform" type="translate" values="0 0;2 -2;0 0" dur="0.3s" repeatCount="indefinite" />}
    </circle>

    {/* Beak */}
    <ellipse cx="95" cy="38" rx="12" ry="6" fill={color.beak} />

    {/* Eye */}
    <circle cx="82" cy="30" r="5" fill="white" />
    <circle cx="83" cy="30" r="3" fill="black" />
    <circle cx="84" cy="29" r="1" fill="white" />

    {/* Tail feathers */}
    <path d="M 15 50 Q 5 45 10 40 Q 15 42 20 50 Z" fill={color.wing} />
    <path d="M 15 55 Q 0 50 8 45 Q 12 48 18 55 Z" fill={color.body} />
  </svg>
);

// Storage key
const HISTORY_KEY = 'duck_race_history';

// Sound generator using Web Audio API
const useSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const bgMusicRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playQuack = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Quack sound - frequency sweep
      oscillator.frequency.setValueAtTime(600, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [getAudioContext]);

  const playCountdown = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(440, ctx.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [getAudioContext]);

  const playStart = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [getAudioContext]);

  const startBgMusic = useCallback(() => {
    try {
      const ctx = getAudioContext();

      // Create nodes
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      // Connect LFO for wobble effect
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Settings
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(150, ctx.currentTime);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(8, ctx.currentTime);
      lfoGain.gain.setValueAtTime(30, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);

      oscillator.start();
      lfo.start();

      bgMusicRef.current = oscillator;
      gainNodeRef.current = gainNode;
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [getAudioContext]);

  const stopBgMusic = useCallback(() => {
    try {
      if (bgMusicRef.current) {
        bgMusicRef.current.stop();
        bgMusicRef.current = null;
      }
    } catch (e) {
      console.log('Audio stop error');
    }
  }, []);

  const playWin = useCallback(() => {
    try {
      const ctx = getAudioContext();

      // Victory fanfare
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);

        oscillator.start(ctx.currentTime + i * 0.15);
        oscillator.stop(ctx.currentTime + i * 0.15 + 0.3);
      });
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [getAudioContext]);

  return { playQuack, playCountdown, playStart, startBgMusic, stopBgMusic, playWin };
};

// Race duration options in milliseconds
const RACE_DURATIONS = [
  { label: '3s', value: 3000 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '15s', value: 15000 },
];

const DuckRaceModal: React.FC<DuckRaceModalProps> = ({ isOpen, onClose }) => {
  const [foods, setFoods] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [gamePhase, setGamePhase] = useState<GamePhase>('input');
  const [winner, setWinner] = useState<string>('');
  const [winnerIndex, setWinnerIndex] = useState<number>(-1);
  const [duckPositions, setDuckPositions] = useState<number[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [raceTime, setRaceTime] = useState(0);
  const [history, setHistory] = useState<RaceHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [raceDuration, setRaceDuration] = useState(5000); // Default 5 seconds

  const intervalRef = useRef<number | null>(null);
  const raceStartTimeRef = useRef<number>(0);
  const quackIntervalRef = useRef<number | null>(null);
  const timeIntervalRef = useRef<number | null>(null);

  const { playQuack, playCountdown, playStart, startBgMusic, stopBgMusic, playWin } = useSounds();

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.log('Failed to load history');
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((newEntry: RaceHistory) => {
    setHistory(prev => {
      const updated = [newEntry, ...prev].slice(0, 20); // Keep last 20
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.log('Failed to save history');
      }
      return updated;
    });
  }, []);

  // Parse input - auto detect format (comma or newline separated)
  const parseInput = (text: string): string[] => {
    // Check for comma first
    if (text.includes(',')) {
      return text.split(',').map(s => s.trim()).filter(Boolean);
    }
    // Then check for newlines
    if (text.includes('\n')) {
      return text.split('\n').map(s => s.trim()).filter(Boolean);
    }
    // Single item
    return text.trim() ? [text.trim()] : [];
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Just update the input value, don't auto-add foods
    setInputValue(e.target.value);
  };

  const addFoodsFromInput = () => {
    const parsed = parseInput(inputValue);
    if (parsed.length > 0) {
      setFoods(prev => {
        const newFoods = [...prev];
        parsed.forEach(food => {
          if (food && !newFoods.includes(food)) {
            newFoods.push(food);
          }
        });
        return newFoods;
      });
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addFoodsFromInput();
    }
  };

  const removeFood = (index: number) => {
    setFoods(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFoods = () => {
    setFoods([]);
    setInputValue('');
  };

  // Start countdown then race
  const startRace = () => {
    if (foods.length < 2) return;

    setGamePhase('countdown');
    setCountdown(3);
    setDuckPositions(new Array(foods.length).fill(0));
    setWinner('');
    setWinnerIndex(-1);
    setRaceTime(0);

    let count = 3;
    const countdownInterval = setInterval(() => {
      if (soundEnabled) playCountdown();
      count--;
      setCountdown(count);

      if (count === 0) {
        clearInterval(countdownInterval);
        if (soundEnabled) {
          playStart();
          startBgMusic();
        }
        beginRace();
      }
    }, 1000);
  };

  const beginRace = () => {
    setGamePhase('racing');
    raceStartTimeRef.current = Date.now();

    // Random quacks during race
    if (soundEnabled) {
      quackIntervalRef.current = window.setInterval(() => {
        if (Math.random() > 0.7) {
          playQuack();
        }
      }, 300);
    }

    // Update race time
    timeIntervalRef.current = window.setInterval(() => {
      setRaceTime(Date.now() - raceStartTimeRef.current);
    }, 100);

    // Calculate base speed based on target duration
    // With multiple ducks racing randomly, the fastest will finish before average
    // So we need to slow down the speed to compensate
    const updateInterval = 50;
    const totalTicks = raceDuration / updateInterval;
    // Reduce speed by ~30% to account for multiple racers (fastest finishes earlier)
    const avgSpeedPerTick = (100 / totalTicks) * 0.7;

    intervalRef.current = window.setInterval(() => {
      setDuckPositions(prev => {
        const newPositions = prev.map(pos => {
          // Dynamic speed around the calculated average
          // Narrower randomness: 0.8x to 1.4x for more controlled race
          const randomFactor = 0.8 + Math.random() * 0.6;
          const baseSpeed = avgSpeedPerTick * randomFactor;
          // Less frequent burst (5% chance) for excitement
          const burst = Math.random() > 0.95 ? avgSpeedPerTick * 1.5 : 0;
          return Math.min(pos + baseSpeed + burst, 100);
        });

        const foundWinnerIndex = newPositions.findIndex(p => p >= 100);
        if (foundWinnerIndex !== -1) {
          clearInterval(intervalRef.current!);
          if (timeIntervalRef.current) {
            clearInterval(timeIntervalRef.current);
          }
          if (quackIntervalRef.current) {
            clearInterval(quackIntervalRef.current);
          }
          stopBgMusic();

          const finalTime = Date.now() - raceStartTimeRef.current;

          setTimeout(() => {
            if (soundEnabled) playWin();
            setWinner(foods[foundWinnerIndex]);
            setWinnerIndex(foundWinnerIndex);
            setRaceTime(finalTime);
            setGamePhase('result');

            // Save to history
            saveHistory({
              id: Date.now().toString(),
              date: new Date().toLocaleString('vi-VN'),
              foods: [...foods],
              winner: foods[foundWinnerIndex],
              duration: finalTime
            });
          }, 100);
        }

        return newPositions;
      });
    }, updateInterval);
  };

  const raceAgain = () => {
    startRace();
  };

  const pauseGame = () => {
    // Dừng tất cả intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (quackIntervalRef.current) {
      clearInterval(quackIntervalRef.current);
      quackIntervalRef.current = null;
    }
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
    stopBgMusic();
    setGamePhase('paused');
  };

  const resumeGame = () => {
    setGamePhase('racing');

    // Điều chỉnh start time để timer tiếp tục từ thời điểm pause
    raceStartTimeRef.current = Date.now() - raceTime;

    if (soundEnabled) {
      startBgMusic();
      quackIntervalRef.current = window.setInterval(() => {
        if (Math.random() > 0.7) {
          playQuack();
        }
      }, 300);
    }

    // Update race time liên tục
    timeIntervalRef.current = window.setInterval(() => {
      setRaceTime(Date.now() - raceStartTimeRef.current);
    }, 100);

    // Tiếp tục đua từ vị trí hiện tại
    const updateInterval = 50;
    const totalTicks = raceDuration / updateInterval;
    const avgSpeedPerTick = (100 / totalTicks) * 0.7;

    intervalRef.current = window.setInterval(() => {
      setDuckPositions(prev => {
        const newPositions = prev.map((pos: number) => {
          const randomFactor = 0.8 + Math.random() * 0.6;
          const baseSpeed = avgSpeedPerTick * randomFactor;
          const burst = Math.random() > 0.95 ? avgSpeedPerTick * 1.5 : 0;
          return Math.min(pos + baseSpeed + burst, 100);
        });

        const foundWinnerIndex = newPositions.findIndex((p: number) => p >= 100);
        if (foundWinnerIndex !== -1) {
          clearInterval(intervalRef.current!);
          if (timeIntervalRef.current) {
            clearInterval(timeIntervalRef.current);
          }
          if (quackIntervalRef.current) {
            clearInterval(quackIntervalRef.current);
          }
          stopBgMusic();

          const finalTime = Date.now() - raceStartTimeRef.current;

          setTimeout(() => {
            if (soundEnabled) playWin();
            setWinner(foods[foundWinnerIndex]);
            setWinnerIndex(foundWinnerIndex);
            setRaceTime(finalTime);
            setGamePhase('result');

            saveHistory({
              id: Date.now().toString(),
              date: new Date().toLocaleString('vi-VN'),
              foods: [...foods],
              winner: foods[foundWinnerIndex],
              duration: finalTime
            });
          }, 100);
        }

        return newPositions;
      });
    }, updateInterval);
  };

  const resetGame = () => {
    setGamePhase('input');
    // Giữ lại danh sách foods cũ thay vì clear
    setInputValue('');
    setWinner('');
    setWinnerIndex(-1);
    setDuckPositions([]);
    setRaceTime(0);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (quackIntervalRef.current) clearInterval(quackIntervalRef.current);
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
      stopBgMusic();
    };
  }, [stopBgMusic]);

  useEffect(() => {
    if (!isOpen) {
      // Khi đóng modal trong lúc đang đua/countdown -> pause game
      if (gamePhase === 'racing' || gamePhase === 'countdown') {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (quackIntervalRef.current) clearInterval(quackIntervalRef.current);
        if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
        stopBgMusic();
        setGamePhase('paused');
      }
    }
  }, [isOpen, stopBgMusic, gamePhase]);

  if (!isOpen) return null;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
  };

  const handleBackdropClick = () => {
    if (gamePhase === 'racing' || gamePhase === 'countdown') {
      pauseGame();
    } else if (gamePhase !== 'paused') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-4xl bg-gradient-to-b from-sky-400 via-sky-300 to-cyan-400 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sky background with clouds */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 left-10 w-20 h-8 bg-white/60 rounded-full blur-sm"></div>
          <div className="absolute top-8 left-16 w-16 h-6 bg-white/40 rounded-full blur-sm"></div>
          <div className="absolute top-6 right-20 w-24 h-10 bg-white/50 rounded-full blur-sm"></div>
          <div className="absolute top-12 right-32 w-14 h-5 bg-white/30 rounded-full blur-sm"></div>
        </div>

        {/* Top controls bar - only show during racing/countdown */}
        {(gamePhase === 'racing' || gamePhase === 'countdown') && (
          <div className="absolute top-4 left-0 right-0 z-30 flex items-center justify-between px-6">
            {/* Pause button */}
            <button
              onClick={pauseGame}
              className="w-14 h-14 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
              title="Tạm dừng"
            >
              <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </button>

            {/* Timer at center */}
            <div className="flex items-center gap-2 bg-gray-800/80 px-6 py-3 rounded-full shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <polyline points="12,6 12,12 16,14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-white font-mono font-bold text-2xl tracking-wider">{formatTime(raceTime)}</span>
            </div>

            {/* Sound button */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-14 h-14 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? (
                <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.5 3.5l-4 4H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h3.5l4 4a.5.5 0 0 0 .5-.5v-14a.5.5 0 0 0-.5-.5z" />
                  <path d="M15 9s1.5.5 1.5 3-1.5 3-1.5 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M18 7s2.5 1.5 2.5 5-2.5 5-2.5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.5 3.5l-4 4H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h3.5l4 4a.5.5 0 0 0 .5-.5v-14a.5.5 0 0 0-.5-.5z" />
                  <line x1="17" y1="9" x2="22" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="22" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Header for input phase */}
        {(gamePhase === 'input' || gamePhase === 'result') && (
          <div className="relative bg-gradient-to-r from-red-500 via-red-600 to-red-500 px-6 py-4 border-b-4 border-red-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white flex items-center gap-3 drop-shadow-lg">
                <span className="text-3xl">🦆</span>
                ĐUA VỊT
              </h2>

              {/* Sound toggle & History & Close */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                >
                  {soundEnabled ? '🔊' : '🔇'}
                </button>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  title="Lịch sử đua"
                >
                  📜
                </button>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  title="Đóng"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="relative p-6">
          {/* History Panel */}
          {showHistory && (
            <div className="absolute inset-0 bg-white/95 z-10 p-6 overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-700">📜 Lịch sử đua</h3>
                <div className="flex gap-2">
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200"
                    >
                      Xóa tất cả
                    </button>
                  )}
                  <button
                    onClick={() => setShowHistory(false)}
                    className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200"
                  >
                    Đóng
                  </button>
                </div>
              </div>

              {history.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Chưa có lịch sử đua nào</p>
              ) : (
                <div className="space-y-3">
                  {history.map((race) => (
                    <div key={race.id} className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-orange-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-slate-400">{race.date}</p>
                          <p className="font-bold text-orange-600 text-lg">🏆 {race.winner}</p>
                          <p className="text-sm text-slate-500">
                            {race.foods.length} món · {formatTime(race.duration)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Các món tham gia:</p>
                          <p className="text-xs text-slate-500">{race.foods.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* INPUT PHASE */}
          {gamePhase === 'input' && (
            <div className="space-y-4 bg-white/90 rounded-2xl p-6 backdrop-blur">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  🍜 Nhập danh sách món ăn
                  <span className="text-slate-400 font-normal ml-2">
                    (Enter hoặc nút Thêm để thêm món)
                  </span>
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    placeholder="Phở, Bún bò, Cơm tấm... (dùng dấu phẩy để nhập nhiều món)"
                    className="flex-1 h-20 px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-lg"
                    autoFocus
                  />
                  <button
                    onClick={addFoodsFromInput}
                    disabled={!inputValue.trim()}
                    className={`px-4 rounded-xl font-bold text-white transition-all ${
                      inputValue.trim()
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    Thêm
                  </button>
                </div>
              </div>

              {foods.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 font-medium">
                      Đội hình ({foods.length} vịt):
                    </p>
                    <button
                      onClick={clearAllFoods}
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      🗑️ Xóa hết
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {foods.map((food, i) => {
                      const color = DUCK_COLORS[i % DUCK_COLORS.length];
                      return (
                        <span
                          key={i}
                          className={`px-4 py-2 ${color.label} text-white rounded-full flex items-center gap-2 font-medium shadow-lg`}
                        >
                          <span className="w-6 h-6 flex-shrink-0">
                            <DuckSVG color={color} size={24} isAnimating={false} />
                          </span>
                          {food}
                          <button
                            onClick={() => removeFood(i)}
                            className="hover:bg-white/30 rounded-full w-5 h-5 flex items-center justify-center transition-colors ml-1"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Race Duration Selector */}
              <div className="space-y-2">
                <p className="text-sm text-slate-500 font-medium">
                  ⏱️ Thời gian đua:
                </p>
                <div className="flex gap-2">
                  {RACE_DURATIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setRaceDuration(option.value)}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                        raceDuration === option.value
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startRace}
                disabled={foods.length < 2}
                className={`w-full py-4 rounded-xl font-bold text-white text-xl transition-all shadow-lg ${
                  foods.length >= 2
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                {foods.length < 2
                  ? `Cần ít nhất 2 món (còn thiếu ${2 - foods.length})`
                  : `🏁 BẮT ĐẦU ĐUA!`
                }
              </button>
            </div>
          )}

          {/* COUNTDOWN PHASE - 2.5D View */}
          {gamePhase === 'countdown' && (
            <div className="relative">
              <div
                className="relative h-[450px] overflow-hidden rounded-t-2xl"
                style={{
                  perspective: '1200px',
                  perspectiveOrigin: '50% 25%'
                }}
              >
                {/* Sky gradient background */}
                <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-400 to-cyan-500"></div>

                {/* Animated Clouds */}
                <div className="absolute top-2 w-40 h-14 bg-white/50 rounded-full blur-md animate-cloud-drift-slow" style={{ animationDelay: '0s' }}></div>
                <div className="absolute top-6 w-28 h-10 bg-white/40 rounded-full blur-md animate-cloud-drift-slow" style={{ animationDelay: '-10s' }}></div>
                <div className="absolute top-4 w-36 h-12 bg-white/45 rounded-full blur-md animate-cloud-drift" style={{ animationDelay: '-5s' }}></div>

                {/* Grass/Vegetation at top */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-green-700 via-green-600 to-green-500/90">
                  <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,100,0,0.3) 8px, rgba(0,100,0,0.3) 10px)',
                  }}></div>
                </div>
                <div className="absolute top-16 left-0 right-0 h-12 bg-gradient-to-b from-green-500/50 via-green-400/30 to-transparent"></div>

                {/* 2.5D Water Surface */}
                <div
                  className="absolute top-24 left-0 right-0 bottom-0"
                  style={{
                    background: 'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 30%, #0284c7 60%, #0369a1 100%)',
                  }}
                >
                  <div className="absolute inset-0 opacity-25 animate-water-shimmer" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(255,255,255,0.4) 15px, rgba(255,255,255,0.4) 17px)',
                  }}></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-600/20 to-blue-800/40"></div>
                </div>

                {/* Finish line preview */}
                <div
                  className="absolute top-20 right-8 bottom-0 w-12 overflow-hidden shadow-xl opacity-60"
                  style={{
                    transform: 'skewX(-20deg) perspective(500px) rotateY(-5deg)',
                    boxShadow: '-4px 0 15px rgba(0,0,0,0.3)'
                  }}
                >
                  <div className="w-full h-full" style={{
                    backgroundImage: `repeating-linear-gradient(0deg, white 0px, white 18px, #1a1a1a 18px, #1a1a1a 36px)`,
                    backgroundSize: '100% 36px'
                  }}></div>
                </div>

                {/* Countdown number */}
                <div className="absolute inset-0 flex items-center justify-center z-30">
                  <div className="text-center">
                    <div
                      className="text-[180px] font-black text-white drop-shadow-2xl animate-pulse"
                      style={{
                        textShadow: '0 0 80px rgba(255,255,255,0.9), 0 0 120px rgba(255,255,255,0.5), 0 4px 20px rgba(0,0,0,0.3)',
                        WebkitTextStroke: '4px rgba(0,0,0,0.15)'
                      }}
                    >
                      {countdown}
                    </div>
                    <p className="text-white text-3xl font-bold drop-shadow-lg animate-bounce mt-2">
                      {countdown === 3 ? 'Sẵn sàng...' : countdown === 2 ? 'Chuẩn bị...' : 'XUẤT PHÁT!'}
                    </p>
                  </div>
                </div>

                {/* Waiting ducks at start line with 2.5D positioning */}
                {foods.map((food, i) => {
                  const color = DUCK_COLORS[i % DUCK_COLORS.length];
                  const verticalPosition = 28 + (i * (58 / Math.max(foods.length, 1)));
                  const depthRatio = i / Math.max(foods.length - 1, 1);
                  const depthScale = 1.1 - (depthRatio * 0.35);

                  return (
                    <div
                      key={i}
                      className="absolute opacity-70"
                      style={{
                        left: '5%',
                        top: `${verticalPosition}%`,
                        zIndex: 50 - i,
                        transform: `scale(${depthScale})`,
                        transformOrigin: 'center bottom'
                      }}
                    >
                      <div
                        className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
                        style={{ transform: `scale(${1 / depthScale})` }}
                      >
                        <span className={`px-3 py-1.5 ${color.label} text-white rounded-lg text-xs font-bold shadow-lg border border-white/30 backdrop-blur-sm`}>
                          {food}
                        </span>
                      </div>
                      <DuckSVG color={color} size={55} isAnimating={false} />
                    </div>
                  );
                })}
              </div>

              {/* Bottom title bar */}
              <div className="bg-gradient-to-r from-red-700 via-red-500 to-red-700 py-4 px-6 rounded-b-2xl shadow-inner">
                <h2
                  className="text-4xl font-black text-white tracking-widest drop-shadow-lg text-center"
                  style={{
                    fontStyle: 'italic',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.2)'
                  }}
                >
                  ĐUA VỊT
                </h2>
              </div>
            </div>
          )}

          {/* RACING PHASE - 2.5D View */}
          {gamePhase === 'racing' && (
            <div className="relative">
              {/* 2.5D Pool container with perspective */}
              <div
                className="relative h-[450px] overflow-hidden rounded-t-2xl"
                style={{
                  perspective: '1200px',
                  perspectiveOrigin: '50% 25%'
                }}
              >
                {/* Sky gradient background */}
                <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-400 to-cyan-500"></div>

                {/* Animated Clouds - Layer 1 (Back) */}
                <div className="absolute top-2 w-40 h-14 bg-white/50 rounded-full blur-md animate-cloud-drift-slow" style={{ animationDelay: '0s' }}></div>
                <div className="absolute top-6 w-28 h-10 bg-white/40 rounded-full blur-md animate-cloud-drift-slow" style={{ animationDelay: '-10s' }}></div>
                <div className="absolute top-4 w-36 h-12 bg-white/45 rounded-full blur-md animate-cloud-drift" style={{ animationDelay: '-5s' }}></div>

                {/* Animated Clouds - Layer 2 (Front) */}
                <div className="absolute top-8 w-24 h-8 bg-white/60 rounded-full blur-sm animate-cloud-drift" style={{ animationDelay: '-15s' }}></div>
                <div className="absolute top-3 w-20 h-7 bg-white/55 rounded-full blur-sm animate-cloud-drift" style={{ animationDelay: '-20s' }}></div>

                {/* Grass/Vegetation at top with texture */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-green-700 via-green-600 to-green-500/90">
                  {/* Grass texture lines */}
                  <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,100,0,0.3) 8px, rgba(0,100,0,0.3) 10px)',
                  }}></div>
                </div>

                {/* Grass reflection in water */}
                <div className="absolute top-16 left-0 right-0 h-12 bg-gradient-to-b from-green-500/50 via-green-400/30 to-transparent"></div>

                {/* 2.5D Water Surface with perspective */}
                <div
                  className="absolute top-24 left-0 right-0 bottom-0"
                  style={{
                    background: 'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 30%, #0284c7 60%, #0369a1 100%)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Water wave pattern */}
                  <div className="absolute inset-0 opacity-25 animate-water-shimmer" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(255,255,255,0.4) 15px, rgba(255,255,255,0.4) 17px)',
                  }}></div>

                  {/* Water depth gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-600/20 to-blue-800/40"></div>

                  {/* Caustic light patterns */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `radial-gradient(ellipse 60px 30px at 20% 40%, rgba(255,255,255,0.6) 0%, transparent 70%),
                                      radial-gradient(ellipse 80px 40px at 60% 60%, rgba(255,255,255,0.5) 0%, transparent 70%),
                                      radial-gradient(ellipse 50px 25px at 80% 30%, rgba(255,255,255,0.4) 0%, transparent 70%)`,
                  }}></div>
                </div>

                {/* Checkered finish line - 2.5D diagonal */}
                <div
                  className="absolute top-20 right-8 bottom-0 w-12 overflow-hidden shadow-xl"
                  style={{
                    transform: 'skewX(-20deg) perspective(500px) rotateY(-5deg)',
                    boxShadow: '-4px 0 15px rgba(0,0,0,0.3)'
                  }}
                >
                  <div className="w-full h-full" style={{
                    backgroundImage: `repeating-linear-gradient(
                      0deg,
                      white 0px, white 18px,
                      #1a1a1a 18px, #1a1a1a 36px
                    )`,
                    backgroundSize: '100% 36px'
                  }}></div>
                  {/* Finish line highlight */}
                  <div className="absolute inset-y-0 left-0 w-1 bg-white/50"></div>
                </div>

                {/* SVG layer for water ripples */}
                <svg className="absolute top-24 left-0 right-0 bottom-0 pointer-events-none overflow-visible" style={{ width: '100%', height: 'calc(100% - 96px)' }}>
                  {foods.map((_, i) => {
                    const position = duckPositions[i] || 0;
                    const verticalPosition = 15 + (i * (70 / Math.max(foods.length, 1)));
                    const cx = Math.min(position * 0.72, 70) + 5;

                    return (
                      <g key={`ripple-${i}`}>
                        {/* Multiple ripple rings */}
                        <ellipse
                          cx={`${cx}%`}
                          cy={`${verticalPosition + 8}%`}
                          rx="25"
                          ry="8"
                          fill="none"
                          stroke="rgba(255,255,255,0.4)"
                          strokeWidth="2"
                        >
                          <animate attributeName="rx" values="20;40;55" dur="1.2s" repeatCount="indefinite" />
                          <animate attributeName="ry" values="6;12;16" dur="1.2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.5;0.2;0" dur="1.2s" repeatCount="indefinite" />
                        </ellipse>
                        <ellipse
                          cx={`${cx}%`}
                          cy={`${verticalPosition + 8}%`}
                          rx="15"
                          ry="5"
                          fill="none"
                          stroke="rgba(255,255,255,0.5)"
                          strokeWidth="1.5"
                        >
                          <animate attributeName="rx" values="15;30;45" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
                          <animate attributeName="ry" values="5;10;14" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.6;0.3;0" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
                        </ellipse>
                      </g>
                    );
                  })}
                </svg>

                {/* Ducks swimming in pool with 2.5D depth */}
                {foods.map((food, i) => {
                  const color = DUCK_COLORS[i % DUCK_COLORS.length];
                  const position = duckPositions[i] || 0;
                  const totalDucks = foods.length;
                  const verticalPosition = 28 + (i * (58 / Math.max(totalDucks, 1)));

                  // Depth-based scaling: ducks further back (higher index/y) appear smaller
                  const depthRatio = i / Math.max(totalDucks - 1, 1);
                  const depthScale = 1.1 - (depthRatio * 0.35); // Scale from 1.1 to 0.75
                  const duckZIndex = 50 - i; // Closer ducks (lower index) have higher z-index

                  return (
                    <div
                      key={i}
                      className="absolute transition-all duration-100 ease-linear"
                      style={{
                        left: `calc(${Math.min(position * 0.72, 70)}%)`,
                        top: `${verticalPosition}%`,
                        zIndex: duckZIndex,
                        transform: `scale(${depthScale})`,
                        transformOrigin: 'center bottom'
                      }}
                    >
                      {/* Food label floating above duck */}
                      <div
                        className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
                        style={{
                          zIndex: duckZIndex + 1,
                          transform: `scale(${1 / depthScale})` // Counter-scale to keep labels same size
                        }}
                      >
                        <span className={`px-3 py-1.5 ${color.label} text-white rounded-lg text-xs font-bold shadow-lg border border-white/30 backdrop-blur-sm`}>
                          {food}
                        </span>
                      </div>

                      {/* Duck SVG with bob animation */}
                      <div className="animate-duck-bob">
                        <DuckSVG color={color} size={55} isAnimating={true} />
                      </div>

                      {/* Duck reflection in water */}
                      <div
                        className="absolute top-full left-0 opacity-25 blur-[2px] pointer-events-none"
                        style={{
                          transform: 'scaleY(-0.4) translateY(-10px)',
                          filter: 'blur(2px) brightness(0.8)'
                        }}
                      >
                        <DuckSVG color={color} size={55} isAnimating={false} />
                      </div>
                    </div>
                  );
                })}

                {/* Top UI Bar - Glass morphism */}
                <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-50">
                  {/* Pause button */}
                  <button
                    onClick={pauseGame}
                    className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all shadow-lg"
                  >
                    <span className="text-white text-xl">⏸</span>
                  </button>

                  {/* Timer */}
                  <div className="px-6 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-lg">⏱</span>
                      <span className="text-white font-bold text-xl tabular-nums">
                        {String(Math.floor(raceTime / 60000)).padStart(2, '0')}:{String(Math.floor((raceTime % 60000) / 1000)).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Sound toggle */}
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all shadow-lg"
                  >
                    <span className="text-white text-xl">{soundEnabled ? '🔊' : '🔇'}</span>
                  </button>
                </div>
              </div>

              {/* Bottom title bar - Enhanced */}
              <div className="bg-gradient-to-r from-red-700 via-red-500 to-red-700 py-4 px-6 rounded-b-2xl shadow-inner">
                <h2
                  className="text-4xl font-black text-white tracking-widest drop-shadow-lg text-center"
                  style={{
                    fontStyle: 'italic',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.2)'
                  }}
                >
                  ĐUA VỊT
                </h2>
              </div>
            </div>
          )}

          {/* PAUSED PHASE - 2.5D View */}
          {gamePhase === 'paused' && (
            <div className="relative">
              <div
                className="relative h-[450px] overflow-hidden rounded-t-2xl"
                style={{
                  perspective: '1200px',
                  perspectiveOrigin: '50% 25%'
                }}
              >
                {/* Sky gradient background */}
                <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-400 to-cyan-500 opacity-60"></div>

                {/* Grass at top */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-green-700 via-green-600 to-green-500/90 opacity-60"></div>
                <div className="absolute top-16 left-0 right-0 h-12 bg-gradient-to-b from-green-500/50 via-green-400/30 to-transparent opacity-60"></div>

                {/* Water Surface - dimmed */}
                <div
                  className="absolute top-24 left-0 right-0 bottom-0 opacity-50"
                  style={{
                    background: 'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 30%, #0284c7 60%, #0369a1 100%)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-600/20 to-blue-800/40"></div>
                </div>

                {/* Finish line - dimmed */}
                <div
                  className="absolute top-20 right-8 bottom-0 w-12 overflow-hidden opacity-40"
                  style={{
                    transform: 'skewX(-20deg) perspective(500px) rotateY(-5deg)',
                  }}
                >
                  <div className="w-full h-full" style={{
                    backgroundImage: `repeating-linear-gradient(0deg, white 0px, white 18px, #1a1a1a 18px, #1a1a1a 36px)`,
                    backgroundSize: '100% 36px'
                  }}></div>
                </div>

                {/* Frozen ducks with 2.5D positioning */}
                {foods.map((food, i) => {
                  const color = DUCK_COLORS[i % DUCK_COLORS.length];
                  const position = duckPositions[i] || 0;
                  const totalDucks = foods.length;
                  const verticalPosition = 28 + (i * (58 / Math.max(totalDucks, 1)));
                  const depthRatio = i / Math.max(totalDucks - 1, 1);
                  const depthScale = 1.1 - (depthRatio * 0.35);

                  return (
                    <div
                      key={i}
                      className="absolute opacity-40"
                      style={{
                        left: `calc(${Math.min(position * 0.72, 70)}%)`,
                        top: `${verticalPosition}%`,
                        zIndex: 50 - i,
                        transform: `scale(${depthScale})`,
                        transformOrigin: 'center bottom'
                      }}
                    >
                      <div
                        className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
                        style={{ transform: `scale(${1 / depthScale})` }}
                      >
                        <span className={`px-3 py-1.5 ${color.label} text-white rounded-lg text-xs font-bold shadow-lg border border-white/30`}>
                          {food}
                        </span>
                      </div>
                      <DuckSVG color={color} size={55} isAnimating={false} />
                    </div>
                  );
                })}

                {/* Pause overlay */}
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl text-center space-y-6 max-w-sm mx-4 border border-white/50">
                    <div className="text-7xl">⏸️</div>
                    <h3 className="text-2xl font-bold text-slate-800">Tạm dừng</h3>
                    <p className="text-slate-500">Cuộc đua đang tạm dừng</p>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={resumeGame}
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all hover:scale-105 active:scale-95 shadow-lg"
                      >
                        ▶️ Tiếp tục đua
                      </button>
                      <button
                        onClick={resetGame}
                        className="w-full py-4 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl font-bold text-lg hover:from-slate-600 hover:to-slate-700 transition-all hover:scale-105 active:scale-95 shadow-lg"
                      >
                        🔙 Quay lại chọn món
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom title bar */}
              <div className="bg-gradient-to-r from-red-700 via-red-500 to-red-700 py-4 px-6 rounded-b-2xl shadow-inner opacity-70">
                <h2
                  className="text-4xl font-black text-white tracking-widest drop-shadow-lg text-center"
                  style={{
                    fontStyle: 'italic',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.2)'
                  }}
                >
                  ĐUA VỊT
                </h2>
              </div>
            </div>
          )}

          {/* RESULT PHASE */}
          {gamePhase === 'result' && (
            <div className="text-center space-y-6 py-4 bg-white/90 rounded-2xl p-6 backdrop-blur">
              {/* Confetti effect */}
              <div className="flex justify-center gap-4 text-5xl">
                <span className="animate-bounce" style={{ animationDelay: '0s' }}>🎉</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>🎊</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🎉</span>
              </div>

              <div>
                <p className="text-slate-500 mb-2 text-lg">Món ăn chiến thắng là:</p>
                <h3
                  className="text-5xl font-black bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent py-2"
                  style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}
                >
                  {winner}
                </h3>
              </div>

              {/* Winner duck using SVG */}
              <div className="flex justify-center">
                <div className="transform scale-150">
                  <DuckSVG
                    color={DUCK_COLORS[winnerIndex >= 0 ? winnerIndex % DUCK_COLORS.length : 0]}
                    size={80}
                    isAnimating={true}
                  />
                </div>
              </div>

              <div className="text-4xl">🏆</div>

              <p className="text-slate-400">
                Thời gian: <span className="font-mono font-bold text-slate-600">{formatTime(raceTime)}</span>
              </p>

              {/* Action buttons */}
              <div className="flex gap-3 justify-center pt-4">
                <button
                  onClick={raceAgain}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  🔄 Đua lại
                </button>
                <button
                  onClick={resetGame}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  📝 Chọn món khác
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Grass/Ground at bottom - only for input/result phases */}
        {(gamePhase === 'input' || gamePhase === 'result') && (
          <div className="h-6 bg-gradient-to-t from-green-600 to-green-500 border-t-4 border-green-700"></div>
        )}
      </div>
    </div>
  );
};

export default DuckRaceModal;
