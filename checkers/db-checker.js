const mysql = require('mysql2/promise')
const QUERY_TIMEOUT = 1000
module.exports = class {
  async check (db) {
    let connection
    let checkResponse = 'ONLINE'
    let error
    let success
    try {
      connection = await mysql.createConnection({
        host: db.host,
        user: db.username,
        password: db.password,
        database: db.database,
        port: db.port || 3306
      })
      connection.connect()
      await connection.execute({ sql: 'SELECT 1', timeout: QUERY_TIMEOUT })
      success = true
    } catch (err) {
      checkResponse = 'OFFLINE'
      error = `Unable to connect to DB. Err: ${err.message}`
      success = false
    } finally {
      if (connection && typeof connection.end === 'function') {
        await connection.end()
      }
    }

    return {
      success: success,
      response: checkResponse,
      error: error || undefined
    }
  }
}
