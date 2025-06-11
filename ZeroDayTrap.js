const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
const port = 8088;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Suspicious patterns commonly seen in zero-day fuzzing
const zeroDayPatterns = [
  /[\x00-\x08\x0b\x0c\x0e-\x1f]/g,       // non-printable characters
  /(\%[0-9A-F]{2}){3,}/gi,               // excessive encoding
  /(<script>|<img|onerror=|src=javascript:)/gi,
  /\.\.\/|\.\.\\/,                       // path traversal
  /(eval|exec|new Function|base64_decode|assert)/gi,
  /[\{\[\(]{10,}/g,                      // nesting attacks
  /(wget|curl|nmap|whoami|passwd)/gi     // suspicious command indicators
];

// Utility: Log suspicious activity
function logZeroDayProbe(details) {
  const log = `[${new Date().toISOString()}] POSSIBLE Zero-Day Exploit Attempt:
IP: ${details.ip}
Path: ${details.path}
User-Agent: ${details.ua}
Payload: ${details.payload}
DetectedPattern: ${details.matched}
RequestID: ${details.reqId}
---\n`;
  fs.appendFileSync('logs/zeroday_traps.log', log);
  console.log(log);
}

// Generate fake but believable API targets
app.all('/api/v1/:resource/:id', (req, res) => {
  const payload = JSON.stringify(req.body || req.query || {});
  const ua = req.headers['user-agent'] || '';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const path = req.originalUrl;
  const reqId = crypto.randomBytes(10).toString('hex');

  let detectedPattern = null;
  for (const pattern of zeroDayPatterns) {
    if (pattern.test(payload) || pattern.test(path)) {
      detectedPattern = pattern.toString();
      break;
    }
  }

  if (detectedPattern) {
    logZeroDayProbe({ ip, path, ua, payload, matched: detectedPattern, reqId });
    return res.status(200).json({
      status: 'error',
      message: 'Unknown internal server error',
      traceId: reqId
    });
  }

  // Randomized fake data for realism
  res.status(200).json({
    data: {
      id: req.params.id,
      resource: req.params.resource,
      status: 'processed',
      timestamp: new Date().toISOString()
    },
    meta: {
      server: 'api-gateway-v2',
      traceId: reqId
    }
  });
});

// Generic fallback to monitor undefined routes
app.use((req, res) => {
  const payload = JSON.stringify(req.body || {});
  const ua = req.headers['user-agent'] || '';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const path = req.originalUrl;
  const reqId = crypto.randomBytes(10).toString('hex');

  // Log all unknown access as potential 0-day probe if pattern detected
  let detectedPattern = null;
  for (const pattern of zeroDayPatterns) {
    if (pattern.test(payload) || pattern.test(path)) {
      detectedPattern = pattern.toString();
      logZeroDayProbe({ ip, path, ua, payload, matched: detectedPattern, reqId });
      break;
    }
  }

  res.status(404).send(`Resource not found. Trace ID: ${reqId}`);
});

app.listen(port, () => {
  console.log(`Zero-Day trap listening on port ${port}`);
});
