import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-why-exceptions-are-slow-stack-walking-first-chance-exceptions-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './why-exceptions-are-slow-stack-walking-first-chance-exceptions.html',
  styleUrl: './why-exceptions-are-slow-stack-walking-first-chance-exceptions.scss',
})
export class WhyExceptionsAreSlowStackWalkingFirstChanceExceptionsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page asserts "expensive" — never explains why',
      points: [
        'The main Exceptions page states, in its Result-pattern section: "Exceptions are expensive: they capture a full stack trace and are intended for exceptional circumstances, not for normal control flow." It never explains WHAT specifically is expensive, or by how much — leaving "exceptions are slow" as received wisdom rather than an understood mechanism.',
      ],
    },
    {
      heading: 'The real cost is stack walking, not allocation',
      points: [
        'The dominant cost of throwing an exception is NOT allocating the exception object itself (that is a cheap, ordinary heap allocation) — it is the CLR walking the call stack to build the <code>StackTrace</code> string and to locate a matching <code>catch</code> handler frame by frame. This walk touches every stack frame between the throw site and the catching frame, inspecting each one\'s exception-handling metadata.',
        'This is why a <code>throw</code> deep inside a long call chain (many nested method calls) is measurably more expensive than one thrown just one frame up from its catch — the stack-walking cost scales with the DEPTH of the call stack at the throw site, not with anything about the exception object\'s own size or type.',
      ],
    },
    {
      heading: 'First-chance exceptions add debugger overhead, separate from the throw cost',
      points: [
        'Every thrown exception in .NET fires a "first-chance exception" notification BEFORE any catch clause runs — this is how debuggers can break at the exact throw site (mentioned in passing on the main page\'s exception-filter section) even for exceptions that get caught and fully handled a moment later.',
        'Under an attached debugger with "break on all exceptions" enabled, this first-chance notification can make exception-heavy code dramatically slower during debugging specifically — a difference that often does NOT show up in a Release build running without a debugger attached, which is a common source of "it\'s fast in production, slow when I step through it" confusion.',
      ],
    },
    {
      heading: 'Quantifying it — and where it genuinely does not matter',
      points: [
        'A `try` block with no exception thrown has effectively ZERO runtime cost in modern .NET — the JIT does not insert per-iteration overhead just because code is wrapped in try/catch. The entire cost is concentrated at the moment of an actual <code>throw</code>, not in merely having a try block present.',
        'This means the main page\'s guidance — reserve exceptions for genuinely exceptional, low-frequency failures; use <code>Try*</code> methods (<code>TryParse</code>, <code>TryGetValue</code>) for expected, high-frequency ones — is not just a style preference but reflects a real, measurable cost difference specifically in the THROW path, concentrated in scenarios like validation loops, parsers, or hot paths that throw routinely rather than exceptionally.',
        'For a genuinely rare error path (a config file missing once at startup, a network call failing occasionally), the stack-walking cost of a single throw is completely irrelevant — the "avoid exceptions for control flow" guidance specifically targets FREQUENT throws in hot code paths, not exceptions in general.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The cost scales with call-stack depth at the throw site',
      language: 'csharp',
      code: `using System.Diagnostics;

// A throw deep in a call chain has to walk MORE stack frames to find its
// catch handler than a throw one frame away from its catch.
static void DeepCall(int depth)
{
    if (depth == 0)
        throw new InvalidOperationException("Deep failure");
    DeepCall(depth - 1); // recurse further before throwing
}

var sw = Stopwatch.StartNew();
for (var i = 0; i < 10_000; i++)
{
    try { DeepCall(50); }   // throws from 50 frames deep
    catch { /* swallow for benchmark purposes only */ }
}
Console.WriteLine($"Deep (50 frames): {sw.ElapsedMilliseconds}ms");

sw.Restart();
for (var i = 0; i < 10_000; i++)
{
    try { DeepCall(1); }    // throws from 1 frame deep
    catch { }
}
Console.WriteLine($"Shallow (1 frame): {sw.ElapsedMilliseconds}ms");

// The deep version is measurably slower — NOT because the exception
// object itself is different, but because building the stack trace and
// locating the catch handler walks a longer chain of frames.`,
    },
    {
      label: 'try/catch with no throw has effectively zero cost',
      language: 'csharp',
      code: `using System.Diagnostics;

// A try block that never actually throws should cost roughly the same
// as the equivalent code with no try/catch at all — the JIT does not
// add meaningful per-call overhead just for the presence of a try block.
static int ParseWithTryCatch(string s)
{
    try { return int.Parse(s); }
    catch (FormatException) { return 0; }
}

static int ParseWithTryParse(string s) =>
    int.TryParse(s, out var value) ? value : 0;

const string validInput = "42"; // never throws in either version below

var sw = Stopwatch.StartNew();
for (var i = 0; i < 1_000_000; i++)
    ParseWithTryCatch(validInput); // try block present, but never THROWS
Console.WriteLine($"try/catch, no throw: {sw.ElapsedMilliseconds}ms");

sw.Restart();
for (var i = 0; i < 1_000_000; i++)
    ParseWithTryParse(validInput);
Console.WriteLine($"TryParse: {sw.ElapsedMilliseconds}ms");

// These two are roughly comparable — the cost is NOT in wrapping code in
// try/catch. The real difference appears only once the input actually
// triggers a throw:

const string invalidInput = "not a number";

sw.Restart();
for (var i = 0; i < 10_000; i++) // 100x fewer iterations — still slower overall
    ParseWithTryCatch(invalidInput); // genuinely throws every time
Console.WriteLine($"try/catch, WITH throw (10k iters): {sw.ElapsedMilliseconds}ms");

sw.Restart();
for (var i = 0; i < 1_000_000; i++)
    ParseWithTryParse(invalidInput); // never throws — just returns false
Console.WriteLine($"TryParse (1M iters): {sw.ElapsedMilliseconds}ms");
// The TryParse version, even at 100x the iteration count, is typically
// still faster overall — this is the actual, measurable cost the main
// topic's "exceptions are expensive" guidance is about.`,
    },
    {
      label: 'First-chance exceptions — debugger-visible even when fully handled',
      language: 'csharp',
      code: `// This exception is thrown AND immediately caught — it never escapes,
// never crashes anything, and the program continues normally.
try
{
    throw new InvalidOperationException("Handled immediately");
}
catch (InvalidOperationException)
{
    Console.WriteLine("Caught and handled — program continues fine");
}

// Under an attached debugger (Visual Studio, VS Code, Rider) with
// "break on all exceptions" (Ctrl+Alt+E in VS, enabling the exception
// type) turned on, this line still triggers a FIRST-CHANCE EXCEPTION
// notification and the debugger will break at the "throw" line, even
// though the exception is fully handled a moment later and never
// escapes to the caller.
//
// This is the mechanism behind the main topic's remark that "debuggers
// can break at the throw point when a filter is evaluated" — it is the
// SAME first-chance notification, just also observable via exception
// filters even for exceptions your own code handles perfectly correctly.
// It explains why heavily exception-driven code can feel dramatically
// slower specifically while actively debugging, independent of its
// actual Release-build runtime cost.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate wants to validate 100,000 user-submitted strings as integers in a hot request-processing loop, using <code>try { int.Parse(s); } catch (FormatException) { ... }</code> for each one, where roughly 30% of inputs are expected to be invalid. Explain, using the benchmark reasoning above, why this is a genuinely bad choice here specifically (not exceptions in general).',
    hint: 'The key variable is FREQUENCY combined with HOT PATH — think about how many of the 100,000 calls will actually throw (not just be wrapped in try/catch), and multiply that by the stack-walking cost demonstrated in the benchmarks. Compare that to a rare, one-off exception like a missing config file at startup.',
    solution: `// With ~30% of 100,000 inputs invalid, this loop throws roughly 30,000
// real exceptions — each one paying the stack-walking cost to build a
// stack trace and locate the catch handler, EVERY SINGLE TIME, inside a
// hot request-processing path that presumably runs repeatedly under load.

// This is exactly the scenario the main topic's guidance targets:
// "use exceptions for truly unexpected failures... use Try* methods for
// expected failures." An expected 30% invalid rate is NOT exceptional —
// it is a routine, high-frequency occurrence in a hot path.

// The fix pays no stack-walking cost at all for ANY of the 100,000 calls,
// valid or invalid, because TryParse never throws in either case:
foreach (var s in userSubmittedStrings)
{
    if (int.TryParse(s, out var value))
        Process(value);
    else
        RecordInvalid(s);
}

// Contrast with a genuinely appropriate use of try/catch: a config file
// missing ONCE at application startup. Even if that throw is deep in a
// call stack, it happens once, at startup, nowhere near a hot path — the
// stack-walking cost is completely irrelevant at that frequency. The
// guidance is about FREQUENCY in a HOT PATH, not about avoiding
// try/catch universally.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main cost of throwing an exception is allocating the exception object itself, similar to allocating any other object on the heap.',
      reality: 'the dominant cost is the CLR walking the call stack — frame by frame — to build the stack trace and locate a matching catch handler. This cost scales with how many stack frames exist between the throw site and the catching frame, not with the exception object\'s size.',
    },
    {
      thought: 'wrapping code in a try/catch block has a meaningful runtime cost even when no exception is ever thrown.',
      reality: 'a try block that never throws has effectively zero overhead in modern .NET — the entire measurable cost is concentrated at the moment of an actual throw, not in the mere presence of a try/catch structure around code.',
    },
    {
      thought: 'the "avoid exceptions for control flow" guidance means exceptions should be avoided broadly, even for genuinely rare, one-off failures like a missing config file at startup.',
      reality: 'the guidance specifically targets FREQUENT throws in HOT paths (validation loops, parsers processing many inputs) — a single rare exception, even one thrown from deep in a call stack, has a completely negligible cost at low frequency and is exactly what exceptions are appropriately used for.',
    },
  ];
}
