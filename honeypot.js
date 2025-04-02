const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS middleware

const app = express();

app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all requests

// Serve Honeypot SDK
app.get('/honeypot.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.send(`
        (function() {
            function detectAttack(formData) {
                const attackPatterns = [
                    /(--|#|;|\\/\\*)/i, // SQL comments
                    /\b(UNION|SELECT|INSERT|DELETE|UPDATE|DROP|TRUNCATE|ALTER|EXEC)\b/i, // SQL Keywords
                    /\b(OR|AND)\b.*[=<>]/i, // Logical conditions
                    /('|")/ // Unclosed quotes
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
                    fetch("http://localhost:3001/track", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ formObject, userAgent: navigator.userAgent })
                    }).then(() => {
                        window.location.href = "http://localhost:3001/admin"; // Redirect attacker
                    });

                    console.log("SQL Injection detected! Redirecting attacker...");
                    event.preventDefault(); // Stop form submission
                }
            }, true);
        })();
    `);
});

// Log attacker data
app.post('/track', (req, res) => {
    const logData = `${new Date().toISOString()} - IP: ${req.ip} - User-Agent: ${req.body.userAgent} - Data: ${JSON.stringify(req.body.formObject)}\n`;
    fs.appendFileSync('attackers.log', logData);
    console.log('Attack logged:', logData);
    res.status(200).send({ message: 'Tracked' });
});

// Fake admin panel to trap attackers
app.get('/admin', (req, res) => {
    res.send('<h1>Admin Panel</h1><p>Unauthorized access is monitored.</p>');
});

app.listen(3001, () => {
    console.log('Honeypot running at http://localhost:3001');
});
