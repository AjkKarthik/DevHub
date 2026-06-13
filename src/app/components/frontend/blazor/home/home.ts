import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string; description: string; route: string; badge: string; available: boolean; keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'Components': 'components', 'Data & Forms': 'forms',
  'Routing': 'routing', 'State & Services': 'state', 'Advanced': 'advanced', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'Components', 'Data & Forms', 'Routing', 'State & Services', 'Advanced', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'Blazor Fundamentals',        route: '/blazor', badge: 'Foundations', available: false,
    description: 'What is Blazor, WebAssembly vs Server vs Hybrid, the Razor component model, and when to choose Blazor.',
    keyPoints: ['Blazor Server: C# runs on server via SignalR; Blazor WASM: runs in browser via .NET WASM runtime', 'Blazor Hybrid: MAUI + WebView for native apps with Razor components', 'Interactive render modes: Static, Server, WebAssembly, Auto'] },
  { title: 'Blazor Render Modes',        route: '/blazor', badge: 'Foundations', available: false,
    description: 'Blazor 8 render modes — Static SSR, Interactive Server, Interactive WebAssembly, and Auto.',
    keyPoints: ['@rendermode InteractiveServer: stateful connection via SignalR', '@rendermode InteractiveWebAssembly: full .NET in browser, larger download', 'Auto: starts as Server, transitions to WASM after download completes'] },
  { title: 'Razor Components',           route: '/blazor', badge: 'Components', available: false,
    description: 'Component anatomy, parameters, event callbacks, RenderFragment, and the component lifecycle.',
    keyPoints: ['[Parameter] public string Title { get; set; } — declares a component parameter', 'RenderFragment: delegate for composable content (like React children)', 'Lifecycle: OnInitializedAsync, OnParametersSetAsync, StateHasChanged()'] },
  { title: 'Component Communication',    route: '/blazor', badge: 'Components', available: false,
    description: 'Parent-child via Parameters and EventCallback, cascading values, and component references.',
    keyPoints: ['EventCallback<T>: type-safe event from child to parent; invokes StateHasChanged automatically', 'CascadingValue / [CascadingParameter]: pass values down the component tree', 'ComponentRef via @ref: call methods on child components directly'] },
  { title: 'Blazor Forms',               route: '/blazor', badge: 'Data & Forms', available: false,
    description: 'EditForm, DataAnnotations validation, FluentValidation, and handling form submission.',
    keyPoints: ['EditForm + EditContext: tracks validity state of all bound fields', 'DataAnnotationsValidator + ValidationSummary / ValidationMessage', 'OnValidSubmit: runs only when EditContext reports no validation errors'] },
  { title: 'Data Binding',               route: '/blazor', badge: 'Data & Forms', available: false,
    description: '@bind, @bind:event, two-way binding, and the difference between @bind and event+value pattern.',
    keyPoints: ['@bind="Name" expands to value="@Name" @onchange="e => Name = e.Value"', '@bind:event="oninput" binds on keystroke, not focus-out', 'Bind to child parameter: <Counter @bind-Value="count" />'] },
  { title: 'Blazor Routing',             route: '/blazor', badge: 'Routing', available: false,
    description: '@page directive, route parameters, constraints, NavigationManager, and programmatic navigation.',
    keyPoints: ['@page "/product/{id:int}" — route with typed constraint', 'NavigationManager.NavigateTo("/path", forceLoad: false)', 'NavLink component: adds active CSS class when URL matches href'] },
  { title: 'Dependency Injection',       route: '/blazor', badge: 'State & Services', available: false,
    description: 'Services in Blazor — scoped vs singleton lifetime, @inject, InjectAttribute, and service lifetimes per hosting model.',
    keyPoints: ['Scoped in Blazor Server: per SignalR circuit; in WASM: per page load', '@inject IMyService MyService — field-level DI in Razor components', 'Singleton in WASM is safe; in Server it\'s shared across all circuits — be careful with state'] },
  { title: 'State Management',           route: '/blazor', badge: 'State & Services', available: false,
    description: 'In-component state, scoped services, cascading values, and third-party state libraries (Fluxor).',
    keyPoints: ['Simple: private fields + StateHasChanged()', 'Cross-component: scoped service with events or CascadingValue', 'Fluxor: Redux-inspired, with [FeatureState], [ReducerMethod], [EffectMethod]'] },
  { title: 'JavaScript Interop',         route: '/blazor', badge: 'Advanced', available: false,
    description: 'Calling JavaScript from C# with IJSRuntime and calling .NET from JavaScript with DotNetObjectReference.',
    keyPoints: ['await JSRuntime.InvokeAsync<string>("myFunction", arg1)', 'DotNetObjectReference.Create(this) passes .NET object to JS', 'IJSObjectReference: import a JS module and call its exports from C#'] },
  { title: 'Blazor Server SignalR',      route: '/blazor', badge: 'Advanced', available: false,
    description: 'How Blazor Server uses SignalR, circuit lifecycle, scalability considerations, and sticky sessions.',
    keyPoints: ['Each connected client has one SignalR circuit with server-side state', 'Sticky sessions required when scaling to multiple servers', 'Circuit disconnection: ICircuitHandler to clean up resources on disconnect'] },
  { title: 'MAUI Blazor Hybrid',         route: '/blazor', badge: 'Advanced', available: false,
    description: 'Building native desktop and mobile apps using Razor components inside .NET MAUI WebView.',
    keyPoints: ['BlazorWebView control embeds Blazor in native MAUI app', 'Access device APIs via .NET MAUI services injected into Blazor', 'Share components between web Blazor and MAUI Blazor targets'] },
  { title: 'Authentication in Blazor',   route: '/blazor', badge: 'Advanced', available: false,
    description: 'AuthenticationStateProvider, CascadingAuthenticationState, [Authorize], and cookie auth in .NET 8.',
    keyPoints: ['AuthorizeView component: <Authorized> and <NotAuthorized> template slots', '[Authorize] attribute on @page — redirects unauthenticated users', 'PersistingReauthenticationStateProvider: maintains auth state across render mode transitions'] },
  { title: 'Blazor Cheat Sheet',         route: '/blazor', badge: 'Reference', available: false,
    description: 'Quick reference for component lifecycle, event callbacks, routing, forms, and JS interop.',
    keyPoints: ['Lifecycle: OnInitialized → OnParametersSet → OnAfterRender', 'Directive quick reference: @page, @inject, @bind, @ref, @code', 'Common patterns: two-way bind, EventCallback, cascading auth state'] },
  { title: 'Blazor Interview Prep',      route: '/blazor', badge: 'Reference', available: false,
    description: '30+ Blazor interview questions — render modes, component lifecycle, DI, JS interop, and scalability.',
    keyPoints: ['Compare Blazor Server vs WASM vs Hybrid — when to use each', 'How does the Blazor rendering lifecycle work?', 'What are the scalability limitations of Blazor Server?'] },
];

@Component({
  selector: 'app-blazor-home',
  standalone: true, imports: [RouterLink],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class BlazorHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
