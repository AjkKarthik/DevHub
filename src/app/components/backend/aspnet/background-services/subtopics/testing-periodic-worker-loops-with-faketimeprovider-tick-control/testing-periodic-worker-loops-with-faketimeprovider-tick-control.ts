import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-periodic-worker-loops-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-periodic-worker-loops-with-faketimeprovider-tick-control.html',
  styleUrl: './testing-periodic-worker-loops-with-faketimeprovider-tick-control.scss',
})
export class TestingPeriodicWorkerLoopsWithFaketimeproviderTickControlSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own MetricsReporter example uses new PeriodicTimer(TimeSpan.FromSeconds(30)) — testing it "as written" means either waiting 30 real seconds per tick, or never verifying the tick logic at all. Since .NET 8, PeriodicTimer accepts an injectable TimeProvider, making the tick schedule fully controllable in tests',
      points: [
        'The overload <code>new PeriodicTimer(TimeSpan period, TimeProvider timeProvider)</code> (added in .NET 8) reads elapsed time from the supplied <code>TimeProvider</code> instead of the real system clock. Passing a <code>Microsoft.Extensions.Time.Testing.FakeTimeProvider</code> — the exact class used in the earlier ASP.NET Core Rate Limiting subtopic to prove the fixed-window boundary burst — lets a test advance the timer\'s internal clock instantly and deterministically, with zero real elapsed time.',
        'To make this testable, the worker must accept an injected <code>TimeProvider</code> rather than implicitly using the real one — a one-parameter constructor change (<code>MetricsReporter(ILogger&lt;MetricsReporter&gt; logger, TimeProvider timeProvider)</code>, defaulting to <code>TimeProvider.System</code> in production via DI registration) that costs nothing in production but unlocks fully deterministic testing.',
      ],
    },
    {
      heading: 'Testing a BackgroundService directly does not require WebApplicationFactory or even a running host at all — BackgroundService.StartAsync() and StopAsync() are ordinary public methods you can call directly on an instance, driving the worker\'s lifecycle explicitly from a unit test',
      points: [
        'Construct the worker with its dependencies (test doubles for anything scoped, the <code>FakeTimeProvider</code> in place of the real clock), call <code>await worker.StartAsync(CancellationToken.None)</code> to begin <code>ExecuteAsync</code>, advance the fake clock through however many ticks the test needs to observe, then call <code>await worker.StopAsync(cts.Token)</code> to trigger graceful shutdown and await the loop\'s exit — all without ever building a <code>WebApplicationFactory</code> or hitting a real HTTP endpoint.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Making the worker\'s clock injectable — a one-parameter change',
      language: 'csharp',
      code: `public class MetricsReporter(
    ILogger<MetricsReporter> logger,
    TimeProvider timeProvider) : BackgroundService   // <-- new parameter
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30), timeProvider);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            logger.LogInformation(
                "Active connections: {Count}", GetConnectionCount());
        }
    }

    private static int GetConnectionCount() => Random.Shared.Next(10, 200);
}

// Production registration — defaults to the real system clock:
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddHostedService<MetricsReporter>();`,
    },
    {
      label: 'Testing tick behavior directly — no host, no HTTP, no real delay',
      language: 'csharp',
      code: `[Fact]
public async Task MetricsReporter_LogsOnce_PerTick_NoRealDelay()
{
    var fakeTime = new FakeTimeProvider();
    var logger   = new FakeLogger<MetricsReporter>(); // records log entries
    var worker   = new MetricsReporter(logger, fakeTime);

    using var cts = new CancellationTokenSource();
    var runTask = worker.StartAsync(cts.Token);   // begins ExecuteAsync

    // Advance the fake clock past three 30-second periods — INSTANTLY,
    // zero real time elapsed. Each advance should trigger exactly one
    // tick of the PeriodicTimer:
    for (var i = 0; i < 3; i++)
    {
        fakeTime.Advance(TimeSpan.FromSeconds(30));
        await Task.Yield(); // let the awaiting WaitForNextTickAsync resume
    }

    Assert.Equal(3, logger.Entries.Count(e => e.Message.Contains("Active connections")));

    // Graceful shutdown — cancels stoppingToken, WaitForNextTickAsync
    // returns false, ExecuteAsync exits cleanly:
    await worker.StopAsync(CancellationToken.None);
    await runTask;   // completes without throwing
}

[Fact]
public async Task MetricsReporter_Does_Not_Tick_Before_Period_Elapses()
{
    var fakeTime = new FakeTimeProvider();
    var logger   = new FakeLogger<MetricsReporter>();
    var worker   = new MetricsReporter(logger, fakeTime);

    await worker.StartAsync(CancellationToken.None);

    // Advance by LESS than the 30-second period — should NOT tick yet:
    fakeTime.Advance(TimeSpan.FromSeconds(29));
    await Task.Yield();

    Assert.Empty(logger.Entries);   // proves the period boundary is exact,
                                     // not "eventually logs something"

    await worker.StopAsync(CancellationToken.None);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A test calls fakeTime.Advance(TimeSpan.FromSeconds(90)) in one single jump (instead of three separate 30-second advances) after starting the worker. Predict how many times the logger records "Active connections" — is it 1 (one big jump = one tick) or 3 (one tick per elapsed period)? Justify your answer from PeriodicTimer\'s own documented non-drift, no-catch-up-burst behavior described on the main page.',
    hint: 'The main page\'s own theory states: "If work takes longer than the period, PeriodicTimer fires immediately for the next tick (no catch-up bursts) — it skips the missed tick." Does jumping the CLOCK forward by 90 seconds in one step behave like "work took a long time" (skip the missed ticks) or like "three periods have genuinely elapsed" (fire three times)?',
    solution: `The correct answer is 1 tick, not 3 — and this is a subtle but
important consequence of the exact mechanic the main page's own
theory already states, just not obviously connected to fake-clock
testing until you actually try it.

PeriodicTimer's "no catch-up bursts" behavior means WaitForNextTickAsync
does not queue up multiple pending ticks when time has moved past
several period boundaries — the moment ANY amount of time greater than
or equal to one period has elapsed since the last tick, the NEXT call
to WaitForNextTickAsync returns immediately (exactly once), and the
timer resets its internal "next due" point relative to NOW, not
relative to a strict multiple of the original period. Whether the
clock advanced by exactly 30 seconds or by 90 seconds in one jump, the
awaiting call sees "at least one period has elapsed" and fires ONE
tick — it does not distinguish "three periods passed" from "one long
period passed" and does not compensate by firing three times.

This has a real, practical implication for testing: if a test's goal
is specifically to observe N distinct ticks, it must advance the fake
clock in N separate increments (each at least one period), calling
Task.Yield() (or another await point) between them so the timer has a
chance to observe each threshold crossing and reset before the next
advance — a single large jump collapses however many periods elapsed
into exactly one tick, which is EXACTLY the same "skip the missed
tick, don't burst" behavior the main page describes for a worker whose
OWN processing took longer than the period. The fake clock advancing
in one big step is mechanically equivalent, from the timer's
perspective, to the worker having been "busy" for that whole duration
— there is no way to distinguish the two causes from inside the
timer's own logic, which is precisely why the behavior is identical.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a worker that uses PeriodicTimer requires either real wall-clock waits or leaving the tick logic entirely untested.',
      reality: 'since .NET 8, PeriodicTimer accepts an injectable TimeProvider — passing a FakeTimeProvider makes the tick schedule fully controllable and instant in tests, with zero real elapsed time, as long as the worker itself is constructed to accept an injected TimeProvider rather than implicitly using the system clock.',
    },
    {
      thought: 'a BackgroundService can only be tested through a full WebApplicationFactory-based integration test, since it is wired into the host\'s lifecycle.',
      reality: 'StartAsync() and StopAsync() are ordinary public methods on the BackgroundService instance — a unit test can construct the worker directly, call StartAsync to begin ExecuteAsync, and call StopAsync to trigger graceful shutdown, with no host, DI container, or HTTP layer involved at all.',
    },
    {
      thought: 'advancing a FakeTimeProvider by a large jump (e.g. 90 seconds, spanning three 30-second periods) should fire three ticks in sequence, matching how many period boundaries were crossed.',
      reality: 'PeriodicTimer\'s no-catch-up-burst design means it fires exactly ONE tick regardless of how many period boundaries were crossed in a single advance — it cannot distinguish "three periods elapsed at once" from "processing took 90 seconds after one period" and treats both identically.',
    },
  ];
}
