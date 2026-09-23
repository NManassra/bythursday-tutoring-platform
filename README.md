# byThursday Tutoring Platform

A secure tutoring quiz platform built for the practical assessment.

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

Demo accounts:
- Student: student1@bythursday.demo
- Teacher: teacher1@bythursday.demo
- Password: Demo12345!

## Test
```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

## Core rules
- A student can start only an assigned, published quiz inside its availability window.
- Attempt start and deadline are created by the server.
- A quiz has at most one attempt per student.
- Scores and correct answers are calculated server-side.
- Negative marking: wrong = points × negativeMarkPercent / 100; unanswered = 0; final score is clamped to zero.
- Protected resources always derive identity from the session.

See DECISIONS.md, SECURITY_AUDIT.md and CLAUDE.md.