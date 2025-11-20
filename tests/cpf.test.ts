import { describe, expect, it } from 'vitest';
import { formatCPF, generateCPF, isValidCPF } from '../src/lib/cpf';

describe('CPF utilities', () => {
  it('validates a known valid CPF', () => {
    const cpf = '52998224725';
    expect(isValidCPF(cpf)).toBe(true);
    expect(isValidCPF(formatCPF(cpf))).toBe(true);
  });

  it('rejects invalid CPF (wrong digits)', () => {
    expect(isValidCPF('12345678900')).toBe(false);
  });

  it('rejects repeated sequence', () => {
    expect(isValidCPF('00000000000')).toBe(false);
    expect(isValidCPF('11111111111')).toBe(false);
  });

  it('generates and validates formatted CPF', () => {
    const cpf = generateCPF(true);
    expect(isValidCPF(cpf)).toBe(true);
    expect(cpf).toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
  });

  it('generates and validates raw CPF', () => {
    const cpf = generateCPF(false);
    expect(isValidCPF(cpf)).toBe(true);
    expect(cpf).toMatch(/^\d{11}$/);
  });

  it('rejects invalid length CPF', () => {
    expect(isValidCPF('')).toBe(false);
    expect(isValidCPF('123')).toBe(false);
    expect(isValidCPF('123456789012')).toBe(false);
  });

  it('formatCPF returns original when length not 11', () => {
    expect(formatCPF('123')).toBe('123');
    expect(formatCPF('')).toBe('');
  });
});
