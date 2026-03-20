const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// FIX: Moved the Render-compatible PORT to the top and removed the duplicate
const PORT = process.env.PORT || 10000; 

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
    email: { type: String, lowercase: true }, 
    role: String, 
    college: String,
    program: String,
    yearLevel: String, 
    department: String,
    position: String, 
    reason: String,
    time: { type: Date, default: Date.now },
    isBlocked: { type: Boolean, default: false }
});

const Visitor = mongoose.model('Visitor', visitorSchema);

// AUTHENTICATION ROUTE
app.post('/api/auth', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const lowerEmail = email.toLowerCase();
        
        if (lowerEmail === 'jcesperanza@neu.edu.ph') {
            return res.json({ role: 'admin', redirect: 'role_selection.html' });
        }

        const hasDot = lowerEmail.includes('.') && lowerEmail.split('@')[0].includes('.');
        const isNEU = lowerEmail.endsWith('@neu.edu.ph');

        if (isNEU && hasDot) {
            const existingUser = await Visitor.findOne({ email: lowerEmail, firstName: { $exists: true } });

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

// CHECK ROUTE
app.get('/api/visitors/check', async (req, res) => {
    try {
        const { email } = req.query;
        const visitor = await Visitor.findOne({ email: email.toLowerCase(), firstName: { $exists: true } });
        res.json({ exists: !!visitor });
    } catch (err) {
        res.status(500).json({ error: "Check failed" });
    }
});

// SAVE VISITOR / LOG VISIT
app.post('/api/visitors', async (req, res) => {
    try {
        const { email, reason } = req.body;
        const lowerEmail = email.toLowerCase();

        const profile = await Visitor.findOne({ email: lowerEmail, firstName: { $exists: true } });

        if (profile && !req.body.firstName) {
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
                reason: reason, 
                time: new Date()
            });
            await newLog.save();
            return res.status(201).json({ message: "Visit Logged" });
        } else {
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

// GET ALL VISITORS
app.get('/api/visitors', async (req, res) => {
    try {
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

// FIX: Keeping the version that binds to '0.0.0.0' for Render
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});