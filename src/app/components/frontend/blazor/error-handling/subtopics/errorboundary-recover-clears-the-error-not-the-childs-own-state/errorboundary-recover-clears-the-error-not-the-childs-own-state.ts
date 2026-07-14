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
  templateUrl: './errorboundary-recover-clears-the-error-not-the-childs-own-state.html',
  styleUrl: './errorboundary-recover-clears-the-error-not-the-childs-own-state.scss'
})
export class ErrorboundaryRecoverClearsTheErrorNotTheChildsOwnStateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Recover() is a lightweight state-clear on the BOUNDARY — it is not a retry-from-scratch of the CHILD',
      points: [
        'Internally, ErrorBoundary.Recover() does exactly two things: it resets the boundary\'s own internal error-count and stored exception back to null, then triggers a re-render. That\'s the entire mechanism — it does NOT dispose the child component instance and does NOT create a fresh one in its place.',
        'Because the exact same child component instance is what gets re-rendered, that instance\'s lifecycle methods (OnInitialized, OnInitializedAsync) do NOT run again — they only ever run once, when the instance was originally created. Any field or state on that instance that caused the original exception is still sitting there completely unchanged after Recover() runs.',
      ]
    },
    {
      heading: 'Why this produces an infinite loop for the most intuitive "just call Recover()" attempt',
      points: [
        'If the exact same bad state that caused the original exception is still present on the child instance after Recover() clears the visual error, the next render attempt runs the exact same rendering logic against the exact same bad state — throwing the exact same exception again. Calling Recover() directly from within the failing render path (e.g. inside ErrorContent\'s own markup, auto-triggered) can produce a genuine infinite catch-recover-fail loop for this reason.',
        'The correct fix for a real retry-from-scratch is forcing Blazor to discard and rebuild the entire child subtree — which is exactly what changing a `@key` value on the ErrorBoundary (or its child) does, per Blazor\'s general element/component diffing rules. A changed `@key` makes the renderer treat the old and new elements as unrelated, disposing the old instance and constructing a genuinely new one — which DOES re-run OnInitializedAsync from scratch, unlike Recover() alone.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — Recover() alone doesn\'t clear the bad state',
      language: 'csharp',
      code: `<ErrorBoundary @ref="boundary">
    <ChildContent>
        <ProductDetails ProductId="@brokenId" />
    </ChildContent>
    <ErrorContent Context="ex">
        <p>Failed to load: @ex.Message</p>
        <button @onclick="() => boundary!.Recover()">Retry</button>
    </ErrorContent>
</ErrorBoundary>

@code {
    private ErrorBoundary? boundary;
    private int brokenId = -1; // ProductDetails throws on invalid IDs

    // Clicking Retry calls boundary.Recover() — but ProductDetails is
    // the SAME instance, its OnInitializedAsync already ran once with
    // brokenId = -1 and is never going to run again. The very next
    // render hits the exact same code path with the exact same bad
    // state and throws the exact same exception immediately.
}`,
    },
    {
      label: 'The fix — force real recreation with a changed @key',
      language: 'csharp',
      code: `<ErrorBoundary @key="retryToken" @ref="boundary">
    <ChildContent>
        <ProductDetails ProductId="@productId" />
    </ChildContent>
    <ErrorContent Context="ex">
        <p>Failed to load: @ex.Message</p>
        <button @onclick="RetryWithFreshInstance">Retry</button>
    </ErrorContent>
</ErrorBoundary>

@code {
    private ErrorBoundary? boundary;
    private int productId = 42;
    private int retryToken = 0;

    private void RetryWithFreshInstance()
    {
        productId = 42; // reset to a known-good value if needed
        retryToken++;   // changing @key discards the old subtree...

        // ...and forces Blazor to construct a genuinely NEW
        // ProductDetails instance, which DOES run
        // OnInitializedAsync again from a clean slate.
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer builds a retry button that calls boundary.Recover() after an ErrorBoundary catches an exception thrown inside a child component\'s OnInitializedAsync (a failed API call). Clicking Retry makes the error message disappear for a split second, then it reappears immediately — every single time, no matter how many times they click. Explain exactly why, and describe the fix.',
    hint: 'Recover() only touches the ErrorBoundary\'s own internal error state. What happens to the CHILD component instance itself — is it the same instance as before, or a new one? Does its OnInitializedAsync get a chance to run again?',
    solution: 'Recover() resets only the ErrorBoundary\'s own error-count and stored exception, then re-renders — it never disposes or recreates the child component instance. Since it\'s the exact same instance, OnInitializedAsync already ran once (and threw) and will never run again on its own; the render that Recover() triggers just re-executes the child\'s render logic against whatever state it already has, which still reflects the original failed API call. That produces the exact same exception on the very next render, making the error reappear instantly. The fix is forcing Blazor to genuinely discard and rebuild the child subtree — changing a @key value on the ErrorBoundary (or the child) makes the renderer treat the old and new elements as unrelated, disposing the stale instance and constructing a fresh one whose OnInitializedAsync runs again from a clean slate, actually retrying the failed operation instead of just re-displaying its already-failed result.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Calling ErrorBoundary.Recover() re-runs the child component\'s OnInitializedAsync, effectively retrying whatever operation originally failed.',
      reality: 'This subtopic\'s theory clarifies Recover() only clears the BOUNDARY\'s own error state and re-renders — the child component instance is never disposed or recreated, so its lifecycle methods do not run again; any state that caused the original failure is still exactly as it was.'
    },
    {
      thought: 'If a Retry button\'s error message disappears and then instantly reappears, that must mean Recover() itself is broken or buggy.',
      reality: 'This subtopic\'s exercise shows this is Recover() working EXACTLY as designed — it cleared the error state and re-rendered, which is all it ever promises to do; the instant reappearance is a symptom of the underlying child state never having changed, not a bug in Recover() itself.'
    },
    {
      thought: 'The only way to force a component to fully reinitialize is to remove it from the render tree entirely with an @if block and add it back.',
      reality: 'This subtopic\'s theory shows changing a @key value achieves the same "discard and rebuild" outcome without needing conditional removal — Blazor\'s own diffing treats a changed key as an entirely different element/component, disposing the old instance and constructing a new one in place.'
    }
  ];
}
