/**
 * Preserve ./crossnote package sources and copy generated assets from
 * - ./crossnote/out/dependencies/. to ./crossnote/dependencies/
 * - ./crossnote/out/styles/.       to ./crossnote/styles/
 * - ./crossnote/out/webview/.      to ./crossnote/webview/
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
  // Keep local crossnote package files (package.json, src, etc.) and
  // only refresh generated asset subdirectories.
  fs.mkdirSync('./crossnote', { recursive: true });
  for (const dir of [
    './crossnote/dependencies',
    './crossnote/styles',
    './crossnote/webview',
  ]) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
    }
  }

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
