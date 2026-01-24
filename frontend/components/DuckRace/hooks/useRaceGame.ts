import { useState, useRef, useCallback, useEffect } from 'react';
import { GamePhase, RaceHistory } from '../types';
import { HISTORY_KEY } from '../constants';
import { useSounds } from './useSounds';

/**
 * === RACE CONFIGURATION ===
 */

/** Interval cập nhật vị trí (ms) */
const POSITION_UPDATE_INTERVAL = 50;

/** Interval cập nhật timer hiển thị (ms) */
const TIMER_UPDATE_INTERVAL = 100;

/** Interval random quack (ms) */
const QUACK_INTERVAL = 300;

/** Xác suất quack mỗi interval (30%) */
const QUACK_PROBABILITY = 0.3;

/** Hệ số điều chỉnh speed (để race kết thúc đúng target duration) */
const SPEED_ADJUSTMENT_FACTOR = 0.7;

/** Random factor range cho speed (0.8 - 1.4) */
const SPEED_RANDOM_MIN = 0.8;
const SPEED_RANDOM_RANGE = 0.6;

/** Xác suất burst speed (5%) */
const BURST_PROBABILITY = 0.05;

/** Multiplier cho burst speed */
const BURST_MULTIPLIER = 1.5;

/** Finish line position */
const FINISH_POSITION = 100;

/** Max history entries */
const MAX_HISTORY_ENTRIES = 20;

/**
 * === TYPES ===
 */

interface RaceGameState {
  gamePhase: GamePhase;
  countdown: number;
  duckPositions: number[];
  raceTime: number;
  winner: string;
  winnerIndex: number;
}

interface RaceGameActions {
  startRace: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
}

interface RaceGameReturn extends RaceGameState, RaceGameActions {
  history: RaceHistory[];
  clearHistory: () => void;
}

/**
 * Hook quản lý toàn bộ game logic cho Duck Race
 *
 * @param foods - Danh sách món ăn (tên các duck)
 * @param raceDuration - Thời gian đua mục tiêu (ms)
 * @param soundEnabled - Bật/tắt âm thanh
 */
