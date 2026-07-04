import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-createasyncscope-vs-createscope-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './createasyncscope-vs-createscope.html',
  styleUrl: './createasyncscope-vs-createscope.scss',
})
export class HowCreateasyncscopeDiffersCreatescopeInternallyAsyncdisposableWarningSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page uses <code>CreateAsyncScope()</code> without explaining WHY — the answer is entirely about how the scope itself, not just its contents, gets disposed',
      points: [
        'The main Dependency Injection page\'s <code>IServiceScopeFactory</code> example calls <code>_scopeFactory.CreateAsyncScope()</code> and disposes it with <code>await using</code>, but never explains why this specific method exists alongside the older <code>CreateScope()</code>. The difference is NOT about how services are RESOLVED — resolution works identically either way. It is entirely about how the SCOPE ITSELF is torn down: <code>CreateScope()</code> returns an <code>IServiceScope</code> whose <code>Dispose()</code> is purely synchronous, while <code>CreateAsyncScope()</code> returns an <code>AsyncServiceScope</code> implementing <code>IAsyncDisposable</code>, whose <code>DisposeAsync()</code> can properly await any <code>IAsyncDisposable</code> services it created.',
      ],
    },
    {
      heading: 'When a synchronous scope disposes a service that is ONLY IAsyncDisposable (not IDisposable), the container falls back to calling DisposeAsync().GetAwaiter().GetResult() — blocking the thread on async cleanup',
      points: [
        'If a Scoped service implements ONLY <code>IAsyncDisposable</code> (common for anything wrapping a database connection, gRPC channel, or async-native client) and it is resolved from a scope created via the SYNCHRONOUS <code>CreateScope()</code>, calling that scope\'s <code>Dispose()</code> forces the DI container to synchronously block on the service\'s async cleanup — via <code>GetAwaiter().GetResult()</code> internally. This works, but defeats the entire point of async disposal: it can deadlock in certain synchronization-context-sensitive hosting scenarios, and it blocks a thread-pool thread for however long the async cleanup takes.',
        'This is exactly why the .NET analyzer emits a warning (or the framework\'s own internal fallback silently activates) when a synchronous scope is used to hold an async-disposable service — <code>CreateAsyncScope()</code> exists specifically to let <code>DisposeAsync()</code> propagate down to every scoped service\'s own <code>DisposeAsync()</code>, without ever calling <code>.GetResult()</code> and blocking a thread.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A Scoped service that is ONLY IAsyncDisposable — the exact shape that makes CreateScope() dangerous',
      language: 'csharp',
      code: `public class AsyncOnlyMessageBusClient : IAsyncDisposable
{
    private readonly Channel _grpcChannel;

    public AsyncOnlyMessageBusClient()
    {
        _grpcChannel = GrpcChannel.ForAddress("https://bus.internal");
    }

    public async ValueTask DisposeAsync()
    {
        // Real async cleanup — draining in-flight gRPC calls before
        // actually closing the channel. There is deliberately NO
        // synchronous Dispose() method on this class at all:
        await _grpcChannel.ShutdownAsync();
    }
}

// Registered as Scoped, same as any other service:
builder.Services.AddScoped<AsyncOnlyMessageBusClient>();`,
    },
    {
      label: 'CreateScope() vs CreateAsyncScope() — what actually happens at disposal time',
      language: 'csharp',
      code: `public class BusRelayWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public BusRelayWorker(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // --- DANGEROUS: synchronous scope holding an async-only service ---
            using (var syncScope = _scopeFactory.CreateScope())
            {
                var client = syncScope.ServiceProvider
                    .GetRequiredService<AsyncOnlyMessageBusClient>();
                await RelayMessagesAsync(client);
            }
            // When 'syncScope.Dispose()' runs here, the container discovers
            // AsyncOnlyMessageBusClient implements ONLY IAsyncDisposable —
            // no synchronous IDisposable. Internally, the framework's
            // ServiceProviderEngineScope falls back to calling
            // ((IAsyncDisposable)client).DisposeAsync().AsTask().GetAwaiter().GetResult()
            // — synchronously blocking THIS thread until the async gRPC
            // channel shutdown completes. On a thread-pool thread inside a
            // BackgroundService, this doesn't deadlock (there's no captured
            // SynchronizationContext) — but it DOES block a worker thread
            // for the full duration of an async operation, which is exactly
            // the anti-pattern async/await exists to avoid.

            // --- CORRECT: async scope disposes the service asynchronously ---
            await using (var asyncScope = _scopeFactory.CreateAsyncScope())
            {
                var client = asyncScope.ServiceProvider
                    .GetRequiredService<AsyncOnlyMessageBusClient>();
                await RelayMessagesAsync(client);
            }
            // 'await asyncScope.DisposeAsync()' here calls
            // ((IAsyncDisposable)client).DisposeAsync() and properly AWAITS
            // it — no thread is blocked waiting for the gRPC channel to
            // shut down; the awaiting Task yields the thread back to the
            // pool until the shutdown actually completes.

            await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
        }
    }

    private Task RelayMessagesAsync(AsyncOnlyMessageBusClient client) => Task.CompletedTask;
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The main page\'s own <code>OutboxProcessor</code> example uses EF Core\'s <code>AppDbContext</code>, which implements BOTH <code>IDisposable</code> AND <code>IAsyncDisposable</code>. Explain whether the synchronous-blocking problem described in this subtopic actually applies to that example, and why or why not.',
    hint: 'The blocking fallback only triggers when a service implements ONLY IAsyncDisposable and has NO synchronous IDisposable at all. Check what happens when a type implements both interfaces and a synchronous scope disposes it.',
    solution: `It does NOT apply — and this is an important distinction. EF Core's DbContext
implements BOTH IDisposable AND IAsyncDisposable. When a SYNCHRONOUS scope
(created via CreateScope()) disposes a service that implements BOTH
interfaces, the DI container's disposal logic prefers the SYNCHRONOUS
IDisposable.Dispose() path — it does NOT need to fall back to the blocking
DisposeAsync().GetAwaiter().GetResult() pattern at all, because a perfectly
valid synchronous cleanup path already exists on the type itself.

The dangerous fallback described in this subtopic is specifically for types
that implement ONLY IAsyncDisposable, with NO IDisposable at all (like the
AsyncOnlyMessageBusClient example) — for those, a synchronous scope has NO
synchronous disposal path to call, so it is FORCED to synchronously block on
the async one.

This means the main page's own OutboxProcessor example, despite using
CreateAsyncScope(), is not actually protecting against the blocking-fallback
problem this subtopic describes — DbContext's synchronous Dispose() would
have worked fine even from a plain CreateScope(). The REAL reason to prefer
CreateAsyncScope() universally, even when a type implements both interfaces,
is that DbContext.DisposeAsync() properly awaits flushing any pending
SaveChangesAsync() work and closing the underlying connection asynchronously
— giving strictly BETTER behavior than the synchronous Dispose() path, not
just AVOIDING a problem. The blocking-fallback danger described in this
subtopic becomes a hard REQUIREMENT (not just a nice-to-have) specifically
for async-only types like message bus clients, gRPC channels, or any
hand-written service that never implemented a synchronous IDisposable at
all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'CreateAsyncScope() and CreateScope() differ in how services are RESOLVED from the scope.',
      reality: 'resolution is identical either way — the only difference is in how the SCOPE ITSELF is torn down: synchronously via Dispose(), or asynchronously via DisposeAsync() which properly awaits any IAsyncDisposable services.',
    },
    {
      thought: 'using a synchronous CreateScope() to hold a service that only implements IAsyncDisposable will throw an exception at disposal time.',
      reality: 'it does not throw — the container silently falls back to calling DisposeAsync().GetAwaiter().GetResult(), synchronously blocking the current thread until the async cleanup finishes, which is a silent performance/deadlock risk rather than a hard failure.',
    },
    {
      thought: 'a type implementing BOTH IDisposable and IAsyncDisposable (like EF Core\'s DbContext) gets the same blocking-fallback risk as an async-only type when disposed from a synchronous scope.',
      reality: 'when both interfaces are present, a synchronous scope simply calls the synchronous Dispose() path directly — there is no blocking fallback, because a valid synchronous cleanup path already exists on the type.',
    },
  ];
}
