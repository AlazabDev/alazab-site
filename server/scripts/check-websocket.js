'use strict';

const { WebSocketServer, WebSocket } = require('ws');

const PORT = 4010;
const HOST = '127.0.0.1';

const wss = new WebSocketServer({ host: HOST, port: PORT }, () => {
  console.log(`✅ WebSocket test server started on ws://${HOST}:${PORT}`);

  const client = new WebSocket(`ws://${HOST}:${PORT}`);

  client.on('open', () => {
    client.send('ping');
  });

  client.on('message', (data) => {
    const msg = data.toString();
    if (msg === 'pong') {
      console.log('✅ WebSocket echo test passed');
      client.close();
      wss.close(() => process.exit(0));
    } else {
      console.error('❌ Unexpected WebSocket response:', msg);
      process.exit(1);
    }
  });

  client.on('error', (err) => {
    console.error('❌ WebSocket client failed:', err.message);
    process.exit(1);
  });
});

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    if (data.toString() === 'ping') {
      ws.send('pong');
    }
  });
});

wss.on('error', (err) => {
  console.error('❌ WebSocket server failed:', err.message);
  process.exit(1);
});
