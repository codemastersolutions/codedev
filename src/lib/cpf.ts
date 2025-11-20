export function stripNonDigits(value: string): string {
  return (value || '').replace(/\D+/g, '');
}

function isRepeatedSequence(digits: string): boolean {
  return /^([0-9])\1{10}$/.test(digits);
}

function calcCpfDigit(baseDigits: number[], weightStart: number): number {
  const sum = baseDigits.reduce((acc, digit, index) => acc + digit * (weightStart - index), 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCPF(input: string): boolean {
  const digits = stripNonDigits(input);
  if (digits.length !== 11) return false;
  if (isRepeatedSequence(digits)) return false;

  const nums = [...digits].map((d) => parseInt(d, 10));
  const baseNine = nums.slice(0, 9);
  const d1 = calcCpfDigit(baseNine, 10);
  if (d1 !== nums[9]) return false;
  const baseTen = [...baseNine, d1];
  const d2 = calcCpfDigit(baseTen, 11);
  return d2 === nums[10];
}

export function generateCPF(formatted = false): string {
  const baseNine = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const d1 = calcCpfDigit(baseNine, 10);
  const d2 = calcCpfDigit([...baseNine, d1], 11);
  const all = [...baseNine, d1, d2].join('');
  return formatted ? formatCPF(all) : all;
}

export function formatCPF(cpf: string): string {
  const digits = stripNonDigits(cpf);
  if (digits.length !== 11) return digits;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}