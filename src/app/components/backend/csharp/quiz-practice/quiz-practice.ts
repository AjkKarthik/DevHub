import { Component, signal, computed } from '@angular/core';

interface PracticeQuestion { q: string; options: string[]; answer: number; explanation: string; topic: string; }

type QuizPhase = 'setup' | 'quiz' | 'result';

const QUESTIONS: PracticeQuestion[] = [
  // ── Types ────────────────────────────────────────────────────────────
  {
    q: 'What is the key difference between a struct and a class in C#?',
    options: ['Structs cannot have methods', 'Structs are value types (copied on assignment); classes are reference types', 'Classes cannot implement interfaces', 'Structs support inheritance'],
    answer: 1,
    explanation: 'Structs are value types: assignment copies the data and they typically live inline/on the stack. Classes are reference types: variables hold references to a single heap object. Structs cannot inherit from other structs/classes.',
    topic: 'Types',
  },
  {
    q: 'What does int? denote?',
    options: ['An optional method parameter', 'Nullable<int> — an int that can also be null', 'A pointer to int', 'A nullable reference type annotation'],
    answer: 1,
    explanation: 'int? is shorthand for Nullable<int>, a struct wrapping a value plus a HasValue flag. It lets value types represent "no value", unlike plain int which defaults to 0.',
    topic: 'Types',
  },
  {
    q: 'Given string s = null; what does s?.Length ?? 0 evaluate to?',
    options: ['Throws NullReferenceException', '0', 'null', 'Compile error'],
    answer: 1,
    explanation: 's?.Length short-circuits to null because s is null (yielding int?), and the null-coalescing operator ?? then supplies the fallback 0.',
    topic: 'Types',
  },
  {
    q: 'What is boxing?',
    options: ['Wrapping exceptions', 'Converting a value type to object (or an interface), allocating a heap wrapper', 'Casting between numeric types', 'Encapsulating fields in properties'],
    answer: 1,
    explanation: 'Boxing copies a value type into a heap-allocated object. Unboxing casts it back. Both cost allocations and were a classic reason generics (List<int> vs ArrayList) were introduced.',
    topic: 'Types',
  },
  {
    q: 'Which statement about const vs readonly is correct?',
    options: ['They are interchangeable', 'const is a compile-time constant baked into call sites; readonly is set at runtime in the constructor', 'readonly only works with strings', 'const can be assigned in constructors'],
    answer: 1,
    explanation: 'const values are embedded into consuming assemblies at compile time (recompile needed if changed); readonly fields are assigned at declaration or in a constructor and can differ per instance.',
    topic: 'Types',
  },
  {
    q: 'What does the "as" operator do when the cast fails?',
    options: ['Throws InvalidCastException', 'Returns null', 'Returns default(T)', 'Retries with an implicit conversion'],
    answer: 1,
    explanation: '"as" performs a safe reference/nullable conversion that yields null on failure, whereas a direct cast (T)x throws InvalidCastException. That is why "as" cannot be used with non-nullable value types.',
    topic: 'Types',
  },
  {
    q: 'With nullable reference types enabled, what does string? signify?',
    options: ['A Nullable<string> struct', 'A compile-time annotation that the reference may be null, enabling flow analysis warnings', 'A runtime null check', 'A weak reference'],
    answer: 1,
    explanation: 'For reference types, the ? is metadata + compiler flow analysis only — no runtime wrapper exists. The compiler warns when you dereference a possibly-null value or assign null to a non-nullable reference.',
    topic: 'Types',
  },

  // ── OOP ──────────────────────────────────────────────────────────────
  {
    q: 'What is the difference between virtual/override and new (method hiding)?',
    options: ['No practical difference', 'override participates in runtime polymorphism; new hides the base method, so the call site\'s static type decides which runs', 'new is faster', 'override only works on abstract methods'],
    answer: 1,
    explanation: 'With override, a Base reference to a Derived object calls the derived implementation (virtual dispatch). With new, the base reference still calls the base method — the derived method only runs via a Derived-typed reference.',
    topic: 'OOP',
  },
  {
    q: 'How do records compare for equality?',
    options: ['By reference, like classes', 'Value-based: two records are equal when all their members are equal', 'By GetHashCode only', 'They cannot be compared'],
    answer: 1,
    explanation: 'Records auto-generate Equals, GetHashCode and == based on member values. record Person("Ana", 30) == record Person("Ana", 30) is true even though they are distinct objects.',
    topic: 'OOP',
  },
  {
    q: 'What does the "with" expression do on a record?',
    options: ['Mutates the record in place', 'Creates a shallow copy with specified properties changed', 'Merges two records', 'Casts the record to another type'],
    answer: 1,
    explanation: 'var p2 = p1 with { Age = 31 }; calls the generated clone method and applies the changes — the original is untouched, supporting immutable update patterns.',
    topic: 'OOP',
  },
  {
    q: 'Can an abstract class have constructors and implemented methods?',
    options: ['No, it must be entirely abstract', 'Yes — only abstract members lack bodies; it just cannot be instantiated directly', 'Only static methods', 'Only if it is also sealed'],
    answer: 1,
    explanation: 'Abstract classes mix abstract members (no body, must be overridden) with regular implemented members, fields and constructors that derived classes call via base(...). You just can\'t new one up directly.',
    topic: 'OOP',
  },
  {
    q: 'What does an init-only setter (get; init;) allow?',
    options: ['Setting the property anytime', 'Setting the property only during object initialization (constructor or object initializer), then it is immutable', 'Lazy initialization', 'Setting from derived classes only'],
    answer: 1,
    explanation: 'init setters permit assignment in constructors, object initializers and with-expressions, after which the property is read-only — immutability without constructor boilerplate.',
    topic: 'OOP',
  },
  {
    q: 'What problem do explicit interface implementations solve?',
    options: ['Performance of interface dispatch', 'Two interfaces declaring members with the same signature, or hiding interface members from the public class API', 'Multiple class inheritance', 'Serialization conflicts'],
    answer: 1,
    explanation: 'void IFoo.Do() {} is only callable through an IFoo-typed reference. It disambiguates colliding members from different interfaces and keeps them off the class\'s public surface.',
    topic: 'OOP',
  },
  {
    q: 'What is a C# 12 primary constructor on a class?',
    options: ['The first constructor declared', 'Parameters declared on the class declaration itself, in scope for the whole class body', 'A constructor without parameters', 'A static constructor'],
    answer: 1,
    explanation: 'class Service(ILogger log) { ... } captures the parameters for use in members. Unlike records, a class primary constructor does not generate public properties automatically.',
    topic: 'OOP',
  },

  // ── Generics ─────────────────────────────────────────────────────────
  {
    q: 'What does the constraint "where T : new()" require?',
    options: ['T must be newly defined', 'T must have a public parameterless constructor', 'T must be a reference type', 'T must be instantiated before use'],
    answer: 1,
    explanation: 'new() lets generic code write new T(). It must be the last constraint in the list, and the type argument needs an accessible parameterless constructor.',
    topic: 'Generics',
  },
  {
    q: 'Why does IEnumerable<string> convert to IEnumerable<object>?',
    options: ['Implicit boxing', 'IEnumerable<T> declares T as covariant (out T)', 'string inherits from object so all generics convert', 'The compiler inserts a cast'],
    answer: 1,
    explanation: 'Covariance (out T) allows a generic interface to vary with its type argument when T appears only in output positions. List<string> does NOT convert to List<object> because List<T> is invariant.',
    topic: 'Generics',
  },
  {
    q: 'What does contravariance (in T) enable?',
    options: ['Using Action<object> where Action<string> is expected', 'Using Action<string> where Action<object> is expected', 'Returning derived types', 'Generic math'],
    answer: 0,
    explanation: 'With in T, you can substitute a consumer of a broader type: an Action<object> can safely handle any string, so it converts to Action<string>. T appears only in input positions.',
    topic: 'Generics',
  },
  {
    q: 'What is the value of default(T) when T is int versus string?',
    options: ['null and null', '0 and null', '0 and "" (empty string)', 'Compile error without a constraint'],
    answer: 1,
    explanation: 'default(T) yields the zero-initialized value: 0 for numeric value types, false for bool, null for any reference type. There is no constraint needed.',
    topic: 'Generics',
  },
  {
    q: 'Why can\'t you write "if (obj is T)" and also call arithmetic like a + b on plain unconstrained T?',
    options: ['You can, always', 'Unconstrained T only guarantees object members; operators require constraints such as INumber<T> (.NET 7 generic math)', 'Generics erase types at runtime', 'Arithmetic requires struct types only'],
    answer: 1,
    explanation: 'Unlike Java, .NET generics are reified, but the compiler still only allows members proven by constraints. INumber<T> (static abstract interface members) finally enables a + b in generic code.',
    topic: 'Generics',
  },
  {
    q: 'What is the difference between typeof(List<>) and typeof(List<int>)?',
    options: ['They are equal', 'The first is the open (unbound) generic type definition; the second is a closed constructed type', 'The first is invalid syntax', 'The second is an alias'],
    answer: 1,
    explanation: 'typeof(List<>) returns the generic type definition useful for reflection (MakeGenericType), while typeof(List<int>) is a fully constructed type you can instantiate.',
    topic: 'Generics',
  },

  // ── LINQ ─────────────────────────────────────────────────────────────
  {
    q: 'What does deferred execution mean for a LINQ query?',
    options: ['The query runs on a background thread', 'The query does not execute until enumerated (foreach, ToList, Count, …) and re-executes on each enumeration', 'Results are cached automatically', 'It only applies to databases'],
    answer: 1,
    explanation: 'Where/Select build a lazy pipeline. Nothing runs until you enumerate, and enumerating twice runs it twice — call ToList()/ToArray() to materialize once.',
    topic: 'LINQ',
  },
  {
    q: 'First() vs FirstOrDefault() — what differs on an empty sequence?',
    options: ['Nothing', 'First() throws InvalidOperationException; FirstOrDefault() returns default(T)', 'FirstOrDefault() throws; First() returns null', 'Both return null'],
    answer: 1,
    explanation: 'First() requires at least one element. FirstOrDefault() returns default(T) — null for reference types, 0 for int — and since .NET 6 accepts an explicit fallback value.',
    topic: 'LINQ',
  },
  {
    q: 'What does SelectMany do that Select does not?',
    options: ['Selects multiple properties', 'Flattens a sequence of sequences into one sequence', 'Runs selectors in parallel', 'Removes duplicates'],
    answer: 1,
    explanation: 'orders.Select(o => o.Lines) gives IEnumerable<List<Line>>; SelectMany(o => o.Lines) gives a flat IEnumerable<Line> — the monadic bind/flatMap of LINQ.',
    topic: 'LINQ',
  },
  {
    q: 'What is the difference between Single() and First()?',
    options: ['None', 'Single() throws if the sequence contains more than one matching element; First() just takes the first', 'Single() is faster', 'First() throws on multiple matches'],
    answer: 1,
    explanation: 'Single() asserts uniqueness — it scans for a second match and throws if found, making it the right choice for primary-key style lookups where duplicates indicate a bug.',
    topic: 'LINQ',
  },
  {
    q: 'GroupBy(e => e.Dept) returns what shape?',
    options: ['Dictionary<string, Employee>', 'IEnumerable<IGrouping<string, Employee>> — each group has a Key and is itself enumerable', 'List<List<Employee>>', 'ILookup only'],
    answer: 1,
    explanation: 'Each IGrouping<TKey, TElement> exposes the Key plus the elements in that group, so you can write groups.Select(g => new { g.Key, Count = g.Count() }).',
    topic: 'LINQ',
  },
  {
    q: 'Why can multiple .Where().Select() calls still be efficient on IQueryable (e.g. EF Core)?',
    options: ['They are not — always slow', 'IQueryable composes expression trees that are translated into a single SQL query at enumeration', 'EF caches every row in memory', 'The compiler merges them into one loop'],
    answer: 1,
    explanation: 'IQueryable providers receive the whole expression tree, so chained operators become one SQL statement with WHERE/SELECT clauses — unlike IEnumerable, which executes in memory per element.',
    topic: 'LINQ',
  },
  {
    q: 'What does Aggregate(1, (acc, x) => acc * x) compute over [2,3,4]?',
    options: ['9', '24', '10', '1'],
    answer: 1,
    explanation: 'Aggregate folds the sequence with a seed: ((1*2)*3)*4 = 24. It is LINQ\'s general-purpose reduce.',
    topic: 'LINQ',
  },

  // ── Async ────────────────────────────────────────────────────────────
  {
    q: 'What does the await keyword actually do?',
    options: ['Blocks the thread until the task finishes', 'Asynchronously waits: registers a continuation and returns control to the caller if the task is not complete', 'Starts the task on a new thread', 'Converts a Task to a Thread'],
    answer: 1,
    explanation: 'If the awaited task is already complete, execution continues synchronously. Otherwise the method suspends, the thread is freed, and the rest of the method runs as a continuation when the task completes.',
    topic: 'Async',
  },
  {
    q: 'Why is "async void" discouraged outside event handlers?',
    options: ['It is slower', 'Exceptions cannot be caught by the caller and completion cannot be awaited or observed', 'It blocks the UI thread', 'It allocates more memory'],
    answer: 1,
    explanation: 'async void has no Task to await: callers can\'t know when it finishes, and an unhandled exception is rethrown on the synchronization context, often crashing the process.',
    topic: 'Async',
  },
  {
    q: 'What does Task.WhenAll(t1, t2, t3) give you?',
    options: ['The first result available', 'A task that completes when all complete, with results in order; faults aggregate', 'Runs tasks sequentially', 'Cancels the slowest task'],
    answer: 1,
    explanation: 'WhenAll awaits all tasks concurrently. await returns an array of results in argument order; if any fault, the first exception is thrown (all are on task.Exception.InnerExceptions).',
    topic: 'Async',
  },
  {
    q: 'Why can task.Result or .Wait() deadlock in UI/classic ASP.NET apps?',
    options: ['They corrupt memory', 'They block the context thread that the awaited continuation needs to resume on', 'Tasks cannot be waited twice', 'The GC suspends blocked threads'],
    answer: 1,
    explanation: 'The sync context queues the await continuation back to the captured (UI/request) thread — but that thread is blocked in .Result, so neither side can proceed. Use await all the way, or ConfigureAwait(false) in libraries.',
    topic: 'Async',
  },
  {
    q: 'How does a method support cooperative cancellation?',
    options: ['Catching ThreadAbortException', 'Accepting a CancellationToken, passing it down, and calling ThrowIfCancellationRequested at checkpoints', 'Calling Thread.Interrupt', 'Setting Task.Cancel = true'],
    answer: 1,
    explanation: '.NET cancellation is cooperative: the caller cancels a CancellationTokenSource, and the operation must observe the token (pass it to APIs, poll ThrowIfCancellationRequested), throwing OperationCanceledException.',
    topic: 'Async',
  },
  {
    q: 'When is ValueTask<T> preferable to Task<T>?',
    options: ['Always — it is newer', 'In hot paths where results often complete synchronously (e.g. cache hits), avoiding a Task allocation', 'When you await multiple times', 'For fire-and-forget'],
    answer: 1,
    explanation: 'ValueTask avoids heap allocation for synchronous completions. But it has rules: await it at most once, don\'t .Result before completion, don\'t await concurrently — otherwise stick with Task.',
    topic: 'Async',
  },
  {
    q: 'What does IAsyncEnumerable<T> with "await foreach" provide?',
    options: ['Parallel iteration', 'Streaming async sequences — each MoveNextAsync can await (e.g. reading paginated APIs) instead of buffering everything', 'A faster List<T>', 'Thread-safe enumeration'],
    answer: 1,
    explanation: 'Async streams (C# 8) combine yield return with await, letting consumers process items as they arrive — ideal for paged HTTP results or reading lines from a network stream.',
    topic: 'Async',
  },

  // ── Collections ──────────────────────────────────────────────────────
  {
    q: 'What is the average lookup complexity of Dictionary<TKey,TValue> by key?',
    options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
    answer: 2,
    explanation: 'Dictionary is a hash table: GetHashCode buckets give O(1) average lookups. Degenerate hash collisions or a poor GetHashCode can degrade that, and SortedDictionary is O(log n) instead.',
    topic: 'Collections',
  },
  {
    q: 'Which collection should you use to test membership of many items quickly?',
    options: ['List<T> with Contains', 'HashSet<T>', 'Queue<T>', 'LinkedList<T>'],
    answer: 1,
    explanation: 'HashSet<T>.Contains is O(1) average; List<T>.Contains scans linearly (O(n)). HashSet also gives set operations like UnionWith and IntersectWith.',
    topic: 'Collections',
  },
  {
    q: 'What happens if you add items to a List<T> while foreach-ing over it?',
    options: ['New items are included in the loop', 'InvalidOperationException — collection was modified during enumeration', 'Silent data corruption', 'It works since .NET 8'],
    answer: 1,
    explanation: 'List enumerators track a version stamp and throw when the list changes mid-enumeration. Iterate over a copy (ToList()) or use a for loop with careful index handling.',
    topic: 'Collections',
  },
  {
    q: 'Queue<T> vs Stack<T> — which order do they release items?',
    options: ['Both FIFO', 'Queue is FIFO (Enqueue/Dequeue); Stack is LIFO (Push/Pop)', 'Queue is LIFO; Stack is FIFO', 'Both LIFO'],
    answer: 1,
    explanation: 'Queues serve items in arrival order (breadth-first search, message processing). Stacks serve the most recent first (undo stacks, depth-first search).',
    topic: 'Collections',
  },
  {
    q: 'Why prefer ConcurrentDictionary over Dictionary + lock in multithreaded code?',
    options: ['It is always faster', 'It provides fine-grained, lock-striped thread-safe operations plus atomic helpers like GetOrAdd/AddOrUpdate', 'It prevents deadlocks entirely', 'Dictionary cannot be locked'],
    answer: 1,
    explanation: 'ConcurrentDictionary handles synchronization internally with striped locks and lock-free reads, and GetOrAdd/AddOrUpdate make read-modify-write operations atomic without external locking.',
    topic: 'Collections',
  },
  {
    q: 'What is special about Span<T>?',
    options: ['It is a resizable array', 'A stack-only (ref struct) view over contiguous memory enabling allocation-free slicing', 'A thread-safe list', 'A linked structure'],
    answer: 1,
    explanation: 'Span<T> can wrap arrays, stackalloc memory or strings (ReadOnlySpan<char>) and slice without copying. Being a ref struct, it cannot be boxed, stored on the heap, or used across await.',
    topic: 'Collections',
  },
  {
    q: 'What does the C# 12 collection expression int[] x = [1, 2, ..rest]; do?',
    options: ['Syntax error', 'Creates the array with 1, 2 followed by all elements of rest (spread)', 'Creates a jagged array', 'Creates a range from 1 to rest'],
    answer: 1,
    explanation: 'Collection expressions unify initialization syntax across arrays, spans, List<T> and more; the spread element ..rest inlines another collection\'s items.',
    topic: 'Collections',
  },

  // ── Pattern Matching ─────────────────────────────────────────────────
  {
    q: 'What does "if (obj is Customer { Status: "Gold" } c)" do?',
    options: ['Compile error', 'Type-checks obj as Customer, checks Status equals "Gold", and binds c on success', 'Creates a new Customer', 'Compares references'],
    answer: 1,
    explanation: 'This combines a type pattern with a property pattern and a designation: c is only assigned (and the condition true) when both the type and the property match.',
    topic: 'Pattern Matching',
  },
  {
    q: 'In a switch expression, what does the discard pattern _ mean?',
    options: ['Null values only', 'The default arm — matches anything not matched above', 'An ignored compiler warning', 'An empty case'],
    answer: 1,
    explanation: '_ matches any value without binding it, serving as the catch-all arm. Without it (or another exhaustive set), an unmatched value throws SwitchExpressionException at runtime.',
    topic: 'Pattern Matching',
  },
  {
    q: 'What does "x is > 0 and < 100" use?',
    options: ['Operator overloading', 'Relational patterns combined with the and pattern combinator (C# 9)', 'LINQ expressions', 'Implicit range conversion'],
    answer: 1,
    explanation: 'Relational patterns (>, >=, <, <=) compare against constants, and and/or/not combine patterns logically — a concise alternative to x > 0 && x < 100 that also works in switch arms.',
    topic: 'Pattern Matching',
  },
  {
    q: 'What does the list pattern "arr is [1, _, .., 9]" match?',
    options: ['Any array containing 1 and 9', 'An array of length ≥ 3 starting with 1 (second element anything) and ending with 9', 'Exactly [1, 9]', 'Arrays of odd length'],
    answer: 1,
    explanation: 'List patterns (C# 11) match structure positionally: 1 first, _ matches any single second element, .. (slice) absorbs zero or more middle elements, 9 must be last.',
    topic: 'Pattern Matching',
  },
  {
    q: 'How does "case int n when n < 0:" differ from "case int n:"?',
    options: ['No difference', 'The when guard adds a runtime boolean condition that must also pass for the case to match', 'when makes it compile-time', 'when handles nulls'],
    answer: 1,
    explanation: 'Case guards (when) attach arbitrary boolean expressions to a pattern. If the guard fails, matching falls through to subsequent cases instead of taking this one.',
    topic: 'Pattern Matching',
  },
  {
    q: 'What enables positional patterns like "point is (0, 0)" on your own type?',
    options: ['Implementing IComparable', 'A Deconstruct method (or record positional parameters)', 'Operator ==', 'ToString override'],
    answer: 1,
    explanation: 'Positional patterns call Deconstruct(out x, out y) and match each output against a sub-pattern. Positional records get Deconstruct generated automatically.',
    topic: 'Pattern Matching',
  },
  {
    q: 'Which is true about "obj is not null"?',
    options: ['It calls operator != which may be overloaded', 'It is a pure null check using the negated constant pattern, ignoring any overloaded operators', 'It boxes obj', 'It only works on strings'],
    answer: 1,
    explanation: '"is null" / "is not null" perform reference null tests that cannot be hijacked by an overloaded == / != operator — which is why they are preferred for null checks.',
    topic: 'Pattern Matching',
  },

  // ── Memory/GC ────────────────────────────────────────────────────────
  {
    q: 'What are GC generations 0, 1, and 2 for?',
    options: ['Thread priorities', 'Segregating objects by age: new objects in gen 0 are collected cheaply and frequently; survivors are promoted to older, less-collected generations', 'Heap size limits', 'Reference counting levels'],
    answer: 1,
    explanation: 'The generational hypothesis: most objects die young. Gen 0 collections are fast and frequent; survivors get promoted, and full gen 2 collections (including LOH) are rarer and costlier.',
    topic: 'Memory/GC',
  },
  {
    q: 'What is the Large Object Heap (LOH)?',
    options: ['A heap for classes with many fields', 'Where objects ≥ 85,000 bytes are allocated; collected with gen 2 and not compacted by default', 'The stack for large frames', 'A cache for strings'],
    answer: 1,
    explanation: 'Big allocations (typically large arrays) go to the LOH to avoid expensive copying. It is swept rather than compacted by default, so fragmentation is a real concern — pool large buffers (ArrayPool<T>).',
    topic: 'Memory/GC',
  },
  {
    q: 'What is the purpose of IDisposable and the using statement?',
    options: ['Freeing managed memory immediately', 'Deterministically releasing unmanaged/scarce resources (handles, connections) — the GC handles memory, not these', 'Forcing a garbage collection', 'Marking objects unreachable'],
    answer: 1,
    explanation: 'The GC reclaims memory but knows nothing about file handles, sockets or DB connections. Dispose() (called automatically by using, even on exceptions) releases those resources deterministically.',
    topic: 'Memory/GC',
  },
  {
    q: 'Why are finalizers (~ClassName) discouraged for typical cleanup?',
    options: ['They are removed in .NET 8', 'They run non-deterministically on a finalizer thread, delay collection (object survives an extra GC), and may never run', 'They block the main thread', 'They can only free memory'],
    answer: 1,
    explanation: 'Finalizable objects need at least two collections to die and the timing is unpredictable. Prefer IDisposable + SafeHandle; finalizers exist only as a safety net for unmanaged resources.',
    topic: 'Memory/GC',
  },
  {
    q: 'A static event keeps subscribing objects alive. Why?',
    options: ['Events copy the objects', 'The static delegate holds strong references to subscriber instances, preventing collection until they unsubscribe', 'Statics disable the GC', 'Events are stored on the LOH'],
    answer: 1,
    explanation: 'A delegate stores a target object reference. A long-lived (static) publisher therefore roots every subscriber — a classic .NET memory leak fixed by unsubscribing (-=) or weak event patterns.',
    topic: 'Memory/GC',
  },
  {
    q: 'What does stackalloc do?',
    options: ['Allocates on the GC heap quickly', 'Allocates a buffer on the current stack frame, freed automatically on method exit — no GC involvement', 'Pins heap memory', 'Allocates thread-local storage'],
    answer: 1,
    explanation: 'Span<byte> buf = stackalloc byte[256]; gives a short-lived, allocation-free buffer. Keep sizes small (stack space is limited) and never return it from the method.',
    topic: 'Memory/GC',
  },
  {
    q: 'What is the benefit of ArrayPool<T>.Shared?',
    options: ['Thread-local arrays', 'Renting and returning reusable arrays to avoid repeated large allocations and GC/LOH pressure', 'Automatically clearing arrays', 'Immutable arrays'],
    answer: 1,
    explanation: 'Rent(minSize) returns a pooled array (possibly larger than requested); Return(arr) recycles it. Hot paths that repeatedly need temporary buffers avoid both gen 0 churn and LOH fragmentation.',
    topic: 'Memory/GC',
  },
];

