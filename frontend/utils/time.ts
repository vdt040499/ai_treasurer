const getCurrentYear = () => {
  return new Date().getFullYear();
};

const getCurrentMonth = () => {
  return new Date().getMonth() + 1;
};

export { getCurrentYear, getCurrentMonth };
