import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-resolving-extension-method-ambiguity-cs0121-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './resolving-extension-method-ambiguity-cs0121.html',
  styleUrl: './resolving-extension-method-ambiguity-cs0121.scss',
})
export class ResolvingExtensionMethodAmbiguityCs0121Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows one extension namespace at a time — never two competing ones',
      points: [
        'The main Extension Methods page\'s "using directive" Common Mistake covers the case of a MISSING using directive causing a "method not found" error. It never addresses the OPPOSITE scenario: what happens when TWO DIFFERENT imported namespaces each define an extension method with the SAME name and COMPATIBLE signature for the SAME target type.',
      ],
    },
    {
      heading: 'Extension method resolution has its own SCOPE-PROXIMITY rule, distinct from ordinary overload resolution',
      points: [
        'C# resolves extension method candidates in a specific SCOPE ORDER: extension methods declared in the SAME namespace as the calling code (or an enclosing one) are considered FIRST, before any candidates from namespaces brought in purely via a <code>using</code> directive. If a genuinely applicable candidate is found at a CLOSER scope, extension methods from a "further" (merely <code>using</code>-imported) scope are not even considered — this resolves what would otherwise be an ambiguity automatically, based on proximity.',
        'This proximity rule ONLY resolves the ambiguity when the two candidates are at DIFFERENT scope distances. If BOTH competing extension methods are reached via ordinary <code>using</code> directives (neither one "closer" in scope than the other), the compiler has no automatic tiebreaker and produces a genuine <code>CS0121</code> ambiguous-call compile error.',
      ],
    },
    {
      heading: 'The fix for a genuine CS0121 — call through the static class explicitly',
      points: [
        'Unlike the main page\'s own using-alias fix for regular type-name ambiguity, extension methods cannot be "aliased" the same way — a <code>using</code> alias applies to TYPES and NAMESPACES, not to disambiguating WHICH extension method a fluent call resolves to. The correct fix is to abandon the extension (fluent) call syntax entirely for the ambiguous call and invoke the STATIC METHOD DIRECTLY, explicitly naming which static class\'s version you mean: <code>MyNamespace1.MyExtensions.Method(obj)</code> instead of <code>obj.Method()</code>.',
        'This directly reflects the main page\'s own foundational theory: an extension call is ALWAYS just sugar for a static method call under the hood — falling back to the underlying static-call syntax is not a workaround, it is simply writing out explicitly what the compiler would otherwise have inferred, in the one case where it genuinely cannot infer it unambiguously.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two genuinely competing extension methods — same name, same target type',
      language: 'csharp',
      code: `// Namespace A — a validation utility library
namespace LibraryA.Extensions;

public static class StringValidationExtensions
{
    public static bool IsValid(this string s) => !string.IsNullOrWhiteSpace(s);
}

// Namespace B — a COMPLETELY UNRELATED library, also extending string
// with an "IsValid" method, coincidentally the same name:
namespace LibraryB.Extensions;

public static class InputCheckExtensions
{
    public static bool IsValid(this string s) => s.Length > 0 && s.Length < 256;
}

// Your code — importing BOTH namespaces:
using LibraryA.Extensions;
using LibraryB.Extensions;

string name = "Alice";
// bool valid = name.IsValid();
// COMPILE ERROR: CS0121 — "The call is ambiguous between the following
// methods or properties: 'LibraryA.Extensions.StringValidationExtensions
// .IsValid(string)' and 'LibraryB.Extensions.InputCheckExtensions
// .IsValid(string)'"
//
// Both candidates are reached via ORDINARY using directives — neither
// is "closer" in scope than the other, so there is no automatic
// proximity-based tiebreaker available here.`,
    },
    {
      label: 'Proximity DOES resolve it automatically — when scope distance differs',
      language: 'csharp',
      code: `namespace MyApp.Utilities;

// An extension declared in the SAME namespace as the calling code below —
// this is "closer" in scope than anything reached purely via "using":
public static class LocalStringExtensions
{
    public static bool IsValid(this string s) => s.Trim().Length > 2;
}

namespace MyApp;

using LibraryA.Extensions; // "further" — reached only via using
using MyApp.Utilities;      // ALSO reached via using here, but see below

public class Processor
{
    public bool Check(string input)
    {
        // If MyApp.Utilities.LocalStringExtensions.IsValid is declared in
        // a namespace that CONTAINS or is nested relative to the calling
        // code's own namespace (rather than purely a sibling reached via
        // "using"), it is preferred automatically — the "using
        // LibraryA.Extensions" candidate is not even considered a
        // competing option in that specific configuration:
        return input.IsValid(); // resolves to LocalStringExtensions'
                                  // version WITHOUT ambiguity, precisely
                                  // because of its closer scope relationship
    }
}

// NOTE: the exact proximity rules are nuanced (nested namespace vs
// sibling namespace vs same-file local declarations) — the key
// takeaway is that "closer" declarations win automatically, and
// genuine CS0121 only arises when BOTH candidates are equally
// "distant" (both reached purely through ordinary, sibling using
// directives with no scope-nesting relationship).`,
    },
    {
      label: 'The fix for genuine ambiguity — call the static method directly',
      language: 'csharp',
      code: `using LibraryA.Extensions;
using LibraryB.Extensions;

string name = "Alice";

// The fluent extension-call syntax IS ambiguous here — but the
// UNDERLYING static method call it desugars to is NEVER ambiguous,
// because it explicitly names which class you mean:
bool validByA = LibraryA.Extensions.StringValidationExtensions.IsValid(name);
bool validByB = LibraryB.Extensions.InputCheckExtensions.IsValid(name);

Console.WriteLine(validByA); // True — non-whitespace check
Console.WriteLine(validByB); // True — length check

// This directly reflects the main topic's own core theory: "obj.Ext()"
// is ALWAYS just sugar for "ExtClass.Ext(obj)" — falling back to the
// explicit static-call form is simply writing out what the compiler
// would infer automatically, in the one case (genuine CS0121) where it
// cannot infer it for you.

// A cleaner long-term fix, if you own the calling code: alias ONE of
// the static classes with a using alias to make future calls concise —
// this DOES work here, because you're aliasing the CLASS, not the method:
using ValidationA = LibraryA.Extensions.StringValidationExtensions;
bool validAlias = ValidationA.IsValid(name); // concise, unambiguous`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'If <code>LibraryA</code>\'s <code>IsValid(this string s)</code> and <code>LibraryB</code>\'s <code>IsValid(this string s, bool strict)</code> (note the EXTRA bool parameter) were both imported via using, would calling <code>name.IsValid()</code> (no arguments beyond the receiver) still produce a CS0121 ambiguity?',
    hint: 'Recall that C# overload resolution (including for extension methods) considers the FULL signature, not just the name — think about whether a call with ZERO explicit arguments can even be a candidate match for an extension requiring an ADDITIONAL bool parameter beyond the receiver, versus one requiring none.',
    solution: `namespace LibraryA.Extensions;
public static class A { public static bool IsValid(this string s) => true; }

namespace LibraryB.Extensions;
public static class B { public static bool IsValid(this string s, bool strict) => true; }

using LibraryA.Extensions;
using LibraryB.Extensions;

string name = "Alice";
bool result = name.IsValid(); // NO ambiguity — compiles cleanly

// Why: name.IsValid() provides ZERO arguments beyond the receiver.
// LibraryA's IsValid(this string s) matches this call shape exactly —
// no additional parameters needed. LibraryB's IsValid(this string s,
// bool strict) REQUIRES a second bool argument that was not supplied —
// it is simply NOT AN APPLICABLE CANDIDATE for this specific call at
// all, the same way an ordinary method overload requiring an extra
// parameter would not be considered for a call omitting that argument.

// Only genuinely APPLICABLE candidates (ones whose full parameter list
// matches the call site, considering optional parameters and params
// arrays too) participate in the ambiguity check in the first place —
// CS0121 only arises when MULTIPLE candidates are simultaneously
// applicable to the exact same call, not merely when multiple methods
// happen to share a name.

// Calling name.IsValid(true) WOULD be ambiguous only if BOTH libraries
// had a matching two-argument overload — in this specific setup, only
// LibraryB's overload accepts that call shape, so it resolves cleanly
// too, just to the other candidate.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'two extension methods with the same name imported via different using directives always produce a CS0121 ambiguity error, regardless of where they are declared relative to the calling code.',
      reality: 'extension method resolution has its own scope-proximity rule — a candidate declared in a namespace CLOSER to the calling code (rather than reached purely through an ordinary using directive) is preferred automatically, and only produces genuine ambiguity when BOTH competing candidates are at the same "distance."',
    },
    {
      thought: 'a genuine extension method ambiguity (CS0121) can be resolved the same way an ordinary type-name ambiguity is — with a using alias applied directly to the method.',
      reality: 'using aliases apply to TYPES and NAMESPACES, not to disambiguating which extension method a fluent call resolves to — the correct fix is falling back to the underlying static method call syntax, explicitly naming the static class, which the extension call always desugars to anyway.',
    },
    {
      thought: 'two extension methods sharing the same NAME will always compete for ambiguity resolution, regardless of their parameter lists.',
      reality: 'only candidates that are genuinely APPLICABLE to the specific call site (matching parameter count and types, considering optional parameters) participate in ambiguity resolution at all — a method requiring additional arguments beyond what the call site supplies is simply not a candidate, and causes no ambiguity.',
    },
  ];
}
