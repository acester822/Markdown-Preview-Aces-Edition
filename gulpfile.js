/**
 * Copy generated assets from crossnote/out/ into crossnote/:
 * - crossnote/out/dependencies/ → crossnote/dependencies/
 * - crossnote/out/webview/      → crossnote/webview/
 * - crossnote/out/styles/       → crossnote/styles/  (merges compiled CSS alongside .less sources)
 *
 * NOTE: The crossnote runtime resolves styles via getCrossnoteBuildDirectory() which is set to
 * the crossnote/ package root. It then loads ./styles/preview.css, ./styles/style-template.css,
 * ./styles/preview_theme/*.css etc. directly from crossnote/styles/. The compiled CSS must
 * therefore exist there as well as in crossnote/out/styles/. The .less source files coexist
 * safely in crossnote/styles/ — gulp dest merges and never deletes existing files.
 */
const gulp = require('gulp');
const fs = require('fs');

gulp.task('clean-out', (cb) => {
  // Delete ./out folder
  if (fs.existsSync('./out')) {
    fs.rmSync('./out', { recursive: true });
  }
  cb();
});

gulp.task('copy-files', (cb) => {
  fs.mkdirSync('./crossnote', { recursive: true });

  // dependencies and webview are pure compiled outputs — safe to wipe and replace.
  for (const dir of ['./crossnote/dependencies', './crossnote/webview']) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
    }
  }

  // Copy compiled assets
  gulp
    .src('./crossnote/out/dependencies/**/*')
    .pipe(gulp.dest('./crossnote/dependencies/'));
  gulp
    .src('./crossnote/out/webview/**/*')
    .pipe(gulp.dest('./crossnote/webview/'));
  // Merge compiled CSS into crossnote/styles/ so the runtime can find them.
  // Existing .less source files are preserved (gulp dest does not delete).
  gulp
    .src('./crossnote/out/styles/**/*')
    .pipe(gulp.dest('./crossnote/styles/'));

  console.log('Copy files done.');

  cb();
});
