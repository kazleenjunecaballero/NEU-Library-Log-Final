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
app.post('/api/auth', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const lowerEmail = email.toLowerCase();
        
        // Admin Identity Check
        if (lowerEmail === 'jcesperanza@neu.edu.ph') {
            return res.json({ role: 'admin', redirect: 'admin.html' });
        } 

        // Check if user exists in database
        const existingUser = await Visitor.findOne({ email: lowerEmail });

        if (lowerEmail.endsWith('@neu.edu.ph')) {
            if (existingUser && existingUser.isBlocked) {
                return res.status(403).json({ message: 'Access Denied: Account Blocked.' });
            }
            
            // If they exist, go to log form; if not, go to registration
            res.json({ 
                role: 'user', 
                redirect: existingUser ? 'visitor_form.html' : 'registration.html' 
            });
        } else {
            res.status(403).json({ message: 'Please use your @neu.edu.ph email.' });
        }
    } catch (err) {
        console.error("Auth Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// SAVE VISITOR (Registration)
app.post('/api/visitors', async (req, res) => {
    try {
        const newEntry = new Visitor(req.body);
        await newEntry.save();
        res.status(201).json({ message: "Success" });
    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).json({ error: "Failed to save data" });
    }
});

// GET ALL VISITORS (For Admin)
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

app.listen(PORT, () => console.log(`🚀 Server at http://localhost:${PORT}`));