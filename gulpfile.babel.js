'use strict'

import del from 'del'
import gulp from 'gulp'
import gulplog from './node_modules/gulplog'
import plumber from 'gulp-plumber'
import notify from 'gulp-notify'
import pug from 'gulp-pug'
import less from 'gulp-less'
import LessAutoPrefix from 'less-plugin-autoprefix'
import LessPluginCleanCSS from 'less-plugin-clean-css'
import browserSync from 'browser-sync'
import webpackStream from 'webpack-stream'
import named from 'vinyl-named'
// config files
import framework7 from './framework7/gulp.config'

const plumberOptions = {
  errorHandler: notify.onError()
}
const develop = true

const clean = () => del('./build')

export const styles = () => {
  let autoPrefix = new LessAutoPrefix({
    browsers: [
      '> 1%',
      'last 2 versions',
      'Firefox ESR',
      'Opera 12.1'
    ]
  })

  let plugins = [autoPrefix]

  let params = {
    since: gulp.lastRun('styles')
  }

  if (!develop) {
    let cleanCSS = new LessPluginCleanCSS({
      advanced: true
    })
    plugins.push(cleanCSS)
  }

  return gulp.src('./src/styles/*.less', params)
    .pipe(plumber(plumberOptions))
    .pipe(less({
      paths: ['node_modules'],
      plugins: plugins
    }))
    .pipe(gulp.dest('./build/css'))
}

export const views = () => {
  let params = {
    since: gulp.lastRun('views')
  }

  return gulp.src('./src/views/*.pug', params)
    .pipe(plumber(plumberOptions))
    .pipe(pug({
      pretty: develop,
      data: {
        dev: develop
      }
    }))
    .pipe(gulp.dest('./build'))
}

const webpack = (cb) => {
  let wp = webpackStream.webpack
  let firstBuildReady = false
  let NoErrorsPlugin = wp.NoErrorsPlugin
  let Uglify = wp.optimize.UglifyJsPlugin
  let DefinePlugin = wp.DefinePlugin

  function done (err, stats) {
    firstBuildReady = true

    if (err) {
      return
    }

    gulplog[stats.hasErrors() ? 'error' : 'info'](stats.toString({
      colors: true
    }))
  }

  // тут нужно учитывать сборку под разные оси, и использовать полифилы
  // например в коде я использую Promise, для андроида нужно загрузить полифил (наверное, практика покажет)
  let options = {
    watch: develop,

    output: {
      library: 'uwa'
    },

    module: {
      loaders: [{
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015', 'stage-0']
        }
      }]
    },

    plugins: [
      new NoErrorsPlugin(),
      new DefinePlugin({
        buildConfig: JSON.stringify({
          // host: 'http://cafeassorti.ru',
          // folder: '/mobile'
        })
      })
    ]
  }

  if (!develop) {
    options.plugins.push(new Uglify())
  }

  return gulp.src(['./src/scripts/main.js'])
    .pipe(plumber(plumberOptions))
    .pipe(named())
    .pipe(webpackStream(options, null, done))
    .pipe(gulp.dest('./build/js'))
    .on('data', function () {
      if (firstBuildReady) {
        cb()
      }
    })
}

const watch = () => {
  gulp.watch('./src/views/**/*.pug', views)
  gulp.watch('./src/styles/**/*.less', styles)
}

const serve = () => {
  let params = {
    server: './build'
  }

  browserSync
    .init(params)
    .watch('./build/**/*.*')
    .on('change', browserSync.reload)
}

const vendor = gulp.series(
  framework7,
  function copyJS () {
    let paths = [
      './framework7/dist/js/framework7.min.js',
      './framework7/dist/js/framework7.min.js.map'
    ]

    if (develop) {
      paths.push('./framework7/dist/js/framework7.js')
      paths.push('./framework7/dist/js/framework7.js.map')
    }

    return gulp.src(paths)
      .pipe(gulp.dest('./build/framework7/js'))
  },
  function copyCSS () {
    return gulp.src('./framework7/dist/css/framework7.material.min.css')
      .pipe(gulp.dest('./build/framework7/css'))
  }
)

export const build = gulp.series(
  vendor,
  gulp.parallel(views, styles)
)

export default gulp.series(
  clean,
  build,
  gulp.parallel(serve, watch, webpack)
)
