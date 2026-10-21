W.push({
id: "w1", num: 1,
title: "Why lineage exists",
focus: "What lineage and provenance mean, why data engineers care, and the three problems that started the field.",
goal: "By the end of the week you can explain lineage vs provenance, name the granularities, give five engineering use cases, and summarise the three founding problems from Buneman, Khanna and Tan.",
plan: [
  ["Pre-test (before reading)", 10],
  ["Read Buneman et al. (whole paper) and Cheney et al. §1 intro", 90],
  ["Study notes, then close-the-book recall", 60],
  ["Practice problems", 70],
  ["Quiz", 25],
  ["Flashcard reviews (4 short sessions across the week)", 45]
],
reading: [
  { what: "Buneman, Khanna & Tan, “Data Provenance: Some Basic Issues” (FSTTCS 2000)", where: "Your PDF k51.pdf, all sections (about 8 pages)", mins: 45, note: "Read §1 slowly. In §2 stop after the AVG-salary query and say in your own words why the definition breaks." },
  { what: "Cheney, Chiticariu & Tan, “Provenance in Databases: Why, How, and Where” (2009)", where: "Your PDF, §1 opening pages 380–382 only", mins: 20, note: "Just the framing: why provenance matters for warehouses and curated databases. The examples start next week." },
  { what: "Optional: Reis & Housley, Fundamentals of Data Engineering (O’Reilly, 2022)", where: "Chapter 2, the “Data management” undercurrent, section on data lineage", mins: 25, note: "A practitioner’s one-page view of lineage as part of data management. Skip if you don’t have the book." }
],
pretest: [
  "In one sentence each, what do you think “data lineage” and “data provenance” mean? Are they the same thing?",
  "Name three situations at work where you would want to know where a number on a dashboard came from.",
  "If a SQL query computes the average salary, which input rows does one output row depend on?"
],
notes: `
<h3>Lineage and provenance</h3>
<p><b>Provenance</b> describes the origins and history of a piece of data: where it came from and the process by which it arrived where it is. Buneman et al. define it as “the process of tracing and recording the origins of data and its movement between databases.” <b>Lineage</b> is often used as a synonym. In the research literature “lineage” has a narrower, technical meaning (Cui and Widom’s definition, next week). In industry, “data lineage” usually means the graph of datasets and jobs that produced a dataset.</p>
<p>A good working distinction for a data engineer:</p>
<ul>
<li><b>Lineage</b> answers “what flowed into what?”. It is a graph of datasets, columns or rows linked by transformations.</li>
<li><b>Provenance</b> is the fuller record: lineage plus who ran what, when, with which code version, parameters and inputs.</li>
</ul>

<h3>Granularity</h3>
<p>Lineage can be recorded at different levels. Coarser levels are cheaper to capture and less precise.</p>
<table class="t"><tr><th>Level</th><th>Example question</th><th>Typical source</th></tr>
<tr><td>System / job</td><td>Which Airflow DAGs feed the finance mart?</td><td>Orchestrator metadata</td></tr>
<tr><td>Dataset / table</td><td>Which tables does <code>fct_orders</code> read?</td><td>dbt DAG, SQL parsing, OpenLineage</td></tr>
<tr><td>Column / attribute</td><td>Which source columns feed <code>revenue_eur</code>?</td><td>SQL parsing, Spark plans</td></tr>
<tr><td>Row / cell (fine-grained)</td><td>Which source rows produced this one output row?</td><td>Provenance-aware query processing (weeks 2–4)</td></tr>
</table>
<p>The two PDFs in this course study the finest level: individual tuples and cells. Industry tools mostly work at table and column level. Weeks 5–8 connect the two.</p>

<h3>Why data engineers care</h3>
<ul>
<li><b>Root-cause analysis.</b> A KPI is wrong. Lineage lets you walk upstream to the job or source that broke.</li>
<li><b>Impact analysis.</b> Before you drop or rename a column, you find every downstream table, dashboard and model that uses it.</li>
<li><b>Trust and quality.</b> Users can judge a number by seeing where it came from. Quality problems can be propagated downstream as warnings.</li>
<li><b>Compliance.</b> Regulators (BCBS 239 for banks, GDPR for personal data, the EU AI Act for training data) expect you to show where data comes from (week 7).</li>
<li><b>Cost and clean-up.</b> Tables with no downstream consumers are candidates for deletion.</li>
</ul>

<h3>The paper’s motivation</h3>
<p>Buneman et al. wrote in 2000 about scientific databases, especially molecular biology. Their Figure 1 shows databases such as GenBank, Swissprot and TransFac copying data from one another, with curators adding literature (“Lit”) and online submissions (“Onl”). The flow even contains a cycle. Once data has been copied and transformed many times, it is very hard to say where a specific value came from. Databases of the time gave little help, because their rigid schemas did not allow the ad hoc annotations needed to record provenance. The same situation exists in a modern data platform, where data is copied between a lake, a warehouse, marts and reverse-ETL tools.</p>

<h3>Problem 1: computing provenance by query inversion</h3>
<p>Given an output tuple <i>t</i> of a query <i>Q</i> over database <i>D</i>, which tuples of <i>D</i> “contributed to” <i>t</i>? The idea is to build a new query <i>Q′</i> from <i>Q</i>, <i>D</i> and <i>t</i> that returns the contributing input tuples. In effect, you invert the query.</p>
<p>The hard part is defining “contributed to”.</p>
<ul>
<li><b>Change-based definition:</b> an input tuple contributes if changing it changes or removes the output. This breaks on simple queries. For a projection or union, an output can have two sources, and changing one alone changes nothing.</li>
<li><b>Proof-theoretic definition:</b> an input tuple contributes if it is used in some <i>minimal derivation</i> of the output. This works for positive relational algebra (select, project, join, union: SPJU) and positive Datalog. It is <b>invariant under query rewriting</b> and <b>compositional</b>.</li>
<li>It breaks with <b>negation and aggregation</b>. The paper’s example selects employees who earn more than the average salary. Changing any employee’s salary can change the average, so the whole <code>employee</code> table “contributes” to every output row. The nice properties are lost.</li>
</ul>
<p>The paper also separates two questions about an output tuple (“John Doe”, 12345):</p>
<ul>
<li><b>Why</b> is this tuple in the output? (which input tuples justify it)</li>
<li><b>Where</b> did the value 12345 come from? (which input location it was copied from)</li>
</ul>
<p>It relates these to two classic problems: <b>view maintenance</b> (update a materialised view when sources change) and <b>view update</b> (translate an edit on a view back to the sources). Query inversion is easier because it only concerns what <i>is</i> in the database, not insertions.</p>

<h3>Problem 2: data citation</h3>
<p>How do you cite a part of a database or an XML document? Relational databases have keys, so there is a canonical path to every component. Inside documents it is harder: page and line numbers are fragile. XML Schema keys use a <i>target path</i> plus a <i>key path</i>. Hierarchical data needs <b>relative keys</b>. For a Bible, chapters are numbered within a book, so the key is the triple (Bible/Book, Chapter, Number): the key (Chapter, Number) holds at every node reached by Bible/Book.</p>
<p>Today’s equivalent: stable identifiers for datasets and records, such as dataset URNs in a catalog, OpenLineage’s namespace + name, or DOIs for published datasets.</p>

<h3>Problem 3: archiving</h3>
<p>If document A cites part of database B and B is updated, the citation breaks. Scientific databases release whole versions, which wastes space and makes it hard to trace the history of one component. Open questions in the paper include compressing versions, deciding who keeps the cited data, and the space cost of annotating every element with its provenance. The paper ends by imagining “self-aware” data packages that carry their own history.</p>
<p>Modern echoes: table formats with snapshots and time travel (Delta Lake, Apache Iceberg), dataset versioning, and lineage events that record which version of an input a job read.</p>
`,
recall: [
  { id: "w1r1", q: "Define provenance in your own words, then say how lineage differs from it in everyday data engineering usage.", a: "Provenance is the record of a data item’s origins and the process by which it arrived (what, from where, how, by whom, when). In everyday usage lineage is the narrower graph of what flowed into what (datasets, columns or rows linked by transformations). Provenance adds context such as run times, code versions and actors." },
  { id: "w1r2", q: "List the four granularities of lineage and give one example question for each.", a: "System/job (which DAGs feed the finance mart?), dataset/table (which tables feed fct_orders?), column (which source columns feed revenue_eur?), row/cell (which source rows produced this output row?)." },
  { id: "w1r3", q: "Why does the change-based definition of “contributes to” fail, and what definition works for SPJU queries?", a: "With projection or union an output tuple can have several independent sources, so changing one of them leaves the output unchanged even though it clearly contributed. The proof-theoretic definition works: an input tuple contributes if it is used in some minimal derivation of the output. It is invariant under query rewriting and compositional for positive queries." },
  { id: "w1r4", q: "Explain why the “salary above average” query breaks the nice properties of provenance.", a: "The output depends on an aggregate over the whole employee table. Changing any employee’s salary can change the average and so the result, so every employee tuple contributes to every output tuple. Invariance under rewriting and compositionality no longer hold with aggregation or negation." },
  { id: "w1r5", q: "What is the difference between why- and where-provenance, using the John Doe example?", a: "Why-provenance explains why the tuple (John Doe, 12345) is in the output: the input tuples that justify it. Where-provenance explains where the value 12345 was copied from: a specific location (the telephone field of John Doe’s input tuple)." },
  { id: "w1r6", q: "What is a relative key? Give the Bible example.", a: "A key that holds within each node reached by a path, not globally. Chapters are numbered within a book, so the key is (Bible/Book, Chapter, Number): (Chapter, Number) identifies a chapter within every node reached by Bible/Book." },
  { id: "w1r7", q: "Name the three founding problems in the paper and one modern equivalent of each.", a: "Query inversion (row-level lineage and debugging tools that show the source rows of a result), data citation (stable dataset and record identifiers, catalog URNs, DOIs), archiving (snapshots and time travel in Delta Lake or Iceberg, dataset versioning)." }
],
practice: [
  { id: "w1p1", title: "Map a pipeline you know", task: "<p>Pick one dashboard or report you know (from work or a side project). Draw its lineage at table level: every source, staging table, transformation job and output. Then mark one column on the dashboard and trace it to its source columns.</p><p>Write down where your knowledge ran out. Those gaps are exactly what lineage tooling tries to fill.</p>", solution: "<p>There is no single answer. A good diagram has: sources on the left (application database, files, APIs), the ingestion job, raw or staging tables, one or more transformation steps (for example dbt models), the mart table, and the dashboard. The column trace should name each column and the transformation applied at each step (rename, cast, join, sum). Typical gaps are manual spreadsheet steps, Python jobs with no metadata, and BI tool calculated fields.</p>" },
  { id: "w1p2", title: "When does “contributes to” break?", task: "<p>For each query, decide whether the proof-theoretic notion of provenance (minimal derivations) gives a clean answer, and why.</p><ol><li><code>SELECT name FROM customers WHERE country = 'FI'</code></li><li><code>SELECT country FROM customers UNION SELECT country FROM suppliers</code></li><li><code>SELECT country, COUNT(*) FROM customers GROUP BY country</code></li><li><code>SELECT c.id FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)</code></li></ol>", solution: "<ol><li>Clean. Selection plus projection: each output name comes from the customer rows with that name and country FI.</li><li>Clean. Union is positive: an output country is derived from any customer or supplier row with that country. Each such row on its own is a minimal derivation.</li><li>Not clean. Aggregation: the count depends on every row in the group, and adding a row changes the value. Cui and Widom simply define the lineage as all rows in the group (week 2).</li><li>Not clean. Negation: the output depends on the <i>absence</i> of orders. There is no input tuple that “derives” it, and adding an order removes it.</li></ol>" },
  { id: "w1p3", title: "Design citation keys for nested data", task: "<p>You publish a JSON dataset shaped like <code>countries[] → regions[] → cities[]</code>. Region codes are unique only within a country, and city names only within a region. Write relative keys in the paper’s (context path, target, key) style so that any city can be cited unambiguously.</p>", solution: "<ul><li>(Root, countries, iso_code). Countries are keyed globally by ISO code.</li><li>(countries, regions, region_code). Region codes are unique within each country node.</li><li>(countries/regions, cities, name). City names are unique within each region node.</li></ul><p>A citation is then a path of key values, for example <code>FI / 18 / Helsinki</code>. A careful answer adds a version or snapshot date to the citation, which is the paper’s archiving point.</p>" },
  { id: "w1p4", title: "Archiving in a modern lakehouse", task: "<p>A model was trained on a table that has since been overwritten many times. Which features of a table format such as Delta Lake or Iceberg would let you reproduce exactly what the model saw? What would you need to record at training time?</p>", solution: "<p>Snapshots and time travel: each write creates a new snapshot or version, and you can query <code>VERSION AS OF</code> or <code>TIMESTAMP AS OF</code>. At training time record the table identifier plus the snapshot or version ID (not just a timestamp), the query or filter used, and the code version. This is exactly what a provenance record holds, and OpenLineage can carry it as a dataset version facet. Retention settings must keep old snapshots long enough, which is the paper’s question of who is responsible for keeping cited data.</p>" }
],
quiz: [
  { id: "w1q1", type: "mc", q: "Which definition of “contributes to” does Buneman et al. recommend for SPJU queries?", options: ["An input tuple contributes if changing it changes the output", "An input tuple contributes if it is used in some minimal derivation of the output", "Every tuple of every relation mentioned in the query contributes", "An input tuple contributes if it shares a key with the output"], answer: 1, why: "The proof-theoretic definition (minimal derivations) is invariant under rewriting and compositional for positive queries. The change-based definition breaks on projection and union." },
  { id: "w1q2", type: "mc", q: "Why does the query “employees earning above the average salary” break the nice properties?", options: ["It uses a join", "It returns a telephone number", "Its output depends on an aggregate over the whole table, so every tuple affects every output", "It cannot be written in SQL"], answer: 2, why: "Aggregation (and negation) makes every employee tuple relevant to every output tuple, and invariance under rewriting and compositionality fail." },
  { id: "w1q3", type: "mc", q: "Where-provenance answers which question?", options: ["Why is this tuple in the output?", "Where was this output value copied from?", "Where is the database hosted?", "How many derivations does the tuple have?"], answer: 1, why: "Where-provenance links output locations (cells) to the input locations they were copied from." },
  { id: "w1q4", type: "mc", q: "Which granularity do most industry lineage tools capture by default?", options: ["Individual cells", "Table and column level", "Only system level", "None, lineage is always manual"], answer: 1, why: "Tools like OpenLineage, dbt and catalogs mostly work at table and column level. Row-level provenance is rarer and more expensive." },
  { id: "w1q5", type: "mc", q: "In the paper’s bioinformatics figure, what does a “Lit” input to a database indicate?", options: ["The database is generated by a query", "The database is curated: humans add data from the literature", "The database is lightweight", "The database is licensed"], answer: 1, why: "Lit means literature input, so the database is curated with human classification, annotation and error correction." },
  { id: "w1q6", type: "mc", q: "Which classic problem is the paper’s where-provenance related to?", options: ["Deadlock detection", "The view update problem", "Query optimisation", "Index selection"], answer: 1, why: "If John Doe changes his phone number in the view, which source data should change? That is view update. Why-provenance is related to view maintenance and truth maintenance." },
  { id: "w1q7", type: "mc", q: "The relative key (Bible/Book, Chapter, Number) means:", options: ["Chapter numbers are unique in the whole Bible", "Chapter numbers are unique within each book", "Books are keyed by chapter", "Numbers are keys of verses"], answer: 1, why: "The key (Chapter, Number) holds at every node reached by the path Bible/Book." },
  { id: "w1q8", type: "sa", q: "Explain to a product manager, in three sentences, why impact analysis needs lineage.", a: "Before changing or removing a column or table we need to know everything that depends on it. Lineage is the dependency graph that lists the downstream tables, dashboards and models. Without it, changes break things we did not know about, and we find out from users." },
  { id: "w1q9", type: "sa", q: "What did the paper propose as the long-term, speculative solution for capturing provenance?", a: "Data exchanged in “self-aware” packages that carry a complete history of how they moved between databases, how they were constructed and how they were changed. The authors call it appealing but an open question." }
],
cards: [
  { id: "w1c1", f: "Provenance (Buneman et al.)", b: "The process of tracing and recording the origins of data and its movement between databases." },
  { id: "w1c2", f: "Four granularities of lineage", b: "System/job, dataset/table, column/attribute, row/cell (fine-grained)." },
  { id: "w1c3", f: "Query inversion", b: "Given output tuple t of Q on D, build a query Q′ (from Q, D, t) that returns the input tuples that contributed to t." },
  { id: "w1c4", f: "Why does the change-based definition of “contributes to” fail?", b: "Projection or union can give an output several independent sources, so changing one source alone does not change the output." },
  { id: "w1c5", f: "Proof-theoretic “contributes to”", b: "An input tuple contributes if it is used in some minimal derivation of the output tuple. Works for SPJU and positive Datalog." },
  { id: "w1c6", f: "Which query features break invariance and compositionality of provenance?", b: "Negation and aggregation." },
  { id: "w1c7", f: "Why- vs where-provenance (one line each)", b: "Why: which input tuples justify an output tuple. Where: which input location an output value was copied from." },
  { id: "w1c8", f: "Relative key", b: "A key that holds within each node reached by a context path, e.g. (Bible/Book, Chapter, Number)." },
  { id: "w1c9", f: "The three problems in “Data Provenance: Some Basic Issues”", b: "Computing provenance by query inversion, data citation, archiving." },
  { id: "w1c10", f: "Impact analysis vs root-cause analysis", b: "Impact: walk downstream from a change to find what breaks. Root cause: walk upstream from a bad output to find what broke it." },
  { id: "w1c11", f: "Problems related to why- and where-provenance", b: "Why: view maintenance and truth maintenance. Where: the view update problem." }
]
});
