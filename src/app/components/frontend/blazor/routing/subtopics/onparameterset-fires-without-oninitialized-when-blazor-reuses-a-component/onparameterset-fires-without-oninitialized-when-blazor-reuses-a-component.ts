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
  templateUrl: './onparameterset-fires-without-oninitialized-when-blazor-reuses-a-component.html',
  styleUrl: './onparameterset-fires-without-oninitialized-when-blazor-reuses-a-component.scss'
})
export class OnparametersetFiresWithoutOninitializedWhenBlazorReusesAComponentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Navigating between two routes handled by the SAME component type does not destroy and recreate that component',
      points: [
        'The main page\'s mistake entry states the rule (use OnParametersSet, not OnInitialized) but the reason is a specific optimization: when the Blazor router matches a new URL to a component of the SAME TYPE that is already the currently-rendered component (e.g. going from /products/1 to /products/2, both matched by the same ProductDetail component), Blazor REUSES that existing component instance rather than disposing it and constructing a fresh one.',
        'This is genuinely different from navigating to a DIFFERENT component type — that always disposes the old component (calling Dispose/DisposeAsync if implemented) and constructs a brand new instance, running its full lifecycle including OnInitialized from scratch.',
      ]
    },
    {
      heading: 'Why this reuse optimization means OnInitialized only ever fires ONCE, no matter how many times the route\'s parameters change afterward',
      points: [
        'Since the component instance is reused, OnInitialized (which the framework treats as "one-time setup for this instance") correctly does NOT re-run — from the framework\'s perspective, this is still the same component instance it already initialized once, just with updated inputs.',
        'OnParametersSet(Async) is specifically the lifecycle hook that fires EVERY time the component\'s parameters are set, including this initial page load AND every subsequent same-type route navigation — this is precisely why the main page\'s guidance is to put route-parameter-dependent data loading there instead of OnInitializedAsync, which would only ever run for the very first URL, never picking up changes when Id updates on a later navigation.',
        'The practical consequence: any field NOT tied to the route parameter but initialized once in OnInitialized (a subscription, a timer, a one-time service call) correctly stays untouched across same-type route navigations — this reuse behavior is actually a performance benefit (skipping redundant setup work), not merely a gotcha to work around.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — data never updates on same-type navigation',
      language: 'csharp',
      code: `@page "/products/{Id:int}"

<h1>Product #@Id</h1>
<p>@product?.Name</p>

@code {
    [Parameter] public int Id { get; set; }
    private Product? product;

    protected override async Task OnInitializedAsync()
    {
        // Runs ONCE, for whichever Id the user first navigated to.
        product = await ProductService.GetAsync(Id);
    }

    // BUG: navigating from /products/1 to /products/2 reuses THIS
    // exact component instance (same type, new route params) —
    // OnInitializedAsync does NOT re-run, so "product" still shows
    // Product #1's data, even though the URL and Id now say 2.
}`,
    },
    {
      label: 'The fix — OnParametersSetAsync fires on every navigation',
      language: 'csharp',
      code: `@page "/products/{Id:int}"

<h1>Product #@Id</h1>
<p>@product?.Name</p>

@code {
    [Parameter] public int Id { get; set; }
    private Product? product;

    protected override async Task OnParametersSetAsync()
    {
        // Fires on the INITIAL load AND every subsequent navigation
        // to this same component type with a new Id — correctly
        // reloads "product" every time the route parameter changes,
        // since Blazor is reusing the same instance across all of
        // these navigations.
        product = await ProductService.GetAsync(Id);
    }
}`,
    },
    {
      label: 'Confirming what genuinely stays untouched across reuse',
      language: 'csharp',
      code: `@page "/products/{Id:int}"

@code {
    [Parameter] public int Id { get; set; }
    private Product? product;
    private Timer? analyticsTimer;

    protected override void OnInitialized()
    {
        // Genuinely runs ONCE per component instance, confirmed by
        // this NOT restarting when navigating between /products/1
        // and /products/2 — appropriate for one-time setup that has
        // nothing to do with the route parameter itself.
        analyticsTimer = new Timer(_ => LogHeartbeat(), null, 0, 30000);
    }

    protected override async Task OnParametersSetAsync()
    {
        // Runs on EVERY navigation between same-type routes,
        // correctly reloading route-parameter-dependent data.
        product = await ProductService.GetAsync(Id);
    }

    public void Dispose() => analyticsTimer?.Dispose();
    // Dispose only fires when navigating AWAY to a DIFFERENT
    // component type, or when the app itself tears down — not on
    // same-type route navigation, since the instance is reused.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer notices a component subscribes to a NotificationService event inside OnInitialized, and worries that navigating between /products/1, /products/2, and /products/3 (all the same ProductDetail component) will create THREE separate subscriptions, leaking two of them. Is this concern valid?',
    hint: 'Think about how many times OnInitialized actually runs across those three navigations, based on whether Blazor is reusing the component instance or creating new ones.',
    solution: 'The concern is not valid, based on the component-reuse mechanism this subtopic describes. Since all three URLs are matched by the SAME component type (ProductDetail) and the user is navigating between them without ever leaving that component type, Blazor reuses the SAME component instance across all three navigations — OnInitialized only fires ONCE, for the very first of the three navigations. The subscription is created exactly once, not three times, so there is no leak from this specific pattern. A genuine leak risk would arise only if the user navigated AWAY to a different component type and back — THAT sequence does dispose the old instance (running Dispose, if implemented, to unsubscribe) and construct a fresh one (running OnInitialized again, subscribing once more) — a completely different navigation pattern than the same-type-to-same-type case described in the question.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Every route navigation, including between two URLs handled by the same component type, disposes the current component and creates a fresh instance, running the full lifecycle from scratch each time.',
      reality: 'This subtopic\'s first code example shows the opposite for same-TYPE navigation — Blazor specifically REUSES the existing component instance when the new route resolves to the same component type, which is exactly why OnInitializedAsync does not re-run and stale data can persist unless OnParametersSetAsync is used instead.'
    },
    {
      thought: 'Putting route-parameter-dependent data loading in OnParametersSetAsync instead of OnInitializedAsync is purely a style preference with no functional difference.',
      reality: 'This subtopic\'s bug example shows a real functional difference — OnInitializedAsync-based loading silently fails to refresh data on same-type route navigation, showing stale data for the wrong Id, while OnParametersSetAsync-based loading correctly reloads on every navigation, including the initial one.'
    },
    {
      thought: 'Since OnParametersSet fires more often than OnInitialized, any setup logic should generally be moved there to be safe, since it is guaranteed to run at least as often as OnInitialized would.',
      reality: 'This subtopic\'s third code example shows genuinely one-time setup (a timer, a subscription with nothing to do with the route parameter) belongs in OnInitialized specifically BECAUSE it only runs once per instance — moving such logic to OnParametersSet would cause it to incorrectly re-run (re-subscribing, restarting timers) on every same-type route navigation, the opposite of the intended one-time behavior.'
    }
  ];
}
