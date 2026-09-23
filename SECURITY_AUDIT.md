# Security Audit

## Verified controls

- Authentication: bcrypt password hashing (12 rounds); opaque 32-byte random session tokens; only SHA-256 token hashes are stored.
- Session security: HTTP-only cookies, SameSite=Lax, Secure in production, path /, seven-day expiration, and server-side expiration checks.
- Authorization / IDOR: protected endpoints derive identity from the session and enforce role, ownership, class assignment, or attempt ownership. Result pages also verify the authenticated student owns the attempt.
- Timing: attempt start and deadlineAt are server-authoritative. The effective deadline is the earlier of start + duration and quiz close. Submission re-checks the deadline inside a transaction.
- Scoring: score, max score, role, student identity, correct answers, question points, and deadlines are not client-controlled. Negative marking is calculated server-side and the final score is clamped to zero.
- Duplicate attempts/submissions: (quizId, studentId) is unique in the database; submission also uses a transactional state re-check and (attemptId, questionId) is unique.
- Option/question integrity: every submitted question must belong to the attempt's quiz, and every selected option must belong to that question.
- Publication/access: students can start only published, assigned quizzes inside the server-side availability window; teachers can publish only their own complete quizzes.
- XSS / SQL injection: React rendering escapes text; there is no dangerouslySetInnerHTML or raw SQL in the application code inspected.
- Mass assignment: Zod schemas enumerate accepted request fields; database writes explicitly map validated values. Quiz creation supports optional per-question points with the same server-side validation.
- Security headers: X-Content-Type-Options, Referrer-Policy, X-Frame-Options, and Permissions-Policy are configured. Next.js development origin 127.0.0.1 is explicitly allowed to remove the Playwright cross-origin development warning.
- Secrets: .env, local SQLite databases, and local database journals are gitignored. Demo credentials are documented as non-production.
- Dependency baseline: the verified build uses Next.js 15.5.26. Next.js published 15.5.26 as the September 22, 2026 Maintenance LTS security update, so this version is current for the 15.x maintenance line as of this audit.

## Adversarial cases covered by automated tests

- Student authentication.
- Student start -> answer -> submit -> result.
- Teacher create -> publish -> student visibility.
- Cross-student attempt submission is rejected.
- Duplicate question IDs in a submission are rejected.
- Duplicate attempts are protected by the database uniqueness constraint and start-flow handling.

## Findings / production hardening

1. Login rate limiting is not implemented. Add an external/shared rate limiter or WAF before public deployment.
2. Centralized audit logging is not implemented. Production should record authentication failures, privilege-sensitive actions, publishing, submissions, and administrative changes.
3. A nonce-based Content-Security-Policy is not yet configured. Current headers mitigate clickjacking, MIME confusion, referrer leakage, and unnecessary browser capabilities, but CSP should be added for a public deployment.
4. SQLite is appropriate for the assessment/demo, but a managed production database with backups and appropriate connection management should be used for real traffic.
5. Production session/database secrets must come from deployment secret management, not committed configuration.
6. CSRF defense-in-depth: mutations are POST-only and JSON APIs require application/json; together with SameSite=Lax this materially reduces browser CSRF risk. For public deployment, validate the Origin header on authenticated mutations as an additional defense.
7. Teacher quiz listing currently includes full attempt records. It should return only the fields the teacher UI needs, such as a submitted-attempt count, rather than exposing internal attempt metadata to the browser.
8. Session cleanup/retention and operational database backup/restore procedures should be added for production.

## Assessment conclusion

The application has server-side authentication, authorization, timing, scoring, and integrity controls appropriate for the practical assessment. The remaining findings are primarily production-operational hardening rather than known bypasses in the assessed quiz flows.
