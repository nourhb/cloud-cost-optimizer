/** Decimal money helpers — amounts stay as strings to avoid IEEE-754 drift. */

export type Money = {
  amount: string;
  currency: string;
};

export function formatMoney(money: Money, locale = "en-CA"): string {
  const value = Number(money.amount);
  if (Number.isNaN(value)) {
    return `${money.amount} ${money.currency}`;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: money.currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${money.amount} ${money.currency}`;
  }
}

export function isZeroAmount(amount: string): boolean {
  const value = Number(amount);
  return !Number.isNaN(value) && value === 0;
}
