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
  selector: 'app-csharp-pinvoke',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, PrerequisitesComponent, BeforeAfterComponent,
  ],
  templateUrl: './pinvoke.html',
  styleUrl: './pinvoke.scss',
})
export class CsharpPinvoke {

  prerequisites: Prerequisite[] = [
    { label: 'Unsafe Code & Pointers', route: '/csharp/unsafe-pointers' },
    { label: 'Structs',               route: '/csharp/structs' },
  ];

  quickRef: QuickRefItem[] = [
    { name: '[DllImport]',            type: 'accessor',   desc: 'Legacy P/Invoke — JIT-generated marshalling; works on JIT but not Native AOT', since: '.NET Framework 1.0' },
    { name: '[LibraryImport]',        type: 'accessor',   desc: 'Modern P/Invoke — source-generated marshalling; AOT-safe; prefer over [DllImport]', since: '.NET 7' },
    { name: 'SafeHandle',             type: 'class',      desc: 'Safe wrapper for native handles — ensures Dispose/finalisation releases the handle', since: '.NET 2.0' },
    { name: 'Marshal',                type: 'class',      desc: 'Utility class: AllocHGlobal, PtrToStringUTF8, StructureToPtr, GetLastWin32Error', since: '.NET 1.0' },
    { name: '[StructLayout]',         type: 'accessor',   desc: 'Controls memory layout of struct for interop: LayoutKind.Sequential or Explicit', since: '.NET 1.0' },
    { name: '[MarshalAs]',            type: 'accessor',   desc: 'Controls how a specific parameter/field is marshalled: [MarshalAs(UnmanagedType.Bool)]', since: '.NET 1.0' },
    { name: 'NativeLibrary',          type: 'class',      desc: '.NET 5+ — load/resolve native libraries manually; hook NativeLibrary.SetDllImportResolver()', since: '.NET 5' },
    { name: '[UnmanagedCallersOnly]', type: 'accessor',   desc: 'Marks a C# method as callable from native code — used for native callbacks', since: '.NET 5' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is P/Invoke and when to use it',
      points: [
        'Platform Invocation Services (P/Invoke) allows C# code to call functions exported from native shared libraries (.dll on Windows, .so on Linux, .dylib on macOS). This is the primary mechanism for calling OS APIs, hardware drivers, and C/C++ libraries from .NET.',
        'Common use cases: calling Windows API functions (CreateFile, SendMessage, cryptographic hardware), using system libraries (zlib, OpenSSL, libsodium), integrating with existing C/C++ codebases, accessing hardware peripherals (serial ports, USB HID), and platform-specific features not exposed by the BCL.',
        'Prefer managed alternatives first: BCL classes wrap most OS operations safely. Use P/Invoke only when no managed equivalent exists, a native library provides functionality that would be impractical to reimplement, or performance requirements demand zero-overhead native code (e.g., GPU libraries, SIMD via native intrinsics).',
        'The cost of a P/Invoke call: marshalling parameters to native types, calling through the interop boundary, marshalling return values back, and updating managed state (e.g., thread-local error codes). For tight loops calling simple native functions, this overhead can dominate. Batch calls where possible.',
      ],
    },
    {
      heading: '[DllImport] vs [LibraryImport]',
      points: [
        '<code>[DllImport]</code> has been in .NET since v1.0. It generates marshalling IL at JIT time — the marshaller is built from reflection at runtime. It works everywhere JIT runs but is incompatible with Native AOT because AOT has no JIT to generate the marshalling code.',
        '<code>[LibraryImport]</code> (.NET 7+) is the modern replacement. It triggers a Roslyn source generator to emit the marshalling C# code at compile time — the generated code is compiled with the rest of your project. It is AOT-safe, faster (less marshalling overhead), and produces compile-time errors for unsupported signatures rather than runtime failures.',
        'Migration is usually straightforward: change <code>[DllImport]</code> to <code>[LibraryImport]</code>, add <code>partial</code> to the method declaration (required by source generator), and adjust string marshalling (use <code>StringMarshalling = StringMarshalling.Utf8</code> instead of <code>CharSet = CharSet.Unicode</code>).',
        'For simple signatures (primitives, structs with [StructLayout]), LibraryImport needs no extra configuration. For complex types (custom marshallers, arrays), use <code>[MarshalUsing(typeof(MyMarshaller))]</code> — a type that implements the <code>ICustomMarshaller</code> interface.',
      ],
    },
    {
      heading: 'Marshalling — the type translation layer',
      points: [
        'Marshalling converts between managed .NET types and native C types. Most numeric primitives map directly (int → int32_t, long → int64_t, bool needs special handling). Strings, arrays, and structs require explicit configuration.',
        'Strings: native C functions expect UTF-8 (<code>char*</code>) or UTF-16 (<code>wchar_t*</code>). Specify <code>StringMarshalling = StringMarshalling.Utf8</code> or <code>Utf16</code> in [LibraryImport]. For buffer output parameters, use <code>StringBuilder</code> or a pre-allocated <code>char[]</code> / <code>byte[]</code>.',
        'Structs: use <code>[StructLayout(LayoutKind.Sequential)]</code> to ensure the managed struct has the same field layout as the native struct. Use <code>Pack = 1</code> (or appropriate value) to match the native packing. Use <code>[FieldOffset]</code> with <code>LayoutKind.Explicit</code> for unions or non-standard layouts.',
        'Booleans: C# <code>bool</code> is 1 byte; Win32 BOOL is 4 bytes. Without <code>[MarshalAs(UnmanagedType.Bool)]</code> or <code>[return: MarshalAs(...)]</code>, a Win32 API returning 0 (false) may be misread as 1 (true) because only the first byte is examined. Always annotate bool parameters and return values in Win32 P/Invoke.',
      ],
    },
    {
      heading: 'SafeHandle — correct lifetime management',
      points: [
        'Native handles (HANDLE, FILE*, fd) must be explicitly closed when done. Forgetting to close a handle leaks OS resources. The wrong time to close a handle — too early — causes crashes. <code>SafeHandle</code> wraps a native handle and ensures it is closed when the wrapper is finalised or disposed.',
        'Create a custom SafeHandle by inheriting from <code>SafeHandleZeroOrMinusOneIsInvalid</code> (for handles where 0 and -1 are invalid) or <code>SafeHandleMinusOneIsInvalid</code> (for -1 only). Override <code>ReleaseHandle()</code> to call the appropriate close function (<code>CloseHandle</code>, <code>fclose</code>, etc.).',
        'P/Invoke automatically handles <code>SafeHandle</code> parameters: it extracts the raw handle before the call and prevents the wrapper from being garbage-collected during the call (avoiding a race condition where GC finalises the SafeHandle mid-call).',
        'Never pass the raw <code>handle.DangerousGetHandle()</code> value to native code when you can pass the <code>SafeHandle</code> directly — the P/Invoke marshaller handles the extraction safely. <code>DangerousGetHandle()</code> is only for cases where the raw IntPtr is unavoidable.',
      ],
    },
    {
      heading: 'Callbacks — native calling managed code',
      points: [
        'Some native APIs accept function pointers for callbacks (event handlers, progress notifications, sort comparators). C# can provide these via delegates with <code>[UnmanagedFunctionPointer]</code> or via <code>[UnmanagedCallersOnly]</code> static methods.',
        '<code>[UnmanagedCallersOnly]</code> (.NET 5+) is the modern approach: mark a <code>static</code> method with this attribute, then pass a function pointer (<code>&MethodName</code>) to the native code. The method must only use blittable types in its signature.',
        'Delegates as callbacks: wrap the delegate in a variable that is kept alive for the duration of the callback (prevent GC collection). If the native code holds the function pointer after the P/Invoke call returns, the GC may collect the delegate and invalidate the pointer — a crash. Use <code>GCHandle.Alloc(delegate)</code> to keep it alive.',
        '<code>NativeLibrary.SetDllImportResolver()</code> (.NET 5+) lets you intercept library loading — useful for choosing between different native library versions, loading from a custom path, or providing a fallback when a library is not found.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: '[LibraryImport] basics',
      language: 'csharp',
      code: `using System.Runtime.InteropServices;

// Modern P/Invoke — source-generated, AOT-safe
// Method must be: static, partial, and in a partial class/struct
public static partial class NativeMethods
{
    // Simple numeric return + parameters — no marshalling needed
    [LibraryImport("kernel32.dll")]
    public static partial uint GetCurrentProcessId();

    // String parameter — specify UTF-16 for Windows WChar APIs
    [LibraryImport("kernel32.dll",
        EntryPoint = "GetModuleHandleW",
        StringMarshalling = StringMarshalling.Utf16)]
    public static partial nint GetModuleHandle(string? moduleName);

    // Boolean return — Win32 BOOL is 4 bytes; must annotate
    [LibraryImport("kernel32.dll",
        EntryPoint = "CreateDirectoryW",
        SetLastError = true,
        StringMarshalling = StringMarshalling.Utf16)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static partial bool CreateDirectory(
        string path,
        nint securityAttributes);  // IntPtr.Zero for default

    // Out parameter
    [LibraryImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static partial bool GetExitCodeProcess(
        nint processHandle,
        out uint exitCode);
}

// Usage
uint pid = NativeMethods.GetCurrentProcessId();
Console.WriteLine(\$"PID: {pid}");

bool created = NativeMethods.CreateDirectory(@"C:\\Temp\\TestDir", 0);
if (!created)
{
    int error = Marshal.GetLastPInvokeError();
    Console.WriteLine(\$"Error: {error}");
}`,
    },
    {
      label: 'Struct marshalling',
      language: 'csharp',
      code: `using System.Runtime.InteropServices;

// Map C struct to C# struct for P/Invoke
// C struct: typedef struct { LONG left; LONG top; LONG right; LONG bottom; } RECT;
[StructLayout(LayoutKind.Sequential)]  // ensures same field order as native
public struct RECT
{
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;

    public int Width  => Right - Left;
    public int Height => Bottom - Top;
}

// Union simulation with LayoutKind.Explicit
[StructLayout(LayoutKind.Explicit, Size = 4)]
public struct COLORREF
{
    [FieldOffset(0)] public uint Value;
    [FieldOffset(0)] public byte R;
    [FieldOffset(1)] public byte G;
    [FieldOffset(2)] public byte B;
}

public static partial class Win32
{
    [LibraryImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static partial bool GetWindowRect(nint hwnd, out RECT rect);

    [LibraryImport("user32.dll")]
    public static partial nint GetDesktopWindow();
}

// Usage
nint desktop = Win32.GetDesktopWindow();
if (Win32.GetWindowRect(desktop, out RECT rect))
{
    Console.WriteLine(\$"Desktop: {rect.Width}×{rect.Height}");
}

// Manual struct marshalling — for older DllImport patterns
RECT r = new() { Left = 10, Top = 20, Right = 100, Bottom = 200 };
nint ptr = Marshal.AllocHGlobal(Marshal.SizeOf<RECT>());
try
{
    Marshal.StructureToPtr(r, ptr, false);
    // pass ptr to native code...
    RECT back = Marshal.PtrToStructure<RECT>(ptr);
}
finally
{
    Marshal.FreeHGlobal(ptr);
}`,
    },
    {
      label: 'SafeHandle pattern',
      language: 'csharp',
      code: `using Microsoft.Win32.SafeHandles;
using System.Runtime.InteropServices;

// Custom SafeHandle for a file handle opened via native API
public sealed class NativeFileHandle : SafeHandleZeroOrMinusOneIsInvalid
{
    // Private constructor — only created by P/Invoke marshaller
    private NativeFileHandle() : base(ownsHandle: true) { }

    protected override bool ReleaseHandle()
    {
        return CloseHandle(handle);
    }

    [LibraryImport("kernel32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool CloseHandle(nint handle);
}

public static partial class FileInterop
{
    private const uint GENERIC_READ  = 0x80000000;
    private const uint OPEN_EXISTING = 3;
    private const uint FILE_SHARE_READ = 1;

    // P/Invoke returns SafeHandle — marshaller auto-extracts + protects from GC
    [LibraryImport("kernel32.dll",
        EntryPoint = "CreateFileW",
        SetLastError = true,
        StringMarshalling = StringMarshalling.Utf16)]
    public static partial NativeFileHandle CreateFile(
        string fileName,
        uint desiredAccess,
        uint shareMode,
        nint securityAttributes,
        uint creationDisposition,
        uint flagsAndAttributes,
        nint templateFile);

    [LibraryImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static partial bool ReadFile(
        NativeFileHandle file,     // SafeHandle passed directly
        byte[] buffer,
        uint numberOfBytesToRead,
        out uint numberOfBytesRead,
        nint overlapped);
}

// Usage — handle automatically closed when disposed
using NativeFileHandle handle = FileInterop.CreateFile(
    @"C:\\Windows\\System32\\drivers\\etc\\hosts",
    0x80000000, // GENERIC_READ
    1,          // FILE_SHARE_READ
    0, 3, 0, 0);

if (!handle.IsInvalid)
{
    byte[] buf = new byte[1024];
    FileInterop.ReadFile(handle, buf, (uint)buf.Length, out uint read, 0);
    Console.WriteLine(System.Text.Encoding.UTF8.GetString(buf, 0, (int)read));
}
// handle.Dispose() called automatically — CloseHandle invoked`,
    },
    {
      label: 'Callbacks & [UnmanagedCallersOnly]',
      language: 'csharp',
      code: `using System.Runtime.InteropServices;

// Modern callback pattern — [UnmanagedCallersOnly] static method
public static partial class SortInterop
{
    // Declare the callback as a function pointer type
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    public delegate int CompareFunc(nint a, nint b);

    [LibraryImport("msvcrt.dll", EntryPoint = "qsort")]
    public static partial void QSort(
        nint base_,
        nuint num,
        nuint size,
        nint compar);  // function pointer

    // The callback — must be static, blittable params only
    [UnmanagedCallersOnly(CallConvs = [typeof(System.Runtime.CompilerServices.CallConvCdecl)])]
    public static int CompareInts(nint a, nint b)
    {
        int va = Marshal.ReadInt32(a);
        int vb = Marshal.ReadInt32(b);
        return va.CompareTo(vb);
    }
}

// Usage — pass function pointer directly (no delegate allocation)
int[] arr = { 5, 3, 1, 4, 2 };
unsafe
{
    fixed (int* p = arr)
    {
        SortInterop.QSort(
            (nint)p,
            (nuint)arr.Length,
            (nuint)sizeof(int),
            (nint)(delegate* unmanaged[Cdecl]<nint, nint, int>)&SortInterop.CompareInts);
    }
}
Console.WriteLine(string.Join(", ", arr));  // 1, 2, 3, 4, 5

// Legacy delegate callback — must keep alive to prevent GC
SortInterop.CompareFunc compareDelegate = SortInterop.CompareInts_Legacy;
// GCHandle ensures delegate not collected while native code holds the pointer
GCHandle gcHandle = GCHandle.Alloc(compareDelegate);
try
{
    nint funcPtr = Marshal.GetFunctionPointerForDelegate(compareDelegate);
    // Pass funcPtr to native API...
}
finally
{
    gcHandle.Free();  // release when native code is done with it
}

// Legacy static method for delegate
static int CompareInts_Legacy(nint a, nint b) => Marshal.ReadInt32(a).CompareTo(Marshal.ReadInt32(b));`,
    },
    {
      label: 'NativeLibrary & cross-platform',
      language: 'csharp',
      code: `using System.Runtime.InteropServices;

// Cross-platform library loading — different names on different OS
// Use NativeLibrary.SetDllImportResolver to pick the right library name

static class CompressionLib
{
    private const string LibName = "compression";  // logical name

    static CompressionLib()
    {
        // Register a resolver — called when P/Invoke looks up "compression"
        NativeLibrary.SetDllImportResolver(
            typeof(CompressionLib).Assembly,
            (libName, assembly, searchPath) =>
            {
                if (libName != LibName) return nint.Zero;

                // Map logical name to OS-specific library name
                string osLibName = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                    ? "zlib1.dll"
                    : RuntimeInformation.IsOSPlatform(OSPlatform.OSX)
                        ? "libz.dylib"
                        : "libz.so.1";

                NativeLibrary.TryLoad(osLibName, assembly, searchPath, out nint handle);
                return handle;
            });
    }

    [LibraryImport(LibName, EntryPoint = "compress")]
    public static partial int Compress(
        byte[] dest,   ref ulong destLen,
        byte[] source, ulong    sourceLen);

    [LibraryImport(LibName, EntryPoint = "uncompress")]
    public static partial int Uncompress(
        byte[] dest,   ref ulong destLen,
        byte[] source, ulong    sourceLen);

    [LibraryImport(LibName, EntryPoint = "zlibVersion",
        StringMarshalling = StringMarshalling.Utf8)]
    [return: MarshalAs(UnmanagedType.LPUTF8Str)]
    public static partial string ZlibVersion();
}

// Usage — works on Windows, Linux, macOS
Console.WriteLine(\$"zlib version: {CompressionLib.ZlibVersion()}");

byte[] data    = System.Text.Encoding.UTF8.GetBytes("Hello, zlib! Hello, zlib! Hello!");
byte[] compressed = new byte[data.Length + 100];
ulong  compLen    = (ulong)compressed.Length;
int    result     = CompressionLib.Compress(compressed, ref compLen, data, (ulong)data.Length);
Console.WriteLine(\$"Compressed {data.Length} → {compLen} bytes (result={result})");`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: '[DllImport] → [LibraryImport] migration',
      before: `// Legacy [DllImport] — JIT-generated marshalling, not AOT-compatible
[DllImport("kernel32.dll",
    EntryPoint = "CreateFileW",
    SetLastError = true,
    CharSet = CharSet.Unicode)]
private static extern IntPtr CreateFile(
    string lpFileName,
    uint   dwDesiredAccess,
    uint   dwShareMode,
    IntPtr lpSecurityAttributes,
    uint   dwCreationDisposition,
    uint   dwFlagsAndAttributes,
    IntPtr hTemplateFile);`,
      after: `// Modern [LibraryImport] — source-generated, AOT-safe, partial method required
[LibraryImport("kernel32.dll",
    EntryPoint = "CreateFileW",
    SetLastError = true,
    StringMarshalling = StringMarshalling.Utf16)]
private static partial nint CreateFile(
    string lpFileName,
    uint   dwDesiredAccess,
    uint   dwShareMode,
    nint   lpSecurityAttributes,
    uint   dwCreationDisposition,
    uint   dwFlagsAndAttributes,
    nint   hTemplateFile);`,
      note: 'Three changes: [DllImport] → [LibraryImport], add "partial", change IntPtr → nint, CharSet.Unicode → StringMarshalling.Utf16.',
      language: 'csharp',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not using SafeHandle — leaking native handles',
      wrong: `// Returns raw IntPtr — no automatic cleanup
[LibraryImport("kernel32.dll", EntryPoint = "CreateFileW",
    StringMarshalling = StringMarshalling.Utf16, SetLastError = true)]
private static partial nint CreateFile(string path, uint access,
    uint share, nint sa, uint cd, uint flags, nint tmpl);

nint handle = CreateFile("data.txt", 0x80000000, 1, 0, 3, 0, 0);
DoWork(handle);
// MISSING: CloseHandle(handle) — if an exception occurs, handle leaks`,
      right: `// SafeHandle wrapper — handle guaranteed to be closed on Dispose/GC
public sealed class Win32FileHandle : SafeHandleZeroOrMinusOneIsInvalid
{
    private Win32FileHandle() : base(ownsHandle: true) { }
    protected override bool ReleaseHandle() => CloseHandle(handle);
    [LibraryImport("kernel32.dll")] [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool CloseHandle(nint h);
}

// P/Invoke automatically creates the SafeHandle and prevents premature GC
[LibraryImport("kernel32.dll", EntryPoint = "CreateFileW",
    StringMarshalling = StringMarshalling.Utf16, SetLastError = true)]
private static partial Win32FileHandle CreateFileSafe(
    string path, uint access, uint share, nint sa, uint cd, uint flags, nint tmpl);

using Win32FileHandle handle = CreateFileSafe("data.txt", 0x80000000, 1, 0, 3, 0, 0);
if (!handle.IsInvalid) DoWork(handle);  // CloseHandle called on Dispose`,
      explanation: 'Raw IntPtr handles are not tracked by the GC. Any exception between CreateFile and CloseHandle leaks the OS handle — exhausting the process handle table. SafeHandle integrates with the GC finaliser and IDisposable pattern, guaranteeing the handle is released even when exceptions occur.',
    },
    {
      title: 'Mismatching bool marshalling with Win32 BOOL',
      wrong: `// Win32 BOOL is int (4 bytes); C# bool is 1 byte
// Without MarshalAs, the marshaller reads only 1 byte — misinterprets 4-byte FALSE (0x00000000)
[LibraryImport("kernel32.dll", SetLastError = true)]
private static partial bool DeleteFile(string path);  // WRONG return type handling`,
      right: `// Correct: annotate the return value with [MarshalAs(UnmanagedType.Bool)]
[LibraryImport("kernel32.dll", EntryPoint = "DeleteFileW",
    SetLastError = true, StringMarshalling = StringMarshalling.Utf16)]
[return: MarshalAs(UnmanagedType.Bool)]
private static partial bool DeleteFile(string path);

// For BOOL parameters too:
[LibraryImport("kernel32.dll")]
[return: MarshalAs(UnmanagedType.Bool)]
private static partial bool SetHandleInformation(
    nint hObject, uint dwMask,
    [MarshalAs(UnmanagedType.Bool)] bool dwFlags);`,
      explanation: 'Win32 BOOL is a 32-bit integer — 0 = false, non-zero = true. C# bool is 1 byte. Without [MarshalAs(UnmanagedType.Bool)], the marshaller reads only the first byte of the 4-byte return value. A 4-byte FALSE (0x00000000) may be misread as TRUE if the memory contains garbage. Always annotate bool parameters and return values.',
    },
    {
      title: 'GC collecting a callback delegate while native code holds the pointer',
      wrong: `void RegisterCallback()
{
    // Delegate is a local variable — GC can collect it after this method returns
    // Native code holds the function pointer — it becomes a dangling pointer!
    var callback = new SortInterop.CompareFunc(CompareInts);
    RegisterNativeCallback(Marshal.GetFunctionPointerForDelegate(callback));
    // callback goes out of scope here — eligible for GC
    // Next GC cycle: callback collected, native function pointer is invalid → CRASH
}`,
      right: `// Keep delegate alive for the duration of native code's use
private SortInterop.CompareFunc? _callbackRef;  // field keeps it alive

void RegisterCallback()
{
    _callbackRef = new SortInterop.CompareFunc(CompareInts);
    RegisterNativeCallback(Marshal.GetFunctionPointerForDelegate(_callbackRef));
    // _callbackRef field prevents GC from collecting the delegate
}

void UnregisterCallback()
{
    UnregisterNativeCallback();
    _callbackRef = null;  // allow GC after native code no longer needs it
}`,
      explanation: 'The GC tracks managed object reachability — if no managed reference points to the delegate, it is eligible for collection. Native code holding a function pointer obtained from a delegate does not prevent GC. The delegate must be kept alive in a field (or via GCHandle.Alloc) for as long as native code may call the pointer.',
    },
    {
      title: 'Incorrect struct layout — field alignment mismatch',
      wrong: `// C struct: struct Point { double x; int flag; };
// sizeof: 8 (x) + 4 (flag) + 4 (padding) = 16 bytes

[StructLayout(LayoutKind.Sequential)]
public struct Point
{
    public double X;
    public int    Flag;
    // C# default Pack may differ from native — fields may not align
}`,
      right: `// Specify Pack to match the native struct's packing
[StructLayout(LayoutKind.Sequential, Pack = 8)]
public struct Point
{
    public double X;     // 8 bytes
    public int    Flag;  // 4 bytes
    // 4 bytes padding added by compiler to reach 16-byte total (Pack=8)
}

// Verify at startup:
// Debug.Assert(Marshal.SizeOf<Point>() == 16, "Struct size mismatch!");

// For manually controlled layout (unions, non-standard packing):
[StructLayout(LayoutKind.Explicit, Size = 16)]
public struct PointExplicit
{
    [FieldOffset(0)] public double X;
    [FieldOffset(8)] public int    Flag;
}`,
      explanation: 'C/C++ struct layout depends on compiler, platform, and packing pragmas. A mismatch between the native struct layout and your C# struct causes reads/writes at wrong offsets — silent data corruption. Always verify with Marshal.SizeOf<T>() at startup, and specify Pack explicitly when matching non-default native layouts.',
    },
  ];

  challenge: Challenge = {
    title: 'Cross-platform directory listing via libc',
    language: 'csharp',
    description: `Use P/Invoke to list files in a directory using native POSIX APIs (opendir/readdir/closedir on Linux/macOS):
1. Define a SafeHandle for the DIR* handle (closedir to release)
2. Define the dirent struct with d_name field
3. [LibraryImport] for opendir, readdir, closedir
4. Write a method IEnumerable<string> ListDirectory(string path) that uses these to enumerate filenames
5. Skip "." and ".." entries
Bonus: add a Windows fallback using FindFirstFile/FindNextFile/FindClose`,
    hints: [
      'DIR* is just a pointer — use nint or SafeHandle wrapping closedir',
      'struct dirent: on Linux has d_name as byte[256]; use [MarshalAs(UnmanagedType.ByValArray, SizeConst=256)]',
      'readdir returns nint (pointer to dirent) — use Marshal.PtrToStructure<dirent>() to read it',
      'StringMarshalling.Utf8 for opendir path parameter',
      'RuntimeInformation.IsOSPlatform(OSPlatform.Windows) for branching',
    ],
    starterCode: `using System.Runtime.InteropServices;

// POSIX directory listing via P/Invoke
// Run on Linux/macOS: dotnet run

static class PosixDir
{
    // TODO: define SafeDirHandle (closedir)
    // TODO: define dirent struct
    // TODO: [LibraryImport] for opendir, readdir, closedir

    public static IEnumerable<string> ListDirectory(string path)
    {
        // TODO: open dir, loop readdir, yield filenames, close
        yield break;
    }
}

foreach (var file in PosixDir.ListDirectory("/tmp"))
    Console.WriteLine(file);`,
    solution: `using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential)]
struct Dirent
{
    public ulong  d_ino;
    public long   d_off;
    public ushort d_reclen;
    public byte   d_type;
    [MarshalAs(UnmanagedType.ByValArray, SizeConst = 256)]
    public byte[] d_name;
}

sealed class SafeDirHandle : SafeHandle
{
    public SafeDirHandle() : base(nint.Zero, ownsHandle: true) { }
    public override bool IsInvalid => handle == nint.Zero;
    protected override bool ReleaseHandle()
    {
        PosixDir.CloseDir(handle);
        return true;
    }
}

static partial class PosixDir
{
    [LibraryImport("libc", EntryPoint = "opendir",
        StringMarshalling = StringMarshalling.Utf8)]
    public static partial SafeDirHandle OpenDir(string name);

    [LibraryImport("libc", EntryPoint = "readdir")]
    public static partial nint ReadDir(SafeDirHandle dir);

    [LibraryImport("libc", EntryPoint = "closedir")]
    public static partial int CloseDir(nint dir);

    public static IEnumerable<string> ListDirectory(string path)
    {
        using SafeDirHandle dir = OpenDir(path);
        if (dir.IsInvalid) yield break;

        nint entryPtr;
        while ((entryPtr = ReadDir(dir)) != nint.Zero)
        {
            var entry = Marshal.PtrToStructure<Dirent>(entryPtr);
            // d_name is null-terminated byte array
            int len = Array.IndexOf(entry.d_name, (byte)0);
            string name = System.Text.Encoding.UTF8.GetString(entry.d_name, 0, len < 0 ? 256 : len);
            if (name != "." && name != "..")
                yield return name;
        }
    }
}

foreach (var file in PosixDir.ListDirectory("/tmp"))
    Console.WriteLine(file);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary advantage of [LibraryImport] over [DllImport]?',
      options: [
        '[LibraryImport] supports more platforms than [DllImport]',
        '[LibraryImport] generates marshalling code at compile time via a source generator — making it AOT-compatible and avoiding runtime IL generation',
        '[LibraryImport] automatically handles platform differences in library names',
        '[LibraryImport] provides better error messages when a native function is not found',
      ],
      answer: 1,
      explanation: '[DllImport] generates marshalling IL at JIT time — a step that requires the JIT compiler, absent in Native AOT. [LibraryImport] uses a Roslyn source generator to emit the marshalling code as C# at compile time. The result is included in your binary as regular code, making it fully AOT-compatible.',
    },
    {
      q: 'Why must you use [MarshalAs(UnmanagedType.Bool)] when P/Invoking a Win32 BOOL return value?',
      options: [
        'C# bool is not a value type; it must be explicitly marshalled to primitive',
        'Win32 BOOL is a 32-bit int; without MarshalAs, the marshaller reads only 1 byte of the 4-byte return value — potentially misreading FALSE as TRUE',
        'The Win32 API uses a different calling convention that requires explicit bool marking',
        'MarshalAs(Bool) tells the JIT to use branchless boolean comparison for performance',
      ],
      answer: 1,
      explanation: 'Win32 BOOL is typedef int — 4 bytes. A successful return is non-zero (any 4-byte non-zero value). C# bool is 1 byte. Without [MarshalAs(UnmanagedType.Bool)], the marshaller reads only the first byte. A 4-byte value like 0x00000100 has a first byte of 0x00 — it would be misread as false even though the Win32 API returned a truthy value.',
    },
    {
      q: 'What is the purpose of SafeHandle in P/Invoke?',
      options: [
        'It provides type safety by wrapping nint handles with a strongly-typed wrapper',
        'It ensures native handles are released (via Dispose/finalisation) even when exceptions occur, preventing handle leaks',
        'It validates that the handle is not zero before passing to native code',
        'It enables thread-safe access to native handles shared across multiple calls',
      ],
      answer: 1,
      explanation: 'Native handles are OS resources — file handles, socket descriptors, window handles. Forgetting to call CloseHandle/close/fclose leaks them. SafeHandle integrates with the GC finaliser and IDisposable: if you dispose it normally, ReleaseHandle is called; if you forget, the finaliser calls it. This makes handle lifetime management as safe as managed memory.',
    },
    {
      q: 'A delegate callback passed to native code via GetFunctionPointerForDelegate gets collected by the GC. What causes this?',
      options: [
        'GetFunctionPointerForDelegate has a bug that invalidates delegates',
        'The native function pointer does not count as a reference in the managed heap — if no managed variable references the delegate, GC collects it, making the function pointer invalid',
        'Delegates cannot be used as P/Invoke callbacks — only static methods can',
        'The GC pins function pointers automatically; the collection must be due to another cause',
      ],
      answer: 1,
      explanation: 'The GC tracks managed object references. A native function pointer (a memory address) is not a managed reference — it does not prevent GC from collecting the delegate. Once collected, the native function pointer is invalid and calling it crashes. Keep the delegate alive with a field, static variable, or GCHandle.Alloc(delegate, GCHandleType.Normal).',
    },
    {
      q: 'What does [StructLayout(LayoutKind.Sequential)] do on a C# struct used in P/Invoke?',
      options: [
        'It prevents the struct from being moved by the GC during P/Invoke calls',
        'It tells the runtime to lay out the struct fields in declaration order without reordering — matching typical C struct memory layout',
        'It makes the struct read-only so native code cannot modify its fields',
        'It enables automatic marshalling of the struct without any MarshalAs attributes',
      ],
      answer: 1,
      explanation: 'By default, the CLR may reorder struct fields for performance. [StructLayout(LayoutKind.Sequential)] enforces field ordering in declaration order — the same as C compilers default to. Without this, a C# struct used in P/Invoke may have fields at different offsets than the native struct, causing incorrect data reads/writes.',
    },
    {
      q: 'How do you load a native library from a custom path at runtime instead of relying on the default OS search?',
      options: [
        'Pass the full path string to [DllImport] — it accepts absolute paths',
        'Use NativeLibrary.SetDllImportResolver() to intercept the load and call NativeLibrary.Load(fullPath) for specific library names',
        'Set the PATH or LD_LIBRARY_PATH environment variable before the app starts',
        'Use [DllImport(EntryPoint="full/path/to/lib")] with the absolute path as the entry point',
      ],
      answer: 1,
      explanation: 'NativeLibrary.SetDllImportResolver(Assembly.GetExecutingAssembly(), (name, asm, searchPath) => { if (name == "mylib") return NativeLibrary.Load("/opt/custom/libmylib.so"); return IntPtr.Zero; }) intercepts all DllImport loads for the assembly. Returning Zero falls back to the default search. This is the correct, cross-platform, AOT-safe approach to custom native library paths.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I call a C++ method (not a C function) from C#?',
      a: 'C++ methods use name mangling and calling conventions that vary by compiler, making direct P/Invoke impractical. The standard approach: create a C-exported wrapper in C++ that calls the C++ method with extern "C" linkage. Then P/Invoke the C wrapper. Alternatively, use C++/CLI on Windows (a managed C++ layer), or a COM interop layer if the C++ library exposes a COM interface. For .NET 5+, the COM source generator provides AOT-safe COM interop.',
    },
    {
      q: 'How do I debug P/Invoke failures — what does "EntryPointNotFoundException" mean?',
      a: 'EntryPointNotFoundException means the runtime found the library but could not find the function with the specified name. Check: (1) the EntryPoint name — case-sensitive on Linux; Win32 APIs often have A/W suffixes (CreateFileW vs CreateFileA); (2) the library is actually exporting the function — use dumpbin /exports (Windows) or nm -D (Linux); (3) calling convention — cdecl vs stdcall mismatch causes crashes, not this exception. SetLastError = true + Marshal.GetLastPInvokeError() helps diagnose native errors.',
    },
    {
      q: 'What is the difference between blittable and non-blittable types in P/Invoke?',
      a: 'Blittable types have identical layout in managed and unmanaged memory — primitives (int, long, float), structs of blittable types, 1D arrays of blittable types. They can be passed by pinning (no copy). Non-blittable types need marshalling — bool (1 vs 4 bytes), string (Unicode object vs char*/wchar_t*), arrays with non-blittable elements. Blittable types have lower P/Invoke overhead and are preferred. Check if your struct is blittable by trying Marshal.SizeOf<T>() — if it throws, the type is not blittable.',
    },
    {
      q: 'Can P/Invoke be used in Blazor WebAssembly?',
      a: 'Yes, but with significant limitations. Blazor WASM runs on the Mono WASM runtime, which supports a subset of P/Invoke. You can call JavaScript functions via [JSImport] (preferred, .NET 7+) or call WASM functions exported from other WASM modules via [DllImport]. The standard Win32/POSIX APIs are not available in the browser sandbox. [JSImport]/[JSExport] with source generation is the AOT-safe way to interop with JavaScript from Blazor WASM.',
    },
    {
      q: 'What is COM interop and how does it differ from P/Invoke?',
      a: 'COM (Component Object Model) is a Windows binary interface standard used by Office, Shell, WMI, and many Windows APIs. COM interop wraps COM interfaces as C# classes — the CLR manages vtable dispatching and IUnknown reference counting. You interact with COM objects through C# interface declarations marked [ComImport] and [Guid]. P/Invoke calls plain C-exported functions; COM interop calls methods on COM objects through their interface vtable. The .NET 7+ COM source generator ([GeneratedComInterface]) provides AOT-safe COM interop without runtime IL generation.',
    },
    {
      q: 'How do calling conventions (cdecl, stdcall, etc.) affect P/Invoke and when do you need to specify them?',
      a: 'The calling convention determines who cleans up the stack after a native call. Win32 APIs use stdcall (the caller\'s convention); most C libraries use cdecl. On 64-bit Windows and Linux x64, there is only one system calling convention so it rarely matters. On 32-bit Windows, a mismatch causes a stack imbalance — wrong number of bytes popped — often manifesting as a BadImageFormatException or AccessViolationException. Specify with [DllImport(CallingConvention = CallingConvention.Cdecl)] when using 32-bit C libraries. [LibraryImport] also supports [UnmanagedCallConv] for source-generated interop.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'P/Invoke calls native shared library functions from C#. Use <code>[LibraryImport]</code> (source-generated, AOT-safe) over <code>[DllImport]</code>, wrap handles in <code>SafeHandle</code>, annotate booleans with <code>[MarshalAs(UnmanagedType.Bool)]</code>, and keep callback delegates alive in fields.',
    mustKnow: [
      '<code>[LibraryImport]</code> + <code>partial</code> method — AOT-safe P/Invoke; replaces <code>[DllImport]</code>',
      'Win32 BOOL ≠ C# bool: use <code>[return: MarshalAs(UnmanagedType.Bool)]</code> to avoid misreads',
      '<code>SafeHandle</code> — wraps native handles; <code>ReleaseHandle()</code> called on Dispose/GC; prevents leaks',
      '<code>[StructLayout(LayoutKind.Sequential)]</code> — match C struct field order; use <code>Pack</code> for alignment',
      'Callback delegates must be kept alive in a field — GC does not see native function pointers',
      '<code>NativeLibrary.SetDllImportResolver()</code> — cross-platform library name mapping at runtime',
    ],
    interviewFocus: [
      '<strong>[DllImport] vs [LibraryImport]?</strong> — DllImport = JIT marshalling, not AOT; LibraryImport = source-generated, AOT-safe',
      '<strong>SafeHandle purpose?</strong> — guaranteed handle release even on exceptions; integrates with GC finaliser',
      '<strong>Win32 bool pitfall?</strong> — BOOL is 4 bytes; without MarshalAs, only 1 byte read; silent misreads',
      '<strong>Callback GC issue?</strong> — native pointer to delegate not a managed reference; keep delegate in a field',
    ],
  };
}
