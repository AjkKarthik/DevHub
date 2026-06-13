import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';
import { BeforeAfterComponent, BeforeAfterExample } from '../../../shared/before-after/before-after';

@Component({
  selector: 'app-csharp-span-memory',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, PrerequisitesComponent, BeforeAfterComponent,
  ],
  templateUrl: './span-memory.html',
  styleUrl: './span-memory.scss',
})
export class CsharpSpanMemory {

  prerequisites: Prerequisite[] = [
    { label: 'Arrays',          route: '/csharp/arrays' },
    { label: 'GC & IDisposable', route: '/csharp/gc-disposable' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'Span<T>',             type: 'class',    desc: 'Stack-only ref struct — a slice of contiguous memory with no heap allocation', since: '.NET Core 2.1' },
    { name: 'ReadOnlySpan<T>',     type: 'class',    desc: 'Read-only variant of Span<T> — used for input parameters to prevent mutation', since: '.NET Core 2.1' },
    { name: 'Memory<T>',           type: 'class',    desc: 'Heap-safe memory slice — can be stored in fields and used with async methods', since: '.NET Core 2.1' },
    { name: 'ReadOnlyMemory<T>',   type: 'class',    desc: 'Read-only variant of Memory<T> — preferred for async read-only buffer parameters', since: '.NET Core 2.1' },
    { name: 'ArrayPool<T>.Shared', type: 'class',    desc: 'Rents and returns reusable arrays — avoids repeated heap allocations for temporary buffers', since: '.NET Core 1.0' },
    { name: 'MemoryMarshal',       type: 'class',    desc: 'Utilities for reinterpreting memory — Cast<T,U>(), GetReference(), CreateSpan()', since: '.NET Core 2.1' },
    { name: 'stackalloc',          type: 'keyword',  desc: 'Allocates a block on the stack — combine with Span<T> to avoid heap allocation for small buffers', since: 'C# 7.2' },
    { name: '.AsSpan()',           type: 'method',   desc: 'Extension method on arrays and strings to get a Span/ReadOnlySpan without copying', since: '.NET Core 2.1' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Span<T> exists — the allocation problem',
      points: [
        'Before Span<T>, any slice of an array or string required either an allocation (new array, Substring) or unsafe pointer code. High-throughput systems (web servers, parsers, serialisers) pay significant GC pressure from these temporary allocations.',
        '<code>Span&lt;T&gt;</code> is a <em>ref struct</em> — it lives exclusively on the stack. It holds a pointer and a length, representing a contiguous slice of memory (array, stack memory, or native memory) without owning it and without allocating on the heap.',
        'The practical result: parsing a CSV line, splitting a string, or processing a binary buffer can now be done with zero heap allocations. Benchmarks show 5–10× throughput improvements in parsing scenarios when switching from string.Substring to ReadOnlySpan&lt;char&gt; slicing.',
        'Because Span&lt;T&gt; is a ref struct it has limitations: it cannot be a field in a class, cannot be boxed, cannot be used across <code>await</code> points, and cannot be stored in arrays. These are the trade-offs for zero-allocation stack semantics.',
      ],
    },
    {
      heading: 'Span<T> vs Memory<T> — stack vs heap',
      points: [
        '<code>Span&lt;T&gt;</code> is the synchronous, stack-only workhorse. Pass it as a parameter or local variable when processing data in a single synchronous call. It cannot cross an <code>await</code> boundary because it might no longer be valid once the stack frame is gone.',
        '<code>Memory&lt;T&gt;</code> is the async-compatible, heap-storable companion. It is a regular struct (not a ref struct) that holds a reference to the underlying data. You can store it in a class field, pass it to async methods, and await while holding it.',
        'The pattern: accept <code>Memory&lt;T&gt;</code> (or <code>ReadOnlyMemory&lt;T&gt;</code>) in APIs that need to store or await the data. Call <code>.Span</code> on it to get a <code>Span&lt;T&gt;</code> for synchronous processing within a single method.',
        'Use <code>ReadOnlySpan&lt;T&gt;</code> / <code>ReadOnlyMemory&lt;T&gt;</code> for input parameters — they signal to the caller that you will not modify the data. Prefer the <code>ReadOnly</code> variants by default and only use writable spans when mutation is intentional.',
      ],
    },
    {
      heading: 'ArrayPool<T> — reusing temporary buffers',
      points: [
        '<code>ArrayPool&lt;T&gt;.Shared</code> maintains a pool of reusable arrays. Call <code>Rent(minimumLength)</code> to get an array (may be larger than requested), do your work, then call <code>Return(array)</code> to give it back. The pool reuses it for the next caller, avoiding heap allocations.',
        'Always return rented arrays — failing to return leaks the buffer back to the GC path and defeats the purpose. The canonical pattern is a try/finally block or using a helper struct that returns on dispose.',
        'The rented array may be larger than the length you requested. Always track the actual length you need separately — do not assume the array length equals the data length. Wrap in a Span: <code>Span&lt;byte&gt; buffer = pool.Rent(size).AsSpan(0, size)</code>.',
        'ArrayPool is ideal for: serialisation buffers, temporary byte arrays for network I/O, processing pipelines that allocate many small temporary arrays. It is not useful for long-lived data — the pool is optimised for short-lived rent/return cycles.',
      ],
    },
    {
      heading: 'stackalloc and string slicing',
      points: [
        '<code>stackalloc</code> allocates a contiguous block on the stack. Since C# 7.2 you can combine it with <code>Span&lt;T&gt;</code>: <code>Span&lt;byte&gt; buf = stackalloc byte[256]</code>. No GC involvement whatsoever — ideal for small temporary buffers in hot paths.',
        'Use stackalloc for small, fixed-size buffers only (< 1KB). Large stackalloc can cause stack overflow. The compiler will warn if the size is not a compile-time constant; always guard dynamic stackalloc with a size check.',
        'String slicing without allocation: instead of <code>str.Substring(start, length)</code> (allocates a new string), use <code>str.AsSpan(start, length)</code> to get a <code>ReadOnlySpan&lt;char&gt;</code>. You can parse, compare, and process the slice without ever allocating the new string.',
        '<code>int.TryParse(span, out int value)</code>, <code>span.SequenceEqual(other)</code>, <code>span.IndexOf(ch)</code> — the core BCL APIs all have Span overloads. The key APIs to know: <code>MemoryExtensions</code> (extension methods on spans for common string operations).',
      ],
    },
    {
      heading: 'MemoryMarshal and advanced patterns',
      points: [
        '<code>MemoryMarshal.Cast&lt;TFrom, TTo&gt;(span)</code> reinterprets a span of one type as a span of another — useful for reading structured data from byte buffers without allocation: <code>MemoryMarshal.Cast&lt;byte, int&gt;(rawBytes)</code> gives an <code>int</code>-typed view of the same memory.',
        '<code>MemoryMarshal.GetReference(span)</code> returns a managed reference to the first element — used in high-performance code to avoid bounds-checking overhead in tight loops (only when you have already validated the length).',
        'System.IO.Pipelines uses <code>ReadOnlySequence&lt;T&gt;</code> — a linked list of <code>ReadOnlyMemory&lt;T&gt;</code> segments for network I/O where data arrives in chunks. The <code>SequenceReader&lt;T&gt;</code> API wraps it with familiar read/advance semantics.',
        'The golden rule: only reach for <code>MemoryMarshal</code> when a benchmark proves it is necessary. Normal <code>Span&lt;T&gt;</code> and <code>Memory&lt;T&gt;</code> usage is safe and already very fast. <code>MemoryMarshal</code> bypasses safety checks.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Span basics',
      language: 'csharp',
      code: `// Slice an array without allocation
int[] numbers = { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
Span<int> slice = numbers.AsSpan(2, 5);  // [3, 4, 5, 6, 7] — no copy

foreach (var n in slice) Console.Write(n + " ");
// Output: 3 4 5 6 7

// Mutate through the span — modifies the original array
slice[0] = 99;
Console.WriteLine(numbers[2]);  // 99

// ReadOnlySpan — signals caller won't mutate
static int SumSlice(ReadOnlySpan<int> data)
{
    int sum = 0;
    foreach (var n in data) sum += n;
    return sum;
}

int result = SumSlice(numbers.AsSpan(0, 5));  // no allocation
Console.WriteLine(result);  // 1 + 2 + 99 + 4 + 5 = 111

// stackalloc — small buffer on the stack, zero heap allocation
Span<byte> stackBuf = stackalloc byte[64];
stackBuf.Fill(0);
stackBuf[0] = 0xDE;
stackBuf[1] = 0xAD;
// Buffer lives on the stack — no GC pressure`,
    },
    {
      label: 'String slicing — zero allocation',
      language: 'csharp',
      code: `// OLD: Substring allocates a new string on every call
string line = "2024-01-15,Alice,Engineering,95000";
string yearStr   = line.Substring(0, 4);      // allocates "2024"
string nameStr   = line.Substring(10, 5);     // allocates "Alice"

// NEW: AsSpan — no allocation, same processing
ReadOnlySpan<char> span = line.AsSpan();
ReadOnlySpan<char> yearSpan = span.Slice(0, 4);   // no allocation
ReadOnlySpan<char> nameSpan = span.Slice(10, 5);  // no allocation

// Parse directly from the span
if (int.TryParse(yearSpan, out int year)) Console.WriteLine(year);  // 2024

// Compare without allocating
Console.WriteLine(nameSpan.SequenceEqual("Alice".AsSpan()));  // true

// Split a CSV line with zero allocation
static void ParseCsvLine(ReadOnlySpan<char> line)
{
    int start = 0;
    for (int i = 0; i <= line.Length; i++)
    {
        if (i == line.Length || line[i] == ',')
        {
            ReadOnlySpan<char> field = line.Slice(start, i - start);
            ProcessField(field);  // process without allocating a string
            start = i + 1;
        }
    }
}

static void ProcessField(ReadOnlySpan<char> field)
{
    // int.TryParse, decimal.TryParse, etc. all have Span overloads
    if (decimal.TryParse(field, out decimal value))
        Console.WriteLine(\$"Salary: {value:C}");
    else
        Console.WriteLine(\$"Name: {field.ToString()}");  // .ToString() only when needed
}`,
    },
    {
      label: 'Memory<T> with async',
      language: 'csharp',
      code: `// Memory<T> — can be stored in fields and used across await points
// Unlike Span<T>, it is NOT a ref struct

public class DataProcessor
{
    private readonly Memory<byte> _buffer;

    public DataProcessor(byte[] data)
    {
        // Store Memory<T> as a field — impossible with Span<T>
        _buffer = data.AsMemory();
    }

    // async method — can use Memory<T>, NOT Span<T>
    public async Task<int> ProcessAsync(Stream stream)
    {
        // .Span converts to Span<T> for synchronous processing
        Span<byte> header = _buffer.Span.Slice(0, 4);
        ValidateHeader(header);

        // ReadAsync takes Memory<byte> — the OS writes directly into our buffer
        int bytesRead = await stream.ReadAsync(_buffer.Slice(4));
        return bytesRead;
    }

    // Slice returns another Memory<T> — no allocation
    public Memory<byte> GetPayload() => _buffer.Slice(4);

    static void ValidateHeader(Span<byte> header) { /* ... */ }
}

// ReadOnlyMemory<T> for read-only async parameters
static async Task SendDataAsync(ReadOnlyMemory<byte> data, NetworkStream stream)
{
    // WriteAsync takes ReadOnlyMemory<byte> — no copy needed
    await stream.WriteAsync(data);
}`,
    },
    {
      label: 'ArrayPool<T>',
      language: 'csharp',
      code: `using System.Buffers;

// Rent a buffer from the shared pool — avoids heap allocation
static async Task ProcessRequestAsync(Stream inputStream, int expectedSize)
{
    // Rent — may return a LARGER array; always track actual size
    byte[] rentedBuffer = ArrayPool<byte>.Shared.Rent(expectedSize);
    try
    {
        // Use AsSpan to work with only the portion we need
        Memory<byte> buffer = rentedBuffer.AsMemory(0, expectedSize);
        int read = await inputStream.ReadAsync(buffer);

        // Process the data
        Span<byte> data = buffer.Span.Slice(0, read);
        Console.WriteLine(\$"Read {read} bytes");
        // ... process data ...
    }
    finally
    {
        // ALWAYS return — the pool depends on it
        // clearArray: true if buffer contained sensitive data
        ArrayPool<byte>.Shared.Return(rentedBuffer, clearArray: false);
    }
}

// Pattern: IMemoryOwner<T> — combines buffer + lifetime management
static IMemoryOwner<byte> CreateBuffer(int size)
{
    // MemoryPool<T>.Shared is higher-level — owns and returns automatically
    return MemoryPool<byte>.Shared.Rent(size);
    // Dispose the IMemoryOwner to return the buffer to the pool
}

// Usage with using
using IMemoryOwner<byte> owner = MemoryPool<byte>.Shared.Rent(1024);
Memory<byte> memory = owner.Memory.Slice(0, 1024);
// Buffer automatically returned when owner is disposed`,
    },
    {
      label: 'MemoryMarshal & reinterpret',
      language: 'csharp',
      code: `using System.Runtime.InteropServices;

// Cast<TFrom, TTo> — reinterpret bytes as a different type
// Useful for reading structured binary data without allocation

[StructLayout(LayoutKind.Sequential, Pack = 1)]
struct PacketHeader
{
    public ushort Magic;
    public ushort Length;
    public uint   Checksum;
}

static PacketHeader ReadHeader(ReadOnlySpan<byte> rawBytes)
{
    // Reinterpret 8 bytes as one PacketHeader — zero copy, zero allocation
    ReadOnlySpan<PacketHeader> headers =
        MemoryMarshal.Cast<byte, PacketHeader>(rawBytes.Slice(0, 8));
    return headers[0];
}

// Write a struct to a byte span (the reverse direction)
static bool TryWriteHeader(Span<byte> destination, PacketHeader header)
{
    ReadOnlySpan<byte> bytes =
        MemoryMarshal.AsBytes(MemoryMarshal.CreateReadOnlySpan(ref header, 1));
    if (destination.Length < bytes.Length) return false;
    bytes.CopyTo(destination);
    return true;
}

// SequenceEqual — compare spans
byte[] a = { 1, 2, 3 };
byte[] b = { 1, 2, 3 };
Console.WriteLine(a.AsSpan().SequenceEqual(b.AsSpan()));  // true — no allocation`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'String parsing: Substring vs ReadOnlySpan<char>',
      before: `// Allocates a new string for every field — GC pressure in hot paths
static (string year, string name, decimal salary) ParseLine(string line)
{
    string year   = line.Substring(0, 4);        // heap allocation
    string name   = line.Substring(5, line.IndexOf(',', 5) - 5);  // heap
    string salStr = line.Substring(line.LastIndexOf(',') + 1);     // heap
    return (year, name, decimal.Parse(salStr));  // heap
}`,
      after: `// Zero heap allocations — processes the original string memory directly
static (int year, ReadOnlySpan<char> name, decimal salary) ParseLine(
    ReadOnlySpan<char> line)
{
    int.TryParse(line.Slice(0, 4), out int year);
    int comma1 = line.IndexOf(',');
    int comma2 = line.LastIndexOf(',');
    ReadOnlySpan<char> name = line.Slice(comma1 + 1, comma2 - comma1 - 1);
    decimal.TryParse(line.Slice(comma2 + 1), out decimal salary);
    return (year, name, salary);
}`,
      note: 'Span-based parsing can reduce allocations by 100% in parsing hot paths — measured with BenchmarkDotNet.',
      language: 'csharp',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Storing Span<T> in a field or returning it from async methods',
      wrong: `class DataProcessor
{
    private Span<byte> _data;  // COMPILE ERROR: ref struct cannot be field

    async Task ProcessAsync()
    {
        Span<byte> buf = stackalloc byte[64];
        await SomeAsyncWork();  // COMPILE ERROR: cannot use Span across await
    }
}`,
      right: `class DataProcessor
{
    private Memory<byte> _data;  // Memory<T> can be a field

    async Task ProcessAsync()
    {
        // Use Memory<T> for async; call .Span for synchronous processing
        byte[] buffer = ArrayPool<byte>.Shared.Rent(64);
        try
        {
            Memory<byte> mem = buffer.AsMemory(0, 64);
            await SomeAsyncWork(mem);
        }
        finally { ArrayPool<byte>.Shared.Return(buffer); }
    }
}`,
      explanation: 'Span<T> is a ref struct — the compiler enforces that it cannot escape the stack. Use Memory<T> when you need to store a buffer reference in a field or pass it across an await boundary.',
    },
    {
      title: 'Not returning rented ArrayPool buffers',
      wrong: `static async Task HandleRequest(Stream stream)
{
    byte[] buffer = ArrayPool<byte>.Shared.Rent(4096);
    await stream.ReadAsync(buffer);
    Process(buffer);
    // MISSING: ArrayPool<byte>.Shared.Return(buffer)
    // Buffer leaked — pool grows indefinitely
}`,
      right: `static async Task HandleRequest(Stream stream)
{
    byte[] buffer = ArrayPool<byte>.Shared.Rent(4096);
    try
    {
        await stream.ReadAsync(buffer.AsMemory(0, 4096));
        Process(buffer);
    }
    finally
    {
        ArrayPool<byte>.Shared.Return(buffer);  // always returns, even on exception
    }
}`,
      explanation: 'Unreturned ArrayPool buffers are never re-pooled. The pool creates new buffers to compensate, causing the very allocation pressure you were trying to avoid. Always return in a finally block.',
    },
    {
      title: 'Assuming the rented array is exactly the requested size',
      wrong: `byte[] buf = ArrayPool<byte>.Shared.Rent(100);
// buf.Length might be 128, 256, or any larger power-of-two!
for (int i = 0; i < buf.Length; i++)  // processes garbage beyond index 100
    Process(buf[i]);`,
      right: `int needed = 100;
byte[] buf = ArrayPool<byte>.Shared.Rent(needed);
try
{
    Span<byte> data = buf.AsSpan(0, needed);  // only use the portion we need
    foreach (byte b in data) Process(b);
}
finally { ArrayPool<byte>.Shared.Return(buf); }`,
      explanation: 'ArrayPool.Rent(n) returns an array of at least n bytes — typically the next power of two. The array is not zeroed by default. Always slice to the exact length you need using AsSpan(0, needed).',
    },
    {
      title: 'Using stackalloc for large or unknown sizes',
      wrong: `static void ProcessInput(int userSize)
{
    // DANGER: userSize could be huge — stack overflow!
    Span<byte> buf = stackalloc byte[userSize];
    // Stack is typically 1–4 MB; allocating > ~256 bytes is risky for unknown sizes
}`,
      right: `static void ProcessInput(int size)
{
    const int StackThreshold = 256;
    // Use stack for small, fixed sizes; heap for anything larger
    Span<byte> buf = size <= StackThreshold
        ? stackalloc byte[256]
        : new byte[size];  // or ArrayPool for repeated calls
    // ...
}`,
      explanation: 'stackalloc reserves space on the call stack. Large or unbounded allocations overflow the stack — a fatal, unrecoverable error. Use stackalloc only for small, fixed-size buffers (< ~256 bytes is a common threshold).',
    },
  ];

  challenge: Challenge = {
    title: 'Zero-allocation CSV field parser',
    language: 'csharp',
    description: `Implement a CSV line parser that:
1. Accepts a ReadOnlySpan<char> line and an output Span<Range> to hold field ranges
2. Finds each comma-delimited field and records its start+length as a Range in the output span
3. Returns the number of fields found
4. A separate method uses the ranges to parse the 3rd field as an integer, all without allocating strings`,
    hints: [
      'Iterate through the span with IndexOf(\',\') or a manual loop',
      'Range struct: new Range(start, end) or start..end',
      'span[range] gives back a ReadOnlySpan<char> slice',
      'int.TryParse(span[range], out int value) — no string needed',
      'Track start index; advance past each comma',
    ],
    starterCode: `using System;

static class CsvParser
{
    // TODO: return number of fields found, fill ranges span
    public static int ParseFields(ReadOnlySpan<char> line, Span<Range> ranges)
    {
        // implement here
        return 0;
    }

    // TODO: use ranges to read the field at fieldIndex without allocating a string
    public static bool TryGetInt(ReadOnlySpan<char> line, ReadOnlySpan<Range> ranges,
                                  int fieldIndex, out int value)
    {
        value = 0;
        return false;
    }
}

// Test:
// ReadOnlySpan<char> line = "Alice,42,Engineering,95000".AsSpan();
// Span<Range> ranges = stackalloc Range[10];
// int count = CsvParser.ParseFields(line, ranges);
// CsvParser.TryGetInt(line, ranges, 1, out int age); // 42`,
    solution: `using System;

static class CsvParser
{
    public static int ParseFields(ReadOnlySpan<char> line, Span<Range> ranges)
    {
        int fieldCount = 0;
        int start = 0;

        for (int i = 0; i <= line.Length; i++)
        {
            if (i == line.Length || line[i] == ',')
            {
                if (fieldCount >= ranges.Length) break;
                ranges[fieldCount++] = new Range(start, i);
                start = i + 1;
            }
        }
        return fieldCount;
    }

    public static bool TryGetInt(ReadOnlySpan<char> line, ReadOnlySpan<Range> ranges,
                                  int fieldIndex, out int value)
    {
        value = 0;
        if (fieldIndex >= ranges.Length) return false;
        ReadOnlySpan<char> field = line[ranges[fieldIndex]];
        return int.TryParse(field, out value);
    }
}

// Usage — zero heap allocations:
ReadOnlySpan<char> line = "Alice,42,Engineering,95000".AsSpan();
Span<Range> ranges = stackalloc Range[10];
int count = CsvParser.ParseFields(line, ranges);
Console.WriteLine(\$"Fields: {count}");  // 4

CsvParser.TryGetInt(line, ranges, 1, out int age);
Console.WriteLine(\$"Age: {age}");  // 42

CsvParser.TryGetInt(line, ranges, 3, out int salary);
Console.WriteLine(\$"Salary: {salary}");  // 95000`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why can Span<T> not be used across an await boundary?',
      options: [
        'Because async methods cannot work with value types',
        'Because Span<T> is a ref struct that lives on the stack, which may no longer be valid after an await resumes on a different thread or continuation',
        'Because the C# compiler does not support generics in async methods',
        'Because await always copies its arguments to prevent data races',
      ],
      answer: 1,
      explanation: 'Span<T> is a ref struct — it is constrained to live on a single stack frame. After an await, the continuation may run on a different thread and the original stack frame is gone. Memory<T> is the async-safe alternative because it references heap memory that outlives any stack frame.',
    },
    {
      q: 'What does ArrayPool<T>.Shared.Rent(100) guarantee about the returned array?',
      options: [
        'The array will be exactly 100 elements long',
        'The array will be at least 100 elements long — may be larger',
        'The array will be zeroed out before being returned',
        'The array will be allocated on the stack for performance',
      ],
      answer: 1,
      explanation: 'Rent(minimumLength) guarantees at least minimumLength elements but typically returns the next power-of-two sized array from the pool. The array is NOT zeroed by default. Always slice to your actual needed length with AsSpan(0, needed).',
    },
    {
      q: 'What is the key advantage of string.AsSpan() over string.Substring()?',
      options: [
        'AsSpan() is faster at Unicode processing',
        'AsSpan() returns a view into the original string\'s memory — no allocation; Substring() allocates a new string',
        'AsSpan() is null-safe; Substring() throws on null',
        'AsSpan() supports regular expressions; Substring() does not',
      ],
      answer: 1,
      explanation: 'AsSpan() creates a ReadOnlySpan<char> pointing into the original string\'s memory — zero allocation, zero copy. Substring() allocates a brand-new string on the heap. In parsing hot paths that call Substring thousands of times, this difference is significant.',
    },
    {
      q: 'When should you use Memory<T> instead of Span<T>?',
      options: [
        'When you need better performance than Span<T>',
        'When you need to store the buffer in a class field or pass it across an await boundary',
        'When processing strings specifically, since Memory<char> is more efficient',
        'When the buffer size is known at compile time',
      ],
      answer: 1,
      explanation: 'Memory<T> is a regular struct (not a ref struct) — it can be stored in class fields and survives await points. Use Memory<T> when the lifetime of the buffer reference extends beyond a single synchronous call stack. Use Span<T> for local synchronous processing.',
    },
    {
      q: 'What is the risk of using "stackalloc byte[userInput]" where userInput comes from the user?',
      options: [
        'The allocated memory won\'t be initialised, causing data leaks',
        'A large or malicious value can overflow the stack, causing a fatal StackOverflowException',
        'stackalloc cannot be used with variable sizes — only constants',
        'The bytes will be allocated on the heap instead, negating the performance benefit',
      ],
      answer: 1,
      explanation: 'stackalloc reserves space on the thread\'s stack (typically 1–4 MB). A user-controlled size with no upper bound can exhaust the stack instantly — StackOverflowException is fatal and cannot be caught. Always cap the size: if (size > threshold) use ArrayPool instead.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use Span<T> with LINQ?',
      a: 'No — LINQ methods accept IEnumerable<T>, which requires boxing a ref struct (impossible). You can foreach over a Span<T> directly because the compiler uses the duck-typing pattern (looks for GetEnumerator()), but extension methods like .Where() and .Select() are not available. For LINQ-like operations on spans, use MemoryExtensions helpers or process the span in a regular for loop.',
    },
    {
      q: 'How does Span<T> relate to unsafe code and pointers?',
      a: 'Span<T> is the safe, managed replacement for many unsafe pointer patterns. Internally it holds a managed reference (not an unmanaged pointer), so the GC can track and move the underlying memory safely. MemoryMarshal gives you low-level access for cases where Span<T>\'s safety guarantees are insufficient — but it requires careful reasoning and should be benchmarked before use. For most performance scenarios, Span<T> is sufficient without touching unsafe code at all.',
    },
    {
      q: 'Should I always use Span<T> and ArrayPool for any allocation I see?',
      a: 'No — measure first. Span<T> and ArrayPool are valuable in hot paths: parsers, serialisers, network handlers, tight loops processing large datasets. For code that runs once or rarely, the complexity cost outweighs the GC benefit. The right process: profile with dotnet-trace or BenchmarkDotNet, identify high-allocation hot spots, then apply Span/ArrayPool selectively. Premature allocation-avoidance adds complexity without measurable benefit.',
    },
    {
      q: 'What is System.IO.Pipelines and when should I use it over Stream?',
      a: 'Pipelines is a high-performance I/O abstraction built on Span<T> and Memory<T>. It solves the "I don\'t know how much data is coming" parsing problem efficiently: PipeReader gives you a ReadOnlySequence<byte> of what arrived, you examine it, tell the reader how much you consumed, and it manages the buffer lifecycle. Use it for high-throughput network servers (ASP.NET Core uses it internally). For simple file I/O or one-off reads, Stream is simpler and more than adequate.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: '<code>Span&lt;T&gt;</code> is a stack-only, zero-allocation slice of contiguous memory — use it for synchronous hot-path processing. <code>Memory&lt;T&gt;</code> is the async-safe counterpart for fields and await boundaries. <code>ArrayPool&lt;T&gt;.Shared</code> avoids repeated heap allocations for temporary buffers.',
    mustKnow: [
      '<code>Span&lt;T&gt;</code> = ref struct, stack-only, no fields, no async; <code>Memory&lt;T&gt;</code> = field-storable, async-safe',
      '<code>str.AsSpan(start, len)</code> — zero-allocation string slice; <code>int.TryParse(span, out n)</code> works directly',
      '<code>ArrayPool&lt;T&gt;.Shared.Rent(n)</code> returns array of AT LEAST n elements; always return in finally',
      '<code>stackalloc byte[n]</code> + <code>Span&lt;byte&gt;</code> — small fixed buffers (< ~256 bytes) with zero GC',
      '<code>MemoryMarshal.Cast&lt;byte, MyStruct&gt;(span)</code> — reinterpret bytes as a struct, zero copy',
      'Use <code>ReadOnlySpan&lt;T&gt;</code> / <code>ReadOnlyMemory&lt;T&gt;</code> for input parameters by default',
    ],
    interviewFocus: [
      '<strong>Span vs Memory?</strong> — Span = stack-only synchronous; Memory = fields + async',
      '<strong>Why not Span in async methods?</strong> — ref struct cannot survive await; stack may be gone on resume',
      '<strong>ArrayPool guarantee?</strong> — at least n elements, not exactly n; not zeroed; must return',
      '<strong>AsSpan vs Substring?</strong> — AsSpan = zero allocation view; Substring = new heap string',
    ],
  };
}
