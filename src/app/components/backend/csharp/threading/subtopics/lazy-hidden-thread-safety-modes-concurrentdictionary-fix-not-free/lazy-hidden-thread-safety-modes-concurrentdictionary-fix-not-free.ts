import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-lazy-hidden-thread-safety-modes-concurrentdictionary-fix-not-free-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './lazy-hidden-thread-safety-modes-concurrentdictionary-fix-not-free.html',
  styleUrl: './lazy-hidden-thread-safety-modes-concurrentdictionary-fix-not-free.scss',
})
export class LazyHiddenThreadSafetyModesConcurrentdictionaryFixNotFreeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own fix for GetOrAdd is "wrap it in Lazy<T>" — but Lazy<T> itself has a hidden thread-safety cost',
      points: [
        'The main Threading page\'s Common Mistakes section fixes <code>ConcurrentDictionary.GetOrAdd</code> re-running an expensive factory under contention by wrapping the value in <code>Lazy&lt;T&gt;</code> — "Lazy guarantees the factory runs exactly once." That guarantee is real, but it is not free: by DEFAULT, <code>Lazy&lt;T&gt;</code> itself uses internal LOCKING to enforce it, meaning the fix trades "factory might run twice" for "every access to <code>.Value</code> may briefly synchronize," a different (usually smaller, but real) cost the main page does not mention.',
      ],
    },
    {
      heading: 'Lazy<T> actually has THREE distinct thread-safety modes, controlled by LazyThreadSafetyMode',
      points: [
        '<code>LazyThreadSafetyMode.ExecutionAndPublication</code> (the DEFAULT when using <code>new Lazy&lt;T&gt;(factory)</code>) uses an internal lock: only ONE thread ever runs the factory, and all other threads calling <code>.Value</code> concurrently BLOCK until that thread finishes — the strongest guarantee, at the cost of contention if many threads race to initialize simultaneously.',
        '<code>LazyThreadSafetyMode.PublicationOnly</code> allows the factory to run on MULTIPLE threads concurrently if they race (exactly like <code>ConcurrentDictionary.GetOrAdd</code>\'s own factory can), but guarantees only the FIRST completed result is ever published and returned to every caller — the others are discarded. This is a closer analogue to <code>GetOrAdd</code>\'s own behavior, just centralized in <code>Lazy&lt;T&gt;</code> instead.',
        '<code>LazyThreadSafetyMode.None</code> provides NO thread-safety at all — calling <code>.Value</code> from multiple threads simultaneously is a genuine race condition, appropriate only when the <code>Lazy&lt;T&gt;</code> instance itself is guaranteed to be accessed from a single thread.',
      ],
    },
    {
      heading: 'The main page\'s own fix implicitly chose ExecutionAndPublication — which may not always be the right trade-off',
      points: [
        'The main page\'s <code>db.GetOrAdd(tenantId, id => new Lazy&lt;Connection&gt;(() =&gt; new Connection(connectionString)))</code> pattern, using the default <code>Lazy&lt;T&gt;</code> constructor, implicitly opts into <code>ExecutionAndPublication</code> — genuinely the RIGHT choice there, since creating a duplicate <code>Connection</code> is exactly the expensive, side-effect-bearing work the fix exists to prevent.',
        'But if the wrapped factory were CHEAP and side-effect-free (e.g. computing a simple derived value), <code>PublicationOnly</code> could be a better trade-off — it avoids the internal lock\'s contention entirely, accepting that the factory might occasionally run more than once in exchange for never blocking a thread waiting on another thread\'s in-progress initialization. Choosing <code>ExecutionAndPublication</code> reflexively for every <code>Lazy&lt;T&gt;</code>, regardless of whether the factory is actually expensive or side-effecting, is a missed optimization opportunity in the cheap-factory case.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own fix — implicitly ExecutionAndPublication (the default)',
      language: 'csharp',
      code: `var db = new ConcurrentDictionary<int, Lazy<Connection>>();

// Default Lazy<T> constructor — LazyThreadSafetyMode.ExecutionAndPublication:
Lazy<Connection> lazy = db.GetOrAdd(tenantId, id =>
    new Lazy<Connection>(() => new Connection(connectionString)));

Connection conn = lazy.Value;
// Guarantee: the Connection constructor runs EXACTLY ONCE per key,
// even if multiple threads call .Value concurrently — other threads
// BLOCK on an internal lock until the first caller's factory finishes.
// This is exactly right here, since creating a duplicate Connection
// would be the expensive, wasteful outcome the fix exists to avoid.`,
    },
    {
      label: 'Explicitly choosing PublicationOnly — a closer analogue to GetOrAdd\'s own default behavior',
      language: 'csharp',
      code: `var cache = new ConcurrentDictionary<string, Lazy<int>>();

// PublicationOnly: the factory MAY run on multiple threads concurrently
// under contention (same risk profile as raw GetOrAdd), but only the
// FIRST completed result is ever published — appropriate when the
// factory is CHEAP and has no meaningful side effects:
Lazy<int> lazy = cache.GetOrAdd("key", _ =>
    new Lazy<int>(() => ComputeCheapDerivedValue(), LazyThreadSafetyMode.PublicationOnly));

int value = lazy.Value;
// No internal lock contention here — if two threads race, BOTH may
// run ComputeCheapDerivedValue(), but both end up observing the SAME
// published result afterward; the "wasted" duplicate computation is
// an acceptable trade for never blocking on another thread's progress.

static int ComputeCheapDerivedValue() => 42; // trivial, no side effects`,
    },
    {
      label: 'None — no synchronization at all, only safe for genuinely single-threaded access',
      language: 'csharp',
      code: `// LazyThreadSafetyMode.None — the FASTEST mode, but genuinely unsafe
// if .Value is ever accessed from more than one thread:
var singleThreadCache = new Lazy<ExpensiveObject>(
    () => new ExpensiveObject(),
    LazyThreadSafetyMode.None);

// Safe ONLY if this specific Lazy<T> instance is guaranteed to be
// created and read by a single thread (e.g. a per-request object in
// an async pipeline with no concurrent access to THIS instance) —
// using None inside a ConcurrentDictionary value that MULTIPLE
// threads can reach concurrently is a genuine, unguarded race
// condition, exactly as if Lazy<T> were never used at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A <code>ConcurrentDictionary&lt;string, Lazy&lt;List&lt;int&gt;&gt;&gt;</code> caches the result of a CHEAP, pure computation (sorting a small in-memory list, no I/O, no allocation of external resources). Which <code>LazyThreadSafetyMode</code> is the better fit, and why?',
    hint: 'Consider the trade-off: ExecutionAndPublication guarantees single execution but pays an internal lock cost on every access; PublicationOnly avoids that lock at the cost of occasionally running the factory more than once. For a cheap, side-effect-free factory, which cost matters less?',
    solution: `var cache = new ConcurrentDictionary<string, Lazy<List<int>>>();

// PublicationOnly is the better fit here:
Lazy<List<int>> lazy = cache.GetOrAdd(key, _ =>
    new Lazy<List<int>>(
        () => ComputeSortedList(key),
        LazyThreadSafetyMode.PublicationOnly));

List<int> result = lazy.Value;

// Reasoning: because the factory (sorting a small list) is cheap and
// has NO side effects (no external resource created, nothing to
// "waste" if it runs twice), the risk PublicationOnly accepts —
// occasionally running the factory redundantly on multiple threads
// under contention — costs almost nothing. In exchange, it avoids
// ExecutionAndPublication's internal lock entirely, which would
// otherwise make every concurrent .Value access briefly serialize
// even though the underlying work is trivial. If the factory instead
// created a genuinely expensive or side-effect-bearing resource (a
// database connection, a file handle), ExecutionAndPublication would
// be the correct choice instead — exactly as the main topic page's
// own Connection example demonstrates.

static List<int> ComputeSortedList(string key) => new List<int> { 3, 1, 2 };`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'wrapping a ConcurrentDictionary value in Lazy<T> is a free fix for the "factory runs more than once" problem, with no trade-offs of its own.',
      reality: 'the DEFAULT Lazy<T> mode (ExecutionAndPublication) uses an internal lock to guarantee single execution — this trades "factory might run twice" for "every .Value access may briefly synchronize," a real cost worth knowing about, not a free lunch.',
    },
    {
      thought: 'Lazy<T> only has one thread-safety behavior — the one everyone assumes it has by default.',
      reality: 'Lazy<T> supports three distinct LazyThreadSafetyMode values — ExecutionAndPublication (default, locked, single execution), PublicationOnly (unlocked, may run multiple times, only first result published), and None (no synchronization at all) — each suited to a different trade-off.',
    },
    {
      thought: 'ExecutionAndPublication is always the safest and therefore always the best choice for any Lazy<T> used in a concurrent context.',
      reality: 'for a cheap, side-effect-free factory, PublicationOnly can be strictly better — it avoids the internal lock\'s contention entirely, accepting an occasional redundant computation in exchange for never blocking one thread on another\'s in-progress initialization.',
    },
  ];
}
