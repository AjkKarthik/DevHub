import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-singleton-state-leak-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './singleton-state-in-shared-factory-leaks-across-test-methods.html',
  styleUrl: './singleton-state-in-shared-factory-leaks-across-test-methods.scss',
})
export class SingletonStateInSharedFactoryLeaksAcrossTestMethodsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Common Mistake covers static fields shared ACROSS parallel test classes — but there is a narrower, more insidious version of the same problem entirely WITHIN a single class: any Singleton DI service (not just an explicit static field) is shared by every test METHOD in that class, because IClassFixture shares ONE app (and therefore one DI container) for the whole class',
      points: [
        'The main page\'s theory correctly states that <code>IClassFixture&lt;WebApplicationFactory&lt;Program&gt;&gt;</code> starts the app "once per test class — shared across all test methods." This is exactly the mechanism that makes the narrower leak possible: ANY service registered as <code>AddSingleton&lt;T&gt;()</code> in the real app\'s composition root (an <code>IMemoryCache</code>, a rate limiter, a feature-flag cache, an in-memory metrics counter) is constructed ONCE for that shared factory and lives for the ENTIRE class\'s test run — every test method operates against the SAME instance, not a fresh one.',
        'This is a fundamentally different risk from the page\'s own "shared static field" mistake, which is about explicit, hand-written static fields on the TEST fixture itself (easy to spot in a code review). A Singleton leak instead comes from the REAL APPLICATION\'s own DI registrations — services the test author never wrote and may not even be thinking about as "test state" at all, since from the production code\'s point of view, Singleton lifetime is completely correct and intentional.',
      ],
    },
    {
      heading: 'Concretely, this connects directly to the Rate Limiting topic\'s own partition-caching behavior — a partitioned rate limiter\'s per-key state, once created, persists for the life of the DI container, which for a shared IClassFixture factory means for the life of the WHOLE TEST CLASS',
      points: [
        'If an endpoint under test is protected by a partitioned rate limiter keyed by, say, a fixed test user ID (a common simplification in test auth setups — the same <code>ClaimTypes.NameIdentifier = "1"</code> the main page\'s own <code>TestAuthHandler</code> example hard-codes), then EVERY test method that hits that endpoint, across the WHOLE class, shares the SAME rate-limiter partition. A test method early in the run that legitimately exhausts the limit (to test the 429 behavior) leaves that partition\'s counter elevated for every LATER test method in the same class — even ones that have nothing to do with rate limiting and simply expect a normal 200 response.',
        'This failure mode is a genuine TEST ORDER DEPENDENCY: the test suite passes or fails depending on which order xUnit happens to run the methods in (by default, unspecified/effectively arbitrary unless explicitly configured), which is exactly the kind of flakiness the main page\'s own Q&A ("My integration test intermittently fails — how do I debug flakiness?") lists shared mutable state and parallel execution races as causes for — this is a THIRD, more specific cause the page\'s existing list does not explicitly name: Singleton production-code state shared across test methods within one class.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The leak, reproduced — a rate limiter test poisons a later, unrelated test',
      language: 'csharp',
      code: `// Real app registration (production code, entirely reasonable on
// its own — nothing "wrong" about this Singleton by itself):
builder.Services.AddRateLimiter(opts =>
    opts.AddPolicy("per-user", httpCtx =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpCtx.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anon",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 3,
                Window = TimeSpan.FromMinutes(1),
            })));

app.MapGet("/api/data", () => "ok").RequireRateLimiting("per-user");

// Test class — ONE shared factory (IClassFixture), and the
// TestAuthHandler always returns the SAME NameIdentifier ("1") for
// every request, exactly like the main page's own example:
public class DataEndpointTests(TestWebApp app) : IClassFixture<TestWebApp>
{
    private readonly HttpClient _client = app.CreateClient();

    [Fact]
    public async Task RateLimiter_Returns429_AfterThreeRequests()
    {
        // Deliberately exhausts the "per-user" limit for user "1" —
        // a perfectly reasonable, self-contained-LOOKING test:
        for (var i = 0; i < 3; i++)
            await _client.GetAsync("/api/data");
        var fourth = await _client.GetAsync("/api/data");
        fourth.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        // This test PASSES — but it leaves user "1"'s rate-limit
        // partition in an EXHAUSTED state, inside the SHARED factory's
        // Singleton rate limiter, for the rest of the class's run.
    }

    [Fact]
    public async Task GetData_Returns200_ForNormalRequest()
    {
        // This test has NOTHING to do with rate limiting — it just
        // wants to check a normal, successful response. But if xUnit
        // happens to run it AFTER the test above (order is otherwise
        // unspecified), it unexpectedly gets 429, not 200 — because
        // it shares the SAME rate-limiter Singleton, SAME partition
        // key ("1", from the same hard-coded test identity), and the
        // window from the PRIOR test hasn't rolled over yet:
        var response = await _client.GetAsync("/api/data");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        // FAILS ~half the time, depending on xUnit's method ordering —
        // a real, hard-to-reproduce-on-demand flaky test.
    }
}`,
    },
    {
      label: 'Two independent fixes — vary the identity per test, or isolate the Singleton per test',
      language: 'csharp',
      code: `// FIX 1 — give each test a DISTINCT identity (composes naturally
// with the configurable TestAuthHandler from the earlier subtopic in
// this set), so different tests never share a rate-limiter partition
// even though they share the same Singleton limiter instance:
[Fact]
public async Task RateLimiter_Returns429_AfterThreeRequests()
{
    using var scoped = app.WithWebHostBuilder(b => b.ConfigureTestServices(s =>
        s.Configure<TestAuthOptions>(o => o.UserId = "rate-limit-test-user")));
    var client = scoped.CreateClient();

    for (var i = 0; i < 3; i++) await client.GetAsync("/api/data");
    var fourth = await client.GetAsync("/api/data");
    fourth.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
    // Partition key is now unique to THIS test — no other test method
    // can ever collide with it, regardless of execution order.
}

// FIX 2 — when the Singleton itself is the thing under test elsewhere,
// isolate it per test via WithWebHostBuilder() re-registering a FRESH
// instance rather than relying on the shared one at all:
[Fact]
public async Task GetData_Returns200_ForNormalRequest()
{
    using var isolated = app.WithWebHostBuilder(b => b.ConfigureTestServices(s =>
    {
        // Force a brand-new rate limiter for JUST this test, detached
        // from whatever state prior tests left in the shared instance:
        s.RemoveAll<PartitionedRateLimiter<HttpContext>>();
        // (re-register the same policy — a fresh limiter, zero history)
    }));
    var response = await isolated.CreateClient().GetAsync("/api/data");
    response.StatusCode.Should().Be(HttpStatusCode.OK);
    // Passes deterministically, regardless of what ANY other test in
    // the class did first.
}

// The general principle: when a test's correctness depends on a
// Singleton's INTERNAL state being "fresh," either give the test its
// own distinguishing key (Fix 1, usually cheaper) or its own isolated
// service instance via WithWebHostBuilder() (Fix 2, when the Singleton
// itself has no natural per-test key to vary).`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A test class has 20 test methods, all hitting endpoints protected by an IMemoryCache-backed Singleton "recently viewed products" feature that caches results for 5 minutes per product ID. One early test seeds product ID 42 into the cache with stale data (to test a cache-hit code path) and never cleans it up. Explain precisely which LATER tests are at risk, and propose a fix that doesn\'t require touching the IMemoryCache registration itself.',
    hint: 'The risk here is scoped by the CACHE KEY (product ID), not by user identity like the rate-limiter example — which later tests use product ID 42 specifically? What is the equivalent of "Fix 1" (vary the distinguishing key) for a cache keyed by product ID rather than user ID?',
    solution: `Only the tests that happen to use product ID 42 (or whatever the
seeded product's ID is) are at risk — not every test in the class,
unlike the rate-limiter example where the SAME hard-coded user
identity ("1") meant every single request shared one partition. This
narrower blast radius is easy to miss: a reviewer scanning the test
class might reasonably think "only the caching test touches product 42,
what's the harm" — but any OTHER, unrelated test that also happens to
use product 42 (perhaps because it's a convenient, already-existing
fixture ID reused across multiple tests for "a normal product") will
silently read the STALE cached value seeded by the earlier test,
rather than the fresh value it expects, IF it runs after the caching
test in xUnit's arbitrary method order.

The equivalent of "Fix 1" here is straightforward and doesn't require
touching the IMemoryCache registration at all: give the
cache-poisoning test its OWN dedicated, clearly-reserved product ID
that no other test in the class ever uses for anything else — e.g., a
constant like TestProductIds.CacheHitScenario = 9001, documented in
a comment as "reserved for cache behavior tests, do not reuse." This
mirrors exactly the rate-limiter fix's logic (give the state-mutating
test its own distinguishing key) applied to a DIFFERENT kind of shared
Singleton state (a cache keyed by entity ID rather than a rate limiter
keyed by user ID) — the general pattern generalizes: whenever a
Singleton's internal state is keyed by SOME identifier, giving each
test that deliberately manipulates that state its own reserved,
never-reused key value eliminates the leak without needing to isolate
or replace the Singleton service itself.

The deeper lesson worth generalizing from both this and the earlier
rate-limiter example: any time a test class shares ONE
WebApplicationFactory (and therefore one DI container) across many
methods, EVERY keyed Singleton in the real application is a potential
cross-test leak vector — the fix is almost always "make sure each
test's KEY into that Singleton's state is unique to that test," which
is far cheaper than re-architecting DI registrations per test.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s "sharing mutable test state across parallel test classes" mistake covers the full risk of shared state in tests — as long as I avoid hand-written static fields, my tests are safe from this class of bug.',
      reality: 'a much narrower and easier-to-miss version of the same risk exists entirely WITHIN one test class: any Singleton service registered by the REAL application (a rate limiter, an IMemoryCache, a metrics counter) is shared by every test METHOD in a class using IClassFixture, since the whole class shares one DI container — this has nothing to do with hand-written statics on the test fixture and everything to do with ordinary, correct production Singleton registrations.',
    },
    {
      thought: 'a test that hard-codes the same authenticated identity (e.g., NameIdentifier = "1") for every request, as the main page\'s own TestAuthHandler example does, has no downside as long as the TestAuthHandler itself is stateless.',
      reality: 'if any endpoint under test is backed by a partitioned Singleton keyed by that identity (a rate limiter being the clearest example), every test method sharing that same hard-coded identity also shares that Singleton\'s per-key state, creating a test-order-dependent flakiness risk that has nothing to do with the auth handler\'s own statelessness.',
    },
    {
      thought: 'a test-order-dependent flaky test always traces back to either a static field or an async race condition — those are the standard causes.',
      reality: 'a third, distinct cause is a Singleton service\'s per-key internal state (rate limiter partitions, cache entries) persisting across test methods that happen to share the same key, which produces IDENTICAL symptoms (intermittent, order-dependent failures) without involving any static field or genuine concurrency race at all.',
    },
  ];
}
