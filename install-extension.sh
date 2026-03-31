#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_DIR="$ROOT_DIR/vscode-markdown-preview-enhanced"

function info() {
  printf "\033[1;34m%s\033[0m\n" "$1"
}

function warn() {
  printf "\033[1;33m%s\033[0m\n" "$1"
}

function error() {
  printf "\033[1;31m%s\033[0m\n" "$1" >&2
}

info "\n=== Install extension helper ==="
info "Extension directory: $EXT_DIR"

if [ ! -d "$EXT_DIR" ]; then
  error "Extension directory does not exist: $EXT_DIR"
  exit 1
fi
# If markdown-preview-enhanced is already installed, remove it first so 'code --install-extension --force' starts clean.
UNINSTALL_EXT="shd101wyy.markdown-preview-enhanced"
if command -v code >/dev/null 2>&1; then
  if code --list-extensions | grep -qx "$UNINSTALL_EXT"; then
    info "Existing extension $UNINSTALL_EXT found in code, uninstalling first..."
    code --uninstall-extension "$UNINSTALL_EXT" || warn "Failed to uninstall $UNINSTALL_EXT from code"
  fi
elif command -v code-server >/dev/null 2>&1; then
  if code-server --list-extensions | grep -qx "$UNINSTALL_EXT"; then
    info "Existing extension $UNINSTALL_EXT found in code-server, uninstalling first..."
    code-server --uninstall-extension "$UNINSTALL_EXT" || warn "Failed to uninstall $UNINSTALL_EXT from code-server"
  fi
fi
cd "$EXT_DIR"

# Prefer local crossnote path dependency when available, avoids registry version.
LOCAL_CROSSNOTE="$ROOT_DIR/crossnote"
if [ -d "$LOCAL_CROSSNOTE" ]; then
  info "Linking local crossnote from $LOCAL_CROSSNOTE into extension dependencies."
  pnpm add "crossnote@file:$LOCAL_CROSSNOTE" || warn "Failed to add local crossnote package."
else
  warn "Local crossnote path $LOCAL_CROSSNOTE not found; will use current dependency source."
fi

# node >=18 required by package.json engines. Node 25 may lead to flaky old deps.
NODE_VERSION=$(node -v 2>/dev/null || echo "")
if [[ "$NODE_VERSION" =~ ^v([0-9]+) ]]; then
  NODE_MAJOR=${BASH_REMATCH[1]}
  if (( NODE_MAJOR < 18 || NODE_MAJOR > 24 )); then
    warn "Detected Node version $NODE_VERSION. Recommended: 18..24. Using other versions may cause build issues."
  fi
else
  warn "Could not detect Node version. Ensure Node 18/20/22 is in use."
fi

info "1) Cleanup and dependency install"
rm -rf node_modules
rm -f pnpm-lock.yaml yarn.lock package-lock.json

# Prefer pnpm
if command -v pnpm >/dev/null 2>&1; then
  info "Running pnpm install..."
  pnpm install --frozen-lockfile || pnpm install
else
  warn "pnpm not found. Trying npm install fallback."
  if command -v npm >/dev/null 2>&1; then
    npm install
  elif command -v yarn >/dev/null 2>&1; then
    warn "Using yarn fallback. Expect possible fsevents warnings; if build fails, switch to pnpm."
    yarn install --force
  else
    error "No package manager found (pnpm/npm/yarn). Install one first."
    exit 1
  fi
fi

info "2) Build extension"
if command -v pnpm >/dev/null 2>&1; then
  pnpm run build
else
  npm run build
fi

info "3) Package extension to VSIX"
if command -v @vscode/vsce >/dev/null 2>&1; then
  VSCE_CMD="@vscode/vsce"
elif command -v vsce >/dev/null 2>&1; then
  VSCE_CMD="vsce"
elif command -v npm >/dev/null 2>&1; then
  npm install -g @vscode/vsce
  VSCE_CMD="@vscode/vsce"
else
  error "Unable to find vsce/@vscode/vsce and npm. Install one of them to package extension."
  exit 1
fi

PACKAGE_NAME="$(node -e 'const p=require("./package.json"); console.log(`${p.name}-${p.version}.vsix`)')"

$VSCE_CMD package --no-dependencies --out "$PACKAGE_NAME"

info "4) Install packaged extension"
if command -v code >/dev/null 2>&1; then
  code --install-extension "$EXT_DIR/$PACKAGE_NAME" --force
elif command -v code-server >/dev/null 2>&1; then
  code-server --install-extension "$EXT_DIR/$PACKAGE_NAME" --force
else
  warn "Neither code nor code-server found in PATH. Package is available at $EXT_DIR/$PACKAGE_NAME"
  warn "Manually install with: code --install-extension '$EXT_DIR/$PACKAGE_NAME'"
  exit 0
fi

info "\n✅ Installed $PACKAGE_NAME successfully."
info "To run in dev mode (for debugging):"
info "  code --extensionDevelopmentPath=$EXT_DIR"

