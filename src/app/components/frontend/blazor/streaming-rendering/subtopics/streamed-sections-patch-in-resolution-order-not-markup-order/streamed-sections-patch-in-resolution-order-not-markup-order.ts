import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './streamed-sections-patch-in-resolution-order-not-markup-order.html',
  styleUrl: './streamed-sections-patch-in-resolution-order-not-markup-order.scss'
})
export class StreamedSectionsPatchInResolutionOrderNotMarkupOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s Dashboard example runs two sections concurrently — worth stating explicitly what "concurrently" means for the ORDER patches actually arrive in',
      points: [
        'When a Static SSR page with [StreamRendering] has multiple independent placeholder sections — each guarded by its own @if (data is null) check, each populated by an independently-awaited task — the sections do not necessarily patch into the DOM in the order they appear in the markup. Each section\'s placeholder is replaced as soon as ITS OWN data resolves, completely independent of where it sits visually on the page or which section was declared first in the .razor file.',
        'This follows directly from how the underlying async work executes: if three independent tasks are started concurrently (e.g. via Task.WhenAll or simply by not awaiting each one individually before starting the next), whichever task\'s awaited operation completes FIRST is the one whose corresponding UI section gets streamed to the client first — a fast third section declared LAST in the markup can visibly populate before a slow first section declared at the very top.',
      ]
    },
    {
      heading: 'Why this matters for how you reason about a streaming page\'s user-visible behavior',
      points: [
        'A developer testing a streaming page locally with uniformly fast mock data (or no artificial delay at all) may never observe out-of-order arrival, since every section resolves near-instantly regardless of code order — the effect only becomes visible under realistic, VARYING latency between sections, which is exactly the scenario streaming rendering is meant to optimize for in production.',
        'This has a direct, practical design implication: placing the sections a user cares about MOST at the top of the markup does not guarantee those load first if a slower-loading section happens to be declared above them — genuinely prioritizing which section the user sees populate first requires making that section\'s own underlying data fetch resolve faster (a smaller query, a cache, a separate faster endpoint), not just reordering markup.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Three sections, declared fast-to-slow, but NOT guaranteed to arrive in that order',
      language: 'csharp',
      code: `@page "/dashboard"
@attribute [StreamRendering]

<!-- Declared in markup order: Alerts, Stats, Analysis -->
<section>
    <h2>Alerts</h2>
    @if (alerts is null) { <p>Loading...</p> } else { <AlertList Items="alerts" /> }
</section>

<section>
    <h2>Stats</h2>
    @if (stats is null) { <p>Loading...</p> } else { <Stats Data="stats" /> }
</section>

<section>
    <h2>Analysis</h2>
    @if (analysis is null) { <p>Loading...</p> } else { <Analysis Data="analysis" /> }
</section>

@code {
    private List<Alert>? alerts;
    private StatsDto? stats;
    private AnalysisDto? analysis;

    protected override async Task OnInitializedAsync()
    {
        // All three START concurrently here...
        var alertsTask   = AlertService.GetAsync();     // typically fast
        var statsTask    = StatsService.GetAsync();      // typically slow (heavy query)
        var analysisTask = AnalysisService.GetAsync();   // typically medium

        // ...but the ACTUAL arrival order at the client depends on
        // which one resolves first in practice, NOT the declaration
        // order above. If Stats' heavy query is slow today, Alerts
        // and Analysis can both patch in before it — even though
        // Alerts is declared first and would "arrive first" either way,
        // Analysis (declared LAST) can still beat Stats (declared
        // SECOND) to the screen.
        await Task.WhenAll(alertsTask, statsTask, analysisTask);
        alerts   = alertsTask.Result;
        stats    = statsTask.Result;
        analysis = analysisTask.Result;
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A streaming dashboard page declares three sections in this markup order: Recent Orders (typically fast), Inventory Alerts (typically slow, a heavy warehouse query), Sales Summary (typically medium). All three are fetched via independently-awaited tasks started concurrently in OnInitializedAsync. During a live demo, Sales Summary populates on screen BEFORE Inventory Alerts does, even though Inventory Alerts is declared earlier in the markup. Is this a bug? Explain what determines the actual order sections populate in.',
    hint: 'Does streaming rendering guarantee sections populate in the order they\'re WRITTEN in the .razor file, or in the order their underlying async data actually finishes resolving?',
    solution: 'This is not a bug — it is exactly the expected behavior for independently-streamed sections. Streaming rendering patches each section\'s placeholder as soon as THAT section\'s own data resolves, with no guarantee tied to markup declaration order. Since Inventory Alerts runs a heavy warehouse query (typically slower) while Sales Summary is typically medium-speed, it is entirely normal for Sales Summary\'s task to resolve first in practice, causing its placeholder to be replaced before Inventory Alerts\' — regardless of Inventory Alerts being declared earlier in the .razor markup. The general rule is: arrival order tracks actual async resolution order, not markup order. If a specific section genuinely needs to be guaranteed to populate first, the fix is making its own data fetch resolve faster (a lighter query, caching, a dedicated fast endpoint) — reordering the markup itself would have no effect on which section\'s data resolves first.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Streaming rendering populates independent sections in the order they are declared in the .razor markup, top to bottom, similar to how a synchronous page renders top to bottom.',
      reality: 'This subtopic\'s theory clarifies each section\'s placeholder is replaced as soon as that section\'s OWN underlying async data resolves — arrival order tracks actual resolution timing, completely independent of markup declaration order.'
    },
    {
      thought: 'If a slower section visibly populates before a section declared earlier in the markup, that indicates something is wrong with the streaming implementation.',
      reality: 'This subtopic\'s exercise shows this is the correct, expected behavior for concurrently-streamed independent sections — whichever underlying task resolves first determines which section\'s placeholder gets replaced first, with no ordering guarantee tied to markup position at all.'
    },
    {
      thought: 'To make a specific dashboard section appear to the user first, simply move its markup to the top of the page.',
      reality: 'This subtopic\'s theory shows reordering markup has no effect on arrival order — genuinely prioritizing which section populates first requires making that section\'s own data fetch resolve faster (a lighter query, a cache, a dedicated endpoint), since arrival order is driven entirely by resolution timing, not visual position.'
    }
  ];
}
