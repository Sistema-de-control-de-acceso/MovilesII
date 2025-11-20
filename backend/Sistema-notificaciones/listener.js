// listener.js - Receptor de notificaciones en tiempo real
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('notification', (data) => {
  console.log('Notificación recibida:', data);
});

console.log('Esperando notificaciones...');
