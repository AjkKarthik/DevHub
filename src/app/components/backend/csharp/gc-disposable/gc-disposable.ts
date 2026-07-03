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
  selector: 'app-csharp-gc-disposable',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './gc-disposable.html',
  styleUrl: './gc-disposable.scss',
})
export class CsharpGcDisposable {

  quickRef: QuickRefItem[] = [
    { name: 'IDisposable',           type: 'interface', desc: 'Defines a single Dispose() method. Implement to release unmanaged resources (file handles, DB connections, sockets) deterministically.', since: '.NET 1' },
    { name: 'IAsyncDisposable',      type: 'interface', desc: 'Async counterpart to IDisposable. Implement DisposeAsync() when cleanup involves async work (flushing streams, closing network connections).', since: '.NET Core 3' },
    { name: 'using statement',       type: 'keyword',   desc: 'Calls Dispose() on the target when the block exits — even if an exception is thrown. Classic C# resource management.', since: 'C# 1' },
    { name: 'using declaration',     type: 'keyword',   desc: 'C# 8+ syntax: "using var x = ...". Dispose() is called at the end of the enclosing scope. Less nesting than using {}.', since: 'C# 8' },
    { name: 'await using',           type: 'keyword',   desc: 'Calls DisposeAsync() asynchronously when the scope exits. Use with IAsyncDisposable resources.', since: '.NET Core 3' },
    { name: 'GC.SuppressFinalize',   type: 'method',    desc: 'Tells the GC not to call the finalizer for this object — call it inside Dispose() to avoid double cleanup.', since: '.NET 1' },
    { name: 'GC.Collect',            type: 'method',    desc: 'Forces a garbage collection. Avoid in production — it disrupts GC tuning. Useful in tests and benchmarks.', since: '.NET 1' },
    { name: 'WeakReference<T>',      type: 'class',     desc: 'Holds a reference to an object without preventing it from being collected. Useful for caches.', since: '.NET 4' },
    { name: 'Gen 0 / 1 / 2',         type: 'type',      desc: 'GC generations. Short-lived objects live in Gen 0, collected most frequently. Long-lived objects promote to Gen 2.', since: '.NET 1' },
    { name: 'Large Object Heap',     type: 'type',      desc: 'Objects >= 85,000 bytes are allocated here. The LOH is collected only during Gen 2 GCs and is not compacted by default.', since: '.NET 1' },
    { name: 'GC.AddMemoryPressure',  type: 'method',    desc: 'Informs the GC about large unmanaged allocations it cannot see — triggers more frequent GC runs.', since: '.NET 2' },
    { name: 'ObjectDisposedException', type: 'class',   desc: 'Throw this from public methods when _disposed is true. Use ObjectDisposedException.ThrowIf(_disposed, this) (.NET 7+).', since: '.NET 1' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How the .NET GC works',
      points: [
        'The .NET runtime uses a generational, tracing garbage collector. It periodically traces all object references from roots (stack variables, static fields, GC handles) to identify which objects are reachable. Unreachable objects\' memory is reclaimed.',
        'Objects are divided into three generations. Gen 0 contains newly allocated, short-lived objects and is collected most frequently (every few milliseconds under load). Gen 1 is a buffer between Gen 0 and Gen 2. Gen 2 contains long-lived objects and is collected infrequently.',
        'When an object survives a GC collection of its generation, it is promoted to the next. Temporary variables live in Gen 0 and are collected quickly. Long-lived caches, singletons, and static data promote to Gen 2 and are rarely collected.',
        'Objects 85,000 bytes or larger bypass Gen 0/1 entirely and go straight to the Large Object Heap (LOH). The LOH participates only in Gen 2 collections and is not compacted by default — repeatedly allocating and freeing large arrays fragments it. Use <code>ArrayPool&lt;T&gt;</code> to avoid LOH pressure.',
        'The GC is triggered automatically based on memory pressure — you rarely need to intervene. The default settings work well for most applications. Tuning becomes relevant only at high throughput (millions of allocations per second) or very low latency requirements.',
      ],
    },
    {
      heading: 'Managed vs unmanaged resources',
      points: [
        'The GC manages memory for all .NET objects automatically. You never need to free managed memory manually — the collector handles it when objects become unreachable.',
        'Unmanaged resources — file handles, database connections, network sockets, Win32 handles, native memory allocated via P/Invoke or <code>Marshal.AllocHGlobal</code> — are invisible to the GC. If you forget to release them, they leak until the process exits or the OS forcibly reclaims them.',
        'The <code>IDisposable</code> interface provides a deterministic hook for releasing unmanaged resources at a known point in time, regardless of when the GC happens to run. This is the core purpose of the dispose pattern.',
        'The rule: <strong>every class that wraps an unmanaged resource — or wraps another <code>IDisposable</code> that holds one — should implement <code>IDisposable</code></strong>. Callers must use a <code>using</code> block to guarantee timely cleanup.',
        'Managed wrappers around unmanaged resources (e.g. <code>SqlConnection</code>, <code>FileStream</code>, <code>HttpClient</code>) already implement <code>IDisposable</code>. Your responsibility is to call <code>Dispose()</code> on them — the <code>using</code> keyword does this automatically.',
      ],
    },
    {
      heading: 'The IDisposable pattern',
      points: [
        'For simple classes that only wrap other <code>IDisposable</code> fields, implement <code>Dispose()</code> directly: set a <code>_disposed</code> guard, call <code>Dispose()</code> on each field, and optionally call <code>GC.SuppressFinalize(this)</code>.',
        'The full dispose pattern uses a <code>protected virtual void Dispose(bool disposing)</code> overload. When <code>disposing == true</code>, the call came from user code via <code>Dispose()</code> — safe to release both managed and unmanaged resources. When false, the call came from the finalizer thread — only release unmanaged resources (managed objects may already be collected).',
        'Call <code>GC.SuppressFinalize(this)</code> inside <code>Dispose()</code>. This removes the object from the finalization queue, avoiding a redundant finalizer call and the associated extra GC cycle.',
        'A finalizer (<code>~ClassName()</code>) is your last-resort safety net: if the caller forgot <code>using</code>, the finalizer releases the unmanaged resource during GC. Objects with finalizers survive one extra GC cycle — minimize their use. Only add a finalizer if you directly own an unmanaged handle.',
        'Check <code>_disposed</code> at the start of every public method and throw <code>ObjectDisposedException</code> on subsequent calls. .NET 7+ provides the convenience overload: <code>ObjectDisposedException.ThrowIf(_disposed, this)</code>.',
      ],
    },
    {
      heading: 'IAsyncDisposable and await using',
      points: [
        '<code>IAsyncDisposable</code> (introduced in .NET Core 3.0) is for resources whose cleanup is inherently async — flushing a network buffer, closing a database connection gracefully, draining a message queue, or cancelling background tasks.',
        'Use <code>await using var x = new AsyncResource()</code> to call <code>DisposeAsync()</code> when the scope exits. The thread is released during the async cleanup, unlike <code>using</code> (sync) which blocks.',
        'If your class has both sync and async consumers, implement <em>both</em> <code>IDisposable</code> and <code>IAsyncDisposable</code>. The sync path can call <code>DisposeAsync().AsTask().GetAwaiter().GetResult()</code> as a blocking fallback, or perform a simpler sync cleanup separately.',
        'ASP.NET Core\'s DI container natively handles <code>IAsyncDisposable</code> — scoped and transient services that implement it are async-disposed at the end of each request scope automatically.',
        'Return <code>ValueTask</code> from <code>DisposeAsync()</code> (not <code>Task</code>) to avoid heap allocations on the synchronous fast path. If cleanup can complete synchronously (e.g. already disposed), return <code>ValueTask.CompletedTask</code>.',
      ],
    },
    {
      heading: 'Finalizers and memory pressure',
      points: [
        'Finalizers (<code>~ClassName()</code>) are called by the GC finalizer thread, not by user code. The finalizer thread processes the f-reachable queue — objects discovered to be unreachable but that still have a finalizer to run.',
        'Never touch other managed objects in a finalizer. Because finalization order is non-deterministic, the managed objects your finalizer tries to access may already have been collected. Only release raw unmanaged handles (IntPtr, SafeHandle) in finalizers.',
        '<code>GC.AddMemoryPressure(bytes)</code> informs the GC about large native allocations it cannot see. Without this hint, the GC may not collect frequently enough because it thinks there is plenty of memory, even though native memory is nearly exhausted. Always pair with <code>GC.RemoveMemoryPressure</code> in <code>Dispose()</code>.',
        'Prefer <code>SafeHandle</code> (or its subclasses like <code>SafeFileHandle</code>) over raw <code>IntPtr</code> for wrapping OS handles. <code>SafeHandle</code> is itself finalizable and release-aware, handles the dispose pattern correctly, and is immune to handle recycling attacks.',
        'Objects with finalizers impose overhead: they are tracked in the finalization queue, survive one extra GC cycle, and their finalizer runs on a background thread. For every type where you add a finalizer, consider whether <code>SafeHandle</code> or a custom finalizer is truly needed — eliminate unnecessary finalizers.',
      ],
    },
    {
      heading: 'GC modes and tuning',
      points: [
        'The GC runs in two modes: <strong>Workstation GC</strong> (default for client apps — smaller heaps, more frequent GCs, lower latency) and <strong>Server GC</strong> (default for ASP.NET Core — one heap per CPU core, larger heaps, higher throughput). Set via <code>&lt;GarbageCollectionAdaptationMode&gt;</code> in the project file.',
        'Within each mode, GC can be <strong>Concurrent</strong> (most GC work happens on background threads while the app runs — default) or <strong>Non-Concurrent</strong> (GC stops all application threads). Concurrent minimizes pauses at the cost of slightly higher CPU usage.',
        'LOH compaction is disabled by default because it requires a full stop-the-world pause. Enable it once with <code>GCSettings.LargeObjectHeapCompactionMode = GCLargeObjectHeapCompactionMode.CompactOnce;</code> before triggering <code>GC.Collect</code> — use only when LOH fragmentation is confirmed via diagnostics.',
        '<code>GCMemoryInfo info = GC.GetGCMemoryInfo();</code> reports heap size, fragmented bytes, memory load, and pause durations. Integrate this with metrics in production to detect GC pressure before it impacts latency.',
        'Environment variables for tuning: <code>DOTNET_GCConserveMemory=5</code> (0–9 scale, higher = more aggressive collection for lower memory footprint), <code>DOTNET_GCHeapHardLimit</code> (cap total GC heap size — useful in containers). Profile with <code>dotnet-counters monitor --counters System.Runtime</code> before tuning.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'GC Generations',
      language: 'csharp',
      code: `// ── GC generation overview ───────────────────────────────────────────────
// Gen 0: short-lived objects (temporaries, LINQ results, method locals)
// Gen 1: buffer — survived one Gen 0 collection
// Gen 2: long-lived objects (caches, singletons, static data)
// LOH:   objects >= 85,000 bytes — only Gen 2 GC; not compacted by default

// ── Inspecting the GC ─────────────────────────────────────────────────────
Console.WriteLine($"Gen 0 collections: {GC.CollectionCount(0)}");
Console.WriteLine($"Gen 1 collections: {GC.CollectionCount(1)}");
Console.WriteLine($"Gen 2 collections: {GC.CollectionCount(2)}");
Console.WriteLine($"Total memory (bytes): {GC.GetTotalMemory(forceFullCollection: false)}");

// Get detailed memory info (.NET 5+)
GCMemoryInfo info = GC.GetGCMemoryInfo();
Console.WriteLine($"Heap size:  {info.HeapSizeBytes:N0} bytes");
Console.WriteLine($"Fragmented: {info.FragmentedBytes:N0} bytes");

// ── Large Object Heap — avoid large transient arrays ──────────────────────
// BAD: allocates a new 1 MB array (goes to LOH) on every call → LOH fragmentation
static byte[] BadPattern() => new byte[1_024 * 1_024];

// GOOD: rent from the pool — zero LOH pressure
static void GoodPattern()
{
    byte[] buffer = System.Buffers.ArrayPool<byte>.Shared.Rent(1_024 * 1_024);
    try { /* use buffer... */ }
    finally { System.Buffers.ArrayPool<byte>.Shared.Return(buffer); }
}

// ── WeakReference — cache without preventing collection ──────────────────
var cache = new Dictionary<string, WeakReference<byte[]>>();

void AddToCache(string key, byte[] data)
    => cache[key] = new WeakReference<byte[]>(data);

byte[]? GetFromCache(string key)
{
    if (cache.TryGetValue(key, out var weak) && weak.TryGetTarget(out var data))
        return data;              // still alive
    cache.Remove(key);            // collected — clean up stale entry
    return null;
}

// ── GC.Collect — only for tests/benchmarks ────────────────────────────────
// Before a benchmark: ensure a clean baseline
GC.Collect(2, GCCollectionMode.Forced, blocking: true);
GC.WaitForPendingFinalizers();   // flush finalizers
GC.Collect(2, GCCollectionMode.Forced, blocking: true); // collect finalizer-released objects
Console.WriteLine($"Memory after forced GC: {GC.GetTotalMemory(false):N0}");`,
    },
    {
      label: 'IDisposable Pattern',
      language: 'csharp',
      code: `// ── Simple disposal — class only wraps managed IDisposable fields ─────────
public class DatabaseSession : IDisposable
{
    private SqlConnection? _connection;
    private bool _disposed;

    public DatabaseSession(string connectionString)
    {
        _connection = new SqlConnection(connectionString);
        _connection.Open();
    }

    public void ExecuteQuery(string sql)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);   // .NET 7+
        // ... use _connection
    }

    public void Dispose()
    {
        if (_disposed) return;
        _connection?.Dispose();
        _connection = null;
        _disposed = true;
        // GC.SuppressFinalize not needed — no finalizer here
    }
}

// ── Full pattern — class owns unmanaged resources AND managed IDisposable ──
public class NativeFileWrapper : IDisposable
{
    private IntPtr _handle;         // unmanaged OS handle
    private FileStream? _stream;    // managed resource
    private bool _disposed;

    public NativeFileWrapper(string path)
    {
        _stream = File.OpenRead(path);
        _handle = GetNativeHandle(_stream); // hypothetical P/Invoke
    }

    public void Read(byte[] buffer)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        _stream!.Read(buffer, 0, buffer.Length);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;

        if (disposing)
        {
            // Safe to dispose managed resources — called from user code
            _stream?.Dispose();
            _stream = null;
        }

        // Always release unmanaged resources — safe from both user code and finalizer
        if (_handle != IntPtr.Zero)
        {
            CloseNativeHandle(_handle);
            _handle = IntPtr.Zero;
        }

        _disposed = true;
    }

    // Finalizer — safety net if caller forgets Dispose()
    ~NativeFileWrapper() => Dispose(disposing: false);

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this); // take off finalization queue
    }

    private static IntPtr GetNativeHandle(FileStream s) => IntPtr.Zero;
    private static void CloseNativeHandle(IntPtr h) { }
}

// ── Caller: always use 'using' ────────────────────────────────────────────
using var session = new DatabaseSession("Server=.;Database=App;Trusted_Connection=True");
session.ExecuteQuery("SELECT 1");
// Dispose() called automatically here — even if ExecuteQuery throws`,
    },
    {
      label: 'using & await using',
      language: 'csharp',
      code: `// ── Classic using statement (C# 1+) ──────────────────────────────────────
using (var reader = new StreamReader("data.txt"))
{
    string? line;
    while ((line = reader.ReadLine()) != null)
        Console.WriteLine(line);
} // reader.Dispose() called here — always

// ── using declaration (C# 8+) — less nesting ─────────────────────────────
// Dispose() called at end of enclosing scope, in reverse declaration order
using var writer = new StreamWriter("output.txt");
writer.WriteLine("Hello");
// writer disposed at end of method

// Multiple using declarations — cleaner than 3 nested using blocks
string connStr = "Server=.;Trusted_Connection=True;";
using var conn = new SqlConnection(connStr);
using var cmd  = new SqlCommand("SELECT TOP 1 1 FROM sys.objects", conn);
conn.Open();
using var dr   = cmd.ExecuteReader();
if (dr.Read()) Console.WriteLine(dr[0]);
// Disposed in order: dr, cmd, conn (reverse declaration)

// ── await using — for IAsyncDisposable ────────────────────────────────────
public class AsyncDbSession : IAsyncDisposable
{
    private readonly NpgsqlConnection _conn;
    private bool _disposed;

    public AsyncDbSession(string cs) => _conn = new NpgsqlConnection(cs);

    public async Task OpenAsync(CancellationToken ct = default)
        => await _conn.OpenAsync(ct);

    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;
        await _conn.CloseAsync();      // async flush and protocol close
        _conn.Dispose();
        _disposed = true;
        GC.SuppressFinalize(this);
    }
}

await using var session = new AsyncDbSession(connectionString);
await session.OpenAsync(ct);
// DisposeAsync() called asynchronously when scope exits

// ── Implementing both sync and async ──────────────────────────────────────
public class DualDispose : IDisposable, IAsyncDisposable
{
    private readonly Stream _stream;
    public DualDispose(Stream stream) => _stream = stream;

    public void Dispose()
    {
        _stream.Dispose();
        GC.SuppressFinalize(this);
    }

    public async ValueTask DisposeAsync()
    {
        await _stream.DisposeAsync();  // truly async flush + close
        GC.SuppressFinalize(this);
    }
}`,
    },
    {
      label: 'Finalizers & Pressure',
      language: 'csharp',
      code: `using System.Runtime.InteropServices;

// ── Finalizer as safety net — only if you own native memory ──────────────
public class UnmanagedBuffer : IDisposable
{
    private nint _ptr;
    private readonly int _size;
    private bool _disposed;

    public UnmanagedBuffer(int size)
    {
        _size = size;
        _ptr  = Marshal.AllocHGlobal(size);  // native heap allocation
    }

    // Finalizer — runs if Dispose() was never called (safety net)
    // NEVER touch managed objects here — they may already be collected
    ~UnmanagedBuffer() => Dispose(disposing: false);

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        // Only release UNMANAGED resources here — safe from both paths
        if (_ptr != 0)
        {
            Marshal.FreeHGlobal(_ptr);    // release native heap
            _ptr = 0;
        }
        _disposed = true;
    }

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);       // skip finalizer — already cleaned up
    }
}

// ── GC.AddMemoryPressure — hint about hidden native allocations ────────────
public class LargeNativeImage : IDisposable
{
    private nint _pixels;
    private readonly long _bytes;

    public LargeNativeImage(int width, int height)
    {
        _bytes  = (long)width * height * 4;          // RGBA
        _pixels = Marshal.AllocHGlobal((nint)_bytes);
        GC.AddMemoryPressure(_bytes);   // tell GC: this much native memory is in use
    }

    public void Dispose()
    {
        if (_pixels != 0)
        {
            Marshal.FreeHGlobal(_pixels);
            GC.RemoveMemoryPressure(_bytes);  // ALWAYS pair with AddMemoryPressure
            _pixels = 0;
        }
        GC.SuppressFinalize(this);
    }
}

// ── SafeHandle — prefer this over raw IntPtr ──────────────────────────────
// SafeHandle is finalizable, handles the dispose pattern, and is immune to
// handle recycling attacks (another thread reuses the same IntPtr value)
public sealed class SafeNativeHandle : SafeHandle
{
    public SafeNativeHandle() : base(IntPtr.Zero, ownsHandle: true) { }
    public override bool IsInvalid => handle == IntPtr.Zero;

    protected override bool ReleaseHandle()
    {
        CloseMyNativeHandle(handle);  // P/Invoke
        return true;
    }

    private static void CloseMyNativeHandle(nint h) { /* P/Invoke */ }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Creating HttpClient per request — socket exhaustion',
      wrong: `// BAD: new HttpClient on every call — disposes sockets immediately
// Each Dispose() puts the socket in TIME_WAIT for ~4 minutes
// Under load: 100 requests/sec = ~24,000 sockets in TIME_WAIT
public async Task<string> GetDataAsync(string url)
{
    using var client = new HttpClient();   // new socket every call!
    return await client.GetStringAsync(url);
}`,
      right: `// Option 1: static singleton (simple apps)
public class ApiService
{
    private static readonly HttpClient _client = new();  // reused across calls

    public async Task<string> GetDataAsync(string url)
        => await _client.GetStringAsync(url);
}

// Option 2: IHttpClientFactory (ASP.NET Core — recommended)
// Manages connection pooling, DNS refresh, and disposal automatically
builder.Services.AddHttpClient<ApiService>();

public class ApiService(HttpClient client)   // injected by DI
{
    public Task<string> GetDataAsync(string url) => client.GetStringAsync(url);
}`,
      explanation: 'HttpClient is designed to be long-lived and reused across many requests. Disposing it immediately closes the underlying TCP socket but the socket enters a TIME_WAIT state for 2-4 minutes (OS-enforced). Under load, this exhausts the OS socket pool and new connections start failing. Either use a static singleton or IHttpClientFactory, which manages pooling and DNS refresh automatically.',
    },
    {
      title: 'Touching managed objects in a finalizer — non-deterministic order',
      wrong: `public class FileLogger : IDisposable
{
    private StreamWriter? _writer;    // managed IDisposable
    private bool _disposed;

    // DANGER: finalizer touches a managed object
    ~FileLogger()
    {
        _writer?.Flush();   // _writer may already be collected!
        _writer?.Dispose(); // undefined behavior — _writer might be gone
    }

    public void Dispose()
    {
        if (_disposed) return;
        _writer?.Dispose();
        _disposed = true;
    }
}`,
      right: `public class FileLogger : IDisposable
{
    private StreamWriter? _writer;
    private bool _disposed;

    // Finalizer should ONLY release raw unmanaged resources (IntPtr, SafeHandle)
    // If you have no unmanaged resources, don't add a finalizer at all
    ~FileLogger()
    {
        // Don't touch _writer here — it may be gone
        // If you had a raw IntPtr handle, release it here
    }

    public void Dispose()
    {
        if (_disposed) return;
        _writer?.Dispose();   // safe — called from user code
        _writer = null;
        _disposed = true;
        GC.SuppressFinalize(this);
    }
}`,
      explanation: 'The GC\'s finalization order is non-deterministic. When your object becomes unreachable, other managed objects it references may also be unreachable and could be collected before your finalizer runs. Accessing _writer in a finalizer can throw NullReferenceException or produce undefined behavior. Finalizers should ONLY touch raw unmanaged handles (IntPtr, SafeHandle). If you have no unmanaged resources, skip the finalizer entirely.',
    },
    {
      title: 'Forgetting to dispose database connections — connection pool exhaustion',
      wrong: `public async Task<List<User>> GetUsersAsync()
{
    // BAD: connection not wrapped in using — never returned to pool
    var conn = new SqlConnection(connectionString);
    await conn.OpenAsync();
    var cmd = new SqlCommand("SELECT * FROM Users", conn);
    var reader = await cmd.ExecuteReaderAsync();

    var users = new List<User>();
    while (await reader.ReadAsync())
        users.Add(new User(reader.GetString(0)));
    return users;
    // conn, cmd, reader never disposed — connection leaks!
}`,
      right: `public async Task<List<User>> GetUsersAsync()
{
    await using var conn = new SqlConnection(connectionString);
    await conn.OpenAsync();

    await using var cmd = new SqlCommand("SELECT * FROM Users", conn);
    await using var reader = await cmd.ExecuteReaderAsync();

    var users = new List<User>();
    while (await reader.ReadAsync())
        users.Add(new User(reader.GetString(0)));
    return users;
    // reader, cmd, conn all disposed in reverse order
}`,
      explanation: 'SQL connections come from a connection pool. When you dispose a SqlConnection, it goes back to the pool for reuse. When you forget to dispose, the connection is held open until the GC finalizer runs — which may be seconds or minutes later. Under load, all pool connections are held, new requests wait, and eventually you get "Timeout expired. The timeout period elapsed prior to obtaining a connection from the pool."',
    },
    {
      title: 'Not calling GC.SuppressFinalize in Dispose — double cleanup overhead',
      wrong: `public class ManagedResource : IDisposable
{
    private bool _disposed;

    ~ManagedResource()
    {
        Dispose(disposing: false);
    }

    public void Dispose()
    {
        Dispose(disposing: true);
        // Missing: GC.SuppressFinalize(this)
        // The finalizer will STILL run on the next GC cycle — wasted work
    }

    protected virtual void Dispose(bool disposing) { /* cleanup */ }
}`,
      right: `public class ManagedResource : IDisposable
{
    private bool _disposed;

    ~ManagedResource() => Dispose(disposing: false);

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);  // remove from finalization queue
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        // ... cleanup
        _disposed = true;
    }
}`,
      explanation: 'Objects with a finalizer are placed on the finalization queue and survive one extra GC cycle so the finalizer can run. If Dispose() already did all the cleanup, the finalizer call is wasted work — and the object\'s memory lives one GC cycle longer than necessary. GC.SuppressFinalize removes the object from the finalization queue so it can be collected immediately after Dispose() is called.',
    },
    {
      title: 'Not checking _disposed in public methods — use after disposal goes undetected',
      wrong: `public class DataReader : IDisposable
{
    private Stream? _stream;
    private bool _disposed;

    public int Read(byte[] buffer)
    {
        // No disposed check — if caller calls this after Dispose():
        // _stream is null → NullReferenceException with confusing stack trace
        return _stream!.Read(buffer, 0, buffer.Length);
    }

    public void Dispose()
    {
        _stream?.Dispose();
        _stream = null;
        _disposed = true;
    }
}`,
      right: `public class DataReader : IDisposable
{
    private Stream? _stream;
    private bool _disposed;

    public int Read(byte[] buffer)
    {
        // Throw ObjectDisposedException — clear, diagnosable error
        ObjectDisposedException.ThrowIf(_disposed, this);   // .NET 7+
        return _stream!.Read(buffer, 0, buffer.Length);
    }

    public void Dispose()
    {
        if (_disposed) return;
        _stream?.Dispose();
        _stream = null;
        _disposed = true;
        GC.SuppressFinalize(this);
    }
}`,
      explanation: 'When a caller uses a disposed object, NullReferenceException or InvalidOperationException from the underlying resource gives a confusing stack trace with no indication that the object was disposed. ObjectDisposedException immediately tells the caller (and any error logging) exactly what went wrong. The .NET 7+ ThrowIf helper makes this a one-liner.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the purpose of calling <code>GC.SuppressFinalize(this)</code> inside <code>Dispose()</code>?',
      options: [
        'It prevents the object from being collected by the GC immediately',
        'It removes the object from the finalization queue so the finalizer is not called redundantly after Dispose() has already cleaned up',
        'It frees all managed memory held by the object',
        'It is required by the IDisposable interface contract',
      ],
      answer: 1,
      explanation: 'Objects with a finalizer are tracked in the finalization queue and survive an extra GC cycle. If <code>Dispose()</code> already did all the cleanup, calling the finalizer later is wasted work — and delays memory reclamation. <code>GC.SuppressFinalize(this)</code> removes the object from the queue so the GC can collect it immediately after <code>Dispose()</code> runs.',
    },
    {
      q: 'What is the Large Object Heap (LOH) and why does it matter for performance?',
      options: [
        'It is a separate heap for static and singleton objects',
        'It stores all objects created in async methods',
        'It holds objects >= 85,000 bytes; it is only collected during Gen 2 GCs and is not compacted by default, leading to fragmentation',
        'It is the heap used by finalizers and is always compacted',
      ],
      answer: 2,
      explanation: 'Objects >= 85,000 bytes bypass Gen 0/1 and go straight to the LOH. Because the LOH is only collected during Gen 2 (infrequent) GCs and is not compacted by default, repeatedly allocating and freeing large arrays fragments it — free space exists but in unusable scattered holes. Use <code>ArrayPool&lt;T&gt;</code> to rent and return large buffers instead of allocating new ones.',
    },
    {
      q: 'When should you use <code>IAsyncDisposable</code> instead of (or in addition to) <code>IDisposable</code>?',
      options: [
        'When the object is used in an async method',
        'When the cleanup work itself is async — for example, flushing a buffer over the network or closing a database connection gracefully',
        'IAsyncDisposable replaces IDisposable entirely in .NET 6+',
        'When the object is very large and cleanup takes a long time',
      ],
      answer: 1,
      explanation: 'Use <code>IAsyncDisposable</code> when the disposal logic involves inherently async operations — closing a TCP connection, draining a queue, flushing an async writer, or cancelling background tasks. Calling <code>DisposeAsync()</code> and awaiting it keeps the cleanup non-blocking. For maximum compatibility, implement both <code>IDisposable</code> and <code>IAsyncDisposable</code> when callers may be either sync or async.',
    },
    {
      q: 'An object has a finalizer but <code>Dispose()</code> is never called. What is the performance impact?',
      options: [
        'No impact — finalizers are free',
        'The object survives one extra GC cycle (placed on the f-reachable queue), the finalizer runs on a dedicated thread, and then the memory is freed on the next GC cycle',
        'The finalizer runs synchronously on the calling thread when the object goes out of scope',
        'The GC skips collecting the object entirely until the process exits',
      ],
      answer: 1,
      explanation: 'Finalizable objects are discovered during GC, placed on the f-reachable queue, and kept alive. A background finalizer thread processes the queue, running each finalizer. Only then, on the <em>next</em> GC cycle, is the memory reclaimed. This means objects with finalizers live two GC cycles longer, involve thread context switches, and add load to the finalizer thread — a real cost at scale.',
    },
    {
      q: 'What exception should you throw when a public method is called after <code>Dispose()</code> has been invoked?',
      options: [
        'InvalidOperationException — the object is in an invalid state',
        'NullReferenceException — the underlying resource is null',
        'ObjectDisposedException — specifically designed to signal use-after-dispose',
        'ArgumentException — the caller passed an invalid argument',
      ],
      answer: 2,
      explanation: '<code>ObjectDisposedException</code> is the standard signal that the object was disposed before use. It clearly communicates the problem (use-after-dispose) in logs and stack traces, unlike <code>NullReferenceException</code> which is ambiguous. Check <code>_disposed</code> at the start of every public method and throw using <code>ObjectDisposedException.ThrowIf(_disposed, this)</code> (.NET 7+).',
    },
    {
      q: 'Why is it dangerous to access managed objects inside a finalizer?',
      options: [
        'Finalizers run on a different thread and managed objects are not thread-safe',
        'The GC may have already collected the managed objects before your finalizer runs — access would produce undefined behavior',
        'Managed objects cannot be accessed from IntPtr values',
        'Finalizers run before the object is unreachable — managed objects are still alive',
      ],
      answer: 1,
      explanation: 'Finalization order is non-deterministic. When your object becomes unreachable, other managed objects it references may also be unreachable and could be collected — or already be in the middle of their own finalization — before your finalizer runs. Accessing a collected managed object causes <code>NullReferenceException</code> or worse. Finalizers should only touch raw unmanaged handles (<code>IntPtr</code>, <code>SafeHandle</code>).',
    },
    {
      q: 'How does a <code>using declaration</code> (C# 8+) differ from a <code>using statement</code>?',
      options: [
        'They are identical in behavior — only the syntax differs',
        'A using declaration calls Dispose() at end of the enclosing scope (method/block); a using statement calls Dispose() at its own closing brace',
        'A using declaration does not call Dispose() if an exception is thrown',
        'A using statement requires an explicit Dispose() call at the end',
      ],
      answer: 1,
      explanation: '<code>using (var x = ...) { }</code> disposes at the explicit closing brace — giving you fine-grained control of the disposal point. <code>using var x = ...;</code> disposes at the end of the <em>enclosing</em> scope (method, lambda, or block), reducing nesting for multiple resources. Both call <code>Dispose()</code> even when an exception is thrown. When you need the resource disposed before the method ends, use the statement form.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Do I need to implement IDisposable if my class only has managed fields?',
      a: 'It depends. If your managed fields are themselves <code>IDisposable</code> (e.g. a <code>DbConnection</code>, <code>HttpClient</code>, or <code>Stream</code>), then yes — implement <code>IDisposable</code> and call <code>Dispose()</code> on each of them. The GC will eventually collect them, but their unmanaged resources (connection handles, sockets) will leak until that happens — potentially exhausting the connection pool or file handle limit.<br><br>If all your fields are plain managed objects that do <em>not</em> hold unmanaged resources (strings, lists, POCOs), you do not need <code>IDisposable</code> — the GC handles them automatically.<br><br>Rule of thumb: if you call <code>new</code> on anything that implements <code>IDisposable</code>, your class probably should too.',
    },
    {
      q: 'What happens if I call Dispose() more than once?',
      a: 'The <code>IDisposable</code> contract requires that calling <code>Dispose()</code> multiple times is safe — subsequent calls must be a no-op. This is enforced with a <code>_disposed</code> boolean guard:<br><br><code>public void Dispose() { if (_disposed) return; /* cleanup */ _disposed = true; }</code><br><br>Most built-in .NET types (streams, connections) follow this contract. In your own code, always add the guard — a double-dispose happens naturally when a class is wrapped by another disposable that also disposes it.',
    },
    {
      q: 'When should I actually call GC.Collect?',
      a: 'Almost never in production code. The GC is highly tuned — calling <code>GC.Collect</code> disrupts its generational heuristics and forces a Gen 2 collection at an inopportune time, causing significant pauses.<br><br><strong>Legitimate uses:</strong><ul><li><strong>Tests and benchmarks</strong> — force a clean baseline before measuring: <code>GC.Collect(2); GC.WaitForPendingFinalizers(); GC.Collect(2);</code></li><li><strong>After a known large one-time allocation</strong> — e.g. loading a huge dataset at startup that you immediately discard</li><li><strong>Memory diagnostics</strong> — to measure how much memory is genuinely live vs. waiting to be collected</li></ul>',
    },
    {
      q: 'A method has an early `return` statement partway through, followed later by more code that comes after a `using var resource = ...;` declaration higher up. Does the resource get disposed before that early return actually exits the method?',
      a: 'Yes — a using declaration\'s disposal point is the end of the ENCLOSING SCOPE, and the compiler ensures Dispose() runs before control actually leaves that scope through any exit path: a normal fall-through to the end of the method, an early return, an exception propagating out, or a break/continue out of an enclosing loop. The compiler effectively wraps the rest of the method body (from the declaration point onward) in a try/finally with Dispose() in the finally block, so it does not matter how many different exit points exist after the declaration — every one of them triggers disposal on the way out, exactly as a using STATEMENT would at its closing brace, just with the compiler choosing the enclosing scope as the "closing brace" instead of an explicit block.',
    },
    {
      q: 'Why is creating a new HttpClient for each HTTP request dangerous?',
      a: '<code>HttpClient</code> is designed to be long-lived. Disposing it after each request closes the underlying TCP socket, but the OS keeps it in <strong>TIME_WAIT</strong> state for ~4 minutes. Under load (100 requests/sec), you accumulate ~24,000 sockets in TIME_WAIT — quickly exhausting the OS socket limit.<br><br>Fix: use a <strong>static singleton</strong> <code>HttpClient</code> in simple apps, or <strong>IHttpClientFactory</strong> in ASP.NET Core (manages connection pooling, DNS TTL refresh, and Polly resilience policies). <code>IHttpClientFactory</code> is the recommended approach for all server-side code.',
    },
    {
      q: 'What is the difference between Gen 0, Gen 1, and Gen 2 GC collections?',
      a: 'Generations model the observation that most objects die young:<br><br><strong>Gen 0</strong>: collected most frequently (every few MB of allocation). Fast — only scans newly allocated objects. Most LINQ results, method-local variables, and short-lived objects are collected here.<br><br><strong>Gen 1</strong>: buffer between Gen 0 and Gen 2. Collected less often. Objects that survived one Gen 0 collection live here briefly before either dying or promoting to Gen 2.<br><br><strong>Gen 2</strong>: collected rarely (minutes apart under typical loads). Contains long-lived objects: caches, singletons, static data. Gen 2 collections scan the entire managed heap — they can cause significant pauses (tens of milliseconds). The goal of GC tuning is to keep long-lived objects stable in Gen 2 and keep Gen 0 collections fast.',
    },
    {
      q: 'When should I use SafeHandle instead of IntPtr for wrapping OS handles?',
      a: '<code>SafeHandle</code> is almost always preferable to raw <code>IntPtr</code> for OS handles:<br><br><strong>SafeHandle advantages:</strong><ul><li>Finalizable by design — <code>ReleaseHandle()</code> is called by the GC if you forget Dispose</li><li>Handles the dispose pattern correctly (no manual IDisposable implementation needed)</li><li>Immune to handle recycling attacks — the runtime ensures the handle is not reused while in use</li><li>Reference-counted internally — threads cannot dispose the handle while another thread is using it</li></ul>Use a raw <code>IntPtr</code> only when integrating with low-level P/Invoke that requires it or when writing performance-critical code where SafeHandle\'s overhead is measurable.',
    },
  ];

  challenge: Challenge = {
    title: 'Resource Manager with IDisposable',
    description: `Implement a ManagedFileLogger that wraps a StreamWriter, implements IDisposable and IAsyncDisposable correctly, and is safe to use in both sync and async contexts.

Requirements:
1. Implement IDisposable and IAsyncDisposable on ManagedFileLogger
2. The class wraps a StreamWriter opened on a given file path
3. Provide Log(string message) and LogAsync(string message, CancellationToken ct) methods
4. Both methods should throw ObjectDisposedException if called after disposal
5. Dispose() must flush and close the StreamWriter synchronously
6. DisposeAsync() must flush and close the StreamWriter asynchronously
7. Multiple calls to Dispose() or DisposeAsync() must be safe (no-op on subsequent calls)`,
    language: 'csharp',
    hints: [
      'Use a private bool _disposed field as a guard in every public method and in both disposal methods',
      'Call ObjectDisposedException.ThrowIf(_disposed, this) at the start of Log and LogAsync',
      'In Dispose(): call _writer?.Flush() then _writer?.Dispose() then set _disposed = true',
      'In DisposeAsync(): await _writer.FlushAsync() then await _writer.DisposeAsync()',
      'Call GC.SuppressFinalize(this) at the end of both Dispose() and DisposeAsync()',
    ],
    starterCode: `public class ManagedFileLogger : IDisposable, IAsyncDisposable
{
    private StreamWriter? _writer;
    private bool _disposed;

    public ManagedFileLogger(string filePath)
    {
        // TODO: open StreamWriter on filePath (append mode)
        throw new NotImplementedException();
    }

    public void Log(string message)
    {
        // TODO: check disposed, write timestamped line
        throw new NotImplementedException();
    }

    public async Task LogAsync(string message, CancellationToken ct = default)
    {
        // TODO: check disposed, write timestamped line asynchronously
        throw new NotImplementedException();
    }

    public void Dispose()
    {
        // TODO: flush and dispose _writer, set _disposed, suppress finalizer
        throw new NotImplementedException();
    }

    public async ValueTask DisposeAsync()
    {
        // TODO: async flush and dispose _writer, set _disposed, suppress finalizer
        throw new NotImplementedException();
    }
}`,
    solution: `public class ManagedFileLogger : IDisposable, IAsyncDisposable
{
    private StreamWriter? _writer;
    private bool _disposed;

    public ManagedFileLogger(string filePath)
    {
        _writer = new StreamWriter(filePath, append: true) { AutoFlush = false };
    }

    public void Log(string message)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        _writer!.WriteLine($"[{DateTime.UtcNow:O}] {message}");
    }

    public async Task LogAsync(string message, CancellationToken ct = default)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        ct.ThrowIfCancellationRequested();
        await _writer!.WriteLineAsync($"[{DateTime.UtcNow:O}] {message}");
    }

