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
  selector: 'app-csharp-gc-disposable',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './gc-disposable.html',
  styleUrl: './gc-disposable.scss',
})
export class CsharpGcDisposable {

  quickRef: QuickRefItem[] = [
    { name: 'IDisposable',           type: 'interface', desc: 'Defines a single Dispose() method. Implement to release unmanaged resources (file handles, DB connections, sockets) deterministically.' },
    { name: 'IAsyncDisposable',      type: 'interface', desc: 'Async counterpart to IDisposable. Implement DisposeAsync() when cleanup involves async work (flushing streams, closing network connections).' },
    { name: 'using statement',       type: 'keyword',   desc: 'Calls Dispose() on the target when the block exits — even if an exception is thrown. Classic C# resource management.' },
    { name: 'using declaration',     type: 'keyword',   desc: 'C# 8+ syntax: "using var x = ...". Dispose() is called at the end of the enclosing scope. Less nesting than using {}.' },
    { name: 'await using',           type: 'keyword',   desc: 'Calls DisposeAsync() asynchronously when the scope exits. Use with IAsyncDisposable resources.' },
    { name: 'GC.SuppressFinalize',   type: 'method',    desc: 'Tells the GC not to call the finalizer for this object — call it inside Dispose() to avoid double cleanup.' },
    { name: 'GC.Collect',            type: 'method',    desc: 'Forces a garbage collection. Avoid in production — it disrupts GC tuning. Useful in tests and benchmarks.' },
    { name: 'WeakReference<T>',      type: 'class',     desc: 'Holds a reference to an object without preventing it from being collected. Useful for caches.' },
    { name: 'Gen 0 / 1 / 2',         type: 'type',      desc: 'GC generations. Short-lived objects live in Gen 0, collected most frequently. Long-lived objects promote to Gen 2.' },
    { name: 'Large Object Heap',     type: 'type',      desc: 'Objects >= 85,000 bytes are allocated here. The LOH is collected only during Gen 2 GCs and is not compacted by default.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How the .NET GC works',
      points: [
        'The .NET runtime uses a generational, tracing garbage collector. It periodically identifies objects that are no longer reachable from any root (stack, statics, GC handles) and reclaims their memory.',
        'Objects are divided into three generations. Gen 0 contains newly allocated, short-lived objects and is collected most frequently (every few milliseconds under load). Gen 1 is a buffer between Gen 0 and Gen 2. Gen 2 contains long-lived objects and is collected infrequently.',
        'When an object survives a GC collection of its generation, it is promoted to the next generation. This means your long-lived caches and singletons land in Gen 2 and are rarely touched by the collector.',
        'Objects 85,000 bytes or larger are allocated directly on the Large Object Heap (LOH). The LOH participates only in Gen 2 collections and is not compacted by default — meaning it can become fragmented over time. Avoid frequently allocating large arrays; use <code>ArrayPool&lt;T&gt;</code> instead.',
      ],
    },
    {
      heading: 'Managed vs unmanaged resources',
      points: [
        'The GC manages memory for all .NET objects automatically. You never need to free memory manually for managed objects.',
        'Unmanaged resources — file handles, database connections, network sockets, native memory allocated via P/Invoke — are not known to the GC. If you forget to release them, they leak until the process exits or the OS reclaims them.',
        'The <code>IDisposable</code> interface gives you a deterministic hook to release unmanaged resources when you are done with an object, regardless of when the GC runs.',
        'The rule: <strong>every object that wraps unmanaged resources should implement <code>IDisposable</code></strong>, and callers should wrap it in a <code>using</code> block.',
      ],
    },
    {
      heading: 'The IDisposable pattern',
      points: [
        'The full pattern uses a <code>protected virtual void Dispose(bool disposing)</code> method. When <code>disposing == true</code>, the call came from user code via <code>Dispose()</code> — safe to release managed resources. When false, the call came from the finalizer — only release unmanaged resources.',
        'Call <code>GC.SuppressFinalize(this)</code> inside <code>Dispose()</code>. This removes the object from the finalization queue, avoiding the overhead of a finalizer call after the object has already been cleaned up.',
        'A finalizer (<code>~ClassName()</code>) is your last line of defense for releasing unmanaged resources if the caller forgot to call <code>Dispose()</code>. Objects with finalizers are kept alive for an extra GC cycle — minimize their use.',
        'For simple classes that only hold managed <code>IDisposable</code> fields, you do not need the full pattern. Just implement <code>Dispose()</code> and call <code>Dispose()</code> on each field.',
      ],
    },
    {
      heading: 'IAsyncDisposable and await using',
      points: [
        '<code>IAsyncDisposable</code> was introduced in .NET Core 3.0 for resources whose cleanup is inherently async — flushing a network buffer, closing a database connection, draining a message queue.',
        'Use <code>await using var x = new AsyncResource()</code> to call <code>DisposeAsync()</code> asynchronously when the scope exits. This avoids blocking the thread during cleanup.',
        'If your class has both sync and async consumers, implement both <code>IDisposable</code> and <code>IAsyncDisposable</code>. The sync version can call <code>DisposeAsync().GetAwaiter().GetResult()</code> as a fallback.',
        'ASP.NET Core\'s DI container natively handles <code>IAsyncDisposable</code> — scoped and transient services are async-disposed at the end of each request.',
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
// LOH:   objects >= 85,000 bytes

// ── Inspecting the GC ─────────────────────────────────────────────────────
Console.WriteLine(\`Gen 0 collections: \${GC.CollectionCount(0)}\`);
Console.WriteLine(\`Gen 1 collections: \${GC.CollectionCount(1)}\`);
Console.WriteLine(\`Gen 2 collections: \${GC.CollectionCount(2)}\`);
Console.WriteLine(\`Total memory (bytes): \${GC.GetTotalMemory(forceFullCollection: false)}\`);

// Get detailed memory info (available in .NET 5+)
GCMemoryInfo info = GC.GetGCMemoryInfo();
Console.WriteLine(\`Heap size: \${info.HeapSizeBytes:N0} bytes\`);
Console.WriteLine(\`Fragmented: \${info.FragmentedBytes:N0} bytes\`);

// ── Large Object Heap example — avoid large transient arrays ─────────────
// BAD: allocates a new 1 MB array (goes to LOH) on every call
static byte[] BadPattern() => new byte[1_024 * 1_024];

// GOOD: rent from the pool — zero LOH pressure
static void GoodPattern()
{
    byte[] buffer = System.Buffers.ArrayPool<byte>.Shared.Rent(1_024 * 1_024);
    try
    {
        // use buffer...
    }
    finally
    {
        System.Buffers.ArrayPool<byte>.Shared.Return(buffer);
    }
}

// ── WeakReference — hold without preventing collection ───────────────────
var cache = new Dictionary<string, WeakReference<byte[]>>();

void AddToCache(string key, byte[] data)
    => cache[key] = new WeakReference<byte[]>(data);

byte[]? GetFromCache(string key)
{
    if (cache.TryGetValue(key, out var weak) &&
        weak.TryGetTarget(out var data))
        return data;                // still alive

    cache.Remove(key);              // collected — clean up
    return null;
}

// ── GC.Collect — only for tests/benchmarks, never production ─────────────
GC.Collect(2, GCCollectionMode.Forced, blocking: true);
GC.WaitForPendingFinalizers();
Console.WriteLine(\`Memory after forced GC: \${GC.GetTotalMemory(false):N0}\`);`,
    },
    {
      label: 'IDisposable Pattern',
      language: 'csharp',
      code: `// ── Simple disposal — just wraps managed IDisposable fields ─────────────
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
        ObjectDisposedException.ThrowIf(_disposed, this);
        // ... use _connection
    }

    public void Dispose()
    {
        if (_disposed) return;
        _connection?.Dispose();
        _connection = null;
        _disposed = true;
    }
}

// ── Full pattern — owns both managed and unmanaged resources ──────────────
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
            // Safe to dispose managed resources here
            _stream?.Dispose();
            _stream = null;
        }

        // Always release unmanaged resources
        if (_handle != IntPtr.Zero)
        {
            CloseNativeHandle(_handle); // P/Invoke
            _handle = IntPtr.Zero;
        }

        _disposed = true;
    }

    // Finalizer — safety net if caller forgets Dispose()
    ~NativeFileWrapper() => Dispose(disposing: false);

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this); // finalizer no longer needed
    }

    private static IntPtr GetNativeHandle(FileStream s) => IntPtr.Zero;
    private static void CloseNativeHandle(IntPtr h) { }
}

// ── Caller: always use 'using' ────────────────────────────────────────────
using var session = new DatabaseSession("Server=.;Database=App;Trusted_Connection=True");
session.ExecuteQuery("SELECT 1");
// Dispose() called automatically here, even if an exception is thrown`,
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
} // reader.Dispose() called here

// ── using declaration (C# 8+) — less nesting ─────────────────────────────
// Dispose() is called at the end of the enclosing scope (method/block)
using var writer = new StreamWriter("output.txt");
writer.WriteLine("Hello");
// writer disposed at end of method

// Multiple using declarations — cleaner than nested using blocks
using var conn   = new SqlConnection(connStr);
using var cmd    = new SqlCommand("SELECT 1", conn);
conn.Open();
using var dr     = cmd.ExecuteReader();
while (dr.Read())
    Console.WriteLine(dr[0]);

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
        await _conn.CloseAsync();  // async flush and close
        _conn.Dispose();
        _disposed = true;
    }
}

// Caller — note 'await using' keyword
await using var session = new AsyncDbSession(connectionString);
await session.OpenAsync(ct);
// DisposeAsync() called asynchronously when scope exits

// ── Implementing both sync and async disposal ─────────────────────────────
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
        await _stream.DisposeAsync();
        GC.SuppressFinalize(this);
    }
}`,
    },
    {
      label: 'Finalizers & Memory Pressure',
      language: 'csharp',
      code: `// ── Finalizer as safety net (avoid unless you own unmanaged memory) ────────
