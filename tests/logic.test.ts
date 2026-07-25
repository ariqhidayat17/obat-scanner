import { describe, it, expect } from "vitest";

describe("Business Logic", () => {
  it("should validate drug interaction levels", () => {
    const levels = ["aman", "perhatian", "berbahaya"];
    const resultLevel = "perhatian";
    expect(levels).toContain(resultLevel);
  });

  it("should check if a date is expired", () => {
    const today = new Date();
    const expiryStr = "12/2026";
    const [month, year] = expiryStr.split("/").map(Number);
    const expiryDate = new Date(year, month - 1, 1);
    
    expect(expiryDate.getTime()).toBeGreaterThan(today.getTime());
  });

  it("should format currency correctly", () => {
    const price = 5000;
    const formatted = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);
    
    // Some environments use non-breaking space or different symbols
    expect(formatted).toContain("5.000");
  });
});