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
