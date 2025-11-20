// server-latency.js - Servidor con respuesta a ping-test
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer();
const io = socketIo(server);

io.on('connection', (socket) => {
  socket.on('ping-test', (cb) => cb());
});

server.listen(3000, () => {
  console.log('Servidor WebSocket para test de latencia en puerto 3000');
});
