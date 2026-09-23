# Security Audit Checklist

- Authentication: bcrypt password hashing; opaque random session tokens; HTTP-only, SameSite cookies.
- Authorization: server derives the user from the session and checks role, quiz ownership, class assignment and attempt ownership.
- IDOR: protected endpoints query by both resource ID and authenticated owner/assignment.
- Timing: server creates deadlineAt and rejects submissions after it; client countdown is not trusted.
- Scoring: correct answers and points come from the database; client score is ignored.
- Duplicate attempts/submissions: database unique constraint plus transactional re-check.
- Option injection: every submitted option is checked against its submitted question.
- XSS: React escapes rendered text; no dangerouslySetInnerHTML.
- SQL injection: Prisma parameterizes database operations; no raw SQL is used.
- CSRF: state-changing endpoints use POST and session cookies are SameSite=Lax.
- Mass assignment: API schemas enumerate accepted fields.
- Secrets: .env and local SQLite files are gitignored; demo credentials are explicitly non-production.
- Error disclosure: API responses avoid stack traces and internal database details.
- Remaining production hardening: add external rate limiting/WAF, centralized audit logs, stronger CSP/nonces, managed database/backups and secret management before public deployment.