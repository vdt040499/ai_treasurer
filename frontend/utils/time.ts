const getCurrentYear = () => {
  return new Date().getFullYear();
};

const getCurrentMonth = () => {
  return new Date().getMonth() + 1;
};

const getMonths = () => {
  const currentYear = new Date().getFullYear();
  const months = [];
  for (let i = 1; i <= 12; i++) {
    months.push(`${currentYear}-${String(i).padStart(2, '0')}`);
  }
  return months;
}

export { getCurrentYear, getCurrentMonth, getMonths };
