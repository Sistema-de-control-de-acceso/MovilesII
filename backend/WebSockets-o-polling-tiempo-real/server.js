// server.js - Servidor WebSocket con Socket.IO
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer();
const io = socketIo(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  socket.on('notify', (data) => {
    // Reenvía notificación a todos los clientes
    io.emit('notification', data);
  });
});

server.listen(3000, () => {
  console.log('WebSocket server en puerto 3000');
});
