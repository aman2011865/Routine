// secure-server.js
// A more secure Node.js server for user routines with authentication

const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const PORT = 4000;
const JWT_SECRET = 'your-very-secure-secret'; // Change this in production!

app.use(cors());
app.use(bodyParser.json());

const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');
const ROUTINES_DIR = path.join(__dirname, 'user_routines');
if (!fs.existsSync(ROUTINES_DIR)) fs.mkdirSync(ROUTINES_DIR);

function readAccounts() {
    if (!fs.existsSync(ACCOUNTS_FILE)) return [];
    const data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
    try { return JSON.parse(data); } catch { return []; }
}
function writeAccounts(accounts) {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
}

// Middleware to verify JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Signup endpoint (same as before, but for demo, not used by frontend)
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

// Login endpoint (returns JWT and username)
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
                const token = jwt.sign({ email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
                return res.json({ success: true, token, username: user.username });
            }
        } catch (err) {
            return res.status(500).json({ error: 'Server error' });
        }
    }
    res.status(401).json({ error: 'Invalid credentials' });
});

// Get routine for logged-in user
app.get('/api/routine', authenticateToken, (req, res) => {
    const routineFile = path.join(ROUTINES_DIR, req.user.email + '.json');
    if (!fs.existsSync(routineFile)) return res.json({ routine: null });
    const data = fs.readFileSync(routineFile, 'utf8');
    try {
        res.json({ routine: JSON.parse(data) });
    } catch {
        res.json({ routine: null });
    }
});

// Save routine for logged-in user
app.post('/api/routine', authenticateToken, (req, res) => {
    const routineFile = path.join(ROUTINES_DIR, req.user.email + '.json');
    const routine = req.body.routine;
    if (!routine) return res.status(400).json({ error: 'Missing routine data' });
    fs.writeFileSync(routineFile, JSON.stringify(routine, null, 2));
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Secure routine server running at http://localhost:${PORT}`);
});
