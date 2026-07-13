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
  templateUrl: './streamrendering-flushes-placeholder-html-before-async-data-resolves.html',
  styleUrl: './streamrendering-flushes-placeholder-html-before-async-data-resolves.scss'
})
export class StreamrenderingFlushesPlaceholderHtmlBeforeAsyncDataResolvesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Static SSR without [StreamRendering] holds the ENTIRE response until every async lifecycle method finishes',
      points: [
        'A plain Static SSR page (no [StreamRendering] attribute) behaves like traditional server-rendered HTML: the server does not send ANY bytes to the browser until OnInitializedAsync (and every other lifecycle method) has fully completed for the whole component tree — a single slow data fetch anywhere on the page holds up the entire response.',
        'This is a genuinely different mechanism from the interactive render modes\' prerender-then-hydrate lifecycle covered elsewhere in this batch — Static SSR has no interactive runtime at all, so there is no "second pass" to fall back on; the FIRST and ONLY server-rendered HTML is literally all the browser will ever receive for that page.',
      ]
    },
    {
      heading: '[StreamRendering] changes WHEN bytes are sent, not what the final HTML looks like',
      points: [
        'Adding [StreamRendering] to a Static SSR page tells Blazor to send an initial "placeholder" HTML response IMMEDIATELY — typically whatever markup renders before the async data resolves (an @if block showing a loading state, or simply the parts of the page that do not depend on the slow fetch) — then STREAM additional HTML chunks to update the page as each async operation completes, using the same underlying HTTP response connection kept open.',
        'This relies on HTTP\'s ability to send a response in multiple chunks over time (chunked transfer encoding) rather than one atomic blob — conceptually the same "produce output in pieces as it becomes ready" idea covered in the Web Performance hub\'s own SSR & Streaming topic, just implemented via Blazor\'s specific server-rendering pipeline rather than a hand-written ReadableStream.',
        'Crucially, the FINAL rendered HTML is identical whether [StreamRendering] is used or not — the attribute only changes the TIMING of when the browser starts receiving and can start painting content, not the eventual page content itself.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without [StreamRendering] — one slow section blocks everything',
      language: 'csharp',
      code: `@page "/dashboard"
@* No [StreamRendering] — the ENTIRE response waits for the
   slowest OnInitializedAsync in the whole component tree. *@

<h1>Dashboard</h1>
<p>Welcome back!</p>
<!-- This header content is instant, but the browser sees NOTHING
     at all until the slow section below also finishes. -->

<SlowRevenueChart />
<!-- This child's OnInitializedAsync takes 3 seconds to fetch data —
     the whole page, including the instant header, is held back
     for those full 3 seconds before ANY bytes reach the browser. -->

@code {
    // No async work here — but this page still waits on the child.
}`,
    },
    {
      label: 'With [StreamRendering] — instant shell, streamed update',
      language: 'csharp',
      code: `@page "/dashboard"
@attribute [StreamRendering]

<h1>Dashboard</h1>
<p>Welcome back!</p>
<!-- The browser now receives THIS part immediately — Blazor flushes
     the initial HTML the moment it's ready, not waiting for the
     slow child. -->

<SlowRevenueChart />

@code {
    // Still no async work directly on this page — [StreamRendering]
    // is what changes the response TIMING for the whole tree, letting
    // the header paint immediately while SlowRevenueChart streams in
    // its own update once its 3-second fetch completes.
}`,
    },
    {
      label: 'The child\'s own loading-state markup',
      language: 'csharp',
      code: `@* SlowRevenueChart.razor *@
@if (revenueData is null)
{
    <p>Loading revenue data...</p>
    @* This is the PLACEHOLDER markup [StreamRendering] sends
       immediately as part of the initial flushed response. *@
}
else
{
    <RevenueChartDisplay Data="revenueData" />
    @* Once OnInitializedAsync finishes, Blazor streams a follow-up
       HTML chunk that replaces the loading placeholder with this
       actual chart — over the SAME still-open response connection. *@
}

@code {
    private RevenueData? revenueData;

    protected override async Task OnInitializedAsync()
    {
        revenueData = await RevenueService.FetchAsync(); // 3-second call
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer adds [StreamRendering] to a Static SSR page hoping it will make their slow database query run faster. After adding it, the query still takes the same 3 seconds to complete, but the developer notices the page "feels" faster to users anyway. What is actually happening?',
    hint: 'Think about the distinction this subtopic draws between WHEN bytes are sent to the browser versus HOW LONG the underlying async work itself takes.',
    solution: 'The developer is right that the page feels faster, but wrong about why — [StreamRendering] does not make the database query itself run any faster; it still takes the same 3 seconds. What changes is that the browser now receives the page\'s non-dependent content (header, navigation, any static markup, and the slow section\'s own loading-state placeholder) IMMEDIATELY, rather than waiting the full 3 seconds for the ENTIRE response to be held back. The user sees a mostly-complete page with a "Loading..." placeholder right away, then watches that specific section update once the query genuinely finishes — this is entirely a perceived-performance win from earlier, progressive painting, not an actual reduction in how long the slow work takes. This is the exact distinction the main page\'s own framing ("dramatically improving perceived speed") is making.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '[StreamRendering] makes a page\'s async data-fetching operations complete faster by parallelizing them or reducing network latency.',
      reality: 'This subtopic\'s exercise makes clear [StreamRendering] does not touch the underlying async work\'s actual duration at all — a 3-second database query still takes 3 seconds. What changes is purely WHEN the browser starts receiving bytes: immediately for content that does not depend on the slow work, versus waiting for everything with plain Static SSR.'
    },
    {
      thought: '[StreamRendering] and the prerender-then-hydrate double-execution behavior (covered elsewhere in this render-modes topic) are the same underlying mechanism, just applied to different render modes.',
      reality: 'These are genuinely different mechanisms serving different purposes: prerender-then-hydrate applies to INTERACTIVE render modes and involves running the ENTIRE lifecycle twice (once server-rendered, once for the real interactive instance); [StreamRendering] applies to STATIC SSR (no interactive runtime at all) and involves the SAME single lifecycle run, just with its HTML output sent to the browser in multiple chunks over time instead of one blob.'
    },
    {
      thought: 'Without [StreamRendering], a Static SSR page with a slow child component simply shows a blank white page for the full duration, with no way to show ANY content early short of adding a full interactive render mode.',
      reality: '[StreamRendering] is specifically the answer to this exact problem WITHOUT needing an interactive render mode at all — it lets a purely static page flush its non-dependent content immediately and stream in updates as slow sections resolve, all while staying fully Static SSR (no SignalR circuit, no WASM, no JavaScript-driven interactivity required).'
    }
  ];
}
