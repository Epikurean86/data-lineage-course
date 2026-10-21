const TRAVEL_DB = `
<div class="dbfig">
<div class="dbcap">The running example: an online travel portal (Cheney et al., Fig. 1.1)</div>
<div class="tscroll"><table class="t mono">
<tr><th colspan="4">Agencies</th></tr>
<tr><th></th><th>name</th><th>based_in</th><th>phone</th></tr>
<tr><td class="tid">t₁</td><td>BayTours</td><td>San Francisco</td><td>415-1200</td></tr>
<tr><td class="tid">t₂</td><td>HarborCruz</td><td>Santa Cruz</td><td>831-3000</td></tr>
</table></div>
<div class="tscroll"><table class="t mono">
<tr><th colspan="5">ExternalTours</th></tr>
<tr><th></th><th>name</th><th>destination</th><th>type</th><th>price</th></tr>
<tr><td class="tid">t₃</td><td>BayTours</td><td>San Francisco</td><td>cable car</td><td>$50</td></tr>
<tr><td class="tid">t₄</td><td>BayTours</td><td>Santa Cruz</td><td>bus</td><td>$100</td></tr>
<tr><td class="tid">t₅</td><td>BayTours</td><td>Santa Cruz</td><td>boat</td><td>$250</td></tr>
<tr><td class="tid">t₆</td><td>BayTours</td><td>Monterey</td><td>boat</td><td>$400</td></tr>
<tr><td class="tid">t₇</td><td>HarborCruz</td><td>Monterey</td><td>boat</td><td>$200</td></tr>
<tr><td class="tid">t₈</td><td>HarborCruz</td><td>Carmel</td><td>train</td><td>$90</td></tr>
</table></div>
</div>`;
const Q1_SQL = `<pre class="code">-- Q1: agencies offering external boat tours, with their phone numbers
SELECT a.name, a.phone
FROM   Agencies a, ExternalTours e
WHERE  a.name = e.name
  AND  e.type = 'boat';

-- Result:  (BayTours, 415-1200)   (HarborCruz, 831-3000)</pre>`;
const W = [];

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

W.push({
id: "w2", num: 2,
title: "Lineage and why-provenance",
focus: "Cui and Widom’s lineage, witnesses and the witness basis, minimal witnesses, reverse queries in a warehouse, and the view deletion problem.",
goal: "By the end of the week you can compute the lineage, why-provenance and minimal why-provenance of an output tuple by hand, write the reverse query that traces it, and explain why the answer can depend on how the query is written.",
plan: [
  ["Pre-test", 10],
  ["Read Cheney et al. §1.1.1, §1.3 (skim), §2", 110],
  ["Study notes, then close-the-book recall", 55],
  ["Practice problems", 70],
  ["Quiz", 25],
  ["Flashcard reviews", 30]
],
reading: [
  { what: "Cheney et al. §1.1.1 Why-Provenance", where: "Pages 382–386", mins: 25, note: "Work through the travel portal example with a pencil before reading the answer." },
  { what: "Cheney et al. §1.3 Notational preliminaries", where: "Pages 394–396", mins: 10, note: "Skim. You need: tuples, relations, locations (R, t) and (R, t, A), SPJRU queries." },
  { what: "Cheney et al. §2.1 Lineage, including §2.1.2 Tracing lineage in data warehouses", where: "Pages 397–407", mins: 40, note: "§2.1.1 (the compositional definition) is denser. Read it for the idea of ⊥ versus ∅ and of strict versus lazy union." },
  { what: "Cheney et al. §2.2 Why-provenance and §2.2.1 view deletion", where: "Pages 407–415", mins: 35, note: "You can skip the proof of Theorem 2.7. Remember the statement." }
],
pretest: [
  "For Q1 on the travel portal, which input tuples do you think explain the output (BayTours, 415-1200)?",
  "Is there more than one way the BayTours output could be justified? How many?",
  "If two SQL queries always return the same rows, should they have the same provenance?"
],
notes: `
{{TRAVEL}}
{{Q1}}
<h3>Lineage (Cui and Widom, WHIPS)</h3>
<p>Cui and Widom were among the first to formalise provenance for relational queries. The <b>lineage</b> of an output tuple <i>t</i> is the set of input tuples that “contributed to” <i>t</i>. Formally (Definition 2.1), for one operator it is the <b>maximal</b> subset of each input such that the operator applied to those subsets returns exactly {<i>t</i>}, and every tuple in it is relevant on its own.</p>
<p>Operator rules (Theorem 2.1):</p>
<ul>
<li><b>Selection:</b> the tuple itself.</li>
<li><b>Projection:</b> every input tuple that projects to <i>t</i>.</li>
<li><b>Join:</b> the matching tuple from each input.</li>
<li><b>Union:</b> the copies of <i>t</i> in each input.</li>
<li><b>Difference</b> R \ S: the tuple from R and <i>all of S</i>.</li>
<li><b>Aggregation:</b> all tuples in <i>t</i>’s group.</li>
</ul>
<p>For a whole query, lineage is traced operator by operator back to the sources. For Q1, the lineage of (BayTours, 415-1200) is <b>{t₁, t₅, t₆}</b> and of (HarborCruz, 831-3000) is <b>{t₂, t₇}</b>.</p>
<p class="aside">The paper has a small typo in §1.1.1: the intermediate BayTours tuples show phone 415-2000 and the wrong prices. §2.1 gives them correctly as ($250, Santa Cruz) and ($400, Monterey).</p>
<p><b>⊥ versus ∅.</b> The compositional definition (§2.1.1) separates “no lineage” (⊥: the tuple is not in the output) from “empty lineage” (∅: the tuple is in the output but the query constructed it, for example from a constant). Joins combine lineages with a <b>strict union</b> (if either side is ⊥, the result is ⊥). Unions use a <b>lazy union</b> (⊥ only if both sides are ⊥).</p>

<h3>Tracing lineage lazily in a warehouse</h3>
<p>WHIPS computes lineage <b>lazily</b>: nothing extra is stored while the view is computed. When someone asks about a tuple, WHIPS builds a <b>reverse query</b>.</p>
<ol>
<li>Rewrite the SPJ query into canonical form π<sub>A</sub>(σ<sub>C</sub>(R₁ ⋈ … ⋈ Rₙ)).</li>
<li>Drop the projection and add equality conditions that pin each projected attribute to <i>t</i>’s value.</li>
<li>Run it and split the result back into the input relations.</li>
</ol>
<pre class="code">-- Reverse query for (BayTours, 415-1200) in Q1
SELECT a.*, e.*
FROM   Agencies a JOIN ExternalTours e ON a.name = e.name
WHERE  e.type = 'boat' AND a.name = 'BayTours' AND a.phone = '415-1200';
-- returns two joined rows; split them -> Agencies(t₁), ExternalTours(t₅, t₆)</pre>
<p>This is safe because lineage is invariant under equivalent rewritings of SPJ queries <i>without repeated relation names</i>. With self-joins or a relation used twice, equivalent queries can have different lineage (Propositions 2.4 and 2.5).</p>
<p><b>Aggregation needs intermediate results.</b> For “average boat price per destination, keep those above $250”, the output ($300) does not exist in the input. WHIPS splits the query into segments at each aggregation, stores (or recomputes) the intermediate view (Santa Cruz $250, Monterey $300), traces $300 back to (Monterey, $300), and then to t₆ and t₇. This is a hybrid of lazy and eager tracing.</p>

<h3>Why-provenance: witnesses</h3>
<p>Lineage lumps everything together. {t₁, t₅, t₆} hides that t₅ and t₆ are <i>alternatives</i>: either one, with t₁, is enough.</p>
<ul>
<li>A <b>witness</b> for <i>t</i> is any subinstance J ⊆ I with <i>t</i> ∈ Q(J). The set of all witnesses can be exponentially large, because adding irrelevant tuples to a witness still gives a witness.</li>
<li>The <b>why-provenance</b> (or <b>witness basis</b>, Buneman, Khanna and Tan 2001) is a compact set of witnesses computed from the structure of the query. Each witness corresponds to the leaves of one proof tree. Joins take pairwise unions (the ⋒ operator), and projection and union collect alternatives.</li>
<li>For Q1: Why(BayTours) = <b>{{t₁, t₅}, {t₁, t₆}}</b>. Why(HarborCruz) = <b>{{t₂, t₇}}</b>.</li>
<li><b>Theorem 2.7:</b> every witness contains some witness from the basis, so the basis “represents” all witnesses.</li>
<li><b>Lineage is the union of the why-provenance</b> (Proposition 5.9, week 4): ∪{{t₁,t₅},{t₁,t₆}} = {t₁,t₅,t₆}.</li>
</ul>

<h3>Sensitivity to rewriting and minimal witnesses</h3>
<p>Take R = {t: (1,2), t′: (1,3), t″: (4,2)} and two equivalent queries:</p>
<pre class="code">Q  : Ans(x,y) :- R(x,y).
Q′ : Ans(x,y) :- R(x,y), R(x,z).</pre>
<p>Both return all of R. But for output (1,2), Why under Q is {{t}} and under Q′ is {{t}, {t, t′}}. The witness basis follows the query’s syntax.</p>
<p>The <b>minimal witness basis</b> keeps only witnesses with no smaller witness inside them. Here it is {{t}} for both. Minimal why-provenance <b>is invariant under query equivalence</b> (Corollary 2.11), and it equals the set of all minimal witnesses (Theorem 2.10).</p>

<h3>View deletion</h3>
<p>To delete tuple <i>t</i> from a view V = Q(I), you must “destroy” every minimal witness: delete at least one tuple from each. Usually there are several choices.</p>
<ul>
<li><b>View side-effect problem:</b> choose source deletions that minimise the other view tuples that disappear.</li>
<li><b>Source side-effect problem:</b> choose the smallest set of source deletions.</li>
<li>Both are <b>NP-hard</b> for queries that combine join with projection or union, and polynomial otherwise (SPU and SJ queries). Both become tractable for <b>key-preserving</b> SPJ views, which keep a key of every input relation.</li>
</ul>

<h3>What this means in practice</h3>
<ul>
<li>A “show me the source rows behind this number” button is a reverse query. It is cheap to build when your models <b>keep source keys</b>, which is the key-preserving condition again.</li>
<li>Aggregations destroy traceability unless you keep the grain (group keys) or store intermediate results.</li>
<li>Lineage tells you everything that <i>might</i> matter. Why-provenance tells you which combinations <i>actually</i> justify the row. For debugging, the second is often what you want.</li>
</ul>
`,
recall: [
  { id: "w2r1", q: "State the lineage rule for selection, projection, join, union, difference and aggregation.", a: "Selection: the tuple itself. Projection: all input tuples that project to t. Join: the matching tuple from each input. Union: the copies of t in each input. Difference R\\S: the R tuple plus all of S. Aggregation: all tuples in t’s group." },
  { id: "w2r2", q: "Without looking, give the lineage and the why-provenance of (BayTours, 415-1200) under Q1.", a: "Lineage {t₁, t₅, t₆}. Why-provenance {{t₁, t₅}, {t₁, t₆}}." },
  { id: "w2r3", q: "Describe the three steps WHIPS uses to trace the lineage of an SPJ output tuple.", a: "Rewrite Q to canonical form π(σ(R₁ ⋈ … ⋈ Rₙ)); build the reverse query by dropping the projection and adding conditions that the projected attributes equal t’s values; run it and split the result into the input relations." },
  { id: "w2r4", q: "Why does tracing an aggregate output need an intermediate view?", a: "The aggregate value (e.g. $300) does not appear in the input, so you cannot match it against source tuples. You need the intermediate result (Monterey, $300) to find the group, then trace the group back to its source tuples (t₆, t₇)." },
  { id: "w2r5", q: "What is a witness, what is the witness basis, and what is the relationship between them (Theorem 2.7)?", a: "A witness is any subinstance J with t ∈ Q(J). The witness basis (why-provenance) is the set of proof-witnesses derived from the query’s structure. Theorem 2.7: every witness contains some element of the basis, so the basis represents all witnesses." },
  { id: "w2r6", q: "Give the example showing why-provenance depends on how the query is written, and say which variant fixes it.", a: "R = {t:(1,2), t′:(1,3), t″:(4,2)}. Q: Ans(x,y) :- R(x,y) gives Why(1,2) = {{t}}. Q′: Ans(x,y) :- R(x,y), R(x,z) gives {{t},{t,t′}}. The minimal witness basis ({{t}} in both) is invariant under equivalence." },
  { id: "w2r7", q: "State the view side-effect and source side-effect problems and their complexity.", a: "View side-effect: find source deletions that remove t from the view while minimising other view tuples removed. Source side-effect: find the smallest set of source deletions that removes t. Both NP-hard for queries with join plus projection or union, polynomial for SPU and SJ, tractable for key-preserving SPJ." }
],
practice: [
  { id: "w2p1", title: "Compute by hand", task: "<p>Using the travel portal and Q1, compute for each output tuple: (a) its lineage, (b) its why-provenance, (c) its minimal why-provenance. Then explain in one sentence why the lineage of BayTours is “less precise” than its why-provenance.</p>", solution: "<p>(BayTours, 415-1200): lineage {t₁,t₅,t₆}; why {{t₁,t₅},{t₁,t₆}}; minimal why the same, since neither witness contains the other.</p><p>(HarborCruz, 831-3000): lineage {t₂,t₇}; why {{t₂,t₇}}; minimal why {{t₂,t₇}}.</p><p>The lineage does not say that t₅ and t₆ are alternatives. Either one with t₁ is enough, so neither is necessary on its own.</p>" },
  { id: "w2p2", title: "Write the reverse query", task: "<p>Write the SQL reverse query that WHIPS would generate to trace (HarborCruz, 831-3000) in Q1, and say what you do with its result.</p>", solution: "<pre class=\"code\">SELECT a.name, a.based_in, a.phone, e.name, e.destination, e.type, e.price\nFROM   Agencies a JOIN ExternalTours e ON a.name = e.name\nWHERE  e.type = 'boat'\n  AND  a.name = 'HarborCruz' AND a.phone = '831-3000';</pre><p>It returns one joined row. Split it by projecting on the Agencies columns (t₂) and the ExternalTours columns (t₇). The lineage is Agencies(t₂), ExternalTours(t₇).</p>" },
  { id: "w2p3", title: "Trace through an aggregation", task: "<pre class=\"code\">SELECT AVG(price) AS avg_price\nFROM   ExternalTours\nWHERE  type = 'boat'\nGROUP  BY destination\nHAVING AVG(price) > 250;</pre><p>(a) What is the result? (b) Which segments does WHIPS split this query into? (c) What intermediate view must exist, and what are its rows? (d) What is the lineage of the output?</p>", solution: "<p>(a) One row: $300 (Monterey: ($400 + $200)/2).</p><p>(b) Two AUSPJ segments, cut at the aggregation: π<sub>avg_price</sub>∘σ<sub>avg_price>250</sub> on top, and α<sub>destination, AVG(price)</sub>∘σ<sub>type='boat'</sub> below.</p><p>(c) The result of the lower segment, “AllDestinations”: (Santa Cruz, $250), (Monterey, $300).</p><p>(d) Trace $300 to (Monterey, $300) with σ<sub>avg_price=300</sub>, then with σ<sub>type='boat' ∧ destination='Monterey'</sub>(ExternalTours) to <b>{t₆, t₇}</b>.</p>" },
  { id: "w2p4", title: "Rewriting changes the answer", task: "<p>With R = {t:(1,2), t′:(1,3), t″:(4,2)}, compute the why-provenance and minimal why-provenance of output (1,3) under Q′: Ans(x,y) :- R(x,y), R(x,z). Then do the same for Q″: Ans(x,y) :- R(x,y), R(w,y).</p>", solution: "<p>Q′ for (1,3): R(1,3) joined with any R(1,z): z=2 (t) or z=3 (t′). Why = {{t′,t}, {t′}}. Minimal = {{t′}}.</p><p>Q″ for (1,3): R(1,3) joined with any R(w,3): only t′. Why = {{t′}}. Minimal = {{t′}}.</p><p>The minimal answers agree, as Corollary 2.11 promises.</p>" },
  { id: "w2p5", title: "Delete a view tuple", task: "<p>A user wants (BayTours, 415-1200) removed from the Q1 view. List the minimal source deletions that achieve it. Which has the fewest source deletions? Do any have side-effects on the view?</p>", solution: "<p>You must break both minimal witnesses {t₁,t₅} and {t₁,t₆}. Options: delete {t₁} (one tuple, breaks both), or delete {t₅, t₆} (two tuples). The source side-effect optimum is {t₁}. Neither causes view side-effects for Q1, because t₁, t₅ and t₆ appear in no witness of HarborCruz. Deleting t₁ would of course hurt any <i>other</i> view that uses BayTours’ agency record, which is why the side-effect question matters in real systems.</p>" },
  { id: "w2p6", title: "Make a model key-preserving", task: "<p>This dbt-style model loses its sources:</p><pre class=\"code\">SELECT customer_country, SUM(amount) AS revenue\nFROM   orders JOIN customers USING (customer_id)\nGROUP  BY customer_country;</pre><p>Rewrite it (or add a companion model) so that any revenue figure can be traced back to its source order rows with a simple query.</p>", solution: "<p>Two common approaches:</p><ol><li>Keep a fine-grained model at order grain that carries the keys: <code>SELECT o.order_id, c.customer_id, c.customer_country, o.amount FROM orders o JOIN customers c USING (customer_id)</code>, and build the aggregate on top. Tracing = <code>SELECT * FROM that_model WHERE customer_country = 'FI'</code>.</li><li>Carry the keys eagerly: add <code>ARRAY_AGG(o.order_id) AS source_order_ids</code> to the aggregate. This is the eager (annotation) approach from week 4. It costs storage but answers lineage without touching the sources.</li></ol>" }
],
quiz: [
  { id: "w2q1", type: "mc", q: "What is the lineage of (BayTours, 415-1200) under Q1?", options: ["{t₁}", "{t₁, t₅, t₆}", "{{t₁, t₅}, {t₁, t₆}}", "{t₁, t₃, t₄, t₅, t₆}"], answer: 1, why: "Lineage collects every contributing input tuple in one set. The set of sets is why-provenance." },
  { id: "w2q2", type: "mc", q: "In Cui and Widom’s definition, the lineage of a tuple t in R \\ S is:", options: ["{t} only", "{t} from R and all of S", "Empty", "All of R"], answer: 1, why: "Every S tuple matters, because adding the wrong one would remove t." },
  { id: "w2q3", type: "mc", q: "Why can WHIPS safely rewrite an SPJ query into canonical form before tracing?", options: ["Because lineage is invariant under equivalent rewritings of SPJ queries without repeated relation names", "Because the optimiser guarantees it", "Because lineage ignores joins", "It cannot; the answer may change"], answer: 0, why: "Theorem 4.8 in Cui et al. With self-joins or repeated relations, invariance fails (Propositions 2.4 and 2.5)." },
  { id: "w2q4", type: "mc", q: "Which statement about the witness basis is true?", options: ["It contains every witness", "Every witness contains some element of the witness basis", "It is always invariant under query equivalence", "It is always a single set"], answer: 1, why: "Theorem 2.7. Invariance holds only for the minimal witness basis." },
  { id: "w2q5", type: "mc", q: "What distinguishes ⊥ from ∅ in the compositional lineage definition?", options: ["They are the same", "⊥ means the tuple is not in the output; ∅ means it is in the output but was constructed by the query", "⊥ means an error in the query", "∅ means the tuple is not in the output"], answer: 1, why: "Separating the two lets joins use strict union and unions use lazy union." },
  { id: "w2q6", type: "mc", q: "Deciding a side-effect-free view deletion is NP-hard for which queries?", options: ["Selection only", "Queries combining join with projection or union", "Union only", "All queries"], answer: 1, why: "SPU and SJ queries are polynomial. Key-preserving SPJ views are tractable too." },
  { id: "w2q7", type: "mc", q: "Lineage can be computed from why-provenance by:", options: ["Taking the smallest witness", "Taking the union of all witnesses", "Taking the intersection of all witnesses", "It cannot be computed"], answer: 1, why: "Proposition 5.9: Lin = ∪ Why. But lineage cannot be computed from minimal why-provenance." },
  { id: "w2q8", type: "mc", q: "Review (week 1): which query feature makes the whole input relation “contribute” to each output?", options: ["Projection", "Union", "Aggregation", "Selection"], answer: 2, why: "Aggregation (and negation) break the clean proof-theoretic definition." },
  { id: "w2q9", type: "sa", q: "In two or three sentences, explain the difference between lineage and why-provenance using Q1.", a: "Lineage gives one set of contributing tuples, {t₁,t₅,t₆} for BayTours. Why-provenance gives the separate witnesses {{t₁,t₅},{t₁,t₆}}, which shows that t₅ and t₆ are alternatives and only t₁ is needed in every justification." },
  { id: "w2q10", type: "sa", q: "Why is it cheaper to answer “which source rows produced this number?” when your models are key-preserving?", a: "If each model keeps the keys of its input relations, the reverse query is a simple filter on stored keys instead of re-running joins and reasoning about the transformation. Key-preserving SPJ views also make view-deletion and annotation-placement problems tractable." }
],
cards: [
  { id: "w2c1", f: "Lineage (Cui & Widom)", b: "The set of input tuples that contributed to an output tuple: maximal, with every tuple relevant. Traced operator by operator." },
  { id: "w2c2", f: "Lineage rule for difference R \\ S", b: "The tuple from R plus all tuples of S." },
  { id: "w2c3", f: "Lineage rule for aggregation", b: "All input tuples in the output tuple’s group." },
  { id: "w2c4", f: "Reverse query (WHIPS)", b: "Canonical form π(σ(R₁⋈…⋈Rₙ)); drop π, add equalities pinning projected attributes to t; run; split by relation. Lazy." },
  { id: "w2c5", f: "Witness", b: "A subinstance J ⊆ I such that t ∈ Q(J)." },
  { id: "w2c6", f: "Why-provenance (witness basis)", b: "A compact set of proof-witnesses derived from the query’s structure. Every witness contains one of them (Thm 2.7)." },
  { id: "w2c7", f: "Why(BayTours, 415-1200) under Q1", b: "{{t₁, t₅}, {t₁, t₆}}" },
  { id: "w2c8", f: "Minimal witness basis: key property", b: "Invariant under query equivalence, and equal to the set of all minimal witnesses (Thm 2.10, Cor 2.11)." },
  { id: "w2c9", f: "Strict vs lazy union (lineage)", b: "Strict (joins): ⊥ if either side is ⊥. Lazy (unions, projection): ⊥ only if both are ⊥." },
  { id: "w2c10", f: "View side-effect vs source side-effect problem", b: "View: delete t while minimising other view tuples lost. Source: delete t with the fewest source deletions. Both NP-hard with join + (projection or union)." },
  { id: "w2c11", f: "Key-preserving SPJ view", b: "A view that retains a key of every input relation. Makes view deletion and annotation placement tractable, and lineage cheap." },
  { id: "w2c12", f: "Relationship: lineage vs why-provenance", b: "Lineage = union of all witnesses in the why-provenance (Prop 5.9). Not recoverable from minimal why-provenance." }
]
});

