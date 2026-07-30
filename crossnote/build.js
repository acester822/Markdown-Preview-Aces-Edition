const fs = require('fs');
const { context, build } = require('esbuild');

function copyDir(src, dest) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

const { dependencies, devDependencies } = require('./package.json');
const path = require('path');
const { tailwindPlugin } = require('esbuild-plugin-tailwindcss');

/**
 * @type {import('esbuild').BuildOptions}
 */
const sharedConfig = {
  entryPoints: ['./src/index.ts'],
  bundle: true,
  minify: true,
  // sourcemap: true,
  external: [
    'fs',
    'path',
    'child_process',
    'os',
    'vm',
    'stream',
    'node:fs/promises',
    'url',
    // === from package.json
    ...Object.keys(dependencies),
    ...Object.keys(devDependencies),
  ],
};

/**
 * @type {import('esbuild').BuildOptions}
 */
const cjsConfig = {
  ...sharedConfig,
  platform: 'node', // For CJS
  outfile: './out/cjs/index.cjs',
  target: 'node16',
};

/**
 * @type {import('esbuild').BuildOptions}
 */
const esmConfig = {
  ...sharedConfig,
  // TODO: Support browser
  platform: 'neutral', // For ESM
  outfile: './out/esm/index.mjs',
};

/**
 * @type {import('esbuild').BuildOptions}
 */
const webviewConfig = {
  entryPoints: ['./src/webview/preview.tsx', './src/webview/backlinks.tsx'],
  bundle: true,
  minify: true,
  platform: 'browser',
  // outfile: './out/webview/index.js',
  outdir: './out/webview',
  loader: {
    '.png': 'dataurl',
    '.woff': 'dataurl',
    '.woff2': 'dataurl',
    '.eot': 'dataurl',
    '.ttf': 'dataurl',
    '.svg': 'dataurl',
  },
  plugins: [tailwindPlugin({})],
};

async function main() {
  try {
    if (process.argv.includes('--watch')) {
      // CommonJS
      const cjsContext = await context({
        ...cjsConfig,
        sourcemap: true,
      });

      // ESM
      const esmContext = await context({
        ...esmConfig,
        sourcemap: true,
      });

      // Webview
      const webviewContext = await context({
        ...webviewConfig,
        sourcemap: true,
      });

      await Promise.all([
        cjsContext.watch(),
        esmContext.watch(),
        webviewContext.watch(),
      ]);
    } else {
      // CommonJS
      await build(cjsConfig);

      // ESM
      await build(esmConfig);

      // Webview
      await build(webviewConfig);

      // Copy the prebuilt Excalidraw stylesheet next to the bundled webview
      // so the preview HTML can <link> it. esbuild can't resolve the
      // "@excalidraw/excalidraw/index.css" subpath export, and we don't want
      // to bundle 150KB of CSS into the JS, so we ship it as a static file and
      // inject a <link> from the markdown engine's HTML template.
      const excalidrawCssSrc =
        './node_modules/@excalidraw/excalidraw/dist/prod/index.css';
      const excalidrawCssDest = './out/webview/excalidraw.css';
      const excalidrawFontsSrc =
        './node_modules/@excalidraw/excalidraw/dist/prod/fonts';
      const excalidrawFontsDest = './out/webview/fonts';
      try {
        if (fs.existsSync(excalidrawCssSrc)) {
          fs.mkdirSync(path.dirname(excalidrawCssDest), { recursive: true });
          fs.copyFileSync(excalidrawCssSrc, excalidrawCssDest);
          // The Excalidraw CSS references its fonts via relative
          // url(./fonts/...). Those font files ship under the package's
          // dist/prod/fonts directory, so copy the whole tree next to the
          // CSS; otherwise the preview logs 404s for Assistant-*.woff2 etc.
          if (fs.existsSync(excalidrawFontsSrc)) {
            fs.mkdirSync(excalidrawFontsDest, { recursive: true });
            copyDir(excalidrawFontsSrc, excalidrawFontsDest);
            console.log('Copied Excalidraw fonts ->', excalidrawFontsDest);
          } else {
            console.warn('Excalidraw fonts not found at', excalidrawFontsSrc);
          }
          console.log('Copied Excalidraw CSS ->', excalidrawCssDest);
        } else {
          console.warn('Excalidraw CSS not found at', excalidrawCssSrc);
        }
      } catch (cssErr) {
        console.error('Failed to copy Excalidraw assets:', cssErr);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

main();
