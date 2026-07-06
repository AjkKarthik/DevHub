import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-apphost-topology-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-apphost-topology-with-distributedapplicationtestingbuilder.html',
  styleUrl: './testing-apphost-topology-with-distributedapplicationtestingbuilder.scss',
})
export class TestingApphostTopologyWithDistributedapplicationtestingbuilderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Q&A mentions Aspire.Hosting.Testing and DistributedApplicationTestingBuilder in one paragraph — "the full stack starts... integration tests run against the real stack" — without ever showing what that test actually looks like, or how you get an HttpClient pointed at a service whose port is randomly assigned',
      points: [
        '<code>DistributedApplicationTestingBuilder.CreateAsync&lt;TEntryPoint&gt;()</code> builds the SAME AppHost topology the real <code>dotnet run</code> would — real Redis/Postgres containers via Docker, real .NET service processes — but under test-harness control: you get back a builder you can further customize BEFORE calling <code>BuildAsync()</code> and <code>StartAsync()</code>, and a way to retrieve an <code>HttpClient</code> already pointed at any named resource\'s randomly-assigned port.',
        'The critical piece the main page\'s Q&A never shows: <code>app.CreateHttpClient("api")</code> (where <code>"api"</code> matches the resource name from <code>AddProject&lt;T&gt;("api")</code> in the AppHost) resolves the SAME service-discovery mechanism the running services use internally — the test never needs to know or guess the random port Aspire assigned, exactly the same way <code>WithReference()</code>-wired services never need to.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A full integration test spinning up the real AppHost topology',
      language: 'csharp',
      code: `// dotnet add package Aspire.Hosting.Testing
// Test project references the AppHost project directly.

public class ProductsApiIntegrationTests : IAsyncLifetime
{
    private DistributedApplication _app = default!;

    public async Task InitializeAsync()
    {
        // Builds the SAME topology as the real AppHost's Program.cs —
        // real Redis + Postgres containers, real service processes:
        var appHost = await DistributedApplicationTestingBuilder
            .CreateAsync<Projects.MyApp_AppHost>();

        // Optional: override a resource for the test run — e.g. swap
        // a real external dependency for a lightweight test double,
        // BEFORE the topology actually starts:
        appHost.Services.ConfigureHttpClientDefaults(clientBuilder =>
        {
            clientBuilder.AddStandardResilienceHandler();
        });

        _app = await appHost.BuildAsync();
        await _app.StartAsync();

        // Wait for the API's health check to report ready before
        // running any test against it — the containers and services
        // need real startup time, unlike an in-process TestServer:
        var resourceNotificationService =
            _app.Services.GetRequiredService<ResourceNotificationService>();
        await resourceNotificationService.WaitForResourceAsync(
            "products-api", KnownResourceStates.Running)
            .WaitAsync(TimeSpan.FromSeconds(30));
    }

    public async Task DisposeAsync() => await _app.DisposeAsync();

    [Fact]
    public async Task GetProducts_Returns200_Against_Real_Postgres_And_Redis()
    {
        // "products-api" is the EXACT resource name from the AppHost's
        // AddProject<Projects.Products_Api>("products-api") call —
        // CreateHttpClient resolves the real, randomly-assigned port
        // via the SAME service discovery the services use internally:
        var client = _app.CreateHttpClient("products-api");

        var response = await client.GetAsync("/products");

        response.EnsureSuccessStatusCode();
        var products = await response.Content.ReadFromJsonAsync<string[]>();
        Assert.NotNull(products);
        // This request went through a REAL PostgreSQL container and a
        // REAL Redis container — not mocks — exactly the wiring-bug
        // coverage the main page's Q&A promises, now actually shown.
    }
}`,
    },
    {
      label: 'Why this catches wiring bugs unit tests and mocked integration tests both miss',
      language: 'csharp',
      code: `// This EXACT bug — from the main page's own Common Mistakes — is
// something a WebApplicationFactory-based test (mocking the DbContext
// and Redis) would NEVER catch, because the mock doesn't care what
// name was used:
var redis = builder.AddRedis("cache");   // AppHost names it "cache"
builder.AddProject<Projects.MyApp_Api>("api").WithReference(redis);

// api/Program.cs
builder.AddRedisDistributedCache("redis");   // service expects "redis" — MISMATCH

// A WebApplicationFactory test with a fake IDistributedCache never
// exercises AddRedisDistributedCache("redis")'s actual configuration
// binding — it just injects a working fake regardless of what string
// was passed. The mismatch is invisible to that kind of test.

// A DistributedApplicationTestingBuilder test DOES catch it — because
// it runs the REAL AddRedisDistributedCache("redis") call against the
// REAL AppHost-injected environment variables:
[Fact]
public async Task CachedEndpoint_Actually_Reaches_Redis()
{
    var client = _app.CreateHttpClient("products-api");

    var response = await client.GetAsync("/cached");

    // If the resource names mismatch (AppHost "cache" vs service
    // "redis"), ConnectionStrings__redis is never injected —
    // AddRedisDistributedCache("redis") gets a null connection string
    // and the SERVICE ITSELF fails to start or throws on first cache
    // access — this test fails with a clear connection error, not a
    // false "green" result from a mock papering over the mismatch:
    response.EnsureSuccessStatusCode();
}

// Run these as a SEPARATE, slower CI job — Docker container startup
// adds real seconds per test class, unlike in-process unit tests:
// dotnet test --filter "FullyQualifiedName~IntegrationTests"`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team writes a DistributedApplicationTestingBuilder test but skips the WaitForResourceAsync(...) call shown in this subtopic\'s first example, reasoning "StartAsync() already waited for everything to start, so an extra wait is redundant." The test then intermittently fails with connection-refused errors on CI, but passes consistently on developers\' local machines. Explain the most likely cause.',
    hint: 'StartAsync() on the DistributedApplication returns once the START PROCESS has been initiated for each resource — does that guarantee each resource (a Postgres container, a compiled and launched .NET service) has finished its OWN internal startup and is actually ready to accept connections, especially proportional to how fast or slow the machine running it is?',
    solution: `StartAsync() returning does not guarantee every resource has
FINISHED starting — it initiates the startup sequence (pulling and
running Docker containers, launching .NET service processes), but a
Postgres container needs real time to initialize its data directory
and start accepting connections, and a .NET service project needs
real time to build (if not pre-built), start its Kestrel listener,
and complete any startup-time work (migrations, cache warmup) before
it can actually serve a request. None of that is guaranteed complete
merely because StartAsync() has returned — it describes "the start
sequence was kicked off," not "every resource is ready."

This explains the CI-vs-local discrepancy precisely: CI runners are
frequently slower and more resource-constrained than developer
laptops (shared compute, cold Docker image pulls, no warm build
caches) — the SAME race between "test sends its first request" and
"Postgres/the API project actually finishes starting" that developers
never lose locally (because their machines are faster, or Docker
images are already cached) becomes a coin flip or worse on CI, where
that startup window is proportionally longer relative to how quickly
the test tries to connect.

WaitForResourceAsync(resourceName, KnownResourceStates.Running) closes
exactly this gap — it polls Aspire's own resource state tracking
(the same mechanism that drives the dashboard\'s resource status
indicators) until the specific resource genuinely reports itself as
Running, rather than assuming a fixed delay is "probably enough." This
is the direct DistributedApplicationTestingBuilder analog of the
main page's own advice to wire real health-check endpoints — the test
harness needs an explicit readiness signal to wait on, not an implicit
assumption baked into when an async method happens to return.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing an Aspire-orchestrated application means either writing unit tests with mocked dependencies, or manually starting the AppHost and testing against it by hand.',
      reality: 'Aspire.Hosting.Testing\'s DistributedApplicationTestingBuilder programmatically starts the SAME real topology (real containers, real service processes) inside a test fixture, and app.CreateHttpClient(resourceName) resolves the randomly-assigned port via the same service-discovery mechanism the running services use, with no manual port-guessing needed.',
    },
    {
      thought: 'a resource-name mismatch between the AppHost (AddRedis("cache")) and a service (AddRedisDistributedCache("redis")) — the main page\'s own Common Mistake — would be caught by any reasonably thorough integration test suite.',
      reality: 'a WebApplicationFactory-based test using a mocked or faked cache implementation never exercises the actual AddRedisDistributedCache("redis") configuration binding at all, so it cannot detect the mismatch — only a test running the REAL AppHost topology (like DistributedApplicationTestingBuilder) actually surfaces the missing connection string as a real failure.',
    },
    {
      thought: 'once DistributedApplication.StartAsync() returns, every resource in the topology (containers and service projects) is fully started and ready to accept connections.',
      reality: 'StartAsync() initiates the startup sequence for each resource but does not wait for each one to finish its own internal startup — a Postgres container or a .NET service can still be mid-initialization when StartAsync() returns, making an explicit WaitForResourceAsync(..., KnownResourceStates.Running) call necessary to avoid CI-specific race conditions.',
    },
  ];
}
