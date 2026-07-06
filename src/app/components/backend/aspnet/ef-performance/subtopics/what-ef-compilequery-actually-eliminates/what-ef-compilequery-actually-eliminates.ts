import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-what-ef-compilequery-eliminates-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './what-ef-compilequery-actually-eliminates.html',
  styleUrl: './what-ef-compilequery-actually-eliminates.scss',
})
export class WhatEfCompilequeryActuallyEliminatesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s framing — "EF.CompileQuery() eliminates the LINQ-to-SQL translation cost on every call" — slightly overstates what actually happens on a REPEAT call to the SAME query shape without compilation',
      points: [
        'The main EF Core Performance page says: "<code>EF.CompileQuery()</code> compiles a LINQ expression at startup, eliminating the LINQ-to-SQL translation cost on every call... a typical translation costs 1–5 ms per query." Read literally, this implies every SINGLE call to an uncompiled query pays the full 1–5ms translation cost, every time. That is NOT quite accurate — EF Core already maintains an INTERNAL query plan cache, keyed by the STRUCTURE of the expression tree, specifically to avoid re-translating a query shape it has already seen before.',
      ],
    },
    {
      heading: 'EF Core\'s built-in query cache means a REPEATED call to the SAME LINQ query shape (with different parameter values) does NOT re-run the full translation pipeline — the REAL overhead EF.CompileQuery() eliminates is the CACHE LOOKUP itself: walking and hashing the expression tree to find the matching cached plan',
      points: [
        'Every time you write <code>db.Products.Where(p => p.Id == id).FirstOrDefaultAsync()</code> inside a method, the C# compiler constructs a NEW <code>Expression</code> tree object for that call (capturing whatever the CURRENT value of <code>id</code> happens to be as a parameter) — but the STRUCTURAL SHAPE of that expression tree (which properties, which operators, in what order) is IDENTICAL across every call from the same source line. EF Core\'s internal query cache computes a hash/key from this STRUCTURAL SHAPE and looks up whether a compiled SQL command for that shape already exists — if it does, EF Core skips re-running the full translation pipeline and reuses the cached plan, substituting in the NEW parameter value.',
        'This means the "1–5ms translation cost" the main page describes is closer to accurate for the FIRST time a given query shape executes (a genuine cache miss) — SUBSEQUENT calls to the SAME shape still pay a SMALLER, but non-zero, cost: hashing the expression tree and performing the cache lookup/comparison. <code>EF.CompileQuery()</code>\'s actual, more precise benefit is bypassing THIS cache-lookup step entirely — the compiled delegate already KNOWS its own SQL command, with no expression-tree walking or hashing required at all, going straight from method call to parameter binding and execution.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What actually happens on the SECOND call to an UNCOMPILED query — not a full re-translation, but not free either',
      language: 'csharp',
      code: `// An ordinary, UNCOMPILED query — called repeatedly from a hot path:
public async Task<Product?> GetByIdAsync(int id, CancellationToken ct)
    => await db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, ct);

// CALL 1 (id = 5):
//   1. C# constructs a NEW Expression tree for 'p => p.Id == id'
//      (capturing id=5 as a closed-over parameter).
//   2. EF Core's query pipeline computes a cache key from the
//      STRUCTURAL SHAPE of this expression (ignoring the actual
//      captured value of 'id') and checks its internal query plan
//      cache — MISS, since this exact shape has never run before.
//   3. Full translation runs: walk the expression tree, build a SQL
//      command, cache the resulting plan under that shape's key.
//      THIS is the ~1-5ms the main page describes — but it's a
//      ONE-TIME cost for this query SHAPE, not a per-call cost.

// CALL 2 (id = 42), same method, same source line:
//   1. C# constructs ANOTHER NEW Expression tree — structurally
//      IDENTICAL to Call 1's, just with a different captured 'id'
//      value.
//   2. EF Core computes the SAME cache key (same structural shape) and
//      checks the cache — HIT this time. The cached SQL command is
//      reused directly; ONLY the parameter value differs.
//   3. NO full re-translation runs. But computing the cache key
//      itself — walking the tree structure to hash it, then comparing
//      against cached entries — is NOT free. It's meaningfully
//      CHEAPER than full translation, but it is still real, measurable
//      CPU work performed on every single call.`,
    },
    {
      label: 'What EF.CompileQuery() genuinely skips — the cache lookup itself, not translation that would otherwise happen every time',
      language: 'csharp',
      code: `private static readonly Func<AppDbContext, int, CancellationToken, Task<Product?>> _getById =
    EF.CompileAsyncQuery((AppDbContext db, int id, CancellationToken ct) =>
        db.Products.AsNoTracking().FirstOrDefault(p => p.Id == id));

public Task<Product?> GetByIdAsync(int id, CancellationToken ct)
    => _getById(db, id, ct);

// WITH THE COMPILED QUERY:
//   The FULL translation (expression walk → SQL generation) happens
//   EXACTLY ONCE — at the moment EF.CompileAsyncQuery() itself is
//   called (typically during static field initialization, at process
//   startup or first access).
//
//   EVERY SUBSEQUENT CALL to '_getById(db, id, ct)' does NOT construct
//   a new Expression tree at all, does NOT compute a cache key, and
//   does NOT perform a cache lookup — the delegate ALREADY KNOWS
//   exactly which precompiled SQL command to execute. It goes
//   straight from "delegate invoked" to "bind parameter value" to
//   "execute against the database."
//
// THE PRECISE DISTINCTION THIS SUBTOPIC ESTABLISHES: an uncompiled
// query repeated many times pays (a) ONE full translation (first
// call) plus (b) MANY smaller cache-lookup costs (every call,
// including the first). A compiled query pays (a) the SAME one-time
// full translation (at compile time, not first CALL time) plus (b)
// ZERO cache-lookup cost on every subsequent call — because there is
// no cache involved at all for a compiled query; it bypasses the
// caching mechanism entirely rather than making it faster.
//
// This means EF.CompileQuery()'s benefit scales with CALL VOLUME on an
// ALREADY-WARM query shape — exactly matching the main page's own
// correct guidance to use it "for high-frequency queries," just for a
// more precise reason than "eliminating translation on every call."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that the FIRST call to an uncompiled query shape pays the SAME one-time translation cost as a compiled query pays at its own compile time, explain why EF.CompileQuery() is still worth using even for a query that only runs a MODERATE number of times (say, 100 times total) rather than truly "thousands of times per second" as the main page\'s highest-frequency framing suggests.',
    hint: 'Consider that the cache-lookup cost this subtopic describes, while smaller than full translation, is still paid on EVERY call to an uncompiled query — including calls 2 through 100, not just the first. Does eliminating a SMALL cost paid 99 times still add up to something worth avoiding?',
    solution: `Even for a moderate 100-call scenario, EF.CompileQuery() is still worth
using, because the cache-lookup cost this subtopic describes is paid
on EVERY SINGLE call to an uncompiled query shape — not just the
first one. Concretely:

UNCOMPILED query, 100 calls:
  Call 1:      full translation (~1-5ms)  + cache-lookup overhead
  Calls 2-100: cache-lookup overhead only (smaller, but non-zero,
               paid 99 additional times)

COMPILED query, 100 calls:
  Compile time: full translation (~1-5ms), paid ONCE, typically at
                static field initialization (effectively "call 0")
  Calls 1-100:  ZERO cache-lookup overhead — direct delegate invocation

The compiled query "wins" on the FIRST call too, in a sense (its
one-time translation cost was already paid before the method was ever
invoked in a request-serving context) — but the more significant
difference for a 100-call scenario is that the UNCOMPILED version pays
its smaller-but-real cache-lookup cost ALL 100 TIMES, while the
COMPILED version pays it ZERO times. Whether this difference is
PRACTICALLY significant depends on how expensive that per-call
cache-lookup actually is relative to everything else happening in the
request (a database round-trip measured in single-digit milliseconds
dwarfs a cache-lookup measured in microseconds) — which is exactly WHY
the main page's own guidance correctly emphasizes "high-frequency"
queries as the primary use case: the cache-lookup savings, multiplied
by call count, only become a MEASURABLE fraction of total request time
at genuinely high volumes (the main page's own "1000 req/s" example),
not at a moderate 100-total-calls scale where the database round-trip
itself remains the dominant cost by a wide margin regardless of which
approach is used.

The precise, corrected lesson: EF.CompileQuery() ALWAYS eliminates
SOME per-call overhead (the cache lookup), even for moderate call
volumes — but whether that elimination is WORTH the added code
complexity (a static field, a specific delegate signature) is a
judgment call that scales with call frequency, exactly as the main
page's own "high-frequency" framing suggests, just for a more precise
underlying reason than "translation happens on every call otherwise."`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'without EF.CompileQuery(), EF Core re-runs the FULL LINQ-to-SQL translation pipeline (expression tree walk, SQL generation) on every single call to a query, even repeated calls to the exact same query shape.',
      reality: 'EF Core maintains an internal query plan cache keyed by the structural shape of the expression tree — a repeated call to the same query shape (with different parameter values) reuses the cached SQL command rather than re-running full translation; only the FIRST call to a given shape pays the full translation cost.',
    },
    {
      thought: 'EF.CompileQuery()\'s benefit is eliminating a cost that would otherwise be paid in full on every single call to an uncompiled query.',
      reality: 'the more precise benefit is eliminating the CACHE LOOKUP cost — a smaller, but real and non-zero cost paid on every call to an uncompiled query, including calls that hit the cache — since a compiled query bypasses the caching mechanism entirely rather than making the lookup faster.',
    },
    {
      thought: 'EF.CompileQuery() provides a meaningful, easily measurable performance benefit for any query, regardless of how many times it is actually called.',
      reality: 'the benefit scales with call VOLUME on an already-cached query shape — for a query called only a handful of times, the database round-trip itself (measured in milliseconds) dwarfs the cache-lookup overhead being eliminated (measured in microseconds), making the main page\'s own emphasis on "high-frequency queries" the correct guidance for when this optimization is actually worth its added code complexity.',
    },
  ];
}
