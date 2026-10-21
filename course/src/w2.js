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
