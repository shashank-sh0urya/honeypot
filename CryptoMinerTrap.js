const express = require('express');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
const upload = multer({ dest: '/tmp/uploads' });
const port = 8085;

// Suspicious mining-related signatures
const minerIndicators = [
  'xmrig', 'minerd', 'cpuminer', 'stratum', 'cryptonight',
  'monero', 'btcminer', 'nicehash', 'ethminer', 'nanopool',
  'mining_pool', 'config.json', 'xmr', 'hashrate', 'gpu_threads_conf'
];

// Behavioral trap data (fake container info)
const fakeSystemProfile = {
  cpuCores: 64,
  cpuModel: 'Intel Xeon Platinum',
  os: 'Ubuntu 22.04',
  dockerExposed: true,
  resourceStats: {
    cpuUsage: '3%',
    memoryFree: '70GB',
    openPorts: ['22', '2375', '8080'],
  },
  status: 'idle'
};

// Utility: Deep inspection of file contents for miner indicators
function scanFileForIndicators(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = minerIndicators.filter(i => content.toLowerCase().includes(i));
  return matches;
}

// Log utility
function logAttack(details) {
  const log = `[${new Date().toISOString()}] CryptoMiner Attempt:
IP: ${details.ip}
Filename: ${details.filename}
Indicators: ${details.indicators.join(', ')}
Hash (SHA-256): ${details.hash}
Tool: ${details.toolFingerprint}
---\n`;
  fs.appendFileSync('logs/crypto_miner_traps.log', log);
  console.log(log);
}

// Simulated vulnerable endpoint
app.post('/api/deploy', upload.single('file'), (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const file = req.file;

  if (!file) return res.status(400).send('Missing file');

  // Compute hash
  const fileBuffer = fs.readFileSync(file.path);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // Deep scan
  const indicators = scanFileForIndicators(file.path);
  const isMiner = indicators.length > 1; // Require multiple matches to reduce false positives

  // Optional: Fingerprint attacker tools by checking User-Agent or curl/post patterns
  const toolFingerprint = req.headers['user-agent'] || 'unknown-tool';

  // Log if miner detected
  if (isMiner) {
    logAttack({ ip, filename: file.originalname, indicators, hash, toolFingerprint });
  }

  // Fake deployment behavior
  res.status(200).json({
    success: true,
    message: "Script deployed successfully.",
    system: fakeSystemProfile,
    session_id: crypto.randomBytes(16).toString('hex'),
    diagnostics: {
      miningReady: fakeSystemProfile.cpuCores > 32 && fakeSystemProfile.dockerExposed,
      nodeVersion: 'v18.19.0',
      dockerImage: 'ubuntu:latest',
    }
  });
});

app.listen(port, () => {
  console.log(`CryptoMiner honeypot listening on port ${port}`);
});
