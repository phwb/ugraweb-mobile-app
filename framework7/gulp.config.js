'use strict'

import del from 'del'
import gulp from 'gulp'
import tap from 'gulp-tap'
import fs from 'fs'
import header from 'gulp-header'
import concat from 'gulp-concat'
import sourcemaps from 'gulp-sourcemaps'
import less from 'gulp-less'
import path from 'path'
import uglify from 'gulp-uglify'
import rename from 'gulp-rename'
import cleanCSS from 'gulp-clean-css'

const f7 = {
  filename: 'framework7',
  jsFiles: [
    'framework7/src/js/wrap-start.js',
    'framework7/src/js/f7-intro.js',
    'framework7/src/js/views.js',
    'framework7/src/js/navbars.js',
    'framework7/src/js/searchbar.js',
    'framework7/src/js/messagebar.js',
    'framework7/src/js/xhr.js',
    'framework7/src/js/pages.js',
    'framework7/src/js/router.js',
    'framework7/src/js/modals.js',
    'framework7/src/js/progressbar.js',
    'framework7/src/js/panels.js',
    'framework7/src/js/lazy-load.js',
    'framework7/src/js/material-preloader.js',
    'framework7/src/js/messages.js',
    'framework7/src/js/swipeout.js',
    'framework7/src/js/sortable.js',
    'framework7/src/js/smart-select.js',
    'framework7/src/js/virtual-list.js',
    'framework7/src/js/pull-to-refresh.js',
    'framework7/src/js/infinite-scroll.js',
    'framework7/src/js/scroll-toolbars.js',
    'framework7/src/js/material-tabbar.js',
    'framework7/src/js/tabs.js',
    'framework7/src/js/accordion.js',
    'framework7/src/js/fast-clicks.js',
    'framework7/src/js/clicks.js',
    'framework7/src/js/resize.js',
    'framework7/src/js/forms-storage.js',
    'framework7/src/js/forms-ajax.js',
    'framework7/src/js/forms-textarea.js',
    'framework7/src/js/material-inputs.js',
    'framework7/src/js/push-state.js',
    'framework7/src/js/swiper-init.js',
    'framework7/src/js/photo-browser.js',
    'framework7/src/js/autocomplete.js',
    'framework7/src/js/picker.js',
    'framework7/src/js/calendar.js',
    'framework7/src/js/notifications.js',
    'framework7/src/js/template7-templates.js',
    'framework7/src/js/plugins.js',
    'framework7/src/js/init.js',
    'framework7/src/js/f7-outro.js',
    'framework7/src/js/dom7-intro.js',
    'framework7/src/js/dom7-methods.js',
    'framework7/src/js/dom7-ajax.js',
    'framework7/src/js/dom7-utils.js',
    'framework7/src/js/dom7-outro.js',
    'framework7/src/js/proto-support.js',
    'framework7/src/js/proto-device.js',
    'framework7/src/js/proto-plugins.js',
    'framework7/src/js/template7.js',
    'framework7/src/js/swiper.js',
    'framework7/src/js/wrap-end.js'
  ],
  pkg: {
    name: 'Framework7',
    version: '1.4.2',
    description: 'Full Featured Mobile HTML Framework For Building iOS & Android Apps',
    homepage: 'http://www.idangero.us/framework7',
    author: 'Vladimir Kharlampidi',
    license: ['MIT']
  },
  banner: [
    '/**',
    ' * <%= pkg.name %> <%= pkg.version %>',
    ' * <%= pkg.description %>',
    '<% if(typeof(theme) !== "undefined") {%> * \n * <%= theme %>\n *<% } else { %> * <% } %>',
    // ' * ',
    ' * <%= pkg.homepage %>',
    ' * ',
    ' * Copyright <%= date.year %>, <%= pkg.author %>',
    ' * The iDangero.us',
    ' * http://www.idangero.us/',
    ' * ',
    ' * Licensed under <%= pkg.license.join(" & ") %>',
    ' * ',
    ' * Released on: <%= date.month %> <%= date.day %>, <%= date.year %>',
    ' */',
    ''].join('\n'),
  customBanner: [
    '/**',
    ' * <%= pkg.name %> <%= pkg.version %> - Custom Build',
    ' * <%= pkg.description %>',
    '<% if(typeof(theme) !== "undefined") {%> * \n * <%= theme %>\n *<% } else { %> * <% } %>',
    ' * ',
    ' * Included modules: <%= modulesList %>',
    ' * ',
    ' * <%= pkg.homepage %>',
    ' * ',
    ' * Copyright <%= date.year %>, <%= pkg.author %>',
    ' * The iDangero.us',
    ' * http://www.idangero.us/',
    ' * ',
    ' * Licensed under <%= pkg.license.join(" & ") %>',
    ' * ',
    ' * Released on: <%= date.month %> <%= date.day %>, <%= date.year %>',
    ' */',
    ''].join('\n'),
  date: {
    year: new Date().getFullYear(),
    month: ('January February March April May June July August September October November December').split(' ')[new Date().getMonth()],
    day: new Date().getDate()
  }
}
const paths = {
  root: './',
  build: {
    root: 'framework7/build/',
    styles: 'framework7/build/css/',
    scripts: 'framework7/build/js/'
  },
  custom: {
    root: 'framework7/custom/',
    styles: 'framework7/custom/css/',
    scripts: 'framework7/custom/js/'
  },
  dist: {
    root: 'framework7/dist/',
    styles: 'framework7/dist/css/',
    scripts: 'framework7/dist/js/'
  },
  source: {
    root: 'framework7/src/',
    styles: {
      ios: 'framework7/src/less/ios/',
      material: 'framework7/src/less/material/'
    },
    scripts: 'framework7/src/js/*.js'
  },
  examples: {
    root: 'framework7/examples/',
    list: ['inline-pages', 'split-view', 'split-view-panel', 'tab-bar', 'template7-pages']
  }
}