W.push({
id: "w3", num: 3,
title: "How-provenance and semirings",
focus: "Provenance polynomials, K-relations and why one annotation can answer many questions: bag counts, why-provenance, trust and probability (Trio).",
goal: "By the end of the week you can annotate a query result with provenance polynomials, evaluate a polynomial in different semirings, compute a Trio confidence correctly, and explain why how-provenance is the most general of the three models.",
plan: [
  ["Pre-test", 10],
  ["Read Cheney et al. §1.1.2 and §3.1–3.3", 90],
  ["Optional: Green, Karvounarakis & Tannen (2007) §1–4", 30],
  ["Study notes, then close-the-book recall", 55],
  ["Practice problems", 70],
  ["Quiz and flashcard reviews", 45]
],
reading: [
  { what: "Cheney et al. §1.1.2 How-provenance", where: "Pages 386–388", mins: 15, note: "The Q2 example. Note the polynomial t₁·(t₁ + t₃)." },
  { what: "Cheney et al. §3.1 Provenance semirings", where: "Pages 417–421", mins: 30, note: "The key table is Definition 3.1: what each operator does to annotations." },
  { what: "Cheney et al. §3.2 Trio lineage, including §3.2.1 confidence values", where: "Pages 421–427", mins: 30, note: "Do the 0.63 and 0.56 calculations yourself before reading them." },
  { what: "Cheney et al. §3.3 Semirings and recursion", where: "Pages 427–430", mins: 15, note: "Read for the idea only: recursion can give infinitely many derivations." },
  { what: "Optional: Green, Karvounarakis & Tannen, “Provenance Semirings” (PODS 2007)", where: "cs.ucdavis.edu/~green/papers/pods07.pdf, sections 1–4", mins: 30, note: "The original paper. Section 2’s motivating examples are very readable.", url: "https://www.cs.ucdavis.edu/~green/papers/pods07.pdf" }
],
pretest: [
  "If a SQL query joins a table with itself, how could the same input row contribute twice to one output row?",
  "A row appears 3 times in the output of a UNION ALL query. What information would you need to explain each copy?",
  "If tuple A has probability 0.7 and tuple B 0.9, what is the probability that a row produced by joining them exists?"
],
notes: `
{{TRAVEL}}
<h3>From “which tuples” to “how”</h3>
<p>Why-provenance tells you which combinations of tuples justify an output. It does not tell you <i>how</i> they were combined, or whether a tuple was used twice. Consider Q2 (all cities where an agency offers tours, assuming every agency tours its home city):</p>
<pre class="code">-- Q2
SELECT e.destination, a.phone
FROM   Agencies a,
       (SELECT name, based_in AS destination FROM Agencies
        UNION
        SELECT name, destination FROM ExternalTours) e
WHERE  a.name = e.name;</pre>
<table class="t mono"><tr><th>destination</th><th>phone</th><th>how-provenance</th></tr>
<tr><td>San Francisco</td><td>415-1200</td><td>t₁·(t₁ + t₃) = t₁² + t₁t₃</td></tr>
<tr><td>Santa Cruz</td><td>831-3000</td><td>t₂²</td></tr>
<tr><td>Santa Cruz</td><td>415-1200</td><td>t₁·(t₄ + t₅)</td></tr>
<tr><td>Monterey</td><td>415-1200</td><td>t₁·t₆</td></tr>
<tr><td>Monterey</td><td>831-3000</td><td>t₂·t₇</td></tr>
<tr><td>Carmel</td><td>831-3000</td><td>t₂·t₈</td></tr></table>
<p class="aside">Erratum: Fig. 1.4 and Fig. 3.1 of the survey print t₁·t₇ and t₁·t₈ for the last two rows. They must be t₂·t₇ and t₂·t₈, because those tours belong to HarborCruz, whose phone is 831-3000.</p>
<p>The why-provenance of San Francisco is {{t₁}, {t₁, t₃}}. The polynomial says more: t₁ is used <i>twice</i> in one derivation (once in the subquery, once in the outer join), and there are two derivations in total.</p>

<h3>K-relations: the general framework</h3>
<p>Green, Karvounarakis and Tannen observed that queries do only two things to source tuples: they <b>join</b> them together or <b>merge</b> alternatives (union and projection). So annotate every tuple with an element of a set K and define:</p>
<table class="t"><tr><th>Operator</th><th>Annotation of the output tuple</th></tr>
<tr><td>Selection σ<sub>θ</sub></td><td>Same as input if θ holds, otherwise 0</td></tr>
<tr><td>Projection π</td><td><b>Sum (+)</b> of the annotations of all input tuples that project to it</td></tr>
<tr><td>Union ∪</td><td><b>Sum (+)</b> of its annotations in each input</td></tr>
<tr><td>Join ⋈</td><td><b>Product (·)</b> of the annotations of the joined tuples</td></tr></table>
<p>For the usual algebraic laws of relational queries to hold, (K, 0, 1, +, ·) must be a <b>commutative semiring</b>: + and · are associative and commutative with identities 0 and 1, · distributes over +, and 0·a = 0.</p>
<p>Different semirings give different semantics from the same query:</p>
<table class="t"><tr><th>Semiring</th><th>+ / ·</th><th>What you get</th></tr>
<tr><td>Booleans 𝔹</td><td>∨ / ∧</td><td>Ordinary set semantics</td></tr>
<tr><td>Natural numbers ℕ</td><td>+ / ×</td><td>Bag semantics: how many copies of each row</td></tr>
<tr><td>Polynomials ℕ[X]</td><td>+ / ×</td><td><b>How-provenance</b>, the most general</td></tr>
<tr><td>Why semiring</td><td>∪ / pairwise union ⋒</td><td>Why-provenance</td></tr>
<tr><td>Lineage semiring</td><td>lazy ∪ / strict ∪</td><td>Lineage</td></tr>
<tr><td>Boolean events with probabilities</td><td>∨ / ∧</td><td>Probabilistic databases (Trio-like)</td></tr></table>

<h3>Why polynomials are “the most general”</h3>
<p>ℕ[X] is the <b>free</b> commutative semiring. For any other semiring K and any assignment of values to the tuple variables, there is exactly one homomorphism from ℕ[X] to K that respects + and ·. And queries commute with homomorphisms (<b>homomorphism invariance</b>, Proposition 5.1): evaluating the query and then mapping gives the same result as mapping and then evaluating.</p>
<p>In practice: <b>compute the polynomial once, then evaluate it however you like.</b></p>
<ul>
<li>Set all variables to 1 in ℕ: t₁² + t₁t₃ → 2. The row appears twice under bag semantics.</li>
<li>Map to why-provenance: t₁² → {{t₁}}, t₁t₃ → {{t₁,t₃}}, sum → {{t₁},{t₁,t₃}}.</li>
<li>Map to lineage: {t₁, t₃}.</li>
<li><b>Deletion propagation:</b> set t₃ = 0 and the polynomial is still t₁², so the row survives. Set t₁ = 0 and it becomes 0, so the row disappears.</li>
<li><b>Trust:</b> set distrusted tuples to false in 𝔹 and check whether the result is still true.</li>
</ul>

<h3>Trio: lineage for uncertain data</h3>
<p>Trio stores each tuple with a confidence (probability) and a Boolean lineage formula. Joins give conjunction ∧, duplicate-eliminating projection and union give disjunction ∨. With confidences t₁ 0.7, t₃ 0.9, t₄ 0.6, t₅ 0.5 and the query π<sub>destination, phone</sub>(Agencies ⋈ ExternalTours):</p>
<ul>
<li>u₁ (San Francisco): λ = t₁ ∧ t₃, so P = 0.7 × 0.9 = <b>0.63</b>.</li>
<li>u₂ (Santa Cruz): λ = (t₁∧t₄) ∨ (t₁∧t₅) = t₁ ∧ (t₄ ∨ t₅). P(t₄∨t₅) = 0.6 + 0.5 − 0.3 = 0.8, so P = 0.7 × 0.8 = <b>0.56</b>.</li>
</ul>
<p><b>Why store lineage at all?</b> If you compute probabilities operator by operator, the answer depends on the plan. Joining first gives intermediate tuples w₁ (0.42) and w₂ (0.35). Treating them as independent gives 0.42 + 0.35 − 0.42×0.35 = <b>0.623, which is wrong</b>, because both depend on t₁. Trio computes the confidence from the final lineage formula, which is correct under any plan. Trio’s lineage is how-provenance in the semiring ℕ[X] with x·x = x.</p>
<p>Trio is <b>eager</b>: lineage is computed during query execution and stored with derived data.</p>

<h3>Recursion</h3>
<p>For recursive Datalog (for example transitive closure of “tours from city to city”), a tuple can have infinitely many derivation trees. Annotations become <b>formal power series</b> in ℕ<sup>∞</sup>[[X]], computed as the solution of a system of equations such as u₁ = t₁t₃ + u₁². Expanding gives t₁t₃ + t₁²t₃² + 2t₁³t₃³ + 5t₁⁴t₃⁴ + … (the coefficients are the Catalan numbers). It is decidable whether a tuple’s provenance is a finite polynomial.</p>

<h3>What this means in practice</h3>
<ul>
<li><b>Explaining duplicates.</b> A row appearing twice after a join is a polynomial with two monomials, or a squared variable. How-provenance tells you which fan-out caused it.</li>
<li><b>Incremental maintenance.</b> If you know each output’s polynomial, deleting a source row means setting a variable to 0 and keeping rows whose polynomial is still non-zero. Week 4’s ORCHESTRA does exactly this.</li>
<li><b>Data quality and trust scores.</b> Confidence or quality scores combined through joins must be computed from the lineage, or you repeat Trio’s 0.623 mistake.</li>
<li><b>Tools.</b> ProvSQL is a PostgreSQL extension that implements semiring provenance, if you want to experiment beyond pen and paper.</li>
</ul>
`,
recall: [
  { id: "w3r1", q: "What do projection, union and join do to annotations in a K-relation?", a: "Projection and union add (+) the annotations of the merged tuples. Join multiplies (·) the annotations of the joined tuples. Selection keeps the annotation if the condition holds, otherwise gives 0." },
  { id: "w3r2", q: "Why must K be a commutative semiring?", a: "So that the K-relational operators satisfy the same algebraic laws as relational algebra over bags: union associative and commutative with identity ∅, join associative, commutative and distributive over union, selection and projection commuting with each other and with union and join." },
  { id: "w3r3", q: "Write the how-provenance of (San Francisco, 415-1200) under Q2 and explain each part.", a: "t₁·(t₁ + t₃) = t₁² + t₁t₃. Two derivations: one joins Agencies t₁ with the subquery tuple that came from t₁ itself (based_in), the other joins t₁ with the subquery tuple from ExternalTours t₃." },
  { id: "w3r4", q: "State the homomorphism invariance property and why it makes ℕ[X] the most general provenance.", a: "For a semiring homomorphism h, h(Q(I)) = Q(h(I)): mapping annotations commutes with evaluating the query. ℕ[X] is the free semiring, so there is a unique homomorphism to any other semiring. Compute polynomials once and derive bag counts, why-provenance, lineage, trust or probabilities by mapping." },
  { id: "w3r5", q: "Compute the Trio confidence of u₂ and explain why the per-operator calculation of 0.623 is wrong.", a: "λ(u₂) = t₁ ∧ (t₄ ∨ t₅); P = 0.7 × (0.6 + 0.5 − 0.3) = 0.7 × 0.8 = 0.56. Computing per operator treats w₁ = t₁∧t₄ and w₂ = t₁∧t₅ as independent, but both depend on t₁, so 0.42 + 0.35 − 0.147 = 0.623 overcounts." },
  { id: "w3r6", q: "How do you propagate a deletion with provenance polynomials?", a: "Set the deleted tuple’s variable to 0 and simplify. Output rows whose polynomial becomes 0 must be deleted; others survive (e.g. t₁² + t₁t₃ with t₃ = 0 leaves t₁²)." },
  { id: "w3r7", q: "What changes with recursive Datalog, and what algebraic object is used?", a: "Tuples may have infinitely many derivation trees, so annotations are formal power series in ℕ∞[[X]], obtained as solutions of fixpoint equations like u₁ = t₁t₃ + u₁²." }
],
practice: [
  { id: "w3p1", title: "Annotate Q2 yourself", task: "<p>Compute the how-provenance polynomial of all six output rows of Q2. Start by annotating the subquery’s result. Then compare with Fig. 1.4 in the survey and find the misprint.</p>", solution: "<p>Subquery e (UNION): (BayTours, San Francisco): t₁ + t₃ (from Agencies t₁ and ExternalTours t₃). (HarborCruz, Santa Cruz): t₂. (BayTours, Santa Cruz): t₄ + t₅. (BayTours, Monterey): t₆. (HarborCruz, Monterey): t₇. (HarborCruz, Carmel): t₈.</p><p>Join with Agencies a on name multiplies by t₁ (BayTours) or t₂ (HarborCruz): SF t₁(t₁+t₃); Santa Cruz/831 t₂·t₂ = t₂²; Santa Cruz/415 t₁(t₄+t₅); Monterey/415 t₁t₆; Monterey/831 t₂t₇; Carmel t₂t₈. The survey prints t₁·t₇ and t₁·t₈ for the last two, which is a typo.</p>" },
  { id: "w3p2", title: "One polynomial, many answers", task: "<p>Take p = t₁² + t₁t₃. Evaluate it: (a) in ℕ with all variables = 1; (b) in 𝔹 with t₁ = true, t₃ = false; (c) as why-provenance; (d) as lineage; (e) as minimal why-provenance; (f) after deleting t₁.</p>", solution: "<p>(a) 1 + 1 = 2 copies under bag semantics. (b) true ∧ true ∨ true ∧ false = true: the row exists without t₃. (c) {{t₁}, {t₁, t₃}}. (d) {t₁, t₃}. (e) {{t₁}}. (f) 0: the row disappears.</p>" },
  { id: "w3p3", title: "Probabilities the right way", task: "<p>Confidences: t₁ = 0.8, t₂ = 0.5, t₄ = 0.6, t₅ = 0.5, t₇ = 0.9. Compute the confidence of (Santa Cruz, 415-1200) and of (Monterey, 831-3000) in π<sub>destination, phone</sub>(Agencies ⋈ ExternalTours). Then compute the wrong answer you would get for Santa Cruz by joining first and treating the joined tuples as independent.</p>", solution: "<p>Santa Cruz: λ = t₁ ∧ (t₄ ∨ t₅). P(t₄ ∨ t₅) = 0.6 + 0.5 − 0.3 = 0.8. P = 0.8 × 0.8 = <b>0.64</b>.</p><p>Monterey/831: λ = t₂ ∧ t₇. P = 0.5 × 0.9 = <b>0.45</b>.</p><p>Wrong way: w₁ = 0.8 × 0.6 = 0.48, w₂ = 0.8 × 0.5 = 0.40. 0.48 + 0.40 − 0.192 = <b>0.688</b>, too high because w₁ and w₂ share t₁.</p>" },
  { id: "w3p4", title: "Eager provenance in plain SQL", task: "<p>In DuckDB or PostgreSQL, create the two travel tables with an extra column <code>tid</code> ('t1' … 't8'). Write a version of Q1 that returns, for each output row, a text column holding its how-provenance polynomial in the form <code>t1*t5 + t1*t6</code>.</p>", solution: "<pre class=\"code\">SELECT a.name, a.phone,\n       STRING_AGG(a.tid || '*' || e.tid, ' + ' ORDER BY e.tid) AS how_prov\nFROM   Agencies a JOIN ExternalTours e ON a.name = e.name\nWHERE  e.type = 'boat'\nGROUP  BY a.name, a.phone;</pre><p>The join builds a product per joined pair. The GROUP BY plays the role of the duplicate-eliminating projection and sums the monomials. Result: BayTours <code>t1*t5 + t1*t6</code>, HarborCruz <code>t2*t7</code>. This is the eager approach: the query is rewritten to carry provenance into the output.</p>" },
  { id: "w3p5", title: "Recursion by hand", task: "<p>Using u₁ = t₁t₃ + u₁², substitute repeatedly to find the first three terms of u₁’s provenance series. What does a coefficient of 2 mean?</p>", solution: "<p>u₁ = t₁t₃ + (t₁t₃ + u₁²)² = t₁t₃ + t₁²t₃² + 2t₁t₃u₁² + … Continuing gives t₁t₃ + t₁²t₃² + 2t₁³t₃³ + … A coefficient of 2 means two distinct derivation trees use the same multiset of source tuples (three copies each of t₁ and t₃).</p>" }
],
quiz: [
  { id: "w3q1", type: "mc", q: "In the semiring framework, which operation does a join correspond to?", options: ["+", "·", "0", "Max"], answer: 1, why: "Join multiplies the annotations of the joined tuples. Union and projection add." },
  { id: "w3q2", type: "mc", q: "What is the how-provenance of (Santa Cruz, 831-3000) in Q2?", options: ["t₂", "t₂²", "t₂ + t₄", "t₁·t₂"], answer: 1, why: "HarborCruz’s Agencies tuple t₂ is joined with the subquery tuple that also comes from t₂ (its based_in city)." },
  { id: "w3q3", type: "mc", q: "Evaluating a provenance polynomial in ℕ with every variable set to 1 gives:", options: ["Whether the tuple exists", "The number of copies under bag semantics", "The probability", "The lineage"], answer: 1, why: "The counting semiring ℕ gives bag multiplicities." },
  { id: "w3q4", type: "mc", q: "Why is ℕ[X] called the most general provenance semiring?", options: ["It is the fastest to compute", "It is free: there is a unique homomorphism from it to any semiring, and queries commute with homomorphisms", "It contains all where-provenance", "It handles aggregation"], answer: 1, why: "Freeness plus homomorphism invariance lets you derive other provenance forms from the polynomial. (Where-provenance is the exception, week 4.)" },
  { id: "w3q5", type: "mc", q: "Why does Trio compute confidences from stored lineage instead of operator by operator?", options: ["It is faster", "Intermediate tuples can share inputs, so treating them as independent gives wrong answers on some plans", "SQL requires it", "Because lineage is smaller"], answer: 1, why: "The unsafe plan gave 0.623 instead of 0.56." },
  { id: "w3q6", type: "mc", q: "Trio’s lineage corresponds to which semiring?", options: ["𝔹", "ℕ", "ℕ[X] with x·x = x", "The tropical semiring"], answer: 2, why: "Multiplication is idempotent (x ∧ x = x) but addition is not, since Trio tuples can appear multiple times." },
  { id: "w3q7", type: "mc", q: "With p = t₁·(t₄ + t₅), which single deletion removes the row?", options: ["t₄", "t₅", "t₁", "None"], answer: 2, why: "Setting t₁ = 0 makes p = 0. Deleting t₄ or t₅ alone leaves the other derivation." },
  { id: "w3q8", type: "mc", q: "Review (week 2): which provenance form is invariant under query equivalence?", options: ["Lineage", "Witness basis", "Minimal witness basis", "How-provenance"], answer: 2, why: "Lineage, why- and how-provenance are all sensitive to rewriting." },
  { id: "w3q9", type: "sa", q: "Explain, as if in a code review, why averaging per-row quality scores after a join can be misleading, using what you learned from Trio.", a: "Joined rows that share an input are not independent. Combining their scores as if they were double-counts the shared input. Scores should be computed from each output row’s lineage (which inputs it depends on and how), or the result depends on the join order and plan." },
  { id: "w3q10", type: "sa", q: "Name three different questions you can answer from one provenance polynomial.", a: "Examples: how many copies under bag semantics (ℕ); whether the row still exists after deleting or distrusting some inputs (𝔹 or set variables to 0); its why-provenance, minimal witnesses and lineage; its probability given input probabilities." }
],
cards: [
  { id: "w3c1", f: "K-relation", b: "A relation whose tuples are annotated with elements of a semiring K (0 = not present)." },
  { id: "w3c2", f: "Semiring operations for π, ∪, ⋈", b: "Projection and union: + . Join: · . Selection: keep or 0." },
  { id: "w3c3", f: "Commutative semiring (definition)", b: "(K,0,1,+,·): + and · associative and commutative with identities 0 and 1; · distributes over +; 0·a = 0." },
  { id: "w3c4", f: "How-provenance of SF in Q2", b: "t₁·(t₁ + t₃) = t₁² + t₁t₃" },
  { id: "w3c5", f: "Homomorphism invariance", b: "h(Q(I)) = Q(h(I)) for any semiring homomorphism h." },
  { id: "w3c6", f: "Why is ℕ[X] most general?", b: "It is the free commutative semiring: a unique homomorphism to any K, so other provenance forms are images of the polynomial." },
  { id: "w3c7", f: "Bag count from a polynomial", b: "Evaluate in ℕ with all variables = 1 (t₁² + t₁t₃ → 2)." },
  { id: "w3c8", f: "Trio confidence of u₂ = t₁ ∧ (t₄ ∨ t₅), P = .7, .6, .5", b: "0.7 × (0.6 + 0.5 − 0.3) = 0.56" },
  { id: "w3c9", f: "The unsafe-plan mistake", b: "Treating intermediate tuples that share an input as independent (0.623 instead of 0.56)." },
  { id: "w3c10", f: "Trio lineage as a semiring", b: "ℕ[X] quotiented by x·x = x (idempotent multiplication)." },
  { id: "w3c11", f: "Provenance for recursive Datalog", b: "Formal power series in ℕ∞[[X]], solutions of fixpoint equations (e.g. u₁ = t₁t₃ + u₁²)." },
  { id: "w3c12", f: "Deletion propagation with polynomials", b: "Set the deleted tuple’s variable to 0; outputs whose polynomial becomes 0 disappear." }
]
});

