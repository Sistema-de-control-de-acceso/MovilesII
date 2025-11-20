// client.js - Cliente WebSocket funcional
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Conectado al servidor WebSocket');
  socket.emit('notify', { userId: 'demo', message: 'Hola desde el cliente!' });
});

socket.on('notification', (data) => {
  console.log('Notificación recibida:', data);
});
