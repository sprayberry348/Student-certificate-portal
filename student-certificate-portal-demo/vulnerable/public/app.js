const form = document.querySelector("#certificateForm");
const statusBox = document.querySelector("#status");
const certificate = document.querySelector("#certificate");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  certificate.classList.add("hidden");
  statusBox.textContent = "Generating…";

  const response = await fetch("/api/certificate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: document.querySelector("#studentId").value.trim(),
      name: document.querySelector("#name").value.trim()
    })
  });

  const data = await response.json();
  if (!response.ok) {
    statusBox.textContent = data.error || "Could not generate certificate.";
    return;
  }

  // textContent avoids introducing an HTML injection issue in this demo.
  document.querySelector("#certName").textContent = data.name;
  document.querySelector("#certProgramme").textContent = data.programme;
  document.querySelector("#certId").textContent = `Student ID: ${data.studentId}`;
  statusBox.textContent = data.message;
  certificate.classList.remove("hidden");
});
