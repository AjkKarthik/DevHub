import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-disposed-but-still-running-event-handler-fire-and-forget-outlives-dispose-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './disposed-but-still-running-event-fire-forget.html',
  styleUrl: './disposed-but-still-running-event-fire-forget.scss',
})
export class DisposedButStillRunningEventHandlerFireAndForgetOutlivesDisposeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Dispose() returning does not mean every reference to the object is gone — that assumption is the bug',
      points: [
        'The main GC & IDisposable page\'s <code>_disposed</code> guard pattern correctly prevents the SAME object\'s own public methods from being used after disposal, throwing <code>ObjectDisposedException</code>. But nothing about calling <code>Dispose()</code> prevents OTHER code that already holds a reference to that object — an event subscription, or a fire-and-forget async lambda captured earlier — from continuing to run and touch it, potentially AFTER Dispose() has already released its resources.',
      ],
    },
    {
      heading: 'An event subscription is a live reference the subscriber controls, not the publisher',
      points: [
        'If a disposable object subscribes ANOTHER object\'s event (<code>otherObject.SomethingHappened += OnSomethingHappened;</code>) and is disposed, but never explicitly UNSUBSCRIBES first, the event publisher still holds a live delegate reference to the (now-disposed) subscriber\'s method. The next time that event fires, <code>OnSomethingHappened</code> runs against an object whose fields may have already been nulled out or whose <code>_disposed</code> guard now throws — exactly the confusing failure the main page\'s Common Mistakes section warns about, but arriving from an entirely different, external trigger rather than a direct caller mistake.',
        'The fix mirrors the dispose pattern itself: unsubscribe from every external event INSIDE <code>Dispose()</code>, symmetric to however the subscription was originally added — this is a genuinely common gap, since <code>Dispose()</code> implementations focus heavily on releasing FIELDS the object owns, and easily forget event subscriptions the object merely PARTICIPATES in.',
      ],
    },
    {
      heading: 'A fire-and-forget async operation started before Dispose() keeps running independently of it',
      points: [
        'If a method starts an async operation WITHOUT awaiting it (a "fire-and-forget" call, e.g. <code>_ = DoBackgroundWorkAsync();</code>) that captures <code>this</code> or one of the object\'s fields, calling <code>Dispose()</code> shortly after does nothing to stop that already-running task — it continues executing on its own schedule, and if it touches a field the <code>Dispose()</code> call just released or nulled, it can throw <code>NullReferenceException</code> or <code>ObjectDisposedException</code> from a background continuation, often well after the method that called <code>Dispose()</code> has already returned.',
        'The correct pattern is to hold a <code>CancellationTokenSource</code> as a field, pass its token into every fire-and-forget operation the object starts, and call <code>Cancel()</code> as PART of <code>Dispose()</code> — this at least signals the background work to stop at its next cancellation check point, though it still cannot forcibly interrupt code that never checks the token at all.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — an unsubscribed event handler outlives Dispose()',
      language: 'csharp',
      code: `public class PriceWatcher : IDisposable
{
    private readonly MarketFeed _feed;
    private decimal _lastPrice;
    private bool _disposed;

    public PriceWatcher(MarketFeed feed)
    {
        _feed = feed;
        _feed.PriceChanged += OnPriceChanged; // subscribes to an EXTERNAL event
    }

    private void OnPriceChanged(decimal newPrice) => _lastPrice = newPrice;

    public void Dispose()
    {
        if (_disposed) return;
        // BUG: never unsubscribes from _feed.PriceChanged —
        // the feed still holds a live reference to OnPriceChanged
        _disposed = true;
    }
}

// Elsewhere:
var watcher = new PriceWatcher(sharedFeed);
watcher.Dispose();

// Later, when sharedFeed fires PriceChanged again — OnPriceChanged
// STILL runs, against an object that thinks it's fully disposed:
sharedFeed.RaisePriceChanged(105.50m); // silently updates _lastPrice
                                        // on a "disposed" object`,
    },
    {
      label: 'The fix — unsubscribe inside Dispose(), symmetric to the subscription',
      language: 'csharp',
      code: `public class PriceWatcher : IDisposable
{
    private readonly MarketFeed _feed;
    private decimal _lastPrice;
    private bool _disposed;

    public PriceWatcher(MarketFeed feed)
    {
        _feed = feed;
        _feed.PriceChanged += OnPriceChanged;
    }

    private void OnPriceChanged(decimal newPrice) => _lastPrice = newPrice;

    public void Dispose()
    {
        if (_disposed) return;
        _feed.PriceChanged -= OnPriceChanged; // symmetric unsubscribe
        _disposed = true;
    }
}

// Now, after Dispose(), the feed no longer holds a reference to
// OnPriceChanged at all — subsequent PriceChanged events genuinely
// cannot reach this instance anymore.`,
    },
    {
      label: 'Fire-and-forget async work outliving Dispose() — and the CancellationTokenSource fix',
      language: 'csharp',
      code: `public class BackgroundSyncer : IDisposable
{
    private readonly CancellationTokenSource _cts = new();
    private State? _state;
    private bool _disposed;

    public void StartSync()
    {
        // fire-and-forget — NOT awaited by the caller
        _ = SyncLoopAsync(_cts.Token);
    }

    private async Task SyncLoopAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(1000, ct);
            _state?.Refresh(); // could run AFTER Dispose() nulls _state,
                                // if the token is never checked in time
        }
    }

    public void Dispose()
    {
        if (_disposed) return;
        _cts.Cancel();   // signals the loop to stop at its next check —
                         // does NOT forcibly interrupt code mid-execution
        _state = null;
        _disposed = true;
    }
}

// Even with cancellation wired up correctly, a background iteration
// already PAST its cancellation check (e.g. mid-await inside Refresh())
// can still touch _state in the brief window before it observes the
// token — this is why _state?.Refresh() (a null-conditional call) is
// itself part of the defense, not just the CancellationTokenSource.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A class subscribes to <code>Application.Idle += OnIdle;</code> in its constructor and implements <code>Dispose()</code> with only a <code>_disposed = true;</code> assignment. Explain the concrete failure that can occur, and the fix.',
    hint: 'Consider what the Application.Idle publisher still holds after Dispose() runs, and what happens the next time that event fires.',
    solution: `public class IdleLogger : IDisposable
{
    private bool _disposed;

    public IdleLogger() => Application.Idle += OnIdle; // subscribes

    private void OnIdle(object? sender, EventArgs e)
        => Console.WriteLine("app went idle");

    public void Dispose()
    {
        // BUG: no unsubscribe — Application still holds a live
        // delegate reference to OnIdle after this returns
        _disposed = true;
    }
}

// Failure: after Dispose(), the NEXT time the application actually
// goes idle, Application.Idle still fires, and OnIdle STILL runs on
// this "disposed" IdleLogger instance — logging a message from an
// object the caller believes has been fully cleaned up. If OnIdle
// touched any field that Dispose() had released or nulled, this would
// throw instead of merely logging unexpectedly.

// Fix — unsubscribe symmetrically inside Dispose():
public class IdleLoggerFixed : IDisposable
{
    private bool _disposed;
    public IdleLoggerFixed() => Application.Idle += OnIdle;
    private void OnIdle(object? sender, EventArgs e)
        => Console.WriteLine("app went idle");

    public void Dispose()
    {
        if (_disposed) return;
        Application.Idle -= OnIdle; // now Application holds NO
                                     // reference to this instance
        _disposed = true;
    }
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'once Dispose() returns, no code anywhere can still call methods on that object.',
      reality: 'any external event subscription or fire-and-forget async operation started before disposal still holds a live reference and can continue running afterward, unless Dispose() explicitly unsubscribes or signals cancellation.',
    },
    {
      thought: 'the _disposed guard pattern (throwing ObjectDisposedException from public methods) fully protects a disposed object from being used incorrectly.',
      reality: 'the guard only protects against a CALLER directly invoking a public method after disposal — it does nothing to stop an event publisher\'s stored delegate, or an already-running fire-and-forget task, from touching the object\'s internals independently.',
    },
    {
      thought: 'calling CancellationTokenSource.Cancel() inside Dispose() immediately stops any in-flight fire-and-forget work using that token.',
      reality: 'cancellation is cooperative — it only takes effect the next time the running code actually checks the token (e.g. at an await point) — code already past its last check can still execute and touch released state in the brief window before it observes the cancellation.',
    },
  ];
}
