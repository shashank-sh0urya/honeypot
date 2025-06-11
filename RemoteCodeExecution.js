const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Simulated vulnerable API accepting code snippets
app.post('/eval', (req, res) => {
  const { code } = req.body || '';

  const suspicious = /require\(|child_process|fs|net|os|eval|exec|spawn|process|import|console\.log|while\(true\)/i.test(code);
  logRCEAttempt(req, code, suspicious);

  if (suspicious) {
    return res.status(200).send(`Code submitted: ${code}<br><b>RCE pattern detected!</b>`);
  }

  res.status(200).send(`Code received: ${code}`);
});

function logRCEAttempt(req, input, suspicious) {
  const log = {
    ip: req.ip,
    time: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    codeInput: input,
    suspicion: suspicious
  };
  fs.appendFileSync(
    path.join(__dirname, 'honeypot.log'),
    JSON.stringify(log) + '\n'
  );
}

app.listen(8085, () => {
  console.log('RCE honeypot running on port 8085');
});
