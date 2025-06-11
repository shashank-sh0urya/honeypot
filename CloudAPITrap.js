const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

// Simulated fake cloud access keys
const fakeKeys = [
  'AKIAFAKEKEY1234',
  'GOOGFAKEKEY5678',
  'AZUREFAKETOKEN9999'
];

app.get('/aws/s3/bucket', (req, res) => {
  const auth = req.headers['authorization'] || req.query.key || req.query.token;
  const isTrap = fakeKeys.includes(auth);

  logCloudAccessAttempt(req, auth, isTrap);

  if (isTrap) {
    return res.status(200).json({ bucket: 'honeypot-bucket', files: ['secret.doc', 'env.bak'] });
  } else {
    return res.status(403).json({ error: 'Invalid or unauthorized key' });
  }
});

function logCloudAccessAttempt(req, keyUsed, suspicious) {
  const log = {
    ip: req.ip,
    time: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    attemptedKey: keyUsed,
    cloudProvider: detectProvider(keyUsed),
    trapTriggered: suspicious
  };

  fs.appendFileSync(
    path.join(__dirname, 'honeypot.log'),
    JSON.stringify(log) + '\n'
  );
}

function detectProvider(key) {
  if (!key) return 'unknown';
  if (key.startsWith('AKIA')) return 'AWS';
  if (key.startsWith('GOOG')) return 'GCP';
  if (key.startsWith('AZURE')) return 'Azure';
  return 'unknown';
}

app.listen(8093, () => {
  console.log('Cloud API honeypot running on port 8093');
});