W.push({
id: "w4", num: 4,
title: "Where-provenance and comparing models",
focus: "Provenance across schema mappings (ORCHESTRA, SPIDER routes), where-provenance and annotation propagation (DBNotes), eager vs lazy capture, and how all the models relate.",
goal: "By the end of the week you can trace where a value was copied from, propagate annotations through a query, choose between eager and lazy capture for a given situation, and draw the map of how lineage, why, how and where relate.",
plan: [
  ["Pre-test", 10],
  ["Read Cheney et al. §1.1.3, §1.2, §3.4, §4", 100],
  ["Read §5 (skim proofs) and §6", 30],
  ["Study notes, then close-the-book recall", 50],
  ["Practice problems", 60],
  ["Quiz and flashcard reviews", 50]
],
reading: [
  { what: "Cheney et al. §1.1.3 Where-provenance and §1.2 Eager vs lazy", where: "Pages 388–394", mins: 25, note: "§1.2 is the most practical part of the whole survey. Read it twice." },
  { what: "Cheney et al. §3.4 How-provenance for schema mappings (ORCHESTRA, routes)", where: "Pages 430–440", mins: 35, note: "Skip the formal definitions of satisfaction steps on first reading. Focus on the two examples." },
  { what: "Cheney et al. §4 Where-provenance", where: "Pages 441–452", mins: 40, note: "Work Fig. 4.3 by hand before looking at panel (b)." },
  { what: "Cheney et al. §5 Comparing models and §6 Conclusions", where: "Pages 453–466", mins: 30, note: "Read the four numbered results on page 454 and the statements of each proposition. Skip the proofs." },
  { what: "Optional: Buneman & Tan, “Data Provenance: What next?” (SIGMOD Record, 2018)", where: "sigmodrecord.org, 6 pages", mins: 20, note: "Two of the authors look back ten years later.", url: "https://sigmodrecord.org/publications/sigmodRecord/1809/pdfs/03_Principles_Buneman.pdf" }
],
pretest: [
  "In Q1, the output value “BayTours” appears in both Agencies.name and ExternalTours.name. Which one is it “copied from”?",
  "Would you rather store provenance while a pipeline runs, or reconstruct it later when someone asks? What are the trade-offs?",
  "Can you recover which column a value came from if you only know which rows contributed?"
],
notes: `
{{TRAVEL}}
<h3>Provenance across schema mappings</h3>
<p>A <b>schema mapping</b> describes how data in a source schema relates to a target schema, using rules called tuple-generating dependencies (tgds), for example <code>m1: Agencies(n,b,p) → ∃I Trips(I,n,p)</code>. Running the rules (the <b>chase</b>) fills the target and invents <b>labelled nulls</b> (I₁, N₃ …) for values the source does not provide. Think of each tgd as one transformation step in an integration pipeline.</p>
<p><b>ORCHESTRA</b> (eager) is a data sharing system between peers. It records how-provenance that also names the mapping used, such as Pv(u₄) = m2(t₃). This supports:</p>
<ul>
<li><b>Trust filtering:</b> a peer rejects data that can only be derived through distrusted mappings or tuples. If Pv(u₄) = m2(t₃) + m*(t*) and m* and t* are trusted, u₄ is still accepted.</li>
<li><b>Incremental deletion:</b> when t₃ is deleted, check which target tuples are no longer derivable (u₄, then u₃) and delete them, recursively.</li>
</ul>
<p><b>Routes and SPIDER</b> (lazy) help a person debug a mapping. A route is a chain of satisfaction steps that shows how a target tuple came to exist, for example t₃ →(m2) u₄ →(m3) u₃. In the paper’s example the route reveals a bug: m2 does not copy the agency name, so the link between “BayTours” and “cable car” is lost. SPIDER computes all minimal routes as a polynomial-size <b>route forest</b> by looking only at source, target and mapping. Routes can include “spurious” derivations that the mapping could not actually have produced, which ORCHESTRA’s derivations avoid.</p>
<p>Modern analogy: the mapping is your dbt project, and a route is “this mart row exists because of these staging rows via these models”. The m2 bug is a model that drops a key column.</p>

<h3>Where-provenance</h3>
<p>Why- and how-provenance relate <i>tuples</i>. <b>Where-provenance</b> relates <i>locations</i>: a location is (relation, tuple, attribute), a single cell. The where-provenance of an output cell is the set of input cells its value was <b>copied from</b>.</p>
{{Q1}}
<ul>
<li>In Q1 as written in SQL (SELECT a.name), “HarborCruz” comes from (Agencies, t₂, name). Write e.name instead (Q1′) and it comes from (ExternalTours, t₇, name). The queries are equivalent but the where-provenance differs.</li>
<li>In relational algebra with a natural join, the join attribute collects <b>both</b> locations: {(Agencies, t₂, name), (ExternalTours, t₇, name)}.</li>
<li>A value computed by the query (a constant, a sum) has <b>empty</b> where-provenance. It was not copied from anywhere.</li>
</ul>
<p><b>Annotation propagation rules</b> (Buneman, Khanna and Tan; used by DBNotes) say how a note on an input cell flows to output cells:</p>
<ul>
<li><b>Selection</b> and <b>renaming</b>: notes stay on the same (renamed) cell.</li>
<li><b>Projection</b>: notes on kept columns flow; when duplicates merge, their notes are unioned.</li>
<li><b>Join</b>: each output cell gets the notes of the cell it came from; join columns get notes from both sides.</li>
<li><b>Union</b>: notes from all copies of the tuple are unioned.</li>
</ul>
<p><b>Sensitivity again.</b> Q: Ans(x,y) :- R(x,y) and Q′: Ans(x,y) :- R(x,y), R(x,z) are equivalent but propagate different notes (Fig. 1.6). DBNotes offers a <b>default</b> scheme (where-provenance of the query as written), a <b>default-all</b> scheme (the union over all equivalent queries, so equivalent queries behave the same; only finitely many rewritings matter), and a <b>custom</b> scheme. DBNotes traces where-provenance eagerly by giving every cell an “address” annotation and letting it flow through each query.</p>
<p><b>Annotation placement</b> runs the other way: where in the source should I put a note so that it reaches exactly one output cell? Deciding whether a side-effect-free placement exists is NP-hard for queries with projection and join, and polynomial for SPU and SJU queries.</p>

<h3>Eager vs lazy</h3>
<table class="t"><tr><th></th><th>Eager (bookkeeping, annotation)</th><th>Lazy (non-annotation)</th></tr>
<tr><td>How</td><td>Rewrite the transformation to carry extra information into the output</td><td>Reconstruct provenance on demand from source, output and transformation</td></tr>
<tr><td>Cost</td><td>Runtime and storage overhead on every run</td><td>No overhead until asked; tracing can be expensive</td></tr>
<tr><td>Needs sources later?</td><td>No: works even if the sources are gone</td><td>Yes: fails if the source data has changed or disappeared</td></tr>
<tr><td>Needs to change the system?</td><td>Yes</td><td>No: can be added to an existing system</td></tr>
<tr><td>Systems in the survey</td><td>Trio, ORCHESTRA, DBNotes</td><td>WHIPS (lineage), SPIDER (routes)</td></tr></table>
<p>WHIPS is partly hybrid: for aggregation and difference it can store intermediate views eagerly.</p>
<p>The same choice exists in industry. <b>Runtime lineage</b> (OpenLineage events emitted by a running Spark or Airflow job) is eager. <b>Parsing SQL from the query log</b> after the fact is lazy. Many platforms do both.</p>

<h3>How the models relate (§5)</h3>
<div class="diagram">How-provenance (ℕ[X])
   │  homomorphism
   ▼
Why-provenance (witness basis) ──Min──▶ Minimal why-provenance
   │  union of witnesses
   ▼
Lineage

Where-provenance: its source tuples are always in the lineage,
but it cannot be computed from any semiring annotation.</div>
<ol>
<li>Lineage, why and minimal why-provenance are all instances of the semiring model and can be derived from how-provenance.</li>
<li>Lineage can be derived from why-provenance, but <b>not</b> from minimal why-provenance (equivalent queries can have different lineage, but always the same minimal why).</li>
<li>Where-provenance is “contained in” lineage: if a value was copied from tuple u, then u is in the lineage (Proposition 5.11).</li>
<li>But where-provenance is <b>not</b> an instance of the semiring model. R and ρ<sub>C→A</sub>(ρ<sub>A→B</sub>(ρ<sub>B→C</sub>(R))) give the same annotations in every semiring, yet on R = {(A:1, B:1)} the second swaps which column each value came from. Semirings annotate whole tuples and cannot see columns.</li>
</ol>

<h3>Open problems in 2009 (§6)</h3>
<p>The survey covers only monotone queries. Provenance for <b>negation and aggregation</b> was still unsettled, as were query optimisation with provenance, provenance for nested data and XML, and other models such as dependency provenance and the colour algebra of Mondrian.</p>

<h3>What this means in practice</h3>
<ul>
<li><b>Column-level lineage is where-provenance at the schema level</b>, plus a label for the transformation. A column with no where-provenance (computed, not copied) is exactly the case where column lineage tools need a transformation type such as AGGREGATION.</li>
<li><b>PII tag propagation is annotation propagation.</b> When a catalog marks a column as personal data and pushes the tag downstream, it applies rules like DBNotes’ default scheme.</li>
<li>Pick eager capture when sources are ephemeral (streams, overwritten tables) or questions must be answered fast. Pick lazy when you cannot change the jobs or storage is tight.</li>
</ul>
`,
recall: [
  { id: "w4r1", q: "What is a location, and what does the where-provenance of an output location contain?", a: "A location is (relation, tuple, attribute), a single cell. The where-provenance of an output cell is the set of input cells its value was copied from. Values computed by the query have empty where-provenance." },
  { id: "w4r2", q: "Give the where-provenance of “HarborCruz” under Q1 (SELECT a.name), Q1′ (SELECT e.name) and the natural-join algebra version.", a: "Q1: (Agencies, t₂, name). Q1′: (ExternalTours, t₇, name). Natural join in algebra: both locations." },
  { id: "w4r3", q: "List the three DBNotes propagation schemes and what makes default-all special.", a: "Default (where-provenance of the query as written), default-all (union of the default behaviour over all equivalent queries, so equivalent queries propagate the same annotations; only finitely many rewritings need checking), custom (user-specified)." },
  { id: "w4r4", q: "Compare eager and lazy provenance on cost, dependence on sources, and need to change the system. Name the survey’s systems in each group.", a: "Eager: runtime and storage overhead, works without sources later, requires changing the transformation; Trio, ORCHESTRA, DBNotes. Lazy: no overhead until queried, needs sources at tracing time, can be bolted on; WHIPS, SPIDER." },
  { id: "w4r5", q: "What two things does ORCHESTRA use its provenance for?", a: "Trust filtering (reject data derivable only via distrusted mappings or tuples) and incremental maintenance (after a deletion, find target tuples no longer derivable and delete them recursively)." },
  { id: "w4r6", q: "Draw from memory how lineage, why, minimal why, how and where-provenance relate.", a: "How → (homomorphism) Why → (union) Lineage; Why → (Min) Minimal why. Lineage cannot be obtained from minimal why. Where-provenance’s source tuples are contained in the lineage, but where-provenance cannot be expressed in the semiring model." },
  { id: "w4r7", q: "Why can’t where-provenance be an instance of the semiring model?", a: "Semiring annotations are per tuple. Renaming can swap which column a value came from without changing tuple annotations: R and ρC→A(ρA→B(ρB→C(R))) agree in every semiring but have different where-provenance on R = {(A:1,B:1)}." }
],
practice: [
  { id: "w4p1", title: "Trace where values came from", task: "<p>For each cell of the Q1 output, give its where-provenance (a) for Q1 as written in SQL, (b) for Q1′ with SELECT e.name, a.phone, (c) for the relational algebra version with a natural join on name.</p>", solution: "<p>(a) BayTours.name: (Agencies,t₁,name). 415-1200: (Agencies,t₁,phone). HarborCruz.name: (Agencies,t₂,name). 831-3000: (Agencies,t₂,phone).</p><p>(b) BayTours.name: (ExternalTours,t₅,name) and (ExternalTours,t₆,name), because the projection merges two tuples. HarborCruz.name: (ExternalTours,t₇,name). Phones unchanged.</p><p>(c) Names get both sides: BayTours {(Agencies,t₁,name),(ExternalTours,t₅,name),(ExternalTours,t₆,name)}; HarborCruz {(Agencies,t₂,name),(ExternalTours,t₇,name)}. Phones unchanged.</p>" },
  { id: "w4p2", title: "Propagate annotations", task: "<p>R1 = {t₁: (A=1ᵃ¹, B=2ᵃ²), t₂: (A=1ᵃ³, B=3ᵃ⁴)} and R2 = {t₃: (A=1ᵃ⁵, C=2ᵃ⁶), t₄: (A=4ᵃ⁷, C=5ᵃ⁸)}. Using the default propagation rules, annotate the results of (a) π<sub>A</sub>(R1), (b) R1 ⋈ R2, (c) ρ<sub>B→C</sub>(R1) ∪ R2.</p>", solution: "<p>(a) One tuple: (1<sup>a1,a3</sup>). The two copies of 1 merge and their notes union.</p><p>(b) (1<sup>a1,a5</sup>, 2<sup>a2</sup>, 2<sup>a6</sup>) and (1<sup>a3,a5</sup>, 3<sup>a4</sup>, 2<sup>a6</sup>), with columns A, B, C. Join column A gets notes from both sides.</p><p>(c) ρ gives (1<sup>a1</sup>,2<sup>a2</sup>) and (1<sup>a3</sup>,3<sup>a4</sup>) over (A,C). Union with R2: (1<sup>a1,a5</sup>, 2<sup>a2,a6</sup>), (1<sup>a3</sup>, 3<sup>a4</sup>), (4<sup>a7</sup>, 5<sup>a8</sup>).</p>" },
  { id: "w4p3", title: "Eager or lazy?", task: "<p>For each situation, choose eager or lazy capture and justify it in one sentence.</p><ol><li>A Kafka topic with 3-day retention feeds a daily aggregate table.</li><li>A legacy warehouse runs 4,000 stored procedures you are not allowed to modify, but the query log is available.</li><li>Analysts click a number on a dashboard and expect the source rows within a second.</li><li>Storage is very tight and lineage questions are rare.</li></ol>", solution: "<ol><li>Eager: the sources will be gone, so lazy tracing would fail.</li><li>Lazy: parse the query log; you cannot re-engineer the transformations.</li><li>Eager: precomputed provenance (stored keys) makes the answer a fast lookup.</li><li>Lazy: no storage overhead, and the occasional expensive trace is acceptable.</li></ol>" },
  { id: "w4p4", title: "Derive everything from one polynomial", task: "<p>An output tuple has how-provenance t₁·(t₄ + t₅). Derive its why-provenance, minimal why-provenance and lineage. Then explain why you cannot derive its where-provenance from the polynomial.</p>", solution: "<p>Why: {{t₁,t₄},{t₁,t₅}}. Minimal why: the same (neither contains the other). Lineage: {t₁,t₄,t₅}.</p><p>Where-provenance needs to know which <i>column</i> of which tuple each output value was copied from. The polynomial only records which tuples were joined or merged, and renaming or projection can change column origins without changing the polynomial (Proposition 5.12).</p>" },
  { id: "w4p5", title: "Debug a mapping with a route", task: "<p>Mapping: m1: Agencies(n,b,p) → ∃I Trips(I,n,p); m2: ExternalTours(n,d,t) → ∃I Transportation(I,t); m3: Transportation(i,t) → ∃N ∃P Trips(i,N,P). The target contains Trips(I₃, N₃, P₃) with nulls for agency and phone. Write the route that explains it and say what is wrong with the mapping. What is the dbt equivalent of this bug?</p>", solution: "<p>Route: t₃ (BayTours, San Francisco, cable car) →(m2) Transportation(I₃, cable car) →(m3) Trips(I₃, N₃, P₃).</p><p>The bug: m2 does not carry the agency name into the target, so m3 must invent a Trips row with unknown agency and phone. The fix is for m2 to share the trip id with the agency’s Trips tuple, or to copy the name.</p><p>dbt equivalent: a staging model that drops the foreign key, so a downstream model joins on nothing and produces rows with NULL dimensions. A route is the column-and-model path that shows where the key was lost.</p>" },
  { id: "w4p6", title: "Trust filtering", task: "<p>Peer T distrusts mapping m2 and source tuple t₉. Decide whether T accepts each tuple: (a) Pv(u) = m2(t₃); (b) Pv(v) = m1(t₁) + m2(t₃); (c) Pv(w) = m1(t₉); (d) Pv(x) = m1(t₁)·m3(u₄) where Pv(u₄) = m2(t₃).</p>", solution: "<p>(a) Reject: the only derivation uses m2. (b) Accept: m1(t₁) is a trusted derivation. (c) Reject: t₉ is distrusted. (d) Reject: the only derivation needs u₄, which is only derivable via m2. Read + as “or” and · as “and”, and evaluate in the Boolean semiring with distrusted items set to false.</p>" }
],
quiz: [
  { id: "w4q1", type: "mc", q: "Where-provenance relates:", options: ["Input tuples to output tuples", "Input locations (cells) to output locations", "Queries to their rewritings", "Jobs to datasets"], answer: 1, why: "Why- and how-provenance are tuple-level; where-provenance is cell-level." },
  { id: "w4q2", type: "mc", q: "Which DBNotes scheme guarantees that equivalent queries propagate the same annotations?", options: ["Default", "Default-all", "Custom", "None"], answer: 1, why: "Default-all takes the union over all equivalent queries, and only finitely many need checking." },
  { id: "w4q3", type: "mc", q: "A main advantage of lazy provenance is that it:", options: ["Works after the sources are deleted", "Can be deployed without changing the transformation system", "Is always faster to query", "Stores more detail"], answer: 1, why: "Lazy tracing reasons over source, output and transformation, so it can be added to an existing system, but it needs the sources." },
  { id: "w4q4", type: "mc", q: "Which systems in the survey are eager?", options: ["WHIPS and SPIDER", "Trio, ORCHESTRA and DBNotes", "Only Trio", "All of them"], answer: 1, why: "WHIPS and SPIDER are lazy (WHIPS partly hybrid)." },
  { id: "w4q5", type: "mc", q: "Which statement is FALSE?", options: ["Lineage can be derived from why-provenance", "Lineage can be derived from minimal why-provenance", "Why-provenance can be derived from how-provenance", "Where-provenance cannot be expressed in the semiring model"], answer: 1, why: "Equivalent queries can have different lineage but always the same minimal why-provenance, so no function can recover lineage from it." },
  { id: "w4q6", type: "mc", q: "What does ORCHESTRA do when a source tuple is deleted?", options: ["Recomputes every peer from scratch", "Uses provenance to find and delete target tuples that are no longer derivable", "Nothing", "Asks the user"], answer: 1, why: "Incremental update exchange uses stored provenance and proceeds recursively." },
  { id: "w4q7", type: "mc", q: "A labelled null in a schema mapping is:", options: ["A NULL from the source", "A value invented by the chase for something the source does not provide", "A tag on a column", "An error"], answer: 1, why: "For example I₁ or N₃ in the target instance." },
  { id: "w4q8", type: "mc", q: "Review (week 3): with how-provenance t₁² + t₁t₃, how many times does the row appear under bag semantics?", options: ["1", "2", "3", "4"], answer: 1, why: "Set every variable to 1 in ℕ: 1 + 1 = 2." },
  { id: "w4q9", type: "sa", q: "Explain why column-level lineage tools need a “transformation type”, using the idea of where-provenance.", a: "Where-provenance only covers values that are copied. Many output columns are computed (sums, CASE expressions, concatenations) and have empty where-provenance, yet they still depend on input columns. A transformation type (identity, transformation, aggregation) records that dependency and how direct it is." },
  { id: "w4q10", type: "sa", q: "Your team wants lineage for streaming jobs whose inputs expire after a few days. Eager or lazy? Why?", a: "Eager. Lazy tracing needs the source data at question time, and it will be gone. The jobs should emit or store provenance while they run (for example OpenLineage events, or source keys and offsets carried into the output)." }
],
cards: [
  { id: "w4c1", f: "Location (where-provenance)", b: "(relation, tuple, attribute), a single cell." },
  { id: "w4c2", f: "Where-provenance", b: "The set of input locations an output value was copied from. Empty for computed values." },
  { id: "w4c3", f: "Default vs default-all (DBNotes)", b: "Default: where-provenance of the query as written. Default-all: union over all equivalent queries, so it is invariant under rewriting." },
  { id: "w4c4", f: "Annotation placement problem", b: "Place a note in the source so it reaches a given output cell with fewest side effects. NP-hard for PJ queries; polynomial for SPU and SJU." },
  { id: "w4c5", f: "Eager provenance", b: "Rewrite the transformation to carry provenance into the output. Overhead every run; works without sources later. Trio, ORCHESTRA, DBNotes." },
  { id: "w4c6", f: "Lazy provenance", b: "Reconstruct on demand from source, output and transformation. No runtime overhead; needs sources. WHIPS, SPIDER." },
  { id: "w4c7", f: "Schema mapping / tgd / chase", b: "Rules relating source and target schemas; the chase applies them, inventing labelled nulls for unknown values." },
  { id: "w4c8", f: "ORCHESTRA uses provenance for…", b: "Trust filtering of updates and incremental deletion propagation." },
  { id: "w4c9", f: "Route (SPIDER)", b: "A chain of mapping satisfaction steps showing how a target tuple came to exist. Used lazily to debug schema mappings." },
  { id: "w4c10", f: "Is where-provenance a semiring instance?", b: "No. Semirings annotate tuples; renaming can change column origins without changing any tuple annotation." },
  { id: "w4c11", f: "Hierarchy of provenance models", b: "How → Why → Lineage; Why → Minimal why. Where ⊆ lineage (by tuples) but not derivable from semirings." },
  { id: "w4c12", f: "Column-level lineage in theory terms", b: "Where-provenance at the schema level, plus a transformation type for computed columns." }
]
});

