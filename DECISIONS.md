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

## Teacher authoring
The teacher UI creates drafts through the same validated API used by any future authoring client. The UI supports question-level points, 2–6 options, one correct option, class assignment, availability dates, duration and negative marking. Publishing remains a separate server-side owner check.

## Arabic and RTL
The document defaults to auto direction. Arabic or mixed-direction user content uses dir="auto" at the content boundary so Arabic questions, titles and options can render naturally without forcing the entire application into RTL. CSS keeps controls readable and usable in both directions.

## Progressive disclosure
The teacher dashboard separates authoring from quiz management and analytics. Students see only currently available assigned quizzes, with clear loading, empty and error states.
