const dns = require('dns');
const fs = require('fs');
const path = require('path');
const dgram = require('dgram');
const server = dgram.createSocket('udp4');

const TRAP_DOMAIN = 'tunneltrap.fakehoneypot.local';

server.on('listening', () => {
  const address = server.address();
  console.log(`DNS honeypot running at ${address.address}:${address.port}`);
});

server.on('message', (msg, rinfo) => {
  const queryName = parseQueryName(msg);

  if (queryName && queryName.includes(TRAP_DOMAIN)) {
    logDNSTunnelAttempt(rinfo, queryName);
  }
});

function parseQueryName(msg) {
  try {
    let qName = '';
    let len = msg[12];
    let offset = 13;

    while (len !== 0) {
      qName += msg.slice(offset, offset + len).toString('ascii') + '.';
      offset += len;
      len = msg[offset++];
    }
    return qName;
  } catch (e) {
    return null;
  }
}

function logDNSTunnelAttempt(rinfo, queryName) {
  const log = {
    ip: rinfo.address,
    port: rinfo.port,
    time: new Date().toISOString(),
    query: queryName,
    suspicion: true
  };

  fs.appendFileSync(
    path.join(__dirname, 'honeypot.log'),
    JSON.stringify(log) + '\n'
  );

  console.log(`DNS tunneling attempt logged: ${queryName}`);
}

server.bind(5353);
