import * as fs from 'fs';
import * as less from 'less';
import * as os from 'os';
import * as path from 'path';
import { interpretJS } from '../utility';
import {
  FileSystemApi,
  NotebookConfig,
  ParserConfig,
  getDefaultKatexConfig,
  getDefaultMathjaxConfig,
  getDefaultMermaidConfig,
  getDefaultNotebookConfig,
  getDefaultParserConfig,
} from './types';
import { FTR10_FALLBACK_COLORS_CSS } from './ftr10-default-colors';

/**
 * MPAE consumes the FTR10 Codex / Architect design tokens (--ftr10-*) so its
 * markdown preview is themed by the same palette as the rest of the workbench.
 *
 * The live tokens live at `~/.ftr10/css.files/colors.css` (written at runtime by
 * the Architect theme engine). If that file exists we read it so the preview
 * tracks the user's current theme. If it is absent (Architect not installed, or a
 * fresh machine) we fall back to a bundled snapshot so the preview still renders
 * fully themed. A node-FS helper is used here because config-helper's FileSystemApi
 * is the *workspace* FS, not the user's home directory.
 */
async function getFtr10ColorsCss(): Promise<string> {
  const colorsCssPath = path.join(os.homedir(), '.ftr10', 'css.files', 'colors.css');
  try {
    await fs.promises.access(colorsCssPath, fs.constants.R_OK);
    return (await fs.promises.readFile(colorsCssPath, 'utf-8')).trim();
  } catch (_) {
    // Architect not present (or no palette yet) → graceful bundled default.
    return FTR10_FALLBACK_COLORS_CSS;
  }
}

/**
 * Load the configs from the given directory path.
 * If the directory does not exist and `createDirectoryIfNotExists` is `true`, create it and return the default configs.
 */
export async function loadConfigsInDirectory(
  directoryPath: string,
  fileSystem: FileSystemApi,
  createDirectoryIfNotExists: boolean = false,
): Promise<Partial<NotebookConfig>> {
  const defaultConfig = getDefaultNotebookConfig();
  let loadedConfig: Partial<NotebookConfig> = {
    globalCss: defaultConfig.globalCss,
    includeInHeader: defaultConfig.includeInHeader,
    mermaidConfig: defaultConfig.mermaidConfig,
    mathjaxConfig: defaultConfig.mathjaxConfig,
    katexConfig: defaultConfig.katexConfig,
    parserConfig: defaultConfig.parserConfig,
  };

  if (createDirectoryIfNotExists) {
    await fileSystem.mkdir(directoryPath);
  }

  if (await fileSystem.exists(directoryPath)) {
    loadedConfig.globalCss = await getGlobalStyles(directoryPath, fileSystem);
    loadedConfig.parserConfig = await getParserConfig(
      directoryPath,
      fileSystem,
    );
    loadedConfig.includeInHeader = await getHeaderIncludes(
      directoryPath,
      fileSystem,
    );
    loadedConfig = {
      ...loadedConfig,
      ...(await getConfigs(directoryPath, fileSystem)),
    };
  }
  return loadedConfig;
}

async function getGlobalStyles(configPath: string, fs: FileSystemApi) {
  // 1) FTR10 design tokens, live from Architect if installed, else bundled fallback.
  let ftr10Css = '';
  try {
    ftr10Css = await getFtr10ColorsCss();
  } catch (_) {
    ftr10Css = FTR10_FALLBACK_COLORS_CSS;
  }

  // 2) Legacy crossnote user-style (style.less) — still honored as a user override layer.
  const globalLessPath = path.join(configPath, './style.less');
  let userStyleCss = '';
  try {
    const fileContent = await fs.readFile(globalLessPath);
    userStyleCss = await new Promise<string>((resolve) => {
      less.render(fileContent, { paths: [path.dirname(globalLessPath)] }, (error, output) => {
        if (error) {
          resolve(`html body:before {
            content: "Failed to compile \`style.less\`. ${error}" !important;
            padding: 2em !important;
          }
          .crossnote.crossnote { display: none !important; }`);
        } else {
          resolve(output?.css || '');
        }
      });
    });
  } catch (_) {
    // style.less does not exist yet — seed it so users can customize (legacy behaviour).
    const seed = `
/* Please visit the URL below for more information: */
/*   https://shd101wyy.github.io/markdown-preview-enhanced/#/customize-css */

.markdown-preview.markdown-preview {
  // modify your style here
  // eg: background-color: blue;
}
`;
    try {
      await fs.writeFile(globalLessPath, seed);
    } catch (_) {
      /* non-fatal */
    }
  }

  return `${ftr10Css}\n${userStyleCss}`;
}

