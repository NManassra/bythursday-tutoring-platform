# Architecture Decisions

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