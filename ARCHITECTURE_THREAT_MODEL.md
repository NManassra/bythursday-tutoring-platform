# Architecture & Threat Model

## Architecture

The application uses a Next.js App Router frontend/API, Prisma ORM with SQLite for the assessment environment, Zod request validation, bcrypt password hashing, and opaque HTTP-only cookie sessions. Server routes are the trust boundary: the browser provides intent and identifiers, while the server derives identity, authorization, quiz availability, timing, correct answers and scores.

### Trust boundaries

1. Browser to API: all request fields are untrusted.
2. Session to server: identity comes only from the hashed session token stored server-side.
3. Teacher to owned resources: quiz/class ownership is checked on protected mutations and analytics queries.
4. Student to assigned quiz/attempt: assignment, ownership and attempt state are rechecked server-side.
5. Database to scoring: correct options and question points are loaded from the database rather than accepted from the client.

## Threat model

| Threat | Mitigation |
|---|---|
| IDOR / changing student or attempt IDs | Identity comes from session; attempt ownership is checked server-side |
| Role escalation | Role is read from the authenticated user; clients cannot submit a role |
| Viewing unpublished quizzes | Student quiz queries require published status plus assignment and availability |
| Cross-teacher access | Teacher resources require creator ownership |
| Score tampering | Server calculates score from DB-backed correct options and points |
| Timer manipulation | startedAt/deadlineAt use server time; client countdown is presentation only |
| Late submission race | Submission transaction re-checks deadline and submitted state |
| Duplicate attempt/submission | Database unique constraint plus transactional state checks |
| Invalid option/question injection | Zod validation plus question-to-option relationship checks |
| Password theft from DB | bcrypt password hashes; no plaintext passwords |
| Session token database exposure | Only SHA-256 token hashes are persisted |
| CSRF | SameSite=Lax cookies plus explicit Origin validation on mutations |
| Brute-force login | Database-backed per-source rate limiting |
| Audit gaps | Start, submit, auto-submit, login, quiz creation/publish and logout events are recorded |
| XSS | React escaping; no dangerouslySetInnerHTML |
| SQL injection | Prisma ORM; no raw SQL |
| Information leakage | Generic authentication errors and ownership checks |
| Network interruption | Offline indicator plus bounded autosave retries; server-side saved answers support resume |

## Remaining production hardening

- Use a managed production database with backups and restore drills instead of SQLite.
- Put sessions/audit retention and cleanup on an operational schedule.
- Store secrets in a deployment secret manager.
- Add a restrictive Content Security Policy after validating required Next.js assets.
- Consider distributed rate limiting when deployed across multiple application instances.
- Add monitoring/alerting around authentication abuse and failed submissions.
- For high-stakes exams requiring lockdown, use a dedicated controlled exam environment rather than relying on browser JavaScript navigation guards.
