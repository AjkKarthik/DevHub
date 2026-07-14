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
  templateUrl: './a-forgotten-unsubscribe-throws-on-a-disposed-components-next-event.html',
  styleUrl: './a-forgotten-unsubscribe-throws-on-a-disposed-components-next-event.scss'
})
export class AForgottenUnsubscribeThrowsOnADisposedComponentsNextEventSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A C# event subscription is a real reference the publisher holds — disposing the SUBSCRIBER does not automatically remove it',
      points: [
        'The main page\'s mistake entry frames a missed unsubscribe as a "memory leak," which is accurate but understates the more immediately visible symptom: when a component subscribes to a service\'s event (State.OnChange += StateHasChanged) and is later disposed WITHOUT unsubscribing, the SERVICE still holds a live delegate reference pointing at that now-disposed component\'s StateHasChanged method.',
        'The component instance itself is not actually garbage-collected while that reference exists — this is exactly the "memory leak" part — but the more immediately disruptive consequence happens the NEXT time the service raises OnChange: the disposed component\'s StateHasChanged() still gets invoked, attempting to trigger a re-render on a component that Blazor\'s renderer no longer considers part of the active render tree.',
      ]
    },
    {
      heading: 'What actually happens when StateHasChanged fires on a disposed component — and why it is worse under concurrent access',
      points: [
        'Calling StateHasChanged() on a disposed component can throw an ObjectDisposedException (or, depending on the exact Blazor version and render-tree state, silently do nothing useful) — either way, this is NOT a benign no-op; an unhandled exception raised from inside an event handler invoked by a shared service can, depending on where it propagates to, disrupt the SignalR circuit or crash the specific operation that triggered the service\'s state change for every OTHER still-active subscriber too.',
        'This risk compounds with every additional disposed-but-still-subscribed component accumulated over a long user session — a Blazor Server circuit that navigates through many pages, each leaving behind an unsubscribed component, builds up an ever-growing list of dead delegate references that ALL get invoked (and ALL potentially throw) on every single future state change, even though none of them do anything useful anymore.',
        'This is precisely why implementing IDisposable and unsubscribing is not an optional cleanliness nicety for components that subscribe to shared service events — it is a correctness requirement, since the alternative failure mode is an accumulating source of exceptions on every future state change, not merely wasted memory.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — subscribing without a matching unsubscribe',
      language: 'csharp',
      code: `@inject CartState Cart

<span>🛒 @Cart.Count</span>

@code {
    protected override void OnInitialized()
        => Cart.OnChange += StateHasChanged;

    // BUG: no IDisposable implementation at all — when this
    // component is removed from the render tree (user navigates
    // away), Cart.OnChange STILL holds a live reference to this
    // now-disposed component's StateHasChanged method.
}

// Later, from ANYWHERE else in the app:
// Cart.Add(newItem);  →  Cart.OnChange?.Invoke();
//
// This invokes EVERY subscribed delegate, including the one
// pointing at the disposed CartIcon instance above — attempting to
// re-render a component Blazor's renderer no longer tracks.`,
    },
    {
      label: 'The fix — IDisposable with a matching unsubscribe',
      language: 'csharp',
      code: `@inject CartState Cart
@implements IDisposable

<span>🛒 @Cart.Count</span>

@code {
    protected override void OnInitialized()
        => Cart.OnChange += StateHasChanged;

    public void Dispose()
        => Cart.OnChange -= StateHasChanged;
    // When this component is removed from the render tree, Blazor
    // calls Dispose() automatically — the unsubscribe here removes
    // THIS component's delegate from Cart.OnChange's invocation
    // list, so future Cart.Add() calls never attempt to touch this
    // disposed instance again.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team notices their Blazor Server app occasionally throws unhandled exceptions during normal cart operations, but only after users have been navigating the app for a while — a fresh session never shows the issue. They suspect a race condition in the cart-update logic itself. Based on this subtopic, what is a more likely explanation worth checking first?',
    hint: 'Think about what "only after navigating for a while" suggests about something ACCUMULATING over the session, and whether every component that subscribes to CartState.OnChange also correctly unsubscribes.',
    solution: 'A more likely explanation, worth checking before assuming a race condition, is one or more components subscribing to CartState.OnChange without a matching Dispose()/unsubscribe. The symptom pattern matches exactly: a fresh session has no disposed-but-still-subscribed components yet, so OnChange only ever invokes live, valid subscribers — no problem. As the user navigates through more pages over a longer session, each visited component that forgot to unsubscribe leaves a dead delegate reference in OnChange\'s invocation list. Eventually, some ordinary cart operation (Add, Clear) triggers OnChange, which then attempts to invoke one of these accumulated dead references — throwing an exception that has nothing to do with the cart operation\'s own logic being correct or not. Auditing every component that subscribes to CartState.OnChange for a matching IDisposable.Dispose() unsubscribe is the first thing to check, well before suspecting the cart mutation logic itself.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Forgetting to unsubscribe from a service event when a component is disposed is primarily a memory-efficiency concern — the app might use slightly more RAM over time, but functionality is unaffected.',
      reality: 'This subtopic\'s theory and exercise both show a more immediately disruptive consequence: the NEXT time the service raises its event, it still invokes the disposed component\'s handler, which can throw an exception (ObjectDisposedException or similar) — a functional correctness bug, not merely a memory-efficiency concern.'
    },
    {
      thought: 'A disposed Blazor component is automatically removed from any event\'s invocation list it previously subscribed to, similar to how some UI frameworks automatically clean up event bindings when an element is removed from the DOM.',
      reality: 'This subtopic\'s first code example shows the opposite — C# events are plain delegate invocation lists with no awareness of Blazor\'s component lifecycle at all; disposing a component does nothing to any event it previously subscribed to unless the component\'s own Dispose() method explicitly unsubscribes.'
    },
    {
      thought: 'The consequence of a missed unsubscribe is limited to the ONE disposed component that forgot to clean up — other, correctly-implemented subscribers are unaffected.',
      reality: 'This subtopic\'s theory clarifies the risk compounds and can affect EVERY subscriber — an unhandled exception thrown from inside one dead delegate\'s invocation, depending on where it propagates to within the event-raising code, can disrupt the entire operation that triggered the event, potentially affecting other, correctly-subscribed components\' ability to receive that same notification.'
    }
  ];
}
