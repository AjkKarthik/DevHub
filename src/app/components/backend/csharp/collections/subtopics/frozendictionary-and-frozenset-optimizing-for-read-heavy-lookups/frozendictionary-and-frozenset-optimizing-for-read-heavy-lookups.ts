import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-frozendictionary-and-frozenset-optimizing-for-read-heavy-lookups-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './frozendictionary-and-frozenset-optimizing-for-read-heavy-lookups.html',
  styleUrl: './frozendictionary-and-frozenset-optimizing-for-read-heavy-lookups.scss',
})
export class FrozendictionaryAndFrozensetOptimizingForReadHeavyLookupsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A third immutability option the main topic never mentions',
      points: [
        'The main Collections page covers <code>Dictionary&lt;K,V&gt;</code> (mutable) and <code>ImmutableDictionary&lt;K,V&gt;</code> (structural sharing, optimized for CHEAP repeated mutation via new-collection-per-change) — but .NET 8 added a THIRD option: <code>System.Collections.Frozen</code>\'s <code>FrozenDictionary&lt;K,V&gt;</code> and <code>FrozenSet&lt;T&gt;</code>, which are optimized for a completely different trade-off — expensive one-time construction in exchange for the FASTEST POSSIBLE read/lookup performance, with NO support for mutation after creation at all (not even the "create a new copy" pattern immutable collections offer).',
      ],
    },
    {
      heading: 'The trade-off — slow to build, fast to read',
      points: [
        'Creating a <code>FrozenDictionary</code> via <code>.ToFrozenDictionary()</code> does real up-front analysis work — computing an optimized internal layout specifically tuned to the actual keys present, which is measurably SLOWER to construct than a regular <code>Dictionary</code> or even an <code>ImmutableDictionary</code>. This cost is deliberate and amortized: it only makes sense when the collection is built ONCE and then read MANY, MANY times over the life of the application.',
        'Once built, lookups on a <code>FrozenDictionary</code> are FASTER than an equivalent regular <code>Dictionary</code> — often meaningfully so for larger collections — precisely because the one-time construction cost paid for a layout optimized for the SPECIFIC set of keys, rather than a general-purpose hash table that must accommodate ongoing inserts/removes.',
      ],
    },
    {
      heading: 'Where this fits relative to the main topic\'s existing options',
      points: [
        '<strong>Dictionary&lt;K,V&gt;</strong>: general-purpose, mutable, good all-around performance for read AND write. <strong>ImmutableDictionary&lt;K,V&gt;</strong>: optimized for cheap COPY-ON-WRITE — each "mutation" returns a new collection sharing structure with the old one, ideal for scenarios needing frequent snapshots. <strong>FrozenDictionary&lt;K,V&gt;</strong>: optimized purely for READ SPEED after a one-time build — no mutation support at all, not even the copy-on-write kind.',
        'The textbook use case is a STATIC LOOKUP TABLE built once at application startup and read constantly for the rest of the process lifetime — a country-code-to-name map, a feature-flag configuration snapshot, a set of reserved keywords for a parser, an enum-like string-to-value mapping. These are built ONCE and never change again, making the expensive one-time construction cost of <code>FrozenDictionary</code> a pure win with no downside.',
      ],
    },
    {
      heading: 'When NOT to reach for it',
      points: [
        'A collection that is built and read only a FEW times (not thousands or millions of times over the application\'s lifetime) will likely spend MORE total time on the expensive Frozen construction than it saves across its few reads — the main topic\'s own performance-conscious framing (Dictionary\'s load-factor pre-sizing, ArrayPool reuse) applies here too: measure the actual read/write ratio before reaching for a specialized collection type.',
        'Anything that needs to change AT ALL after construction (even rarely) is immediately disqualified — <code>FrozenDictionary</code> has no <code>Add</code>/<code>Remove</code>/indexer-setter at all, unlike <code>ImmutableDictionary</code>, which at least supports "mutation" via returning a new instance. For state that changes occasionally but is read far more often than it\'s written, <code>ImmutableDictionary</code> (or even a plain <code>Dictionary</code> behind a <code>ReaderWriterLockSlim</code>, per the main topic\'s concurrency section) remains the better fit.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Building and reading a FrozenDictionary',
      language: 'csharp',
      code: `using System.Collections.Frozen;

// A static lookup table — built ONCE at startup, read constantly afterward.
// Perfect FrozenDictionary use case: country codes never change at runtime.
Dictionary<string, string> countryNamesSource = new()
{
    ["US"] = "United States",
    ["GB"] = "United Kingdom",
    ["FR"] = "France",
    ["DE"] = "Germany",
    ["JP"] = "Japan",
};

// .ToFrozenDictionary() does real up-front optimization work — measurably
// slower than the source Dictionary's own construction, but a ONE-TIME cost.
FrozenDictionary<string, string> countryNames = countryNamesSource.ToFrozenDictionary();

// Reads are as fast as (often faster than) an equivalent Dictionary —
// this is where the one-time construction cost pays for itself, over
// however many thousands of lookups happen during the app's lifetime.
Console.WriteLine(countryNames["US"]);              // "United States"
Console.WriteLine(countryNames.TryGetValue("XX", out var name)); // False

// No mutation API exists at all — this does not compile:
// countryNames["IT"] = "Italy";   // FrozenDictionary has no indexer setter
// countryNames.Add("IT", "Italy"); // no Add method exists`,
    },
    {
      label: 'FrozenSet — the set equivalent',
      language: 'csharp',
      code: `using System.Collections.Frozen;

// A parser's reserved-keyword set — built once, checked millions of times
// during compilation/parsing of real source files.
HashSet<string> reservedWordsSource = new(StringComparer.Ordinal)
{
    "if", "else", "while", "for", "return", "class", "interface", "namespace",
};

FrozenSet<string> reservedWords = reservedWordsSource.ToFrozenSet();

// Fast membership checks — the primary operation this type is tuned for.
Console.WriteLine(reservedWords.Contains("if"));      // True
Console.WriteLine(reservedWords.Contains("myVar"));   // False

// Custom comparer support works the same way as regular collections —
// pass it to the source HashSet (or directly to ToFrozenSet):
FrozenSet<string> caseInsensitiveReserved =
    reservedWordsSource.ToFrozenSet(StringComparer.OrdinalIgnoreCase);
Console.WriteLine(caseInsensitiveReserved.Contains("IF")); // True`,
    },
    {
      label: 'When NOT to use Frozen collections — measuring the trade-off',
      language: 'csharp',
      code: `using System.Collections.Frozen;
using System.Diagnostics;

// Scenario A: built once, read a MILLION times — Frozen wins decisively.
var lookupTable = BuildLargeLookupTable(); // Dictionary<string, int>, 10,000 entries
var frozen = lookupTable.ToFrozenDictionary(); // one-time cost, paid ONCE

var sw = Stopwatch.StartNew();
for (int i = 0; i < 1_000_000; i++)
    _ = frozen.TryGetValue("some-key", out _);
Console.WriteLine($"Frozen: {sw.ElapsedMilliseconds}ms for 1M reads");
// Frozen's optimized layout pays for itself many times over at this scale.

// Scenario B: built and read only a FEW times — Frozen is a net LOSS.
Dictionary<string, int> BuildSmallTemporaryLookup(string[] items)
{
    var dict = new Dictionary<string, int>();
    for (int i = 0; i < items.Length; i++) dict[items[i]] = i;
    return dict;
}

// If this lookup is built fresh and used just a handful of times per call
// (e.g. inside a request handler, not a startup singleton), the one-time
// FrozenDictionary construction cost is paid EVERY TIME with almost no
// reads to amortize it against — a plain Dictionary is the better choice here.
var perRequestLookup = BuildSmallTemporaryLookup(["a", "b", "c"]);
// perRequestLookup.ToFrozenDictionary() would be counterproductive here —
// there aren't enough reads per request to recoup the conversion cost.

static Dictionary<string, int> BuildLargeLookupTable()
{
    var d = new Dictionary<string, int>();
    for (int i = 0; i < 10_000; i++) d[$"key-{i}"] = i;
    return d;
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Build a <code>FrozenDictionary&lt;string, int&gt;</code> mapping HTTP status codes to their descriptions\' word count (e.g. <code>"200"</code> → 2, for "OK" — pick your own short descriptions), then write a comment explaining WHY this specific example (a fixed, small, startup-loaded table read on every HTTP response) is a textbook-good use case for FrozenDictionary rather than a plain Dictionary.',
    hint: 'Build a small Dictionary<string, int> mapping a handful of status codes to word counts, call .ToFrozenDictionary() on it, and store the result in a field or static readonly member (not rebuilt per-request). In the comment, note that HTTP status descriptions never change at runtime and this table would be read on every single response the server sends — a huge, sustained read-to-build ratio.',
    solution: `using System.Collections.Frozen;

// Built ONCE, likely as a static readonly field at application startup —
// HTTP status descriptions never change at runtime, and this table would
// be consulted on potentially EVERY response the server sends for the
// entire lifetime of the process. The read-to-build ratio here is enormous
// (millions of reads against one construction), making the one-time
// FrozenDictionary construction cost trivially worth paying.
private static readonly FrozenDictionary<string, int> StatusWordCounts =
    new Dictionary<string, int>
    {
        ["200"] = 2, // "OK" -> actually 1 word, adjust as needed for the exercise
        ["404"] = 3, // "Not Found"
        ["500"] = 3, // "Server Error"
    }.ToFrozenDictionary();

Console.WriteLine(StatusWordCounts["404"]); // 3`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'FrozenDictionary is just another name for ImmutableDictionary, or a minor variant of it.',
      reality: 'they solve DIFFERENT problems — ImmutableDictionary optimizes for CHEAP repeated "mutation" via structural sharing (each change returns a new collection sharing most of its structure with the old one); FrozenDictionary has NO mutation API at all and instead optimizes purely for the FASTEST possible read performance after one expensive one-time build.',
    },
    {
      thought: 'converting any Dictionary to a FrozenDictionary via ToFrozenDictionary() is a straightforward performance upgrade with no downside.',
      reality: 'the conversion itself does real, measurably slower up-front work than building a plain Dictionary — it only pays off when the resulting collection is read a very large number of times relative to how often it\'s built; for a collection built fresh per-request or rarely reused, the conversion cost can exceed the read-time savings entirely.',
    },
    {
      thought: 'FrozenDictionary and FrozenSet support custom equality comparers the same limited way as basic Dictionary construction.',
      reality: 'custom IEqualityComparer&lt;T&gt; support works identically to regular collections — pass it either to the source Dictionary/HashSet before conversion, or directly as an argument to ToFrozenDictionary()/ToFrozenSet() — the same custom comparer patterns covered in the previous subtopic apply directly here.',
    },
  ];
}
