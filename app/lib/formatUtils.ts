/**
 * Utility functions for formatting numbers and points
 */

/**
 * Format points for display with exact precision
 * Examples:
 * 1070 → "1.07K"
 * 1000 → "1K" 
 * 1500 → "1.5K"
 * 1234 → "1.23K"
 * 999 → "999"
 * 1000000 → "1M"
 * 1070000 → "1.07M"
 */
export function formatPoints(points: number): string {
  if (points >= 1000000) {
    const millions = points / 1000000;
    // Show up to 2 decimal places for millions, remove trailing zeros
    return parseFloat(millions.toFixed(2)) + 'M';
  } else if (points >= 1000) {
    const thousands = points / 1000;
    // Show up to 2 decimal places for thousands, remove trailing zeros
    return parseFloat(thousands.toFixed(2)) + 'K';
  }
  return points.toString();
}

/**
 * Format points with commas for exact display (no K/M abbreviation)
 * Examples:
 * 1070 → "1,070"
 * 1234567 → "1,234,567"
 */
export function formatPointsExact(points: number): string {
  return points.toLocaleString();
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(amount);
}

/**
 * Format SOL amounts with appropriate precision
 */
export function formatSOL(amount: number): string {
  if (amount >= 1) {
    return amount.toFixed(4) + ' SOL';
  } else if (amount >= 0.001) {
    return amount.toFixed(6) + ' SOL';
  } else {
    return amount.toFixed(9) + ' SOL';
  }
}