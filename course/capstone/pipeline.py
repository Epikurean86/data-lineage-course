"""Capstone starter: a 3-step pipeline with eager row-level provenance and OpenLineage events."""
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
       o.pid || '*' || f.pid AS prov            -- join => product
FROM raw_orders o JOIN raw_fx f ON o.currency = f.currency
WHERE o.status = 'paid'"""

# ---- Step 2: mart (aggregation; projection merges => sum of monomials) ----
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
