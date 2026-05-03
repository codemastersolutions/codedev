export function stripNonDigits(value: string): string {
  return (value || "").replace(/\D+/g, "");
}

export type CNPJType = "numeric" | "alphanumeric";

const W1: number[] = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const W2: number[] = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const ASCII_ZERO = "0".charCodeAt(0);
const ALPHANUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function stripCNPJMask(value: string): string {
  return (value || "").toUpperCase().replace(/[^0-9A-Z]+/g, "");
}

function isRepeatedNumericSequence(digits: string): boolean {
  return /^([0-9])\1{13}$/.test(digits);
}

function isRepeatedSequence(value: string): boolean {
  return /^([0-9A-Z])\1+$/.test(value);
}

function calcDigit(base: number[], weights: number[]): number {
  const sum = base.reduce((acc, digit, i) => acc + digit * weights[i], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function toDVValue(char: string): number {
  return char.charCodeAt(0) - ASCII_ZERO;
}

function isValidNumericCNPJ(digits: string): boolean {
  if (digits.length !== 14) return false;
  if (isRepeatedNumericSequence(digits)) return false;

  const nums = [...digits].map((d) => parseInt(d, 10));
  const baseTwelve = nums.slice(0, 12);
  const d1 = calcDigit(baseTwelve, W1);
  if (d1 !== nums[12]) return false;
  const d2 = calcDigit([...baseTwelve, d1], W2);
  return d2 === nums[13];
}

function isValidAlphanumericCNPJ(value: string): boolean {
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(value)) return false;
  const base = value.slice(0, 12);

  const values = [...base].map((c) => toDVValue(c));
  const d1 = calcDigit(values, W1);
  if (d1 !== parseInt(value[12]!, 10)) return false;
  const d2 = calcDigit([...values, d1], W2);
  return d2 === parseInt(value[13]!, 10);
}

export function isValidCNPJ(input: string): boolean {
  const normalized = stripCNPJMask(input);
  if (normalized.length !== 14) return false;
  if (/^\d{14}$/.test(normalized)) return isValidNumericCNPJ(normalized);
  return isValidAlphanumericCNPJ(normalized);
}

function generateNumericCNPJ(): string {
  const baseTwelve = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 10),
  );
  const d1 = calcDigit(baseTwelve, W1);
  const d2 = calcDigit([...baseTwelve, d1], W2);
  return [...baseTwelve, d1, d2].join("");
}

function randomAlphanumericChar(): string {
  return ALPHANUM.charAt(Math.floor(Math.random() * ALPHANUM.length));
}

function generateAlphanumericCNPJ(): string {
  let base = "";
  for (let i = 0; i < 100; i++) {
    const candidate = Array.from({ length: 12 }, () =>
      randomAlphanumericChar(),
    ).join("");
    if (!isRepeatedSequence(candidate)) {
      base = candidate;
      break;
    }
  }
  if (!base)
    base = Array.from({ length: 12 }, () => randomAlphanumericChar()).join("");

  const values = [...base].map((c) => toDVValue(c));
  const d1 = calcDigit(values, W1);
  const d2 = calcDigit([...values, d1], W2);
  return `${base}${d1}${d2}`;
}

export function generateCNPJ(formatted?: boolean): string;
export function generateCNPJ(options?: {
  formatted?: boolean;
  type?: CNPJType;
}): string;
export function generateCNPJ(
  arg: boolean | { formatted?: boolean; type?: CNPJType } = false,
): string {
  const formatted = typeof arg === "boolean" ? arg : !!arg?.formatted;
  const type = typeof arg === "object" ? (arg.type ?? "numeric") : "numeric";

  const raw =
    type === "alphanumeric"
      ? generateAlphanumericCNPJ()
      : generateNumericCNPJ();
  return formatted ? formatCNPJ(raw) : raw;
}

export function formatCNPJ(cnpj: string): string {
  const value = stripCNPJMask(cnpj);
  if (value.length !== 14) return value;
  return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12)}`;
}
