import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-role-based-auth-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-role-based-auth-per-test-without-new-factory-subclass.html',
  styleUrl: './testing-role-based-auth-per-test-without-new-factory-subclass.scss',
})
export class TestingRoleBasedAuthPerTestWithoutNewFactorySubclassSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "Auth Override" code tab has a gap it flags but never fills — the second test\'s comment says "Override to return user WITHOUT Admin role / Use a separate factory with a different TestAuthHandler" without ever showing how, and creating one factory subclass per role combination does not scale',
      points: [
        'The fix is to make the <code>TestAuthHandler</code> itself CONFIGURABLE per test, via <code>AuthenticationSchemeOptions</code> — instead of hard-coding <code>ClaimTypes.Role = "Admin"</code> inside the handler, read the desired claims from a mutable options object registered in DI. <code>factory.WithWebHostBuilder(b => b.ConfigureTestServices(services => services.Configure&lt;TestAuthOptions&gt;(o => o.Roles = ["User"])))</code> then lets EACH TEST swap the identity without subclassing <code>WebApplicationFactory</code> at all.',
        'The key mechanic that makes this work: <code>WithWebHostBuilder()</code> returns a NEW factory that inherits everything from the base fixture but layers additional configuration on top — it does not mutate the shared <code>IClassFixture</code> instance other tests in the class are using. Each test that needs a different identity calls its own <code>WithWebHostBuilder()</code> and gets an ISOLATED derived factory + client, while tests that don\'t need auth variation keep using the shared base factory\'s client directly.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A configurable TestAuthHandler — reads claims from mutable options, not a hard-coded array',
      language: 'csharp',
      code: `// Mutable options bag — this is what makes per-test claim variation possible
public class TestAuthOptions
{
    public string[] Roles { get; set; } = ["Admin"];   // default used by most tests
    public string UserId  { get; set; } = "1";
}

public class TestAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> schemeOpts,
    IOptions<TestAuthOptions> testOpts,   // <-- reads the CURRENT test's config
    ILoggerFactory logger,
    UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(schemeOpts, logger, encoder)
{
    public const string SchemeName = "Test";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var opts = testOpts.Value;
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, "testuser"),
            new(ClaimTypes.NameIdentifier, opts.UserId),
        };
        claims.AddRange(opts.Roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var identity = new ClaimsIdentity(claims, SchemeName);
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

// Base registration — every derived factory inherits this scheme;
// only the OPTIONS get overridden per test, not the scheme itself:
public class TestWebApp : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            services.AddAuthentication(TestAuthHandler.SchemeName)
                    .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                        TestAuthHandler.SchemeName, _ => { });
            services.Configure<TestAuthOptions>(o => { }); // defaults apply
        });
    }
}`,
    },
    {
      label: 'Filling the page\'s own gap — the 403-without-role test, actually implemented',
      language: 'csharp',
      code: `public class AdminEndpointTests(TestWebApp app) : IClassFixture<TestWebApp>
{
    [Fact]
    public async Task ProtectedEndpoint_Returns200_ForAdmin()
    {
        // Uses the SHARED base factory's client — default TestAuthOptions
        // (Roles = ["Admin"]) apply, no per-test override needed:
        var client = app.CreateClient();
        var response = await client.GetAsync("/api/admin/dashboard");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ProtectedEndpoint_Returns403_WithoutAdminRole()
    {
        // THIS is what the main page's comment gestures at but never
        // shows — WithWebHostBuilder() layers a per-test override on
        // top of the SAME shared base factory, without subclassing:
        using var scoped = app.WithWebHostBuilder(builder =>
            builder.ConfigureTestServices(services =>
                services.Configure<TestAuthOptions>(o => o.Roles = ["User"])));
        var client = scoped.CreateClient();

        var response = await client.GetAsync("/api/admin/dashboard");
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ProtectedEndpoint_Returns401_WhenUnauthenticated()
    {
        // A third variation — remove the Test scheme entirely for this
        // one test, proving [Authorize] rejects a request with NO
        // recognized authentication scheme at all:
        using var anon = app.WithWebHostBuilder(builder =>
            builder.ConfigureTestServices(services =>
                services.PostConfigure<AuthenticationOptions>(o =>
                    o.DefaultAuthenticateScheme = null)));
        var client = anon.CreateClient();

        var response = await client.GetAsync("/api/admin/dashboard");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
// All three tests share ONE base TestWebApp (one IClassFixture, one
// expensive startup cost) — the per-test identity variation comes
// entirely from WithWebHostBuilder() layering, never from creating
// additional WebApplicationFactory<Program> subclasses.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate proposes an alternative to WithWebHostBuilder(): instead of layering options, mutate the SAME shared factory\'s TestAuthOptions singleton directly between test methods (app.Services.GetRequiredService<IOptionsMonitor<TestAuthOptions>>() doesn\'t support direct mutation, so they inject IOptions<TestAuthOptions> as a mutable class and just set .Roles = [...] before each request). What breaks with this approach that WithWebHostBuilder() avoids?',
    hint: 'xUnit runs test METHODS within a class sequentially by default — so mutating shared state between methods in ONE class might seem safe. What happens if this test class is grouped into a [Collection] with other classes, or if a future refactor adds [Collection(DisableParallelization = false)] semantics, or simply if two DIFFERENT test classes end up sharing the SAME underlying IClassFixture instance via a collection fixture?',
    solution: `Mutating the shared factory's TestAuthOptions directly creates a
race condition the moment this class's isolation assumptions change —
which happens more easily than it seems. Within a SINGLE test class,
xUnit does run methods sequentially, so naive mutation might appear to
work in isolation. But the moment this fixture is later shared across
MULTIPLE test classes via a collection fixture (exactly the pattern
the main page's own Q&A describes for reducing startup cost — "share
one WebApplicationFactory across multiple test classes... via
CollectionDefinition"), those classes CAN interleave: xUnit still runs
different CLASSES within the same collection sequentially relative to
each other, but nothing prevents a future maintainer from misreading
that guarantee, or from a parallel test RUNNER configuration change
elsewhere in the project affecting it. More concretely: even sequential
execution across classes means test class B's setup could run between
test class A's individual test methods if they share a fixture with
async lifetimes overlapping in ways the original author didn't
anticipate — mutable shared state is a standing liability that only
LOOKS safe under the current test topology, and breaks silently (no
exception — just occasionally-wrong role assertions) the moment that
topology changes.

WithWebHostBuilder() avoids this entirely because it does not mutate
ANY shared state — it constructs an independent, isolated derived
factory with its OWN DI container and its OWN TestAuthOptions
instance, scoped to exactly the one test that created it. Two tests
calling WithWebHostBuilder() with different role sets, even running
concurrently (if parallelism were ever enabled at the method level via
a custom xUnit configuration), get genuinely separate DI graphs — there
is no shared mutable cell either test could stomp on. The isolation is
structural, not dependent on a scheduling guarantee that could change
under refactoring, making it the durably correct pattern rather than
one that merely happens to work under today's execution order.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing different authenticated roles or claims per test requires creating a separate WebApplicationFactory<Program> subclass for each role combination.',
      reality: 'a single TestAuthHandler reading claims from a mutable IOptions<TestAuthOptions> bag, combined with factory.WithWebHostBuilder() to layer per-test option overrides on top of ONE shared base factory, covers arbitrary role/claim combinations without subclassing WebApplicationFactory per scenario.',
    },
    {
      thought: 'mutating a shared Singleton options object directly between test methods is a safe shortcut for varying test identity, as long as the test methods in that class run sequentially.',
      reality: 'that assumption is topology-dependent and silently breaks the moment the fixture is later shared across multiple test classes via a collection fixture, or execution order otherwise changes — WithWebHostBuilder() constructs a genuinely isolated derived factory per test instead, which has no shared mutable state to depend on in the first place.',
    },
    {
      thought: 'WithWebHostBuilder() mutates the base IClassFixture-shared factory in place, so calling it from one test could affect other tests in the same class.',
      reality: 'WithWebHostBuilder() returns a NEW, independent factory that layers additional configuration on top of the base fixture without mutating it — the base factory and its client remain unaffected for every other test in the class.',
    },
  ];
}