// Objects with finalizers go through an extra GC cycle before collection.
// The finalizer runs on a dedicated GC thread — never touch managed objects here.
public class UnmanagedBuffer : IDisposable
{
    private nint _ptr;      // pointer to native memory
    private readonly int _size;
    private bool _disposed;

    public UnmanagedBuffer(int size)
    {
        _size = size;
        _ptr  = System.Runtime.InteropServices.Marshal.AllocHGlobal(size);
    }

    // Finalizer — runs if Dispose() was never called
    ~UnmanagedBuffer()
    {
        Console.WriteLine("[FINALIZER] Cleaning up — did you forget using?");
        Dispose(disposing: false);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (_ptr != 0)
        {
            System.Runtime.InteropServices.Marshal.FreeHGlobal(_ptr);
            _ptr = 0;
        }
        _disposed = true;
    }

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this); // take object off finalizer queue
    }
}

// ── GC.AddMemoryPressure — hint to the GC about unmanaged memory ─────────
// When your object holds large amounts of native memory the GC doesn't know about,
// use AddMemoryPressure to trigger more frequent collections.
public class LargeNativeImage : IDisposable
{
    private nint _nativePixels;
    private readonly long _nativeBytes;

    public LargeNativeImage(int width, int height)
    {
        _nativeBytes  = (long)width * height * 4; // RGBA
        _nativePixels = System.Runtime.InteropServices.Marshal.AllocHGlobal((nint)_nativeBytes);
        GC.AddMemoryPressure(_nativeBytes);  // tell GC about this allocation
    }

