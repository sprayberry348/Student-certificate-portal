const express = require("express");
const path = require("path");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.set("trust proxy", 1);

app.use(cookieSession({
  name: "student_portal_session",
  keys: [
    process.env.SESSION_SECRET || "demo-only-change-this-secret-123456"
  ],
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 30 * 60 * 1000
}));

// Demo data only. No database is used.
const students = [
  {
    student_id: "STU001",
    registered_name: "Ada Okafor",
    programme: "Web Development",
    completed: 1,
    password_hash: bcrypt.hashSync("demo123", 10)
  },
  {
    student_id: "STU002",
    registered_name: "Chidi Bello",
    programme: "Web Development",
    completed: 0,
    password_hash: bcrypt.hashSync("demo123", 10)
  }
];

function requireLogin(req, res, next) {
  if (!req.session || !req.session.studentId) {
    return res.status(401).json({
      error: "Please log in first."
    });
  }
  next();
}

app.post("/api/login", async (req, res) => {
  try {
    const studentId = String(req.body.studentId || "").trim();
    const password = String(req.body.password || "");

    const student = students.find(
      s => s.student_id === studentId
    );

    if (
      !student ||
      !(await bcrypt.compare(password, student.password_hash))
    ) {
      return res.status(401).json({
        error: "Invalid student ID or password."
      });
    }

    req.session = { studentId: student.student_id };

    res.json({
      studentId: student.student_id,
      name: student.registered_name,
      programme: student.programme,
      completed: Boolean(student.completed)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to log in." });
  }
});

app.get("/api/me", requireLogin, (req, res) => {
  const student = students.find(
    s => s.student_id === req.session.studentId
  );

  if (!student) {
    req.session = null;
    return res.status(401).json({
      error: "Session is no longer valid."
    });
  }

  res.json({
    studentId: student.student_id,
    name: student.registered_name,
    programme: student.programme,
    completed: Boolean(student.completed)
  });
});

app.post("/api/logout", (req, res) => {
  req.session = null;
  res.json({ message: "Logged out." });
});

app.post("/api/certificate", requireLogin, (req, res) => {
  const student = students.find(
    s => s.student_id === req.session.studentId
  );

  if (!student) {
    return res.status(404).json({
      error: "Student record not found."
    });
  }

  if (student.completed !== 1) {
    return res.status(403).json({
      error: "Certificate unavailable. Your programme has not been marked as completed."
    });
  }

  res.json({
    studentId: student.student_id,
    name: student.registered_name,
    programme: student.programme,
    message: "Certificate generated successfully."
  });
});

// Export the app for Vercel.
module.exports = app;