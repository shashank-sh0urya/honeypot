const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
const port = 8086;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Fake victim data
const fakeAccounts = {
  'user@bankmail.com': {
    password: 'CorrectHorseBatteryStaple',
    otp: '598201',
    accountBalance: '₹12,56,300',
    recentTx: ['₹10,000 to ICICI 2123', '₹20,000 to UPI 7981'],
  }
};

// Phishing fingerprint keywords
const phishingProbes = [
  'login.php', 'validate', 'reset.php', 'check.php', 'email=',
  'session', 'token', 'access', 'otp', 'auth', 'password=',
];

// Utility: log suspicious phishing activity
function logPhishing(details) {
  const log = `[${new Date().toISOString()}] Phishing Panel Probe:
IP: ${details.ip}
Path: ${details.path}
User-Agent: ${details.ua}
Payload: ${details.payload}
SessionID: ${details.sessionId}
---\n`;
  fs.appendFileSync('logs/phishing_traps.log', log);
  console.log(log);
}

// Fake login panel (for phishing detection)
app.get('/portal/login.php', (req, res) => {
  const ua = req.headers['user-agent'] || '';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const path = req.originalUrl;

  const sessionId = crypto.randomBytes(12).toString('hex');
  const matchedKeywords = phishingProbes.filter(k => path.includes(k));

  if (matchedKeywords.length > 0 || ua.toLowerCase().includes('python') || ua.toLowerCase().includes('curl')) {
    logPhishing({ ip, path, ua, payload: 'N/A', sessionId });
  }

  res.sendFile(__dirname + '/templates/fake-login.html'); // Realistic login template
});

// Capture fake login attempts
app.post('/portal/validate', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ua = req.headers['user-agent'] || '';
  const { email, password } = req.body;

  const matched = fakeAccounts[email];
  const sessionId = crypto.randomBytes(12).toString('hex');

  const payload = { email, password };

  // Even if matched, do not allow further access — this is a trap
  if (matched || password.length > 3) {
    logPhishing({ ip, path: '/portal/validate', ua, payload: JSON.stringify(payload), sessionId });
  }

  // Simulate a redirect to an OTP screen
  res.status(302).redirect('/portal/otp_verify.php?session=' + sessionId);
});

// Fake OTP handler
app.get('/portal/otp_verify.php', (req, res) => {
  res.send(`
    <html>
      <body>
        <h2>OTP Verification</h2>
        <form method="POST" action="/portal/otp">
          <input name="otp" type="text" placeholder="Enter OTP" />
          <input type="submit" value="Verify" />
        </form>
      </body>
    </html>
  `);
});

app.post('/portal/otp', (req, res) => {
  const otp = req.body.otp || '';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ua = req.headers['user-agent'] || '';

  if (otp.length === 6 || otp === '598201') {
    logPhishing({
      ip,
      path: '/portal/otp',
      ua,
      payload: `OTP=${otp}`,
      sessionId: crypto.randomBytes(12).toString('hex')
    });
  }

  res.send('<h3>Session Expired. Please login again.</h3>');
});

app.listen(port, () => {
  console.log(`Phishing panel honeypot running on port ${port}`);
});
