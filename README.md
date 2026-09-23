# byThursday Tutoring Platform

A secure, mobile-first tutoring quiz platform built for the practical assessment.

## Product

### Students
- Sign in with a secure server-side session.
- See only published quizzes assigned through their classes.
- Start an available quiz and receive a server-created deadline.
- Answer Arabic or English multiple-choice questions with RTL-aware rendering.
- Submit once and receive a server-calculated score.

### Teachers
- Create quiz drafts with title, description, class, availability window and duration.
- Add/remove questions and 2–6 answer options.
- Select exactly one correct option per question.
- Set per-question points and optional negative marking.
- Publish complete drafts.
- View attempted/assigned counts, average, highest, lowest and completion rate.

## Stack

Next.js App Router, TypeScript, Prisma, SQLite, Zod, Vitest and Playwright.

## Run

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

For a production build:

```bash
npm run build
npm start
```

## Demo accounts

- Student: `student1@bythursday.demo`
- Teacher: `teacher1@bythursday.demo`
- Password: `Demo12345!`

The demo password is seed data for local assessment use only.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

## Core business/security rules

- A student can start only an assigned, published quiz inside its availability window.
- Attempt start and deadline are created from server time.
- The effective deadline is the earlier of start + duration and quiz close time.
- A quiz has at most one attempt per student through a database unique constraint.
- Correct answers and scores are calculated server-side.
- Client-submitted role, student ID, score, deadline, question ownership and option ownership are never trusted.
- Wrong answers use question points × negativeMarkPercent / 100; unanswered answers score 0; final score is clamped to zero.
- Teacher APIs verify quiz/class ownership.
- Student result pages verify attempt ownership before displaying results.

## Timing model

The browser countdown is presentation only. The server decides whether an attempt may start or submit. Refreshing the page, changing the browser clock, opening multiple tabs or calling the API directly cannot extend the server-created deadline.

## Testing

Unit tests cover scoring and validation. Playwright covers authentication, the student quiz flow, teacher publishing flow and cross-student attempt authorization.

## Documentation

- `DECISIONS.md` — architecture and business-rule decisions.
- `SECURITY_AUDIT.md` — verified security controls and remaining production hardening.
- `CLAUDE.md` — implementation conventions for future agents.
- `AI_USAGE.md` — AI assistance and human-review boundaries.
