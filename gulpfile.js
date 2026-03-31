/**
 * Preserve ./crossnote package sources and copy generated assets from
 * - ./crossnote/out/dependencies/. to ./crossnote/dependencies/
 * - ./crossnote/out/webview/.      to ./crossnote/webview/
 *
 * NOTE: styles are NOT copied. The crossnote runtime resolves styles as
 * ./styles/ relative to out/cjs/, i.e. crossnote/out/styles/. The source
 * directory crossnote/styles/ contains only .less sources and is not used
 * at runtime. Compiled CSS lives exclusively in crossnote/out/styles/.
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
  // Keep local crossnote package files (package.json, src, styles/*.less, etc.)
  // and only refresh the generated asset subdirectories that the runtime reads
  // from crossnote/ (not out/).
  fs.mkdirSync('./crossnote', { recursive: true });

  // dependencies and webview are pure compiled outputs — safe to wipe and replace.
  for (const dir of ['./crossnote/dependencies', './crossnote/webview']) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
    }
  }

  // Copy files
  gulp
    .src('./crossnote/out/dependencies/**/*')
    .pipe(gulp.dest('./crossnote/dependencies/'));
  gulp
    .src('./crossnote/out/webview/**/*')
    .pipe(gulp.dest('./crossnote/webview/'));

  console.log('Copy files done.');

  cb();
});
