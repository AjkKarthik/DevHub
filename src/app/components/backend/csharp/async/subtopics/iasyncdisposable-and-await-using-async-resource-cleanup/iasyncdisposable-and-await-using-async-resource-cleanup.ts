import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-iasyncdisposable-and-await-using-async-resource-cleanup-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './iasyncdisposable-and-await-using-async-resource-cleanup.html',
  styleUrl: './iasyncdisposable-and-await-using-async-resource-cleanup.scss',
})
export class IasyncdisposableAndAwaitUsingAsyncResourceCleanupSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A real C# 8 feature the main topic never mentions once',
      points: [
        'The main Async page covers async streams (<code>IAsyncEnumerable&lt;T&gt;</code>), cancellation, and parallelism extensively — but never mentions <code>IAsyncDisposable</code> or <code>await using</code>, even though both shipped in the SAME C# 8 / .NET Core 3.0 release as <code>IAsyncEnumerable&lt;T&gt;</code> and solve a directly related problem: what happens when CLEANING UP a resource itself requires async work (flushing a network buffer, closing a database connection gracefully)?',
      ],
    },
    {
      heading: 'The problem — synchronous Dispose() cannot do real async cleanup',
      points: [
        'The ordinary <code>IDisposable.Dispose()</code> method is SYNCHRONOUS — it cannot <code>await</code> anything inside it. For a resource whose proper cleanup genuinely involves I/O (flushing buffered writes over a network connection, sending a graceful close handshake, awaiting a final async write), a synchronous <code>Dispose()</code> is forced to either BLOCK the calling thread on that I/O (the exact "never block async code" anti-pattern the main topic\'s deadlock section warns against) or skip the cleanup and hope it doesn\'t matter.',
        '<code>IAsyncDisposable</code> solves this directly: it declares <code>ValueTask DisposeAsync();</code> — a method that CAN <code>await</code> real asynchronous cleanup work internally, without blocking any thread, using exactly the deferred-execution machinery the main topic\'s "async/await is compiler sugar for a state machine" section describes.',
      ],
    },
    {
      heading: 'await using — the syntax that calls it correctly',
      points: [
        '<code>await using var conn = await OpenConnectionAsync();</code> is the async counterpart to a regular <code>using</code> statement — it calls <code>DisposeAsync()</code> (not <code>Dispose()</code>) automatically when the enclosing scope ends, INCLUDING when an exception is thrown partway through the block, mirroring exactly the guarantee a regular <code>using</code> gives for <code>IDisposable</code>.',
        'The enclosing method must itself be <code>async</code> for <code>await using</code> to be legal — this makes sense given the main topic\'s own explanation of the async state machine: <code>await using</code>\'s cleanup is itself an <code>await</code> point, which can only exist inside a method the compiler has already transformed into a state machine.',
        'A type can implement BOTH <code>IDisposable</code> and <code>IAsyncDisposable</code> simultaneously, for consumers who only have synchronous code available — but where both are implemented, the SYNCHRONOUS <code>Dispose()</code> should typically be a simple, best-effort fallback (or explicitly documented as blocking), while <code>DisposeAsync()</code> is the properly non-blocking path callers should prefer whenever they are already in an async context.',
      ],
    },
    {
      heading: 'Real BCL examples — and when to reach for it yourself',
      points: [
        '<code>System.Net.Sockets.Socket</code>, <code>System.Data.Common.DbConnection</code> (and EF Core\'s <code>DbContext</code>), and <code>System.Threading.Timer</code>-adjacent async wrappers all implement <code>IAsyncDisposable</code> in modern .NET specifically because their proper cleanup involves genuine I/O — a database connection\'s graceful close, for instance, may need to flush a pending transaction or send a termination packet.',
        'Implement <code>IAsyncDisposable</code> yourself when your OWN type wraps a resource with async cleanup needs — a custom message-queue consumer that needs to acknowledge/flush pending messages on shutdown, or a class wrapping a <code>Stream</code> that needs a final async flush. For types with only SYNCHRONOUS cleanup (releasing a plain in-memory lock, clearing a field), ordinary <code>IDisposable</code> remains the right, simpler choice — do not implement <code>IAsyncDisposable</code> purely out of habit when there is no actual async work to perform during cleanup.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A type implementing IAsyncDisposable',
      language: 'csharp',
      code: `public class ManagedConnection : IAsyncDisposable
{
    private bool _disposed;

    public async Task SendAsync(string message)
    {
        Console.WriteLine($"Sending: {message}");
        await Task.Delay(10); // simulate network I/O
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;

        // Real async cleanup — flushing, graceful close handshake, etc.
        // This is EXACTLY the kind of work a synchronous Dispose() cannot
        // do without blocking the calling thread.
        Console.WriteLine("Flushing pending writes...");
        await Task.Delay(50);

        Console.WriteLine("Sending graceful close handshake...");
        await Task.Delay(30);

        _disposed = true;
        Console.WriteLine("Connection closed.");
    }
}

// await using calls DisposeAsync() automatically at the end of scope —
// including if an exception is thrown partway through the block.
async Task UseConnectionAsync()
{
    await using var conn = new ManagedConnection();
    await conn.SendAsync("Hello");
    await conn.SendAsync("World");
} // DisposeAsync() is awaited HERE automatically, non-blocking

await UseConnectionAsync();
// Output:
// Sending: Hello
// Sending: World
// Flushing pending writes...
// Sending graceful close handshake...
// Connection closed.`,
    },
    {
      label: 'Implementing BOTH IDisposable and IAsyncDisposable',
      language: 'csharp',
      code: `public class DualDisposableResource : IDisposable, IAsyncDisposable
{
    private bool _disposed;

    // Synchronous fallback for consumers stuck in sync code — best-effort,
    // may block briefly for genuinely necessary cleanup.
    public void Dispose()
    {
        if (_disposed) return;
        Console.WriteLine("Synchronous cleanup (blocking, best-effort)...");
        Task.Delay(50).GetAwaiter().GetResult(); // blocks — last resort only
        _disposed = true;
    }

    // The PREFERRED path for any caller already in an async context —
    // genuinely non-blocking.
    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;
        Console.WriteLine("Async cleanup (non-blocking)...");
        await Task.Delay(50);
        _disposed = true;
        GC.SuppressFinalize(this); // standard dispose-pattern hygiene
    }
}

// Async context — prefer await using
async Task AsyncCallerAsync()
{
    await using var resource = new DualDisposableResource();
    // ... use resource ...
} // calls DisposeAsync() — non-blocking

// Sync context — falls back to using
void SyncCaller()
{
    using var resource = new DualDisposableResource();
    // ... use resource ...
} // calls Dispose() — blocking, but explicit about the trade-off`,
    },
    {
      label: 'Real-world shape — a message queue consumer',
      language: 'csharp',
      code: `public class MessageQueueConsumer : IAsyncDisposable
{
    private readonly List<string> _pendingAcks = new();

    public Task ConsumeAsync(string message)
    {
        Console.WriteLine($"Processing: {message}");
        _pendingAcks.Add(message);
        return Task.CompletedTask;
    }

    public async ValueTask DisposeAsync()
    {
        // On shutdown, acknowledge every pending message before the
        // connection is torn down — genuinely async I/O, exactly the
        // scenario a synchronous Dispose() cannot handle without blocking.
        foreach (var message in _pendingAcks)
        {
            await AcknowledgeAsync(message);
        }
        Console.WriteLine($"Acknowledged {_pendingAcks.Count} pending messages.");
    }

    private async Task AcknowledgeAsync(string message)
    {
        await Task.Delay(5); // simulate an ack round-trip
        Console.WriteLine($"  Acked: {message}");
    }
}

async Task RunConsumerAsync()
{
    await using var consumer = new MessageQueueConsumer();
    await consumer.ConsumeAsync("order-created-1");
    await consumer.ConsumeAsync("order-created-2");
    await consumer.ConsumeAsync("order-created-3");
} // DisposeAsync() acknowledges all 3 messages before the scope truly ends

await RunConsumerAsync();`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a <code>Faulted</code> path to <code>ManagedConnection</code>: throw an exception from <code>SendAsync</code> partway through <code>UseConnectionAsync</code>, and verify (by observing the console output order) that <code>DisposeAsync()</code> still runs and completes its cleanup, exactly mirroring how a regular <code>using</code> guarantees <code>Dispose()</code> runs on an exception.',
    hint: 'Modify SendAsync to throw an exception when the message equals a specific value (e.g. "World"). Wrap the call to UseConnectionAsync() in a try/catch. Observe that "Flushing pending writes..." and "Sending graceful close handshake..." still print even though an exception propagated out of the await using block.',
    solution: `public class ManagedConnection : IAsyncDisposable
{
    public async Task SendAsync(string message)
    {
        Console.WriteLine($"Sending: {message}");
        await Task.Delay(10);
        if (message == "World")
            throw new InvalidOperationException("Simulated send failure");
    }

    public async ValueTask DisposeAsync()
    {
        Console.WriteLine("Flushing pending writes...");
        await Task.Delay(50);
        Console.WriteLine("Sending graceful close handshake...");
        await Task.Delay(30);
        Console.WriteLine("Connection closed.");
    }
}

async Task UseConnectionAsync()
{
    await using var conn = new ManagedConnection();
    await conn.SendAsync("Hello");
    await conn.SendAsync("World"); // throws here
    await conn.SendAsync("Never reached");
}

try
{
    await UseConnectionAsync();
}
catch (InvalidOperationException ex)
{
    Console.WriteLine($"Caught: {ex.Message}");
}
// Output proves DisposeAsync() STILL ran despite the exception:
// Sending: Hello
// Sending: World
// Flushing pending writes...          <-- cleanup still happened
// Sending graceful close handshake...
// Connection closed.
// Caught: Simulated send failure`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a type that needs async cleanup can just perform that cleanup by calling .Result or .Wait() inside an ordinary synchronous Dispose() method.',
      reality: 'this is exactly the "never block async code" anti-pattern the main topic\'s deadlock section warns against — IAsyncDisposable.DisposeAsync() exists specifically so cleanup can genuinely await async work without blocking any thread.',
    },
    {
      thought: '<code>await using</code> works the same as a regular <code>using</code> statement, just with an await keyword added for style.',
      reality: 'await using specifically calls DisposeAsync() (not Dispose()) and can only be used inside a method the compiler has already transformed into an async state machine — it is a genuinely different mechanism, not just cosmetic syntax.',
    },
    {
      thought: 'every type should implement both IDisposable and IAsyncDisposable for maximum flexibility, regardless of whether its cleanup actually involves async work.',
      reality: 'IAsyncDisposable should be reserved for types whose cleanup GENUINELY requires async I/O (flushing a network buffer, an async close handshake) — for purely synchronous cleanup (releasing an in-memory lock, clearing a field), plain IDisposable remains the simpler, correct choice.',
    },
  ];
}
