const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const mongoURI = "mongodb+srv://kazleen:gj5Je4qWPg7YP94n@cluster0.edipnmh.mongodb.net/?appName=Cluster0";
mongoose.connect(mongoURI)
    .then(() => console.log("✅ Connected to NEU Library Database"))
    .catch(err => console.error("❌ Database connection error:", err));

// UPDATED SCHEMA: Includes Name, Program, and Blocked status
const visitorSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    role: String, // Student or Faculty
    college: String,
    program: String,
    department: String,
    position: String,
    reason: String,
    time: { type: Date, default: Date.now },
    isBlocked: { type: Boolean, default: false }
});

const Visitor = mongoose.model('Visitor', visitorSchema);

// AUTH LOGIC (Remains the same)
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

// SAVE VISIT: Now records the full profile
app.post('/api/visitors', async (req, res) => {
    try {
        const newEntry = new Visitor(req.body);
        await newEntry.save();
        res.status(201).json({ message: "Visit saved!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save" });
    }
});

// GET VISITS: Now supports Date Range filtering
app.get('/api/visitors', async (req, res) => {
    try {
        const { start, end } = req.query;
        let query = {};
        if (start && end) {
            query.time = { $gte: new Date(start), $lte: new Date(end) };
        }
        const logs = await Visitor.find(query).sort({ time: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch" });
    }
});

// BLOCK VISITOR ROUTE
app.patch('/api/visitors/:id/block', async (req, res) => {
    try {
        const visitor = await Visitor.findByIdAndUpdate(req.params.id, { isBlocked: req.body.isBlocked }, { new: true });
        res.json(visitor);
    } catch (err) { res.status(500).send(err); }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));