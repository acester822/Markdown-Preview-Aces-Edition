// Shared suppression state for Excalidraw edits.
//
// When the in-preview Excalidraw editor saves its data to the source markdown
// file, the extension's file watchers would normally react to that file change
// and refresh the preview. But Excalidraw already has the latest data locally
// (its onChange handler updated its own state), so a preview refresh is both
// redundant and harmful: it tears down and re-creates the Excalidraw instance,
// which fires onChange again, which saves again, which refreshes again — an
// infinite save/reload loop.
//
// To break the loop we record the URI here right before we save the file, and
// BOTH watch handlers (onDidSaveTextDocument in extension-common.ts and the
// live-update `update()` path in preview-provider.ts) check this set and skip
// the refresh while the suppression is active.

const excalidrawSaveSuppressUntil = new Map<string, number>();

/**
 * Mark a URI as "just saved by Excalidraw" so preview refreshers skip it.
 * @param uriString The document.uri.toString() of the saved markdown file.
 * @param windowMs How long the suppression stays active (default 1500ms).
 */
export function suppressExcalidrawRefreshFor(
  uriString: string,
  windowMs = 1500,
): void {
  excalidrawSaveSuppressUntil.set(uriString, Date.now() + windowMs);
}

/**
 * Returns true if the preview refresh for this URI should be skipped because
 * Excalidraw just saved it.
 */
export function shouldSuppressExcalidrawRefresh(uriString: string): boolean {
  const until = excalidrawSaveSuppressUntil.get(uriString);
  if (until === undefined) {
    return false;
  }
  if (Date.now() > until) {
    excalidrawSaveSuppressUntil.delete(uriString);
    return false;
  }
  return true;
}
