import del from 'del'
import gulp from 'gulp'
import gulplog from './node_modules/gulplog'
import util from './node_modules/gulp-util'
import rename from 'gulp-rename'
import plumber from 'gulp-plumber'
import notify from 'gulp-notify'
import pug from 'gulp-pug'
import less from 'gulp-less'
import LessAutoPrefix from 'less-plugin-autoprefix'
import LessPluginCleanCSS from 'less-plugin-clean-css'
import browserSync from 'browser-sync'
import webpackStream, { webpack as wp } from 'webpack-stream'
import named from 'vinyl-named'
// config files
import framework7 from './framework7/gulp.config'

const plumberOptions = {
  errorHandler: notify.onError()
}

const {
  env = 'development',
  host = 'http://localhost',
  platform = 'android'
} = util.env

const path = {
  development: './build',
  cordova: './cordova/www'
}

const develop = env === 'development'

const clean = () => del(path[env])

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
    .pipe(gulp.dest(`${path[env]}/css`))
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
        dev: develop,
        cordova: env === 'cordova'
      }
    }))
    .pipe(gulp.dest(path[env]))
}

const webpack = (cb) => {
  let firstBuildReady = false
  const { NoErrorsPlugin, DefinePlugin } = wp

  function done (err, stats) {
    firstBuildReady = true

    if (err) {
      return
    }

    gulplog[stats.hasErrors() ? 'error' : 'info'](stats.toString({
      colors: true
    }))
  }

  const options = {
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
          host: host,
          debug: develop
        })
      })
    ]
  }

  if (!develop) {
    const { UglifyJsPlugin } = wp.optimize
    options.plugins.push(new UglifyJsPlugin())
  }

  return gulp.src(['./src/scripts/main.js'])
    .pipe(plumber(plumberOptions))
    .pipe(named())
    .pipe(webpackStream(options, null, done))
    .pipe(gulp.dest(`${path[env]}/js`))
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

export const serve = () => {
  let params = {
    server: path.development
  }

  browserSync
    .init(params)
    .watch(`${path.development}/**/*.*`)
    .on('change', browserSync.reload)
}

const vendor = gulp.series(
  framework7,
  function copyJS () {
    let paths = [
      './framework7/dist/js/framework7.min.js'
    ]

    if (develop) {
      paths.push('./framework7/dist/js/framework7.js')
      paths.push('./framework7/dist/js/framework7.js.map')
    }

    return gulp.src(paths)
      .pipe(gulp.dest(`${path[env]}/framework7/js`))
  },
  function copyCSS () {
    return gulp.src('./framework7/dist/css/framework7.material.min.css')
      .pipe(gulp.dest(`${path[env]}/framework7/css`))
  }
)

export const build = gulp.series(
  vendor,
  gulp.parallel(views, styles)
)

export const config = () => gulp.src(`./src/assets/config.pug`)
  .pipe(plumber(plumberOptions))
  .pipe(pug({
    pretty: true
  }))
  .pipe(rename({
    extname: '.xml'
  }))
  .pipe(gulp.dest(`${path.cordova}/..`))

export const assets = gulp.series(
  function clearResources () {
    return del(`${path[env]}/../resources`)
  },
  function copyResources () {
    return gulp.src(`./src/assets/resources/**/*`)
      .pipe(gulp.dest(`${path[env]}/../resources`))
  }
)

export const dist = gulp.series(
  clean,
  function cleanConfig () {
    return del(`${path.cordova}/../config.xml`)
  },
  config,
  assets,
  build,
  webpack
)

export default gulp.series(
  clean,
  build,
  gulp.parallel(serve, watch, webpack)
)
