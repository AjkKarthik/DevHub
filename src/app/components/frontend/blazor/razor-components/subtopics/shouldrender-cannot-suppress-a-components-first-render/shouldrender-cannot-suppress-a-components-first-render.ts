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
  templateUrl: './shouldrender-cannot-suppress-a-components-first-render.html',
  styleUrl: './shouldrender-cannot-suppress-a-components-first-render.scss'
})
export class ShouldrenderCannotSuppressAComponentsFirstRenderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'ShouldRender() exists to skip REDUNDANT renders — the very first render is never redundant',
      points: [
        'The main page shows ShouldRender() being used to skip re-renders when data has not changed, but a genuinely easy-to-miss detail is that Blazor IGNORES the return value of ShouldRender() the very first time a component renders — the initial render always happens regardless of what ShouldRender() would return, since there is nothing yet on screen to compare against and skip.',
        'This makes sense once framed correctly: ShouldRender() answers "given what is ALREADY on screen, does this update need to be reflected?" — a question that has no meaningful answer before anything has been rendered at all. The framework treats the first render as unconditional groundwork, and ShouldRender() only starts being consulted for every render AFTER that first one.',
      ]
    },
    {
      heading: 'ShouldRender() only governs THIS component\'s own re-render decision — not its children\'s',
      points: [
        'A second, equally easy-to-miss detail: ShouldRender() returning false suppresses re-rendering of the CURRENT component\'s own markup, but it does NOT retroactively prevent that component\'s children from re-rendering if something ELSE (their own parameters changing, their own StateHasChanged() call) independently triggers them.',
        'Conversely, if a PARENT re-renders and passes new parameter values down, the CHILD\'s OnParametersSet(Async) still runs regardless of what the child\'s own ShouldRender() previously returned — ShouldRender() only intercepts the RENDERING step for a component instance, not the parameter-update or lifecycle-method steps that happen before it.',
        'This means ShouldRender() is a narrowly scoped optimization for one specific component\'s own markup re-render — it is not a tree-wide "pause updates below this point" switch, and treating it as one produces confusing bugs where children keep updating despite a parent returning false from ShouldRender().',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ShouldRender() false on first render is IGNORED',
      language: 'csharp',
      code: `@page "/report"
<h1>@(data?.Title ?? "Loading...")</h1>

@code {
    private ReportData? data;

    protected override bool ShouldRender()
    {
        // Even though this returns false on the VERY FIRST call
        // (data is still null at that point), Blazor still performs
        // the initial render — this method's return value is only
        // consulted for renders AFTER the first one.
        return data != null;
    }

    protected override async Task OnInitializedAsync()
    {
        data = await ReportService.FetchAsync();
        // StateHasChanged() implicitly happens after this — THIS
        // is the render where ShouldRender()'s "false while null"
        // logic would have actually mattered, had data still been
        // null. Here it is not, so this render proceeds.
    }
}`,
    },
    {
      label: 'A false ShouldRender() does not block child updates',
      language: 'csharp',
      code: `<!-- ParentPanel.razor -->
<div class="panel">
    <StatusBadge Status="@currentStatus" />
    @* Even if ParentPanel's OWN ShouldRender() below returns false
       on some update, StatusBadge still re-renders normally whenever
       IT receives a new Status value via OnParametersSet — the
       parent's ShouldRender() only suppresses the PARENT's own
       markup, not this child's independent render cycle. *@
</div>

@code {
    [Parameter] public string CurrentStatus { get; set; } = "";
    private string currentStatus => CurrentStatus;

    protected override bool ShouldRender()
    {
        // Suppresses THIS component's own <div class="panel"> markup
        // re-render — has no effect on StatusBadge's own lifecycle.
        return false;
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer overrides ShouldRender() on a top-level dashboard component to return false whenever a specific "paused" flag is true, expecting this to freeze the ENTIRE dashboard — including all its nested widget components — while paused is active. After testing, several nested widgets keep visibly updating anyway. What is happening?',
    hint: 'Think about the scope of what ShouldRender() actually controls — does it apply to the whole subtree beneath the component, or only to that one component\'s own markup?',
    solution: 'The developer\'s expectation is based on a scope that ShouldRender() does not actually have. ShouldRender() only governs whether the CURRENT component\'s own markup re-renders — it has no effect on descendant components, which continue their own independent lifecycle (OnParametersSet, StateHasChanged calls, etc.) whenever something triggers THEM directly, regardless of what an ancestor\'s ShouldRender() returned. The nested widgets keep updating because each one is being triggered by its own parameter changes or internal state changes, completely unaware of the dashboard\'s "paused" flag. To actually freeze the whole subtree, the "paused" state would need to be explicitly passed down (e.g. as a cascading value or parameter) and each individual widget would need to check it in its OWN ShouldRender() override — there is no single ancestor-level switch that suppresses an entire subtree at once.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ShouldRender() returning false on a component\'s first invocation prevents that component from rendering at all until it later returns true.',
      reality: 'Blazor unconditionally performs the first render regardless of what ShouldRender() would return — confirmed in this subtopic\'s first code example, where a component starts with data == null (which would make ShouldRender() return false) but still renders its initial "Loading..." state, since the return value is only consulted for renders AFTER the first.'
    },
    {
      thought: 'ShouldRender() returning false on a parent component pauses or freezes updates for that entire component subtree, including all its children.',
      reality: 'ShouldRender() only suppresses the CURRENT component\'s own markup re-render — confirmed in this subtopic\'s exercise, where nested child components kept updating independently despite a parent\'s ShouldRender() returning false, since children respond to their own triggers (parameter changes, their own StateHasChanged calls) regardless of an ancestor\'s render-suppression decision.'
    },
    {
      thought: 'ShouldRender() prevents a component\'s lifecycle methods (OnParametersSet, etc.) from running when it returns false, not just the visual re-render.',
      reality: 'ShouldRender() only intercepts the actual MARKUP RENDERING step, which happens AFTER lifecycle methods like OnParametersSet(Async) have already run — those lifecycle methods execute normally regardless of what ShouldRender() will return for that pass, since ShouldRender() is consulted specifically at the render step, not earlier in the update sequence.'
    }
  ];
}
