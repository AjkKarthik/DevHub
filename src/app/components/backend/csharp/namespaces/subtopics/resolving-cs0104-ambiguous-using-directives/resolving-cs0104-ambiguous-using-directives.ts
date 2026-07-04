import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-resolving-cs0104-ambiguous-using-directives-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './resolving-cs0104-ambiguous-using-directives.html',
  styleUrl: './resolving-cs0104-ambiguous-using-directives.scss',
})
export class ResolvingCs0104AmbiguousUsingDirectivesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states a resolution order rule — never shows the failure case',
      points: [
        'The main Namespaces page states: "Using directives are resolved in this order: file-local usings first, then global usings, then the containing namespace scope. Aliases always win over unaliased imports when both match." This ordering rule implies things usually resolve WITHOUT ambiguity — but it never shows the concrete case where TWO ordinary (non-aliased) usings genuinely collide, producing a real compile error the ordering rule does not save you from.',
      ],
    },
    {
      heading: 'When two using directives import a type with the same simple name — genuine ambiguity',
      points: [
        'If two DIFFERENT namespaces both export a type with the identical SIMPLE name (e.g. both <code>System.Timers</code> and <code>System.Threading</code> have a <code>Timer</code> class) and a file has plain <code>using</code> directives for BOTH namespaces, an unqualified reference to <code>Timer</code> produces <code>CS0104: \'Timer\' is an ambiguous reference between \'System.Timers.Timer\' and \'System.Threading.Timer\'</code> — a genuine compile error, not silently resolved by any ordering rule.',
        'The main page\'s "file-local wins over global" ordering rule specifically resolves conflicts BETWEEN A LOCAL AND A GLOBAL using for the SAME simple name — it does NOT resolve two ordinary, unaliased usings for DIFFERENT namespaces that BOTH happen to export a type with the same simple name. Those are two different kinds of conflict, and only the first one has an automatic winner.',
      ],
    },
    {
      heading: 'The fix — exactly the using alias mechanism the main page already covers',
      points: [
        'The correct, idiomatic fix for CS0104 is precisely the <code>using Alias = Namespace.Type;</code> pattern the main page already demonstrates for a DIFFERENT motivating example (<code>SysTask</code>/<code>MyTask</code>) — applied here to disambiguate <code>Timer</code>: <code>using TimersTimer = System.Timers.Timer;</code> and/or <code>using ThreadingTimer = System.Threading.Timer;</code>, then use the alias names instead of the bare, ambiguous <code>Timer</code>.',
        'An alternative fix — fully qualifying the type at each USE SITE (<code>System.Timers.Timer</code> instead of just <code>Timer</code>) — avoids needing an alias at all, at the cost of verbosity every time the type is referenced. This is the right choice when the ambiguous type is used only once or twice in the file; the alias approach is better when it is used repeatedly.',
      ],
    },
    {
      heading: 'A subtlety — the ambiguity only triggers if the name is actually USED unqualified',
      points: [
        'Simply having BOTH conflicting <code>using</code> directives present in a file does NOT itself produce CS0104 — the error only fires at the point where the AMBIGUOUS SIMPLE NAME is actually referenced without qualification. A file can have both <code>using System.Timers;</code> and <code>using System.Threading;</code> and compile perfectly fine, as long as nothing in that file ever writes a bare <code>Timer</code> — the conflict is lazy, triggered only by actual ambiguous usage, not by the mere presence of both usings.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The ambiguity — two unrelated namespaces, one shared simple name',
      language: 'csharp',
      code: `using System.Timers;     // exports System.Timers.Timer
using System.Threading;  // exports System.Threading.Timer

public class MonitoringService
{
    public void Start()
    {
        // COMPILE ERROR — CS0104: 'Timer' is an ambiguous reference
        // between 'System.Timers.Timer' and 'System.Threading.Timer'
        var timer = new Timer();

        // The main topic's "file-local wins over global" ordering rule
        // does NOT save you here — both usings are equally ordinary,
        // equally local, non-aliased directives. There is no automatic
        // winner between two DIFFERENT namespaces exporting the SAME
        // simple type name; this genuinely requires manual disambiguation.
    }
}`,
    },
    {
      label: 'Fix 1 — using aliases, exactly the pattern the main topic already teaches',
      language: 'csharp',
      code: `using System.Threading;

// Alias the specific one that's ambiguous — applying the EXACT SAME
// pattern the main topic demonstrates for SysTask/MyTask, just for a
// different pair of colliding types:
using TimersTimer = System.Timers.Timer;

public class MonitoringService
{
    public void Start()
    {
        // Now unambiguous — TimersTimer clearly refers to
        // System.Timers.Timer, and the bare "Timer" (if used elsewhere
        // in this file) unambiguously refers to System.Threading.Timer,
        // since it's the only ONE of the two brought in without an alias:
        var timer = new TimersTimer();
        timer.Elapsed += (s, e) => Console.WriteLine("Tick");
        timer.Interval = 1000;
        timer.Start();
    }
}`,
    },
    {
      label: 'Fix 2 — fully qualify at the use site (better for one-off usage)',
      language: 'csharp',
      code: `using System.Timers;
using System.Threading;

public class MonitoringService
{
    public void Start()
    {
        // No alias needed at all — just fully qualify the ONE reference
        // that would otherwise be ambiguous. Best when the type is used
        // only once or twice in the file, avoiding the ceremony of a
        // dedicated alias declaration for a single use:
        var timer = new System.Timers.Timer();
        timer.Elapsed += (s, e) => Console.WriteLine("Tick");
        timer.Start();
    }
}

// The lazy-triggering subtlety — this file compiles FINE even with both
// ambiguous usings present, as long as "Timer" is never referenced bare:
using System.Timers;
using System.Threading;

public class NoConflictHere
{
    // Neither using is ever exercised with the bare, ambiguous "Timer"
    // name — so CS0104 never actually fires, despite both usings being
    // present simultaneously. The conflict is triggered by USAGE, not
    // by the mere co-existence of the two using directives.
    public void DoSomethingUnrelated() => Console.WriteLine("no timers here");
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A file has <code>using System.Timers;</code> and <code>using System.Threading;</code>, and elsewhere in the SAME file there is also a LOCAL alias <code>using Timer = System.Threading.Timer;</code>. Does <code>new Timer()</code> now compile, and if so, which Timer does it refer to?',
    hint: 'Recall the main topic\'s own resolution-order rule: aliases always win over unaliased imports when both match. Think about whether this specific rule — which the main topic states applies generally — resolves THIS particular three-way situation (two ordinary usings plus one alias for the same simple name), even though it does not resolve the two-ordinary-usings-only case from the earlier examples.',
    solution: `using System.Timers;                          // ordinary, unaliased
using System.Threading;                       // ordinary, unaliased
using Timer = System.Threading.Timer;         // ALIAS — same simple name

public class Example
{
    public void Start()
    {
        // This DOES compile — and refers to System.Threading.Timer.
        var timer = new Timer();
        // "Aliases always win over unaliased imports when both match" —
        // exactly the rule the main topic states. The alias explicitly
        // names "Timer" as System.Threading.Timer, and that explicit,
        // named declaration takes precedence over the ambiguity that
        // would otherwise exist between the two ordinary usings.
    }
}

// This demonstrates the main topic's resolution-order rule ACTUALLY
// working as stated — it just doesn't apply to the two-ordinary-usings
// case from the earlier examples, because there was no alias present
// there at all to "win." The rule specifically breaks ties WHEN an
// alias is involved; it has nothing to say about two equally-ordinary,
// non-aliased usings colliding — that case has no automatic winner and
// requires the manual fixes (Fix 1 or Fix 2) from this subtopic instead.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main topic\'s "file-local usings win over global usings, aliases win over unaliased imports" resolution rule prevents ALL possible using-directive ambiguity.',
      reality: 'that rule only resolves conflicts where an alias is involved, or where a local and global using target the same simple name — it does NOT resolve two ordinary, unaliased using directives for two entirely different namespaces that both happen to export a type with the same simple name; that case is a genuine CS0104 compile error requiring manual disambiguation.',
    },
    {
      thought: 'simply having two using directives present that COULD collide (e.g. System.Timers and System.Threading, both exporting a Timer type) is itself a compile error.',
      reality: 'the ambiguity is triggered lazily, only at the point where the ambiguous simple name is actually referenced unqualified — a file can have both conflicting usings present and compile perfectly fine as long as the ambiguous name is never used bare.',
    },
    {
      thought: 'resolving a CS0104 ambiguity always requires declaring a dedicated using alias.',
      reality: 'fully qualifying the type at its use site (e.g. System.Timers.Timer instead of just Timer) is an equally valid, alias-free fix — often preferable when the ambiguous type is referenced only once or twice in the file, avoiding the ceremony of a dedicated alias declaration.',
    },
  ];
}
