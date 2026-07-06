import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-extension-methods-on-structs-this-in-t-receiver-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './extension-methods-on-structs-this-in-t-receiver.html',
  styleUrl: './extension-methods-on-structs-this-in-t-receiver.scss',
})
export class ExtensionMethodsOnStructsThisInTReceiverSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s "this T param" is always by-value — never addresses struct copying',
      points: [
        'Every extension method example on the main Extension Methods page uses a plain <code>this T value</code> (or <code>this string s</code>) receiver parameter — an ordinary BY-VALUE parameter. For a REFERENCE type this is free (only the reference is copied), but the main page never addresses what happens when the extended type is a large STRUCT — the receiver gets COPIED on every single call, exactly the struct-copying cost the Structures topic\'s own theory warns about for ordinary method parameters.',
      ],
    },
    {
      heading: 'this in T — the receiver parameter can be passed by readonly reference too',
      points: [
        'C# 7.2 extended the <code>this</code> modifier to work alongside <code>in</code>: <code>public static double Length(this in Vector3 v)</code> declares an extension method whose RECEIVER is passed by READONLY REFERENCE rather than by value — avoiding a full copy of the struct on every extension method call, exactly the same benefit the <code>in</code> keyword provides for ordinary parameters.',
        'This is genuinely valuable specifically for LARGE, IMMUTABLE structs (the main Structures topic\'s own examples like <code>Vector2D</code>, or anything above the ~16-byte guideline) that you extend frequently in hot paths — e.g. a physics or geometry library with dozens of extension methods called in a tight simulation loop.',
      ],
    },
    {
      heading: 'The same readonly struct pairing rule applies here too',
      points: [
        'Exactly as the main Structures topic explains for ordinary <code>in</code> parameters: <code>this in T</code> only genuinely avoids the copy if <code>T</code> is a <code>readonly struct</code> — for a NON-readonly struct, the compiler cannot prove the extension method (or anything it calls on the receiver) won\'t mutate it, so it silently inserts a DEFENSIVE COPY anyway, exactly negating the intended optimization, the identical trap the Methods topic\'s own subtopic on <code>in</code> parameter defensive copies describes, just applied here to the extension method\'s OWN receiver specifically.',
      ],
    },
    {
      heading: 'this in T cannot be combined with a MUTATING extension method',
      points: [
        'Because <code>in</code> passes the receiver as a readonly reference, an extension method using <code>this in T</code> CANNOT mutate the receiver\'s fields — attempting to assign to a field inside the method body is a compile error, exactly mirroring how an ordinary <code>in</code> parameter behaves. This means <code>this in T</code> is appropriate ONLY for extension methods that compute and RETURN a value (or a new struct) rather than modifying the receiver in place — which fits the "extend an immutable value type" use case perfectly, since a genuinely immutable struct has no in-place mutation to perform anyway.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The default — by-value receiver copies the struct on every call',
      language: 'csharp',
      code: `// A reasonably large struct — similar to the Structures topic's own
// LargeMatrix2x2 example (well beyond the ~16-byte guideline):
public readonly struct Matrix4x4
{
    public readonly double M11, M12, M13, M14;
    public readonly double M21, M22, M23, M24;
    public readonly double M31, M32, M33, M34;
    public readonly double M41, M42, M43, M44;
    // 16 doubles = 128 bytes total

    public Matrix4x4(double m11 /* ...all 16 params... */, double m44)
    {
        M11 = m11; /* ... */ M44 = m44;
    }
}

public static class MatrixExtensions
{
    // ORDINARY by-value receiver — copies all 128 bytes on EVERY call:
    public static double Trace(this Matrix4x4 m) =>
        m.M11 + m.M22 + m.M33 + m.M44;
}

var matrix = new Matrix4x4(/* ... */);
double t = matrix.Trace(); // 128-byte copy made just to call this method`,
    },
    {
      label: 'this in T — zero-copy receiver for a readonly struct',
      language: 'csharp',
      code: `public static class MatrixExtensions
{
    // "this in T" — receiver passed by READONLY REFERENCE, avoiding
    // the 128-byte copy entirely, exactly like an ordinary "in" parameter:
    public static double Trace(this in Matrix4x4 m) =>
        m.M11 + m.M22 + m.M33 + m.M44;

    public static double Determinant(this in Matrix4x4 m) =>
        // ... a longer computation reading many fields, called
        // frequently in a hot loop — genuinely benefits from avoiding
        // repeated 128-byte copies:
        m.M11 * m.M22 * m.M33 * m.M44; // simplified for illustration
}

var matrix = new Matrix4x4(/* ... */);
double t = matrix.Trace();        // no copy — reads directly via readonly ref
double d = matrix.Determinant();  // same — zero-copy receiver

// This ONLY genuinely avoids the copy because Matrix4x4 is declared
// "readonly struct" — the compiler can PROVE Trace/Determinant cannot
// mutate it, so no defensive copy is needed, exactly the same
// precondition the Methods topic's own "in parameter defensive copy
// trap" subtopic describes for ordinary parameters.`,
    },
    {
      label: 'The trap — a NON-readonly struct silently defeats this in T too',
      language: 'csharp',
      code: `// NOT readonly — mirrors the exact trap from the Methods topic's own
// "in parameter defensive copy trap" subtopic, applied to the RECEIVER
// of an extension method specifically:
public struct MutableMatrix4x4
{
    public double M11, M12, M13, M14 /* ...etc... */;

    public void Scale(double factor) // a genuinely mutating method exists
    {
        M11 *= factor; M12 *= factor; /* ... */
    }
}

public static class MutableMatrixExtensions
{
    // "this in T" here does NOT avoid the copy — the compiler cannot
    // prove Trace() won't mutate the struct (Scale() proves it CAN be
    // mutated), so it silently inserts a defensive copy anyway:
    public static double Trace(this in MutableMatrix4x4 m) =>
        m.M11 + m.M22 + m.M33 + m.M44;
    // "this in T" LOOKS like it avoids the copy — it compiles fine and
    // even LOOKS correct — but for this non-readonly struct, the
    // optimization is silently negated, exactly the same way the
    // Methods topic's subtopic describes for ordinary "in" parameters.
}

// The fix is identical too — make the struct readonly if it genuinely
// never needs in-place mutation, or accept the copy cost as unavoidable
// for a type that legitimately needs mutating methods.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Would <code>public static void DoubleInPlace(this in Matrix4x4 m) { /* attempt to mutate m.M11 */ }</code> compile, given Matrix4x4 is a readonly struct from the first example?',
    hint: 'Think about what "in" fundamentally means for ANY parameter, receiver or not — it passes a value by READONLY reference, meaning the method body is forbidden from assigning to any of its fields, regardless of whether the struct type itself is declared readonly or not. Consider whether readonly struct changes this specific restriction at all, or whether it is a separate, independent rule.',
    solution: `// No — this does NOT compile, and readonly struct has NOTHING to do
// with why. The "in" modifier ITSELF (on any parameter, receiver or
// ordinary) forbids the method body from assigning to ANY field of the
// parameter, completely independent of whether the struct type is
// declared readonly or not:

public static class MatrixExtensions
{
    public static void DoubleInPlace(this in Matrix4x4 m)
    {
        // m.M11 *= 2; // COMPILE ERROR — CS8331: cannot assign to
        //               member 'M11' of variable 'm' because it is a
        //               readonly variable (the "in" reference itself
        //               is what makes it readonly here, NOT whether
        //               Matrix4x4 the TYPE is declared readonly struct)
    }
}

// This reveals TWO independent "readonly" concepts working together:
// 1. "in" makes the PARAMETER/RECEIVER itself readonly at the call
//    site — you cannot assign through it, regardless of the struct's
//    own declared mutability.
// 2. "readonly struct" (the TYPE declaration) is what determines
//    whether the COMPILER NEEDS a defensive copy to guarantee that "in"
//    promise is even safe to make in the first place — because it
//    additionally proves no INSTANCE METHOD called on the struct could
//    mutate it internally either.

// Since "in" always forbids DIRECT field assignment on the parameter
// itself (rule #1), this specific example fails to compile regardless
// of whether Matrix4x4 is readonly struct or an ordinary struct — the
// readonly-struct distinction only matters for the SEPARATE, more
// subtle defensive-copy question from the previous example, not for
// this direct assignment attempt.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'this in T for an extension method receiver only makes sense conceptually — it is not actually valid C# syntax.',
      reality: 'this in T is genuine, valid C# syntax since C# 7.2 — the this and in modifiers can be combined on an extension method\'s receiver parameter, passing it by readonly reference instead of by value.',
    },
    {
      thought: 'this in T always avoids copying the struct receiver, regardless of how the struct type itself is declared.',
      reality: 'exactly like an ordinary in parameter, this in T only genuinely avoids the copy when the struct is declared readonly struct — for a non-readonly struct, the compiler cannot prove no instance method could mutate it, so it silently inserts a defensive copy anyway.',
    },
    {
      thought: 'an extension method using this in T cannot compile at all if the struct type happens to have OTHER mutating methods defined elsewhere on it.',
      reality: 'the extension method itself compiles fine regardless — what changes is whether the compiler can SKIP the defensive copy (only possible for a readonly struct with no possible mutating methods at all) versus silently inserting one (for a non-readonly struct, even if the specific extension method never calls any of its mutating members).',
    },
  ];
}
