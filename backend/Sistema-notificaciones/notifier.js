// notifier.js - Emisor de notificaciones en tiempo real
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

function sendNotification(userId, message) {
  socket.emit('notify', { userId, message });
}

// Ejemplo de uso
envíaNotificacionDemo();
function envíaNotificacionDemo() {
  sendNotification('usuario123', '¡Tienes una nueva actualización!');
  setTimeout(() => process.exit(0), 1000);
}
