// send-push.js - Envío de notificaciones push con Firebase Admin SDK
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

function sendPush(token, title, body) {
  const message = {
    notification: { title, body },
    token
  };
  admin.messaging().send(message)
    .then(response => console.log('Push enviado:', response))
    .catch(err => console.error('Error push:', err));
}

// Ejemplo de uso:
// sendPush('TOKEN_DISPOSITIVO', 'Título', 'Mensaje');
