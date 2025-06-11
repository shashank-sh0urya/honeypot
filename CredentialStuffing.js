
// Honeypot decoy logic for credential stuffing detection

const express = require('express');
const rateLimit = require('express-rate-limit');
const app = express();
const fs = require('fs');
const path = require('path');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const fakeUsers = [
  { username: 'admin', password: 'Admin@123' },
  { username: 'user', password: 'Passw0rd!' },
  { username: 'test', password: '12345678' }
];

// Rate limit to simulate brute-force defense
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  handler: (req, res) => {
    logAttempt(req, 'RATE_LIMIT');
    res.status(429).send('Too many attempts');
  }
});

app.use('/login', limiter);

function logAttempt(req, status) {
  const log = {
    ip: req.ip,
    time: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    credentials: req.body,
    status
  };
  fs.appendFileSync(
    path.join(__dirname, 'honeypot.log'),
    JSON.stringify(log) + '\n'
  );
}

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const matched = fakeUsers.find(
    (u) => u.username === username && u.password === password
  );

  if (matched) {
    logAttempt(req, 'HIT');
    res.status(200).send('Login successful');
  } else {
    logAttempt(req, 'FAIL');
    res.status(401).send('Invalid credentials');
  }
});

app.listen(8080, () => {
  console.log('CredentialStuffing honeypot running on port 8080');
});
