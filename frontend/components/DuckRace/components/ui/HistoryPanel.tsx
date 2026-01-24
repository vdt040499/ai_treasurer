import React from 'react';
import { RaceHistory } from '../../types';
import { formatTime } from '../../utils';

interface HistoryPanelProps {
  /** Danh sách lịch sử đua */
  history: RaceHistory[];
  /** Callback đóng panel */
  onClose: () => void;
  /** Callback xóa tất cả lịch sử */
  onClear: () => void;
}

/**
 * Panel hiển thị lịch sử các cuộc đua
 * Overlay full màn hình content area
 */
const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onClose,
  onClear,
}) => {
  return (
    <div className="absolute inset-0 bg-white/95 z-10 p-6 overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-700">📜 Lịch sử đua</h3>
        <div className="flex gap-2">
          {history.length > 0 && (
            <button
              onClick={onClear}
              className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 transition-colors"
            >
              Xóa tất cả
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Content */}
      {history.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {history.map((race) => (
            <HistoryCard key={race.id} race={race} />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Empty state khi chưa có lịch sử
 */
const EmptyState: React.FC = () => (
  <p className="text-slate-400 text-center py-8">
    Chưa có lịch sử đua nào
  </p>
);

/**
 * Card hiển thị một cuộc đua trong lịch sử
 */
interface HistoryCardProps {
  race: RaceHistory;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ race }) => (
  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-orange-100">
    <div className="flex justify-between items-start">
      {/* Left side: winner info */}
      <div>
        <p className="text-xs text-slate-400">{race.date}</p>
        <p className="font-bold text-orange-600 text-lg">🏆 {race.winner}</p>
        <p className="text-sm text-slate-500">
          {race.foods.length} món · {formatTime(race.duration)}
        </p>
      </div>

      {/* Right side: participants */}
      <div className="text-right">
        <p className="text-xs text-slate-400">Các món tham gia:</p>
        <p className="text-xs text-slate-500 max-w-[200px] truncate">
          {race.foods.join(', ')}
        </p>
      </div>
    </div>
  </div>
);

export default HistoryPanel;
