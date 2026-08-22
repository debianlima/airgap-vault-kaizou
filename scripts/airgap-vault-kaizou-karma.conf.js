const path = require('path')
const root = path.resolve(__dirname, '..')
process.env.CHROME_BIN = process.env.CHROME_BIN || require(path.join(root, 'node_modules/puppeteer')).executablePath()
module.exports = function (config) {
  config.set({
    basePath: root,
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require(path.join(root, 'node_modules/karma-jasmine')),
      require(path.join(root, 'node_modules/karma-chrome-launcher')),
      require(path.join(root, 'node_modules/@angular-devkit/build-angular/plugins/karma'))
    ],
    client: { clearContext: false },
    reporters: ['progress'],
    port: Number(process.env.AIRGAP_KAIZOU_KARMA_PORT || 9878),
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadlessNoSandbox'],
    captureTimeout: 120000,
    browserNoActivityTimeout: 120000,
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 1,
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
      }
    },
    singleRun: true
  })
}
