import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-featuregate-requirement-type-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './featuregate-multiple-flags-defaults-to-requirementtype-all.html',
  styleUrl: './featuregate-multiple-flags-defaults-to-requirementtype-all.scss',
})
export class FeaturegateMultipleFlagsDefaultsToRequirementtypeAllSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Listing Multiple Flags Without RequirementType.Any Means ALL Must Be Enabled',
      points: [
        'The main page\'s own "Analytics" example writes [FeatureGate(RequirementType.Any, "Analytics", "BetaDashboard")] and explicitly comments "enabled if EITHER flag is on" — but that explicit RequirementType.Any argument is doing real work, not just documentation. FeatureGateAttribute also has an overload that takes ONLY flag names with no RequirementType — [FeatureGate("Analytics", "BetaDashboard")] — and that overload defaults to RequirementType.All, meaning BOTH named flags must be enabled for the gate to pass, the OPPOSITE of the main page\'s own worked example.',
        'A developer copying the visual PATTERN of listing two flag names — but skipping the explicit RequirementType.Any argument because it looks optional or decorative — silently changes the semantics from "either flag unlocks this" to "both flags must be on," with no compiler warning and no runtime error: the endpoint just 404s far more often than intended, exactly like any other disabled flag, giving no obvious signal that the ACTUAL bug is a missing RequirementType.Any.',
      ],
    },
    {
      heading: 'Why This Is Easy to Miss in Review',
      points: [
        'Both overloads compile, both return the same 404-on-disabled behavior, and both look nearly identical in a diff — [FeatureGate(RequirementType.Any, "A", "B")] versus [FeatureGate("A", "B")] differ by one leading argument that is easy to overlook when skimming a pull request, especially since RequirementType.All (the silent default) is also a semantically valid choice in plenty of other contexts. There is no way to tell from the symptom alone ("users report the endpoint 404s more than expected") which of the two overloads is in play without reading the exact attribute arguments.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two overloads that look almost identical — opposite semantics',
      language: 'csharp',
      code: `// The main page's own worked example — EITHER flag unlocks this:
[FeatureGate(RequirementType.Any, "Analytics", "BetaDashboard")]
public IActionResult Analytics() => Ok();

// Looks like the same pattern, but the missing RequirementType.Any
// argument means this overload defaults to RequirementType.All —
// BOTH "Analytics" AND "BetaDashboard" must be enabled, not either one.
[FeatureGate("Analytics", "BetaDashboard")]
public IActionResult AnalyticsV2() => Ok();`,
    },
    {
      label: 'Test proving the semantic difference',
      language: 'csharp',
      code: `public class FeatureGateRequirementTypeTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    public FeatureGateRequirementTypeTests(WebApplicationFactory<Program> factory) => _factory = factory;

    private WebApplicationFactory<Program> WithFlags(bool analytics, bool betaDashboard) =>
        _factory.WithWebHostBuilder(builder =>
            builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["FeatureManagement:Analytics"]     = analytics ? "true" : "false",
                    ["FeatureManagement:BetaDashboard"] = betaDashboard ? "true" : "false",
                })));

    [Fact]
    public async Task Any_Requirement_Passes_When_Only_One_Flag_Is_On()
    {
        var client = WithFlags(analytics: true, betaDashboard: false).CreateClient();
        var response = await client.GetAsync("/api/beta/analytics");   // RequirementType.Any
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Default_Requirement_Rejects_When_Only_One_Flag_Is_On()
    {
        var client = WithFlags(analytics: true, betaDashboard: false).CreateClient();
        var response = await client.GetAsync("/api/beta/analytics-v2");   // default = All
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);      // needs BOTH flags
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Product wants a new endpoint gated behind THREE experimental flags, unlocked when ANY ONE of them is on (matching the main page\'s own "Analytics" pattern, just with three flags instead of two). A teammate writes <code>[FeatureGate("FlagA", "FlagB", "FlagC")]</code>. What will actually happen in production, and how would you catch this in review before it ships?',
    hint: 'Count the arguments in the teammate\'s attribute against the main page\'s own worked example — is RequirementType.Any present anywhere in what they wrote?',
    solution: `In production, the endpoint will 404 for every user UNLESS all three
of FlagA, FlagB, and FlagC are enabled simultaneously — the exact
opposite of "unlocked when any one is on." The missing
RequirementType.Any means this call falls onto the flags-only overload,
which defaults to RequirementType.All.

The fastest way to catch this in review is a simple visual check
against the main page's own worked pattern: does the attribute's FIRST
argument read RequirementType.Any (or RequirementType.All, if that is
genuinely intended)? [FeatureGate("FlagA", "FlagB", "FlagC")] with no
leading RequirementType argument should be treated as a review red flag
whenever multiple flags are listed and the intent is "any one of
these" — the fix is simply adding the explicit argument:
[FeatureGate(RequirementType.Any, "FlagA", "FlagB", "FlagC")].

A more durable fix than relying on review vigilance is a small test like
the ones above for EVERY multi-flag [FeatureGate] in the codebase —
asserting the endpoint is reachable when only ONE of the intended flags
is on (if Any is intended) catches this class of bug automatically,
rather than depending on someone noticing a missing argument during
code review.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '[FeatureGate("FlagA", "FlagB")] and [FeatureGate(RequirementType.Any, "FlagA", "FlagB")] behave the same way, since both just list the flags that gate the endpoint.',
      reality: 'the overload without an explicit RequirementType defaults to RequirementType.All — requiring BOTH flags to be enabled — while RequirementType.Any requires only one. They are opposite semantics, not equivalent shorthand.',
    },
    {
      thought: 'an endpoint 404ing more often than expected for a multi-flag [FeatureGate] is always caused by the flags themselves being disabled in configuration.',
      reality: 'it can just as easily be caused by a missing RequirementType.Any — the flags might be configured exactly as intended, with the actual bug being which REQUIREMENT TYPE the attribute is silently defaulting to.',
    },
    {
      thought: 'reviewing a [FeatureGate] attribute with multiple flag names just requires checking that the right flag NAMES are listed.',
      reality: 'the requirement type (All vs Any) is just as load-bearing as the flag names themselves, and — unlike the names — its absence is a silent default rather than a compiler error, making it the easier of the two to overlook in review.',
    },
  ];
}
