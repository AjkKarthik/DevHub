import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-nullable-value-types-hasvalue-and-null-coalescing-operators-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './nullable-value-types-hasvalue-and-null-coalescing-operators.html',
  styleUrl: './nullable-value-types-hasvalue-and-null-coalescing-operators.scss',
})
export class NullableValueTypesHasvalueAndNullCoalescingOperatorsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Nullable REFERENCE types vs nullable VALUE types — a genuinely different feature',
      points: [
        'The main topic covers nullable reference types (<code>string?</code>) as a COMPILER WARNING system — the type is still <code>string</code> at runtime, <code>string?</code> just tells the compiler "warn me if I dereference this without checking." <code>int?</code> is a completely different mechanism: <code>Nullable&lt;int&gt;</code> (its full name) is an actual STRUCT that wraps an <code>int</code> plus a boolean flag — value types like <code>int</code>, <code>bool</code>, and <code>DateTime</code> cannot be <code>null</code> on their own, since they always contain a real value (their default, like <code>0</code>) — <code>Nullable&lt;T&gt;</code> is what makes "no value at all" representable for them.',
        '<code>int?</code> is literally shorthand for <code>Nullable&lt;int&gt;</code> — the <code>?</code> suffix on a VALUE type (int, bool, DateTime, an enum, a custom struct) compiles to this wrapper struct; the <code>?</code> suffix on a REFERENCE type (string, a class) is a compiler-only annotation with zero runtime representation. Same syntax, two unrelated features underneath.',
      ],
    },
    {
      heading: 'HasValue, Value, and the "unwrap before using" discipline',
      points: [
        'A <code>Nullable&lt;T&gt;</code> exposes <code>.HasValue</code> (a <code>bool</code>) and <code>.Value</code> (the underlying <code>T</code>) — accessing <code>.Value</code> when <code>.HasValue</code> is <code>false</code> throws an <code>InvalidOperationException</code> ("Nullable object must have a value"), NOT a <code>NullReferenceException</code> — a distinct exception type worth recognizing in a stack trace, since it immediately tells you the bug is an unchecked nullable value type, not an unchecked reference.',
        '<code>int? maybeAge = null; if (maybeAge.HasValue) &#123; int age = maybeAge.Value; &#125;</code> is the explicit, defensive pattern — but C# also allows the shorter <code>if (maybeAge is int age)</code> (a pattern match that both checks AND unwraps in one expression) or simply comparing directly: <code>if (maybeAge != null)</code>, after which the compiler\'s flow analysis lets you use <code>maybeAge.Value</code> safely (or even <code>(int)maybeAge</code>, an explicit cast that also unwraps).',
      ],
    },
    {
      heading: 'GetValueOrDefault() and the null-coalescing operators',
      points: [
        '<code>maybeAge.GetValueOrDefault()</code> returns the wrapped value OR the type\'s default (<code>0</code> for <code>int</code>) if null — avoiding the exception entirely, at the cost of silently treating "no value" the same as "zero," which is only correct when that\'s ACTUALLY the intended fallback. <code>GetValueOrDefault(25)</code> takes an explicit fallback instead of the type default.',
        'The null-coalescing operator <code>??</code> does the same job more idiomatically: <code>int age = maybeAge ?? 25;</code> — reads naturally as "maybeAge, or 25 if it\'s null." This works because <code>Nullable&lt;T&gt;</code> has a built-in implicit comparison against <code>null</code>, even though it\'s technically a struct.',
        'The null-coalescing ASSIGNMENT operator <code>??=</code> (C# 8+) combines the check-and-assign into one statement: <code>maybeAge ??= 25;</code> assigns <code>25</code> to <code>maybeAge</code> ONLY if it is currently <code>null</code>, leaving an existing value untouched — equivalent to (but more concise than) <code>if (maybeAge == null) maybeAge = 25;</code>.',
      ],
    },
    {
      heading: 'Lifting operators — arithmetic and comparisons on nullable value types',
      points: [
        'C# automatically "lifts" most operators to work on <code>Nullable&lt;T&gt;</code> — <code>int? a = 5; int? b = null; int? sum = a + b;</code> compiles and evaluates to <code>null</code> (not an exception!) because the <code>+</code> operator is lifted: if EITHER operand is null, the result is null, propagating the "no value" state through the expression instead of crashing.',
        'Comparison operators lift differently: <code>a == b</code> (both nullable) returns <code>true</code> only if both are null or both have the same value; but <code>a &lt; b</code> when either is null ALWAYS returns <code>false</code> — not null, an actual <code>false</code> — since "is 5 less than no-value-at-all" has no sensible true/false answer, and C# chose <code>false</code> as the conservative default rather than propagating null through comparisons the way it does through arithmetic. This asymmetry (arithmetic propagates null; comparisons collapse to false) is a common source of subtle bugs in nullable-heavy business logic.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'HasValue, Value, and safe unwrapping',
      language: 'csharp',
      code: `int? maybeAge = null;

// Unsafe — throws InvalidOperationException, NOT NullReferenceException
// int crash = maybeAge.Value;

// Defensive pattern — check before unwrapping
if (maybeAge.HasValue)
{
    int age = maybeAge.Value;
    Console.WriteLine(age);
}

// Pattern-match unwrap — checks AND binds in one expression
if (maybeAge is int knownAge)
{
    Console.WriteLine($"Known age: {knownAge}");
}
else
{
    Console.WriteLine("Age unknown");
}

// GetValueOrDefault — silent fallback, no exception
int ageOrZero    = maybeAge.GetValueOrDefault();     // 0 if null
int ageOrDefault = maybeAge.GetValueOrDefault(25);   // 25 if null`,
    },
    {
      label: 'Null-coalescing operators (?? and ??=)',
      language: 'csharp',
      code: `int? maybeAge = null;

// ?? — "or this value if null" — most idiomatic unwrap
int age = maybeAge ?? 25;
Console.WriteLine(age); // 25

// ??= — assign ONLY if currently null, leave existing value alone
maybeAge ??= 30;
Console.WriteLine(maybeAge); // 30

maybeAge ??= 99; // no-op — maybeAge already has a value
Console.WriteLine(maybeAge); // still 30

// Chaining ?? across a fallback sequence
int? a = null, b = null, c = 7;
int result = a ?? b ?? c ?? 0; // 7 — first non-null in the chain`,
    },
    {
      label: 'Lifted operators — the null-propagation asymmetry',
      language: 'csharp',
      code: `int? a = 5;
int? b = null;

// Arithmetic — lifted, propagates null through the expression
int? sum = a + b;
Console.WriteLine(sum);        // (null) — no exception
Console.WriteLine(sum.HasValue); // False

// Equality — true only if both null OR both equal
Console.WriteLine(a == b);     // False (5 vs null)
int? c = null;
Console.WriteLine(b == c);     // True (null vs null)

// Relational comparisons — collapse to false when EITHER is null,
// they do NOT propagate null the way arithmetic does.
Console.WriteLine(a < b);      // False — NOT null, an actual false
Console.WriteLine(a > b);      // Also False — same reason

// This asymmetry means "if (a < b)" and "if (a > b)" can BOTH be false
// simultaneously when b is null — a common source of subtle logic bugs
// in nullable-heavy range checks.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a method <code>string DescribeAge(int? age)</code> that returns <code>"Age: {age}"</code> when a value is present, or <code>"Age unknown"</code> when null — using the <code>is</code> pattern-match unwrap, not <code>.HasValue</code>/<code>.Value</code>.',
    hint: 'Use if (age is int knownAge) { return $"Age: {knownAge}"; } else { return "Age unknown"; } — the pattern match checks HasValue and unwraps Value into knownAge in one step.',
    solution: `string DescribeAge(int? age)
{
    if (age is int knownAge)
    {
        return $"Age: {knownAge}";
    }
    return "Age unknown";
}

// Usage:
Console.WriteLine(DescribeAge(30));  // "Age: 30"
Console.WriteLine(DescribeAge(null)); // "Age unknown"`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>int?</code> and <code>string?</code> are the same kind of nullable annotation, just applied to different types.',
      reality: '<code>int?</code> (a value type) is <code>Nullable&lt;int&gt;</code> — a real struct with runtime behavior. <code>string?</code> (a reference type) is a compiler-only warning annotation with zero runtime representation. The <code>?</code> syntax is shared; the underlying mechanism is completely different.',
    },
    {
      thought: 'accessing <code>.Value</code> on a null <code>Nullable&lt;T&gt;</code> throws a <code>NullReferenceException</code>, the same as dereferencing a null reference.',
      reality: 'it throws <code>InvalidOperationException</code> ("Nullable object must have a value") — a distinct exception type. Seeing this specific exception in a stack trace immediately points to an unchecked nullable VALUE type, not an unchecked reference.',
    },
    {
      thought: 'arithmetic and comparison operators on nullable value types behave consistently — both either propagate null or both collapse to a boolean.',
      reality: 'arithmetic (+, -, *, /) is lifted to PROPAGATE null through the expression (5 + null = null), while relational comparisons (&lt;, &gt;) COLLAPSE to false when either side is null — this asymmetry means a &lt; b and a &gt; b can both be false simultaneously when one side is null.',
    },
  ];
}
