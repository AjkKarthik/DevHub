import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';

@Component({
  selector: 'app-blazor-interview-prep',
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, QuizBlockComponent, QnaBlockComponent],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss'
})
export class BlazorInterviewPrep {
  theory: TheoryPoint[] = [
    {
      heading: 'Fundamentals & Render Modes',
      points: ['Be ready to explain: What is Blazor? What are the four render modes in .NET 8? How does Blazor Server differ from WASM? When would you choose each mode? What is a Blazor circuit?',
      
        'Blazor is a .NET framework for building interactive web UIs with C# instead of JavaScript.',
        'Four modes: Static SSR (default), InteractiveServer (SignalR), InteractiveWebAssembly (.NET in browser), InteractiveAuto (Server → WASM).',
        'Blazor Server: C# on server, UI diffs over SignalR circuit. WASM: .NET runtime in browser, no server needed at runtime.',
        'Circuit = the persistent SignalR WebSocket connection per user session in Blazor Server.',
        'Choose Server for server-resource access; WASM for offline or scale; Auto for best UX at scale.',
      ]
    },
    {
      heading: 'Component Model',
      points: ['Key questions: Explain the component lifecycle. What is the difference between OnInitialized and OnParametersSet? When should you use ShouldRender? What is the difference between @bind and @bind-Value?',
      
        'Lifecycle order: SetParametersAsync → OnInitialized(Async) → OnParametersSet(Async) → ShouldRender → BuildRenderTree → OnAfterRender(Async) → Dispose.',
        'OnInitialized runs once; OnParametersSet runs on every parameter change (including first).',
        'ShouldRender returning false skips the diff — use when state has not changed.',
        '@bind targets HTML element attributes; @bind-Value targets Blazor component Value parameters.',
        '[Parameter] properties must never be mutated by the component itself.',
      ]
    },
    {
      heading: 'Data, Forms, and DI',
      points: ['Prepare for: How does EditForm validation work? What is EditContext? How do service lifetimes differ in Blazor? What is a captive dependency?',
      
        'EditForm wraps a model in EditContext; DataAnnotationsValidator wires DataAnnotations rules.',
        'OnValidSubmit fires only when validation passes; OnSubmit always fires.',
        'ValidationMessageStore: add custom server-side errors, then call ctx.NotifyValidationStateChanged().',
        'Scoped on Server = per circuit (not per request). Singleton on Server is shared across all users.',
        'Captive dependency: Singleton depends on Scoped — the Scoped service outlives its intended scope.',
      ]
    },
    {
      heading: 'JS Interop & State',
      points: ['Common questions: How do you call JavaScript from Blazor? How does state management work? What is PersistentComponentState? How do you share state between components?',
      
        'IJSRuntime.InvokeAsync<T> calls JS and returns a value; InvokeVoidAsync for side-effects.',
        'JS interop requires first OnAfterRenderAsync — DOM does not exist during OnInitialized.',
        'DotNetObjectReference.Create(this) passes a C# instance for JS to call [JSInvokable] methods.',
        'Simplest state: Scoped service + Action event — components subscribe and call StateHasChanged.',
        'PersistentComponentState prevents double data-fetch during SSR → interactive hydration.',
      ]
    },
    {
      heading: 'Performance & Advanced Topics',
      points: ['Expect these: How do you optimise Blazor rendering? What does @key do? How do you scale Blazor Server? What is the difference between [StreamRendering] and InteractiveServer?',
      
        'ShouldRender() false = zero DOM cost. Use for components that receive many external updates.',
        '@key gives the differ stable item identity — essential when lists are reordered or filtered.',
        'Blazor Server scaling requires sticky sessions or Azure SignalR Service (backplane).',
        '[StreamRendering]: Static SSR — HTML flushed immediately, data streamed as it resolves. No persistent connection.',
        'InteractiveServer: full interactivity over SignalR circuit. [StreamRendering] has no circuit and cannot handle user events.',
      ]
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What is a Blazor Server circuit?', options: ['A CPU execution path', 'A persistent SignalR WebSocket connection per user', 'A render pipeline stage', 'A DI scope'], answer: 1, explanation: 'The circuit is the SignalR connection that carries DOM diffs, events, and component state between the browser and the Blazor Server.' },
    { q: 'What is the default render mode in .NET 8 Blazor?', options: ['InteractiveServer', 'InteractiveAuto', 'Static SSR', 'InteractiveWebAssembly'], answer: 2, explanation: 'Static SSR is the default — pages render HTML on the server with no persistent connection or JavaScript required.' },
    { q: 'Why does OnParametersSet fire more often than OnInitialized?', options: ['It is a bug', 'OnParametersSet fires on every parameter update; OnInitialized fires once', 'OnInitialized is deprecated', 'They fire at the same time'], answer: 1, explanation: 'OnInitialized runs once on component creation. OnParametersSet runs on creation AND every subsequent parameter change — e.g., when navigating to the same route with a different ID.' },
    { q: 'What is a captive dependency in Blazor DI?', options: ['A leaked memory reference', 'A Singleton service holding a Scoped dependency', 'A circular dependency', 'A disposed service still in use'], answer: 1, explanation: 'A Singleton captures a Scoped service at construction time. The Scoped service then outlives its intended circuit scope, potentially sharing user-specific state across users.' },
    { q: 'What method resets an ErrorBoundary after an exception?', options: ['Reset()', 'Clear()', 'Recover()', 'Retry()'], answer: 2, explanation: 'ErrorBoundary.Recover() clears the error state and re-renders the child content, giving users a way to retry after a component failure.' },
    { q: 'What is required in App.razor for PageTitle and HeadContent to work?', options: ['<title> tag', '<HeadOutlet />', '<Meta />', '<Script />'], answer: 1, explanation: 'HeadOutlet is the render target. Without it in <head>, all PageTitle and HeadContent components produce no output.' },
    { q: 'What does @key on a list item prevent?', options: ['Memory leaks', 'XSS attacks', 'Full DOM reconstruction on reorder/insert', 'CSS specificity issues'], answer: 2, explanation: '@key gives the Blazor differ stable identity. Without it, inserting an item at position 0 forces all subsequent items to be rebuilt. With @key, only new/moved items are updated.' },
    { q: 'Which approach is correct for sharing state between sibling components?', options: ['@ref on both', 'CascadingValue', 'Shared Scoped service + event', 'LocalStorage'], answer: 2, explanation: 'Siblings have no direct communication path. A shared Scoped service with an Action event is the idiomatic Blazor pattern — one sibling mutates state and raises the event, the other subscribes and re-renders.' },
  ];

  qna: QnaItem[] = [
    { q: 'How would you explain Blazor to a React developer?', a: 'Blazor is .NET\'s answer to React — you write components in C# (.razor files) instead of JavaScript. Like React, components have props ([Parameter]), state (private fields + StateHasChanged), and lifecycle hooks (OnInitialized, OnParametersSet). Unlike React, there is no virtual DOM library — Blazor\'s renderer diffs the component tree and patches the real DOM directly. On Blazor Server, C# runs on the server and diffs are sent over WebSocket. On WASM, .NET runs in the browser using WebAssembly.' },
    { q: 'What would you consider before choosing Blazor Server vs WASM for a new project?', a: 'Server if: you need database/file access, fast first load, or a small number of concurrent users. WASM if: you need offline support, want to remove server dependency for UI, or expect high scale (server load scales with users on Server). Auto mode (Server first, WASM when cached) is a good default for apps that need both fast startup and scale. Consider that Server requires a network connection and WASM adds ~8-15MB initial download.' },
    { q: 'How do you prevent memory leaks in a long-running Blazor Server app?', a: 'Three main sources: (1) Unremoved event subscriptions — always unsubscribe in Dispose(). (2) Undisposed IJSObjectReference and DotNetObjectReference — implement IAsyncDisposable and DisposeAsync. (3) Timers — stop and dispose in Dispose(). On Blazor Server, undisposed resources persist for the circuit lifetime (potentially hours). Review all IDisposable services and ensure OwningComponentBase is used for component-scoped EF Core contexts.' },
    { q: 'What are the scaling limitations of Blazor Server and how do you address them?', a: 'Each circuit holds state in server memory — 1000 concurrent users × (memory per circuit) can exhaust RAM. Multi-server requires sticky sessions or Azure SignalR Service (backplane). Mitigation: set a short DisconnectedCircuitRetentionPeriod, dispose resources promptly, use Azure SignalR Service for elastic scaling, and consider moving to WASM for the UI layer if the scale requires it.' },
    { q: 'How would you add SEO to a Blazor WASM app?', a: 'WASM renders client-side so search crawlers often see only the blank shell HTML. Options: (1) Migrate public pages to a Blazor Web App using Static SSR — the best approach. (2) Pre-render WASM pages at publish time using a static site generator. (3) Use a reverse proxy or service (Prerender.io) that executes WASM and serves HTML to crawlers. (4) Add <PageTitle> and meta tags — they will be present in the HTML when pre-rendered.' },
    { q: 'When would you use [StreamRendering] vs InteractiveServer?', a: '[StreamRendering] is for Static SSR pages that need fast perceived load — the page shell is sent immediately and data is streamed as it resolves. No persistent connection, no JS circuit, no ability to handle ongoing user events. InteractiveServer is for components that need real-time interactivity (click handlers, form validation, live updates). Choose [StreamRendering] for read-heavy pages (product lists, news feeds) and InteractiveServer for interactive dashboards or forms.' },
  ];
}
