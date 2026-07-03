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
  selector: 'app-blazor-state-management',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './state-management.html',
  styleUrl: './state-management.scss'
})
export class BlazorStateManagement {
  quickRef: QuickRefItem[] = [
    { name: 'Scoped service', type: 'keyword', desc: 'Simplest shared state — one instance per circuit.' },
    { name: 'PersistentComponentState', type: 'class', desc: 'Persist pre-rendering data to avoid double-fetch.' },
    { name: 'ProtectedLocalStorage', type: 'class', desc: 'Encrypted browser localStorage access from Blazor.' },
    { name: 'ProtectedSessionStorage', type: 'class', desc: 'Encrypted sessionStorage access from Blazor.' },
    { name: 'Fluxor', type: 'keyword', desc: 'Redux-style state management library for Blazor.' },
    { name: 'Action (event)', type: 'type', desc: 'Service-level change notification for reactive components.' },
    { name: 'CascadingValue', type: 'keyword', desc: 'Passes state down the component tree without prop-drilling.' },
    { name: 'IStateObservable (Fluxor)', type: 'interface', desc: 'Subscribe to specific state slice changes.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Scoped service as state bag',
      points: ['The simplest approach for sharing state is a Scoped service. Inject it into all components that need the data. Add an `Action OnChange` event — when state mutates, invoke the event, and each subscribed component calls `StateHasChanged()`. This is the recommended starting point before reaching for a library. On Blazor WASM, Scoped behaves like Singleton so this works across the whole app.',
      'Scoped service is the idiomatic "store" for shared Blazor state.', 'An Action event notifies components to re-render after mutations.', 'Components subscribe in OnInitialized and unsubscribe in Dispose.', 'No library required — plain C# for most apps.']
    },
    {
      heading: 'Browser storage — ProtectedLocalStorage & ProtectedSessionStorage',
      points: ['Blazor Server ships `ProtectedLocalStorage` and `ProtectedSessionStorage` — wrappers around the browser Web Storage API that encrypt values with ASP.NET Core Data Protection. For WASM, use `IJSRuntime` directly or install the `Blazored.LocalStorage` package. Note: all browser storage access is async (JS interop) and unavailable during Static SSR pre-rendering.',
      'ProtectedLocalStorage persists data across browser sessions.', 'ProtectedSessionStorage clears on tab close.', 'Storage access is always async — await in OnAfterRenderAsync.', 'Data is encrypted automatically by ASP.NET Core Data Protection.']
    },
    {
      heading: 'PersistentComponentState for SSR pre-rendering',
      points: ['When a Blazor page is pre-rendered on the server and then made interactive, data fetched during pre-rendering is lost and re-fetched — causing a double-request. `PersistentComponentState` solves this: during pre-render, serialize data with `PersistAsJson`. When the interactive component starts, deserialize it with `TryTakeFromJson` before hitting the API.',
      'Eliminates double data-fetch during SSR → interactive hydration.', 'Call PersistAsJson during OnInitializedAsync in the pre-render phase.', 'Call TryTakeFromJson to restore data before making an API call.', 'Works transparently — same @code branch handles both phases.']
    },
    {
      heading: 'Persisting State Across Blazor WebAssembly Page Reloads',
      points: [
        'Blazor WebAssembly application state lives entirely in browser memory and is lost on a full page reload — for state that should survive a reload (user preferences, in-progress form data), explicit persistence to browser localStorage or sessionStorage via JS interop is required.',
        'ProtectedLocalStorage and ProtectedSessionStorage (available for Blazor Server) provide server-side data protection (encryption) for values stored client-side, appropriate when the persisted state contains sensitive information that should not be readable or tamperable via browser dev tools.',
        'PersistentComponentState (used with Static SSR and enhanced navigation) lets state computed during the initial server render be serialized and passed to the client, avoiding a redundant re-fetch of the same data when a component subsequently becomes interactive — a specific optimization for the Static SSR to interactive transition.',
        'Choosing where state should live (component-local, a shared service, browser storage, or server-persisted) should be driven by the actual lifetime and sharing requirements of that specific piece of state — defaulting everything to the broadest-scoped option (a singleton service) when narrower scoping would suffice adds unnecessary complexity and potential for state leaking between unrelated parts of the application.',
      ],
    },
    {
      heading: 'State Management Libraries and Patterns for Larger Applications',
      points: [
        'For applications with genuinely complex, cross-cutting state (many components reading and writing shared application state), a dedicated state management pattern (Flux/Redux-style unidirectional data flow, implemented via a custom service or a library like Fluxor) provides more structure and predictability than ad-hoc shared services with scattered mutation points.',
        'A unidirectional data flow pattern (state changes only through explicit, traceable actions/dispatches rather than direct mutation from anywhere) makes it significantly easier to reason about how and why state changed, especially valuable as an application and team grows beyond what a single developer can hold in their head.',
        'Not every application needs a formal state management library — for smaller applications with limited shared state, a simple injected service with an OnChange event (the pattern covered in earlier sections) is often perfectly sufficient, and introducing a heavier state management framework prematurely adds complexity without proportional benefit.',
        'Whatever state management approach is chosen, keeping state changes traceable (through logging, dev tools integration, or simply clear, consistent code patterns) pays dividends during debugging — untraceable state mutations scattered throughout a codebase are one of the hardest categories of bug to track down in any stateful UI application.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Scoped service store',
      language: 'csharp',
      code: `// CartState.cs
public class CartState
{
    private readonly List<CartItem> items = [];
    public IReadOnlyList<CartItem> Items => items;
    public int Count => items.Sum(i => i.Qty);

    public event Action? OnChange;

    public void Add(CartItem item)
    {
        items.Add(item);
        OnChange?.Invoke();
    }
    public void Clear() { items.Clear(); OnChange?.Invoke(); }
}

// Program.cs
builder.Services.AddScoped<CartState>();

// CartIcon.razor — subscribes and re-renders on change
@inject CartState Cart
@implements IDisposable
<span>🛒 @Cart.Count</span>
@code {
    protected override void OnInitialized()
        => Cart.OnChange += StateHasChanged;
    public void Dispose()
        => Cart.OnChange -= StateHasChanged;
}`
    },
    {
      label: 'ProtectedLocalStorage',
      language: 'csharp',
      code: `@inject ProtectedLocalStorage Storage

<p>Saved theme: @theme</p>
<button @onclick="ToggleTheme">Toggle</button>

@code {
    private string theme = "light";

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (!firstRender) return;
        var result = await Storage.GetAsync<string>("theme");
        if (result.Success) { theme = result.Value!; StateHasChanged(); }
    }

    private async Task ToggleTheme()
    {
        theme = theme == "light" ? "dark" : "light";
        await Storage.SetAsync("theme", theme);
    }
}`
    },
    {
      label: 'PersistentComponentState',
      language: 'csharp',
      code: `@inject PersistentComponentState AppState
@implements IDisposable

<p>@(product?.Name ?? "Loading...")</p>

@code {
    private Product? product;
    private PersistingComponentStateSubscription subscription;

    protected override async Task OnInitializedAsync()
    {
        subscription = AppState.RegisterOnPersisting(Persist);

        if (!AppState.TryTakeFromJson<Product>("product", out product))
        {
            product = await ProductService.GetAsync(42);
        }
    }

    private Task Persist()
    {
        AppState.PersistAsJson("product", product);
        return Task.CompletedTask;
    }

    public void Dispose() => subscription.Dispose();
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not unsubscribing from service events',
      wrong: 'protected override void OnInitialized() { State.OnChange += StateHasChanged; }',
      right: 'protected override void OnInitialized() { State.OnChange += StateHasChanged; }\npublic void Dispose() { State.OnChange -= StateHasChanged; }',
      explanation: 'Unremoved handlers keep the component alive and prevent garbage collection, causing memory leaks and ghost re-renders in long-running Blazor Server apps.'
    },
    {
      title: 'Accessing browser storage in OnInitialized',
      wrong: 'protected override async Task OnInitializedAsync() { var r = await Storage.GetAsync<string>("key"); }',
      right: 'protected override async Task OnAfterRenderAsync(bool firstRender)\n{\n    if (!firstRender) return;\n    var r = await Storage.GetAsync<string>("key");\n}',
      explanation: 'Browser storage goes through JS interop which is unavailable during pre-rendering. Always access storage in OnAfterRender.'
    },
    {
      title: 'Calling StateHasChanged from a non-render thread on Blazor Server',
      wrong: 'timer = new Timer(_ => StateHasChanged(), null, 1000, 1000);',
      right: 'timer = new Timer(async _ => await InvokeAsync(StateHasChanged), null, 1000, 1000);',
      explanation: 'Blazor Server\'s renderer is not thread-safe. Timer callbacks run on a thread pool thread — InvokeAsync marshals back to the circuit\'s synchronization context.'
    },
    {
      title: 'Using a Singleton service for per-user state on Blazor Server',
      wrong: 'builder.Services.AddSingleton<ShoppingCart>(); // shared across all users!',
      right: 'builder.Services.AddScoped<ShoppingCart>(); // one per circuit',
      explanation: 'Singleton state is shared across every user connected to the server. User-specific state must be Scoped so each circuit gets its own instance.'
    },
    {
      title: 'Double-fetching data without PersistentComponentState',
      wrong: '// Fetch in OnInitializedAsync on both pre-render and interactive phases',
      right: '// Use PersistentComponentState to serialize pre-rendered data and restore it',
      explanation: 'Without PersistentComponentState, SSR pre-rendering fetches data, discards it, then the interactive component fetches it again — two API calls instead of one.'
    },
  ];

  challenge: Challenge = {
    title: 'Persistent Shopping Cart',
    language: 'csharp',
    description: 'Build a shopping cart that persists across page refreshes using ProtectedLocalStorage. On load, restore cart items. Add an "Add Item" button and a "Clear" button. Show the item count in a header component that reacts to changes via a shared CartState service.',
    hints: [
      'Load from storage in OnAfterRenderAsync(firstRender: true) and call StateHasChanged after.',
      'Save to storage on every Add/Clear operation.',
      'Use an Action event on CartState so the header re-renders without polling.',
    ],
    starterCode: `public class CartState
{
    public List<string> Items { get; } = [];
    public event Action? OnChange;
    public void Add(string item) { Items.Add(item); OnChange?.Invoke(); }
    public void Clear() { Items.Clear(); OnChange?.Invoke(); }
}`,
    solution: `// Program.cs
builder.Services.AddScoped<CartState>();

// CartPage.razor
@inject CartState Cart
@inject ProtectedLocalStorage Store
@implements IDisposable

<p>Items: @Cart.Items.Count</p>
<button @onclick="AddItem">Add Item</button>
<button @onclick="ClearCart">Clear</button>

@code {
    protected override void OnInitialized()
        => Cart.OnChange += StateHasChanged;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (!firstRender) return;
        var r = await Store.GetAsync<List<string>>("cart");
        if (r.Success && r.Value != null)
        {
            r.Value.ForEach(i => Cart.Items.Add(i));
            Cart.OnChange?.Invoke();
        }
    }

    private async Task AddItem()
    {
        Cart.Add(\$"Item {Cart.Items.Count + 1}");
        await Store.SetAsync("cart", Cart.Items);
    }

    private async Task ClearCart()
    {
        Cart.Clear();
        await Store.SetAsync("cart", new List<string>());
    }

    public void Dispose() => Cart.OnChange -= StateHasChanged;
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the simplest way to share state between Blazor components?', options: ['Static fields', 'Singleton service', 'Scoped service with an Action event', 'LocalStorage'], answer: 2, explanation: 'A Scoped service with an Action event is the idiomatic Blazor pattern: components inject the service, subscribe to the event, and call StateHasChanged when notified.' },
    { q: 'Why must you access ProtectedLocalStorage in OnAfterRenderAsync?', options: ['It\'s faster there', 'Browser storage requires JS interop, unavailable during pre-rendering', 'It needs the DOM to exist', 'It only works on WASM'], answer: 1, explanation: 'Browser storage APIs go through JS interop which is not available during server-side pre-rendering. OnAfterRenderAsync runs only in the browser, after the first render.' },
    { q: 'What problem does PersistentComponentState solve?', options: ['Sharing state between circuits', 'Persisting state in localStorage', 'Avoiding double data-fetch during SSR hydration', 'Caching API responses'], answer: 2, explanation: 'PersistentComponentState serializes data fetched during SSR pre-rendering and makes it available to the interactive component, preventing a duplicate API call after hydration.' },
    { q: 'How do you call StateHasChanged safely from a Timer callback on Blazor Server?', options: ['Directly', 'Via Task.Run', 'Via InvokeAsync(StateHasChanged)', 'Via Dispatcher.Invoke'], answer: 2, explanation: 'InvokeAsync marshals the call onto the circuit\'s synchronization context, which is required for thread safety on Blazor Server.' },
    { q: 'What registration lifetime should user-specific cart data use on Blazor Server?', options: ['Singleton', 'Scoped', 'Transient', 'Static'], answer: 1, explanation: 'Scoped creates one instance per SignalR circuit, which maps to one user session. Singleton would share cart data across all users.' },
    { q: 'What is the FluxorBlazor pattern and when should you adopt it?', options: ['A CSS styling framework for Blazor', 'A Redux-like unidirectional state management library for Blazor — useful when multiple components share complex mutable state', 'A routing library', 'A server-side caching pattern'], answer: 1, explanation: 'Fluxor brings a Redux-like store to Blazor: Actions are dispatched, Reducers create new state, and Effects handle async work. This pattern helps when shared state becomes complex (many components reading/writing the same data) and you need predictable state transitions and dev-tools time-travel debugging. It\'s overkill for simple apps.' },
  ];

  qna: QnaItem[] = [
    { q: 'A team adopts Fluxor primarily for its "dev-tools time-travel debugging" benefit, but is on Blazor Server. Does that debugging benefit work the same way it would in a client-side SPA?', a: 'Not quite the same — Fluxor\'s Redux DevTools integration works by relaying dispatched actions and state snapshots to the browser\'s Redux DevTools extension, which is straightforward in Blazor WASM since the app runs entirely client-side. On Blazor Server, the actual state and reducer logic execute on the SERVER as part of the circuit, so the DevTools bridge has to relay that information over the existing SignalR connection to the browser extension — functionally similar end-to-end, but it adds a network round-trip to every dispatched action\'s DevTools reporting, and debugging a production issue means you\'re inspecting server-side circuit state remotely rather than purely local browser state, which has different implications for what you can safely expose in the DevTools payload.' },
    { q: 'Does ProtectedLocalStorage work in Blazor WASM?', a: 'No. ProtectedLocalStorage is a server-side package that uses ASP.NET Core Data Protection. In WASM, use IJSRuntime to call localStorage directly or install the community Blazored.LocalStorage package which works in both environments.' },
    { q: 'How do I share state across browser tabs?', a: 'Blazor has no built-in cross-tab mechanism. Options include using the browser\'s StorageEvent to detect localStorage changes via JS interop, or using a server-side SignalR hub as a real-time broadcast channel between circuits.' },
    { q: 'Is CascadingValue a state management solution?', a: 'It handles read access for cross-cutting concerns (theme, locale, current user) efficiently, but it is not a mutation mechanism. Pair it with a service that owns the state — the CascadingValue just makes the service available without prop-drilling.' },
    { q: 'What is the difference between component-local state and app-wide state in Blazor, and when do you need a dedicated state container?',
      a: 'Component-local state (private fields in a component\'s @code block) is sufficient when data only matters to that component and its direct children via parameters — it is automatically cleaned up when the component is disposed. App-wide state (shared user preferences, a shopping cart, authentication info needed across unrelated parts of the app) needs a dedicated state container — typically a Scoped or Singleton service injected wherever needed, often combined with an event/notification mechanism so subscribed components re-render automatically when the shared state changes.' },
    { q: 'Why does a state container service need to raise a change notification event, and what happens if components forget to subscribe/unsubscribe correctly?',
      a: 'Blazor components only re-render in response to their own internal triggers (parameter changes, event handlers, explicit StateHasChanged calls) — a shared service changing its internal state does NOT automatically cause every component using that service to re-render, since the service has no direct knowledge of which components are displaying its data. The state container must expose an event (like OnChange) that components subscribe to in OnInitialized and call StateHasChanged() from, while reliably unsubscribing in Dispose() — forgetting to unsubscribe causes a memory leak (disposed components remain referenced by the service\'s event invocation list) and can cause exceptions when the event fires against a disposed component.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Blazor state management: start with a Scoped service + Action event for reactive shared state, add ProtectedLocalStorage for persistence, and use PersistentComponentState to avoid double-fetch during SSR hydration.',
    mustKnow: [
      'Scoped service + Action event is the idiomatic reactive store pattern.',
      'Always unsubscribe from service events in Dispose() to prevent memory leaks.',
      'Browser storage access is async and must happen in OnAfterRenderAsync.',
      'InvokeAsync(StateHasChanged) is required for thread safety on Blazor Server.',
      'PersistentComponentState prevents duplicate API calls during SSR hydration.',
      'Singleton services are shared across all users — not safe for per-user state.',
    ],
    interviewFocus: [
      'How do you build reactive shared state in Blazor without a third-party library?',
      'Why is InvokeAsync needed when calling StateHasChanged from a timer?',
      'How does PersistentComponentState improve SSR performance?',
    ]
  };
}
