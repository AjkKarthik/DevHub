import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-what-builder-build-actually-seals-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './what-builder-build-actually-seals-servicecollection-vs-serviceprovider.html',
  styleUrl: './what-builder-build-actually-seals-servicecollection-vs-serviceprovider.scss',
})
export class WhatBuilderBuildActuallySealsServicecollectionVsServiceproviderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states builder.Build() "seals the DI container" — this subtopic covers WHAT object actually gets sealed, and why the two halves are genuinely different types',
      points: [
        'The main Hosting &amp; Startup page\'s Common Mistakes section shows that calling <code>Add*()</code> after <code>Build()</code> throws <code>InvalidOperationException</code>. This is presented as a rule to remember — but understanding WHY reveals it is not an arbitrary restriction: <code>builder.Services</code> (an <code>IServiceCollection</code>) and the DI container <code>app</code> actually resolves services from (an <code>IServiceProvider</code>) are TWO DIFFERENT OBJECTS, of two different types, with fundamentally different capabilities.',
      ],
    },
    {
      heading: '<code>IServiceCollection</code> is just a MUTABLE LIST of ServiceDescriptor entries — a plain data structure with no resolution capability of its own at all',
      points: [
        '<code>builder.Services</code> implements <code>IServiceCollection</code>, which is (essentially) <code>IList&lt;ServiceDescriptor&gt;</code> — every <code>AddSingleton&lt;T&gt;()</code>/<code>AddScoped&lt;T&gt;()</code>/<code>AddTransient&lt;T&gt;()</code> call simply APPENDS a new <code>ServiceDescriptor</code> record (service type, implementation type/factory, lifetime) to this list. Nothing about registering a service actually CONSTRUCTS anything, validates anything, or resolves anything — it is pure bookkeeping, as cheap and mutable as adding items to any ordinary <code>List&lt;T&gt;</code>.',
      ],
    },
    {
      heading: '<code>builder.Build()</code> takes a SNAPSHOT of that list and compiles it into an entirely different object — an <code>IServiceProvider</code> — which is what actually resolves instances at runtime',
      points: [
        'Calling <code>Build()</code> reads through every <code>ServiceDescriptor</code> currently in the <code>IServiceCollection</code> and constructs an internal, OPTIMIZED resolution structure (a compiled call-site graph, essentially a per-service "how to construct this" plan) — this new object, the <code>IServiceProvider</code> (accessible afterward as <code>app.Services</code>), is what <code>GetRequiredService&lt;T&gt;()</code> actually queries at request time. Crucially, the ORIGINAL <code>IServiceCollection</code> list and the NEW <code>IServiceProvider</code> are not the same object, and the <code>IServiceProvider</code> does NOT expose a way to mutate the underlying registration list at all — there is no "add a new descriptor to an already-built provider" operation, by design.',
        'This is EXACTLY why <code>app.Services.GetRequiredService&lt;IServiceCollection&gt;()</code> does not give you back a live, mutable registration list you could add to — <code>IServiceProvider</code> was never designed to expose one, since its whole purpose is FAST, READ-ONLY resolution based on the compiled graph produced at <code>Build()</code> time, not ongoing mutation.',
      ],
    },
    {
      heading: 'This is also precisely WHEN <code>ValidateOnBuild</code>\'s circular-dependency and missing-registration checks actually run — during the Build() call itself, not before it',
      points: [
        'Any dependency-graph validation (verifying every registered service\'s dependencies are ALSO registered, checking for circular references, checking scope-consistency with <code>ValidateScopes</code>) can ONLY happen once the FULL, FINAL set of registrations is known — which is exactly at <code>Build()</code> time, after every <code>Add*()</code> call has already contributed its <code>ServiceDescriptor</code> to the list. This is why validation errors surface as an exception thrown FROM <code>Build()</code> itself, rather than from any individual earlier <code>Add*()</code> call — the earlier calls have no way to know what OTHER registrations might still be added afterward.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own "sealed container" mistake — now explained by object identity',
      language: 'csharp',
      code: `var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<MyService>();   // appends a ServiceDescriptor
                                               // to builder.Services (IServiceCollection)

var app = builder.Build();
// Build() reads EVERY ServiceDescriptor currently in builder.Services,
// and constructs a BRAND NEW object: an IServiceProvider, assigned to
// app.Services. builder.Services (the ORIGINAL IServiceCollection) and
// app.Services (the NEW IServiceProvider) are DIFFERENT OBJECTS of
// DIFFERENT TYPES from this point on.

// From the main page's own Common Mistakes section:
app.Services.GetRequiredService<IServiceCollection>()
   .AddSingleton<AnotherService>();
// InvalidOperationException — and NOT because of some arbitrary rule:
// app.Services is an IServiceProvider. Asking it for an
// IServiceCollection either fails outright, or (in some diagnostic
// scenarios) returns something that is NOT the live, still-mutable
// list Build() originally compiled FROM — there is no code path that
// lets a fully-built IServiceProvider accept new ServiceDescriptor
// entries after the fact, because it was never designed to.`,
    },
    {
      label: 'ServiceDescriptor — the plain data record every Add*() call actually appends',
      language: 'csharp',
      code: `// Conceptually, what AddSingleton<MyService>() actually does:
public interface IServiceCollection : IList<ServiceDescriptor> { }

public class ServiceDescriptor
{
    public Type ServiceType { get; }
    public Type? ImplementationType { get; }
    public Func<IServiceProvider, object>? ImplementationFactory { get; }
    public ServiceLifetime Lifetime { get; }   // Singleton/Scoped/Transient
}

// builder.Services.AddSingleton<MyService>() is, essentially:
builder.Services.Add(new ServiceDescriptor(
    serviceType: typeof(MyService),
    implementationType: typeof(MyService),
    lifetime: ServiceLifetime.Singleton));

// This is PURE, cheap bookkeeping — appending one record to a list.
// NOTHING about this line constructs a MyService instance, validates
// MyService's own dependencies exist, or does anything beyond
// recording "here is a rule for how to build a MyService, later."`,
    },
    {
      label: 'What Build() actually does — compiling the list into a resolution engine',
      language: 'csharp',
      code: `// Conceptually, what builder.Build() does with builder.Services:
public IServiceProvider BuildServiceProvider(IServiceCollection services)
{
    // 1. Read every ServiceDescriptor currently in the list — this is
    //    the LAST possible moment new descriptors could still be added,
    //    since this method call is what freezes the set:
    var descriptors = services.ToArray();

    // 2. (Optionally, with ValidateOnBuild) walk the FULL dependency
    //    graph NOW, since only NOW is every registration known:
    //    - does every constructor parameter have a matching registration?
    //    - are there any circular dependencies (A needs B needs A)?
    //    - (with ValidateScopes) does any Singleton depend on a Scoped
    //      service, captured at the wrong scope depth?
    ValidateDependencyGraph(descriptors);  // throws here if invalid —
                                            // NOT at any earlier Add*() call

    // 3. Compile an internal resolution structure (call-site graph) —
    //    a genuinely DIFFERENT, purpose-built object optimized for FAST
    //    repeated resolution, not for further mutation:
    return new ServiceProviderEngine(descriptors);
}

// The RETURNED IServiceProvider has NO "Add" method at all in its
// public interface — by design, since its entire reason to exist is
// fast, read-only resolution against the FINAL, frozen set of
// registrations that existed at the moment Build() was called.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer wants to add ONE more service registration conditionally, based on a value only known AFTER <code>builder.Build()</code> has already run (e.g., a feature flag read from a database via a service resolved from <code>app.Services</code>). Explain, using the ServiceCollection/ServiceProvider distinction from this subtopic, exactly why this specific pattern cannot work, and what the correct alternative looks like.',
    hint: 'Consider what object the developer would need to call an Add method ON in order to register something new — and whether that specific object (an already-built IServiceProvider) has ever, at any point, exposed a mutation API at all.',
    solution: `var app = builder.Build();

// The developer's INSTINCT — read a value from a resolved service,
// then try to register something new based on it:
using (var scope = app.Services.CreateScope())
{
    var featureFlags = scope.ServiceProvider.GetRequiredService<IFeatureFlagService>();
    bool useNewImplementation = await featureFlags.IsEnabledAsync("new-report-engine");

    if (useNewImplementation)
    {
        // ATTEMPTING to register something new, AFTER Build() already ran:
        app.Services.GetRequiredService<IServiceCollection>()  // FAILS —
            .AddSingleton<IReportEngine, NewReportEngine>();    // see below
    }
}

// WHY THIS CANNOT WORK: "app.Services" is an IServiceProvider — a
// compiled, read-only resolution engine built FROM whatever
// ServiceDescriptors existed in builder.Services at the moment
// Build() ran. There is NO version of IServiceProvider, in any .NET
// release, that exposes an "Add a new registration" operation — asking
// it for an IServiceCollection either throws or (at best) hands back
// something that is NOT connected to the live resolution engine in any
// way that would actually affect FUTURE GetRequiredService calls.
// The fundamental problem is structural: by the time you have an
// IServiceProvider to even query the feature flag from, the ONE
// object that COULD have accepted a new registration (the original
// IServiceCollection, "builder.Services") is long gone from scope,
// and even if you kept a reference to it, IServiceProvider was never
// built to re-compile itself from a mutated list after the fact.

// THE CORRECT ALTERNATIVE — decide BEFORE Build(), reading whatever
// config/flag SOURCE is available at THAT point (most feature-flag
// systems can be queried directly from IConfiguration or a lightweight
// bootstrap call, without needing the full DI container):
var builder = WebApplication.CreateBuilder(args);

bool useNewImplementation = builder.Configuration.GetValue<bool>("Features:NewReportEngine");
if (useNewImplementation)
    builder.Services.AddSingleton<IReportEngine, NewReportEngine>();
else
    builder.Services.AddSingleton<IReportEngine, LegacyReportEngine>();

var app = builder.Build();  // NOW the registration decision is baked
                             // into the compiled IServiceProvider,
                             // made from information available BEFORE
                             // the container was sealed.

// If the flag GENUINELY can only be known after some async I/O that
// requires DI to perform, the standard pattern is to resolve BOTH
// implementations and choose between them at USE time (inside the
// consuming code), rather than trying to register a NEW service after
// the fact — registration-time decisions must be made with
// registration-time-available information.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'builder.Services (before Build()) and app.Services (after Build()) are the same object, just accessed through two different property names.',
      reality: 'they are genuinely different objects of different types — builder.Services is a mutable IServiceCollection (a list of ServiceDescriptor entries), while app.Services is a compiled IServiceProvider built FROM that list at Build() time, with no mutation API.',
    },
    {
      thought: 'the InvalidOperationException thrown when registering a service after Build() is an arbitrary framework restriction that could theoretically be worked around with the right API call.',
      reality: 'it reflects a genuine structural fact — IServiceProvider was never designed to expose a way to add new ServiceDescriptor entries after being compiled, since its entire purpose is fast, read-only resolution against a graph that is fixed at construction time.',
    },
    {
      thought: 'ValidateOnBuild\'s circular-dependency and missing-registration checks run continuously as each Add*() call happens, so a problem is caught as soon as the bad registration line executes.',
      reality: 'validation can only happen once the FULL, FINAL set of registrations is known — which is exactly at Build() time — so validation errors surface from the Build() call itself, not from any individual earlier Add*() call.',
    },
  ];
}
