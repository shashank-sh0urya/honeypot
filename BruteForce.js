const express = require('express');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Basic rate limiter
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  handler: (req, res) => {
    logBruteForceAttempt(req, req.body.username, true);
    return res.status(429).send('Too many login attempts - brute force suspected.');
  }
});

app.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  const suspicious = /admin|root|test|user|password|123456/i.test(username) || /123456|password|admin|letmein|qwerty/i.test(password);

  logBruteForceAttempt(req, username, suspicious);

  res.status(200).send('Invalid credentials.');
});

function logBruteForceAttempt(req, username, suspicious) {
  const log = {
    ip: req.ip,
    time: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    usernameAttempted: username,
    suspicion: suspicious
  };
  fs.appendFileSync(
    path.join(__dirname, 'honeypot.log'),
    JSON.stringify(log) + '\n'
  );
}

app.listen(8087, () => {
  console.log('Brute Force honeypot running on port 8087');
});
