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
  selector: 'app-csharp-arrays',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './arrays.html',
  styleUrl: './arrays.scss',
})
export class CsharpArrays {

  quickRef: QuickRefItem[] = [
    { name: 'int[]',              type: 'type',     desc: 'Single-dimensional array — fixed size, zero-indexed, contiguous in memory', since: 'C# 1' },
    { name: 'int[,]',             type: 'type',     desc: 'Multi-dimensional (rectangular) array — all rows have the same length', since: 'C# 1' },
    { name: 'int[][]',            type: 'type',     desc: 'Jagged array — array of arrays, each row can have a different length', since: 'C# 1' },
    { name: '[1, 2, 3]',          type: 'syntax',   desc: 'Collection expression — concise array/span initialiser (C# 12)', since: 'C# 12' },
    { name: 'Array.Sort',         type: 'method',   desc: 'Sorts an array in place using the default or custom comparer', since: 'C# 1' },
    { name: 'Array.Reverse',      type: 'method',   desc: 'Reverses the order of elements in an array (or a range)', since: 'C# 1' },
    { name: 'Array.IndexOf',      type: 'method',   desc: 'Returns the index of the first occurrence of a value, or -1', since: 'C# 1' },
    { name: 'Span<T>',            type: 'type',     desc: 'Stack-only view over a contiguous memory region — zero-allocation slicing', since: '.NET Core 2.1' },
    { name: 'ArraySegment<T>',    type: 'type',     desc: 'Managed wrapper representing a slice of an array with Offset and Count', since: '.NET 2' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Array fundamentals',
      points: [
        'Arrays in C# are zero-indexed and fixed in size once created. Attempting to access an out-of-range index throws <code>IndexOutOfRangeException</code>.',
        'All arrays inherit from <code>System.Array</code>, which provides methods like <code>Sort</code>, <code>Reverse</code>, <code>IndexOf</code>, <code>Copy</code>, and <code>Fill</code>.',
        'The <code>Length</code> property gives total element count. For multi-dimensional arrays, <code>GetLength(dimension)</code> returns the size along one axis.',
        'Use <code>foreach</code> for safe iteration (no index needed), or <code>for</code> when you need the index or need to write elements.',
      ],
    },
    {
      heading: 'Multi-dimensional vs jagged arrays',
      points: [
        'A <em>rectangular</em> array <code>int[,]</code> has a fixed number of columns per row — stored as a single contiguous block in memory. Access with <code>arr[row, col]</code>.',
        'A <em>jagged</em> array <code>int[][]</code> is an array of arrays — each inner array can have a different length. Access with <code>arr[row][col]</code>.',
        'Jagged arrays are faster for uneven data (e.g. triangle tables) and are more compatible with LINQ because each row is a normal <code>int[]</code>.',
        'Rectangular arrays are better when the 2D grid is truly uniform and you want a single allocation.',
      ],
    },
    {
      heading: 'Collection expressions (C# 12)',
      points: [
        'C# 12 introduces collection expressions: <code>int[] nums = [1, 2, 3, 4, 5];</code> — no <code>new int[]</code> needed.',
        'The spread element <code>..</code> lets you embed one collection inside another: <code>int[] all = [..a, ..b];</code>.',
        'Collection expressions work for arrays, <code>List&lt;T&gt;</code>, <code>Span&lt;T&gt;</code>, <code>ReadOnlySpan&lt;T&gt;</code>, and any type with a <code>CollectionBuilderAttribute</code>.',
        'The compiler picks the most efficient construction strategy — for <code>Span&lt;T&gt;</code> it may use stack allocation instead of heap.',
      ],
    },
    {
      heading: 'Span<T> for zero-allocation slices',
      points: [
        '<code>Span&lt;T&gt;</code> is a ref struct that points to a contiguous region of memory — an array slice, a stack-allocated buffer, or unmanaged memory — without copying.',
        'Use it to avoid allocating sub-arrays: <code>Span&lt;int&gt; slice = arr.AsSpan(2, 3);</code> gives you elements 2–4 with no allocation.',
        '<code>Span&lt;T&gt;</code> cannot be stored on the heap (it is a ref struct), so it cannot be used as a field, in async methods, or captured in lambdas. Use <code>Memory&lt;T&gt;</code> for those cases.',
        '<code>ReadOnlySpan&lt;T&gt;</code> is the read-only counterpart and is used heavily in the BCL for parsing and string slicing.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Array Basics',
      language: 'csharp',
      code: `// ── Declaration and initialisation ─────────────────────────────────────
int[] scores = new int[5];           // all zeros
int[] primes = new int[] { 2, 3, 5, 7, 11 };
int[] evens  = { 2, 4, 6, 8, 10 };  // shorthand

// C# 12 collection expression
int[] odds = [1, 3, 5, 7, 9];

Console.WriteLine(primes.Length);    // 5
Console.WriteLine(primes[0]);        // 2
Console.WriteLine(primes[^1]);       // 11  (index from end)

// ── Iteration ──────────────────────────────────────────────────────────
foreach (int p in primes)
    Console.Write(\`\${p} \`);           // 2 3 5 7 11

// ── Modify elements ────────────────────────────────────────────────────
scores[0] = 95;
scores[1] = 82;

// ── Array.Fill ─────────────────────────────────────────────────────────
Array.Fill(scores, 0);              // reset all to 0

// ── Range slicing (System.Range) ───────────────────────────────────────
int[] middle = primes[1..4];        // [3, 5, 7]
int[] last2  = primes[^2..];        // [7, 11]
Console.WriteLine(string.Join(", ", middle));  // 3, 5, 7`,
    },
    {
      label: 'Sort, Reverse & Search',
      language: 'csharp',
      code: `int[] nums = { 5, 2, 8, 1, 9, 3 };

// ── Sort ascending ─────────────────────────────────────────────────────
Array.Sort(nums);
Console.WriteLine(string.Join(", ", nums));  // 1, 2, 3, 5, 8, 9

// ── Reverse ────────────────────────────────────────────────────────────
Array.Reverse(nums);
Console.WriteLine(string.Join(", ", nums));  // 9, 8, 5, 3, 2, 1

// ── Binary search (array must be sorted first) ─────────────────────────
Array.Sort(nums);   // back to ascending
int idx = Array.BinarySearch(nums, 5);
Console.WriteLine(idx);   // 3

// ── IndexOf (linear search) ────────────────────────────────────────────
int pos = Array.IndexOf(nums, 8);
Console.WriteLine(pos);   // 4

// ── Sort with custom comparer ──────────────────────────────────────────
string[] words = { "banana", "apple", "cherry", "date" };
Array.Sort(words, StringComparer.OrdinalIgnoreCase);
Console.WriteLine(string.Join(", ", words));  // apple, banana, cherry, date

// ── Sort by length ─────────────────────────────────────────────────────
Array.Sort(words, (a, b) => a.Length.CompareTo(b.Length));
Console.WriteLine(string.Join(", ", words));  // date, apple, banana, cherry`,
    },
    {
      label: 'Multi-dim & Jagged',
      language: 'csharp',
      code: `// ── Rectangular 2D array ──────────────────────────────────────────────
int[,] grid = new int[3, 3];
grid[0, 0] = 1; grid[0, 1] = 2; grid[0, 2] = 3;
grid[1, 0] = 4; grid[1, 1] = 5; grid[1, 2] = 6;
grid[2, 0] = 7; grid[2, 1] = 8; grid[2, 2] = 9;

Console.WriteLine(grid[1, 2]);       // 6
Console.WriteLine(grid.GetLength(0)); // 3 rows
Console.WriteLine(grid.GetLength(1)); // 3 cols

// Iterate rectangular array
for (int r = 0; r < grid.GetLength(0); r++)
{
    for (int c = 0; c < grid.GetLength(1); c++)
        Console.Write(\`\${grid[r, c]} \`);
    Console.WriteLine();
}

// ── Jagged array — rows of different lengths ───────────────────────────
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
    Console.WriteLine(string.Join(" ", row));`,
    },
    {
      label: 'Span<T> Slicing',
      language: 'csharp',
      code: `int[] data = { 10, 20, 30, 40, 50, 60, 70, 80 };

// ── Zero-allocation slice ──────────────────────────────────────────────
Span<int> slice = data.AsSpan(2, 4);   // elements at index 2,3,4,5
Console.WriteLine(slice[0]);  // 30
Console.WriteLine(slice.Length); // 4

// Modifying through Span modifies the original array
slice[0] = 999;
Console.WriteLine(data[2]);   // 999

// ── ReadOnlySpan for safe reads ────────────────────────────────────────
ReadOnlySpan<int> view = data.AsSpan(0, 3);
// view[0] = 1;  // compile error — read-only

// ── Span over stack-allocated buffer ──────────────────────────────────
Span<int> stackBuf = stackalloc int[8];  // no heap allocation at all
for (int i = 0; i < stackBuf.Length; i++)
    stackBuf[i] = i * 2;
Console.WriteLine(stackBuf[3]);  // 6

// ── ArraySegment (older alternative) ──────────────────────────────────
int[] arr = { 1, 2, 3, 4, 5 };
var seg = new ArraySegment<int>(arr, 1, 3);  // offset 1, count 3
foreach (int n in seg)
    Console.Write(\`\${n} \`);   // 2 3 4

// ── C# 12 spread in collection expression ─────────────────────────────
int[] a = [1, 2, 3];
int[] b = [4, 5, 6];
int[] combined = [..a, ..b];    // [1, 2, 3, 4, 5, 6]
Console.WriteLine(combined.Length); // 6`,
    },
  ];

  challenge: Challenge = {
    title: 'Array Statistics',
    description: `Write a static class <code>ArrayStats</code> with three methods:
1. <code>Rotate(int[] arr, int k)</code> — rotates the array <em>left</em> by <code>k</code> positions in-place (e.g. [1,2,3,4,5] rotated left by 2 → [3,4,5,1,2]).
2. <code>SecondLargest(int[] arr)</code> — returns the second-largest distinct value, or <code>int.MinValue</code> if there is none.
3. <code>Flatten(int[][] jagged)</code> — flattens a jagged array into a single <code>int[]</code> in order.`,
    language: 'csharp',
    hints: [
      'Rotate: use Array.Copy or a reverse-based algorithm. Simplest: copy to new array and write back.',
      'SecondLargest: sort a copy (Array.Sort), then scan backwards skipping duplicates of the max.',
      'Flatten: count total elements first, then copy each row using Array.Copy.',
      'For Rotate, handle k > arr.Length with the modulo operator: k %= arr.Length.',
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
        // TODO: return second-largest distinct value
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
      explanation: '<code>int[,]</code> is a single contiguous block of memory where every row must have the same number of columns. <code>int[][]</code> is an array of separate arrays, each of which can have a different length. Access syntax also differs: <code>arr[r, c]</code> vs <code>arr[r][c]</code>.',
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
      q: 'What is the main advantage of Span<T> over creating a sub-array?',
      options: [
        'Span<T> is mutable; sub-arrays are read-only',
        'Span<T> does not allocate on the heap — it is a view into existing memory',
        'Span<T> automatically resizes when you add elements',
        'Span<T> supports async/await; sub-arrays do not',
      ],
      answer: 1,
      explanation: 'Creating a sub-array (<code>arr[2..5]</code>) allocates a new array on the heap and copies the elements. <code>Span&lt;T&gt;</code> is a ref struct that stores a pointer and length, pointing into the original array with zero allocation and zero copying.',
    },
    {
      q: 'Which statement about array covariance in C# is correct?',
      options: [
        'string[] can be assigned to object[] and writing to it is always safe',
        'string[] can be assigned to object[] but writing a non-string to it throws ArrayTypeMismatchException at runtime',
        'Array covariance does not exist in C# — it is a Java-only feature',
        'int[] can be assigned to long[] because int is smaller than long',
      ],
      answer: 1,
      explanation: 'C# allows <code>string[] s = ...; object[] o = s;</code> (array covariance for reference types). Reading is safe, but writing a non-<code>string</code> value — e.g. <code>o[0] = 42;</code> — throws <code>ArrayTypeMismatchException</code> at runtime because the underlying array is still <code>string[]</code>. This is a known gotcha to watch for.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I copy an array in C#?',
      a: 'There are several options. <code>Array.Copy(src, dst, length)</code> copies elements between arrays. <code>(int[])arr.Clone()</code> creates a shallow copy via the <code>ICloneable</code> interface. The easiest modern way is <code>int[] copy = arr[..];</code> using a range — this copies all elements. All three are <em>shallow</em> copies — if the array holds reference types, the references are copied, not the objects themselves.',
    },
    {
      q: 'When should I use for vs foreach over an array?',
      a: 'Use <code>foreach</code> when you only need to read elements — it is safer (no off-by-one errors) and more expressive. Use <code>for</code> when you need the index (e.g. to compare adjacent elements, write to specific positions, or iterate in reverse). For performance-critical loops over large arrays, <code>for</code> with direct index access can be marginally faster because the JIT can eliminate bounds checks in some scenarios.',
    },
    {
      q: 'Can I resize an array after creation?',
      a: 'Arrays are fixed-size — you cannot add or remove elements. To "resize", use <code>Array.Resize(ref arr, newSize)</code>, which allocates a new array and copies elements. However, if you need a dynamically sized collection, use <code>List&lt;T&gt;</code> instead — it is backed by an array internally and doubles capacity as needed. Reserve arrays for fixed-size, performance-sensitive scenarios.',
    },
    {
      q: 'What is the difference between Span<T> and Memory<T>?',
      a: '<code>Span&lt;T&gt;</code> is a ref struct and can only live on the stack — it cannot be stored as a class field, used in async methods, or captured in lambdas. <code>Memory&lt;T&gt;</code> is a regular struct without these restrictions; it can be stored on the heap, passed across async boundaries, and used as a field. Internally, <code>Memory&lt;T&gt;</code> holds an <code>object</code> reference plus offset/length. When you only need synchronous, local slicing, prefer <code>Span&lt;T&gt;</code> for maximum efficiency.',
    },
  ];
}
