'use strict'

/* global buildConfig */

const config = {
  host: 'http://localhost',
  folder: '/m'
}

export default buildConfig
  ? {...config, ...buildConfig}
  : config
