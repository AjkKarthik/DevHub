import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-csharp-iterators',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './iterators.html',
  styleUrl: './iterators.scss',
})
export class CsharpIterators {

  quickRef: QuickRefItem[] = [
    { name: 'yield return x',        type: 'keyword',   desc: 'Produces the next element and suspends the method until the consumer asks again', since: 'C# 2' },
    { name: 'yield break',           type: 'keyword',   desc: 'Ends the sequence early — like return for iterator methods', since: 'C# 2' },
    { name: 'IEnumerable<T>',        type: 'interface', desc: 'The "can be iterated" contract — exposes GetEnumerator()', since: 'C# 2' },
    { name: 'IEnumerator<T>',        type: 'interface', desc: 'The cursor: Current property + MoveNext() that advances it', since: 'C# 2' },
    { name: 'foreach',               type: 'keyword',   desc: 'Compiler sugar over GetEnumerator()/MoveNext()/Current', since: 'C# 1' },
    { name: 'Deferred execution',    type: 'syntax',    desc: 'Iterator bodies run only when enumerated — defining one executes nothing', since: 'C# 2' },
    { name: '.ToList() / .ToArray()', type: 'method',   desc: 'Materialises a lazy sequence once — snapshot it before reusing', since: 'C# 3' },
    { name: 'IAsyncEnumerable<T>',   type: 'interface', desc: 'The async sibling (await foreach) — covered on the async/await page', since: 'C# 8' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The IEnumerable / IEnumerator contract',
      points: [
        '<code>IEnumerable&lt;T&gt;</code> means "you can ask me for an enumerator". <code>IEnumerator&lt;T&gt;</code> is the cursor: <code>MoveNext()</code> advances, <code>Current</code> reads, and each call to <code>GetEnumerator()</code> hands out an independent cursor.',
        '<code>foreach</code> is pure compiler sugar: it calls <code>GetEnumerator()</code>, loops on <code>MoveNext()</code>, reads <code>Current</code>, and disposes the enumerator in a hidden finally block.',
        'Before C# 2 you wrote enumerator classes by hand — fields tracking position, a state flag, MoveNext logic. <code>yield</code> made the compiler write that class for you.',
      ],
    },
    {
      heading: 'yield return — the compiler builds a state machine',
      points: [
        'A method containing <code>yield return</code> does not run when called. The compiler rewrites it into a hidden class implementing both interfaces; calling the method just constructs that object.',
        'Each <code>MoveNext()</code> resumes the method body exactly where it left off, runs until the next <code>yield return</code>, stores the value in <code>Current</code>, and suspends again. Locals become fields on the state machine so they survive between calls.',
        '<code>yield break</code> ends the sequence; falling off the end of the method does the same.',
        'This is the same transformation idea as async/await — both turn one method into a resumable state machine.',
      ],
    },
    {
      heading: 'Laziness, deferred execution — and the multiple-enumeration trap',
      points: [
        'Because nothing runs until enumeration, iterators compose for free: <code>Where</code> and <code>Select</code> are iterators chained together, each element flowing through the whole pipe one at a time. This is exactly how LINQ-to-Objects works.',
        'Laziness enables infinite sequences (<code>Fibonacci().Take(10)</code>) and streaming over huge files without loading them into memory.',
        '<strong>The classic trap:</strong> enumerating the same IEnumerable twice runs the whole pipeline twice — twice the work, and twice the side effects (two database queries!). If you need the data more than once, materialise with <code>.ToList()</code>.',
        'Exceptions inside an iterator body also surface lazily — at the first <code>MoveNext()</code>, not at the call site. Validate arguments in a non-iterator wrapper method that returns the iterator.',
      ],
    },
    {
      heading: 'Patterns: paging, infinite sequences, tree traversal',
      points: [
        'Paging: yield items page by page from an API and the consumer can stop pulling whenever it has enough — remaining pages are never fetched.',
        'Tree traversal: recursive iterators flatten hierarchies elegantly — <code>foreach (var n in Walk(child)) yield return n;</code>.',
        '<code>yield return</code> inside <code>try</code> is allowed only with <code>finally</code> (not <code>catch</code>) — the finally runs when the enumerator is disposed, which is how <code>foreach</code> guarantees cleanup even if the consumer stops early.',
        'For asynchronous streams (<code>IAsyncEnumerable&lt;T&gt;</code>, <code>await foreach</code>) see the <strong>async / await</strong> page — same mental model, awaitable MoveNext.',
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
// 0
// 2
// 4
// 6
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
}`,
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
var firstErrors = ErrorLines("app.log").Take(5).ToList();`,
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

// Note: nested Walk() is O(depth²) on deep trees — for very deep
// hierarchies use an explicit Stack<T> instead of recursion.`,
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
    if (size <= 0)                       // ❌ throws at first MoveNext,
        throw new ArgumentOutOfRangeException(nameof(size)); // not at call!
    for (int i = 0; i < source.Length; i += size)
        yield return source[i];
}

// ✅ Split: eager wrapper validates, private iterator yields
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
}`,
    },
  ];

  challenge: Challenge = {
    title: 'Sliding Window Iterator',
    language: 'csharp',
    description: 'Write an extension method `SlidingWindow<T>(this IEnumerable<T> source, int size)` that lazily yields arrays of consecutive elements: [1,2,3,4] with size 2 → [1,2], [2,3], [3,4]. It must validate `size` eagerly (immediately on call, not on first enumeration), stream the source only once, and yield nothing if the source has fewer elements than `size`.',
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
        ArgumentNullException.ThrowIfNull(source);          // eager —
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(size); // at call site

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
      explanation: 'Calling an iterator method only constructs the compiler-generated state machine. The body runs incrementally, one yield at a time, driven by MoveNext() — whether that comes from foreach, ToList() or LINQ.',
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
      explanation: 'IEnumerable is a recipe, not a result. Each enumeration re-runs the whole chain — including database calls or file reads inside it. Materialise with ToList()/ToArray() when you need the data more than once.',
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
      explanation: 'The whole body — validation included — is deferred into MoveNext(). Callers get the exception far from the buggy call. The fix: a normal wrapper method validates immediately and returns a private iterator.',
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
      explanation: 'yield return may sit in a try with a finally (the finally runs when the enumerator is disposed — even on early exit from foreach), but not in a try with a catch, because resuming into a catch context is not representable.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does foreach actually work under the hood?',
      a: 'The compiler expands it to <code>var e = source.GetEnumerator();</code> then a <code>while (e.MoveNext())</code> loop reading <code>e.Current</code>, all wrapped in <code>try/finally</code> that disposes the enumerator. That dispose call is what triggers <code>finally</code> blocks inside iterator methods even when the consumer breaks early.',
    },
    {
      q: 'What does the compiler generate for a yield method?',
      a: 'A hidden class implementing both <code>IEnumerable&lt;T&gt;</code> and <code>IEnumerator&lt;T&gt;</code>. Your locals become its fields, and a state integer records where execution paused. <code>MoveNext()</code> is one big switch on that state that resumes after the last yield. You can see it on sharplab.io.',
    },
    {
      q: 'Is yield related to how LINQ works?',
      a: 'Directly — LINQ-to-Objects operators like Where and Select are iterator methods. Chaining them nests state machines, so each element streams through the whole pipeline one at a time. That is why LINQ is lazy and why order of operations (filter before project) matters for performance.',
    },
    {
      q: 'When should I NOT use an iterator?',
      a: 'When the data is small and reused (just return a List), when consumers will enumerate repeatedly (materialise once instead), when you need a count or random access (lazy sequences must be walked), or when side-effect timing must be predictable — laziness makes "when does this run" harder to reason about.',
    },
    {
      q: 'What is the difference between IEnumerable and IEnumerator?',
      a: '<code>IEnumerable</code> is the collection-like thing you can iterate ("give me a cursor"); <code>IEnumerator</code> is the cursor itself (position + MoveNext + Current). One enumerable can hand out many independent enumerators — that is why two simultaneous foreach loops over the same list do not interfere.',
    },
    {
      q: 'How do async streams relate to iterators?',
      a: '<code>IAsyncEnumerable&lt;T&gt;</code> is the same idea with an awaitable cursor: <code>await foreach</code> calls <code>MoveNextAsync()</code>, and the method combines <code>yield return</code> with <code>await</code>. The full treatment — cancellation, ConfigureAwait — is on the <strong>async / await</strong> page.',
    },
  ];
}
