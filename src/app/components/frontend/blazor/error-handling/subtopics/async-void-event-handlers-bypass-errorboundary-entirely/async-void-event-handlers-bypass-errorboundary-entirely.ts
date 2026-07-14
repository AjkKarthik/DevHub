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
  templateUrl: './async-void-event-handlers-bypass-errorboundary-entirely.html',
  styleUrl: './async-void-event-handlers-bypass-errorboundary-entirely.scss'
})
export class AsyncVoidEventHandlersBypassErrorboundaryEntirelySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'This is not a case of ErrorBoundary "failing" to catch — the exception never enters the pipeline it watches at all',
      points: [
        'ErrorBoundary and Blazor\'s renderer intercept exceptions by tracking the Task returned from a component\'s lifecycle methods and Task-returning event handlers — when that Task faults, the renderer\'s own machinery observes the fault and can route it to an enclosing ErrorBoundary. This entire mechanism depends on there being a Task to actually watch.',
        'An event handler declared as async void (instead of async Task) returns nothing the renderer can hook into — from the framework\'s point of view, the method call already "completed" the instant it hit its first await, regardless of what happens afterward. Any exception thrown after that point has no Task for anything, including ErrorBoundary\'s underlying mechanism, to observe.',
      ]
    },
    {
      heading: 'Where the exception actually goes instead, and why the consequence differs by hosting model',
      points: [
        'An unobserved exception from an async void method surfaces through the current SynchronizationContext\'s own unhandled-exception path — a completely separate mechanism from the render-pipeline-based exception routing ErrorBoundary relies on. It was never "supposed" to reach ErrorBoundary; there was structurally no route for it to take there.',
        'On Blazor Server, that SynchronizationContext is tied to the user\'s circuit, so an escaping exception there is treated the same as any other genuinely unhandled exception on that circuit — fatal, terminating the connection, showing every user on that circuit the reconnect overlay. On WASM, there is no circuit to tear down, but the exception can still leave the browser tab\'s runtime in an inconsistent state, sometimes requiring a full page reload to recover cleanly.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — async void hides the exception from everything',
      language: 'csharp',
      code: `<button @onclick="SaveAsync">Save</button>

@code {
    // async void: the renderer has no Task to observe here.
    // ErrorBoundary is not "failing to catch" this — it structurally
    // cannot, because there is nothing for its underlying mechanism
    // to hook into.
    private async void SaveAsync()
    {
        await Task.Delay(50); // simulate network call
        throw new InvalidOperationException("Save failed");
        // On Blazor Server: this exception surfaces via the circuit's
        // SynchronizationContext as a genuinely unhandled exception —
        // fatal to the circuit, same as any other unobserved fault.
    }
}`,
    },
    {
      label: 'The fix — async Task lets the renderer observe the fault',
      language: 'csharp',
      code: `<ErrorBoundary>
    <ChildContent>
        <button @onclick="SaveAsync">Save</button>
    </ChildContent>
    <ErrorContent Context="ex">
        <p>Save failed: @ex.Message</p>
    </ErrorContent>
</ErrorBoundary>

@code {
    // async Task: the renderer DOES have a Task to observe here.
    // When it faults, that fault is routed through the normal
    // lifecycle-exception path — which an enclosing ErrorBoundary
    // CAN intercept, exactly as designed.
    private async Task SaveAsync()
    {
        await Task.Delay(50);
        throw new InvalidOperationException("Save failed");
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A component wraps a button in an ErrorBoundary. The button\'s click handler is declared private async void HandleClick() and throws an exception partway through an awaited operation. Instead of the ErrorBoundary\'s fallback content appearing, the entire page disconnects. A teammate says "the ErrorBoundary must be misconfigured — it\'s not catching the exception." Explain what is actually going on, using the word "Task" in your explanation.',
    hint: 'ErrorBoundary\'s exception-catching mechanism depends on being able to observe a faulted Task from the method that threw. What does an async void method return — is there a Task there at all for anything to observe?',
    solution: 'The ErrorBoundary isn\'t misconfigured — it structurally has no way to catch this one. ErrorBoundary\'s mechanism works by observing the Task returned from lifecycle methods and event handlers, and reacting when that Task faults. An async void method returns void, not a Task — there is nothing for the renderer\'s exception-routing machinery, or ErrorBoundary sitting on top of it, to hook into at all. The exception instead surfaces through the current SynchronizationContext\'s own unhandled-exception path, a completely separate mechanism. On Blazor Server, that SynchronizationContext is tied to the circuit, so the escaping exception is treated as fatal to the circuit — hence the full disconnect instead of the ErrorBoundary\'s fallback content appearing. The fix is changing the handler\'s signature from async void to async Task, which gives the renderer a real Task to observe and routes a fault through the normal, ErrorBoundary-interceptable exception path.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ErrorBoundary watches the entire component subtree for any thrown exception, regardless of how or where the throwing method is declared.',
      reality: 'This subtopic\'s theory clarifies ErrorBoundary\'s mechanism specifically depends on observing a faulted Task — an async void method returns no Task at all, so there is structurally nothing for ErrorBoundary\'s underlying machinery to observe, independent of where in the subtree the method lives.'
    },
    {
      thought: 'A page disconnecting entirely instead of showing a graceful ErrorBoundary fallback always means the ErrorBoundary was placed in the wrong spot in the component tree.',
      reality: 'This subtopic\'s exercise shows a correctly-placed ErrorBoundary around an async void handler will never see the exception no matter where it\'s positioned — the problem is the handler\'s signature, not the boundary\'s placement.'
    },
    {
      thought: 'async void and async Task event handlers behave identically in Blazor as long as neither one is directly awaited by the caller, since Blazor invokes both the same way from markup.',
      reality: 'This subtopic\'s theory shows the difference is entirely about whether the RENDERER can observe a returned Task to route exceptions through — Blazor\'s @onclick binding does invoke both signatures similarly on the surface, but only the async Task version gives the framework anything to watch for a fault.'
    }
  ];
}
