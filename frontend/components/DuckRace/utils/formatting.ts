/**
 * Format milliseconds thành chuỗi MM:SS (phút:giây.mili)
 * @example formatTime(5230) => "05:23"
 */
export const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${seconds.toString().padStart(2, '0')}:${centiseconds.toString().padStart(2, '0')}`;
};

/**
 * Format race time cho UI hiển thị (MM:SS format)
 */
export const formatRaceTimer = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
