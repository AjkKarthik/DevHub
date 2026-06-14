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

@Component({
  selector: 'app-csharp-collections',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './collections.html',
  styleUrl: './collections.scss',
})
export class CsharpCollections {

  quickRef: QuickRefItem[] = [
    { name: 'List<T>',                    type: 'class',     desc: 'Ordered, resizable sequence backed by an array. O(1) indexed access, O(n) insert/remove at arbitrary positions.', since: 'C# 2' },
    { name: 'Dictionary<K,V>',           type: 'class',     desc: 'Hash-table map from unique keys to values. O(1) average lookup, add, and remove. Key order is not guaranteed.', since: 'C# 2' },
    { name: 'HashSet<T>',                 type: 'class',     desc: 'Unordered set of unique values. O(1) add/remove/contains. Ideal for membership tests and set algebra.', since: 'C# 2' },
    { name: 'Queue<T>',                   type: 'class',     desc: 'First-in, first-out (FIFO) collection. Enqueue adds to the back; Dequeue removes from the front.', since: 'C# 2' },
    { name: 'Stack<T>',                   type: 'class',     desc: 'Last-in, first-out (LIFO) collection. Push adds to the top; Pop removes from the top. Useful for DFS and undo.', since: 'C# 2' },
    { name: 'IEnumerable<T>',             type: 'interface', desc: 'The base interface for all sequences. Supports foreach and LINQ. Evaluation is lazy — nothing runs until iterated.', since: 'C# 2' },
    { name: 'IReadOnlyList<T>',           type: 'interface', desc: 'Read-only view of an indexed list. Exposes Count and indexer but no mutation methods.', since: 'C# 4.5' },
    { name: 'ConcurrentDictionary<K,V>', type: 'class',     desc: 'Thread-safe dictionary. Uses fine-grained locking per bucket — much faster than lock+Dictionary under concurrent reads.', since: '.NET 4' },
    { name: 'Span<T>',                    type: 'class',     desc: 'Stack-only, zero-allocation view over a contiguous memory region (array, stackalloc, or unmanaged). Cannot be stored on the heap.', since: '.NET Core 2.1' },
    { name: 'ImmutableList<T>',           type: 'class',     desc: 'Thread-safe, structurally-shared immutable list from System.Collections.Immutable. Mutations return a new instance.', since: '.NET 4.5' },
    { name: '[]',                         type: 'keyword',   desc: 'C# 12 collection expression syntax. var nums = [1, 2, 3] infers the target type from context (array, List, Span, etc.).', since: 'C# 12' },
    { name: 'ArrayPool<T>',               type: 'class',     desc: 'Rent/return large byte buffers without GC pressure. Call pool.Return(arr) in a finally block — never skip it.', since: '.NET Core 1' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Choose the right collection',
      points: [
        'Use <code>List&lt;T&gt;</code> for ordered, mutable sequences where you need indexed access or frequent iteration. It wraps a dynamic array that doubles capacity when full — amortised O(1) append, O(1) indexed access, O(n) insert/remove in the middle.',
        'Use <code>Dictionary&lt;K,V&gt;</code> for fast key-based lookups — average O(1) regardless of collection size because it uses a hash table internally. Never use a list for "find by key" — that is O(n) per lookup.',
        'Use <code>HashSet&lt;T&gt;</code> when uniqueness matters — it rejects duplicates and supports <code>UnionWith</code>, <code>IntersectWith</code>, <code>ExceptWith</code>, and <code>IsSubsetOf</code> in O(n) time, dramatically faster than nested loops over two lists.',
        'Use <code>Queue&lt;T&gt;</code> for FIFO task queues or BFS traversal; use <code>Stack&lt;T&gt;</code> for LIFO patterns (DFS, expression evaluation, undo/redo). Both are O(1) for their primary operations.',
        'Use <code>PriorityQueue&lt;TElement, TPriority&gt;</code> (.NET 6+) when you need to process items in priority order (min-heap by default). Use <code>LinkedList&lt;T&gt;</code> when you need O(1) insert/remove at both ends and in the middle (but O(n) indexed access).',
      ],
    },
    {
      heading: 'Program to interfaces, not implementations',
      points: [
        'Return <code>IEnumerable&lt;T&gt;</code> from methods that produce a sequence — callers can iterate without forcing materialisation, and the implementation can switch between LINQ, <code>yield return</code>, or a List without breaking callers.',
        'Return <code>IReadOnlyList&lt;T&gt;</code> when callers need indexed access but must not mutate the list. This is stricter than <code>IEnumerable&lt;T&gt;</code> (exposes <code>Count</code> and indexer) while still hiding the concrete <code>List&lt;T&gt;</code>.',
        'Accept <code>IEnumerable&lt;T&gt;</code> as a parameter to keep methods flexible — a <code>List</code>, array, <code>HashSet</code>, or LINQ query all satisfy it. Avoid accepting <code>List&lt;T&gt;</code> directly unless you specifically need list mutation.',
        'Only expose the concrete type (e.g., <code>List&lt;T&gt;</code>) when mutation is an intentional part of the API contract. Leaking <code>List&lt;T&gt;</code> invites callers to <code>Add</code> or <code>Remove</code> items from your internal state — a common encapsulation bug.',
        'For API responses, <code>IReadOnlyDictionary&lt;K,V&gt;</code> and <code>IReadOnlyCollection&lt;T&gt;</code> communicate intent clearly. For collections that will never change after construction, <code>ImmutableList&lt;T&gt;</code> or <code>ImmutableDictionary&lt;K,V&gt;</code> is the strongest guarantee.',
      ],
    },
    {
      heading: 'Dictionary internals and performance',
      points: [
        'A <code>Dictionary&lt;K,V&gt;</code> uses a hash table: it calls <code>key.GetHashCode()</code> to find a bucket, then uses <code>Equals</code> to resolve collisions within that bucket. Both methods must be correct and consistent — if you override <code>GetHashCode</code>, you must also override <code>Equals</code>.',
        'The load factor (ratio of entries to buckets) is kept below 0.72 by default. When exceeded, the dictionary allocates a new, larger array and re-hashes every entry — O(n) work. Pre-size with <code>new Dictionary&lt;K,V&gt;(capacity)</code> when you know the approximate size to avoid rehashing.',
        'Key objects must be <em>immutable</em> in practice — if you change the key object after insertion, <code>GetHashCode</code> may return a different bucket and the entry becomes permanently unreachable (a hidden memory leak). Primitive types and strings are safe; mutable objects as keys are a common bug.',
        '<code>GetOrAdd</code> on <code>Dictionary</code> does not exist natively — the pattern is <code>if (!dict.TryGetValue(key, out var val)) { val = ...; dict[key] = val; }</code>. <code>ConcurrentDictionary</code> has a true thread-safe <code>GetOrAdd</code> method.',
        'For case-insensitive string keys, always pass a comparer at construction: <code>new Dictionary&lt;string,int&gt;(StringComparer.OrdinalIgnoreCase)</code>. Adding entries with different comparer assumptions after the fact is a common source of "key not found" bugs.',
      ],
    },
    {
      heading: 'Concurrent collections for thread safety',
      points: [
        '<code>ConcurrentDictionary&lt;K,V&gt;</code> is the go-to thread-safe dictionary. It uses fine-grained locking (locks per bucket, not the whole dictionary), so concurrent reads never block each other and concurrent writes with different keys also do not block.',
        '<code>GetOrAdd(key, valueFactory)</code> on <code>ConcurrentDictionary</code> is NOT atomic end-to-end — the factory can be called multiple times if two threads race. If the factory has side effects (e.g., DB call), wrap the value in <code>Lazy&lt;T&gt;</code>: <code>GetOrAdd(key, _ => new Lazy&lt;T&gt;(factory)).Value</code>.',
        '<code>ConcurrentQueue&lt;T&gt;</code> is a lock-free FIFO queue ideal for producer/consumer patterns. <code>TryDequeue</code> returns false rather than blocking — pair it with a <code>SemaphoreSlim</code> or use <code>System.Threading.Channels</code> for signalled consumer wakeup.',
        '<code>BlockingCollection&lt;T&gt;</code> wraps a <code>ConcurrentQueue</code> (or any <code>IProducerConsumerCollection&lt;T&gt;</code>) and adds blocking semantics — <code>Take</code> blocks the consumer thread until an item is available and <code>Add</code> blocks producers when a bounded capacity is reached.',
        'For simple read-heavy scenarios, a plain <code>Dictionary</code> protected by a <code>ReaderWriterLockSlim</code> can outperform <code>ConcurrentDictionary</code> by allowing unlimited concurrent reads. For write-heavy or balanced read/write, use <code>ConcurrentDictionary</code> directly.',
      ],
    },
    {
      heading: 'Span<T> for zero-allocation slices',
      points: [
        '<code>Span&lt;T&gt;</code> is a <em>ref struct</em> — it lives on the stack only and cannot be stored in a field, captured in a lambda, or used across <code>await</code>. These restrictions are enforced by the compiler and are intentional: they guarantee the span never outlives the underlying buffer.',
        'It provides a window over an existing buffer (array, <code>stackalloc</code>, or unmanaged memory) without copying any data. Reading or writing through a <code>Span&lt;T&gt;</code> directly accesses the original memory.',
        'Use <code>ReadOnlySpan&lt;char&gt;</code> for zero-allocation string parsing — <code>str.AsSpan(start, length)</code> avoids a <code>Substring</code> heap allocation. Many .NET 6+ APIs accept <code>ReadOnlySpan&lt;char&gt;</code> directly (e.g., <code>int.Parse</code>, <code>DateTime.TryParse</code>).',
        'For longer-lived views use <code>Memory&lt;T&gt;</code> — it can be stored in fields and passed across async boundaries. Convert to a <code>Span&lt;T&gt;</code> synchronously with <code>.Span</code> when you need to read or write.',
        'For buffer reuse across requests use <code>ArrayPool&lt;T&gt;.Shared.Rent(size)</code> — it returns a pooled array (possibly larger than requested). Always call <code>pool.Return(array)</code> in a <code>finally</code> block — forgetting to return causes the pooled buffer to be garbage collected, defeating the purpose of pooling.',
      ],
    },
    {
      heading: 'Immutable collections',
      points: [
        '<code>System.Collections.Immutable</code> (included in .NET 5+) provides <code>ImmutableList&lt;T&gt;</code>, <code>ImmutableDictionary&lt;K,V&gt;</code>, <code>ImmutableHashSet&lt;T&gt;</code>, and others. All mutating methods (<code>Add</code>, <code>Remove</code>, <code>SetItem</code>) return a <em>new</em> collection — the original is never modified.',
        'Immutable collections use structural sharing — the new collection reuses parts of the original\'s internal tree rather than copying the entire data. A single <code>Add</code> to an <code>ImmutableList&lt;T&gt;</code> with 1,000 items creates O(log n) new nodes, not O(n).',
        'Because they are structurally immutable, any number of threads can read an immutable collection simultaneously without locking. This makes them ideal for shared state in concurrent systems or for read-heavy caches.',
        'Use <code>ImmutableArray&lt;T&gt;</code> (a struct wrapping a plain array) instead of <code>ImmutableList&lt;T&gt;</code> when you need fast O(1) indexed access. <code>ImmutableArray&lt;T&gt;</code> is just an array — it has no tree overhead but also no structural sharing on mutation.',
        'For bulk construction, use the <code>Builder</code> pattern: <code>var builder = ImmutableList.CreateBuilder&lt;T&gt;(); builder.Add(...); var result = builder.ToImmutable();</code>. This is O(n) total (mutable builds, then locks into an immutable snapshot), far more efficient than chaining <code>Add</code> calls.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'List & Dictionary',
      language: 'csharp',
      code: `// ── List<T> ────────────────────────────────────────────────────────
var fruits = new List<string> { "apple", "banana", "cherry" };

fruits.Add("date");
fruits.AddRange(["elderberry", "fig"]);   // C# 12 collection expression
fruits.Insert(1, "avocado");              // insert at index 1
fruits.Remove("banana");                  // removes first match
fruits.RemoveAt(0);                       // removes by index

Console.WriteLine(fruits.Count);          // 5
Console.WriteLine(fruits[0]);             // avocado
Console.WriteLine(fruits.Contains("fig")); // True

foreach (string f in fruits)
    Console.Write(f + " ");

// C# 12 — collection expressions infer target type
List<int>   nums = [1, 2, 3, 4, 5];
int[]       arr  = [10, 20, 30];
Span<int>   sp   = [100, 200, 300];      // stack-allocated span

// Pre-size when count is known — avoids 4 doublings for 1000 items
var preAllocated = new List<int>(capacity: 1000);

// ── Dictionary<K,V> ───────────────────────────────────────────────
var scores = new Dictionary<string, int>
{
    ["Alice"] = 95,
    ["Bob"]   = 82,
    ["Carol"] = 91,
};

scores["Dave"] = 78;                      // add / update
scores.Remove("Bob");

// Safe lookup — never throws KeyNotFoundException
if (scores.TryGetValue("Alice", out int aliceScore))
    Console.WriteLine($"Alice: {aliceScore}");  // Alice: 95

// ContainsKey before direct access
if (scores.ContainsKey("Dave"))
    Console.WriteLine($"Dave: {scores["Dave"]}");  // Dave: 78

// Iterate key-value pairs
foreach (KeyValuePair<string, int> kv in scores)
    Console.WriteLine($"{kv.Key} => {kv.Value}");

// GetValueOrDefault — returns 0 (default) if key missing (no throw!)
int eveScore = scores.GetValueOrDefault("Eve");   // 0

// Case-insensitive dictionary — always pass comparer at construction
var ci = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
ci["hello"] = 1;
Console.WriteLine(ci["HELLO"]);           // 1

// GetOrAdd pattern (no ConcurrentDictionary):
if (!scores.TryGetValue("Frank", out int frankScore))
{
    frankScore = 70;
    scores["Frank"] = frankScore;
}`,
    },
    {
      label: 'HashSet & Sorted',
      language: 'csharp',
      code: `// ── HashSet<T> — set operations ───────────────────────────────────
var setA = new HashSet<int> { 1, 2, 3, 4, 5 };
var setB = new HashSet<int> { 3, 4, 5, 6, 7 };

var union = new HashSet<int>(setA);       // copy first — don't mutate setA
union.UnionWith(setB);                    // {1,2,3,4,5,6,7}

var intersect = new HashSet<int>(setA);
intersect.IntersectWith(setB);            // {3,4,5}

var diff = new HashSet<int>(setA);
diff.ExceptWith(setB);                    // {1,2} — in A but not B

Console.WriteLine(setA.IsSubsetOf(union));   // True
Console.WriteLine(setA.Overlaps(setB));      // True — share at least one element

// Uniqueness — duplicates are silently ignored
var unique = new HashSet<string> { "x", "y", "x", "z" };
Console.WriteLine(unique.Count);          // 3 — "x" only stored once
Console.WriteLine(unique.Add("x"));       // False — already present

// Fast membership test vs List:
// HashSet.Contains = O(1)   List.Contains = O(n)
// For 1,000,000 elements: HashSet is ~10,000x faster for Contains

// ── SortedDictionary — always in key order (Red-Black tree) ────────
var sorted = new SortedDictionary<string, int>
{
    ["banana"] = 2,
    ["apple"]  = 5,
    ["cherry"] = 1,
};
// Iteration order: apple, banana, cherry (alphabetical — O(log n) per op)
foreach (var (key, val) in sorted)
    Console.WriteLine($"{key}: {val}");

// SortedSet<T> — sorted unique values
var sortedNums = new SortedSet<int> { 5, 1, 3, 2, 4 };
// Iteration: 1, 2, 3, 4, 5

// Min/Max in O(log n):
Console.WriteLine(sortedNums.Min);       // 1
Console.WriteLine(sortedNums.Max);       // 5

// GetViewBetween — values in [2, 4] inclusive
SortedSet<int> slice = sortedNums.GetViewBetween(2, 4);
foreach (int n in slice) Console.Write(n + " "); // 2 3 4`,
    },
    {
      label: 'Queue, Stack & Priority',
      language: 'csharp',
      code: `// ── Queue<T> — FIFO (First In, First Out) ────────────────────────
var taskQueue = new Queue<string>();
taskQueue.Enqueue("SendEmail");
taskQueue.Enqueue("ResizeImage");
taskQueue.Enqueue("GenerateReport");

Console.WriteLine(taskQueue.Peek());      // "SendEmail" — look without removing
Console.WriteLine(taskQueue.Dequeue());   // "SendEmail" — remove & return
Console.WriteLine(taskQueue.Count);       // 2

// TryDequeue — non-throwing, safe for concurrent patterns
if (taskQueue.TryDequeue(out string? next))
    Console.WriteLine($"Next: {next}");

// ── Stack<T> — LIFO (Last In, First Out) ──────────────────────────
var undoStack = new Stack<string>();
undoStack.Push("TypeA");
undoStack.Push("TypeB");
undoStack.Push("DeleteC");

Console.WriteLine(undoStack.Peek());      // "DeleteC"
Console.WriteLine(undoStack.Pop());       // "DeleteC" — undo last action

// DFS using Stack
var graph = new Dictionary<int, List<int>>
{
    [1] = [2, 3], [2] = [4], [3] = [4, 5], [4] = [], [5] = [],
};
var visited = new HashSet<int>();
var dfsStack = new Stack<int>();
dfsStack.Push(1);

while (dfsStack.Count > 0)
{
    int node = dfsStack.Pop();
    if (visited.Add(node))               // Add returns false if already present
        foreach (int n in graph[node])
            dfsStack.Push(n);
}
Console.WriteLine(string.Join(" ", visited)); // 1 3 5 4 2 (DFS order)

// ── PriorityQueue<TElement, TPriority> (.NET 6+) — min-heap ────────
var pq = new PriorityQueue<string, int>();
pq.Enqueue("Low priority task",    10);
pq.Enqueue("Critical fix",          1);
pq.Enqueue("Medium priority task",  5);
pq.Enqueue("Another critical",      1);  // same priority as "Critical fix"

while (pq.TryDequeue(out string? item, out int priority))
    Console.WriteLine($"[{priority}] {item}");
// [1] Critical fix
// [1] Another critical
// [5] Medium priority task
// [10] Low priority task`,
    },
    {
      label: 'ConcurrentDictionary',
      language: 'csharp',
      code: `using System.Collections.Concurrent;

// ── ConcurrentDictionary<K,V> — thread-safe updates ───────────────
var counts = new ConcurrentDictionary<string, int>(StringComparer.OrdinalIgnoreCase);

// AddOrUpdate — atomically add OR update based on existing value
// 3rd param receives (key, existingValue) → new value
for (int i = 0; i < 10; i++)
{
    // Simulate concurrent word counting from multiple threads
    string[] words = { "apple", "banana", "Apple", "cherry", "banana" };
    foreach (string word in words)
        counts.AddOrUpdate(word, 1, (_, existing) => existing + 1);
}

foreach (var (word, count) in counts.OrderBy(kv => kv.Key))
    Console.WriteLine($"{word}: {count}");

// GetOrAdd — get existing OR add new value
// WARNING: factory MAY run more than once under concurrency!
var cache = new ConcurrentDictionary<int, string>();
string result = cache.GetOrAdd(42, key => $"Value for {key}");
Console.WriteLine(result);   // "Value for 42"

// Safe GetOrAdd with Lazy<T> — factory runs exactly once even under race
var safeCache = new ConcurrentDictionary<int, Lazy<string>>();
string safeResult = safeCache
    .GetOrAdd(42, key => new Lazy<string>(() => $"Computed {key}"))
    .Value;

// TryAdd, TryRemove, TryUpdate — safe non-blocking operations
bool added   = counts.TryAdd("date", 1);
bool removed = counts.TryRemove("date", out int removedValue);
// TryUpdate: only updates if the current value matches the expected value (CAS)
bool updated = counts.TryUpdate("apple", newValue: 100, comparisonValue: 10);

// ── Snapshot for safe iteration ────────────────────────────────────
// ConcurrentDictionary.ToArray() returns a point-in-time snapshot
KeyValuePair<string, int>[] snapshot = counts.ToArray();
foreach (var (k, v) in snapshot)
    Console.WriteLine($"{k} = {v}");

// Count is O(n) on ConcurrentDictionary — use IsEmpty for emptiness check
Console.WriteLine(counts.IsEmpty);        // False`,
    },
    {
      label: 'Span & ArrayPool',
      language: 'csharp',
      code: `using System.Buffers;

// ── Span<T> — zero-allocation slice over an array ─────────────────
int[] data = [10, 20, 30, 40, 50, 60, 70, 80];

Span<int> all    = data;              // full span — no copy
Span<int> middle = data.AsSpan(2, 4); // [30, 40, 50, 60] — slice, no copy

middle[0] = 99;                        // mutates the underlying array
Console.WriteLine(data[2]);            // 99 — data was changed in place

// stackalloc — allocate on the stack (no GC pressure)
Span<byte> buffer = stackalloc byte[128];
buffer.Fill(0);                        // zero out the buffer
buffer[0] = 42;

// ── ReadOnlySpan<char> — zero-allocation string parsing ───────────
string csv = "alice,bob,carol,dave";
ReadOnlySpan<char> remaining = csv;

while (!remaining.IsEmpty)
{
    int comma = remaining.IndexOf(',');
    ReadOnlySpan<char> token = comma >= 0 ? remaining[..comma] : remaining;
    Console.WriteLine(token.ToString());
    remaining = comma >= 0 ? remaining[(comma + 1)..] : ReadOnlySpan<char>.Empty;
}

// Zero-allocation compare (no new string):
ReadOnlySpan<char> name = "  Alice  ".AsSpan().Trim();
Console.WriteLine(name.SequenceEqual("Alice"));   // True

// Many .NET 6+ APIs accept ReadOnlySpan<char> directly:
ReadOnlySpan<char> numSpan = "42".AsSpan();
int parsed = int.Parse(numSpan);                  // no alloc!

// ── ArrayPool<T> — reuse large buffers across requests ─────────────
ArrayPool<byte> pool = ArrayPool<byte>.Shared;

byte[] rented = pool.Rent(4096);          // may return LARGER than requested
try
{
    Array.Fill(rented, (byte)0, 0, 4096); // zero your slice — rented arrays are dirty!
    rented[0] = 0xFF;
    Console.WriteLine($"First byte: {rented[0]}");
}
finally
{
    pool.Return(rented);                  // ALWAYS return in finally — else pool degrades
}

// ── Memory<T> — can cross async boundaries (Span cannot) ──────────
async Task ProcessAsync(Memory<byte> mem)
{
    await Task.Delay(1);                  // Span would be illegal here
    Span<byte> sp = mem.Span;            // convert to Span synchronously when needed
    sp[0] = 255;
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using dict[key] directly — throws KeyNotFoundException on miss',
      wrong: `// Throws KeyNotFoundException if "Dave" is not in the dictionary
int score = dict["Dave"];

// Also wrong for "check then get" — two hash lookups, not one
if (dict.ContainsKey("Dave"))
    int score2 = dict["Dave"];  // duplicate lookup`,
      right: `// TryGetValue: one hash lookup, no exception on miss
if (dict.TryGetValue("Dave", out int score))
    Console.WriteLine(score);

// GetValueOrDefault: returns default(V) (0 for int) if key missing
int score3 = dict.GetValueOrDefault("Dave");

// GetValueOrDefault with explicit fallback:
int score4 = dict.GetValueOrDefault("Dave", defaultValue: -1);`,
      explanation: 'dict[key] throws KeyNotFoundException (an expensive exception) if the key is absent. TryGetValue does a single hash lookup and returns false without throwing — it is always preferred unless you are certain the key exists. ContainsKey + indexer is two lookups where TryGetValue is one.',
    },
    {
      title: 'Modifying a collection during foreach — InvalidOperationException',
      wrong: `// THROWS: InvalidOperationException — "Collection was modified"
var items = new List<string> { "a", "b", "c", "d" };
foreach (string item in items)
{
    if (item == "b")
        items.Remove(item);   // modifies list while iterating it
}

// Same bug with Dictionary:
foreach (var key in dict.Keys)
    if (key.StartsWith("temp_"))
        dict.Remove(key);     // throws!`,
      right: `// Option 1: iterate a copy
var items = new List<string> { "a", "b", "c", "d" };
foreach (string item in items.ToList())   // .ToList() creates a copy
    if (item == "b")
        items.Remove(item);   // safe — iterating the copy

// Option 2: collect keys first, then delete
var keysToRemove = dict.Keys.Where(k => k.StartsWith("temp_")).ToList();
foreach (string key in keysToRemove)
    dict.Remove(key);

// Option 3: use RemoveAll (List only) — most efficient
items.RemoveAll(item => item == "b");`,
      explanation: 'The enumerator on most .NET collections tracks a version counter. Any structural modification (Add, Remove, Clear) increments the version. On the next MoveNext() call the enumerator detects the version mismatch and throws. The fix is to iterate a snapshot (.ToList()) or collect keys/indices first, then delete.',
    },
    {
      title: 'Multiple enumeration of IEnumerable — LINQ query runs twice',
      wrong: `// GetItems() returns a LINQ query (deferred) — not a list
IEnumerable<Order> orders = GetItems();

// BAD: the LINQ query executes TWICE — hits the DB twice, or processes twice
int count = orders.Count();
Console.WriteLine($"Processing {count} orders...");
foreach (Order o in orders)   // second iteration: query runs again!
    Process(o);`,
      right: `// Materialise ONCE when you need to iterate multiple times
IEnumerable<Order> query = GetItems();
List<Order> orders = query.ToList();   // one DB hit, result in memory

int count = orders.Count;              // O(1) on List — no re-query
Console.WriteLine($"Processing {count} orders...");
foreach (Order o in orders)
    Process(o);`,
      explanation: 'IEnumerable<T> is lazy — the underlying query or generator runs every time you iterate. Calling Count() iterates once, then foreach iterates again — the database is hit twice (or worse). If you need Count + iteration, materialise with .ToList() or .ToArray() first. ReSharper and Rider flag this as "Possible multiple enumeration".',
    },
    {
      title: 'Using a mutable object as a Dictionary key — silent data loss',
      wrong: `// Mutable class with GetHashCode based on mutable Name field
class Tag
{
    public string Name { get; set; }
    public override int GetHashCode() => Name.GetHashCode();
    public override bool Equals(object? o) => o is Tag t && t.Name == Name;
}

var dict = new Dictionary<Tag, int>();
var tag = new Tag { Name = "csharp" };
dict[tag] = 42;

// AFTER insertion, mutate the key:
tag.Name = "dotnet";

// The entry is in the wrong bucket now — UNREACHABLE
Console.WriteLine(dict.TryGetValue(tag, out _));   // FALSE — lost!`,
      right: `// Option 1: use an immutable record as the key (recommended)
record Tag(string Name);   // record's Equals/GetHashCode are value-based and immutable

var dict2 = new Dictionary<Tag, int>();
var tag2 = new Tag("csharp");
dict2[tag2] = 42;
Console.WriteLine(dict2[new Tag("csharp")]);  // 42 — value equality works

// Option 2: use a primitive key (string, int, Guid) and store the object as value
var dict3 = new Dictionary<string, TagData>();
dict3["csharp"] = new TagData { Name = "csharp" };`,
      explanation: 'Dictionary keys are placed in buckets based on GetHashCode() at the time of insertion. If the key object\'s hash code changes after insertion (because a field used in GetHashCode was mutated), the entry ends up in a different bucket than where the dictionary looks for it — the entry is permanently unreachable. Always use immutable types (string, int, Guid, record) as dictionary keys.',
    },
    {
      title: 'Forgetting to return a rented ArrayPool buffer — pool degrades',
      wrong: `// Renting without returning causes the buffer to be GC'd
// The pool never gets it back — effectively a memory leak from the pool's perspective
byte[] buffer = ArrayPool<byte>.Shared.Rent(4096);
// ... use buffer ...
// Missing: ArrayPool<byte>.Shared.Return(buffer)

// Or: returning after an exception (no finally):
byte[] buf2 = ArrayPool<byte>.Shared.Rent(4096);
DoWork(buf2);                    // if this throws, Return is never called
ArrayPool<byte>.Shared.Return(buf2);`,
      right: `byte[] buf = ArrayPool<byte>.Shared.Rent(4096);
try
{
    // Always zero your slice — rented buffers may contain data from previous use
    Array.Clear(buf, 0, 4096);
    DoWork(buf);
}
finally
{
    // ALWAYS in finally — ensures return even if DoWork throws
    ArrayPool<byte>.Shared.Return(buf, clearArray: false);  // or true to zero on return
}`,
      explanation: 'ArrayPool<T> works by reusing buffers across rent/return cycles. If you forget to call Return, the buffer is never put back in the pool — the next Rent allocates a new one. Over time the pool fills with unreturned buffers and GC pressure increases, defeating the entire purpose of pooling. Always use try/finally with ArrayPool.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main difference between a <code>List&lt;T&gt;</code> and an array (<code>T[]</code>) in C#?',
      options: [
        'Arrays are faster to iterate; List<T> is identical but has extra methods',
        'List<T> can grow and shrink dynamically; arrays have a fixed size set at creation',
        'Arrays support LINQ; List<T> does not',
        'List<T> is a value type; arrays are reference types',
      ],
      answer: 1,
      explanation: 'An array has a fixed capacity determined at creation — you cannot add or remove elements. <code>List&lt;T&gt;</code> wraps an internal array and automatically resizes (doubles capacity) when needed, making it the go-to choice for mutable sequences. Both implement <code>IEnumerable&lt;T&gt;</code> and support LINQ, and both are reference types on the heap.',
    },
    {
      q: 'Why should you prefer <code>TryGetValue</code> over the indexer <code>dict[key]</code> on a Dictionary?',
      options: [
        'TryGetValue is slower but returns null instead of throwing',
        'The indexer always returns default(V); TryGetValue throws on missing keys',
        'TryGetValue performs a single hash lookup and avoids a KeyNotFoundException on missing keys',
        'They are functionally identical — it is only a style preference',
      ],
      answer: 2,
      explanation: '<code>dict[key]</code> throws <code>KeyNotFoundException</code> if the key is absent, which is expensive to catch. <code>TryGetValue</code> does a single hash lookup and returns <code>false</code> (with <code>out</code> set to <code>default</code>) without throwing. This is both faster in the miss case and clearer in intent.',
    },
    {
      q: 'You add the string "hello" to a <code>HashSet&lt;string&gt;</code> three times. What is <code>set.Count</code>?',
      options: [
        '3 — each Add call inserts one entry',
        '1 — HashSet stores only unique values; duplicates are ignored',
        '0 — duplicate additions clear the set',
        'It throws an InvalidOperationException',
      ],
      answer: 1,
      explanation: 'A <code>HashSet&lt;T&gt;</code> stores only unique values. Calling <code>Add</code> with a value that already exists is a no-op (the method returns <code>false</code> to indicate no insertion). The set will contain exactly one entry for "hello", so <code>Count</code> is 1.',
    },
    {
      q: 'Which statement best describes <code>IEnumerable&lt;T&gt;</code> lazy evaluation?',
      options: [
        'IEnumerable<T> loads all elements into memory before the foreach loop begins',
        'The sequence is only iterated when you explicitly call .ToList() or .ToArray()',
        'Elements are produced on-demand as you iterate — a LINQ query does no work until you enumerate it',
        'Lazy evaluation is a compiler optimisation and cannot be observed by the programmer',
      ],
      answer: 2,
      explanation: '<code>IEnumerable&lt;T&gt;</code> uses deferred (lazy) execution. A LINQ pipeline like <code>items.Where(...).Select(...)</code> builds an iterator but processes no elements until you iterate (foreach, ToList, First, etc.). This means you can build complex pipelines cheaply and they short-circuit when only part of the sequence is needed.',
    },
    {
      q: 'What exception is thrown when you modify a <code>List&lt;T&gt;</code> during a <code>foreach</code> loop?',
      options: [
        'ArgumentException — the collection is in an invalid state',
        'InvalidOperationException — "Collection was modified; enumeration operation may not execute"',
        'IndexOutOfRangeException — the enumerator loses its position',
        'No exception — the loop silently skips the modified element',
      ],
      answer: 1,
      explanation: 'The <code>List&lt;T&gt;</code> enumerator tracks an internal version counter. Any structural modification (Add, Remove, Clear) increments the version. On the next <code>MoveNext()</code> call, the enumerator detects the mismatch and throws <code>InvalidOperationException</code>. Fix: iterate a copy (<code>.ToList()</code>), collect mutations, and apply them after the loop.',
    },
    {
      q: 'You call <code>GetOrAdd(key, factory)</code> on a <code>ConcurrentDictionary</code> and the factory has an expensive side effect (e.g., a DB call). What is the risk?',
      options: [
        'None — GetOrAdd is fully atomic: the factory runs at most once per key',
        'The factory may run multiple times under concurrent access — two threads can both miss the key and both call the factory',
        'GetOrAdd blocks all other operations until the factory completes',
        'ConcurrentDictionary does not support factory delegates — only TryAdd does',
      ],
      answer: 1,
      explanation: '<code>ConcurrentDictionary.GetOrAdd</code> is NOT fully atomic end-to-end: two threads can both find the key absent, both invoke the factory, but only one winner\'s result is stored. The loser\'s factory result is discarded but the factory still ran — and if it had side effects (DB insert, API call), both executions happened. The fix is to wrap the value in <code>Lazy&lt;T&gt;</code> so the factory is guaranteed to run at most once even if two <code>Lazy</code> wrappers race.',
    },
    {
      q: 'Why must keys in a <code>Dictionary&lt;K,V&gt;</code> be effectively immutable after insertion?',
      options: [
        'The dictionary copies the key, so mutations have no effect on the stored copy',
        'Mutating a key object can change its GetHashCode, placing it in a different bucket than where the dictionary searches — the entry becomes permanently unreachable',
        'The dictionary throws ArgumentException if you try to mutate a key that is already in use',
        'Keys must be immutable only if the dictionary uses a custom comparer',
      ],
      answer: 1,
      explanation: 'When an entry is inserted, the dictionary uses <code>GetHashCode()</code> to determine its bucket. If you later mutate the key so that <code>GetHashCode()</code> returns a different value, the entry sits in the wrong bucket — any subsequent lookup hashes to a different bucket and never finds it. The entry is permanently lost (unreachable and unremovable). Always use immutable types (string, int, Guid, record) as dictionary keys.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use an Array instead of a List?',
      a: 'Prefer a plain array (<code>T[]</code>) when the size is fixed and known at creation time — e.g., RGB channels, a fixed-size buffer, or the result of a LINQ <code>.ToArray()</code> call that you will pass to an API expecting an array. Arrays have slightly lower overhead because there is no wrapper object. Use <code>List&lt;T&gt;</code> whenever you need to add or remove elements dynamically. For read-only scenarios consider <code>ImmutableArray&lt;T&gt;</code>, which is a struct wrapping an array with no extra allocation.',
    },
    {
      q: 'Why does Dictionary not preserve insertion order?',
      a: '<code>Dictionary&lt;K,V&gt;</code> is a hash table — it stores entries in internal buckets based on the key\'s hash code, not in the order they were inserted. This gives O(1) average lookup at the cost of predictable ordering. If you need insertion order, use <code>OrderedDictionary</code> (.NET 8+) or maintain a separate <code>List&lt;K&gt;</code> alongside your dictionary. If you always need sorted-key order, use <code>SortedDictionary&lt;K,V&gt;</code> (Red-Black tree, O(log n) ops) or <code>SortedList&lt;K,V&gt;</code> (sorted array, faster iteration but slower insert).',
    },
    {
      q: 'What is the risk of enumerating an IEnumerable&lt;T&gt; multiple times?',
      a: '<code>IEnumerable&lt;T&gt;</code> is lazy — the underlying source (a LINQ query, a generator, or a DB call) runs every time you iterate. If you call <code>Count()</code> and then <code>foreach</code> on the same <code>IEnumerable</code>, the source executes twice. For a LINQ-to-database query, this means two round trips. For an infinite or side-effectful sequence, results may differ between iterations. Fix: call <code>.ToList()</code> or <code>.ToArray()</code> once to materialise the results into memory, then use the list for all subsequent operations.',
    },
    {
      q: 'What is Span&lt;T&gt; good for?',
      a: '<code>Span&lt;T&gt;</code> lets you work with a slice of an existing array or stack-allocated buffer without allocating a new object on the heap. The classic use case is string parsing: instead of calling <code>Substring</code> (which allocates a new string), you call <code>str.AsSpan(start, length)</code> and process the slice in place. <code>Span&lt;T&gt;</code> is also useful for high-throughput buffer manipulation in serialisers, parsers, and networking code. Its constraint — it is a <em>ref struct</em> so it cannot escape the stack — is intentional: it enforces safe, predictable lifetime.',
    },
    {
      q: 'How do I make a collection read-only so callers cannot mutate it?',
      a: 'There are several options depending on the level of guarantee you need. <strong>Cheapest (interface cast):</strong> return the list as <code>IReadOnlyList&lt;T&gt;</code> — callers see only read operations, but if they cast it back to <code>List&lt;T&gt;</code> they can still mutate it. <strong>Wrapper:</strong> call <code>list.AsReadOnly()</code> which returns a <code>ReadOnlyCollection&lt;T&gt;</code> that throws on mutation attempts; the data is still shared with the original. <strong>True immutable copy:</strong> use <code>ImmutableList.CreateRange(list)</code> from <code>System.Collections.Immutable</code> — any mutation returns a new collection; the original is guaranteed safe forever.',
    },
    {
      q: 'How does Dictionary<K,V> handle hash collisions?',
      a: '<code>Dictionary&lt;K,V&gt;</code> uses open-addressing with chaining (a linked list per bucket) in older .NET versions, and a more cache-friendly scheme in modern .NET. When two keys hash to the same bucket, the dictionary walks the chain and uses <code>Equals</code> to find the exact match. Performance degrades from O(1) toward O(n) when many keys collide in the same bucket — this can happen accidentally (poor <code>GetHashCode</code>) or maliciously (hash flooding attacks on user-supplied input). For untrusted input keys, use a <code>IEqualityComparer</code> with a randomised seed, or rely on .NET\'s built-in randomisation for string hashing (enabled by default since .NET 5).',
    },
    {
      q: 'When should I use ConcurrentDictionary vs lock + Dictionary?',
      a: 'Use <code>ConcurrentDictionary</code> when you have mostly reads with occasional writes, or when multiple threads write to <em>different</em> keys. It uses fine-grained locking (per-bucket) so concurrent reads and non-conflicting writes proceed simultaneously without blocking. Use <code>lock + Dictionary</code> when you need to perform multi-step atomic operations: read-then-write, iterate-then-modify, or any sequence where intermediate state must be hidden. <code>ConcurrentDictionary</code> has no "transaction" support — individual operations are atomic but sequences of operations are not. For read-heavy with very rare writes, a <code>ReaderWriterLockSlim</code> + plain Dictionary can outperform both.',
    },
  ];

  challenge: Challenge = {
    title: 'Word Frequency Counter with LINQ Top-N',
    description: `Implement a method that counts word frequencies in a string using a case-insensitive Dictionary&lt;string, int&gt;, then returns the top-N words by frequency using LINQ.

Requirements:
1. Use Dictionary&lt;string, int&gt; with StringComparer.OrdinalIgnoreCase
2. Split on whitespace and strip punctuation (.,!?;:) from each word
3. Skip empty tokens
4. Find the top-N words ordered by frequency (descending), then alphabetically on ties
5. Return a list of (word, count) tuples`,
    language: 'csharp',
    hints: [
      'Use sentence.Split() with no args to split on any whitespace',
      'Use word.Trim(\'.\', \',\', \'!\', \'?\', \';\', \':\') to strip punctuation',
      'Use dict.GetValueOrDefault(word) + 1 to safely increment counts',
      'LINQ: .OrderByDescending(kv => kv.Value).ThenBy(kv => kv.Key).Take(n)',
    ],
    starterCode: `using System;
using System.Collections.Generic;
using System.Linq;

public IReadOnlyList<(string Word, int Count)> TopWords(string text, int n)
{
    var freq = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

    // TODO: split text, normalise each word, build frequency map

    // TODO: return top-n words using LINQ

    return [];
}

// Expected:
// TopWords("the cat sat on the mat the cat", 2)
//   => [("the", 3), ("cat", 2)]`,
    solution: `using System;
using System.Collections.Generic;
using System.Linq;

public IReadOnlyList<(string Word, int Count)> TopWords(string text, int n)
{
    var freq = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

    foreach (string raw in text.Split())   // splits on any whitespace
    {
        string word = raw.Trim('.', ',', '!', '?', ';', ':');

        if (string.IsNullOrWhiteSpace(word))
            continue;

        freq[word] = freq.GetValueOrDefault(word) + 1;
    }

    return freq
        .OrderByDescending(kv => kv.Value)
        .ThenBy(kv => kv.Key)
        .Take(n)
        .Select(kv => (kv.Key, kv.Value))
        .ToList();
}

// Test it:
var results = TopWords("To be or not to be that is the question to be", 3);
foreach (var (word, count) in results)
    Console.WriteLine($"{word}: {count}");
// to: 3
// be: 3
// is: 1`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Choose List for ordered sequences, Dictionary for O(1) key lookups, HashSet for uniqueness — always prefer TryGetValue over the indexer, materialise IEnumerable before multiple iterations, and use ConcurrentDictionary (not lock+Dictionary) for thread-safe per-key updates.',
    mustKnow: [
      '<code>List&lt;T&gt;</code>: dynamic array — O(1) indexed access, O(n) insert/remove in middle. Pre-size with capacity when count is known.',
      '<code>Dictionary&lt;K,V&gt;</code>: O(1) average lookup via hash table. Always use <code>TryGetValue</code>, never <code>dict[key]</code> when key might be absent.',
      '<code>HashSet&lt;T&gt;</code>: O(1) Contains — 10,000x faster than List.Contains for large sets. Use for membership tests and set algebra (UnionWith, IntersectWith).',
      'Dictionary keys must be effectively immutable — mutating a key after insertion changes its hash code and makes the entry permanently unreachable.',
      'Multiple enumeration of <code>IEnumerable&lt;T&gt;</code>: the query runs again on each iteration. Call <code>.ToList()</code> once when you need count + iteration.',
      '<code>ConcurrentDictionary.GetOrAdd</code> factory is NOT atomic — wrap the value in <code>Lazy&lt;T&gt;</code> if the factory has side effects.',
      '<code>Span&lt;T&gt;</code> is a ref struct — stack only, cannot cross async. Use <code>Memory&lt;T&gt;</code> for async-compatible slices. Always return <code>ArrayPool</code> buffers in a <code>finally</code> block.',
    ],
    interviewFocus: [
      'What happens when you call dict[key] and the key does not exist? How do you avoid it? (KeyNotFoundException; use TryGetValue)',
      'Why can\'t you remove items from a collection during foreach? What\'s the fix? (Version counter; iterate a copy with .ToList())',
      'What is the difference between List.Count and List.Capacity? (Count = elements stored; Capacity = internal array size; doubling triggers reallocation)',
      'When would you use ImmutableDictionary over ConcurrentDictionary? (Immutable for truly shared read-only state across threads; Concurrent for mutable shared state)',
      'What is the risk of enumerating an IEnumerable<T> twice? (Deferred execution — DB query runs again; materialise with .ToList() before multiple iterations)',
    ],
  };
}
