export function stripNonDigits(value: string): string {
  return (value || '').replace(/\D+/g, '');
}

function isRepeatedSequence(digits: string): boolean {
  return /^([0-9])\1{13}$/.test(digits);
}

function calcDigit(base: number[], weights: number[]): number {
  const sum = base.reduce((acc, digit, i) => acc + digit * weights[i], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCNPJ(input: string): boolean {
  const digits = stripNonDigits(input);
  if (digits.length !== 14) return false;
  if (isRepeatedSequence(digits)) return false;

  const nums = [...digits].map((d) => parseInt(d, 10));
  const baseTwelve = nums.slice(0, 12);
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calcDigit(baseTwelve, w1);
  if (d1 !== nums[12]) return false;
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d2 = calcDigit([...baseTwelve, d1], w2);
  return d2 === nums[13];
}

export function generateCNPJ(formatted = false): string {
  const baseTwelve = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calcDigit(baseTwelve, w1);
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d2 = calcDigit([...baseTwelve, d1], w2);
  const all = [...baseTwelve, d1, d2].join('');
  return formatted ? formatCNPJ(all) : all;
}

export function formatCNPJ(cnpj: string): string {
  const digits = stripNonDigits(cnpj);
  if (digits.length !== 14) return digits;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}