import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-primary-constructor-parameter-captured-as-field-object-entire-lifetime-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './primary-constructor-parameter-captured-as-field-object-entire-lifetime.html',
  styleUrl: './primary-constructor-parameter-captured-as-field-object-entire-lifetime.scss',
})
export class PrimaryConstructorParameterCapturedAsFieldObjectEntireLifetimeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own DI example makes primary constructors look like pure syntax sugar over a normal constructor + private field — the capture mechanism actually has a real, easy-to-miss lifetime implication',
      points: [
        'The main C# 11 &amp; 12 page\'s <code>OrderService(IOrderRepository repo, ILogger&lt;OrderService&gt; logger)</code> example presents primary constructors as eliminating "separate private field declarations and constructor assignment boilerplate." This is true, but glosses over a subtlety: the compiler only creates a backing field for a primary-constructor parameter IF that parameter is referenced ANYWHERE in the type\'s body — and once created, that field holds the reference for the ENTIRE LIFETIME of the object, not just during construction, even if the parameter is referenced in only ONE rarely-called method.',
      ],
    },
    {
      heading: 'A traditional constructor makes this lifetime choice explicit — you decide whether to assign a parameter to a field at all; a primary constructor makes it implicit and driven purely by whether the parameter happens to be referenced anywhere',
      points: [
        'With a traditional constructor, a parameter that is used ONLY inside the constructor body (e.g., to perform some one-time setup calculation) and never assigned to a field simply goes out of scope when the constructor returns — nothing keeps that argument alive afterward. With a PRIMARY constructor, if that SAME parameter happens to also be referenced from ANY OTHER method in the class — even a rarely-invoked one, even one added months later by a different developer who did not realize the implication — the compiler silently promotes it to a captured field, and the object it references is now kept alive for as long as the CONTAINING instance is alive.',
        'This becomes a genuine resource-lifetime concern when the captured parameter is something EXPENSIVE or STATEFUL to hold onto — a large configuration snapshot, a whole <code>IServiceProvider</code>, a database connection, or any object whose prolonged retention has a real cost (memory, an open connection, blocking a resource other code wants to reclaim) — especially when the referencing method is something incidental (a rarely-called diagnostic method, an optional debug path) that a developer would not naturally think of as "the reason this class holds onto X forever."',
      ],
    },
    {
      heading: 'The fix mirrors ordinary constructor discipline: deliberately DECIDE whether a parameter should be captured, rather than letting incidental usage make that decision implicitly',
      points: [
        'If a primary-constructor parameter is genuinely only needed transiently (e.g., during one-time setup), extract that ONE-TIME use into a regular (non-primary) constructor instead, or explicitly copy out only the SPECIFIC VALUE actually needed long-term into its own field — rather than referencing the whole original parameter (and therefore the whole object it represents) from a method whose only real need is one small piece of it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The trap — a rarely-used diagnostic method silently keeps an expensive dependency alive forever',
      language: 'csharp',
      code: `// A primary constructor taking a heavyweight IServiceProvider — perhaps
// intended ONLY to resolve a couple of optional services during startup:
public class ReportGenerator(IServiceProvider services, ReportConfig config)
{
    private readonly ReportConfig _config = config;  // deliberately captured — fine

    public Report Generate(int reportId)
    {
        // Everyday usage never touches "services" at all:
        return BuildReport(reportId, _config);
    }

    // A RARELY-CALLED diagnostic method, added months later by a different
    // developer, who just needed a quick way to inspect registered services:
    public void DumpRegisteredServiceTypes()
    {
        // Referencing "services" HERE is enough to make the COMPILER
        // capture the ENTIRE IServiceProvider as a backing field for
        // ReportGenerator — even though this diagnostic method might be
        // called ZERO times in a typical run:
        if (services is ServiceProvider sp)
            Console.WriteLine("Diagnostic dump...");
    }

    private Report BuildReport(int id, ReportConfig config) => new(id, config);
}

// EVERY ReportGenerator instance now holds a live reference to the ENTIRE
// IServiceProvider for as long as the ReportGenerator itself is alive —
// even for the (presumably vast majority of) instances whose
// DumpRegisteredServiceTypes() method is NEVER called at all. If
// ReportGenerator instances are created frequently and held for a while
// (e.g., cached per-request), this silently extends the effective
// lifetime of the ENTIRE DI container's root IServiceProvider reference
// through every single one of them.`,
    },
    {
      label: 'Confirming the capture — decompiling reveals the generated backing field',
      language: 'csharp',
      code: `// Conceptually, what the compiler generates for the class above
// (simplified, illustrating the ACTUAL generated field):
public class ReportGenerator
{
    // This backing field EXISTS specifically because "services" is
    // referenced in DumpRegisteredServiceTypes() — if that ONE method
    // were deleted (or rewritten to not reference "services" at all),
    // this field would NOT be generated, and the constructor argument
    // would go out of scope like an ordinary unused constructor parameter:
    private readonly IServiceProvider services;
    private readonly ReportConfig config;

    public ReportGenerator(IServiceProvider services, ReportConfig config)
    {
        this.services = services;   // ALWAYS generated for ANY parameter
        this.config   = config;     // referenced anywhere in the body
    }

    private readonly ReportConfig _config = config; // (your own explicit field)

    public Report Generate(int reportId) => BuildReport(reportId, _config);

    public void DumpRegisteredServiceTypes()
    {
        if (services is ServiceProvider sp)  // <-- THIS single reference
            Console.WriteLine("Diagnostic dump...");  // is what triggers
                                                        // the capture above
    }

    private Report BuildReport(int id, ReportConfig config) => new(id, config);
}`,
    },
    {
      label: 'The fix — deliberately avoid capturing what is not genuinely needed long-term',
      language: 'csharp',
      code: `// OPTION 1: extract only the SPECIFIC piece actually needed, at
// construction time, instead of holding the whole IServiceProvider:
public class ReportGeneratorFixed(IServiceProvider services, ReportConfig config)
{
    private readonly ReportConfig _config = config;

    // Extract JUST what the diagnostic path needs, immediately, during
    // construction — "services" itself is used ONLY here, in the
    // primary constructor's own initializer expression, and is NEVER
    // referenced from any OTHER method body, so the compiler does NOT
    // capture the whole IServiceProvider as a field at all:
    private readonly IReadOnlyList<Type> _registeredServiceTypes =
        services is ServiceProvider sp
            ? GetRegisteredTypes(sp)
            : [];

    public Report Generate(int reportId) => BuildReport(reportId, _config);

    public void DumpRegisteredServiceTypes()
    {
        // Uses the small, already-extracted snapshot — NOT a live
        // reference to the entire IServiceProvider:
        foreach (var t in _registeredServiceTypes)
            Console.WriteLine(t.Name);
    }

    private static IReadOnlyList<Type> GetRegisteredTypes(ServiceProvider sp) => [];
    private Report BuildReport(int id, ReportConfig config) => new(id, config);
}

// OPTION 2: if the diagnostic capability is rarely needed, make it an
// explicit, separate, deliberately-constructed helper instead — passed
// its OWN IServiceProvider only when actually invoked, rather than
// living inside every ReportGenerator instance's own lifetime:
public class ServiceDiagnostics
{
    public static void Dump(IServiceProvider services)
    {
        if (services is ServiceProvider sp)
            Console.WriteLine("Diagnostic dump...");
    }
}
// Called explicitly, only when needed: ServiceDiagnostics.Dump(app.Services);`,
  },
  ];

  exercise: TryItExercise = {
    prompt: 'A class <code>public class CacheWarmer(IHttpClientFactory httpFactory, ILogger&lt;CacheWarmer&gt; logger)</code> only ever uses <code>httpFactory</code> inside its main <code>WarmAsync()</code> method — nowhere else. A teammate then adds a <code>LogHttpFactoryTypeName()</code> debug helper that does <code>logger.LogInformation(httpFactory.GetType().Name)</code>. Explain what changes about httpFactory\'s captured lifetime, and whether removing LogHttpFactoryTypeName() later actually undoes it.',
    hint: 'Consider that the compiler\'s decision to generate a backing field for a primary constructor parameter is made based on whether ANY method in the class references that parameter — adding a NEW method that references it is enough to trigger capture, and the compiler re-evaluates this on every build, not just once at the class\'s original creation.',
    solution: `// BEFORE the teammate's change — httpFactory is used ONLY inside
// WarmAsync(), which is the standard, expected pattern:
public class CacheWarmer(IHttpClientFactory httpFactory, ILogger<CacheWarmer> logger)
{
    public async Task WarmAsync()
    {
        var client = httpFactory.CreateClient();
        await client.GetAsync("https://api.example.com/warm");
    }
}
// httpFactory IS still captured as a field here too (it's referenced in
// WarmAsync), which is exactly the intended, deliberate usage — this is
// fine, since the whole POINT of CacheWarmer needing httpFactory is to
// actually use it for its main job.

// AFTER the teammate adds a debug helper that ALSO references httpFactory:
public class CacheWarmer(IHttpClientFactory httpFactory, ILogger<CacheWarmer> logger)
{
    public async Task WarmAsync()
    {
        var client = httpFactory.CreateClient();
        await client.GetAsync("https://api.example.com/warm");
    }

    // NEW — added later, referencing httpFactory again:
    public void LogHttpFactoryTypeName() =>
        logger.LogInformation(httpFactory.GetType().Name);
}

// WHAT ACTUALLY CHANGES: in THIS specific example, nothing meaningfully
// changes — httpFactory was ALREADY captured as a field because
// WarmAsync() itself references it; adding a SECOND reference from
// LogHttpFactoryTypeName() does not create any NEW capture that did not
// already exist. This particular example is a case where the capture
// was ALREADY correct and intentional from the start.

// THE GENUINELY RISKY VERSION of this scenario (matching the earlier
// ReportGenerator example) is when the ORIGINAL, intended usage of a
// parameter is transient/one-time-only, and a LATER addition is what
// FIRST introduces a lasting reference — e.g., if httpFactory had
// ORIGINALLY only been used inside a constructor-time validation check
// (not captured at all, since primary-constructor parameters unused
// elsewhere in the body don't need to become fields), and the debug
// helper was the FIRST and ONLY other reference — THAT is the scenario
// where adding one seemingly-harmless debug method silently upgrades an
// otherwise-transient parameter into a permanently-captured field.

// DOES REMOVING LogHttpFactoryTypeName() LATER UNDO THE CAPTURE?
// Yes — the compiler re-evaluates which parameters need backing fields
// on EVERY BUILD, based on the CURRENT state of the source code. If
// LogHttpFactoryTypeName() (and every OTHER reference to httpFactory
// outside WarmAsync) is removed, and WarmAsync() is ALSO later refactored
// to not need it, the field capture disappears on the next build — this
// is a build-time, static analysis decision, not something "sticky" from
// a prior compilation. The risk is not permanence — it is that the
// capture happens SILENTLY and IMPLICITLY, driven by incidental
// references that a reviewer may not think to check for.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a primary constructor parameter is only captured as a field if you explicitly need it for the class\'s main, intended purpose.',
      reality: 'the compiler captures a primary-constructor parameter as a field if it is referenced ANYWHERE in the type\'s body at all — including a rarely-called diagnostic or debug method that a reviewer might not think to check when evaluating the class\'s core design.',
    },
    {
      thought: 'a primary constructor parameter referenced only inside the constructor body behaves the same way whether the constructor is a primary constructor or a traditional one.',
      reality: 'a traditional constructor parameter used only within the constructor body goes out of scope when construction finishes; a primary-constructor parameter referenced ANYWHERE (including outside the constructor-equivalent code) gets captured into a field that persists for the object\'s entire lifetime.',
    },
    {
      thought: 'once a primary-constructor parameter has been captured as a field due to some reference, that capture is permanent for the class regardless of future refactoring.',
      reality: 'the compiler re-evaluates which parameters need backing fields on every build based on current usage — removing every reference to a parameter outside its original transient use removes the capture on the next compilation.',
    },
  ];
}
