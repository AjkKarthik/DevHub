import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-compile-time-constant-overflow-always-checked-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './compile-time-constant-overflow-always-checked.html',
  styleUrl: './compile-time-constant-overflow-always-checked.scss',
})
export class CompileTimeConstantOverflowAlwaysCheckedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page implies checked/unchecked always controls overflow — there\'s an exception',
      points: [
        'The main Type Conversion page states: "By default, C# integer arithmetic is unchecked: overflow silently wraps." This is true for arithmetic on VARIABLES at runtime — but it is NOT true for CONSTANT EXPRESSIONS the compiler can fully evaluate at compile time. A constant expression that overflows is a COMPILE ERROR by default, regardless of the surrounding checked/unchecked context, unless you explicitly wrap it in <code>unchecked(...)</code>.',
      ],
    },
    {
      heading: 'Why constants get a different rule than runtime values',
      points: [
        'The compiler can fully evaluate a constant expression like <code>int.MaxValue + 1</code> AT COMPILE TIME, since both operands are known constants — this means it can DETECT the overflow before the program ever runs, and by default it treats this as a programmer error worth stopping the build for, rather than silently baking a wrapped, likely-wrong value into the compiled program.',
        'A non-constant expression (<code>a + b</code> where <code>a</code> and <code>b</code> are variables) cannot be evaluated until runtime — the compiler has no way to know at compile time whether it will overflow, so it falls back to the ordinary default (unchecked, silently wraps) unless a <code>checked</code> context says otherwise.',
      ],
    },
    {
      heading: 'unchecked() is required to intentionally write an overflowing constant',
      points: [
        'If you genuinely need a constant expression that overflows on purpose (a common case: hash-code seed constants, bit-pattern literals, deliberately wrapped magic numbers), you must wrap it explicitly in <code>unchecked(...)</code> — this tells the compiler "yes, I know this overflows, compute the wrapped value anyway" rather than treating it as a mistake.',
        'This is DIFFERENT from the runtime <code>unchecked</code> block covered on the main page, which changes the default overflow BEHAVIOR for runtime arithmetic — here, <code>unchecked(...)</code> on a constant expression is specifically overriding a COMPILE-TIME ERROR, not a runtime exception.',
      ],
    },
    {
      heading: 'The project-wide <CheckForOverflowUnderflow> setting does NOT affect this rule',
      points: [
        'The main page mentions <code>&lt;CheckForOverflowUnderflow&gt;true&lt;/CheckForOverflowUnderflow&gt;</code> changes the DEFAULT for runtime arithmetic project-wide. Constant-expression overflow checking is a SEPARATE, always-on compiler behavior that this project setting does not control — a constant expression that overflows is a compile error whether <code>CheckForOverflowUnderflow</code> is true or false, and setting it to false does NOT let an overflowing constant compile silently.',
        'This distinction matters for anyone who assumes disabling project-wide overflow checking means "no overflow checking anywhere" — constant-expression checking remains a genuinely separate, always-active safety net regardless of that setting.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A constant overflow — compile error, even in the default unchecked context',
      language: 'csharp',
      code: `// The main topic's own claim: "By default, C# integer arithmetic is
// unchecked: overflow silently wraps." This is TRUE for the RUNTIME
// version below:
int a = int.MaxValue;
int runtimeOverflow = a + 1;    // compiles fine — wraps to int.MinValue at runtime

// But the CONSTANT version of the exact same arithmetic does NOT compile
// at all — the compiler evaluates it at COMPILE TIME and refuses:
// const int constantOverflow = int.MaxValue + 1;
// error CS0220: The operation overflows at compile time in checked mode
//
// Note the error message itself says "in checked mode" — constant
// expressions are ALWAYS evaluated as if checked, regardless of the
// surrounding context, unlike ordinary runtime arithmetic.`,
    },
    {
      label: 'unchecked() lets you write an intentionally overflowing constant',
      language: 'csharp',
      code: `// To intentionally define a constant that represents a wrapped/overflowed
// value (common for hash seeds, bit-pattern literals), wrap it explicitly:
const int intentionalWrap = unchecked(int.MaxValue + 1);
Console.WriteLine(intentionalWrap); // -2147483648 — compiles fine now

// A real-world use case — a hash-code seed constant that is DERIVED from
// an overflowing multiplication on purpose (common in custom GetHashCode
// implementations using FNV-style or polynomial hash constants):
const int hashSeed = unchecked((int)2166136261);
// Without "unchecked", if this literal genuinely overflowed int's range
// as a constant expression, it would fail to compile — "unchecked" here
// is explicit permission for the wrap, documenting the INTENT clearly to
// future readers rather than leaving them to wonder if it's a typo.

// Compare to the runtime "unchecked" BLOCK from the main topic — same
// keyword, but a DIFFERENT purpose: that one changes runtime arithmetic
// behavior; THIS unchecked(...) overrides a compile-time ERROR on a
// constant expression specifically.`,
    },
    {
      label: '<CheckForOverflowUnderflow> project setting does NOT change this rule',
      language: 'csharp',
      code: `// .csproj with project-wide checked arithmetic explicitly turned OFF:
// <PropertyGroup>
//   <CheckForOverflowUnderflow>false</CheckForOverflowUnderflow>
// </PropertyGroup>

// Runtime arithmetic behavior IS affected by the setting above:
int a = int.MaxValue;
int runtimeResult = a + 1; // wraps silently either way — CheckForOverflowUnderflow
                            // being false just means this was ALREADY the default

// But this STILL does not compile, even with CheckForOverflowUnderflow
// explicitly set to false in the .csproj:
// const int stillFails = int.MaxValue + 1;
// error CS0220 — constant expression overflow checking is a SEPARATE,
// always-on compiler behavior that this project-wide MSBuild property
// does not control at all.

// The ONLY way to get an overflowing constant to compile, regardless of
// any project setting, is the explicit unchecked(...) wrapper:
const int works = unchecked(int.MaxValue + 1); // compiles regardless of
                                                 // CheckForOverflowUnderflow's value`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given <code>const byte a = 200; const byte b = 100;</code>, does <code>const int sum = a + b;</code> compile? Reason through whether byte addition constant-folds to a value that overflows byte\'s range, and whether that matters here given the target type is int, not byte.',
    hint: 'In C#, byte + byte arithmetic actually promotes both operands to int BEFORE adding (this is a general C# arithmetic promotion rule, not specific to constants) — so the addition itself happens in int arithmetic, well within int\'s range, and the RESULT is then assigned to an int constant. Think about whether 300 (200+100) overflows byte\'s range vs int\'s range, and which range is actually relevant to the compile-time check here.',
    solution: `const byte a = 200;
const byte b = 100;
const int sum = a + b; // COMPILES FINE — no overflow error at all

// Why: C#'s arithmetic promotion rules mean "byte + byte" is not actually
// byte arithmetic — both operands are implicitly widened to int BEFORE
// the addition happens (this is a general rule for all arithmetic on
// types smaller than int, constant or not). So the actual computation is
// int(200) + int(100) = 300, computed entirely within int's enormous
// range — nowhere close to overflowing.

// The result (300) is then assigned to an int constant — also completely
// fine, since 300 fits comfortably within int's range.

// This would ONLY become a compile-time overflow error if you tried to
// assign the result back into a byte constant, where 300 genuinely
// exceeds byte's 0-255 range:
// const byte sumAsByte = (byte)(a + b);  // needs an explicit cast because
//                                         // a + b is int, not byte — and
//                                         // if 300 didn't fit in a cast
//                                         // target that itself doesn't
//                                         // support checked construction,
//                                         // this narrowing conversion at
//                                         // compile time would also fail
//                                         // similarly to the int.MaxValue
//                                         // example, since 300 > byte.MaxValue (255).
const byte sumAsByte = (byte)(a + b); // COMPILE ERROR: CS0221 — constant
// value 300 cannot be converted to byte (overflow at compile time)`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the default "unchecked" behavior for C# integer arithmetic applies universally — any overflowing expression, constant or variable-based, silently wraps by default.',
      reality: 'constant expressions are a genuine exception — the compiler evaluates them at compile time and treats an overflow as a COMPILE ERROR by default, regardless of the surrounding checked/unchecked context, unlike runtime arithmetic on variables which does default to silent wrapping.',
    },
    {
      thought: 'setting <CheckForOverflowUnderflow>false</CheckForOverflowUnderflow> project-wide disables ALL overflow checking, including for constant expressions.',
      reality: 'this MSBuild property only affects the default checked/unchecked behavior for RUNTIME arithmetic — constant-expression overflow checking is a separate, always-on compiler behavior that this setting does not control at all.',
    },
    {
      thought: 'the unchecked(...) syntax always means "make this runtime arithmetic wrap instead of throw," the same purpose described in the main topic\'s checked/unchecked section.',
      reality: 'when applied to a CONSTANT expression, unchecked(...) serves a genuinely different purpose — it overrides a COMPILE-TIME ERROR (CS0220) that would otherwise occur, rather than changing a runtime exception into silent wrapping.',
    },
  ];
}
