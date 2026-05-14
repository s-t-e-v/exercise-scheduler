# Database

## Schema

This the main table:
- lecture id
- Semester id
- lecture name
- number of exercise

This the table of exercises:
- lecture number
- subsection name
- subsection id
- exercise number
- last repetition date
- evaluation grade
- scheduled repetition date

## Logic

### Main table
The main table contains most of meta data related to a group of exercise.

From "number of exercise", we know how many rows to generate for a lecture in the exercise table.

### Exercise table
The exercise table has their rows depending on the lecture id, namely the number of the lecture (L1, L2, ...).

Exercises in this table can be grouped by subsection. So exercise are also grouped in a common theme.

Each row for exercise contains spaced repetition data such as evaluation grade, last repetition date, scheduled repetition date.

There is not necesseraly a subsectoin specified.

Subsection id is there to keep the order of appearence in the textbook, just in case.