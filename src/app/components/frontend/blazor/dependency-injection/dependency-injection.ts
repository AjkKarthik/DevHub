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
  selector: 'app-blazor-dependency-injection',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './dependency-injection.html',
  styleUrl: './dependency-injection.scss'
})
export class BlazorDependencyInjection {
  quickRef: QuickRefItem[] = [
    { name: '@inject TService Name', type: 'syntax', desc: 'Injects a service into a .razor component.' },
    { name: '[Inject]', type: 'decorator', desc: 'Property injection in a code-behind class.' },
    { name: 'builder.Services.AddSingleton<T>()', type: 'method', desc: 'One instance for the app lifetime.' },
    { name: 'builder.Services.AddScoped<T>()', type: 'method', desc: 'One instance per circuit (Server) or WASM session.' },
    { name: 'builder.Services.AddTransient<T>()', type: 'method', desc: 'New instance every time it is requested.' },
    { name: 'OwningComponentBase<T>', type: 'class', desc: 'Creates an isolated DI scope for the component.' },
    { name: 'IServiceScopeFactory', type: 'interface', desc: 'Create manual scopes for background work.' },
    { name: 'KeyedService (.NET 8)', type: 'keyword', desc: 'Register multiple implementations under a key.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Service lifetimes in Blazor',
      points: ['Service lifetimes behave differently in Blazor compared to ASP.NET Core MVC. On Blazor Server, a Scoped service lives for the duration of the SignalR circuit — not per HTTP request. On WASM, Scoped lives for the app\'s lifetime (same as Singleton). Singleton services are shared across all users on Server, so they must be thread-safe.',
      'Scoped on Server = circuit lifetime; multiple components share the same instance.', 'Scoped on WASM = app lifetime (same as Singleton).', 'Singleton on Server is shared across all users — must be thread-safe.', 'Transient is safe everywhere but has a higher allocation cost.']
    },
    {
      heading: '@inject in .razor and [Inject] in code-behind',
      points: ['Inside a .razor file, use `@inject IMyService MyService` at the top (after @page). In a code-behind partial class, decorate a public or internal property with `[Inject]` instead. Both approaches resolve from the same DI container. You cannot use constructor injection in .razor components — Blazor does not support it due to the way components are instantiated.',
      '@inject is the .razor-file shorthand for property injection.', '[Inject] is used in code-behind partial classes.', 'Constructor injection is NOT supported in .razor components.', 'Both forms resolve from the component\'s DI scope.']
    },
    {
      heading: 'OwningComponentBase and scoped services',
      points: ['If a component needs an isolated scope (e.g., to use a DbContext that should not be shared with other components in the same circuit), inherit from `OwningComponentBase<TService>`. This creates a child DI scope that is disposed when the component is disposed. For manual scope management in a Singleton service, inject `IServiceScopeFactory`.',
      'OwningComponentBase<T> creates a component-scoped DI container.', 'The owned scope is disposed automatically when the component unmounts.', 'Use this pattern for EF Core DbContext in Blazor Server.', 'IServiceScopeFactory creates manual scopes in Singleton services or background tasks.']
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Register & inject',
      language: 'csharp',
      code: `// Program.cs
builder.Services.AddScoped<IWeatherService, WeatherService>();
builder.Services.AddSingleton<AppState>();
builder.Services.AddTransient<IEmailSender, SmtpEmailSender>();

// WeatherPage.razor
@inject IWeatherService Weather
@inject AppState State

<p>@forecast?.Summary</p>
<p>Theme: @State.Theme</p>

@code {
    private WeatherForecast? forecast;
    protected override async Task OnInitializedAsync()
        => forecast = await Weather.GetTodayAsync();
}`
    },
    {
      label: 'Code-behind injection',
      language: 'csharp',
      code: `// Dashboard.razor.cs
public partial class Dashboard : ComponentBase
{
    [Inject] private IDashboardService DashSvc { get; set; } = null!;
    [Inject] private ILogger<Dashboard> Logger { get; set; } = null!;

    private DashboardData? data;

    protected override async Task OnInitializedAsync()
    {
        Logger.LogInformation("Dashboard loading");
        data = await DashSvc.GetDataAsync();
    }
}`
    },
    {
      label: 'OwningComponentBase (DbContext)',
      language: 'csharp',
      code: `// Give each component instance its own DbContext scope
@inherits OwningComponentBase<AppDbContext>

@code {
    private List<Product> products = [];

    protected override async Task OnInitializedAsync()
    {
        // Service is the scoped AppDbContext for this component
        products = await Service.Products.ToListAsync();
    }
    // Scope and DbContext are disposed when component unmounts
}`
    },
    {
      label: 'Keyed services (.NET 8)',
      language: 'csharp',
      code: `// Register two implementations under different keys
builder.Services.AddKeyedScoped<IPaymentGateway, StripeGateway>("stripe");
builder.Services.AddKeyedScoped<IPaymentGateway, PayPalGateway>("paypal");

// Inject the specific implementation
@inject [FromKeyedServices("stripe")] IPaymentGateway StripeGateway
@inject [FromKeyedServices("paypal")] IPaymentGateway PayPalGateway`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using constructor injection in .razor components',
      wrong: 'public MyComponent(IMyService svc) { this.svc = svc; }',
      right: '@inject IMyService Svc  // or [Inject] in code-behind',
      explanation: 'Blazor components are instantiated by the renderer, not by DI. Constructor injection is not supported; use @inject or [Inject].'
    },
    {
      title: 'Injecting a Scoped service into a Singleton',
      wrong: 'builder.Services.AddSingleton<AppState>();\n// AppState constructor takes IUserService (Scoped)',
      right: '// Inject IServiceScopeFactory into Singleton and create a scope when needed',
      explanation: 'A Singleton cannot depend on a Scoped service — the Scoped service is disposed before the Singleton, causing a captive dependency bug.'
    },
    {
      title: 'Sharing a DbContext across components on Blazor Server',
      wrong: 'builder.Services.AddDbContext<AppDbContext>();  // Scoped = shared per circuit',
      right: '// Use OwningComponentBase<AppDbContext> per component\n// or AddDbContextFactory<AppDbContext>() + inject IDbContextFactory<AppDbContext>',
      explanation: 'EF Core DbContext is not thread-safe. On Blazor Server, multiple components in the same circuit share a Scoped service — use per-component scoping.'
    },
    {
      title: 'Not disposing services that implement IDisposable',
      wrong: '// Registering a transient that holds an HttpClient without disposal',
      right: 'public void Dispose() { httpClient.Dispose(); }',
      explanation: 'Transient services are not auto-disposed by the container. If the service implements IDisposable, the consuming component must dispose it or use OwningComponentBase.'
    },
    {
      title: 'Using Singleton for user-specific state on Blazor Server',
      wrong: 'builder.Services.AddSingleton<UserPreferences>();  // shared across ALL users!',
      right: 'builder.Services.AddScoped<UserPreferences>();  // one per circuit',
      explanation: 'Singleton means one shared instance across all users on the same server. User-specific state must be Scoped so each circuit gets its own instance.'
    },
  ];

