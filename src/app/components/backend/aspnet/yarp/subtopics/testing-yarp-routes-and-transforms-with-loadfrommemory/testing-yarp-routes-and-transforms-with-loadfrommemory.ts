import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-yarp-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-yarp-routes-and-transforms-with-loadfrommemory.html',
  styleUrl: './testing-yarp-routes-and-transforms-with-loadfrommemory.scss',
})
export class TestingYarpRoutesAndTransformsWithLoadfrommemorySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'None of the Main Page\'s Own Routes or Transforms Are Ever Shown Under Test',
      points: [
        'Every route, cluster, and transform on this page is configuration — appsettings.json JSON or AddTransforms() code — and none of it is ever verified with an actual test proving a request gets forwarded correctly, or that a transform like PathPattern or AddRequestHeaderRemove actually applies as expected. YARP exposes exactly the tools needed: LoadFromMemory(routes, clusters) lets a test supply RouteConfig and ClusterConfig objects directly in code (no appsettings.json needed), and pointing a cluster\'s destination at a WebApplicationFactory-backed TestServer lets the WHOLE round trip — matching, transforming, forwarding, backend response — run entirely in-memory.',
        'This proves something meaningfully different from a config-file review: it exercises YARP\'s REAL route-matching and transform-application logic against the EXACT RouteConfig/ClusterConfig the app registers, rather than trusting that a hand-read JSON file behaves as intended.',
      ],
    },
    {
      heading: 'What to Assert — the Backend\'s View of the Request, Not Just the Client\'s Response',
      points: [
        'Testing a transform like AddPathRemovePrefix("/api") or a correlation-ID header addition requires the FAKE BACKEND to report back what it actually RECEIVED — the proxied request\'s path and headers — not just whatever status code it returns. A minimal backend endpoint that echoes ctx.Request.Path and ctx.Request.Headers back in its JSON response is enough to assert the transform applied correctly, without needing to inspect YARP\'s internals directly.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'In-memory routes/clusters pointing at a fake echo backend',
      language: 'csharp',
      code: `public class YarpTransformTests : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Path_Remove_Prefix_Transform_Strips_Api_Before_Forwarding()
    {
        // The FAKE BACKEND echoes back what it actually received.
        var backendFactory = new WebApplicationFactory<BackendProgram>()
            .WithWebHostBuilder(builder => builder.Configure(app =>
                app.Run(ctx => ctx.Response.WriteAsJsonAsync(new
                {
                    path = ctx.Request.Path.Value,
                    headers = ctx.Request.Headers.Keys.ToArray(),
                }))));
        var backendClient = backendFactory.CreateClient();

        var routes = new[]
        {
            new RouteConfig
            {
                RouteId = "test-route",
                ClusterId = "test-cluster",
                Match = new RouteMatch { Path = "/api/{**rest}" },
            }
        };
        var clusters = new[]
        {
            new ClusterConfig
            {
                ClusterId = "test-cluster",
                Destinations = new Dictionary<string, DestinationConfig>
                {
                    ["dest1"] = new() { Address = backendClient.BaseAddress!.ToString() },
                },
            }
        };

        var proxyFactory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
                services.AddReverseProxy().LoadFromMemory(routes, clusters)
                    .AddTransforms(ctx => ctx.AddPathRemovePrefix("/api"))));
        var proxyClient = proxyFactory.CreateClient();

        var response = await proxyClient.GetFromJsonAsync<BackendEcho>("/api/products/123");

        // Proves the backend received "/products/123" — the "/api"
        // prefix was genuinely stripped by YARP, not just assumed.
        Assert.Equal("/products/123", response!.Path);
    }
}`,
    },
    {
      label: 'Testing a request-header transform the same way',
      language: 'csharp',
      code: `[Fact]
public async Task Correlation_Id_Transform_Adds_A_Header_Before_Forwarding()
{
    var response = await proxyClient.GetFromJsonAsync<BackendEcho>("/api/orders/1");

    Assert.Contains("X-Correlation-Id", response!.Headers);
    // Proves the request transform genuinely ran and added the header
    // BEFORE the request reached the backend — not just that the proxy
    // itself has the transform registered in its configuration.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues it\'s enough to assert the proxy\'s own response status code is 200, reasoning that a successful response proves the whole routing and transform chain worked correctly. What specific prefix-stripping bug would a status-code-only test miss?',
    hint: 'Think about what happens if the backend has a catch-all route of its own (e.g. app.MapFallback(...)) that returns 200 for literally any path, including one YARP forwarded WITHOUT stripping the prefix correctly.',
    solution: `A backend with any kind of catch-all or wildcard route (a MapFallback,
a generic handler that still returns 200 with an error body, or simply
a route pattern broad enough to match both "/products/123" AND the
WRONG "/api/products/123") would return 200 regardless of whether the
prefix was actually stripped — the proxy's status code alone can't
distinguish "the transform worked and hit the intended route" from
"the transform silently failed to strip the prefix, but the backend
happened to respond successfully anyway to whatever path arrived."

The only way to actually verify a path-rewriting transform is to have
the backend report back EXACTLY what path it received — which is
precisely what the echo-endpoint pattern in the code tabs does. A test
asserting only response.IsSuccessStatusCode would pass whether the
prefix was stripped correctly OR not, as long as the backend happens to
respond successfully either way — silently missing the exact class of
bug (a transform that's misconfigured, disabled, or never actually
applied) this subtopic exists to catch.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing that a proxied request returns a successful (200) status code is enough to prove a path-rewriting transform like PathPattern or AddPathRemovePrefix works correctly.',
      reality: 'a backend with any catch-all or lenient route can return 200 regardless of whether the prefix was actually stripped — only a backend that echoes back the EXACT path it received can prove the transform genuinely applied.',
    },
    {
      thought: 'testing YARP\'s routing and transforms requires reading route/cluster config from a real appsettings.json file, since that\'s how the main page\'s own examples configure it.',
      reality: 'LoadFromMemory(routes, clusters) supplies RouteConfig and ClusterConfig objects directly in code — no JSON file is needed for a test, and it exercises the exact same matching and transform logic.',
    },
    {
      thought: 'verifying a transform requires inspecting YARP\'s own internal proxy request object, which isn\'t easily accessible in a test.',
      reality: 'having the FAKE BACKEND report back what it actually received (path, headers) is enough — the assertion happens on the receiving end, entirely from the outside, with no need to touch YARP internals at all.',
    },
  ];
}
