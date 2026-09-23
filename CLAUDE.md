# byThursday Agent Guide

## Architecture
Next.js App Router + TypeScript + Prisma/SQLite. Server code owns authentication, authorization, quiz availability, timing and scoring. The UI uses accessible custom CSS rather than relying on a component library.

## Security invariants
- Never trust client role, user/student ID, score, deadline, quiz ownership or question/option relationships.
- Validate request bodies with Zod.
- Use HTTP-only opaque sessions with hashed tokens.
- Protected mutations derive identity from the session and verify ownership/assignment server-side.
- Sessions use SameSite=Lax and Secure in production.
- Never return password hashes or correct-answer flags to students.
- Keep teacher quiz data scoped to the authenticated teacher.
- Database uniqueness prevents more than one attempt per student/quiz.

## Quiz rules
- Published + assigned + current server time are required to start.
- The server creates startedAt and deadlineAt.
- deadlineAt is the earlier of start + duration and quiz close time.
- A student can submit at most once.
- Correct answers are read from the DB.
- Scoring is server-side; wrong answers use question points × negativeMarkPercent / 100, unanswered answers score 0, and the final score is clamped to zero.

## Teacher workflow
- The teacher builder creates DRAFT quizzes.
- Each question has 2–6 options and exactly one correct option.
- Questions may have their own points.
- Publishing is a separate authenticated teacher-owner action.
- Analytics are restricted to the quiz owner.

## UI and accessibility
- Arabic and mixed Arabic/English content must use dir="auto" at the content boundary.
- Keep controls keyboard accessible with visible focus states.
- Buttons should have comfortable touch targets.
- Preserve useful loading, empty and error states.
- Keep layouts usable on narrow mobile screens.

## Commands
npm install
npm run db:push
npm run db:seed
npm run dev
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build

## Review checklist
Before changing business logic, inspect the relevant API authorization and schema constraints. Add or update tests for meaningful behavior changes. Do not weaken server-side checks to simplify UI code.


## Active attempt recovery
- Browser back is guarded with a leave warning while an attempt is in progress.
- Refresh/close uses the browser's native before-unload warning where supported.
- Leaving does not pause or reset the server-authoritative timer.
- An unfinished attempt can be resumed through the same quiz URL until its deadline.
- Student answers are autosaved server-side and restored when the attempt is resumed.
- Autosave and navigation guards are UX protections; never treat client-side navigation controls as security boundaries.
- Submission remains server-authoritative and transactional.

## Reliability and audit
- Timer expiry must be finalized server-side from server-saved answers; the browser timer is not authoritative.
- Autosave uses bounded retries and must surface offline/retry state.
- Explicit Exit Quiz is a UX action; browser navigation guards are not security controls.
- Mutating routes should validate request Origin as CSRF defense-in-depth.
- Login attempts are rate-limited; important authentication and quiz lifecycle events are audited.
- Teacher analytics may expose question-level correct, answered and unanswered rates only within the quiz owner's scope.
- Mobile QA targets 360x800, 390x844 and tablet widths.
