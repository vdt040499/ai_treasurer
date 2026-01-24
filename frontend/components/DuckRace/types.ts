export type GamePhase = 'input' | 'countdown' | 'racing' | 'paused' | 'result';

export interface RaceHistory {
  id: string;
  date: string;
  foods: string[];
  winner: string;
  duration: number;
}

export interface DuckRaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface DuckColor {
  body: string;
  beak: string;
  wing: string;
  label: string;
}
