// polling-client.js - Cliente polling simple
const axios = require('axios');

async function poll() {
  try {
    const res = await axios.get('http://localhost:3000/api/notifications');
    if (res.data && res.data.length) {
      res.data.forEach(n => console.log('Notificación:', n));
    }
  } catch (e) {
    console.error('Error polling:', e.message);
  }
  setTimeout(poll, 2000);
}

poll();