async function getHeaderIncludes(configPath: string, fs: FileSystemApi) {
  const headerIncludesPath = path.join(configPath, './head.html');
  let fileContent: string;
  try {
    fileContent = await fs.readFile(headerIncludesPath);
  } catch (e) {
    // create head.html file
    fileContent = `<!-- The content below will be included at the end of the <head> element. -->
<script type="text/javascript">
(function () {
  let lastHoveredCodeBlock = null;

  function getCodeBlocks() {
    return Array.from(document.querySelectorAll('pre[data-role="codeBlock"]'));
  }

  function initCodeBlockHoverTracking() {
    getCodeBlocks().forEach((codeBlock) => {
      if (codeBlock.dataset.copyCodeHoverBound) return;
      codeBlock.dataset.copyCodeHoverBound = 'true';
      codeBlock.addEventListener('mouseenter', () => {
        lastHoveredCodeBlock = codeBlock;
      });
      codeBlock.addEventListener('mouseleave', () => {
        if (lastHoveredCodeBlock === codeBlock) {
          lastHoveredCodeBlock = null;
        }
      });
    });
  }

  function copyTextToClipboard(text) {
    if (!text) return Promise.reject(new Error('No text to copy'));

    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    return new Promise((resolve, reject) => {
      try {
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (success) {
          resolve();
        } else {
          reject(new Error('execCommand copy failed'));
        }
      } catch (err) {
        document.body.removeChild(textarea);
        reject(err);
      }
    });
  }

  function copyHoveredCodeBlock() {
    const target = lastHoveredCodeBlock || getCodeBlocks()[0];
    if (!target) {
      alert('No code block found to copy. Hover a code block and try again.');
      return;
    }

    const codeText = (target.textContent || target.innerText || '').trim();
    copyTextToClipboard(codeText)
      .then(() => {
        const toast = document.createElement('div');
        toast.innerText = 'Code copied to clipboard';
        toast.style.position = 'fixed';
        toast.style.top = '1rem';
        toast.style.right = '1rem';
        toast.style.background = 'rgba(0,0,0,0.75)';
        toast.style.color = '#fff';
        toast.style.padding = '0.45rem 0.75rem';
        toast.style.borderRadius = '0.35rem';
        toast.style.zIndex = '9999';
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 1500);
      })
      .catch((err) => {
        console.warn('[MPE-copy-only] copy failed', err);
        alert('Failed to copy code. Please use the inline copy buttons if available.');
      });
  }

  function makeInlineCopyButton(codeBlock) {
    const button = document.createElement('button');
    button.className = 'btn btn-primary btn-circle btn-xs copy-code-only-inline';
    button.type = 'button';
    button.title = 'Copy code block';
    button.setAttribute('aria-label', 'Copy code block');
    button.innerHTML = '<svg viewBox="0 0 24 24" role="presentation" style="width:0.85rem;height:0.85rem;"><path d="M14.6 16.6l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4zm-5.2 0L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4z" style="fill:currentcolor;"></path></svg>';

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const codeText = (codeBlock.textContent || codeBlock.innerText || '').trim();
      copyTextToClipboard(codeText)
        .then(() => {
          const toast = document.createElement('div');
          toast.innerText = 'Code copied to clipboard';
          toast.style.position = 'fixed';
          toast.style.top = '1rem';
          toast.style.right = '1rem';
          toast.style.background = 'rgba(0,0,0,0.75)';
          toast.style.color = '#fff';
          toast.style.padding = '0.45rem 0.75rem';
          toast.style.borderRadius = '0.35rem';
          toast.style.zIndex = '9999';
          document.body.appendChild(toast);
          setTimeout(() => document.body.removeChild(toast), 1500);
        })
        .catch((err) => {
          console.warn('[MPE-copy-only] inline copy failed', err);
          alert('Failed to copy code. Please try again.');
        });
    });

    return button;
  }

  function initCodeBlockCopyButtons() {
    getCodeBlocks().forEach((codeBlock) => {
      if (codeBlock.dataset.copyCodeButtonAdded) return;
      codeBlock.dataset.copyCodeButtonAdded = 'true';

      let wrapper = codeBlock.closest('.copy-code-wrapper');
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'copy-code-wrapper';
        const parent = codeBlock.parentNode;
        parent.insertBefore(wrapper, codeBlock);
        wrapper.appendChild(codeBlock);
      }

      const button = makeInlineCopyButton(codeBlock);
      wrapper.appendChild(button);
    });
  }

  function addLineNumbersToCodeBlocks() {
    const codeBlocks = document.querySelectorAll('pre[data-role="codeBlock"] code');

    codeBlocks.forEach(codeBlock => {
      const pre = codeBlock.parentElement;
      if (!pre) return;

      const rawText = codeBlock.textContent || '';
      const normalizedText = rawText
        .replace(/^\\n/, '')
        .replace(/\\n+$/, '');
      const lines = normalizedText ? normalizedText.split('\\n') : [''];

      let lineNumbers = pre.querySelector(':scope > .mpe-line-numbers');
      if (!lineNumbers) {
        lineNumbers = document.createElement('div');
        lineNumbers.className = 'line-numbers mpe-line-numbers';
        pre.insertBefore(lineNumbers, codeBlock);
      }

      const expectedLineCount = lines.length;
      const currentLineCount = lineNumbers.children.length;
      if (currentLineCount !== expectedLineCount) {
        lineNumbers.textContent = '';
        for (let i = 1; i <= expectedLineCount; i++) {
          const lineNum = document.createElement('div');
          lineNum.className = 'line-number';
          lineNum.textContent = i;
          lineNumbers.appendChild(lineNum);
        }
      }

      pre.classList.add('mpe-has-line-numbers');
      codeBlock.style.display = 'block';
      codeBlock.style.whiteSpace = 'pre';
    });
  }

  function setupMPEExtras() {
    initCodeBlockHoverTracking();
    initCodeBlockCopyButtons();
    // Note: line-numbers for code blocks are handled server-side via Prism's
    // addLineNumbersIfNecessary (triggered by 'css line-numbers' syntax).
    // The previous addLineNumbersToCodeBlocks() ran on ALL blocks and
    // conflicted with Prism's layout, breaking syntax highlighting.
  }

  let debounceTimer = null;
  const observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(setupMPEExtras, 150);
  });

  function startObserver() {
    const root = document.body || document.documentElement;
    if (!root) return;
    try {
      observer.observe(root, { childList: true, subtree: true });
    } catch (err) {
      console.warn('[MPE-copy-only] observer init failed', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupMPEExtras();
      startObserver();
    });
  } else {
    setupMPEExtras();
    startObserver();
  }
})();
</script>`;
    await fs.writeFile(headerIncludesPath, fileContent);
  }
  return fileContent;
}

