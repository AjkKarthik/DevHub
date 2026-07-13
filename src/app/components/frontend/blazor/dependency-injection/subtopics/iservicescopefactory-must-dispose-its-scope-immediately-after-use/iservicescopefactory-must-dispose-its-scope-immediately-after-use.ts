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
  templateUrl: './iservicescopefactory-must-dispose-its-scope-immediately-after-use.html',
  styleUrl: './iservicescopefactory-must-dispose-its-scope-immediately-after-use.scss'
})
export class IservicescopefactoryMustDisposeItsScopeImmediatelyAfterUseSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A scope created by IServiceScopeFactory is a real, disposable resource — it does not clean itself up automatically the way a normal Scoped injection does',
      points: [
        'When Blazor (or ASP.NET Core generally) creates a Scoped instance for you automatically — during a circuit\'s lifetime, or a request — the FRAMEWORK also handles disposing that scope at the appropriate time. When you manually call scopeFactory.CreateScope(), you have opted OUT of that automatic management: the resulting IServiceScope, and everything resolved from it, is now YOUR responsibility to dispose.',
        'Failing to dispose a manually-created scope means every Scoped service resolved from it (and anything IDisposable those services hold — a DbContext\'s database connection, a file handle) stays alive indefinitely, held by the undisposed scope, for as long as the Singleton that created it continues running — which, for a genuine Singleton, is the entire lifetime of the server process.',
      ]
    },
    {
      heading: 'Why "immediately after use" specifically, rather than holding the scope for later reuse',
      points: [
        'A tempting-looking "optimization" is to create ONE scope in a Singleton\'s constructor and reuse it for every subsequent call, avoiding the overhead of creating a fresh scope each time — but this recreates almost the EXACT captive-dependency problem this subtopic\'s sibling topic describes: the Scoped services resolved from that one long-lived scope are effectively captive to it, permanently, defeating the entire purpose of using a scope factory in the first place.',
        'The correct pattern — create a scope, resolve what is needed, use it, dispose the scope — should happen freshly on EVERY call that needs the Scoped dependency, typically wrapped in a using statement (or await using for IAsyncDisposable scopes) so disposal happens automatically and reliably even if an exception is thrown partway through the operation.',
        'This repeated create-use-dispose cycle does have a real, measurable cost (constructing a new DI scope and resolving services from it is not free) — but it is the cost of correctness for accessing genuinely Scoped resources safely from a Singleton context, not a mistake to optimize away by caching the scope itself.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The leak — a scope cached and reused, never disposed',
      language: 'csharp',
      code: `public class BackgroundEmailSender  // AddSingleton<BackgroundEmailSender>()
{
    private readonly IServiceScopeFactory scopeFactory;
    private readonly IServiceScope cachedScope;  // BUG: created once, kept forever

    public BackgroundEmailSender(IServiceScopeFactory scopeFactory)
    {
        this.scopeFactory = scopeFactory;
        this.cachedScope = scopeFactory.CreateScope();  // created ONCE
        // This single scope, and everything resolved from it below,
        // now lives for the ENTIRE server process lifetime — the
        // exact captive-dependency problem this pattern was
        // supposed to avoid, just introduced manually instead.
    }

    public async Task SendAsync(string to, string body)
    {
        var db = cachedScope.ServiceProvider.GetRequiredService<AppDbContext>();
        // Reusing the SAME DbContext instance for every single email
        // sent, for the server's entire lifetime — the exact
        // thread-safety and stale-tracked-entity risks a fresh
        // per-request DbContext exists to avoid.
        await db.EmailLog.AddAsync(new(to, body));
        await db.SaveChangesAsync();
    }
}`,
    },
    {
      label: 'The fix — a fresh scope per call, disposed immediately',
      language: 'csharp',
      code: `public class BackgroundEmailSender  // still AddSingleton<BackgroundEmailSender>()
{
    private readonly IServiceScopeFactory scopeFactory;

    public BackgroundEmailSender(IServiceScopeFactory scopeFactory)
    {
        this.scopeFactory = scopeFactory;
        // No scope created here — only the FACTORY is held, which
        // is itself Singleton-safe (it does not capture any
        // specific Scoped instance).
    }

    public async Task SendAsync(string to, string body)
    {
        // A BRAND NEW scope for THIS specific call.
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await db.EmailLog.AddAsync(new(to, body));
        await db.SaveChangesAsync();

        // "using" ensures the scope (and this call's own fresh
        // DbContext) is disposed here, even if SaveChangesAsync
        // throws — nothing from this call is held onto afterward.
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer profiles their app and finds that creating a fresh DI scope on every single background job execution (hundreds of times per minute) has a measurable performance cost. They consider caching one scope per background-job TYPE (reused across all executions of that specific job) as a middle ground between "one scope forever" and "one scope per call." Does this avoid the captive-dependency risk?',
    hint: 'Think about how many DISTINCT scopes exist under this "cache per job type" scheme, and whether the Scoped services resolved from each cached scope are still tied to just ONE specific resolution moment, the same way the "cache once forever" version was.',
    solution: 'This does not avoid the risk — it only reduces its SCALE, not its fundamental nature. Under "cache per job type," there are now multiple distinct scopes instead of just one, but each of THOSE scopes is still created once and reused indefinitely for every subsequent execution of that job type — meaning every Scoped service resolved from a given cached scope is still captive to whatever state it held at that scope\'s own creation moment, exactly like the original all-in-one cached scope, just partitioned by job type instead of being fully global. A DbContext resolved once and reused across hundreds of that job type\'s executions still accumulates tracked entities and risks concurrent-access issues if executions can overlap. The genuinely correct fix for the performance concern is not caching scopes at any granularity, but confirming whether the overhead is actually significant enough to matter (DI scope creation is generally fast) — and if it truly is a bottleneck, considering whether the specific Scoped dependency (like DbContext) has its own purpose-built factory pattern (IDbContextFactory) designed for exactly this high-frequency-creation scenario, rather than working around IServiceScopeFactory\'s own correctness guarantees.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A scope created via scopeFactory.CreateScope() is automatically cleaned up by the framework once it goes out of scope in the C# code, the same way many .NET objects are handled by the garbage collector.',
      reality: 'This subtopic\'s first code example shows a manually-created scope is NOT automatically disposed by the framework — it is a real IDisposable resource requiring explicit disposal (via using or manual .Dispose()), and the garbage collector alone does not guarantee timely disposal of IDisposable resources, especially ones held by a long-lived Singleton field.'
    },
    {
      thought: 'Creating one scope in a Singleton\'s constructor and reusing it for all subsequent calls is a reasonable optimization, since it avoids the overhead of creating a fresh scope on every single call.',
      reality: 'This subtopic\'s first code example shows this specific "optimization" recreates the captive-dependency problem manually — every Scoped service resolved from that one cached scope becomes permanently tied to whatever state existed at the scope\'s single creation moment, for the Singleton\'s entire remaining lifetime, defeating the purpose of using scoped resolution at all.'
    },
    {
      thought: 'Partitioning cached scopes by some dimension (like job type, as in this subtopic\'s exercise) meaningfully reduces the captive-dependency risk compared to one single global cached scope, since the "blast radius" of any one scope is smaller.',
      reality: 'This subtopic\'s exercise shows the fundamental problem is unchanged by partitioning — each cached scope, no matter how narrowly scoped its usage category, is still created once and reused across multiple calls, meaning the Scoped services resolved from it are still captive to a single resolution moment rather than fresh per use; only genuinely creating (and disposing) a new scope per call avoids this.'
    }
  ];
}
