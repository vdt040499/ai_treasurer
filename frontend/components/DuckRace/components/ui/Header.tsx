import React from 'react';

interface HeaderProps {
  /** Trạng thái âm thanh */
  soundEnabled: boolean;
  /** Callback toggle sound */
  onToggleSound: () => void;
  /** Callback toggle history panel */
  onToggleHistory: () => void;
  /** Callback đóng modal */
  onClose: () => void;
}

/**
 * Header component cho modal
 * Hiển thị title và các control buttons
 */
const Header: React.FC<HeaderProps> = ({
  soundEnabled,
  onToggleSound,
  onToggleHistory,
  onClose,
}) => {
  return (
    <div className="relative bg-gradient-to-r from-red-500 via-red-600 to-red-500 px-6 py-4 border-b-4 border-red-700">
      <div className="flex items-center justify-between">
        {/* Title */}
        <h2 className="text-2xl font-black text-white flex items-center gap-3 drop-shadow-lg">
          <span className="text-3xl">🦆</span>
          ĐUA VỊT
        </h2>

        {/* Control buttons */}
        <div className="flex items-center gap-2">
          <HeaderButton
            onClick={onToggleSound}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </HeaderButton>

          <HeaderButton onClick={onToggleHistory} title="Lịch sử đua">
            📜
          </HeaderButton>

          <HeaderButton onClick={onClose} title="Đóng">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </HeaderButton>
        </div>
      </div>
    </div>
  );
};

/**
 * Button nhỏ trong header
 */
interface HeaderButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

const HeaderButton: React.FC<HeaderButtonProps> = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
    title={title}
  >
    {children}
  </button>
);

export default Header;
