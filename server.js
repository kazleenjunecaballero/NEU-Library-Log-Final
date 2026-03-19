const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 1. Connect to MongoDB
const mongoURI = "mongodb+srv://kazleen:gj5Je4qWPg7YP94n@cluster0.edipnmh.mongodb.net/?appName=Cluster0";
mongoose.connect(mongoURI)
    .then(() => console.log("Connected to NEU Library Database"))
    .catch(err => console.error("Database connection error:", err));

// 2. Define the Visitor Schema
const visitorSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    role: String, 
    college: String,
    program: String,
    department: String,
    position: String,
    reason: String,
    isEmployee: Boolean,
    time: { type: Date, default: Date.now },
    isBlocked: { type: Boolean, default: false }
});

const Visitor = mongoose.model('Visitor', visitorSchema);

// 3. AUTH LOGIC - FIXED ADMIN SECURITY
app.post('/api/auth', (req, res) => {
    const { email } = req.body;
    // Strict Check: Only Sir Esperanza's exact email is Admin
    if (email.toLowerCase() === 'jcesperanza@neu.edu.ph') {
        res.json({ role: 'admin' });
    } else if (email.toLowerCase().endsWith('@neu.edu.ph')) {
        res.json({ role: 'student' });
    } else {
        res.status(403).json({ message: 'Access Denied' });
    }
});

// 4. SAVE Visit Data to MongoDB
app.post('/api/visitors', async (req, res) => {
    try {
        const newEntry = new Visitor(req.body);
        await newEntry.save();
        res.status(201).json({ message: "Visit saved to cloud!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save to database" });
    }
});

// 5. GET Visit Data - FIXED "UNDEFINED" NAMES
app.get('/api/visitors', async (req, res) => {
    try {
        const { start, end } = req.query;
        let query = {};
        if (start && end) {
            query.time = { $gte: new Date(start), $lte: new Date(end) };
        }
        
        const logs = await Visitor.find(query).sort({ time: -1 });
        
        // Map data to ensure no "undefined" appears in the Admin Dashboard table
        const cleanedLogs = logs.map(v => ({
            _id: v._id,
            firstName: v.firstName || "New",
            lastName: v.lastName || "User",
            email: v.email || "N/A",
            role: v.role || (v.isEmployee ? "Staff" : "Student"),
            college: v.college || v.department || "CICS",
            reason: v.reason || "Reading",
            time: v.time,
            isBlocked: v.isBlocked || false
        }));
        
        res.json(cleanedLogs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch logs" });
    }
});

// 6. BLOCK VISITOR ROUTE
app.patch('/api/visitors/:id/block', async (req, res) => {
    try {
        const visitor = await Visitor.findByIdAndUpdate(
            req.params.id, 
            { isBlocked: req.body.isBlocked }, 
            { new: true }
        );
        res.json(visitor);
    } catch (err) { 
        res.status(500).send(err); 
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});