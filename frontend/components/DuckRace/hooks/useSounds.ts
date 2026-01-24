import { useRef, useCallback } from 'react';

/**
 * === AUDIO CONFIGURATION ===
 * Các hằng số cho Web Audio API sounds
 */

// Quack sound
const QUACK_START_FREQ = 600;
const QUACK_END_FREQ = 200;
const QUACK_DURATION = 0.15;

// Countdown beep
const COUNTDOWN_FREQ = 440; // A4 note
const COUNTDOWN_DURATION = 0.2;

// Start signal
const START_FREQ = 880; // A5 note
const START_DURATION = 0.5;

// Background music
const BG_BASE_FREQ = 150;
const BG_LFO_FREQ = 8; // Low Frequency Oscillator - tạo hiệu ứng wobble
const BG_LFO_DEPTH = 30;
const BG_VOLUME = 0.08;

// Victory fanfare notes (C major chord + octave)
const VICTORY_NOTES = [523, 659, 784, 1047]; // C5, E5, G5, C6
const VICTORY_NOTE_GAP = 0.15;
const VICTORY_NOTE_DURATION = 0.3;

// Volume levels
const DEFAULT_VOLUME = 0.3;
const START_VOLUME = 0.4;

interface AudioContextWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Hook quản lý tất cả âm thanh trong game
 * Sử dụng Web Audio API để tạo âm thanh programmatically
 */
export const useSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const bgMusicRef = useRef<OscillatorNode | null>(null);

  /**
   * Lazy init AudioContext (chỉ tạo khi cần)
   * Hỗ trợ cả standard và webkit prefix
   */
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const windowWithWebkit = window as AudioContextWindow;
      audioContextRef.current = new (window.AudioContext || windowWithWebkit.webkitAudioContext!)();
    }
    return audioContextRef.current;
  }, []);

  /**
   * Helper function để tạo một tone đơn giản
   */
  const playTone = useCallback((
    frequency: number,
    duration: number,
    volume: number = DEFAULT_VOLUME,
    type: OscillatorType = 'sine'
  ) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      // Silently fail nếu audio không được hỗ trợ
    }
  }, [getAudioContext]);

  /**
   * Tiếng kêu "quack" của vịt
   * Sử dụng frequency sweep từ cao xuống thấp
   */
  const playQuack = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Frequency sweep tạo hiệu ứng "quack"
      oscillator.frequency.setValueAtTime(QUACK_START_FREQ, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(QUACK_END_FREQ, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(DEFAULT_VOLUME, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + QUACK_DURATION);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + QUACK_DURATION);
    } catch {
      // Silently fail
    }
  }, [getAudioContext]);

  /**
   * Tiếng beep đếm ngược (3, 2, 1)
   */
  const playCountdown = useCallback(() => {
    playTone(COUNTDOWN_FREQ, COUNTDOWN_DURATION);
  }, [playTone]);

  /**
   * Tiếng bắt đầu (cao hơn và dài hơn countdown)
   */
  const playStart = useCallback(() => {
    playTone(START_FREQ, START_DURATION, START_VOLUME);
  }, [playTone]);

  /**
   * Bật nhạc nền
   * Sử dụng LFO (Low Frequency Oscillator) để tạo hiệu ứng wobble
   */
  const startBgMusic = useCallback(() => {
    try {
      const ctx = getAudioContext();

      // Main oscillator
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // LFO để modulate frequency -> tạo wobble effect
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      // Connect LFO -> main oscillator frequency
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);

      // Connect main -> output
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Configure oscillators
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(BG_BASE_FREQ, ctx.currentTime);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(BG_LFO_FREQ, ctx.currentTime);
      lfoGain.gain.setValueAtTime(BG_LFO_DEPTH, ctx.currentTime);

      gainNode.gain.setValueAtTime(BG_VOLUME, ctx.currentTime);

      // Start
      oscillator.start();
      lfo.start();

      // Store reference để stop later
      bgMusicRef.current = oscillator;
    } catch {
      // Silently fail
    }
  }, [getAudioContext]);

  /**
   * Tắt nhạc nền
   */
  const stopBgMusic = useCallback(() => {
    try {
      if (bgMusicRef.current) {
        bgMusicRef.current.stop();
        bgMusicRef.current = null;
      }
    } catch {
      // Silently fail
    }
  }, []);

  /**
   * Nhạc chiến thắng - fanfare C major arpeggio
   */
  const playWin = useCallback(() => {
    try {
      const ctx = getAudioContext();

      VICTORY_NOTES.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const startTime = ctx.currentTime + i * VICTORY_NOTE_GAP;

        oscillator.frequency.setValueAtTime(freq, startTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(DEFAULT_VOLUME, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + VICTORY_NOTE_DURATION);

        oscillator.start(startTime);
        oscillator.stop(startTime + VICTORY_NOTE_DURATION);
      });
    } catch {
      // Silently fail
    }
  }, [getAudioContext]);

  return {
    playQuack,
    playCountdown,
    playStart,
    startBgMusic,
    stopBgMusic,
    playWin,
  };
};
