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
  templateUrl: './shouldrender-false-also-skips-onafterrender-not-just-the-diff.html',
  styleUrl: './shouldrender-false-also-skips-onafterrender-not-just-the-diff.scss'
})
export class ShouldrenderFalseAlsoSkipsOnafterrenderNotJustTheDiffSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page correctly states ShouldRender() false "skips the diff entirely" — worth being precise about what else gets skipped along with it',
      points: [
        'When ShouldRender() returns false, the component is never added to the batch of components the renderer actually processes for that render cycle — StateHasChanged() only queues a component for rendering if ShouldRender() returns true (or the component has never rendered before). A component that never entered the render queue for a cycle is, by definition, absent from that cycle\'s "components that were just rendered" list.',
        'OnAfterRender/OnAfterRenderAsync are invoked specifically for components that WERE part of a completed render batch — the renderer calls them as a post-processing step over exactly that list. Since a ShouldRender()-skipped component was never in the batch, OnAfterRender/OnAfterRenderAsync simply does not fire for it during that cycle — this isn\'t a separate skip decision, it\'s a direct consequence of the component never having been queued in the first place.',
      ]
    },
    {
      heading: 'Why this matters for any per-render JS interop or DOM-measurement logic living in OnAfterRender',
      points: [
        'A common pattern puts JS interop calls (measuring an element\'s size, initializing a third-party widget, focusing an input) inside OnAfterRenderAsync, often gated by firstRender to run only once. If a component ALSO overrides ShouldRender() to skip re-renders after the first one, that\'s consistent — the interop code already only wanted to run on firstRender anyway, and subsequent skipped renders correctly never re-trigger it.',
        'The situation to watch for is per-render interop logic that ISN\'T gated by firstRender — code intended to run after every actual visual update. If ShouldRender() is skipping renders because the specific data driving that visual update hasn\'t changed, that\'s the correct, intended behavior (nothing visually changed, so there\'s nothing new to measure or react to) — but if the interop logic depends on something OTHER than what ShouldRender() is checking, a skipped render silently skips that logic too, which can be a genuine, easy-to-miss bug if the two concerns were not deliberately kept in sync.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A skipped render also silently skips OnAfterRenderAsync',
      language: 'csharp',
      code: `@code {
    [Parameter] public int Value { get; set; }
    private int lastValue = -1;
    private ElementReference chartContainer;

    protected override bool ShouldRender()
    {
        if (Value == lastValue) return false;
        lastValue = Value;
        return true;
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        // Intended: re-draw the chart every time the DOM actually
        // updates with a new Value. But if ShouldRender() returned
        // false for this cycle (Value happened not to change),
        // this method is NEVER CALLED for that cycle at all — not
        // "called but does nothing," genuinely skipped entirely.
        // This is actually CORRECT here, since no new Value means
        // nothing new to draw — but it's easy to assume
        // OnAfterRenderAsync always runs on every StateHasChanged
        // call regardless of ShouldRender's decision.
        await JS.InvokeVoidAsync("drawChart", chartContainer, Value);
    }
}`,
    },
    {
      label: 'When this becomes a real bug — interop logic that depends on something else',
      language: 'csharp',
      code: `@code {
    [Parameter] public int Value { get; set; }
    private int lastValue = -1;
    private bool needsResize; // set by an unrelated resize event

    protected override bool ShouldRender()
    {
        // Only checks Value — knows nothing about needsResize
        if (Value == lastValue) return false;
        lastValue = Value;
        return true;
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        // BUG: if a browser resize sets needsResize = true but
        // Value hasn't changed, ShouldRender() still returns false
        // for the next cycle — meaning THIS check for needsResize
        // never even runs, since the whole method is skipped.
        // The resize-handling logic and the ShouldRender check
        // were never kept in sync with each other.
        if (needsResize)
        {
            await JS.InvokeVoidAsync("resizeChart");
            needsResize = false;
        }
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer adds a ShouldRender() override to a chart component that skips re-rendering when its Value parameter hasn\'t changed. They also have OnAfterRenderAsync logic that checks a separate needsResize flag (set by a window resize event listener) and calls a JS resize function. After testing, they discover the resize logic sometimes never runs, even though needsResize was genuinely set to true. Using what you know about ShouldRender\'s effect on the component lifecycle, explain why.',
    hint: 'Does OnAfterRenderAsync run on every StateHasChanged call regardless of what ShouldRender() decided, or is it only invoked for renders that actually went through?',
    solution: 'OnAfterRenderAsync only runs for render cycles that actually completed — a component is only included in the renderer\'s post-render processing (which is what invokes OnAfterRender/OnAfterRenderAsync) if it was part of that cycle\'s render batch, and ShouldRender() returning false means the component was never queued into that batch in the first place. Since ShouldRender() here only checks the Value parameter and knows nothing about the separate needsResize flag, a cycle where Value hasn\'t changed causes ShouldRender() to return false — which skips the ENTIRE render for that cycle, including the OnAfterRenderAsync call that contains the needsResize check. The resize logic never gets a chance to run in that scenario, even though needsResize was genuinely true, because the method it lives in was never invoked at all. The fix requires either making ShouldRender() also account for needsResize (returning true when it\'s set, regardless of Value), or moving the resize-triggering logic to somewhere that runs independently of ShouldRender\'s decision (e.g., directly in the resize event handler via JS interop, rather than deferring it to the next OnAfterRenderAsync).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ShouldRender() only controls whether the DOM gets updated — OnAfterRender and OnAfterRenderAsync still run on every StateHasChanged call regardless of what ShouldRender() decides.',
      reality: 'This subtopic\'s theory clarifies OnAfterRender/OnAfterRenderAsync are only invoked for components that were actually part of a completed render batch — a component whose ShouldRender() returned false was never queued into that batch, so these lifecycle methods do not fire for that cycle at all.'
    },
    {
      thought: 'Since ShouldRender() is meant to be a pure check with no side effects, its ONLY consequence is preventing unnecessary DOM diffs — it has no bearing on any other lifecycle method.',
      reality: 'This subtopic\'s exercise shows ShouldRender()\'s decision has a real, cascading consequence on OnAfterRender/OnAfterRenderAsync specifically — any interop or post-render logic living there needs to account for the possibility that ShouldRender() might skip the cycle for reasons unrelated to that logic\'s own concerns.'
    },
    {
      thought: 'If OnAfterRenderAsync contains logic that depends on multiple independent conditions, ShouldRender() only needs to check the condition that\'s most commonly relevant, since the others are edge cases.',
      reality: 'This subtopic\'s code examples show ShouldRender() must account for EVERY condition that OnAfterRenderAsync\'s logic depends on, not just the primary one — omitting even one relevant flag from ShouldRender()\'s check can cause that entire OnAfterRenderAsync call, including logic unrelated to the omitted flag, to be silently skipped.'
    }
  ];
}
