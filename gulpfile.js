/**
 * Preserve ./crossnote package sources and copy generated assets from
 * - ./crossnote/out/dependencies/. to ./crossnote/dependencies/
 * - ./crossnote/out/styles/.       to ./crossnote/styles/   (compiled CSS only; .less sources preserved)
 * - ./crossnote/out/webview/.      to ./crossnote/webview/
 */
const gulp = require('gulp');
const fs = require('fs');
const path = require('path');

gulp.task('clean-out', (cb) => {
  // Delete ./out folder
  if (fs.existsSync('./out')) {
    fs.rmSync('./out', { recursive: true });
  }
  cb();
});

/**
 * Remove all non-.less files from a directory tree so compiled CSS artifacts
 * are cleaned without touching LESS source files.
 */
function removeCompiledCss(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeCompiledCss(fullPath);
    } else if (!entry.name.endsWith('.less')) {
      fs.rmSync(fullPath);
    }
  }
}

gulp.task('copy-files', (cb) => {
  // Keep local crossnote package files (package.json, src, etc.) and
  // only refresh generated asset subdirectories.
  fs.mkdirSync('./crossnote', { recursive: true });

  // dependencies and webview are pure compiled outputs — safe to wipe and replace.
  for (const dir of ['./crossnote/dependencies', './crossnote/webview']) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
    }
  }

  // styles/ contains LESS sources (.less) alongside compiled CSS artifacts.
  // Only remove the compiled CSS artifacts so the LESS sources are preserved
  // across builds, then overlay the newly compiled CSS from out/styles/.
  removeCompiledCss('./crossnote/styles');

  // Copy files
  gulp
    .src('./crossnote/out/dependencies/**/*')
    .pipe(gulp.dest('./crossnote/dependencies/'));
  gulp
    .src('./crossnote/out/styles/**/*')
    .pipe(gulp.dest('./crossnote/styles/'));
  gulp
    .src('./crossnote/out/webview/**/*')
    .pipe(gulp.dest('./crossnote/webview/'));

  console.log('Copy files done.');

  cb();
});