W.push({
id: "w5", num: 5,
title: "Lineage in modern data platforms",
focus: "From tuples to platforms: the W3C PROV model, how tools capture lineage (parsing, runtime, manual), column-level lineage from SQL, and how dbt and catalogs expose it.",
goal: "By the end of the week you can describe a pipeline run in PROV terms, extract column-level lineage from a SQL query with a parser, separate direct from indirect column lineage, and explain where parsing-based lineage breaks.",
plan: [
  ["Pre-test", 10],
  ["Read W3C PROV Primer §1–3 and the platform readings", 95],
  ["Study notes, then close-the-book recall", 50],
  ["Lab: SQLGlot column lineage and the dbt manifest", 80],
  ["Quiz and flashcard reviews", 65]
],
reading: [
  { what: "W3C PROV Model Primer", where: "w3.org/TR/prov-primer, sections 1–3", mins: 35, note: "Focus on entities, activities, agents and the seven core relations. Skip the RDF serialisation details.", url: "https://www.w3.org/TR/prov-primer/" },
  { what: "OpenLineage documentation: About and Object model", where: "openlineage.io/docs", mins: 20, note: "Just the concepts: run, job, dataset, facet. The lab is next week.", url: "https://openlineage.io/docs/" },
  { what: "DataHub engineering post: Extracting column-level lineage from SQL", where: "datahub.com", mins: 20, note: "Why a parser needs schemas, and which SQL constructs still defeat it.", url: "https://datahub.com/?p=4506" },
  { what: "dbt docs: Column-level lineage", where: "docs.getdbt.com", mins: 10, note: "Note how dbt separates passthrough/rename from transformed columns.", url: "https://docs.getdbt.com/docs/explore/column-level-lineage" },
  { what: "SQLGlot README", where: "github.com/tobymao/sqlglot", mins: 10, note: "Skim the parsing and optimiser sections before the lab.", url: "https://github.com/tobymao/sqlglot" },
  { what: "Optional: Herschel et al., “A survey on provenance: What for? What form? What from?” (VLDB Journal 2017)", where: "Sections 1–3", mins: 40, note: "A classification of provenance by use, form and capture method. It bridges this week and weeks 2–4.", url: "https://vldb.org/vldb_journal/index.php/component/remository/Published-Articles/Volume-26/Number-6/A-survey-on-provenance-What-for-What-form-What-from/" }
],
pretest: [
  "List every way you can think of to find out which tables a nightly job reads.",
  "A SQL query filters on orders.status but never outputs it. Does the output “depend on” status?",
  "What could stop a tool from knowing which table SELECT * reads its columns from?"
],
notes: `
<h3>A shared vocabulary: W3C PROV</h3>
<p>PROV is a family of W3C specifications (Recommendations published April 2013) for interchanging provenance. Its core model has three kinds of things:</p>
<ul>
<li><b>Entity:</b> a thing whose provenance we describe, such as a table, a file, a snapshot or a report.</li>
<li><b>Activity:</b> something that happens over time and uses or generates entities, such as a job run.</li>
<li><b>Agent:</b> something that bears responsibility, such as a person, a team or a service account.</li>
</ul>
<p>And relations between them:</p>
<table class="t"><tr><th>Relation</th><th>Meaning</th><th>Pipeline example</th></tr>
<tr><td>used</td><td>Activity read an entity</td><td>run-42 used raw.orders</td></tr>
<tr><td>wasGeneratedBy</td><td>Entity was produced by an activity</td><td>mart.revenue wasGeneratedBy run-42</td></tr>
<tr><td>wasDerivedFrom</td><td>Entity derived from another entity</td><td>mart.revenue wasDerivedFrom raw.orders</td></tr>
<tr><td>wasAssociatedWith</td><td>Agent was responsible for an activity</td><td>run-42 wasAssociatedWith airflow-svc</td></tr>
<tr><td>wasAttributedTo</td><td>Entity attributed to an agent</td><td>mart.revenue wasAttributedTo finance-data-team</td></tr>
<tr><td>actedOnBehalfOf</td><td>Delegation between agents</td><td>airflow-svc actedOnBehalfOf finance-data-team</td></tr>
<tr><td>wasInformedBy</td><td>One activity used something another generated</td><td>run-43 wasInformedBy run-42</td></tr></table>
<p>The important structural idea: a lineage graph has <b>two kinds of nodes</b>, data (entities) and processes (activities), and edges only go between the two. OpenLineage (next week) uses the same shape: datasets, and runs of jobs.</p>

<h3>Three ways tools capture lineage</h3>
<table class="t"><tr><th>Method</th><th>How</th><th>Strengths</th><th>Weaknesses</th></tr>
<tr><td><b>Static (design-time)</b></td><td>Parse code: SQL files, dbt models, query logs</td><td>No changes to jobs; covers code that has not run yet</td><td>Misses dynamic SQL, UDFs, Python; needs schemas; can drift from reality</td></tr>
<tr><td><b>Runtime (operational)</b></td><td>Instrument execution: Spark listeners, Airflow operators, warehouse access history</td><td>Reflects what actually ran, with run IDs, times and row counts</td><td>Needs integrations in every engine; only sees code paths that ran</td></tr>
<tr><td><b>Manual (declared)</b></td><td>People document lineage in a catalog or spreadsheet</td><td>Covers manual steps and spreadsheets that no tool can see</td><td>Expensive and goes stale quickly</td></tr></table>
<p>Map it to week 4: runtime capture is <b>eager</b> (record while running), and parsing query logs later is <b>lazy</b>. Regulated companies typically combine all three, because regulators ask about manual steps too.</p>

<h3>Column-level lineage from SQL</h3>
<p>A parser such as SQLGlot (used by DataHub and others) extracts column lineage in steps:</p>
<ol>
<li><b>Parse</b> the SQL for the right dialect into a syntax tree.</li>
<li><b>Qualify</b> every column with its table. This needs the schemas: in <code>SELECT amount FROM orders JOIN payments …</code> you cannot tell which table <code>amount</code> belongs to without them. Expand <code>SELECT *</code>, resolve CTEs and subqueries.</li>
<li><b>Trace</b> each output column’s expression back to source columns.</li>
</ol>
<p>Output columns depend on inputs in two different ways:</p>
<ul>
<li><b>Direct</b> lineage: the input value flows into the output value. Subtypes are <i>identity</i> (copied as is), <i>transformation</i> (e.g. <code>UPPER(name)</code>, <code>price * qty</code>) and <i>aggregation</i> (e.g. <code>SUM(amount)</code>).</li>
<li><b>Indirect</b> lineage: the input decides <i>which rows</i> or <i>which group</i> appear, without its value being copied. These are columns used in JOIN, WHERE (filter), GROUP BY, ORDER BY, window clauses and CASE conditions. OpenLineage’s column lineage facet records both types.</li>
</ul>
<div class="callout"><b>The theory connection.</b> Direct identity lineage is where-provenance lifted to the schema level. Indirect lineage is the part of why-provenance that where-provenance ignores: the filter and join columns that decide whether a tuple is in the output at all. Remember t₁ in week 4: it is in every witness of BayTours but contributes no copied value.</div>

<h3>Where parsing breaks</h3>
<ul>
<li>SQL built at runtime (Python f-strings, stored procedures with dynamic SQL).</li>
<li>User-defined functions and external calls, which are black boxes.</li>
<li>Non-SQL code: pandas, PySpark DataFrame code without a logical plan, shell scripts.</li>
<li>Missing or stale schemas, so columns cannot be qualified.</li>
<li>Nested data: JSON extraction, structs, UNNEST and arrays.</li>
<li><b>Identity across systems:</b> the same table is <code>s3://bucket/orders</code> to Spark and <code>analytics.raw.orders</code> to the warehouse. Without naming conventions the graph has two disconnected nodes. OpenLineage defines naming rules (a namespace such as <code>postgres://host:5432</code> plus a name such as <code>db.schema.table</code>) for this reason.</li>
</ul>

<h3>dbt and catalogs</h3>
<ul>
<li>In dbt, <code>ref()</code> and <code>source()</code> calls make table-level lineage explicit. <code>dbt docs generate</code> writes <code>target/manifest.json</code>, whose <code>parent_map</code> and <code>child_map</code> are the graph. <b>Exposures</b> declare downstream dashboards and ML models, which closes the last hop.</li>
<li>dbt’s column-level lineage (in dbt Explorer) parses compiled SQL and labels columns as passthrough, rename or transformed.</li>
<li>Catalogs such as DataHub, OpenMetadata, Databricks Unity Catalog, Google Dataplex and Microsoft Purview collect lineage from many sources (parsers, OpenLineage events, warehouse logs) into one graph and add search, ownership and impact analysis on top.</li>
</ul>
`,
recall: [
  { id: "w5r1", q: "Name PROV’s three core types and at least five of its relations, with a pipeline example of each relation.", a: "Entity, Activity, Agent. used (run used raw.orders), wasGeneratedBy (mart wasGeneratedBy run), wasDerivedFrom (mart wasDerivedFrom raw.orders), wasAssociatedWith (run wasAssociatedWith service account), wasAttributedTo (mart wasAttributedTo team), actedOnBehalfOf (service account actedOnBehalfOf team), wasInformedBy (run-43 wasInformedBy run-42)." },
  { id: "w5r2", q: "Compare static, runtime and manual lineage capture, with one strength and one weakness each.", a: "Static: parse code; no job changes needed, but misses dynamic SQL, UDFs and Python and needs schemas. Runtime: instrument execution; shows what actually ran with run metadata, but needs an integration per engine and sees only executed paths. Manual: people document; covers manual steps, but is expensive and goes stale." },
  { id: "w5r3", q: "What are the three steps of SQL column-lineage extraction, and why does step two need schemas?", a: "Parse, qualify, trace. Qualifying assigns each column to a table and expands SELECT *; with several tables in scope, an unqualified column name is ambiguous unless you know each table’s columns." },
  { id: "w5r4", q: "Define direct and indirect column lineage and name the subtypes of each.", a: "Direct: the input value flows into the output value (identity, transformation, aggregation). Indirect: the input affects which rows or groups appear without its value being copied (join, filter, group by, sort, window, conditional)." },
  { id: "w5r5", q: "How do direct and indirect lineage relate to where- and why-provenance?", a: "Direct identity lineage is where-provenance at schema level. Indirect lineage captures the filter and join inputs that why-provenance includes but where-provenance ignores." },
  { id: "w5r6", q: "List five things that defeat parsing-based lineage.", a: "Dynamic SQL, UDFs and external calls, non-SQL code (pandas, scripts), missing or stale schemas, nested data (JSON, structs, UNNEST), and inconsistent dataset names across systems." },
  { id: "w5r7", q: "Where in a dbt project does table-level lineage live, and how do you extend it to dashboards?", a: "In the ref() and source() calls, materialised in target/manifest.json as parent_map and child_map. Exposures declare downstream dashboards and models." }
],
practice: [
  { id: "w5p1", title: "Describe a run in PROV", task: "<p>An Airflow task run <code>build_revenue@2026-10-20</code>, executed by service account <code>airflow-prod</code> on behalf of the finance data team, reads <code>raw.orders</code> and <code>raw.customers</code> and writes <code>mart.revenue_daily</code>. Write the PROV statements (as simple triples) that describe this, using at least six relations.</p>", solution: "<pre class=\"code\">entity(raw.orders)  entity(raw.customers)  entity(mart.revenue_daily)\nactivity(build_revenue@2026-10-20)\nagent(airflow-prod)  agent(finance-data-team)\n\nbuild_revenue@2026-10-20  used               raw.orders\nbuild_revenue@2026-10-20  used               raw.customers\nmart.revenue_daily        wasGeneratedBy     build_revenue@2026-10-20\nmart.revenue_daily        wasDerivedFrom     raw.orders\nmart.revenue_daily        wasDerivedFrom     raw.customers\nbuild_revenue@2026-10-20  wasAssociatedWith  airflow-prod\nairflow-prod              actedOnBehalfOf    finance-data-team\nmart.revenue_daily        wasAttributedTo    finance-data-team</pre><p>A strong answer also notes that the entity should be a specific <i>version</i> of the table (snapshot ID), and that the activity can carry start and end times.</p>" },
  { id: "w5p2", title: "Lab: column lineage with SQLGlot", task: "<p>Install SQLGlot (<code>pip install sqlglot</code>; tested with version 30) and run:</p><pre class=\"code\">from sqlglot.lineage import lineage\n\nsql = \"\"\"\nSELECT c.country AS country, SUM(o.amount) AS revenue\nFROM orders o JOIN customers c ON o.customer_id = c.id\nWHERE o.status = 'paid'\nGROUP BY c.country\n\"\"\"\nschema = {\"orders\": {\"customer_id\": \"int\", \"amount\": \"double\", \"status\": \"text\"},\n          \"customers\": {\"id\": \"int\", \"country\": \"text\"}}\n\nfor col in [\"country\", \"revenue\"]:\n    node = lineage(col, sql, schema)\n    for n in node.walk():\n        print(col, \"<-\", n.name, \"|\", n.source.sql()[:40])</pre><p>(a) Which source columns does it report for each output? (b) Which columns influence the result but are <i>not</i> reported? (c) Remove every <code>o.</code> and <code>c.</code> prefix from the SQL, then run it once with <code>schema</code> and once with an empty dict <code>{}</code>. What changes and why?</p><p class=\"aside\">SQLGlot’s API changes between versions. In older versions <code>schema</code> was a keyword argument. Check <code>help(lineage)</code> if a call fails.</p>", solution: "<p>(a) country ← <code>c.country</code>, whose source is the table <code>customers AS c</code>. revenue ← <code>o.amount</code>, source <code>orders AS o</code>. The walk goes from the output column through the query’s scopes down to table columns.</p><p>(b) orders.status (filter), orders.customer_id and customers.id (join), and customers.country again as the group key. These are indirect lineage. The basic walk follows only each output column’s expression, so it shows direct lineage.</p><p>(c) With the schema, SQLGlot still resolves <code>amount</code> to <code>o.amount</code>, because it knows only orders has that column. With <code>{}</code> it returns a bare <code>amount</code> that is not attributed to any table. This is the qualify step from the notes, and the reason catalog-backed parsers fetch schemas first.</p>" },
  { id: "w5p3", title: "Classify direct and indirect", task: "<p>For this query, list every (output column ← input column) pair and label it DIRECT (identity, transformation or aggregation) or INDIRECT (join, filter, group by, sort, window or conditional).</p><pre class=\"code\">SELECT  p.category,\n        UPPER(p.name)                         AS product,\n        SUM(s.qty * s.unit_price)             AS sales,\n        RANK() OVER (ORDER BY SUM(s.qty) DESC) AS rnk\nFROM    sales s JOIN products p ON s.product_id = p.id\nWHERE   s.sale_date >= '2026-01-01'\nGROUP   BY p.category, p.name;</pre>", solution: "<ul><li>category ← products.category: DIRECT identity (also INDIRECT group by).</li><li>product ← products.name: DIRECT transformation (also INDIRECT group by).</li><li>sales ← sales.qty, sales.unit_price: DIRECT aggregation.</li><li>rnk ← sales.qty: INDIRECT window (it orders the ranking; the value of rnk is computed, not copied).</li><li>All outputs ← sales.product_id, products.id: INDIRECT join.</li><li>All outputs ← sales.sale_date: INDIRECT filter.</li></ul>" },
  { id: "w5p4", title: "Lab: table lineage from a dbt manifest", task: "<p>Clone dbt’s example project <code>jaffle_shop</code> (or use any dbt project you have), run <code>dbt deps && dbt docs generate</code> against DuckDB, then write a Python script that reads <code>target/manifest.json</code> and prints all upstream nodes of one model, recursively.</p>", solution: "<pre class=\"code\">import json\nm = json.load(open(\"target/manifest.json\"))\nparents = m[\"parent_map\"]\n\ndef upstream(node, depth=0, seen=None):\n    seen = seen or set()\n    for p in parents.get(node, []):\n        if p in seen:\n            continue\n        seen.add(p)\n        print(\"  \" * depth + p)\n        upstream(p, depth + 1, seen)\n\nupstream(\"model.jaffle_shop.customers\")</pre><p>Use <code>child_map</code> the same way for impact analysis (downstream). Node IDs look like <code>model.&lt;project&gt;.&lt;name&gt;</code> and <code>source.&lt;project&gt;.&lt;source&gt;.&lt;table&gt;</code>.</p>" },
  { id: "w5p5", title: "Find the blind spots", task: "<p>For each snippet, say whether a SQL parser can produce correct lineage, and if not, what would you do instead?</p><ol><li><code>spark.sql(f\"INSERT INTO {target} SELECT * FROM {src} WHERE dt = '{ds}'\")</code></li><li>A pandas script that reads two CSVs, merges them and writes Parquet.</li><li><code>CREATE VIEW v AS SELECT * FROM a JOIN b USING (id)</code> with no schema information available.</li></ol>", solution: "<ol><li>Not statically: table names come from variables. Use runtime capture: the OpenLineage Spark integration sees the resolved logical plan.</li><li>No SQL to parse. Emit OpenLineage events from the script (or wrap it in an orchestrator task that declares inputs and outputs), or declare the lineage manually.</li><li>Table-level yes (a, b → v), column-level no: SELECT * cannot be expanded without schemas. Feed the parser schemas from the catalog.</li></ol>" }
],
quiz: [
  { id: "w5q1", type: "mc", q: "In W3C PROV, a job run is best modelled as:", options: ["An Entity", "An Activity", "An Agent", "A Bundle"], answer: 1, why: "Activities happen over time and use or generate entities." },
  { id: "w5q2", type: "mc", q: "Which PROV relation says a table was produced by a run?", options: ["used", "wasGeneratedBy", "wasAttributedTo", "actedOnBehalfOf"], answer: 1, why: "Entity wasGeneratedBy Activity." },
  { id: "w5q3", type: "mc", q: "Why does a SQL lineage parser need table schemas?", options: ["To format the SQL", "To qualify unqualified columns and expand SELECT *", "To run the query", "To compute statistics"], answer: 1, why: "Without schemas, a column name shared by several tables in scope is ambiguous." },
  { id: "w5q4", type: "mc", q: "A column used only in a WHERE clause has which kind of lineage to the output?", options: ["Direct identity", "Direct aggregation", "Indirect (filter)", "None"], answer: 2, why: "It decides which rows appear without its value flowing into the output." },
  { id: "w5q5", type: "mc", q: "Which capture method reflects what actually ran, including run IDs and timings?", options: ["Static parsing", "Runtime instrumentation", "Manual documentation", "None"], answer: 1, why: "Runtime capture observes execution, so it is the eager approach in week 4’s terms." },
  { id: "w5q6", type: "mc", q: "In dbt, which file holds the table-level lineage graph after docs generation?", options: ["profiles.yml", "target/manifest.json", "dbt_project.yml", "packages.yml"], answer: 1, why: "manifest.json contains parent_map and child_map." },
  { id: "w5q7", type: "mc", q: "Spark sees s3://lake/orders and the warehouse sees analytics.raw.orders. What is the lineage problem?", options: ["No problem", "Dataset identity: without naming conventions they become two unconnected nodes", "Performance", "Security"], answer: 1, why: "OpenLineage naming conventions (namespace + name) exist to stitch graphs across systems." },
  { id: "w5q8", type: "mc", q: "Review (week 4): column-level identity lineage is closest to which theoretical model?", options: ["Why-provenance", "How-provenance", "Where-provenance", "Minimal witnesses"], answer: 2, why: "It records where values were copied from, lifted to columns." },
  { id: "w5q9", type: "sa", q: "Your manager asks why the lineage tool shows no upstream for a table built by a Python job. Explain in two or three sentences.", a: "The tool builds lineage by parsing SQL, and the Python job has no SQL to parse, so its reads and writes are invisible. We need runtime capture (the job emitting OpenLineage events, or the orchestrator declaring inputs and outputs) or manual documentation for that step." },
  { id: "w5q10", type: "sa", q: "Give one reason to combine static and runtime lineage instead of choosing one.", a: "Static parsing covers code that has not run yet and needs no job changes, while runtime capture covers dynamic SQL and non-SQL code and shows what actually ran. Together they fill each other’s blind spots and let you check one against the other." }
],
cards: [
  { id: "w5c1", f: "PROV core types", b: "Entity (data), Activity (process over time), Agent (responsible party)." },
  { id: "w5c2", f: "PROV: used vs wasGeneratedBy", b: "Activity used Entity (read). Entity wasGeneratedBy Activity (written)." },
  { id: "w5c3", f: "PROV: wasDerivedFrom", b: "Entity-to-entity derivation, e.g. mart.revenue wasDerivedFrom raw.orders." },
  { id: "w5c4", f: "Three lineage capture methods", b: "Static (parse code), runtime (instrument execution), manual (declared by people)." },
  { id: "w5c5", f: "Steps of SQL column-lineage extraction", b: "Parse → qualify (needs schemas, expand *) → trace expressions." },
  { id: "w5c6", f: "Direct column lineage subtypes", b: "Identity, transformation, aggregation." },
  { id: "w5c7", f: "Indirect column lineage subtypes", b: "Join, filter, group by, sort, window, conditional." },
  { id: "w5c8", f: "Indirect lineage in theory terms", b: "The why-provenance contribution (filter/join inputs) that where-provenance ignores." },
  { id: "w5c9", f: "dbt lineage artifacts", b: "ref()/source() → target/manifest.json (parent_map, child_map). Exposures add dashboards and ML models." },
  { id: "w5c10", f: "Why runtime capture is “eager”", b: "It records lineage while the job runs instead of reconstructing it later." },
  { id: "w5c11", f: "Five blind spots of SQL parsing", b: "Dynamic SQL, UDFs, non-SQL code, missing schemas, nested data (plus cross-system naming)." }
]
});

