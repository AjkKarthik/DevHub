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
  selector: 'app-csharp-collections',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './collections.html',
  styleUrl: './collections.scss',
})
export class CsharpCollections {

  quickRef: QuickRefItem[] = [
    { name: 'List<T>',             type: 'class',     desc: 'Ordered, resizable sequence backed by an array. O(1) indexed access, O(n) insert/remove at arbitrary positions.' },
    { name: 'Dictionary<K,V>',    type: 'class',     desc: 'Hash-table map from unique keys to values. O(1) average lookup, add, and remove. Key order is not guaranteed.' },
    { name: 'HashSet<T>',          type: 'class',     desc: 'Unordered set of unique values. O(1) add/remove/contains. Ideal for membership tests and set algebra.' },
    { name: 'Queue<T>',            type: 'class',     desc: 'First-in, first-out (FIFO) collection. Enqueue adds to the back; Dequeue removes from the front.' },
    { name: 'Stack<T>',            type: 'class',     desc: 'Last-in, first-out (LIFO) collection. Push adds to the top; Pop removes from the top. Useful for DFS and undo.' },
    { name: 'IEnumerable<T>',      type: 'interface', desc: 'The base interface for all sequences. Supports foreach and LINQ. Evaluation is lazy — nothing runs until iterated.' },
    { name: 'IReadOnlyList<T>',    type: 'interface', desc: 'Read-only view of an indexed list. Exposes Count and indexer but no mutation methods.' },
    { name: 'Span<T>',             type: 'class',     desc: 'Stack-only, zero-allocation view over a contiguous memory region (array, stackalloc, or unmanaged). Cannot be stored on the heap.' },
    { name: 'ImmutableList<T>',    type: 'class',     desc: 'Thread-safe, structurally-shared immutable list from System.Collections.Immutable. Mutations return a new instance.' },
    { name: '[]',                  type: 'keyword',   desc: 'C# 12 collection expression syntax. var nums = [1, 2, 3] infers the target type from context (array, List, Span, etc.).' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Choose the right collection',
      points: [
        'Use <code>List&lt;T&gt;</code> for ordered, mutable sequences where you need indexed access or frequent iteration.',
        'Use <code>Dictionary&lt;K,V&gt;</code> for fast key-based lookups — average O(1) regardless of collection size.',
        'Use <code>HashSet&lt;T&gt;</code> when uniqueness matters — it rejects duplicates and supports <code>UnionWith</code>, <code>IntersectWith</code>, <code>ExceptWith</code>.',
        'Use <code>Queue&lt;T&gt;</code> for task queues or BFS; use <code>Stack&lt;T&gt;</code> for DFS, expression evaluation, or undo/redo stacks.',
      ],
    },
    {
      heading: 'Program to interfaces, not implementations',
      points: [
        'Return <code>IEnumerable&lt;T&gt;</code> from methods that produce a sequence — callers can iterate without forcing materialisation.',
        'Return <code>IReadOnlyList&lt;T&gt;</code> when callers need indexed access but must not mutate the list.',
        'Accept <code>IEnumerable&lt;T&gt;</code> as a parameter to keep methods flexible — a <code>List</code>, array, or LINQ query all satisfy it.',
        'Only expose the concrete type (e.g., <code>List&lt;T&gt;</code>) when mutation is an intentional part of the API contract.',
      ],
    },
    {
      heading: 'Span<T> for zero-allocation slices',
      points: [
        '<code>Span&lt;T&gt;</code> is a <em>ref struct</em> — it lives on the stack only and cannot be stored in a field, captured in a lambda, or used across <code>await</code>.',
        'It provides a window over an existing buffer (array, stackalloc, or unmanaged memory) without copying any data.',
        'Use <code>ReadOnlySpan&lt;char&gt;</code> for zero-allocation string parsing — <code>str.AsSpan(start, length)</code> avoids a <code>Substring</code> heap allocation.',
        'For longer-lived views use <code>Memory&lt;T&gt;</code>; for buffer reuse across requests use <code>ArrayPool&lt;T&gt;</code>.',
      ],
    },
    {
      heading: 'Immutable collections',
      points: [
        '<code>System.Collections.Immutable</code> (NuGet <em>System.Collections.Immutable</em>, included in .NET 5+) provides <code>ImmutableList&lt;T&gt;</code>, <code>ImmutableDictionary&lt;K,V&gt;</code>, and friends.',
        'All mutating operations return a <em>new</em> collection sharing structure with the original — no locking needed for reads.',
        'Ideal for shared state in concurrent scenarios or functional-style programming where history / snapshotting matters.',
        'Use <code>ImmutableArray&lt;T&gt;</code> (a struct) instead of <code>ImmutableList&lt;T&gt;</code> when you need indexed access without heap overhead from nodes.',
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

// GetValueOrDefault — returns 0 (default) if key missing
int eveScore = scores.GetValueOrDefault("Eve");   // 0

// Case-insensitive dictionary
var ci = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
ci["hello"] = 1;
Console.WriteLine(ci["HELLO"]);           // 1`,
    },
    {
      label: 'LINQ-friendly collections',
      language: 'csharp',
      code: `using System.Collections.Generic;
using System.Linq;

// ── HashSet<T> — set operations ───────────────────────────────────
var setA = new HashSet<int> { 1, 2, 3, 4, 5 };
var setB = new HashSet<int> { 3, 4, 5, 6, 7 };

setA.UnionWith(setB);         // setA = {1,2,3,4,5,6,7}
setA.IntersectWith(setB);     // setA = {3,4,5,6,7}  (intersect with original setB)
setA.ExceptWith(setB);        // setA = {} (everything in setB removed)

// Uniqueness — duplicates are silently ignored
var unique = new HashSet<string> { "x", "y", "x", "z" };
Console.WriteLine(unique.Count);  // 3 — "x" only stored once

// ── SortedDictionary — keys always in sorted order ─────────────────
var sorted = new SortedDictionary<string, int>
{
    ["banana"] = 2,
    ["apple"]  = 5,
    ["cherry"] = 1,
};
// Iteration order: apple, banana, cherry (alphabetical)
foreach (var (key, val) in sorted)
    Console.WriteLine($"{key}: {val}");

// ── GroupBy with List ──────────────────────────────────────────────
record Product(string Name, string Category, decimal Price);

var products = new List<Product>
{
    new("Laptop",  "Electronics", 999m),
    new("Phone",   "Electronics", 699m),
    new("Desk",    "Furniture",   299m),
    new("Chair",   "Furniture",   199m),
    new("Monitor", "Electronics", 349m),
};

// Group by category, then find most expensive per group
var grouped = products
    .GroupBy(p => p.Category)
    .Select(g => new
    {
        Category   = g.Key,
        Count      = g.Count(),
        MaxPrice   = g.Max(p => p.Price),
        Items      = g.OrderByDescending(p => p.Price).ToList(),
    })
    .OrderBy(g => g.Category)
    .ToList();

foreach (var g in grouped)
    Console.WriteLine($"{g.Category}: {g.Count} items, max \${g.MaxPrice}");

// ── ToLookup — like GroupBy but materialised immediately ───────────
var lookup = products.ToLookup(p => p.Category);
foreach (Product p in lookup["Electronics"])
    Console.WriteLine(p.Name);   // Laptop, Phone, Monitor`,
    },
    {
      label: 'Queue, Stack & Priority',
      language: 'csharp',
      code: `// ── Queue<T> — FIFO (First In, First Out) ────────────────────────
// Ideal for: BFS, task queues, producer/consumer

var taskQueue = new Queue<string>();
taskQueue.Enqueue("SendEmail");
taskQueue.Enqueue("ResizeImage");
taskQueue.Enqueue("GenerateReport");

Console.WriteLine(taskQueue.Peek());       // "SendEmail" — look without removing
Console.WriteLine(taskQueue.Dequeue());    // "SendEmail" — remove & return
Console.WriteLine(taskQueue.Count);        // 2

while (taskQueue.Count > 0)
{
    string task = taskQueue.Dequeue();
    Console.WriteLine($"Processing: {task}");
}

// TryDequeue — non-throwing version
if (taskQueue.TryDequeue(out string? next))
    Console.WriteLine(next);
else
    Console.WriteLine("Queue is empty");

// ── Stack<T> — LIFO (Last In, First Out) ──────────────────────────
// Ideal for: DFS, undo/redo, expression evaluation

var undoStack = new Stack<string>();
undoStack.Push("TypeA");
undoStack.Push("TypeB");
undoStack.Push("DeleteC");

Console.WriteLine(undoStack.Peek());       // "DeleteC"
Console.WriteLine(undoStack.Pop());        // "DeleteC" — undo last action
Console.WriteLine(undoStack.Count);        // 2

// DFS example using Stack
var graph = new Dictionary<int, List<int>>
{
    [1] = [2, 3],
    [2] = [4],
    [3] = [4, 5],
    [4] = [],
    [5] = [],
};

var visited = new HashSet<int>();
var dfsStack = new Stack<int>();
dfsStack.Push(1);

while (dfsStack.Count > 0)
{
    int node = dfsStack.Pop();
    if (visited.Add(node))                 // HashSet.Add returns false if already present
    {
        Console.Write(node + " ");
        foreach (int neighbour in graph[node])
            dfsStack.Push(neighbour);
    }
}
// Output: 1 3 5 4 2  (DFS order)

// ── PriorityQueue<TElement, TPriority> (.NET 6+) ───────────────────
// Dequeues the element with the LOWEST priority value first

var pq = new PriorityQueue<string, int>();
pq.Enqueue("Low priority task",    10);
pq.Enqueue("Critical fix",          1);
pq.Enqueue("Medium priority task",  5);

while (pq.TryDequeue(out string? item, out int priority))
    Console.WriteLine($"[{priority}] {item}");
// [1] Critical fix
// [5] Medium priority task
// [10] Low priority task`,
    },
    {
      label: 'Span & Memory',
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
    ReadOnlySpan<char> token = comma >= 0
        ? remaining[..comma]
        : remaining;

    Console.WriteLine(token.ToString());  // no allocation per token

    remaining = comma >= 0
        ? remaining[(comma + 1)..]
        : ReadOnlySpan<char>.Empty;
}

// Compare without allocating a substring
ReadOnlySpan<char> name = "  Alice  ".AsSpan().Trim();
Console.WriteLine(name.SequenceEqual("Alice"));  // True — no new string

// ── ArrayPool<T> — reuse large buffers across requests ─────────────
ArrayPool<byte> pool = ArrayPool<byte>.Shared;

byte[] rented = pool.Rent(4096);          // may return larger than requested
try
{
    // use rented[0..4095] — treat as temporary scratch space
    Array.Fill(rented, (byte)0, 0, 4096);
    rented[0] = 0xFF;
    Console.WriteLine($"First byte: {rented[0]}");
}
finally
{
    pool.Return(rented);                   // ALWAYS return — prevents memory leaks
}

// ── Memory<T> — like Span but can cross async boundaries ──────────
Memory<int> mem = new int[100];
Memory<int> slice = mem.Slice(10, 20);    // no allocation
Span<int>   sp    = slice.Span;           // synchronous access`,
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
      explanation: 'An array has a fixed capacity determined at creation — you cannot add or remove elements. <code>List&lt;T&gt;</code> wraps an internal array and automatically resizes (doubles capacity) when needed, making it the go-to choice for mutable sequences. Both support LINQ and both are reference types on the heap.',
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
      q: 'What is Span&lt;T&gt; good for?',
      a: '<code>Span&lt;T&gt;</code> lets you work with a slice of an existing array or stack-allocated buffer without allocating a new object on the heap. The classic use case is string parsing: instead of calling <code>Substring</code> (which allocates a new string), you call <code>str.AsSpan(start, length)</code> and process the slice in place. <code>Span&lt;T&gt;</code> is also useful for high-throughput buffer manipulation in serialisers, parsers, and networking code. Its constraint — it is a <em>ref struct</em> so it cannot escape the stack — is intentional: it enforces safe, predictable lifetime.',
    },
    {
      q: 'How do I make a collection read-only so callers cannot mutate it?',
      a: 'There are several options depending on the level of guarantee you need. <strong>Cheapest:</strong> cast to <code>IReadOnlyList&lt;T&gt;</code> or <code>IReadOnlyDictionary&lt;K,V&gt;</code> before returning — callers see a read-only interface but the underlying list is still mutable if they cast it back. <strong>Wrap:</strong> call <code>list.AsReadOnly()</code> which returns a <code>ReadOnlyCollection&lt;T&gt;</code> wrapper that throws on mutation; the underlying data is still shared. <strong>Immutable copy:</strong> use <code>ImmutableList.CreateRange(list)</code> from <code>System.Collections.Immutable</code> — mutation methods return a new instance, so the original is truly safe. For arrays, <code>Array.AsReadOnly(arr)</code> works similarly to <code>AsReadOnly()</code> on a list.',
    },
  ];

  challenge: Challenge = {
    title: 'Word Frequency Counter with LINQ Top-N',
    description: `Implement a method that counts word frequencies in a string using a case-insensitive Dictionary<string, int>, then returns the top-N words by frequency using LINQ.

Requirements:
1. Use Dictionary<string, int> with StringComparer.OrdinalIgnoreCase
2. Split on whitespace and strip punctuation (.,!?;:) from each word
3. Skip empty tokens
4. Find the top-N words ordered by frequency (descending), then alphabetically on ties
5. Return a list of (word, count) tuples`,
    language: 'csharp',
    hints: [
      'Use sentence.Split() with no args to split on any whitespace',
      'Use word.Trim(\'.\', \',\', \'!\', \'?\', \';\', \':\') to strip punctuation',
      'Use dict.TryGetValue to safely increment counts',
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
// var results = TopWords("To be or not to be that is the question to be", 3);
// foreach (var (word, count) in results)
//     Console.WriteLine($"{word}: {count}");
// to: 3
// be: 3
// is: 1`,
  };
}
