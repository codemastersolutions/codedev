import { describe, expect, it } from 'vitest';
import { formatCNPJ, generateCNPJ, isValidCNPJ } from '../src/lib/cnpj';

describe('CNPJ utilities', () => {
  it('rejects invalid CNPJ (wrong digits)', () => {
    expect(isValidCNPJ('12345678000100')).toBe(false);
  });

  it('rejects repeated sequence', () => {
    expect(isValidCNPJ('00000000000000')).toBe(false);
    expect(isValidCNPJ('11111111111111')).toBe(false);
  });

  it('generates and validates formatted CNPJ', () => {
    const cnpj = generateCNPJ(true);
    expect(isValidCNPJ(cnpj)).toBe(true);
    expect(cnpj).toMatch(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
  });

  it('generates and validates raw CNPJ', () => {
    const cnpj = generateCNPJ(false);
    expect(isValidCNPJ(cnpj)).toBe(true);
    expect(cnpj).toMatch(/^\d{14}$/);
  });

  it('rejects invalid length CNPJ', () => {
    expect(isValidCNPJ('')).toBe(false);
    expect(isValidCNPJ('123')).toBe(false);
    expect(isValidCNPJ('123456789012345')).toBe(false);
  });

  it('formatCNPJ returns original when length not 14', () => {
    expect(formatCNPJ('123')).toBe('123');
    expect(formatCNPJ('')).toBe('');
  });

  it('detects invalid CNPJ when only the last digit is altered', () => {
    const valid = generateCNPJ(false);
    expect(isValidCNPJ(valid)).toBe(true);
    const broken = valid.slice(0, 13) + ((parseInt(valid[13], 10) + 1) % 10);
    expect(isValidCNPJ(broken)).toBe(false);
  });
});
