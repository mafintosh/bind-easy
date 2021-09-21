# bind-easy

Easily create UDP sockets and TCP servers that bind to ports.

```
npm install bind-easy
```

## Usage

``` js
const bind = require('bind-easy')

// bind to any port
const server = await bind.tcp()

// try binding to a specific port, fallback to any
const server = await bind.tcp(8080)

// try binding to a range of ports, fallback to any
const server = await bind.tcp([8080, 8081, 8082])

// try binding to a range of ports, fallback to any
const server = await bind.tcp([8080, 8081, 8082])

// try binding to a range of ports, fail if that cannot be done
const server = await bind.tcp([8080, 8081, 8082], { allowAny: false })

// The same API applies for udp and dual mode

// try binding to a range of UDP ports, fallback to any
const socket = await bind.udp([8080, 8081, 8082])

// try binding to the same port for both a UDP socket and TCP server, fallback to any
const { server, socket } = await bind.dual(8080)
```

## API

#### `server = await bind.tcp([ports], [{ allowAny }])`

Bind a TCP server. Pass a range of ports to try.

If none of the ports work, bind to a random free one unless allowAny is set.
If only one port is specified, it will try nearby ports first.

#### `socket = await bind.udp(...)`

Same but for a UDP socket.

#### `{ server, socket } = await bind.dual(...)`

Same but for both a TCP server and UDP socket binding to the same port.

## License

MIT
