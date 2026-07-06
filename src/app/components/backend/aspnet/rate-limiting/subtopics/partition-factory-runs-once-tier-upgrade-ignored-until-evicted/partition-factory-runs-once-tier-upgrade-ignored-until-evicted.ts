import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-partition-factory-runs-once-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './partition-factory-runs-once-tier-upgrade-ignored-until-evicted.html',
  styleUrl: './partition-factory-runs-once-tier-upgrade-ignored-until-evicted.scss',
})
export class PartitionFactoryRunsOnceTierUpgradeIgnoredUntilEvictedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Partitioned Limiters section already states "partitions are created lazily and cached in memory by the partition key" — but stops short of the consequence that catches teams by surprise: the factory delegate\'s OPTIONS (like PermitLimit) are captured once at partition creation and never re-evaluated for that same key again',
      points: [
        'When <code>RateLimitPartition.GetFixedWindowLimiter(partitionKey, factory)</code> sees a partition key for the FIRST time, it invokes <code>factory</code> to get a <code>FixedWindowRateLimiterOptions</code> and constructs a <code>FixedWindowRateLimiter</code> instance from it, then stores that INSTANCE in an internal dictionary keyed by the partition key. Every SUBSEQUENT request with the SAME key reuses that stored instance directly — the factory delegate is <strong>not called again</strong> for that key, no matter how many requests arrive, until the partition is evicted (typically once idle past its window with no active leases).',
        'This means anything the factory delegate reads to DECIDE the limiter\'s options — a database lookup for a user\'s subscription tier, a feature flag, a claim value that could change between token refreshes — is effectively a <strong>snapshot taken once</strong>, at first-request time for that partition key, and frozen for the LIFETIME of that partition in memory. The main page\'s own "per-user" example reads <code>ClaimTypes.NameIdentifier</code> as the key but a HARD-CODED <code>PermitLimit = 60</code> as the options — it never demonstrates the trap because its options never depend on anything that could change; a REAL system that varies the limit per user (free vs. premium tiers) hits this immediately.',
      ],
    },
    {
      heading: 'The practical consequence: a user who upgrades from Free (10 req/min) to Premium (200 req/min) mid-session continues to be throttled at the Free-tier limit until their partition is evicted from memory — which happens only after a period of inactivity, not on any subscription-change event',
      points: [
        'Since eviction is tied to idle time (no requests for that key past the window duration, roughly), an ACTIVE premium user who keeps making requests continuously never triggers eviction — their partition, and its captured Free-tier options, can persist indefinitely across their entire session. The only ways to see the new limit take effect are: the user stops making requests long enough for the partition to be evicted and lazily recreated on their next request, or the process itself restarts (a deployment, a pod recycle).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The trap, reproduced — a mid-session tier change the limiter never sees',
      language: 'csharp',
      code: `builder.Services.AddRateLimiter(opts =>
{
    opts.AddPolicy("per-user-tiered", httpCtx =>
    {
        var userId = httpCtx.User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? "anon";

        // This factory runs ONCE per distinct userId — NOT once per
        // request. A database call here to check the CURRENT tier
        // only ever reflects the tier at the moment of first contact.
        var tier = SubscriptionService.GetCurrentTierSync(userId); // e.g. "Free"
        var limit = tier == "Premium" ? 200 : 10;

        return RateLimitPartition.GetFixedWindowLimiter(userId, _ =>
            new FixedWindowRateLimiterOptions
            {
                PermitLimit = limit,
                Window      = TimeSpan.FromMinutes(1),
            });
    });
});

// Timeline for a single user "alice":
//   t=0    alice is on the Free tier. First request creates her
//          partition with PermitLimit=10 (captured now).
//   t=30s  alice upgrades to Premium via the billing system.
//   t=31s  alice makes another request — SAME partition key "alice",
//          so the EXISTING limiter instance (PermitLimit=10, captured
//          at t=0) is reused. SubscriptionService.GetCurrentTierSync
//          is NOT called again — alice is still capped at 10/min,
//          despite her subscription record now correctly showing
//          Premium.`,
    },
    {
      label: 'The test proving it, and the fix — force re-evaluation via a distinct key per tier',
      language: 'csharp',
      code: `[Fact]
public async Task Tier_Upgrade_Mid_Session_Does_Not_Change_Existing_Limit()
{
    await using var app = new WebApplicationFactory<Program>();
    var client = app.CreateClient();
    AttachUserToken(client, userId: "alice", tier: "Free");

    // Exhaust the Free-tier limit (10/min) for alice — partition for
    // "alice" is created HERE, capturing PermitLimit = 10.
    for (var i = 0; i < 10; i++)
        await client.GetAsync("/api/data");
    var rejected = await client.GetAsync("/api/data");
    Assert.Equal(HttpStatusCode.TooManyRequests, rejected.StatusCode);

    // Upgrade alice's subscription in the underlying service —
    // her database record now says "Premium".
    SubscriptionService.SetTier("alice", "Premium");

    // Immediately retry — SAME partition key "alice" is reused with
    // its ORIGINAL captured options. The upgrade has NO effect yet:
    var stillRejected = await client.GetAsync("/api/data");
    Assert.Equal(HttpStatusCode.TooManyRequests, stillRejected.StatusCode);
    // This assertion PASSING is the bug, pinned down explicitly.
}

// THE FIX: fold the tier into the partition KEY itself, not just the
// options — a tier change then naturally produces a NEW key, and a
// fresh partition (with correctly re-evaluated options) is created:
opts.AddPolicy("per-user-tiered", httpCtx =>
{
    var userId = httpCtx.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anon";
    var tier   = SubscriptionService.GetCurrentTierSync(userId);
    var limit  = tier == "Premium" ? 200 : 10;

    // Partition key now includes the tier — "alice:Free" vs
    // "alice:Premium" are DIFFERENT partitions, so an upgrade
    // naturally routes to a brand-new partition with the new limit
    // applied immediately, at the cost of the old partition's
    // consumed quota not carrying over (a reasonable tradeoff for
    // a tier upgrade, which should arguably reset the user's window
    // anyway).
    return RateLimitPartition.GetFixedWindowLimiter($"{userId}:{tier}", _ =>
        new FixedWindowRateLimiterOptions { PermitLimit = limit, Window = TimeSpan.FromMinutes(1) });
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A different team, aware of this trap, "fixes" it by adding a background timer that clears the entire rate limiter\'s internal partition dictionary every 60 seconds via reflection, forcing all partitions to be recreated (and their factories re-run) periodically. What new problem does this introduce that the tier-in-the-key fix does not have?',
    hint: 'What happens to a user\'s IN-PROGRESS rate limit window — their already-consumed request count within the current minute — when their partition is forcibly cleared, versus when a NEW partition is created because their OWN key changed (tier upgrade)?',
    solution: `The periodic full-dictionary clear resets EVERY user's consumed quota
simultaneously, every 60 seconds, regardless of whether any individual
user's tier actually changed. This reintroduces a variant of the exact
boundary-burst problem the earlier subtopic on fixed-window testing
demonstrated: at each global clear, every active user's counter drops
to zero at the same instant, letting a client who was already close to
their limit immediately consume a full new allowance again — creating
a synchronized, cluster-wide burst opportunity on a fixed 60-second
cadence, for ALL users, not just ones who upgraded.

The tier-in-the-key fix does not have this problem because it only
creates a NEW partition for a SPECIFIC user at the SPECIFIC moment
their own key changes (their tier field flips) — every other user's
existing partition, with its accurately in-progress window count,
is completely undisturbed. The blast radius of the fix is scoped to
exactly the users who actually experienced a real change, rather than
a blunt instrument that resets everyone's state on a timer for the
sake of the rare user whose tier happened to change.

The broader lesson: when a rate limiter's per-partition state needs to
react to external state changes, prefer encoding the relevant external
state INTO the partition key so that a natural key-derived cache
invalidation happens exactly when needed — rather than reaching for a
global, time-based cache-clearing mechanism that punishes every
partition uniformly for a problem that only affects a small subset of
them.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a partitioned rate limiter policy\'s factory delegate — including any external lookups like a database call for subscription tier — runs on every request to compute the currently correct limit for that request.',
      reality: 'the factory runs exactly once per distinct partition key, when that key is first seen; the resulting limiter instance and its captured options are cached and reused for every subsequent request with the same key, until the partition is evicted from memory.',
    },
    {
      thought: 'a mid-session change to whatever determines a user\'s rate limit (subscription tier, account status, a feature flag) takes effect on their very next request, since the policy factory reads that value.',
      reality: 'as long as the user\'s partition key stays the same and the partition remains active (not evicted due to inactivity), the ORIGINAL captured options persist for the lifetime of that partition — a mid-session external change has no effect until eviction (idle timeout) forces the partition to be lazily recreated.',
    },
    {
      thought: 'forcing rate limiter partitions to refresh periodically (e.g. clearing the internal cache on a timer) is a safe, low-risk way to make external-state changes take effect promptly.',
      reality: 'a blanket periodic clear resets EVERY active partition\'s in-progress window count simultaneously, creating a synchronized burst opportunity for all users on a predictable cadence — encoding the relevant external state into the partition key itself scopes the reset to only the specific users whose state actually changed.',
    },
  ];
}
