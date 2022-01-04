const test = require('brittle')
const dgram = require('dgram')
const net = require('net')
const bind = require('./')

test('udp', async function (t) {
  const port = await freePort(true)
  const socket = await bind.udp(port)

  t.is(port, socket.address().port)

  socket.close()
})

test('udp - taken port', async function (t) {
  const existing = await bind.udp()
  const socket = await bind.udp(existing.address().port)

  t.not(socket.address().port, existing.address().port)

  existing.close()
  socket.close()
})

test('udp - all taken', async function (t) {
  const existing = await bind.udp()
  const socket = await bind.udp([existing.address().port, existing.address().port])

  t.not(socket.address().port, existing.address().port)

  existing.close()
  socket.close()
})

test('tcp', async function (t) {
  const port = await freePort(false)
  const server = await bind.tcp(port)

  t.is(port, server.address().port)

  server.close()
})

test('tcp - taken port', async function (t) {
  const existing = await bind.tcp()
  const server = await bind.tcp(existing.address().port)

  t.not(server.address().port, existing.address().port)

  existing.close()
  server.close()
})

test('dual', async function (t) {
  const { server, socket } = await bind.dual()

  t.is(server.address().port, socket.address().port)
  t.ok(server.address().port > 0, 'is bound')

  server.close()
  socket.close()
})

test('dual - tcp is taken', async function (t) {
  const exiting = await bind.tcp()
  const { server, socket } = await bind.dual(exiting.address().port)

  t.is(server.address().port, socket.address().port)
  t.not(server.address().port, exiting.address().port, 'different port')

  server.close()
  socket.close()
  exiting.close()
})

test('dual - udp is taken', async function (t) {
  const exiting = await bind.udp()
  const { server, socket } = await bind.dual(exiting.address().port)

  t.is(server.address().port, socket.address().port)
  t.not(server.address().port, exiting.address().port, 'different port')

  server.close()
  socket.close()
  exiting.close()
})

test('dual - range taken but allowAny', async function (t) {
  const { server, socket } = await bind.dual([])

  t.is(server.address().port, socket.address().port)

  server.close()
  socket.close()
})

test('dual - with address', async function (t) {
  const { server, socket } = await bind.dual(0, { address: '127.0.0.1' })

  t.is(server.address().port, socket.address().port)
  t.is(server.address().address, socket.address().address)
  t.ok(server.address().port > 0, 'is bound')
  t.is(server.address().address, '127.0.0.1')

  server.close()
  socket.close()
})

test('all taken, no allowAny', async function (t) {
  t.exception(bind.udp([], { allowAny: false }))
  t.exception(bind.tcp([], { allowAny: false }))
  t.exception(bind.dual([], { allowAny: false }))
})

function freePort (udp) {
  return new Promise(function (resolve) {
    const socket = udp ? dgram.createSocket('udp4') : net.createServer()
    if (udp) socket.bind(0)
    else socket.listen(0)
    socket.on('listening', function () {
      const { port } = socket.address()
      socket.close(function () {
        resolve(port)
      })
    })
  })
}
