import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-health-check-boundary-logic-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-health-check-boundary-logic-and-liveness-runs-zero-checks.html',
  styleUrl: './testing-health-check-boundary-logic-and-liveness-runs-zero-checks.scss',
})
export class TestingHealthCheckBoundaryLogicAndLivenessRunsZeroChecksSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own LicenseExpiryCheck has precise boundary logic (>30 days Healthy, >7 Degraded, else Unhealthy) that is exactly the kind of off-by-one-prone code that deserves direct unit tests — and IHealthCheck.CheckHealthAsync() is an ordinary interface method, testable with zero HTTP involved',
      points: [
        'A custom <code>IHealthCheck</code> class can be instantiated directly with test doubles for its dependencies (exactly like any other service) and its <code>CheckHealthAsync(context, ct)</code> method called directly — no <code>WebApplicationFactory</code>, no real HTTP request, no health check middleware involved at all. The <code>HealthCheckContext</code> parameter can usually be a blank <code>new HealthCheckContext()</code> unless the check reads <code>context.Registration.FailureStatus</code>, in which case that needs constructing too.',
        'The EXACT boundary values in a switch expression like the main page\'s <code>daysLeft switch { &gt; 30 =&gt; Healthy, &gt; 7 =&gt; Degraded, _ =&gt; Unhealthy }</code> deserve dedicated tests at 31/30 (crossing Healthy→Degraded) and 8/7 (crossing Degraded→Unhealthy) — these exact boundary values are precisely where off-by-one errors hide, and they are invisible from reading the code casually.',
      ],
    },
    {
      heading: 'Separately, the main page\'s liveness-vs-readiness distinction ("liveness uses Predicate = _ => false — no checks") is a claim about BEHAVIOR that deserves its own integration-level proof: a WebApplicationFactory test can register a check that ALWAYS throws, then assert that /health/live still returns Healthy while /health/ready correctly reports the failure — proving the predicate genuinely excludes the check from execution, not just from the response',
      points: [
        'This distinction matters because there are two very different ways "liveness ignores dependency checks" could be implemented: the checks could still RUN but their results simply aren\'t INCLUDED in the response (still paying the cost, still vulnerable to a hanging check blocking the liveness endpoint), or the checks could be SKIPPED ENTIRELY via the <code>Predicate</code> filter, never executing at all. Only a test that proves a throwing/hanging check does NOT affect <code>/health/live</code>\'s response time or outcome distinguishes these two possibilities — and only the second (skip entirely) is actually safe for a liveness probe.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Unit testing the exact boundary values in a custom IHealthCheck',
      language: 'csharp',
      code: `public class LicenseExpiryCheckTests
{
    private static LicenseExpiryCheck MakeSut(int daysUntilExpiry)
    {
        var licenseService = Substitute.For<ILicenseService>();
        licenseService.GetExpiryDateAsync(Arg.Any<CancellationToken>())
            .Returns(DateTime.UtcNow.AddDays(daysUntilExpiry));
        return new LicenseExpiryCheck(licenseService);
    }

    [Theory]
    [InlineData(31, HealthStatus.Healthy)]   // just above the >30 boundary
    [InlineData(30, HealthStatus.Degraded)]  // exactly AT 30 — falls to the >7 branch
    [InlineData(8,  HealthStatus.Degraded)]  // just above the >7 boundary
    [InlineData(7,  HealthStatus.Unhealthy)] // exactly AT 7 — falls to the default branch
    [InlineData(0,  HealthStatus.Unhealthy)]
    [InlineData(-5, HealthStatus.Unhealthy)] // already expired
    public async Task CheckHealthAsync_Returns_Correct_Status_At_Exact_Boundaries(
        int daysUntilExpiry, HealthStatus expected)
    {
        var sut = MakeSut(daysUntilExpiry);

        var result = await sut.CheckHealthAsync(new HealthCheckContext());

        Assert.Equal(expected, result.Status);
        // The (30, Degraded) and (7, Unhealthy) cases are the ones that
        // actually PROVE the switch uses "greater than" semantics rather
        // than "greater than or equal to" — a test using only 31/8/0
        // would pass even if someone accidentally changed > to >=
        // somewhere, since those inputs don't sit exactly ON a boundary.
    }

    [Fact]
    public async Task CheckHealthAsync_Returns_Unhealthy_When_LicenseService_Throws()
    {
        var licenseService = Substitute.For<ILicenseService>();
        licenseService.GetExpiryDateAsync(Arg.Any<CancellationToken>())
            .ThrowsAsync(new HttpRequestException("license service unreachable"));
        var sut = new LicenseExpiryCheck(licenseService);

        var result = await sut.CheckHealthAsync(new HealthCheckContext());

        Assert.Equal(HealthStatus.Unhealthy, result.Status);
        Assert.NotNull(result.Exception);
    }
}`,
    },
    {
      label: 'Proving liveness genuinely SKIPS checks — not just excludes them from the response',
      language: 'csharp',
      code: `// A check that would reveal itself if it were ever actually invoked:
public class AlwaysThrowsCheck : IHealthCheck
{
    public static int InvocationCount;

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken ct = default)
    {
        Interlocked.Increment(ref InvocationCount);
        throw new InvalidOperationException("This check should never run on liveness.");
    }
}

public class TestWebApp : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            services.AddHealthChecks()
                .AddCheck<AlwaysThrowsCheck>("always-throws", tags: ["ready"]);
        });
    }
}

[Fact]
public async Task Liveness_Never_Invokes_Registered_Checks()
{
    AlwaysThrowsCheck.InvocationCount = 0;
    await using var app = new TestWebApp();
    var client = app.CreateClient();

    var response = await client.GetAsync("/health/live");

    // Proves the check was SKIPPED, not merely excluded from the
    // response body — if Predicate were implemented as "run everything,
    // filter the OUTPUT," this assertion would fail with count > 0:
    Assert.Equal(0, AlwaysThrowsCheck.InvocationCount);
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
}

[Fact]
public async Task Readiness_Does_Invoke_The_Same_Check_And_Reports_Its_Failure()
{
    AlwaysThrowsCheck.InvocationCount = 0;
    await using var app = new TestWebApp();
    var client = app.CreateClient();

    var response = await client.GetAsync("/health/ready");

    // SAME check, DIFFERENT endpoint — now it genuinely runs (and its
    // thrown exception is caught by the framework and surfaces as
    // Unhealthy in the aggregate report):
    Assert.True(AlwaysThrowsCheck.InvocationCount > 0);
    Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
}
// Together, these two tests prove the Predicate genuinely changes
// WHICH checks execute per endpoint — not just which results get
// reported — confirming the main page's own liveness/readiness
// distinction is architecturally real, not just a display filter.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues the InlineData(30, Degraded) and InlineData(7, Unhealthy) test cases are redundant since InlineData(31, Healthy) and InlineData(8, Degraded) already cover "the general behavior" of each branch. Explain precisely what class of bug the boundary-exact test cases catch that the others cannot, using the actual C# switch expression syntax from the main page.',
    hint: 'The main page\'s switch uses > 30 and > 7 (strictly greater than). If a future edit accidentally changed one of these to >= 30 or >= 7, would a test using 31 or 8 (comfortably clear of the boundary) still pass? Would a test using EXACTLY 30 or 7 still pass?',
    solution: `Testing only 31 and 8 (values comfortably clear of each boundary)
would NOT catch a regression where > 30 is accidentally changed to
>= 30, or > 7 to >= 7 — those inputs are unaffected by the change in
comparison operator, since 31 satisfies BOTH "> 30" and ">= 30"
identically, and 8 satisfies both "> 7" and ">= 7" identically. A test
suite using only clear-of-boundary values passes whether the operator
is > or >=, providing ZERO signal about which one is actually in the
code.

Testing EXACTLY 30 and EXACTLY 7 is what actually distinguishes the
two operators: with the CORRECT code (strictly >), daysLeft = 30 fails
the first branch's condition and falls through to the Degraded branch
(">7" is satisfied by 30) — matching the InlineData(30, Degraded) test.
If someone accidentally changed the operator to >=, daysLeft = 30 WOULD
satisfy ">= 30" and incorrectly return Healthy instead of Degraded —
which is exactly the kind of one-character regression that silently
changes when a license expiry warning actually starts firing, by
potentially a full day, in a way that's easy to miss in code review
(">" and ">=" look nearly identical) and would go completely
undetected by a test suite that only ever exercises comfortably-clear
values.

The general testing principle this illustrates: for any comparison-
based branching logic, the test cases that carry the most diagnostic
value are the ones sitting EXACTLY on each boundary value, not the
ones safely inside each branch's "obvious" range — boundary-exact
tests are the only ones capable of catching an off-by-one or
wrong-comparison-operator mistake, which is precisely the class of bug
most likely to slip through code review in a dense switch expression.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a custom IHealthCheck implementation requires spinning up a WebApplicationFactory and hitting the actual health check endpoint over HTTP.',
      reality: 'CheckHealthAsync(context, ct) is an ordinary interface method on an ordinary class — it can be instantiated directly with test doubles for its dependencies and called directly in a unit test, with no HTTP layer, host, or health check middleware involved at all.',
    },
    {
      thought: 'test cases using values comfortably inside each branch of a boundary-based switch expression (e.g. 31 days, 8 days) provide equivalent coverage to testing the exact boundary values (30 days, 7 days).',
      reality: 'only test cases sitting EXACTLY on a boundary value can distinguish a strictly-greater-than comparison from a greater-than-or-equal one — values safely inside a branch\'s range satisfy both operators identically and provide zero signal about which one the code actually uses.',
    },
    {
      thought: 'the main page\'s statement that liveness uses "Predicate = _ => false — no checks" just means the health check RESULTS are filtered out of the liveness response, while the checks still run in the background.',
      reality: 'the Predicate genuinely prevents matching checks from being INVOKED at all for that endpoint — provable directly by registering a check that increments a counter or throws, and confirming zero invocations occur when hitting the liveness endpoint versus the readiness endpoint.',
    },
  ];
}
