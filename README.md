# ws-transform-stream

A transformer for websocket streams.

## Usage

```sh
npm install --save git://github.com/skglobal-jsc/ws-transform-stream.git#master
```

In your code:

```js
'use strict';
const express = require('express');
const cors = require('cors');
const { createProxyServer } = require('node-http-proxy');
const WsTransformStream = require('@skglobal/ws-transform-stream');

const app = express();
const proxy = createProxyServer({
  target: 'ws://echo.websocket.org',
  changeOrigin: true,
  ws: true,
  createWsClientTransformStream,
  createWsServerTransformStream,
});

proxy.on('error', console.error)

function createWsClientTransformStream(req, proxyReq) {
  return WsTransformStream.fromUpgradeRequest(
    {
      receiver: req,
      sender: proxyReq,
    },
    {
      isToServer: true,
      source: req.socket,
      filter: (message) => {
        return {
          isBlocked: message.length > 10,
          message: 'This request is blocked',
        }
      }
    }
  );
};

function createWsServerTransformStream(req, proxyReq) {
  return WsTransformStream.fromUpgradeRequest(
    {
      receiver: proxyReq,
      sender: req,
    }, {
      isToServer: false,
      transform: function (message) {
        console.log('receive', message)
        return message;
      }
    }
  );
};

app.use(cors())
app.get('/', (req, res, next) => {
  proxy.web(req, res);
  next()
})
const server = app.listen(3000);

server.on('upgrade', (req, socket, head) => {
  socket.on('error', console.error)
  proxy.ws(req, socket, head);
});

```
