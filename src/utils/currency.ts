// Currency configuration for Indian Rupees
export const CURRENCY = {
  symbol: '₹',
  code: 'INR',
  locale: 'en-IN',
};

/**
 * Format number as Indian Rupees
 */
export function formatCurrency(amount: number): string {
  return `${CURRENCY.symbol}${amount.toFixed(2)}`;
}

/**
 * Format number with Indian number formatting (comma separators)
 */
export function formatCurrencyWithLocale(amount: number): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

