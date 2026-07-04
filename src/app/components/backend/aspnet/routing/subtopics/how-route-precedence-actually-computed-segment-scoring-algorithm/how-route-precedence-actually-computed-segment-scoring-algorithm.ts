import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-how-route-precedence-computed-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-route-precedence-actually-computed-segment-scoring-algorithm.html',
  styleUrl: './how-route-precedence-actually-computed-segment-scoring-algorithm.scss',
})
export class HowRoutePrecedenceActuallyComputedSegmentScoringAlgorithmSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states a RANKING ("literals > constrained params > unconstrained > catch-alls") — this subtopic covers the actual PER-SEGMENT scoring that produces that ranking, including corner cases the ranking alone doesn\'t resolve',
      points: [
        'The main Routing page\'s precedence rule — "literal segments rank highest, then route-constrained parameters, then unconstrained parameters, then catch-alls" — correctly describes the OUTCOME for comparing a SINGLE segment in isolation. But real routes have MULTIPLE segments, and the ranking alone does not say what happens when one route has MORE literal segments but the OTHER has a constraint on an earlier segment — the actual mechanism scores EACH SEGMENT individually, then compares the sequences segment-by-segment.',
      ],
    },
    {
      heading: 'Each segment gets an internal precedence "weight" — routing compares two candidate templates segment-by-segment, using the segment weights, not a single overall score for the whole template',
      points: [
        'Conceptually (the exact internal numeric values are an implementation detail, but the RELATIVE ordering is stable and documented behavior): a literal segment (<code>/products</code>) scores the "best" (lowest/most-specific) weight; a segment with one or more constraints (<code>{id:int}</code>) scores worse than a literal but better than an unconstrained parameter; a plain unconstrained parameter (<code>{id}</code>) scores worse still; and a catch-all (<code>{**rest}</code>) scores worst of all, since it can match literally anything, including multiple segments.',
        'Comparison walks BOTH templates segment-by-segment, LEFT TO RIGHT: the FIRST segment position where the two templates\' scores DIFFER decides the overall winner — this is precisely why a route with a highly-specific FIRST segment can outrank a route with more total constraints spread across LATER segments, and vice versa; total constraint COUNT is not what matters, POSITION does.',
      ],
    },
    {
      heading: 'A genuinely tricky corner case: two routes that are IDENTICAL in every segment except one has an extra CONSTRAINT on an already-equal-shaped segment',
      points: [
        '<code>/products/{id}</code> versus <code>/products/{id:int}</code> — both have EXACTLY the same shape (one literal segment, one parameter segment), but the SECOND has a constraint on that parameter. Per the segment-scoring rule, the constrained version scores BETTER (more specific) than the unconstrained one at that exact segment position — so for a URL like <code>/products/42</code> (which BOTH templates can technically match, since "42" is both a valid unconstrained string AND a valid int), the CONSTRAINED route <code>{id:int}</code> wins, precisely mirroring the main page\'s own single-segment ranking rule, now shown to apply consistently even when comparing two otherwise-identical-shaped templates.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own single-segment example — now traced through segment-by-segment comparison',
      language: 'csharp',
      code: `app.MapGet("/users/{id:int}",    (int id) => \$"user {id}");   // constrained
app.MapGet("/users/me",          () => "current user");         // literal — always wins

// Both templates have EXACTLY TWO segments: ["users", <param>].
// Segment 1 ("users") is IDENTICAL (literal) in both — scores equal,
// comparison moves to segment 2.
// Segment 2 differs: "me" (literal) vs "{id:int}" (constrained param).
// Per the segment weight ordering, literal beats constrained-parameter
// at this position — "me" wins for the URL "/users/me", regardless of
// which MapGet call appears first in Program.cs.`,
    },
    {
      label: 'A multi-segment corner case — MORE constraints does NOT automatically mean higher precedence',
      language: 'csharp',
      code: `// Two candidate routes, both technically matching "/api/orders/42/items":
app.MapGet("/api/orders/{id:int}/items",           (int id) => "A");
app.MapGet("/api/{category}/{id:int}/{**rest}",    (string category, int id, string rest) => "B");

// Segment-by-segment comparison, LEFT TO RIGHT:
//   Position 1: "api" (literal) vs "api" (literal) — EQUAL, continue.
//   Position 2: "orders" (literal) vs "{category}" (unconstrained param)
//     — DIFFERS HERE. Literal beats unconstrained parameter AT THIS
//     POSITION. The comparison STOPS at the first differing position —
//     route A wins OUTRIGHT, regardless of what either template does
//     at LATER segments (A's third segment is constrained; B's third
//     segment is ALSO constrained, identically — it never even needs
//     to be compared, because position 2 already decided the winner).
//
// THE KEY LESSON: route B has a catch-all at the END (generally the
// "worst" kind of segment), but that fact is COMPLETELY IRRELEVANT
// here — the winner was already decided at position 2, the FIRST
// point of difference. Counting "how many constraints does each route
// have in total" would give the WRONG intuition for many real cases;
// only the FIRST segment where the two templates diverge matters.`,
    },
    {
      label: 'The "identical shape, one extra constraint" case — verifying the main page\'s ranking directly',
      language: 'csharp',
      code: `app.MapGet("/products/{id}",     (string id) => \$"any: {id}");
app.MapGet("/products/{id:int}", (int id)    => \$"int: {id}");

// BOTH templates have the exact same shape: one literal segment
// ("products"), one parameter segment. The ONLY difference is the
// constraint on the second route's parameter.
//
// For the URL "/products/42":
//   Segment 1: "products" == "products" — equal, continue.
//   Segment 2: "{id}" (unconstrained) vs "{id:int}" (constrained)
//     — DIFFERS. Constrained beats unconstrained at this position.
//   Result: "/products/{id:int}" wins — GetString() returns "int: 42".
//
// For the URL "/products/abc" (fails the :int constraint entirely):
//   "/products/{id:int}" is ELIMINATED as a candidate before precedence
//   comparison even matters (the constraint itself fails to match) —
//   "/products/{id}" is the ONLY remaining candidate, so it handles
//   the request, returning "any: abc".
//
// This demonstrates the main page's own "a failed constraint causes
// the router to skip to the next candidate route" rule and the
// precedence-ranking rule working TOGETHER: precedence only decides
// between routes that ALL successfully match a given URL in the first
// place; a constraint failure removes a route from consideration
// entirely, before precedence is even consulted for that URL.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Three routes are registered: <code>/api/{version}/users/{id:int}</code>, <code>/api/v2/users/{id}</code>, and <code>/api/v2/users/me</code>. For the URL <code>/api/v2/users/me</code>, use the segment-by-segment, first-difference-wins comparison from this subtopic to determine which route wins, and explain why the THIRD route\'s templates being shorter or longer never comes into play here.',
    hint: 'All three routes have the SAME number of segments (four) for this specific URL — walk through each position, left to right, across all three candidates simultaneously, and find the FIRST position where they diverge from each other.',
    solution: `app.MapGet("/api/{version}/users/{id:int}", (string version, int id) => "A");
app.MapGet("/api/v2/users/{id}",             (string id) => "B");
app.MapGet("/api/v2/users/me",               () => "C");

// URL: /api/v2/users/me — segments: ["api", "v2", "users", "me"]

// SEGMENT-BY-SEGMENT COMPARISON ACROSS ALL THREE CANDIDATES:
//
// Position 1 ("api"): ALL THREE templates have literal "api" here —
//   equal across all three, move to position 2.
//
// Position 2: Route A has "{version}" (unconstrained parameter);
//   Routes B and C both have literal "v2" — THIS IS THE FIRST POINT
//   OF DIVERGENCE. Literal beats unconstrained parameter at this
//   position, so Route A is ELIMINATED from contention right here —
//   it does not matter AT ALL that Route A's position-4 segment
//   ({id:int}) is MORE constrained than either B's or C's — the
//   comparison never even reaches position 4 for Route A, because it
//   already lost at position 2.
//
// Between B and C (both now tied through position 2 — both "v2"):
//   Position 3 ("users"): literal in both — equal, continue.
//   Position 4: Route B has "{id}" (unconstrained parameter); Route C
//   has literal "me" — THIS IS THE DECIDING POSITION. Literal beats
//   unconstrained parameter — Route C ("/api/v2/users/me") wins.
//
// FINAL RESULT: Route C wins for this specific URL — matching the
// main page's own "/users/me always wins over /users/{id}" rule,
// just demonstrated across a longer, three-way comparison. Route A's
// SEEMINGLY more specific constraint at position 4 ({id:int}) was
// COMPLETELY IRRELEVANT to the outcome, because it never survived
// past the FIRST point of divergence at position 2 — reinforcing that
// precedence comparison stops at the first differing segment, left to
// right, rather than aggregating "total specificity" across an entire
// template.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'route precedence is decided by counting the TOTAL number of constraints or literal segments across an entire route template, and whichever route has "more specificity points" wins.',
      reality: 'comparison proceeds segment-by-segment, left to right, and the FIRST position where two competing templates differ decides the winner outright — segments after that point are never even considered, regardless of how constrained or literal they are.',
    },
    {
      thought: 'a route with a highly-constrained parameter LATE in its template (like {id:int} at the very end) will generally outrank a route with a less-constrained parameter EARLIER in its template.',
      reality: 'position matters more than degree of constraint — an earlier point of divergence decides the outcome before a later, more-specific segment is ever reached in the comparison.',
    },
    {
      thought: 'when two route templates have the exact same shape and only differ by ONE segment having an added constraint, the unconstrained version is preferred because it is more general and flexible.',
      reality: 'the CONSTRAINED version is scored as more specific and wins precedence at that segment position — matching the main page\'s single-segment ranking rule (constrained parameters outrank unconstrained ones) applied consistently even when comparing two otherwise-identical-shaped templates.',
    },
  ];
}
