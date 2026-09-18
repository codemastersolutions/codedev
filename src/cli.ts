#!/usr/bin/env node
import { generateCPF, isValidCPF } from './lib/cpf';
import { generateCNPJ, isValidCNPJ, CNPJBranch } from './lib/cnpj';

function printHelp(): void {
  console.log(`CodeDev CLI\n\nUsage:
  codedev generate <cpf|cnpj> [--formatted|-f] [--alphanumeric|-a] [--branch matriz|filial|-b]
  codedev validate <cpf|cnpj> <value>

Aliases:
  generate: g, gen
  validate: v, val

Options:
  --formatted, -f              Output with formatting (for generate)
  --alphanumeric, -a           Generate alphanumeric CNPJ (cnpj only; numeric by default)
  --branch, -b matriz|filial   Generate matriz (default) or filial CNPJ
  --help                       Show this help
`);
}

type DocType = 'cpf' | 'cnpj';
type ActionType = 'generate' | 'validate';

function parseBranch(args: string[]): CNPJBranch {
  let value: string | undefined;
  let missingValue = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === '--branch' || a === '-b') {
      const next = args[i + 1];
      if (next === undefined) {
        missingValue = true;
        break;
      }
      value = next;
      break;
    }
    if (a.startsWith('--branch=')) {
      value = a.slice('--branch='.length);
      break;
    }
    if (a.startsWith('-b=')) {
      value = a.slice('-b='.length);
      break;
    }
  }
  if (missingValue) {
    console.error('Error: --branch requires a value (matriz or filial)');
    process.exit(1);
  }
  if (value === undefined || value === '') return 'matriz';
  if (value !== 'matriz' && value !== 'filial') {
    console.error(`Error: --branch must be "matriz" or "filial" (got "${value}")`);
    process.exit(1);
  }
  return value;
}

function main(): void {
  const args: string[] = process.argv.slice(2);
  const [command, subcommand, ...rest] = args;

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  // Map command style: support only new order with aliases
  const generateAliases: Set<string> = new Set(['generate', 'g', 'gen']);
  const validateAliases: Set<string> = new Set(['validate', 'v', 'val']);

  let docType: DocType | undefined;
  let action: ActionType | undefined;
  let optionsAndArgs: string[] = [];

  if (generateAliases.has(command)) {
    docType = (subcommand as DocType) ?? undefined;
    action = 'generate';
    optionsAndArgs = rest;
  } else if (validateAliases.has(command)) {
    docType = (subcommand as DocType) ?? undefined;
    action = 'validate';
    optionsAndArgs = rest;
  }

  if (!docType || !action || (docType !== 'cpf' && docType !== 'cnpj')) {
    printHelp();
    process.exit(1);
  }

  const isFormatted = optionsAndArgs.includes('--formatted')
    || optionsAndArgs.includes('--formated')
    || optionsAndArgs.includes('--format')
    || optionsAndArgs.includes('-f');

  const isAlphanumeric = optionsAndArgs.includes('--alphanumeric')
    || optionsAndArgs.includes('-a');

  if (action === 'generate') {
    if (docType === 'cpf') {
      if (isAlphanumeric) {
        console.error('Error: --alphanumeric is only valid for cnpj generation');
        process.exit(1);
      }
      if (optionsAndArgs.includes('--branch') || optionsAndArgs.includes('-b')
        || optionsAndArgs.some((a) => a.startsWith('--branch=') || a.startsWith('-b='))) {
        console.error('Error: --branch is only valid for cnpj generation');
        process.exit(1);
      }
      const out = generateCPF(isFormatted);
      console.log(out);
      process.exit(0);
    }
    if (docType === 'cnpj') {
      const branch = parseBranch(optionsAndArgs);
      try {
        const out = generateCNPJ({
          formatted: isFormatted,
          type: isAlphanumeric ? 'alphanumeric' : 'numeric',
          branch,
        });
        console.log(out);
        process.exit(0);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    }
  }

  if (action === 'validate') {
    const input = optionsAndArgs.find((r: string) => !r.startsWith('-')) ?? '';
    if (!input) {
      printHelp();
      process.exit(1);
    }
    if (docType === 'cpf') {
      const valid = isValidCPF(input);
      console.log(valid ? 'valid' : 'invalid');
      process.exit(valid ? 0 : 1);
    }
    if (docType === 'cnpj') {
      const valid = isValidCNPJ(input);
      console.log(valid ? 'valid' : 'invalid');
      process.exit(valid ? 0 : 1);
    }
  }

  printHelp();
  process.exit(1);
}

main();