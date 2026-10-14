import { describe, expect, it } from "vitest";
import { formatMoney, isZeroAmount } from "@/lib/money";
import { isValidIsoDate } from "@/lib/dates";

describe("money helpers", () => {
  it("formats CAD amounts", () => {
    const formatted = formatMoney({ amount: "12.5", currency: "CAD" });
    expect(formatted).toMatch(/12/);
    expect(formatted).toMatch(/CAD|\$/);
  });

  it("detects zero amounts", () => {
    expect(isZeroAmount("0")).toBe(true);
    expect(isZeroAmount("0.00")).toBe(true);
    expect(isZeroAmount("1")).toBe(false);
  });
});

describe("date helpers", () => {
  it("validates ISO dates", () => {
    expect(isValidIsoDate("2026-01-15")).toBe(true);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("not-a-date")).toBe(false);
  });
});
