# Database

## Curriculum Structure

The curriculum hierarchy is:

Semester
-> Lecture
-> Subsection
-> Exercise

Exercises are generated automatically from the number of exercises defined for each lecture.

## Lecture Metadata

Lecture-related data includes:
- semester id
- lecture id
- lecture name
- number of exercises

This metadata is used to generate exercises automatically.

## Exercise Structure

Each exercise belongs to:
- one lecture
- optionally one subsection

Exercise data includes:
- exercise number
- subsection name
- subsection order

Subsections are mainly used to preserve the thematic and pedagogical order from the textbook.

## Review Data

Each exercise stores spaced repetition information such as:
- last review date
- evaluation grade
- next scheduled review date

The repetition system determines when an exercise should appear again in the review queue.