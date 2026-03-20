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
        
        // Inside app.post('/api/auth', ...)
if (lowerEmail === 'jcesperanza@neu.edu.ph') {
    // Instead of going straight to admin.html, we go to role_selection.html
    return res.json({ role: 'admin', redirect: 'role_selection.html' });
}

        // 2. STRICT Format Check: Must have a DOT before @neu.edu.ph
        // This Regex ensures: text + dot + text + @neu.edu.ph
        const hasDot = lowerEmail.includes('.') && lowerEmail.split('@')[0].includes('.');
        const isNEU = lowerEmail.endsWith('@neu.edu.ph');

        if (isNEU && hasDot) {
            // Check if user exists
            const existingUser = await Visitor.findOne({ email: lowerEmail });

            // Blocked check
            if (existingUser && existingUser.isBlocked) {
                return res.status(403).json({ message: 'Access Denied: Account Blocked.' });
            }
            
            // Success: Send to correct page
            res.json({ 
                role: 'user', 
                redirect: existingUser ? 'visitor_form.html' : 'registration.html' 
            });

        } else {
            // DENIED: This triggers if there is no dot or it's not a @neu.edu.ph email
            res.status(403).json({ 
                message: 'Access Denied. Use format: firstname.lastname@neu.edu.ph' 
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