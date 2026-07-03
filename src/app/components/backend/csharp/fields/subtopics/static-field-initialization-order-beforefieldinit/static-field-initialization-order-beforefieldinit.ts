import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-static-field-initialization-order-beforefieldinit-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './static-field-initialization-order-beforefieldinit.html',
  styleUrl: './static-field-initialization-order-beforefieldinit.scss',
})
export class StaticFieldInitializationOrderBeforefieldinitSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows WITHIN-class order — never ACROSS-class order',
      points: [
        'The main Fields page\'s <code>static readonly EpochStart</code> example shows static fields initialized "once at startup" — implying a simple, predictable moment. Within a SINGLE class, static field initializers genuinely do run in declaration order, top to bottom, before any static constructor body. But the main page never addresses what happens when static fields in DIFFERENT classes reference each other — that timing is a completely different, much less obvious story.',
      ],
    },
    {
      heading: 'Cross-type static initialization is lazy, not eager, by default',
      points: [
        'A type\'s static fields and static constructor do NOT run when the assembly loads or when a class is merely referenced — they run the first time the type is actually USED (the first static member access, or the first instance is constructed). This is true even if a static field in Type A references a static field in Type B — Type B\'s initialization is triggered on-demand, at whatever moment Type A first touches it.',
        'This means the ORDER in which two unrelated types\' static state gets initialized depends on the ORDER your program happens to first use each type — not on their declaration order in source, not on file order, not on any global startup order. Code that assumes a fixed order for two independent types\' static initialization is relying on undefined behavior.',
      ],
    },
    {
      heading: 'BeforeFieldInit — an even looser guarantee for common cases',
      points: [
        'When a type has NO explicit static constructor (just static field initializers, no <code>static ClassName() { ... }</code> block), the compiler marks the type <code>beforefieldinit</code> in metadata — this tells the CLR it may initialize the type\'s static fields ANY TIME BEFORE the first static field/method access, not necessarily exactly at that first access. In practice this often means JIT compilation can trigger it earlier than you might expect, based on optimization decisions.',
        'Adding an EXPLICIT static constructor removes <code>beforefieldinit</code> and forces the CLR to a stricter guarantee: static initialization happens EXACTLY at first use, no earlier. This is a genuine, sometimes-surprising behavior difference between a type with only field initializers versus one with an explicit (even empty-bodied) static constructor.',
      ],
    },
    {
      heading: 'The classic bug — a static field initializer that depends on another type\'s NOT-YET-RUN static state',
      points: [
        'If <code>ClassA</code>\'s static field initializer reads <code>ClassB.SomeStaticField</code>, and this is the FIRST thing that touches <code>ClassB</code> at all, then <code>ClassB</code>\'s own static initialization runs (recursively) before <code>ClassA</code>\'s field gets its value — usually fine. But if <code>ClassB</code>\'s static initializer ALSO happens to reference <code>ClassA</code> (a circular static dependency), the CLR detects it is already in the middle of initializing one of the types and does NOT re-enter — the circularly-referenced type\'s fields are observed in their PARTIALLY initialized (often default/zero) state at that specific point, silently, with no exception.',
        'This circular-static-dependency trap is genuinely hard to detect from reading either class in isolation — it only shows up when tracing the actual first-use call chain across both types, which is exactly why it is a real, if uncommon, production bug category rather than a purely academic curiosity.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Within one class — declaration order (this part IS predictable)',
      language: 'csharp',
      code: `public class Configuration
{
    // Static field initializers run top-to-bottom, in declaration order,
    // exactly as the main topic's EpochStart example implies:
    public static readonly int Base = 10;
    public static readonly int Doubled = Base * 2; // reads Base — ALREADY 10 by this point

    static Configuration()
    {
        Console.WriteLine($"Base={Base}, Doubled={Doubled}"); // Base=10, Doubled=20
    }
}

Console.WriteLine(Configuration.Doubled); // triggers static init on first access: 20`,
    },
    {
      label: 'Across classes — order depends on first USE, not declaration',
      language: 'csharp',
      code: `public class ServiceA
{
    // References ServiceB — this triggers ServiceB's static init the
    // FIRST time ServiceA itself is used, wherever that happens to be:
    public static readonly string Combined = "A+" + ServiceB.Name;
}

public class ServiceB
{
    public static readonly string Name = "B";
}

// Nothing has run yet — no static constructors have executed
Console.WriteLine("Program started");

// FIRST use of ServiceA triggers ServiceA's static init, which reads
// ServiceB.Name — which in turn triggers ServiceB's static init RIGHT
// THEN, recursively, before ServiceA's field finishes initializing:
Console.WriteLine(ServiceA.Combined); // "A+B" — correct, but the ORDER
// (ServiceB initialized DURING ServiceA's init, not before or after) is
// determined entirely by which type your code happens to touch first —
// swap which class the program references first and the whole sequence
// of "who initializes when" changes, even though the final VALUE here
// happens to still be correct in this particular non-circular case.`,
    },
    {
      label: 'The circular trap — silently observing a default value, no exception',
      language: 'csharp',
      code: `public class Left
{
    // References Right.Value during Left's own static init:
    public static readonly int FromRight = Right.Value;
}

public class Right
{
    // References Left.FromRight during Right's own static init —
    // a CIRCULAR static dependency between the two types:
    public static readonly int Value = 42;
    public static readonly int FromLeft = Left.FromRight;
}

// Whichever type is touched FIRST determines what happens:
Console.WriteLine(Left.FromRight);
// Triggers Left's static init → reads Right.Value → triggers Right's
// static init → Right's init reads Left.FromRight AGAIN, but Left is
// ALREADY in the middle of initializing (the CLR does not re-enter) —
// so Right.FromLeft observes Left.FromRight in its DEFAULT state (0),
// not its final value. No exception is thrown. This silently produces:
Console.WriteLine(Right.FromLeft); // 0 — NOT the "expected" value,
// because of the circular dependency's partial-initialization snapshot.

// This is genuinely hard to spot by reading either class alone — it only
// appears when tracing the actual cross-type initialization call chain.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In the circular-trap example, if the program had instead FIRST accessed <code>Right.Value</code> (instead of <code>Left.FromRight</code>) before anything else touched either class, would <code>Right.FromLeft</code> still end up as 0? Reason through the initialization chain.',
    hint: 'Trace which type starts initializing FIRST in this alternate scenario, and think about whether Right\'s OWN static initializer (which reads Left.FromRight) runs before or after Right.Value is actually set — remember that within ONE class, field initializers run top-to-bottom in declaration order, and Value is declared BEFORE FromLeft in the Right class.',
    solution: `// Accessing Right.Value first triggers Right's static init to begin.
// Right's field initializers run in DECLARATION ORDER:
//   1. Value = 42                       — runs first, sets Value to 42
//   2. FromLeft = Left.FromRight         — runs second, triggers Left's init

// Left's static init then runs (freshly, not yet started):
//   FromRight = Right.Value
// At THIS point, is Right "already initializing" (blocking re-entry)?
// Yes — Right is still in the middle of its own static constructor
// (it's on step 2, FromLeft, when it triggers Left). So Left's read of
// Right.Value does NOT re-enter Right's initializer — but Right.Value
// was ALREADY assigned in step 1, BEFORE Left was ever triggered.
// So Left.FromRight correctly observes 42 this time!

Console.WriteLine(Right.Value);     // triggers the chain
// Right.Value = 42                 (step 1, done first)
// -> Right.FromLeft triggers Left.FromRight
//    -> Left.FromRight = Right.Value = 42 (Right.Value already set!)
// -> Right.FromLeft = Left.FromRight = 42

Console.WriteLine(Right.FromLeft);  // 42 — correct this time!
Console.WriteLine(Left.FromRight);  // 42 — also correct

// The outcome flips entirely depending on WHICH declaration order and
// WHICH type is touched first — proving the original example's "0" was
// not an inherent property of the classes themselves, but an artifact of
// which field within Right happened to be read before the circular
// dependency was triggered. This is exactly why circular static
// dependencies are so treacherous: the same code can behave differently
// based purely on program entry order.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'static field initialization across different classes happens in a predictable, fixed order — the same way field initializers within a single class run top-to-bottom.',
      reality: 'cross-type static initialization is lazy and triggered by first use — the order two independent types initialize in depends entirely on which type your program happens to touch first, which can vary between runs or entry points.',
    },
    {
      thought: 'a type with only static field initializers (no explicit static constructor) initializes at exactly the same moment as one with an explicit static constructor.',
      reality: 'a type with no explicit static constructor is marked beforefieldinit, giving the CLR permission to initialize its static fields any time before first use — sometimes earlier than expected. Adding an explicit static constructor removes this flexibility and forces initialization to happen exactly at first use.',
    },
    {
      thought: 'a circular dependency between two types\' static field initializers will throw an exception or deadlock, making the bug obvious immediately.',
      reality: 'the CLR does not re-enter a type that is already in the middle of static initialization — it simply proceeds with that type\'s CURRENT (possibly still-default/zero) field values, silently, with no exception at all. This makes circular static dependencies a genuinely hard-to-detect bug rather than a hard failure.',
    },
  ];
}
