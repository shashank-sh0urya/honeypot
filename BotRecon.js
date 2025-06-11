const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Decoy paths for bots and scanners
const trapPaths = [
  '/.env',
  '/wp-admin',
  '/admin.php',
  '/login.php',
  '/server-status',
  '/phpinfo.php',
  '/config.json',
  '/robots.txt',
  '/hidden-panel',
  '/.git'
];

trapPaths.forEach(trap => {
  app.get(trap, (req, res) => {
    logBotRecon(req, trap);
    res.status(200).send(`<h1>404 Not Found</h1><p>Bot trap triggered at: ${trap}</p>`);
  });
});

// Catch-all for unknown scans or tools
app.use((req, res, next) => {
  const trapHit = trapPaths.includes(req.path);
  if (!trapHit && /nikto|fuzz|dirbuster|gobuster|nmap|sqlmap/i.test(req.headers['user-agent'] || '')) {
    logBotRecon(req, req.path);
  }
  res.status(404).send('<h1>404 Not Found</h1>');
});

function logBotRecon(req, pathAccessed) {
  const log = {
    ip: req.ip,
    time: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    path: pathAccessed,
    suspicion: true
  };
  fs.appendFileSync(
    path.join(__dirname, 'honeypot.log'),
    JSON.stringify(log) + '\n'
  );
}

app.listen(8089, () => {
  console.log('Bot Recon honeypot running on port 8089');
});
