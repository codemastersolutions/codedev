# AGENTS.md — CodeDev

## What this is

`@codemastersolutions/codedev` — Node CLI + dual-publish library (CJS + ESM + types) for Brazilian CPF/CNPJ generation, validation and formatting. **Zero runtime dependencies.** Node `>=20.12` (pinned in `engines`).

Both bins (`codedev` and `cdev`) point to `./dist/cjs/cli.js` — same entrypoint.

## Commands

| Task                                          | Command                             |
| --------------------------------------------- | ----------------------------------- |
| Build (clean + CJS + ESM)                     | `pnpm build`                        |
| Lint (typed, eslint v10 flat config)          | `pnpm lint`                         |
| Tests once                                    | `pnpm test`                         |
| Tests + coverage (90% thresholds enforced)    | `pnpm test:coverage`                |
| Single test file                              | `pnpm vitest run tests/cpf.test.ts` |
| Conventional commit (interactive)             | `pnpm commit`                       |
| Commit + push                                 | `pnpm commit:push`                  |
| Install commitzero git hooks (once per clone) | `pnpm commitzero:install`           |
| Uninstall commitzero hooks                    | `pnpm commitzero:uninstall`         |

There is **no standalone `typecheck` script** — `tsc` only runs through `build:cjs`/`build:esm` (both emit). To type-check without emitting:

```bash
pnpm exec tsc -p tsconfig.cjs.json --noEmit
pnpm exec tsc -p tsconfig.esm.json --noEmit
```

## Repo layout

```
src/
  index.ts          # public library surface (re-exports from lib/)
  cli.ts            # CLI entry; argv parsing, calls lib/* directly
  lib/
    cpf.ts          # generateCPF, isValidCPF, formatCPF (+ UF type)
    cnpj.ts         # generateCNPJ, isValidCNPJ, formatCNPJ
tests/
  cpf.test.ts
  cnpj.test.ts
tsconfig.base.json  # strict, target ES2020, rootDir src, ignoreDeprecations 6.0
tsconfig.cjs.json   # CommonJS → dist/cjs (no .d.ts)
tsconfig.esm.json   # ESNext  → dist/esm, declarations → dist/types
tsconfig.test.json  # noEmit, drives eslint typed-lint for tests/
eslint.config.mjs   # flat config: typed lint, separate blocks for src/ and tests/
vitest.config.mts   # node env, globals true, coverage on src/lib/**/*.ts only
```

Coverage thresholds (90% lines/statements/functions/branches) apply **only to `src/lib/**/*.ts`**. `src/cli.ts` and `src/index.ts` are intentionally not in the coverage gate.

`src/lib/cpf.ts` and `src/lib/cnpj.ts` each declare their own private `stripNonDigits` — intentional duplication, not a bug.

Coverage provider is selected in `vitest.config.mts`: **v8 on Node ≥19, istanbul on Node <19.** Since `engines.node` is `>=20.12`, only the v8 path is ever exercised in practice — but both `@vitest/coverage-v8` and `@vitest/coverage-istanbul` are installed for that reason.

## CLI surface (`src/cli.ts`)

```
codedev generate <cpf|cnpj> [--formatted|-f] [--alphanumeric|-a] [--branch matriz|filial|-b]
codedev validate <cpf|cnpj> <value>
```

- Aliases: `generate` → `g`, `gen`; `validate` → `v`, `val`.
- `--alphanumeric`/`-a` (cnpj only; default numeric).
- `--branch`/`-b matriz|filial` (cnpj only; default `matriz`):
  - matriz = 8 alphanum + `0001` + 2 numeric DV → `AAAAAAAA0001DD`
  - filial = 12 alphanum + 2 numeric DV
  - ignored entirely for numeric CNPJ (always fully numeric).
- Legacy accepted flags: `--formated`, `--format` (compat only, do not advertise).
- `validate` prints `valid`/`invalid` and exits `0`/`1`.
- Exit codes: `0` success/help, `1` bad args / invalid value / generation-failed.

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

- `generateCPF({ uf: "SP" })` pins the 9th digit to the state region digit (`UF_REGION_DIGIT` table in `src/lib/cpf.ts`). CLI **does not** accept UF — library API only.
- `generateCNPJ` validates each candidate via `isValidCNPJ` and retries up to `maxAttempts` (default `10`). On exhaustion throws `Error("Failed to generate a valid CNPJ after N attempts")`. CLI catches, prints, exits `1`.
- Both `generate*` accept `(boolean)` and `({ formatted? })` overloads — check both signatures before editing.

## Workflow / CI

- Branching: open PRs against `dev`. Merging `dev → main` triggers release.
- `release.yml`: on merged PR to `main` → lint + test:coverage + build on Ubuntu/macOS/Windows × Node 20/22/24, then `pnpm version patch`, tag, GitHub Release, `npm publish --provenance --access public`. Release job hardcodes `node-version: 24`.
- `dev-pr.yml`: on PRs to `dev` → lint + test:coverage + `pnpm audit --audit-level=moderate` on the same OS/Node matrix.
- `codeql.yml`: on push to `dev`/`main` and weekly.
- Only `dist/**`, `README.md`, `LICENSE` are published (see `files` in `package.json`).
- Commits must follow Conventional Commits — `commitzero` enforces this. See Conventions below.

## Conventions / gotchas

- **pnpm version** pinned via `packageManager: pnpm@12.4.2`. `pnpm-workspace.yaml` declares a build allowlist (`@codemastersolutions/commitzero`, `esbuild`); there are no actual workspace packages.
- **commitzero hooks** run `pnpm run lint && pnpm run test && pnpm run build` (3m timeout, see `commitzero.config.json`) **before every commit** triggered via `pnpm commit` / `pnpm commit:push`. If any step fails, the commit is aborted — fix the failure, don't bypass.
- **Hooks are NOT installed** in fresh clones (`.git/hooks/` ships only `.sample` files). Run `pnpm commitzero:install` once after `pnpm install`.
- `.editorconfig`: 2-space indent, LF, UTF-8, trim trailing whitespace, **no** final newline (`insert_final_newline = false`). Don't add one.
- `.gitignore`: `coverage`, `dist`, `node_modules`, `.serena`, `.vitest`. There is **no `dist/` in git** — it's gitignored and produced by `pnpm build`. A `dist/` directory in the working tree is expected after a local build; don't commit it.
- Both `codedev` and `cdev` binaries resolve to `./dist/cjs/cli.js` (not the ESM build). To test CLI behavior locally: `pnpm build` first, then `pnpm exec codedev ...` (or `cdev ...`).
- ESLint uses the flat `eslint.config.mjs` (v10). The legacy `.eslintrc.cjs` is tracked in git but ignored by v10 — editing it has no effect.
- `tsconfig.test.json` is consumed only by eslint's typed parser for `tests/**`; vitest does not need it (its globals come from `"types": ["node", "vitest"]` in `tsconfig.base.json`).
- **`moduleResolution: "node"` is deprecated in TS 6** (renamed "node10"). The deprecation is silenced via `"ignoreDeprecations": "6.0"` in `tsconfig.base.json`. A TS 7 bump will require switching the resolver (`"node16"`, `"nodenext"`, or `"bundler"`) and is currently blocked by `@typescript-eslint@8.x` peer cap (`typescript <6.1.0`).
