import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-modern-partial-methods-return-types-mandatory-implementation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './modern-partial-methods-return-types-mandatory-implementation.html',
  styleUrl: './modern-partial-methods-return-types-mandatory-implementation.scss',
})
export class ModernPartialMethodsReturnTypesMandatoryImplementationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s partial method example is deliberately the SIMPLE case',
      points: [
        'The main Static, Partial & Enums page\'s <code>partial void OnStatusChanged(OrderStatus newStatus);</code> example is a <code>void</code>, parameterless-of-return-value partial method — the ORIGINAL (C# 1–8) restriction on partial methods required exactly this shape: <code>void</code> return, implicitly <code>private</code>, no <code>out</code> parameters. The main page states the return-type rule ("if the method has a return type... it must have an implementation") but never shows what a MODERN partial method with a real return type actually looks like.',
      ],
    },
    {
      heading: 'C# 9 lifted the restrictions — any accessibility, any return type',
      points: [
        'Starting in C# 9, partial methods can have ANY accessibility modifier (<code>public</code>, <code>internal</code>, not just implicitly <code>private</code>), ANY return type (not just <code>void</code>), and <code>out</code> parameters — this relaxation exists specifically to support SOURCE GENERATORS, a major C# 9+ feature that needs to declare a method signature in generated code and have the DEVELOPER (or another generator) provide the actual implementation.',
        'This is a genuinely different use case than the main page\'s "optional hook that might be silently removed" framing — modern partial methods with real return types are used when the generator-declared HALF absolutely needs a value back, making the split into "declaring" and "implementing" halves a two-way collaboration rather than an optional notification.',
      ],
    },
    {
      heading: 'The trade-off — a return type makes the implementation MANDATORY, not optional',
      points: [
        'The main page\'s own "zero runtime cost" framing (declaration AND all call sites silently erased if no implementation exists) applies ONLY to the ORIGINAL void/parameterless-of-out shape. The moment a partial method declares a REAL return type, the compiler CANNOT safely erase it — there is no sensible default value to substitute at call sites that read the return value, so an implementation becomes a hard requirement: <code>CS8795</code> ("partial method must have an implementation part because it has accessibility modifiers other than private" — or a similar diagnostic depending on exactly which modern feature is in play) if the implementing half is missing.',
        'This is the core trade-off to understand: the OLD partial method shape trades away a return value for true optionality (silent removal); the NEW shape trades away optionality for the ability to return real values — you cannot have both in the same declaration.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main topic\'s shape — void, optional, silently erasable',
      language: 'csharp',
      code: `// Exactly the main topic's own example — the ORIGINAL (pre-C#9) shape:
public partial class Order
{
    public void Ship()
    {
        Status = OrderStatus.Shipped;
        OnStatusChanged(OrderStatus.Shipped); // call site — erased if
                                                // no implementation exists
    }

    // Declared here — implicitly private, void, no out params:
    partial void OnStatusChanged(OrderStatus newStatus);
}

// If NO other file provides "partial void OnStatusChanged(...) { ... }",
// the compiler silently REMOVES both this declaration AND the call site
// above — zero runtime cost, completely optional. This is the shape the
// main topic covers, and it works precisely BECAUSE void + implicit
// private + no out params gives the compiler a safe erasure story.`,
    },
    {
      label: 'The modern shape (C# 9+) — a return type makes implementation mandatory',
      language: 'csharp',
      code: `// File 1 — declares the partial method with a REAL return type,
// exactly the shape source generators commonly use:
public partial class OrderValidator
{
    public bool Validate(Order order)
    {
        // A real bool comes back — there is no safe "erase this and
        // pretend it returned true/false" default the compiler could
        // silently substitute, unlike the void case above:
        if (!IsValidCustomFn(order)) return false;
        return order.Lines.Count > 0;
    }

    // Declares a partial method with 'public' accessibility AND a real
    // return type — both features requiring C# 9+:
    public partial bool IsValidCustomFn(Order order);
}

// File 2 — the implementation is now MANDATORY, not optional:
public partial class OrderValidator
{
    public partial bool IsValidCustomFn(Order order)
        => order.CustomerEmail.Contains('@');
}

// If File 2's implementation were OMITTED entirely, this would be a
// COMPILE ERROR (a partial-method-specific diagnostic, exact code
// varies by exact modifier combination) — NOT a silent removal. The
// return type removes the compiler's ability to safely erase the call.`,
    },
    {
      label: 'Why source generators specifically need this shape',
      language: 'csharp',
      code: `// A realistic source-generator-driven pattern — the GENERATED half
// declares the contract; YOUR hand-written half provides real logic:

// GeneratedRepository.g.cs — produced by a source generator, NOT hand-edited:
public partial class UserRepository
{
    // The generator KNOWS it needs a real connection string back — there
    // is no sensible default to silently substitute, so it declares this
    // as a mandatory partial method for YOU to implement:
    public partial string GetConnectionString();

    public async Task<User?> FindByIdAsync(int id)
    {
        var connectionString = GetConnectionString(); // MUST have a real value
        // ... uses connectionString to query the database ...
        return null; // simplified
    }
}

// UserRepository.cs — YOUR hand-written file, providing the mandatory
// implementation the generator's declared contract requires:
public partial class UserRepository
{
    public partial string GetConnectionString()
        => Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
           ?? throw new InvalidOperationException("Connection string not configured");
}

// If you forget to write this implementation anywhere in the partial
// class's other files, the build fails immediately — a MUCH earlier and
// clearer signal than a silently-erased void hook would ever give you,
// which is exactly the point: a generator NEEDS to know its contract is
// actually being fulfilled, not silently optional.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Would <code>public partial bool IsValidCustomFn(Order order);</code> (declared public, with a bool return type) compile successfully if you simply never provided ANY implementing partial declaration anywhere in the project — the same way the main topic\'s void OnStatusChanged silently disappears when unimplemented?',
    hint: 'Recall the core trade-off from the theory: the ORIGINAL void/implicit-private/no-out-params shape is the ONLY shape the compiler can safely erase, because there is a sensible "nothing happens" default. Think about whether the compiler has ANY sensible default value it could invent for a method that returns a genuine bool to its caller, and what happens to Validate() and its "if (!IsValidCustomFn(order)) return false;" line if the method simply vanished.',
    solution: `// No — this would be a COMPILE ERROR, not a silent removal. The bool
// return type removes any possibility of safe erasure, because:

// 1. Validate() genuinely READS the return value of IsValidCustomFn
//    ("if (!IsValidCustomFn(order)) return false;") — if the method
//    were silently erased, this line would have nothing to call, which
//    is not something the compiler can quietly patch around (unlike a
//    void call, which can simply become "no-op" if erased).

// 2. There is no universally "safe" default value for an arbitrary bool
//    return (true? false? it depends entirely on what the method was
//    SUPPOSED to validate) — unlike void, where "do nothing" is always
//    a safe, meaning-preserving default.

// The actual compiler behavior: declaring a partial method with a
// non-void return type (or public/internal accessibility, or out
// parameters) WITHOUT providing a matching implementing declaration
// somewhere in the partial type produces a compile error — typically
// something like "partial method must have an implementation part
// because it has accessibility modifiers" or "partial method X must
// have an implementation part" depending on exactly which modern
// feature triggered the requirement. The build simply does not succeed
// until an implementation is provided — exactly the "mandatory, not
// optional" trade-off the theory describes.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ALL partial methods in C# are optional to implement — if you don\'t provide a body, the compiler silently removes the declaration and its call sites, regardless of the method\'s signature.',
      reality: 'this silent-removal behavior applies ONLY to the original C# 1-8 partial method shape (void return, implicit private, no out parameters) — modern partial methods (C# 9+) with a real return type, explicit accessibility, or out parameters REQUIRE an implementation; omitting one is a compile error, not silent erasure.',
    },
    {
      thought: 'the relaxed C# 9+ partial method rules (any accessibility, any return type) are just a convenience feature with no particular motivating use case.',
      reality: 'this relaxation exists specifically to support source generators — a generator needs to declare a method contract in generated code and have the developer (or another generator) provide a REAL implementation with a genuine return value, which the original void-only, silently-erasable shape could never support.',
    },
    {
      thought: 'you can mix and match — declare a partial method with a return type but still rely on the compiler to silently erase it if no implementation shows up, the same way void partial methods work.',
      reality: 'a return type and silent erasability are mutually exclusive in partial methods — the moment a partial method has a real return type (or public/internal accessibility, or out parameters), the compiler treats the implementation as mandatory, since there is no safe default value it could invent for callers reading that return value.',
    },
  ];
}
