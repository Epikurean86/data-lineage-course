# Data Lineage Self-Study Course

An 8-week, self-paced course on data lineage and data provenance for data engineers, at about 5 hours a week. It is built around active recall: pre-tests, close-the-book recall prompts, practice problems, quizzes and spaced-repetition flashcards.

**Open the course:** `index.html` (or the GitHub Pages site for this repository). Progress is saved in your browser.

## Weeks

| Week | Topic |
|---|---|
| 1 | Why lineage exists: Buneman, Khanna & Tan, "Data Provenance: Some Basic Issues" |
| 2 | Lineage and why-provenance (Cui & Widom, witnesses, reverse queries) |
| 3 | How-provenance and provenance semirings, Trio |
| 4 | Where-provenance, schema mappings, eager vs lazy, comparing models |
| 5 | Lineage in modern data platforms: W3C PROV, SQL parsing, dbt |
| 6 | OpenLineage and Marquez (hands-on lab) |
| 7 | Lineage in operations and governance: BCBS 239, GDPR, EU AI Act |
| 8 | Capstone: a pipeline with run, column and row-level lineage |

Weeks 1–4 follow two papers, which are not included in this repository:

- P. Buneman, S. Khanna, W.-C. Tan. *Data Provenance: Some Basic Issues.* FSTTCS 2000.
- J. Cheney, L. Chiticariu, W.-C. Tan. *Provenance in Databases: Why, How, and Where.* Foundations and Trends in Databases 1(4), 2009.

## Repository layout

```
index.html                 the course, a single self-contained page
course/
  data-lineage-course.html the same page as published on claude.ai (no HTML skeleton)
  capstone/pipeline.py     week 8 starter: DuckDB pipeline with row-level provenance and OpenLineage events
  src/                     course content per week (w1.js … w8.js) and the app code
```

## Running the capstone

```
pip install duckdb requests sqlglot
python course/capstone/pipeline.py
```

Start Marquez first (week 6) to see the lineage graph; without it the script prints the events.

## Publishing with GitHub Pages

Settings → Pages → Deploy from a branch → `main`, folder `/ (root)`. The course is then available at `https://<user>.github.io/<repo>/`.
