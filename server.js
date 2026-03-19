const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // New: Added Mongoose
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 1. Connect to MongoDB
// Replace the string below with your actual MongoDB connection string
const mongoURI = "mongodb+srv://kazleen:gj5Je4qWPg7YP94n@cluster0.edipnmh.mongodb.net/?appName=Cluster0"; 
mongoose.connect(mongoURI)
    .then(() => console.log("Connected to NEU Library Database"))
    .catch(err => console.error("Database connection error:", err));

// 2. Define the Visitor Schema
const visitorSchema = new mongoose.Schema({
    email: String,
    reason: String,
    college: String,
    isEmployee: Boolean,
    time: String
});

const Visitor = mongoose.model('Visitor', visitorSchema);

// 3. Auth Logic
app.post('/api/auth', (req, res) => {
    const { email } = req.body;
    if (email === 'jcesperanza@neu.edu.ph') {
        res.json({ role: 'admin' });
    } else if (email.endsWith('@neu.edu.ph')) {
        res.json({ role: 'student' });
    } else {
        res.status(403).json({ message: 'Access Denied' });
    }
});

// 4. SAVE Visit Data to MongoDB
app.post('/api/visitors', async (req, res) => {
    try {
        const newEntry = new Visitor(req.body);
        await newEntry.save();
        res.status(201).json({ message: "Visit saved to cloud!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save to database" });
    }
});

// 5. GET Visit Data from MongoDB
app.get('/api/visitors', async (req, res) => {
    try {
        const logs = await Visitor.find().sort({ _id: -1 }); // Show newest first
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch logs" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});