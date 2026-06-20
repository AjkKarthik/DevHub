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
  selector: 'app-blazor-js-interop',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './js-interop.html',
  styleUrl: './js-interop.scss'
})
export class BlazorJsInterop {
  quickRef: QuickRefItem[] = [
    { name: 'IJSRuntime', type: 'interface', desc: 'Primary interface for calling JavaScript from C#.' },
    { name: 'InvokeAsync<T>()', type: 'method', desc: 'Call a JS function and await its return value.' },
    { name: 'InvokeVoidAsync()', type: 'method', desc: 'Call a JS function with no return value.' },
    { name: 'IJSObjectReference', type: 'interface', desc: 'Reference to a JS module (import() style).' },
    { name: 'DotNet.invokeMethodAsync()', type: 'method', desc: 'Call a [JSInvokable] C# method from JavaScript.' },
    { name: '[JSInvokable]', type: 'decorator', desc: 'Marks a static or instance C# method callable from JS.' },
    { name: 'DotNetObjectReference.Create()', type: 'method', desc: 'Wraps a C# object so JS can call its methods.' },
    { name: 'IJSInProcessRuntime', type: 'interface', desc: 'WASM-only synchronous JS interop.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Calling JavaScript from C#',
      points: ['Inject `IJSRuntime` and call `InvokeAsync<T>` (returns a value) or `InvokeVoidAsync` (fire-and-forget). The first argument is the fully qualified JS function name (e.g., `"window.myLib.doThing"`). Additional arguments are JSON-serialized. All JS interop is async on Blazor Server; on WASM you can also use the synchronous `IJSInProcessRuntime` but prefer async for compatibility.',
      'InvokeAsync<T> returns a deserialized value from JS.', 'InvokeVoidAsync is for side-effects with no return.', 'JS function path uses dot notation: "window.myLib.fn".', 'Only call JS after the first render (OnAfterRenderAsync).']
    },
    {
      heading: 'Module-scoped JS with IJSObjectReference',
      points: ['Calling global window functions pollutes the global namespace. The modern pattern is ES modules: import a JS module with `await JS.InvokeAsync<IJSObjectReference>("import", "./js/myModule.js")` and call functions on the returned reference. Dispose the reference with `await module.DisposeAsync()` when the component unmounts.',
      'IJSObjectReference wraps an ES module import.', 'Scope functions to the module — no global namespace pollution.', 'DisposeAsync() releases the JS reference.', 'Works in both Server and WASM.']
    },
    {
      heading: 'Calling C# from JavaScript',
      points: ['Mark a static C# method with `[JSInvokable]` and call it from JS with `DotNet.invokeMethodAsync("AssemblyName", "MethodName")`. For instance methods, wrap the object with `DotNetObjectReference.Create(this)`, pass it to JS, and let JS call `dotnetRef.invokeMethodAsync("MethodName")`. Dispose the reference to prevent memory leaks.',
      '[JSInvokable] on a static method enables cross-assembly calls.', 'DotNetObjectReference wraps an instance for JS to call methods on.', 'Pass the DotNetObjectReference as a JS argument.', 'Dispose the reference when the component unmounts.']
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'C# → JS',
      language: 'csharp',
      code: `@inject IJSRuntime JS

<button @onclick="FocusInput">Focus</button>
<input id="myInput" />

@code {
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
            await JS.InvokeVoidAsync("window.scrollTo", 0, 0);
    }

    private async Task FocusInput()
        => await JS.InvokeVoidAsync("document.getElementById('myInput').focus");

    private async Task<string> GetTimezone()
        => await JS.InvokeAsync<string>("Intl.DateTimeFormat().resolvedOptions().timeZone");
}`
    },
    {
      label: 'ES Module pattern',
      language: 'csharp',
      code: `// wwwroot/js/charts.js (ES module)
export function drawChart(canvasId, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    // ...draw chart...
}

// ChartComponent.razor
@inject IJSRuntime JS
@implements IAsyncDisposable

<canvas id="chartCanvas"></canvas>

@code {
    private IJSObjectReference? module;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (!firstRender) return;
        module = await JS.InvokeAsync<IJSObjectReference>(
            "import", "./js/charts.js");
        await module.InvokeVoidAsync("drawChart", "chartCanvas", data);
    }

    public async ValueTask DisposeAsync()
    {
        if (module is not null)
            await module.DisposeAsync();
    }
}`
    },
    {
      label: 'JS → C# (instance)',
      language: 'csharp',
      code: `// C#
@inject IJSRuntime JS
@implements IAsyncDisposable

@code {
    private DotNetObjectReference<MyComponent>? dotNetRef;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (!firstRender) return;
        dotNetRef = DotNetObjectReference.Create(this);
        await JS.InvokeVoidAsync("registerCallback", dotNetRef);
    }

    [JSInvokable]
    public void OnExternalEvent(string data)
    {
        // Called by JavaScript
        Console.WriteLine($"Got: {data}");
        StateHasChanged();
    }

    public async ValueTask DisposeAsync()
    {
        dotNetRef?.Dispose();
    }
}

// JS
function registerCallback(dotNetRef) {
    window.addEventListener("resize", () =>
        dotNetRef.invokeMethodAsync("OnExternalEvent", window.innerWidth.toString())
    );
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Calling JS interop in OnInitializedAsync',
      wrong: 'protected override async Task OnInitializedAsync() { await JS.InvokeVoidAsync("init"); }',
      right: 'protected override async Task OnAfterRenderAsync(bool firstRender)\n{\n    if (firstRender) await JS.InvokeVoidAsync("init");\n}',
      explanation: 'JS interop requires the DOM — which does not exist during OnInitialized or pre-rendering. Always defer to OnAfterRenderAsync.'
    },
    {
      title: 'Not disposing IJSObjectReference',
      wrong: 'private IJSObjectReference? module;\n// no DisposeAsync',
      right: 'public async ValueTask DisposeAsync()\n{\n    if (module is not null) await module.DisposeAsync();\n}',
      explanation: 'IJSObjectReference holds a handle to a JS object. Not disposing it leaks memory in both Server (circuit-level) and WASM (heap-level).'
    },
    {
      title: 'Not disposing DotNetObjectReference',
      wrong: 'var ref = DotNetObjectReference.Create(this);\nawait JS.InvokeVoidAsync("register", ref);',
      right: 'private DotNetObjectReference<T>? dotNetRef;\n// Store it and call dotNetRef?.Dispose() in DisposeAsync',
      explanation: 'DotNetObjectReference keeps the C# object alive for JS callbacks. If not disposed, the component never gets garbage-collected.'
    },
    {
      title: 'Passing non-JSON-serializable types to JS',
      wrong: 'await JS.InvokeVoidAsync("fn", someComplexObject);  // circular refs, Tasks',
      right: '// Serialize to a DTO first, or use ElementReference for DOM elements',
      explanation: 'JS interop serializes arguments to JSON. Objects with circular references, Tasks, or non-serializable types will throw at runtime.'
    },
    {
      title: 'Using synchronous IJSInProcessRuntime on Blazor Server',
      wrong: 'var js = (IJSInProcessRuntime)JS;\nvar result = js.Invoke<string>("fn");',
      right: 'var result = await JS.InvokeAsync<string>("fn");',
      explanation: 'IJSInProcessRuntime is only available in WASM where JS runs in-process. On Server, it throws an InvalidOperationException. Always use async interop for compatibility.'
    },
  ];

  challenge: Challenge = {
    title: 'Copy-to-Clipboard Button',
    language: 'csharp',
    description: 'Build a `<ClipboardButton>` component that accepts a `Text` parameter. When clicked, it copies the text to the clipboard using the Clipboard API via JS interop. Show "Copied!" feedback for 2 seconds, then reset. Use an ES module for the JS function.',
    hints: [
      'Create wwwroot/js/clipboard.js that exports async function copyText(text).',
      'Import the module in OnAfterRenderAsync and store as IJSObjectReference.',
      'Use a Timer or Task.Delay for the 2-second reset.',
    ],
    starterCode: `// wwwroot/js/clipboard.js
export async function copyText(text) {
    await navigator.clipboard.writeText(text);
}

// ClipboardButton.razor
@inject IJSRuntime JS
@implements IAsyncDisposable

<button @onclick="Copy">@(copied ? "Copied!" : "Copy")</button>

@code {
    [Parameter] public string Text { get; set; } = "";
    private bool copied;
    private IJSObjectReference? module;
    // TODO: load module, copy on click, reset after 2s
}`,
    solution: `@inject IJSRuntime JS
@implements IAsyncDisposable

<button @onclick="Copy">@(copied ? "Copied!" : "Copy")</button>

@code {
    [Parameter] public string Text { get; set; } = "";
    private bool copied;
    private IJSObjectReference? module;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
            module = await JS.InvokeAsync<IJSObjectReference>("import", "./js/clipboard.js");
    }

    private async Task Copy()
    {
        if (module is null) return;
        await module.InvokeVoidAsync("copyText", Text);
        copied = true;
        StateHasChanged();
        await Task.Delay(2000);
        copied = false;
    }

    public async ValueTask DisposeAsync()
    {
        if (module is not null) await module.DisposeAsync();
    }
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'Which method calls a JS function and returns a value?', options: ['InvokeVoidAsync', 'InvokeAsync<T>', 'CallAsync<T>', 'ExecuteAsync<T>'], answer: 1, explanation: 'InvokeAsync<T> calls a JS function and deserializes its return value to type T. InvokeVoidAsync is for fire-and-forget calls with no return.' },
    { q: 'When is JS interop first available?', options: ['OnInitialized', 'OnParametersSet', 'OnAfterRenderAsync', 'Constructor'], answer: 2, explanation: 'JS interop requires the browser DOM, which is only available after the component is rendered for the first time. OnAfterRenderAsync is the correct hook.' },
    { q: 'What does DotNetObjectReference.Create(this) do?', options: ['Clones the component', 'Creates a GC handle so JS can call C# instance methods', 'Serializes the component to JSON', 'Registers a JS module'], answer: 1, explanation: 'DotNetObjectReference keeps the C# object alive and provides a JS-callable handle. Pass it to a JS function and call dotNetRef.invokeMethodAsync from JS.' },
    { q: 'How do you import an ES module for scoped JS interop?', options: ['JS.ImportModule("path")', 'await JS.InvokeAsync<IJSObjectReference>("import", "path")', 'new JSModule("path")', 'JS.LoadModule("path")'], answer: 1, explanation: 'The "import" function name is a special JS interop call that triggers a dynamic import() and returns an IJSObjectReference to the module.' },
    { q: 'What interface marks a C# method callable from JavaScript?', options: ['[JSCallback]', '[JSExport]', '[JSInvokable]', '[JavaScriptMethod]'], answer: 2, explanation: '[JSInvokable] marks a public static or instance method so it can be called from JS via DotNet.invokeMethodAsync().' },
  ];

