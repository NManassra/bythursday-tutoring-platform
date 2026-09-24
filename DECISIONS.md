# Architecture Decisions

## Architecture and technology choices

The implementation intentionally uses a small full-stack stack that is easy to run locally and keeps the assessment's trust boundary on the server.

- **Next.js App Router** — provides the React UI and server-side route handlers in one application, which keeps authentication, authorization and quiz business rules close to the data layer and makes the clean-machine setup straightforward.
- **TypeScript** — catches incorrect data flow and API assumptions at compile time and makes the security-sensitive business rules easier to refactor safely.
- **Prisma** — provides a typed database client and schema constraints, including the unique constraint that prevents duplicate student attempts.
- **SQLite** — keeps the assessment self-contained with zero external database services. It is appropriate for the demo/assessment workload; a managed relational database would be used for real production traffic.
- **Zod** — validates untrusted request bodies at the API boundary before values reach business logic or database writes.
- **Tailwind CSS / custom responsive CSS** — supports a mobile-first interface without introducing a large design-system dependency. The implementation keeps the UI lightweight and responsive for phone-sized screens.
- **Accessible custom UI patterns** — quiz questions use semantic fieldsets/legends, visible focus states and touch-friendly controls. A component library was deliberately not required because the application has a small set of focused interaction patterns.
- **bcryptjs** — hashes passwords with a deliberately expensive password-hashing function rather than storing plaintext credentials.
- **Vitest** — provides fast unit coverage for deterministic business logic such as scoring and validation.
- **Playwright** — exercises the real browser workflow, including authentication, quiz taking, teacher publishing and authorization boundaries.
- **ESLint** — catches common JavaScript/TypeScript and Next.js code-quality issues before submission.

The brief allowed any language, framework or database. The stack was chosen for fast iteration, a small operational footprint, strong typing, straightforward server-side authorization, and a clean local developer experience.

## Server-authoritative timing

The server creates an attempt using server time. deadlineAt is the earlier of start + duration and quiz close. The browser countdown is presentation only.

## Server-authoritative scoring

The server loads the quiz and correct options from the database. Submitted score, role, student identity and deadline are never trusted.

## Authorization

Every protected resource derives identity from the session and checks ownership/assignment server-side. IDs supplied by clients are treated as untrusted selectors.

## One attempt

Attempt has a unique (quizId, studentId) constraint. Submission is transactional and re-checks ownership, submission state and deadline to reduce race-condition abuse.

## Negative marking

Correct = question points; wrong = -question points × negativeMarkPercent / 100; unanswered = 0; final score is clamped to zero.

## Teacher authoring

The teacher UI creates drafts through the same validated API used by any future authoring client. The UI supports question-level points, 2–6 options, one correct option, class assignment, availability dates, duration and negative marking. Publishing remains a separate server-side owner check.

## Arabic and RTL

The document defaults to auto direction. Arabic or mixed-direction user content uses dir="auto" at the content boundary so Arabic questions, titles and options can render naturally without forcing the entire application into RTL. CSS keeps controls readable and usable in both directions.

## Progressive disclosure

The teacher dashboard separates authoring from quiz management and analytics. Students see only currently available assigned quizzes, with clear loading, empty and error states.

## Active-attempt navigation and recovery

Leaving an in-progress quiz does not create a new attempt or reset the timer. The browser back action is intercepted with a warning, and refresh/close uses the browser's native leave-warning where supported. This is a UX safeguard, not a security boundary: browsers do not permit ordinary web pages to permanently disable back/forward navigation. The server remains authoritative over the attempt deadline and submission state.

In-progress answers are autosaved server-side after changes. When a student returns to the same attempt, saved answers are restored. This mirrors common LMS behavior: Moodle supports continuing an unfinished attempt and autosaving responses, while Canvas keeps a timed attempt running when a student navigates away and supports resuming an in-process quiz. High-stakes lockdown behavior belongs to a dedicated exam browser such as Safe Exam Browser rather than ordinary page JavaScript.

## Deadline finalization

When the countdown reaches zero, the client requests a server-side finalization endpoint. The server loads the last autosaved answers, recalculates the score from database truth, and marks the attempt submitted transactionally. If the client is offline at the exact deadline, the attempt remains unsubmitted until a later request can be processed; the deadline still cannot be extended.

## Autosave reliability

Answer changes are debounced and retried with bounded exponential backoff. An offline indicator explains that selections remain local until connectivity returns. The server stores answers and the resume flow restores them.

## Security hardening

State-changing API routes validate Origin in addition to SameSite=Lax cookies. Login attempts are rate-limited in the database and important lifecycle events are recorded in an audit log. These are defense-in-depth controls, not substitutes for authorization checks.

## Accessibility and responsive QA

Quiz questions use fieldsets/legends and visible focus states. Interactive controls maintain touch-friendly dimensions. Manual and Playwright checks target 360x800, 390x844 and tablet widths.

## Issues encountered and resolved during development

These are the significant implementation/verification issues that affected the final design.

### SQLite write contention during Playwright

Parallel browser workers can contend on SQLite writes. Rather than masking this with application retries or weakening transactional behavior, the E2E configuration uses a single worker for deterministic SQLite execution. A production deployment would use a database designed for concurrent application traffic.

### localhost vs 127.0.0.1 origin validation

Origin validation correctly rejected a development request when Playwright used 127.0.0.1 while the application expected localhost. The test configuration was aligned with the application's development origin instead of weakening the CSRF defense.

### Client source syntax error caught by static checks

A malformed literal newline entered a TypeScript client source file during iteration. ESLint/type checking caught the problem before final verification, and the source was corrected before the passing test/build run.

### Autosave E2E timing

An early E2E assertion checked the UI too soon and did not prove that the answer had actually been persisted. The test was changed to wait for the successful answers API response, making the test validate the important server-side behavior rather than timing luck.

### Offline/reconnect state

Connectivity polling could clear the detected offline state immediately after a failed request. The implementation was changed so the offline state persists until a real reconnect event, while autosave retries remain bounded.

### Strict TypeScript analytics narrowing

Strict TypeScript identified a potentially undefined analytics value before question-level data was accessed. The code was explicitly narrowed instead of suppressing the type error.

## What I built beyond the brief

- Autosaving in-progress answers and restoring them after refresh/re-entry, because a timed quiz should tolerate ordinary browser navigation and transient connectivity without creating a second attempt.
- Server-side deadline finalization from saved answers, so the browser timer remains presentation-only.
- Login rate limiting, request-origin validation, audit events, security headers and a threat-model document as defense-in-depth for a public-facing assessment project.
- Question-level analytics and explicit loading, empty, error and offline states to make the workflow more useful and inspectable.

## Deliberately left out

- No real spreadsheet import yet: the brief says real spreadsheets will arrive later, so deterministic seed data is provided instead of inventing an import format.
- No password reset, email verification, teacher invitation flow or production account administration; these are outside the assessment's core workflow.
- No high-stakes browser lockdown or anti-cheating controls; ordinary browser JavaScript cannot provide a reliable exam-lockdown boundary.
- No production deployment, managed database, distributed rate limiter or centralized audit logging; the assessment uses SQLite and local operational controls.

## If I had another week

1. Add a validated CSV/XLSX import pipeline with preview, row-level validation and an import report.
2. Add teacher class/student management and richer reporting/export.
3. Add production deployment configuration with a managed database, secret management, centralized logging, monitoring and backups.
4. Add a restrictive CSP and a distributed abuse-prevention layer after deployment-specific testing.
5. Expand adversarial and accessibility coverage around concurrency, reconnects, keyboard-only navigation and real mobile devices.
