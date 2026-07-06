import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-why-blittable-types-skip-marshalling-pinning-vs-full-marshal-cycle-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './why-blittable-types-skip-marshalling-pinning-vs-full-marshal-cycle.html',
  styleUrl: './why-blittable-types-skip-marshalling-pinning-vs-full-marshal-cycle.scss',
})
export class WhyBlittableTypesSkipMarshallingPinningVsFullMarshalCycleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s Q&A defines blittable vs non-blittable — this subtopic covers the mechanism behind WHY the distinction exists at all',
      points: [
        'The main P/Invoke page\'s Q&amp;A states: "Blittable types have identical layout in managed and unmanaged memory... they can be passed by pinning (no copy)... Non-blittable types need marshalling." This correctly identifies WHAT happens, but not WHY a "pin" is sufficient for one category while an entirely separate conversion process is required for the other.',
      ],
    },
    {
      heading: 'A blittable type\'s in-memory bit pattern is IDENTICAL whether it lives in managed or native memory — nothing needs converting, only "held still"',
      points: [
        'An <code>int</code>, a <code>double</code>, or a <code>struct</code> composed entirely of such primitives (like the main page\'s <code>RECT</code>) has EXACTLY the same byte layout the CLR uses internally as the byte layout native C code expects. The ONLY problem is that the .NET GC is free to MOVE managed objects during a compacting collection (the same mechanic covered in the Unsafe Code &amp; Pointers hub) — if a GC ran mid-P/Invoke-call and relocated the array/struct, the native function\'s pointer to it would become instantly invalid.',
        'The <code>fixed</code>-statement-equivalent "pinning" P/Invoke performs automatically for blittable parameters solves EXACTLY this ONE problem: it temporarily prevents the GC from moving that specific memory for the duration of the native call, then hands the native function a DIRECT POINTER into the managed heap itself. No bytes are copied, no format is converted — the native code reads/writes the SAME memory the managed side owns, through a pointer, for the duration of the call.',
      ],
    },
    {
      heading: 'A non-blittable type has NO single, well-defined native-memory equivalent to even pin — it must be actively CONSTRUCTED in a temporary buffer, then destroyed afterward',
      points: [
        'A C# <code>bool</code> is a 1-byte CLR value, but Win32 <code>BOOL</code> is a 4-byte native int (exactly the mismatch the main page\'s Common Mistakes section warns about) — there is no single memory layout that is simultaneously "a valid managed bool" AND "a valid native BOOL." Similarly, a C# <code>string</code> is a UTF-16, length-prefixed, immutable managed object with its own internal header — nothing like a native <code>char*</code>/<code>wchar_t*</code> null-terminated byte buffer at all.',
        'For these types, the marshaller must ALLOCATE a genuinely separate, temporary block of memory in the correct NATIVE format, actively CONVERT/COPY the managed value\'s data into it (widening a 1-byte bool to 4 bytes, re-encoding UTF-16 to UTF-8 or null-terminating a UTF-16 buffer, etc.), pass a pointer to THAT temporary buffer to the native function, and afterward (for output parameters) convert the native buffer\'s contents BACK into a new managed object — and finally free the temporary native buffer. This is a fundamentally more expensive operation than simply pinning existing memory in place, which is exactly why the main page\'s own guidance to "prefer blittable types where possible" for performance-sensitive P/Invoke has a real, mechanical basis.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Blittable — pinning only, zero copy, zero conversion',
      language: 'csharp',
      code: `// int[] is blittable — every element is a 4-byte int, identical in
// managed and native memory. The marshaller does NOT copy this array
// or convert its contents at all:
[LibraryImport("mylib", EntryPoint = "sum_array")]
public static partial int SumArray(int[] values, int count);

int[] numbers = { 1, 2, 3, 4, 5 };
int total = SumArray(numbers, numbers.Length);

// What ACTUALLY happens under the hood, conceptually equivalent to:
unsafe
{
    fixed (int* pinned = numbers)   // GC cannot move "numbers" for the
                                     // duration of this block — the SAME
                                     // heap memory is pinned in place
    {
        // The native function receives a DIRECT pointer into the
        // managed heap itself — reads/writes the SAME bytes the
        // managed int[] object owns, no copy exists anywhere:
        total = NativeSumArray(pinned, numbers.Length);
    }
    // Pin released — GC free to move "numbers" again on the next collection
}`,
    },
    {
      label: 'Non-blittable — full allocate, convert, copy, and (for strings) free afterward',
      language: 'csharp',
      code: `// string is NOT blittable — it needs an entirely separate native
// buffer constructed from scratch, in a DIFFERENT format than the
// managed string's own internal representation:
[LibraryImport("mylib", EntryPoint = "process_name",
    StringMarshalling = StringMarshalling.Utf8)]
public static partial void ProcessName(string name);

string userName = "Alice";
ProcessName(userName);

// What ACTUALLY happens, conceptually equivalent to:
{
    // 1. ALLOCATE a temporary native buffer — genuinely separate memory,
    //    NOT the same bytes the managed "userName" string object owns:
    int utf8ByteCount = System.Text.Encoding.UTF8.GetByteCount(userName) + 1; // +1 for null terminator
    nint nativeBuffer = Marshal.AllocHGlobal(utf8ByteCount);

    // 2. CONVERT — re-encode the managed UTF-16 string's characters
    //    into UTF-8 bytes, writing them INTO the newly allocated buffer:
    byte[] utf8Bytes = System.Text.Encoding.UTF8.GetBytes(userName);
    Marshal.Copy(utf8Bytes, 0, nativeBuffer, utf8Bytes.Length);
    Marshal.WriteByte(nativeBuffer, utf8Bytes.Length, 0);  // null terminator

    // 3. PASS the pointer to this TEMPORARY buffer — not a pointer into
    //    the original managed string object at all:
    NativeProcessName(nativeBuffer);

    // 4. FREE the temporary buffer — this cleanup step has no
    //    equivalent at all in the blittable pinning case, since
    //    pinning never allocates anything new to begin with:
    Marshal.FreeHGlobal(nativeBuffer);
}
// Compare to the int[] example: THREE additional real steps (allocate,
// convert, free) exist here that simply do not exist for blittable
// types, which only need a temporary "hold still" instruction.`,
    },
    {
      label: 'Verifying blittability — Marshal.SizeOf throws for non-blittable types',
      language: 'csharp',
      code: `using System.Runtime.InteropServices;

// A blittable struct — Marshal.SizeOf succeeds, reporting the EXACT
// same size the native side would compute for an equivalent C struct:
[StructLayout(LayoutKind.Sequential)]
public struct Point { public int X; public int Y; }

int size = Marshal.SizeOf<Point>();  // 8 — succeeds, no exception

// A struct containing a non-blittable field — Marshal.SizeOf THROWS,
// because there is no single, well-defined "native equivalent size"
// to even compute; the marshaller would need to actively construct a
// converted representation, which SizeOf alone cannot express:
public struct NamedPoint
{
    public int X;
    public int Y;
    public string Label;  // managed string — no fixed native size
}

try
{
    int badSize = Marshal.SizeOf<NamedPoint>();
}
catch (ArgumentException)
{
    // "Type 'NamedPoint' cannot be marshaled as an unmanaged structure;
    //  no meaningful size or offset can be computed."
    Console.WriteLine("NamedPoint is not blittable — confirmed by Marshal.SizeOf throwing.");
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A struct contains only <code>int</code> and <code>double</code> fields (blittable), but is passed to a native function as an ARRAY: <code>MyStruct[]</code>. Explain whether the marshaller pins the whole array in place (like the int[] example) or performs a full allocate-convert-copy cycle for each element, and why.',
    hint: 'Consider that "blittable" is a property of the ELEMENT TYPE\'s memory layout, not of arrays specifically — an array whose element type is itself blittable inherits that same "identical managed/native layout" property for the array\'s own contiguous memory block.',
    solution: `[StructLayout(LayoutKind.Sequential)]
public struct MyStruct { public int A; public double B; }  // fully blittable

[LibraryImport("mylib", EntryPoint = "process_structs")]
public static partial void ProcessStructs(MyStruct[] items, int count);

MyStruct[] data = { new() { A = 1, B = 2.5 }, new() { A = 2, B = 3.5 } };
ProcessStructs(data, data.Length);

// THE ANSWER: since MyStruct's element type is FULLY blittable (every
// field is itself a blittable primitive, laid out sequentially with
// [StructLayout(LayoutKind.Sequential)] matching native C struct
// layout), the ARRAY "MyStruct[] data" as a WHOLE is ALSO blittable —
// its entire contiguous block of managed memory (the array's raw
// bytes: struct 0's A, struct 0's B, struct 1's A, struct 1's B, ...)
// is BYTE-FOR-BYTE identical to what a native "struct MyStruct arr[2]"
// array would look like in C.
//
// This means the marshaller does EXACTLY the same thing as the plain
// int[] example — a SINGLE pin operation over the ENTIRE array's
// existing managed memory, handing the native function a direct
// pointer into it, with ZERO copying and ZERO per-element conversion:
unsafe
{
    fixed (MyStruct* pinned = data)  // pins the WHOLE array's memory once
    {
        NativeProcessStructs(pinned, data.Length);
        // Native code reads/writes the SAME managed array memory
        // directly, through the pointer — for ALL elements at once,
        // not one allocate-convert-copy cycle per struct.
    }
}

// This would be COMPLETELY different if MyStruct contained even ONE
// non-blittable field (a string, or an un-annotated bool) — THEN the
// entire array would need per-element allocation and conversion into
// a temporary native-format buffer, since no single contiguous "hold
// still" pin could produce a valid native-layout representation.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the difference between blittable and non-blittable P/Invoke marshalling is just an internal implementation detail with no meaningful performance difference.',
      reality: 'blittable types require only a temporary GC pin (zero copy, zero allocation) while non-blittable types require allocating a genuinely separate native buffer, converting the data into it, and freeing it afterward — a real, measurable overhead difference, especially for values passed in tight loops.',
    },
    {
      thought: 'an array is only blittable if it holds primitive types directly (int[], double[]) — an array of a custom struct is always non-blittable.',
      reality: 'an array of a struct is blittable exactly when that struct\'s OWN fields are all blittable and sequentially laid out to match native struct conventions — a fully blittable struct array gets the same single-pin, zero-copy treatment as a primitive array.',
    },
    {
      thought: 'Marshal.SizeOf<T>() works for any type — it simply reports how many bytes T occupies.',
      reality: 'Marshal.SizeOf throws ArgumentException for genuinely non-blittable types, since there is no single, well-defined native-equivalent size to compute without actually performing a full marshalling conversion — the exception itself is a reliable way to test whether a type is blittable.',
    },
  ];
}
