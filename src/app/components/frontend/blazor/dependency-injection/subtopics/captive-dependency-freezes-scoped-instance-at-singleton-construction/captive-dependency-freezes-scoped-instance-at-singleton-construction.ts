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
  templateUrl: './captive-dependency-freezes-scoped-instance-at-singleton-construction.html',
  styleUrl: './captive-dependency-freezes-scoped-instance-at-singleton-construction.scss'
})
export class CaptiveDependencyFreezesScopedInstanceAtSingletonConstructionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Singleton is constructed exactly ONCE for the entire server process — whatever Scoped instance it receives at that moment is the ONLY one it will ever have',
      points: [
        'The main page\'s mistake entry states the rule (never inject Scoped into Singleton) — the mechanism is that constructor injection resolves ALL of a service\'s dependencies at the moment THAT service itself is constructed. For a Singleton, construction happens exactly once, during the very first resolution, using whatever DI scope happens to be active at that specific moment.',
        'If that Singleton\'s constructor takes a Scoped dependency, the DI container resolves ONE instance of that Scoped service — tied to whatever circuit/scope was active during the Singleton\'s construction — and the Singleton holds onto that SAME instance for its entire remaining lifetime, since it is never reconstructed to pick up a fresh one.',
      ]
    },
    {
      heading: 'Why this becomes actively dangerous rather than just architecturally messy',
      points: [
        'Every subsequent user\'s circuit gets its OWN fresh Scoped instance normally — but the Singleton captured ONE specific circuit\'s Scoped instance forever, at construction time. Every call the Singleton makes to that captured dependency operates on data/state belonging to WHOEVER\'S circuit happened to be active during construction, not the current caller\'s circuit — a genuine cross-user data leak or corruption risk, not merely a design smell.',
        'This is exactly why most DI containers (including .NET\'s built-in one, when scope validation is enabled) actively THROW an exception at Singleton construction time rather than silently allowing this — "Cannot consume scoped service from singleton" is a real, documented .NET exception message specifically guarding against this failure mode being silently introduced.',
        'The correct fix, IServiceScopeFactory, sidesteps the whole problem by NOT capturing any specific Scoped instance in the Singleton\'s own fields at all — instead, the Singleton creates a BRAND NEW temporary scope, resolves a fresh Scoped instance from THAT scope, uses it, and disposes the scope immediately — repeating this fresh-scope-per-use pattern every time it needs the dependency, rather than ever holding onto one specific instance long-term.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The captive dependency — a Singleton holding one frozen Scoped instance',
      language: 'csharp',
      code: `public class AuditLogger  // registered AddSingleton<AuditLogger>()
{
    private readonly IUserContext userContext;  // Scoped

    public AuditLogger(IUserContext userContext)
    {
        // This constructor runs EXACTLY ONCE, for the server's
        // entire lifetime — whatever IUserContext instance the DI
        // container hands over HERE is the ONLY one this
        // AuditLogger will EVER have.
        this.userContext = userContext;
    }

    public void LogAction(string action)
    {
        // BUG: "userContext" always refers to whichever circuit
        // happened to be active at AuditLogger's construction time —
        // NOT the current caller's actual circuit/user. Every log
        // entry, for every user, for the rest of the server's
        // lifetime, gets attributed to that ONE frozen user context.
        Console.WriteLine($"{userContext.CurrentUserId}: {action}");
    }
}`,
    },
    {
      label: 'The fix — IServiceScopeFactory creates a fresh scope per use',
      language: 'csharp',
      code: `public class AuditLogger  // still AddSingleton<AuditLogger>()
{
    private readonly IServiceScopeFactory scopeFactory;

    public AuditLogger(IServiceScopeFactory scopeFactory)
    {
        // IServiceScopeFactory is itself a Singleton-safe dependency —
        // it does not capture any specific Scoped instance at all.
        this.scopeFactory = scopeFactory;
    }

    public void LogAction(string action)
    {
        // A BRAND NEW scope, created fresh for THIS specific call —
        // resolving IUserContext HERE gets the genuinely CURRENT
        // caller's own scoped instance, not a frozen one from
        // AuditLogger's own construction time.
        using var scope = scopeFactory.CreateScope();
        var userContext = scope.ServiceProvider.GetRequiredService<IUserContext>();

        Console.WriteLine($"{userContext.CurrentUserId}: {action}");
        // "scope" is disposed here (end of using block) — the
        // temporary IUserContext resolved from it is disposed too,
        // never held onto beyond this single call.
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer "fixes" a captive dependency bug by changing the Singleton\'s own registration to Scoped instead, reasoning "if the Scoped dependency needs to be per-circuit, making the consuming service Scoped too solves it." Does this actually fix the underlying problem the same way IServiceScopeFactory does?',
    hint: 'Think about what changing the registration from Singleton to Scoped actually does to the CONSUMING service itself — does it still provide the same guarantees (one shared instance across the whole server/app) that made it a Singleton in the first place?',
    solution: 'This "fixes" the captive-dependency exception, but at the cost of losing whatever Singleton-specific behavior the service was originally designed to provide. Changing AuditLogger\'s own registration to Scoped means it is no longer a single shared instance for the entire server — it becomes a NEW instance per circuit, just like any other Scoped service, which may be completely inappropriate if AuditLogger was intentionally designed to hold cross-user, server-wide state (a shared in-memory buffer, a single background flush timer) that genuinely needed to exist exactly once. IServiceScopeFactory is the correct fix specifically because it lets AuditLogger REMAIN a genuine Singleton (one shared instance, server-wide) while still safely obtaining fresh, correctly-scoped dependencies on each use — the registration-lifetime change trades away the Singleton\'s own intended properties instead of solving the actual dependency-resolution problem.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A captive dependency is primarily a code-organization or architecture smell — the Singleton still gets a technically-correct, functioning Scoped instance, just one that is not ideally structured.',
      reality: 'This subtopic\'s first code example shows the failure mode is a genuine correctness bug, not just a style issue — the captured Scoped instance is permanently tied to whichever circuit was active at Singleton construction, meaning EVERY subsequent user\'s calls operate on the WRONG (frozen, unrelated) scoped data, a real cross-user data-attribution bug.'
    },
    {
      thought: 'The captive dependency problem only manifests as a visible bug in production — during local development and testing, a Singleton with a Scoped constructor dependency generally works fine and shows no obvious symptoms.',
      reality: '.NET\'s own DI container actively validates against this at Singleton construction time (when scope validation is enabled, which is the default in ASP.NET Core\'s development environment) and throws a real, documented exception ("Cannot consume scoped service from singleton") immediately — this is designed to surface the bug loudly and early, not let it silently ship to production.'
    },
    {
      thought: 'Changing a Singleton\'s own registration to Scoped is functionally equivalent to using IServiceScopeFactory to solve a captive dependency problem — both approaches result in correctly-scoped dependency resolution.',
      reality: 'This subtopic\'s exercise shows these are NOT equivalent — IServiceScopeFactory lets the consuming service REMAIN a true Singleton (one shared instance, server-wide) while still safely resolving fresh Scoped dependencies on each use; changing the registration to Scoped instead sacrifices the Singleton\'s own intended one-instance-for-the-whole-server behavior entirely, which may break functionality that genuinely depended on that guarantee.'
    }
  ];
}
