const { src, dest, watch, series, parallel } = require('gulp');
const del = require('del');
const sass = require('gulp-sass')(require('sass'));
const browserSync = require('browser-sync').create();
const sourcemaps = require('gulp-sourcemaps');
const sassGlob = require('gulp-sass-glob');
const autoprefixer = require('gulp-autoprefixer');
const pxtorem = require('gulp-pxtorem');
const gcmq = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-clean-css');
const pug = require('gulp-pug');
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const gulpif = require('gulp-if');
const env = process.env.NODE_ENV
const sassLint = require('gulp-sass-lint');

const { DIST_PATH, DIST_PATH_CSS, DIST_PATH_JS, DIST_PATH_IMAGES, SRC_PATH, SRC_PATH_ASSETS, SRC_PATH_STYLE, SRC_PATH_SCRIPT, PLUGINS_FILES } = require('./gulp.config');

const clean = () => {
  return del(DIST_PATH);
}

const styles = () => {
  return src(`${SRC_PATH_STYLE}*.scss`)
    .pipe(gulpif(env === 'serve', sourcemaps.init()))
    .pipe(sassGlob())
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpif(env === 'build', autoprefixer({
      cascade: false
    })))
    .pipe(gulpif(env === 'build', pxtorem()))
    .pipe(gulpif(env === 'build', gcmq()))
    .pipe(gulpif(env === 'build', cleanCSS()))
    .pipe(gulpif(env === 'serve', sourcemaps.write()))
    .pipe(dest(DIST_PATH_CSS))
    .pipe(gulpif(env === 'serve', browserSync.stream()));
}

const lint = () => {
  return src('src/**/*.s+(a|c)ss')
    .pipe(sassLint({
      configFile: ".sass-lint.yml"
    }))
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError())
}

const scripts = () => {
  return src(`${SRC_PATH_SCRIPT}*.js`)
    .pipe(gulpif(env === 'serve', sourcemaps.init()))
    .pipe(concat('main.js', { newLine: ';' }))
    .pipe(gulpif(env === 'build', babel({
      presets: ['@babel/env']
    })))
    .pipe(gulpif(env === 'serve', sourcemaps.write()))
    .pipe(dest(DIST_PATH_JS))
    .pipe(gulpif(env === 'serve', browserSync.stream()));
}

const plugins = () => {
  return src(PLUGINS_FILES)
    .pipe(dest(`${DIST_PATH}vendor/`))
    .pipe(gulpif(env === 'serve', browserSync.stream()));
}

const compilePug = () => {
  return src(`${SRC_PATH}pages/*.pug`)
    .pipe(pug({
      pretty: true,
    }))
    .pipe(dest(DIST_PATH))
    .pipe(gulpif(env === 'serve', browserSync.stream()));
}

const copyAssets = () => {
  return src(`${SRC_PATH_ASSETS}`)
    .pipe(dest(DIST_PATH_IMAGES))
    .pipe(gulpif(env === 'serve', browserSync.stream()));
}

const watchers = (done) => {
  watch(`${SRC_PATH_STYLE}**/*.scss`, series(lint, styles));
  watch(`${SRC_PATH_ASSETS}**/*.*`, series(copyAssets));
  watch(`${SRC_PATH}**/*.pug`, series(compilePug));
  watch(`${SRC_PATH_SCRIPT}**/*.js`, series(scripts));
  done();
}

const server = (done) => {
  browserSync.init({
    server: {
      baseDir: DIST_PATH
    },
    open: false
  });
  done();
};

const build = series(
  clean,
  parallel(
    plugins,
    copyAssets,
    scripts,
    lint,
    styles,
    compilePug
  )
);

const dev = series(
  build,
  parallel(server, watchers)
);

exports.default = dev;
exports.build = build;