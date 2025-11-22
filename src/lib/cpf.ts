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

export type UF =
  | 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO' | 'MA'
  | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR' | 'PE' | 'PI' | 'RJ' | 'RN'
  | 'RO' | 'RR' | 'RS' | 'SC' | 'SE' | 'SP' | 'TO';

const UF_REGION_DIGIT: Record<UF, number> = {
  AC: 2,
  AL: 4,
  AP: 2,
  AM: 2,
  BA: 5,
  CE: 3,
  DF: 1,
  ES: 7,
  GO: 1,
  MA: 3,
  MT: 1,
  MS: 1,
  MG: 6,
  PA: 2,
  PB: 4,
  PR: 9,
  PE: 4,
  PI: 3,
  RJ: 7,
  RN: 4,
  RO: 2,
  RR: 2,
  RS: 0,
  SC: 9,
  SE: 5,
  SP: 8,
  TO: 1,
};

export function generateCPF(formatted?: boolean): string;
export function generateCPF(options?: { formatted?: boolean; uf?: UF }): string;
export function generateCPF(arg: boolean | { formatted?: boolean; uf?: UF } = false): string {
  const formatted = typeof arg === 'boolean' ? arg : !!arg?.formatted;
  const uf = typeof arg === 'object' ? arg.uf : undefined;

  const baseNine = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  if (uf) {
    const regionDigit = UF_REGION_DIGIT[uf];
    if (typeof regionDigit === 'number') {
      baseNine[8] = regionDigit;
    }
  }
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