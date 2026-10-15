import type { BillingFilters } from "@/schemas/filters";
import type { BillingRecord } from "@/types/domain";

export type CurrencyTotal = {
  currency: string;
  amount: string;
};

export type NamedAmount = {
  name: string;
  amount: number;
  currency: string;
};

export type BillingSummary = {
  recordCount: number;
  totalsByCurrency: CurrencyTotal[];
  currentMonthByCurrency: CurrencyTotal[];
  previousPeriodDelta: Array<{
    currency: string;
    current: number;
    previous: number;
    percentChange: number | null;
  }>;
  dailyTrend: Array<{ date: string; amount: number; currency: string }>;
  byService: NamedAmount[];
  byRegion: NamedAmount[];
  byProvider: NamedAmount[];
  byEnvironment: NamedAmount[];
  topServices: NamedAmount[];
  filterOptions: {
    providers: string[];
    services: string[];
    regions: string[];
    environments: string[];
    currencies: string[];
  };
};

function matchesFilters(
  record: BillingRecord,
  filters: BillingFilters,
): boolean {
  if (filters.from && record.billingDate < filters.from) {
    return false;
  }
  if (filters.to && record.billingDate > filters.to) {
    return false;
  }
  if (filters.provider && record.provider !== filters.provider) {
    return false;
  }
  if (filters.service && record.service !== filters.service) {
    return false;
  }
  if (filters.region && record.region !== filters.region) {
    return false;
  }
  if (filters.environment && record.environment !== filters.environment) {
    return false;
  }
  if (filters.currency && record.currency !== filters.currency) {
    return false;
  }
  return true;
}

function sumBy(
  records: BillingRecord[],
  keyFn: (record: BillingRecord) => string,
): Map<string, Map<string, number>> {
  const outer = new Map<string, Map<string, number>>();
  for (const record of records) {
    const key = keyFn(record);
    const byCurrency = outer.get(key) ?? new Map<string, number>();
    const prev = byCurrency.get(record.currency) ?? 0;
    byCurrency.set(record.currency, prev + Number(record.cost));
    outer.set(key, byCurrency);
  }
  return outer;
}

function toCurrencyTotals(
  map: Map<string, number>,
): CurrencyTotal[] {
  return [...map.entries()]
    .map(([currency, amount]) => ({
      currency,
      amount: amount.toFixed(6),
    }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

function flattenNamed(
  nested: Map<string, Map<string, number>>,
  preferredCurrency?: string,
): NamedAmount[] {
  const rows: NamedAmount[] = [];
  for (const [name, byCurrency] of nested) {
    if (preferredCurrency && byCurrency.has(preferredCurrency)) {
      rows.push({
        name,
        amount: byCurrency.get(preferredCurrency) ?? 0,
        currency: preferredCurrency,
      });
      continue;
    }
    for (const [currency, amount] of byCurrency) {
      rows.push({ name, amount, currency });
    }
  }
  return rows.sort((a, b) => b.amount - a.amount);
}

function monthPrefix(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function shiftMonth(yyyyMm: string, delta: number): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function summarizeBilling(
  records: BillingRecord[],
  filters: BillingFilters = {},
): BillingSummary {
  const filtered = records.filter((record) => matchesFilters(record, filters));

  const totalsMap = new Map<string, number>();
  const dailyMap = new Map<string, Map<string, number>>();

  for (const record of filtered) {
    totalsMap.set(
      record.currency,
      (totalsMap.get(record.currency) ?? 0) + Number(record.cost),
    );
    const dayBucket = dailyMap.get(record.billingDate) ?? new Map();
    dayBucket.set(
      record.currency,
      (dayBucket.get(record.currency) ?? 0) + Number(record.cost),
    );
    dailyMap.set(record.billingDate, dayBucket);
  }

  const latestDate =
    filtered.length > 0
      ? filtered.reduce(
          (max, record) =>
            record.billingDate > max ? record.billingDate : max,
          filtered[0].billingDate,
        )
      : null;

  const currentMonth = latestDate ? monthPrefix(latestDate) : null;
  const previousMonth = currentMonth ? shiftMonth(currentMonth, -1) : null;

  const currentMonthMap = new Map<string, number>();
  const previousMonthMap = new Map<string, number>();

  for (const record of filtered) {
    const prefix = monthPrefix(record.billingDate);
    if (prefix === currentMonth) {
      currentMonthMap.set(
        record.currency,
        (currentMonthMap.get(record.currency) ?? 0) + Number(record.cost),
      );
    }
    if (prefix === previousMonth) {
      previousMonthMap.set(
        record.currency,
        (previousMonthMap.get(record.currency) ?? 0) + Number(record.cost),
      );
    }
  }

  const currencies = new Set([
    ...currentMonthMap.keys(),
    ...previousMonthMap.keys(),
  ]);
  const previousPeriodDelta = [...currencies].map((currency) => {
    const current = currentMonthMap.get(currency) ?? 0;
    const previous = previousMonthMap.get(currency) ?? 0;
    const percentChange =
      previous === 0
        ? current === 0
          ? 0
          : null
        : ((current - previous) / Math.abs(previous)) * 100;
    return { currency, current, previous, percentChange };
  });

  const primaryCurrency =
    filters.currency ??
    (totalsMap.size === 1 ? [...totalsMap.keys()][0] : undefined);

  const dailyTrend: BillingSummary["dailyTrend"] = [];
  for (const date of [...dailyMap.keys()].sort()) {
    const byCurrency = dailyMap.get(date)!;
    if (primaryCurrency && byCurrency.has(primaryCurrency)) {
      dailyTrend.push({
        date,
        amount: byCurrency.get(primaryCurrency) ?? 0,
        currency: primaryCurrency,
      });
    } else {
      for (const [currency, amount] of byCurrency) {
        dailyTrend.push({ date, amount, currency });
      }
    }
  }

  const byService = flattenNamed(
    sumBy(filtered, (record) => record.service),
    primaryCurrency,
  );
  const byRegion = flattenNamed(
    sumBy(filtered, (record) => record.region),
    primaryCurrency,
  );
  const byProvider = flattenNamed(
    sumBy(filtered, (record) => record.provider),
    primaryCurrency,
  );
  const byEnvironment = flattenNamed(
    sumBy(filtered, (record) => record.environment),
    primaryCurrency,
  );

  const allProviders = new Set(records.map((r) => r.provider));
  const allServices = new Set(records.map((r) => r.service));
  const allRegions = new Set(records.map((r) => r.region));
  const allEnvironments = new Set(records.map((r) => r.environment));
  const allCurrencies = new Set(records.map((r) => r.currency));

  return {
    recordCount: filtered.length,
    totalsByCurrency: toCurrencyTotals(totalsMap),
    currentMonthByCurrency: toCurrencyTotals(currentMonthMap),
    previousPeriodDelta,
    dailyTrend,
    byService,
    byRegion,
    byProvider,
    byEnvironment,
    topServices: byService.slice(0, 5),
    filterOptions: {
      providers: [...allProviders].sort(),
      services: [...allServices].sort(),
      regions: [...allRegions].sort(),
      environments: [...allEnvironments].sort(),
      currencies: [...allCurrencies].sort(),
    },
  };
}