    public void Dispose()
    {
        if (_disposed) return;
        _writer?.Flush();
        _writer?.Dispose();
        _writer = null;
        _disposed = true;
        GC.SuppressFinalize(this);
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;
        if (_writer is not null)
        {
            await _writer.FlushAsync();
            await _writer.DisposeAsync();
            _writer = null;
        }
        _disposed = true;
        GC.SuppressFinalize(this);
    }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'The .NET GC is generational — Gen 0 is collected frequently, Gen 2 rarely. IDisposable provides deterministic cleanup of unmanaged resources; always wrap in using. Call GC.SuppressFinalize in Dispose() to skip the redundant finalizer. Use IAsyncDisposable when cleanup is async. Never touch managed objects in a finalizer.',
    mustKnow: [
      'Generational GC: Gen 0 = short-lived, collected frequently; Gen 2 = long-lived, collected rarely; LOH (≥85 KB) = Gen 2 only, not compacted by default.',
      '<code>IDisposable.Dispose()</code> provides deterministic cleanup. Always wrap in <code>using</code> — the GC finalizer is non-deterministic and may not run for minutes.',
      'Call <code>GC.SuppressFinalize(this)</code> in <code>Dispose()</code> — removes the object from the finalization queue so it is collected immediately, not after an extra GC cycle.',
      'Never touch managed objects in a finalizer — finalization order is non-deterministic; referenced objects may already be collected.',
      '<code>IAsyncDisposable</code> + <code>await using</code> — use when disposal is inherently async (network flush, async queue drain). Return <code>ValueTask</code> to avoid heap allocation on the fast path.',
      'Check <code>_disposed</code> in every public method and throw <code>ObjectDisposedException.ThrowIf(_disposed, this)</code> — never let use-after-dispose produce confusing NullReferenceException.',
      'Prefer <code>SafeHandle</code> over raw <code>IntPtr</code> for OS handles — finalizable, ref-counted, immune to handle recycling attacks.',
    ],
    interviewFocus: [
      'What is the purpose of GC.SuppressFinalize(this) in Dispose()? (Skip redundant finalizer call; object collected in next GC cycle instead of living an extra cycle)',
      'What is the Large Object Heap and why is it a performance concern? (≥85 KB objects; Gen 2 only; not compacted → fragmentation; use ArrayPool)',
      'Can you safely access managed objects inside a finalizer? Why not? (No — finalization is non-deterministic; referenced objects may already be collected)',
      'When would you implement both IDisposable and IAsyncDisposable? (When both sync and async callers exist; async path awaits cleanup; sync path may block or do a simpler cleanup)',
      'What happens if you forget to call Dispose() on a SqlConnection? (Connection held open, not returned to pool; under load the pool exhausts and requests queue / timeout)',
    ],
  };
}
