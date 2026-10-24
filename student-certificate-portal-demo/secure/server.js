const express = require("express");
const session = require("express-session");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 3001;
const db = new sqlite3.Database(path.join(__dirname, "students.db"));

app.use(express.json());
app.use(session({
  name: "student_portal_session",
  secret: process.env.SESSION_SECRET || "change-this-demo-secret-before-deployment",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // Set true when served over HTTPS in production.
    maxAge: 30 * 60 * 1000
  }
}));
app.use(express.static(path.join(__dirname, "public")));

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) reject(err);
    else resolve(this);
  });
});
const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

async function initialise() {
  await run(`CREATE TABLE IF NOT EXISTS students (
    student_id TEXT PRIMARY KEY,
    registered_name TEXT NOT NULL,
    programme TEXT NOT NULL,
    completed INTEGER NOT NULL CHECK (completed IN (0, 1)),
    password_hash TEXT NOT NULL
  )`);

  const passwordHash = await bcrypt.hash("demo123", 10);
  await run(
    `INSERT OR IGNORE INTO students
      (student_id, registered_name, programme, completed, password_hash)
     VALUES (?, ?, ?, ?, ?)`,
    ["STU001", "Ada Okafor", "Web Development", 1, passwordHash]
  );
  await run(
    `INSERT OR IGNORE INTO students
      (student_id, registered_name, programme, completed, password_hash)
     VALUES (?, ?, ?, ?, ?)`,
    ["STU002", "Chidi Bello", "Web Development", 0, passwordHash]
  );
}

function requireLogin(req, res, next) {
  if (!req.session.studentId) {
    return res.status(401).json({ error: "Please log in first." });
  }
  next();
}

app.post("/api/login", async (req, res) => {
  try {
    const studentId = String(req.body.studentId || "").trim();
    const password = String(req.body.password || "");
    const student = await get(
      "SELECT student_id, registered_name, programme, completed, password_hash FROM students WHERE student_id = ?",
      [studentId]
    );

    if (!student || !(await bcrypt.compare(password, student.password_hash))) {
      return res.status(401).json({ error: "Invalid student ID or password." });
    }

    req.session.studentId = student.student_id;
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

app.get("/api/me", requireLogin, async (req, res) => {
  try {
    const student = await get(
      "SELECT student_id, registered_name, programme, completed FROM students WHERE student_id = ?",
      [req.session.studentId]
    );
    if (!student) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "Session is no longer valid." });
    }
    res.json({
      studentId: student.student_id,
      name: student.registered_name,
      programme: student.programme,
      completed: Boolean(student.completed)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to load student record." });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Could not log out." });
    res.clearCookie("student_portal_session");
    res.json({ message: "Logged out." });
  });
});

// SECURE APPROACH:
// - Student identity comes from the authenticated server-side session.
// - Name and completion status come from the database.
// - The request body cannot choose a different student or certificate name.
app.post("/api/certificate", requireLogin, async (req, res) => {
  try {
    const student = await get(
      "SELECT student_id, registered_name, programme, completed FROM students WHERE student_id = ?",
      [req.session.studentId]
    );

    if (!student) {
      return res.status(404).json({ error: "Student record not found." });
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to generate certificate." });
  }
});

initialise()
  .then(() => app.listen(PORT, () => console.log(`Secure demo: http://localhost:${PORT}`)))
  .catch((error) => {
    console.error("Database initialisation failed:", error);
    process.exit(1);
  });