@Component({
  selector: 'app-csharp-quiz-practice',
  standalone: true,
  imports: [],
  templateUrl: './quiz-practice.html',
  styleUrl: './quiz-practice.scss',
})
export class CsharpQuizPractice {
  readonly counts = [5, 10, 20];
  readonly topics: string[] = ['All', ...Array.from(new Set(QUESTIONS.map(q => q.topic)))];

  phase = signal<QuizPhase>('setup');
  selectedTopic = signal('All');
  selectedCount = signal(10);

  questions = signal<PracticeQuestion[]>([]);
  index = signal(0);
  answers = signal<Record<number, number>>({});

  current = computed(() => this.questions()[this.index()]);
  picked = computed<number | null>(() => {
    const a = this.answers()[this.index()];
    return a === undefined ? null : a;
  });
  answered = computed(() => this.picked() !== null);
  isLast = computed(() => this.index() === this.questions().length - 1);

  score = computed(() =>
    this.questions().reduce((sum, q, i) => sum + (this.answers()[i] === q.answer ? 1 : 0), 0)
  );
  percentage = computed(() => {
    const total = this.questions().length;
    return total ? Math.round((this.score() / total) * 100) : 0;
  });
  breakdown = computed(() => {
    const map = new Map<string, { topic: string; correct: number; total: number }>();
    this.questions().forEach((q, i) => {
      const row = map.get(q.topic) ?? { topic: q.topic, correct: 0, total: 0 };
      row.total++;
      if (this.answers()[i] === q.answer) row.correct++;
      map.set(q.topic, row);
    });
    return Array.from(map.values());
  });
  resultMessage = computed(() => {
    const p = this.percentage();
    if (p >= 90) return 'Outstanding — you really know C#!';
    if (p >= 70) return 'Great job — solid C# knowledge.';
    if (p >= 50) return 'Good effort — review the explanations and try again.';
    return 'Keep practicing — the explanations below each question are your friend.';
  });

  poolSize(topic: string): number {
    return topic === 'All' ? QUESTIONS.length : QUESTIONS.filter(q => q.topic === topic).length;
  }

  start(): void {
    const topic = this.selectedTopic();
    const pool = topic === 'All' ? [...QUESTIONS] : QUESTIONS.filter(q => q.topic === topic);
    // Fisher–Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    this.questions.set(pool.slice(0, Math.min(this.selectedCount(), pool.length)));
    this.index.set(0);
    this.answers.set({});
    this.phase.set('quiz');
  }

  pick(optionIndex: number): void {
    if (this.answered()) return;
    this.answers.update(a => ({ ...a, [this.index()]: optionIndex }));
  }

  next(): void {
    if (this.isLast()) {
      this.phase.set('result');
    } else {
      this.index.update(i => i + 1);
    }
  }

  tryAgain(): void {
    this.start();
  }

  newSettings(): void {
    this.phase.set('setup');
  }
}
