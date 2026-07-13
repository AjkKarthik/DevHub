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
  templateUrl: './statehaschanged-is-automatic-after-sync-handlers-manual-elsewhere.html',
  styleUrl: './statehaschanged-is-automatic-after-sync-handlers-manual-elsewhere.scss'
})
export class StatehaschangedIsAutomaticAfterSyncHandlersManualElsewhereSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Blazor\'s render trigger is tied to its own synchronization context, not to "any code that changed a field"',
      points: [
        'The main page\'s mistake entry states the rule but not the mechanism: Blazor wraps event handler invocations (@onclick, @onchange, form submits) in its own render-triggering pipeline — after the handler method returns, Blazor automatically calls StateHasChanged() and re-renders if anything changed.',
        'This automatic behavior only applies to code paths Blazor itself dispatched — a click handler, a bound @onchange callback, a lifecycle method like OnInitializedAsync. Any state mutation that happens OUTSIDE one of those dispatched paths never gets this automatic call.',
      ]
    },
    {
      heading: 'Three concrete cases where the automatic call does NOT happen, and StateHasChanged() genuinely must be called by hand',
      points: [
        'A System.Threading.Timer or a background Task.Run callback that mutates a field: this code runs on a thread pool thread, outside any Blazor-dispatched event — the component has no idea the field changed until you call StateHasChanged() (and in Blazor Server, wrap it in InvokeAsync(StateHasChanged) to marshal back onto the correct SignalR circuit thread).',
        'A subscription callback from an injected service (e.g. an event raised by a singleton notification service) firing while the component is mounted: the event handler runs on whatever thread raised the event, not inside a Blazor-dispatched render cycle — same fix, InvokeAsync(StateHasChanged).',
        'An async method that keeps working AFTER its own event handler already returned control to Blazor once: if the handler is async and does something like fire-and-forget a background operation, Blazor already rendered once when the handler\'s first await point was hit — any UI-relevant state changed after that point needs its own explicit StateHasChanged() call, since Blazor already considered that handler cycle "done."',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Automatic case — sync event handler',
      language: 'csharp',
      code: `@* No manual StateHasChanged() needed — Blazor calls it automatically
   after this synchronous @onclick handler returns *@
<p>Count: @count</p>
<button @onclick="Increment">+1</button>

@code {
    private int count = 0;

    private void Increment()
    {
        count++;
        // Blazor automatically re-renders after this method returns —
        // calling StateHasChanged() here would be a harmless no-op.
    }
}`,
    },
    {
      label: 'Manual case — background timer',
      language: 'csharp',
      code: `@* A System.Threading.Timer callback runs OUTSIDE any Blazor-dispatched
   event — StateHasChanged() must be called explicitly, wrapped in
   InvokeAsync() to correctly marshal back onto the component's context. *@
<p>Elapsed seconds: @seconds</p>

@code {
    private int seconds = 0;
    private System.Threading.Timer? timer;

    protected override void OnInitialized()
    {
        timer = new System.Threading.Timer(_ =>
        {
            seconds++;
            // WITHOUT this call, the UI would never update — the timer
            // callback runs on a thread pool thread Blazor doesn't know about.
            InvokeAsync(StateHasChanged);
        }, null, 1000, 1000);
    }

    public void Dispose() => timer?.Dispose();
}`,
    },
    {
      label: 'Manual case — fire-and-forget after first await',
      language: 'csharp',
      code: `@* An async handler that continues doing work AFTER Blazor already
   rendered once at the first await — the later state change needs
   its own explicit StateHasChanged() call. *@
<p>Status: @status</p>
<button @onclick="LoadThenRefresh">Load</button>

@code {
    private string status = "idle";

    private async Task LoadThenRefresh()
    {
        status = "loading...";
        // Blazor renders here automatically — this is still inside
        // the original dispatched event handler cycle, first await point.
        var data = await httpClient.GetStringAsync("/api/data");

        status = "processing...";
        // This second render ALSO happens automatically — Blazor tracks
        // the whole async method until it fully completes, not just
        // the first await. The automatic re-render happens at EVERY
        // await resumption within the same dispatched handler, and
        // again when the method finally returns.
        await Task.Delay(500);

        status = "done";
        // Still automatic — the entire async Task returned by an
        // event handler is what Blazor tracks, not just its first half.
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer injects a singleton NotificationService into a component and subscribes to its OnNotify event in OnInitialized(). When OnNotify fires (triggered by a completely different part of the app, e.g. a background job), the component\'s bound text does not visually update, even though a breakpoint confirms the field was correctly updated. What is happening, and what is the fix?',
    hint: 'Think about WHOSE code is running when the OnNotify event handler executes — is it running inside anything Blazor dispatched, or is it running on whatever thread the singleton service happened to raise the event from?',
    solution: 'The event handler subscribed to OnNotify runs on whatever thread/context the singleton service raised the event from — NOT inside a Blazor-dispatched event handler cycle, since the trigger (a background job) has nothing to do with this specific component\'s UI events. Blazor has no way to know the field changed, so it never calls StateHasChanged() automatically. The fix: inside the OnNotify handler, after updating the field, call InvokeAsync(StateHasChanged) — the InvokeAsync wrapper ensures the call is correctly marshaled onto the component\'s own synchronization context (critical in Blazor Server, where the SignalR circuit has a specific execution context) before StateHasChanged() runs.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Blazor automatically detects ANY change to a component\'s fields or properties and re-renders — StateHasChanged() is only needed for really unusual edge cases.',
      reality: 'Blazor has no field-level change detection at all (unlike Angular\'s zone-based or signal-based reactivity) — it only automatically re-renders after code paths IT dispatched (event handlers, lifecycle methods). Any mutation from a background thread, a timer, or an external event subscription needs an explicit StateHasChanged() call, which is a common and expected pattern, not an edge case.'
    },
    {
      thought: 'Once StateHasChanged() has been called once inside an async method, it does not need to be called again for later state changes in the same method.',
      reality: 'Within a Blazor-DISPATCHED async event handler, Blazor automatically re-renders at each await resumption and at the method\'s completion — no manual calls are needed at all inside that dispatched method. The distinction that actually matters is whether the code is running inside a dispatched handler versus a genuinely external callback (timer, injected service event, background thread) — the latter always needs an explicit call, regardless of how many times state changes.'
    },
    {
      thought: 'Calling StateHasChanged() when it is not strictly necessary (e.g. after a synchronous event handler that Blazor would have re-rendered anyway) can cause bugs or double-rendering issues.',
      reality: 'An unnecessary StateHasChanged() call inside an already-dispatched handler is a harmless no-op, not a bug source — Blazor\'s rendering is idempotent for a given state snapshot. The main page\'s own mistake entry frames this as a style/clarity issue (unnecessary code), not a correctness issue — the real risk category is the OPPOSITE one: forgetting to call it where it is genuinely required.'
    }
  ];
}
