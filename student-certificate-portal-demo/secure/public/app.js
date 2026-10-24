const loginForm = document.querySelector("#loginForm");
const studentPanel = document.querySelector("#studentPanel");
const statusBox = document.querySelector("#status");
const certificate = document.querySelector("#certificate");
const generateButton = document.querySelector("#generateButton");

function showStatus(message) {
  statusBox.textContent = message;
}

function renderStudent(student) {
  document.querySelector("#profileId").textContent = student.studentId;
  document.querySelector("#profileName").textContent = student.name;
  document.querySelector("#profileProgramme").textContent = student.programme;
  document.querySelector("#profileStatus").textContent =
    student.completed ? "Completed" : "Not completed";
  loginForm.classList.add("hidden");
  studentPanel.classList.remove("hidden");
  certificate.classList.add("hidden");
  generateButton.disabled = !student.completed;
  generateButton.textContent = student.completed
    ? "Generate my certificate"
    : "Certificate unavailable — programme incomplete";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showStatus("Logging in…");

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: document.querySelector("#studentId").value.trim(),
        password: document.querySelector("#password").value
      })
    });
    const data = await response.json();
    if (!response.ok) {
      showStatus(data.error || "Login failed.");
      return;
    }
    renderStudent(data);
    showStatus("Logged in successfully.");
  } catch {
    showStatus("Could not reach the server.");
  }
});

generateButton.addEventListener("click", async () => {
  certificate.classList.add("hidden");
  showStatus("Checking eligibility…");

  try {
    // No student ID or name is sent. The server uses the session.
    const response = await fetch("/api/certificate", { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      showStatus(data.error || "Could not generate certificate.");
      return;
    }

    document.querySelector("#certName").textContent = data.name;
    document.querySelector("#certProgramme").textContent = data.programme;
    document.querySelector("#certId").textContent = `Student ID: ${data.studentId}`;
    showStatus(data.message);
    certificate.classList.remove("hidden");
  } catch {
    showStatus("Could not reach the server.");
  }
});

document.querySelector("#logoutButton").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  studentPanel.classList.add("hidden");
  loginForm.classList.remove("hidden");
  certificate.classList.add("hidden");
  showStatus("Logged out.");
});

// Re-check an existing session after page refresh.
(async function restoreSession() {
  try {
    const response = await fetch("/api/me");
    if (!response.ok) return;
    const student = await response.json();
    renderStudent(student);
    showStatus("Session restored.");
  } catch {
    // No active session or server unavailable; user can log in manually.
  }
})();
