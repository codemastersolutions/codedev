import { describe, expect, it } from "vitest";
import {
  formatCNPJ,
  generateCNPJ,
  isValidCNPJ,
  stripNonDigits,
} from "../src/lib/cnpj";

describe("CNPJ utilities", () => {
  it("stripNonDigits removes non-digit chars and tolerates empty/undefined input", () => {
    expect(stripNonDigits("12.ABC.345/01DE-35")).toBe("123450135");
    expect(stripNonDigits("")).toBe("");
    expect(stripNonDigits(undefined as unknown as string)).toBe("");
  });

  it("rejects invalid CNPJ (wrong digits)", () => {
    expect(isValidCNPJ("12345678000100")).toBe(false);
  });

  it("rejects repeated sequence", () => {
    expect(isValidCNPJ("00000000000000")).toBe(false);
    expect(isValidCNPJ("11111111111111")).toBe(false);
  });

  it("generates and validates formatted CNPJ", () => {
    const cnpj = generateCNPJ(true);
    expect(isValidCNPJ(cnpj)).toBe(true);
    expect(cnpj).toMatch(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
  });

  it("generates and validates raw CNPJ", () => {
    const cnpj = generateCNPJ(false);
    expect(isValidCNPJ(cnpj)).toBe(true);
    expect(cnpj).toMatch(/^\d{14}$/);
  });

  it("validates known alphanumeric CNPJ example", () => {
    expect(isValidCNPJ("12.ABC.345/01DE-35")).toBe(true);
    expect(isValidCNPJ("12.ABC.345/01DE-00")).toBe(false);
    expect(isValidCNPJ("12.ABC.345/01de-35")).toBe(true);
  });

  it("generates and validates alphanumeric CNPJ (formatted and raw)", () => {
    const formatted = generateCNPJ({ type: "alphanumeric", formatted: true });
    expect(isValidCNPJ(formatted)).toBe(true);
    expect(formatted).toMatch(
      /^[0-9A-Z]{2}\.[0-9A-Z]{3}\.[0-9A-Z]{3}\/[0-9A-Z]{4}-\d{2}$/,
    );

    const raw = generateCNPJ({ type: "alphanumeric", formatted: false });
    expect(isValidCNPJ(raw)).toBe(true);
    expect(raw).toMatch(/^[0-9A-Z]{12}\d{2}$/);
  });

  it("rejects alphanumeric CNPJ with non-numeric DV positions", () => {
    expect(isValidCNPJ("12.ABC.345/01DE-AA")).toBe(false);
    expect(isValidCNPJ("12ABC34501DEAA")).toBe(false);
  });

  it("generates numeric CNPJ when options object is provided without type", () => {
    const raw = generateCNPJ({ formatted: false });
    expect(raw).toMatch(/^\d{14}$/);
    expect(isValidCNPJ(raw)).toBe(true);
  });

  it("exercises generateAlphanumericCNPJ fallback path when RNG keeps repeating", () => {
    const originalRandom = Math.random;
    let calls = 0;
    const alphabetLen = 36;
    const loopCalls = 100 * 12;
    const seq = Array.from({ length: 12 }, (_, i) => (i + 0.1) / alphabetLen);

    Math.random = () => {
      calls += 1;
      if (calls <= loopCalls) return 0;
      return seq[(calls - loopCalls - 1) % seq.length]!;
    };

    try {
      const raw = generateCNPJ({ type: "alphanumeric", formatted: false });
      expect(raw).toMatch(/^[0-9A-Z]{12}\d{2}$/);
      expect(isValidCNPJ(raw)).toBe(true);
    } finally {
      Math.random = originalRandom;
    }
  });

  it("rejects invalid length CNPJ", () => {
    expect(isValidCNPJ("")).toBe(false);
    expect(isValidCNPJ("123")).toBe(false);
    expect(isValidCNPJ("123456789012345")).toBe(false);
  });

  it("formatCNPJ returns original when length not 14", () => {
    expect(formatCNPJ("123")).toBe("123");
    expect(formatCNPJ("")).toBe("");
  });

  it("formatCNPJ formats alphanumeric CNPJ", () => {
    expect(formatCNPJ("12ABC34501DE35")).toBe("12.ABC.345/01DE-35");
    expect(formatCNPJ("12.abc.345/01de-35")).toBe("12.ABC.345/01DE-35");
  });

  it("detects invalid CNPJ when only the last digit is altered", () => {
    const valid = generateCNPJ(false);
    expect(isValidCNPJ(valid)).toBe(true);
    const broken = valid.slice(0, 13) + ((parseInt(valid[13], 10) + 1) % 10);
    expect(isValidCNPJ(broken)).toBe(false);
  });

  it("exercises calcDigit remainder < 2 via generated CNPJ", () => {
    let found = false;
    for (let i = 0; i < 300 && !found; i++) {
      const cnpj = generateCNPJ(false);
      const nums = [...cnpj].map((d) => parseInt(d, 10));
      const d1 = nums[12];
      const d2 = nums[13];
      if (d1 === 0 || d2 === 0) {
        expect(isValidCNPJ(cnpj)).toBe(true);
        found = true;
      }
    }
    expect(found).toBe(true);
  });
});
