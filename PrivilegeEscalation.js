
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Simulated roles and fake access control
const userRoles = {
  'user-token-abc': 'user',
  'admin-token-xyz': 'admin',
  'honeypot-token': 'trap'
};

app.use(express.json());

// Decoy privileged endpoint
app.get('/api/v2/admin/users', (req, res) => {
  const token = req.headers['authorization'];
  const role = userRoles[token] || 'unknown';

  const isEscalationAttempt = token && role !== 'admin';

  logPrivilegeAttempt(req, token, role, isEscalationAttempt);

  if (role === 'admin') {
    res.status(200).json({ users: ['admin', 'user1', 'user2'], access: 'granted' });
  } else {
    res.status(403).json({ message: 'Access denied' });
  }
});

function logPrivilegeAttempt(req, token, role, suspicious) {
  const log = {
    ip: req.ip,
    time: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    attemptedToken: token,
    resolvedRole: role,
    escalationAttempt: suspicious
  };

  fs.appendFileSync(
    path.join(__dirname, 'honeypot.log'),
    JSON.stringify(log) + '\n'
  );
}

app.listen(8092, () => {
  console.log('Privilege Escalation honeypot running on port 8092');
});
