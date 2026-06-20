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
  selector: 'app-blazor-razor-components',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './razor-components.html',
  styleUrl: './razor-components.scss'
})
export class BlazorRazorComponents {
  quickRef: QuickRefItem[] = [
    { name: '@code { }', type: 'syntax', desc: 'Block for C# fields, properties and methods in .razor files.' },
    { name: '[Parameter]', type: 'decorator', desc: 'Marks a public property as a component input.' },
    { name: '[CascadingParameter]', type: 'decorator', desc: 'Receives a cascaded value from an ancestor.' },
    { name: 'RenderFragment', type: 'type', desc: 'A delegate representing renderable UI content.' },
    { name: 'RenderFragment<T>', type: 'type', desc: 'Typed render fragment — receives a context value.' },
    { name: 'StateHasChanged()', type: 'method', desc: 'Notifies Blazor to re-render this component.' },
    { name: 'OnInitializedAsync()', type: 'method', desc: 'Lifecycle hook — runs once after the first render.' },
    { name: 'OnParametersSetAsync()', type: 'method', desc: 'Runs each time parameters change.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Anatomy of a .razor file',
      points: ['A .razor file has three optional sections: directives at the top (@page, @using, @inject), HTML markup in the middle, and a @code { } block for C#. Blazor compiles each .razor file into a C# partial class. You can split the @code block into a separate MyComponent.razor.cs file (code-behind) for larger components.',
      '@page turns a component into a routable page.', '@inject injects a DI service.', 'The @code block is just a partial class body.', 'Code-behind .razor.cs files keep markup and logic separate.']
    },
    {
      heading: 'Parameters and RenderFragment',
      points: ['Parameters are public properties decorated with [Parameter]. They must not be set by the component itself — only by the parent. RenderFragment lets parents supply child content: the built-in `ChildContent` parameter is the conventional name for the default slot. Use RenderFragment<T> to pass a context (like a row model in a grid) back to the template.',
      '[Parameter] properties should never be set inside the component.', 'ChildContent is the conventional name for the default slot.', 'RenderFragment<T> passes data back into the parent\'s template.', '@typeparam T makes a component generic over a type.']
    },
    {
      heading: 'Lifecycle hooks',
      points: ['Blazor components have a deterministic lifecycle: OnInitialized(Async) runs once after creation; OnParametersSet(Async) runs every time parameters change; ShouldRender() can short-circuit re-renders (return false to skip); OnAfterRender(Async) fires after each render — the firstRender flag distinguishes the first from subsequent calls. Dispose/IAsyncDisposable is called when the component is removed.',
      'OnInitializedAsync is the right place for first data loads.', 'ShouldRender() returning false prevents unnecessary DOM diffing.', 'OnAfterRender is the only safe place to call JS interop.', 'Implement IDisposable to clean up timers, subscriptions, and JS references.']
    },
    {
      heading: 'StateHasChanged and rendering',
      points: ['Blazor automatically calls StateHasChanged() after event handlers complete. You only need to call it manually when state changes outside an event handler — for example, in a timer callback or when a service raises an event. On Blazor Server, use InvokeAsync(StateHasChanged) to marshal back to the render thread.',
      'Event handlers trigger a re-render automatically.', 'Timer and async continuations need explicit StateHasChanged().', 'InvokeAsync ensures thread-safety on Blazor Server.', 'Calling StateHasChanged in a tight loop wastes render cycles.']
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic component',
      language: 'csharp',
      code: `<!-- Alert.razor -->
<div class="alert alert-@Type">
    <strong>@Title</strong>
    @ChildContent
</div>

@code {
    [Parameter] public string Type { get; set; } = "info";
    [Parameter] public string Title { get; set; } = "";
    [Parameter] public RenderFragment? ChildContent { get; set; }
}

<!-- Usage -->
<Alert Type="danger" Title="Error!">
    Something went wrong.
</Alert>`
    },
    {
      label: 'Lifecycle',
      language: 'csharp',
      code: `@inject IWeatherService Weather

<p>@forecast?.Summary</p>

@code {
    private WeatherForecast? forecast;

    protected override async Task OnInitializedAsync()
    {
        forecast = await Weather.GetTodayAsync();
    }

    protected override bool ShouldRender()
    {
        // Skip re-render if data hasn't changed
        return forecast != null;
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            // Safe to call JS interop here
        }
    }
}`
    },
    {
      label: 'Generic component',
      language: 'csharp',
      code: `<!-- DataList.razor -->
@typeparam TItem

<ul>
    @foreach (var item in Items)
    {
        <li>@ItemTemplate(item)</li>
    }
</ul>

@code {
    [Parameter, EditorRequired] public IEnumerable<TItem> Items { get; set; } = [];
    [Parameter, EditorRequired] public RenderFragment<TItem> ItemTemplate { get; set; } = null!;
}

<!-- Usage -->
<DataList Items="products" ItemTemplate="p => @<span>@p.Name</span>" />`
    },
    {
      label: 'Code-behind',
      language: 'csharp',
      code: `// Counter.razor.cs  (partial class — same name as Counter.razor)
public partial class Counter
{
    [Parameter] public int InitialCount { get; set; }

    private int count;

    protected override void OnParametersSet()
    {
        count = InitialCount;
    }

    private void Increment() => count++;
}

// Counter.razor
@page "/counter"
<h1>@count</h1>
<button @onclick="Increment">+1</button>`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Setting [Parameter] properties inside the component',
      wrong: 'private void Reset() { Title = "Default"; }  // modifying own parameter',
      right: '// Use a private backing field; let the parent control [Parameter] values',
      explanation: 'Blazor may overwrite [Parameter] values on the next render cycle, discarding your change silently.'
    },
    {
      title: 'Calling StateHasChanged in a loop',
      wrong: 'for (int i = 0; i < 100; i++) { data.Add(i); StateHasChanged(); }',
      right: 'for (int i = 0; i < 100; i++) { data.Add(i); }\nStateHasChanged();',
      explanation: 'Each StateHasChanged() triggers a full render cycle. Call it once after all mutations are complete.'
    },
    {
      title: 'Calling JS interop in OnInitializedAsync',
      wrong: 'protected override async Task OnInitializedAsync() { await JS.InvokeVoidAsync("init"); }',
      right: 'protected override async Task OnAfterRenderAsync(bool firstRender)\n{\n    if (firstRender) await JS.InvokeVoidAsync("init");\n}',
      explanation: 'The DOM does not exist yet during OnInitialized. JS interop that touches the DOM must wait for OnAfterRender.'
    },
    {
      title: 'Forgetting to dispose event subscriptions',
      wrong: 'protected override void OnInitialized() { Service.OnChange += Update; }',
      right: 'protected override void OnInitialized() { Service.OnChange += Update; }\npublic void Dispose() { Service.OnChange -= Update; }',
      explanation: 'Unremoved event handlers keep the component alive and leak memory, especially on Blazor Server circuits.'
    },
    {
      title: 'Using @ChildContent without making it a [Parameter]',
      wrong: 'private RenderFragment? ChildContent { get; set; }',
      right: '[Parameter] public RenderFragment? ChildContent { get; set; }',
      explanation: 'Without [Parameter], the parent cannot pass content. The slot is silently ignored.'
    },
  ];

