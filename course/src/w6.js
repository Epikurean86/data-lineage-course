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
