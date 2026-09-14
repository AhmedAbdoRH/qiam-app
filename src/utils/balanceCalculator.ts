// Balance math — preserved 100% verbatim from src/utils/balanceCalculator.ts
export const calculateBalance = (selectedFeelingsCount: number): number => {
  return Math.round(100 - (selectedFeelingsCount / 7) * 100);
};

export const getBalanceColor = (percentage: number): string => {
  let hue: number;
  if (percentage <= 50) {
    hue = percentage * 0.6; // 0% -> 0 (red), 50% -> 30 (orange)
  } else {
    hue = 30 + (percentage - 50) * 1.8; // 50% -> 30, 100% -> 120 (green)
  }
  const saturation = 95;
  const lightness = 30 + (percentage / 100) * 20;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Helper: convert HSL string to a usable RN color (RN supports hsl() strings)
export const balanceToRgba = (percentage: number, alpha = 1): string => {
  // keep returning hsl() — React Native supports it directly
  return getBalanceColor(percentage);
};
