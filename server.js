const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3001;

// Allow all origins (open for PoC testing)
app.use(cors({
  origin: '*',
  methods: ['GET'],
  allowedHeaders: ['Content-Type']
}));

// Serve static files (like xss.js)
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});