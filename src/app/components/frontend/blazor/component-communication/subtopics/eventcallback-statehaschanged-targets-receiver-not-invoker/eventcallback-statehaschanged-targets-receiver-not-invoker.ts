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
  templateUrl: './eventcallback-statehaschanged-targets-receiver-not-invoker.html',
  styleUrl: './eventcallback-statehaschanged-targets-receiver-not-invoker.scss'
})
export class EventcallbackStatehaschangedTargetsReceiverNotInvokerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two different components are involved in one EventCallback.InvokeAsync() call — and only ONE of them gets the automatic re-render',
      points: [
        'The main page states that EventCallback automatically triggers a re-render, but does not spell out WHICH component that applies to: when a CHILD calls await OnChanged.InvokeAsync(value), Blazor automatically calls StateHasChanged on the component that OWNS the handler being invoked — normally the PARENT (since the parent is the one that supplied the callback delegate) — not on the child that made the call.',
        'The child itself does NOT automatically re-render just because it invoked an EventCallback. If the child\'s own displayed state also changed as part of handling the click (e.g. a selected/highlighted visual state), the child still needs its own separate trigger for that — either its own automatic re-render from the @onclick handler that led to the InvokeAsync call, or an explicit StateHasChanged() if the mutation happened somewhere else.',
      ]
    },
    {
      heading: 'Why this distinction matters once EventCallback chains get more than one level deep',
      points: [
        'If component A holds a callback and passes IT DOWN to component B, which passes it further down to component C, and C is the one that actually calls InvokeAsync() — the automatic re-render targets A (the component that originally owns/supplied the handler), not B or C, regardless of how many intermediate components the callback delegate passed through.',
        'This mirrors ordinary C# delegate semantics: an EventCallback captures a reference to the METHOD and the COMPONENT INSTANCE that will handle it, at the point the callback was originally created — invoking it later, from anywhere, always targets that original owner, not whoever happens to be holding a reference to the delegate at invocation time.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Direct parent-child — the common case',
      language: 'csharp',
      code: `<!-- RatingPicker.razor (child) -->
<button @onclick="() => Select(5)">★★★★★</button>

@code {
    [Parameter] public EventCallback<int> ValueChanged { get; set; }

    private async Task Select(int star)
    {
        await ValueChanged.InvokeAsync(star);
        // This call triggers StateHasChanged on the PARENT
        // (whichever component supplied ValueChanged), automatically.
        // RatingPicker itself does NOT get an automatic re-render from
        // this InvokeAsync call — it already got one from its OWN
        // @onclick dispatch, which is a separate, unrelated mechanism.
    }
}

<!-- Parent.razor -->
<RatingPicker @bind-Value="myRating" />
@code {
    private int myRating;
    // Parent.myRating updates and Parent re-renders automatically
    // the moment RatingPicker's InvokeAsync call completes.
}`,
    },
    {
      label: 'Multi-level chain — the target is still the ORIGINAL owner',
      language: 'csharp',
      code: `<!-- GrandparentPage.razor -->
<MiddleWrapper OnSelect="HandleSelect" />
@code {
    private void HandleSelect(int value) { selectedValue = value; }
    private int selectedValue;
    // GrandparentPage is the ORIGINAL owner of the handler — it is
    // THIS component that gets the automatic StateHasChanged, no
    // matter how many layers the EventCallback passes through below.
}

<!-- MiddleWrapper.razor -->
<InnerPicker OnSelect="OnSelect" />
@code {
    [Parameter] public EventCallback<int> OnSelect { get; set; }
    // MiddleWrapper just forwards the SAME EventCallback instance —
    // it does not "own" the handler, so it gets no automatic
    // re-render when InnerPicker eventually invokes it.
}

<!-- InnerPicker.razor -->
<button @onclick="() => OnSelect.InvokeAsync(42)">Pick 42</button>
@code {
    [Parameter] public EventCallback<int> OnSelect { get; set; }
    // Even though INNERPICKER is the one calling InvokeAsync(),
    // the automatic re-render still targets GrandparentPage —
    // the component that originally created the handler delegate.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A deeply nested child component invokes an EventCallback that was forwarded down through three intermediate wrapper components. After the call, the developer notices the MIDDLE wrapper component\'s own displayed counter (unrelated to the callback\'s data) does not update, even though they expected "the EventCallback call triggers a re-render" to cover it too. Why doesn\'t it update?',
    hint: 'Think about WHICH specific component "owns" the handler that gets automatically re-rendered — is it every component the callback delegate passed through, or just one specific one?',
    solution: 'The automatic re-render only targets the ONE component that originally owns the handler being invoked — typically the topmost ancestor that first supplied the callback delegate, not every intermediate component the delegate happened to pass through on its way down. The middle wrapper\'s own unrelated counter has nothing to do with this specific EventCallback\'s automatic re-render mechanism at all — if that counter\'s value changed as a side effect of something else, the middle wrapper needs its OWN independent trigger (its own event handler completing, or an explicit StateHasChanged() call) to reflect that change. "EventCallback triggers a re-render" always means a re-render of the ONE owning component, never a re-render cascading automatically across every component in a forwarding chain.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When a component calls EventCallback.InvokeAsync(), that SAME component automatically gets a re-render as part of the call, in addition to whatever the receiving component does.',
      reality: 'The automatic StateHasChanged targets ONLY the component that owns the handler being invoked (typically the parent that supplied the callback) — confirmed in this subtopic\'s first example, where RatingPicker itself gets no automatic re-render from its own InvokeAsync call; any re-render RatingPicker gets comes from a separate, unrelated trigger (its own @onclick dispatch).'
    },
    {
      thought: 'In a multi-level EventCallback forwarding chain, every intermediate component that touched the callback delegate on its way down gets an automatic re-render when it is eventually invoked.',
      reality: 'Only the ORIGINAL owner of the handler — the component that first created the delegate — gets the automatic re-render, confirmed in this subtopic\'s multi-level example, where MiddleWrapper (which merely forwards the same EventCallback instance) gets no automatic re-render at all when InnerPicker eventually invokes it three levels down.'
    },
    {
      thought: '"EventCallback automatically triggers a re-render" means the framework re-renders the entire component subtree involved in the call, similar to how a state change might propagate through several connected components.',
      reality: 'The automatic re-render is narrowly scoped to exactly ONE component instance — whichever one owns the invoked handler — not a subtree-wide propagation. Other components (siblings, intermediate forwarders, even the invoking component itself) are entirely unaffected by this specific mechanism and need their own independent triggers if they also need to update.'
    }
  ];
}
