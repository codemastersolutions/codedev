import { describe, expect, it } from "vitest";
import {
  formatCNPJ,
  generateCNPJ,
  isValidCNPJ,
  sanitizeCNPJ,
  stripNonDigits,
} from "../src/lib/cnpj";

describe("CNPJ utilities", () => {
  it("sanitizeCNPJ trims, uppercases and strips non-alphanumerics", () => {
    expect(sanitizeCNPJ("  12.abc.345/01de-35  ")).toBe("12ABC34501DE35");
    expect(sanitizeCNPJ("12ABC34501DE35")).toBe("12ABC34501DE35");
    expect(sanitizeCNPJ("")).toBe("");
  });

  it("sanitizeCNPJ tolerates null/undefined and coerces non-string input", () => {
    expect(sanitizeCNPJ(null)).toBe("");
    expect(sanitizeCNPJ(undefined)).toBe("");
    expect(sanitizeCNPJ(12345678000195 as unknown as string)).toBe("12345678000195");
  });

  it("isValidCNPJ accepts input with surrounding whitespace and mixed case", () => {
    expect(isValidCNPJ("  12.abc.345/01de-35  ")).toBe(true);
    expect(isValidCNPJ("\t12.ABC.345/01DE-35\n")).toBe(true);
  });

  it("isValidCNPJ rejects null/undefined without throwing", () => {
    expect(isValidCNPJ(null as unknown as string)).toBe(false);
    expect(isValidCNPJ(undefined as unknown as string)).toBe(false);
  });
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
    const formatted = generateCNPJ({
      type: "alphanumeric",
      formatted: true,
      branch: "filial",
    });
    expect(isValidCNPJ(formatted)).toBe(true);
    expect(formatted).toMatch(
      /^[0-9A-Z]{2}\.[0-9A-Z]{3}\.[0-9A-Z]{3}\/[0-9A-Z]{4}-\d{2}$/,
    );

    const raw = generateCNPJ({
      type: "alphanumeric",
      formatted: false,
      branch: "filial",
    });
    expect(isValidCNPJ(raw)).toBe(true);
    expect(raw).toMatch(/^[0-9A-Z]{12}\d{2}$/);
  });

  it("generates matriz alphanumeric CNPJ with 8 alphanum + 0001 branch + 2 numeric DV", () => {
    const raw = generateCNPJ({
      type: "alphanumeric",
      formatted: false,
      branch: "matriz",
    });
    expect(isValidCNPJ(raw)).toBe(true);
    expect(raw).toMatch(/^[0-9A-Z]{8}0001\d{2}$/);

    const formatted = generateCNPJ({
      type: "alphanumeric",
      formatted: true,
      branch: "matriz",
    });
    expect(isValidCNPJ(formatted)).toBe(true);
    expect(formatted).toMatch(
      /^[0-9A-Z]{2}\.[0-9A-Z]{3}\.[0-9A-Z]{3}\/0001-\d{2}$/,
    );
  });

  it("defaults branch to matriz when generating alphanumeric CNPJ", () => {
    const raw = generateCNPJ({ type: "alphanumeric", formatted: false });
    expect(raw).toMatch(/^[0-9A-Z]{8}\d{6}$/);
    expect(isValidCNPJ(raw)).toBe(true);
  });

  it("treats numeric type as fully numeric regardless of branch", () => {
    const matriz = generateCNPJ({ formatted: false, branch: "matriz" });
    const filial = generateCNPJ({ formatted: false, branch: "filial" });
    expect(matriz).toMatch(/^\d{14}$/);
    expect(filial).toMatch(/^\d{14}$/);
    expect(isValidCNPJ(matriz)).toBe(true);
    expect(isValidCNPJ(filial)).toBe(true);
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

  it("generates valid alphanumeric CNPJ with mocked RNG (filial branch)", () => {
    const originalRandom = Math.random;
    let calls = 0;
    const alphabetLen = 36;
    const seq = Array.from({ length: 12 }, (_, i) => (i + 0.1) / alphabetLen);

    Math.random = () => {
      calls += 1;
      return seq[(calls - 1) % seq.length]!;
    };

    try {
      const raw = generateCNPJ({
        type: "alphanumeric",
        formatted: false,
        branch: "filial",
      });
      expect(raw).toMatch(/^[0-9A-Z]{12}\d{2}$/);
      expect(isValidCNPJ(raw)).toBe(true);
    } finally {
      Math.random = originalRandom;
    }
  });

  it("throws when maxAttempts is exhausted without a valid result", () => {
    const originalRandom = Math.random;
    Math.random = () => 0;
    try {
      expect(() =>
        generateCNPJ({
          type: "alphanumeric",
          formatted: false,
          branch: "filial",
          maxAttempts: 3,
        }),
      ).toThrow(/Failed to generate a valid CNPJ after 3 attempts/);
    } finally {
      Math.random = originalRandom;
    }
  });

  it("throws when maxAttempts is 0", () => {
    expect(() =>
      generateCNPJ({ type: "alphanumeric", formatted: false, maxAttempts: 0 }),
    ).toThrow(/Failed to generate a valid CNPJ after 0 attempts/);
  });

  it("rejects invalid length CNPJ", () => {
    expect(isValidCNPJ("")).toBe(false);
    expect(isValidCNPJ("123")).toBe(false);
    expect(isValidCNPJ("123456789012345")).toBe(false);
  });

  it("rejects numeric CNPJ of any non-14 length via internal length check", () => {
    // Exercises isValidNumericCNPJ `if (digits.length !== 14) return false;` (line 39).
    expect(isValidCNPJ("0")).toBe(false);
    expect(isValidCNPJ("1234567890")).toBe(false);
    expect(isValidCNPJ("12345678901234")).toBe(false);
    expect(isValidCNPJ("1234567890123456")).toBe(false);
  });

  it("rejects alphanumeric CNPJ of any non-14 length via internal regex check", () => {
    expect(isValidCNPJ("A")).toBe(false);
    expect(isValidCNPJ("AAAAAAAAA")).toBe(false);
    expect(isValidCNPJ("AAAAAAAAAAAAAA")).toBe(false);
    expect(isValidCNPJ("AAAAAAAAAAAAAAAAA")).toBe(false);
  });

  it("returns false for input containing only non-alphanumeric chars after mask strip", () => {
    // After stripping the mask, normalized is empty → falls through to `return false`.
    expect(isValidCNPJ("...")).toBe(false);
    expect(isValidCNPJ("---")).toBe(false);
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