    public void Dispose()
    {
        if (_nativePixels != 0)
        {
            System.Runtime.InteropServices.Marshal.FreeHGlobal(_nativePixels);
            GC.RemoveMemoryPressure(_nativeBytes); // always remove when freed
            _nativePixels = 0;
        }
        GC.SuppressFinalize(this);
    }
}

// ── Observing finalizer queue ─────────────────────────────────────────────
// In tests: force collection and wait for pending finalizers to run
GC.Collect(2, GCCollectionMode.Forced, blocking: true);
GC.WaitForPendingFinalizers();
GC.Collect(2, GCCollectionMode.Forced, blocking: true); // collect objects released by finalizers`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the purpose of calling GC.SuppressFinalize(this) inside Dispose()?',
      options: [
        'It prevents the object from being collected by the GC immediately',
        'It removes the object from the finalization queue so the finalizer is not called redundantly after Dispose() has already cleaned up',
        'It frees all managed memory held by the object',
        'It is required by the IDisposable interface contract',
      ],
      answer: 1,
      explanation: 'Objects with a finalizer are placed on a finalization queue and survive an extra GC cycle so the finalizer can run. If <code>Dispose()</code> already did all the cleanup, calling the finalizer later would be redundant work. <code>GC.SuppressFinalize(this)</code> removes the object from the queue so the GC can collect it immediately on the next cycle without invoking the finalizer.',
    },
    {
      q: 'What is the Large Object Heap (LOH) and why does it matter?',
      options: [
        'It is a separate heap for static and singleton objects',
        'It stores all objects created in async methods',
        'It holds objects >= 85,000 bytes; it is only collected during Gen 2 GCs and is not compacted by default, leading to fragmentation',
        'It is the heap used by finalizers and is always compacted',
      ],
      answer: 2,
      explanation: 'Objects >= 85,000 bytes bypass Gen 0/1 and go straight to the LOH. Because the LOH is only collected during Gen 2 (infrequent) GCs and is not compacted, repeatedly allocating and freeing large arrays fragments the LOH. Use <code>ArrayPool&lt;T&gt;</code> to rent and return large arrays instead of creating new ones, eliminating LOH pressure.',
    },
    {
      q: 'When should you use IAsyncDisposable instead of (or in addition to) IDisposable?',
      options: [
        'When the object is used in an async method',
        'When the cleanup work itself is async — for example, flushing a buffer over the network or closing a database connection gracefully',
        'IAsyncDisposable replaces IDisposable entirely in .NET 6+',
        'When the object is very large and cleanup takes a long time',
      ],
      answer: 1,
      explanation: 'Use <code>IAsyncDisposable</code> when the disposal logic involves inherently async operations — closing a TCP connection, draining a queue, flushing an async writer. Calling <code>DisposeAsync()</code> and awaiting it keeps the cleanup non-blocking. If a class might be used by both sync and async callers, implement both interfaces.',
    },
    {
      q: 'An object has a finalizer but no call to GC.SuppressFinalize is made. What is the performance impact?',
      options: [
        'No impact — finalizers are free',
        'The object is moved to a special finalizable queue, survives one extra GC cycle, and the finalizer runs on a dedicated thread before the memory is freed — adding latency and GC overhead',
        'The finalizer runs synchronously on the calling thread when the object goes out of scope',
        'The GC skips collecting the object entirely until the process exits',
      ],
      answer: 1,
      explanation: 'Finalizable objects are tracked on the finalization queue. When the GC discovers one is unreachable, instead of reclaiming the memory immediately, it places it on the f-reachable queue. A background finalizer thread runs the finalizer, then the memory is freed on the <em>next</em> GC cycle. This means the object\'s memory lives two GC cycles longer and involves thread switching — a real cost for objects created frequently.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Do I need to implement IDisposable if my class only has managed fields?',
      a: `It depends. If your managed fields are themselves <code>IDisposable</code> (e.g. a <code>DbConnection</code>, <code>HttpClient</code>, or <code>Stream</code>), then yes — you should implement <code>IDisposable</code> and call <code>Dispose()</code> on each of them. The GC will eventually collect them, but their unmanaged resources (connection handles, sockets) will leak until that happens.<br><br>
If all your fields are plain managed objects that do <em>not</em> hold unmanaged resources (strings, lists, POCOs), you do not need <code>IDisposable</code> — the GC handles them automatically.<br><br>
Rule of thumb: if you call <code>new</code> on anything that implements <code>IDisposable</code>, your class probably should too.`,
    },
    {
      q: 'What happens if I call Dispose() more than once?',
      a: `The <code>IDisposable</code> contract states that calling <code>Dispose()</code> multiple times must be safe — subsequent calls should be a no-op. This is why the standard pattern uses a <code>_disposed</code> boolean guard:<br><br>
<code>public void Dispose() { if (_disposed) return; /* cleanup */ _disposed = true; }</code><br><br>
Most built-in types in .NET (streams, connections, etc.) follow this contract. In your own code, always add the guard. A second <code>Dispose()</code> call is common when a class is wrapped by another disposable that also calls <code>Dispose()</code> on it.`,
    },
    {
      q: 'When should I actually call GC.Collect?',
      a: `Almost never in production code. The GC is highly tuned and calling <code>GC.Collect</code> disrupts its generational heuristics — you force a full Gen 2 collection at a time the GC did not deem necessary, which can cause significant pauses.<br><br>
<strong>Legitimate uses:</strong><br>
1. <strong>Tests and benchmarks</strong> — after setup, before measuring, to start from a clean baseline.<br>
2. <strong>Known large allocation bursts</strong> — after loading a large dataset you immediately discard (e.g. importing a huge CSV once at startup), a forced collection can reclaim memory before the workload begins.<br>
3. <strong>Memory diagnostics</strong> — to see how much memory is genuinely live vs. waiting to be collected.<br><br>
Always pair with <code>GC.WaitForPendingFinalizers()</code> and a second <code>GC.Collect</code> to also collect objects released by finalizers.`,
    },
    {
      q: 'What is the difference between the using statement and the using declaration?',
      a: `Both call <code>Dispose()</code> automatically, but they differ in scope:<br><br>
<strong>Using statement</strong> (C# 1+): <code>using (var x = new Foo()) { ... }</code> — <code>x</code> is disposed at the closing brace. Explicit, clear boundary, but adds indentation.<br><br>
<strong>Using declaration</strong> (C# 8+): <code>using var x = new Foo();</code> — <code>x</code> is disposed at the end of the enclosing scope (method, if-block, etc.). Less nesting, more readable when you have multiple disposable resources. Disposals happen in reverse declaration order, just like nested using blocks.<br><br>
Use the declaration form for cleaner code. Fall back to the statement form when you need the resource disposed before the method ends (e.g., you want to flush a writer and then read the written file within the same method).`,
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
      'In Dispose(): call _writer.Flush() then _writer.Dispose() then set _disposed = true',
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
        // TODO: flush and dispose _writer, set _disposed
        throw new NotImplementedException();
    }

    public async ValueTask DisposeAsync()
    {
        // TODO: async flush and dispose _writer, set _disposed
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
        _writer!.WriteLine(\`[\${DateTime.UtcNow:O}] \${message}\`);
    }

    public async Task LogAsync(string message, CancellationToken ct = default)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        ct.ThrowIfCancellationRequested();
        await _writer!.WriteLineAsync(\`[\${DateTime.UtcNow:O}] \${message}\`);
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
}
