import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-in-parameter-defensive-copy-trap-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './in-parameter-defensive-copy-trap.html',
  styleUrl: './in-parameter-defensive-copy-trap.scss',
})
export class InParameterDefensiveCopyTrapSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s in example works — because it uses a readonly struct',
      points: [
        'The main Methods page demonstrates <code>in BigPoint p</code> where <code>BigPoint</code> is declared <code>readonly struct</code> — avoiding a copy of the 32-byte struct. This example is correct, but it quietly relies on a precondition it never states: <code>in</code> only avoids the copy when the struct type ITSELF is declared <code>readonly</code>.',
      ],
    },
    {
      heading: 'Why the compiler needs a defensive copy for a NON-readonly struct',
      points: [
        'The whole point of <code>in</code> is a promise: the method will not mutate the passed struct. But if the struct is NOT declared <code>readonly</code>, the compiler cannot verify at compile time that calling one of the struct\'s own INSTANCE METHODS won\'t mutate its fields — because ordinary struct methods are allowed to mutate <code>this</code>.',
        'To keep the <code>in</code> promise safe in this case, the compiler silently makes a DEFENSIVE COPY of the struct before calling any instance method on it through the <code>in</code> parameter — completely negating the performance benefit <code>in</code> was meant to provide, while still compiling successfully and behaving correctly. The optimization silently disappears with no warning.',
      ],
    },
    {
      heading: 'This happens per METHOD CALL, not just once — a hidden, repeated cost',
      points: [
        'The defensive copy is not a one-time cost at the call boundary — it happens EVERY TIME an instance method is invoked on the <code>in</code> parameter inside the method body, because each call site independently needs the safety guarantee. A loop calling several methods on a large non-readonly struct <code>in</code> parameter can make several silent copies, each the full size of the struct — potentially WORSE than simply passing the struct by value in the first place, which only copies once at the call boundary.',
        'Properties count as method calls too (getters are compiler-generated methods) — even reading a property through an <code>in</code> parameter on a non-readonly struct can trigger a defensive copy, not just calling an explicit mutating method.',
      ],
    },
    {
      heading: 'The fix — mark the struct readonly, or accept by value',
      points: [
        'If the struct genuinely never needs to mutate its own fields from within its methods, marking it <code>readonly struct</code> (exactly as the main page\'s <code>BigPoint</code> does) eliminates the defensive copy entirely — the compiler can PROVE no mutation is possible, so no safety copy is needed.',
        'If the struct cannot be made <code>readonly</code> (it has legitimately mutating methods used elsewhere), then using <code>in</code> for it provides NO real benefit over passing by value normally — the defensive copies happening internally likely cost more than a single value-copy at the call site would have. In that case, dropping <code>in</code> entirely (or using <code>ref readonly</code> in more recent C# versions, which has its own distinct semantics) is often the more honest choice.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main topic\'s working case — readonly struct, no defensive copy',
      language: 'csharp',
      code: `// Exactly the main topic's example — readonly struct means the compiler
// can PROVE no method call can mutate the struct's fields:
public readonly struct BigPoint
{
    public double X, Y, Z, W;
    public BigPoint(double x, double y, double z, double w) => (X, Y, Z, W) = (x, y, z, w);

    public double Length() => Math.Sqrt(X * X + Y * Y + Z * Z + W * W);
}

static double Magnitude(in BigPoint p)
{
    // Calling Length() here does NOT trigger a defensive copy — the
    // compiler knows (from "readonly struct") that Length() cannot
    // mutate p's fields, so it is safe to call directly on the
    // caller's original data through the in reference:
    return p.Length();
}

var point = new BigPoint(1, 2, 3, 4);
Console.WriteLine(Magnitude(in point)); // no copy made — genuine performance win`,
    },
    {
      label: 'The trap — a NON-readonly struct silently defeats the optimization',
      language: 'csharp',
      code: `// NOT readonly — this struct's methods COULD mutate its own fields,
// even though "Length" here happens not to:
public struct BigPointMutable
{
    public double X, Y, Z, W;
    public BigPointMutable(double x, double y, double z, double w) => (X, Y, Z, W) = (x, y, z, w);

    public double Length() => Math.Sqrt(X * X + Y * Y + Z * Z + W * W); // doesn't mutate, but isn't PROVEN not to

    public void Normalize() // this ONE method genuinely does mutate — enough
    {                       // to prevent the compiler from trusting ANY method
        double len = Length();
        X /= len; Y /= len; Z /= len; W /= len;
    }
}

static double MagnitudeMutable(in BigPointMutable p)
{
    // The compiler CANNOT prove Length() won't mutate p (the struct has
    // OTHER mutating methods, like Normalize) — so it silently makes a
    // DEFENSIVE COPY of the entire 32-byte struct before this call:
    return p.Length();
    // The "in" keyword compiled successfully and LOOKS like it avoided a
    // copy at the call site — but a copy still happened here, inside the
    // method body, defeating the entire purpose.
}

var point = new BigPointMutable(1, 2, 3, 4);
Console.WriteLine(MagnitudeMutable(in point)); // "works" but the copy still happened`,
    },
    {
      label: 'Repeated calls make repeated copies — worse than passing by value',
      language: 'csharp',
      code: `static double SumOfCallsMutable(in BigPointMutable p)
{
    // THREE separate calls to Length() through a non-readonly struct's
    // "in" parameter — THREE separate defensive copies, one per call:
    double a = p.Length(); // defensive copy #1
    double b = p.Length(); // defensive copy #2
    double c = p.Length(); // defensive copy #3
    return a + b + c;

    // Compare: passing BigPointMutable BY VALUE (no "in" at all) copies
    // the struct exactly ONCE, at the call boundary — then every method
    // call inside operates on that single local copy with NO further
    // copying. For a method that calls several instance methods on a
    // non-readonly struct, "in" can end up doing MORE copying than
    // simply accepting the parameter by value in the first place.
}

// The fix — mark the struct readonly (if genuinely no mutation is
// needed), eliminating ALL defensive copies:
public readonly struct BigPointFixed
{
    public double X, Y, Z, W;
    public BigPointFixed(double x, double y, double z, double w) => (X, Y, Z, W) = (x, y, z, w);
    public double Length() => Math.Sqrt(X * X + Y * Y + Z * Z + W * W);
    // No mutating methods at all — readonly struct is honest about intent
}

static double SumOfCallsFixed(in BigPointFixed p)
{
    // Zero defensive copies — the compiler PROVES Length() cannot mutate p:
    return p.Length() + p.Length() + p.Length();
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A colleague has a non-readonly struct with ONE genuinely mutating method used rarely in the codebase, and a read-only Length() method used frequently in hot paths via "in" parameters. Propose a design change that gets the readonly-struct performance benefit for the frequent read-only usage without losing the ability to mutate where genuinely needed.',
    hint: 'Consider whether the mutating operation truly needs to be an INSTANCE method that mutates "this" at all — could it instead be expressed as a method or static function that returns a NEW struct value rather than mutating in place? This is exactly the same "prefer returning a new value over mutating" pattern the main topic itself recommends for ref on reference types.',
    solution: `// Instead of a mutating instance method, make the "mutation" return a
// NEW value — this lets the whole struct become readonly, giving every
// caller (including the hot-path "in" usage) the full optimization:

public readonly struct BigPointFixed
{
    public double X, Y, Z, W;
    public BigPointFixed(double x, double y, double z, double w) => (X, Y, Z, W) = (x, y, z, w);

    public double Length() => Math.Sqrt(X * X + Y * Y + Z * Z + W * W);

    // Instead of mutating "this" in place, RETURN a new normalized value —
    // the struct itself never needs a mutating method, so it can be
    // readonly, and every "in" usage (including this one) gets the full
    // defensive-copy-free benefit:
    public BigPointFixed Normalized()
    {
        double len = Length();
        return new BigPointFixed(X / len, Y / len, Z / len, W / len);
    }
}

// Hot path — genuinely zero defensive copies now, for BOTH methods:
static double MagnitudeAndNormalizedLength(in BigPointFixed p)
{
    var normalized = p.Normalized(); // no defensive copy — readonly struct
    return p.Length() + normalized.Length(); // no defensive copy either
}

// The caller who needs the "mutated" version just reassigns their own
// variable — exactly the "return the new value" pattern the main topic
// itself recommends for ref on reference types, applied here to structs:
var point = new BigPointFixed(1, 2, 3, 4);
point = point.Normalized(); // caller's own variable is updated explicitly`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the "in" parameter modifier always avoids copying the struct, regardless of how the struct type itself is declared.',
      reality: '"in" only avoids the copy when the struct is declared readonly struct — for a non-readonly struct, the compiler cannot prove instance methods won\'t mutate it, so it silently inserts a defensive copy before each instance method call through the "in" parameter.',
    },
    {
      thought: 'the defensive copy for a non-readonly struct "in" parameter happens once, at the method call boundary, similar to passing by value.',
      reality: 'the defensive copy happens EVERY TIME an instance method (including property getters) is called on the "in" parameter inside the method body — multiple calls mean multiple copies, potentially costing more than a single by-value copy would have.',
    },
    {
      thought: 'if a struct has even one legitimately mutating method used elsewhere in the codebase, there is no way to get "in"\'s performance benefit for read-only usages of that same struct.',
      reality: 'redesigning the mutating method to return a new struct value instead of mutating "this" in place (the same pattern the main topic recommends for ref on reference types) lets the whole struct become readonly, restoring the defensive-copy-free benefit for every "in" usage.',
    },
  ];
}
