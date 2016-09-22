'use strict'

import { getStyle, getScript } from './ajax/resource'
import Deferred from './deferred'
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

const loadJS = (urls) => urls.length > 0
  ? Promise.all(urls.map(getScript))
  : Promise.resolve()

const loadPage = (url) => new Promise((resolve, reject) => {
  $.ajax({
    url,
    timeout: 30000,
    complete: function (xhr) {
      let { status, responseText } = xhr
      if ((status >= 200 && status < 300) || status === 0) {
        return resolve(responseText)
      }

      return reject(responseText)
    },
    error: function () {
      reject(...arguments)
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
    error: function () {
      reject(...arguments)
    }
  })
})

let appReady = new Deferred()
let ready = appReady.then
let serverConfig
let app

// TODO нужно как то создать исключения и протестировать все catch, точнее придумать поведение для приложения
loadConfig()
  .then(({ js = [], css = [] }) => {
    serverConfig = { js, css }
  })
  // загружаем сначала CSS
  .then(() => loadCSS(serverConfig.css))
  .catch(e => console.log(e))
  // загружаем индексную страницу
  .then(() => loadPage(urls.entry))
  .then(text => $('.views').html(text))
  // в теории при загрузке индексной страницы может возникнуть какая то ошибка, ее нужно как то обработать
  .catch(e => console.log(e))
  // загружаем меню, тут catch не нужнен, потому что меню по факту может и не быть
  .then(() => loadPage(urls.menu))
  .then(text => $('.panel').html(text))
  // создаем инстанс приложения
  .then(() => {
    app = new Framework7({
      init: false,
      material: true
    })
  })
  // только после загрузки CSS и получение контента подгружаем JS
  .then(() => loadJS(serverConfig.js))
  .catch(e => console.log(e))
  // инициализируем приложение
  .then(() => {
    $(document).on('ajaxStart', app.showIndicator)
    $(document).on('ajaxComplete', app.hideIndicator)

    app.init()
    app.addView('.view-main')
    app.closeModal()
  })
  .then(() => appReady.resolve())

export { app, ready }


