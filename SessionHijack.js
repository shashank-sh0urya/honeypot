const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();

app.use(cookieParser());

const fakeSessionID = 'sess-12345-fake-honeypot-session';

// Simulated dashboard endpoint
app.get('/dashboard', (req, res) => {
  const sessionCookie = req.cookies['sessionID'];
  const suspicious = sessionCookie && sessionCookie === fakeSessionID;

  logSessionAttempt(req, sessionCookie, suspicious);

  if (suspicious) {
    return res.status(200).send('<h1>Welcome back, admin!</h1><p>Session validated (honeypot triggered)</p>');
  }

  res.status(403).send('Access denied. Invalid session.');
});

function logSessionAttempt(req, sessionCookie, suspicious) {
  const log = {
    ip: req.ip,
    time: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    cookieAttempted: sessionCookie,
    suspicion: suspicious
  };
  fs.appendFileSync(
    path.join(__dirname, 'honeypot.log'),
    JSON.stringify(log) + '\n'
  );
}

app.listen(8090, () => {
  console.log('Session Hijack honeypot running on port 8090');
});
