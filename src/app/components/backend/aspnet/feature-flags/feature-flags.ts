import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-aspnet-feature-flags',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './feature-flags.html',
  styleUrl: './feature-flags.scss',
})
export class AspnetFeatureFlags {

  quickRef: QuickRefItem[] = [
    { name: 'AddFeatureManagement()',           type: 'method',   desc: 'Registers IFeatureManager and filters. Chain to add built-in filters.' },
    { name: 'IFeatureManager',                  type: 'interface','desc': 'Injected service to check if a feature is enabled at runtime.' },
    { name: 'IsEnabledAsync(featureName)',       type: 'method',   desc: 'Returns true/false — the core check you use in business logic.' },
    { name: '[FeatureGate(featureName)]',        type: 'decorator',desc: 'Action filter attribute that returns 404 when the flag is disabled.' },
    { name: 'PercentageFilter',                  type: 'class',    desc: 'Built-in filter that enables a flag for a random X% of requests.' },
    { name: 'TimeWindowFilter',                  type: 'class',    desc: 'Built-in filter that enables a flag between two UTC date-times.' },
    { name: 'TargetingFilter',                   type: 'class',    desc: 'Enables a flag for specific users or groups (canary deployments).' },
    { name: 'IFeatureDefinitionProvider',        type: 'interface','desc': 'Customise how feature definitions are loaded (DB, Azure App Config, etc.).' },
    { name: 'UseFeatureFlags()',                 type: 'method',   desc: 'Adds the feature management middleware for endpoint-level gating.' },
    { name: 'ConfigurationFeatureDefinitionProvider', type: 'class', desc: 'Default provider — reads flags from appsettings.json FeatureManagement section.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What are Feature Flags?',
      points: ['Feature flags (feature toggles) decouple deployment from release. Code ships to production behind a flag that is off; you turn it on without a new deployment. This enables trunk-based development, A/B testing, canary releases, and instant rollback without a code change or redeploy.'],
    },
    {
      heading: 'Microsoft.FeatureManagement',
      points: ['The Microsoft.FeatureManagement NuGet package provides IFeatureManager, built-in filters (Percentage, TimeWindow, Targeting), and integration with ASP.NET Core routing. Flags are defined in configuration (appsettings.json) and can be switched at runtime when backed by Azure App Configuration or another dynamic source.'],
    },
    {
      heading: 'Feature Filters',
      points: ['A feature filter adds conditional logic to a flag beyond a simple on/off. PercentageFilter enables the flag for a random percentage of requests (gradual rollout). TimeWindowFilter enables the flag between two dates (scheduled launches). TargetingFilter enables it for specific named users or groups (canary users). Filters stack — all must pass for the flag to be enabled.'],
    },
    {
      heading: 'Dynamic Configuration with Azure App Configuration',
      points: ['When backed by Azure App Configuration with the feature flags provider, flags update without restarting the app. The library polls for changes at a configurable interval. This lets operations teams toggle flags from the Azure portal and have the change propagate across all running instances within seconds.'],
    },
    {
      heading: 'Gating at Different Levels',
      points: ['Feature flags can gate at the controller action level ([FeatureGate]), at the route level (MapGet().WithMetadata(new FeatureGateAttribute(...))), inside business logic (await featureManager.IsEnabledAsync()), or in Razor views (@inject IFeatureManager). Choose the level appropriate to the risk — UI hiding alone is not security.'],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'csharp',
      code: `// NuGet: Microsoft.FeatureManagement.AspNetCore

builder.Services.AddFeatureManagement()
    .AddFeatureFilter<PercentageFilter>()
    .AddFeatureFilter<TimeWindowFilter>()
    .AddFeatureFilter<TargetingFilter>();

// appsettings.json
{
  "FeatureManagement": {
    "NewCheckout":   true,
    "BetaDashboard": false,
    "GradualRollout": {
      "EnabledFor": [{
        "Name": "Percentage",
        "Parameters": { "Value": 25 }
      }]
    }
  }
}`,
    },
    {
      label: 'IFeatureManager',
      language: 'csharp',
      code: `public class OrderService(IFeatureManager features)
{
    public async Task<OrderResult> PlaceOrderAsync(Cart cart)
    {
        if (await features.IsEnabledAsync("NewCheckout"))
        {
            return await ProcessNewCheckoutAsync(cart);
        }
        return await ProcessLegacyCheckoutAsync(cart);
    }
}

// Minimal API
app.MapGet("/dashboard", async (IFeatureManager fm) =>
{
    if (!await fm.IsEnabledAsync("BetaDashboard"))
        return Results.NotFound();

    return Results.Ok(new { beta = true });
});`,
    },
    {
      label: '[FeatureGate]',
      language: 'csharp',
      code: `[ApiController]
[Route("api/[controller]")]
public class BetaController : ControllerBase
{
    [HttpGet("dashboard")]
    [FeatureGate("BetaDashboard")]           // returns 404 when disabled
    public IActionResult Dashboard() => Ok(new { beta = true });

    [HttpGet("analytics")]
    [FeatureGate(RequirementType.Any, "Analytics", "BetaDashboard")]
    public IActionResult Analytics() => Ok(); // enabled if EITHER flag is on
}`,
    },
    {
      label: 'Targeting Filter',
      language: 'csharp',
      code: `// appsettings.json
{
  "FeatureManagement": {
    "NewEditor": {
      "EnabledFor": [{
        "Name": "Targeting",
        "Parameters": {
          "Audience": {
            "Users":  ["alice@example.com", "bob@example.com"],
            "Groups": [{ "Name": "beta-testers", "RolloutPercentage": 100 }],
            "DefaultRolloutPercentage": 0
          }
        }
      }]
    }
  }
}

// Implement ITargetingContextAccessor to supply the current user
public class HttpTargetingContextAccessor(IHttpContextAccessor ctx)
    : ITargetingContextAccessor
{
    public ValueTask<TargetingContext> GetContextAsync()
    {
        var user = ctx.HttpContext?.User;
        return new ValueTask<TargetingContext>(new TargetingContext
        {
            UserId = user?.Identity?.Name,
            Groups = user?.Claims
                .Where(c => c.Type == "role")
                .Select(c => c.Value)
                .ToList() ?? []
        });
    }
}`,
    },
    {
      label: 'Azure App Config',
      language: 'csharp',
      code: `// NuGet: Microsoft.Azure.AppConfiguration.AspNetCore

builder.Configuration.AddAzureAppConfiguration(options =>
{
    options.Connect(builder.Configuration["AppConfig:ConnectionString"])
           .UseFeatureFlags(flagOptions =>
           {
               flagOptions.CacheExpirationInterval = TimeSpan.FromSeconds(30);
           });
});

builder.Services.AddAzureAppConfiguration();
builder.Services.AddFeatureManagement();

var app = builder.Build();
app.UseAzureAppConfiguration(); // enables dynamic refresh
app.UseFeatureFlags();`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using feature flags as a security gate',
      wrong: `if (await fm.IsEnabledAsync("AdminPanel"))
    return Ok(sensitiveAdminData);`,
      right: `[Authorize(Roles = "Admin")]
public IActionResult AdminPanel() { }
// Feature flags control VISIBILITY, not access control`,
      explanation: 'Feature flags are not an authorization mechanism. A disabled flag could be re-enabled by config, not by the user\'s identity. Always use proper authorization for security decisions.',
    },
    {
      title: 'Hardcoding flag names as strings in many places',
      wrong: `if (await fm.IsEnabledAsync("NewCheckout")) { }
// Repeated in 10 files — typo risk`,
      right: `public static class Features
{
    public const string NewCheckout = "NewCheckout";
}
if (await fm.IsEnabledAsync(Features.NewCheckout)) { }`,
      explanation: 'String typos in flag names silently evaluate to false (disabled). Define flag names as constants to get compile-time safety and single point of change.',
    },
    {
      title: 'Not cleaning up stale flags',
      wrong: `// Flag "OldFeature" shipped 6 months ago, always enabled
// Dead code path behind it still exists`,
      right: `// After a flag is 100% rolled out, remove it and the old code path
// Track flag cleanup in your backlog`,
      explanation: 'Leaving permanent flags in the codebase adds cognitive overhead and dead code. Schedule cleanup once a flag is fully rolled out or permanently retired.',
    },
    {
      title: 'Checking feature flags in the data layer',
      wrong: `// Repository choosing SQL based on a flag
var query = await fm.IsEnabledAsync("NewQuery") ? newSql : oldSql;`,
      right: `// Check the flag in the service/controller, pass the result down
var useNew = await fm.IsEnabledAsync("NewQuery");
var data   = useNew ? await _repo.GetNewAsync() : await _repo.GetOldAsync();`,
      explanation: 'Injecting IFeatureManager into the data layer couples it to the feature management system. Keep feature decisions in the service or handler layer and inject only values or strategies into the data layer.',
    },
  ];

