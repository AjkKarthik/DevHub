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
  selector: 'app-csharp-arrays',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './arrays.html',
  styleUrl: './arrays.scss',
})
export class CsharpArrays {

  quickRef: QuickRefItem[] = [
    { name: 'int[]',              type: 'type',     desc: 'Single-dimensional array — fixed size, zero-indexed, contiguous in memory', since: 'C# 1' },
    { name: 'int[,]',             type: 'type',     desc: 'Multi-dimensional (rectangular) array — all rows have the same length', since: 'C# 1' },
    { name: 'int[][]',            type: 'type',     desc: 'Jagged array — array of arrays, each row can have a different length', since: 'C# 1' },
    { name: '[1, 2, 3]',          type: 'syntax',   desc: 'Collection expression — concise array/span initializer (C# 12)', since: 'C# 12' },
    { name: '..spread',           type: 'syntax',   desc: 'Spread in collection expression: int[] all = [..a, ..b]; — concatenates collections', since: 'C# 12' },
    { name: 'Array.Sort',         type: 'method',   desc: 'Sorts an array in place using the default or custom comparer', since: 'C# 1' },
    { name: 'Array.Reverse',      type: 'method',   desc: 'Reverses the order of elements in an array (or a range)', since: 'C# 1' },
    { name: 'Array.IndexOf',      type: 'method',   desc: 'Returns the index of the first occurrence of a value, or -1', since: 'C# 1' },
    { name: 'Array.Copy',         type: 'method',   desc: 'Copies a range of elements from one array to another', since: 'C# 1' },
    { name: 'Span<T>',            type: 'type',     desc: 'Stack-only view over a contiguous memory region — zero-allocation slicing', since: '.NET Core 2.1' },
    { name: 'Memory<T>',          type: 'type',     desc: 'Heap-safe slice wrapper — like Span<T> but usable in async methods and as fields', since: '.NET Core 2.1' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Array fundamentals',
      points: [
        'Arrays in C# are zero-indexed and fixed in size once created. Attempting to access an out-of-range index throws <code>IndexOutOfRangeException</code>.',
        'All arrays inherit from <code>System.Array</code>, which provides methods like <code>Sort</code>, <code>Reverse</code>, <code>IndexOf</code>, <code>Copy</code>, and <code>Fill</code>.',
        'The <code>Length</code> property gives total element count. For multi-dimensional arrays, <code>GetLength(dimension)</code> returns the size along one axis.',
        'Use <code>foreach</code> for safe iteration (no index needed), or <code>for</code> when you need the index or need to write elements.',
        'Value type arrays (<code>int[]</code>, <code>double[]</code>) store values directly in the array memory. Reference type arrays (<code>string[]</code>, <code>Order[]</code>) store references — the objects themselves live on the heap elsewhere.',
      ],
    },
    {
      heading: 'Multi-dimensional vs jagged arrays',
      points: [
        'A <em>rectangular</em> array <code>int[,]</code> has a fixed number of columns per row — stored as a single contiguous block in memory. Access with <code>arr[row, col]</code>.',
        'A <em>jagged</em> array <code>int[][]</code> is an array of arrays — each inner array can have a different length. Access with <code>arr[row][col]</code>.',
        'Jagged arrays are faster for uneven data (e.g. triangle tables) and are more compatible with LINQ because each row is a normal <code>int[]</code>.',
        'Rectangular arrays are better when the 2D grid is truly uniform and you want a single allocation with straightforward <code>GetLength</code> size inspection.',
        'Rectangular arrays do <em>not</em> implement <code>IEnumerable&lt;int&gt;</code> — you must use nested loops. Jagged arrays do implement it for each row, making LINQ usable per-row.',
      ],
    },
    {
      heading: 'Collection expressions (C# 12)',
      points: [
        'C# 12 introduces collection expressions: <code>int[] nums = [1, 2, 3, 4, 5];</code> — no <code>new int[]</code> needed.',
        'The spread element <code>..</code> lets you embed one collection inside another: <code>int[] all = [..a, ..b];</code>.',
        'Collection expressions work for arrays, <code>List&lt;T&gt;</code>, <code>Span&lt;T&gt;</code>, <code>ReadOnlySpan&lt;T&gt;</code>, and any type with a <code>CollectionBuilderAttribute</code>.',
        'The compiler picks the most efficient construction strategy — for <code>Span&lt;T&gt;</code> it may use stack allocation instead of heap.',
        'Empty collection expression <code>[]</code> replaces <code>Array.Empty&lt;T&gt;()</code> and <code>new List&lt;T&gt;()</code> — the compiler infers the target type.',
      ],
    },
    {
      heading: 'Span<T> for zero-allocation slices',
      points: [
        '<code>Span&lt;T&gt;</code> is a ref struct that points to a contiguous region of memory — an array slice, a stack-allocated buffer, or unmanaged memory — without copying.',
        'Use it to avoid allocating sub-arrays: <code>Span&lt;int&gt; slice = arr.AsSpan(2, 3);</code> gives you elements 2–4 with no allocation.',
        '<code>Span&lt;T&gt;</code> cannot be stored on the heap (it is a ref struct), so it cannot be used as a field, in async methods, or captured in lambdas. Use <code>Memory&lt;T&gt;</code> for those cases.',
        '<code>ReadOnlySpan&lt;T&gt;</code> is the read-only counterpart and is used heavily in the BCL for parsing and string slicing.',
        '<code>stackalloc</code> allocates a buffer directly on the stack: <code>Span&lt;int&gt; buf = stackalloc int[64];</code>. No GC pressure at all — but the buffer is destroyed when the method returns.',
      ],
    },
    {
      heading: 'Array covariance and the write-safety trap',
      points: [
        'C# allows assigning a derived array type to a base array variable: <code>string[] strs = ...; object[] objs = strs;</code>. This is called array covariance.',
        'Reading from <code>objs</code> is safe — you get <code>object</code>-typed references to strings. But writing a non-string breaks type safety: <code>objs[0] = 42;</code> throws <code>ArrayTypeMismatchException</code> at runtime.',
        'This is a design flaw in C# (inherited from Java compatibility needs). The write check happens at runtime, not compile time, because the compiler cannot statically know what the array actually holds.',
        'Generics solve this properly: <code>IEnumerable&lt;string&gt;</code> is covariant (read-only), but <code>List&lt;string&gt;</code> is not assignable to <code>List&lt;object&gt;</code> — the compiler prevents it at compile time.',
        'Practical rule: never rely on array covariance for mutation. If you need to store mixed types, use <code>object[]</code> from the start; if you need type-safe covariance, use <code>IReadOnlyList&lt;T&gt;</code> or <code>IEnumerable&lt;T&gt;</code>.',
      ],
    },
    {
      heading: 'LINQ on arrays',
      points: [
        'Arrays implement <code>IEnumerable&lt;T&gt;</code>, so all LINQ extension methods (Where, Select, OrderBy, GroupBy, etc.) work directly on them.',
        'LINQ on arrays is deferred — the query is not executed until you enumerate it (foreach, ToArray, ToList, First, etc.). This can save work but can also cause surprising repeated execution.',
        'Common array-to-array LINQ pipelines: <code>arr.Where(x => x &gt; 0).ToArray()</code>, <code>arr.Select(x => x * 2).ToArray()</code>, <code>arr.OrderBy(x => x).ToArray()</code>.',
        'For in-place operations (no new collection), prefer <code>Array.Sort</code> and <code>Array.Reverse</code> over LINQ — they mutate the array directly with no allocation.',
        'LINQ\'s <code>Aggregate</code> and <code>Sum</code>/<code>Max</code>/<code>Min</code>/<code>Average</code> compute statistics cleanly: <code>arr.Sum()</code>, <code>arr.Max()</code>, <code>arr.Average()</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Array Basics',
      language: 'csharp',
      code: `// ── Declaration and initialisation ──────────────────────────────────
int[] scores = new int[5];            // all zeros
int[] primes = new int[] { 2, 3, 5, 7, 11 };
int[] evens  = { 2, 4, 6, 8, 10 };   // shorthand initializer

// C# 12 collection expression — no 'new' needed
int[] odds = [1, 3, 5, 7, 9];

Console.WriteLine(primes.Length);     // 5
Console.WriteLine(primes[0]);         // 2
Console.WriteLine(primes[^1]);        // 11  (index from end)

// ── Iteration ─────────────────────────────────────────────────────────
foreach (int p in primes)
    Console.Write($"{p} ");           // 2 3 5 7 11

// ── Modify elements ──────────────────────────────────────────────────
scores[0] = 95;
scores[1] = 82;

// ── Array.Fill ──────────────────────────────────────────────────────
Array.Fill(scores, 0);               // reset all to 0

// ── Range slicing (System.Range) ─────────────────────────────────────
int[] middle = primes[1..4];         // [3, 5, 7]
int[] last2  = primes[^2..];         // [7, 11]
Console.WriteLine(string.Join(", ", middle));  // 3, 5, 7

// ── C# 12 spread operator ────────────────────────────────────────────
int[] a = [1, 2, 3];
int[] b = [4, 5, 6];
int[] all = [..a, 0, ..b];           // [1, 2, 3, 0, 4, 5, 6]`,
    },
    {
      label: 'Sort, Reverse & Search',
      language: 'csharp',
      code: `int[] nums = { 5, 2, 8, 1, 9, 3 };

// ── Sort ascending ──────────────────────────────────────────────────
Array.Sort(nums);
Console.WriteLine(string.Join(", ", nums));  // 1, 2, 3, 5, 8, 9

// ── Reverse ─────────────────────────────────────────────────────────
Array.Reverse(nums);
Console.WriteLine(string.Join(", ", nums));  // 9, 8, 5, 3, 2, 1

// ── Binary search (array must be sorted first) ────────────────────────
Array.Sort(nums);          // sort back to ascending
int idx = Array.BinarySearch(nums, 5);
Console.WriteLine(idx);   // 3

// ── IndexOf (linear search — no sort required) ────────────────────────
Array.Reverse(nums);       // descending again
int pos = Array.IndexOf(nums, 8);
Console.WriteLine(pos);   // 1

// ── Sort with custom comparer ─────────────────────────────────────────
string[] words = { "banana", "apple", "cherry", "date" };
Array.Sort(words, StringComparer.OrdinalIgnoreCase);
Console.WriteLine(string.Join(", ", words));  // apple, banana, cherry, date

// ── Sort by length using lambda ────────────────────────────────────────
Array.Sort(words, (x, y) => x.Length.CompareTo(y.Length));
Console.WriteLine(string.Join(", ", words));  // date, apple, banana, cherry

// ── LINQ for sorting without mutation ─────────────────────────────────
int[] sorted = nums.OrderBy(x => x).ToArray();  // nums unchanged`,
    },
    {
      label: 'Multi-dim & Jagged',
      language: 'csharp',
      code: `// ── Rectangular 2D array ─────────────────────────────────────────────
int[,] grid = new int[3, 3];
grid[0, 0] = 1; grid[0, 1] = 2; grid[0, 2] = 3;
grid[1, 0] = 4; grid[1, 1] = 5; grid[1, 2] = 6;
grid[2, 0] = 7; grid[2, 1] = 8; grid[2, 2] = 9;

Console.WriteLine(grid[1, 2]);        // 6
Console.WriteLine(grid.GetLength(0)); // 3 rows
Console.WriteLine(grid.GetLength(1)); // 3 cols

// Iterate rectangular array
for (int r = 0; r < grid.GetLength(0); r++)
{
    for (int c = 0; c < grid.GetLength(1); c++)
        Console.Write($"{grid[r, c]} ");
    Console.WriteLine();
}

// ── Jagged array — rows of different lengths ──────────────────────────
int[][] triangle = new int[4][];
for (int i = 0; i < triangle.Length; i++)
{
    triangle[i] = new int[i + 1];
    Array.Fill(triangle[i], i + 1);
}
// triangle[0] = [1]
// triangle[1] = [2, 2]
// triangle[2] = [3, 3, 3]
// triangle[3] = [4, 4, 4, 4]

foreach (int[] row in triangle)
    Console.WriteLine(string.Join(" ", row));

// ── LINQ on jagged arrays ─────────────────────────────────────────────
int total = triangle.Sum(row => row.Sum());  // 1 + 4 + 9 + 16 = 30
Console.WriteLine(total);`,
    },
    {
      label: 'Span<T> & Covariance',
      language: 'csharp',
      code: `// ── Zero-allocation slice with Span<T> ───────────────────────────────
int[] data = { 10, 20, 30, 40, 50, 60 };

Span<int> slice = data.AsSpan(2, 3);  // elements at index 2, 3, 4
Console.WriteLine(slice[0]);          // 30
Console.WriteLine(slice.Length);      // 3

// Writes through Span mutate the original array
slice[0] = 999;
Console.WriteLine(data[2]);           // 999

// ── stackalloc — zero-copy, zero-heap ────────────────────────────────
Span<int> buf = stackalloc int[8];
for (int i = 0; i < buf.Length; i++) buf[i] = i * i;
Console.WriteLine(buf[4]);            // 16

// ── Memory<T> — safe across async boundaries ─────────────────────────
async Task ProcessAsync(Memory<int> mem)
{
    await Task.Delay(1);              // Span<T> can't cross await; Memory<T> can
    foreach (int n in mem.Span) Console.Write($"{n} ");
}

// ── Array covariance trap ─────────────────────────────────────────────
string[] strings = { "hello", "world" };
object[] objects = strings;           // valid — array covariance

Console.WriteLine(objects[0]);        // "hello" — safe read

// objects[0] = 42;                   // compiles! But throws at runtime:
//   ArrayTypeMismatchException — the underlying array is string[]

// Safe alternative: avoid writing through a covariant reference
// Or use IReadOnlyList<string> which prevents mutation entirely`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Array covariance: writing to a covariant array reference',
      wrong: `string[] names = { "Alice", "Bob" };
object[] objs = names;   // compiles — array covariance

objs[0] = 42;  // compiles! But throws ArrayTypeMismatchException at runtime`,
      right: `// Option 1: keep the original type
string[] names = { "Alice", "Bob" };
names[0] = "Carol";   // safe — compiler enforces string

// Option 2: use IReadOnlyList<T> for covariant read-only access
IReadOnlyList<string> readOnly = names;`,
      explanation: 'C# allows assigning string[] to object[], but writing a non-string through the object[] variable throws at runtime. The compiler cannot catch this because the covariance check is deferred. If you need read-only covariance, use IReadOnlyList<T> or IEnumerable<T> — these are properly covariant and prevent writes.',
    },
    {
      title: 'Allocating a sub-array instead of using Span<T> in hot paths',
      wrong: `int[] data = GetLargeArray();

// Allocates a new 1000-element array on the heap on every call
int[] slice = data[500..1500];
ProcessSlice(slice);`,
      right: `int[] data = GetLargeArray();

// Zero-allocation view into the existing array
Span<int> slice = data.AsSpan(500, 1000);
ProcessSlice(slice);

static void ProcessSlice(Span<int> s) { /* ... */ }`,
      explanation: 'Range indexing (arr[2..5]) creates a new heap-allocated array. In hot paths this generates GC pressure. Span<T>.AsSpan() returns a zero-allocation view into the original memory. Only works when the method receiving the slice accepts Span<T> or ReadOnlySpan<T>.',
    },
    {
      title: 'Using Array.Resize when List<T> is the right tool',
      wrong: `int[] buffer = new int[10];
// Need to add more elements — have to resize:
Array.Resize(ref buffer, 20);   // allocates new array + copies 10 elements
Array.Resize(ref buffer, 30);   // allocates + copies again`,
      right: `// If size is dynamic, use List<T> from the start
var buffer = new List<int>(10);  // initial capacity hint (no required)
buffer.Add(42);
buffer.Add(99);
// List doubles capacity internally — amortized O(1) add
int[] final = buffer.ToArray();  // only allocate array when size is known`,
      explanation: 'Array.Resize creates a new array and copies all elements — it is O(n) per call. If you need to grow a collection dynamically, List<T> is the right structure. It maintains an internal array and doubles capacity when needed, giving amortized O(1) Add. Convert to an array with ToArray() once the final size is known.',
    },
    {
      title: 'Assuming Clone() gives a deep copy for reference type arrays',
      wrong: `var original = new Order[] { new Order { Id = 1 }, new Order { Id = 2 } };
var copy = (Order[])original.Clone();

copy[0].Id = 999;   // modifies the original[0] object too!
Console.WriteLine(original[0].Id);  // 999 — not independent!`,
      right: `// Deep copy: create new objects, not just new references
var copy = original.Select(o => new Order { Id = o.Id }).ToArray();

copy[0].Id = 999;
Console.WriteLine(original[0].Id);  // still 1 — truly independent`,
      explanation: 'Clone() (and arr[..]) performs a shallow copy — it creates a new array but copies the references, not the objects they point to. Modifying a copied object through the new array also affects the original. Deep copying requires explicitly creating new instances of each element.',
    },
    {
      title: 'Forgetting that for-loop bounds should use .Length, not a magic number',
      wrong: `int[] data = LoadData();
for (int i = 0; i < 100; i++)  // hardcoded 100 — IndexOutOfRangeException if data.Length < 100
{
    Process(data[i]);
}`,
      right: `int[] data = LoadData();
for (int i = 0; i < data.Length; i++)
{
    Process(data[i]);
}
// Or: foreach (var item in data) Process(item);`,
      explanation: 'Hardcoding array bounds is a classic off-by-one and IndexOutOfRangeException source. Always use arr.Length (or arr.GetLength(0) for multi-dimensional) as the loop bound. For read-only iteration with no index needed, foreach is safer and clearer.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between int[,] and int[][] in C#?',
      options: [
        'int[,] is a jagged array; int[][] is a rectangular array',
        'int[,] is a rectangular array where all rows have the same length; int[][] is a jagged array where rows can have different lengths',
        'They are identical — just different syntax for the same thing',
        'int[][] cannot be iterated with foreach',
      ],
      answer: 1,
      explanation: '<code>int[,]</code> is a single contiguous block of memory where every row must have the same number of columns — access with <code>arr[r, c]</code>. <code>int[][]</code> is an array of separate arrays, each of which can have a different length — access with <code>arr[r][c]</code>.',
    },
    {
      q: 'What does Array.BinarySearch require before it can be used?',
      options: [
        'Nothing — it works on any array',
        'The array must contain only integers',
        'The array must be sorted in ascending order',
        'The array must have at least 10 elements',
      ],
      answer: 2,
      explanation: 'Binary search relies on the array being sorted to repeatedly halve the search space. If the array is unsorted, the result is undefined. Always call <code>Array.Sort</code> first, or use <code>Array.IndexOf</code> for an unsorted linear search.',
    },
    {
      q: 'What is the main advantage of Span&lt;T&gt; over creating a sub-array with a range index?',
      options: [
        'Span<T> is mutable; range-indexed sub-arrays are read-only',
        'Span<T> does not allocate on the heap — it is a zero-copy view into existing memory',
        'Span<T> automatically resizes when you add elements',
        'Span<T> supports async/await; range sub-arrays do not',
      ],
      answer: 1,
      explanation: 'Creating a sub-array (<code>arr[2..5]</code>) allocates a new array on the heap and copies the elements. <code>Span&lt;T&gt;</code> is a ref struct that stores a pointer and length, pointing into the original array with zero allocation and zero copying.',
    },
    {
      q: 'You assign string[] to object[] and then write: objs[0] = 42. What happens?',
      options: [
        'The compiler rejects the assignment — type mismatch',
        'It works — 42 is boxed to object and stored',
        'ArrayTypeMismatchException is thrown at runtime',
        'The string at index 0 is silently replaced by the string representation of 42',
      ],
      answer: 2,
      explanation: 'C# allows assigning <code>string[]</code> to <code>object[]</code> (array covariance). Reading is safe, but writing a non-<code>string</code> throws <code>ArrayTypeMismatchException</code> at runtime — the runtime checks that the value is compatible with the array\'s actual element type. The compiler does not catch this.',
    },
    {
      q: 'What does Array.Resize(ref arr, 20) actually do?',
      options: [
        'It expands the existing array in place to 20 elements',
        'It allocates a new array of size 20, copies existing elements, and reassigns the ref parameter',
        'It throws InvalidOperationException — arrays cannot be resized',
        'It pads the array with default values up to 20 without copying',
      ],
      answer: 1,
      explanation: 'Arrays are fixed in memory — resizing cannot happen in place. <code>Array.Resize</code> allocates a brand new array of the target size, copies the original elements into it (truncating or padding with defaults as needed), then sets the <code>ref</code> parameter to the new array. The original array is abandoned. This is O(n) per call — use <code>List&lt;T&gt;</code> when dynamic growth is needed.',
    },
    {
      q: 'Which of the following correctly uses a C# 12 collection expression with the spread operator?',
      options: [
        'int[] all = new int[] { ...a, ...b };',
        'int[] all = [..a, ..b];',
        'int[] all = [*a, *b];',
        'int[] all = Concat(a, b);',
      ],
      answer: 1,
      explanation: 'C# 12 collection expressions use <code>[</code> and <code>]</code> with two dots <code>..</code> as the spread element: <code>[..a, ..b]</code> produces a new array with all elements of <code>a</code> followed by all elements of <code>b</code>. The compiler generates efficient IL for this.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I copy an array in C#?',
      a: 'There are several options. <code>Array.Copy(src, dst, length)</code> copies elements between arrays with fine-grained control. <code>(int[])arr.Clone()</code> creates a shallow copy. <code>int[] copy = arr[..];</code> is the modern range-based equivalent. All three are <em>shallow</em> copies — if the array holds reference types, the references are copied, not the objects themselves. For a deep copy, create new instances manually: <code>arr.Select(x => new Foo(x)).ToArray()</code>.',
    },
    {
      q: 'When should I use for vs foreach over an array?',
      a: 'Use <code>foreach</code> when you only need to read elements — it is safer (no off-by-one errors) and more expressive. Use <code>for</code> when you need the index (e.g. to compare adjacent elements, write to specific positions, or iterate in reverse). For performance-critical loops over large arrays, <code>for</code> with direct index access can be marginally faster because the JIT can eliminate bounds checks when it can prove the index is always in range.',
    },
    {
      q: 'Can I resize an array after creation?',
      a: 'Arrays are fixed-size — you cannot add or remove elements. To "resize", use <code>Array.Resize(ref arr, newSize)</code>, which allocates a new array and copies elements. However, if you need a dynamically sized collection, use <code>List&lt;T&gt;</code> instead — it is backed by an array internally and doubles capacity as needed with amortized O(1) Add. Reserve arrays for fixed-size, performance-sensitive scenarios where the size is known up front.',
    },
    {
      q: 'What is the difference between Span<T> and Memory<T>?',
      a: '<code>Span&lt;T&gt;</code> is a ref struct and can only live on the stack — it cannot be stored as a class field, used in async methods, or captured in lambdas. <code>Memory&lt;T&gt;</code> is a regular struct without these restrictions; it can be stored on the heap, passed across async boundaries, and used as a field. When you only need synchronous, local slicing, prefer <code>Span&lt;T&gt;</code> for maximum efficiency. Use <code>Memory&lt;T&gt;</code> when you need to pass the slice into an async pipeline.',
    },
    {
      q: 'Does LINQ work on arrays?',
      a: 'Yes — arrays implement <code>IEnumerable&lt;T&gt;</code>, so all LINQ extension methods (Where, Select, OrderBy, GroupBy, Aggregate, Sum, etc.) work on them. LINQ operations are deferred — the query is not executed until you enumerate it. LINQ creates new collections (<code>ToArray()</code>, <code>ToList()</code>) rather than modifying the original. For in-place operations (no new collection), <code>Array.Sort</code> and <code>Array.Reverse</code> are more efficient.',
    },
    {
      q: 'What happens if I access arr[-1] or arr[arr.Length] in C#?',
      a: 'Either access throws <code>IndexOutOfRangeException</code> at runtime. C# does not support negative array indices (unlike Python). The valid range is 0 to <code>arr.Length - 1</code>. C# 8 introduced the hat operator (<code>^</code>) for index-from-end: <code>arr[^1]</code> is the last element, equivalent to <code>arr[arr.Length - 1]</code>. This is syntactic sugar — it still throws if the array is empty.',
    },
  ];

  challenge: Challenge = {
    title: 'Array Statistics',
    description: `Write a static class ArrayStats with three methods:
1. Rotate(int[] arr, int k) — rotates the array left by k positions in-place (e.g. [1,2,3,4,5] rotated left by 2 → [3,4,5,1,2]).
2. SecondLargest(int[] arr) — returns the second-largest distinct value, or int.MinValue if there is none.
3. Flatten(int[][] jagged) — flattens a jagged array into a single int[] in order.`,
    language: 'csharp',
    hints: [
      'Rotate: use k %= arr.Length to handle k > arr.Length. Then copy elements into a temp array.',
      'SecondLargest: clone + sort + scan backwards, skipping duplicates of the max.',
      'Flatten: count total elements first (sum of row lengths), then Array.Copy each row.',
      'Array.Copy(src, srcOffset, dst, dstOffset, count) copies a range between arrays.',
    ],
    starterCode: `static class ArrayStats
{
    public static void Rotate(int[] arr, int k)
    {
        // TODO: rotate left by k positions in-place
        throw new NotImplementedException();
    }

    public static int SecondLargest(int[] arr)
    {
        // TODO: return second-largest distinct value, or int.MinValue
        throw new NotImplementedException();
    }

    public static int[] Flatten(int[][] jagged)
    {
        // TODO: flatten jagged array into a single array
        throw new NotImplementedException();
    }
}

// Tests
int[] nums = { 1, 2, 3, 4, 5 };
ArrayStats.Rotate(nums, 2);
Console.WriteLine(string.Join(",", nums));  // 3,4,5,1,2

Console.WriteLine(ArrayStats.SecondLargest(new[] { 4, 1, 9, 9, 3 }));  // 4

int[][] jag = { new[] { 1, 2 }, new[] { 3, 4, 5 }, new[] { 6 } };
Console.WriteLine(string.Join(",", ArrayStats.Flatten(jag)));  // 1,2,3,4,5,6`,
    solution: `static class ArrayStats
{
    public static void Rotate(int[] arr, int k)
    {
        if (arr.Length == 0) return;
        k %= arr.Length;
        if (k == 0) return;
        int[] tmp = new int[arr.Length];
        Array.Copy(arr, k, tmp, 0, arr.Length - k);
        Array.Copy(arr, 0, tmp, arr.Length - k, k);
        Array.Copy(tmp, arr, arr.Length);
    }

    public static int SecondLargest(int[] arr)
    {
        int[] sorted = (int[])arr.Clone();
        Array.Sort(sorted);
        Array.Reverse(sorted);
        int first = sorted[0];
        for (int i = 1; i < sorted.Length; i++)
            if (sorted[i] < first) return sorted[i];
        return int.MinValue;
    }

    public static int[] Flatten(int[][] jagged)
    {
        int total = 0;
        foreach (var row in jagged) total += row.Length;
        int[] result = new int[total];
        int offset = 0;
        foreach (var row in jagged)
        {
            Array.Copy(row, 0, result, offset, row.Length);
            offset += row.Length;
        }
        return result;
    }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Arrays are fixed-size, zero-indexed, contiguous memory blocks. Use Span<T> for slicing without allocation, List<T> when size is dynamic, and watch out for covariance write traps.',
    mustKnow: [
      'Arrays are fixed in size — no Add/Remove. Use <code>Array.Resize</code> (O(n) copy) or switch to <code>List&lt;T&gt;</code> for dynamic sizing.',
      '<code>int[,]</code> = rectangular, single contiguous block, all rows same length. <code>int[][]</code> = jagged, array of arrays, rows can differ in length.',
      'C# 12 collection expression: <code>[1, 2, 3]</code>. Spread: <code>[..a, ..b]</code>. Works for arrays, List<T>, Span<T>.',
      '<code>Span&lt;T&gt;</code>: zero-allocation view into contiguous memory. Cannot cross await or be stored on the heap. Use <code>Memory&lt;T&gt;</code> for async/field scenarios.',
      'Array covariance trap: <code>string[]</code> is assignable to <code>object[]</code>, but writing a non-string throws <code>ArrayTypeMismatchException</code> at runtime.',
      'Arrays implement <code>IEnumerable&lt;T&gt;</code> — all LINQ methods work. <code>Array.Sort</code> / <code>Array.Reverse</code> mutate in place; LINQ creates new collections.',
      '<code>Clone()</code> and range copies are shallow — reference type element objects are not duplicated. For deep copy, create new instances per element.',
    ],
    interviewFocus: [
      'What is the difference between int[,] and int[][]? (rectangular vs jagged; access syntax; memory layout)',
      'What is array covariance and why is it dangerous? (string[] → object[] compiles; writing non-string throws at runtime)',
      'What does Span<T> give you that a range sub-array doesn\'t? (zero allocation, zero copy — ref struct view into existing memory)',
      'When would you use Array over List<T>? (fixed size known upfront, performance-critical, interop with Span/stackalloc)',
      'Is Clone() a deep or shallow copy? (shallow — copies references, not objects; must manually create new instances for deep copy)',
    ],
  };
}
