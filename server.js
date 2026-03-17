const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // This serves your HTML files

// Logic to check the Professor's email
app.post('/api/auth', (req, res) => {
    const { email } = req.body;
    
    if (email === 'jcesperanza@neu.edu.ph') {
        res.json({ role: 'admin', message: 'Welcome, Professor!' });
    } else if (email.endsWith('@neu.edu.ph')) {
        res.json({ role: 'student', message: 'Welcome to NEU Library!' });
    } else {
        res.status(403).json({ message: 'Please use your NEU email.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});