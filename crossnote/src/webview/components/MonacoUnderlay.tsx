import Editor, { OnChange, OnMount } from '@monaco-editor/react';
import React, { useCallback, useEffect, useRef } from 'react';
import PreviewContainer from '../containers/preview';

const SAVE_DEBOUNCE_MS = 600;

/**
 * Monaco Editor Underlay
 *
 * Renders Monaco as a full-viewport layer behind the preview ghost.
 * Only mounted when `isUnderlayMode` is true; unmounts (and flushes any
 * pending save) when deactivated.
 *
 * The preview element is made semi-transparent (opacity ~0.12) via CSS on
 * `body.underlay-mode`, so the Monaco raw-markdown text is visible "under"
 * the rendered preview skeleton. Pointer-events are disabled on the ghost
 * so all clicks/keyboard input reach Monaco.
 */
export default function MonacoUnderlay() {
  const { isUnderlayMode, markdown, postMessage, previewElement, sourceUri, theme } =
    PreviewContainer.useContainer();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Immediately flush any pending debounced save.
   * Called on component unmount so no edits are lost when the user
   * closes underlay mode mid-edit.
   */
  const flushSave = useCallback(() => {
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const editor = editorRef.current;
    if (editor) {
      postMessage('updateMarkdown', [sourceUri.current, editor.getValue()]);
    }
  }, [postMessage, sourceUri]);

  /**
   * Scroll the preview ghost to the rendered element whose source line is
   * closest (floor) to the Monaco cursor line.
   * MPE emits 0-based `data-source-line`; Monaco uses 1-based line numbers.
   */
  const scrollPreviewToLine = useCallback(
    (monacoLine: number) => {
      const container = previewElement.current;
      if (!container) return;
      const sourceLine = monacoLine - 1; // Monaco 1-based → MPE 0-based
      const all = Array.from(
        container.querySelectorAll<HTMLElement>('[data-source-line]'),
      );
      if (!all.length) return;
      let best: HTMLElement | null = null;
      let bestLine = -1;
      for (const el of all) {
        const n = parseInt(el.getAttribute('data-source-line') ?? '', 10);
        if (!isNaN(n) && n <= sourceLine && n > bestLine) {
          bestLine = n;
          best = el;
        }
      }
      if (!best) best = all[0];
      best.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    },
    [previewElement],
  );

  const handleMount: OnMount = useCallback(
    (editor) => {
      editorRef.current = editor;
      // Expose for dev/debugging convenience
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)['underlayEditor'] = editor;
      // Monaco cursor → preview ghost scroll sync (debounced 80 ms)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      editor.onDidChangeCursorPosition((e: any) => {
        if (cursorSyncTimerRef.current !== null)
          clearTimeout(cursorSyncTimerRef.current);
        cursorSyncTimerRef.current = setTimeout(() => {
          cursorSyncTimerRef.current = null;
          scrollPreviewToLine(e.position.lineNumber);
        }, 80);
      });
    },
    [scrollPreviewToLine],
  );

  const handleChange: OnChange = useCallback(
    (value) => {
      if (value === undefined) return;
      if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        postMessage('updateMarkdown', [sourceUri.current, value]);
      }, SAVE_DEBOUNCE_MS);
    },
    [postMessage, sourceUri],
  );

  // Flush pending save and cancel sync timer when unmounting (underlay mode exited)
  useEffect(() => {
    return () => {
      flushSave();
      if (cursorSyncTimerRef.current !== null) {
        clearTimeout(cursorSyncTimerRef.current);
      }
    };
  }, [flushSave]);

  // Do not render anything while not in underlay mode.
  // Returning null here unmounts the editor, reclaiming memory, and guarantees
  // a fresh `defaultValue` (current markdown) on every activation.
  if (!isUnderlayMode) return null;

  return (
    <div className="monaco-underlay-container" data-theme={theme}>
      <Editor
        height="100%"
        defaultLanguage="markdown"
        defaultValue={markdown}
        onChange={handleChange}
        onMount={handleMount}
        options={{
          wordWrap: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: true,
          fontSize: 13,
          lineHeight: 20,
          automaticLayout: true,
          padding: { top: 32, bottom: 200 },
          domReadOnly: false,
          readOnly: false,
        }}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        loading={
          <div
            className="flex items-center justify-center w-full h-full opacity-30"
            data-theme={theme}
          >
            <span className="loading loading-bars loading-md"></span>
          </div>
        }
      />
    </div>
  );
}
