// api-server.js - Servidor HTTP para polling
const express = require('express');
const app = express();
let notifications = [];

app.use(express.json());

app.post('/api/notify', (req, res) => {
  notifications.push(req.body);
  res.sendStatus(200);
});

app.get('/api/notifications', (req, res) => {
  res.json(notifications);
  notifications = [];
});

app.listen(3000, () => console.log('API server para polling en puerto 3000'));