export const useRaceGame = (
  foods: string[],
  raceDuration: number,
  soundEnabled: boolean
): RaceGameReturn => {
  // === GAME STATE ===
  const [gamePhase, setGamePhase] = useState<GamePhase>('input');
  const [countdown, setCountdown] = useState(3);
  const [duckPositions, setDuckPositions] = useState<number[]>([]);
  const [raceTime, setRaceTime] = useState(0);
  const [winner, setWinner] = useState('');
  const [winnerIndex, setWinnerIndex] = useState(-1);
  const [history, setHistory] = useState<RaceHistory[]>([]);

  // === REFS (để tránh stale closure trong intervals) ===
  const raceIntervalRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const quackIntervalRef = useRef<number | null>(null);
  const raceStartTimeRef = useRef<number>(0);

  // === SOUNDS ===
  const {
    playQuack,
    playCountdown,
    playStart,
    startBgMusic,
    stopBgMusic,
    playWin,
  } = useSounds();

  // === HISTORY PERSISTENCE ===
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const saveHistory = useCallback((newEntry: RaceHistory) => {
    setHistory(prev => {
      const updated = [newEntry, ...prev].slice(0, MAX_HISTORY_ENTRIES);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // Ignore
    }
  }, []);

  // === INTERVAL CLEANUP HELPER ===
  const clearAllIntervals = useCallback(() => {
    if (raceIntervalRef.current) {
      clearInterval(raceIntervalRef.current);
      raceIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (quackIntervalRef.current) {
      clearInterval(quackIntervalRef.current);
      quackIntervalRef.current = null;
    }
    stopBgMusic();
  }, [stopBgMusic]);

  // === RACE SIMULATION ===
  /**
   * Tính speed cho mỗi tick update
   * Có random factor và occasional burst để tạo excitement
   */
  const calculateDuckSpeed = useCallback((avgSpeed: number): number => {
    const randomFactor = SPEED_RANDOM_MIN + Math.random() * SPEED_RANDOM_RANGE;
    const baseSpeed = avgSpeed * randomFactor;
    const burst = Math.random() > (1 - BURST_PROBABILITY) ? avgSpeed * BURST_MULTIPLIER : 0;
    return baseSpeed + burst;
  }, []);

  /**
   * Bắt đầu race loop (được gọi sau countdown)
   */
  const beginRaceLoop = useCallback(() => {
    setGamePhase('racing');
    raceStartTimeRef.current = Date.now();

    // Random quack sounds
    if (soundEnabled) {
      quackIntervalRef.current = window.setInterval(() => {
        if (Math.random() < QUACK_PROBABILITY) {
          playQuack();
        }
      }, QUACK_INTERVAL);
    }

    // Timer update
    timerIntervalRef.current = window.setInterval(() => {
      setRaceTime(Date.now() - raceStartTimeRef.current);
    }, TIMER_UPDATE_INTERVAL);

    // Calculate average speed per tick
    const totalTicks = raceDuration / POSITION_UPDATE_INTERVAL;
    const avgSpeedPerTick = (FINISH_POSITION / totalTicks) * SPEED_ADJUSTMENT_FACTOR;

    // Race loop
    raceIntervalRef.current = window.setInterval(() => {
      setDuckPositions(prev => {
        const newPositions = prev.map(pos =>
          Math.min(pos + calculateDuckSpeed(avgSpeedPerTick), FINISH_POSITION)
        );

        // Check for winner
        const foundWinnerIndex = newPositions.findIndex(p => p >= FINISH_POSITION);
        if (foundWinnerIndex !== -1) {
          clearAllIntervals();

          const finalTime = Date.now() - raceStartTimeRef.current;

          // Delay một chút để animation kịp render
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
              duration: finalTime,
            });
          }, 100);
        }

        return newPositions;
      });
    }, POSITION_UPDATE_INTERVAL);
  }, [
    foods,
    raceDuration,
    soundEnabled,
    playQuack,
    playWin,
    clearAllIntervals,
    calculateDuckSpeed,
    saveHistory,
  ]);

  // === GAME ACTIONS ===

  /**
   * Bắt đầu race (với countdown 3-2-1)
   */
  const startRace = useCallback(() => {
    if (foods.length < 2) return;

    // Reset state
    setGamePhase('countdown');
    setCountdown(3);
    setDuckPositions(new Array(foods.length).fill(0));
    setWinner('');
    setWinnerIndex(-1);
    setRaceTime(0);

    // Countdown interval
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
        beginRaceLoop();
      }
    }, 1000);
  }, [foods, soundEnabled, playCountdown, playStart, startBgMusic, beginRaceLoop]);

  /**
   * Tạm dừng game
   */
  const pauseGame = useCallback(() => {
    clearAllIntervals();
    setGamePhase('paused');
  }, [clearAllIntervals]);

  /**
   * Tiếp tục game từ trạng thái pause
   */
  const resumeGame = useCallback(() => {
    setGamePhase('racing');

    // Adjust start time để timer tiếp tục từ đúng chỗ
    raceStartTimeRef.current = Date.now() - raceTime;

    // Restart sounds
    if (soundEnabled) {
      startBgMusic();
      quackIntervalRef.current = window.setInterval(() => {
        if (Math.random() < QUACK_PROBABILITY) {
          playQuack();
        }
      }, QUACK_INTERVAL);
    }

    // Restart timer
    timerIntervalRef.current = window.setInterval(() => {
      setRaceTime(Date.now() - raceStartTimeRef.current);
    }, TIMER_UPDATE_INTERVAL);

    // Restart race loop
    const totalTicks = raceDuration / POSITION_UPDATE_INTERVAL;
    const avgSpeedPerTick = (FINISH_POSITION / totalTicks) * SPEED_ADJUSTMENT_FACTOR;

    raceIntervalRef.current = window.setInterval(() => {
      setDuckPositions(prev => {
        const newPositions = prev.map(pos =>
          Math.min(pos + calculateDuckSpeed(avgSpeedPerTick), FINISH_POSITION)
        );

        const foundWinnerIndex = newPositions.findIndex(p => p >= FINISH_POSITION);
        if (foundWinnerIndex !== -1) {
          clearAllIntervals();

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
              duration: finalTime,
            });
          }, 100);
        }

        return newPositions;
      });
    }, POSITION_UPDATE_INTERVAL);
  }, [
    foods,
    raceDuration,
    raceTime,
    soundEnabled,
    playQuack,
    playWin,
    startBgMusic,
    clearAllIntervals,
    calculateDuckSpeed,
    saveHistory,
  ]);

  /**
   * Reset về màn hình input
   */
  const resetGame = useCallback(() => {
    clearAllIntervals();
    setGamePhase('input');
    setWinner('');
    setWinnerIndex(-1);
    setDuckPositions([]);
    setRaceTime(0);
  }, [clearAllIntervals]);

  // === CLEANUP ON UNMOUNT ===
  useEffect(() => {
    return () => {
      clearAllIntervals();
    };
  }, [clearAllIntervals]);

  return {
    // State
    gamePhase,
    countdown,
    duckPositions,
    raceTime,
    winner,
    winnerIndex,
    history,

    // Actions
    startRace,
    pauseGame,
    resumeGame,
    resetGame,
    clearHistory,
  };
};
