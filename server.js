const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Temporary Database (This resets if the server restarts on Render)
// For your final Capstone, we will connect this to MongoDB!
let visitorLogs = [];

// 1. Auth Logic (From your previous code)
app.post('/api/auth', (req, res) => {
    const { email } = req.body;
    if (email === 'jcesperanza@neu.edu.ph') {
        res.json({ role: 'admin' });
    } else if (email.endsWith('@neu.edu.ph')) {
        res.json({ role: 'student' });
    } else {
        res.status(403).json({ message: 'Access Denied' });
    }
});

// 2. RECEIVE Visit Data (This is what was missing!)
app.post('/api/visitors', (req, res) => {
    const { email, reason, college, isEmployee, time } = req.body;
    
    const newEntry = { email, reason, college, isEmployee, time };
    visitorLogs.push(newEntry); // Save it to our list
    
    console.log("New Visit Recorded:", newEntry);
    res.status(201).json({ message: "Visit recorded successfully!" });
});

// 3. SEND Visit Data (To display on the Admin Dashboard)
app.get('/api/visitors', (req, res) => {
    res.json(visitorLogs);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});