  challenge: Challenge = {
    title: 'Theme Service with Scoped DI',
    language: 'csharp',
    description: 'Create a `ThemeService` with a `Theme` property ("light" or "dark") and a `Toggle()` method. Register it as Scoped. Inject it into two components on the same page — a `ThemeToggle` button and a `ThemeDisplay` panel. When the button is clicked, both components should reflect the change. (Hint: use a service-level event to notify other components.)',
    hints: [
      'Add an `Action? OnChange` event to ThemeService and call it in Toggle().',
      'Subscribe in OnInitialized and call StateHasChanged when the event fires.',
      'Unsubscribe in Dispose() to avoid memory leaks.',
    ],
    starterCode: `public class ThemeService
{
    public string Theme { get; private set; } = "light";
    public event Action? OnChange;
    public void Toggle()
    {
        Theme = Theme == "light" ? "dark" : "light";
        OnChange?.Invoke();
    }
}`,
    solution: `// Program.cs
builder.Services.AddScoped<ThemeService>();

// ThemeToggle.razor
@inject ThemeService Themes
@implements IDisposable
<button @onclick="Themes.Toggle">Toggle Theme</button>
@code {
    protected override void OnInitialized()
        => Themes.OnChange += Update;
    private void Update() => StateHasChanged();
    public void Dispose() => Themes.OnChange -= Update;
}

// ThemeDisplay.razor
@inject ThemeService Themes
@implements IDisposable
<p>Current theme: @Themes.Theme</p>
@code {
    protected override void OnInitialized()
        => Themes.OnChange += Update;
    private void Update() => StateHasChanged();
    public void Dispose() => Themes.OnChange -= Update;
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the lifetime of a Scoped service in Blazor Server?', options: ['Per HTTP request', 'Per SignalR circuit', 'Application lifetime', 'Per component'], answer: 1, explanation: 'In Blazor Server, a Scoped service lives for the circuit (connection) lifetime, not per request. Multiple components on the same circuit share it.' },
    { q: 'Why is constructor injection unsupported in .razor components?', options: ['Performance reasons', 'Blazor uses property injection only', 'Components are not instantiated by DI', 'It was removed in .NET 6'], answer: 2, explanation: 'Blazor instantiates components through its own renderer, not through the DI container. Properties decorated with @inject or [Inject] are set after construction.' },
    { q: 'Which class gives a component its own isolated DI scope?', options: ['ComponentBase', 'OwningComponentBase<T>', 'ScopedComponent<T>', 'IsolatedComponent'], answer: 1, explanation: 'OwningComponentBase<T> creates a child DI scope exclusive to the component instance. The scope (and all services in it) is disposed when the component unmounts.' },
    { q: 'What is a captive dependency?', options: ['A service that captures UI state', 'A Singleton holding a reference to a Scoped service', 'A circular dependency between services', 'A disposed service still in use'], answer: 1, explanation: 'A captive dependency is when a long-lived service (Singleton) captures a shorter-lived service (Scoped). The Scoped service outlives its intended scope.' },
    { q: 'How should you use EF Core DbContext in Blazor Server?', options: ['Register as Singleton', 'Register as Transient', 'Use OwningComponentBase or IDbContextFactory', 'Inject normally as Scoped'], answer: 2, explanation: 'DbContext is not thread-safe. Sharing it across components in a circuit (Scoped default) is dangerous. Use OwningComponentBase for per-component scope or IDbContextFactory to create short-lived contexts.' },
    { q: 'What is the difference between AddScoped and AddTransient service lifetimes in Blazor Server?', options: ['They are identical in Blazor', 'Scoped = one per circuit/connection; Transient = one per @inject or injection request', 'Transient = one per circuit; Scoped = one per request', 'AddScoped is only for controllers'], answer: 1, explanation: 'In Blazor Server, Scoped maps to the SignalR circuit lifetime (one instance per user connection, shared across components in that circuit). Transient creates a new instance for every @inject. Transient services that hold resources (like DbContext) can accumulate and leak if not disposed.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can I inject services into code-behind partial classes?', a: 'Yes. Use `[Inject]` on a public or internal property (not a private field — the property needs to be settable). The Blazor renderer sets these after construction, just like @inject in .razor files.' },
    { q: 'Is there a difference between Scoped and Singleton on Blazor WebAssembly?', a: 'In practice, no. WASM runs in the browser with a single-user, single-app context. There is no concept of a per-request or per-circuit scope, so Scoped and Singleton behave identically — one instance for the app lifetime.' },
    { q: 'When should I use IServiceScopeFactory?', a: 'Use it in Singleton services or background tasks (IHostedService, BackgroundService) that need to resolve Scoped services. Create a scope, resolve what you need, and dispose the scope immediately afterward.' },
    { q: 'How do I share state between all components on the same page?', a: 'Register a Scoped service as your state bag and inject it into all components. For reactive updates, add an event (Action or EventHandler) that components subscribe to, and call StateHasChanged in the handler.' },
    { q: 'Why does service lifetime (Singleton, Scoped, Transient) matter differently in Blazor Server versus Blazor WASM?',
      a: 'In Blazor Server, a Scoped service lives for the duration of a single user\'s SignalR circuit (effectively their entire session), and a Singleton is shared across ALL connected users on the server — meaning Singleton state is genuinely global and shared, which is a critical, easy-to-miss distinction from typical ASP.NET Core request-scoped behavior. In Blazor WASM, there is only one user per browser tab (no server-side multi-user concern), so Scoped and Singleton behave nearly identically — both live for the duration of the WASM app\'s lifetime in that tab.' },
    { q: 'How do you inject a service into a Blazor component, and what is the difference between @inject and constructor injection?',
      a: '@inject ServiceType ServiceName at the top of a .razor file is the idiomatic Blazor way — it generates a property with the [Inject] attribute behind the scenes, resolved automatically by the DI container when the component is created. Constructor injection (common in plain C# classes) is not directly usable in .razor files since components do not have an accessible constructor for this purpose in the typical authoring model — for code-behind (.razor.cs) partial classes, you still use the [Inject] property attribute rather than a constructor parameter.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Blazor DI uses the same @inject / [Inject] pattern as ASP.NET Core but lifetime semantics differ — Scoped means per-circuit on Server, and Singleton is shared across all users.',
    mustKnow: [
      'Scoped on Blazor Server = circuit lifetime (not per request).',
      'Singleton on Server is shared across all users — must be thread-safe.',
      'Use @inject in .razor files; [Inject] in code-behind classes.',
      'Constructor injection is NOT supported in .razor components.',
      'OwningComponentBase<T> gives a component its own isolated DI scope.',
      'Never inject a Scoped service into a Singleton (captive dependency).',
    ],
    interviewFocus: [
      'How do service lifetimes behave differently in Blazor Server vs WASM?',
      'What is a captive dependency and how do you avoid it?',
      'When would you use OwningComponentBase instead of a regular Scoped service?',
    ]
  };
}
