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

// 3. AUTH LOGIC - REDIRECTS TO SPECIFIC FILES
app.post('/api/auth', async (req, res) => {
    const { email } = req.body;
    const lowerEmail = email.toLowerCase();

    // STRICT ADMIN CHECK
    if (lowerEmail === 'jcesperanza@neu.edu.ph') {
        return res.json({ role: 'admin', redirect: 'admin.html' });
    } 
    
    // NEU STUDENT/FACULTY CHECK
    if (lowerEmail.endsWith('@neu.edu.ph')) {
        // Check if they already have a profile in the database
        const existingUser = await Visitor.findOne({ email: lowerEmail });
        
        if (existingUser) {
            // If they exist, go straight to the visit form
            res.json({ role: 'student', redirect: 'visitor_form.html', isNew: false });
        } else {
            // If they are new, go to the registration form
            res.json({ role: 'student', redirect: 'registration.html', isNew: true });
        }
    } else {
        res.status(403).json({ message: 'Access Denied: Use your NEU email.' });
    }
});

// 4. SAVE Visit Data (Used by registration.html and visitor_form.html)
app.post('/api/visitors', async (req, res) => {
    try {
        const newEntry = new Visitor(req.body);
        await newEntry.save();
        res.status(201).json({ message: "Data saved successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save to database" });
    }
});

// 5. GET Visit Data (Used by admin.html)
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