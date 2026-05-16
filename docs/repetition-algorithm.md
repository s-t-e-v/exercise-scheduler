# Repetition Algorithm (V0)

## Goal
Keep exercises in long-term memory using a simple, deterministic spaced repetition system.

## Inputs
- lastReviewedAt
- lastGrade
- nextReviewAt (optional derived field)

## Grades
Define exactly what 0–3 means.

## Scheduling Rules
Explicit mapping:
grade → next interval

Example:
- 0 → 1 day
- 1 → 3 days
- 2 → 7 days
- 3 → 14 days

## Review Flow
1. user opens daily queue
2. fetch exercises where nextReviewAt <= now
3. user grades
4. system updates nextReviewAt

## Non-goals
- no SM-2 tuning
- no adaptive learning
- no user profiling
- no analytics influence

See the decision to use a simple V0 algorithm (and allow future upgrade to SM-2 or a more adaptive algorithm) in docs/decisions.md.