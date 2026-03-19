const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 1. Database Connection
const mongoURI = "mongodb+srv://kazleen:gj5Je4qWPg7YP94n@cluster0.edipnmh.mongodb.net/NEU_Library?retryWrites=true&w=majority";
mongoose.connect(mongoURI)
    .then(() => console.log("✅ Connected to NEU Library Database"))
    .catch(err => console.error("❌ Database connection error:", err));

// 2. Visitor Schema (Updated with Faculty Fields)
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
    time: { type: Date, default: Date.now },
    isBlocked: { type: Boolean, default: false }
});

const Visitor = mongoose.model('Visitor', visitorSchema);

// 3. AUTH ROUTE
app.post('/api/auth', async (req, res) => {
    try {
        const { email } = req.body;
        const lowerEmail = email.toLowerCase();
        const existingUser = await Visitor.findOne({ email: lowerEmail });

        // Admin Identity Check
        if (lowerEmail === 'jcesperanza@neu.edu.ph') {
            return res.json({ 
                role: 'admin', 
                isNew: existingUser ? false : true 
            });
        } 
        
        // Institutional Email Validation
        if (lowerEmail.endsWith('firstname.lastname@neu.edu.ph')) {
            if (existingUser && existingUser.isBlocked) {
                return res.status(403).json({ 
                    message: 'Access Denied: Your account has been blocked by the admin.' 
                });
            }
            res.json({ 
                role: 'student', 
                redirect: existingUser ? 'visitor_form.html' : 'registration.html',
                isNew: existingUser ? false : true 
            });
        } else {
            res.status(403).json({ message: 'Access Denied: Please use your NEU email.' });
        }
    } catch (err) {
        console.error("Auth Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 4. SAVE VISITOR DATA
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

// 5. GET DATA WITH DATE FILTERS (The "Missing" Code)
app.get('/api/visitors', async (req, res) => {
    try {
        const { start, end } = req.query;
        let query = {};
        
        if (start && end) {
            query.time = { 
                $gte: new Date(start), 
                $lte: new Date(new Date(end).setHours(23, 59, 59)) 
            };
        }
        
        const logs = await Visitor.find(query).sort({ time: -1 });
        res.json(logs);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ error: "Failed to fetch logs" });
    }
});

// 6. BLOCK/UNBLOCK VISITOR
app.patch('/api/visitors/:id/block', async (req, res) => {
    try {
        const { isBlocked } = req.body;
        const visitor = await Visitor.findByIdAndUpdate(
            req.params.id, 
            { isBlocked: isBlocked }, 
            { new: true }
        );
        res.json(visitor);
    } catch (err) {
        res.status(500).json({ error: "Block action failed" });
    }
});

// 7. DELETE LOG (Optional but usually in full versions)
app.delete('/api/visitors/:id', async (req, res) => {
    try {
        await Visitor.findByIdAndDelete(req.params.id);
        res.json({ message: "Log deleted" });
    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});