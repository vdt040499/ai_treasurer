import React from 'react';
import { DUCK_COLORS, RACE_DURATIONS } from '../../constants';
import { DuckSVG } from '../';

interface InputPhaseProps {
  /** Danh sách món ăn đã thêm */
  foods: string[];
  /** Giá trị input hiện tại */
  inputValue: string;
  /** Thời gian đua đã chọn (ms) */
  raceDuration: number;
  /** Callback khi input thay đổi */
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /** Callback khi nhấn phím */
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Callback khi nhấn nút Thêm */
  onAddFoods: () => void;
  /** Callback khi xóa một món */
  onRemoveFood: (index: number) => void;
  /** Callback khi xóa tất cả */
  onClearAllFoods: () => void;
  /** Callback khi chọn thời gian đua */
  onSetRaceDuration: (duration: number) => void;
  /** Callback khi nhấn bắt đầu */
  onStartRace: () => void;
}

/**
 * Component màn hình nhập danh sách món ăn
 * Bao gồm: textarea, food tags, duration selector, start button
 */
const InputPhase: React.FC<InputPhaseProps> = ({
  foods,
  inputValue,
  raceDuration,
  onInputChange,
  onKeyPress,
  onAddFoods,
  onRemoveFood,
  onClearAllFoods,
  onSetRaceDuration,
  onStartRace,
}) => {
  const canStart = foods.length >= 2;
  const missingCount = Math.max(0, 2 - foods.length);

  return (
    <div className="space-y-4 bg-white/90 rounded-2xl p-6 backdrop-blur">
      {/* Input section */}
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
            onChange={onInputChange}
            onKeyDown={onKeyPress}
            placeholder="Phở, Bún bò, Cơm tấm... (dùng dấu phẩy để nhập nhiều món)"
            className="flex-1 h-20 px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-lg"
            autoFocus
          />
          <button
            onClick={onAddFoods}
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

      {/* Food tags */}
      {foods.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">
              Đội hình ({foods.length} vịt):
            </p>
            <button
              onClick={onClearAllFoods}
              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
            >
              🗑️ Xóa hết
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {foods.map((food, index) => {
              const color = DUCK_COLORS[index % DUCK_COLORS.length];
              return (
                <FoodTag
                  key={index}
                  food={food}
                  color={color}
                  onRemove={() => onRemoveFood(index)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Race Duration Selector */}
      <div className="space-y-2">
        <p className="text-sm text-slate-500 font-medium">⏱️ Thời gian đua:</p>
        <div className="flex gap-2">
          {RACE_DURATIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSetRaceDuration(option.value)}
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

      {/* Start button */}
      <button
        onClick={onStartRace}
        disabled={!canStart}
        className={`w-full py-4 rounded-xl font-bold text-white text-xl transition-all shadow-lg ${
          canStart
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl'
            : 'bg-slate-300 cursor-not-allowed'
        }`}
      >
        {canStart
          ? '🏁 BẮT ĐẦU ĐUA!'
          : `Cần ít nhất 2 món (còn thiếu ${missingCount})`
        }
      </button>
    </div>
  );
};

/**
 * Component tag hiển thị một món ăn
 */
interface FoodTagProps {
  food: string;
  color: typeof DUCK_COLORS[0];
  onRemove: () => void;
}

const FoodTag: React.FC<FoodTagProps> = ({ food, color, onRemove }) => (
  <span
    className={`px-4 py-2 ${color.label} text-white rounded-full flex items-center gap-2 font-medium shadow-lg`}
  >
    <span className="w-6 h-6 flex-shrink-0">
      <DuckSVG color={color} size={24} isAnimating={false} />
    </span>
    {food}
    <button
      onClick={onRemove}
      className="hover:bg-white/30 rounded-full w-5 h-5 flex items-center justify-center transition-colors ml-1"
    >
      ×
    </button>
  </span>
);

export default InputPhase;
