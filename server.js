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
        
        // 1. Admin Identity Check (Stays exactly as you had it)
        if (lowerEmail === 'jcesperanza@neu.edu.ph') {
            return res.json({ role: 'admin', redirect: 'admin.html' });
        } 

        // 2. The new "firstname.lastname" Check
        // This ensures there is a dot before the @neu.edu.ph
        const neuPattern = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@neu\.edu\.ph$/;
        
        // We check two things: Does it follow the pattern AND end with @neu.edu.ph?
        const isCorrectFormat = neuPattern.test(lowerEmail) && lowerEmail.includes('.');

        if (isCorrectFormat) {
            // 3. Check if user exists (Important for your redirect logic)
            const existingUser = await Visitor.findOne({ email: lowerEmail });

            // 4. Keep your Blocked Account check
            if (existingUser && existingUser.isBlocked) {
                return res.status(403).json({ message: 'Access Denied: Account Blocked.' });
            }
            
            // 5. Redirect logic (Registration vs Visitor Form)
            res.json({ 
                role: 'user', 
                redirect: existingUser ? 'visitor_form.html' : 'registration.html' 
            });

        } else {
            // This triggers if they forget the dot or use a non-NEU email
            res.status(403).json({ 
                message: 'Access Denied. Use NEU account' 
            });
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