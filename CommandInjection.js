
// Honeypot decoy logic for Command Injection detection

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Simulated vulnerable endpoint
app.post('/ping', (req, res) => {
  const { host } = req.body;
  const command = `ping -c 4 ${host}`;

  const suspicious = /(;|&&|\|\||\$\(|`|\bcat\b|\bwget\b|\bcurl\b|\brm\b|\becho\b)/i.test(host);
  logCommandInjectionAttempt(req, host, suspicious);

  if (suspicious) {
    return res.status(200).send(`Command executed: ${command}<br><b>Injection pattern detected!</b>`);
  }

  res.status(200).send(`Command executed: ${command}`);
});

function logCommandInjectionAttempt(req, input, suspicious) {
  const log = {
    ip: req.ip,
    time: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    commandInput: input,
    suspicion: suspicious
  };
  fs.appendFileSync(
    path.join(__dirname, 'honeypot.log'),
    JSON.stringify(log) + '\n'
  );
}

app.listen(8082, () => {
  console.log('Command Injection honeypot running on port 8082');
});
