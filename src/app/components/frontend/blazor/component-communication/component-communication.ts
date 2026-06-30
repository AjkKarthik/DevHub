import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-blazor-component-communication',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './component-communication.html',
  styleUrl: './component-communication.scss'
})
export class BlazorComponentCommunication {
  quickRef: QuickRefItem[] = [
    { name: '[Parameter]', type: 'decorator', desc: 'Passes data from parent to child.' },
    { name: 'EventCallback<T>', type: 'type', desc: 'Typed callback the child invokes to notify the parent.' },
    { name: 'EventCallback', type: 'type', desc: 'Non-generic callback for parameterless events.' },
    { name: 'CascadingValue', type: 'keyword', desc: 'Wraps a subtree and provides a value to any descendant.' },
    { name: '[CascadingParameter]', type: 'decorator', desc: 'Receives a cascaded value from any ancestor.' },
    { name: '@ref', type: 'syntax', desc: 'Captures a reference to a child component instance.' },
    { name: 'InvokeAsync()', type: 'method', desc: 'Invokes an EventCallback and triggers a re-render.' },
    { name: 'SupplyParameterFromForm', type: 'decorator', desc: '.NET 8 — binds a parameter from a form POST.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Parent → Child: Parameters',
      points: ['The simplest communication pattern is a [Parameter] property on the child. The parent sets it via attribute syntax. Parameters are re-applied every time the parent re-renders. For required parameters, use `[Parameter, EditorRequired]` to get a compile-time warning if the parent omits it.',
      '[Parameter] is one-way: parent → child.', 'EditorRequired warns at design time if a required param is missing.', 'Parameters are reset by the parent on every re-render.', 'Avoid logic that mutates [Parameter] values — use private state instead.']
    },
    {
      heading: 'Child → Parent: EventCallback',
      points: ['EventCallback<T> is Blazor\'s typed event system. The child invokes `await OnChanged.InvokeAsync(value)` and the parent supplies a handler. Unlike C# events, EventCallback is a struct — it automatically calls StateHasChanged on the receiving component after the handler runs, so you rarely need to call it manually.',
      'EventCallback<T> is the recommended pattern for child-to-parent events.', 'InvokeAsync automatically triggers a re-render on the parent.', 'Use EventCallback (non-generic) when no value needs to be passed.', 'Prefer EventCallback over Action<T> — it handles async and re-render automatically.']
    },
    {
      heading: 'Cascading Values',
      points: ['CascadingValue wraps a subtree and makes a value available to any descendant without explicit prop-drilling. Descendants receive it via [CascadingParameter]. By default cascading works by type; use the Name property to disambiguate multiple cascades of the same type. Blazor itself uses this pattern for the EditContext in forms.',
      'CascadingValue avoids prop-drilling through deep trees.', 'Match by type by default; use Name= to match by name.', '[CascadingParameter] must be public.', 'IsCascading attribute (Blazor 8+) is an alternative to CascadingValue wrapper.']
    },
    {
      heading: '@ref — accessing child methods',
      points: ['@ref captures a reference to a child component instance, letting you call its public methods or read its public properties directly. This is useful for imperative actions like focusing an input or calling `Refresh()` on a grid. Overuse leads to tight coupling — prefer parameters and callbacks for data flow.',
      '@ref gives direct access to public component methods.', 'The ref is null until after the first OnAfterRender.', 'Use only for imperative operations (focus, scroll, reload).', 'Prefer [Parameter]/EventCallback for data flow; reserve @ref for behaviour.']
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Parameter + EventCallback',
      language: 'csharp',
      code: `<!-- Child: RatingPicker.razor -->
<div>
    @for (int i = 1; i <= 5; i++)
    {
        var star = i;
        <button @onclick="() => Select(star)">
            @(star <= Value ? "★" : "☆")
        </button>
    }
</div>

@code {
    [Parameter] public int Value { get; set; }
    [Parameter] public EventCallback<int> ValueChanged { get; set; }

    private async Task Select(int star)
        => await ValueChanged.InvokeAsync(star);
}

<!-- Parent -->
<RatingPicker @bind-Value="myRating" />
<p>You rated: @myRating</p>
@code { private int myRating = 3; }`
    },
    {
      label: 'CascadingValue',
      language: 'csharp',
      code: `<!-- App layout -->
<CascadingValue Value="currentUser">
    <Router AppAssembly="typeof(App).Assembly">
        ...
    </Router>
</CascadingValue>

@code { private UserInfo currentUser = new("Alice"); }

<!-- Any descendant component -->
@code {
    [CascadingParameter] private UserInfo? User { get; set; }
}
<p>Hello, @User?.Name</p>`
    },
    {
      label: '@ref',
      language: 'csharp',
      code: `<!-- DataGrid.razor (child) -->
@code {
    public async Task RefreshAsync() { /* reload data */ }
}

<!-- Parent -->
<DataGrid @ref="grid" />
<button @onclick="() => grid!.RefreshAsync()">Refresh</button>

@code {
    private DataGrid? grid;
    // grid is null until after first OnAfterRender
}`
    },
    {
      label: 'Named cascade',
      language: 'csharp',
      code: `<CascadingValue Name="PrimaryColor" Value="#5c2d91">
<CascadingValue Name="FontSize" Value="16">
    <ChildComponent />
</CascadingValue>
</CascadingValue>

@code {
    [CascadingParameter(Name = "PrimaryColor")]
    private string? Color { get; set; }

    [CascadingParameter(Name = "FontSize")]
    private int FontSize { get; set; }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using Action<T> instead of EventCallback<T>',
      wrong: '[Parameter] public Action<int> OnSelect { get; set; }',
      right: '[Parameter] public EventCallback<int> OnSelect { get; set; }',
      explanation: 'Action<T> does not trigger StateHasChanged on the parent and does not handle async properly. EventCallback does both automatically.'
    },
    {
      title: 'Reading @ref before OnAfterRender',
      wrong: 'protected override void OnInitialized() { grid!.Refresh(); }',
      right: 'protected override async Task OnAfterRenderAsync(bool firstRender)\n{\n    if (firstRender) await grid!.RefreshAsync();\n}',
      explanation: 'Component refs are null until after the first render. Accessing them earlier causes a NullReferenceException.'
    },
    {
      title: 'Cascading a mutable object and expecting reactive updates',
      wrong: '<CascadingValue Value="settings" />  // settings is a mutable class',
      right: '// Call StateHasChanged() on the provider after mutating, or use an immutable record',
      explanation: 'Cascading values do not automatically re-render descendants when the value\'s properties change. The provider must call StateHasChanged after mutations.'
    },
    {
      title: 'Two-way binding without matching Changed callback name',
      wrong: '[Parameter] public int Rating { get; set; }\n[Parameter] public EventCallback<int> OnRatingChanged { get; set; }',
      right: '[Parameter] public int Rating { get; set; }\n[Parameter] public EventCallback<int> RatingChanged { get; set; }',
      explanation: '@bind-Rating synthesises a RatingChanged callback. If you name it differently, @bind-Rating will not wire up and changes will be lost.'
    },
    {
      title: 'Prop-drilling instead of CascadingValue',
      wrong: '<Page theme="theme">\n  <Section theme="theme">\n    <Widget theme="theme" />',
      right: '<CascadingValue Value="theme">\n  <Page />\n</CascadingValue>',
      explanation: 'Threading the same value through 4+ layers is a maintenance burden. CascadingValue was designed exactly for cross-cutting concerns like theme, user, or locale.'
    },
  ];

  challenge: Challenge = {
    title: 'Nested Counter with Reset',
    language: 'csharp',
    description: 'Build a parent page with a running total and three `<Counter>` child components. Each Counter has its own local count and emits an `OnChange` EventCallback when incremented. The parent sums the three counts into a total. Add a Reset button on the parent that resets all three counters via `@ref`.',
    hints: [
      'Each Counter needs a `[Parameter] public EventCallback<int> OnChange`.',
      'The parent holds three @ref fields and an int[] or three ints for totals.',
      'Add a public Reset() method on Counter that sets its count to 0 and invokes OnChange(0).',
    ],
    starterCode: `<!-- Counter.razor -->
@code {
    // TODO: count, [Parameter] OnChange, Increment(), Reset()
}

<!-- Parent page -->
@code {
    // TODO: three @ref fields, total, handler
}`,
    solution: `<!-- Counter.razor -->
<button @onclick="Increment">+1 (@count)</button>
@code {
    private int count = 0;
    [Parameter] public EventCallback<int> OnChange { get; set; }
    private async Task Increment() { count++; await OnChange.InvokeAsync(count); }
    public async Task Reset() { count = 0; await OnChange.InvokeAsync(0); }
}

<!-- Parent.razor -->
@page "/counters"
<p>Total: @total</p>
<Counter @ref="c1" OnChange="v => Update(0, v)" />
<Counter @ref="c2" OnChange="v => Update(1, v)" />
<Counter @ref="c3" OnChange="v => Update(2, v)" />
<button @onclick="ResetAll">Reset All</button>
@code {
    private Counter? c1, c2, c3;
    private int[] counts = new int[3];
    private int total => counts.Sum();
    private void Update(int i, int v) { counts[i] = v; }
    private async Task ResetAll() {
        await Task.WhenAll(c1!.Reset(), c2!.Reset(), c3!.Reset());
        counts = new int[3];
    }
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does EventCallback<T>.InvokeAsync do beyond calling the handler?', options: ['Logs the call', 'Triggers StateHasChanged on the parent', 'Serializes T to JSON', 'Nothing extra'], answer: 1, explanation: 'EventCallback automatically calls StateHasChanged on the component that owns the handler after it completes, which is why you rarely need to call it manually.' },
    { q: 'When is an @ref variable populated?', options: ['In OnInitialized', 'In OnParametersSet', 'After the first OnAfterRender', 'In the constructor'], answer: 2, explanation: 'Blazor populates @ref fields after the render cycle completes — which is after the first OnAfterRender fires.' },
    { q: 'To implement @bind-Value on a custom component, what must the EventCallback be named?', options: ['OnValueChange', 'ValueChange', 'ValueChanged', 'OnChanged'], answer: 2, explanation: '@bind-Value looks for a parameter named ValueChanged. This naming convention is required for two-way binding to work.' },
    { q: 'Which scenario is CascadingValue NOT ideal for?', options: ['Theme data', 'Current user', 'Form EditContext', 'Incrementing a counter in a sibling'], answer: 3, explanation: 'Cascading flows only downward — ancestor to descendant. Sibling-to-sibling communication requires a shared service or a common parent.' },
    { q: 'Why prefer EventCallback<T> over Action<T> for component events?', options: ['EventCallback is faster', 'EventCallback handles async and auto-triggers re-render', 'Action is deprecated', 'EventCallback supports generics'], answer: 1, explanation: 'EventCallback wraps the handler to handle async, exceptions, and automatic StateHasChanged on the receiver — Action<T> does none of these.' },
    { q: 'What is the purpose of the Dispatcher (InvokeAsync) when calling StateHasChanged from a background thread?', options: ['It is not needed', 'It marshals the call to the circuit\'s sync context so rendering is thread-safe', 'It batches multiple renders', 'It cancels pending renders'], answer: 1, explanation: 'Blazor Server\'s rendering is single-threaded per circuit. Calling StateHasChanged directly from a Task.Run or timer callback can cause race conditions. InvokeAsync(StateHasChanged) ensures the call is queued onto the circuit thread.' },
  ];

  qna: QnaItem[] = [
    { q: 'How do siblings communicate?', a: 'Blazor has no built-in sibling channel. The idiomatic solution is a shared scoped service (registered via DI) that both components inject. When one changes state, it calls StateHasChanged on itself; if the other needs to update too, the service raises an event the other subscribes to.' },
    { q: 'Can [CascadingParameter] work with IsFixed?', a: 'Yes. Setting IsFixed="true" on CascadingValue tells Blazor the value will not change. This is a performance optimisation — Blazor skips re-traversal when the cascaded object is updated. Only use it when the value truly never changes after initial render.' },
    { q: 'Is @ref compatible with interfaces?', a: 'No, @ref requires a concrete component type. If you need to abstract the component, use a wrapper component or communicate via a service rather than direct method calls through @ref.' },
    { q: 'When should I not use CascadingValue?', a: 'Avoid cascading values for frequently-changing data (like a live counter). Every descendant that has a [CascadingParameter] re-renders when the cascaded value changes, which can cascade a performance hit through a large subtree.' },
    { q: 'When should you use a cascading parameter instead of passing a regular [Parameter] down through multiple levels?',
      a: 'Regular [Parameter] passing works fine for direct parent-to-child communication, but becomes tedious "prop drilling" when a value (theme, current user, a shared service) needs to reach deeply nested descendant components through many intermediate levels that do not otherwise need it. CascadingValue/CascadingParameter lets an ancestor component implicitly provide a value that any descendant can opt into receiving directly, regardless of nesting depth, without every intermediate component needing to explicitly forward it.' },
    { q: 'What is the risk of using a singleton service for component-to-component communication, and how do you mitigate it?',
      a: 'A singleton service used as a shared communication channel (raising events that multiple unrelated components subscribe to) can create implicit, hard-to-trace coupling between components that have no direct parent-child relationship, and forgotten event unsubscription in a component\'s Dispose method causes memory leaks as disposed components remain referenced by the singleton\'s event invocation list. Always unsubscribe from singleton service events in IDisposable.Dispose(), and prefer scoped services or direct parameter passing when the relationship between components is otherwise simple and direct.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Blazor components communicate via [Parameter] (parent → child), EventCallback<T> (child → parent), CascadingValue (ancestor → any descendant), and @ref (parent calls child methods).',
    mustKnow: [
      '[Parameter] flows data from parent to child; never mutate it inside the child.',
      'EventCallback<T> is preferred over Action<T> — it auto-calls StateHasChanged.',
      'CascadingValue eliminates prop-drilling for cross-cutting concerns.',
      '@ref lets a parent call public methods on a child after first render.',
      '@bind-Value requires a matching ValueChanged EventCallback by convention.',
      'Siblings communicate via a shared DI service, not directly.',
    ],
    interviewFocus: [
      'What is the difference between EventCallback<T> and Action<T>?',
      'How does @bind-Value work under the hood?',
      'When would you choose CascadingValue over a shared service?',
    ]
  };
}
