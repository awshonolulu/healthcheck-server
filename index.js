
const server = require('http').createServer()
const io = require('socket.io')(server, { ws: true })
const Checkers = require('./checkers')
const serverChecker = new Checkers.ServerChecker()
const dbChecker = new Checkers.DbChecker()

const PORT = process.env.PORT || 3000
const servers = {
  // 'google': {
  //   name: 'google',
  //   url: 'http://www.google.com',
  //   lastHttpStatus: 200,
  //   lastResponse: '',
  //   lastUpdate: Date.now(),
  //   successCount: 0,
  //   createdAt: Date.now()
  // }
}
const databases = {}

io.on('connection', function (socket) {
  console.log('device connected')
  socket.emit('allServers', JSON.stringify(servers))
  socket.emit('allDatabases', JSON.stringify(databases))

  socket.on('addServer', (data) => {
    addServer(data)
  })

  socket.on('addDatabase', (data) => {
    addDatabase(data)
  })
})
io.listen(PORT)
console.log(`Server listening on port: ${PORT}`)

function addDatabase (data) {
  try {
    const db = JSON.parse(data)
    if (!db.name) throw new Error('Missing db name')
    db.successCount = 0
    db.failedCount = 0
    db.createdAt = Date.now()
    databases[db.name] = db
    checkDb(db)
  } catch (error) {
    io.emit('error', 'There was an error trying to add the given db conn.')
  }
}

function addServer (data) {
  try {
    const newServer = JSON.parse(data)
    if (!newServer.name) throw new Error('Missing server name')
    if (!newServer.url.startsWith('http://') && !newServer.url.startsWith('https://')) {
      newServer.url = `http://${newServer.url}`
    }
    newServer.successCount = 0
    newServer.failedCount = 0
    newServer.createdAt = Date.now()
    servers[newServer.name] = newServer
    checkServer(newServer)
  } catch (error) {
    io.emit('error', 'There was an error trying to add the given server.')
  }
}

setInterval(async () => {
  Object.keys(servers).forEach(async (serverKey) => {
    await checkServer(servers[serverKey])
  })
  Object.keys(databases).forEach(async (dbKey) => {
    await checkDb(databases[dbKey])
  })
}, 5000)

async function checkDb (db) {
  try {
    const checkResult = await dbChecker.check(db)
    if (checkResult.success) {
      db.successCount++
      db.lastStatus = checkResult.response
    } else {
      db.failedCount++
      db.lastStatus = checkResult.response
      db.error = checkResult.error
    }
  } catch (err) {
    db.lastStatus = 'OFFLINE'
    db.error = err.message
    db.failedCount++
  } finally {
    db.lastUpdate = Date.now()
    io.emit('dbStatusUpdated', JSON.stringify(db))
  }
}

async function checkServer (server) {
  try {
    const checkResult = await serverChecker.check(server)
    if (checkResult.success) {
      server.successCount++
      server.lastHttpStatus = checkResult.response
    } else {
      server.failedCount++
      server.lastHttpStatus = checkResult.response
      server.error = checkResult.error
    }
  } catch (err) {
    server.lastHttpStatus = -1
    server.error = err.message
    server.failedCount++
  } finally {
    server.lastUpdate = Date.now()
    io.emit('serverStatusUpdated', JSON.stringify(server))
  }
}
