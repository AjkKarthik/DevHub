import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-user-defined-conversion-chaining-one-operator-limit-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './user-defined-conversion-chaining-one-operator-limit.html',
  styleUrl: './user-defined-conversion-chaining-one-operator-limit.scss',
})
export class UserDefinedConversionChainingOneOperatorLimitSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows one operator hop — never what happens with two',
      points: [
        'The main Type Conversion page\'s Money/Temperature examples each show exactly ONE user-defined conversion operator per example (<code>double → Temperature</code>, <code>decimal → Money</code>). It never addresses what happens if you have TWO separate types with their own conversion operators and try to chain them — a genuinely common situation once a codebase has several small value-object wrapper types.',
      ],
    },
    {
      heading: 'The rule — at most ONE user-defined operator per conversion',
      points: [
        'C# allows a conversion to combine AT MOST one user-defined <code>implicit</code>/<code>explicit</code> operator with any number of PREDEFINED (built-in) conversions on either side — but it will never chain TWO user-defined operators together automatically, even if a valid path technically exists through an intermediate type.',
        'This means if <code>TypeA</code> has an implicit operator to <code>TypeB</code>, and <code>TypeB</code> has an implicit operator to <code>TypeC</code>, the compiler will NOT automatically convert <code>TypeA</code> directly to <code>TypeC</code> — you must write two explicit conversion steps (or a cast at each stage), even though both types individually declare an implicit conversion.',
      ],
    },
    {
      heading: 'One user-defined operator CAN combine with built-in conversions on either side',
      points: [
        'The restriction is specifically about chaining two USER-DEFINED operators — a single user-defined operator can still combine with ordinary BUILT-IN numeric widening/narrowing before or after it. For example, if <code>MyType</code> has an implicit operator FROM <code>int</code>, then a <code>short</code> value CAN convert to <code>MyType</code> automatically (built-in <code>short → int</code> widening, THEN the one user-defined <code>int → MyType</code> operator) — this is still only ONE user-defined operator in the chain, just with a built-in step tacked on either side.',
      ],
    },
    {
      heading: 'Why this design rule exists — predictability over convenience',
      points: [
        'If the compiler DID chain arbitrary user-defined operators automatically, adding a new implicit conversion operator to any type could silently create brand-new, unexpected implicit conversion PATHS between completely unrelated types anywhere those types happen to share an intermediate type — a maintenance and readability nightmare that would make reasoning about "can X convert to Y implicitly?" nearly impossible without tracing the entire type graph.',
        'The one-hop limit keeps conversion chains bounded and locally reasoned about: you only ever need to check the DIRECTLY declared operators on the source and target types (plus ordinary built-in conversions) to know whether an implicit/explicit conversion path exists — never an arbitrary multi-type search.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two user-defined operators — chaining does NOT happen automatically',
      language: 'csharp',
      code: `public readonly struct Meters
{
    public double Value { get; }
    private Meters(double value) => Value = value;
    public static implicit operator Meters(double value) => new(value);
}

public readonly struct Feet
{
    public double Value { get; }
    private Feet(double value) => Value = value;
    // Implicit conversion FROM Meters — a single user-defined operator:
    public static implicit operator Feet(Meters m) => new(m.Value * 3.28084);
}

// A double can implicitly become Meters (one user-defined operator):
Meters m = 100.0;

// Meters can implicitly become Feet (another user-defined operator):
Feet f = m;

// But a double CANNOT implicitly become Feet directly — that would
// require chaining TWO user-defined operators (double→Meters, then
// Meters→Feet), which C# never does automatically:
// Feet direct = 100.0;  // COMPILE ERROR: CS0029 — cannot implicitly
//                        // convert type 'double' to 'Feet'

// The fix — two explicit steps:
Meters step1 = 100.0;   // double → Meters (1 user-defined operator)
Feet   step2 = step1;   // Meters → Feet   (1 user-defined operator)
// Each individual assignment uses exactly ONE user-defined operator —
// legal. There is simply no SINGLE conversion that uses two.`,
    },
    {
      label: 'One user-defined operator CAN combine with built-in conversions',
      language: 'csharp',
      code: `public readonly struct Quantity
{
    public int Value { get; }
    private Quantity(int value) => Value = value;
    // ONE user-defined operator: int → Quantity
    public static implicit operator Quantity(int value) => new(value);
}

// short widens to int via a BUILT-IN conversion, THEN the single
// user-defined int → Quantity operator applies — this compiles fine,
// because it's still only ONE user-defined operator in the chain:
short smallNumber = 42;
Quantity q = smallNumber;  // short → int (built-in) → Quantity (user-defined)

Console.WriteLine(q.Value); // 42

// This also works from byte (byte → int is built-in widening too):
byte tinyNumber = 5;
Quantity q2 = tinyNumber;  // byte → int (built-in) → Quantity (user-defined)

// But this does NOT extend to chaining a SECOND user-defined operator
// on top — e.g. if Quantity also had "implicit operator Money(Quantity q)",
// you still could NOT go short → Quantity → Money in one implicit step;
// that would be two user-defined operators, which is exactly the
// restriction from the first example.`,
    },
    {
      label: 'Explicit casts hit the same one-hop limit',
      language: 'csharp',
      code: `public readonly struct Kilograms
{
    public double Value { get; }
    private Kilograms(double value) => Value = value;
    public static explicit operator Kilograms(double value) => new(value);
}

public readonly struct Pounds
{
    public double Value { get; }
    private Pounds(double value) => Value = value;
    public static explicit operator Pounds(Kilograms kg) => new(kg.Value * 2.20462);
}

double weight = 70.0;

// Two SEPARATE explicit casts — each uses exactly one user-defined operator:
Kilograms kg = (Kilograms)weight;   // double → Kilograms
Pounds    lb = (Pounds)kg;          // Kilograms → Pounds

// A single combined cast attempting to chain both operators does NOT
// compile, even with explicit cast syntax — explicit conversions follow
// the SAME one-user-defined-operator-per-conversion rule as implicit ones:
// Pounds direct = (Pounds)weight;   // COMPILE ERROR: CS0030 — cannot
//                                    // convert type 'double' to 'Pounds'`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given <code>Meters</code> (implicit from double) and <code>Feet</code> (implicit from Meters) from the first code example, would <code>Feet f = (Feet)100.0;</code> (an EXPLICIT cast instead of implicit assignment) compile? Reason about whether explicit cast syntax changes the one-user-defined-operator rule.',
    hint: 'The one-user-defined-operator-per-conversion limit applies to conversions in general, not specifically to implicit conversions — think about whether writing an explicit (T) cast gives the compiler permission to search for and chain MULTIPLE user-defined operators together, or whether it is still bound by the same single-hop rule, just now also willing to use EXPLICIT operators (not just implicit ones) for that one hop.',
    solution: `// No — this still does NOT compile. The one-user-defined-operator limit
// applies regardless of whether the conversion syntax is implicit
// assignment or an explicit (T) cast — writing (Feet) does not grant the
// compiler permission to chain TWO user-defined operators together.

Feet f = (Feet)100.0;
// COMPILE ERROR: CS0030 — cannot convert type 'double' to 'Feet'
// Same restriction as the implicit case: double → Meters → Feet would
// require TWO user-defined operators, and explicit cast syntax does not
// lift that restriction.

// What explicit cast syntax DOES additionally allow (that implicit
// assignment does not) is using operators marked "explicit" as that one
// hop — but it still only ever uses ONE user-defined operator per
// conversion, exactly like the implicit case:
Meters m = 100.0;      // double → Meters — ONE user-defined operator (implicit)
Feet   f2 = m;          // Meters → Feet   — ONE user-defined operator (implicit)
// Still two separate statements, each using exactly one operator — this
// is the only way to get from double to Feet, cast or no cast.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if TypeA has an implicit conversion to TypeB, and TypeB has an implicit conversion to TypeC, then TypeA automatically has an implicit conversion to TypeC as well.',
      reality: 'C# never automatically chains two user-defined conversion operators together — a conversion may use at most ONE user-defined operator, optionally combined with built-in conversions before or after it. Converting TypeA to TypeC requires two separate, explicit conversion steps.',
    },
    {
      thought: 'the one-user-defined-operator limit only applies to implicit conversions — explicit (T) casts can chain multiple user-defined operators together.',
      reality: 'the limit applies identically to explicit conversions — writing an explicit cast does not grant permission to chain two user-defined operators; it only additionally allows operators marked explicit (not just implicit) to be used for that single permitted hop.',
    },
    {
      thought: 'combining a user-defined conversion operator with a built-in numeric conversion (like short to int) is also restricted to prevent unexpected conversion paths.',
      reality: 'a single user-defined operator CAN freely combine with any number of built-in (predefined) conversions on either side — the restriction is specifically about chaining two or more USER-DEFINED operators together, not about combining one user-defined operator with ordinary built-in widening/narrowing.',
    },
  ];
}