async function getConfigs(
  configPath: string,
  fs: FileSystemApi,
): Promise<Partial<NotebookConfig>> {
  const configScriptPath = path.join(configPath, './config.js');
  const setupDefaultConfigScript = async () => {
    const defaultKatexConfig = getDefaultKatexConfig();
    const defaultMathjaxConfig = getDefaultMathjaxConfig();
    const defaultMermaidConfig = getDefaultMermaidConfig();
    await fs.writeFile(
      configScriptPath,
      `({
  katexConfig: ${JSON.stringify(defaultKatexConfig, null, 2)},
  
  mathjaxConfig: ${JSON.stringify(defaultMathjaxConfig, null, 2)},
  
  mermaidConfig: ${JSON.stringify(defaultMermaidConfig, null, 2)},
})`,
    );
    return {
      katexConfig: defaultKatexConfig,
      mathjaxConfig: defaultMathjaxConfig,
      mermaidConfig: defaultMermaidConfig,
    };
  };

  if (await fs.exists(configScriptPath)) {
    try {
      // HACK: Dyamic import here doesn't work for the VSCode packaged extension.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      /*
      const result = isVSCodeWebExtension()
        ? await import(configScriptPath + `?version=${Date.now()}`)
        : (() => {
            delete require.cache[require.resolve(configScriptPath)];
            return require(configScriptPath);
          })();
      */
      // NOTE: Never mind, the above code doesn't work in VSCode Web extension

      const script = await fs.readFile(configScriptPath);
      const result = interpretJS(script);
      if (Object.keys(result ?? {}).length === 0) {
        return await setupDefaultConfigScript();
      }
      return result;
    } catch (e) {
      console.error(e);
      return {};
    }
  } else {
    return setupDefaultConfigScript();
  }
}

