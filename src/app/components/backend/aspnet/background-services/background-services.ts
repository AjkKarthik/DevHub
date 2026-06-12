import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

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
      '<code>IHostedService</code> gives you <code>StartAsync</code> and <code>StopAsync</code>. <code>BackgroundService</code> implements those for you — just override <code>ExecuteAsync</code> and write your loop.',
      'The host calls <code>StartAsync</code> at startup and cancels <code>stoppingToken</code> when the application shuts down. Your loop must observe that token for a graceful shutdown.',
      'If <code>ExecuteAsync</code> throws an unhandled exception the worker stops silently. Wrap your main loop in a try/catch and log all errors.',
    ],
  },
  {
    heading: 'Scoped services inside a singleton worker',
    points: [
      '<code>BackgroundService</code> is registered as a singleton (runs for the app lifetime). <code>DbContext</code> and most business services are scoped.',
      'Injecting a scoped service directly into a singleton creates a "captive dependency" — the DI container throws <code>InvalidOperationException</code> at startup.',
      'Solution: inject <code>IServiceScopeFactory</code> and call <code>CreateAsyncScope()</code> per unit of work to resolve the scoped service inside a fresh scope.',
    ],
  },
  {
    heading: 'PeriodicTimer (.NET 6+)',
    points: [
      '<code>PeriodicTimer.WaitForNextTickAsync</code> ticks relative to the start time — it does not drift when work takes variable time.',
      'Returns <code>false</code> when the timer is disposed, making <code>while (await timer.WaitForNextTickAsync(ct))</code> the idiomatic clean loop — no try/catch needed for <code>OperationCanceledException</code>.',
      'Prefer this over <code>Task.Delay</code> in a loop for any periodic background task (.NET 6+).',
    ],
  },
  {
    heading: 'Queued background work with Channel<T>',
    points: [
      '<code>Channel&lt;T&gt;</code> is the recommended in-process queue. The HTTP handler writes to <code>ChannelWriter</code>; the worker reads from <code>ChannelReader</code>.',
      'Use <code>Channel.CreateBounded(capacity)</code> with <code>BoundedChannelFullMode.Wait</code> to apply backpressure — the writer awaits when the channel is full instead of buffering indefinitely.',
      'For durable queues across restarts (survives pod restart, ordered delivery), use a message broker: Azure Service Bus, RabbitMQ, or AWS SQS.',
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
    explanation: 'The DI container validates that singletons don\'t depend on shorter-lived scoped services. The captive dependency check throws InvalidOperationException at startup.',
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
    explanation: 'WaitForNextTickAsync returns false when the timer is disposed, making while(await timer.WaitForNextTickAsync(ct)) the idiomatic clean exit — no extra cancellation check needed.',
  },
  {
    q: 'Which BoundedChannelFullMode applies backpressure to the producer?',
    options: ['DropOldest', 'DropNewest', 'DropWrite', 'Wait'],
    answer: 3,
    explanation: 'BoundedChannelFullMode.Wait makes WriteAsync await until space is available, providing natural backpressure. Other modes silently drop messages.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'How do I stop a BackgroundService on a fatal error?',
    a: 'Inject IHostApplicationLifetime and call hostLifetime.StopApplication() inside the catch block. This triggers a graceful shutdown of the entire host, giving other services a chance to complete.',
  },
  {
    q: 'Can I run multiple instances of the same BackgroundService?',
    a: 'Not with AddHostedService — it registers a single instance. To run N workers, register N times with AddHostedService, or use a supervisor pattern where one BackgroundService manages a pool of Tasks started via Task.WhenAll.',
  },
  {
    q: 'What is the difference between Channel<T> and BlockingCollection<T>?',
    a: 'Channel<T> is async-native — WriteAsync and ReadAllAsync return ValueTask/IAsyncEnumerable, so the worker thread is not blocked while waiting. BlockingCollection is synchronous and ties up a thread, which can starve the thread pool under load.',
  },
];

@Component({
  selector: 'app-aspnet-background-services',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent],
  templateUrl: './background-services.html',
  styleUrl: './background-services.scss',
})
export class AspnetBackgroundServices {
  quickRef  = quickRef;
  theory    = theory;
  codeTabs  = codeTabs;
  challenge = challenge;
  quiz      = quiz;
  qna       = qna;
}
