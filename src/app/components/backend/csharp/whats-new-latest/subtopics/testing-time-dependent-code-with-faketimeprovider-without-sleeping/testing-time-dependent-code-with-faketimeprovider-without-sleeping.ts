import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-time-dependent-code-faketimeprovider-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-time-dependent-code-with-faketimeprovider-without-sleeping.html',
  styleUrl: './testing-time-dependent-code-with-faketimeprovider-without-sleeping.scss',
})
export class TestingTimeDependentCodeWithFaketimeproviderWithoutSleepingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows FakeTimeProvider in a comment, one line — this subtopic is the actual test you\'d write, plus the one gotcha that trips people up the first time',
      points: [
        'The main .NET 9/10 &amp; C# 13/14 page\'s Common Mistakes section correctly identifies that <code>DateTime.UtcNow</code> "breaks test determinism" and shows injecting <code>TimeProvider</code> as the fix, with a two-line comment sketch of <code>FakeTimeProvider</code> usage. This subtopic fills in the REST of that test — including the one detail (how <code>Task.Delay(delay, time, ct)</code> actually reacts to <code>fake.Advance(...)</code>) that is easy to get wrong the first time you write it.',
      ],
    },
    {
      heading: '<code>FakeTimeProvider.Advance(TimeSpan)</code> does two things at once: it moves what <code>GetUtcNow()</code> reports, AND it fires any timers/delays that Advance passes',
      points: [
        'Calling <code>fake.GetUtcNow()</code> after <code>fake.Advance(TimeSpan.FromHours(2))</code> simply returns a timestamp 2 hours later — straightforward. The LESS obvious part: if production code called <code>await Task.Delay(someDelay, time, ct)</code> (passing the <code>TimeProvider</code> itself, exactly as the main page\'s own <code>OrderExpiryService.WaitForExpiryAsync</code> example does), that awaited <code>Task.Delay</code> is backed by a TIMER that <code>FakeTimeProvider</code> tracks internally — advancing PAST that timer\'s due time causes the fake to fire it, completing the awaited <code>Task.Delay</code> immediately, synchronously, within the SAME <code>Advance()</code> call, with no real wall-clock time elapsing at all.',
        'This ONLY works correctly if the delay was created by passing the <code>TimeProvider</code> instance INTO <code>Task.Delay(delay, timeProvider, ct)</code> — a plain <code>await Task.Delay(delay, ct)</code> (without the <code>TimeProvider</code> overload) is ALWAYS backed by the REAL system clock/timer, regardless of what <code>TimeProvider</code> is injected elsewhere in the same class — this exact overload mismatch is the single most common way a "deterministic" time test turns out to still actually sleep.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own OrderExpiryService — writing the actual test',
      language: 'csharp',
      code: `// From the main page:
public class OrderExpiryService(TimeProvider time)
{
    public bool IsExpired(Order order, TimeSpan ttl)
        => time.GetUtcNow() - order.CreatedAt > ttl;

    public async Task WaitForExpiryAsync(Order order, TimeSpan ttl, CancellationToken ct)
    {
        var remaining = ttl - (time.GetUtcNow() - order.CreatedAt);
        if (remaining > TimeSpan.Zero)
            await Task.Delay(remaining, time, ct);  // TimeProvider overload
    }
}

// The actual test, using Microsoft.Extensions.Time.Testing:
using Microsoft.Extensions.Time.Testing;
using Xunit;

public class OrderExpiryServiceTests
{
    [Fact]
    public void IsExpired_BeforeTtlElapses_ReturnsFalse()
    {
        var fake = new FakeTimeProvider(DateTimeOffset.Parse("2026-01-01T00:00:00Z"));
        var service = new OrderExpiryService(fake);
        var order = new Order { CreatedAt = fake.GetUtcNow() };

        fake.Advance(TimeSpan.FromMinutes(30));

        Assert.False(service.IsExpired(order, TimeSpan.FromHours(1)));
    }

    [Fact]
    public void IsExpired_AfterTtlElapses_ReturnsTrue()
    {
        var fake = new FakeTimeProvider(DateTimeOffset.Parse("2026-01-01T00:00:00Z"));
        var service = new OrderExpiryService(fake);
        var order = new Order { CreatedAt = fake.GetUtcNow() };

        // No real Thread.Sleep or Task.Delay — instant, deterministic:
        fake.Advance(TimeSpan.FromHours(2));

        Assert.True(service.IsExpired(order, TimeSpan.FromHours(1)));
    }
}`,
    },
    {
      label: 'Testing WaitForExpiryAsync — where the timer-firing behavior actually matters',
      language: 'csharp',
      code: `[Fact]
public async Task WaitForExpiryAsync_CompletesWhenTimeAdvancesPastRemaining()
{
    var fake = new FakeTimeProvider(DateTimeOffset.Parse("2026-01-01T00:00:00Z"));
    var service = new OrderExpiryService(fake);
    var order = new Order { CreatedAt = fake.GetUtcNow() };

    // Start the wait — it internally awaits Task.Delay(remaining, fake, ct),
    // which registers a TIMER with the FakeTimeProvider (NOT the real clock):
    var waitTask = service.WaitForExpiryAsync(order, TimeSpan.FromHours(1), default);

    // At this point, waitTask has NOT completed — 0 real time and 0 fake
    // time has passed since the timer was registered:
    Assert.False(waitTask.IsCompleted);

    // Advancing the FAKE clock past the timer's due time fires it
    // SYNCHRONOUSLY as part of this Advance() call — no real waiting:
    fake.Advance(TimeSpan.FromHours(1).Add(TimeSpan.FromSeconds(1)));

    // The awaited Task.Delay has now genuinely completed — await it
    // to let the continuation run (still no real wall-clock delay):
    await waitTask;

    Assert.True(waitTask.IsCompletedSuccessfully);
    // Total REAL test execution time: milliseconds — despite testing
    // a full one-hour wait.
}`,
    },
    {
      label: 'The trap — a plain Task.Delay(delay, ct) never fires from Advance() at all',
      language: 'csharp',
      code: `// A SLIGHTLY different implementation — looks almost identical, but
// uses the overload WITHOUT the TimeProvider parameter:
public class OrderExpiryServiceBuggy(TimeProvider time)
{
    public async Task WaitForExpiryAsync(Order order, TimeSpan ttl, CancellationToken ct)
    {
        var remaining = ttl - (time.GetUtcNow() - order.CreatedAt);
        if (remaining > TimeSpan.Zero)
            await Task.Delay(remaining, ct);   // MISSING the "time" argument!
    }
}

[Fact]
public async Task WaitForExpiryAsync_Buggy_NeverCompletesFromFakeAdvance()
{
    var fake = new FakeTimeProvider(DateTimeOffset.Parse("2026-01-01T00:00:00Z"));
    var service = new OrderExpiryServiceBuggy(fake);
    var order = new Order { CreatedAt = fake.GetUtcNow() };

    var waitTask = service.WaitForExpiryAsync(order, TimeSpan.FromHours(1), default);

    // This Task.Delay is backed by the REAL system timer, NOT the fake —
    // passing "fake" to the constructor changed what GetUtcNow() returns,
    // but did nothing for THIS specific Task.Delay call, since the
    // TimeProvider overload was never actually used here:
    fake.Advance(TimeSpan.FromHours(2));

    Assert.False(waitTask.IsCompleted);  // STILL not completed — the
                                          // real one-hour system timer
                                          // has not actually elapsed,
                                          // and the fake clock advancing
                                          // has ZERO effect on it

    // A test written this way would need an ACTUAL Task.Delay(TimeSpan.
    // FromHours(1)) of real wall-clock time to ever complete — exactly
    // the "slow, real sleep" problem TimeProvider was meant to solve,
    // silently reintroduced by one missing constructor argument.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A code reviewer sees a PR where a class constructor takes <code>TimeProvider time</code>, but every <code>Task.Delay</code> call inside the class uses the plain <code>Task.Delay(delay, cancellationToken)</code> overload (no <code>time</code> argument). Explain precisely what test-writing consequence this has, even though the class technically "accepts" a TimeProvider and its unit tests for non-delay logic (like <code>IsExpired</code>) still pass and look deterministic.',
    hint: 'Separate the TWO different things TimeProvider is used for in the main page\'s own example: reading the current time (time.GetUtcNow()) versus scheduling a delay (Task.Delay with the TimeProvider overload) — a class can correctly inject TimeProvider for ONE of these purposes while still having a real, undetected dependency on the system clock for the other.',
    solution: `public class SomeService(TimeProvider time)
{
    // CORRECTLY uses "time" for reading the current moment:
    public bool IsExpired(Order o, TimeSpan ttl) =>
        time.GetUtcNow() - o.CreatedAt > ttl;

    // ACCEPTS "time" in its constructor, but never actually uses it for
    // the delay — this specific method still depends on the REAL system
    // clock/timer, despite the class looking fully "TimeProvider-aware":
    public async Task WaitAsync(TimeSpan delay, CancellationToken ct)
        => await Task.Delay(delay, ct);   // missing: the "time" argument
}

// TEST-WRITING CONSEQUENCE: tests for IsExpired() genuinely work with
// FakeTimeProvider and ARE deterministic — GetUtcNow() correctly reads
// from the fake clock, so fake.Advance(...) genuinely and instantly
// changes what IsExpired() computes, with zero real waiting.
//
// But ANY test that needs WaitAsync() to actually COMPLETE (rather
// than just checking it hasn't completed yet) is STUCK — no amount of
// fake.Advance(...) will ever cause that specific Task.Delay to
// resolve, because it was never registered against the FakeTimeProvider
// at all; it is a real system timer. A test author, having verified
// IsExpired() works perfectly with the fake, might reasonably (but
// incorrectly) assume WaitAsync() behaves the same way, and either:
//   (a) write a test that silently takes REAL time to pass (defeating
//       the entire purpose of injecting TimeProvider), or
//   (b) write a test asserting "waitTask.IsCompleted is false right
//       after fake.Advance()" and mistake this for a PASSING assertion
//       about correct behavior, when it is actually masking a bug (the
//       delay SHOULD have completed after advancing past its duration,
//       but structurally never can).
//
// THE REVIEW COMMENT: "This class takes a TimeProvider, but WaitAsync's
// Task.Delay call doesn't use it — pass 'time' as the second argument
// (Task.Delay(delay, time, ct)) so this method is ACTUALLY controllable
// by FakeTimeProvider in tests, not just the GetUtcNow()-based methods."`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a class\'s constructor accepts a TimeProvider, every Task.Delay call inside that class automatically becomes controllable by FakeTimeProvider in tests.',
      reality: 'only Task.Delay calls that explicitly pass the TimeProvider as an argument (Task.Delay(delay, timeProvider, ct)) are backed by that provider\'s timers — a plain Task.Delay(delay, ct) is always backed by the real system clock, regardless of what TimeProvider is injected elsewhere in the same class.',
    },
    {
      thought: 'FakeTimeProvider.Advance() only changes what GetUtcNow() reports — it has no effect on any awaited Task.Delay calls.',
      reality: 'advancing the fake clock past a registered timer\'s due time fires that timer synchronously as part of the same Advance() call, completing any Task.Delay that was correctly created with the TimeProvider overload — with zero real wall-clock time elapsing.',
    },
    {
      thought: 'a test asserting waitTask.IsCompleted is false immediately after calling fake.Advance() with a duration that should have elapsed the delay is always a sign of correct, still-pending async behavior.',
      reality: 'it can equally be a sign that the awaited Task.Delay was never actually wired to the FakeTimeProvider in the first place (missing the TimeProvider argument), silently masking a real bug rather than confirming correct pending state.',
    },
  ];
}
