import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-onchange-idisposable-must-be-disposed-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './onchange-returns-idisposable-must-be-disposed-or-callback-leaks.html',
  styleUrl: './onchange-returns-idisposable-must-be-disposed-or-callback-leaks.scss',
})
export class OnchangeReturnsIdisposableMustBeDisposedOrCallbackLeaksSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own FeatureFlagService stores the OnChange() result as "_listener" — but never actually disposes it anywhere',
      points: [
        'The main Configuration page\'s <code>FeatureFlagService</code> example includes <code>private IDisposable? _listener;</code> and assigns <code>_listener = monitor.OnChange(...)</code> in the constructor — the field NAME itself ("_listener", and its <code>IDisposable?</code> type) is a strong hint that the AUTHOR intended for it to be disposed at some point, but the class shown never implements <code>IDisposable</code> or calls <code>_listener?.Dispose()</code> anywhere. This is not a mistake in the main page\'s teaching example specifically (it is focused on demonstrating <code>OnChange</code> itself) — but it IS the exact shape of a real, easy-to-miss production bug.',
      ],
    },
    {
      heading: '<code>OnChange(callback)</code> returns an <code>IDisposable</code> specifically because the registration otherwise lives for as long as the underlying <code>IOptionsMonitor</code> does — which, for a Singleton, is the entire application lifetime',
      points: [
        '<code>IOptionsMonitor&lt;T&gt;</code> is registered as a Singleton (the main page\'s own comparison table confirms this). Every <code>OnChange</code> callback registered against it is held by that SAME long-lived singleton internally — calling <code>OnChange</code> without ever disposing the returned handle means the callback (and, critically, EVERYTHING that callback\'s closure captures — <code>this</code>, any captured local variables, any objects reachable from them) is kept alive by the singleton\'s internal subscriber list for the ENTIRE process lifetime, even if the object that ORIGINALLY registered the callback (e.g., a Scoped or Transient service instance) would otherwise have been garbage-collected long ago.',
        'This is conceptually the SAME class of problem as .NET event-handler leaks (<code>someObject.SomeEvent += Handler;</code> without ever <code>-=</code>) — a subscription mechanism holding a reference to a callback prevents whatever that callback captures from being collected, for as long as the SUBSCRIBER (here, the singleton <code>IOptionsMonitor</code>) itself is alive.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own example, made concrete — a Scoped consumer registering against a Singleton monitor',
      language: 'csharp',
      code: `// If FeatureFlagService were registered as SCOPED (a completely
// reasonable choice — many services legitimately are), a NEW instance
// is created for EVERY HTTP request. Each one registers its OWN
// OnChange callback against the SAME underlying Singleton
// IOptionsMonitor<FeatureFlags>:
public class FeatureFlagService
{
    private readonly IOptionsMonitor<FeatureFlags> _monitor;
    private IDisposable? _listener;

    public FeatureFlagService(IOptionsMonitor<FeatureFlags> monitor)
    {
        _monitor = monitor;
        _listener = monitor.OnChange(flags =>
            Console.WriteLine(\$"Feature flags reloaded: NewCheckout={flags.NewCheckout}"));
        // "_listener" is assigned, but NEVER disposed anywhere —
        // matching the main page's own example exactly.
    }

    public bool IsNewCheckoutEnabled => _monitor.CurrentValue.NewCheckout;
}

builder.Services.AddScoped<FeatureFlagService>();

// EVERY SINGLE HTTP REQUEST creates a NEW FeatureFlagService instance,
// which registers ANOTHER OnChange callback against the SAME singleton
// IOptionsMonitor<FeatureFlags> — and NONE of these callbacks are ever
// removed. After 100,000 requests, the singleton's internal list of
// OnChange subscribers has 100,000 entries, each one keeping ITS OWN
// FeatureFlagService instance (and everything it references) alive
// for the rest of the process's lifetime — a genuine, unbounded memory
// leak that grows directly with request volume.`,
    },
    {
      label: 'Confirming the leak conceptually — same shape as an un-unsubscribed event handler',
      language: 'csharp',
      code: `// The EXACT SAME leak shape, using a plain .NET event instead of
// OnChange — illustrating that this is not something special or
// unique to IOptionsMonitor, but the SAME general .NET pattern:
public class SomeLongLivedPublisher   // conceptually like the Singleton IOptionsMonitor
{
    public event Action? SomethingHappened;
    public void Trigger() => SomethingHappened?.Invoke();
}

public class ShortLivedSubscriber    // conceptually like a Scoped FeatureFlagService
{
    public ShortLivedSubscriber(SomeLongLivedPublisher publisher)
    {
        publisher.SomethingHappened += () =>
            Console.WriteLine("Reacting to event...");
        // NEVER does "publisher.SomethingHappened -= handler;" anywhere —
        // this ShortLivedSubscriber instance is now referenced by
        // "publisher"'s event delegate invocation list FOREVER, even
        // after whatever created this ShortLivedSubscriber has long
        // since finished with it and expects it to be garbage collected.
    }
}

// The publisher's long lifetime (Singleton, or in this illustration,
// simply "long-lived") is EXACTLY what makes this a leak — subscribing
// a short-lived object's callback to a LONG-LIVED publisher's event
// (or OnChange list) without ever unsubscribing keeps that short-lived
// object alive for as long as the publisher lives, defeating whatever
// shorter lifetime (Scoped, Transient, or simple GC-eligibility) was
// actually intended.`,
    },
    {
      label: 'The fix — implement IDisposable and actually dispose the listener',
      language: 'csharp',
      code: `public class FeatureFlagServiceFixed : IDisposable
{
    private readonly IOptionsMonitor<FeatureFlags> _monitor;
    private readonly IDisposable _listener;

    public FeatureFlagServiceFixed(IOptionsMonitor<FeatureFlags> monitor)
    {
        _monitor = monitor;
        _listener = monitor.OnChange(flags =>
            Console.WriteLine(\$"Feature flags reloaded: NewCheckout={flags.NewCheckout}"));
    }

    public bool IsNewCheckoutEnabled => _monitor.CurrentValue.NewCheckout;

    // Implementing IDisposable and disposing "_listener" here means the
    // DI container will automatically call THIS Dispose() at the end of
    // whatever scope owns this instance — for a Scoped service, that is
    // the end of the HTTP request, correctly un-registering the
    // callback from the singleton IOptionsMonitor's internal list at
    // exactly the right moment:
    public void Dispose() => _listener.Dispose();
}

builder.Services.AddScoped<FeatureFlagServiceFixed>();
// ASP.NET Core's DI container automatically disposes ALL IDisposable
// services it created at the end of their OWNING SCOPE (request scope,
// for a Scoped service) — you do not need to call Dispose() yourself;
// simply implementing IDisposable correctly and disposing YOUR OWN
// captured resources (like "_listener") inside it is sufficient.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team notices their app\'s memory usage grows steadily over days of continuous operation, correlating roughly with total request count, and eventually triggers an out-of-memory restart. A memory dump analysis shows thousands of instances of a Scoped service that should have been garbage collected long ago. Using this subtopic\'s mechanism, explain the most likely root cause and how a memory profiler would confirm it.',
    hint: 'Consider what "gcroot" analysis on one of those leaked Scoped service instances would actually show — trace the reference chain BACKWARD from the leaked instance to whatever is keeping it artificially alive, and consider what kind of object commonly sits at the ROOT of such a chain when the leak pattern matches "grows with request count."',
    solution: `// The likely culprit, matching this subtopic's exact pattern:
public class ReportCacheService
{
    private readonly IOptionsMonitor<CacheOptions> _monitor;

    public ReportCacheService(IOptionsMonitor<CacheOptions> monitor)
    {
        _monitor = monitor;
        // NO disposal anywhere — registered every time a new
        // ReportCacheService is created:
        monitor.OnChange(opts => InvalidateCacheIfSizeChanged(opts));
    }

    private void InvalidateCacheIfSizeChanged(CacheOptions opts) { /* ... */ }
}

builder.Services.AddScoped<ReportCacheService>();

// MOST LIKELY ROOT CAUSE: exactly the leak pattern this subtopic
// describes — EVERY HTTP request creates a new ReportCacheService
// (Scoped lifetime), and EACH ONE registers an OnChange callback
// against the SAME Singleton IOptionsMonitor<CacheOptions>, without
// ever disposing the returned IDisposable. The singleton's internal
// OnChange subscriber list grows by one entry per request, FOREVER —
// this exactly matches "memory usage grows steadily, correlating with
// request count."

// HOW A MEMORY PROFILER WOULD CONFIRM THIS: take a memory snapshot,
// find one of the many leaked ReportCacheService instances, and run
// "gcroot" (path-to-root) analysis on it. The reference chain would
// trace BACKWARD through:
//   ReportCacheService instance
//     <- captured by a lambda/closure (the OnChange callback delegate)
//       <- held by IOptionsMonitor<CacheOptions>'s internal change
//          listener/subscriber list
//         <- IOptionsMonitor<CacheOptions> itself, registered as a
//            SINGLETON, rooted directly in the application's root DI
//            container for the ENTIRE process lifetime
//
// Finding "IOptionsMonitor<T>" (a Singleton) sitting at or near the
// ROOT of the gcroot chain for a Scoped service instance that SHOULD
// have been collected is the exact, unambiguous signature of this
// specific leak pattern — a long-lived singleton's internal
// subscription list holding references to short-lived objects that
// registered callbacks against it without ever unsubscribing.
//
// THE FIX: implement IDisposable on ReportCacheService, dispose the
// IDisposable returned by OnChange() in that Dispose method, exactly
// as the "FeatureFlagServiceFixed" pattern in this subtopic's own code
// examples shows — the DI container will then automatically dispose
// each request-scoped instance (and correctly unregister its callback)
// at the end of that request, and the singleton's subscriber list will
// stop growing unboundedly.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'IOptionsMonitor.OnChange(callback) automatically stops calling the callback once the object that registered it is no longer referenced elsewhere, similar to how a garbage-collected object simply stops existing.',
      reality: 'the singleton IOptionsMonitor itself holds a direct reference to the callback (and everything its closure captures) in its internal subscriber list — this reference alone is enough to keep the registering object alive indefinitely, regardless of whether anything else still references it, unless the returned IDisposable is explicitly disposed.',
    },
    {
      thought: 'this kind of leak only matters for genuinely long-running background services, not ordinary Scoped services created per HTTP request.',
      reality: 'the risk is often WORSE for Scoped services specifically — a new instance is created on every request, and if each one registers an OnChange callback without disposing it, the singleton monitor\'s subscriber list grows by one leaked entry per request, unboundedly, for the lifetime of the process.',
    },
    {
      thought: 'a field named with an "IDisposable?" type and a name like "_listener" is just documentation of intent — actually calling Dispose on it is optional if the class does not otherwise need cleanup logic.',
      reality: 'failing to dispose the IDisposable returned by OnChange() is a genuine, structural memory leak — the field\'s naming and type are a strong signal that disposal was intended but never actually implemented, exactly the gap between the main page\'s own teaching example and a production-ready version of the same class.',
    },
  ];
}
