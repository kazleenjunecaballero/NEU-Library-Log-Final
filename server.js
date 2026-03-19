const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 1. Connect to MongoDB
const mongoURI = "mongodb+srv://kazleen:gj5Je4qWPg7YP94n@cluster0.edipnmh.mongodb.net/NEU_Library?retryWrites=true&w=majority";
mongoose.connect(mongoURI)
    .then(() => console.log("✅ Connected to NEU Library Database"))
    .catch(err => console.error("❌ Database connection error:", err));

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
    isEmployee: { type: Boolean, default: false },
    time: { type: Date, default: Date.now },
    isBlocked: { type: Boolean, default: false }
});

const Visitor = mongoose.model('Visitor', visitorSchema);

// 3. AUTH LOGIC - SMART REDIRECT & BLOCK CHECK
app.post('/api/auth', async (req, res) => {
    try {
        const { email } = req.body;
        const lowerEmail = email.toLowerCase();

        // STRICT ADMIN CHECK
        if (lowerEmail === 'jcesperanza@neu.edu.ph') {
            return res.json({ role: 'admin', redirect: 'admin.html' });
        } 
        
        // NEU STUDENT/FACULTY CHECK
        if (lowerEmail.endsWith('@neu.edu.ph')) {
            const existingUser = await Visitor.findOne({ email: lowerEmail });
            
            // NEW: BLOCK CHECK
            // If the user is found and isBlocked is true, stop them here.
            if (existingUser && existingUser.isBlocked) {
                return res.status(403).json({ 
                    message: 'Access Denied: Your account has been blocked. Please see the librarian.' 
                });
            }

            if (existingUser) {
                // Return user goes to visit form
                res.json({ role: 'student', redirect: 'visitor_form.html', isNew: false });
            } else {
                // New user goes to registration
                res.json({ role: 'student', redirect: 'registration.html', isNew: true });
            }
        } else {
            res.status(403).json({ message: 'Access Denied: Use your NEU email.' });
        }
    } catch (err) {
        res.status(500).json({ error: "Authentication error" });
    }
});

// 4. SAVE Visit Data
app.post('/api/visitors', async (req, res) => {
    try {
        const newEntry = new Visitor(req.body);
        await newEntry.save();
        res.status(201).json({ message: "Data saved successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save to database" });
    }
});

// 5. GET Visit Data (For Admin Table & Stats)
app.get('/api/visitors', async (req, res) => {
    try {
        const { start, end } = req.query;
        let query = {};
        if (start && end) {
            query.time = { $gte: new Date(start), $lte: new Date(end) };
        }
        
        const logs = await Visitor.find(query).sort({ time: -1 });
        
        const cleanedLogs = logs.map(v => ({
            _id: v._id,
            firstName: v.firstName || "New",
            lastName: v.lastName || "User",
            email: v.email || "N/A",
            role: v.role || (v.isEmployee ? "Staff" : "Student"),
            college: v.college || v.department || "N/A",
            reason: v.reason || "Not Set",
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
    console.log(`🚀 Server is running on port ${PORT}`);
});