/**
 * Wrap user-provided parser hooks so they are called with a null-prototype
 * `this`, preventing prototype-chain escapes (e.g. `this.constructor.constructor`
 * reaching the host Function/process).
 */
function sanitizeParserConfig(
  defaultParserConfig: ParserConfig,
  result: Record<string, unknown> | undefined,
): ParserConfig {
  const safeThis = Object.create(null);
  return {
    onWillParseMarkdown:
      typeof result?.onWillParseMarkdown === 'function'
        ? (md: string) =>
            (
              result.onWillParseMarkdown as ParserConfig['onWillParseMarkdown']
            ).call(safeThis, md)
        : defaultParserConfig.onWillParseMarkdown,
    onDidParseMarkdown:
      typeof result?.onDidParseMarkdown === 'function'
        ? (html: string) =>
            (
              result.onDidParseMarkdown as ParserConfig['onDidParseMarkdown']
            ).call(safeThis, html)
        : defaultParserConfig.onDidParseMarkdown,
  };
}

async function getParserConfig(
  configPath: string,
  fs: FileSystemApi,
): Promise<ParserConfig> {
  const defaultParserConfig = getDefaultParserConfig();
  const parserConfigPath = path.join(configPath, './parser.js');
  if (await fs.exists(parserConfigPath)) {
    try {
      // HACK: Dyamic import here doesn't work for the VSCode packaged extension.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      /*
      const result = isVSCodeWebExtension()
        ? await import(parserConfigPath)
        : (() => {
            delete require.cache[require.resolve(parserConfigPath)];
            return require(parserConfigPath);
          })();
      */
      // NOTE: Never mind, the above code doesn't work in VSCode Web extension
      const script = await fs.readFile(parserConfigPath);
      const result = interpretJS(script);
      return sanitizeParserConfig(defaultParserConfig, result);
    } catch (e) {
      console.error(e);
      return defaultParserConfig;
    }
  } else {
    await fs.writeFile(
      parserConfigPath,
      `({
  // Please visit the URL below for more information:
  // https://shd101wyy.github.io/markdown-preview-enhanced/#/extend-parser

  onWillParseMarkdown: async function(markdown) {
    return markdown;
  },

  onDidParseMarkdown: async function(html) {
    return html;
  },
})`,
    );
    return defaultParserConfig;
  }
}

export function wrapNodeFSAsApi(): FileSystemApi {
  const fsPromises = fs.promises;
  return {
    readFile: async (_path: string, encoding: BufferEncoding = 'utf-8') => {
      return (await fsPromises.readFile(_path, encoding)).toString();
    },
    writeFile: async (
      _path: string,
      content: string,
      encoding: BufferEncoding = 'utf8',
    ) => {
      return await fsPromises.writeFile(_path, content, encoding);
    },
    mkdir: async (_path: string) => {
      await fsPromises.mkdir(_path, { recursive: true });
    },
    exists: async (_path: string) => {
      return fs.existsSync(_path);
    },
    stat: async (_path: string) => {
      return await fsPromises.stat(_path);
    },
    readdir: async (_path: string) => {
      return await fsPromises.readdir(_path);
    },
    unlink: async (_path: string) => {
      return await fsPromises.unlink(_path);
    },
  };
}
