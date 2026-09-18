# AGENTS.md — CodeDev

## What this is

`@codemastersolutions/codedev` — Node CLI + dual-publish library (CJS + ESM + types) for Brazilian CPF/CNPJ generation, validation and formatting. **Zero runtime dependencies.** Node ≥18.

Bins (`package.json`): `codedev` and `cdev` both point to `./dist/cjs/cli.js` — they are the same entrypoint.

## Commands

| Task | Command |
| --- | --- |
| Build (clean + CJS + ESM) | `pnpm build` |
| Lint (typed, eslint v9 flat config) | `pnpm lint` |
| Tests once | `pnpm test` |
| Tests + coverage (thresholds enforced) | `pnpm test:coverage` |
| Single test file | `pnpm vitest run tests/cpf.test.ts` |
| Conventional commit (interactive) | `pnpm commit` |
| Commit + push | `pnpm commit:push` |
| Install commitzero git hooks (once per clone) | `pnpm commitzero:install` |

There is **no standalone `typecheck` script.** `tsc` only runs through `build:cjs` / `build:esm` (both emit). To type-check without emitting, run `pnpm exec tsc -p tsconfig.cjs.json --noEmit` and repeat for `tsconfig.esm.json` if needed.

Coverage provider is auto-selected in `vitest.config.mts`: **v8 on Node ≥19, istanbul on Node 18.** Both `@vitest/coverage-v8` and `@vitest/coverage-istanbul` are installed for that reason.

## Repo layout

```
src/
  index.ts          # public library surface (re-exports)
  cli.ts            # CLI entry; argv parsing, calls lib/* directly
  lib/
    cpf.ts          # generateCPF, isValidCPF, formatCPF (+ UF type)
    cnpj.ts         # generateCNPJ, isValidCNPJ, formatCNPJ
tests/
  cpf.test.ts
  cnpj.test.ts
tsconfig.base.json  # strict, target ES2020, rootDir src
tsconfig.cjs.json   # CommonJS → dist/cjs (no .d.ts)
tsconfig.esm.json   # ESNext  → dist/esm, declarations → dist/types
tsconfig.test.json  # noEmit, used by eslint parser for tests/
eslint.config.mjs   # flat config: typed lint, separate blocks for src/ and tests/
vitest.config.mts   # node env, globals true, coverage on src/lib/**/*.ts only
```

Coverage thresholds (90% lines/statements/functions/branches) apply **only to `src/lib/**/*.ts`**. `src/cli.ts` and `src/index.ts` are intentionally not in the coverage gate.

Note: `src/lib/cpf.ts` and `src/lib/cnpj.ts` each declare their own private `stripNonDigits` — intentional duplication, not a bug.

## CLI surface (`src/cli.ts`)

```
codedev generate <cpf|cnpj> [--formatted|-f] [--alphanumeric|-a] [--branch matriz|filial|-b]
codedev validate <cpf|cnpj> <value>
```

- Aliases: `generate` → `g`, `gen`; `validate` → `v`, `val`.
- `--alphanumeric`/`-a` triggers alphanumeric CNPJ generation (cnpj only); default is numeric.
- `--branch`/`-b matriz|filial` selects branch layout for CNPJ generation (cnpj only); default `matriz`.
  - matriz: 8 alphanum + `0001` (fixed branch) + 2 numeric DV — format `AAAAAAAA0001DD`
  - filial: 12 alphanum + 2 numeric DV
  - For numeric CNPJ, branch is a no-op (always fully numeric).
- Legacy accepted flags: `--formated`, `--format` (compat only, do not advertise).
- `validate` prints `valid`/`invalid` and exits `0`/`1`.
- Exit codes: `0` success / help, `1` bad args / invalid value / generation-failed.

## Library API (`src/index.ts`)

```
generateCPF(formatted?: boolean)
generateCPF(options?: { formatted?: boolean; uf?: UF })
isValidCPF(input: string)
formatCPF(cpf: string)
generateCNPJ(formatted?: boolean)
generateCNPJ(options?: { formatted?: boolean; type?: "numeric"|"alphanumeric"; branch?: "matriz"|"filial"; maxAttempts?: number })
isValidCNPJ(input: string)
formatCNPJ(cnpj: string)
```

- `generateCPF({ uf: "SP" })` pins the 9th digit to the state region digit (see `UF_REGION_DIGIT` table in `src/lib/cpf.ts`). The CLI **does not** accept UF — only the library API does.
- `generateCNPJ({ type: "alphanumeric", branch: "matriz" })` = 8 alphanum + `0001` + 2 numeric DV; `branch: "filial"` = 12 alphanum + 2 numeric DV. Default `branch = "matriz"`. For numeric type, branch is ignored.
- `generateCNPJ` validates each candidate via `isValidCNPJ` and retries up to `maxAttempts` (default `10`). On exhaustion it throws `Error("Failed to generate a valid CNPJ after N attempts")`. The CLI catches and prints the message, exiting `1`.
- Both `generate*` accept `(boolean)` and `({ formatted? })` overloads; check both signatures before editing.

## Workflow / CI

- Branching: open PRs against `dev`. Merging `dev → main` is what triggers release.
- `release.yml` runs on merged PR to `main`: lint + test:coverage + build on Ubuntu/macOS/Windows × Node 18/20/22/24, then `pnpm version patch`, tag, GitHub Release, `npm publish --provenance --access public`.
- `dev-pr.yml` on PRs to `dev`: lint + test:coverage + `pnpm audit --audit-level=moderate` on the same OS/Node matrix.
- `codeql.yml` runs on push to `dev`/`main` and weekly.
- Only `dist/**`, `README.md`, `LICENSE` are published (see `files` in `package.json`).
- Commits must follow Conventional Commits format — `commitzero` enforces this via a git hook. After `pnpm install`, run `pnpm commitzero:install` to wire the hooks.

## Conventions / gotchas

- pnpm version is pinned via `packageManager: pnpm@10.17.0` — `pnpm-workspace.yaml` only declares `onlyBuiltDependencies` allowlist (`@codemastersolutions/commitzero`, `esbuild`), no actual workspace packages.
- `.editorconfig`: 2-space indent, LF, UTF-8, trim trailing whitespace, **no** final newline (`insert_final_newline = false`). Don't add one.
- `.gitignore`: `coverage`, `dist`, `node_modules`. There is no `dist/` in the working repo — it is gitignored and produced by `pnpm build`.
- Both `codedev` and `cdev` binaries resolve to `./dist/cjs/cli.js` (not the ESM build). When testing CLI behavior locally, run `pnpm build` first or use `pnpm exec codedev ...` after a fresh build.
- ESLint is the flat `eslint.config.mjs` (v9). The legacy `.eslintrc.cjs` is kept alongside but not used by the lint script — do not edit it expecting changes to take effect.
- `tsconfig.test.json` is consumed only by eslint's typed parser for `tests/**`; vitest does not need it (its globals come from `"types": ["node", "vitest"]` in `tsconfig.base.json`).