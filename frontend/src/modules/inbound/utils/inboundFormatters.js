export function formatNumber(val) {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return Number(val).toLocaleString();
}

export function formatPercent(val, decimals = 1) {
  if (val === undefined || val === null || isNaN(val)) return '0.0%';
  return `${Number(val).toFixed(decimals)}%`;
}

export const MONTH_NAMES = {
  1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr',
  5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Aug',
  9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'
};

export const MONTH_TO_NUM = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4,
  May: 5, Jun: 6, Jul: 7, Aug: 8,
  Sep: 9, Oct: 10, Nov: 11, Dec: 12
};

export const INBOUND_CHART_COLORS = [
  '#235789',
  '#2f9c95',
  '#d8892f',
  '#c44949',
  '#6f7c8a',
  '#8a5d3b',
  '#2f7d4f',
  '#7b68a6',
  '#0284c7',
  '#f59e0b',
  '#10b981',
  '#6366f1'
];
