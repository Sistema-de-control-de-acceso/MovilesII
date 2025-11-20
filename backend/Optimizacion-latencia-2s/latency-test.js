// latency-test.js - Medición de latencia WebSocket
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  setInterval(() => {
    const start = Date.now();
    socket.emit('ping-test', () => {
      const latency = Date.now() - start;
      console.log('Latencia:', latency, 'ms');
    });
  }, 2000);
});
