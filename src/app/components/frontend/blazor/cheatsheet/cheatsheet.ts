import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';

@Component({
  selector: 'app-blazor-cheatsheet',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, QnaBlockComponent],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss'
})
export class BlazorCheatsheet {
  quickRef: QuickRefItem[] = [
    { name: '@page "/path"', type: 'syntax', desc: 'Declare a routable page.' },
    { name: '@inject TService Name', type: 'syntax', desc: 'Inject a DI service.' },
    { name: '@bind="field"', type: 'syntax', desc: 'Two-way binding (onchange trigger).' },
    { name: '@bind:event="oninput"', type: 'syntax', desc: 'Two-way bind triggering on each keystroke.' },
    { name: '@onclick="Handler"', type: 'syntax', desc: 'Event binding.' },
    { name: '@rendermode InteractiveServer', type: 'syntax', desc: 'Enable Server-side interactivity.' },
    { name: '@code { }', type: 'syntax', desc: 'C# code block in a .razor file.' },
    { name: '[Parameter]', type: 'decorator', desc: 'Mark a property as a component input.' },
    { name: 'EventCallback<T>', type: 'type', desc: 'Child-to-parent callback.' },
    { name: '[StreamRendering]', type: 'decorator', desc: 'Progressive SSR HTML flushing.' },
    { name: 'StateHasChanged()', type: 'method', desc: 'Request a re-render.' },
    { name: 'InvokeAsync(StateHasChanged)', type: 'method', desc: 'Thread-safe re-render from non-UI threads.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Razor syntax quick reference',
      points: ['`@expression` — output a C# value. `@if`, `@foreach`, `@switch` — control flow. `@{ }` — statement block. `@@` — literal @ sign. `@:` — render a line as HTML. `@*...*@` — comment.',
      '@ prefix escapes into C#.', '@@ renders a literal @ character.', '@: renders the rest of the line as HTML content.', 'HTML entities in C# strings: use MarkupString or Html.Raw().']
    },
    {
      heading: 'Lifecycle hooks',
      points: ['SetParametersAsync → OnInitialized(Async) → OnParametersSet(Async) → ShouldRender → BuildRenderTree → OnAfterRender(Async) → [repeat on update] → Dispose/DisposeAsync.',
      'OnInitializedAsync: first data load.', 'OnParametersSet: react to parameter changes.', 'ShouldRender: skip diff (return false).', 'OnAfterRenderAsync(firstRender): JS interop, DOM access.']
    },
    {
      heading: 'Render mode cheat sheet',
      points: ['Static SSR (default) — pure HTML, no JS required. InteractiveServer — SignalR circuit, C# on server. InteractiveWebAssembly — .NET in browser. InteractiveAuto — Server first, WASM when cached.',
      'Apply per-component: @rendermode InteractiveServer.', 'Apply per-use: <Counter @rendermode="RenderMode.InteractiveServer" />.', 'Global default via DefaultLayout in Router.', 'Child cannot be more interactive than parent.']
    },
    {
      heading: 'DI service lifetimes',
      points: ['Singleton — one instance for app lifetime (shared across all users on Server). Scoped — one per circuit on Blazor Server, one per app on WASM. Transient — new instance every request.',
      'Scoped on Server ≠ per-request — it\'s per circuit.', 'Singleton on Server must be thread-safe.', 'Never inject Scoped into Singleton (captive dependency).', 'Use OwningComponentBase<T> for component-scoped services.']
    },
    {
      heading: 'Common gotchas quick reference',
      points: [
        'StateHasChanged() is required after modifying component state from outside the normal Blazor event/lifecycle pipeline (a background task, a timer callback) — Blazor does not automatically detect changes made this way and re-render.',
        'InvokeAsync(StateHasChanged) (not a direct call) is required when updating UI from a non-Blazor-managed thread or callback, ensuring the update is correctly marshaled onto the renderer\'s synchronization context.',
        '@key is required on repeated elements in a loop whenever items can be reordered, inserted, or removed from the middle of the collection — omitting it causes Blazor\'s diffing to misattribute state (like input focus) to the wrong visual item.',
        'IDisposable/IAsyncDisposable implementation is required for components holding subscriptions, timers, or JS interop references — forgetting it is one of the most common sources of memory leaks in non-trivial Blazor applications.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Component anatomy',
      language: 'csharp',
      code: `@page "/example"
@rendermode InteractiveServer
@inject IMyService MySvc
@using MyApp.Models
@implements IDisposable

<h1>@Title</h1>
<p>Count: @count</p>
<button @onclick="Increment">+1</button>

@code {
    [Parameter] public string Title { get; set; } = "";
    [Parameter] public EventCallback<int> OnCountChanged { get; set; }

    private int count;

    protected override async Task OnInitializedAsync()
        => count = await MySvc.GetInitialCountAsync();

    private async Task Increment()
    {
        count++;
        await OnCountChanged.InvokeAsync(count);
    }

    public void Dispose() { /* cleanup */ }
}`
    },
    {
      label: 'Forms & validation',
      language: 'csharp',
      code: `<EditForm Model="model" OnValidSubmit="Submit">
    <DataAnnotationsValidator />
    <ValidationSummary />

    <InputText @bind-Value="model.Name" />
    <ValidationMessage For="() => model.Name" />

    <InputNumber @bind-Value="model.Age" />
    <InputCheckbox @bind-Value="model.Active" />
    <InputSelect @bind-Value="model.Role">
        <option value="admin">Admin</option>
        <option value="user">User</option>
    </InputSelect>

    <button type="submit">Save</button>
</EditForm>

@code {
    private MyModel model = new();
    private void Submit() { /* save */ }
}

public class MyModel
{
    [Required] [MinLength(2)] public string Name { get; set; } = "";
    [Range(1, 120)] public int Age { get; set; }
    public bool Active { get; set; }
    public string Role { get; set; } = "user";
}`
    },
    {
      label: 'JS Interop patterns',
      language: 'csharp',
      code: `// C# → JS (void)
await JS.InvokeVoidAsync("window.alert", "Hello");

// C# → JS (return value)
var tz = await JS.InvokeAsync<string>(
    "Intl.DateTimeFormat().resolvedOptions().timeZone");

// ES Module import
var module = await JS.InvokeAsync<IJSObjectReference>(
    "import", "./js/mylib.js");
await module.InvokeVoidAsync("doThing", arg);
await module.DisposeAsync();

// JS → C# (static)
[JSInvokable]
public static void OnExternalEvent(string data) { }

// JS → C# (instance)
var dotNetRef = DotNetObjectReference.Create(this);
await JS.InvokeVoidAsync("registerCallback", dotNetRef);
// In JS: dotNetRef.invokeMethodAsync("MethodName", arg)
// Cleanup:
dotNetRef.Dispose();`
    },
    {
      label: 'Communication patterns',
      language: 'csharp',
      code: `// 1. Parent → Child
[Parameter] public string Value { get; set; } = "";

// 2. Child → Parent (two-way bind)
[Parameter] public string Value { get; set; } = "";
[Parameter] public EventCallback<string> ValueChanged { get; set; }
// Parent: <MyInput @bind-Value="myStr" />

// 3. Cascade
<CascadingValue Value="theme">...</CascadingValue>
[CascadingParameter] private Theme? Theme { get; set; }

// 4. @ref — call child methods
<Counter @ref="counter" />
@code { private Counter? counter;
        private async Task Reset() => await counter!.ResetAsync(); }

// 5. Shared scoped service + Action event
@inject AppState State
protected override void OnInitialized()
    => State.OnChange += StateHasChanged;
public void Dispose()
    => State.OnChange -= StateHasChanged;`
    },
  ];

  qna: QnaItem[] = [
    { q: 'Quick: how do I conditionally apply a CSS class?', a: 'Use a ternary in the class attribute: `<div class="card @(isActive ? "active" : "")">`.' },
    { q: 'Quick: how do I stop event propagation?', a: 'Use @onclick:stopPropagation="true" on the element.' },
    { q: 'Quick: how do I prevent default action (e.g. link navigation)?', a: 'Use @onclick:preventDefault="true" alongside the event directive.' },
    { q: 'Quick: how do I pass raw HTML into a component?', a: 'Accept a MarkupString parameter: `[Parameter] public MarkupString Content { get; set; }` and render it with `@Content`. Never use MarkupString with untrusted content — it bypasses HTML encoding.' },
    { q: 'Quick: how do I show a loading spinner while awaiting?', a: 'Set a `private bool isLoading = true;` before the await and false after. Render: `@if (isLoading) { <Spinner /> } else { <Content /> }`.' },
    { q: 'Quick: what is the difference between @onclick and @onclick:prevent-default?', a: '@onclick binds the handler; @onclick:preventDefault="true" also calls event.preventDefault() before your handler runs, which is needed for intercepting link clicks or form submits.' },
  ];
}
