import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-route-precedence-ambiguous-routes-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-route-precedence-catching-ambiguous-routes-before-production.html',
  styleUrl: './testing-route-precedence-catching-ambiguous-routes-before-production.scss',
})
export class TestingRoutePrecedenceCatchingAmbiguousRoutesBeforeProductionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states AmbiguousMatchException is thrown "at startup" — this means it is genuinely testable BEFORE deployment, not just something you discover when the app fails to boot in production',
      points: [
        'The main Routing page notes: "Ambiguity at startup... throws AmbiguousMatchException — the app fails to start. This is intentional." Since the exception happens at HOST STARTUP (not on the first matching request), a test that simply CONSTRUCTS the app\'s host — without ever sending an HTTP request — already exercises route registration and will surface an ambiguity, precisely the same way starting the real app in production would, except in a fast, automated test run.',
      ],
    },
    {
      heading: 'A lightweight integration test using a minimal test host can verify BOTH "the app starts cleanly" and "a specific URL resolves to the expected route" — without full WebApplicationFactory ceremony',
      points: [
        'Building a minimal <code>WebApplication</code> (or using <code>Microsoft.AspNetCore.TestHost</code>\'s <code>TestServer</code>) with the SAME route registrations as production, then sending a <code>TestServer</code>-backed request THROUGH the actual routing system, is the most faithful way to verify the main page\'s own precedence claims (<code>/users/me</code> winning over <code>/users/{id}</code>) — it exercises the REAL <code>EndpointDataSource</code> and matching algorithm, not a hand-rolled reimplementation of routing logic.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A minimal test host verifying app startup succeeds (catches AmbiguousMatchException early)',
      language: 'csharp',
      code: `using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.TestHost;
using Xunit;

public class RouteStartupTests
{
    [Fact]
    public void AppStartsCleanly_NoAmbiguousRoutes()
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();   // in-memory server, no real socket

        var app = builder.Build();

        // Register the SAME routes production uses:
        RegisterRoutes(app);

        // Starting the host is what actually triggers ASP.NET Core's
        // route table validation — if two routes are ambiguous, THIS
        // line throws AmbiguousMatchException, exactly as it would
        // starting the real app in production:
        var exception = Record.ExceptionAsync(() => app.StartAsync()).Result;

        Assert.Null(exception);
        app.StopAsync().Wait();
    }

    // Extracted so both Program.cs and this test call the SAME
    // registration code — exactly the same "shared, testable
    // registration method" pattern used elsewhere in this hub:
    public static void RegisterRoutes(WebApplication app)
    {
        app.MapGet("/users/me",   () => "current user");
        app.MapGet("/users/{id}", (string id) => \$"user {id}");
        // If a THIRD route with an identical template to either of
        // these were accidentally added here, THIS test would fail
        // with AmbiguousMatchException — caught in CI, not in a
        // production deployment that refuses to start.
    }
}`,
    },
    {
      label: 'Verifying the main page\'s own precedence claim — /users/me actually wins',
      language: 'csharp',
      code: `using Microsoft.AspNetCore.TestHost;

public class RoutePrecedenceTests
{
    [Fact]
    public async Task UsersMe_ResolvesToLiteralRoute_NotParameterRoute()
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        var app = builder.Build();
        RouteStartupTests.RegisterRoutes(app);
        await app.StartAsync();

        // TestServer's CreateClient() sends REAL requests through the
        // REAL routing/matching pipeline — this is not a simulation,
        // it exercises the same EndpointDataSource production uses:
        using var client = app.GetTestClient();

        var response = await client.GetStringAsync("/users/me");

        // Proves the main page's own precedence claim directly:
        // literal "/users/me" wins over "/users/{id}" for this exact URL,
        // REGARDLESS of which was registered first in RegisterRoutes:
        Assert.Equal("current user", response);

        await app.StopAsync();
    }

    [Fact]
    public async Task UsersSomeoneElse_ResolvesToParameterRoute()
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        var app = builder.Build();
        RouteStartupTests.RegisterRoutes(app);
        await app.StartAsync();

        using var client = app.GetTestClient();
        var response = await client.GetStringAsync("/users/alice");

        Assert.Equal("user alice", response);   // falls through to the
                                                 // parameterized route
        await app.StopAsync();
    }
}`,
    },
    {
      label: 'Wiring this as a fast CI gate for any team that registers routes dynamically',
      language: 'csharp',
      code: `# This test suite is specifically valuable for teams that register
# routes PROGRAMMATICALLY (e.g. looping over a list of plugin modules,
# each contributing its own routes) — a scenario where a genuine
# route conflict is much easier to introduce ACCIDENTALLY than with a
# small, hand-written, all-in-one-file route list:

public static void RegisterPluginRoutes(WebApplication app, IEnumerable<IRoutePlugin> plugins)
{
    foreach (var plugin in plugins)
        plugin.MapRoutes(app);   // each plugin registers its OWN routes —
                                  // a genuine risk of two plugins
                                  // accidentally claiming the same template
}

[Fact]
public void AllPluginRoutes_RegisterWithoutAmbiguity()
{
    var builder = WebApplication.CreateBuilder();
    builder.WebHost.UseTestServer();
    var app = builder.Build();

    var plugins = DiscoverAllPlugins();  // the SAME discovery logic
                                          // production startup uses
    var exception = Record.Exception(() => RegisterPluginRoutes(app, plugins));

    // This test alone would have caught an ambiguity between, say,
    // a "ReportsPlugin" and an "AnalyticsPlugin" that both happened to
    // register "/api/summary" — WITHOUT needing to actually start the
    // real production host to discover the conflict:
    Assert.Null(exception);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s CI pipeline runs the "app starts cleanly" test from this subtopic on every pull request, and it has been green for months. A production deployment then fails to start with <code>AmbiguousMatchException</code> for two routes that were ALREADY both present in the codebase for a while. Explain a realistic reason the CI test could have missed this despite testing "the same routes," and how to close that gap.',
    hint: 'Consider whether the CI test\'s RegisterRoutes-equivalent method is GUARANTEED to register every route the real production Program.cs registers, or whether it is possible for the two to drift apart over time — perhaps one route is registered conditionally, behind a feature flag or environment check that differs between the test and production configuration.',
    solution: `// The REAL Program.cs, with a CONDITIONAL route registration the test
// method does not mirror:
var app = builder.Build();

RouteStartupTests.RegisterRoutes(app);   // the SAME shared method the
                                          // test calls — this part is fine

// A route added LATER, directly in Program.cs, NOT inside the shared
// RegisterRoutes method the test calls:
if (app.Configuration.GetValue<bool>("Features:LegacyUserEndpoint"))
{
    app.MapGet("/users/{userId}", (string userId) => \$"legacy user {userId}");
    // This ambiguously conflicts with "/users/{id}" from RegisterRoutes —
    // SAME precedence, different parameter NAME only (which does not
    // affect ambiguity — the ROUTE TEMPLATE SHAPE is what matters)
}

// WHY THE CI TEST NEVER CAUGHT THIS: the test calls
// "RouteStartupTests.RegisterRoutes(app)" directly — a method that was
// extracted specifically to be SHARED and testable. But this new route
// was added DIRECTLY in Program.cs, OUTSIDE that shared method,
// specifically because it was config-gated and someone reasonably (but
// mistakenly, from a testing-completeness standpoint) assumed it
// belonged inline rather than in the shared, tested method. The CI
// test's "app" never had this conditional route registered on it at
// all, so it could never have detected the conflict — it was testing
// a GENUINE SUBSET of what production actually registers, not the
// FULL, real registration surface.
//
// This is NOT a flaw in the testing TECHNIQUE from this subtopic — it
// is a discipline gap: ANY route registration living OUTSIDE the
// shared, tested registration method is invisible to this specific
// safety net, no matter how good the test itself is.
//
// THE FIX: route ALL registrations — including config-gated,
// conditional ones — through the SAME shared method the test calls,
// with the config value itself passed in as a parameter (or read from
// an injected IConfiguration inside that method) so the test can
// exercise BOTH the flag-enabled and flag-disabled paths explicitly:
public static void RegisterRoutes(WebApplication app, IConfiguration config)
{
    app.MapGet("/users/me",   () => "current user");
    app.MapGet("/users/{id}", (string id) => \$"user {id}");

    if (config.GetValue<bool>("Features:LegacyUserEndpoint"))
        app.MapGet("/users/{userId}", (string userId) => \$"legacy user {userId}");
}

// Now a test can specifically exercise the flag-ENABLED configuration
// and would catch this exact ambiguity, closing the gap:
[Fact]
public void AppStartsCleanly_WithLegacyUserEndpointFlagEnabled()
{
    var config = new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
            { ["Features:LegacyUserEndpoint"] = "true" })
        .Build();
    // ... build app, call RegisterRoutes(app, config), assert no
    // AmbiguousMatchException — THIS specific test configuration is
    // exactly the one production actually ran with when it failed.
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'AmbiguousMatchException can only be discovered by actually deploying the real application and observing it fail to start.',
      reality: 'the exception is thrown during host startup, which a fast, automated test can trigger by building and starting a minimal test host with the same route registrations — catching route conflicts in CI, long before any real deployment.',
    },
    {
      thought: 'a test verifying "the app starts cleanly, no AmbiguousMatchException" automatically covers every route the real production app registers.',
      reality: 'it only covers whatever registration code path the test actually calls — routes registered conditionally, behind feature flags, or directly in Program.cs outside a shared testable method can silently escape this safety net even though production would still register them.',
    },
    {
      thought: 'verifying route precedence (which of two competing routes actually wins for a given URL) requires hand-reimplementing ASP.NET Core\'s own precedence rules in test assertions.',
      reality: 'a TestServer-backed test can send a real request through the ACTUAL routing system and assert on the observed response — directly verifying the real precedence behavior rather than reimplementing or guessing at the underlying algorithm.',
    },
  ];
}
