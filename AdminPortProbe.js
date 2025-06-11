
// for detecting port probing on common misconfigured admin ports

const net = require('net');
const fs = require('fs');
const path = require('path');

const TRAP_PORTS = [22, 3306, 6379, 9200];

TRAP_PORTS.forEach(port => {
  const server = net.createServer(socket => {
    const log = {
      port,
      ip: socket.remoteAddress,
      time: new Date().toISOString(),
      suspicion: true,
      banner: `Connection to fake admin port ${port}`
    };

    fs.appendFileSync(
      path.join(__dirname, 'honeypot.log'),
      JSON.stringify(log) + '\n'
    );

    socket.write(`Welcome to ${port} honeypot service\n`);
    socket.destroy();
  });

  server.listen(port, () => {
    console.log(`Admin port honeypot running on port ${port}`);
  });
});
