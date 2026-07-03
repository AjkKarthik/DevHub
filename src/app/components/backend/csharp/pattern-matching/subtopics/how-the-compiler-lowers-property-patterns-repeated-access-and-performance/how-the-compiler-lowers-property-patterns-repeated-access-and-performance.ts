import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-how-the-compiler-lowers-property-patterns-repeated-access-and-performance-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-the-compiler-lowers-property-patterns-repeated-access-and-performance.html',
  styleUrl: './how-the-compiler-lowers-property-patterns-repeated-access-and-performance.scss',
})
export class HowTheCompilerLowersPropertyPatternsRepeatedAccessAndPerformanceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows the syntax, never the generated code underneath',
      points: [
        'The main Pattern Matching page demonstrates property patterns extensively — <code>obj is Order { Status: OrderStatus.Shipped, Items.Count: > 0 }</code> — but never shows what the compiler actually LOWERS this to. Understanding the lowering explains two things the main page leaves as black boxes: why a switch expression with many overlapping property checks isn\'t as slow as it looks, and why patterns evaluate a given property access only ONCE even when several arms test the same property.',
      ],
    },
    {
      heading: 'Property access is cached, not repeated, across pattern tests',
      points: [
        'A property pattern like <code>{ Status: OrderStatus.Shipped, Items.Count: > 0 }</code> lowers roughly to reading <code>obj.Status</code> into a temporary local ONCE and comparing that local, rather than calling the <code>Status</code> getter multiple times for each sub-check. This matters for properties with real work behind them (a computed property, a property backed by a database call in a poorly-designed API) — the pattern only pays that cost once per pattern test, not once per condition inside it.',
        'Across MULTIPLE ARMS of the same switch expression, though, each arm\'s pattern is evaluated independently top-to-bottom (exactly as the main page\'s "arm order" Common Mistake describes) — so a property that appears in three different arms IS re-read once per arm actually reached, not cached ACROSS arms. Understanding this distinction — cached WITHIN one pattern, re-evaluated ACROSS arms — explains real performance behavior that pure syntax reading does not reveal.',
      ],
    },
    {
      heading: 'The compiler builds a decision structure, not a naive if-else chain',
      points: [
        'For simple discriminated patterns (type patterns, constant patterns on the same discriminant), the C# compiler can generate more efficient dispatch than a literal top-to-bottom re-test of every arm\'s full condition — for instance, grouping arms that share a leading type-check so the type test itself happens only once per group, then only running each group\'s finer sub-conditions if the type check already passed.',
        'This optimization is an implementation detail, not a language guarantee — the visible, GUARANTEED behavior remains "arms are evaluated in source order, first match wins" (exactly as the main page states for the arm-ordering Common Mistake). The compiler is free to implement that observable behavior efficiently underneath, but code should never be written assuming a SPECIFIC lowering strategy — only the observable first-match-wins semantics.',
      ],
    },
    {
      heading: 'Practical takeaway — patterns are not meaningfully slower than hand-written checks',
      points: [
        'A common (and reasonable) worry is that a large property pattern is secretly a chain of expensive repeated reflection or repeated getter calls — in practice it lowers to ordinary field/property reads and comparisons, the same IL shape a hand-written <code>if</code> chain with local variables would produce. The main benefit of pattern matching remains READABILITY and COMPILER-VERIFIED EXHAUSTIVENESS (from the main page), not a meaningfully different runtime cost from equivalent hand-written code.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A property pattern with a property that has real work behind it',
      language: 'csharp',
      code: `public class Order
{
    private int _computeCount;

    // A property with observable side effects — used here purely to make the
    // "how many times is this actually read?" question observable in a demo.
    public int Status
    {
        get
        {
            _computeCount++;
            return 200; // pretend this does real computed work
        }
    }

    public int ComputeCount => _computeCount;
}

var order = new Order();

// Multiple sub-conditions reference "Status" conceptually, but there is only
// ONE property pattern being tested here — Status is only read ONCE:
bool isHandled = order is { Status: 200 } or { Status: 404 };

Console.WriteLine(order.ComputeCount);
// 1 (or 2, depending on how "or" is lowered — but never once-per-textual-mention;
// the point is it is NOT re-evaluated for every relational sub-check within a
// single pattern the way naive repeated getter calls would be)`,
    },
    {
      label: 'Across DIFFERENT arms, the same property genuinely IS re-read',
      language: 'csharp',
      code: `public class Order
{
    private int _computeCount;
    public int Status { get { _computeCount++; return 200; } }
    public int ComputeCount => _computeCount;
}

static string Describe(Order o) => o switch
{
    { Status: 100 } => "Arm 1",   // reads Status — arm doesn't match, tries next
    { Status: 200 } => "Arm 2",   // reads Status AGAIN — this is a NEW arm
    { Status: 300 } => "Arm 3",
    _                => "Unknown",
};

var order = new Order();
Console.WriteLine(Describe(order));       // "Arm 2"
Console.WriteLine(order.ComputeCount);    // 2 — Status was read once per
// arm actually evaluated (Arm 1's test, then Arm 2's test) — NOT cached
// across the whole switch expression, unlike within a single arm's pattern.
// This is exactly why the main topic's "specific arms before general arms"
// Common Mistake matters for performance too, not just correctness — arms
// placed earlier are tested (and any properties they reference are read)
// before later arms are even considered.`,
    },
    {
      label: 'Equivalent hand-written code — the same shape, once you see it',
      language: 'csharp',
      code: `// What a switch expression like the one above is conceptually equivalent
// to, once lowered — this is roughly the "if chain with a cached local" shape
// pattern matching produces, NOT repeated reflection or repeated boxing:
static string DescribeManually(Order o)
{
    var status = o.Status; // read once per arm actually tested, same as above
    if (status == 100) return "Arm 1";

    status = o.Status; // a hand-written equivalent would ALSO re-read here
    if (status == 200) return "Arm 2";

    status = o.Status;
    if (status == 300) return "Arm 3";

    return "Unknown";
}

// The takeaway: pattern matching is not secretly slower than the equivalent
// hand-written dispatch code — it produces essentially the same reads and
// comparisons, just expressed far more concisely and with compiler-verified
// exhaustiveness on sealed hierarchies, which the hand-written version gets
// none of.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given <code>obj is { A: > 0, B: > 0, C: > 0 }</code> where <code>A</code>, <code>B</code>, and <code>C</code> are three DIFFERENT properties (not the same property three times), how many total property reads happen if the pattern fails on the very first sub-check (A is not > 0)? Does the compiler still read B and C?',
    hint: 'Property patterns test sub-conditions in order and short-circuit — much like && does for boolean expressions. If the first condition (A > 0) already fails, there is no need to even evaluate B or C, because the whole pattern cannot possibly match regardless of what they are.',
    solution: `// Property patterns short-circuit sub-condition evaluation, just like &&:
// if an earlier sub-condition already fails, later sub-conditions (and the
// property reads behind them) are never evaluated at all.

public class Widget
{
    public int A { get; init; }
    public int ReadCountB { get; private set; }
    private int _b;
    public int B { get { ReadCountB++; return _b; } init => _b = value; }
    public int C { get; init; }
}

var widget = new Widget { A = -5, B = 10, C = 10 }; // A fails immediately

bool matches = widget is { A: > 0, B: > 0, C: > 0 };

Console.WriteLine(matches);            // False
Console.WriteLine(widget.ReadCountB);  // 0 — B's getter was NEVER called,
// because A > 0 already failed and there was no need to check further.
// This mirrors short-circuit && evaluation exactly — sub-conditions are
// tested left-to-right and stop at the first failure.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a property pattern with several sub-conditions on the same property re-reads that property once for every sub-condition, making complex patterns secretly expensive.',
      reality: 'within a single pattern test, a given property is read once into a temporary and reused for every sub-condition against it — the compiler does not re-invoke the getter for each textual mention of the same property inside one pattern.',
    },
    {
      thought: 'a property referenced across multiple different switch arms is cached once for the whole switch expression, the same way it is cached within a single arm.',
      reality: 'caching only happens WITHIN one arm\'s pattern test — across different arms, each arm is evaluated independently top-to-bottom, and any property it references is genuinely re-read for that arm if reached, exactly mirroring the main topic\'s arm-ordering guidance.',
    },
    {
      thought: 'pattern matching is meaningfully slower than a hand-written if/else chain because of some hidden reflection or dynamic dispatch cost.',
      reality: 'a property pattern lowers to ordinary field/property reads, local variable caching, and comparisons — essentially the same IL shape a careful hand-written if/else chain with cached locals would produce. The main practical benefits are readability and compiler-verified exhaustiveness, not a different runtime cost.',
    },
  ];
}
