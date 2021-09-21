const dgram = require('dgram')
const net = require('net')

exports.udp = async function bindUDP (ports = 0, opts = {}) {
  const socket = dgram.createSocket(opts.ipv6 ? 'udp6' : 'udp4')

  let error = null

  for (const port of expandPorts(ports, opts.allowAny !== false)) {
    try {
      await bind(socket, false, port)
      return socket
    } catch (err) {
      error = err
    }
  }

  throw (error || new Error('Could not bind'))
}

exports.tcp = async function bindTCP (ports = 0, opts = {}) {
  const server = net.createServer()

  let error = null

  for (const port of expandPorts(ports, opts.allowAny !== false)) {
    try {
      await bind(server, true, port)
      return server
    } catch (err) {
      error = err
    }
  }

  throw (error || new Error('Could not bind'))
}

exports.dual = async function bindDual (ports = 0, opts = {}) {
  const type = opts.ipv6 ? 'udp6' : 'udp4'

  let server = net.createServer()
  let socket = dgram.createSocket(type)
  let error = null

  for (const port of expandPorts(ports, false)) {
    try {
      await bind(socket, false, port)
    } catch (err) {
      error = err
      continue
    }

    try {
      await bind(server, true, socket.address().port)
    } catch (err) {
      error = err
      await close(socket)
      socket = dgram.createSocket(type)
      continue
    }

    return { server, socket }
  }

  if (opts.allowAny !== false) {
    for (let i = 0; i < 5; i++) {
      // First try free udp port
      await bind(socket, false, 0)

      try {
        await bind(server, true, socket.address().port)
      } catch (err) {
        error = err
        await close(socket)
        socket = dgram.createSocket(type)

        // Then try free tcp port
        await bind(server, true, 0)

        try {
          await bind(socket, false, server.address().port)
        } catch (err) {
          error = err
          await close(server)
          server = net.createServer()
          continue
        }
      }

      return { server, socket }
    }
  }

  throw (error || new Error('Could not bind'))
}

function expandPorts (p, allowAny) {
  const all = p === 0
    ? allowAny ? [] : [0]
    : typeof p === 'number'
      ? allowAny ? [p, p + 1, p + 2, p + 3, p + 4] : [p]
      : [...p]

  if (allowAny) all.push(0)
  return all
}

function close (server) {
  return new Promise(function (resolve) {
    server.on('close', onclose)
    server.close()

    function onclose () {
      server.removeListener('close', onclose)
      resolve()
    }
  })
}

function bind (socket, isTCP, port) {
  return new Promise(function (resolve, reject) {
    socket.on('listening', onlistening)
    socket.on('error', done)

    if (isTCP) socket.listen(port)
    else socket.bind(port)

    function onlistening () {
      done(null)
    }

    function done (err) {
      socket.removeListener('listening', onlistening)
      socket.removeListener('error', done)

      if (err) reject(err)
      else resolve()
    }
  })
}
