
// Honeypot decoy logic for Remote and Local File Inclusion detection

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Simulated vulnerable include endpoint
app.get('/load', (req, res) => {
  const file = req.query.page || '';
  const isSuspicious = /\.\.\/|etc\/passwd|http:\/\/|https:\/\/|data:|file:\/\//i.test(file);

  logInclusionAttempt(req, file, isSuspicious);

  if (isSuspicious) {
    return res.status(200).send(`<b>Inclusion pattern detected</b><br>Attempted to include: ${file}`);
  }

  res.status(200).send(`Page loaded: ${file}`);
});

function logInclusionAttempt(req, input, suspicious) {
  const log = {
    ip: req.ip,
    time: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    includeParam: input,
    suspicion: suspicious
  };
  fs.appendFileSync(
    path.join(__dirname, 'honeypot.log'),
    JSON.stringify(log) + '\n'
  );
}

app.listen(8083, () => {
  console.log('RFI/LFI honeypot running on port 8083');
});