W.push({
id: "w6", num: 6,
title: "OpenLineage and Marquez",
focus: "The open standard for runtime lineage: runs, jobs, datasets and facets, the event lifecycle, integrations for Airflow, Spark and dbt, and a hands-on lab with a local Marquez server.",
goal: "By the end of the week you can read and write OpenLineage events by hand, run Marquez locally, send it a run with schema and column lineage, and explain how Airflow, Spark and dbt emit the same events automatically.",
plan: [
  ["Pre-test", 10],
  ["Read the OpenLineage spec docs and Marquez quickstart", 60],
  ["Listen: Data Engineering Podcast ep. 187 (while commuting)", 0],
  ["Study notes, then close-the-book recall", 40],
  ["Lab: Marquez + hand-written events", 120],
  ["Quiz and flashcard reviews", 60]
],
reading: [
  { what: "OpenLineage docs: Object model and Run cycle", where: "openlineage.io/docs (spec section)", mins: 25, note: "Pay attention to which fields are required and how a run’s events relate.", url: "https://openlineage.io/docs/" },
  { what: "OpenLineage API specification", where: "openlineage.io/apidocs/openapi", mins: 15, note: "Skim the RunEvent example payloads; you will write your own in the lab.", url: "https://openlineage.io/apidocs/openapi" },
  { what: "OpenLineage blog: column-level lineage", where: "openlineage.io/blog/column-lineage", mins: 10, note: "Short intro to the columnLineage facet. The facet has gained transformation types since this post.", url: "https://openlineage.io/blog/column-lineage/" },
  { what: "Marquez quickstart", where: "marquezproject.ai/docs/quickstart", mins: 10, note: "You need Docker. Read before the lab.", url: "https://marquezproject.ai/docs/quickstart/" },
  { what: "Data Engineering Podcast, episode 187: OpenLineage with Julien Le Dem", where: "dataengineeringpodcast.com", mins: 0, note: "About an hour. Listen while walking or commuting; it is not counted in the 5 hours.", url: "https://www.dataengineeringpodcast.com/openlineage-data-lineage-specification-episode-187" },
  { what: "Optional: Airflow OpenLineage provider user guide", where: "airflow.apache.org", mins: 15, note: "How Airflow emits events for its operators.", url: "https://airflow.apache.org/docs/apache-airflow-providers-openlineage/stable/guides/user.html" },
  { what: "Optional: OpenLineage Spark column lineage", where: "openlineage.io/docs/integrations/spark", mins: 15, note: "How the Spark listener derives column lineage from the logical plan.", url: "https://openlineage.io/docs/integrations/spark/spark_column_lineage" }
],
pretest: [
  "If every tool in your stack reported its own lineage, what minimum information would each report need to contain?",
  "What is the difference between a job and a run?",
  "How could lineage from Airflow and lineage from Spark end up in the same graph?"
],
notes: `
<h3>Why a standard</h3>
<p>Before OpenLineage, every catalog wrote its own integration for every engine: N tools times M engines. OpenLineage (started in 2020 by Julien Le Dem and others, now an LF AI &amp; Data project) defines one event format. Engines and schedulers are <b>producers</b> that emit events; catalogs and lineage servers are <b>consumers</b> that collect them. Marquez is the reference consumer. DataHub, Google Dataplex and several commercial catalogs also accept OpenLineage.</p>

<h3>The object model</h3>
<ul>
<li><b>Job</b>: a recurring process, identified by <code>namespace</code> + <code>name</code> (for example <code>airflow-prod</code> / <code>finance.build_revenue</code>).</li>
<li><b>Run</b>: one execution of a job, identified by a <code>runId</code> (a UUID).</li>
<li><b>Dataset</b>: something read or written, identified by <code>namespace</code> + <code>name</code> following naming conventions (namespace <code>postgres://host:5432</code>, name <code>shop.public.orders</code>; or <code>s3://bucket</code> + <code>path/to/table</code>).</li>
<li><b>Facets</b>: typed, versioned pieces of extra metadata attached to a run, a job, or a dataset. Each facet carries <code>_producer</code> and <code>_schemaURL</code>, so anyone can add custom facets without breaking consumers.</li>
</ul>
<p>In PROV terms: a run is an activity, datasets are entities, inputs are <i>used</i>, outputs are <i>wasGeneratedBy</i>.</p>

<h3>Run events and the run cycle</h3>
<p>A <b>RunEvent</b> must contain <code>eventTime</code>, <code>producer</code>, <code>schemaURL</code>, <code>run</code> and <code>job</code>, and usually <code>eventType</code>, <code>inputs</code> and <code>outputs</code>. The event types are:</p>
<table class="t"><tr><th>eventType</th><th>Meaning</th></tr>
<tr><td>START</td><td>The run began. Every run needs one.</td></tr>
<tr><td>RUNNING</td><td>Progress or extra metadata while running</td></tr>
<tr><td>COMPLETE</td><td>Finished successfully</td></tr>
<tr><td>FAIL</td><td>Finished with an error</td></tr>
<tr><td>ABORT</td><td>Stopped abnormally</td></tr>
<tr><td>OTHER</td><td>Extra metadata at any time, even after completion</td></tr></table>
<p>Every run has one START and one terminal event (COMPLETE, FAIL or ABORT). Events for one run share the runId, and consumers merge their inputs, outputs and facets. Spec 2.0 also added <b>JobEvent</b> and <b>DatasetEvent</b> for design-time (static) lineage that is not tied to a run.</p>

<h3>Facets you will meet</h3>
<table class="t"><tr><th>Attached to</th><th>Facet</th><th>Holds</th></tr>
<tr><td>Run</td><td>parent</td><td>The parent run and job (e.g. the Airflow DAG run of a task)</td></tr>
<tr><td>Run</td><td>nominalTime</td><td>The scheduled time the run is for (vs. when it actually ran)</td></tr>
<tr><td>Run</td><td>errorMessage</td><td>Message, language and stack trace of a failure</td></tr>
<tr><td>Job</td><td>sql, sourceCodeLocation</td><td>The query text, the repo and commit</td></tr>
<tr><td>Dataset</td><td>schema</td><td>Column names and types</td></tr>
<tr><td>Dataset</td><td>dataSource</td><td>The connection the dataset lives in</td></tr>
<tr><td>Dataset</td><td>columnLineage</td><td>For each output column, the input fields with transformation type DIRECT or INDIRECT and a subtype</td></tr>
<tr><td>Input dataset</td><td>dataQualityMetrics, dataQualityAssertions</td><td>Row counts, null counts, test results</td></tr>
<tr><td>Output dataset</td><td>outputStatistics</td><td>Rows and bytes written</td></tr></table>

<h3>Integrations</h3>
<ul>
<li><b>Airflow</b>: the <code>apache-airflow-providers-openlineage</code> provider (Airflow 2.7+). Operators report their inputs and outputs; you configure a transport (for example HTTP to Marquez).</li>
<li><b>Spark</b>: add the <code>openlineage-spark</code> jar and set <code>spark.extraListeners=io.openlineage.spark.agent.OpenLineageSparkListener</code>. The listener reads Spark’s logical plan, which gives table and column lineage even for DataFrame code and dynamic SQL. This is runtime, eager capture.</li>
<li><b>dbt</b>: run <code>dbt-ol run</code> (from the <code>openlineage-dbt</code> package) instead of <code>dbt run</code>. It reads dbt’s artifacts after the run and emits events per model.</li>
<li><b>Transports</b>: HTTP, Kafka, console and file, configured by environment variables or a YAML file (for example <code>OPENLINEAGE_URL</code> and <code>OPENLINEAGE_NAMESPACE</code>).</li>
</ul>

<h3>Marquez</h3>
<p>Marquez (originally from WeWork) stores OpenLineage events in PostgreSQL, builds the job and dataset graph, keeps versions of datasets and jobs, and shows them in a web UI. Locally, the API listens on port 5000 (events go to <code>POST /api/v1/lineage</code>) and the UI on port 3000. <code>GET /api/v1/lineage?nodeId=dataset:&lt;namespace&gt;:&lt;name&gt;</code> returns the graph around a node.</p>
`,
recall: [
  { id: "w6r1", q: "Define job, run, dataset and facet in OpenLineage, including how each is identified.", a: "Job: a recurring process (namespace + name). Run: one execution of a job (runId UUID). Dataset: something read or written (namespace + name, following naming conventions). Facet: typed, versioned extra metadata attached to a run, job or dataset, carrying _producer and _schemaURL." },
  { id: "w6r2", q: "List the six event types and the rule about which a run must have.", a: "START, RUNNING, COMPLETE, FAIL, ABORT, OTHER. Every run has exactly one START and one terminal event: COMPLETE, FAIL or ABORT." },
  { id: "w6r3", q: "Which fields are required in a RunEvent?", a: "eventTime, producer, schemaURL, run and job (eventType, inputs and outputs are normally present too)." },
  { id: "w6r4", q: "Name four facets and where each is attached.", a: "parent (run), nominalTime (run), errorMessage (run), sql (job), sourceCodeLocation (job), schema (dataset), dataSource (dataset), columnLineage (dataset), dataQualityMetrics (input dataset), outputStatistics (output dataset)." },
  { id: "w6r5", q: "How do Airflow, Spark and dbt each emit OpenLineage events?", a: "Airflow: the openlineage provider package with a configured transport. Spark: the openlineage-spark jar registered as spark.extraListeners, reading the logical plan. dbt: run dbt-ol instead of dbt, which emits events from dbt’s artifacts." },
  { id: "w6r6", q: "Map OpenLineage concepts onto W3C PROV.", a: "Run = Activity, Dataset = Entity, input = used, output = wasGeneratedBy, job ≈ the plan the activity follows; producers and owners can be agents." },
  { id: "w6r7", q: "Why does the Spark integration give better coverage than parsing SQL text?", a: "It reads the resolved logical plan at runtime, so it sees actual table names and column derivations even for DataFrame code and SQL built dynamically in Python." }
],
practice: [
  { id: "w6p1", title: "Read an event", task: "<pre class=\"code\">{\n  \"eventType\": \"COMPLETE\",\n  \"eventTime\": \"2026-10-21T02:14:07.312Z\",\n  \"run\": { \"runId\": \"3f9c1e8a-6b0e-4a7e-9a55-1b2f7a2c9d10\",\n           \"facets\": { \"parent\": { \"run\": { \"runId\": \"aa01…\" },\n                                   \"job\": { \"namespace\": \"airflow-prod\", \"name\": \"finance_daily\" } } } },\n  \"job\": { \"namespace\": \"airflow-prod\", \"name\": \"finance_daily.build_revenue\" },\n  \"inputs\":  [ { \"namespace\": \"postgres://shop-db:5432\", \"name\": \"shop.public.orders\" } ],\n  \"outputs\": [ { \"namespace\": \"bigquery\", \"name\": \"analytics.mart.revenue_daily\",\n                \"outputFacets\": { \"outputStatistics\": { \"rowCount\": 365 } } } ],\n  \"producer\": \"https://github.com/apache/airflow/tree/providers-openlineage/1.14.0\",\n  \"schemaURL\": \"https://openlineage.io/spec/2-0-2/OpenLineage.json#/$defs/RunEvent\"\n}</pre><p>Answer: (a) What job ran and as part of what? (b) What did it read and write? (c) Did it succeed? (d) What else must exist for this run to be complete according to the spec? (e) What PROV statements does it imply?</p>", solution: "<p>(a) Job <code>finance_daily.build_revenue</code> in namespace airflow-prod, a task inside the DAG run of <code>finance_daily</code> (parent facet). (b) Read <code>shop.public.orders</code> from a Postgres server; wrote 365 rows to <code>analytics.mart.revenue_daily</code> in BigQuery. (c) Yes, COMPLETE. (d) A START event with the same runId. (e) run used shop.public.orders; analytics.mart.revenue_daily wasGeneratedBy run; run wasInformedBy (or is part of) the parent run.</p>" },
  { id: "w6p2", title: "Lab part 1: run Marquez", task: "<ol><li>Install Docker Desktop (or Docker Engine).</li><li><code>git clone https://github.com/MarquezProject/marquez && cd marquez</code></li><li><code>./docker/up.sh --seed</code> (the seed adds a sample food-delivery graph).</li><li>Open <code>http://localhost:3000</code> and explore the seeded graph. Find one dataset with column lineage and one failed run.</li><li>Call the API: <code>curl \"http://localhost:5000/api/v1/namespaces\"</code>.</li></ol><p class=\"aside\">On macOS, port 5000 may be taken by AirPlay Receiver. Turn it off in System Settings, or start Marquez on another API port (see <code>./docker/up.sh --help</code>) and use that port below.</p>", solution: "<p>You should see namespaces such as <code>food_delivery</code>, a graph of jobs (squares) and datasets (cylinders), and run history per job. If the UI is empty, check <code>docker ps</code> for the marquez-api, marquez-web and marquez-db containers, and the API logs for port conflicts.</p>" },
  { id: "w6p3", title: "Lab part 2: send your own run", task: "<p>Save as <code>emit.py</code>, run with <code>pip install requests && python emit.py</code>, then find the job <code>course.build_revenue</code> in the Marquez UI.</p><pre class=\"code\">import uuid, datetime, requests\n\nURL = \"http://localhost:5000/api/v1/lineage\"\nPRODUCER = \"https://example.com/lineage-course\"\nRUN_ID = str(uuid.uuid4())\nJOB = {\"namespace\": \"course\", \"name\": \"build_revenue\"}\nSRC = \"postgres://shop-db:5432\"\n\ndef now():\n    return datetime.datetime.now(datetime.timezone.utc).isoformat()\n\ndef facet(name, version, body):\n    body[\"_producer\"] = PRODUCER\n    body[\"_schemaURL\"] = f\"https://openlineage.io/spec/facets/{version}/{name}.json#/$defs/{name}\"\n    return body\n\ndef emit(event_type, inputs, outputs):\n    event = {\"eventType\": event_type, \"eventTime\": now(),\n             \"run\": {\"runId\": RUN_ID}, \"job\": JOB,\n             \"inputs\": inputs, \"outputs\": outputs,\n             \"producer\": PRODUCER,\n             \"schemaURL\": \"https://openlineage.io/spec/2-0-2/OpenLineage.json#/$defs/RunEvent\"}\n    r = requests.post(URL, json=event)\n    print(event_type, r.status_code)\n\ninputs = [{\"namespace\": SRC, \"name\": \"shop.public.orders\"},\n          {\"namespace\": SRC, \"name\": \"shop.public.customers\"}]\n\nschema = facet(\"SchemaDatasetFacet\", \"1-1-1\", {\"fields\": [\n    {\"name\": \"country\", \"type\": \"VARCHAR\"},\n    {\"name\": \"revenue\", \"type\": \"DECIMAL\"}]})\n\nemit(\"START\", inputs, [])\nemit(\"COMPLETE\", inputs, [{\"namespace\": \"warehouse\", \"name\": \"mart.revenue_by_country\",\n                          \"facets\": {\"schema\": schema}}])</pre>", solution: "<p>Both requests should print <code>201</code>. In the UI you will see two input datasets, one job and one output dataset with a schema, and one completed run. Run the script again: a second run appears under the same job, because the job namespace and name are the same but the runId is new. That is the job/run distinction.</p>" },
  { id: "w6p4", title: "Lab part 3: add column lineage", task: "<p>Extend <code>emit.py</code> so the output dataset also carries a <code>columnLineage</code> facet for the query from week 5 (revenue = SUM(orders.amount) for paid orders, grouped by customers.country, joined on customer_id = id). Include DIRECT and INDIRECT transformations.</p>", solution: "<pre class=\"code\">def src(table, field, ttype, subtype):\n    return {\"namespace\": SRC, \"name\": f\"shop.public.{table}\", \"field\": field,\n            \"transformations\": [{\"type\": ttype, \"subtype\": subtype}]}\n\ncol_lineage = facet(\"ColumnLineageDatasetFacet\", \"1-2-0\", {\"fields\": {\n    \"country\": {\"inputFields\": [\n        src(\"customers\", \"country\", \"DIRECT\", \"IDENTITY\"),\n        src(\"customers\", \"country\", \"INDIRECT\", \"GROUP_BY\")]},\n    \"revenue\": {\"inputFields\": [\n        src(\"orders\", \"amount\", \"DIRECT\", \"AGGREGATION\"),\n        src(\"orders\", \"status\", \"INDIRECT\", \"FILTER\"),\n        src(\"orders\", \"customer_id\", \"INDIRECT\", \"JOIN\"),\n        src(\"customers\", \"id\", \"INDIRECT\", \"JOIN\")]}}})\n\n# then: \"facets\": {\"schema\": schema, \"columnLineage\": col_lineage}</pre><p>Older versions of the facet used <code>transformationType</code> and <code>transformationDescription</code> strings per column instead of the <code>transformations</code> list. If your Marquez version ignores the new form, check its release notes.</p>" },
  { id: "w6p5", title: "Lab part 4: a failure and a parent", task: "<p>(a) Emit a run of a new job <code>course.load_orders</code> that STARTs and then FAILs with an <code>errorMessage</code> run facet. (b) Make both your jobs children of a parent job <code>course.nightly</code> using the <code>parent</code> run facet. Look at both in the UI.</p>", solution: "<pre class=\"code\">err = facet(\"ErrorMessageRunFacet\", \"1-0-1\", {\n    \"message\": \"relation shop.public.orders does not exist\",\n    \"programmingLanguage\": \"python\"})\n# FAIL event: \"run\": {\"runId\": RUN_ID, \"facets\": {\"errorMessage\": err}}\n\nPARENT_RUN = str(uuid.uuid4())\nparent = facet(\"ParentRunFacet\", \"1-0-1\", {\n    \"run\": {\"runId\": PARENT_RUN},\n    \"job\": {\"namespace\": \"course\", \"name\": \"nightly\"}})\n# add to each child: \"run\": {\"runId\": RUN_ID, \"facets\": {\"parent\": parent}}</pre><p>The failed run shows in red with the message. The parent facet is how Airflow links task runs to their DAG run, and how Spark links a Spark application to the Airflow task that launched it. Facet version numbers change over time; if a consumer rejects one, look up the current version on openlineage.io.</p>" },
  { id: "w6p6", title: "Configure real integrations", task: "<p>Write the configuration you would use to send lineage to your local Marquez from (a) dbt, (b) a PySpark job submitted with spark-submit, (c) Airflow.</p>", solution: "<p>(a) dbt:</p><pre class=\"code\">pip install openlineage-dbt\nexport OPENLINEAGE_URL=http://localhost:5000\nexport OPENLINEAGE_NAMESPACE=dbt_dev\ndbt-ol run</pre><p>(b) Spark (pick the jar version matching your Spark and Scala versions):</p><pre class=\"code\">spark-submit \\\n  --packages io.openlineage:openlineage-spark_2.12:&lt;version&gt; \\\n  --conf spark.extraListeners=io.openlineage.spark.agent.OpenLineageSparkListener \\\n  --conf spark.openlineage.transport.type=http \\\n  --conf spark.openlineage.transport.url=http://localhost:5000 \\\n  --conf spark.openlineage.namespace=spark_dev \\\n  job.py</pre><p>(c) Airflow: <code>pip install apache-airflow-providers-openlineage</code>, then set the transport, for example <code>AIRFLOW__OPENLINEAGE__TRANSPORT='{\"type\": \"http\", \"url\": \"http://localhost:5000\", \"endpoint\": \"api/v1/lineage\"}'</code> and <code>AIRFLOW__OPENLINEAGE__NAMESPACE=airflow_dev</code>.</p>" }
],
quiz: [
  { id: "w6q1", type: "mc", q: "What identifies a run in OpenLineage?", options: ["namespace + name", "A runId UUID", "The eventTime", "The producer URL"], answer: 1, why: "Jobs and datasets use namespace + name; runs use a UUID." },
  { id: "w6q2", type: "mc", q: "Which set lists only terminal event types?", options: ["START, COMPLETE", "COMPLETE, FAIL, ABORT", "RUNNING, OTHER", "FAIL, OTHER"], answer: 1, why: "A run has one START and one of COMPLETE, FAIL or ABORT." },
  { id: "w6q3", type: "mc", q: "Where does the columnLineage facet live?", options: ["On the run", "On the job", "On an output dataset", "On the producer"], answer: 2, why: "It describes the columns of the dataset written, keyed by output column." },
  { id: "w6q4", type: "mc", q: "Which run facet links an Airflow task run to its DAG run?", options: ["nominalTime", "parent", "sql", "dataSource"], answer: 1, why: "The parent facet names the parent run and job." },
  { id: "w6q5", type: "mc", q: "Why does every facet carry _producer and _schemaURL?", options: ["For authentication", "So facets are self-describing and versioned, letting anyone add custom facets safely", "For compression", "They are optional decoration"], answer: 1, why: "Consumers can validate or ignore facets they do not know." },
  { id: "w6q6", type: "mc", q: "What does Marquez’s POST /api/v1/lineage endpoint accept?", options: ["SQL queries", "OpenLineage events", "dbt manifests", "CSV files"], answer: 1, why: "Marquez is an OpenLineage consumer." },
  { id: "w6q7", type: "mc", q: "How do you get OpenLineage events from dbt?", options: ["dbt docs serve", "Run dbt-ol instead of dbt", "Add a macro to every model", "It is impossible"], answer: 1, why: "dbt-ol wraps dbt and emits events from its artifacts." },
  { id: "w6q8", type: "mc", q: "Review (week 5): a column used only in a JOIN condition should be recorded as:", options: ["DIRECT IDENTITY", "DIRECT TRANSFORMATION", "INDIRECT JOIN", "Not recorded"], answer: 2, why: "It affects which rows appear without its value flowing into the column." },
  { id: "w6q9", type: "sa", q: "Explain the difference between a job and a run, and why lineage graphs usually show jobs while debugging needs runs.", a: "A job is the recurring definition (namespace + name); a run is one execution with its own runId, times, inputs, outputs and state. The graph of jobs and datasets shows the stable structure, but debugging asks what happened in a specific execution: which version it read, when, whether it failed and with what error." },
  { id: "w6q10", type: "sa", q: "Why did the industry need a lineage standard? Use the N×M argument.", a: "With N engines and M catalogs, each catalog had to integrate with each engine, giving N×M integrations that broke independently. A standard event format means each engine implements one producer and each catalog one consumer, N+M integrations, and lineage from different tools can be joined in one graph." }
],
cards: [
  { id: "w6c1", f: "OpenLineage core entities", b: "Job (namespace+name), Run (runId UUID), Dataset (namespace+name), Facets (extensible metadata)." },
  { id: "w6c2", f: "RunEvent required fields", b: "eventTime, producer, schemaURL, run, job." },
  { id: "w6c3", f: "OpenLineage event types", b: "START, RUNNING, COMPLETE, FAIL, ABORT, OTHER. One START + one terminal per run." },
  { id: "w6c4", f: "Producer vs consumer", b: "Producers emit events (Airflow, Spark, dbt). Consumers store and serve them (Marquez, DataHub, Dataplex)." },
  { id: "w6c5", f: "parent run facet", b: "Links a run to its parent run and job, e.g. Airflow task run → DAG run." },
  { id: "w6c6", f: "nominalTime facet", b: "The scheduled time a run is for, as opposed to when it actually executed." },
  { id: "w6c7", f: "Enable OpenLineage in Spark", b: "Add openlineage-spark jar; spark.extraListeners=io.openlineage.spark.agent.OpenLineageSparkListener; set transport." },
  { id: "w6c8", f: "Enable OpenLineage in dbt", b: "pip install openlineage-dbt; set OPENLINEAGE_URL / NAMESPACE; run dbt-ol." },
  { id: "w6c9", f: "Marquez local ports and endpoint", b: "API 5000 (POST /api/v1/lineage), web UI 3000." },
  { id: "w6c10", f: "JobEvent and DatasetEvent (spec 2.0)", b: "Static, design-time lineage not tied to a run." },
  { id: "w6c11", f: "OpenLineage dataset naming", b: "Namespace from the data source (e.g. postgres://host:5432), name within it (db.schema.table)." }
]
});

