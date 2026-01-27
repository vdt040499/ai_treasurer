/**
 * Parse input text thành array các món ăn
 * Hỗ trợ: dấu phẩy, xuống dòng, hoặc single item
 *
 * @example
 * parseInput("Phở, Bún bò") => ["Phở", "Bún bò"]
 * parseInput("Phở\nBún bò") => ["Phở", "Bún bò"]
 */
export const parseInput = (text: string): string[] => {
  // Ưu tiên dấu phẩy trước
  if (text.includes(',')) {
    return text.split(',').map(s => s.trim()).filter(Boolean);
  }
  // Sau đó mới check xuống dòng
  if (text.includes('\n')) {
    return text.split('\n').map(s => s.trim()).filter(Boolean);
  }
  // Single item
  return text.trim() ? [text.trim()] : [];
};
