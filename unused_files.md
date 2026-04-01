# Unused / Redundant Files in `/home/ftr/mpae`

Analysis of files not referenced by the extension at runtime, build time, or packaging.

---

## VSIX Bloat — The Real Problem

The warning `This extension consists of 48,474 files, out of which 23,819 are JavaScript files` is almost entirely caused by **`crossnote/node_modules/`** being bundled into the VSIX.

| Path in VSIX | File count | Problem |
|---|---|---|
| `crossnote/node_modules/` | **47,781** | Entire pnpm dependency tree — not needed at runtime |
| `crossnote/src/` | 92 | TypeScript source — not needed at runtime (compiled to `out/`) |
| `crossnote/test/` | 31 | Test files — not needed at runtime |
| `crossnote/.github/` | 8 | GitHub CI config — not needed |
| `crossnote/styles/**/*.less` | 30 | Source files — runtime reads compiled CSS from `out/styles/` |
| `crossnote/.husky/` | 3 | Git hooks — not needed |
| `crossnote/.vscode/` | 2 | Editor config — not needed |
| `crossnote/pnpm-lock.yaml`, `package-lock.json`, misc config | ~10 | Dev files — not needed |

### Fix: add these to `.vscodeignore`

```
crossnote/node_modules/**
crossnote/src/**
crossnote/test/**
crossnote/.github/**
crossnote/.husky/**
crossnote/.vscode/**
crossnote/styles/**/*.less
crossnote/pnpm-lock.yaml
crossnote/package-lock.json
crossnote/pnpm-workspace.yaml
crossnote/tailwind.config.js
crossnote/postcss.config.js
crossnote/tsconfig.json
crossnote/shell.nix
crossnote/.tool-versions
crossnote/.prettierignore
crossnote/babel-jest.config.js
crossnote/jest.config.js
crossnote/flake.nix
crossnote/log.md
crossnote/README.md
```

Adding these would drop the VSIX from ~48,474 files to roughly **500–600 files** — a reduction of over 98%.

### Why `crossnote/node_modules` is included

The mpae `.vscodeignore` says `node_modules` (root only), but **does not exclude `crossnote/node_modules`**. The VSIX packager (`vsce`) picks up everything not explicitly ignored, so the entire nested pnpm store ends up bundled.

### Bundling note

The bundling warning is a separate (though related) concern — it suggests running the extension's JS through esbuild/webpack so all `node_modules` are inlined into a few files rather than shipped as thousands of individual JS files. The crossnote dependency is already built as a self-contained CJS bundle (`crossnote/out/cjs/index.cjs`), so the runtime doesn't actually need `crossnote/node_modules` at all — it's pure dead weight in the VSIX.

---

---

## Media — Unreferenced SVGs

The only media files actually used are:
- `media/mpe.png` — extension icon (`package.json` → `"icon"`)
- `media/preview-right-light.svg` / `media/preview-right-dark.svg` — command icons for `openPreview` / `openPreviewToTheSide`

The following are **not referenced** in `package.json`, `src/`, or `README.md`:

| File | Notes |
|------|-------|
| `media/ace.jpg` | Source image used to generate `mpe.png`. Not referenced anywhere else. |
| `media/preview-dark.svg` | Not referenced (contrast: `preview-right-dark.svg` is used) |
| `media/preview-light.svg` | Not referenced (contrast: `preview-right-light.svg` is used) |
| `media/preview.svg` | Not referenced |
| `media/PreviewOnRightPane_16x.svg` | Not referenced |
| `media/PreviewOnRightPane_16x_dark.svg` | Not referenced |

---

## Duplicate License

Both `LICENSE` and `LICENSE.md` exist with **different content** — one appears to be an older or alternate version. Only `LICENSE` is standard; `LICENSE.md` is not referenced by `package.json` and is excluded by `.vscodeignore`. One should be removed or reconciled.

---

## Developer/Documentation Files

These are excluded from the packaged VSIX via `.vscodeignore` but live in the repo root:

| File | Notes |
|------|-------|
| `vsc-extension-quickstart.md` | VS Code extension scaffold boilerplate. Not relevant to this project. |
| `semantic_versioning.md` | Personal reference doc. Not referenced by any tooling. |
| `issues_tracker.md` | Personal issue tracker. Not referenced by any tooling. |

---

## Build/Dev Tooling (excluded from VSIX, but present in repo)

These are correctly excluded by `.vscodeignore` and serve local dev only — listed for awareness:

| File | Purpose |
|------|---------|
| `flake.nix` / `flake.lock` / `shell.nix` | Nix dev environment. Not used in the npm/pnpm build. |
| `.envrc` | direnv config for Nix shell. Dev-only. |
| `build.js` | Excluded from VSIX. Used by `pnpm build` via esbuild. |
| `gulpfile.js` | Excluded from VSIX. Used by `pnpm build`. |
| `prettier.config.js` / `.eslintrc.js` | Excluded from VSIX. Linting/formatting config. |
| `install-extension.sh` | Not excluded from VSIX (not in `.vscodeignore`). Only needed locally. |
| `markdown-preview-aces-edition-0.9.1.vsix` | Packaged artifact in the repo root. Should be gitignored or removed after release. |

---

## Test Directory

`test/` is excluded from the VSIX but the tests themselves are not currently functional (they were not updated from the upstream scaffold). The markdown sample files under `test/markdown/` are harmless but unused.

---

## Summary

**Safe to delete:**
- `media/ace.jpg` (source asset, already converted to `mpe.png`)
- `media/preview-dark.svg`
- `media/preview-light.svg`
- `media/preview.svg`
- `media/PreviewOnRightPane_16x.svg`
- `media/PreviewOnRightPane_16x_dark.svg`
- `vsc-extension-quickstart.md`
- `markdown-preview-aces-edition-0.9.1.vsix` (stale build artifact)

**Review before deleting:**
- `LICENSE.md` — reconcile with `LICENSE`
- `semantic_versioning.md` / `issues_tracker.md` — personal docs, delete if no longer needed
