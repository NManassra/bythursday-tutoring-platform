# byThursday Agent Guide

Architecture: Next.js App Router + TypeScript + Prisma/SQLite. Server code owns authentication, authorization, quiz availability, timing and scoring.

Never trust client role, user/student ID, score, deadline, quiz ownership or option/question relationships. Validate request bodies with Zod. Use HTTP-only opaque sessions with hashed tokens. Mutations are POST requests and the session cookie is SameSite=Lax.

Quiz rules: published + assigned + current server time are required to start. One attempt per student/quiz. deadlineAt is server-created. Correct answers are read from the DB. Negative scores are clamped to zero.

Arabic content must render correctly with RTL-aware markup when Arabic is detected. Keep UI accessible and mobile-friendly.

Commands: npm install; npm run db:push; npm run db:seed; npm run dev; npm run lint; npm run typecheck; npm test; npm run test:e2e.