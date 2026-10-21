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
