# AI Usage

## Tools used

ChatGPT was used as the primary AI coding assistant during the assessment. It was used for architecture discussion, implementation/debugging support, UI and UX iteration, security review, test-case design, documentation review and repository-level checklists.

## How I directed the AI

I provided the client brief, repository context, current implementation and concrete failures or requirements, then asked for targeted changes rather than accepting broad generated code blindly. Prompts emphasized:
- server-side authorization and trust boundaries;
- server-authoritative timing and scoring;
- IDOR, duplicate-attempt, race-condition and tampering cases;
- Arabic/RTL and mobile behavior;
- automated tests and clean-machine setup;
- concise, reviewable commits and documentation.

## How I checked the output

AI suggestions were treated as implementation input, not as proof of correctness. I reviewed the resulting code and behavior, then verified the repository with:
- ESLint;
- strict TypeScript type checking;
- Vitest unit tests;
- Playwright end-to-end tests;
- a production Next.js build;
- manual inspection of authentication, authorization, timing, scoring, session handling, validation, database constraints, security headers and adversarial cases.

The final verified test run passed 10 Playwright E2E tests and 5 unit tests, and the production build completed successfully.

## Human responsibility

Human review remained responsible for security and authorization decisions, business-rule interpretation, database constraints, Arabic/RTL behavior, responsive UX, dependency/configuration changes and deciding which AI suggestions were appropriate for the assessment.

No private credentials or secrets were intentionally supplied to or committed from the project. Demo credentials are seed-only assessment data.
