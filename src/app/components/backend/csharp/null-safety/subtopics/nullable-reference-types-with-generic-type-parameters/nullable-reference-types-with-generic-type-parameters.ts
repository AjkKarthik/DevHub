import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-nullable-reference-types-with-generic-type-parameters-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './nullable-reference-types-with-generic-type-parameters.html',
  styleUrl: './nullable-reference-types-with-generic-type-parameters.scss',
})
export class NullableReferenceTypesWithGenericTypeParametersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A gap the main page never touches — every nullable example there is non-generic',
      points: [
        'The main Null Safety page demonstrates <code>string?</code> and <code>int?</code> — concrete, fully-known types. It never shows what <code>T?</code> means when <code>T</code> is a GENERIC TYPE PARAMETER, because the answer genuinely depends on how (or whether) <code>T</code> is constrained — a subtlety with no non-generic equivalent.',
      ],
    },
    {
      heading: 'Unconstrained T — the compiler cannot know if T? means Nullable<T> or a nullable reference',
      points: [
        'For an UNCONSTRAINED type parameter <code>T</code> (no <code>where T : class</code> or <code>where T : struct</code>), the language does not know at compile time whether <code>T</code> will be instantiated with a reference type or a value type — so <code>T?</code> in this position is NOT allowed to mean "Nullable<T> the value-type wrapper" the way <code>int?</code> does.',
        'Instead, an unconstrained <code>T?</code> is treated as a "maybe-null" ANNOTATION only when <code>T</code> ends up being a reference type at the call site — for a value-type instantiation, the annotation is simply ignored (a value type parameter can never be <code>null</code> unless it is itself <code>Nullable&lt;T&gt;</code>). This is the C# 8+ "unconstrained nullable type parameter" feature — genuinely different behavior from both the reference-type and value-type nullable stories shown on the main page.',
      ],
    },
    {
      heading: 'where T : class enables reference-type nullable annotations directly',
      points: [
        'Constraining with <code>where T : class</code> tells the compiler <code>T</code> will always be a reference type — this makes <code>T?</code> behave EXACTLY like the reference-type nullable annotations from the main page (a compile-time-only "this may be null" marker, erased at runtime, just like <code>string?</code>).',
        'Without this constraint, writing a method that returns <code>T?</code> and intends "null represents absence" for reference types specifically will not express that intent as precisely — the unconstrained version always has to account for both stories at once.',
      ],
    },
    {
      heading: 'where T : struct pairs with Nullable<T> directly, not the ? annotation',
      points: [
        'Constraining with <code>where T : struct</code> lets you use the CONCRETE <code>Nullable&lt;T&gt;</code> wrapper (or its <code>T?</code> shorthand, which now unambiguously means "Nullable of a value type" because <code>T</code> is guaranteed to be a value type) — restoring the exact <code>HasValue</code>/<code>Value</code>/<code>GetValueOrDefault</code> API surface the main page\'s nullable-value-type section describes, but now generically.',
        'This is the mirror case of <code>where T : class</code> — each constraint resolves the ambiguity in a DIFFERENT, mutually exclusive direction. An unconstrained <code>T</code> is the only case where the compiler has to hedge with the more permissive, less precise "maybe-null" annotation form.',
      ],
    },
    {
      heading: 'Why this matters for API design',
      points: [
        'A method like <code>T? FirstOrDefault&lt;T&gt;(IEnumerable&lt;T&gt; source)</code> in real LINQ is unconstrained on purpose — it must handle BOTH <code>List&lt;string&gt;</code> (null represents absence for reference types) and <code>List&lt;int&gt;</code> (default(int), i.e. 0, represents absence — LINQ\'s actual FirstOrDefault does NOT wrap value types in Nullable&lt;T&gt; even though its signature reads T?). This is exactly why FirstOrDefault on an empty <code>List&lt;int&gt;</code> silently returns <code>0</code> rather than a genuine "no value" signal — the main page\'s own null-in-LINQ section touches this indirectly but never explains the generic mechanism that causes it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Unconstrained T — the annotation only applies to reference-type instantiations',
      language: 'csharp',
      code: `#nullable enable

// T is unconstrained — could be a reference type OR a value type at each call site.
public static class Repository
{
    public static T? Find<T>(IEnumerable<T> items, Func<T, bool> predicate)
    {
        foreach (var item in items)
        {
            if (predicate(item)) return item;
        }
        return default; // null for reference types, default(T) — e.g. 0 — for value types
    }
}

// Reference-type instantiation: T? genuinely means "may be null"
string? name = Repository.Find(new[] { "Ana", "Bo" }, s => s == "Zed");
Console.WriteLine(name is null); // True — no match, and null is a meaningful "not found" signal

// Value-type instantiation: T? here does NOT wrap the result in Nullable<int> —
// it silently resolves to default(int), i.e. 0. There is no way to distinguish
// "found the value 0" from "found nothing" using this signature alone.
int found = Repository.Find(new[] { 5, 10, 15 }, n => n == 999);
Console.WriteLine(found); // 0 — could mean "found 0" OR "found nothing"; ambiguous by design`,
    },
    {
      label: 'where T : class — T? behaves exactly like the reference-type story',
      language: 'csharp',
      code: `#nullable enable

// Constraining to "class" makes T? an unambiguous reference-type nullable annotation —
// erased at runtime, just like string? on the main Null Safety page.
public static class ReferenceRepository
{
    public static T? FindReference<T>(IEnumerable<T> items, Func<T, bool> predicate)
        where T : class
    {
        foreach (var item in items)
        {
            if (predicate(item)) return item;
        }
        return null; // Always meaningful here — T is guaranteed to be a reference type
    }
}

Customer? match = ReferenceRepository.FindReference(customers, c => c.Id == 42);
if (match is not null)
{
    Console.WriteLine(match.Name); // Compiler tracks the null-check, exactly as with string?
}

public class Customer { public int Id; public string Name = ""; }`,
    },
    {
      label: 'where T : struct — T? means the real Nullable<T> wrapper',
      language: 'csharp',
      code: `#nullable enable

// Constraining to "struct" restores the FULL Nullable<T> API — HasValue, Value,
// GetValueOrDefault — from the main page's nullable-value-type section, generically.
public static class ValueRepository
{
    public static T? FindValue<T>(IEnumerable<T> items, Func<T, bool> predicate)
        where T : struct
    {
        foreach (var item in items)
        {
            if (predicate(item)) return item; // implicitly wrapped in Nullable<T>
        }
        return null; // Nullable<T>.HasValue == false — an unambiguous "not found"
    }
}

int? foundOrNothing = ValueRepository.FindValue(new[] { 5, 10, 15 }, n => n == 999);
Console.WriteLine(foundOrNothing.HasValue); // False — genuinely distinguishable from "found 0"

int? foundZero = ValueRepository.FindValue(new[] { 0, 10, 15 }, n => n == 0);
Console.WriteLine(foundZero.HasValue); // True, foundZero.Value == 0 — no longer ambiguous`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given <code>public static T? Wrap&lt;T&gt;(T value) where T : struct { return value; }</code>, what is the runtime type of the value returned when calling <code>Wrap(5)</code>, and would this same method body compile if the constraint were changed to <code>where T : class</code> instead?',
    hint: 'With where T : struct, T? means Nullable<T> — so Wrap(5) returns a genuine Nullable<int> with HasValue == true. Think about whether "return value;" (a non-nullable T) can implicitly convert to Nullable<T> — it can, since Nullable<T> has an implicit conversion from T. Then consider: does that same implicit-conversion story exist for reference types under where T : class?',
    solution: `// where T : struct — compiles. T (a value type) converts implicitly to Nullable<T>:
public static T? Wrap<T>(T value) where T : struct
{
    return value; // implicit conversion: T -> Nullable<T>, this is just normal C#
}
int? result = Wrap(5);
Console.WriteLine(result.HasValue); // True
Console.WriteLine(result.Value);    // 5

// where T : class — ALSO compiles, but for a completely different reason:
// T? here is just a nullable-reference-type ANNOTATION on the same T, not a
// distinct wrapper type — "return value" is trivially valid since a non-null T
// is always a valid value for the (wider) T? annotation. No conversion happens
// at runtime at all — the difference between the two versions is invisible in
// IL, but the *meaning* of T? in each is entirely different (wrapper vs annotation).
public static T? WrapRef<T>(T value) where T : class
{
    return value; // no conversion — T? is erased, this is identity
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>T?</code> always means the same thing regardless of how (or whether) the generic type parameter <code>T</code> is constrained.',
      reality: 'an unconstrained T? is a permissive "maybe-null" annotation that only takes effect for reference-type instantiations; where T : class makes it an unambiguous reference-type annotation; where T : struct makes it the concrete Nullable&lt;T&gt; wrapper — three genuinely different behaviors for the same syntax.',
    },
    {
      thought: 'a method signature like <code>T? FirstOrDefault&lt;T&gt;(IEnumerable&lt;T&gt;)</code> guarantees a meaningful, distinguishable "not found" result for every element type.',
      reality: 'for value-type instantiations without a struct constraint on the implementation, "not found" collapses to default(T) — e.g. 0 for int — which is indistinguishable from a genuinely found default value, unlike the reference-type case where null is unambiguous.',
    },
    {
      thought: 'adding <code>where T : struct</code> or <code>where T : class</code> to a generic method is purely a compile-time restriction with no effect on how T? behaves.',
      reality: 'the constraint fundamentally changes what T? compiles to — struct resolves it to the real Nullable&lt;T&gt; wrapper type with HasValue/Value; class resolves it to an erased nullable-reference-type annotation. These are not the same feature reused twice — they are two different null-representation mechanisms sharing one syntax.',
    },
  ];
}
