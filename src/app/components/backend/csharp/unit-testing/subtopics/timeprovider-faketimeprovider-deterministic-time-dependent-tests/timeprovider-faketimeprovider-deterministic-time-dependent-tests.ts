import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-timeprovider-faketimeprovider-deterministic-time-dependent-tests-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './timeprovider-faketimeprovider-deterministic-time-dependent-tests.html',
  styleUrl: './timeprovider-faketimeprovider-deterministic-time-dependent-tests.scss',
})
export class TimeproviderFaketimeproviderDeterministicTimeDependentTestsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions TimeProvider/FakeTimeProvider once in the Quick Reference — this is how they actually make time-dependent code testable',
      points: [
        'The main Unit Testing page\'s Quick Reference lists <code>TimeProvider / FakeTimeProvider</code> as "inject a fake clock for deterministic time-dependent tests (.NET 8+)" — and its testability section separately warns that "time, randomness, and I/O make tests flaky." <code>TimeProvider</code> is the .NET 8+ abstraction specifically designed to solve the TIME half of that flakiness problem, replacing direct calls to <code>DateTime.Now</code>/<code>DateTime.UtcNow</code> scattered through production code.',
      ],
    },
    {
      heading: 'TimeProvider is an injectable abstraction over "what time is it" — production uses the real clock, tests use a controllable fake',
      points: [
        'Code that needs the current time takes a <code>TimeProvider</code> dependency (via constructor injection, exactly like the main page\'s own <code>IUserRepo</code> pattern) instead of calling <code>DateTime.UtcNow</code> directly. Production code is wired up with <code>TimeProvider.System</code> — the real, genuine system clock. Tests inject <code>FakeTimeProvider</code> (from the <code>Microsoft.Extensions.TimeProvider.Testing</code> package) instead, which starts at a time YOU choose and only advances when YOU explicitly tell it to.',
        'This directly solves the exact flakiness the main page warns about: a test asserting "an item created 31 days ago is considered expired" no longer depends on the WALL-CLOCK moment the test happens to run — it sets the fake clock to a specific instant, creates the item, advances the fake clock by exactly 31 days, and asserts the expiry logic fires — completely repeatable, regardless of what day it actually is when the test suite runs.',
      ],
    },
    {
      heading: 'FakeTimeProvider also supports fast-forwarding through Task.Delay-based code, without genuinely waiting',
      points: [
        '<code>FakeTimeProvider</code> integrates with .NET\'s timer/delay infrastructure — code that calls <code>TimeProvider.CreateTimer(...)</code> or uses <code>ITimer</code> based on the injected provider can have its scheduled callbacks fire INSTANTLY in a test by calling <code>fakeTimeProvider.Advance(TimeSpan)</code>, rather than the test genuinely waiting real wall-clock time for a delay to elapse — turning what would otherwise be a slow, real-time-waiting test into an instant, deterministic one.',
        'This is the SAME underlying idea as the earlier-covered technique of substituting a controllable <code>TaskCompletionSource</code> for real async operations in tests — both replace something that would otherwise force a test to genuinely wait on real time or a real external event, with a fully test-controlled stand-in that produces the SAME logical behavior on demand.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Refactoring DateTime.UtcNow into an injectable TimeProvider',
      language: 'csharp',
      code: `// BEFORE — untestable: directly calls the real system clock,
// exactly the "hidden dependency" problem the main page's own
// testability section warns about:
public class SubscriptionService
{
    public bool IsExpired(Subscription sub)
        => DateTime.UtcNow > sub.ExpiresAt; // hard-coded to "now" —
                                             // impossible to test
                                             // deterministically
}

// AFTER — TimeProvider injected, exactly like the main page's own
// constructor-injection pattern for IUserRepo:
public class SubscriptionServiceTestable
{
    private readonly TimeProvider _time;
    public SubscriptionServiceTestable(TimeProvider time) => _time = time;

    public bool IsExpired(Subscription sub)
        => _time.GetUtcNow() > sub.ExpiresAt; // now testable —
                                               // production wires up
                                               // TimeProvider.System;
                                               // tests inject a fake`,
    },
    {
      label: 'FakeTimeProvider — deterministic expiry testing with no real wall-clock dependency',
      language: 'csharp',
      code: `using Microsoft.Extensions.Time.Testing;
using Xunit;

public class SubscriptionExpiryTests
{
    [Fact]
    public void IsExpired_ExactlyAtExpiryMoment_ReturnsFalse()
    {
        // Start the fake clock at a SPECIFIC, arbitrary instant —
        // the test's outcome NEVER depends on what day it actually
        // is when this test runs:
        var fakeTime = new FakeTimeProvider(
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));

        var service = new SubscriptionServiceTestable(fakeTime);
        var sub = new Subscription { ExpiresAt = fakeTime.GetUtcNow() };

        Assert.False(service.IsExpired(sub)); // exactly AT expiry — not expired yet
    }

    [Fact]
    public void IsExpired_OneSecondAfterExpiry_ReturnsTrue()
    {
        var fakeTime = new FakeTimeProvider(
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));

        var service = new SubscriptionServiceTestable(fakeTime);
        var sub = new Subscription { ExpiresAt = fakeTime.GetUtcNow() };

        // Advance the FAKE clock explicitly — no real waiting occurs,
        // this executes instantly regardless of the TimeSpan value:
        fakeTime.Advance(TimeSpan.FromSeconds(1));

        Assert.True(service.IsExpired(sub)); // now genuinely past expiry
    }
}`,
    },
    {
      label: 'Fast-forwarding through a Task.Delay-based timer without genuinely waiting',
      language: 'csharp',
      code: `public class RetryService
{
    private readonly TimeProvider _time;
    public RetryService(TimeProvider time) => _time = time;

    public async Task<T> RetryWithDelayAsync<T>(Func<Task<T>> operation, TimeSpan delay)
    {
        try { return await operation(); }
        catch
        {
            // Uses the INJECTED TimeProvider's delay mechanism instead
            // of a bare Task.Delay — this is what makes the delay
            // itself fast-forwardable in a test:
            await Task.Delay(delay, _time);
            return await operation();
        }
    }
}

public class RetryServiceTests
{
    [Fact]
    public async Task RetryWithDelayAsync_RetriesAfterFakeDelay()
    {
        var fakeTime = new FakeTimeProvider();
        var service = new RetryService(fakeTime);

        int attempts = 0;
        var retryTask = service.RetryWithDelayAsync<int>(() =>
        {
            attempts++;
            if (attempts == 1) throw new InvalidOperationException("transient failure");
            return Task.FromResult(42);
        }, TimeSpan.FromMinutes(5));

        // Advancing the fake clock makes the pending Task.Delay(delay,
        // _time) resolve INSTANTLY — the test never genuinely waits
        // 5 real minutes for this retry delay to elapse:
        fakeTime.Advance(TimeSpan.FromMinutes(5));

        int result = await retryTask;
        Assert.Equal(42, result);
        Assert.Equal(2, attempts); // failed once, retried once, succeeded
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test for a method <code>bool IsBusinessHours(TimeProvider time)</code> that returns true only between 9 AM and 5 PM UTC, proving it correctly returns <code>false</code> at exactly 5:00:01 PM UTC — using FakeTimeProvider, with no dependency on the actual current wall-clock time.',
    hint: 'Construct a FakeTimeProvider set to a specific date at 5:00:01 PM UTC, pass it to IsBusinessHours, and assert the result is false — the test should behave identically no matter what day or time it is actually run.',
    solution: `static bool IsBusinessHours(TimeProvider time)
{
    var now = time.GetUtcNow();
    return now.Hour >= 9 && now.Hour < 17
        || (now.Hour == 17 && now.Minute == 0 && now.Second == 0);
}

[Fact]
public void IsBusinessHours_AtFivePmOneSecond_ReturnsFalse()
{
    // A specific, arbitrary instant — 5:00:01 PM UTC on a fixed date.
    // The test's outcome is completely independent of when it
    // actually runs in real time:
    var fakeTime = new FakeTimeProvider(
        new DateTimeOffset(2026, 3, 15, 17, 0, 1, TimeSpan.Zero));

    bool result = IsBusinessHours(fakeTime);

    Assert.False(result); // one second past business hours — correctly
                          // excluded, verified deterministically
}

[Fact]
public void IsBusinessHours_AtExactlyFivePm_ReturnsTrue()
{
    var fakeTime = new FakeTimeProvider(
        new DateTimeOffset(2026, 3, 15, 17, 0, 0, TimeSpan.Zero));

    Assert.True(IsBusinessHours(fakeTime)); // exactly 5:00:00 PM —
                                             // still within hours
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing time-dependent code (expiry logic, business hours, scheduled retries) inherently requires either real wall-clock waiting or manipulating the machine\'s system clock.',
      reality: 'injecting TimeProvider (production uses TimeProvider.System, tests use FakeTimeProvider) makes the current time a controllable dependency, exactly like any other injected interface — no real waiting or system clock manipulation is ever needed.',
    },
    {
      thought: 'FakeTimeProvider only helps with simple DateTime.UtcNow-style checks, not with Task.Delay-based timers or retries.',
      reality: 'FakeTimeProvider integrates with .NET\'s timer infrastructure directly — Task.Delay(delay, timeProvider) and TimeProvider.CreateTimer(...) can be fast-forwarded via Advance(TimeSpan), resolving pending delays instantly instead of requiring the test to genuinely wait.',
    },
    {
      thought: 'FakeTimeProvider and the earlier TaskCompletionSource-based async testing technique are unrelated tools solving different problems.',
      reality: 'they are the same underlying idea applied to two different sources of test-timing flakiness — both replace something that would otherwise force a test to genuinely wait on real time or a real external event with a fully test-controlled stand-in.',
    },
  ];
}
