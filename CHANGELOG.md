# Changelog

For releases, please visit the [project releases page](https://github.com/acester822/vscode-markdown-preview-aces-edition/releases).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
See [semantic_versioning.md](./semantic_versioning.md) for a local reference on how version numbers should be incremented.

## [0.10.0] - 2026-04-02

### Added

- **Collapsible heading sections** (`crossnote/src/webview/components/Preview.tsx`, `crossnote/src/webview/containers/preview.ts`): Toggle buttons (▼/▶) injected into every h1–h6 heading; section bodies wrapped in `div.md-section-body`; per-section open/closed state persisted in `localStorage`; collapse-all / expand-all button added to the topbar.
- **Inline editor (WYSIWYG double-click)** (`crossnote/src/webview/components/InlineEditor.tsx`): Double-clicking any preview element opens a glass-morphism textarea overlay positioned near the element. Edits update the source markdown with live preview debounce; ESC or click-away discards; saves on commit. New files: `InlineEditor.tsx`, `MonacoUnderlay.tsx`.
- **"Edit in VS Code" in radial action menu** (`crossnote/src/webview/components/FloatingActions.tsx`): Added entry to the floating radial menu so users can jump directly to the VS Code editor from context.
- **README roadmap table**: Added `## Roadmap & Known Issues` table listing all upcoming features and completed items with status icons.

### Changed

- **README overhaul**: Rewrote for public GitHub release — contextual screenshots, VSIX install instructions, roadmap table. Removed source/dev/build notes.
- **Codeblock styling** (`crossnote/styles/preview.less`): Themed overlay with lightened background, purple `rgb(185,1,234)` accent borders on both left and right sides, custom line-number gutter colors.
- **Inline editor textarea style** (`crossnote/styles/preview.less`): `background: rgb(7 7 22 / 6%)`, Victor Mono font, 14px, `1.5px dashed rgb(233 255 0 / 45%)` border, `border-radius: 14px`.

### Fixed

- **`css line-numbers` fenced code block loses syntax highlighting** (`crossnote/src/lib/block-info/parse-block-info.ts`): VS Code injects `{data-source-line="N"}` into the fence info string, turning `css line-numbers` into `css line-numbers {data-source-line="59"}`. The old `{...}` regex `/^([^\s{]*)\s*\{(.*?)\}/` couldn't skip `line-numbers` to reach `{`, fell back to treating the entire string as the language name, and mangled it into broken CSS classes — leaving plain unhighlighted text. Fixed by rewriting the brace branch to capture all words before `{` as language + extra boolean attributes.
- **Save broken in inline editor and MonacoUnderlay** (`src/extension-common.ts`): `updateMarkdown` used `vscode.workspace.fs.writeFile()` which bypasses VS Code's in-memory buffer. Switched to `applyEdit(WorkspaceEdit)` + `document.save()`.
- **Inline editor scroll / bottom clipping** (`crossnote/src/webview/components/InlineEditor.tsx`): Retooled positioning: overlay anchored `bottom: 16px`, grows upward, never clips below viewport. One-time `requestAnimationFrame` scroll nudge on open.

## [Unreleased]

### Changed

- Rewrote `README.md` for public GitHub release: excited tone, contextual screenshot placement, removed source/dev/build instructions, replaced with VSIX install instructions.

### Fixed

- **`css line-numbers` fenced code block loses syntax highlighting** (`crossnote/src/lib/block-info/parse-block-info.ts`): When a fenced block uses `css line-numbers {data-source-line="N"}` (injected by the source-map feature), the old regex `/^([^\s{]*)\s*\{(.*?)\}/` failed to match because `\s*\{` couldn't skip over the word `line-numbers` to reach `{`. The fallback then treated the entire info string as the language name, which turned `data-source-line="59"` into mangled CSS classes after `{}=` were stripped, and no Prism highlighting was applied. Fixed by rewriting the `{...}` branch to capture everything before `{` as space-separated words, using the first as the language and the rest as extra boolean attributes (e.g. `line-numbers` → `attributes['line-numbers'] = true`).

- **Save broken in inline editor and MonacoUnderlay** (`src/extension-common.ts`): `updateMarkdown` was using `vscode.workspace.fs.writeFile()` which writes to disk but does NOT update VS Code's in-memory document buffer. The immediately subsequent `previewProvider.updateMarkdown()` → `openTextDocument().getText()` read stale in-memory content, causing the preview to revert and making save appear broken. Fixed by switching to `vscode.workspace.applyEdit(WorkspaceEdit)` + `document.save()`. This correctly updates the document model, fires `onDidChangeTextDocument` (preview update), then saves to disk (fires `onDidSaveTextDocument` for a final save-triggered preview refresh).

- **Inline editor glitches when content grows** (`crossnote/src/webview/components/InlineEditor.tsx`, `crossnote/styles/preview.less`): The `[rect, value]` scroll effect called `setRect()` after every `scrollTop +=` operation, causing a re-render which re-fired the effect — a feedback loop that became visually chaotic as the textarea grew. Retooled the positioning strategy: overlay is now anchored `bottom: 16px` (grows upward, never clips below viewport). Removed the looping scroll effect and body `paddingBottom` manipulation. Added a single one-time `requestAnimationFrame` scroll on editor open that nudges the page if the target element is in the editor's footprint. Textarea gets `max-height: 48vh` + `overflow-y: auto` so it scrolls internally instead of expanding unboundedly.

 (`crossnote/src/webview/components/InlineEditor.tsx`): Three fixes in one: (1) ESC now calls `e.stopPropagation()` so the outline/TOC no longer opens when saving. (2) Added `valueRef` that is always current even before React re-renders — `commit()` reads `valueRef.current` directly, eliminating the stale closure over `value` that was causing saves to silently discard the latest typed content. (3) Removed `getScrollParent` (was returning `.crossnote` which has `overflow:auto` but `height:auto` and never actually scrolls). Now applies `paddingBottom:60vh` to `document.body` and scrolls `document.scrollingElement` with an instant `scrollTop +=` inside `requestAnimationFrame`, then immediately re-reads the element position and calls `setRect` to reposition the fixed overlay.

- **Inline editor: save on close, live preview, bottom scroll (previous)** (`crossnote/src/webview/components/InlineEditor.tsx`): Fixed a timing race where the 350 ms live-preview debounce timer and `commit()` could both send conflicting `updateMarkdown` messages — `commit` now cancels the pending timer first. Removed Enter-to-save; Enter now adds newlines naturally. Fixed cursor not being captured on double-click open by deferring `.focus()` 80 ms past the triggering mouseup. Fixed the bottom-scroll issue: the preview content scrolls inside `.crossnote[data-for="preview"]`, not `window` — added `getScrollParent()` to find the real scroll container, which now receives the `paddingBottom: 60vh` expansion and the `scrollBy` call.

- **Inline editor: save on close, live preview (previous)** (`crossnote/src/webview/components/InlineEditor.tsx`): Backdrop click and Escape now both save (commit) instead of discarding changes. Preview updates live as the user types via a 350 ms debounced `updateMarkdown` message — changes are built on a local `workingMarkdownRef` snapshot to avoid races with the container's markdown state. A `60vh` invisible spacer is injected into the document body while the editor is open so the browser always has enough scroll room to show the editor fully, even when editing the last element on the page.

- **Context menu compact size** (`crossnote/styles/preview.less`, `crossnote/styles/preview_theme/none.less`): Reduced context menu visual footprint by ~50% — min-width 240→160px, padding halved, font-size reduced to 11px, border radius 18→10px, item padding `8px 14px` → `4px 8px`.
- **Inline editor glass morphism** (`crossnote/styles/preview.less`): Textarea and hint bar now use transparent backgrounds (`rgba(7,7,22,0.72)`) with `backdrop-filter: blur(20px)` so the preview content behind shows through as frosted glass.
- **Inline editor placed below element** (`crossnote/src/webview/components/InlineEditor.tsx`): Editor overlay positions at `rect.bottom + 8px` (just below the target element) instead of over it. The element being edited is now fully visible during editing. If the editor would overflow the viewport bottom (e.g. last element in a long document), the page smoothly scrolls down to keep the full editor on screen.

- **Popover Universe global UI chrome** (`crossnote/styles/preview.less`, `crossnote/src/webview/components/FloatingActions.tsx`, `crossnote/styles/preview_theme/none.less`): All extension chrome now follows the Popover Universe neon aesthetic regardless of active preview theme. Gooey FAB blobs changed from amber to dark neon-cyan. Monaco line decoration, line-number gutter, and `<hr>` dividers changed to neon cyan/purple. "End of document" marker styled with Orbitron font and neon glow. Inline editor border changed to neon cyan. Context menu globally themed via `--contexify-*` CSS variables (dark glass, neon active state). Footer bar gets dark glass treatment with neon `border-top` and backdrop blur. Image Helper modal gets dark glass frame with neon border, drop-zone, and button overrides. Code-chunk run buttons get neon glass style. Copy-flash animation changed from amber to neon cyan. Fixed invalid `.floating-action` selector in `none.less` (replaced with actual `.gooey-item`/`.gooey-toggle` classes).

- **Popover Universe "none" theme** (`crossnote/styles/preview_theme/none.less`): Complete dark sci-fi overhaul of the "none" preview theme. Animated star-field + nebula backgrounds, Orbitron headings with neon gradient text and glow animations, glass-morphism blockquotes/code blocks with gradient border masks, neon context menu via contexify CSS variable overrides, neon topbar glass panel, neon scrollbars, and DaisyUI palette override so all interactive UI (topbar buttons, hover states) inherit the `#00f5ff` / `#bf00ff` / `#ff00aa` neon palette.

- **Monaco Underlay bug fixes**: Removed the full-viewport click interceptor div (z-index 5) that was blocking direct pointer events from reaching Monaco. Monaco now receives clicks natively since the preview ghost's `pointer-events: none` allows click-through. FloatingActions is explicitly hidden while in underlay mode (hover events are suppressed by `pointer-events: none` on the ghost, so the actions menu would appear stale/unreachable). (`MonacoUnderlay.tsx`, `FloatingActions.tsx`, `preview.less`)
- **Monaco Underlay bidirectional sync**: Moving the Monaco cursor now scrolls the preview ghost to the matching rendered element (80 ms debounce). Clicking anywhere in the preview ghost jumps the Monaco cursor and editor scroll position to the corresponding source line. A transparent `div.monaco-click-interceptor` (z-index 5, `cursor: text`) handles the click-to-cursor mapping via `document.elementsFromPoint` + `data-source-line` attribute walking. (`MonacoUnderlay.tsx`, `preview.less`)
- **Inline editor — double-click to edit**: Double-clicking any block in the preview now opens the inline editor directly, without needing the FloatingActions menu. (`preview.ts`)
- **Inline editor — ESC key conflict resolved**: The document-level ESC handler (which toggles the sidebar TOC) is now suppressed while the inline editor is open. ESC exclusively closes the inline editor while it is active. (`preview.ts`)
- **Inline block editor**: Hover any element in the preview to reveal the FloatingActions menu, then click the new pencil icon ("Edit in place"). The rendered element is replaced by a fixed-position textarea pre-filled with the raw markdown source for that block. Press Enter to save (splices the edited lines back into the file and triggers a live preview re-render), Shift+Enter to insert a newline, or Escape / click outside to cancel. (`InlineEditor.tsx`, `preview.ts`, `FloatingActions.tsx`, `Preview.tsx`, `preview.less`)
- **Monaco Editor Underlay (WYSIWYG)**: Added `MonacoUnderlay.tsx` component — a full-viewport Monaco Editor that appears beneath the semi-transparent preview, letting the raw markdown and rendered output coexist on screen. Click the pencil icon (topbar) to enter edit mode; click the eye icon to exit. Changes auto-save with a 600 ms debounce. The preview ghost is shown at 12% opacity so the render context is always visible while editing. (`MonacoUnderlay.tsx`, `preview.ts`, `Topbar.tsx`, `Preview.tsx`, `preview.less`)
- Section collapsing via heading toggle buttons: each `h1`–`h6` in the preview now gets a small `▼` toggle button as its first child. Clicking the button wraps and hides that section's content (`div.md-section-body`). State is persisted per section per file in `localStorage`.
- **Collapse all / Expand all** button in the topbar (between the refresh and table-of-contents buttons). Shows `ArrowsPointingInIcon` when sections are expanded and `ArrowsPointingOutIcon` when all sections are collapsed.

### Changed

- `package.json`: Added `"onStartupFinished"` to `activationEvents` so the extension initializes eagerly after VS Code loads, eliminating the first-open delay when activating a markdown preview.

## [0.9.2] - 2026-03-31

### Fixed

- `src/preview-provider.ts`: Pointed `setCrossnoteBuildDirectory` at `crossnote/out/` instead of `crossnote/`. The runtime loads all styles, webview scripts, and dependencies relative to this path. Previously it pointed at the source root, requiring compiled CSS to be duplicated back into `crossnote/styles/` — the source tree. Now the runtime reads directly from the build output directory where assets naturally belong.
- `gulpfile.js`: Removed the erroneous `crossnote/out/styles/ → crossnote/styles/` reverse-copy step that was introduced as a workaround for the above. The source directory `crossnote/styles/` now contains only `.less` sources and vendor CSS — no compiled output.
- `crossnote/styles/`: Restored all `.less` source files (`preview.less`, `style-template.less`, `preview_theme/*.less`, `prism_theme/*.less`) that were replaced with compiled `.css` output during the repository merge.
- `crossnote/styles/preview.less`: Moved v0.9.1 Aces Edition fixes (code block color, line number alignment/color, `<hr>` gradient) from the compiled `preview.css` artifact into the proper `.less` source file.
- `crossnote/styles/prism_theme/`: Restored 12 vendor CSS prism themes (`coy`, `darcula`, `dark`, `default`, `funky`, `github`, `hopscotch`, `okaidia`, `pojoaque`, `twilight`, `vs`, `xonokai`) that were accidentally deleted during merge repair, causing all Prism.js code block styling to break.
- `crossnote/tsconfig.json`: Removed `test/**/*` from the TypeScript `include` list, eliminating a spurious `Cannot find type definition file for 'mocha'` warning since test files are not compiled as part of the extension build.

### Added

- Extension icon updated to the Ace of Spades card design.

### Performance

- `.vscodeignore`: Added exclusions for `crossnote/node_modules/**` and all non-runtime directories (`src/`, `test/`, `.github/`, `.husky/`, `.less` sources, dev config files). This reduced the packaged VSIX from **48,474 files (146 MB) to 485 files (16 MB)** — a 99% reduction in file count and 89% reduction in size.

## [0.9.1] - 2026-03-31

### Fixed

- `crossnote/styles/preview.css`: Fixed code block text color (`#aeaeae`) and removed unwanted text-shadow on `code[class*=language-]` and `pre[class*=language-]`.
- `crossnote/styles/preview.css`: Fixed line number alignment in Prism.js line-numbers blocks — set `text-align: center` and `width: 3em` on `> span::before` pseudo-element so numbers center correctly within the gutter column.
- `crossnote/styles/preview.css`: Recolored line number text to `rgb(228, 213, 0)` and the gutter divider border-right to `rgb(255, 238, 0)`.
- `crossnote/styles/preview.css`: Replaced the default grey `<hr>` divider with an orange gradient (`linear-gradient(90deg, transparent, #f5a14c, #ffb366, #f5a14c, transparent)`).

## [0.9.0] - 2026-03-31

Aces Edition fork: full identity rebrand from upstream `shd101wyy/vscode-markdown-preview-enhanced`.

### Changed

- Rebranded extension identity from `Markdown Preview Enhanced` / `markdown-preview-enhanced` to `Markdown Preview Aces Edition` / `markdown-preview-aces-edition` across manifest, command IDs, configuration keys, custom editor/view IDs, and internal preview URI scheme.
- Updated extension publisher/owner references from `shd101wyy` to `acester822` in manifest metadata, install helper extension ID, documentation links, and extension in-app links.
- Rewrote `README.md` to match the merged Aces Edition fork: removed outdated sponsor/marketing/upstream-doc sections and replaced with concise, accurate fork identity, local workflow, and build/package instructions.
- Expanded `README.md` with an `Aces Edition Updates` section that explicitly documents major fork improvements (new theme, improved menu/actions, code block copy actions, line-number/source-sync workflow, and preview UX upgrades).
- Corrected `README.md` update notes to explicitly state that in-preview editor support and preview zen mode are removed in this fork.
- Fixed `install-extension.sh` to work again in the merged repo layout by resolving the extension directory from the current project root (with legacy fallback), guarding pnpm-only steps, and correcting VSCE command detection to use the `vsce` binary.
- Tightened `install-extension.sh` to require a local modified crossnote dependency only (via `./crossnote` or `CROSSNOTE_DIR`) and fail fast when missing, with no registry fallback path.
- Updated `install-extension.sh` to require `crossnote` strictly at `mpae/crossnote` (same git sync), removing legacy extension-dir fallback and external `CROSSNOTE_DIR` override behavior.
- Updated `package.json` dependency to `crossnote: file:./crossnote` and restored the tracked `crossnote/` working tree from git to recover local-only install behavior.
- Fixed `gulpfile.js` `copy-files` task to preserve the local `./crossnote` package sources and only refresh generated `dependencies/styles/webview` subdirectories, preventing builds from deleting the vendored crossnote dependency.
- Updated `install-extension.sh` crossnote install step to use `--ignore-scripts` for vendored dependency installs, avoiding Husky lifecycle failures when `crossnote` is embedded in this repo.
- Updated `build.js` and `gulpfile.js` to consume crossnote artifacts directly from `./crossnote/out` instead of `./node_modules/crossnote/out`, eliminating brittle path-resolution failures from pnpm linked-package internals.
- Recovery: restored full local `crossnote` source tree into the merged `mpae` repository after partial deletion during git sync.
- Recovery: removed nested `crossnote/.git` to avoid nested-repo conflicts inside the merged project.
- `package.json`: switched `crossnote` dependency from absolute external path to local `file:./crossnote` so the repo is self-contained.

### Removed

- `src/config.ts`: Removed `enablePreviewZenMode` property declaration and constructor assignment.
- `src/extension-common.ts`: Removed `togglePreviewZenMode` function and `_crossnote.togglePreviewZenMode` command registration.

## [0.8.22] - 2026-03-22

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.9.20](https://github.com/shd101wyy/crossnote/releases/tag/0.9.20).

### Added

- Support publishing the extension to [Open VSX](https://open-vsx.org) Registry.

### Security

- Fix RCE vulnerability in `.crossnote/parser.js` hooks, by @0079522-Z461.

### Updates

- Update `sval` javascript interpreter to the latest `0.6.9`.

## [0.8.21] - 2026-03-15

Update [crossnote](https://github.com/shd101wyy/crossnote) to version [0.9.17](https://github.com/shd101wyy/crossnote/releases/tag/0.9.17), [0.9.18](https://github.com/shd101wyy/crossnote/releases/tag/0.9.18), and [0.9.19](https://github.com/shd101wyy/crossnote/releases/tag/0.9.19).

### New features

- Add markdown-it callout feature with styling https://github.com/shd101wyy/crossnote/pull/387 by [@EmmetZ](https://github.com/EmmetZ).
- Add WebSequenceDiagrams support in `wsd` code blocks https://github.com/shd101wyy/vscode-markdown-preview-enhanced/pull/2228 by [@smhanov](https://github.com/smhanov).

### Bug fixes

- Remove the wrapper of custom head in HTML page https://github.com/shd101wyy/crossnote/pull/386 by [@TanShun](https://github.com/TanShun).
- Fix sanitizer for mermaid and wavedrom diagrams.
- Fix `code_block=true` not preventing mermaid diagram rendering.
- Fix "Open in Browser" file paths on WSL.

### Security

- Fix CVE-2025-65716: Sanitize rendered HTML to prevent arbitrary JavaScript execution via malicious markdown files. Added two-layer defense: server-side sanitization using cheerio (strips `<script>`, `<object>`, `<embed>`, `<applet>` tags, `on*` event handlers, dangerous URL schemes, and sandboxes all `<iframe>` elements) and client-side sanitization using DOMPurify as defense-in-depth at all `innerHTML` injection points https://github.com/shd101wyy/crossnote/pull/394

### Updates

- Update `mermaid` version to the latest `11.13.0`.
- Update `katex` version to the latest `0.16.38`.

## [0.8.20] - 2025-11-01

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.9.16](https://github.com/shd101wyy/crossnote/releases/tag/0.9.16).

### Updates

- Update `mermaid` version to the latest `11.12.1`.
- Update `katex` version to the latest `0.16.25`.

### Bug fixes

- Fix preview selection in loop iteration [PR#2182](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/pull/2182).

## [0.8.19] - 2025-08-15

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.9.15](https://github.com/shd101wyy/crossnote/releases/tag/0.9.15).

### Changes

- Add `markdown-preview-enhanced.liveUpdateDebounceMs` setting to control the live update debounce time in milliseconds. Default is `300ms`.
- Allow to disable auto-preview config for specific URI schemes. Fixed the issue [#604](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/604) by @alonsorobots.

### Bug fixes

- Fixed splitting logic to handle diagrams starting with `<svg>` correctly [crossnote#376](https://github.com/shd101wyy/crossnote/issues/376) by @shiftdownet.

### Updates

- Updated `katex` version to the latest `0.16.22`.
- Updated `mermaid` version to the latest `11.9.0`.

## [0.8.18] - 2025-03-16

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.9.13](https://github.com/shd101wyy/crossnote/releases/tag/0.9.14).

### Bug fixes

- Fixed the build for vscode-web caused by prismjs.

## [0.8.17] - 2025-03-16

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.9.13](https://github.com/shd101wyy/crossnote/releases/tag/0.9.13).

### Bug fixes

- Fixed a bug of bundling caused by importing the [sharp](https://www.npmjs.com/package/sharp) package.

## [0.8.16] - 2025-03-16

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.9.12](https://github.com/shd101wyy/crossnote/releases/tag/0.9.12).

### Changes

- Use [sharp](https://www.npmjs.com/package/sharp) to convert svg element to png file if `imageMagickPath` is empty. [crossnote#366](https://github.com/shd101wyy/crossnote/issues/366)

### Updates

- Updated `mermaid` version to the latest `11.5.0`.
- Updated `katex` version to the latest `0.16.21`.
- Updated `prismjs` version to the latest `1.30.0`.
- Updated `bit-field` version to the latest `1.9.0`.

### Bug fixes

- Fixed the import the crossnote as nodejs esm module. [crossnote#357](https://github.com/shd101wyy/crossnote/issues/357)
- Fixed a bug of using `enableExtendedTableSyntax`. [crossnote#369](https://github.com/shd101wyy/crossnote/issues/369)

## [0.8.15] - 2024-09-07

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.9.11](https://github.com/shd101wyy/crossnote/releases/tag/0.9.11).

### Changes

- Enabled the preview zen mode by default.

### Updates

- Updated `mermaid` version to the latest `11.4.0`.

## [0.8.14] - 2024-09-07

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.9.10](https://github.com/shd101wyy/crossnote/releases/tag/0.9.10).

### Changes

- Added `.mdx` to the default `markdownFileExtensions`.

### Updates

- Updated `mermaid` version to the latest `11.1.1`.
- Updated `katex` version to the latest `v0.16.11`.

### Bug fixes

- Fixed a scroll sync bug.

## [0.8.13] - 2024-03-18

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.9.9](https://github.com/shd101wyy/crossnote/releases/tag/0.9.9).

### Bug fixes

- Fixed [a bug of link redirection in preview](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1951) by @byte-clown
- Fixed [Long sidebarToc does not display completely](https://github.com/shd101wyy/crossnote/pull/354) by @moonlitusun
- Removed the `text` as the default language selector for code block.

### Chore

- Updated [flake.nix](./flake.nix) and node.js to 20.

## [0.8.12] - 2024-03-10

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.9.8](https://github.com/shd101wyy/crossnote/releases/tag/0.9.8).

### New features

- @moonlitusun sidebarToc supports local caching

### Updates

- @oneWaveAdrian updated the `mermaid` version to the latest `10.9.0`.

### Bug fixes

- Fixed [[BUG] #tag is treated as Header 1](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1937)
- Fixed [[BUG] toml code block support is not very good](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1920)
- Fixed [[BUG] If URL encoding is used, the preview cannot be displayed.](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1934)

## [0.8.11] - 2023-12-10

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.9.7](https://github.com/shd101wyy/crossnote/releases/tag/0.9.7).

### New features

- Added `enablePreviewZenMode` option and reorganized the right-click context menu.

  ![image](https://github.com/shd101wyy/crossnote/assets/1908863/26e2237e-c6e2-433e-a063-6de2c01a64bb)

### Bug fixes

- Fixed rendering `vega-lite` in `Reveal.js` slide: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1880
- Removed one github-dark background css attribute: https://github.com/shd101wyy/crossnote/issues/344

## [0.8.10] - 2023-10-26

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.9.6](https://github.com/shd101wyy/crossnote/releases/tag/0.9.6).

### Changes

- Updated mermaid.js to the latest version 10.6.0.

### Bug fixes

- Fixed importing file with spaces in the path: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1857
- Fixed a bug of updating the vscode `workbench.editorAssociations`: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1860

## [0.8.9] - 2023-10-23

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.9.5](https://github.com/shd101wyy/crossnote/releases/tag/0.9.5).

### Bug fixes

- Fixed of bug of rendering the KaTeX math expression: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1853

## [0.8.8] - 2023-10-22

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.9.4](https://github.com/shd101wyy/crossnote/releases/tag/0.9.4).

### New features

- Updated [fontawesome](https://fontawesome.com/) from version 4.7 to version 6.4.2 (Free).  
  A list of available icons can be found at: https://kapeli.com/cheat_sheets/Font_Awesome.docset/Contents/Resources/Documents/index
- Updated WaveDrom to the latest version 3.3.0.

### Changes

- Changed the markdown parser process to be like below. We removed the `onWillTransformMarkdown` and `onDidTransformMarkdown` hooks as these two caused the confusion.

  ```markdown
  markdown
  ↓
  `onWillParseMarkdown(markdown)`
  ↓
  markdown
  ↓
  **crossnote markdown transformer**
  ↓
  markdown
  ↓
  **markdown-it or pandoc renderer**
  ↓
  html
  ↓
  `onDidParseMarkdown(html)`
  ↓
  html, and then rendered in the preview
  ```

- (Beta) Supported to export the selected element in preview to .png file and copy the blob to the clipboard:

  ![image](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/assets/1908863/046759d8-6d89-4f41-8420-b863d2094fe7)

### Bug fixes

- Fixed a bug of importing files that contains empty heading: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1840
- Fixed a bug of rendering inline math in image name: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1846
- Fixed a bug of parsing inline code: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1848

## [0.8.7] - 2023-10-15

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.9.2](https://github.com/shd101wyy/crossnote/releases/tag/0.9.2) and version [0.9.3](https://github.com/shd101wyy/crossnote/releases/tag/0.9.3).

### New features

- Added `ID` button to copy the element id to clipboard:

  ![Screenshot from 2023-10-15 15-34-27](https://github.com/shd101wyy/crossnote/assets/1908863/ede91390-3cca-4b83-8e30-33027bf0a363)

- Supported to import section of markdown by header id:

  ```markdown
  @import "test.md#header-id"

  or

  ![](test.md#header-id)

  or

  ![[test#header-id]]
  ```

### Bug fixes

- URL fragments on image links do not load: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1837
- Supported matplotlib-type preview for other Python tools like `pipenv`: https://github.com/shd101wyy/crossnote/issues/332
- Fixed jump to header from link like `[link](test.md#header-id)`.
- Better handling of source map for importing files.

## [0.8.6] - 2023-10-14

This MPE version reduced the VS Code version requirement to 1.70.0 or above.

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.9.0](https://github.com/shd101wyy/crossnote/releases/tag/0.9.0) and [0.9.1](https://github.com/shd101wyy/crossnote/releases/tag/0.9.1).

### New features

- Added two more syntaxes to import files in addition to the `@import` syntax. Please note that these syntaxes only work on new lines. For example, they won't work within list items.
  - Use the image syntax but with other file extensions:
    ```markdown
    ![](path/to/file.md)
    ![](path/to/test.py){.line-numbers}
    ![](path/to/test.js){code_block=true}
    ```
  - Use the wikilink syntax but with other file extensions:
    ```markdown
    ![[file]]
    ![[path/to/test.py]]{.line-numbers}
    ![[path/to/test.js]]{code_block=true}
    ```

### Bug fixes

- Fixed a header id generation bug https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1833
- Fixed parsing block attributes from curly bracket when `enableTypographer` is enabled https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1823
- Fixed the bug of not rendering the `@import` file:
  - https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1832
  - https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1834
- Fixed rendering `vega` and `vega-lite`. Also fixed `interactive=true` attribute for `vega`.

## [0.8.5] - 2023-10-10

Please note this version requires VS Code 1.82.0 or above.

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.8.24](https://github.com/shd101wyy/crossnote/releases/tag/0.8.24).

### Bug fixes

- Improved the handling of `[toc]`: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1825
- Supported to set env variables in paths of configuration: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1826
- Fixed the footer style: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1822
- Fixed the bug of generating the header id: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1827
- Fixed the bug of `@import` files that contains unicode characters: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1823
- Now use node.js 18 for the project.

## [0.8.4] - 2023-10-10

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.8.23](https://github.com/shd101wyy/crossnote/releases/tag/0.8.23).

### Bug fixes

- Fixed exporting reveal.js presentation.

## [0.8.3] - 2023-10-10

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.8.22](https://github.com/shd101wyy/crossnote/releases/tag/0.8.22).

### Bug fixes

- Fixed a bug of loading image https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1819
- Fixed a bug of parsing slides https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1818

## [0.8.2] - 2023-10-09

Special Thanks to [@mavaddat](https://github.com/mavaddat) for creating the awesome extension logo for MPE in this [pull request](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/pull/1808) 🎉 We finally have a beautiful logo for MPE.

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.8.20](https://github.com/shd101wyy/crossnote/releases/tag/0.8.20) and [0.8.21](https://github.com/shd101wyy/crossnote/releases/tag/0.8.21).

### New features

- Supported prefix in front of Kroki diagram types https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1785.  
  So now all diagrams below will get rendered using Kroki:

  ````markdown
  ```kroki-plantuml
  @startuml
  A -> B
  @enduml
  ```

  ```plantuml {kroki=true}
  @startuml
  A -> B
  @enduml
  ```
  ````

- Improved the source map handling for `@import "..."` syntax.

### Bug fixes

- Exporting files no longer includes the source map.
- Fixed some Reveal.js presentation related bugs:
  - https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1815
  - https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1814
- Both the `style.less` from `Markdown Preview Enhanced: Customize Css (Global)` and the `style.less` from `Markdown Preview Enhanced: Customize Css (Workspace)` will now be loaded. The `style.less` from `Markdown Preview Enhanced: Customize Css (Workspace)` will have higher priority.
- Fixed the bug where deleting config files from workspace did not update the preview.

## [0.8.1] - 2023-10-06

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.8.19](https://github.com/shd101wyy/crossnote/releases/tag/0.8.19).

### Changes

- Deprecated the `processWikiLink` in `parser.js`. Now `crossnote` handles how we process the wiki link.  
  We also added two more options:
  - `wikiLinkTargetFileExtension`: The file extension of the target file. Default is `md`. For example:
    - `[[test]]` will be transformed to `[test](test.md)`
    - `[[test.md]]` will be transformed to `[test](test.md)`
    - `[[test.pdf]]` will be transformed to `[test](test.pdf)` because it has a file extension.
  - `wikiLinkTargetFileNameChangeCase`: How we transform the file name. Default is `none` so we won't change the file name.  
    A list of available options can be found at: https://shd101wyy.github.io/crossnote/types/WikiLinkTargetFileNameChangeCase.html

### Bug fixes

- Reverted the markdown transformer and deleted the logic of inserting anchor elements as it's causing a lot of problems.  
  The in-preview editor is not working as expected. So we now hide its highlight lines and elements feature if the markdown file failed to generate the correct source map.
- Fixed the bug that global custom CSS is not working.

## [0.8.0] - 2023-10-05

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.8.17](https://github.com/shd101wyy/crossnote/releases/tag/0.8.17) then version [0.8.18](https://github.com/shd101wyy/crossnote/releases/tag/0.8.18).

### New features

- 📝 Supported in-preview editor that allows you to edit the markdown file directly in the preview 🎉.  
  This feature is currently in beta.  
  When the editor is open, you can press `ctrl+s` or `cmd+s` to save the markdown file. You can also press `esc` to close the editor.
- Deprecated the VS Code setting `markdown-preview-enhanced.singlePreview`.  
  Now replaced by `markdown-preview-enhanced.previewMode`:

  - **Single Preview** (_default_)  
    Only one preview will be shown for all editors.
  - **Multiple Previews**  
    Multiple previews will be shown. Each editor has its own preview.
  - **Previews Only** 🆕  
    No editor will be shown. Only previews will be shown. You can use the in-preview editor to edit the markdown.

    🔔 Please note that enable this option will automatically modify the `workbench.editorAssociations` setting to make sure the markdown files are opened in the custom editor for preview.

- Added two new VS Code commands `Markdown Preview Enhanced: Customize Preview Html Head (Workspace)` and `Markdown Preview Enhanced: Customize Preview Html Head (Global)`, which will open the `head.html` file for you to customize the `<head>` of the preview.

- Supported to set attribute to image and link, e.g.:

  ```markdown
  ![](path/to/image.png){width=100 height=100}
  ```

- Improved the markdown transformer to better insert anchors for scroll sync and highlight lines and elements.  
  Added more tests for the markdown transformer to make sure it works as expected.
- Added the reading time estimation in the preview footer ⏲️.
- Added `Edit Markdown` menu item to the context menu of the preview, which offers two options:
  - **Open VS Code Editor**
    Open the markdown file in VS Code editor.
  - **Open In-preview Editor**
    Open the markdown file in the in-preview editor.
- Updated the mermaid version to the latest `10.5.0`
- Updated the `katex` version to `0.16.9`.
- Added the API website: https://shd101wyy.github.io/crossnote/

### Bug fixes

- Fixed the font size of the `github-dark.css` code block theme.
- Fixed the anchor jump bugs: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1790
- Fixed list item style bug: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1789
- Fixed a data race bug that caused the preview to hang.

## [0.7.10] - 2023-09-24

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.8.16](https://github.com/shd101wyy/crossnote/releases/tag/0.8.16)

### New features

- Added `head.html` config file to allow you to include custom HTML in the `<head>` of the preview.
  This could be useful for adding custom CSS or JavaScript to the preview.

### Bug fixes

- Fixed the `none.css` preview theme bug https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1778.
- Fixed the bug of copying texts in preview https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1775.
- Added `<code>` in `<pre>` while rendering code blocks in preview.

## [0.7.9] - 2023-09-17

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.8.15](https://github.com/shd101wyy/crossnote/releases/tag/0.8.15)

### New features

- Added the `includeInHeader` option, which allows you to include custom HTML in the `<head>` of the preview.
  This could be useful for adding custom CSS or JavaScript to the preview.

### Bug fixes

- Fixed the bug of missing the backlinks on the `vue.css` theme.
- Fixed the back to top button. https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1769

## [0.7.8] - 2023-09-15

Updated [crossnote](https://github.com/shd101wyy/crossnote) to version [0.8.14](https://github.com/shd101wyy/crossnote/releases/tag/0.8.14)

### New features

- (Beta) Added the [bitfield](https://github.com/wavedrom/bitfield) diagram support. Supported both `bitfield` and `bit-field` code fences. https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1749
  ````
  ```bitfield {vspace=100}
  [
    {name: 'IPO',   bits: 8},
    {               bits: 7},
    {name: 'BRK',   bits: 5, type: 4},
    {name: 'CPK',   bits: 1},
    {name: 'Clear', bits: 3, type: 5},
    {               bits: 8}
  ]
  ```
  ````

### Bug fixes

- Fixed the `vue.css` theme bug that caused the missing scroll bar in the preview. Also fixed a context menu bug for selecting the `vue.css` theme.

## [0.7.7] - 2023-09-15

### Updated to crossnote 0.8.13

https://github.com/shd101wyy/crossnote/releases/tag/0.8.13

#### Bug fixes

- Fixed rendering MathJax in preview https://github.com/shd101wyy/crossnote/pull/311.
- Fixed the preview background color https://github.com/shd101wyy/crossnote/pull/312.
- Added error message when failed to parse the YAML front-matter. Also escaped the HTML rendered in the front-matter table in preview. https://github.com/shd101wyy/crossnote/pull/312.

## [0.7.6] - 2023-09-14

Fixed the extension for https://vscode.dev.
Will migrate vsce publish to GitHub action.

## [0.7.5] - 2023-09-14

Fixed reading file as base64

## [0.7.4] - 2023-09-14

### New features 🆕

1. Complete rewrite of the webview, and improved the UI. 🌐💅
2. Backlinks supported in the preview. Clicking the bottom right link icon will display the backlinks. This feature is currently in beta and might not be stable yet.  
   If you want the backlinks to be always on in the preview, you can enable the setting:

   ```
   "markdown-preview-enhanced.alwaysShowBacklinksInPreview": true,
   ```

3. Updated [reveal.js](https://revealjs.com/) to the latest `4.6.0`.

### Bug fixes 🐛

1. 🐞 [Issue 1752](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1752)

### Future plan 📋

We will further improve the markdown-it parser ~~and we might remove the pandoc parser support~~. You can still use the pandoc export. This will not be affected. 📝✂️

We will add in-preview editing capability in the future. 🖋️

We will also add the backlinks graph view. 📈

## [0.7.3] - 2023-09-06

### New features 🆕

- ⭐ Added `markdown-preview-enhanced.markdownFileExtensions` config that allows users to specify the file extensions for preview.
- 🌟 Supported pandoc-like code blocks, for example:

  ````
  ``` {.python}
  def add(x, y):
    return x + y
  ```

  ``` {.mermaid}
  graph LR
  A --> B
  ```
  ````

  The first class in the `{...}` will be regarded as the `language`.

### Bug fixes 🐞

- :bug: [Single preview bug](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1740)

### MISC 🛠️

- Refactored some [crossnote](https://github.com/shd101wyy/crossnote) code.

## [0.7.2] - 2023-09-05

**0.7.2** is a breaking update! And yes, it might break many things and introduce more bugs. But don't worry, we'll fix them! 😅

### What's new? 🚀

- MPE is now available on [VSCode for the Web](https://vscode.dev) 🥇 Yes, you can now use MPE in your browser. But some features are limited, like exporting files and code chunks, which are disabled in the browser environment. I am writing this CHANGELOG right now in [vscode.dev](https://vscode.dev) using the MPE extension 😃.

  ![image](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/assets/1908863/9222fc77-6bf2-4fd6-bc94-bd8c1953bc24)

- The `mume` library, which powers MPE, is now renamed as [crossnote](https://github.com/shd101wyy/crossnote). This is a complete refactor of the project. We will support more features like backlinks and in-preview editor in the future.
  - Now you can have a `.crossnote` directory for configuring the MPE extension for your workspace. In VSCode, running the command `Markdown Preview Enhanced: Customize CSS (Workspace)` will automatically generate several configuration files for you. There is also a global `.crossnote` directory located at `~/.crossnote` if you are using Windows, or `$XDG_CONFIG_HOME/.crossnote` or `~/.local/state/crossnote` if you are using \*nix. The global configuration has lower priority than the workspace one. 🛠️

### Bug Fixes 🐛

- Fixed [Issue 1736](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1736)
- Fixed [Issue 1737](https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1737) 🚗

## [0.7.1] - 2023-09-02

- Fixed the puppeteer export: https://github.com/shd101wyy/mume/pull/299
- Replaced BabyParse with PapaParse: https://github.com/shd101wyy/mume/pull/298

## [0.7.0] - 2023-09-01

- 🆕 Added `editor-light`, `editor-dark`, `system-light`, `system-dark` class names to the preview panel.
- ✨ Reduced the size of the bundled vscode MPE extension from 40mb to 8mb.
- ➕ Supported to configure: `markdown-preview-enhanced.mathjaxV3ScriptSrc`, `markdown-preview-enhanced.plantumlJarPath`, and `markdown-preview-enhanced.krokiServer`.
- 🔰 Updated [@shd101wyy/mume](https://github.com/shd101wyy/mume) to version [0.7.8](https://github.com/shd101wyy/mume/pull/297).

  - :robot: Completely refactored the `mume` project. It's not done yet, but it's a good start. The next release will be a major release.
    - 🎉 Now use the esbuild to bundle the project.
    - 🎉 Better support of both commonjs and esm.
    - 🔧 Replaced tslint with eslint.
  - :newspaper: Removed the `plantuml.jar` file from the `mume` project. Now you need to download the plantuml.jar file manually from [here](https://plantuml.com/download).
    - If you are using `mume`, you will need to pass `plantumlJarPath` to the `mume.init({})`.
    - If you are using VSCode, you can set the `markdown-preview-enhanced.plantumlJarPath` option in the VSCode settings.
  - 🗑 Removed `ditaa.jar` file from the `mume` project. Also removed the native support of rendering ditaa diagrams. But you can now use [Kroki](https://kroki.io/) to render the `ditaa` diagrams.
  - 🗑 Removed rendering the `js-sequence-diagram` and `flowchart.js` charts.
  - 🎉 Updated `MathJax` to **V3**. `MathJax` V2 is no longer supported.
  - 🎉 Added [Kroki](https://kroki.io/) support to render diagrams. This is a beta feature. For example:

    ````
    ```ditaa {kroki=true}
    +--------+   +-------+    +-------+
    |        | --+ ditaa +--> |       |
    |  Text  |   +-------+    |diagram|
    |Document|   |!magic!|    |       |
    |     {d}|   |       |    |       |
    +---+----+   +-------+    +-------+
        :                         ^
        |       Lots of work      |
        +-------------------------+
    ```
    ````

  - 🎉 Updated `mermaid` to version `10.4.0`, and supported rendering [zenuml](https://mermaid.js.org/syntax/zenuml.html) chart using `mermaid`.
  - 🎉 Updated `vega` to the latest version `5.25.0`.
  - 🎉 Updated `vega-lite` to the latest version `5.14.1`.
  - 🎉 Updated `cheerio` to the latest version `1.0.0-rc.12`.
  - 🎉 Updated `prismjs` to the latest version `0.12.9`.
  - 🎉 Updated `viz.js` to the latest version `3.1.0`.
