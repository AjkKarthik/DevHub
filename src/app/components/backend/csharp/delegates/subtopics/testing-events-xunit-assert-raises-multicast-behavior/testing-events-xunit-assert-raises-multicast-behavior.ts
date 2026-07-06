import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-events-xunit-assert-raises-multicast-behavior-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-events-xunit-assert-raises-multicast-behavior.html',
  styleUrl: './testing-events-xunit-assert-raises-multicast-behavior.scss',
})
export class TestingEventsXunitAssertRaisesMulticastBehaviorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows events extensively — never how to test them',
      points: [
        'The main Delegates & Events page demonstrates a full <code>OrderService</code> with an <code>OrderPlaced</code> event, subscription, and unsubscription — but every example is verified by reading console output, never by an automated test. Testing an event genuinely differs from testing a normal method return value: you must verify a SIDE EFFECT (the event firing) and often the EXACT ARGUMENTS passed, not a return value.',
      ],
    },
    {
      heading: 'xUnit\'s Assert.Raises is purpose-built for this',
      points: [
        '<code>Assert.Raises&lt;TEventArgs&gt;(attach, detach, testCode)</code> subscribes a handler, runs the action expected to raise the event, automatically unsubscribes, and returns a captured <code>RaisedEvent&lt;TEventArgs&gt;</code> with the exact <code>Sender</code> and <code>Arguments</code> the event was raised with — asserting directly on them without hand-rolling a subscription/flag/unsubscription dance yourself.',
        'This is specifically built for the standard <code>EventHandler&lt;TEventArgs&gt;</code> convention the main page recommends — the same <code>(object? sender, TEventArgs e)</code> shape <code>Assert.Raises</code> expects, making it a natural fit for any event following that convention.',
      ],
    },
    {
      heading: 'Testing that an event does NOT fire is just as important',
      points: [
        '<code>Assert.Raises</code> has a companion, <code>Assert.RaisesAny</code>, but there is no built-in "assert event did not fire" — the idiomatic pattern is a manual boolean flag: subscribe a handler that sets a flag to <code>true</code>, run the action, assert the flag is still <code>false</code>. This matters for testing guard conditions — e.g. the main page\'s <code>OrderService</code> should NOT raise <code>OrderPlaced</code> if validation fails before the event-raising line is reached.',
        'A subtle but important detail: the flag-based test must always UNSUBSCRIBE in a <code>finally</code> or at test teardown — an event test that forgets to unsubscribe leaves the test\'s handler attached to a service instance that might outlive the test, which is exactly the memory-leak/lingering-reference class of bug the main page\'s own "not unsubscribing" Common Mistake warns about, now inside your OWN test code.',
      ],
    },
    {
      heading: 'Testing multicast behavior specifically — order and partial failure',
      points: [
        'The main page\'s theory explains that multicast delegates invoke subscribers in registration order, and that one subscriber throwing stops the rest. Both of these are directly testable: subscribe multiple handlers that append to a shared <code>List&lt;string&gt;</code>, raise the event once, and assert the list\'s CONTENTS AND ORDER match the subscription order exactly.',
        'Testing the "one throws, rest don\'t run" behavior (versus the <code>GetInvocationList()</code> fix that guarantees all handlers run) is a genuinely useful regression test — it directly proves whichever behavior your production code is relying on, rather than trusting it by reading the source.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Assert.Raises — the exact sender and args, no manual flags',
      language: 'csharp',
      code: `using Xunit;

// The OrderService and OrderPlacedEventArgs from the main topic's Events tab:
public class OrderPlacedEventArgs : EventArgs
{
    public int     OrderId { get; init; }
    public decimal Total   { get; init; }
}

public class OrderService
{
    public event EventHandler<OrderPlacedEventArgs>? OrderPlaced;

    public void PlaceOrder(int id, decimal total) =>
        OrderPlaced?.Invoke(this, new OrderPlacedEventArgs { OrderId = id, Total = total });
}

public class OrderServiceTests
{
    [Fact]
    public void PlaceOrder_RaisesOrderPlaced_WithCorrectArgs()
    {
        var service = new OrderService();

        // Assert.Raises subscribes, runs the action, unsubscribes, and
        // captures the raised event — no manual bool flag needed at all.
        var raised = Assert.Raises<OrderPlacedEventArgs>(
            attach:  h => service.OrderPlaced += h,
            detach:  h => service.OrderPlaced -= h,
            testCode: () => service.PlaceOrder(101, 49.99m));

        Assert.Equal(service, raised.Sender);
        Assert.Equal(101, raised.Arguments.OrderId);
        Assert.Equal(49.99m, raised.Arguments.Total);
    }
}`,
    },
    {
      label: 'Testing an event does NOT fire — manual flag, always unsubscribe',
      language: 'csharp',
      code: `public class OrderService
{
    public event EventHandler<OrderPlacedEventArgs>? OrderPlaced;

    public void PlaceOrder(int id, decimal total)
    {
        if (total <= 0) return; // guard — no event should fire for invalid orders
        OrderPlaced?.Invoke(this, new OrderPlacedEventArgs { OrderId = id, Total = total });
    }
}

public class OrderServiceGuardTests
{
    [Fact]
    public void PlaceOrder_WithZeroTotal_DoesNotRaiseOrderPlaced()
    {
        var service = new OrderService();
        var fired = false;

        void Handler(object? sender, OrderPlacedEventArgs e) => fired = true;
        service.OrderPlaced += Handler;

        try
        {
            service.PlaceOrder(101, 0m); // guarded — should NOT raise

            Assert.False(fired);
        }
        finally
        {
            // Always unsubscribe, even if the assertion above fails —
            // exactly the "unsubscribe to break the reference chain" habit
            // the main topic's memory-leak Common Mistake teaches, applied
            // to the test's own handler this time.
            service.OrderPlaced -= Handler;
        }
    }
}`,
    },
    {
      label: 'Testing multicast order and partial-failure behavior',
      language: 'csharp',
      code: `public class MulticastOrderTests
{
    [Fact]
    public void MulticastDelegate_InvokesSubscribersInRegistrationOrder()
    {
        var callOrder = new List<string>();
        Action<string> log    = s => callOrder.Add($"log:{s}");
        Action<string> audit  = s => callOrder.Add($"audit:{s}");
        Action<string> pipeline = log + audit;

        pipeline("event");

        Assert.Equal(new[] { "log:event", "audit:event" }, callOrder);
        // Proves registration order is preserved — directly testing the
        // main topic's "subscribers called in registration order" claim.
    }

    [Fact]
    public void MulticastDelegate_OneThrows_RemainingSubscribersDoNotRun()
    {
        var callOrder = new List<string>();
        Action<string> first  = s => callOrder.Add("first");
        Action<string> throws = s => throw new InvalidOperationException("boom");
        Action<string> third  = s => callOrder.Add("third");

        Action<string> pipeline = first + throws + third;

        Assert.Throws<InvalidOperationException>(() => pipeline("event"));

        // "third" never ran — this is the exact behavior the main topic's
        // "multicast exception stops remaining subscribers" mistake warns
        // about, now captured as a regression test rather than prose.
        Assert.Equal(new[] { "first" }, callOrder);
    }

    [Fact]
    public void GetInvocationList_GuaranteesAllSubscribersRunDespiteFailure()
    {
        var callOrder = new List<string>();
        Action<string> first  = s => callOrder.Add("first");
        Action<string> throws = s => throw new InvalidOperationException("boom");
        Action<string> third  = s => callOrder.Add("third");

        Action<string> pipeline = first + throws + third;

        foreach (var d in pipeline.GetInvocationList())
        {
            try { ((Action<string>)d)("event"); }
            catch (InvalidOperationException) { /* expected from "throws" */ }
        }

        // Proves the GetInvocationList() fix genuinely delivers to ALL
        // subscribers, unlike the direct-invocation test above.
        Assert.Equal(new[] { "first", "third" }, callOrder);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test using <code>Assert.Raises</code> that verifies calling <code>service.PlaceOrder(0, -5m)</code> on the guarded <code>OrderService</code> from the second code example does NOT raise <code>OrderPlaced</code> — but do it WITHOUT using <code>Assert.Raises</code> (explain why <code>Assert.Raises</code> itself cannot express this negative assertion).',
    hint: 'Assert.Raises is designed around the assumption the event DOES fire during testCode — it throws its own assertion failure if the event never fires, which is the opposite of what you want to prove here. Think about what tool actually fits a "this should NOT happen" assertion instead.',
    solution: `// Assert.Raises cannot express this: it is built to assert the event DID
// fire (it fails the test if the event never raises during testCode) — the
// exact opposite of what "should NOT raise" needs. There is no built-in
// "Assert.DoesNotRaise" in xUnit, so the manual flag pattern is the
// idiomatic (and only) way to express this:

[Fact]
public void PlaceOrder_WithNegativeTotal_DoesNotRaiseOrderPlaced()
{
    var service = new OrderService();
    var fired = false;

    void Handler(object? sender, OrderPlacedEventArgs e) => fired = true;
    service.OrderPlaced += Handler;

    try
    {
        service.PlaceOrder(0, -5m); // guarded — should NOT raise
        Assert.False(fired);
    }
    finally
    {
        service.OrderPlaced -= Handler; // always clean up, pass or fail
    }
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing that an event fired correctly requires manually subscribing a handler, setting a flag, and remembering to unsubscribe every time.',
      reality: 'xUnit\'s Assert.Raises&lt;TEventArgs&gt; handles the subscribe/run/unsubscribe/capture cycle for you and gives direct access to the exact Sender and Arguments the event was raised with — reserve the manual flag pattern for the opposite case, proving an event did NOT fire.',
    },
    {
      thought: 'Assert.Raises can be used to prove an event does not fire, the same way it proves an event does fire.',
      reality: 'Assert.Raises is built around the assumption the event DOES fire during the test action — it has no negative form. Proving an event did not fire requires the manual boolean-flag pattern instead.',
    },
    {
      thought: 'once a multicast delegate\'s registration-order and partial-failure behavior is understood from documentation, it does not need its own dedicated test — it is guaranteed language behavior.',
      reality: 'while the BEHAVIOR is guaranteed by the language, whether YOUR CODE correctly relies on that behavior (e.g. does your code actually need GetInvocationList() for guaranteed delivery, or does it assume all handlers always run) is exactly the kind of assumption a regression test should pin down explicitly.',
    },
  ];
}
