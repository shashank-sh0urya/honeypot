const express = require('express');
const fs = require('fs');
const app = express();
const port = 8087;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const trapEndpoints = [
  'http://169.254.169.254/latest/meta-data/',
  'http://localhost:2375/containers/json',
  'http://internal-service/api/token',
  'http://127.0.0.1:5000/env',
  'http://admin.internal/'
];

// Fake internal service response
const fakeResponses = {
  '/metadata': 'ami-id: ami-000fake\ninstance-type: t2.medium\nsecurity-groups: [honeypot]',
  '/docker': JSON.stringify([{ Id: 'honeypot1', Image: 'ubuntu:trap' }]),
  '/env': 'SECRET_KEY=honeypot_key_123\nDB_PASSWORD=fakepass',
  '/token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.TRAP.TRAP',
};

// Logger
function logSSRFAttempt(details) {
  const log = `[${new Date().toISOString()}] SSRF Attempt:
IP: ${details.ip}
URL Param: ${details.targetUrl}
User-Agent: ${details.userAgent}
Tool: ${details.toolFingerprint}
Payload: ${details.payload}
---\n`;
  fs.appendFileSync('logs/ssrf_traps.log', log);
  console.log(log);
}

// Decoy SSRF target receiver
app.get('/ssrf-proxy', (req, res) => {
  const target = req.query.url;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ua = req.headers['user-agent'] || 'unknown-agent';

  // Basic tool fingerprinting
  const toolFingerprint = ua.includes('sqlmap') ? 'sqlmap' :
                          ua.includes('curl') ? 'curl' :
                          ua.includes('python') ? 'python-script' : 'browser/shell';

  if (!target) {
    return res.status(400).send('Missing `url` parameter.');
  }

  // Trap logic
  let matchedPath = null;
  for (const trap of trapEndpoints) {
    if (target.startsWith(trap)) {
      matchedPath = trap;
      break;
    }
  }

  const fakePayload = fakeResponses[target.split('/').slice(-1)[0]] || 'Simulated SSRF target response';

  if (matchedPath) {
    logSSRFAttempt({
      ip,
      targetUrl: target,
      userAgent: ua,
      toolFingerprint,
      payload: fakePayload
    });
    return res.status(200).send(fakePayload);
  }

  // Handle blind SSRF attempt simulation
  if (target.includes('internal') || target.includes('localhost')) {
    logSSRFAttempt({
      ip,
      targetUrl: target,
      userAgent: ua,
      toolFingerprint,
      payload: 'Blind SSRF probe detected'
    });
    return res.status(200).send('Request received and processed.');
  }

  // Normal fallback
  res.status(403).send('Access denied or target not allowed.');
});

app.listen(port, () => {
  console.log(`SSRF honeypot listening on port ${port}`);
});
