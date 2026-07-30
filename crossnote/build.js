const fs = require('fs');
const { context, build } = require('esbuild');
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
      try {
        if (fs.existsSync(excalidrawCssSrc)) {
          fs.mkdirSync(path.dirname(excalidrawCssDest), { recursive: true });
          fs.copyFileSync(excalidrawCssSrc, excalidrawCssDest);
          console.log('Copied Excalidraw CSS ->', excalidrawCssDest);
        } else {
          console.warn('Excalidraw CSS not found at', excalidrawCssSrc);
        }
      } catch (cssErr) {
        console.error('Failed to copy Excalidraw CSS:', cssErr);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

main();
