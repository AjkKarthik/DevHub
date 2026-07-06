import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-async-void-event-handlers-why-exceptions-vanish-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './async-void-event-handlers-why-exceptions-vanish.html',
  styleUrl: './async-void-event-handlers-why-exceptions-vanish.scss',
})
export class AsyncVoidEventHandlersWhyExceptionsVanishSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s event handlers are all synchronous — a real gap',
      points: [
        'Every event handler on the main Delegates page — <code>SendEmail</code>, the inline lambdas — is a plain synchronous <code>void</code> method. In real UI and application code, event handlers very often need to <code>await</code> something (an API call, a database query) — which means they must be declared <code>async</code>. C# only allows this via <code>async void</code>, because <code>EventHandler</code> and similar delegate types require a <code>void</code> return, and <code>async Task</code> does not satisfy that signature.',
      ],
    },
    {
      heading: 'async void is a genuinely special, dangerous case — not just async Task with extra steps',
      points: [
        'An <code>async Task</code> method returns a <code>Task</code> the caller CAN observe — awaiting it surfaces any exception thrown inside. An <code>async void</code> method returns nothing observable at all — there is no <code>Task</code> object for any exception to be attached to.',
        'When an <code>async void</code> method throws (after its first <code>await</code>, running on a captured continuation), the exception is NOT stored anywhere for a caller to inspect — it is instead thrown directly on whatever <code>SynchronizationContext</code> was current when the method started, which for most applications means it propagates as an UNHANDLED exception and crashes the process, bypassing any surrounding try/catch in the code that RAISED the event entirely.',
      ],
    },
    {
      heading: 'This directly connects to the main page\'s own multicast-exception behavior — but is worse',
      points: [
        'The main page explains that in a synchronous multicast delegate, one subscriber throwing stops the remaining subscribers and the exception propagates to the CALLER (the code that raised the event) — which at least gives the raiser a chance to catch it. An <code>async void</code> handler\'s exception does not even reach the raiser\'s call site in a catchable way, because by the time the exception is thrown (after an <code>await</code>), the original synchronous call to <code>OrderPlaced?.Invoke(...)</code> has ALREADY RETURNED — there is no still-executing call frame for a catch block to be waiting on.',
        'This means <code>try { service.OrderPlaced?.Invoke(...); } catch { ... }</code> around an event-raising call CANNOT catch an exception thrown later inside an <code>async void</code> subscriber — the catch block\'s try region has already exited by the time the async continuation resumes and throws.',
      ],
    },
    {
      heading: 'The fix — never truly avoid it, but contain it',
      points: [
        'There is no way to make an <code>EventHandler</code>-shaped subscriber genuinely <code>async Task</code> — the delegate signature itself requires <code>void</code>. The idiomatic mitigation is to wrap the ENTIRE body of every <code>async void</code> handler in its own <code>try/catch</code>, ensuring any exception is caught and logged locally rather than escaping to crash the process or vanish silently.',
        'A cleaner architectural fix, when possible, is for the <code>async void</code> handler to do almost nothing except call and <code>await</code> a genuinely <code>async Task</code>-returning method that contains the real logic — keeping the dangerous <code>async void</code> surface as thin as possible and giving the actual work method a normal, testable, awaitable signature.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The trap — an exception that vanishes past a surrounding catch',
      language: 'csharp',
      code: `public class OrderService
{
    public event EventHandler<OrderPlacedEventArgs>? OrderPlaced;
    public void PlaceOrder(int id, decimal total) =>
        OrderPlaced?.Invoke(this, new OrderPlacedEventArgs { OrderId = id, Total = total });
}

public class OrderPlacedEventArgs : EventArgs
{
    public int OrderId { get; init; }
    public decimal Total { get; init; }
}

// A subscriber that needs to await something — forced into async void
// because EventHandler<T> requires a void-returning method:
async void OnOrderPlaced(object? sender, OrderPlacedEventArgs e)
{
    await Task.Delay(50); // simulate an awaited API call
    throw new InvalidOperationException("Notification service unreachable");
}

var service = new OrderService();
service.OrderPlaced += OnOrderPlaced;

try
{
    service.PlaceOrder(101, 49.99m);
    Console.WriteLine("PlaceOrder returned normally"); // this DOES print —
    // OnOrderPlaced hasn't even reached its throw yet when Invoke() returns
}
catch (Exception ex)
{
    // This catch NEVER runs — by the time OnOrderPlaced throws (after its
    // await), this try block has already completed and exited.
    Console.WriteLine($"Caught: {ex.Message}");
}

// Some time later, completely disconnected from the try/catch above:
// UNHANDLED EXCEPTION crashes the process (or is silently lost, depending
// on the SynchronizationContext) — nowhere near the code that raised the event.`,
    },
    {
      label: 'The fix — swallow-and-log inside the handler itself',
      language: 'csharp',
      code: `async void OnOrderPlaced(object? sender, OrderPlacedEventArgs e)
{
    try
    {
        await Task.Delay(50);
        throw new InvalidOperationException("Notification service unreachable");
    }
    catch (Exception ex)
    {
        // Caught and logged HERE — inside the async void method itself,
        // which is the only place that can genuinely observe this
        // exception. Nothing outside this method ever will.
        _logger.LogError(ex, "OnOrderPlaced handler failed");
    }
}

var service = new OrderService();
service.OrderPlaced += OnOrderPlaced;

service.PlaceOrder(101, 49.99m);
// No crash, no silent loss — the exception was caught exactly where it
// needed to be: inside the async void method's own try/catch.`,
    },
    {
      label: 'A cleaner shape — thin async void, real logic in async Task',
      language: 'csharp',
      code: `public class NotificationHandler
{
    private readonly ILogger _logger;
    public NotificationHandler(ILogger logger) => _logger = logger;

    // The event subscriber itself stays as thin as possible — just a
    // try/catch wrapper around a call to real, testable, awaitable logic:
    public async void OnOrderPlaced(object? sender, OrderPlacedEventArgs e)
    {
        try
        {
            await HandleOrderPlacedAsync(e);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to handle OrderPlaced for order {OrderId}", e.OrderId);
        }
    }

    // The REAL logic lives in an async Task method — genuinely testable
    // with Assert.ThrowsAsync, unlike the async void wrapper around it,
    // which cannot be meaningfully unit tested the same way at all.
    public async Task HandleOrderPlacedAsync(OrderPlacedEventArgs e)
    {
        await Task.Delay(50);
        if (e.Total <= 0)
            throw new InvalidOperationException("Cannot notify for a zero-value order");
        // ... real notification logic ...
    }
}

// Test the real logic directly — no event, no async void, no
// SynchronizationContext concerns at all:
var handler = new NotificationHandler(logger);
await Assert.ThrowsAsync<InvalidOperationException>(() =>
    handler.HandleOrderPlacedAsync(new OrderPlacedEventArgs { OrderId = 1, Total = 0 }));`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Explain, in terms of the multicast delegate behavior from the main topic, why an <code>async void</code> handler subscribed alongside other SYNCHRONOUS handlers on the same event does not block or prevent those other synchronous handlers from running, even if the async void handler eventually throws.',
    hint: 'Think about WHEN the async void method actually returns control back to the multicast invocation loop — an async void method returns (synchronously, from the loop\'s perspective) at its first await, not at its throw. By the time it throws, the multicast loop has already moved on to the next subscriber.',
    solution: `// An async void method, when called synchronously as part of a multicast
// delegate's invocation list, returns control back to the caller (the
// multicast loop) at its FIRST "await" — not when the whole method
// logically finishes. From the multicast loop's perspective, the async
// void subscriber has "returned" (and thus completed its turn) well
// before it actually throws later on a resumed continuation.

Action<string> syncHandler1 = s => Console.WriteLine("sync1");
// (conceptually) an async void handler mixed into the same multicast list
async void asyncHandler(string s)
{
    await Task.Delay(50);
    throw new InvalidOperationException("fails later");
}
Action<string> syncHandler2 = s => Console.WriteLine("sync2");

// Even though asyncHandler will eventually throw, it does so on a LATER
// resumed continuation — by then, the synchronous multicast loop has
// ALREADY moved past it and called syncHandler2. This is exactly why the
// crash from an async void subscriber often appears to happen "later" and
// "disconnected" from the original PlaceOrder() call — because it is.

// Contrast with the main topic's synchronous "one throws, rest don't run"
// rule: that only applies to a SYNCHRONOUS throw, which genuinely halts
// the loop immediately. An async void handler's eventual throw happens
// on a completely different, later turn of the event loop / thread pool,
// with no relationship to the original multicast invocation's control flow.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a try/catch wrapped around the code that raises an event (e.g. around OrderPlaced?.Invoke(...)) will catch exceptions thrown by any async void subscriber, the same way it catches exceptions from synchronous subscribers.',
      reality: 'an async void subscriber that throws AFTER its first await does so on a resumed continuation, at a point in time after the original synchronous Invoke() call has already returned — the surrounding try/catch\'s scope has already exited and cannot catch it.',
    },
    {
      thought: 'async void is just async Task with a different return type — functionally equivalent for exception handling purposes.',
      reality: 'async Task returns an observable Task object that a caller can await and inspect for exceptions; async void returns nothing observable at all — any exception it throws has no Task to attach to and instead becomes an unhandled exception on whatever SynchronizationContext was active, typically crashing the process or vanishing depending on the host.',
    },
    {
      thought: 'the only way to avoid the async void danger is to never use async event handlers at all.',
      reality: 'since EventHandler-shaped delegates require a void return, async void handlers cannot be fully avoided when subscribing to standard .NET events — the practical mitigation is to keep the async void handler as thin as possible (just a try/catch wrapper) delegating the real logic to a separately testable async Task method.',
    },
  ];
}