  challenge: Challenge = {
    title: 'Collapsible Card Component',
    language: 'csharp',
    description: 'Build a reusable `<CollapsibleCard>` component with a `Title` parameter (string) and a `ChildContent` slot. It should toggle its body visibility when the title header is clicked. Add a `DefaultExpanded` parameter (bool, defaults to true).',
    hints: [
      'Track expanded state in a private bool field.',
      'Initialize the field from DefaultExpanded in OnParametersSet.',
      'Toggle with a simple `@onclick` on the header element.',
    ],
    starterCode: `<!-- CollapsibleCard.razor -->
@code {
    // TODO: Parameters and state
}`,
    solution: `<!-- CollapsibleCard.razor -->
<div class="card">
    <div class="card-header" @onclick="Toggle" style="cursor:pointer">
        <strong>@Title</strong>
        <span>@(isExpanded ? "▲" : "▼")</span>
    </div>
    @if (isExpanded)
    {
        <div class="card-body">@ChildContent</div>
    }
</div>

@code {
    [Parameter, EditorRequired] public string Title { get; set; } = "";
    [Parameter] public RenderFragment? ChildContent { get; set; }
    [Parameter] public bool DefaultExpanded { get; set; } = true;

    private bool isExpanded;

    protected override void OnParametersSet()
    {
        isExpanded = DefaultExpanded;
    }

    private void Toggle() => isExpanded = !isExpanded;
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What decorator marks a property as a component input in Blazor?', options: ['[Input]', '[Parameter]', '[Bind]', '[Prop]'], answer: 1, explanation: '[Parameter] is the Blazor equivalent of React props or Angular @Input(). It marks a property that can be set by a parent component.' },
    { q: 'Where is it safe to call JS interop that accesses the DOM?', options: ['OnInitializedAsync', 'OnParametersSet', 'OnAfterRenderAsync', 'ShouldRender'], answer: 2, explanation: 'OnAfterRenderAsync fires after the DOM is updated. Earlier lifecycle hooks run before the DOM exists.' },
    { q: 'What does RenderFragment<T> allow?', options: ['Passing CSS to a child', 'Passing a typed context back into a template', 'Loading components lazily', 'Defining generic services'], answer: 1, explanation: 'RenderFragment<T> lets the parent write a template that receives a value (e.g., a list row) from the child component.' },
    { q: 'When does Blazor call StateHasChanged automatically?', options: ['Every 100ms', 'After every event handler completes', 'Only when you call it manually', 'On every HTTP request'], answer: 1, explanation: 'Blazor wraps event handlers with automatic StateHasChanged. You only need to call it manually for state changes from external sources.' },
    { q: 'How do you create a code-behind file for MyPage.razor?', options: ['MyPage.cs', 'MyPage.razor.cs (partial class)', 'MyPage.controller.cs', 'MyPage.vm.cs'], answer: 1, explanation: 'MyPage.razor.cs with `public partial class MyPage` is the convention. The Roslyn compiler merges the two partial declarations.' },
  ];

  qna: QnaItem[] = [
    { q: 'Should I always use a code-behind file?', a: 'Not necessarily. For small components, keeping @code inline is simpler. Use code-behind when the logic grows beyond ~30 lines, when you want IDE refactoring tools to work better, or when you are unit testing the component class directly.' },
    { q: 'Can I use constructor injection instead of @inject?', a: 'Yes. In a code-behind partial class you can use constructor injection normally. In a .razor file you can also define a constructor, but @inject is the idiomatic approach and is shorter.' },
    { q: 'What is the difference between OnInitialized and OnParametersSet?', a: 'OnInitialized runs once after the first render. OnParametersSet runs on every parameter update, including the first. Use OnInitialized for one-time setup and OnParametersSet to react to parameter changes.' },
    { q: 'How do I prevent a component from re-rendering unnecessarily?', a: 'Override ShouldRender() and return false when your data has not changed. For value-type parameters this is simple; for reference types you may need deep equality checks or immutable records.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Razor components are .razor files compiled to C# partial classes — combining HTML markup, [Parameter] inputs, RenderFragment slots, and a predictable lifecycle.',
    mustKnow: [
      '.razor files compile to C# partial classes; @code is the class body.',
      '[Parameter] marks public properties as parent-supplied inputs.',
      'RenderFragment / RenderFragment<T> are the slot/template mechanism.',
      'OnInitializedAsync is for first-load data; OnParametersSet for updates.',
      'StateHasChanged() is auto-called after event handlers; call manually for external updates.',
      'Implement IDisposable to clean up event subscriptions and timers.',
    ],
    interviewFocus: [
      'Explain the Blazor component lifecycle and when to use each hook.',
      'Why should you never modify your own [Parameter] properties?',
      'How does RenderFragment<T> enable reusable template components?',
    ]
  };
}
