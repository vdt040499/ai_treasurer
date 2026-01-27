import React, { useState, useEffect, useCallback } from 'react';
import { DuckRaceModalProps } from './types';
import { parseInput } from './utils';
import { useRaceGame } from './hooks';
import {
  Header,
  HistoryPanel,
  InputPhase,
  CountdownPhase,
  RacingPhase,
  PausedPhase,
  ResultPhase,
} from './components';

/**
 * === DUCK RACE MODAL ===
 *
 * Modal chính cho game đua vịt.
 * Component này chỉ làm nhiệm vụ orchestrator:
 * - Quản lý UI state (foods input, sound toggle, history panel)
 * - Delegate game logic cho useRaceGame hook
 * - Render các phase components tương ứng
 */
const DuckRaceModal: React.FC<DuckRaceModalProps> = ({ isOpen, onClose }) => {
  // === UI STATE ===
  const [foods, setFoods] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [raceDuration, setRaceDuration] = useState(5000);

  // === GAME LOGIC (delegated to hook) ===
  const {
    gamePhase,
    countdown,
    duckPositions,
    raceTime,
    winner,
    winnerIndex,
    history,
    startRace,
    pauseGame,
    resumeGame,
    resetGame,
    clearHistory,
  } = useRaceGame(foods, raceDuration, soundEnabled);

  // === INPUT HANDLERS ===
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  }, []);

  const addFoodsFromInput = useCallback(() => {
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
  }, [inputValue]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addFoodsFromInput();
    }
  }, [addFoodsFromInput]);

  const removeFood = useCallback((index: number) => {
    setFoods(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAllFoods = useCallback(() => {
    setFoods([]);
    setInputValue('');
  }, []);

  const handleReset = useCallback(() => {
    resetGame();
    setInputValue('');
  }, [resetGame]);

  // === MODAL BEHAVIOR ===
  const handleBackdropClick = useCallback(() => {
    if (gamePhase === 'racing' || gamePhase === 'countdown') {
      pauseGame();
    } else if (gamePhase !== 'paused') {
      onClose();
    }
  }, [gamePhase, pauseGame, onClose]);

  // Auto-pause khi đóng modal trong lúc đang đua
  useEffect(() => {
    if (!isOpen && (gamePhase === 'racing' || gamePhase === 'countdown')) {
      pauseGame();
    }
  }, [isOpen, gamePhase, pauseGame]);

  // Don't render if not open
  if (!isOpen) return null;

  // === RENDER ===
  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-4xl bg-gradient-to-b from-sky-400 via-sky-300 to-cyan-400 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative clouds */}
        <CloudDecoration />

        {/* Top controls (during race) */}
        {(gamePhase === 'racing' || gamePhase === 'countdown') && (
          <TopControlsBar
            raceTime={raceTime}
            soundEnabled={soundEnabled}
            onPause={pauseGame}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
          />
        )}

        {/* Header (input/result phases) */}
        {(gamePhase === 'input' || gamePhase === 'result') && (
          <Header
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            onToggleHistory={() => setShowHistory(!showHistory)}
            onClose={onClose}
          />
        )}

        {/* Main content */}
        <div className="relative p-6">
          {/* History panel overlay */}
          {showHistory && (
            <HistoryPanel
              history={history}
              onClose={() => setShowHistory(false)}
              onClear={clearHistory}
            />
          )}

          {/* Phase components */}
          {gamePhase === 'input' && (
            <InputPhase
              foods={foods}
              inputValue={inputValue}
              raceDuration={raceDuration}
              onInputChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onAddFoods={addFoodsFromInput}
              onRemoveFood={removeFood}
              onClearAllFoods={clearAllFoods}
              onSetRaceDuration={setRaceDuration}
              onStartRace={startRace}
            />
          )}

          {gamePhase === 'countdown' && (
            <CountdownPhase foods={foods} countdown={countdown} />
          )}

          {gamePhase === 'racing' && (
            <RacingPhase
              foods={foods}
              duckPositions={duckPositions}
              raceTime={raceTime}
              soundEnabled={soundEnabled}
              onPause={pauseGame}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
            />
          )}

          {gamePhase === 'paused' && (
            <PausedPhase
              foods={foods}
              duckPositions={duckPositions}
              onResume={resumeGame}
              onReset={handleReset}
            />
          )}

          {gamePhase === 'result' && (
            <ResultPhase
              winner={winner}
              winnerIndex={winnerIndex}
              raceTime={raceTime}
              onRaceAgain={startRace}
              onReset={handleReset}
            />
          )}
        </div>

        {/* Bottom grass decoration */}
        {(gamePhase === 'input' || gamePhase === 'result') && (
          <div className="h-6 bg-gradient-to-t from-green-600 to-green-500 border-t-4 border-green-700" />
        )}
      </div>
    </div>
  );
};

// === SUB-COMPONENTS ===

/** Decorative cloud elements */
const CloudDecoration: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-4 left-10 w-20 h-8 bg-white/60 rounded-full blur-sm" />
    <div className="absolute top-8 left-16 w-16 h-6 bg-white/40 rounded-full blur-sm" />
    <div className="absolute top-6 right-20 w-24 h-10 bg-white/50 rounded-full blur-sm" />
    <div className="absolute top-12 right-32 w-14 h-5 bg-white/30 rounded-full blur-sm" />
  </div>
);

/** Top control bar during racing/countdown */
interface TopControlsBarProps {
  raceTime: number;
  soundEnabled: boolean;
  onPause: () => void;
  onToggleSound: () => void;
}

const TopControlsBar: React.FC<TopControlsBarProps> = ({
  raceTime,
  soundEnabled,
  onPause,
  onToggleSound,
}) => {
  const seconds = Math.floor(raceTime / 1000);
  const centiseconds = Math.floor((raceTime % 1000) / 10);
  const timeDisplay = `${String(seconds).padStart(2, '0')}:${String(centiseconds).padStart(2, '0')}`;

  return (
    <div className="absolute top-4 left-0 right-0 z-30 flex items-center justify-between px-6">
      {/* Pause button */}
      <button
        onClick={onPause}
        className="w-14 h-14 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
        title="Tạm dừng"
      >
        <PauseIcon />
      </button>

      {/* Timer */}
      <div className="flex items-center gap-2 bg-gray-800/80 px-6 py-3 rounded-full shadow-lg">
        <TimerIcon />
        <span className="text-white font-mono font-bold text-2xl tracking-wider">
          {timeDisplay}
        </span>
      </div>

      {/* Sound toggle */}
      <button
        onClick={onToggleSound}
        className="w-14 h-14 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
        title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
      >
        {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
      </button>
    </div>
  );
};

// === ICONS ===

const PauseIcon: React.FC = () => (
  <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const TimerIcon: React.FC = () => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <polyline points="12,6 12,12 16,14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SoundOnIcon: React.FC = () => (
  <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.5 3.5l-4 4H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h3.5l4 4a.5.5 0 0 0 .5-.5v-14a.5.5 0 0 0-.5-.5z" />
    <path d="M15 9s1.5.5 1.5 3-1.5 3-1.5 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M18 7s2.5 1.5 2.5 5-2.5 5-2.5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SoundOffIcon: React.FC = () => (
  <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.5 3.5l-4 4H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h3.5l4 4a.5.5 0 0 0 .5-.5v-14a.5.5 0 0 0-.5-.5z" />
    <line x1="17" y1="9" x2="22" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="22" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default DuckRaceModal;
