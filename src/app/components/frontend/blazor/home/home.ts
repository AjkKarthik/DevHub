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
  { title: 'Blazor Fundamentals',        route: '/blazor/fundamentals', badge: 'Foundations', available: true,
    description: 'What is Blazor, WebAssembly vs Server vs Hybrid, the Razor component model, and when to choose Blazor.',
    keyPoints: ['Blazor Server: C# runs on server via SignalR; Blazor WASM: runs in browser via .NET WASM runtime', 'Blazor Hybrid: MAUI + WebView for native apps with Razor components', 'Interactive render modes: Static, Server, WebAssembly, Auto'] },
  { title: 'Blazor Render Modes',        route: '/blazor/render-modes', badge: 'Foundations', available: true,
    description: 'Blazor 8 render modes — Static SSR, Interactive Server, Interactive WebAssembly, and Auto.',
    keyPoints: ['@rendermode InteractiveServer: stateful connection via SignalR', '@rendermode InteractiveWebAssembly: full .NET in browser, larger download', 'Auto: starts as Server, transitions to WASM after download completes'] },
  { title: 'Razor Components',           route: '/blazor/razor-components', badge: 'Components', available: true,
    description: 'Component anatomy, parameters, event callbacks, RenderFragment, and the component lifecycle.',
    keyPoints: ['[Parameter] public string Title { get; set; } — declares a component parameter', 'RenderFragment: delegate for composable content (like React children)', 'Lifecycle: OnInitializedAsync, OnParametersSetAsync, StateHasChanged()'] },
  { title: 'Component Communication',    route: '/blazor/component-communication', badge: 'Components', available: true,
    description: 'Parent-child via Parameters and EventCallback, cascading values, and component references.',
    keyPoints: ['EventCallback<T>: type-safe event from child to parent; invokes StateHasChanged automatically', 'CascadingValue / [CascadingParameter]: pass values down the component tree', 'ComponentRef via @ref: call methods on child components directly'] },
  { title: 'Blazor Forms',               route: '/blazor/forms', badge: 'Data & Forms', available: true,
    description: 'EditForm, DataAnnotations validation, FluentValidation, and handling form submission.',
    keyPoints: ['EditForm + EditContext: tracks validity state of all bound fields', 'DataAnnotationsValidator + ValidationSummary / ValidationMessage', 'OnValidSubmit: runs only when EditContext reports no validation errors'] },
  { title: 'Data Binding',               route: '/blazor/data-binding', badge: 'Data & Forms', available: true,
    description: '@bind, @bind:event, two-way binding, and the difference between @bind and event+value pattern.',
    keyPoints: ['@bind="Name" expands to value="@Name" @onchange="e => Name = e.Value"', '@bind:event="oninput" binds on keystroke, not focus-out', 'Bind to child parameter: <Counter @bind-Value="count" />'] },
  { title: 'Blazor Routing',             route: '/blazor/routing', badge: 'Routing', available: true,
    description: '@page directive, route parameters, constraints, NavigationManager, and programmatic navigation.',
    keyPoints: ['@page "/product/{id:int}" — route with typed constraint', 'NavigationManager.NavigateTo("/path", forceLoad: false)', 'NavLink component: adds active CSS class when URL matches href'] },
  { title: 'Dependency Injection',       route: '/blazor/dependency-injection', badge: 'State & Services', available: true,
    description: 'Services in Blazor — scoped vs singleton lifetime, @inject, InjectAttribute, and service lifetimes per hosting model.',
    keyPoints: ['Scoped in Blazor Server: per SignalR circuit; in WASM: per page load', '@inject IMyService MyService — field-level DI in Razor components', 'Singleton in WASM is safe; in Server it\'s shared across all circuits — be careful with state'] },
  { title: 'State Management',           route: '/blazor/state-management', badge: 'State & Services', available: true,
    description: 'In-component state, scoped services, cascading values, and third-party state libraries (Fluxor).',
    keyPoints: ['Simple: private fields + StateHasChanged()', 'Cross-component: scoped service with events or CascadingValue', 'Fluxor: Redux-inspired, with [FeatureState], [ReducerMethod], [EffectMethod]'] },
  { title: 'JavaScript Interop',         route: '/blazor/js-interop', badge: 'Advanced', available: true,
    description: 'Calling JavaScript from C# with IJSRuntime and calling .NET from JavaScript with DotNetObjectReference.',
    keyPoints: ['await JSRuntime.InvokeAsync<string>("myFunction", arg1)', 'DotNetObjectReference.Create(this) passes .NET object to JS', 'IJSObjectReference: import a JS module and call its exports from C#'] },
  { title: 'Blazor Server SignalR',      route: '/blazor/server-signalr', badge: 'Advanced', available: true,
    description: 'How Blazor Server uses SignalR, circuit lifecycle, scalability considerations, and sticky sessions.',
    keyPoints: ['Each connected client has one SignalR circuit with server-side state', 'Sticky sessions required when scaling to multiple servers', 'Circuit disconnection: ICircuitHandler to clean up resources on disconnect'] },
  { title: 'MAUI Blazor Hybrid',         route: '/blazor/maui-hybrid', badge: 'Advanced', available: true,
    description: 'Building native desktop and mobile apps using Razor components inside .NET MAUI WebView.',
    keyPoints: ['BlazorWebView control embeds Blazor in native MAUI app', 'Access device APIs via .NET MAUI services injected into Blazor', 'Share components between web Blazor and MAUI Blazor targets'] },
  { title: 'Authentication in Blazor',   route: '/blazor/authentication', badge: 'Advanced', available: true,
    description: 'AuthenticationStateProvider, CascadingAuthenticationState, [Authorize], and cookie auth in .NET 8.',
    keyPoints: ['AuthorizeView component: <Authorized> and <NotAuthorized> template slots', '[Authorize] attribute on @page — redirects unauthenticated users', 'PersistingReauthenticationStateProvider: maintains auth state across render mode transitions'] },
  { title: 'Error Handling & ErrorBoundary', route: '/blazor/error-handling', badge: 'Advanced', available: true,
    description: 'ErrorBoundary component, OnError callback, and recovering from component-level failures.',
    keyPoints: ['<ErrorBoundary> wraps fallible components', 'OnError callback for logging', 'Recover() to retry after failure', 'Custom error UI in ChildContent', 'Global unhandled exception handling'] },
  { title: 'Streaming Rendering',           route: '/blazor/streaming-rendering', badge: 'Foundations', available: true,
    description: 'Blazor 8 streaming SSR — stream HTML to the browser incrementally as async data loads.',
    keyPoints: ['@attribute [StreamRendering] enables progressive rendering', 'HTML streamed before async data resolves', 'Reduces perceived time-to-first-byte', 'Loading placeholder until data arrives', 'Works with Static SSR and Interactive modes'] },
  { title: 'Sections & Layouts',            route: '/blazor/sections-layouts', badge: 'Components', available: true,
    description: 'MainLayout, nested layouts, and SectionOutlet/SectionContent for flexible page slots.',
    keyPoints: ['<SectionOutlet Name="..."> defines a slot in layout', '<SectionContent SectionName="..."> fills slot from page', 'Multiple named slots per layout', 'LayoutAttribute on @page component', 'Nested layouts via MainLayout chain'] },
  { title: 'SEO & Head Metadata',           route: '/blazor/seo-metadata', badge: 'Foundations', available: true,
    description: 'PageTitle, HeadContent, and HeadOutlet for SEO-friendly titles, meta tags, and Open Graph.',
    keyPoints: ['<PageTitle> sets browser tab title', '<HeadContent> injects into <head>', 'Open Graph meta tags for social sharing', 'Prerendering required for crawler visibility', 'HeadOutlet placement in App.razor'] },
  { title: 'Component Virtualization',      route: '/blazor/virtualization', badge: 'Components', available: true,
    description: 'Virtualize<T> — render only visible rows for large lists without DOM overhead.',
    keyPoints: ['<Virtualize Items="@items" Context="item"> template', 'ItemsProvider for server-side paging', 'OverscanCount buffer for smooth scrolling', 'Placeholder template while loading', 'ItemSize for fixed-height row optimization'] },
  { title: 'Testing with bUnit',            route: '/blazor/bunit', badge: 'Reference', available: true,
    description: 'Unit-test Blazor components in isolation using bUnit with xUnit or NUnit.',
    keyPoints: ['TestContext renders components without browser', 'RenderComponent<T>() returns IRenderedComponent', 'Find() and markup assertion methods', 'InvokeAsync for event triggering', 'Mock services via ctx.Services.AddSingleton'] },
  { title: 'Progressive Enhancement',       route: '/blazor/progressive-enhancement', badge: 'Foundations', available: true,
    description: 'Blazor SSR forms with Enhance — server-rendered interactivity without full SPA overhead.',
    keyPoints: ['<form method="post" @formname> enhanced posting', '<EditForm Enhance="true"> for server validation', 'POST/Redirect/GET prevents double-submit', 'Graceful fallback without JS/WASM', 'Combine with streaming for instant feedback'] },
  { title: 'Blazor Performance',            route: '/blazor/performance', badge: 'Advanced', available: true,
    description: 'Lazy-load WASM assemblies, skip redundant re-renders, and optimise Blazor app startup.',
    keyPoints: ['Lazy load assemblies with Router + OnNavigateAsync', 'ShouldRender() override prevents unnecessary diffs', 'ParameterView.DidParameterChange() for fine control', 'Avoid cascading values in tight render loops', 'Ahead-of-time (AOT) compilation for faster WASM'] },
  { title: 'Blazor Cheat Sheet',         route: '/blazor/cheatsheet', badge: 'Reference', available: true,
    description: 'Quick reference for component lifecycle, event callbacks, routing, forms, and JS interop.',
    keyPoints: ['Lifecycle: OnInitialized → OnParametersSet → OnAfterRender', 'Directive quick reference: @page, @inject, @bind, @ref, @code', 'Common patterns: two-way bind, EventCallback, cascading auth state'] },
  { title: 'Blazor Interview Prep',      route: '/blazor/interview-prep', badge: 'Reference', available: true,
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
