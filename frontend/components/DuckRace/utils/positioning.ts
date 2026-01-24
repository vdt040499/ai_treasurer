/**
 * === 2.5D POSITIONING SYSTEM ===
 *
 * Hệ thống tính toán vị trí 2.5D cho duck race.
 * Tạo hiệu ứng depth (xa gần) bằng cách:
 * - Duck ở lane trên (index thấp) -> to hơn, z-index cao hơn
 * - Duck ở lane dưới (index cao) -> nhỏ hơn, z-index thấp hơn
 */

// ===== CONSTANTS =====

/** Vị trí vertical bắt đầu của lane đầu tiên (% từ top) */
const LANE_START_PERCENT = 28;

/** Tổng chiều cao các lanes chiếm (%) */
const LANE_TOTAL_HEIGHT_PERCENT = 58;

/** Scale tối đa cho duck gần nhất */
const MAX_DEPTH_SCALE = 1.1;

/** Độ giảm scale theo depth */
const DEPTH_SCALE_REDUCTION = 0.35;

/** Base z-index cho duck layer */
const BASE_Z_INDEX = 50;

/** Hệ số chuyển đổi position -> visual position */
const POSITION_TO_VISUAL_RATIO = 0.72;

/** Giới hạn visual position tối đa (%) */
const MAX_VISUAL_POSITION = 70;

// ===== TYPES =====

export interface DuckPosition {
  /** Vị trí vertical của duck (% từ top) */
  verticalPercent: number;
  /** Scale theo depth (1.1 = gần, 0.75 = xa) */
  depthScale: number;
  /** Z-index để render đúng thứ tự */
  zIndex: number;
  /** Vị trí horizontal trên đường đua (0-100%) */
  horizontalPercent: number;
}

// ===== FUNCTIONS =====

/**
 * Tính toán vị trí 2.5D cho một con duck
 *
 * @param index - Index của duck trong danh sách (0 = lane trên cùng)
 * @param totalDucks - Tổng số duck tham gia
 * @param raceProgress - Tiến độ đua (0-100)
 * @returns DuckPosition object với tất cả thông số vị trí
 */
export const calculateDuckPosition = (
  index: number,
  totalDucks: number,
  raceProgress: number = 0
): DuckPosition => {
  // Tính vertical position dựa trên lane
  const laneSpacing = LANE_TOTAL_HEIGHT_PERCENT / Math.max(totalDucks, 1);
  const verticalPercent = LANE_START_PERCENT + (index * laneSpacing);

  // Tính depth ratio (0 = gần nhất, 1 = xa nhất)
  const depthRatio = totalDucks > 1
    ? index / (totalDucks - 1)
    : 0;

  // Scale giảm dần theo depth
  const depthScale = MAX_DEPTH_SCALE - (depthRatio * DEPTH_SCALE_REDUCTION);

  // Z-index giảm theo index (duck gần có z-index cao hơn)
  const zIndex = BASE_Z_INDEX - index;

  // Horizontal position từ race progress
  const horizontalPercent = Math.min(raceProgress * POSITION_TO_VISUAL_RATIO, MAX_VISUAL_POSITION);

  return {
    verticalPercent,
    depthScale,
    zIndex,
    horizontalPercent,
  };
};

/**
 * Tính vị trí cho ripple effect (thấp hơn duck một chút)
 */
export const calculateRipplePosition = (
  index: number,
  totalDucks: number,
  raceProgress: number
): { cx: number; cy: number } => {
  const laneSpacing = 70 / Math.max(totalDucks, 1);
  const cy = 15 + (index * laneSpacing) + 8; // +8 để ripple ở dưới duck
  const cx = Math.min(raceProgress * POSITION_TO_VISUAL_RATIO, MAX_VISUAL_POSITION) + 5;

  return { cx, cy };
};

/**
 * Counter-scale cho label (giữ label cùng kích thước bất kể depth)
 */
export const getLabelCounterScale = (depthScale: number): number => {
  return 1 / depthScale;
};
