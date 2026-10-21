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
