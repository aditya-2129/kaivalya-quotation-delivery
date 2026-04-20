export const formatDecimal = (value) => {
  const num = parseFloat(value || 0);
  return num.toFixed(2);
};

export const formatCurrency = (value) => {
  const num = parseFloat(value || 0);
  return num.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};
