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


## Active-attempt navigation and recovery
Leaving an in-progress quiz does not create a new attempt or reset the timer. The browser back action is intercepted with a warning, and refresh/close uses the browser's native leave-warning where supported. This is a UX safeguard, not a security boundary: browsers do not permit ordinary web pages to permanently disable back/forward navigation. The server remains authoritative over the attempt deadline and submission state.

In-progress answers are autosaved server-side after changes. When a student returns to the same attempt, saved answers are restored. This mirrors common LMS behavior: Moodle supports continuing an unfinished attempt and autosaving responses, while Canvas keeps a timed attempt running when a student navigates away and supports resuming an in-process quiz. High-stakes lockdown behavior belongs to a dedicated exam browser such as Safe Exam Browser rather than ordinary page JavaScript.
