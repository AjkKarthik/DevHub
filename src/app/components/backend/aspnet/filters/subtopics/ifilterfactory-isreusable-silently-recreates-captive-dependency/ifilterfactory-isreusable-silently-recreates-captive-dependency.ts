import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-ifilterfactory-isreusable-captive-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './ifilterfactory-isreusable-silently-recreates-captive-dependency.html',
  styleUrl: './ifilterfactory-isreusable-silently-recreates-captive-dependency.scss',
})
export class IfilterfactoryIsreusableSilentlyRecreatesCaptiveDependencySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own TenantAuditFilterFactory correctly sets IsReusable => false — but never explains what IsReusable actually controls, or what breaks if it were set to true instead',
      points: [
        'The main Filters page\'s <code>IFilterFactory</code> example implements <code>TenantAuditFilterFactory</code> with <code>public bool IsReusable => false; // new instance per request</code> and a comment explaining the reasoning briefly. What the page does not explain: <code>IsReusable</code> is a hint to the MVC framework\'s <strong>filter caching layer</strong> — when <code>true</code>, the framework may CACHE the single filter instance returned by <code>CreateInstance()</code> and REUSE that SAME instance across MULTIPLE requests, skipping the factory\'s <code>CreateInstance()</code> call entirely on subsequent requests where the same filter is needed.',
      ],
    },
    {
      heading: 'Setting IsReusable => true on a factory whose CreateInstance() resolves Scoped services recreates the EXACT same captive-dependency bug the main page\'s own DI topic warns about — just via IFilterFactory instead of ordinary constructor injection',
      points: [
        'The main page\'s own <code>TenantAuditFilterFactory.CreateInstance(sp)</code> calls <code>sp.GetRequiredService&lt;IAuditService&gt;()</code> — if <code>IAuditService</code> (or anything it internally depends on, like a Scoped <code>DbContext</code>) is registered as <strong>Scoped</strong>, and a developer changes <code>IsReusable</code> from <code>false</code> to <code>true</code> (perhaps believing "reusable" only means "safe to reuse, therefore more efficient"), the framework caches the FIRST resolved <code>TenantAuditFilter</code> instance — complete with whatever Scoped <code>IAuditService</code> was resolved during the FIRST request that needed it — and reuses that SAME instance, holding the SAME captured Scoped dependency, for every SUBSEQUENT request for the rest of the application\'s lifetime. This is functionally identical to injecting a Scoped service into a Singleton, even though nothing about the filter\'s OWN registration looks like a Singleton at all.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own factory, with IsReusable flipped to true — a subtle, easy-to-make change that reintroduces a captive dependency',
      language: 'csharp',
      code: `public class TenantAuditFilterFactory : IFilterFactory
{
    // BUG: changed from 'false' to 'true' — perhaps by a developer
    // thinking "IsReusable = true sounds more efficient, why not?":
    public bool IsReusable => true;

    public IFilterMetadata CreateInstance(IServiceProvider sp)
    {
        // IAuditService is registered Scoped — it internally holds a
        // Scoped DbContext used to write audit records tied to the
        // CURRENT request/transaction:
        var audit = sp.GetRequiredService<IAuditService>();
        var logger = sp.GetRequiredService<ILogger<TenantAuditFilter>>();
        return new TenantAuditFilter(audit, logger);
    }
}

// builder.Services.AddScoped<IAuditService, AuditService>();  (elsewhere)

public class TenantAuditFilter(IAuditService audit, ILogger logger) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(
        ActionExecutingContext ctx, ActionExecutionDelegate next)
    {
        var tenant = ctx.HttpContext.User.FindFirst("tenant_id")?.Value;
        await next();
        // 'audit' here is the SAME IAuditService instance — and
        // therefore the SAME underlying Scoped DbContext — captured
        // during the FIRST REQUEST this filter was ever created for.
        // Every SUBSEQUENT request's audit log write goes through that
        // SAME, now-stale DbContext instance, which was disposed at the
        // end of the FIRST request's scope:
        await _audit.LogAsync(tenant, ctx.ActionDescriptor.DisplayName);
        // THROWS: ObjectDisposedException on the SECOND request onward
        // — "Cannot access a disposed object. Object name:
        // 'AppDbContext'." — because the DbContext this cached
        // IAuditService instance holds was torn down when the FIRST
        // request's Scoped container was disposed.
    }
}`,
    },
    {
      label: 'The correct fix — restoring IsReusable => false, and WHY that specific boolean is what prevents this',
      language: 'csharp',
      code: `public class TenantAuditFilterFactory : IFilterFactory
{
    // CORRECT: false tells the framework NOT to cache the instance —
    // CreateInstance(sp) is called FRESH for EVERY request that needs
    // this filter, resolving a NEW Scoped IAuditService (and therefore
    // a fresh, request-scoped DbContext) each time:
    public bool IsReusable => false;

    public IFilterMetadata CreateInstance(IServiceProvider sp)
    {
        var audit = sp.GetRequiredService<IAuditService>();
        var logger = sp.GetRequiredService<ILogger<TenantAuditFilter>>();
        return new TenantAuditFilter(audit, logger);
    }
}

// WHAT "IsReusable" ACTUALLY CONTROLS, PRECISELY: it is a hint
// consumed by the MVC filter provider's caching layer — when true, the
// FIRST IFilterMetadata instance returned by CreateInstance() for a
// given filter descriptor MAY be cached and handed out again on
// subsequent requests WITHOUT calling CreateInstance() again at all.
// When false, CreateInstance() is invoked fresh every time the filter
// is needed, guaranteeing any Scoped dependencies resolved inside it
// are always current for the ACTUAL request being processed.

// THE GENERAL RULE: IsReusable should ONLY be true when CreateInstance()
// resolves EXCLUSIVELY Singleton-safe dependencies (or no dependencies
// at all) — the exact same rule that governs whether it's safe to
// inject a service into an actual DI Singleton. IFilterFactory is a
// SEPARATE mechanism from ordinary constructor injection, but the
// underlying lifetime-safety rule it must respect is identical.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Propose a test that would catch the IsReusable => true regression described in this subtopic BEFORE it reaches production — one that specifically simulates TWO SEPARATE requests reusing the same filter instance, similar in spirit to the fresh-scope test from the ASP.NET Dependency Injection subtopics.',
    hint: 'Consider constructing the IFilterFactory directly, calling CreateInstance() with two DIFFERENT IServiceProvider scopes (simulating two separate requests), and checking whether the underlying Scoped dependency each call resolves is the same instance or a different one.',
    solution: `A direct unit test on the factory itself, calling CreateInstance() with
two SEPARATE DI scopes (simulating two independent requests) and
verifying each call resolves its OWN Scoped dependency, catches this
regardless of what IsReusable is currently set to — proving the factory
ITSELF is scope-correct, independent of the framework's caching
behavior:

public class TenantAuditFilterFactoryTests
{
    [Fact]
    public void CreateInstance_ResolvesADifferentAuditServiceInstance_PerScope()
    {
        var services = new ServiceCollection();
        services.AddScoped<IAuditService, AuditService>();
        services.AddSingleton<ILogger<TenantAuditFilter>>(NullLogger<TenantAuditFilter>.Instance);
        var provider = services.BuildServiceProvider();

        var factory = new TenantAuditFilterFactory();

        // Simulate TWO SEPARATE requests, each with its own DI scope —
        // exactly like the real ASP.NET Core request pipeline creates a
        // fresh scope per request:
        IAuditService firstRequestAudit, secondRequestAudit;

        using (var scope1 = provider.CreateScope())
        {
            var filter1 = (TenantAuditFilter)factory.CreateInstance(scope1.ServiceProvider);
            firstRequestAudit = GetAuditServiceField(filter1);
        }

        using (var scope2 = provider.CreateScope())
        {
            var filter2 = (TenantAuditFilter)factory.CreateInstance(scope2.ServiceProvider);
            secondRequestAudit = GetAuditServiceField(filter2);
        }

        // If these are the SAME instance, CreateInstance() is somehow
        // caching internally (a bug in the factory itself, separate
        // from the framework's own IsReusable-driven caching) — but
        // more importantly, this test ALSO documents and verifies the
        // ASSUMPTION the whole IsReusable=false decision depends on:
        // that a FRESH scope produces a FRESH IAuditService each time:
        Assert.NotSame(firstRequestAudit, secondRequestAudit);
    }

    // (reflection helper to extract the private '_audit' field for
    // assertion purposes omitted for brevity)
}

This test does not directly exercise IsReusable itself (that boolean is
read by the FRAMEWORK's caching layer, not by the factory's own code),
but it does verify the PRECONDITION that makes IsReusable=false the
correct choice: that CreateInstance() genuinely produces fresh,
per-scope dependencies when called fresh. Combined with a code-review
rule ("IsReusable must be false unless every dependency CreateInstance
resolves is Singleton-safe"), this closes the gap a compiler can never
catch on its own, since IsReusable is just a plain bool property with no
special compiler-enforced meaning.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'IFilterFactory.IsReusable => true is a safe, purely performance-oriented optimization with no functional downside, similar to caching any other read-only value.',
      reality: 'setting IsReusable => true when CreateInstance() resolves Scoped dependencies caches the FIRST resolved instance (and everything it captured) for reuse across every subsequent request — recreating the exact captive-dependency problem the ASP.NET Dependency Injection topic warns about, just via a different mechanism.',
    },
    {
      thought: 'IFilterFactory and ordinary DI constructor injection are governed by completely separate lifetime rules, so guidance about captive dependencies from the Dependency Injection topic does not apply here.',
      reality: 'the underlying rule is identical — anything that captures a Scoped dependency and is then reused beyond the scope that dependency was resolved in produces the same class of bug, whether that capturing happens via a DI-managed Singleton or via IFilterFactory\'s own instance-caching mechanism.',
    },
    {
      thought: 'a bug caused by IsReusable => true would throw an obvious exception on the very first request, making it easy to catch immediately during testing.',
      reality: 'the bug is often invisible on the FIRST request (since the freshly-resolved Scoped dependency is still valid at that point) and only manifests on the SECOND or later request, once the captured Scoped dependency (like a DbContext) has already been disposed at the end of the first request\'s scope — exactly the kind of intermittent, request-order-dependent failure that is easy to miss in casual manual testing.',
    },
  ];
}
