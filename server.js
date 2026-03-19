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
    reason: String,
    time: { type: Date, default: Date.now },
    isBlocked: { type: Boolean, default: false }
});

const Visitor = mongoose.model('Visitor', visitorSchema);

// 3. AUTH LOGIC
app.post('/api/auth', async (req, res) => {
    try {
        const { email } = req.body;
        const lowerEmail = email.toLowerCase();
        const existingUser = await Visitor.findOne({ email: lowerEmail });

        // Admin logic for Prof. Esperanza
        if (lowerEmail === 'jcesperanza@neu.edu.ph') {
            return res.json({ 
                role: 'admin', 
                isNew: existingUser ? false : true 
            });
        } 
        
        if (lowerEmail.endsWith('@neu.edu.ph')) {
            if (existingUser && existingUser.isBlocked) {
                return res.status(403).json({ message: 'Access Denied: Account Blocked.' });
            }
            res.json({ 
                role: 'student', 
                redirect: existingUser ? 'visitor_form.html' : 'registration.html',
                isNew: existingUser ? false : true 
            });
        } else {
            res.status(403).json({ message: 'Please use your NEU email.' });
        }
    } catch (err) {
        res.status(500).json({ error: "Auth error" });
    }
});

// 4. SAVE VISIT DATA
app.post('/api/visitors', async (req, res) => {
    try {
        const newEntry = new Visitor(req.body);
        await newEntry.save();
        res.status(201).json({ message: "Success" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save" });
    }
});

// 5. GET VISIT DATA (For Dashboard)
app.get('/api/visitors', async (req, res) => {
    try {
        const logs = await Visitor.find().sort({ time: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: "Fetch error" });
    }
});

// 6. BLOCK VISITOR
app.patch('/api/visitors/:id/block', async (req, res) => {
    try {
        const visitor = await Visitor.findByIdAndUpdate(req.params.id, { isBlocked: req.body.isBlocked }, { new: true });
        res.json(visitor);
    } catch (err) { res.status(500).send(err); }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));