const cleanF7 = () => del(['./framework7/build', './framework7/dist'])

function addJSIndent (file) {
  let addIndent = '        '
  let filename = file.path.split('framework7/src/js/')[1]
  if (filename === 'wrap-start.js' || filename === 'wrap-end.js') {
    addIndent = ''
  }
  let add4spaces = ('f7-intro.js f7-outro.js proto-device.js proto-plugins.js proto-support.js dom7-intro.js dom7-outro.js template7.js swiper.js').split(' ')
  if (add4spaces.indexOf(filename) >= 0) {
    addIndent = '    '
  }
  let add8spaces = ('dom7-methods.js dom7-ajax.js dom7-utils.js').split(' ')
  if (add8spaces.indexOf(filename) >= 0) {
    addIndent = '        '
  }
  if (addIndent !== '') {
    let fileLines = fs.readFileSync(file.path).toString().split('\n')
    let newFileContents = ''
    for (let i = 0; i < fileLines.length; i++) {
      newFileContents += addIndent + fileLines[i] + (i === fileLines.length ? '' : '\n')
    }
    file.contents = new Buffer(newFileContents)
  }
}

const scripts = () => gulp.src(f7.jsFiles)
  .pipe(tap(function (file, t) {
    addJSIndent (file, t)
  }))
  .pipe(sourcemaps.init())
  .pipe(concat(f7.filename + '.js'))
  .pipe(header(f7.banner, {
    pkg: f7.pkg,
    date: f7.date
  }))
  .pipe(sourcemaps.write('./'))
  .pipe(gulp.dest(paths.build.scripts))

const ios = (cb) => {
  let cbs = 0;
  ['framework7.ios.less', 'framework7.ios.rtl.less', 'framework7.ios.colors.less'].forEach(function (lessFilePath) {
    lessFilePath = paths.source.styles.ios + lessFilePath
    gulp.src([lessFilePath])
      .pipe(less({
        paths: [ path.join(__dirname, 'less', 'includes') ]
      }))
      .pipe(header(f7.banner, {
        pkg: f7.pkg,
        date: f7.date,
        theme: 'iOS Theme'
      }))
      .pipe(gulp.dest(paths.build.styles))
      .on('end', function () {
        cbs += 1
        if (cbs === 3) {
          cb()
        }
      })
  })
}

const material = (cb) => {
  let cbs = 0;
  ['framework7.material.less', 'framework7.material.rtl.less', 'framework7.material.colors.less'].forEach(function (lessFilePath) {
    lessFilePath = paths.source.styles.material + lessFilePath
    gulp.src([lessFilePath])
      .pipe(less({
        paths: [ path.join(__dirname, 'less', 'includes') ]
      }))
      .pipe(header(f7.banner, {
        pkg: f7.pkg,
        date: f7.date,
        theme: 'Google Material Theme'
      }))
      .pipe(gulp.dest(paths.build.styles))
      .on('end', function () {
        cbs += 1
        if (cbs === 3) {
          cb()
        }
      })
  })
}

const copyBuild = () => gulp.src([paths.build.root + '**/*.*'])
  .pipe(gulp.dest(paths.dist.root))

const minifyJS = () => gulp.src([paths.dist.scripts + f7.filename + '.js'])
  .pipe(sourcemaps.init())
  .pipe(uglify())
  .pipe(header(f7.banner, {
    pkg: f7.pkg,
    date: f7.date
  }))
  .pipe(rename(function (path) {
    path.basename = f7.filename + '.min'
  }))
  .pipe(sourcemaps.write('./'))
  .pipe(gulp.dest(paths.dist.scripts))

const minifiedCSS = [
  paths.dist.styles + f7.filename + '.ios.css',
  paths.dist.styles + f7.filename + '.ios.rtl.css',
  paths.dist.styles + f7.filename + '.ios.colors.css',
  paths.dist.styles + f7.filename + '.material.css',
  paths.dist.styles + f7.filename + '.material.rtl.css',
  paths.dist.styles + f7.filename + '.material.colors.css'
]
const minifyCSS = () => gulp.src(minifiedCSS)
  .pipe(cleanCSS({
    advanced: false,
    aggressiveMerging: false
  }))
  .pipe(header(f7.banner, {
    pkg: f7.pkg,
    date: f7.date
  }))
  .pipe(rename(function (path) {
    path.basename = path.basename + '.min'
  }))
  .pipe(gulp.dest(paths.dist.styles))

const dist = gulp.series(
  copyBuild,
  gulp.parallel(minifyJS, minifyCSS)
)

const build = gulp.parallel(scripts, ios, material)

export default gulp.series(
  cleanF7,
  build,
  dist
)
