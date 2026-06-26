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

@Component({
  selector: 'app-csharp-unsafe-pointers',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, PrerequisitesComponent,
  ],
  templateUrl: './unsafe-pointers.html',
  styleUrl: './unsafe-pointers.scss',
})
export class CsharpUnsafePointers {

  prerequisites: Prerequisite[] = [
    { label: 'Span<T> & Memory<T>', route: '/csharp/span-memory' },
    { label: 'Structs',            route: '/csharp/structs' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'unsafe',          type: 'keyword',  desc: 'Marks a method/block as unsafe — enables pointer types and pointer arithmetic', since: 'C# 1.0' },
    { name: 'fixed',           type: 'keyword',  desc: 'Pins a managed object in memory so the GC cannot move it; required before taking a pointer to managed data', since: 'C# 1.0' },
    { name: 'stackalloc',      type: 'keyword',  desc: 'Allocates a contiguous block on the stack — no GC involved; safe with Span<T>', since: 'C# 7.2' },
    { name: 'sizeof(T)',        type: 'operator', desc: 'Returns the size in bytes of an unmanaged type at compile time', since: 'C# 1.0' },
    { name: '&',               type: 'operator', desc: 'Address-of operator — returns a pointer to a variable', since: 'C# 1.0' },
    { name: '*',               type: 'operator', desc: 'Dereference operator — reads/writes the value at a pointer', since: 'C# 1.0' },
    { name: '->',              type: 'operator', desc: 'Member access through pointer — shorthand for (*ptr).Member', since: 'C# 1.0' },
    { name: 'NativeMemory',    type: 'class',    desc: '.NET 6+ — allocate/free/reallocate unmanaged native memory (replaces Marshal.AllocHGlobal)', since: '.NET 6' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'When and why to use unsafe code',
      points: [
        'C# is a safe, managed language by design — the runtime guarantees type safety, bounds checking, and GC-managed memory. The <code>unsafe</code> keyword opts a specific block or method out of these guarantees, giving you direct pointer manipulation at the cost of taking on the responsibility for correctness.',
        'Legitimate use cases are narrow: interoperating with native libraries via P/Invoke that requires pointer arguments, writing hardware-level parsers (network protocols, file formats) where the overhead of safe APIs is measurable, implementing memory-safe abstractions like custom allocators, or porting numerics/image processing algorithms from C/C++.',
        'Before reaching for unsafe, consider: <code>Span&lt;T&gt;</code> and <code>MemoryMarshal</code> solve most high-performance memory scenarios safely. <code>P/Invoke</code> with <code>SafeHandle</code> covers most interop. Unsafe code is rarely the right tool and should be isolated in a small, heavily documented module.',
        'Unsafe code requires the <code>&lt;AllowUnsafeBlocks&gt;true&lt;/AllowUnsafeBlocks&gt;</code> project property. This is an opt-in safety bypass — keep it out of the main project if possible, isolate it in a dedicated library with a safe public API surface.',
      ],
    },
    {
      heading: 'Pointer types and the fixed statement',
      points: [
        'A pointer in C# is written as <code>T*</code> (e.g., <code>int*</code>, <code>byte*</code>). Pointer types can only be unmanaged types — primitives, enums, structs containing only unmanaged types. You cannot have a <code>string*</code> or <code>object*</code>.',
        'The address-of operator <code>&amp;</code> gets a pointer to a variable. Dereferencing (<code>*ptr</code>) reads or writes the value at that address. Member access (<code>ptr-&gt;Field</code>) is shorthand for <code>(*ptr).Field</code> on struct pointers.',
        'The GC is a moving collector — it can relocate managed objects during collection. A pointer to a managed object becomes stale when the object moves. The <code>fixed</code> statement pins the object in place for the duration of the block, preventing the GC from moving it.',
        'Pinning has a performance cost: it creates a "pinning root" that the GC must work around during collection. Keep <code>fixed</code> blocks as short as possible. For unmanaged memory (stackalloc, NativeMemory), <code>fixed</code> is not needed — the GC does not manage it.',
      ],
    },
    {
      heading: 'Pointer arithmetic',
      points: [
        'Pointer arithmetic works in units of the pointed-to type. <code>ptr + 1</code> on an <code>int*</code> advances by <code>sizeof(int) == 4</code> bytes. This mirrors C/C++ pointer semantics — the offset is always in elements, not bytes.',
        'Comparison operators (<code>==</code>, <code>!=</code>, <code>&lt;</code>, <code>&gt;</code>, etc.) work on pointers — they compare memory addresses. This is useful for bounds checking in custom buffer implementations.',
        'The difference between two pointers of the same type (<code>end - start</code>) gives the number of elements between them (not bytes). Dividing by <code>sizeof(T)</code> converts to bytes if needed.',
        'Pointer arithmetic bypasses all bounds checking — this is the primary danger. Writing past the end of a buffer overwrites adjacent memory, causing data corruption, security vulnerabilities, or crashes. Always verify bounds explicitly before any pointer access.',
      ],
    },
    {
      heading: 'Unmanaged memory — NativeMemory and Marshal',
      points: [
        '<code>NativeMemory.Alloc(size)</code> (.NET 6+) allocates a block of unmanaged memory outside the GC heap. It must be freed with <code>NativeMemory.Free(ptr)</code>. Because it is unmanaged, the GC never collects it — failing to free it is a native memory leak.',
        'Before .NET 6, the equivalent was <code>Marshal.AllocHGlobal(size)</code> / <code>Marshal.FreeHGlobal(ptr)</code>. NativeMemory is the modern replacement — it is AOT-safe and directly wraps the C runtime\'s malloc/free.',
        'Use unmanaged memory for: very large buffers where GC pressure is a concern, long-lived buffers that would end up in the LOH, or interop scenarios where native code requires memory it controls the lifetime of.',
        'Always wrap unmanaged memory in a <code>SafeHandle</code> or a struct implementing <code>IDisposable</code>. This ensures the memory is freed when the wrapper is disposed, even if an exception is thrown. Never expose raw pointers across API boundaries.',
      ],
    },
    {
      heading: 'ref and Unsafe class — the managed alternative',
      points: [
        '<code>System.Runtime.CompilerServices.Unsafe</code> provides managed-reference equivalents to pointer operations — without requiring <code>unsafe</code> code in callers. <code>Unsafe.As&lt;TFrom, TTo&gt;(ref from)</code> reinterprets a managed reference, <code>Unsafe.Add(ref e, n)</code> advances a reference by n elements.',
        '<code>ref</code> variables (<code>ref int r = ref array[i]</code>) are safe managed references — bounds-checked, GC-tracked, but allow direct mutation without pointers. Many Span&lt;T&gt; internals use ref variables to avoid unsafe code.',
        '<code>MemoryMarshal.GetReference(span)</code> returns a managed reference to the first element — this can be combined with <code>Unsafe.Add</code> to iterate a span with reference semantics without any unsafe block.',
        'The general guideline: prefer Span&lt;T&gt; and MemoryMarshal for zero-allocation data access; use unsafe pointer arithmetic only when you need to call a native function that requires a pointer argument, or when an algorithm is directly translated from C code with no safe equivalent.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Pointer basics',
      language: 'csharp',
      code: `// Requires: <AllowUnsafeBlocks>true</AllowUnsafeBlocks> in .csproj

unsafe
{
    int value = 42;
    int* ptr  = &value;       // address-of: get pointer to value

    Console.WriteLine(*ptr);  // dereference: read value at pointer → 42
    *ptr = 99;                // write through the pointer
    Console.WriteLine(value); // → 99

    // Pointer arithmetic — advances by sizeof(int) = 4 bytes per step
    int[] arr = { 10, 20, 30, 40, 50 };
    fixed (int* p = arr)      // pin the array — GC cannot move it
    {
        for (int i = 0; i < arr.Length; i++)
            Console.Write(*(p + i) + " ");  // 10 20 30 40 50
        Console.WriteLine();

        // Pointer difference
        int* first = p;
        int* last  = p + arr.Length - 1;
        Console.WriteLine(last - first);  // 4 (elements, not bytes)
    }
    // Array is unpinned here — GC can move it again

    // Struct pointer with ->
    Point pt = new Point { X = 3, Y = 7 };
    Point* ppt = &pt;
    Console.WriteLine(ppt->X);  // 3 — equivalent to (*ppt).X
    ppt->Y = 15;
    Console.WriteLine(pt.Y);   // 15
}

struct Point { public int X, Y; }`,
    },
    {
      label: 'fixed statement & string interop',
      language: 'csharp',
      code: `unsafe
{
    // Pin a byte array — get a pointer for native API call
    byte[] buffer = new byte[1024];
    fixed (byte* pBuf = buffer)
    {
        // Pass pBuf to a native function expecting byte*
        FillBuffer(pBuf, buffer.Length);

        // Process with pointer arithmetic — no bounds checking
        byte* end = pBuf + buffer.Length;
        byte checksum = 0;
        for (byte* p = pBuf; p < end; p++)
            checksum ^= *p;
        Console.WriteLine(\$"Checksum: {checksum}");
    }

    // Pin a string to get a char*
    string message = "Hello, unsafe!";
    fixed (char* pMsg = message)
    {
        // Count characters manually
        int len = 0;
        char* p = pMsg;
        while (*p != '\0') { len++; p++; }
        Console.WriteLine(\$"Length: {len}");  // 14

        // Interop: pass pMsg as LPWSTR to a Windows API
        // SetWindowTextW(hwnd, pMsg);
    }

    // Pin a 2D array — flattened in memory
    int[,] matrix = { { 1, 2 }, { 3, 4 } };
    fixed (int* pMatrix = matrix)
    {
        // Row-major order: [0]=[1,1], [1]=[1,2], [2]=[2,1], [3]=[2,2]
        for (int i = 0; i < 4; i++)
            Console.Write(*(pMatrix + i) + " ");  // 1 2 3 4
    }
}

static unsafe void FillBuffer(byte* buf, int len)
{
    for (int i = 0; i < len; i++) buf[i] = (byte)(i % 256);
}`,
    },
    {
      label: 'stackalloc & NativeMemory',
      language: 'csharp',
      code: `using System.Runtime.InteropServices;

// stackalloc — stack memory, no GC, no fixed needed
unsafe
{
    // Direct pointer style (unsafe context required)
    byte* stackBuf = stackalloc byte[256];
    for (int i = 0; i < 256; i++) stackBuf[i] = (byte)i;

    Console.WriteLine(stackBuf[128]);  // 128 — no bounds check!
}

// Preferred: stackalloc with Span<T> — safe, no unsafe block needed
Span<byte> safeBuf = stackalloc byte[256];
safeBuf.Fill(0xFF);
Console.WriteLine(safeBuf[128]);  // 0xFF — bounds-checked

// NativeMemory — unmanaged heap, .NET 6+
unsafe
{
    // Allocate 1 KB of unmanaged memory
    void* raw = NativeMemory.Alloc(1024);
    try
    {
        byte* buf = (byte*)raw;
        // Zero the memory (Alloc does NOT zero — unlike calloc)
        NativeMemory.Clear(raw, 1024);

        // Use the buffer
        buf[0] = 0xDE;
        buf[1] = 0xAD;
        Console.WriteLine(\$"Magic: {buf[0]:X2}{buf[1]:X2}");  // DEAD

        // Resize if needed
        raw = NativeMemory.Realloc(raw, 2048);
        buf = (byte*)raw;
    }
    finally
    {
        NativeMemory.Free(raw);  // ALWAYS free — no GC safety net
    }
}`,
    },
    {
      label: 'Unsafe class — no unsafe keyword',
      language: 'csharp',
      code: `using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;

// System.Runtime.CompilerServices.Unsafe provides pointer-like operations
// WITHOUT requiring the unsafe keyword in callers

// Reinterpret a float as int (view the IEEE-754 bits)
float f = 3.14f;
int bits = Unsafe.As<float, int>(ref f);
Console.WriteLine(\$"3.14f bits: 0x{bits:X8}");  // 0x4048F5C3

// Advance a reference by N elements (like pointer arithmetic)
int[] arr = { 10, 20, 30, 40, 50 };
ref int first = ref arr[0];
ref int third = ref Unsafe.Add(ref first, 2);
Console.WriteLine(third);  // 30

// Get size of a generic type (even in generic methods)
Console.WriteLine(Unsafe.SizeOf<Guid>());   // 16
Console.WriteLine(Unsafe.SizeOf<Point3D>()); // 12

// MemoryMarshal.GetReference — access span internals without unsafe
int[] data = { 1, 2, 3, 4, 5 };
Span<int> span = data.AsSpan();
ref int spanRef = ref MemoryMarshal.GetReference(span);

// Fast iteration using managed refs (bounds-checked by span length, not pointer)
for (int i = 0; i < span.Length; i++)
{
    ref int elem = ref Unsafe.Add(ref spanRef, i);
    elem *= 2;  // mutates through reference
}
Console.WriteLine(string.Join(", ", data));  // 2, 4, 6, 8, 10

struct Point3D { public float X, Y, Z; }`,
    },
    {
      label: 'Safe wrapper pattern',
      language: 'csharp',
      code: `using System.Runtime.InteropServices;

// PATTERN: wrap unsafe/unmanaged code behind a safe public API
// Consumers never see pointers — only safe types

public sealed class UnmanagedBuffer : IDisposable
{
    private unsafe void* _ptr;
    private readonly int _size;
    private bool _disposed;

    public UnmanagedBuffer(int size)
    {
        _size = size;
        unsafe { _ptr = NativeMemory.AllocZeroed((nuint)size); }
    }

    // Safe public API returns a Span — bounds-checked, no pointer leakage
    public Span<byte> AsSpan()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        unsafe { return new Span<byte>(_ptr, _size); }
    }

    public int Length => _size;

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        unsafe { NativeMemory.Free(_ptr); _ptr = null; }
    }
}

// Usage — no unsafe keyword, no pointers visible to the consumer
using var buf = new UnmanagedBuffer(4096);
Span<byte> data = buf.AsSpan();
data.Fill(0xAB);
Console.WriteLine(\$"First byte: 0x{data[0]:X2}");  // 0xAB
// Buffer freed automatically on dispose`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using a pointer after the fixed block ends',
      wrong: `byte* ptr;
fixed (byte[] arr = new byte[10])
{
    ptr = arr;  // pin, get pointer
}
// DANGER: arr is unpinned — GC may have moved it
// ptr now points to invalid/moved memory
ptr[0] = 99;  // undefined behaviour — memory corruption`,
      right: `byte[] arr = new byte[10];
fixed (byte* ptr = arr)
{
    // ALL pointer usage must happen inside the fixed block
    ptr[0] = 99;
    DoSomethingWithPointer(ptr, arr.Length);
}
// ptr is out of scope here — cannot accidentally use it`,
      explanation: 'The fixed statement pins an object only for the duration of its block. Once the block exits, the GC is free to move the object. Any pointer obtained inside the block is invalid outside it. All pointer operations must stay within the fixed block.',
    },
    {
      title: 'Not freeing NativeMemory — native memory leak',
      wrong: `unsafe void* AllocAndForget(int size)
{
    void* ptr = NativeMemory.Alloc((nuint)size);
    // MISSING: NativeMemory.Free(ptr)
    // This memory is never returned — leaks indefinitely
    return ptr;
    // If an exception is thrown before Free, also a leak
}`,
      right: `unsafe void AllocAndProcess(int size)
{
    void* ptr = NativeMemory.Alloc((nuint)size);
    try
    {
        // ... use ptr ...
    }
    finally
    {
        NativeMemory.Free(ptr);  // guaranteed, even on exception
    }
}

// Better: wrap in IDisposable (like the UnmanagedBuffer example)`,
      explanation: 'NativeMemory lives outside the GC heap. The GC will never collect it. Always free in a finally block or implement IDisposable. Unfreed native memory leaks process memory and can cause out-of-memory crashes in long-running services.',
    },
    {
      title: 'Skipping bounds checks in pointer loops',
      wrong: `unsafe void Process(byte* buffer, int length)
{
    for (int i = 0; i <= length; i++)  // BUG: <= instead of <
        buffer[i] ^= 0xFF;  // writes one byte past the end!
}`,
      right: `unsafe void Process(byte* buffer, int length)
{
    for (int i = 0; i < length; i++)  // strictly less than
        buffer[i] ^= 0xFF;
}

// Or, use Span<T> for automatic bounds checking:
void ProcessSafe(Span<byte> buffer)
{
    for (int i = 0; i < buffer.Length; i++)
        buffer[i] ^= 0xFF;
}`,
      explanation: 'Pointer arithmetic bypasses the runtime bounds checks that protect managed arrays. An off-by-one error writes into adjacent memory — which may be another variable, a return address, or unallocated space. Always use < (not <=) and double-check all bounds arithmetic.',
    },
    {
      title: 'Taking a pointer to a local variable and escaping it',
      wrong: `unsafe int* GetPointerToLocal()
{
    int local = 42;
    return &local;  // DANGER: local is on the stack, which unwinds when the method returns
    // Caller receives a dangling pointer to the dead stack frame
}`,
      right: `// Option 1: pass the variable by ref instead
unsafe void Modify(ref int value)
{
    fixed (int* p = &value)  // cannot take address of ref directly in older C#
    {
        *p = 99;
    }
}

// Option 2: use ref return (safe, no pointer)
ref int GetRef(int[] arr, int i) => ref arr[i];

// Option 3: allocate on heap (boxed or array) if you need pointer lifetime > frame`,
      explanation: 'Local variables live on the call stack. When the method returns, the stack frame is released. A pointer to a local becomes a dangling pointer — reading or writing through it causes undefined behaviour. Never return a pointer to a local variable.',
    },
  ];

  challenge: Challenge = {
    title: 'XOR-cipher with pointer arithmetic',
    language: 'csharp',
    description: `Implement a simple XOR cipher using unsafe code:
1. Method: static unsafe void XorCipher(byte* data, int length, byte key) — XORs each byte in [data, data+length) with the key
2. Method: static byte[] EncryptDecrypt(byte[] input, byte key) — pins the array, calls XorCipher, returns a copy
3. Verify: encrypting twice with the same key returns the original data
4. Bonus: implement using Span<T> instead and compare the code verbosity`,
    hints: [
      'fixed (byte* ptr = input) { XorCipher(ptr, input.Length, key); }',
      'Copy the array before mutating it if you want to keep the original',
      'XOR is its own inverse: Encrypt(Encrypt(data, key), key) == data',
      'Span version: foreach (ref byte b in span) b ^= key',
      'unsafe context: method or block must be marked unsafe',
    ],
    starterCode: `using System;

class Program
{
    // TODO: implement XorCipher (unsafe, pointer-based)
    static unsafe void XorCipher(byte* data, int length, byte key)
    {
    }

    // TODO: implement EncryptDecrypt — pin, call XorCipher, return result
    static byte[] EncryptDecrypt(byte[] input, byte key)
    {
        return Array.Empty<byte>();
    }

    static void Main()
    {
        byte[] plaintext = System.Text.Encoding.UTF8.GetBytes("Hello, World!");
        byte   key       = 0x5A;

        byte[] encrypted = EncryptDecrypt(plaintext, key);
        byte[] decrypted = EncryptDecrypt(encrypted, key);

        Console.WriteLine(System.Text.Encoding.UTF8.GetString(decrypted));
        // Should print: Hello, World!
    }
}`,
    solution: `using System;
using System.Text;

class Program
{
    static unsafe void XorCipher(byte* data, int length, byte key)
    {
        byte* end = data + length;
        for (byte* p = data; p < end; p++)
            *p ^= key;
    }

    static byte[] EncryptDecrypt(byte[] input, byte key)
    {
        byte[] result = new byte[input.Length];
        Array.Copy(input, result, input.Length);

        unsafe
        {
            fixed (byte* ptr = result)
                XorCipher(ptr, result.Length, key);
        }

        return result;
    }

    // Span<T> version — no unsafe keyword, bounds-checked, cleaner
    static byte[] EncryptDecryptSpan(byte[] input, byte key)
    {
        byte[] result = new byte[input.Length];
        input.AsSpan().CopyTo(result);

        foreach (ref byte b in result.AsSpan())
            b ^= key;

        return result;
    }

    static void Main()
    {
        byte[] plaintext = Encoding.UTF8.GetBytes("Hello, World!");
        byte   key       = 0x5A;

        byte[] encrypted = EncryptDecrypt(plaintext, key);
        Console.WriteLine(BitConverter.ToString(encrypted));

        byte[] decrypted = EncryptDecrypt(encrypted, key);
        Console.WriteLine(Encoding.UTF8.GetString(decrypted));  // Hello, World!

        // Span version gives identical result:
        byte[] decrypted2 = EncryptDecryptSpan(EncryptDecryptSpan(plaintext, key), key);
        Console.WriteLine(Encoding.UTF8.GetString(decrypted2)); // Hello, World!
    }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does the fixed statement do in C#?',
      options: [
        'Marks a variable as constant — its value cannot change',
        'Pins a managed object in memory so the GC cannot move it while a pointer to it is in use',
        'Allocates memory on the stack instead of the heap',
        'Fixes a pointer to always point to the same address regardless of GC',
      ],
      answer: 1,
      explanation: 'The GC is a moving collector — it can relocate managed objects to compact the heap. A pointer to a managed object becomes invalid if the object moves. The fixed statement pins the object in place for the duration of its block, preventing the GC from moving it. All pointer operations on managed objects must occur within a fixed block.',
    },
    {
      q: 'What is the difference between ptr + 1 on an int* vs a byte*?',
      options: [
        'No difference — pointer arithmetic always advances by 1 byte',
        'int* + 1 advances by sizeof(int) = 4 bytes; byte* + 1 advances by sizeof(byte) = 1 byte',
        'int* + 1 advances by 1 int = 1 element but wraps at 32 bits',
        'Pointer arithmetic is undefined on int* — only byte* is supported',
      ],
      answer: 1,
      explanation: 'Pointer arithmetic advances in units of the pointed-to type size. int* + 1 moves forward by sizeof(int) = 4 bytes. byte* + 1 moves forward by sizeof(byte) = 1 byte. This matches C/C++ semantics — the offset is always in elements, not bytes.',
    },
    {
      q: 'Why should NativeMemory.Alloc() always be paired with NativeMemory.Free() in a finally block?',
      options: [
        'To trigger the GC to reclaim the memory sooner',
        'Because NativeMemory lives outside the GC heap — the GC will never collect it; failing to free causes a native memory leak',
        'Because the runtime double-frees without the finally block',
        'NativeMemory.Alloc() is only safe inside a try block due to thread-safety requirements',
      ],
      answer: 1,
      explanation: 'NativeMemory allocates unmanaged memory outside the GC heap. The GC has no knowledge of it and will never collect it. If an exception is thrown between Alloc and Free, the memory is leaked for the lifetime of the process. A try/finally block guarantees Free is called regardless of exceptions.',
    },
    {
      q: 'What is System.Runtime.CompilerServices.Unsafe used for?',
      options: [
        'It exposes the unsafe keyword functionality via a static class, but still requires unsafe context',
        'It provides pointer-like operations (reinterpret cast, pointer arithmetic) via managed references, without requiring the unsafe keyword in callers',
        'It disables bounds checking on all array operations globally',
        'It is an internal Microsoft class not intended for application code',
      ],
      answer: 1,
      explanation: 'The Unsafe class provides operations like Unsafe.As<TFrom,TTo>(ref from) and Unsafe.Add(ref e, n) that mirror pointer operations but work with managed references. They do not require the unsafe keyword in calling code and are used extensively in the BCL for high-performance patterns — e.g., inside Span<T> and MemoryMarshal.',
    },
    {
      q: 'What is the safest modern alternative to unsafe pointer arithmetic for high-performance buffer processing?',
      options: [
        'Using Marshal.AllocHGlobal and IntPtr arithmetic',
        'Span<T> and MemoryMarshal — provides zero-allocation buffer access with bounds checking, no unsafe keyword needed',
        'Dynamic arrays with pre-allocated capacity to avoid resizing',
        'Pinned GCHandle combined with IntPtr arithmetic',
      ],
      answer: 1,
      explanation: 'Span<T> and its companion APIs (MemoryMarshal, MemoryExtensions, System.Runtime.CompilerServices.Unsafe) cover the vast majority of high-performance buffer processing needs without any unsafe code. They are bounds-checked, GC-tracked, and work with stack, heap, and native memory. Reach for unsafe pointers only for P/Invoke or genuinely unavoidable cases.',
    },
    {
      q: 'What is the purpose of the GCHandle.Alloc(obj, GCHandleType.Pinned) overload and when is it needed?',
      options: [
        'It keeps the object alive indefinitely without a rooted reference',
        'It pins the object at a fixed memory address for the handle\'s lifetime — required when passing a managed object\'s address to native code outside a fixed block',
        'It moves the object to a non-moving LOH segment',
        'It prevents the GC from accessing the object during a concurrent collection',
      ],
      answer: 1,
      explanation: 'The fixed statement pins an object only within its block — the pin is released on exit. GCHandle.Alloc(obj, GCHandleType.Pinned) pins the object indefinitely until GCHandle.Free() is called, making the address valid for the handle\'s full lifetime. Use this when a native callback will reference the managed object\'s address across multiple calls. Always call Free() in a finally block to prevent the pin from preventing GC compaction permanently.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use unsafe code in a .NET MAUI or Blazor WASM application?',
      a: 'For .NET MAUI (native targets), yes — unsafe code works as on any .NET platform. For Blazor WebAssembly, it depends: the Mono WASM runtime supports unsafe code in principle, but many native interop operations are not available in the browser sandbox. NativeMemory works, but P/Invoke to system libraries is limited. AOT compilation for Blazor WASM also restricts some dynamic reflection patterns adjacent to unsafe code.',
    },
    {
      q: 'Is unsafe code a security vulnerability?',
      a: 'It can be. Buffer overflows via out-of-bounds pointer writes are a classic source of memory-corruption vulnerabilities. In a .NET application, unsafe code bypasses the CLR\'s type and memory safety guarantees. Isolate unsafe code in tightly bounded methods, add explicit bounds checks, and review it carefully. In web applications, never use unsafe code to process untrusted input directly — use safe managed APIs with proper validation.',
    },
    {
      q: 'What is the difference between stackalloc int[n] and new int[n]?',
      a: 'stackalloc allocates on the current call stack — no GC involvement, instant allocation, automatic "free" when the method returns. new int[n] allocates on the managed heap — tracked by the GC, can be long-lived, subject to collection. stackalloc is faster but limited to small sizes (stack is typically 1–4 MB), cannot be returned from the method, and must not be used when n could be large or user-controlled. The Span<int> = stackalloc int[n] pattern is the safe modern form.',
    },
    {
      q: 'How do I call a C native function that takes a char* from C#?',
      a: 'For simple strings, [DllImport] with string marshalling handles it automatically. For manual control, pin the string with fixed (char* pStr = myString) and pass pStr. For byte* (UTF-8), use System.Text.Encoding.UTF8.GetBytes(), pin the byte array, and pass the pointer. In .NET 7+, the [LibraryImport] attribute with source generation is the preferred modern approach — it is AOT-safe and avoids the reflection overhead of [DllImport].',
    },
    {
      q: 'What are the performance implications of using unsafe code versus safe code?',
      a: 'Unsafe code can be faster by eliminating bounds checks on array access — the JIT emits a check before every array index in safe code. However, modern JIT and the runtime already optimise many bounds checks away (loop vectorisation, range proof elimination). In practice, the measurable speedup from unsafe code is most significant in tight inner loops processing large arrays. Profile first — BenchmarkDotNet with [MemoryDiagnoser] — before adding unsafe complexity. For most application code, the safety of bounds checking is worth the negligible overhead.',
    },
    {
      q: 'How do I write a managed object\'s bytes directly to a Span<byte> without boxing?',
      a: 'For unmanaged structs, use MemoryMarshal.Write<T>(destination, in value) — it writes the raw bytes of value into destination without any allocation. The struct must be unmanaged (no reference fields). Alternatively, MemoryMarshal.Cast<T, byte>(MemoryMarshal.CreateReadOnlySpan(ref value, 1)) creates a byte view over the struct. For classes or structs with reference fields, you must serialise to bytes explicitly — the GC must be able to track all object references.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Unsafe code gives raw pointer access — bypassing GC safety and bounds checking. Use <code>fixed</code> to pin managed objects, <code>NativeMemory</code> for unmanaged heaps, and always free native memory in a finally block. Prefer <code>Span&lt;T&gt;</code> and <code>MemoryMarshal</code> — they cover 90% of the same use cases safely.',
    mustKnow: [
      '<code>unsafe</code> block/method + <code>&lt;AllowUnsafeBlocks&gt;true&lt;/AllowUnsafeBlocks&gt;</code> in .csproj to enable',
      '<code>fixed (byte* ptr = arr)</code> — pins managed object; pointer valid only inside the block',
      'Pointer arithmetic: <code>ptr + n</code> advances by <code>n * sizeof(T)</code> bytes',
      '<code>NativeMemory.Alloc/Free</code> — unmanaged heap; GC never collects it; always free in finally',
      '<code>stackalloc byte[n]</code> — stack allocation, instant, but size must be small + known at compile time',
      '<code>System.Runtime.CompilerServices.Unsafe</code> — pointer-like ops without the unsafe keyword',
    ],
    interviewFocus: [
      '<strong>When to use unsafe?</strong> — P/Invoke with pointer args, hardware-level parsers, porting C code; never for normal apps',
      '<strong>fixed statement purpose?</strong> — prevents GC from moving object while you hold a pointer to it',
      '<strong>NativeMemory vs new byte[]?</strong> — NativeMemory = unmanaged, no GC, must free manually; new = managed, GC collects',
      '<strong>Safe alternative?</strong> — Span<T> + MemoryMarshal cover most high-performance needs without unsafe',
    ],
  };
}
