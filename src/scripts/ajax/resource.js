'use strict'

let timestamp = Date.now()

function getTagName (tagName) {
  switch (tagName) {
    case 'css':
      return 'link'
    default:
      return 'script'
  }
}

/**
 * Функция отдает валидный урл + добавляет к нему таймштамп при необходимости
 *
 * @param {String} url
 * @param {Boolean=false} addTimestamp
 * @see https://gist.github.com/jlong/2428561
 * @return {String}
 */
function parseUrl (url, addTimestamp = false) {
  let result
  let search
  let ts = '_=' + timestamp
  let parser = document.createElement('a')
  parser.href = url

  search = parser.search || ''
  if (addTimestamp) {
    search += search
      ? '&' + ts
      : '?' + ts
  }

  result = parser.protocol + '//' + parser.host + parser.pathname + search
  return result
}

/**
 * Функция создает тэг script или link в зависимости от передаваемых параметров
 *
 * @param params
 * @return {*}
 */
function getResource (params = {}) {
  let defaults = {
    url: '',
    timeout: 30000,
    type: 'js'
  }
  // настройки по умолчанию
  let options = {...defaults, ...params}

  if (!options.url) {
    return Promise.reject('emptyUrl')
  }

  options.url = parseUrl(options.url)

  return new Promise(function (resolve, reject) {
    // название тега
    let tagName = getTagName(options.type)
    // таймер для сброса соедниения
    let abortTimeout
    // динамически согзданный тег для вставки в DOM
    let tag

    function unsetTag () {
      tag.parentNode.removeChild(tag)
      tag = null

      if (abortTimeout) {
        clearTimeout(abortTimeout)
      }
    }

    tag = document.createElement(tagName)
    tag.onload = () => {
      clearTimeout(abortTimeout)
      resolve()
    }
    tag.onerror = event => {
      unsetTag()
      reject(event)
    }

    if (options.type === 'js') {
      tag.type = 'text/javascript'
      tag.src = options.url
    } else {
      tag.type = 'text/css'
      tag.rel = 'stylesheet'
      tag.href = options.url
    }

    if (options.timeout > 0) {
      abortTimeout = setTimeout(() => {
        unsetTag()
        reject(new CustomEvent('timeout'))
      }, options.timeout)
    }

    document.querySelector('head').appendChild(tag)
  })
}

const getScript = (url) => {
  return getResource({
    url: url,
    type: 'js'
  })
}

const getStyle = (url) => {
  return getResource({
    url: url,
    type: 'css'
  })
}

export {
  getScript,
  getStyle
}
