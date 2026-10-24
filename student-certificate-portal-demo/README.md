# Student Certificate Portal Demo

Two educational implementations of the same scenario:

- `vulnerable/`: demonstrates trusting a client-supplied name and failing to check programme completion.
- `secure/`: uses server-side sessions, retrieves the name from the database, and checks completion before generating a certificate.

## Requirements
- Node.js 18+
- npm

## Run the vulnerable demo
```bash
cd vulnerable
npm install
npm start
```
Open http://localhost:3000

Demo student IDs:
- `STU001` — completed
- `STU002` — not completed

In this intentionally vulnerable version, try generating a certificate for `STU002`, or change the name field before generating. The backend accepts the client-supplied name and doesn't check completion.

## Run the secure demo
Open a second terminal:
```bash
cd secure
npm install
npm start
```
Open http://localhost:3001

Demo login credentials:
- Completed student: `STU001` / `demo123`
- Incomplete student: `STU002` / `demo123`

The secure version only issues a certificate for the currently logged-in student if their database record says the programme is completed. It uses the registered name from the database, not a name supplied by the browser.

## Important notes
This is a teaching demo, not production-ready software. Before production use:
- Use HTTPS and secure cookie settings behind correctly configured HTTPS.
- Use a proper identity provider or robust password reset and account-management flows.
- Add CSRF protection where appropriate, rate limiting, audit logging, database migrations, backups, and operational monitoring.
- Treat completion status as authoritative only if it is maintained by trusted academic records workflows.
- Consider certificate IDs, verification endpoints, revocation, and tamper-evident PDFs.
- Never use a student ID alone as authentication.
