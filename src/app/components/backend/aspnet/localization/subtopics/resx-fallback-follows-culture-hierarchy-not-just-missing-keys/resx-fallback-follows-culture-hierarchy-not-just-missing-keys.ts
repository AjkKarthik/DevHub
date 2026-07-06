import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-resx-fallback-hierarchy-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './resx-fallback-follows-culture-hierarchy-not-just-missing-keys.html',
  styleUrl: './resx-fallback-follows-culture-hierarchy-not-just-missing-keys.scss',
})
export class ResxFallbackFollowsCultureHierarchyNotJustMissingKeysSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Neutral fr.resx Alone Serves Every French Variant — No fr-FR.resx Needed',
      points: [
        'The main page\'s own resource examples only ever create neutral-culture files (HomeController.fr.resx, SharedResources.fr.resx) — never region-specific ones like HomeController.fr-FR.resx or HomeController.fr-CA.resx. Yet browsers commonly send Accept-Language values like "fr-FR" or "fr-CA", not bare "fr". This works because .NET\'s resource fallback follows the CULTURE HIERARCHY (the CultureInfo.Parent chain) automatically: a request for fr-FR resolves to an fr-FR resource if one exists, and if not, falls back to its PARENT culture fr, and finally to the neutral/default resource — with no fr-FR.resx file needing to exist at all for this to work correctly.',
        'This is a genuinely different mechanism from the main page\'s own quiz explanation about a MISSING KEY inside an existing culture file falling back to the neutral file, then the default. Both eventually land on the same neutral resource, but for two different reasons: one is "the specific-culture FILE exists but lacks this KEY," the other is "the specific-culture FILE never existed in the first place." .NET\'s resource fallback handles both cases via the exact same underlying culture-hierarchy walk.',
      ],
    },
    {
      heading: 'When You DO Need the Region-Specific File',
      points: [
        'The one case where a region-specific file becomes necessary is when a REGION genuinely needs different text than its parent culture provides — e.g. fr-CA (Canadian French) using different currency-related phrasing than fr-FR (France French), even though both fall back to the same neutral fr.resx today. Creating SharedResources.fr-CA.resx with ONLY the keys that differ is enough — any key not present in fr-CA.resx still falls back through fr-CA → fr → default for that specific key, so a targeted per-region override never needs to duplicate the entire translation set.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Region falls back to neutral — no region-specific file exists',
      language: 'csharp',
      code: `// Resources/GreetingResources.resx      — Hello, {0}!    (default/invariant)
// Resources/GreetingResources.fr.resx   — Bonjour, {0} !  (neutral French)
// NOTE: there is deliberately NO GreetingResources.fr-FR.resx file at all.

app.MapGet("/greet", (string name, IStringLocalizer<GreetingResources> localizer)
    => Results.Ok(new { message = localizer["Hello", name].Value }));`,
    },
    {
      label: 'Test — fr-FR resolves to the neutral fr.resx content',
      language: 'csharp',
      code: `[Fact]
public async Task Region_Specific_Culture_Falls_Back_To_Neutral_Resource_File()
{
    var request = new HttpRequestMessage(HttpMethod.Get, "/greet?name=Alice");
    // Real browsers send region-qualified values like this, not bare "fr".
    request.Headers.AcceptLanguage.Add(new StringWithQualityHeaderValue("fr-FR"));

    var response = await _client.SendAsync(request);
    var body = await response.Content.ReadFromJsonAsync<GreetingResponse>();

    // Resolved via fr-FR -> fr (neutral) -> default, even though
    // GreetingResources.fr-FR.resx was never created.
    Assert.Equal("Bonjour, Alice !", body!.Message);
}`,
    },
    {
      label: 'Targeted per-region override — only the key that differs',
      language: 'csharp',
      code: `// Resources/SharedResources.fr.resx     — OrderTotal: "Total : {0} €"
// Resources/SharedResources.fr-CA.resx  — OrderTotal: "Total : {0} $ CA"
// Only the ONE key that differs needs to exist in fr-CA.resx — every
// other key (e.g. "Greeting") still falls back to fr.resx for fr-CA
// requests, since it isn't overridden in the region-specific file.

[Fact]
public async Task Fr_CA_Overrides_Only_The_Currency_Key_Not_Every_Key()
{
    var caTotal    = await GetLocalizedValue(culture: "fr-CA", key: "OrderTotal");
    var frTotal    = await GetLocalizedValue(culture: "fr",    key: "OrderTotal");
    Assert.NotEqual(caTotal, frTotal);            // the overridden key differs

    var caGreeting = await GetLocalizedValue(culture: "fr-CA", key: "Greeting");
    var frGreeting = await GetLocalizedValue(culture: "fr",    key: "Greeting");
    Assert.Equal(caGreeting, frGreeting);          // the non-overridden key still matches fr.resx
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate wants to add Swiss French (fr-CH) support and creates <code>SharedResources.fr-CH.resx</code> containing EVERY key from <code>SharedResources.fr.resx</code>, copy-pasted verbatim with no changes, reasoning that "the file needs to exist for fr-CH to work." Was this necessary, and what is the actual downside of doing it this way?',
    hint: 'Walk through what fr-CH resolves to via the culture hierarchy if fr-CH.resx did NOT exist at all — does the greeting still work?',
    solution: `It was not necessary at all. Without any fr-CH.resx file, a request
for fr-CH already falls back through the culture hierarchy — fr-CH has
no resource file, so it falls back to its parent, neutral fr, which
DOES have every key — resolving identically to what the copy-pasted
file now produces, for every key that wasn't actually meant to differ
for Switzerland.

The real downside isn't that it's broken — every key still resolves
correctly — it's a maintenance trap: the fr-CH.resx file now contains a
frozen SNAPSHOT of every fr.resx key at the moment it was copied. If
"Greeting" is later updated in fr.resx (a wording tweak, a typo fix),
fr-CH silently keeps showing the STALE copy, since the region-specific
file — once it exists — takes priority over the neutral one for every
key it contains, even keys that were never meant to diverge. The
correct approach is the targeted-override one: create fr-CH.resx with
ONLY the keys that genuinely need Swiss-specific text (if any exist at
all), and let every other key continue falling back to fr.resx
automatically — that way, future fr.resx updates propagate to fr-CH
users for free, for every key that was never overridden.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'supporting a region like fr-FR or fr-CA requires creating a dedicated ClassName.fr-FR.resx (or .fr-CA.resx) file, or requests for that exact region will fail to resolve any translations.',
      reality: '.NET\'s resource fallback walks the culture hierarchy automatically — fr-FR falls back to its parent culture fr (neutral), then to the default resource, with no region-specific file needing to exist at all.',
    },
    {
      thought: 'creating a region-specific resx file (like fr-CH.resx) by copying every key from the neutral file is a safe way to "future-proof" that region\'s translations.',
      reality: 'once a region-specific file exists, it takes priority over the neutral file for every key it contains — a full copy freezes a snapshot that will silently drift out of sync every time the neutral file is updated afterward, for keys that were never meant to diverge in the first place.',
    },
    {
      thought: 'the missing-key fallback described in the main page\'s own quiz (specific culture file → neutral → default) and the missing-FILE fallback for an unsupported region are two different mechanisms that behave differently.',
      reality: 'both are resolved by the exact same underlying culture-hierarchy walk — whether a specific-culture file is entirely absent or merely missing one key, the resolution process is identical: try the most specific culture, then its parent, then the default.',
    },
  ];
}
