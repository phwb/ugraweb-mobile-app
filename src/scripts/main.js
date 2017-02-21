/**
 * @namespace window.cordova
 *
 * @namespace {object} navigator.splashscreen
 * @property {function} navigator.splashscreen.hide() скрыть splashscreen
 * @property {function} navigator.splashscreen.show() показать splashscreen
 *
 * @namespace {object} navigator.notification
 * @property {function} navigator.notification.alert
 * @see https://github.com/apache/cordova-plugin-dialogs#navigatornotificationalert
 * @property {function} navigator.notification.confirm
 * @see https://github.com/apache/cordova-plugin-dialogs#navigatornotificationconfirm
 *
 * @namespace {object} navigator.app
 * @property {function} navigator.app.exitApp выход из приложения
 */
import { getStyle, getScript } from './ajax/resource'
import Deferred from './utils/deferred'
import config from './config'

const $ = Dom7

const urls = {
  entry: config.host + config.folder + '/',
  menu: config.host + config.folder + '/menu.php',
  config: config.host + config.folder + '/config.php'
}

const loadCSS = (urls = []) => urls.length > 0
  ? Promise.all(urls.map(getStyle))
  : Promise.resolve()

const loadJS = (urls = []) => urls.length > 0
  ? Promise.all(urls.map(getScript))
  : Promise.resolve()

const loadPage = (url) => new Promise((resolve, reject) => {
  $.ajax({
    url,
    timeout: 30000,
    complete: function (xhr) {
      let {status, responseText} = xhr
      if ((status >= 200 && status < 300) || status === 0) {
        return resolve(responseText)
      }

      return reject(responseText)
    },
    error: function (...args) {
      reject(...args)
    }
  })
})

const loadConfig = () => new Promise((resolve, reject) => {
  $.ajax({
    url: urls.config,
    dataType: 'json',
    timeout: 30000,
    success: function (data) {
      resolve(data)
    },
    error: function (...args) {
      reject(...args)
    }
  })
})

let ready = new Deferred()
let serverConfig
let app
let view
let indexHtml
const event = window.cordova
  ? 'deviceready'
  : 'DOMContentLoaded'

let alert = function () {}
let confirm = function () {}

const init = () => {
  // TODO нужно как то создать исключения и протестировать все catch, точнее придумать поведение для приложения
  loadConfig()
    .then(({js = [], css = []}) => {
      serverConfig = {js, css}
    })
    // загружаем сначала CSS
    .then(() => loadCSS(serverConfig.css))
    // загружаем индексную страницу
    .then(() => loadPage(urls.entry))
    .then(html => {
      indexHtml = html
      $('.views').html(html)
    })
    // загружаем меню, тут catch не нужнен, потому что меню по факту может и не быть
    .then(() => loadPage(urls.menu))
    .then(html => $('.panel').html(html))
    // создаем инстанс приложения
    .then(() => {
      app = new Framework7({
        init: false,
        material: true
      })
    })
    // добавляем в кеш индексную страницу
    .then(() => {
      if (app.params.cache) {
        app.removeFromCache(urls.entry)
        app.cache.push({
          url: urls.entry,
          time: Date.now(),
          content: indexHtml
        })
      }
    })
    // только после загрузки CSS и получение контента подгружаем JS
    .then(() => loadJS(serverConfig.js))
    // инициализируем приложение
    .then(() => {
      $(document).on('ajaxStart', app.showIndicator)
      $(document).on('ajaxComplete', app.hideIndicator)

      // TODO разобраться почему так, протестировать на другом приложении
      // хак только для андроида версии 5.1.1
      $(document).on('pageAfterAnimation', e => {
        let container = e.detail.page.container
        container.style.overflow = 'auto'
      })

      app.init()
      view = app.addView('.view-main', {
        // ложим в history правильный начальный урл
        url: urls.entry
      })
    })
    .then(() => {
      navigator.splashscreen.hide()

      alert = (message, title = 'Внимание!', button = 'OK') => new Promise(
        resolve => navigator.notification.alert(
          message,
          resolve,
          title,
          button
        )
      )

      confirm = (message, title = 'Внимание!', labels = ['OK', 'Отмена']) => new Promise(
        (resolve, reject) => navigator.notification.confirm(
          message,
          index => {
            switch (index) {
              case 1:
                return resolve()
              default:
                return reject()
            }
          },
          title,
          labels
        )
      )

      ready.resolve()
    })
    // один глобальный catch, можно конечно сделать после кадой загрузки, но пока не вижу в этом смысла
    // если возникла какая то ошибка при загрузке приложения, то это скорее всего отсутствие интернета
    // в таком случае просто выйти из приложения
    .catch(() => navigator.notification.alert(
      'Ошибка интернет соединения. Для работы приложения необходимо подключится к интернету.',
      navigator.app.exitApp,
      'Внимание!',
      'Выход'
    ))
}

$(document).on(event, init)

export {
  app,
  ready,
  view,
  alert,
  confirm
}
