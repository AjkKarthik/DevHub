import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-csharp-iterators',
  standalone: true,
  imports: [
    CommonModule,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './iterators.html',
  styleUrl: './iterators.scss',
})
export class CsharpIterators {

  prerequisites: Prerequisite[] = [
    { label: 'Generics',       route: '/csharp/generics' },
    { label: 'Async / Await',  route: '/csharp/async' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'yield return x',         type: 'keyword',   desc: 'Produces the next element and suspends the method until the consumer asks again', since: 'C# 2' },
    { name: 'yield break',            type: 'keyword',   desc: 'Ends the sequence early — like return for iterator methods', since: 'C# 2' },
    { name: 'IEnumerable<T>',         type: 'interface', desc: 'The "can be iterated" contract — exposes GetEnumerator()', since: 'C# 2' },
    { name: 'IEnumerator<T>',         type: 'interface', desc: 'The cursor: Current property + MoveNext() that advances it', since: 'C# 2' },
    { name: 'foreach',                type: 'keyword',   desc: 'Compiler sugar over GetEnumerator()/MoveNext()/Current — always disposes in a finally', since: 'C# 1' },
    { name: 'Deferred execution',     type: 'syntax',    desc: 'Iterator bodies run only when enumerated — defining one executes nothing', since: 'C# 2' },
    { name: '.ToList() / .ToArray()', type: 'method',    desc: 'Materialises a lazy sequence once — snapshot it before reusing', since: 'C# 3' },
    { name: 'IAsyncEnumerable<T>',    type: 'interface', desc: 'Async sibling — awaitable MoveNextAsync(), consumed with await foreach', since: 'C# 8' },
    { name: 'await foreach',          type: 'keyword',   desc: 'Asynchronously consumes IAsyncEnumerable<T> with CancellationToken support', since: 'C# 8' },
    { name: 'EnumeratorCancellation', type: 'type',      desc: '[EnumeratorCancellation] marks the CancellationToken parameter for compiler-generated plumbing', since: 'C# 8' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The IEnumerable / IEnumerator contract',
      points: [
        '<code>IEnumerable&lt;T&gt;</code> means "you can ask me for an enumerator". <code>IEnumerator&lt;T&gt;</code> is the cursor: <code>MoveNext()</code> advances, <code>Current</code> reads, and each call to <code>GetEnumerator()</code> hands out an independent cursor.',
        '<code>foreach</code> is pure compiler sugar: it calls <code>GetEnumerator()</code>, loops on <code>MoveNext()</code>, reads <code>Current</code>, and disposes the enumerator in a hidden finally block. That dispose call is essential — it triggers cleanup even on early exit.',
        'Before C# 2 you wrote enumerator classes by hand — fields tracking position, a state flag, MoveNext logic. <code>yield</code> made the compiler write that class for you, eliminating hundreds of lines of boilerplate.',
        'Any type with a <code>GetEnumerator()</code> method that returns something with <code>MoveNext()</code> and <code>Current</code> works with <code>foreach</code> — the compiler uses duck typing, not interface checking, so you can make custom types iterable without implementing the full interface.',
        '<code>IEnumerable</code> is a recipe, not a result. Calling <code>GetEnumerator()</code> can produce a new cursor each time — that is how multiple <code>foreach</code> loops over the same list run independently without interfering.',
      ],
    },
    {
      heading: 'yield return — the compiler builds a state machine',
      points: [
        'A method containing <code>yield return</code> does not run when called. The compiler rewrites it into a hidden class implementing both <code>IEnumerable&lt;T&gt;</code> and <code>IEnumerator&lt;T&gt;</code>; calling the method just constructs that object.',
        'Each <code>MoveNext()</code> call resumes the method body exactly where it left off, runs until the next <code>yield return</code>, stores the value in <code>Current</code>, and suspends again. Locals become fields on the state machine so they survive between calls.',
        '<code>yield break</code> ends the sequence, causing <code>MoveNext()</code> to return <code>false</code>. Falling off the end of the method implicitly does the same — both trigger the enumerator\'s <code>Dispose()</code>.',
        'This is the same transformation idea as <code>async</code>/<code>await</code> — both compile a method with suspension points into a resumable state-machine class. You can inspect the generated IL on sharplab.io to see the state integer and the switch-based <code>MoveNext()</code>.',
        '<code>yield return</code> inside a <code>try/finally</code> block is permitted. The <code>finally</code> runs when the enumerator is disposed — even if the consumer exits <code>foreach</code> early via <code>break</code>, <code>return</code>, or an exception. This is the mechanism behind safe resource cleanup in streaming iterators.',
      ],
    },
    {
      heading: 'Laziness, deferred execution, and the multiple-enumeration trap',
      points: [
        'Because nothing runs until enumeration, iterators compose for free: <code>Where</code> and <code>Select</code> are iterators chained together. Each element flows through the whole pipeline one at a time — this is how LINQ-to-Objects achieves zero intermediate allocation.',
        'Laziness enables infinite sequences (<code>Fibonacci().Take(10)</code>) and streaming over huge files without loading them into memory. The consumer controls how many elements it pulls.',
        '<strong>The classic trap:</strong> enumerating the same <code>IEnumerable</code> twice runs the whole pipeline twice — twice the work, and twice the side effects (two database round-trips, two file reads). If you need the data more than once, materialise with <code>.ToList()</code> or <code>.ToArray()</code>.',
        'Exceptions inside an iterator body also surface lazily — the validation code inside the iterator runs on the first <code>MoveNext()</code>, not at the call site. This makes argument errors confusingly distant from the buggy call. Fix: use a public eager wrapper that validates, then delegates to a private iterator.',
        'When debugging, remember that stepping into a LINQ chain does not immediately execute code — you are stepping through state-machine setup, not the actual work. The work happens when you iterate or call <code>ToList()</code>.',
      ],
    },
    {
      heading: 'Practical patterns — paging, trees, and validation wrappers',
      points: [
        '<strong>Paging:</strong> yield items page by page from an API and the consumer can stop pulling whenever it has enough — remaining pages are never fetched. Combine with <code>Take(n)</code> to stop early.',
        '<strong>Tree traversal:</strong> recursive iterators flatten hierarchies elegantly: <code>foreach (var n in Walk(child)) yield return n;</code>. Note that nested <code>foreach+yield</code> is O(depth²) on the call stack for very deep trees; an explicit <code>Stack&lt;T&gt;</code> is more efficient.',
        '<strong>Validation wrapper pattern:</strong> a public non-iterator method validates eagerly and returns a private iterator. The compiler creates a state machine for the private method, while the public method runs its validation immediately at call time.',
        '<strong>Streaming I/O:</strong> <code>File.ReadLines(path)</code> is itself a lazy iterator. Compose it with <code>Where</code>/<code>Select</code> to process gigabyte logs with constant memory — each line is loaded, processed, and discarded before the next is read.',
        '<strong>Coroutine-style generators:</strong> iterators can be used as lightweight coroutines in single-threaded scenarios — the producer and consumer take turns running, with each <code>MoveNext()</code> acting as a handoff.',
      ],
    },
    {
      heading: 'IAsyncEnumerable<T> and await foreach',
      points: [
        '<code>IAsyncEnumerable&lt;T&gt;</code> is the async counterpart: <code>MoveNextAsync()</code> is awaitable. Use it when producing items involves I/O — database cursors, HTTP streams, message queues — so the thread is free while waiting.',
        'Mark the method <code>async IAsyncEnumerable&lt;T&gt;</code> and combine <code>await</code> with <code>yield return</code>. The compiler generates a state machine that handles both async suspension and iterator suspension.',
        'Always accept a <code>CancellationToken</code> parameter marked with <code>[EnumeratorCancellation]</code> so callers can cancel mid-stream: <code>await foreach (var item in Produce(ct)) { ... }</code>.',
        'Pass <code>.WithCancellation(ct)</code> on the consumer side to hook a cancellation token into an existing async stream that you don\'t control: <code>await foreach (var x in source.WithCancellation(ct))</code>.',
        'EF Core\'s <code>ToAsyncEnumerable()</code> / <code>AsAsyncEnumerable()</code> returns <code>IAsyncEnumerable&lt;T&gt;</code>, letting you stream query results row-by-row and start processing before the full result set is returned from the database.',
      ],
    },
    {
      heading: 'Performance and when to choose alternatives',
      points: [
        'Iterator methods have near-zero overhead per-element once the state machine is constructed — the JIT can inline simple cases. The main cost is the initial allocation of the state machine class (one allocation per call, not per element).',
        'For scenarios that avoid allocations on even that one class, structs can implement the enumerator interface. The <code>List&lt;T&gt;</code> enumerator is a value type for this reason — no heap allocation when you <code>foreach</code> over a list.',
        'Do not use iterators when you need random access, a known count without enumeration, or in-place mutation of elements — <code>IEnumerable</code> is forward-only and read-only. Use <code>IList&lt;T&gt;</code> or <code>Span&lt;T&gt;</code> instead.',
        'LINQ\'s <code>Aggregate</code>, <code>Sum</code>, <code>Min</code>, and <code>Max</code> operators enumerate once and terminate — they are fine on large lazy sequences. But <code>Count()</code> on a lazy sequence walks all elements; if you need the count, materialise first or use a type that knows its own length.',
        'Source generators and <code>IEnumerable</code> compose well: <code>System.Text.Json</code>\'s streaming <code>JsonSerializer.DeserializeAsyncEnumerable&lt;T&gt;</code> produces an <code>IAsyncEnumerable</code> that yields deserialized objects as bytes arrive over the network — ideal for large JSON arrays.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'yield basics',
      language: 'csharp',
      code: `// Calling this runs NOTHING — it just builds the state machine.
static IEnumerable<int> Evens(int max)
{
    Console.WriteLine("Iterator started");      // runs on first MoveNext()
    for (int i = 0; i <= max; i += 2)
        yield return i;                          // suspend here each time
    Console.WriteLine("Iterator finished");
}

var seq = Evens(6);              // nothing printed yet — deferred!
Console.WriteLine("Before loop");

foreach (var n in seq)
    Console.WriteLine(n);

// Output:
// Before loop
// Iterator started
// 0  2  4  6
// Iterator finished

// yield break ends early:
static IEnumerable<string> FirstWords(string text, int count)
{
    int seen = 0;
    foreach (var w in text.Split(' '))
    {
        if (seen++ == count) yield break;
        yield return w;
    }
}

// Custom type with duck-typed GetEnumerator (no interface needed!):
public class Range
{
    public int Start, End;
    public RangeEnumerator GetEnumerator() => new(Start, End);

    public struct RangeEnumerator
    {
        int _current, _end;
        public RangeEnumerator(int s, int e) { _current = s - 1; _end = e; }
        public int Current => _current;
        public bool MoveNext() => ++_current <= _end;
    }
}
foreach (int i in new Range { Start = 1, End = 5 })
    Console.Write(i + " ");  // 1 2 3 4 5`,
    },
    {
      label: 'Infinite + streaming',
      language: 'csharp',
      code: `// Infinite sequence — safe because consumers pull lazily
static IEnumerable<long> Fibonacci()
{
    long a = 0, b = 1;
    while (true)
    {
        yield return a;
        (a, b) = (b, a + b);
    }
}

var firstTen = Fibonacci().Take(10).ToList();
// 0 1 1 2 3 5 8 13 21 34 — the while(true) never spins forever

// Streaming a huge file — one line in memory at a time
static IEnumerable<string> ErrorLines(string path)
{
    foreach (var line in File.ReadLines(path))   // ReadLines is itself lazy
        if (line.Contains("[ERROR]"))
            yield return line;
}

// Only reads until it finds 5 errors, then stops reading the file:
var firstErrors = ErrorLines("app.log").Take(5).ToList();

// Streaming API pager — fetches only until the consumer stops
static async IAsyncEnumerable<Order> AllOrders(HttpClient http, string url)
{
    int page = 1;
    while (true)
    {
        var batch = await http.GetFromJsonAsync<List<Order>>($"{url}?page={page++}");
        if (batch is null || batch.Count == 0) yield break;
        foreach (var o in batch) yield return o;
    }
}

// Consumer stops after first 20 — remaining pages never fetched
await foreach (var order in AllOrders(client, "/api/orders").Take(20))
    Process(order);`,
    },
    {
      label: 'Recursive tree walk',
      language: 'csharp',
      code: `public record Category(string Name, List<Category> Children);

// Depth-first traversal — recursion + yield flattens the tree
static IEnumerable<Category> Walk(Category node)
{
    yield return node;
    foreach (var child in node.Children)
        foreach (var descendant in Walk(child))
            yield return descendant;
}

var root = new Category("All", [
    new("Electronics", [ new("Phones", []), new("Laptops", []) ]),
    new("Books", [ new("Fiction", []) ]),
]);

foreach (var c in Walk(root))
    Console.WriteLine(c.Name);
// All, Electronics, Phones, Laptops, Books, Fiction

// For VERY deep trees, avoid stack overflow with an explicit Stack<T>:
static IEnumerable<Category> WalkIterative(Category root)
{
    var stack = new Stack<Category>();
    stack.Push(root);
    while (stack.Count > 0)
    {
        var node = stack.Pop();
        yield return node;
        foreach (var child in node.Children.AsEnumerable().Reverse())
            stack.Push(child);  // push in reverse so left children are processed first
    }
}`,
    },
    {
      label: 'Traps & validation',
      language: 'csharp',
      code: `// TRAP 1: multiple enumeration — pipeline runs per enumeration
var expensive = Orders().Where(o => Lookup(o));  // Lookup hits the DB
var count = expensive.Count();   // full pass #1 (all the lookups!)
var first = expensive.First();   // pass #2 starts the lookups AGAIN
var safe  = expensive.ToList();  // materialise once, reuse freely

// TRAP 2: lazy argument validation
static IEnumerable<int> Chunk(int[] source, int size)
{
    if (size <= 0)
        throw new ArgumentOutOfRangeException(nameof(size)); // deferred! not immediate
    for (int i = 0; i < source.Length; i += size)
        yield return source[i];
}

// FIX: eager wrapper validates, private iterator yields
static IEnumerable<int> ChunkSafe(int[] source, int size)
{
    ArgumentOutOfRangeException.ThrowIfNegativeOrZero(size); // immediate
    return Core(source, size);

    static IEnumerable<int> Core(int[] src, int sz)
    {
        for (int i = 0; i < src.Length; i += sz)
            yield return src[i];
    }
}

// TRAP 3: try/finally — finally runs on dispose (early exit included)
static IEnumerable<string> ReadRows(string path)
{
    using var reader = new StreamReader(path);   // disposed even if the
    string? line;                                 // consumer breaks early
    while ((line = reader.ReadLine()) is not null)
        yield return line;
}

// TRAP 4: yield inside try/catch is NOT allowed
static IEnumerable<int> TryCatchBad(int[] source)
{
    foreach (var x in source)
    {
        try { yield return Parse(x); }
        catch { /* COMPILE ERROR — yield in catch is not supported */ }
    }
}
// Fix: materialise the parse result before yielding
static IEnumerable<int?> TryCatchFix(int[] source)
{
    foreach (var x in source)
    {
        int? result;
        try { result = Parse(x); } catch { result = null; }
        yield return result;
    }
}`,
    },
    {
      label: 'IAsyncEnumerable',
      language: 'csharp',
      code: `// ── Producing an async stream ─────────────────────────────────────────
static async IAsyncEnumerable<int> FetchBatchesAsync(
    string url,
    [EnumeratorCancellation] CancellationToken ct = default)
{
    var page = 1;
    while (true)
    {
        ct.ThrowIfCancellationRequested();
        var items = await FetchPage(url, page++, ct);
        if (items.Count == 0) yield break;
        foreach (var item in items)
            yield return item;
    }
}

// ── Consuming with await foreach ──────────────────────────────────────
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));

await foreach (var item in FetchBatchesAsync("/api/data", cts.Token))
{
    Process(item);
}

// ── ConfigureAwait on async streams ──────────────────────────────────
await foreach (var item in FetchBatchesAsync("/api/data")
    .WithCancellation(cts.Token)
    .ConfigureAwait(false))
{
    Process(item);
}

// ── EF Core streaming query ───────────────────────────────────────────
await foreach (var order in dbContext.Orders
    .Where(o => o.Status == "Pending")
    .AsAsyncEnumerable()
    .WithCancellation(ct))
{
    await ProcessOrderAsync(order);
}

// ── Collecting async stream when you need all results ─────────────────
List<int> results = await FetchBatchesAsync("/api/data").ToListAsync(ct);
// System.Linq.Async (NuGet: System.Interactive.Async) provides ToListAsync`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Enumerating the same IEnumerable twice',
      wrong: `IEnumerable<Order> orders = GetOrdersFromDb(); // hits DB lazily
int count = orders.Count();   // DB round-trip #1
var first = orders.First();   // DB round-trip #2!`,
      right: `List<Order> orders = GetOrdersFromDb().ToList(); // one DB round-trip
int count = orders.Count;    // O(1), no re-query
var first = orders[0];       // instant`,
      explanation: 'IEnumerable is a recipe, not a cached result. Every enumeration re-runs the whole pipeline including any I/O or expensive computation. Materialise with ToList() or ToArray() whenever you need the data more than once.',
    },
    {
      title: 'Putting argument validation directly in an iterator method',
      wrong: `static IEnumerable<int> Take(int[] source, int n)
{
    if (n < 0) throw new ArgumentException("n must be >= 0"); // deferred!
    for (int i = 0; i < n; i++) yield return source[i];
}
// The exception fires at first MoveNext(), not at the call site`,
      right: `static IEnumerable<int> Take(int[] source, int n)
{
    ArgumentOutOfRangeException.ThrowIfNegative(n); // immediate
    return Core(source, n);
    static IEnumerable<int> Core(int[] s, int n) {
        for (int i = 0; i < n; i++) yield return s[i];
    }
}`,
      explanation: 'Iterator method bodies are deferred — all code runs at first MoveNext(), not when the method is called. Validation exceptions therefore appear far from the buggy call site, making debugging confusing. Use a public eager wrapper + private iterator pattern to validate immediately.',
    },
    {
      title: 'Using yield return inside a try/catch block',
      wrong: `static IEnumerable<int> Parse(string[] inputs)
{
    foreach (var s in inputs)
    {
        try { yield return int.Parse(s); }
        catch (FormatException) { /* skip */ }  // COMPILE ERROR
    }
}`,
      right: `static IEnumerable<int?> Parse(string[] inputs)
{
    foreach (var s in inputs)
    {
        int? val;
        try { val = int.Parse(s); } catch { val = null; }
        yield return val; // yield is outside the try/catch
    }
}`,
      explanation: 'yield return is not allowed inside a try/catch block — the compiler cannot represent resuming into a catch handler. yield return inside try/finally is fine. The fix is to perform the risky operation and capture the result before yielding outside the catch.',
    },
    {
      title: 'Forgetting that foreach disposes the enumerator on early exit',
      wrong: `// Resource allocated inside the iterator but assuming it stays alive
var lines = ReadLines("huge.log"); // StreamReader created lazily
var first = lines.First();         // foreach internally: break after first item
// StreamReader IS properly disposed by foreach's hidden finally — this is fine
// But if you store the enumerator manually:
var e = lines.GetEnumerator();
e.MoveNext();
var line = e.Current;
// e is NOT disposed! Resource leaks unless you call e.Dispose()`,
      right: `// Always use foreach or using when manually holding an enumerator
using var e = lines.GetEnumerator();
if (e.MoveNext()) Console.WriteLine(e.Current);
// OR just use First() / Take() via foreach — disposal is automatic`,
      explanation: 'foreach wraps GetEnumerator() in a try/finally that always disposes the enumerator — including on break, return, or exception. When you hold an IEnumerator manually, you are responsible for calling Dispose(). Use a using declaration to ensure cleanup.',
    },
    {
      title: 'Missing [EnumeratorCancellation] on async stream cancellation token',
      wrong: `async IAsyncEnumerable<int> Produce(CancellationToken ct)
{
    // ct is not wired to the compiler-generated plumbing
    // .WithCancellation() on the consumer has no effect
    while (true) { await Task.Delay(100, ct); yield return 1; }
}`,
      right: `async IAsyncEnumerable<int> Produce(
    [EnumeratorCancellation] CancellationToken ct = default)
{
    while (true) { await Task.Delay(100, ct); yield return 1; }
}
// Now consumer can cancel: await foreach (var x in Produce().WithCancellation(cts.Token))`,
      explanation: '[EnumeratorCancellation] tells the compiler to wire the cancellation token from WithCancellation() into the method parameter. Without it, the token passed by the consumer via WithCancellation() is silently ignored and the stream cannot be cancelled externally.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'When does the body of a method containing yield return start executing?',
      options: [
        'Immediately when the method is called',
        'On the first MoveNext() — i.e. when enumeration begins',
        'When the method is JIT-compiled',
        'When .ToList() is called, but not in a foreach',
      ],
      answer: 1,
      explanation: 'Calling an iterator method only constructs the compiler-generated state machine object. The body runs incrementally, one <code>yield</code> at a time, driven by <code>MoveNext()</code> — whether that comes from <code>foreach</code>, <code>ToList()</code>, or a LINQ operator.',
    },
    {
      q: 'What happens if you enumerate the same lazy IEnumerable twice?',
      options: [
        'The second enumeration returns cached results',
        'A runtime exception is thrown',
        'The entire pipeline executes again from scratch, repeating any side effects',
        'Only the first element is recomputed',
      ],
      answer: 2,
      explanation: '<code>IEnumerable</code> is a recipe, not a result. Each enumeration re-runs the whole chain — including database calls or file reads inside it. Materialise with <code>ToList()</code>/<code>ToArray()</code> when you need the data more than once.',
    },
    {
      q: 'Why is putting argument validation directly in an iterator method a bug?',
      options: [
        'Iterators cannot contain throw statements',
        'The exception is thrown lazily at first enumeration instead of at the call site',
        'The compiler removes validation from iterators',
        'It causes the sequence to repeat the first element',
      ],
      answer: 1,
      explanation: 'The whole body — validation included — is deferred into <code>MoveNext()</code>. Callers get the exception far from the buggy call. The fix: a normal wrapper method validates immediately and returns a private iterator.',
    },
    {
      q: 'Which statement about yield inside try blocks is true?',
      options: [
        'yield return is allowed in try/finally but not in try/catch',
        'yield return is allowed anywhere, including catch blocks',
        'yield return cannot appear inside any try block',
        'yield break is forbidden inside finally',
      ],
      answer: 0,
      explanation: '<code>yield return</code> may sit in a <code>try</code> with a <code>finally</code> (the finally runs on enumerator disposal — even on early consumer exit), but not in a <code>try</code> with a <code>catch</code>, because resuming into a catch context is not representable in a state machine.',
    },
    {
      q: 'What does the compiler generate for a method containing yield return?',
      options: [
        'A lambda expression that captures the local variables',
        'A hidden nested class implementing IEnumerable<T> and IEnumerator<T> with a state integer and a MoveNext() switch',
        'An array that is pre-populated when the method is first called',
        'An async Task that produces elements in the background',
      ],
      answer: 1,
      explanation: 'The compiler rewrites the iterator method into a hidden class. Locals become fields; a state integer records the last <code>yield</code> point. <code>MoveNext()</code> is a <code>switch</code> on that state that resumes the code after the last yield. View it on sharplab.io.',
    },
    {
      q: 'What is the purpose of [EnumeratorCancellation] on an async stream parameter?',
      options: [
        'It marks the parameter as optional with a default value of CancellationToken.None',
        'It tells the compiler to wire the token passed via .WithCancellation() into the method parameter',
        'It makes the async stream automatically throw when cancelled',
        'It is required for all CancellationToken parameters in any async method',
      ],
      answer: 1,
      explanation: 'Without <code>[EnumeratorCancellation]</code>, a token provided by the consumer via <code>.WithCancellation(ct)</code> is silently ignored — the stream cannot be cancelled externally. The attribute tells the compiler-generated plumbing to pass the consumer\'s token into the marked parameter.',
    },
    {
      q: 'You have an IEnumerable<string> that reads from a file. What happens when you call .First() on it?',
      options: [
        'The entire file is read into memory, then the first line is returned',
        'A compile error occurs because IEnumerable does not support First()',
        'The file is opened, one line is read and returned, then the enumerator is disposed (closing the file)',
        'Nothing — First() only works on materialised collections',
      ],
      answer: 2,
      explanation: '<code>.First()</code> internally calls <code>GetEnumerator()</code>, then <code>MoveNext()</code> once, reads <code>Current</code>, and disposes the enumerator — which triggers the iterator\'s <code>finally</code> block, closing the file. Only one line is ever read. This is lazy evaluation in action.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does foreach actually work under the hood?',
      a: 'The compiler expands it to <code>var e = source.GetEnumerator();</code> then a <code>while (e.MoveNext())</code> loop reading <code>e.Current</code>, all wrapped in <code>try/finally</code> that disposes the enumerator. That dispose call is what triggers <code>finally</code> blocks inside iterator methods even when the consumer exits early with <code>break</code>, <code>return</code>, or an unhandled exception.',
    },
    {
      q: 'What does the compiler generate for a yield method?',
      a: 'A hidden class implementing both <code>IEnumerable&lt;T&gt;</code> and <code>IEnumerator&lt;T&gt;</code>. Your locals become its fields, and a state integer records where execution paused. <code>MoveNext()</code> is a big switch on that state that resumes after the last yield. It is the same idea as async/await — both are resumable state machines. You can see the generated IL on sharplab.io.',
    },
    {
      q: 'Is yield related to how LINQ works?',
      a: 'Directly — LINQ-to-Objects operators like <code>Where</code> and <code>Select</code> are iterator methods. Chaining them nests state machines, so each element streams through the whole pipeline one at a time. That is why LINQ is lazy, why order of operations matters for performance (filter before project), and why enumerating a LINQ query twice re-runs all the work.',
    },
    {
      q: 'When should I NOT use an iterator?',
      a: '<ul><li>When the data is small and always fully consumed — just return a <code>List</code></li><li>When consumers will enumerate repeatedly — materialise once</li><li>When you need a count or random access — lazy sequences must be walked fully for <code>Count()</code></li><li>When side-effect timing must be predictable — laziness makes "when does this run" harder to reason about</li><li>When the sequence must be modified in place — <code>IEnumerable</code> is read-only and forward-only</li></ul>',
    },
    {
      q: 'What is the difference between IEnumerable and IEnumerator?',
      a: '<code>IEnumerable</code> is the collection-like thing you can iterate ("give me a cursor"). <code>IEnumerator</code> is the cursor itself — it tracks position, exposes <code>Current</code>, and has <code>MoveNext()</code>. One enumerable can hand out many independent enumerators — that is why two simultaneous <code>foreach</code> loops over the same list do not interfere with each other.',
    },
    {
      q: 'How do async streams relate to iterators?',
      a: '<code>IAsyncEnumerable&lt;T&gt;</code> is the same idea with an awaitable cursor: <code>await foreach</code> calls <code>MoveNextAsync()</code>, and the method combines <code>yield return</code> with <code>await</code>. The compiler generates a combined async/iterator state machine. Always mark the <code>CancellationToken</code> parameter with <code>[EnumeratorCancellation]</code> so consumers can cancel via <code>.WithCancellation(ct)</code>.',
    },
    {
      q: 'What is the performance cost of iterator methods?',
      a: 'Each call to an iterator method allocates one state-machine object on the heap (not one per element). The per-element cost of <code>MoveNext()</code> is a switch dispatch — effectively a branch — which is very cheap. For scenarios requiring zero allocation, you can implement <code>IEnumerable</code>/<code>IEnumerator</code> with a struct enumerator (like <code>List&lt;T&gt;</code> does), but the ergonomics are much worse. For most code, the single allocation per sequence is irrelevant.',
    },
  ];

  challenge: Challenge = {
    title: 'Sliding Window Iterator',
    language: 'csharp',
    description: 'Write an extension method <code>SlidingWindow&lt;T&gt;(this IEnumerable&lt;T&gt; source, int size)</code> that lazily yields arrays of consecutive elements: [1,2,3,4] with size 2 → [1,2], [2,3], [3,4]. It must validate <code>size</code> eagerly (immediately on call, not on first enumeration), stream the source only once, and yield nothing if the source has fewer elements than <code>size</code>.',
    hints: [
      'Use the eager-wrapper + private-iterator pattern for validation',
      'Keep a Queue<T> of the last `size` elements while enumerating once',
      'When the queue reaches `size`, yield queue.ToArray() then Dequeue()',
      'foreach over the source exactly once — no Count()/indexing',
    ],
    starterCode: `public static class EnumerableExtensions
{
    public static IEnumerable<T[]> SlidingWindow<T>(
        this IEnumerable<T> source, int size)
    {
        // TODO: eager validation (size >= 1, source not null)
        // TODO: lazily yield windows using a single pass
        throw new NotImplementedException();
    }
}

// new[] { 1, 2, 3, 4 }.SlidingWindow(2)
//   → [1,2], [2,3], [3,4]
// new[] { 1 }.SlidingWindow(3)
//   → (empty)`,
    solution: `public static class EnumerableExtensions
{
    public static IEnumerable<T[]> SlidingWindow<T>(
        this IEnumerable<T> source, int size)
    {
        ArgumentNullException.ThrowIfNull(source);               // eager
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(size); // eager

        return Core(source, size);

        static IEnumerable<T[]> Core(IEnumerable<T> src, int sz)
        {
            var window = new Queue<T>(sz);
            foreach (var item in src)               // single pass
            {
                window.Enqueue(item);
                if (window.Count == sz)
                {
                    yield return window.ToArray();  // snapshot the window
                    window.Dequeue();               // slide forward
                }
            }
            // fewer than sz elements → loop never yielded → empty sequence
        }
    }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Iterator methods compile to state-machine classes that produce elements lazily on each MoveNext() call; IAsyncEnumerable<T> extends this with awaitable MoveNextAsync() for async streaming; double-enumeration and deferred validation are the key pitfalls.',
    mustKnow: [
      'Calling an iterator method constructs a state machine — the body does not run until first <code>MoveNext()</code>',
      '<code>foreach</code> disposes the enumerator in a hidden <code>finally</code>, triggering cleanup even on early exit',
      'Enumerating the same <code>IEnumerable</code> twice re-runs the entire pipeline — materialise with <code>ToList()</code> if reuse is needed',
      'Argument validation in iterators is deferred — use an eager public wrapper + private iterator to validate immediately',
      '<code>yield return</code> is allowed in <code>try/finally</code> but NOT in <code>try/catch</code>',
      '<code>IAsyncEnumerable&lt;T&gt;</code> + <code>await foreach</code> for async data streams; mark <code>CancellationToken</code> with <code>[EnumeratorCancellation]</code>',
      'The per-sequence cost is one heap allocation (the state machine); per-element cost is a single branch — iterators are efficient',
    ],
    interviewFocus: [
      'Why does an iterator method\'s body not run immediately when the method is called?',
      'What is the "multiple enumeration trap" and how do you fix it?',
      'Why is argument validation in an iterator method a bug? What is the fix?',
      'What is IAsyncEnumerable<T>? How does it differ from IEnumerable<T>?',
      'Can you use yield return inside a try/catch? Why or why not?',
    ],
  };
}
