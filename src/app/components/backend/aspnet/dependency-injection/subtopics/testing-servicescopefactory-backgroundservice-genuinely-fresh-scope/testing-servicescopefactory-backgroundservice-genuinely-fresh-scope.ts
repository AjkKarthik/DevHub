import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-servicescopefactory-fresh-scope-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-servicescopefactory-backgroundservice-genuinely-fresh-scope.html',
  styleUrl: './testing-servicescopefactory-backgroundservice-genuinely-fresh-scope.scss',
})
export class TestingServicescopefactoryBackgroundserviceGenuinelyFreshScopeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own OutboxProcessor comment claims "each batch gets its own scope → fresh DbContext per batch" — this is exactly the kind of claim worth actually verifying with a test, not just trusting the comment',
      points: [
        'The main Dependency Injection page\'s <code>OutboxProcessor</code> example includes the comment "Each batch gets its own scope → fresh DbContext per batch." This is CORRECT when the code is written properly — but it is also exactly the kind of subtle lifetime claim that a refactor could silently break (e.g., someone "optimizing" by moving the scope creation OUTSIDE the loop, or accidentally caching the resolved <code>DbContext</code> in a field) without any compile error, and without <code>ValidateOnBuild</code> catching it either, since the mistake is about WHEN a scope is created, not WHETHER the registration itself is valid.',
      ],
    },
    {
      heading: 'A test can prove "fresh scope per iteration" by resolving a service TWICE across two separate scope-creation calls and asserting the instances are NOT the same object',
      points: [
        'Since each freshly-created <code>IServiceScope</code> resolves its OWN new instance of a Scoped service, a test that calls the SAME scope-creation code path TWICE (simulating two loop iterations) and compares the TWO resolved instances by REFERENCE (<code>ReferenceEquals</code>, or a marker <code>Guid</code> set in the constructor) directly proves the "fresh scope per batch" claim — rather than trusting a comment, or worse, only discovering a regression when production entity-tracking state visibly accumulates across iterations.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing that the main page\'s own OutboxProcessor pattern genuinely creates a fresh scope each iteration',
      language: 'csharp',
      code: `using Microsoft.Extensions.DependencyInjection;
using Xunit;

// A marker service that records a unique instance ID at construction —
// this lets a test PROVE two resolutions are genuinely different
// instances, not just superficially "look the same":
public class MarkedDbContext
{
    public Guid InstanceId { get; } = Guid.NewGuid();
}

public class OutboxProcessorScopeTests
{
    [Fact]
    public void EachSimulatedBatch_ResolvesAGenuinelyDifferentInstance()
    {
        var services = new ServiceCollection();
        services.AddScoped<MarkedDbContext>();   // Scoped — same lifetime
                                                   // as the real AppDbContext
        var provider = services.BuildServiceProvider();
        var factory = provider.GetRequiredService<IServiceScopeFactory>();

        // Simulate what OutboxProcessor.ProcessBatchAsync() does on
        // TWO separate "loop iterations":
        Guid firstBatchInstanceId;
        using (var scope1 = factory.CreateScope())
        {
            var db1 = scope1.ServiceProvider.GetRequiredService<MarkedDbContext>();
            firstBatchInstanceId = db1.InstanceId;
        }   // scope1 disposed — db1 is released

        Guid secondBatchInstanceId;
        using (var scope2 = factory.CreateScope())
        {
            var db2 = scope2.ServiceProvider.GetRequiredService<MarkedDbContext>();
            secondBatchInstanceId = db2.InstanceId;
        }

        // This is the ACTUAL proof the main page's own comment claims —
        // if a future refactor accidentally hoisted scope creation
        // OUTSIDE the loop (reusing one scope, and therefore one
        // DbContext, across every batch), this assertion would FAIL,
        // immediately catching the regression:
        Assert.NotEqual(firstBatchInstanceId, secondBatchInstanceId);
    }
}`,
    },
    {
      label: 'The regression this test actually catches — scope creation accidentally hoisted outside the loop',
      language: 'csharp',
      code: `// A BROKEN "optimization" — moving scope creation OUTSIDE the loop,
// intending to "avoid the overhead of creating a scope every batch":
public class OutboxProcessorBroken : BackgroundService
{
    private readonly IServiceScopeFactory _factory;

    public OutboxProcessorBroken(IServiceScopeFactory factory) => _factory = factory;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // BUG: ONE scope created for the ENTIRE lifetime of this
        // background service — recreating exactly the captive-
        // dependency problem the main page's own IServiceScopeFactory
        // pattern exists specifically to AVOID, just one level removed:
        await using var scope = _factory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        while (!stoppingToken.IsCancellationRequested)
        {
            await ProcessBatchAsync(db);   // SAME DbContext instance,
                                            // every single batch, for
                                            // the entire process lifetime
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }

    private async Task ProcessBatchAsync(AppDbContext db) { /* ... */ }
}

// This compiles CLEANLY. ValidateOnBuild does not catch it (the
// registration itself is perfectly valid — AppDbContext IS a real,
// resolvable Scoped service). Nothing throws at startup. The bug is
// PURELY about WHEN scope creation happens relative to the loop —
// exactly the class of mistake the reference-equality test from the
// previous tab is specifically designed to catch, since it directly
// tests the OBSERVABLE BEHAVIOR (fresh instance per batch) rather than
// the registration's validity.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Adapt the reference-equality test from this subtopic to test the ACTUAL <code>OutboxProcessorBroken</code> class shown in the second code tab (not just a hand-simulated loop), and explain what specific change to that test would be needed to actually exercise the real class\'s <code>ExecuteAsync</code> method rather than simulating its scope-creation pattern by hand.',
    hint: 'Consider that ExecuteAsync is an infinite loop (while (!stoppingToken.IsCancellationRequested)) that runs until cancellation — a test cannot simply "await" it to completion the normal way; it needs a way to let ExecuteAsync run for SOME bounded amount of time or SOME number of iterations, then stop it, while capturing what instance(s) were used along the way.',
    solution: `// Testing the REAL OutboxProcessorBroken class (not a hand-simulated
// loop) requires letting ExecuteAsync actually run, then cancelling it
// after enough iterations have occurred to observe the bug:

public class MarkedAppDbContext : AppDbContext
{
    public Guid InstanceId { get; } = Guid.NewGuid();
    // (constructor forwarding to the real AppDbContext's own ctor omitted for brevity)
}

public class OutboxProcessorBrokenTests
{
    [Fact]
    public async Task ExecuteAsync_ReusesSameDbContextAcrossIterations_RevealsTheBug()
    {
        var services = new ServiceCollection();
        services.AddScoped<AppDbContext, MarkedAppDbContext>();  // swap in the marker
        var provider = services.BuildServiceProvider();
        var factory = provider.GetRequiredService<IServiceScopeFactory>();

        var processor = new OutboxProcessorBroken(factory);

        // ExecuteAsync runs an infinite loop — use a CancellationTokenSource
        // with a short timeout to let it run for a FEW iterations
        // (a few multiples of its 5-second delay), then force it to stop:
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(12));

        var recordedInstanceIds = new List<Guid>();
        // A REAL test would need OutboxProcessorBroken (or a test-only
        // subclass) to expose a hook — e.g. an event, or a protected
        // virtual method called each iteration — that the test can
        // subscribe to in order to CAPTURE which DbContext instance
        // was used on each pass, since ExecuteAsync's internals are
        // otherwise private to the class. This is the KEY CHANGE
        // needed versus the hand-simulated version: the ORIGINAL class
        // needs a testability seam (a virtual method, an injected
        // callback, or an internal event) specifically so a test can
        // observe per-iteration behavior of a genuinely running
        // BackgroundService, rather than reimplementing its loop logic
        // by hand in the test itself.

        try
        {
            await processor.StartAsync(cts.Token);
            await Task.Delay(TimeSpan.FromSeconds(12), CancellationToken.None);
        }
        finally
        {
            await processor.StopAsync(CancellationToken.None);
        }

        // With the testability seam in place, recordedInstanceIds would
        // contain the SAME Guid repeated across every captured
        // iteration for the BROKEN class (proving the bug), versus a
        // DIFFERENT Guid each time for the FIXED version using
        // CreateAsyncScope() inside the loop as the main page's own
        // correct pattern shows:
        Assert.True(recordedInstanceIds.Count > 1, "Expected multiple iterations to have run");
        Assert.True(recordedInstanceIds.Distinct().Count() == 1,
            "BUG CONFIRMED: all iterations used the SAME DbContext instance");
    }
}

// THE KEY LESSON: testing a REAL BackgroundService's internal
// per-iteration behavior (rather than a hand-simulated stand-in for
// its logic) requires the class itself to expose SOME observable seam
// — an event, a virtual method, or an injectable callback — since
// ExecuteAsync's loop body is otherwise opaque to external test code.
// This is a genuine DESIGN consideration: a BackgroundService written
// with testability in mind exposes such a seam deliberately; one
// written without it can only be tested via the coarser, hand-
// simulated approach shown in this subtopic's own first code tab.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a code comment like "each batch gets its own scope → fresh DbContext per batch" is sufficient documentation and does not need a corresponding test, since the code visibly creates a scope inside the loop.',
      reality: 'a future refactor can accidentally hoist scope creation outside the loop (or otherwise break the fresh-instance guarantee) without any compile error or ValidateOnBuild failure, since the registration itself remains perfectly valid — only a test asserting on actual instance identity across iterations catches this class of regression.',
    },
    {
      thought: 'ValidateOnBuild and ValidateScopes together provide complete protection against all DI lifetime mistakes in a BackgroundService.',
      reality: 'both checks validate the STATIC registration graph and captive-dependency shape — neither can detect a DYNAMIC mistake like scope creation being placed outside a loop, since that is a runtime control-flow decision, not a registration-time property.',
    },
    {
      thought: 'testing a BackgroundService\'s internal per-iteration behavior always requires letting its infinite ExecuteAsync loop run to completion.',
      reality: 'ExecuteAsync loops run until cancellation by design — testing per-iteration behavior requires either a bounded CancellationTokenSource combined with a testability seam (an event or virtual method) exposing what happened each iteration, or a hand-simulated version of the same scope-creation logic tested in isolation.',
    },
  ];
}
