export function stripNonDigits(value: string): string {
  return (value || "").replace(/\D+/g, "");
}

export type CNPJType = "numeric" | "alphanumeric";
export type CNPJBranch = "matriz" | "filial";

export interface GenerateCNPJOptions {
  formatted?: boolean;
  type?: CNPJType;
  branch?: CNPJBranch;
  maxAttempts?: number;
}

const W1: number[] = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const W2: number[] = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const ASCII_ZERO = "0".codePointAt(0);
const ALPHANUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function sanitizeCNPJ(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-Z]+/g, "");
}

function isRepeatedNumericSequence(digits: string): boolean {
  return /^(\d)\1{13}$/.test(digits);
}

function calcDigit(base: number[], weights: number[]): number {
  const sum = base.reduce((acc, digit, i) => acc + digit * weights[i], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function toDVValue(char: string): number {
  return char.codePointAt(0)! - ASCII_ZERO!;
}

function isValidNumericCNPJ(digits: string): boolean {
  if (digits.length !== 14) return false;
  if (isRepeatedNumericSequence(digits)) return false;

  const nums = [...digits].map((d) => Number.parseInt(d, 10));
  const baseTwelve = nums.slice(0, 12);
  const d1 = calcDigit(baseTwelve, W1);
  if (d1 !== nums[12]) return false;
  const d2 = calcDigit([...baseTwelve, d1], W2);
  return d2 === nums[13];
}

function isValidAlphanumericCNPJ(value: string): boolean {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(value)) return false;
  const base = value.slice(0, 12);

  const values = [...base].map((c) => toDVValue(c));
  const d1 = calcDigit(values, W1);
  if (d1 !== Number.parseInt(value[12]!, 10)) return false;
  const d2 = calcDigit([...values, d1], W2);
  return d2 === Number.parseInt(value[13]!, 10);
}

export function isValidCNPJ(input: string): boolean {
  const normalized = sanitizeCNPJ(input);
  if (/^\d+$/.test(normalized)) return isValidNumericCNPJ(normalized);
  if (/^[0-9A-Z]+$/.test(normalized)) return isValidAlphanumericCNPJ(normalized);
  return false;
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

function generateAlphanumericMatrizCNPJ(): string {
  const first8 = Array.from({ length: 8 }, () => randomAlphanumericChar()).join("");
  const base = first8 + "0001";
  const values = [...base].map((c) => toDVValue(c));
  const d1 = calcDigit(values, W1);
  const d2 = calcDigit([...values, d1], W2);
  return `${base}${d1}${d2}`;
}

function generateAlphanumericFilialCNPJ(): string {
  const base = Array.from({ length: 12 }, () => randomAlphanumericChar()).join("");
  const values = [...base].map((c) => toDVValue(c));
  const d1 = calcDigit(values, W1);
  const d2 = calcDigit([...values, d1], W2);
  return `${base}${d1}${d2}`;
}

function generateRawCNPJ(type: CNPJType, branch: CNPJBranch): string {
  if (type === "alphanumeric") {
    return branch === "matriz"
      ? generateAlphanumericMatrizCNPJ()
      : generateAlphanumericFilialCNPJ();
  }
  return generateNumericCNPJ();
}

export function generateCNPJ(formatted?: boolean): string;
export function generateCNPJ(options?: GenerateCNPJOptions): string;
export function generateCNPJ(
  arg: boolean | GenerateCNPJOptions = false,
): string {
  const formatted = typeof arg === "boolean" ? arg : !!arg?.formatted;
  const type: CNPJType =
    typeof arg === "object" ? (arg.type ?? "numeric") : "numeric";
  const branch: CNPJBranch =
    typeof arg === "object" ? (arg.branch ?? "matriz") : "matriz";
  const maxAttempts: number =
    typeof arg === "object" ? (arg.maxAttempts ?? 10) : 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const raw = generateRawCNPJ(type, branch);
    if (isValidCNPJ(raw)) {
      return formatted ? formatCNPJ(raw) : raw;
    }
  }
  throw new Error(
    `Failed to generate a valid CNPJ after ${maxAttempts} attempts`,
  );
}

export function formatCNPJ(cnpj: string): string {
  const value = sanitizeCNPJ(cnpj);
  if (value.length !== 14) return value;
  return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12)}`;
}
