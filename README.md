# Markdown Preview Aces Edition

Markdown Preview Aces Edition is a custom merged fork of the original Markdown Preview Enhanced extension.

This repository is the source used to build and package this edition.

## Aces Edition Updates

This fork carries the upstream MPE/Crossnote feature set and adds focused quality and UX work. Highlights include:

- New custom preview theme: `aces-codepunk`.

- New and much improved preview action/menu UX, including floating actions for common tasks.

- Code block copy actions in preview (`Copy Code`, plus related quick actions like `Copy Markdown` / `Copy ID`).

- Line numbers support and improved line/highlight/source mapping behavior for better preview-to-source workflow.

- Backlinks and sidebar TOC workflow improvements, with better in-preview controls.

- In-preview editor support was removed in this fork.

- Preview zen mode was removed in this fork.

- Ongoing parser/rendering, markdown transform, and dependency updates merged from upstream, plus local hardening and fixes.

For the full chronological history of all updates, see `CHANGELOG.md`.

## Project Layout

- `src/`: VS Code extension source
- `crossnote/`: bundled local crossnote dependency and web assets
- `media/`: extension icons and command icons
- `test/`: extension tests and markdown fixture files
- `build.js`, `gulpfile.js`: build pipeline

## Development

### Prerequisites

- Node.js 18+
- pnpm (recommended)

### Install dependencies

```bash
pnpm install
```

### Build

```bash
pnpm run build
```

### Watch mode

```bash
pnpm run watch
```

### Run tests

```bash
pnpm test
```

## Package and Install Locally

Use the helper script:

```bash
./install-extension.sh
```

The script will build, package, and install the VSIX into `code` or `code-server` if available.

## Changelog

See `CHANGELOG.md` for local and release history.

## License

University of Illinois/NCSA Open Source License. See `LICENSE.md`.
