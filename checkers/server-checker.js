const rp = require('request-promise-native')

module.exports = class {
  async check (server) {
    let success
    let error
    let checkResponse
    try {
      const response = await rp({ url: server.url, resolveWithFullResponse: true })
      checkResponse = response.statusCode
      if (response.statusCode >= 200 && response.statusCode < 300) {
        success = true
        server.successCount++
      } else {
        success = false
        server.failedCount++
      }
    } catch (err) {
      error = typeof err.error === 'string' ? err.error : err.message
      checkResponse = err.statusCode || -1
      server.failedCount++
      success = false
    }

    return {
      success: success,
      response: checkResponse,
      error: error || undefined
    }
  }
}
