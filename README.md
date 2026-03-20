# 📚 NEU Library Visitor Log System

**Project Link:** [https://neu-library-log-final.onrender.com]

### Professor Access
- **Admin Email:** jcesperanza@neu.edu.ph
- **Features:** - Google Login implementation
  - Role-based access control
  - Visitor statistics filtered by College and Reason

A full-stack web application designed for New Era University to manage and track library visitors. This project features institutional email validation, role-based access control, and an administrative dashboard.

## 🛠 Key Features

### 1. Strict Institutional Authentication
- **Regex Validation:** The system strictly enforces the institutional email format: `name.surname@neu.edu.ph`.
- **Dot Requirement:** Rejects emails like `namesurname@neu.edu.ph` to ensure academic data integrity.

### 2. Smart Role Selection (Admin vs. User)
- **Unified Login:** The Administrator (`jcesperanza@neu.edu.ph`) uses the same login portal as students.
- **Selection Bridge:** Upon login, the Admin is presented with a choice:
  - **Admin Dashboard:** Access to visitor statistics and log management.
  - **Normal Log In:** Allows the Admin to log a personal library visit just like a student/faculty member.

### 3. Persistent Sessions
- **No Auto-Logout:** Uses `localStorage` to keep users signed in even after a page refresh.
- **Personalized Welcome:** Displays a dynamic greeting: *"Welcome [Name] of [Program]!"* fetched from the database.

### 4. Admin Dashboard & Security
- **Real-time Stats:** Tracks total visitors, daily visitors, and weekly trends.
- **Account Control:** Admin can block/unblock specific users from accessing the system.
- **Manual Overrides:** Ensures the "Admin" role is correctly labeled in logs even when logging in as a visitor.

---

## 💻 Tech Stack
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Deployment:** Render / GitHub

---

## 📂 Project Structure
- `server.js` - Express backend with MongoDB integration and Auth logic.
- `index.html` - The main login portal.
- `role_selection.html` - The bridge for Admin role choosing.
- `registration.html` - Profile setup for first-time visitors.
- `visitor_form.html` - The primary interface for logging library purpose.
- `admin.html` - Secure dashboard for library administrators.

---

## 👤 Author
**Kazleen June B Caballero** *BSIT - 2rd Year* *New Era University*
