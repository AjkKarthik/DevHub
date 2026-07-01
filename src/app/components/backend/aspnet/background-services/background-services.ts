import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

const prerequisites: Prerequisite[] = [
  { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
  { label: 'Caching',             route: '/aspnet/caching' },
];

const quickRef: QuickRefItem[] = [
  { name: 'IHostedService',         type: 'interface', desc: 'StartAsync/StopAsync lifecycle — register with AddHostedService<T>().' },
  { name: 'BackgroundService',      type: 'class',     desc: 'Abstract base implementing IHostedService; override ExecuteAsync(CancellationToken).' },
  { name: 'ExecuteAsync()',         type: 'method',    desc: 'Override this to write the worker loop; runs until cancellation is requested.' },
  { name: 'IServiceScopeFactory',   type: 'interface', desc: 'Creates a DI scope inside a singleton worker to resolve scoped services.' },
  { name: 'PeriodicTimer',          type: 'class',     desc: '.NET 6+ timer that ticks without drifting — use with await timer.WaitForNextTickAsync().' },
  { name: 'Channel<T>',             type: 'class',     desc: 'In-memory producer/consumer queue; Channel.CreateBounded/Unbounded.' },
  { name: 'AddHostedService<T>()',  type: 'method',    desc: 'Registers a hosted service in the DI container.' },
  { name: 'stoppingToken',          type: 'keyword',   desc: 'CancellationToken that fires when the host begins shutdown — always pass to awaitable calls.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'IHostedService vs BackgroundService',
    points: [
      '<code>IHostedService</code> gives you two lifecycle methods: <code>StartAsync(CancellationToken)</code> (called at host startup) and <code>StopAsync(CancellationToken)</code> (called during shutdown). Implement it directly when you need precise control over startup order or want to avoid the background thread abstraction.',
      '<code>BackgroundService</code> is the recommended abstract base for long-running workers. It implements <code>IHostedService</code> and wraps your logic in <code>ExecuteAsync(CancellationToken stoppingToken)</code> — override this and write your loop. The base class handles the Task management.',
      'The host calls <code>StartAsync</code> for all hosted services sequentially during startup. The <code>stoppingToken</code> is cancelled when the application begins shutting down. Your loop must observe this token — passing it to every <code>await</code> call ensures the worker exits promptly on shutdown.',
      'If <code>ExecuteAsync</code> returns (without the token being cancelled), the worker is considered done — the host does not restart it. If it throws an unhandled exception, the worker stops silently in older .NET versions. In .NET 8+, an unhandled exception in a hosted service triggers host shutdown by default (<code>BackgroundServiceExceptionBehavior.StopHost</code>).',
      'Wrap the main loop body in <code>try/catch</code>, catching everything except <code>OperationCanceledException</code> (which signals clean shutdown). Log errors and continue the loop unless the error is fatal. A single unhandled exception from a transient failure should not kill the worker.',
      'Multiple hosted services run concurrently: <code>StartAsync</code> is called for each in registration order, but each <code>ExecuteAsync</code> runs on its own Task. The host waits for all services to complete <code>StopAsync</code> before process exit (up to the shutdown timeout, default 30s).',
    ],
  },
  {
    heading: 'Scoped Services Inside a Singleton Worker',
    points: [
      '<code>BackgroundService</code> is registered as a <strong>singleton</strong> (one instance for the app lifetime). Services like <code>DbContext</code>, repository classes, and most business services are <strong>scoped</strong> (one instance per HTTP request).',
      'Injecting a scoped service into a singleton creates a <strong>captive dependency</strong> — the singleton holds the scoped instance alive indefinitely, bypassing its intended lifetime. ASP.NET Core\'s DI container detects this at startup and throws <code>InvalidOperationException</code> (when scope validation is enabled, which is the default in Development).',
      'Solution: inject <code>IServiceScopeFactory</code> (itself a singleton) and call <code>scopeFactory.CreateAsyncScope()</code> inside the worker loop. Dispose the scope after each unit of work — this properly disposes <code>DbContext</code> and all scoped dependencies resolved within it.',
      'Use <code>await using var scope = scopeFactory.CreateAsyncScope()</code> for proper async disposal. Resolve services from <code>scope.ServiceProvider.GetRequiredService&lt;T&gt;()</code>. Do not hold the scope across multiple iterations — create a new scope per batch or per work item.',
      'For background services that need a <code>DbContext</code> for every iteration, the scope-per-iteration pattern has an overhead of scope creation and DbContext initialization per tick. For high-frequency workers (< 1s intervals), consider batching work into a single scope or using a raw <code>IDbConnection</code> with Dapper instead.',
      'An alternative: register the service with <code>AddKeyedSingleton&lt;T&gt;()</code> if it genuinely needs singleton lifetime and does not hold request-specific state. But for most business services that touch the DB or send emails, the scope-per-unit-of-work pattern is the right choice.',
    ],
  },
  {
    heading: 'PeriodicTimer (.NET 6+)',
    points: [
      '<code>PeriodicTimer</code> was introduced in .NET 6 as a non-drifting alternative to <code>await Task.Delay(interval, ct)</code> in a loop. Task.Delay drifts — if work takes 2s and the delay is 10s, the next tick is 12s from the previous start. PeriodicTimer ticks at 10s intervals from the first tick, compensating for work duration.',
      '<code>WaitForNextTickAsync(CancellationToken)</code> returns <code>true</code> when the next tick fires and <code>false</code> when the timer is disposed. This makes <code>while (await timer.WaitForNextTickAsync(ct))</code> the idiomatic clean loop — when the cancellation token fires, the method throws <code>OperationCanceledException</code>, which exits the loop.',
      'If work takes longer than the period, PeriodicTimer fires immediately for the next tick (no catch-up bursts) — it skips the missed tick. This prevents a queue of backed-up ticks from causing a thundering herd when the worker recovers from a slow operation.',
      'Dispose the timer when it is no longer needed (it implements <code>IDisposable</code>). In a <code>BackgroundService</code>, declare it with <code>using var timer = new PeriodicTimer(...)</code> inside <code>ExecuteAsync</code> — it is automatically disposed when the method exits, whether by cancellation or exception.',
      'For dynamic periods (e.g., the interval changes based on config), wrap the timer in a check: if the period changes, dispose the current timer and create a new one with the updated period. PeriodicTimer does not support changing the period after creation.',
      'PeriodicTimer is not suitable for high-precision timing (< 15ms) — the OS scheduler does not guarantee microsecond-level precision. For high-frequency sampling, use dedicated high-resolution timers or hardware interrupts. PeriodicTimer is excellent for second-to-hour-range periodic tasks.',
    ],
  },
  {
    heading: 'Queued Background Work with Channel<T>',
    points: [
      '<code>Channel&lt;T&gt;</code> (System.Threading.Channels) is the modern in-process producer-consumer queue. HTTP request handlers write to <code>channel.Writer</code> and return immediately; the background worker reads from <code>channel.Reader</code> and processes items asynchronously.',
      'Use <code>Channel.CreateBounded&lt;T&gt;(capacity)</code> with <code>BoundedChannelFullMode.Wait</code> for backpressure — the writer awaits until space is available rather than dropping messages or growing unboundedly. Set capacity based on your throughput expectations; a capacity of 100–1000 is typical.',
      '<code>BoundedChannelFullMode.DropOldest</code>, <code>DropNewest</code>, and <code>DropWrite</code> silently drop messages when full. Only use these for fire-and-forget logging or metrics where losing a message is acceptable. For email, payment, and order processing, always use <code>Wait</code>.',
      '<code>channel.Reader.ReadAllAsync(ct)</code> returns an <code>IAsyncEnumerable&lt;T&gt;</code> — the cleanest way to consume: <code>await foreach (var item in channel.Reader.ReadAllAsync(ct))</code>. This completes when the channel is completed (writer closed) or the token is cancelled.',
      'Register the channel wrapper (<code>IEmailQueue</code>) as <strong>Singleton</strong> — the channel itself lives for the app lifetime and is shared between HTTP handlers (producers) and the worker (consumer). The worker is also a Singleton. Use <code>IServiceScopeFactory</code> inside the worker to resolve scoped services per item.',
      'Channels are in-process only — they do not survive a pod restart. For durable work queues that must survive crashes (email confirmation, payment processing), use a message broker: Azure Service Bus, RabbitMQ (via MassTransit), or AWS SQS. The channel is appropriate for fire-and-forget or best-effort workloads where loss on restart is acceptable.',
    ],
  },
  {
    heading: 'Lifecycle, Shutdown, and Production Patterns',
    points: [
      'Graceful shutdown: when the host starts shutting down, it cancels <code>stoppingToken</code> and calls <code>StopAsync</code>. Give the worker time to finish in-flight work by awaiting on the currently processing item before exiting the loop. The default shutdown timeout is 30 seconds — increase it with <code>HostOptions.ShutdownTimeout</code> if your workers need more time.',
      'To stop the entire host from within a worker on a fatal error (e.g., can\'t connect to a critical service after N retries), inject <code>IHostApplicationLifetime</code> and call <code>lifetime.StopApplication()</code>. This triggers a clean shutdown of all hosted services.',
      'Health checks integration: expose a worker\'s health state via <code>IHealthCheck</code>. Track the last successful processing time in a shared field and report <code>Unhealthy</code> if it exceeds a threshold. Register with <code>services.AddHealthChecks().AddCheck&lt;WorkerHealthCheck&gt;("email-worker")</code>.',
      'Avoid starting heavy work in <code>StartAsync</code> — it blocks the startup sequence. Instead, do initialization in <code>ExecuteAsync</code> before the loop. This allows the host to complete startup (and start accepting HTTP requests) before the worker\'s initialization finishes. Use <code>IHostApplicationLifetime.ApplicationStarted</code> as a signal if you need to wait for startup to complete.',
      'Worker concurrency: a single <code>BackgroundService</code> runs one loop at a time. For parallel processing (e.g., processing 5 emails simultaneously), use <code>Task.WhenAll</code> on a batch: read N items from the channel and <code>await Task.WhenAll(batch.Select(ProcessAsync))</code>. Control max concurrency with a <code>SemaphoreSlim</code>.',
      'Observability: log the start and completion of each work item with structured logging. Record metrics: items processed per second, processing duration, queue depth. Use OpenTelemetry to create spans for each background job. A background service that silently processes items with no observability is a production nightmare to debug.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'BackgroundService base',
    language: 'csharp',
    code: `public class LogCleanupWorker(ILogger<LogCleanupWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Log cleanup worker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DoCleanupAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Error during log cleanup.");
            }

            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private Task DoCleanupAsync(CancellationToken ct)
    {
        logger.LogInformation("Cleaning old logs...");
        return Task.CompletedTask;
    }
}

builder.Services.AddHostedService<LogCleanupWorker>();`,
  },
  {
    label: 'Scoped Services (IServiceScopeFactory)',
    language: 'csharp',
    code: `public class OutboxWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<OutboxWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // Create a fresh scope for each processing batch
            await using var scope = scopeFactory.CreateAsyncScope();
            var db       = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var emailSvc = scope.ServiceProvider.GetRequiredService<IEmailService>();

            var pending = await db.OutboxMessages
                .Where(m => !m.Sent)
                .Take(10)
                .ToListAsync(stoppingToken);

            foreach (var msg in pending)
            {
                await emailSvc.SendAsync(msg.To, msg.Subject, msg.Body);
                msg.Sent   = true;
                msg.SentAt = DateTime.UtcNow;
            }

            await db.SaveChangesAsync(stoppingToken);
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }
}`,
  },
  {
    label: 'PeriodicTimer (.NET 6+)',
    language: 'csharp',
    code: `public class MetricsReporter(ILogger<MetricsReporter> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Tick every 30 seconds without drift
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30));

        // WaitForNextTickAsync returns false when timer is disposed
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            logger.LogInformation(
                "Active connections: {Count}", GetConnectionCount());
        }
    }

    private static int GetConnectionCount() => Random.Shared.Next(10, 200);
}`,
  },
  {
    label: 'Queued Work (Channel<T>)',
    language: 'csharp',
    code: `public interface IEmailQueue
{
    ValueTask EnqueueAsync(EmailMessage msg, CancellationToken ct = default);
    IAsyncEnumerable<EmailMessage> ReadAllAsync(CancellationToken ct = default);
}

public class EmailQueue : IEmailQueue
{
    private readonly Channel<EmailMessage> _channel =
        Channel.CreateBounded<EmailMessage>(new BoundedChannelOptions(100)
        {
            FullMode = BoundedChannelFullMode.Wait
        });

    public ValueTask EnqueueAsync(EmailMessage msg, CancellationToken ct = default)
        => _channel.Writer.WriteAsync(msg, ct);

    public IAsyncEnumerable<EmailMessage> ReadAllAsync(CancellationToken ct = default)
        => _channel.Reader.ReadAllAsync(ct);
}

public class EmailDispatchWorker(
    IEmailQueue queue,
    IServiceScopeFactory scopeFactory) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var msg in queue.ReadAllAsync(stoppingToken))
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var sender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
            await sender.SendAsync(msg);
        }
    }
}

builder.Services.AddSingleton<IEmailQueue, EmailQueue>();
builder.Services.AddHostedService<EmailDispatchWorker>();`,
  },
  {
    label: 'IHostedService (Manual)',
    language: 'csharp',
    code: `// Useful when you need precise control over start/stop order.
public class CacheWarmupService(
    IServiceScopeFactory scopeFactory,
    ILogger<CacheWarmupService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Warming up cache...");

        await using var scope = scopeFactory.CreateAsyncScope();
        var cache = scope.ServiceProvider.GetRequiredService<IMemoryCache>();
        var db    = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var categories = await db.Categories.ToListAsync(cancellationToken);
        cache.Set("categories", categories, TimeSpan.FromHours(1));

        logger.LogInformation("Cache warmed with {Count} categories.", categories.Count);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Cache warmup service stopping.");
        return Task.CompletedTask;
    }
}

builder.Services.AddHostedService<CacheWarmupService>();`,
  },
];

const challenge: Challenge = {
  title: 'Email Dispatch Worker',
  language: 'csharp',
  description: 'Build a background email dispatch system:\n1. Create `IEmailQueue` backed by a bounded `Channel<EmailMessage>` (capacity 50).\n2. Create `EmailDispatchWorker : BackgroundService` that reads from the channel and calls `IEmailSender.SendAsync()`.\n3. Create a minimal API endpoint `POST /send-email` that enqueues the message.\n4. The worker must use `IServiceScopeFactory` to resolve the scoped `IEmailSender`.',
  hints: [
    'Register IEmailQueue as Singleton (channel lives for the app lifetime)',
    'Use Channel.CreateBounded with BoundedChannelFullMode.Wait for backpressure',
    'In the worker, await foreach over queue.ReadAllAsync(stoppingToken)',
    'CreateAsyncScope() per email to avoid scope leaks',
  ],
  starterCode: `public record EmailMessage(string To, string Subject, string Body);

public interface IEmailSender
{
    Task SendAsync(EmailMessage msg);
}

public class FakeEmailSender(ILogger<FakeEmailSender> logger) : IEmailSender
{
    public Task SendAsync(EmailMessage msg)
    {
        logger.LogInformation("Sending to {To}: {Subject}", msg.To, msg.Subject);
        return Task.CompletedTask;
    }
}`,
  solution: `public interface IEmailQueue
{
    ValueTask EnqueueAsync(EmailMessage msg, CancellationToken ct = default);
    IAsyncEnumerable<EmailMessage> ReadAllAsync(CancellationToken ct = default);
}

public class EmailQueue : IEmailQueue
{
    private readonly Channel<EmailMessage> _ch =
        Channel.CreateBounded<EmailMessage>(new BoundedChannelOptions(50)
            { FullMode = BoundedChannelFullMode.Wait });

    public ValueTask EnqueueAsync(EmailMessage msg, CancellationToken ct = default)
        => _ch.Writer.WriteAsync(msg, ct);

    public IAsyncEnumerable<EmailMessage> ReadAllAsync(CancellationToken ct = default)
        => _ch.Reader.ReadAllAsync(ct);
}

public class EmailDispatchWorker(IEmailQueue queue, IServiceScopeFactory sf) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await foreach (var msg in queue.ReadAllAsync(ct))
        {
            await using var scope = sf.CreateAsyncScope();
            var sender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
            await sender.SendAsync(msg);
        }
    }
}

builder.Services.AddScoped<IEmailSender, FakeEmailSender>();
builder.Services.AddSingleton<IEmailQueue, EmailQueue>();
builder.Services.AddHostedService<EmailDispatchWorker>();

app.MapPost("/send-email", async (EmailMessage msg, IEmailQueue queue) =>
{
    await queue.EnqueueAsync(msg);
    return Results.Accepted();
});`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Why can\'t you inject a scoped DbContext directly into a BackgroundService?',
    options: [
      'BackgroundService does not support constructor injection',
      'BackgroundService is a singleton; injecting a scoped service creates a captive dependency that throws at startup',
      'DbContext is not thread-safe',
      'BackgroundService runs before the DI container is built',
    ],
    answer: 1,
    explanation: 'The DI container validates that singletons don\'t depend on shorter-lived scoped services. The captive dependency check throws InvalidOperationException at startup. Inject IServiceScopeFactory instead and create a fresh scope per unit of work.',
  },
  {
    q: 'What does PeriodicTimer.WaitForNextTickAsync return when the timer is disposed?',
    options: [
      'It throws OperationCanceledException',
      'It returns null',
      'It returns false, cleanly exiting the while loop',
      'It blocks indefinitely',
    ],
    answer: 2,
    explanation: 'WaitForNextTickAsync returns false when the timer is disposed, making while(await timer.WaitForNextTickAsync(ct)) the idiomatic clean exit — no extra cancellation check needed. Passing the stoppingToken allows cancellation before the next tick.',
  },
  {
    q: 'Which BoundedChannelFullMode applies backpressure to the producer?',
    options: ['DropOldest', 'DropNewest', 'DropWrite', 'Wait'],
    answer: 3,
    explanation: 'BoundedChannelFullMode.Wait makes WriteAsync await until space is available, providing natural backpressure. Other modes silently drop messages — only acceptable for fire-and-forget logging or metrics, never for business-critical operations like email or payment.',
  },
  {
    q: 'In .NET 8+, what happens by default when a BackgroundService throws an unhandled exception from ExecuteAsync?',
    options: [
      'The worker restarts automatically',
      'The exception is swallowed and the worker stops silently',
      'The host shuts down (StopHost behaviour)',
      'The exception is propagated to the first HTTP request',
    ],
    answer: 2,
    explanation: 'In .NET 8+, BackgroundServiceExceptionBehavior defaults to StopHost — an unhandled exception in a hosted service triggers a graceful shutdown of the entire host. In older .NET versions, the worker stopped silently. Always wrap your loop body in try/catch to handle transient errors without killing the host.',
  },
  {
    q: 'What is the correct way to process items from a Channel<T> in a BackgroundService?',
    options: [
      'channel.Reader.TryRead(out var item) in a while(true) loop',
      'await foreach (var item in channel.Reader.ReadAllAsync(stoppingToken))',
      'Task.Run(() => channel.Reader.ReadAllAsync())',
      'channel.Reader.ReadAsync() in a while loop without await',
    ],
    answer: 1,
    explanation: 'ReadAllAsync(ct) returns IAsyncEnumerable<T> — the cleanest consumer pattern. It awaits each item asynchronously, respects cancellation, and completes when the channel is marked complete or the token fires. TryRead() is non-blocking and requires a spin loop that wastes CPU.',
  },
  {
    q: 'When is Channel<T> NOT sufficient and you should use a message broker instead?',
    options: [
      'When processing more than 10 items per second',
      'When work must survive pod restarts, require ordered delivery, or fan out to multiple consumers',
      'When using .NET 6 or earlier',
      'When the channel consumer is a BackgroundService',
    ],
    answer: 1,
    explanation: 'Channel<T> is in-process only — all data is lost on pod restart. Message brokers (Azure Service Bus, RabbitMQ, SQS) provide durability (messages survive restarts), at-least-once delivery, dead-letter queues, and fan-out to multiple subscribers. Use Channel<T> for best-effort in-process queuing; use a broker for critical business workflows.',
  },
  {
    q: 'How do you increase the default shutdown timeout for BackgroundService workers?',
    options: [
      'Set BackgroundService.ShutdownTimeout static property',
      'Configure HostOptions.ShutdownTimeout in AddHostedService()',
      'Configure HostOptions.ShutdownTimeout via services.Configure<HostOptions>()',
      'The timeout cannot be changed — it is fixed at 30 seconds',
    ],
    answer: 2,
    explanation: 'services.Configure<HostOptions>(opts => opts.ShutdownTimeout = TimeSpan.FromMinutes(2)) extends the graceful shutdown window. The default is 30 seconds — if all hosted services don\'t complete StopAsync within that window, the host forces exit. Increase it for workers that process long-running jobs.',
  },
  {
    q: 'What is the correct lifetime to register an IEmailQueue (backed by Channel<T>) in DI?',
    options: [
      'Scoped — one queue per HTTP request',
      'Transient — new channel per injection',
      'Singleton — one channel shared across all producers and the consumer',
      'Either Scoped or Singleton — it does not matter for channels',
    ],
    answer: 2,
    explanation: 'The Channel<T> is the shared buffer between producers (HTTP handlers) and the consumer (BackgroundService). Registering it as Transient or Scoped would create a new, independent channel on each injection — the producer writes to one channel, the worker reads from a different one. Singleton is mandatory for a shared queue.',
  },
  {
    q: 'How should you handle a fatal error in a BackgroundService that means the service can no longer function?',
    options: [
      'throw new FatalException() — the DI container restarts the service',
      'return from ExecuteAsync — the host detects the exit and restarts the worker',
      'Inject IHostApplicationLifetime and call StopApplication() to trigger a clean host shutdown',
      'Log the error and spin in an infinite loop',
    ],
    answer: 2,
    explanation: 'IHostApplicationLifetime.StopApplication() triggers a graceful shutdown of all hosted services — allowing in-flight work to complete before exit. Simply returning from ExecuteAsync stops that specific worker but leaves the host and other services running, which may be incorrect if the failed worker is critical. Rethrowing causes the .NET 8+ StopHost behavior.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Calling StopApplication() from inside a BackgroundService triggers a graceful shutdown — but does StopApplication() itself wait for that shutdown to complete before returning control to the code that called it?',
    a: 'No — StopApplication() is fire-and-forget from the caller\'s perspective: it signals the host\'s CancellationTokenSource for shutdown and returns immediately, it does not block until every hosted service has actually finished stopping. This matters because code immediately after the StopApplication() call in your BackgroundService keeps executing during the shutdown window — if that code assumes the app has already stopped or tries to do more work assuming a clean slate, it can race against other services\' own shutdown logic (including its own StopAsync being invoked concurrently). The safe pattern is treating StopApplication() as "request shutdown" and structuring the calling code so nothing depends on the shutdown having completed by the time the call returns — let the host\'s own orchestration (respecting each service\'s StopAsync and the configured shutdown timeout) handle the actual teardown sequencing.',
  },
  {
    q: 'Can I run multiple instances of the same BackgroundService?',
    a: 'Not with AddHostedService — it registers a single instance. To run N workers, register N times with AddHostedService, or use a supervisor pattern where one BackgroundService manages a pool of Tasks started via Task.WhenAll.',
  },
  {
    q: 'What is the difference between Channel<T> and BlockingCollection<T>?',
    a: 'Channel<T> is async-native — WriteAsync and ReadAllAsync return ValueTask/IAsyncEnumerable, so the worker thread is not blocked while waiting. BlockingCollection is synchronous and ties up a thread, which can starve the thread pool under load. Always prefer Channel<T> in modern ASP.NET Core.',
  },
  {
    q: 'How do I expose a BackgroundService\'s health state via health checks?',
    a: 'Create an IHealthCheck that reads a shared field (e.g., DateTime LastProcessedAt) updated by the worker on each successful iteration. If the field is too old (e.g., > 5 minutes), return Unhealthy. Register with <code>services.AddHealthChecks().AddCheck&lt;WorkerHealthCheck&gt;("my-worker")</code>. The worker updates the field; the health check reads it — no direct coupling needed.',
  },
  {
    q: 'Why should you avoid doing heavy initialization work in StartAsync?',
    a: 'StartAsync blocks the startup sequence — the host waits for all StartAsync methods to complete before it starts accepting HTTP requests. A slow StartAsync (e.g., loading 10,000 products into cache) delays the entire startup. Instead, do initialization at the top of ExecuteAsync before the main loop. The app starts accepting traffic immediately; the worker initializes in the background.',
  },
  {
    q: 'How can a BackgroundService process items in parallel rather than sequentially?',
    a: 'Read N items from the channel as a batch, then <code>await Task.WhenAll(batch.Select(ProcessAsync))</code>. Control max concurrency with a SemaphoreSlim: <code>await semaphore.WaitAsync(ct)</code> before each item, release in a finally block. This allows e.g. 5 concurrent email sends without unbounded parallelism.',
  },
  {
    q: 'Is it safe to share state between the HTTP request pipeline and a BackgroundService?',
    a: 'Only if the shared state is thread-safe. Channel<T> is designed for this — concurrent writers (HTTP handlers) and a single reader (worker) are explicitly supported. For other shared state (counters, flags), use <code>Interlocked</code> operations or a <code>ConcurrentDictionary</code>. Avoid using plain fields or non-thread-safe collections shared between request threads and the background thread.',
  },
  {
    q: 'How do I make a BackgroundService wait for the application to fully start before beginning work?',
    a: 'Inject IHostApplicationLifetime and await the ApplicationStarted token: <code>await Task.Delay(Timeout.Infinite, hostLifetime.ApplicationStarted)</code> (this completes when the token fires). Or register a callback: <code>hostLifetime.ApplicationStarted.Register(() => { ... })</code>. This ensures the worker begins after all middleware is configured, the DB is seeded, and HTTP is accepting requests.',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Injecting a scoped service directly into BackgroundService',
    wrong: `public class OutboxWorker(
    AppDbContext db,           // Scoped service in a Singleton!
    IEmailService emailSvc) : BackgroundService
{
    // Throws InvalidOperationException at startup:
    // "Cannot consume scoped service from singleton"
}`,
    right: `public class OutboxWorker(IServiceScopeFactory sf) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            await using var scope = sf.CreateAsyncScope();
            var db  = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var svc = scope.ServiceProvider.GetRequiredService<IEmailService>();
            // ... process work ...
        }
    }
}`,
    explanation: 'BackgroundService is a Singleton. Injecting Scoped services creates a captive dependency — the DI container throws at startup. Inject IServiceScopeFactory and create a fresh scope per unit of work to properly manage scoped service lifetimes.',
  },
  {
    title: 'Not passing stoppingToken to async calls',
    wrong: `protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        await DoWorkAsync();                    // No ct!
        await Task.Delay(TimeSpan.FromSeconds(5)); // Blocks shutdown for 5s!
    }
}`,
    right: `protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        await DoWorkAsync(stoppingToken);
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
    }
}`,
    explanation: 'Not passing stoppingToken means async operations cannot be cancelled during shutdown. Task.Delay without a token blocks for the full delay even as the host waits for the worker to stop — causing the shutdown to hang until the delay completes or the timeout fires.',
  },
  {
    title: 'Registering Channel<T> / IEmailQueue as Scoped or Transient',
    wrong: `// New channel instance per injection — producer and consumer never share the same channel!
builder.Services.AddScoped<IEmailQueue, EmailQueue>();
// HTTP handler writes to channel A; worker reads from channel B (different instance)`,
    right: `// One channel shared across the entire app lifetime
builder.Services.AddSingleton<IEmailQueue, EmailQueue>();
builder.Services.AddHostedService<EmailDispatchWorker>();`,
    explanation: 'A Channel<T>-backed queue must be Singleton. The HTTP handler (producer) and BackgroundService (consumer) must reference the same channel instance. Scoped or Transient registration creates separate channel instances per injection, so enqueued messages are never consumed.',
  },
  {
    title: 'Using Task.Delay in a loop instead of PeriodicTimer',
    wrong: `protected override async Task ExecuteAsync(CancellationToken ct)
{
    while (!ct.IsCancellationRequested)
    {
        await ProcessAsync(ct);            // Takes variable time
        await Task.Delay(10_000, ct);      // Drifts: 10s + work time = >10s between ticks
    }
}`,
    right: `protected override async Task ExecuteAsync(CancellationToken ct)
{
    using var timer = new PeriodicTimer(TimeSpan.FromSeconds(10));
    while (await timer.WaitForNextTickAsync(ct))
    {
        await ProcessAsync(ct);
        // Next tick fires exactly 10s from the previous tick start — no drift
    }
}`,
    explanation: 'Task.Delay measures from the end of work, so each iteration takes delay + work time. PeriodicTimer measures from the start of the previous tick — work duration is compensated for. Over hours, Task.Delay drifts significantly for time-sensitive jobs like scheduled reports.',
  },
  {
    title: 'Silently swallowing all exceptions in the worker loop',
    wrong: `protected override async Task ExecuteAsync(CancellationToken ct)
{
    while (!ct.IsCancellationRequested)
    {
        try { await DoWorkAsync(ct); }
        catch { }   // Swallows OperationCanceledException — shutdown blocks!
    }
}`,
    right: `protected override async Task ExecuteAsync(CancellationToken ct)
{
    while (!ct.IsCancellationRequested)
    {
        try
        {
            await DoWorkAsync(ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            break;   // Clean shutdown — exit the loop
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Worker error — retrying after delay.");
            await Task.Delay(TimeSpan.FromSeconds(5), ct);
        }
    }
}`,
    explanation: 'Catching all exceptions including OperationCanceledException prevents the worker from exiting cleanly on shutdown — the host waits for it until the shutdown timeout expires. Always let OperationCanceledException propagate (or break the loop) when the stoppingToken is cancelled.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'BackgroundService is a Singleton that runs ExecuteAsync() for the app lifetime; use IServiceScopeFactory for scoped dependencies; PeriodicTimer for non-drifting periodic tasks; Channel<T> (Singleton) for in-process producer-consumer queuing.',
  mustKnow: [
    '<code>BackgroundService</code> is a Singleton — never inject Scoped services; use <code>IServiceScopeFactory</code> and create a scope per work unit',
    'Always pass <code>stoppingToken</code> to every <code>await</code> call — required for graceful shutdown',
    '<code>PeriodicTimer.WaitForNextTickAsync(ct)</code> ticks without drift and returns <code>false</code> when disposed',
    '<code>Channel&lt;T&gt;</code> must be Singleton — producers and consumer share the same channel instance',
    '<code>BoundedChannelFullMode.Wait</code> applies backpressure; <code>Drop*</code> modes silently lose messages',
    'In .NET 8+, unhandled exceptions in <code>ExecuteAsync</code> trigger host shutdown (StopHost behaviour)',
    'Channel is in-process only — use a message broker (MassTransit, Azure Service Bus) for durability across restarts',
  ],
  interviewFocus: [
    'Captive dependency problem: why you cannot inject DbContext into BackgroundService and how to fix it',
    'PeriodicTimer vs Task.Delay — drift, return value on dispose, idiomatic loop pattern',
    'Channel<T> registration lifetime and why it must be Singleton',
    'Graceful shutdown: stoppingToken propagation and IHostApplicationLifetime.StopApplication()',
  ],
};

@Component({
  selector: 'app-aspnet-background-services',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './background-services.html',
  styleUrl: './background-services.scss',
})
export class AspnetBackgroundServices {
  prerequisites = prerequisites;
  quickRef      = quickRef;
  theory        = theory;
  codeTabs      = codeTabs;
  challenge     = challenge;
  quiz          = quiz;
  qna           = qna;
  mistakes      = mistakes;
  revision      = revision;
}
