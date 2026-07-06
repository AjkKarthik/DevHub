import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-fixed-window-boundary-burst-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-fixed-window-boundary-burst-with-faketimeprovider.html',
  styleUrl: './testing-fixed-window-boundary-burst-with-faketimeprovider.scss',
})
export class TestingFixedWindowBoundaryBurstWithFaketimeproviderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the fixed-window boundary burst as a fact ("100 requests at 00:59 and 100 more at 01:01 effectively sends 200 in 2 seconds") but never shows it actually happening — and its own Q&A recommends overriding TimeProvider for exactly this kind of test without showing the mechanics',
      points: [
        'The .NET rate limiter primitives (<code>FixedWindowRateLimiter</code> and friends) accept a <code>TimeProvider</code> in their constructor options specifically so tests do not need real wall-clock delays. In a <code>WebApplicationFactory</code>-based test, register a <code>FakeTimeProvider</code> (from <code>Microsoft.Extensions.TimeProvider.Testing</code>) as a singleton BEFORE the app builds its rate limiter policies — the limiter reads <code>TimeProvider.GetUtcNow()</code> internally instead of <code>DateTimeOffset.UtcNow</code>, so advancing the fake clock deterministically simulates window rollover with zero real time elapsed.',
        'Proving the boundary burst requires driving the fake clock across EXACTLY the window boundary: send the permit-limit\'s worth of requests, advance the clock past <code>Window</code> (but not further), then send the same number again — a passing test demonstrates BOTH batches succeed, evidencing double the configured limit crossed the boundary in what the fake clock treats as a near-instant transition.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Wiring FakeTimeProvider into the rate limiter test host',
      language: 'csharp',
      code: `// Test project: Microsoft.Extensions.TimeProvider.Testing
public class RateLimiterTestFactory : WebApplicationFactory<Program>
{
    public FakeTimeProvider TimeProvider { get; } = new(DateTimeOffset.UtcNow);

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Replace the real TimeProvider with the fake BEFORE the
            // rate limiter's FixedWindowRateLimiter reads it internally.
            services.AddSingleton<TimeProvider>(TimeProvider);
        });
    }
}

// Program.cs — the app must actually consume TimeProvider from DI for
// this to take effect (the rate limiter options accept one explicitly):
builder.Services.AddRateLimiter(opts =>
{
    opts.AddFixedWindowLimiter("fixed", o =>
    {
        o.PermitLimit = 5;
        o.Window      = TimeSpan.FromSeconds(60);
        o.TimeProvider = builder.Services.BuildServiceProvider()
                                          .GetRequiredService<TimeProvider>();
    });
});`,
    },
    {
      label: 'The test — proving the boundary burst deterministically, no sleeping',
      language: 'csharp',
      code: `[Fact]
public async Task FixedWindow_Allows_Double_Limit_Across_Boundary()
{
    await using var factory = new RateLimiterTestFactory();
    var client = factory.CreateClient();

    // Batch 1 — consume the full 5-request permit limit inside window N
    for (var i = 0; i < 5; i++)
    {
        var response = await client.GetAsync("/data");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // The 6th request in the SAME window is correctly rejected —
    // this alone would look like the limiter is working perfectly:
    var rejected = await client.GetAsync("/data");
    Assert.Equal(HttpStatusCode.TooManyRequests, rejected.StatusCode);

    // Advance the fake clock past the 60-second window boundary —
    // zero real time elapses, but the limiter now considers this a
    // brand new window:
    factory.TimeProvider.Advance(TimeSpan.FromSeconds(61));

    // Batch 2 — the SAME client can immediately consume another full
    // 5-request allowance:
    for (var i = 0; i < 5; i++)
    {
        var response = await client.GetAsync("/data");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // 10 successful requests total, achievable in a window that a
    // naive reading of "5 requests per 60 seconds" would suggest
    // should cap out at 5 — this is exactly the boundary burst the
    // main page describes, now pinned down by a deterministic,
    // zero-sleep test instead of a prose claim.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Modify the test to use AddSlidingWindowLimiter (4 segments, same 60s window and 5-request limit) instead of AddFixedWindowLimiter, advancing the fake clock by only 15 seconds (one segment) between the two batches instead of the full 61 seconds. Predict whether all 10 requests still succeed, and why the sliding window design changes the outcome.',
    hint: 'A sliding window tracks requests per SEGMENT, not just a single window-start timestamp. After advancing by only one segment (15s of a 4-segment, 60s window), how much of the original window\'s quota has actually "expired" versus is still counted against the limit?',
    solution: `No — the 6th request in batch 2 is rejected under the sliding window
configuration, unlike the fixed window case.

A sliding window with 4 segments divides the 60-second window into
four 15-second segments and tracks the request count PER SEGMENT. When
the clock advances by only 15 seconds (one segment), the limiter
expires only the OLDEST segment's count and recomputes the total as
the sum of the three still-valid segments plus the new segment — NOT
a full reset to zero the way a fixed window treats crossing its single
boundary. Since all 5 of batch 1's requests landed within the most
recent segment before the 15-second advance, after advancing by
exactly one segment, only that oldest 15-second slice's contribution
(which, depending on exact timing, may be all 5 or a partial count) is
subtracted — the running total remains close to the limit, and the
6th request in what looks like "a second batch of 5" gets rejected.

This is precisely the mechanism the main page's own theory point
describes in words ("smooths out the boundary burst by distributing
the quota over rolling time") — this exercise makes it concrete and
testable: the SAME clock-advance technique that produces a full
double-limit burst under fixed-window produces a much smaller, or
zero, burst under sliding-window, because the sliding window has no
single instant where the ENTIRE quota resets at once. Proving this
with a fake clock is significantly more informative than reading the
theory point alone — the exact segment boundaries determine exactly
how much burst leakage remains, which is itself tunable via
SegmentsPerWindow.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing time-based rate limiting behavior requires either real wall-clock delays (Task.Delay/Thread.Sleep) or a lot of test flakiness tolerance.',
      reality: 'the built-in rate limiter primitives accept an injectable TimeProvider specifically so a FakeTimeProvider can drive window rollover deterministically in tests, with zero real time elapsed and no flakiness.',
    },
    {
      thought: 'a fixed window rate limiter caps total throughput at exactly PermitLimit requests per Window, full stop — "5 per minute" means never more than 5 in any 60-second span.',
      reality: 'a fixed window limiter resets its ENTIRE counter at the window boundary regardless of when within the window requests actually landed — a client can legitimately send PermitLimit requests just before the boundary and PermitLimit more just after, achieving double the configured limit within a much shorter real span than the nominal window.',
    },
    {
      thought: 'switching from fixed window to sliding window with the same PermitLimit and Window values is purely an implementation detail with no behavioral difference a test could observe.',
      reality: 'sliding window tracks per-segment counts and only expires the oldest segment\'s contribution as time advances, meaning the same clock-advance technique that produces a full double-limit boundary burst under fixed window produces little to no burst under sliding window — a concretely different, testable outcome.',
    },
  ];
}
