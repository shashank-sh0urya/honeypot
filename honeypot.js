const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.json());

// Fix CORS: Allow localhost and AWS EC2 instance
const allowedOrigins = ['https://3.7.71.39', 'http://3.7.71.39']; // Adjust if needed
app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Serve Honeypot SDK
app.get('/honeypot.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins

    res.send(`
        (function() {
            function detectAttack(formData) {
                const attackPatterns = [
                    /(--|#|;|\\/\\*)/i, // SQL comments
                    /\\b(UNION|SELECT|INSERT|DELETE|UPDATE|DROP|TRUNCATE|ALTER|EXEC|FROM|WHERE|TABLE)\\b/i, // SQL Keywords
                    /\\b(OR|AND)\\b.*[=<>]/i, // Logical conditions
                    /('|")/, // Unclosed quotes
                    /\\b(script|alert|<|>)\\b/i // Basic XSS detection
                ];
                
                return Object.values(formData).some(value => 
                    attackPatterns.some(pattern => pattern.test(value))
                );
            }

            document.addEventListener('submit', function(event) {
                let formData = new FormData(event.target);
                let formObject = {};
                formData.forEach((value, key) => formObject[key] = value);
                
                if (detectAttack(formObject)) {
                    fetch("http://3.7.71.39:3001/track", { // Fixed for EC2
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ formObject, userAgent: navigator.userAgent })
                    }).then(() => {
                        window.location.href = "http://3.7.71.39:3001/admin"; // Fixed redirect for EC2
                    }).catch(err => console.error("Error sending to honeypot:", err));

                    console.log("🚨 SQL Injection detected! Redirecting attacker...");
                    event.preventDefault();
                }
            }, true);
        })();
    `);
});

// Log attacker data with IP tracking
app.post('/track', (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress; // Track real IP
    const logData = `
        Time: ${new Date().toISOString()}
        IP: ${clientIp}
        User-Agent: ${req.body.userAgent}
        Data: ${JSON.stringify(req.body.formObject)}
    `;

    fs.appendFileSync('attackers.log', logData + "\n");
    console.log('Attack logged:', logData);

    res.status(200).json({ message: 'Tracked successfully' });
});

// Fake admin panel trap
app.get('/admin', (req, res) => {
    res.send('<h1>Admin Panel</h1><p>Unauthorized access is monitored.</p>');
});

app.listen(3001, () => {
    console.log('Honeypot running at http://3.7.71.39:3001');
});
