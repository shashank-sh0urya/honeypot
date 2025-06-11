
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Simulated vulnerable file download endpoint
app.get('/download', (req, res) => {
  const file = req.query.file || '';
  const suspicious = /\.\.\/|\/etc\/passwd|windows\/win.ini|boot.ini|id_rsa|\.ssh|\bsecrets?\b/i.test(file);

  logTraversalAttempt(req, file, suspicious);

  if (suspicious) {
    return res.status(200).send(`<b>Traversal pattern detected</b><br>Attempted file: ${file}`);
  }

  res.status(200).send(`File requested: ${file}`);
});

function logTraversalAttempt(req, input, suspicious) {
  const log = {
    ip: req.ip,
    time: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    fileParam: input,
    suspicion: suspicious
  };
  fs.appendFileSync(
    path.join(__dirname, 'honeypot.log'),
    JSON.stringify(log) + '\n'
  );
}

app.listen(8086, () => {
  console.log('Directory Traversal honeypot running on port 8086');
});
