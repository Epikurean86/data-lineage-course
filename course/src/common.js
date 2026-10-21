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
