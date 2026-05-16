# Decisions

2026-05-16
- Chose PostgreSQL instead of SQLite to align local and future production environments.
- Chose a simple deterministic spaced-repetition algorithm for V0 (explicit grade → interval mapping), not SM-2; design the system to allow an upgrade to SM-2 or a more adaptive algorithm in the future.

2026-05-17
- Decided to align the database schema closely with the Zad textbook structure rather than over-generalizing the curriculum model.
- Rationale: V0 prioritizes semantic fidelity and simplicity over extensibility; premature abstraction was introducing unnecessary complexity in seed logic and domain interpretation.
- Tradeoff: reduces flexibility for future curricula, but improves correctness and reduces cognitive load during implementation.
- Action: update database.md to explicitly define exercise numbering and subsection semantics to prevent future AI drift in interpretation.