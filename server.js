const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database Connection
const mongoURI = "mongodb+srv://kazleen:gj5Je4qWPg7YP94n@cluster0.edipnmh.mongodb.net/NEU_Library?retryWrites=true&w=majority";
mongoose.connect(mongoURI)
    .then(() => console.log("✅ Connected to NEU Library Database"))
    .catch(err => console.error("❌ Database connection error:", err));

// Visitor Schema - Matches your Registration Form exactly
const visitorSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, lowercase: true }, // Added lowercase to prevent duplicates
    role: String, 
    college: String,
    program: String,
    yearLevel: String, 
    department: String,
    position: String, // Added missing position field
    reason: String,
    time: { type: Date, default: Date.now },
    isBlocked: { type: Boolean, default: false }
});

const Visitor = mongoose.model('Visitor', visitorSchema);

// AUTH ROUTE
// AUTHENTICATION ROUTE
app.post('/api/auth', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const lowerEmail = email.toLowerCase();
        
        // Admin Identity Check
        if (lowerEmail === 'jcesperanza@neu.edu.ph') {
            return res.json({ role: 'admin', redirect: 'role_selection.html' });
        }

        // STRICT Format Check: Must have a DOT before @neu.edu.ph
        const hasDot = lowerEmail.includes('.') && lowerEmail.split('@')[0].includes('.');
        const isNEU = lowerEmail.endsWith('@neu.edu.ph');

        if (isNEU && hasDot) {
            // Check if user exists (finding their original registration profile)
            const existingUser = await Visitor.findOne({ email: lowerEmail, firstName: { $exists: true } });

            // Blocked check
            if (existingUser && existingUser.isBlocked) {
                return res.status(403).json({ message: 'Access Denied: Account Blocked.' });
            }
            
            res.json({ 
                role: 'user', 
                redirect: existingUser ? 'visitor_form.html' : 'registration.html' 
            });

        } else {
            res.status(403).json({ message: 'Access Denied. Use your institutional account' });
        }
    } catch (err) {
        console.error("Auth Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// NEW: CHECK ROUTE (Used by role_selection.html)
app.get('/api/visitors/check', async (req, res) => {
    try {
        const { email } = req.query;
        // Checks if this email has a completed profile (firstName exists)
        const visitor = await Visitor.findOne({ email: email.toLowerCase(), firstName: { $exists: true } });
        res.json({ exists: !!visitor });
    } catch (err) {
        res.status(500).json({ error: "Check failed" });
    }
});

// MODIFIED: SAVE VISITOR / LOG VISIT
app.post('/api/visitors', async (req, res) => {
    try {
        const { email, reason } = req.body;
        const lowerEmail = email.toLowerCase();

        // Check if a profile already exists for this email
        const profile = await Visitor.findOne({ email: lowerEmail, firstName: { $exists: true } });

        if (profile && !req.body.firstName) {
            // RETURNING USER: Create a new log using their saved profile data
            const newLog = new Visitor({
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                role: profile.role,
                college: profile.college,
                program: profile.program,
                yearLevel: profile.yearLevel,
                department: profile.department,
                position: profile.position,
                reason: reason, // New reason for today's visit
                time: new Date()
            });
            await newLog.save();
            return res.status(201).json({ message: "Visit Logged" });
        } else {
            // FIRST TIME REGISTRATION: Save everything from the registration form
            const newEntry = new Visitor({
                ...req.body,
                email: lowerEmail,
                time: new Date()
            });
            await newEntry.save();
            return res.status(201).json({ message: "Profile Registered" });
        }
    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).json({ error: "Failed to save data" });
    }
});

// GET ALL VISITORS (For Admin Dashboard)
app.get('/api/visitors', async (req, res) => {
    try {
        // Sort by time so the newest visits are at the top
        const logs = await Visitor.find().sort({ time: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch logs" });
    }
});

// DELETE LOG
app.delete('/api/visitors/:id', async (req, res) => {
    try {
        await Visitor.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});

app.listen(PORT, () => console.log(`🚀 Server at http://localhost:${PORT}`));