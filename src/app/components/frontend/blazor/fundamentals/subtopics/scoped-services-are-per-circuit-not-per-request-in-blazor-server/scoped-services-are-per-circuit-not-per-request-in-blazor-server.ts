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
  templateUrl: './scoped-services-are-per-circuit-not-per-request-in-blazor-server.html',
  styleUrl: './scoped-services-are-per-circuit-not-per-request-in-blazor-server.scss'
})
export class ScopedServicesArePerCircuitNotPerRequestInBlazorServerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Why "Scoped = per circuit" is a genuinely different rule than the ASP.NET Core MVC/API meaning of Scoped',
      points: [
        'In a traditional ASP.NET Core MVC or Web API app, Scoped means "one instance per HTTP request" — the DI container creates a new scope for every incoming request and disposes it when the response finishes.',
        'Blazor Server does NOT have a request/response cycle for most of its lifetime — after the initial page load, a user\'s entire session is a long-lived SignalR "circuit" that stays open for as long as the browser tab is connected. Blazor Server maps the DI scope to this CIRCUIT, not to individual SignalR messages.',
        'The practical consequence: a Scoped service in Blazor Server is created ONCE when the circuit starts, and the SAME instance is reused for every component render, every event handler invocation, and every SignalR message exchanged for that user\'s entire session — not recreated per interaction.',
      ]
    },
    {
      heading: 'Walking through what actually happens with each DI lifetime in Blazor Server',
      points: [
        '<code>AddSingleton&lt;T&gt;()</code>: ONE instance for the entire server process, shared across every connected user\'s circuit. Storing per-user data here leaks it across users — the main page\'s mistake entry example (a shopping cart in a singleton) would show User B\'s cart to User A.',
        '<code>AddScoped&lt;T&gt;()</code>: ONE instance per circuit — effectively "per browser tab session." All components rendered within that same circuit share the same instance, which is exactly the behavior needed for things like "current logged-in user" or "in-memory shopping cart for this session."',
        '<code>AddTransient&lt;T&gt;()</code>: a NEW instance every time it is requested from the DI container — including multiple times within the same component render if injected in more than one place. Rarely what you want for stateful services; appropriate for genuinely stateless helpers.',
        'A common, subtle bug: injecting a Scoped service into a component and assuming it behaves like Angular\'s per-component-tree DI scoping — it does not. Every component in the SAME circuit (i.e. the same browser tab) shares the identical Scoped instance, so mutating it in one component is visible to every other component in that same circuit immediately, without any explicit state-passing.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The Singleton data-leak bug',
      language: 'csharp',
      code: `// Program.cs — WRONG: Singleton shares state across ALL connected users
builder.Services.AddSingleton<ShoppingCartService>();

public class ShoppingCartService
{
    private readonly List<CartItem> items = new();
    public void Add(CartItem item) => items.Add(item);
    public IReadOnlyList<CartItem> Items => items;
}

// User A adds an item to their cart.
// User B, on a completely different browser/session, opens the cart page
// and sees User A's item — because BOTH users' circuits share the
// exact same ShoppingCartService instance, process-wide.`,
    },
    {
      label: 'The correct Scoped fix',
      language: 'csharp',
      code: `// Program.cs — CORRECT: Scoped = one instance per circuit (per user session)
builder.Services.AddScoped<ShoppingCartService>();

// Same ShoppingCartService class as before — no code change needed inside it.
// The DI LIFETIME is what changes the behavior:
//
// - User A's circuit gets its OWN ShoppingCartService instance.
// - User B's circuit gets a COMPLETELY SEPARATE instance.
// - Within User A's own circuit, every component that injects
//   ShoppingCartService (header cart icon, cart page, checkout page)
//   shares the SAME instance — so adding an item in one component
//   is immediately visible in the others, with no explicit
//   state-passing between components required.`,
    },
    {
      label: 'Transient vs Scoped — a subtle double-instance trap',
      language: 'csharp',
      code: `// Program.cs
builder.Services.AddTransient<IIdGenerator, IdGenerator>();

@* SomeComponent.razor — injecting the SAME transient service twice *@
@inject IIdGenerator IdGen1
@inject IIdGenerator IdGen2

@code {
    protected override void OnInitialized()
    {
        // IdGen1 and IdGen2 are TWO DIFFERENT instances, even though
        // they're injected from the same component and the same
        // service type — Transient creates a new instance on EVERY
        // resolution, including multiple @inject directives in one file.
        Console.WriteLine(ReferenceEquals(IdGen1, IdGen2)); // false

        // Compare: if IIdGenerator were registered AddScoped instead,
        // IdGen1 and IdGen2 WOULD be the same instance — both
        // resolved from within the same circuit's single DI scope.
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A Blazor Server app registers builder.Services.AddScoped&lt;AuditLogBuffer&gt;() to batch up audit log entries in memory and flush them periodically. A developer notices that TWO different users, browsing at the same time in two separate browser tabs (different circuits), each see only their OWN audit entries in the buffer — never each other\'s. Is this the expected, correct behavior for a Scoped service, or a bug?',
    hint: 'Think about what "Scoped" maps to specifically in Blazor Server — per circuit, or per server process?',
    solution: 'This is the expected, correct behavior — not a bug. Since AuditLogBuffer is registered as Scoped, and Scoped in Blazor Server means "one instance per circuit" (per browser tab\'s SignalR connection), each of the two users\' browser tabs gets its own completely separate circuit, and therefore its own separate AuditLogBuffer instance. Neither user\'s buffered entries are visible to the other — which is exactly the isolation Scoped is meant to provide, contrasted with Singleton (one shared instance for the whole server, which WOULD show both users\' entries in the same buffer) and Transient (a new instance on every injection, which would fragment even a single user\'s own entries across multiple disconnected buffer instances). If the actual REQUIREMENT was a single shared audit buffer across all users (e.g. for a centralized flush-to-database job), Singleton would be the correct lifetime instead — the developer needs to first decide the intended sharing scope, then pick the DI lifetime that matches it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Scoped in Blazor Server means the same thing as Scoped in a regular ASP.NET Core Web API — one instance per HTTP request.',
      reality: 'Blazor Server does not have an HTTP request/response cycle for most of its operation — after the initial page load, the app runs as a long-lived SignalR circuit. Scoped in Blazor Server means one instance per CIRCUIT (effectively, per connected browser tab session), reused across every render and event for that entire session, not recreated per message.'
    },
    {
      thought: 'Because Blazor components have a similar mental model to Angular components, Scoped services in Blazor Server behave like Angular\'s component-tree-scoped providers — each component subtree potentially getting its own instance.',
      reality: 'Blazor Server\'s Scoped lifetime has nothing to do with the component tree — every component rendered within the SAME circuit (the same browser tab\'s session) shares the identical Scoped instance, regardless of how deeply nested or unrelated those components are in the render tree.'
    },
    {
      thought: 'Injecting the same Transient-registered service type multiple times within one component (via multiple @inject directives, or via constructor injection in a class the component uses) always yields the same instance, since it\'s "the same component."',
      reality: 'Transient services get a brand-new instance on EVERY resolution from the DI container, confirmed by the reference-equality check in this subtopic\'s code example — even two @inject directives for the identical service type in the same .razor file produce two distinct instances, unlike Scoped (same instance across the whole circuit) or Singleton (same instance across the whole server).'
    }
  ];
}
