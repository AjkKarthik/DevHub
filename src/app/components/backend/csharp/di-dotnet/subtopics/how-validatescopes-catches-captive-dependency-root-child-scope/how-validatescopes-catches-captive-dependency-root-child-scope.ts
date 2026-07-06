import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-how-validatescopes-catches-captive-dependency-root-child-scope-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-validatescopes-catches-captive-dependency-root-child-scope.html',
  styleUrl: './how-validatescopes-catches-captive-dependency-root-child-scope.scss',
})
export class HowValidatescopesCatchesCaptiveDependencyRootChildScopeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the runtime "catches this in development mode" — this is exactly the mechanism behind that catch',
      points: [
        'The main Dependency Injection page describes the captive dependency problem ("a singleton depends on a scoped service... captured at singleton creation time and lives forever") and says "the runtime catches this in development mode; production fails silently." Understanding WHY the check works — and why it is specifically a DEVELOPMENT-time-only check by default — makes this a concrete mechanism rather than a rule to trust blindly.',
      ],
    },
    {
      heading: 'Every DI container has exactly one ROOT scope, plus however many CHILD scopes it creates per request',
      points: [
        'The <code>IServiceProvider</code> returned by <code>BuildServiceProvider()</code> IS itself a scope — commonly called the ROOT scope. In ASP.NET Core, a NEW CHILD scope is created for each incoming HTTP request (this is literally what "one instance per scope" means for a Scoped service). Singleton services are constructed ONCE, resolved from the ROOT scope, since they must outlive any individual request\'s child scope.',
        'When a singleton\'s CONSTRUCTOR requires a scoped dependency, that scoped service must be resolved AT THE TIME the singleton itself is constructed — which happens in the ROOT scope, NOT in any per-request child scope. The scoped instance created THERE is tracked and disposed by the ROOT scope\'s own lifecycle (i.e., only when the ENTIRE APPLICATION shuts down), rather than being disposed at the end of the (nonexistent, at that point) request scope it was conceptually meant for.',
      ],
    },
    {
      heading: '"ValidateScopes: true" specifically detects resolving a scoped service from the ROOT scope directly',
      points: [
        'With <code>ValidateScopes = true</code> (the default in ASP.NET Core\'s Development environment), the container tracks WHICH scope each resolution happens in, and specifically THROWS if code attempts to resolve a Scoped-lifetime service directly from the ROOT scope (rather than from a proper CHILD scope) — this is EXACTLY the situation a singleton\'s constructor creates when it depends on a scoped service, since singleton construction happens in the root scope by definition.',
        'This is why the check is OFF by default outside Development — enabling it has a real, if small, per-resolution performance cost (tracking scope identity for every resolved service), and the main page\'s own observation that "production fails silently" is precisely because this specific safety check is intentionally disabled there for performance, not because the underlying captive-dependency BUG becomes somehow less real in production — it is exactly as broken, just silently so.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The captive dependency — a singleton\'s constructor resolving a scoped service in the root scope',
      language: 'csharp',
      code: `public class ReportGenerator // registered as SINGLETON
{
    private readonly AppDbContext _db; // scoped, meant to be
                                        // per-request

    public ReportGenerator(AppDbContext db) => _db = db;
    // When THIS singleton is constructed, "db" must be resolved
    // RIGHT NOW — and singleton construction happens in the ROOT
    // scope, since the singleton itself has no per-request scope
    // of its own to be constructed within.
}

var services = new ServiceCollection();
services.AddSingleton<ReportGenerator>();
services.AddScoped<AppDbContext>();

// WITHOUT ValidateScopes — this "succeeds" but is a genuine bug:
using var provider = services.BuildServiceProvider(); // no validation
var generator = provider.GetRequiredService<ReportGenerator>();
// The AppDbContext instance ReportGenerator now holds was resolved
// in the ROOT scope — it will NEVER be disposed until the entire
// application shuts down, and EVERY call through ReportGenerator,
// across EVERY different HTTP request, shares this SAME DbContext
// instance — exactly the captive dependency bug the main page warns about.`,
    },
    {
      label: 'ValidateScopes: true — catching the EXACT same mistake immediately',
      language: 'csharp',
      code: `var services = new ServiceCollection();
services.AddSingleton<ReportGenerator>();
services.AddScoped<AppDbContext>();

// WITH ValidateScopes — the SAME registration mistake is caught
// the moment the singleton is actually resolved:
using var provider = services.BuildServiceProvider(
    new ServiceProviderOptions { ValidateScopes = true });

var generator = provider.GetRequiredService<ReportGenerator>();
// System.InvalidOperationException: Cannot consume scoped service
// 'AppDbContext' from singleton 'ReportGenerator'.
//
// The container detected that resolving ReportGenerator (a singleton,
// happening in the ROOT scope) required resolving AppDbContext (a
// SCOPED service) DIRECTLY IN THAT SAME ROOT SCOPE — precisely the
// "scoped service resolved outside any proper child scope" condition
// ValidateScopes exists to catch.`,
    },
    {
      label: 'The correct fix — inject IServiceScopeFactory, create a child scope where needed',
      language: 'csharp',
      code: `public class ReportGeneratorFixed // still a singleton
{
    private readonly IServiceScopeFactory _scopeFactory;

    public ReportGeneratorFixed(IServiceScopeFactory scopeFactory)
        => _scopeFactory = scopeFactory;
        // IServiceScopeFactory is itself a SINGLETON-safe service —
        // no captive-dependency problem resolving THIS in the root scope

    public async Task GenerateAsync()
    {
        // Explicitly creates a CHILD scope, right here, at the moment
        // it's actually needed — AppDbContext is resolved WITHIN this
        // child scope, not the root scope, and is correctly disposed
        // when the "using" block ends, exactly like a real per-request
        // scope would behave:
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // ... use db here, safely scoped to this one operation ...
    }
}

// This resolves cleanly even WITH ValidateScopes: true — AppDbContext
// is never resolved directly from the root scope at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Explain why <code>ValidateScopes</code> does NOT throw when a SCOPED service depends on ANOTHER scoped service, but DOES throw when a SINGLETON depends on a scoped service — what specifically differs about where each resolution happens.',
    hint: 'Consider WHERE a scoped service itself gets constructed (inside a request\'s own child scope, not the root scope) versus where a singleton gets constructed (the root scope, since it has no per-request scope of its own).',
    solution: `// Scoped service A depending on scoped service B:
public class ServiceA // Scoped
{
    public ServiceA(ServiceB b) { } // B is ALSO scoped
}

// When a REQUEST arrives, ASP.NET Core creates a CHILD SCOPE for that
// request. If ServiceA is resolved WITHIN that child scope (which is
// how scoped services are ALWAYS resolved in normal request
// processing), then ServiceA's constructor resolving ServiceB ALSO
// happens within that SAME child scope — both A and B are being
// constructed in a proper, request-bound child scope, exactly as
// intended. ValidateScopes has nothing to complain about here,
// because no scoped service is ever resolved from the ROOT scope.

// Singleton depending on scoped:
public class ReportGenerator // Singleton
{
    public ReportGenerator(AppDbContext db) { } // db is scoped
}

// A singleton is constructed EXACTLY ONCE, at the point it is FIRST
// resolved — and because singletons must outlive any individual
// request, the DI container resolves them from the ROOT scope (the
// scope tied to the application's overall lifetime), NOT from any
// per-request child scope. This means AppDbContext, a SCOPED service,
// gets resolved DIRECTLY IN THE ROOT SCOPE as a side effect of
// constructing the singleton — precisely the "scoped service resolved
// outside a proper child scope" condition ValidateScopes checks for.
//
// The distinguishing factor is NOT "does this service depend on
// another scoped service" in the abstract — it's specifically WHERE
// the OUTER service (the one doing the depending) itself gets
// resolved. Scoped-depends-on-scoped happens within a child scope by
// construction; singleton-depends-on-scoped happens in the root scope
// by construction, and only THAT specific combination trips the check.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ValidateScopes catches any dependency chain involving a scoped service, regardless of what depends on it.',
      reality: 'it specifically detects a scoped service being resolved directly in the ROOT scope — a scoped service depending on ANOTHER scoped service is fine, since both get resolved within a proper per-request child scope; only a SINGLETON depending on a scoped service forces resolution in the root scope.',
    },
    {
      thought: 'the captive dependency bug only exists when ValidateScopes is disabled — enabling it somehow "fixes" the underlying problem.',
      reality: 'ValidateScopes only DETECTS the bug by throwing an exception — the underlying architectural mistake (a singleton holding a scoped instance forever) is exactly as broken whether or not the check is enabled; disabling the check just makes the bug silent rather than making it not exist.',
    },
    {
      thought: 'the reason ValidateScopes is off by default outside Development is that the captive dependency problem is less likely to occur in production.',
      reality: 'it is disabled for PERFORMANCE reasons — tracking scope identity on every resolution has a real per-call cost — the underlying bug is identically present in production if it exists in the registration code at all, it just fails silently instead of throwing.',
    },
  ];
}