const W7_GRAPH = `<div class="diagram">raw.customers ──▶ stg_customers ──▶ dim_customer ──▶ fct_revenue ──▶ [Dashboard] Exec KPIs
      │                 │                              ▲        └──▶ [ML] churn_model
      │                 └──▶ crm_export (reverse ETL)   │
raw.orders ─────▶ stg_orders ──────────────────────────┘
raw.fx_rates ───▶ stg_fx ──────────────────────────────┘</div>`;
W.push({
id: "w7", num: 7,
title: "Lineage in operations and governance",
focus: "Using lineage day to day (impact analysis, root cause, data quality, PII tags) and what regulators expect: BCBS 239 and the ECB guide, GDPR, the EU AI Act.",
goal: "By the end of the week you can run an impact and a root-cause analysis on a lineage graph, design tag-propagation rules for personal data, and turn a regulatory expectation into concrete lineage requirements.",
plan: [
  ["Pre-test", 10],
  ["Read BCBS 239 (principles 1–6), the ECB lineage summary, GDPR Art. 30, AI Act Art. 10", 85],
  ["Read the DataHub lineage feature guide", 15],
  ["Study notes, then close-the-book recall", 50],
  ["Practice problems", 80],
  ["Quiz and flashcard reviews", 60]
],
reading: [
  { what: "Basel Committee, BCBS 239: Principles for effective risk data aggregation and risk reporting (January 2013)", where: "bis.org/publ/bcbs239.pdf, sections on Principles 1–6", mins: 40, note: "Read Principles 2 (data architecture) to 6 (adaptability) closely. Ask yourself for each: how would lineage provide evidence?", url: "https://www.bis.org/publ/bcbs239.pdf" },
  { what: "Summary of the ECB RDARR Guide’s lineage expectations (May 2024)", where: "solidatus.com blog", mins: 15, note: "A vendor summary, so read it critically. The expectations themselves come from the ECB guide.", url: "https://www.solidatus.com/blog/detailed-expectations-around-data-lineage-and-bcbs-239-from-the-european-central-bank-ecb/" },
  { what: "GDPR Article 30: Records of processing activities", where: "gdpr-info.eu/art-30-gdpr", mins: 10, note: "Which items in the record would lineage help you fill in and keep current?", url: "https://gdpr-info.eu/art-30-gdpr/" },
  { what: "EU AI Act Article 10: Data and data governance", where: "artificialintelligenceact.eu/article/10", mins: 15, note: "Find the phrases about the origin of data and data preparation operations.", url: "https://artificialintelligenceact.eu/article/10/" },
  { what: "DataHub lineage feature guide", where: "docs.datahub.com", mins: 15, note: "How a catalog presents upstream/downstream, impact analysis and column lineage.", url: "https://docs.datahub.com/docs/features/feature-guides/lineage" },
  { what: "Optional: Netflix, “Building and scaling data lineage at Netflix” (Strata 2019)", where: "O’Reilly conference page", mins: 0, note: "A large-scale case study. Look for the talk recording or slides from the session page.", url: "https://conferences.oreilly.com/strata/strata-ca-2019/public/schedule/detail/73025.html" },
  { what: "Optional: Irina Steenbeek, Data Lineage from a Business Perspective (2021)", where: "Book", mins: 0, note: "How to run a lineage programme in an organisation, especially in banking.", url: "https://datacrossroads.nl/product/data-lineage-from-a-business-perspective/" }
],
pretest: [
  "You need to rename a column in a source table. How would you find out who will be affected?",
  "A customer asks to have their data deleted. How do you find every copy of it in your platform?",
  "Why would a banking regulator care about data lineage?"
],
notes: `
<h3>Lineage at work: the everyday uses</h3>
<table class="t"><tr><th>Use</th><th>Direction</th><th>Question</th></tr>
<tr><td><b>Impact analysis</b></td><td>Downstream</td><td>If I change or drop this, what breaks and whom do I tell?</td></tr>
<tr><td><b>Root-cause analysis</b></td><td>Upstream</td><td>This number is wrong. Which upstream job, run or source caused it?</td></tr>
<tr><td><b>Incident blast radius</b></td><td>Downstream from a failure</td><td>A load failed at 02:00. Which tables and dashboards are now stale?</td></tr>
<tr><td><b>Quality propagation</b></td><td>Downstream</td><td>A test failed on stg_orders. Which assets should show a warning?</td></tr>
<tr><td><b>Sensitive-data tracking</b></td><td>Downstream</td><td>Where has personal data flowed from this column?</td></tr>
<tr><td><b>Clean-up and cost</b></td><td>Downstream (absence)</td><td>Which tables have no consumers and can be deprecated?</td></tr>
<tr><td><b>Freshness and SLAs</b></td><td>Upstream</td><td>This mart must be ready at 07:00. Which upstream jobs are on the critical path?</td></tr></table>
<p>Column-level lineage makes impact analysis much sharper. Renaming <code>raw.customers.email</code> should only alert owners of assets that actually use <code>email</code>, not every table downstream of <code>raw.customers</code>. Run-level lineage (OpenLineage runs) is what root-cause analysis needs: not just “what feeds this” but “which run of which job, reading which version, failed or changed”.</p>

<h3>Propagating tags is propagating annotations</h3>
<p>Catalogs let you tag a column (for example <code>PII.email</code>) and push the tag downstream along column lineage. That is week 4’s annotation propagation, and it raises the same design questions:</p>
<ul>
<li><b>Identity</b> copies: the tag clearly propagates.</li>
<li><b>Transformations</b>: <code>LOWER(email)</code> is still personal data. <code>SHA256(email)</code> is <i>pseudonymised</i>, which under GDPR is still personal data. The tag should propagate, perhaps with a different label.</li>
<li><b>Aggregations</b>: <code>COUNT(DISTINCT email)</code> per country is usually not personal data. Stop or downgrade the tag, but small groups can still identify people.</li>
<li><b>Indirect</b> use: filtering on <code>email</code> does not copy it. Usually do not propagate, but record it for audit.</li>
</ul>
<p>Automatic propagation is only as good as the column lineage underneath it. Gaps in lineage become gaps in your sensitive-data map.</p>

<h3>BCBS 239 and the ECB guide (banking)</h3>
<p>BCBS 239 (Basel Committee, January 2013) sets 14 principles for how large banks aggregate and report risk data, written after the 2008 crisis showed banks could not quickly assemble their exposures. They fall into four groups:</p>
<ol>
<li>Overarching governance and infrastructure (Principles 1–2: governance; data architecture and IT infrastructure)</li>
<li>Risk data aggregation capabilities (3–6: accuracy and integrity, completeness, timeliness, adaptability)</li>
<li>Risk reporting practices (7–11)</li>
<li>Supervisory review, tools and cooperation (12–14)</li>
</ol>
<p>The principles do not name tools. Lineage is how banks <i>evidence</i> them: you cannot show that a risk figure is accurate, complete and reconcilable without showing how it was produced. The ECB’s Guide on effective risk data aggregation and risk reporting (May 2024) makes the expectation explicit. As summarised by Solidatus, it expects:</p>
<ul>
<li>Complete, end-to-end lineage, from data capture to the reported figure, for the critical data elements (CDEs) behind key risk indicators.</li>
<li><b>Attribute-level</b> lineage. System-level lineage is not enough.</li>
<li>Lineage that is kept up to date, not assembled ad hoc when someone asks.</li>
<li>Documentation of each step, including manual steps and end-user tools such as spreadsheets, the data quality controls at each step, and business and technical ownership.</li>
</ul>
<p>Notice how this maps to the theory: “attribute-level” means column lineage, “up to date” favours eager or automated capture, and “manual steps” forces you to combine automated and declared lineage.</p>

<h3>GDPR</h3>
<p>Article 30 requires a <b>record of processing activities</b>: purposes, categories of data subjects and personal data, recipients, transfers to third countries, retention periods and security measures. Lineage helps keep that record true as pipelines change. It also helps with data subject rights: to erase or export a person’s data (Articles 17 and 15) you must find every copy, including derived tables, exports and backups.</p>

<h3>EU AI Act</h3>
<p>Article 10 requires training, validation and testing data for high-risk AI systems to follow data governance practices. These include the data collection processes and the <b>origin of data</b> (and, for personal data, the original purpose of collection), and the data preparation operations such as annotation, labelling, cleaning, enrichment and aggregation. In other words: provenance of training data, including which version of which dataset a model was trained on (week 1’s archiving problem).</p>

<h3>Making lineage good enough</h3>
<p>Useful dimensions for judging lineage quality:</p>
<ul>
<li><b>Coverage</b>: what fraction of critical assets have complete upstream lineage?</li>
<li><b>Granularity</b>: table, column or row, compared with what the use case needs.</li>
<li><b>Accuracy</b>: does it match what actually runs? (Static lineage can drift.)</li>
<li><b>Freshness</b>: how quickly does a change in code show up in the graph?</li>
<li><b>Stitching</b>: are the same datasets recognised as one node across systems?</li>
<li><b>Ownership</b>: does every node have an accountable owner?</li>
</ul>
<p>A practical rollout starts from the outputs that matter most (critical reports, CDEs, revenue dashboards), automates capture with runtime and parsing integrations, documents the remaining manual steps, and measures coverage over time.</p>
`,
recall: [
  { id: "w7r1", q: "Name five operational uses of lineage and say whether each walks upstream or downstream.", a: "Impact analysis (downstream), root-cause analysis (upstream), incident blast radius (downstream), quality propagation (downstream), sensitive-data tracking (downstream), clean-up of unused assets (downstream, looking for absence), SLA critical path (upstream)." },
  { id: "w7r2", q: "Why does column-level lineage improve impact analysis compared with table-level?", a: "Table-level lineage flags everything downstream of a table. Column-level lineage flags only assets that use the changed column, so fewer false alarms and the right owners get notified." },
  { id: "w7r3", q: "How should a PII tag propagate through identity, hashing, aggregation and filter usage?", a: "Identity: propagate. Hashing: still personal data under GDPR (pseudonymised), so propagate, maybe relabelled. Aggregation: usually stop or downgrade, beware small groups. Filter (indirect): usually do not propagate, but record for audit." },
  { id: "w7r4", q: "What are the four groups of BCBS 239 principles, and which principles cover aggregation capabilities?", a: "Governance and infrastructure (1–2), risk data aggregation capabilities (3–6: accuracy and integrity, completeness, timeliness, adaptability), risk reporting (7–11), supervisory review (12–14)." },
  { id: "w7r5", q: "List four lineage expectations in the ECB’s 2024 guide.", a: "End-to-end lineage from capture to reporting for CDEs behind key risk indicators; attribute (column) level, not system level; kept up to date, not ad hoc; documentation of each step including manual steps and end-user tools, the controls at each step, and ownership." },
  { id: "w7r6", q: "How does lineage help with GDPR Articles 30, 15 and 17?", a: "Art. 30: keeps the record of processing (purposes, categories, recipients, transfers, retention) accurate as pipelines change. Art. 15 and 17: find every copy and derivative of a person’s data to export or erase it." },
  { id: "w7r7", q: "What does AI Act Article 10 require that is a provenance question?", a: "Data governance for high-risk AI training, validation and test data, covering collection processes and the origin of the data (and original purpose for personal data), plus preparation operations such as labelling, cleaning, enrichment and aggregation." }
],
practice: [
  { id: "w7p1", title: "Impact analysis", task: "{{W7_GRAPH}}<p>The source team will rename <code>raw.customers.email</code> to <code>email_address</code>. Column lineage shows <code>email</code> flows into <code>stg_customers.email</code>, <code>dim_customer.email_domain</code> (via SPLIT) and <code>crm_export.email</code>. (a) Which assets break? (b) Which assets downstream of raw.customers are <i>not</i> affected? (c) In what order would you fix them, and whom do you notify?</p>", solution: "<p>(a) stg_customers (reads the column directly), dim_customer (email_domain derived from it), crm_export (copies it to the CRM).</p><p>(b) fct_revenue, the Exec KPIs dashboard and churn_model, unless they use email_domain. Table-level lineage would have flagged them all.</p><p>(c) Fix in topological order: stg_customers first (alias the new name back to <code>email</code> to absorb the change), then verify dim_customer and crm_export. Notify the owners of crm_export (the CRM team) and dim_customer, and agree a cut-over date with the source team. A data contract on raw.customers would have caught the rename before it shipped.</p>" },
  { id: "w7p2", title: "Root-cause analysis with runs", task: "{{W7_GRAPH}}<p>The Exec KPIs revenue for yesterday is 8% low. Run history for last night: stg_orders COMPLETE (row count normal), stg_fx COMPLETE (row count 0, usually 30), dim_customer COMPLETE, fct_revenue COMPLETE. Walk the lineage and find the most likely cause. What would have prevented the bad number from reaching the dashboard?</p>", solution: "<p>Walk upstream from the dashboard: fct_revenue ← stg_orders, dim_customer, stg_fx. All runs succeeded, so look at the data: stg_fx wrote 0 rows. If fct_revenue converts currencies with an inner join to FX rates, orders in non-EUR currencies silently drop, lowering revenue. Check raw.fx_rates next (did the provider deliver?).</p><p>Prevention: a data quality check on stg_fx (row count &gt; 0, freshness) that fails or blocks downstream runs, with the result attached to the run (OpenLineage dataQualityAssertions) and propagated to the dashboard as a warning. Lesson: COMPLETE is not the same as correct; run lineage plus output statistics shows it.</p>" },
  { id: "w7p3", title: "Design tag propagation rules", task: "<p>Write propagation rules for the tag <code>PII</code> through these column transformations, and justify each: (1) <code>email</code> copied; (2) <code>LOWER(TRIM(email))</code>; (3) <code>SHA256(email)</code>; (4) <code>SPLIT_PART(email, '@', 2)</code> (domain); (5) <code>COUNT(DISTINCT email)</code> grouped by country; (6) <code>WHERE email LIKE '%@example.com'</code>.</p>", solution: "<ol><li>Propagate PII: identity copy.</li><li>Propagate PII: a transformation that keeps the person identifiable.</li><li>Propagate as PII-pseudonymised: hashes of emails can be matched back and are still personal data under GDPR.</li><li>Usually do not propagate PII, tag as derived. A company domain is rarely personal, but a personal-domain email (a family name domain) can be. Flag for review.</li><li>Do not propagate: an aggregate. Add a rule for small counts (k-anonymity threshold) if groups can be tiny.</li><li>Do not propagate (indirect filter), but record the dependency for audit.</li></ol><p>There is no single right answer; the point is to write the rules down per transformation type and make them depend on column lineage subtypes.</p>" },
  { id: "w7p4", title: "From regulation to requirements", task: "<p>Your bank’s CDE <code>exposure_at_default</code> feeds a key risk indicator. Using the ECB expectations, write five testable lineage requirements for it (things an auditor could check).</p>", solution: "<ol><li>Every transformation step from capture in the source system to the KRI report is recorded in the lineage tool, with no gaps (coverage = 100% for this CDE).</li><li>Lineage is at attribute level: each step names the input and output fields and the transformation logic.</li><li>Manual steps and end-user applications (e.g. spreadsheets used for adjustments) appear as nodes with an owner and a description.</li><li>Each step lists its data quality controls and their latest results.</li><li>Lineage is updated automatically on deployment (or within N days of a change), and the last-verified date is visible; a quarterly review confirms it matches production.</li></ol>" },
  { id: "w7p5", title: "An erasure request", task: "<p>A customer invokes the right to erasure. Their record is in <code>raw.customers</code>. Using lineage, describe step by step how you find and handle every copy. What can lineage <i>not</i> find for you?</p>", solution: "<p>Steps: start at raw.customers (and the customer’s key), follow column and table lineage downstream to every derived table, export and model (stg_customers, dim_customer, crm_export, fct_revenue if it holds customer keys, churn_model features). For each node decide: delete the row, recompute, or anonymise; for reverse-ETL targets (the CRM), trigger deletion there. Record what was done.</p><p>Lineage cannot find copies made outside instrumented tools (ad hoc CSV downloads, emails, spreadsheets), and it does not by itself handle backups and snapshots (time travel), which need retention rules. It also cannot remove what a trained model has learned; that needs a retraining policy.</p>" },
  { id: "w7p6", title: "Measure lineage quality", task: "<p>Propose three metrics you could put on a dashboard to track whether lineage in your platform is getting better, and how to compute each.</p>", solution: "<ul><li><b>Coverage</b>: share of tier-1 assets whose full upstream graph reaches a source with no unknown nodes. Compute by graph traversal in the catalog API.</li><li><b>Column-level coverage</b>: share of columns in tier-1 tables with at least one column-lineage edge (or explicitly marked as a source).</li><li><b>Freshness / accuracy</b>: share of jobs that emitted a runtime lineage event in the last 7 days, compared with jobs in the orchestrator; or the number of static edges contradicted by runtime events.</li></ul>" }
],
quiz: [
  { id: "w7q1", type: "mc", q: "Root-cause analysis walks the lineage graph:", options: ["Downstream", "Upstream", "Sideways", "It does not use lineage"], answer: 1, why: "From the bad output back to its sources. Impact analysis goes downstream." },
  { id: "w7q2", type: "mc", q: "Under GDPR, SHA256(email) is:", options: ["Anonymous data", "Pseudonymised data, still personal data", "Not data", "Always aggregated"], answer: 1, why: "Hashing is pseudonymisation; the data can still be linked to a person." },
  { id: "w7q3", type: "mc", q: "What granularity of lineage does the ECB’s 2024 guide expect for critical data elements?", options: ["System level", "Application level", "Attribute (data element) level", "None specified"], answer: 2, why: "System-level lineage is explicitly not enough." },
  { id: "w7q4", type: "mc", q: "BCBS 239 principles 3–6 cover:", options: ["Risk reporting", "Supervisory review", "Risk data aggregation capabilities", "IT security"], answer: 2, why: "Accuracy and integrity, completeness, timeliness, adaptability." },
  { id: "w7q5", type: "mc", q: "Which AI Act article covers data governance for high-risk AI training data?", options: ["Article 5", "Article 10", "Article 30", "Article 52"], answer: 1, why: "Article 10, including the origin of data and preparation operations. (Article 30 is the GDPR record of processing.)" },
  { id: "w7q6", type: "mc", q: "All runs show COMPLETE but a KPI is wrong. Which lineage information helps most?", options: ["Job owners only", "Run-level metadata such as row counts and quality results per dataset", "Table names", "The DAG schedule"], answer: 1, why: "Success status is not correctness; output statistics and quality facets show where data went wrong." },
  { id: "w7q7", type: "mc", q: "Automatically propagating PII tags is an application of which week 4 idea?", options: ["Minimal witnesses", "Annotation propagation (where-provenance)", "Semiring recursion", "View deletion"], answer: 1, why: "Tags are annotations flowing along column lineage." },
  { id: "w7q8", type: "mc", q: "Review (week 6): which facet would carry a failed run’s stack trace?", options: ["schema", "errorMessage", "parent", "outputStatistics"], answer: 1, why: "errorMessage is a run facet with message, language and stack trace." },
  { id: "w7q9", type: "sa", q: "Explain why “lineage assembled ad hoc when the auditor asks” fails the ECB expectations, and what to do instead.", a: "Ad hoc lineage is out of date the moment pipelines change and cannot show it was true at the time a figure was reported. Lineage should be captured continuously and automatically (runtime events and parsing on deployment), with manual steps documented and reviewed, so it is current and versioned." },
  { id: "w7q10", type: "sa", q: "Give two limits of lineage when handling a GDPR erasure request.", a: "It cannot see copies made outside instrumented systems (downloads, emails, spreadsheets), and it does not handle backups and snapshots or knowledge already learned by trained models; those need retention and retraining policies." }
],
cards: [
  { id: "w7c1", f: "Impact analysis vs root cause: direction", b: "Impact: downstream from a change. Root cause: upstream from a bad output." },
  { id: "w7c2", f: "Why column lineage sharpens impact analysis", b: "It flags only assets that use the changed column, not everything downstream of the table." },
  { id: "w7c3", f: "PII tag through SHA256(email)", b: "Still personal data (pseudonymised) under GDPR: keep propagating." },
  { id: "w7c4", f: "BCBS 239: date and scope", b: "Basel Committee, January 2013; 14 principles for risk data aggregation and risk reporting at large banks." },
  { id: "w7c5", f: "BCBS 239 principle groups", b: "Governance & infrastructure (1–2), aggregation capabilities (3–6), reporting (7–11), supervisory review (12–14)." },
  { id: "w7c6", f: "ECB RDARR guide (May 2024) on lineage", b: "End-to-end, attribute-level, up-to-date lineage for CDEs behind KRIs, including manual steps, controls and ownership." },
  { id: "w7c7", f: "GDPR Article 30", b: "Record of processing activities: purposes, data categories, recipients, transfers, retention, security." },
  { id: "w7c8", f: "AI Act Article 10 and provenance", b: "High-risk AI data governance must cover data collection, origin of data, and preparation operations (labelling, cleaning, enrichment, aggregation)." },
  { id: "w7c9", f: "Six dimensions of lineage quality", b: "Coverage, granularity, accuracy, freshness, stitching across systems, ownership." },
  { id: "w7c10", f: "“All runs COMPLETE but the number is wrong”: what to check", b: "Run-level output statistics and data quality results along the upstream path." }
]
});

