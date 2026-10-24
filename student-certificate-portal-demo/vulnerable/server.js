const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3000;
const db = new sqlite3.Database(path.join(__dirname, "students.db"));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS students (
    student_id TEXT PRIMARY KEY,
    registered_name TEXT NOT NULL,
    programme TEXT NOT NULL,
    completed INTEGER NOT NULL
  )`);
  db.run(
    `INSERT OR IGNORE INTO students VALUES
      ('STU001', 'Ada Okafor', 'Web Development', 1),
      ('STU002', 'Chidi Bello', 'Web Development', 0)`
  );
});

// INTENTIONALLY VULNERABLE:
// - Trusts studentId and name supplied by the browser.
// - Does not check whether the programme is completed.
// - Does not authenticate the requester.
app.post("/api/certificate", (req, res) => {
  const { studentId, name } = req.body;

  db.get(
    "SELECT student_id, programme FROM students WHERE student_id = ?",
    [studentId],
    (err, student) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!student) return res.status(404).json({ error: "Student not found" });

      // The caller controls `name`; completion is never checked.
      res.json({
        studentId: student.student_id,
        name: String(name || ""),
        programme: student.programme,
        message: "Certificate generated (vulnerable demo)"
      });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Vulnerable demo: http://localhost:${PORT}`);
});
