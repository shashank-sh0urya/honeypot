
// simulating vulnerable IoT device API for botnet attacks like Mirai

const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// Fake IoT login endpoint
app.post('/iot/login', (req, res) => {
  const { username, password } = req.body;
  const suspicious = isDefaultCreds(username, password);

  logIoTLoginAttempt(req, username, password, suspicious);

  res.status(200).send(`<device><status>OK</status><auth>${suspicious ? 'GRANTED' : 'DENIED'}</auth></device>`);
});

// Default credentials check (common for Mirai)
function isDefaultCreds(user, pass) {
  const defaultCreds = [
    { u: 'admin', p: 'admin' },
    { u: 'root', p: 'root' },
    { u: 'user', p: '1234' },
    { u: 'guest', p: 'guest' },
    { u: 'support', p: 'support' }
  ];
  return defaultCreds.some(c => c.u === user && c.p === pass);
}

function logIoTLoginAttempt(req, user, pass, suspicious) {
  const log = {
    ip: req.ip,
    time: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    attemptedUsername: user,
    attemptedPassword: pass,
    suspicion: suspicious
  };
  fs.appendFileSync(
    path.join(__dirname, 'honeypot.log'),
    JSON.stringify(log) + '\n'
  );
}

app.listen(8091, () => {
  console.log('IoT honeypot running on port 8091');
});