  challenge: Challenge = {
    title: 'Toggle a Beta Endpoint',
    language: 'csharp',
    description: `Set up a feature flag "BetaReports" in appsettings.json that is disabled by default.
1. Register Microsoft.FeatureManagement.
2. Create a GET /reports/beta endpoint that returns 404 when the flag is off and report data when it's on.
3. Enable the flag and verify the endpoint returns data.`,
    hints: [
      'Add "FeatureManagement": { "BetaReports": false } to appsettings.json',
      'Use await featureManager.IsEnabledAsync("BetaReports") in the handler',
      'Return Results.NotFound() when disabled',
    ],
    starterCode: `// appsettings.json: add FeatureManagement section
// Program.cs
builder.Services.AddFeatureManagement();
var app = builder.Build();

// TODO: implement GET /reports/beta`,
    solution: `// appsettings.json
// "FeatureManagement": { "BetaReports": false }

builder.Services.AddFeatureManagement();
var app = builder.Build();

app.MapGet("/reports/beta", async (IFeatureManager fm) =>
{
    if (!await fm.IsEnabledAsync("BetaReports"))
        return Results.NotFound(new { message = "This feature is not available yet." });

    return Results.Ok(new { report = "Beta analytics data", generatedAt = DateTime.UtcNow });
});`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary benefit of feature flags over traditional deployment?',
      options: [
        'They make the app faster',
        'They decouple deployment from feature release',
        'They replace unit tests',
        'They remove the need for staging environments',
      ],
      answer: 1,
      explanation: 'Feature flags let you ship code to production before it is visible to users, enabling trunk-based development, canary rollouts, and instant rollback.',
    },
    {
      q: 'What does [FeatureGate("MyFlag")] return when the flag is disabled?',
      options: ['200 with empty body', '403 Forbidden', '404 Not Found', '503 Service Unavailable'],
      answer: 2,
      explanation: 'By default, [FeatureGate] returns 404 Not Found when the feature is disabled. You can customise this by implementing IDisabledFeaturesHandler.',
    },
    {
      q: 'Which built-in filter enables a flag for a specific percentage of requests?',
      options: ['TargetingFilter', 'TimeWindowFilter', 'PercentageFilter', 'RolloutFilter'],
      answer: 2,
      explanation: 'PercentageFilter enables the flag for a random X% of requests, useful for gradual rollouts.',
    },
    {
      q: 'Can feature flags be used as an access-control security mechanism?',
      options: [
        'Yes — disabling a flag prevents all access',
        'No — flags control visibility, not identity-based authorization',
        'Yes — with TargetingFilter they are secure',
        'Only if backed by Azure AD',
      ],
      answer: 1,
      explanation: 'Feature flags control code paths and UI visibility but are not a security boundary. Always use proper [Authorize] for data access control.',
    },
    {
      q: 'How do you avoid typos when referencing flag names across multiple files?',
      options: [
        'Use an enum',
        'Define flag names as public const strings in a static class',
        'Store them in a database',
        'Use nameof() on the IFeatureManager interface',
      ],
      answer: 1,
      explanation: 'A static class with public const strings (e.g., public const string BetaDashboard = "BetaDashboard") gives compile-time safety and a single point of change.',
    },
    {
      q: 'What does TargetingFilter enable that PercentageFilter does not?',
      options: [
        'It enables a flag for a higher percentage of users than PercentageFilter allows',
        'It enables a flag for specific named users or groups, allowing targeted beta access without affecting the general rollout percentage',
        'It applies percentage-based rollout with time-window constraints',
        'It automatically tracks which users have seen the flag in analytics',
      ],
      answer: 1,
      explanation: 'PercentageFilter enables a flag randomly for X% of requests — useful for canary releases but you cannot control which users see the feature. TargetingFilter targets specific usernames or group memberships: { "Groups": [{ "Name": "beta-testers", "RolloutPercentage": 100 }] }. Both filters can be combined for graduated rollouts to known users first, then general population.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I update feature flags without restarting the app?',
      a: 'Use Azure App Configuration with the feature flags provider. Call options.UseFeatureFlags() with a CacheExpirationInterval (e.g., 30 seconds). The library polls for changes and updates in-memory state without a restart.',
    },
    {
      q: 'Can I use feature flags in Razor views?',
      a: 'Yes. Inject IFeatureManager into the view with @inject IFeatureManager FeatureManager, then check @if (await FeatureManager.IsEnabledAsync("MyFlag")) { } to conditionally render UI elements.',
    },
    {
      q: 'What happens when a flag does not exist in configuration?',
      a: 'By default, IFeatureManager returns false for unknown flags. You can configure this behaviour via options.UseDefaultFeatureFlagValue(true/false) when registering feature management.',
    },
    {
      q: 'How do I test code that checks feature flags?',
      a: 'Inject IFeatureManager as a mock in unit tests. In integration tests, configure the FeatureManagement section in the test host\'s appsettings or use the test-only InMemoryFeatureProvider to set flag states explicitly per test.',
    },
    {
      q: 'How should I handle cleaning up retired feature flags in the codebase?',
      a: 'Schedule flag removal as a tracked task when a flag reaches 100% rollout. Remove the flag check from code (the branch that was behind the flag becomes permanent), delete the flag from configuration, and remove the constant. Leave a brief git commit message explaining which feature this was. Teams that skip cleanup accumulate permanent "flag debt" — code paths that are always-enabled but still wrapped in if-flag checks that nobody dares remove.',
    },
    {
      q: 'What is the difference between feature flags and configuration values (appsettings)?',
      a: 'Configuration values are deployment-time settings that require a redeploy or app restart to change. Feature flags are runtime switches designed to be changed without deployment, often with audience targeting and gradual rollout. Use configuration for infrastructure settings (connection strings, timeouts, URLs); use feature flags for product features, A/B tests, and kill switches. Mixing them causes confusion — a setting that looks like config but must be changed immediately in production should be a feature flag.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Feature flags decouple deployment from release — enable/disable code paths at runtime via Microsoft.FeatureManagement without redeploying.',
    mustKnow: [
      'AddFeatureManagement() registers IFeatureManager; flags defined in FeatureManagement config section',
      'IsEnabledAsync("FlagName") checks a flag in business logic',
      '[FeatureGate("FlagName")] returns 404 on a disabled action — not a security control',
      'Built-in filters: PercentageFilter (gradual), TimeWindowFilter (scheduled), TargetingFilter (users/groups)',
      'Azure App Configuration enables runtime flag updates without restart',
      'Define flag names as constants to avoid typos; schedule cleanup of retired flags',
    ],
    interviewFocus: [
      'Feature flags vs environment config — when to use each',
      'How canary releases work with PercentageFilter and TargetingFilter',
      'Why feature flags must not replace proper authorization',
      'Dynamic flag updates with Azure App Configuration polling',
    ],
  };
}
