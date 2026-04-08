const express = require('express');
const app = express();
const path = require('path');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// In-Memory Database
let usersDB = {
  "olaoba@live.co.uk": { 
    password: "password123",
    networkName: "Easy Payment And Finance Bank (EUSIM)",
    outcome: "decline", 
    statusCode: "ERR_LIQUIDITY_HOLD", // New Field
    region: "global", 
    amount: 120606, 
    depositPct: 10, 
    reason: "Client is obligated to provide a standard compliance liquidity verification.", 
    regulationRef: "Regulation 9(2)", 
    regulationTitle: "Sepa Settlement Code" 
  },
  "iangrinsted@gmail.com": { 
    password: "securepass",
    networkName: "Barclays Corporate Banking (UK)",
    outcome: "success", 
    statusCode: "CLEARED", // New Field
    region: "uk", 
    amount: 23600, 
    depositPct: 0, 
    reason: "Settlement cleared.", 
    regulationRef: "Regulation 12(4)", 
    regulationTitle: "Sepa Payments Conduct" 
  }
};

// --- ROUTES ---
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/admin-panel', (req, res) => {
  res.render('admin');
});

// --- API ENDPOINTS ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = usersDB[username.toLowerCase().trim()];
  
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.password !== password) return res.status(401).json({ error: "Wrong password" });
  
  res.json({ success: true, data: user });
});

app.get('/api/users', (req, res) => {
  res.json(usersDB);
});

app.post('/api/users', (req, res) => {
  const { username, userData } = req.body;
  usersDB[username.toLowerCase().trim()] = userData;
  res.json({ success: true });
});

app.delete('/api/users/:username', (req, res) => {
  delete usersDB[req.params.username];
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});