import { describe, expect, it } from "vitest";
import { formatCPF, generateCPF, isValidCPF } from "../src/lib/cpf";

describe("CPF utilities", () => {
  it("validates a known valid CPF", () => {
    const cpf = "52998224725";
    expect(isValidCPF(cpf)).toBe(true);
    expect(isValidCPF(formatCPF(cpf))).toBe(true);
  });

  it("rejects invalid CPF (wrong digits)", () => {
    expect(isValidCPF("12345678900")).toBe(false);
  });

  it("rejects repeated sequence", () => {
    expect(isValidCPF("00000000000")).toBe(false);
    expect(isValidCPF("11111111111")).toBe(false);
  });

  it("generates and validates formatted CPF", () => {
    const cpf = generateCPF(true);
    expect(isValidCPF(cpf)).toBe(true);
    expect(cpf).toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
  });

  it("generates and validates raw CPF", () => {
    const cpf = generateCPF(false);
    expect(isValidCPF(cpf)).toBe(true);
    expect(cpf).toMatch(/^\d{11}$/);
  });

  it("generates CPF for specific UF (SP → region digit 8)", () => {
    const cpf = generateCPF({ formatted: false, uf: "SP" });
    expect(isValidCPF(cpf)).toBe(true);
    // 9th base digit (index 8) indicates region
    expect(cpf[8]).toBe("8");
  });

  it("generates CPF for RJ and RS", () => {
    const cpfRJ = generateCPF({ formatted: false, uf: "RJ" });
    const cpfRS = generateCPF({ formatted: false, uf: "RS" });
    expect(isValidCPF(cpfRJ)).toBe(true);
    expect(isValidCPF(cpfRS)).toBe(true);
    expect(cpfRJ[8]).toBe("7");
    expect(cpfRS[8]).toBe("0");
  });

  it("handles unknown UF gracefully (no override applied)", () => {
    // Force an unknown UF at runtime to exercise the else branch
    const cpf = generateCPF({ uf: "ZZ" as unknown as "SP" | "RJ" | "RS" });
    expect(isValidCPF(cpf)).toBe(true);
    expect(cpf).toMatch(/^\d{11}$/);
  });

  it("detects invalid CPF when only the last digit is altered", () => {
    const valid = generateCPF(false);
    expect(isValidCPF(valid)).toBe(true);
    const broken = valid.slice(0, 10) + ((parseInt(valid[10], 10) + 1) % 10);
    expect(isValidCPF(broken)).toBe(false);
  });

  it("exercises calcCpfDigit remainder < 2 via generated CPF", () => {
    let found = false;
    for (let i = 0; i < 300 && !found; i++) {
      const cpf = generateCPF(false);
      const nums = [...cpf].map((d) => parseInt(d, 10));
      const d1 = nums[9];
      const d2 = nums[10];
      if (d1 === 0 || d2 === 0) {
        expect(isValidCPF(cpf)).toBe(true);
        found = true;
      }
    }
    expect(found).toBe(true);
  });

  it("detects invalid CPF when the first verifier digit is altered", () => {
    const valid = generateCPF(false);
    expect(isValidCPF(valid)).toBe(true);
    const alteredD1 = ((parseInt(valid[9], 10) + 1) % 10).toString();
    const broken = valid.slice(0, 9) + alteredD1 + valid.slice(10);
    // Should fail early at d1 check: if (d1 !== nums[9]) return false;
    expect(isValidCPF(broken)).toBe(false);
  });

  it("detects invalid formatted CPF when the first verifier digit is altered", () => {
    const formatted = generateCPF(true); // XXX.XXX.XXX-YY
    expect(isValidCPF(formatted)).toBe(true);
    // First verifier digit is at index 12 in formatted form
    const d1Char = formatted[12];
    const alteredD1 = ((parseInt(d1Char, 10) + 1) % 10).toString();
    const broken = formatted.slice(0, 12) + alteredD1 + formatted.slice(13);
    expect(isValidCPF(broken)).toBe(false);
  });

  it("rejects invalid length CPF", () => {
    expect(isValidCPF("")).toBe(false);
    expect(isValidCPF("123")).toBe(false);
    expect(isValidCPF("123456789012")).toBe(false);
  });

  it("formatCPF returns original when length not 11", () => {
    expect(formatCPF("123")).toBe("123");
    expect(formatCPF("")).toBe("");
  });
});
