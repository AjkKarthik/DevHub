import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-interning-boundary-which-strings-interned-automatically-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './interning-boundary-which-strings-interned-automatically.html',
  styleUrl: './interning-boundary-which-strings-interned-automatically.scss',
})
export class InterningBoundaryWhichStringsInternedAutomaticallySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Q&A mentions interning in one paragraph — this is exactly where the automatic boundary sits',
      points: [
        'The main Strings, DateTime & Math page notes that "all identical string literals in an assembly are automatically interned" and that <code>ReferenceEquals</code> may return true or false unpredictably depending on how a string was created. The genuinely useful, precise rule underneath that statement: interning is automatic ONLY for strings the COMPILER can determine at COMPILE TIME — anything computed at runtime is never automatically interned, no matter how identical its final content is to an existing interned string.',
      ],
    },
    {
      heading: 'Compile-time constant folding IS interned — this includes concatenating literals, not just single literals',
      points: [
        'A single literal like <code>"hello"</code> is interned, unsurprisingly. Less obviously, the compiler also constant-folds <code>"hel" + "lo"</code> (two literals concatenated with <code>+</code>) into the single literal <code>"hello"</code> AT COMPILE TIME — meaning this concatenation is ALSO automatically interned, and <code>ReferenceEquals("hel" + "lo", "hello")</code> is <code>true</code>, because by the time the program runs, both expressions are literally the same compiled string reference.',
      ],
    },
    {
      heading: 'Anything computed at RUNTIME — even with identical final content — is never automatically interned',
      points: [
        'The moment a string\'s value depends on something not known at compile time — a variable, a method call, string interpolation with a runtime value, <code>Substring</code>, <code>ToUpper()</code>, <code>StringBuilder.ToString()</code> — the resulting string is a BRAND NEW heap object, even if its content happens to exactly match an already-interned literal elsewhere in the program. <code>ReferenceEquals</code> between such a runtime-built string and the matching literal is <code>false</code>, even though <code>==</code>/<code>Equals</code> correctly report them as equal by VALUE.',
        'The only way to force a runtime-computed string into the shared intern pool is to call <code>string.Intern(s)</code> explicitly — this is a deliberate opt-in the main page mentions but does not elaborate on: it is rarely worth doing (it defeats GC of that string for the process lifetime) and is essentially never needed for correctness, since <code>==</code>/<code>Equals</code> already give correct value comparison regardless of interning.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Compile-time literals AND compile-time concatenation are both interned',
      language: 'csharp',
      code: `string a = "hello";
string b = "hello";
Console.WriteLine(ReferenceEquals(a, b));  // True — same literal, interned

// Less obvious: the compiler CONSTANT-FOLDS this concatenation of two
// literals into a single literal at COMPILE TIME:
string c = "hel" + "lo";
Console.WriteLine(ReferenceEquals(a, c));  // True — "hel"+"lo" became
                                            // the literal "hello" before
                                            // the program even ran`,
    },
    {
      label: 'Runtime-computed strings are NEVER automatically interned — even with identical content',
      language: 'csharp',
      code: `string literal = "hello";

// Built at RUNTIME from a variable — even though the FINAL VALUE is
// identical to "literal", this is a brand-new heap string:
string fromVar = string.Concat("hel", GetSuffix());
static string GetSuffix() => "lo";

Console.WriteLine(fromVar == literal);              // True  — value equal
Console.WriteLine(ReferenceEquals(fromVar, literal)); // False — NOT interned,
                                                       // because GetSuffix()
                                                       // is a runtime call,
                                                       // not a compile-time
                                                       // constant

// Same story for ToUpper(), Substring(), interpolation with a variable,
// and StringBuilder.ToString() — ALL of these produce a fresh, non-
// interned string even if the content matches an existing literal:
string interp = $"{"hel"}lo";      // interpolation forces runtime evaluation
Console.WriteLine(ReferenceEquals(interp, literal)); // False`,
    },
    {
      label: 'Explicit string.Intern() — rarely needed, and what it actually costs',
      language: 'csharp',
      code: `string runtimeBuilt = new StringBuilder().Append("hel").Append("lo").ToString();
string literal = "hello";

Console.WriteLine(ReferenceEquals(runtimeBuilt, literal)); // False

// Force it into the shared intern pool explicitly:
string interned = string.Intern(runtimeBuilt);
Console.WriteLine(ReferenceEquals(interned, literal));    // True now —
                                                            // "interned" now
                                                            // points at the
                                                            // SAME pooled
                                                            // string as the
                                                            // literal

// The cost: string.Intern adds the string to a process-wide pool that
// is NEVER garbage collected for the lifetime of the process — calling
// it on many distinct, large, or highly variable runtime strings is a
// genuine memory-leak risk, not a free optimization. It is essentially
// never necessary for correctness, since == and .Equals() already give
// the correct value comparison regardless of whether either string is
// interned.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given <code>const string A = "foo"; string b = "foo"; string c = new string("foo".ToCharArray());</code>, predict the result of <code>ReferenceEquals(A, b)</code> and <code>ReferenceEquals(A, c)</code>, and explain why they differ.',
    hint: 'A is a compile-time constant literal (interned). b is also a literal (also interned, same pool entry as A). c is explicitly constructed via new string(...) from a char array at runtime — consider whether the "new string(...)" constructor is a compile-time or runtime operation.',
    solution: `const string A = "foo";
string b = "foo";
string c = new string("foo".ToCharArray());

Console.WriteLine(ReferenceEquals(A, b)); // True — both are the same
                                           // compile-time literal "foo",
                                           // automatically interned to
                                           // the exact same pool entry

Console.WriteLine(ReferenceEquals(A, c)); // False — new string(char[])
                                           // is an explicit RUNTIME
                                           // constructor call. Even
                                           // though "foo".ToCharArray()
                                           // starts from a literal, the
                                           // "new string(...)" call
                                           // forces allocation of a
                                           // brand-new string object at
                                           // runtime that is NEVER
                                           // automatically interned,
                                           // regardless of its content
                                           // matching an existing
                                           // interned literal exactly.

Console.WriteLine(A == c);                // True — value equality is
                                           // unaffected by interning`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'any two strings with identical content will always be ReferenceEquals in C#, because the runtime automatically interns strings.',
      reality: 'automatic interning only applies to strings the compiler can resolve at COMPILE TIME (literals and constant-folded literal concatenation) — anything computed at runtime is a fresh, non-interned object regardless of matching content.',
    },
    {
      thought: 'string interning is something you need to manage manually for correctness in everyday C# code.',
      reality: '== and .Equals() already give correct value-based comparison regardless of interning — string.Intern() is an explicit, rarely-needed opt-in, and its cost (the string is never GC\'d for the process lifetime) usually outweighs any benefit.',
    },
    {
      thought: '"hel" + "lo" produces a runtime-computed string just like string.Concat("hel", "lo") does, so neither should be automatically interned.',
      reality: 'the compiler constant-folds "hel" + "lo" (two literal operands) into the single literal "hello" at COMPILE TIME, so it IS automatically interned — string.Concat with the same literal arguments, being a runtime method call, is NOT.',
    },
  ];
}
