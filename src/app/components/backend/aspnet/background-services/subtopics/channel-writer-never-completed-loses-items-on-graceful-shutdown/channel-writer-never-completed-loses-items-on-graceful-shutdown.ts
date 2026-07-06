import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-channel-writer-shutdown-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './channel-writer-never-completed-loses-items-on-graceful-shutdown.html',
  styleUrl: './channel-writer-never-completed-loses-items-on-graceful-shutdown.scss',
})
export class ChannelWriterNeverCompletedLosesItemsOnGracefulShutdownSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own EmailQueue/EmailDispatchWorker example never calls channel.Writer.Complete() anywhere — meaning the worker\'s await foreach (var msg in queue.ReadAllAsync(stoppingToken)) loop has exactly ONE way to exit: the stoppingToken firing and being observed as a thrown OperationCanceledException, which happens on EVERY graceful shutdown, not just crashes',
      points: [
        '<code>ReadAllAsync(ct)</code> completes NORMALLY (the <code>await foreach</code> loop simply ends, no exception) only when the channel\'s writer side calls <code>Writer.Complete()</code> AND every already-enqueued item has been read. Without ever calling <code>Complete()</code>, the ONLY way <code>ReadAllAsync</code> stops is via the <code>CancellationToken</code> passed to it — which, for a <code>BackgroundService</code>, is the <code>stoppingToken</code> that fires the moment the HOST begins graceful shutdown, cancelling the read mid-operation regardless of how many items are still sitting in the channel\'s buffer, unprocessed.',
        'The main page\'s own theory distinguishes "best-effort" loss (acceptable) from durability guarantees a message broker would provide, but frames the loss scenario specifically as "does not survive a pod restart" — implicitly a CRASH or a hard kill. A GRACEFUL shutdown (a routine deploy, a Kubernetes rolling update scaling a pod down, an intentional restart) is a fundamentally different, much MORE FREQUENT event than a crash — and without <code>Writer.Complete()</code> plus a drain step, this exact "acceptable on crash" pattern ALSO silently discards buffered items on every single routine deploy, which is a materially different (and usually unintended) reliability characteristic.',
      ],
    },
    {
      heading: 'The fix requires coordinating TWO signals that are otherwise independent: telling the CHANNEL no more items will be written (Writer.Complete()) and telling the WORKER\'S LOOP to keep draining already-buffered items even as shutdown begins, rather than exiting immediately on cancellation',
      points: [
        '<code>IHostApplicationLifetime.ApplicationStopping</code> fires at the START of graceful shutdown — BEFORE hosted services\' <code>StopAsync</code> is called — making it the correct place to call <code>queue.Writer.Complete()</code>, signaling "no more producers will write" while there may still be time for the worker to finish reading what\'s already buffered.',
        'The worker\'s loop then needs to distinguish "stop accepting NEW work" from "stop immediately, mid-read" — reading with <code>CancellationToken.None</code> (or a SEPARATE token that is NOT the <code>stoppingToken</code>) for the drain phase lets <code>ReadAllAsync</code> complete NORMALLY once the channel is both completed and empty, rather than being interrupted by the same token that also triggers <code>StopAsync</code>\'s shutdown-timeout countdown — which still bounds the TOTAL time available, just without prematurely cancelling an in-progress drain.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own pattern, reproduced — items lost on every graceful shutdown, not just crashes',
      language: 'csharp',
      code: `// EmailQueue and EmailDispatchWorker exactly as the main page shows them —
// Writer.Complete() is never called anywhere in the app:
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
        // This line is NEVER reached in normal operation — the only
        // way out of the await foreach is stoppingToken cancellation,
        // which THROWS rather than completing the loop normally.
    }
}

// Timeline of a ROUTINE deploy (not a crash):
//   t=0     A rolling deployment begins; Kubernetes sends SIGTERM to
//           the old pod, triggering ASP.NET Core's graceful shutdown.
//   t=0     stoppingToken is cancelled. The worker's "await foreach"
//           throws OperationCanceledException immediately — even if
//           5 emails are sitting in the channel's buffer, enqueued by
//           HTTP handlers moments earlier and never yet read.
//   t=0+    ExecuteAsync exits (the exception propagates and is
//           handled by BackgroundService's own machinery). Those 5
//           buffered emails are gone — never sent, no error logged
//           anywhere, no trace they ever existed once the process exits.
//   t=30s   Shutdown timeout would have allowed 30 full seconds to
//           drain the buffer — none of that time was used, because
//           nothing signals the loop to keep draining before exiting.`,
    },
    {
      label: 'The fix — complete the writer at shutdown START, drain before honoring cancellation',
      language: 'csharp',
      code: `public class EmailDispatchWorker(
    IEmailQueue queue,
    IServiceScopeFactory scopeFactory,
    IHostApplicationLifetime lifetime) : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Registered BEFORE StopAsync is ever called — signals the
        // channel that no more producers will write, WITHOUT cutting
        // off the worker's ability to keep reading what's buffered:
        lifetime.ApplicationStopping.Register(() => queue.Complete());

        // Read with CancellationToken.None for the DRAIN itself — the
        // loop exits NORMALLY once the channel is both completed and
        // empty, rather than being interrupted mid-item by stoppingToken:
        return ProcessQueueAsync(CancellationToken.None);
    }

    private async Task ProcessQueueAsync(CancellationToken drainToken)
    {
        await foreach (var msg in queue.ReadAllAsync(drainToken))
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var sender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
            await sender.SendAsync(msg);
        }
        // NOW this line IS reached — once Complete() has been called
        // AND every buffered item has been read, ReadAllAsync finishes
        // normally instead of throwing.
    }
}

// IEmailQueue needs a Complete() method exposed alongside Enqueue/ReadAll:
public interface IEmailQueue
{
    ValueTask EnqueueAsync(EmailMessage msg, CancellationToken ct = default);
    IAsyncEnumerable<EmailMessage> ReadAllAsync(CancellationToken ct = default);
    void Complete();   // <-- new: signals no more writes are coming
}
public class EmailQueue : IEmailQueue
{
    private readonly Channel<EmailMessage> _channel = /* ... as before ... */;
    // ...
    public void Complete() => _channel.Writer.Complete();
}

// The overall shutdown timeout (default 30s, HostOptions.ShutdownTimeout)
// still bounds the TOTAL time available to drain — this fix uses that
// window productively instead of discarding buffered work at t=0.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team applies this fix but forgets one detail: they call queue.Complete() from ApplicationStopping as shown, but leave the worker\'s read loop using the ORIGINAL stoppingToken (not CancellationToken.None or a separate drain token). What actually happens to buffered items in this half-fixed version, and why does calling Complete() alone not fully solve the problem?',
    hint: 'ApplicationStopping and the BackgroundService\'s own stoppingToken are typically linked to fire around the same time (both signal "shutdown has begun"). If the READ operation is still cancelled by stoppingToken, does it matter that the channel was ALSO told "no more writes are coming"?',
    solution: `Calling queue.Complete() alone does not solve the problem, because
the RACE is between two independent things: the channel transitioning
to "completed and drained" (which requires TIME for the read loop to
process each buffered item) versus the stoppingToken firing and
cancelling the read outright. If the read loop is still awaiting
ReadAllAsync(stoppingToken) — the SAME token used before — then the
moment stoppingToken is cancelled (which happens at essentially the
same time as ApplicationStopping, since both are triggered by the same
shutdown sequence), the read throws OperationCanceledException
immediately, exactly as before Complete() was ever added. Marking the
channel complete tells ReadAllAsync "no MORE items will ever be
written after what's already buffered" — but it does nothing to
extend how long the read is ALLOWED to keep running past the
cancellation signal. The buffered items are still discarded, just as
in the original broken version — Complete() by itself only matters if
something is ALSO giving the read loop permission to keep running
after stoppingToken fires.

This is precisely why the working fix uses CancellationToken.None (or
a distinct, separately-controlled token) for the drain read, rather
than reusing stoppingToken: the two signals need to be decoupled.
Complete() tells the channel "the write side is done, no new items are
coming" — a statement about the PRODUCER side. The token passed to
ReadAllAsync controls whether the CONSUMER side is allowed to keep
running — and if that token is the same one that fires at shutdown,
the consumer never gets the chance to actually observe and act on the
"no more writes are coming, but please finish reading what's there"
signal Complete() was meant to enable.

The general lesson: "signal completion" and "extend the time allowed
to respond to that signal" are two separate concerns that must be
wired independently — fixing only one of them (adding Complete() while
still cancelling the read with the same token that triggers shutdown)
looks like progress in code review but changes nothing about the
actual runtime behavior during a real deploy.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own statement — "Channel<T> is in-process only... appropriate for fire-and-forget or best-effort workloads where loss on restart is acceptable" — means item loss on a routine, graceful deploy is an accepted, understood trade-off of this pattern.',
      reality: 'without calling Writer.Complete() and structuring the worker to drain remaining buffered items before honoring cancellation, EVERY graceful shutdown (a routine deploy or scale-down, not just a crash) silently discards enqueued-but-unprocessed items — a materially worse reliability characteristic than "best effort, survives everything except a crash," and one the main page\'s example does not actually implement.',
    },
    {
      thought: 'calling channel.Writer.Complete() from an ApplicationStopping callback is sufficient by itself to ensure buffered items get processed before shutdown.',
      reality: 'Complete() only signals that no MORE items will be written — it does nothing to extend how long the read loop is allowed to keep running; if the read is still driven by the same stoppingToken that fires at shutdown, the read is cancelled at the same moment regardless of Complete() having been called, and buffered items are still lost.',
    },
    {
      thought: 'IHostApplicationLifetime.ApplicationStopping and a BackgroundService\'s own stoppingToken parameter are unrelated signals that happen to have similar-sounding names.',
      reality: 'they are triggered by the same underlying shutdown sequence and fire at essentially the same point in time — which is exactly why reusing stoppingToken for a drain-phase read defeats the purpose of a separate Complete() signal; the drain read needs a genuinely different, uncancelled token to have any chance of running longer than the moment shutdown begins.',
    },
  ];
}
