import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-feature-flags-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-feature-flagged-code-mocking-and-config-override.html',
  styleUrl: './testing-feature-flagged-code-mocking-and-config-override.scss',
})
export class TestingFeatureFlaggedCodeMockingAndConfigOverrideSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Q&A Names Two Techniques but Shows Neither',
      points: [
        'The main page\'s own "How do I test code that checks feature flags?" answer says to mock IFeatureManager for unit tests and to configure the FeatureManagement section (or an InMemoryFeatureProvider) for integration tests — but no code for either technique appears anywhere on the page. Both are straightforward: IFeatureManager is a plain interface, so OrderService (the main page\'s own example) can be unit-tested by mocking IsEnabledAsync to return true or false directly, with no configuration system involved at all.',
        'For an integration test of a [FeatureGate]-protected action (like BetaController.Dashboard), the technique is different: WebApplicationFactory\'s ConfigureAppConfiguration can inject an in-memory configuration source that OVERRIDES the FeatureManagement:BetaDashboard key from appsettings.json, letting one test assert a 404 with the flag off and a 200 with it on — real configuration binding, no IFeatureManager mock involved.',
      ],
    },
    {
      heading: 'Why the Two Techniques Aren\'t Interchangeable',
      points: [
        'Mocking IFeatureManager tests the BUSINESS LOGIC branch (OrderService choosing ProcessNewCheckoutAsync vs the legacy path) in complete isolation — fast, no HTTP, no config binding. It cannot prove [FeatureGate] itself is wired correctly on the route, since that attribute is evaluated by ASP.NET Core\'s own action-filter pipeline, not by anything OrderService touches.',
        'Overriding configuration in a WebApplicationFactory instead proves the OPPOSITE: that the real attribute, the real routing, and the real configuration binding all combine correctly to return 404 when disabled — but it is comparatively slow, and can only flip flags that are read from configuration, not ones evaluated via a custom IFeatureDefinitionProvider or a dynamic Azure App Configuration source.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Unit test — mocking IFeatureManager for OrderService',
      language: 'csharp',
      code: `public class OrderServiceTests
{
    [Fact]
    public async Task PlaceOrderAsync_Uses_New_Checkout_When_Flag_Enabled()
    {
        var features = Substitute.For<IFeatureManager>();
        features.IsEnabledAsync("NewCheckout").Returns(true);

        var service = new OrderService(features);
        var result = await service.PlaceOrderAsync(new Cart());

        Assert.True(result.UsedNewCheckout);   // proves the NEW path ran — no HTTP, no config
    }

    [Fact]
    public async Task PlaceOrderAsync_Uses_Legacy_Checkout_When_Flag_Disabled()
    {
        var features = Substitute.For<IFeatureManager>();
        features.IsEnabledAsync("NewCheckout").Returns(false);

        var service = new OrderService(features);
        var result = await service.PlaceOrderAsync(new Cart());

        Assert.False(result.UsedNewCheckout);
    }
}`,
    },
    {
      label: 'Integration test — overriding FeatureManagement config in WebApplicationFactory',
      language: 'csharp',
      code: `public class BetaDashboardTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    public BetaDashboardTests(WebApplicationFactory<Program> factory) => _factory = factory;

    private WebApplicationFactory<Program> WithFlag(bool enabled) =>
        _factory.WithWebHostBuilder(builder =>
            builder.ConfigureAppConfiguration((_, config) =>
            {
                // Overrides the FeatureManagement:BetaDashboard key from
                // appsettings.json — no IFeatureManager mock involved.
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["FeatureManagement:BetaDashboard"] = enabled ? "true" : "false",
                });
            }));

    [Fact]
    public async Task Dashboard_Returns_404_When_Flag_Disabled()
    {
        var client = WithFlag(enabled: false).CreateClient();
        var response = await client.GetAsync("/api/beta/dashboard");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Dashboard_Returns_200_When_Flag_Enabled()
    {
        var client = WithFlag(enabled: true).CreateClient();
        var response = await client.GetAsync("/api/beta/dashboard");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate writes ONLY the OrderServiceTests above (mocking IFeatureManager) and argues this is sufficient coverage for the entire "NewCheckout" rollout, since the business logic is what actually matters. What is missing, and what real bug would slip through?',
    hint: 'Think about where the flag NAME string "NewCheckout" is spelled out in two different places — the service\'s IsEnabledAsync call, and the appsettings.json FeatureManagement section — and what a mock can never catch about that relationship.',
    solution: `The mocked unit test proves OrderService correctly branches on
whatever IsEnabledAsync("NewCheckout") returns — but it substitutes a
FAKE IFeatureManager that always answers exactly what the test tells
it to. It can never catch a mismatch between the STRING the code
checks and the STRING actually configured — e.g. a typo like
"NewCheckOut" (capital O) in appsettings.json, or a missing
"FeatureManagement" section entirely. Per the main page's own
"hardcoding flag names" mistake, a typo'd or missing config key doesn't
throw — IFeatureManager just returns false for any unknown flag name,
silently landing every real request on the legacy path in production,
while the mocked unit test suite stays green forever, since it never
reads real configuration at all.

An integration test that boots the REAL app with the REAL
appsettings.json (or a deliberately overridden config key matching the
production key name) is the only kind of test that would catch this —
proving the configuration key ACTUALLY BOUND matches the string the
code ACTUALLY CHECKS. The two test types are not redundant: the unit
test proves the branching logic; the integration test proves the wiring
between code and configuration.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'mocking IFeatureManager to return true or false is enough to prove a feature flag rollout works correctly end-to-end.',
      reality: 'a mock only proves the code branches correctly for WHATEVER the mock is told to return — it cannot catch a mismatch between the flag NAME string in code and the actual key configured in appsettings.json, which IFeatureManager silently resolves to false (not an error) if they don\'t match.',
    },
    {
      thought: 'testing a [FeatureGate]-protected endpoint requires mocking IFeatureManager the same way as testing business logic that calls IsEnabledAsync directly.',
      reality: '[FeatureGate] is evaluated by ASP.NET Core\'s own action-filter pipeline reading real configuration — proving it works requires a real WebApplicationFactory with the FeatureManagement config actually overridden, not an IFeatureManager mock, since the attribute never touches an injected IFeatureManager instance the same way a constructor-injected service would.',
    },
    {
      thought: 'an unknown or typo\'d flag name throws an exception, so a testing gap here would be caught immediately in any environment.',
      reality: 'IFeatureManager returns false for any unrecognized flag name by default — a typo silently and permanently disables the feature in every environment where the typo exists, with no error raised anywhere.',
    },
  ];
}
