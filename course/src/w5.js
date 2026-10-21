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