  qna: QnaItem[] = [
    { q: 'Can I use third-party JS libraries with Blazor?', a: 'Yes. Place the library in wwwroot, add a <script> tag in index.html (WASM) or _Host.cshtml (Server), then call its global functions via IJSRuntime. For better isolation, wrap the library in a custom ES module and use IJSObjectReference.' },
    { q: 'How do I pass an HTML element reference to a JS function?', a: 'Declare an ElementReference field and attach it with @ref="myInput". Pass the field directly to InvokeVoidAsync — Blazor serializes it to a stable DOM identifier that JS can use to find the element with document.getElementById or the Blazor element resolution API.' },
    { q: 'Is JS interop available in Static SSR?', a: 'No. Static SSR has no JS runtime context during rendering. You can still include client-side scripts (in <HeadContent> or just as script tags), but you cannot call IJSRuntime from @code — it will throw.' },
    { q: 'What is the performance cost of JS interop?', a: 'Each interop call crosses the C#/JS boundary. On WASM this is cheap (in-process call). On Server it crosses the SignalR WebSocket — add one network round-trip per call. Batch calls into a single JS function that does multiple operations to minimize round-trips on Server.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Blazor JS interop: call JS from C# via IJSRuntime.InvokeAsync, scope JS with IJSObjectReference (ES modules), and call C# from JS via [JSInvokable] + DotNetObjectReference.',
    mustKnow: [
      'InvokeAsync<T> returns a value; InvokeVoidAsync is fire-and-forget.',
      'JS interop is only available after first render (OnAfterRenderAsync).',
      'Use IJSObjectReference for module-scoped JS to avoid global namespace pollution.',
      '[JSInvokable] marks C# methods callable from JavaScript.',
      'DotNetObjectReference keeps a C# object alive for JS callbacks.',
      'Always dispose both IJSObjectReference and DotNetObjectReference.',
    ],
    interviewFocus: [
      'What is the difference between IJSRuntime and IJSObjectReference?',
      'Why must you call JS interop in OnAfterRenderAsync?',
      'How do you call a C# instance method from JavaScript?',
    ]
  };
}