W.push({
id: "w8", num: 8,
title: "Capstone: a pipeline with full lineage",
focus: "Put everything together: build a small pipeline, capture its lineage at run, column and row level, then use it to answer provenance, impact and root-cause questions.",
goal: "By the end of the week you have a working pipeline that emits OpenLineage events to Marquez, carries row-level how-provenance, and a one-page write-up explaining what each kind of lineage told you.",
plan: [
  ["Cumulative pre-test (from memory, all weeks)", 15],
  ["Milestones 1–2: run the pipeline, answer provenance questions", 70],
  ["Milestone 3: add column lineage", 50],
  ["Milestones 4–5: impact and root-cause exercises", 60],
  ["Milestone 6: one-page write-up", 45],
  ["Final cumulative quiz and flashcard reviews", 60]
],
reading: [
  { what: "No new reading", where: "Review your notes from weeks 2–6", mins: 0, note: "Use the Review tab daily this week: the deck now contains every card from the course." },
  { what: "Optional: Glavic, “Data Provenance: Origins, Applications, Algorithms, and Models” (2021)", where: "Free author PDF, chapters on capture and storage", mins: 0, note: "If the capstone made you curious about how real provenance systems store and query annotations.", url: "https://www.cs.uic.edu/~bglavic/dbgroup/assets/pdfpubls/G21.pdf" },
  { what: "Optional: ProvSQL", where: "pgxn.org/dist/provsql", mins: 0, note: "Repeat milestone 2 in PostgreSQL with real semiring provenance instead of strings.", url: "https://pgxn.org/dist/provsql/" }
],
pretest: [
  "Without notes: draw the relationship between lineage, why-, how- and where-provenance.",
  "Without notes: write the skeleton of an OpenLineage RunEvent.",
  "Without notes: list three ways to capture lineage and when each fails."
],
notes: `
<h3>The project</h3>
<p>You will build a three-step pipeline in DuckDB and Python: raw orders, customers and FX rates are staged and converted to EUR, then aggregated into revenue by country. The starter script below already does three things:</p>
<ul>
<li><b>Eager row-level provenance.</b> Every raw row has a provenance id (<code>o1</code>, <code>c1</code>, <code>f1</code> …). Each step carries a <code>prov</code> or <code>how_prov</code> column built like week 3: joins multiply (<code>*</code>), aggregation sums (<code>+</code>).</li>
<li><b>Runtime lineage.</b> Each step emits OpenLineage START and COMPLETE events with the SQL, the output schema and row counts.</li>
<li><b>Key preservation.</b> The staging table keeps <code>order_id</code> and <code>customer_id</code>, so reverse queries stay simple (week 2).</li>
</ul>
<p>Your job is to extend it, use it, and explain it. Requirements: Python 3.10+, <code>pip install duckdb requests sqlglot</code>, and Marquez from week 6 (the script prints the events instead if Marquez is not running).</p>
<p>Expected mart output: <code>('FI', 240.00, 'o1*f1*c1 + o3*f1*c3 + o5*f1*c3')</code> and <code>('SE', 78.30, 'o2*f2*c2')</code>.</p>
<h3>Starter script: pipeline.py</h3>
<p>The same file is saved in the project folder as <code>course/capstone/pipeline.py</code>.</p>
<pre class="code">"""Capstone starter: a 3-step pipeline with eager row-level provenance and OpenLineage events."""
import uuid, datetime, json, duckdb, requests

MARQUEZ = "http://localhost:5000/api/v1/lineage"   # set to None to just print events
PRODUCER = "https://example.com/lineage-course/capstone"
NS_JOB, NS_DATA = "capstone", "duckdb://capstone.db"

con = duckdb.connect("capstone.db")

# ---- Step 0: raw data (each row gets a provenance id) ----
con.execute("""
CREATE OR REPLACE TABLE raw_customers AS SELECT * FROM (VALUES
  ('c1', 1, 'Aino',  'FI'), ('c2', 2, 'Lars', 'SE'), ('c3', 3, 'Mia', 'FI')
) t(pid, customer_id, name, country);
CREATE OR REPLACE TABLE raw_orders AS SELECT * FROM (VALUES
  ('o1', 101, 1, 120.0, 'EUR', 'paid'), ('o2', 102, 2, 900.0, 'SEK', 'paid'),
  ('o3', 103, 3,  80.0, 'EUR', 'paid'), ('o4', 104, 1,  50.0, 'EUR', 'refunded'),
  ('o5', 105, 3,  40.0, 'EUR', 'paid')
) t(pid, order_id, customer_id, amount, currency, status);
CREATE OR REPLACE TABLE raw_fx AS SELECT * FROM (VALUES
  ('f1', 'EUR', 1.0), ('f2', 'SEK', 0.087)
) t(pid, currency, to_eur);
""")

# ---- Step 1: staging (keeps provenance ids: key-preserving) ----
STEP1 = """
CREATE OR REPLACE TABLE stg_orders_eur AS
SELECT o.order_id, o.customer_id, o.amount * f.to_eur AS amount_eur,
       o.pid || '*' || f.pid AS prov            -- join =&gt; product
FROM raw_orders o JOIN raw_fx f ON o.currency = f.currency
WHERE o.status = 'paid'"""

# ---- Step 2: mart (aggregation; projection merges =&gt; sum of monomials) ----
STEP2 = """
CREATE OR REPLACE TABLE mart_revenue_by_country AS
SELECT c.country, ROUND(SUM(s.amount_eur), 2) AS revenue_eur,
       STRING_AGG(s.prov || '*' || c.pid, ' + ' ORDER BY s.order_id) AS how_prov
FROM stg_orders_eur s JOIN raw_customers c ON s.customer_id = c.customer_id
GROUP BY c.country"""

def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def facet(name, version, body):
    return {**body, "_producer": PRODUCER,
            "_schemaURL": f"https://openlineage.io/spec/facets/{version}/{name}.json#/$defs/{name}"}

def schema_facet(table):
    cols = con.execute(f"DESCRIBE {table}").fetchall()
    return facet("SchemaDatasetFacet", "1-1-1",
                 {"fields": [{"name": c[0], "type": c[1]} for c in cols]})

def emit(job, run_id, event_type, inputs, outputs, sql=None):
    event = {"eventType": event_type, "eventTime": now(),
             "run": {"runId": run_id},
             "job": {"namespace": NS_JOB, "name": job,
                     **({"facets": {"sql": facet("SQLJobFacet", "1-0-1", {"query": sql})}} if sql else {})},
             "inputs": [{"namespace": NS_DATA, "name": t} for t in inputs],
             "outputs": outputs, "producer": PRODUCER,
             "schemaURL": "https://openlineage.io/spec/2-0-2/OpenLineage.json#/$defs/RunEvent"}
    if MARQUEZ:
        try:
            print(job, event_type, requests.post(MARQUEZ, json=event, timeout=5).status_code)
            return
        except requests.RequestException as e:
            print(f"(Marquez not reachable: {type(e).__name__}; printing instead)")
    print(json.dumps(event)[:200], "...")

def run_step(job, sql, inputs, output):
    run_id = str(uuid.uuid4())
    emit(job, run_id, "START", inputs, [], sql)
    con.execute(sql)
    rows = con.execute(f"SELECT COUNT(*) FROM {output}").fetchone()[0]
    out = {"namespace": NS_DATA, "name": output,
           "facets": {"schema": schema_facet(output)},          # TODO: add columnLineage
           "outputFacets": {"outputStatistics": facet("OutputStatisticsOutputDatasetFacet", "1-0-2", {"rowCount": rows})}}
    emit(job, run_id, "COMPLETE", inputs, [out], sql)

run_step("stage_orders", STEP1, ["raw_orders", "raw_fx"], "stg_orders_eur")
run_step("build_mart", STEP2, ["stg_orders_eur", "raw_customers"], "mart_revenue_by_country")
for row in con.execute("SELECT * FROM mart_revenue_by_country ORDER BY country").fetchall():
    print(row)
</pre>
<p class="aside">Facet version numbers in the script (for example 1-0-1) are illustrative. Marquez accepts them; a stricter consumer may want the current versions listed on openlineage.io.</p>

<h3>Milestones</h3>
<ol>
<li><b>Run it.</b> Start Marquez, run the script, and find both jobs, all datasets and the two runs in the UI.</li>
<li><b>Provenance by hand and by machine.</b> Answer the practice questions on the FI row.</li>
<li><b>Column lineage.</b> Add a <code>columnLineage</code> facet to both outputs, by hand first, then generated with SQLGlot (stretch).</li>
<li><b>Impact analysis.</b> Use the graph to plan a column rename.</li>
<li><b>Root cause.</b> Break the FX data, predict the effect from the provenance polynomials, then verify.</li>
<li><b>Write-up.</b> One page: what you captured, eager vs lazy choices, what each kind of lineage answered, and remaining gaps.</li>
</ol>
`,
recall: [
  { id: "w8r1", q: "Explain, in five sentences, how the four theoretical provenance models relate to what OpenLineage and column-lineage tools capture.", a: "Table-level lineage is coarse lineage between datasets. Column-level identity lineage is where-provenance at schema level; indirect column lineage covers the filter and join inputs that why-provenance includes. Row-level provenance (why/how) is rarely captured by platform tools but can be added eagerly by carrying ids or polynomials. How-provenance is the most general, giving why-provenance and lineage by homomorphisms, while where-provenance must be tracked separately. OpenLineage runs add the activity side (who/when/which version), as in W3C PROV." },
  { id: "w8r2", q: "When would you choose eager row-level provenance in a real pipeline, and what does it cost?", a: "When sources are ephemeral, when fast drill-down to source rows is needed, or for regulated figures that must be traceable. It costs extra columns and storage, longer runtimes, and code changes in each transformation." },
  { id: "w8r3", q: "Describe the full journey from a dashboard number back to source rows using everything in the course.", a: "Dashboard → catalog/column lineage to the mart column → the run that produced the current version (OpenLineage run, inputs and their versions) → reverse query on key-preserving models or stored provenance ids → source rows, with why-provenance showing which combinations justify the row and how-provenance how they were combined." },
  { id: "w8r4", q: "Name the three founding problems from Buneman et al. and where each showed up in weeks 5–8.", a: "Query inversion: reverse queries and row-level provenance in the capstone. Data citation: dataset naming and identity in OpenLineage and catalogs. Archiving: dataset versions, snapshots and reproducibility, AI Act training-data provenance." }
],
practice: [
  { id: "w8p1", title: "Milestone 2: provenance of the FI row", task: "<p>For the output row (FI, 240.00): (a) write its how-provenance; (b) derive its why-provenance and lineage; (c) give the where-provenance of each cell; (d) the polynomial tells you which combinations make the <i>row</i> exist. What extra fact is needed to explain the <i>value</i> 240.00, and which week’s idea does that match?</p>", solution: "<p>(a) o1·f1·c1 + o3·f1·c3 + o5·f1·c3.</p><p>(b) Why: {{o1,f1,c1}, {o3,f1,c3}, {o5,f1,c3}}. Lineage: {o1, o3, o5, f1, c1, c3}.</p><p>(c) country “FI”: copied from (raw_customers, c1, country) and (raw_customers, c3, country). revenue_eur: computed by SUM, so empty where-provenance. how_prov: constructed by the query.</p><p>(d) Any one monomial makes the FI row exist, but the value 240 depends on <i>all</i> of them (120 + 80 + 40, each times rate 1.0). Aggregation needs the whole group: Cui and Widom’s aggregation rule (week 2) and the general point that aggregation breaks the nice properties (week 1). Note also that o4 (refunded) is absent: the filter on status is indirect lineage.</p>" },
  { id: "w8p2", title: "Milestone 2b: reverse query", task: "<p>Write the reverse queries that trace (SE, 78.30) back to raw rows, using the key-preserving staging table. Then do the same using only the <code>how_prov</code> column. Which approach would still work if raw_orders were truncated after the run?</p>", solution: "<pre class=\"code\">-- via keys\nSELECT s.*, c.* FROM stg_orders_eur s\nJOIN raw_customers c USING (customer_id)\nWHERE c.country = 'SE';\nSELECT * FROM raw_orders WHERE order_id IN (SELECT order_id FROM stg_orders_eur s JOIN raw_customers c USING (customer_id) WHERE c.country = 'SE');\n\n-- via stored provenance\nSELECT how_prov FROM mart_revenue_by_country WHERE country = 'SE';  -- o2*f2*c2</pre><p>Only the stored provenance survives truncation of the sources: that is the eager approach’s advantage from week 4. The key-based reverse query is lazy and needs the sources.</p>" },
  { id: "w8p3", title: "Milestone 3: column lineage facets", task: "<p>Add a <code>columnLineage</code> facet to <code>stg_orders_eur</code> and <code>mart_revenue_by_country</code> in <code>run_step</code>. Do it by hand first. Stretch goal: generate it with SQLGlot by calling <code>lineage(column, sql, schema)</code> for each output column (pass the DuckDB schemas as the schema dict) and converting the leaf nodes into inputFields.</p>", solution: "<p>By hand, for stg_orders_eur: order_id ← raw_orders.order_id (DIRECT IDENTITY); customer_id ← raw_orders.customer_id (DIRECT IDENTITY); amount_eur ← raw_orders.amount, raw_fx.to_eur (DIRECT TRANSFORMATION); all ← raw_orders.currency, raw_fx.currency (INDIRECT JOIN), raw_orders.status (INDIRECT FILTER).</p><p>For the mart: country ← raw_customers.country (DIRECT IDENTITY, INDIRECT GROUP_BY); revenue_eur ← stg_orders_eur.amount_eur (DIRECT AGGREGATION); all ← stg_orders_eur.customer_id, raw_customers.customer_id (INDIRECT JOIN).</p><p>For the SQLGlot version, strip the <code>CREATE OR REPLACE TABLE … AS</code> prefix before parsing, build the schema dict from <code>DESCRIBE</code>, and map each leaf node (whose <code>source</code> is a table) to <code>{namespace, name, field}</code>. You will find SQLGlot reports the DIRECT edges; INDIRECT ones need extra code that walks JOIN, WHERE and GROUP BY expressions.</p>" },
  { id: "w8p4", title: "Milestone 4: impact analysis", task: "<p>The source team wants to rename <code>raw_orders.amount</code> to <code>gross_amount</code>. Using your column lineage (in Marquez or from your facets), list every column that breaks, every column that does not, and the change you would make.</p>", solution: "<p>Breaks: stg_orders_eur.amount_eur (direct), and through it mart_revenue_by_country.revenue_eur. Does not break: order_id, customer_id, country, and how_prov/prov (built from pid). Fix: change STEP1 to <code>o.gross_amount * f.to_eur</code> (or alias it back to amount in a source view), deploy together with the source change, and verify the mart values are unchanged.</p>" },
  { id: "w8p5", title: "Milestone 5: predict, then break", task: "<p>Before running anything, use the polynomials to predict what happens to the mart if (a) the SEK row f2 is deleted from raw_fx, (b) customer c1 is deleted, (c) order o4’s status changes to 'paid'. Then make each change in the script, rerun, and compare. Finally, which OpenLineage information would have alerted you to case (a) in production?</p>", solution: "<p>(a) Set f2 = 0: SE’s polynomial o2·f2·c2 becomes 0, so the SE row disappears (inner join drops SEK orders). FI is unchanged. (b) Set c1 = 0: FI becomes o3·f1·c3 + o5·f1·c3, the row survives, revenue drops to 120.00 (80 + 40). (c) Not predictable from the polynomial: o4 was filtered out, so it has no variable in the output. Filters are indirect lineage, invisible to how-provenance of existing rows. FI would become o1·f1·c1 + o3·f1·c3 + o4·f1·c1 + o5·f1·c3 with revenue 290.00.</p><p>Production alert for (a): the outputStatistics rowCount of mart_revenue_by_country dropping from 2 to 1 (and stg_orders_eur from 4 to 3), ideally checked by a data quality assertion that fails the run.</p>" },
  { id: "w8p6", title: "Milestone 6: the write-up", task: "<p>Write one page (in your own notes) covering: (1) the pipeline in W3C PROV terms; (2) which lineage you captured eagerly and which lazily, and why; (3) one question each kind of lineage (table, column, row, run) answered in this project; (4) what is still invisible, and how you would close each gap at work.</p>", solution: "<p>A strong write-up includes: entities (raw tables, staging, mart, each at a version), activities (the two runs), agent (you or a service account); eager row provenance (prov columns) and eager runtime events, lazy reverse queries via keys; table lineage → which inputs a step reads, column lineage → rename impact, row lineage → which orders make up FI revenue, run lineage → row-count drop after FX deletion. Gaps: indirect effects like o4’s filter, value-level explanation of aggregates, data that leaves the pipeline (exports), manual steps, and dataset versions (add a version facet or table snapshots).</p>" }
],
quiz: [
  { id: "w8q1", type: "mc", q: "Under Q1 (week 2), which is the why-provenance of (BayTours, 415-1200)?", options: ["{t₁, t₅, t₆}", "{{t₁, t₅}, {t₁, t₆}}", "t₁·(t₅ + t₆) only", "{{t₁}}"], answer: 1, why: "The lineage is {t₁, t₅, t₆}; the polynomial t₁·t₅ + t₁·t₆ is the how-provenance." },
  { id: "w8q2", type: "mc", q: "Which model can be derived from how-provenance by a homomorphism?", options: ["Where-provenance", "Why-provenance", "Neither", "Only lineage of aggregates"], answer: 1, why: "Lineage, why and minimal why are semiring instances; where-provenance is not." },
  { id: "w8q3", type: "mc", q: "In the capstone, SE’s provenance is o2·f2·c2. Deleting f2 will:", options: ["Halve SE revenue", "Remove the SE row", "Not change anything", "Change FI"], answer: 1, why: "Setting f2 = 0 makes the polynomial 0." },
  { id: "w8q4", type: "mc", q: "Why can’t the capstone polynomials predict the effect of changing o4’s status to 'paid'?", options: ["DuckDB bug", "o4 was removed by a filter, so it has no variable in any output polynomial", "Polynomials ignore joins", "Because o4 is EUR"], answer: 1, why: "Provenance describes existing outputs; filters are indirect lineage." },
  { id: "w8q5", type: "mc", q: "The revenue_eur cell has which where-provenance?", options: ["raw_orders.amount", "raw_fx.to_eur", "Empty, because it is computed", "All raw columns"], answer: 2, why: "Where-provenance only covers copied values." },
  { id: "w8q6", type: "mc", q: "WHIPS (week 2) and parsing a query log (week 5) are both examples of:", options: ["Eager provenance", "Lazy provenance", "Manual lineage", "Annotation propagation"], answer: 1, why: "Both reconstruct lineage on demand without changing the running system." },
  { id: "w8q7", type: "mc", q: "Which OpenLineage element identifies the stable process across executions?", options: ["runId", "Job namespace + name", "eventTime", "producer"], answer: 1, why: "Runs change each execution; the job stays the same." },
  { id: "w8q8", type: "mc", q: "The ECB guide rejects which of these as insufficient?", options: ["Attribute-level lineage", "System-level lineage", "Automated lineage", "Documented manual steps"], answer: 1, why: "It expects attribute-level, end-to-end lineage." },
  { id: "w8q9", type: "mc", q: "Buneman et al.’s “query inversion” corresponds most closely to which practical feature?", options: ["Dataset URNs", "A “show source rows” drill-down", "Snapshots", "Ownership fields"], answer: 1, why: "Finding the input tuples behind an output tuple." },
  { id: "w8q10", type: "mc", q: "Which pair is correct?", options: ["Trio: lazy", "DBNotes: eager", "SPIDER: eager", "ORCHESTRA: lazy"], answer: 1, why: "Trio, ORCHESTRA and DBNotes are eager; WHIPS and SPIDER are lazy." },
  { id: "w8q11", type: "sa", q: "In one paragraph, explain to a new colleague why theoretical provenance research is useful for a data engineer.", a: "It gives precise answers to questions tools blur: what “depends on” means (copied vs used to decide), why rewriting a query can change its lineage, why aggregates and filters are hard, when to record lineage eagerly or reconstruct it lazily, and why per-operator calculations (like Trio’s confidences) go wrong. That vocabulary helps design pipelines that stay traceable and judge what a lineage tool can and cannot tell you." },
  { id: "w8q12", type: "sa", q: "What would you add to the capstone to make it reproducible for an auditor a year from now?", a: "Record dataset versions (table snapshots or a version facet on each input and output), the code version (sourceCodeLocation facet with commit), parameters and nominal time, keep event history and snapshots under a retention policy, and store the provenance columns or reverse-query keys with the mart." }
],
cards: [
  { id: "w8c1", f: "One-line map: theory → tools", b: "Table lineage = coarse lineage; column identity = where; indirect column = why’s filter/join part; row ids/polynomials = why/how; runs = PROV activities." },
  { id: "w8c2", f: "Capstone FI how-provenance", b: "o1·f1·c1 + o3·f1·c3 + o5·f1·c3" },
  { id: "w8c3", f: "Predicting deletions from polynomials", b: "Set the variable to 0: rows whose polynomial becomes 0 disappear; others survive (values of aggregates may still change)." },
  { id: "w8c4", f: "What polynomials can’t predict", b: "Effects of rows currently filtered out (indirect lineage) and exact aggregate values." },
  { id: "w8c5", f: "Reproducibility checklist", b: "Dataset versions, code commit, parameters/nominal time, retained events and snapshots, stored provenance or keys." }
]
});

// ---------- helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fill = s => String(s ?? "").replaceAll("{{TRAVEL}}", TRAVEL_DB).replaceAll("{{Q1}}", Q1_SQL).replaceAll("{{W7_GRAPH}}", typeof W7_GRAPH !== "undefined" ? W7_GRAPH : "");
const DAY = 864e5;
function order(n, seed) {            // stable shuffle so the right option is not always in the same place
  let h = 2166136261; for (const ch of seed) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const STEPS = [
  ["pretest", "Pre-test", "Guess before you read. Wrong guesses make the reading stick better.", true],
  ["read", "Read", "The assigned sections, with a purpose for each.", false],
  ["notes", "Study notes", "Read after the sources. Then close them and move on to recall.", false],
  ["recall", "Close-the-book recall", "Write each answer from memory first, then reveal and rate yourself.", true],
  ["practice", "Practice", "Work the problem on paper or in code before opening the solution.", true],
  ["quiz", "Quiz", "Answer from memory. Includes review questions from earlier weeks.", true],
  ["cards", "Flashcards", "Add this week’s cards to your deck and review them a little each day.", true]
];
const STEP_COLORS = ["var(--mark)", "var(--accent)", "color-mix(in srgb, var(--accent) 55%, var(--surface))", "color-mix(in srgb, var(--mark) 60%, var(--surface))", "var(--ink)", "color-mix(in srgb, var(--ink) 45%, var(--surface))", "var(--line)"];
const ALL_CARDS = W.flatMap(w => w.cards.map(c => ({ ...c, wk: w.id, num: w.num })));

// ---------- state ----------
const LS_KEY = "dl-course-v1";
let S = blank();
function blank() { return { v: 1, updatedAt: 0, steps: {}, reads: {}, reveal: {}, rate: {}, quiz: {}, cards: {}, decks: {} }; }
let T = { updatedAt: 0, text: {} };        // free-text answers kept in a separate document
let store = { db: null, uid: null, mode: "local" };
function lsGet() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch { return null; } }
function lsSet() { try { localStorage.setItem(LS_KEY, JSON.stringify({ S, T })); } catch {} }
(function loadLocal() { const d = lsGet(); if (d && d.S) { S = { ...blank(), ...d.S }; T = d.T || T; } })();

let saveTimer = null, dirtyS = false, dirtyT = false;
function touch(which = "S") {
  const now = Date.now();
  if (which === "T") { T.updatedAt = now; dirtyT = true; } else { S.updatedAt = now; dirtyS = true; }
  lsSet();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 1200);
}
async function flush() {
  if (!store.db || !store.uid) return;
  const base = "data/users/" + store.uid;
  try {
    if (dirtyS) { dirtyS = false; await store.db.doc(base + "/progress").set(JSON.parse(JSON.stringify(S))); }
    if (dirtyT) { dirtyT = false; await store.db.doc(base + "/answers").set(JSON.parse(JSON.stringify(T))); }
    setStatus("account");
  } catch (e) { setStatus("local", e && e.code); }
}
function setStatus(mode) {
  store.mode = mode;
  const el = $("#status");
  if (el) el.textContent = mode === "account" ? "Progress saves to your account." : "Progress saves in this browser only.";
}
async function connectDb() {
  try {
    if (!window.claude || !window.claude.use) return;
    const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
    if (!db || !user) return;
    const uid = await user.id();
    if (!uid) return;
    store.db = db; store.uid = uid;
    const base = "data/users/" + uid;
    const [ps, as] = await Promise.all([db.doc(base + "/progress").get(), db.doc(base + "/answers").get()]);
    let changed = false;
    if (ps.exists && (ps.data().updatedAt || 0) > (S.updatedAt || 0)) { S = { ...blank(), ...ps.data() }; changed = true; }
    else if (S.updatedAt) dirtyS = true;
    if (as.exists && (as.data().updatedAt || 0) > (T.updatedAt || 0)) { T = { updatedAt: 0, text: {}, ...as.data() }; changed = true; }
    else if (T.updatedAt) dirtyT = true;
    lsSet();
    setStatus("account");
    if (dirtyS || dirtyT) flush();
    if (changed) render();
  } catch (e) { setStatus("local"); }
}

// ---------- progress ----------
function stepDone(w, k) { return !!S.steps[w.id + ":" + k]; }
function weekPct(w) { return STEPS.filter(([k]) => stepDone(w, k)).length / STEPS.length; }
function autoSteps(w) {
  const set = (k, v) => { const key = w.id + ":" + k; if (v && !S.steps[key]) { S.steps[key] = true; return true; } return false; };
  let ch = false;
  ch = set("read", w.reading.every((_, i) => S.reads[w.id + ":" + i])) || ch;
  ch = set("recall", w.recall.every(r => S.rate[r.id])) || ch;
  ch = set("practice", w.practice.every(p => S.reveal[p.id])) || ch;
  const qz = S.quiz[w.id];
  ch = set("quiz", !!(qz && qz.attempts > 0)) || ch;
  ch = set("cards", !!S.decks[w.id]) || ch;
  ch = set("pretest", w.pretest.every((_, i) => (T.text[w.id + ":pre" + i] || "").trim())) || ch;
  return ch;
}

// ---------- spaced repetition ----------
function dueCards(now = Date.now()) {
  const active = ALL_CARDS.filter(c => S.decks[c.wk]);
  const due = active.filter(c => S.cards[c.id] && S.cards[c.id].due <= now).sort((a, b) => S.cards[a.id].due - S.cards[b.id].due);
  const fresh = active.filter(c => !S.cards[c.id]);
  return { due, fresh, active };
}
function schedule(id, grade) {
  const now = Date.now();
  const c = { ease: 2.5, ivl: 0, reps: 0, lapses: 0, ...(S.cards[id] || {}) };
  if (grade === "again") { c.reps = 0; c.lapses++; c.ease = Math.max(1.3, c.ease - 0.2); c.ivl = 0; c.due = now + 10 * 60e3; }
  else {
    if (grade === "hard") { c.ivl = c.reps === 0 ? 1 : Math.max(1, Math.round(c.ivl * 1.2)); c.ease = Math.max(1.3, c.ease - 0.15); }
    if (grade === "good") { c.ivl = c.reps === 0 ? 1 : c.reps === 1 ? 3 : Math.round(c.ivl * c.ease); }
    if (grade === "easy") { c.ivl = c.reps === 0 ? 3 : Math.round(Math.max(c.ivl, 1) * c.ease * 1.3); c.ease += 0.15; }
    c.reps++; c.due = now + c.ivl * DAY - 3600e3;
  }
  S.cards[id] = c;
  touch();
}
function preview(id, grade) {
  const c = { ease: 2.5, ivl: 0, reps: 0, ...(S.cards[id] || {}) };
  if (grade === "again") return "10 min";
  let ivl = grade === "hard" ? (c.reps === 0 ? 1 : Math.max(1, Math.round(c.ivl * 1.2)))
    : grade === "good" ? (c.reps === 0 ? 1 : c.reps === 1 ? 3 : Math.round(c.ivl * c.ease))
    : (c.reps === 0 ? 3 : Math.round(Math.max(c.ivl, 1) * c.ease * 1.3));
  return ivl + (ivl === 1 ? " day" : " days");
}

// ---------- routing ----------
let view = "today";
function route() {
  const h = (location.hash || "").slice(1);
  view = (h === "review" || h === "method" || h === "today" || W.some(w => w.id === h)) ? h : "today";
}
function go(v) { view = v; try { history.replaceState(null, "", "#" + v); } catch {} render(); window.scrollTo({ top: 0 }); }

