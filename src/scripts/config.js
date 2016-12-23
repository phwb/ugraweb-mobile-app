/* global buildConfig */

const config = {
  host: 'http://localhost',
  folder: '/m',
  debug: false
}

export default buildConfig
  ? {...config, ...buildConfig}
  : config
