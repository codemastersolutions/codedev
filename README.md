# CodeDev CLI

Developer tools CLI with zero runtime dependencies.

[![npm version](https://img.shields.io/npm/v/@codemastersolutions/codedev?label=npm&logo=npm)](https://www.npmjs.com/package/@codemastersolutions/codedev)
[![npm downloads](https://img.shields.io/npm/dm/@codemastersolutions/codedev?logo=npm)](https://www.npmjs.com/package/@codemastersolutions/codedev)
[![license](https://img.shields.io/github/license/your-org/CodeDev)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-43853d?logo=node.js)](https://nodejs.org/)
[![PR Checks](https://github.com/your-org/CodeDev/actions/workflows/dev-pr.yml/badge.svg)](https://github.com/your-org/CodeDev/actions/workflows/dev-pr.yml)
[![Release](https://github.com/your-org/CodeDev/actions/workflows/release.yml/badge.svg)](https://github.com/your-org/CodeDev/actions/workflows/release.yml)
[![CodeQL](https://github.com/your-org/CodeDev/actions/workflows/codeql.yml/badge.svg)](https://github.com/your-org/CodeDev/actions/workflows/codeql.yml)
[![Coverage Status](https://img.shields.io/codecov/c/github/your-org/CodeDev)](https://codecov.io/gh/your-org/CodeDev)

## Global Install

```bash
pnpm add -g @codemastersolutions/codedev
```

Após instalar globalmente:

```bash
codedev generate cpf -f
codedev v cpf 529.982.247-25
cdev generate cnpj -f
cdev val cnpj 12.345.678/0001-95
```

> Nota: mesmo com o pacote escopado (`@codemastersolutions/codedev`), os executáveis instalados continuam sendo `codedev` e `cdev`.

## Usage

```bash
codedev generate cpf --formatted
codedev generate cnpj -f

codedev validate cpf 529.982.247-25
codedev validate cnpj 12.345.678/0001-95

# você também pode usar o alias de bin:
cdev g cpf -f
cdev v cnpj 12.345.678/0001-95
```

### CLI Help & Saída

- Comandos: `generate <cpf|cnpj> [--formatted|-f]`, `validate <cpf|cnpj> <value>`
- Aliases: `generate` → `g`, `gen`; `validate` → `v`, `val`
- Saída de `validate`: imprime `valid` ou `invalid` e retorna `0` ou `1` respectivamente
- Formatação: `--formatted`/`-f` aplica pontuação ao documento gerado (apenas em `generate`)
- Compatibilidade: aceita `--formated`/`--format` por compatibilidade

## Run via pnpm dlx

Execute sem instalar globalmente, ideal para uso pontual:

```bash
pnpm dlx @codemastersolutions/codedev generate cpf -f
pnpm dlx @codemastersolutions/codedev v cpf 529.982.247-25
pnpm dlx @codemastersolutions/codedev generate cnpj -f
pnpm dlx @codemastersolutions/codedev val cnpj 12.345.678/0001-95
```

> Nota: mesmo via `pnpm dlx` com pacote escopado, os executáveis disponibilizados permanecem `codedev` e `cdev`.

### Aliases

```bash
# generate aliases
codedev g cpf --formatted
codedev gen cnpj --formatted

# validate aliases
codedev v cpf 529.982.247-25
codedev val cnpj 12.345.678/0001-95
```

### Flags

```text
--formatted   Output with formatting (preferred)
-f            Short flag alias for formatted output
```

> Nota: o parser aceita `--formated` por compatibilidade, mas não é recomendado.

<!-- Legacy syntax was removed. Use the new order and aliases above. -->

## Library API

O pacote é dual-target: ESM e CommonJS, com tipagens em `dist/types`. Node `>=18` é requerido.

### ESM (TypeScript / Node 18+)
```ts
import {
  generateCPF,
  isValidCPF,
  formatCPF,
  generateCNPJ,
  isValidCNPJ,
  formatCNPJ,
} from '@codemastersolutions/codedev';

const cpf = generateCPF(true);
const isCpfValid = isValidCPF(cpf);

// formatação explícita
const rawCpf = generateCPF(false);
const prettyCpf = formatCPF(rawCpf);

const cnpj = generateCNPJ();
const isCnpjValid = isValidCNPJ(cnpj);
const prettyCnpj = formatCNPJ(cnpj);
```

Consumidores CommonJS podem usar `require('@codemastersolutions/codedev')` para importar as mesmas funções.

### Uso local (sem instalação global)
Se o pacote estiver instalado como `devDependency` no projeto:

```bash
pnpm exec codedev generate cpf -f
pnpm exec cdev val cnpj 12.345.678/0001-95
```

> Nota: com instalação local, os bins disponíveis continuam sendo `codedev` e `cdev`, independentemente do escopo do pacote.

## Build

Outputs CommonJS to `dist/cjs` and ESM to `dist/esm`. Types are emitted to `dist/types`.

```bash
pnpm build
```

## Test & Lint

```bash
pnpm lint
pnpm test:coverage
```

## CI/CD

- PRs to `dev` run lint, tests (coverage ≥90%), and security audit.
- Merged PRs to `main` run tests, bump version, tag, create release, and publish to npm (only compiled artifacts).

## Publishing

Only compiled files (`dist/**`), README and LICENSE are published.