// ---------- chrome ----------
function dagSvg() {
  const n = W.length, w = 400, h = 34, pad = 14, step = (w - pad * 2) / (n - 1);
  let s = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Course progress across ${n} weeks">`;
  s += `<line x1="${pad}" y1="17" x2="${w - pad}" y2="17" stroke="var(--line)" stroke-width="2"/>`;
  W.forEach((wk, i) => {
    const x = pad + i * step, p = weekPct(wk), cur = view === wk.id;
    const r = 9, circ = 2 * Math.PI * r;
    s += `<g style="cursor:pointer" data-go="${wk.id}"><title>Week ${wk.num}: ${esc(wk.title)} (${Math.round(p * 100)}%)</title>`;
    s += `<circle cx="${x}" cy="17" r="${r}" fill="${p === 1 ? "var(--accent)" : "var(--surface)"}" stroke="${cur ? "var(--ink)" : "var(--line)"}" stroke-width="${cur ? 2 : 1.5}"/>`;
    if (p > 0 && p < 1) s += `<circle cx="${x}" cy="17" r="${r}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="${circ * p} ${circ}" transform="rotate(-90 ${x} 17)"/>`;
    s += `<text x="${x}" y="21" text-anchor="middle" font-family="var(--f-mono)" font-size="10" fill="${p === 1 ? "var(--accent-ink)" : "var(--muted)"}">${wk.num}</text></g>`;
  });
  return s + "</svg>";
}
function chrome() {
  const { due, fresh } = dueCards();
  const nDue = due.length + Math.min(fresh.length, 20);
  $("#dag").innerHTML = dagSvg();
  $("#tabs").innerHTML = [["today", "Today"], [currentWeek().id, "Weeks"], ["review", "Review"], ["method", "Method"]].map(([v, l], i) => {
    const cur = i === 1 ? W.some(w => w.id === view) : view === v;
    return `<button class="tab" data-go="${v}" ${cur ? 'aria-current="page"' : ""}>${l}${v === "review" && nDue ? `<span class="n tabular">${nDue}</span>` : ""}</button>`;
  }).join("");
  const wkBtns = W.map(w => `<button class="wk" data-go="${w.id}" ${view === w.id ? 'aria-current="page"' : ""}><span class="num">W${w.num}</span><span class="t">${esc(w.title)}</span><span class="bar"><i style="width:${Math.round(weekPct(w) * 100)}%"></i></span></button>`).join("");
  $("#rail").innerHTML = `<h4>Weeks</h4>${wkBtns}<div class="status" id="status"></div>`;
  setStatus(store.mode);
  $("#mweeks").innerHTML = W.some(w => w.id === view) ? W.map(w => `<button class="chip" data-go="${w.id}" ${view === w.id ? 'aria-current="page"' : ""}>W${w.num} · ${Math.round(weekPct(w) * 100)}%</button>`).join("") : "";
}
function currentWeek() { return W.find(w => weekPct(w) < 1) || W[W.length - 1]; }

// ---------- views ----------
function render() {
  W.forEach(w => { if (autoSteps(w)) touch(); });
  chrome();
  const m = $("#main");
  if (view === "today") m.innerHTML = vToday();
  else if (view === "review") m.innerHTML = vReview();
  else if (view === "method") m.innerHTML = vMethod();
  else m.innerHTML = vWeek(W.find(w => w.id === view));
}

function vToday() {
  const w = currentWeek();
  const next = STEPS.find(([k]) => !stepDone(w, k));
  const { due, fresh, active } = dueCards();
  const learned = active.filter(c => S.cards[c.id] && S.cards[c.id].reps > 0).length;
  const doneWeeks = W.filter(x => weekPct(x) === 1).length;
  const mins = w.plan.reduce((a, p) => a + p[1], 0);
  return `
  <div class="eyebrow">Today</div>
  <h1>${next ? `Week ${w.num}: ${esc(next[1].toLowerCase())} next` : `Week ${w.num} is complete`}</h1>
  <p class="lede">${esc(w.focus)}</p>
  <div class="row" style="margin-top:16px">
    <button class="btn primary" data-go="${w.id}">Open week ${w.num}</button>
    <button class="btn mark" data-go="review">Review ${due.length + Math.min(fresh.length, 20)} card${due.length + Math.min(fresh.length, 20) === 1 ? "" : "s"}</button>
  </div>
  <div class="stats">
    <div class="stat"><b>${doneWeeks}/${W.length}</b><span>weeks complete</span></div>
    <div class="stat"><b>${Math.round(weekPct(w) * 100)}%</b><span>of week ${w.num} done</span></div>
    <div class="stat"><b>${due.length}</b><span>cards due now</span></div>
    <div class="stat"><b>${learned}/${ALL_CARDS.length}</b><span>cards learned</span></div>
  </div>
  <div class="cards2">
    <div class="panel"><h3>This week’s plan (${Math.round(mins / 6) / 10} h)</h3>${w.plan.map(p => `<p class="tabular">${esc(p[0])}${p[1] ? ` · ${p[1]} min` : ""}</p>`).join("")}</div>
    <div class="panel"><h3>How to spread 5 hours</h3><p>Two longer sessions (reading, then recall and practice) of about 90 minutes.</p><p>One 45–60 minute session for the quiz.</p><p>Ten minutes of flashcards on four or five days. Short, spaced sessions beat one long one.</p></div>
    <div class="panel"><h3>Your sources</h3><p>Two PDFs in your Datalineage folder: Buneman, Khanna &amp; Tan (k51.pdf) and Cheney, Chiticariu &amp; Tan.</p><p>Extra material: the <a href="https://claude.ai/artifact/NpqJy5QGwzxV82UasnuKtP" target="_blank" rel="noopener">reading list</a>, linked from each week.</p></div>
  </div>`;
}

function stepShell(w, idx, body, extraHead = "") {
  const [k, label, why, isRecall] = STEPS[idx];
  const done = stepDone(w, k);
  return `<section class="step ${done ? "done" : ""}" id="step-${k}">
    <div class="step-h"><span class="step-n">${done ? "✓" : idx + 1}</span><h2>${label}</h2>${isRecall ? '<span class="recall-tag">Active recall</span>' : ""}${extraHead}
      <button class="donebtn" data-act="step" data-w="${w.id}" data-k="${k}">${done ? "Done" : "Mark done"}</button>
      <p class="why">${why}</p></div>
    <div class="step-b">${body}</div></section>`;
}

function vWeek(w) {
  const total = w.plan.reduce((a, p) => a + p[1], 0);
  const budget = `<div class="budget"><div class="budget-bar">${w.plan.map((p, i) => `<span style="width:${(p[1] / total) * 100}%;background:${STEP_COLORS[i % STEP_COLORS.length]}"></span>`).join("")}</div>
    <div class="budget-legend tabular">${w.plan.map((p, i) => `<span><i style="background:${STEP_COLORS[i % STEP_COLORS.length]}"></i>${esc(p[0])}${p[1] ? ` · ${p[1]} min` : " · extra"}</span>`).join("")}</div></div>`;

  const pre = `<div class="items">${w.pretest.map((q, i) => `<div class="item"><p class="q">${esc(q)}</p><textarea id="t-${w.id}-pre${i}" data-text="${w.id}:pre${i}" placeholder="Your best guess, in a sentence or two">${esc(T.text[w.id + ":pre" + i] || "")}</textarea></div>`).join("")}</div>`;

  const read = `<ul class="reads">${w.reading.map((r, i) => `<li><input type="checkbox" id="rd-${w.id}-${i}" data-act="read" data-key="${w.id}:${i}" ${S.reads[w.id + ":" + i] ? "checked" : ""}>
    <label for="rd-${w.id}-${i}"><div class="w">${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.what)}</a>` : esc(r.what)}</div><div class="where">${esc(r.where)}</div><div class="note">${esc(r.note)}</div></label>
    <span class="m">${r.mins ? r.mins + " min" : "extra"}</span></li>`).join("")}</ul>`;

  const notesOpen = !S.reveal[w.id + ":notesClosed"];
  const notes = `<div class="${notesOpen ? "" : "collapsed"}"><div class="notes">${fill(w.notes)}</div>
    <div class="closebook">${notesOpen ? `<button class="btn mark" data-act="closebook" data-w="${w.id}">Close the notes and start recall</button><span>Hides the notes so you answer from memory.</span>` : `<button class="btn" data-act="openbook" data-w="${w.id}">Show the notes again</button><span>Notes are hidden while you recall.</span>`}</div></div>`;

  const recall = `<div class="items">${w.recall.map(r => {
    const shown = S.reveal[r.id], rt = S.rate[r.id];
    return `<div class="item ${rt ? "rated-" + rt : ""}"><p class="q">${esc(r.q)}</p>
      <textarea id="t-${r.id}" data-text="${r.id}" placeholder="Write it from memory first">${esc(T.text[r.id] || "")}</textarea>
      ${shown ? `<div class="answer">${esc(r.a)}</div>
        <div class="row"><span class="rate">How did you do?</span>${[["got", "Got it"], ["partial", "Partly"], ["miss", "Missed it"]].map(([v, l]) => `<button class="btn ${rt === v ? "sel" : ""}" data-act="rate" data-id="${r.id}" data-v="${v}">${l}</button>`).join("")}</div>`
        : `<div class="row"><button class="btn primary" data-act="reveal" data-id="${r.id}">Reveal model answer</button></div>`}</div>`;
  }).join("")}</div>`;

  const practice = `<div class="items">${w.practice.map(p => `<div class="item task"><p class="q">${esc(p.title)}</p><div class="body">${fill(p.task)}</div>
    <textarea id="t-${p.id}" data-text="${p.id}" placeholder="Your working, answer or notes">${esc(T.text[p.id] || "")}</textarea>
    ${S.reveal[p.id] ? `<div class="answer">${fill(p.solution)}</div>` : `<div class="row"><button class="btn" data-act="reveal" data-id="${p.id}">Show solution</button></div>`}</div>`).join("")}</div>`;

  const quiz = vQuiz(w);

  const nCards = w.cards.length;
  const known = w.cards.filter(c => S.cards[c.id] && S.cards[c.id].reps > 0).length;
  const cards = S.decks[w.id]
    ? `<p>All ${nCards} cards from this week are in your deck. ${known} reviewed at least once.</p><div class="row"><button class="btn mark" data-go="review">Go to review</button><button class="btn" data-act="cram" data-w="${w.id}">Practise this week’s cards now</button></div>`
    : `<p>${nCards} cards cover this week’s key definitions and results. Add them to your deck after you have finished the notes.</p><div class="row"><button class="btn primary" data-act="deck" data-w="${w.id}">Add ${nCards} cards to my deck</button></div>`;

  return `<div class="eyebrow">Week ${w.num} of ${W.length}</div><h1>${esc(w.title)}</h1><p class="lede">${esc(w.focus)}</p>
    <p class="goal">${esc(w.goal)}</p>${budget}
    ${stepShell(w, 0, pre)}${stepShell(w, 1, read)}${stepShell(w, 2, notes)}${stepShell(w, 3, recall)}${stepShell(w, 4, practice)}${stepShell(w, 5, quiz)}${stepShell(w, 6, cards)}
    <div class="row" style="margin-top:24px">${w.num > 1 ? `<button class="btn" data-go="w${w.num - 1}">← Week ${w.num - 1}</button>` : ""}${w.num < W.length ? `<button class="btn" data-go="w${w.num + 1}">Week ${w.num + 1} →</button>` : ""}</div>`;
}

function vQuiz(w) {
  const qz = S.quiz[w.id] || { answers: {}, attempts: 0, best: null };
  const a = qz.answers || {};
  const answered = w.quiz.filter(q => a[q.id] !== undefined).length;
  const correct = w.quiz.filter(q => q.type === "mc" ? a[q.id] === q.answer : a[q.id] === "got").length;
  const finished = answered === w.quiz.length;
  const head = `<div class="score"><b>${correct}/${w.quiz.length}</b><span>${finished ? "Finished." : `${answered} of ${w.quiz.length} answered.`}${qz.best != null ? ` Best: ${qz.best}/${w.quiz.length}.` : ""} Attempts: ${qz.attempts}.</span>${finished || answered ? `<button class="btn" data-act="retake" data-w="${w.id}">Retake</button>` : ""}</div>`;
  return head + `<div class="items">${w.quiz.map((q, i) => {
    const ans = a[q.id];
    if (q.type === "mc") {
      const locked = ans !== undefined;
      return `<div class="item"><p class="q">${i + 1}. ${esc(q.q)}</p><div class="opts">${order(q.options.length, q.id + ":" + qz.attempts).map(j => { const o = q.options[j];
        const cls = locked ? (j === q.answer ? "right" : j === ans ? "wrong" : "") : "";
        return `<button class="opt ${cls}" ${locked ? "disabled" : ""} data-act="mc" data-w="${w.id}" data-q="${q.id}" data-j="${j}">${esc(o)}</button>`;
      }).join("")}</div>${locked ? `<p class="why">${ans === q.answer ? "Correct. " : "Not quite. "}${esc(q.why)}</p>` : ""}</div>`;
    }
    const shown = S.reveal["qz:" + q.id];
    return `<div class="item"><p class="q">${i + 1}. ${esc(q.q)}</p><textarea id="t-${q.id}" data-text="${q.id}" placeholder="Answer from memory">${esc(T.text[q.id] || "")}</textarea>
      ${shown ? `<div class="answer">${esc(q.a)}</div><div class="row"><span class="rate">Mark yourself:</span>${[["got", "Correct"], ["miss", "Not correct"]].map(([v, l]) => `<button class="btn ${ans === v ? "sel" : ""}" data-act="sa" data-w="${w.id}" data-q="${q.id}" data-v="${v}">${l}</button>`).join("")}</div>`
        : `<div class="row"><button class="btn" data-act="reveal" data-id="qz:${q.id}">Check against model answer</button></div>`}</div>`;
  }).join("")}</div>`;
}

let session = null; // {queue:[ids], shown:false, cram:bool, done:n}
function startSession(cramWeek) {
  if (cramWeek) session = { queue: W.find(w => w.id === cramWeek).cards.map(c => c.id), shown: false, cram: true, done: 0 };
  else { const { due, fresh } = dueCards(); session = { queue: [...due.map(c => c.id), ...fresh.slice(0, 20).map(c => c.id)], shown: false, cram: false, done: 0 }; }
}
function vReview() {
  const { due, fresh, active } = dueCards();
  const learned = active.filter(c => S.cards[c.id] && S.cards[c.id].reps > 0).length;
  if (!session || (!session.cram && session.queue.length === 0 && session.done === 0)) startSession();
  const decks = W.map(w => `<button class="chip" data-act="${S.decks[w.id] ? "cram" : "deck"}" data-w="${w.id}">${S.decks[w.id] ? `Practise W${w.num}` : `Add W${w.num} cards`}</button>`).join("");
  let card = "";
  if (!active.length && !session.cram) card = `<div class="empty">Your deck is empty. Add a week’s cards from its Flashcards step, or below.</div>`;
  else if (!session.queue.length) card = `<div class="empty">${session.done ? `Done: ${session.done} card${session.done === 1 ? "" : "s"} reviewed. ` : ""}Nothing else is due right now. Come back tomorrow; short daily reviews work best.</div>`;
  else {
    const c = ALL_CARDS.find(x => x.id === session.queue[0]);
    const st = S.cards[c.id];
    card = `<div class="flash"><div class="meta"><span>Week ${c.num}${session.cram ? " · practice (not scheduled)" : st ? "" : " · new"}</span><span class="tabular">${session.queue.length} left</span></div>
      <div class="front">${esc(c.f)}</div>
      ${session.shown ? `<div class="back">${esc(c.b)}</div>
        ${session.cram ? `<div class="row"><button class="btn" data-act="cramnext" data-v="again">Show again later</button><button class="btn primary" data-act="cramnext" data-v="ok">Next</button></div>`
          : `<div class="grades">${[["again", "Again"], ["hard", "Hard"], ["good", "Good"], ["easy", "Easy"]].map(([g, l]) => `<button class="grade ${g}" data-act="grade" data-v="${g}">${l}<small>${preview(c.id, g)}</small></button>`).join("")}</div>`}`
        : `<p class="rate">Say or write the answer before you flip.</p><div class="row"><button class="btn primary" data-act="flip">Show answer</button></div>`}</div>`;
  }
  return `<div class="review"><div class="eyebrow">Spaced repetition</div><h1>Review</h1>
    <p class="lede">Cards come back just before you would forget them. Rate honestly: “Again” brings a card back in ten minutes, “Easy” pushes it out furthest.</p>
    <div class="stats"><div class="stat"><b>${due.length}</b><span>due now</span></div><div class="stat"><b>${fresh.length}</b><span>new in deck</span></div><div class="stat"><b>${learned}</b><span>learned</span></div><div class="stat"><b>${ALL_CARDS.length}</b><span>in the course</span></div></div>
    ${card}
    <h3 style="margin:22px 0 4px;font-size:15px">Decks by week</h3><div class="decks">${decks}</div>
    ${session.cram ? `<div class="row"><button class="btn" data-act="endcram">Back to scheduled review</button></div>` : ""}</div>`;
}

function vMethod() {
  return `<div class="eyebrow">How this course works</div><h1>Built for active recall</h1>
  <div class="method">
  <p>Re-reading feels productive but fades fast. Pulling information out of memory, especially with effort and spaced out over days, is what makes it last. Every week uses the same seven steps, each with a job.</p>
  <h3>1. Pre-test</h3><p>Three questions before you read. You will often be wrong. Trying first primes you to notice the answers while reading.</p>
  <h3>2–3. Read, then study notes</h3><p>Read the assigned sections of the source papers or docs, then the course notes, which connect the theory to data engineering. Do not highlight much. Instead, at the end of each section, look away and summarise it in one sentence.</p>
  <h3>4. Close-the-book recall</h3><p>Hide the notes with the button, then write each answer from memory before revealing the model answer. Rate yourself honestly. “Partly” and “Missed” are useful signals, not failures.</p>
  <h3>5. Practice</h3><p>Hand-computed provenance, SQL and labs. Do the work before opening the solution. Struggling a bit is part of how it works.</p>
  <h3>6. Quiz</h3><p>Multiple-choice and short-answer questions answered from memory. Each quiz mixes in questions from earlier weeks (interleaving). Retake a quiz a few days later rather than straight away.</p>
  <h3>7. Flashcards with spaced repetition</h3><p>Add a week’s cards to your deck. The Review tab schedules each card based on your ratings: new and hard cards come back soon, easy ones after days or weeks. Ten minutes on most days keeps every earlier week alive while you learn the next.</p>
  <h3>Time</h3><p>Each week is planned for about five hours: roughly 90–120 minutes of reading, an hour of notes and recall, an hour of practice, and the rest on the quiz and short daily reviews.</p>
  <h3>Saving</h3><p>Your answers, ratings, quiz scores and card schedule save automatically. When you are signed in they save to your account, so they follow you between devices; otherwise they stay in this browser.</p>
  <h3>Sources</h3><p>The two PDFs in your project’s Datalineage folder: Buneman, Khanna &amp; Tan, “Data Provenance: Some Basic Issues” (k51.pdf), and Cheney, Chiticariu &amp; Tan, “Provenance in Databases: Why, How, and Where”. Additional sources are linked inside each week and collected in the <a href="https://claude.ai/artifact/NpqJy5QGwzxV82UasnuKtP" target="_blank" rel="noopener">reading list</a>.</p>
  </div>`;
}

// ---------- events ----------
document.addEventListener("click", e => {
  const g = e.target.closest("[data-go]");
  if (g) { go(g.dataset.go); return; }
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const d = b.dataset, act = d.act;
  if (act === "read") return; // handled by change
  if (act === "step") { const k = d.w + ":" + d.k; S.steps[k] = !S.steps[k]; touch(); }
  else if (act === "reveal") { S.reveal[d.id] = true; touch(); }
  else if (act === "rate") { S.rate[d.id] = d.v; touch(); }
  else if (act === "closebook") { S.reveal[d.w + ":notesClosed"] = true; S.steps[d.w + ":notes"] = true; touch(); render(); $("#step-recall")?.scrollIntoView({ block: "start" }); return; }
  else if (act === "openbook") { S.reveal[d.w + ":notesClosed"] = false; touch(); }
  else if (act === "mc" || act === "sa") {
    const qz = S.quiz[d.w] = S.quiz[d.w] || { answers: {}, attempts: 0, best: null };
    qz.answers[d.q] = act === "mc" ? Number(d.j) : d.v;
    const w = W.find(x => x.id === d.w);
    if (w.quiz.every(q => qz.answers[q.id] !== undefined) && !qz.counted) {
      const sc = w.quiz.filter(q => q.type === "mc" ? qz.answers[q.id] === q.answer : qz.answers[q.id] === "got").length;
      qz.attempts++; qz.counted = true; qz.best = Math.max(qz.best ?? 0, sc);
    }
    touch();
  }
  else if (act === "retake") { const qz = S.quiz[d.w]; qz.answers = {}; qz.counted = false; W.find(x => x.id === d.w).quiz.forEach(q => { delete S.reveal["qz:" + q.id]; }); touch(); }
  else if (act === "deck") { S.decks[d.w] = true; touch(); if (view === "review") session = null; }
  else if (act === "cram") { startSession(d.w); if (view !== "review") { go("review"); return; } }
  else if (act === "endcram") { session = null; }
  else if (act === "flip") { session.shown = true; }
  else if (act === "grade") { const id = session.queue.shift(); schedule(id, d.v); if (d.v === "again") session.queue.push(id); session.done++; session.shown = false; }
  else if (act === "cramnext") { const id = session.queue.shift(); if (d.v === "again") session.queue.push(id); session.done++; session.shown = false; }
  render();
});
document.addEventListener("change", e => {
  const t = e.target;
  if (t.dataset && t.dataset.act === "read") { S.reads[t.dataset.key] = t.checked; touch(); render(); }
});
document.addEventListener("input", e => {
  const t = e.target;
  if (t.dataset && t.dataset.text) { T.text[t.dataset.text] = t.value; touch("T"); }
});
document.addEventListener("focusout", e => {
  const t = e.target;
  if (t.dataset && t.dataset.text && t.dataset.text.includes(":pre")) {
    const w = W.find(x => t.dataset.text.startsWith(x.id + ":"));
    if (w && autoSteps(w)) { touch(); chrome(); const sec = $("#step-pretest"); if (sec) { sec.classList.add("done"); sec.querySelector(".step-n").textContent = "✓"; sec.querySelector(".donebtn").textContent = "Done"; } }
  }
});
document.addEventListener("keydown", e => {
  if (view !== "review" || !session || !session.queue.length || /TEXTAREA|INPUT/.test(document.activeElement?.tagName)) return;
  if (!session.shown && (e.key === " " || e.key === "Enter")) { e.preventDefault(); session.shown = true; render(); }
  else if (session.shown && !session.cram && ["1", "2", "3", "4"].includes(e.key)) { const g = ["again", "hard", "good", "easy"][Number(e.key) - 1]; const id = session.queue.shift(); schedule(id, g); if (g === "again") session.queue.push(id); session.done++; session.shown = false; render(); }
});
window.addEventListener("hashchange", () => { route(); render(); });
window.addEventListener("pagehide", flush);

route();
render();
connectDb();
