#!/usr/bin/env node
import { generateCPF, isValidCPF } from './lib/cpf';
import { generateCNPJ, isValidCNPJ } from './lib/cnpj';

function printHelp(): void {
  console.log(`CodeDev CLI\n\nUsage:\n  codedev generate <cpf|cnpj> [--formatted|-f]\n  codedev validate <cpf|cnpj> <value>\n\nAliases:\n  generate: g, gen\n  validate: v, val\n\nOptions:\n  --formatted, -f              Output with formatting (for generate)\n  --help                       Show this help\n`);
}

function main(): void {
  const args: string[] = process.argv.slice(2);
  const [command, subcommand, ...rest] = args;

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  // Map command style: support only new order with aliases
  type DocType = 'cpf' | 'cnpj';
  type ActionType = 'generate' | 'validate';

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

  if (action === 'generate') {
    if (docType === 'cpf') {
      const out = generateCPF(isFormatted);
      console.log(out);
      process.exit(0);
    }
    if (docType === 'cnpj') {
      const out = generateCNPJ(isFormatted);
      console.log(out);
      process.exit(0);
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