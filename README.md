# byThursday Tutoring Platform

A production-minded tutoring quiz platform for students and teachers.

## Stack
Next.js App Router · TypeScript · Prisma · SQLite · Zod · Vitest · Playwright.

## Local setup
```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Demo password: `Demo12345!`
Student: `student1@bythursday.demo`
Teacher: `teacher1@bythursday.demo`

## Security model
Passwords are bcrypt hashed. Sessions use random opaque tokens; only SHA-256 token hashes are stored. Authorization is derived server-side. Attempts, deadlines, correct answers and scores are server-authoritative. Quiz option IDs are checked against their owning question.

## Tests
`npm run lint`
`npm run typecheck`
`npm test`
`npm run test:e2e`

See DECISIONS.md and CLAUDE.md for business and engineering rules.