const bcrypt = require('bcrypt');

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    const accounts = readAccounts();
    const user = accounts.find(acc => acc.email === email);
    if (user) {
        try {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                return res.json({ success: true });
            }
        } catch (err) {
            return res.status(500).json({ error: 'Server error' });
        }
    }
    res.status(401).json({ error: 'Invalid credentials' });
});
// server.js
// Node.js server to store account data from signup form

const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files (HTML, CSS, etc.)

// Path to store accounts data
const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');

// Helper: Read accounts from file
function readAccounts() {
    if (!fs.existsSync(ACCOUNTS_FILE)) return [];
    const data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
    try {
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// Helper: Write accounts to file
function writeAccounts(accounts) {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
}

// Signup endpoint
app.post('/api/signup', async (req, res) => {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    let accounts = readAccounts();
    if (accounts.find(acc => acc.email === email || acc.username === username)) {
        return res.status(409).json({ error: 'Account already exists' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        accounts.push({ email, username, password: hashedPassword });
        writeAccounts(accounts);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
