import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-how-sealed-enables-devirtualization-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-sealed-enables-devirtualization.html',
  styleUrl: './how-sealed-enables-devirtualization.scss',
})
export class HowSealedEnablesDevirtualizationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the performance claim — never explains the mechanism',
      points: [
        'The main Inheritance page mentions, twice, that "the JIT can de-virtualise calls on sealed types" as a secondary benefit of <code>sealed</code> — but never explains WHAT devirtualization actually means mechanically, or why sealing is what makes it possible.',
      ],
    },
    {
      heading: 'Why virtual calls are slower than direct calls in the first place',
      points: [
        'An ordinary virtual method call requires the CLR to look up the object\'s ACTUAL runtime type at the call site, find that type\'s vtable (virtual method table), and jump to whatever method pointer sits at that slot — an extra indirection compared to a normal (non-virtual) call, which jumps to a single, statically known address baked in at compile time.',
        'This indirection exists specifically to support polymorphism — the whole POINT of <code>virtual</code>/<code>override</code> from the main page\'s own theory is that the correct override is chosen at runtime based on the object\'s actual type, which requires this extra lookup step by definition.',
      ],
    },
    {
      heading: 'Sealing removes the POSSIBILITY of multiple overrides — collapsing the indirection',
      points: [
        'If a class is <code>sealed</code> (or a specific override is marked <code>sealed override</code>), the JIT can PROVE, at compile/JIT time, that there is only ONE possible implementation that could ever run for a call on that exact type — no further derived class can exist to provide a different override. When the JIT can prove this, it can skip the vtable lookup entirely and emit a direct call (or even INLINE the method body directly at the call site) — exactly as if the method had never been virtual at all.',
        'This is why sealing is described as enabling devirtualization rather than BEING devirtualization directly — sealing itself only REMOVES the possibility of further overrides; it is the JIT\'s own optimizer that takes advantage of that guarantee to actually skip the indirection. Not every JIT/runtime version performs this optimization equally aggressively — it is a genuine but not universally guaranteed win.',
      ],
    },
    {
      heading: 'This applies to sealed CLASSES and sealed OVERRIDES for the same underlying reason',
      points: [
        'A <code>sealed class</code> guarantees NO further derived class can exist at all — every virtual member on it is automatically eligible for this optimization, since there is only ever one possible implementation reachable through any reference to that exact type.',
        'A <code>sealed override</code> on a NON-sealed class provides the SAME guarantee for that ONE specific member only — even though the class itself could still be further subclassed, THIS particular member can never be re-overridden further down, so the JIT can still devirtualize calls to it specifically, while other (non-sealed) virtual members on the same class remain fully virtual.',
      ],
    },
    {
      heading: 'A genuinely measurable effect — but a secondary one, not the primary reason to seal',
      points: [
        'This performance benefit is real and measurable in sufficiently hot loops (millions of calls), using a tool like BenchmarkDotNet to compare a sealed vs. non-sealed hierarchy performing the identical virtual call pattern. But per the main page\'s own framing, sealing should be chosen PRIMARILY as a correctness tool (preventing subclassing that would break invariants) — the performance angle is a genuine but secondary bonus, not a reason to seal classes that otherwise have no correctness justification for sealing.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The setup — identical virtual call pattern, sealed vs non-sealed',
      language: 'csharp',
      code: `// Non-sealed hierarchy — the JIT cannot prove no further override exists
public class Shape
{
    public virtual double Area() => 0;
}

public class Circle : Shape
{
    public double Radius { get; init; }
    public override double Area() => Math.PI * Radius * Radius;
    // Circle is NOT sealed — in principle, someone could write
    // "class SpecialCircle : Circle { public override double Area() ... }"
    // in another assembly loaded later, so the JIT must keep the vtable
    // lookup in place for calls through a Shape or Circle reference.
}

// Sealed hierarchy — the JIT CAN prove no further override is possible
public sealed class SealedCircle
{
    public double Radius { get; init; }
    public double Area() => Math.PI * Radius * Radius;
    // No inheritance possible at all — this method was never even
    // virtual to begin with, since sealing the class removes any
    // reason to make members virtual in the first place.
}`,
    },
    {
      label: 'sealed override on an otherwise-unsealed class — the finer-grained case',
      language: 'csharp',
      code: `public abstract class PaymentProcessor
{
    public abstract Task ProcessAsync(decimal amount);

    // sealed override — this SPECIFIC method can never be re-overridden
    // further down, even though PaymentProcessor itself is NOT sealed and
    // CAN still be subclassed for OTHER members:
    public virtual bool ValidateAmount(decimal amount) => amount > 0;
}

public class StripeProcessor : PaymentProcessor
{
    public override async Task ProcessAsync(decimal amount)
    {
        if (!ValidateAmount(amount)) throw new ArgumentException("Invalid amount");
        await CallStripeApiAsync(amount);
    }

    // Sealing THIS override specifically — no further subclass of
    // StripeProcessor can change validation logic, even though
    // StripeProcessor itself remains open to further derivation for
    // OTHER members (like adding new payment methods):
    public sealed override bool ValidateAmount(decimal amount)
        => amount > 0 && amount < 1_000_000m;

    private Task CallStripeApiAsync(decimal amount) => Task.CompletedTask;
}

// A call to processor.ValidateAmount(x) where the STATIC type is known
// to be StripeProcessor (or any type where THIS specific override is
// the final one in the chain) is eligible for devirtualization — even
// though ProcessAsync (still just "override", not "sealed override")
// on the SAME class remains fully virtual and NOT devirtualized.`,
    },
    {
      label: 'Measuring it — BenchmarkDotNet comparing virtual vs devirtualized calls',
      language: 'csharp',
      code: `using BenchmarkDotNet.Attributes;

public class Shape { public virtual double Area() => 0; }
public class Circle : Shape
{
    public double Radius { get; init; } = 1;
    public override double Area() => Math.PI * Radius * Radius;
}

public sealed class SealedCircle
{
    public double Radius { get; init; } = 1;
    public double Area() => Math.PI * Radius * Radius;
}

[MemoryDiagnoser]
public class DevirtualizationBenchmark
{
    private readonly Shape _virtualCircle = new Circle { Radius = 5 };
    private readonly SealedCircle _sealedCircle = new() { Radius = 5 };

    [Benchmark(Baseline = true)]
    public double VirtualCall()
    {
        double total = 0;
        for (var i = 0; i < 10_000_000; i++)
            total += _virtualCircle.Area(); // vtable lookup, every call
        return total;
    }

    [Benchmark]
    public double DevirtualizedCall()
    {
        double total = 0;
        for (var i = 0; i < 10_000_000; i++)
            total += _sealedCircle.Area(); // direct call — no vtable lookup
        return total;
    }
}

// Running this typically shows DevirtualizedCall measurably faster —
// the exact margin depends on JIT version and hardware, but the effect
// is real and reproducible at this scale (10 million calls). At smaller
// scales (hundreds or thousands of calls), the difference is usually
// negligible — this optimization matters specifically in hot loops.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A colleague argues: "Since sealed enables devirtualization, we should mark every class sealed by default for performance, and only remove sealed when we actually need to subclass something." Push back on this reasoning using the main topic\'s own stated priorities for when to use sealed.',
    hint: 'Recall the main topic\'s own framing of sealed: "Sealing is a correctness tool — use it when subclassing would break invariants... a secondary performance benefit." Think about what "sealed by default" does to a library\'s consumers and testability (e.g. mocking frameworks that need to subclass/proxy types), versus the actual, usually negligible, performance gain outside genuinely hot loops.',
    solution: `// The main topic explicitly frames sealed as PRIMARILY a correctness
// tool, with the JIT devirtualization benefit as SECONDARY. "Seal
// everything by default for performance" inverts this priority
// incorrectly, for several concrete reasons:

// 1. The performance benefit is usually negligible outside genuinely
//    hot loops (millions of calls) — for the vast majority of ordinary
//    application code, the vtable lookup cost is immaterial compared to
//    the actual work being done inside the method.

// 2. Sealing by default breaks legitimate, INTENDED extensibility —
//    library consumers who genuinely need to subclass a type (for a
//    valid "is-a" specialization) are blocked entirely, forcing them
//    into composition workarounds even when inheritance was the
//    natural, correct fit.

// 3. Many mocking/testing frameworks (older Moq versions without
//    DynamicProxy improvements, some AOP libraries) rely on subclassing
//    or dynamic proxy generation to create test doubles for a type —
//    sealing a class can silently make it un-mockable via those specific
//    techniques, forcing awkward interface-based indirection purely to
//    restore testability that inheritance-based mocking would have
//    provided for free.

// The correct heuristic, matching the main topic's own stated priority:
// seal a class when you have identified a GENUINE correctness reason
// (the class's invariants would break under subclassing, or its
// behavior is only meaningful as implemented) — then take the
// devirtualization benefit as a welcome side effect in hot paths, not
// as the primary justification for sealing broadly.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'sealing a class directly causes the JIT to skip vtable lookups — sealed itself performs the devirtualization.',
      reality: 'sealed only removes the POSSIBILITY of further overrides existing — it is the JIT\'s own optimizer that takes advantage of this guarantee to skip the vtable lookup and emit a direct call. The language feature and the runtime optimization are two separate things working together.',
    },
    {
      thought: 'devirtualization only applies to fully sealed classes — a sealed override on an otherwise-unsealed class gets no benefit.',
      reality: 'a sealed override provides the SAME devirtualization eligibility for that ONE specific member, even on a class that remains open to further subclassing for its other members — the guarantee is per-member, not only per-class.',
    },
    {
      thought: 'since devirtualization is a real, measurable performance benefit, classes should be sealed by default unless subclassing is specifically needed.',
      reality: 'the main topic itself frames sealed as primarily a correctness tool — the performance benefit is usually negligible outside genuinely hot loops, and sealing by default can block legitimate extensibility and interfere with subclass-based mocking/testing frameworks.',
    },
  ];
}
