const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

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

// Visitor Schema
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

// STATS ROUTE
app.get('/api/visitors/stats', async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(now);
        const day = now.getDay(); 
        const diff = now.getDate() - day; 
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const [total, today, week] = await Promise.all([
            Visitor.countDocuments(),
            Visitor.countDocuments({ time: { $gte: startOfDay } }),
            Visitor.countDocuments({ time: { $gte: startOfWeek } })
        ]);

        res.json({ total, today, week });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch statistics" });
    }
});

// AUTHENTICATION ROUTE (Checks for Blocked Status)
app.post('/api/auth', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const lowerEmail = email.toLowerCase();
        
        if (lowerEmail === 'jcesperanza@neu.edu.ph') {
            return res.json({ role: 'admin', redirect: 'admin.html' });
        }

        const isNEU = lowerEmail.endsWith('@neu.edu.ph');

        if (isNEU) {
            // Check if ANY record with this email is blocked
            const blockedUser = await Visitor.findOne({ email: lowerEmail, isBlocked: true });

            if (blockedUser) {
                return res.status(403).json({ message: 'Access Denied: Your account has been blocked by the Administrator.' });
            }
            
            const existingUser = await Visitor.findOne({ email: lowerEmail, firstName: { $exists: true } });
            res.json({ 
                role: 'user', 
                redirect: existingUser ? 'visitor_form.html' : 'registration.html' 
            });

        } else {
            res.status(403).json({ message: 'Access Denied. Use your institutional account' });
        }
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// SAVE VISITOR / LOG VISIT
app.post('/api/visitors', async (req, res) => {
    try {
        const { email, reason } = req.body;
        const lowerEmail = email.toLowerCase();

        // Check if blocked before allowing a new visit log
        const isBlocked = await Visitor.findOne({ email: lowerEmail, isBlocked: true });
        if (isBlocked) return res.status(403).json({ error: "Account Blocked" });

        const profile = await Visitor.findOne({ email: lowerEmail, firstName: { $exists: true } });

        if (profile && !req.body.firstName) {
            const newLog = new Visitor({
                ...profile.toObject(),
                _id: new mongoose.Types.ObjectId(), // New ID for the log entry
                reason: reason, 
                time: new Date(),
                isBlocked: false 
            });
            await newLog.save();
            return res.status(201).json({ message: "Visit Logged" });
        } else {
            const newEntry = new Visitor({ ...req.body, email: lowerEmail, time: new Date() });
            await newEntry.save();
            return res.status(201).json({ message: "Profile Registered" });
        }
    } catch (err) {
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

// BLOCK/UNBLOCK ROUTE (Replaces Delete)
app.patch('/api/visitors/block/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const { blockStatus } = req.body;
        
        // Update all records with this email to ensure full account block
        await Visitor.updateMany({ email: email.toLowerCase() }, { isBlocked: blockStatus });
        
        res.json({ message: blockStatus ? "Account Blocked" : "Account Unblocked" });
    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});