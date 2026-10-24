const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Sample data for demonstration only — no database required.
const students = [
  {
    student_id: "STU001",
    registered_name: "Ada Okafor",
    programme: "Web Development",
    completed: 1
  },
  {
    student_id: "STU002",
    registered_name: "Chidi Bello",
    programme: "Web Development",
    completed: 0
  }
];

// INTENTIONALLY VULNERABLE DEMONSTRATION:
// - Trusts the name supplied by the browser.
// - Does not check programme completion.
// - Does not authenticate the requester.
app.post("/api/certificate", (req, res) => {
  const { studentId, name } = req.body;

  const student = students.find(
    (s) => s.student_id === studentId
  );

  if (!student) {
    return res.status(404).json({
      error: "Student not found"
    });
  }

  res.json({
    studentId: student.student_id,
    name: String(name || ""),
    programme: student.programme,
    message: "Certificate generated (vulnerable demo)"
  });
});

module.exports = app;