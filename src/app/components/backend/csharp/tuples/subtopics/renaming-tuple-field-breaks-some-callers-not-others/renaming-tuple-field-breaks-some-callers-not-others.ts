import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-renaming-tuple-field-breaks-some-callers-not-others-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './renaming-tuple-field-breaks-some-callers-not-others.html',
  styleUrl: './renaming-tuple-field-breaks-some-callers-not-others.scss',
})
export class RenamingTupleFieldBreaksSomeCallersNotOthersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states names are compile-time-only — this is the API-evolution consequence of that fact',
      points: [
        'The main Tuples & Anonymous Types page\'s core theory is that named tuple fields are erased to <code>Item1</code>/<code>Item2</code>/etc. at the IL level, preserved only via <code>TupleElementNamesAttribute</code> metadata for the COMPILER to re-surface at each call site. This has a specific, easy-to-miss consequence for a public API returning a named tuple: renaming a field is a BREAKING CHANGE for some callers, but a silent NO-OP for others.',
      ],
    },
    {
      heading: 'Callers using dot-notation break at COMPILE TIME when a field is renamed',
      points: [
        'If a public method\'s return type changes from <code>(string Name, int Age)</code> to <code>(string FullName, int Age)</code>, every caller written as <code>var r = GetPerson(); Console.WriteLine(r.Name);</code> fails to COMPILE — <code>.Name</code> no longer exists on the returned tuple\'s type. This is loud and safe: the compiler catches every affected call site immediately.',
      ],
    },
    {
      heading: 'Callers using positional deconstruction do NOT break at all — same rename, zero compile errors',
      points: [
        'The SAME rename has ZERO effect on a caller written as <code>var (name, age) = GetPerson();</code> — deconstruction assigns by POSITION, not by the tuple\'s declared field names, so the local variable is still called <code>name</code> regardless of what the method\'s own signature calls that slot now. This is the asymmetry: renaming silently does nothing to deconstructing callers, while it is a hard break for dot-notation callers.',
        'This means a library author can NOT assume "I renamed the field, so I must be safe to consider this a major/breaking version bump only if X" — the actual blast radius depends entirely on how each CALLER chose to consume the tuple, which the library author has no visibility into. Contrast with an ordinary class property rename, which is unconditionally breaking for every consumer, regardless of how they access it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Before the rename — both calling styles work identically',
      language: 'csharp',
      code: `// Public API, version 1:
public static (string Name, int Age) GetPerson() => ("Alice", 30);

// Caller A — dot notation:
var personA = GetPerson();
Console.WriteLine(personA.Name); // "Alice"

// Caller B — positional deconstruction:
var (name, age) = GetPerson();
Console.WriteLine(name); // "Alice"

// Both callers compile and run identically at this point — the
// difference in HOW each one accesses the tuple is invisible until
// the API's field name actually changes.`,
    },
    {
      label: 'After renaming Name -> FullName — the SAME rename, two different outcomes',
      language: 'csharp',
      code: `// Public API, version 2 — field renamed:
public static (string FullName, int Age) GetPerson() => ("Alice", 30);

// Caller A — dot notation — COMPILE ERROR now:
var personA = GetPerson();
Console.WriteLine(personA.Name);
// CS1061: '(string FullName, int Age)' does not contain a definition
// for 'Name' — loud, safe, caught immediately by the build.

// Caller B — positional deconstruction — compiles and runs UNCHANGED:
var (name, age) = GetPerson();
Console.WriteLine(name); // "Alice" — STILL WORKS, silently.
// The LOCAL variable name "name" was never tied to the tuple's own
// declared field name in the first place — deconstruction assigns
// purely by position, so this caller is completely unaffected.`,
    },
    {
      label: 'The practical takeaway for library authors',
      language: 'csharp',
      code: `// If GetPerson() is a PUBLIC API, renaming a named tuple field is
// still a breaking change worth a major version bump — because SOME
// consumers (dot-notation callers) WILL break at compile time.
//
// But you cannot use "no one seems to depend on the old field name"
// as evidence of safety by grepping call sites for ".Name" alone —
// deconstructing callers reference no such text at all, and are
// silently unaffected either way. The dot-notation callers are the
// ones you can find via search; the deconstructing ones are invisible
// to a text search for the old field name, yet are just as much
// "dependents" of the tuple's shape (arity and element types) even
// though the display name never appears in their source.
//
// This is a genuine advantage of records or classes for a public,
// evolving return type — a renamed PROPERTY breaks every consumer
// uniformly and visibly, rather than having this two-tier, partially
// silent blast radius that named tuples have.
public record PersonInfo(string FullName, int Age); // <-- prefer this
// for a genuinely public, evolving contract; reserve named tuples for
// PRIVATE/internal or short-lived local return values, exactly as the
// main topic page's own "when to use a record instead" guidance says.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A public method currently returns <code>(double Latitude, double Longitude)</code>. A teammate wants to rename <code>Latitude</code> to <code>Lat</code> and <code>Longitude</code> to <code>Lng</code> "to shorten it, it\'s a tiny change." Explain which callers this WILL break, which it WON\'T, and why grepping the codebase for <code>.Latitude</code> is not a complete safety check.',
    hint: 'Split callers into two groups: those using dot-notation (result.Latitude) and those using positional deconstruction (var (lat, lng) = GetCoords()). Consider which group a text search for ".Latitude" would actually find.',
    solution: `// Renaming (Latitude, Longitude) -> (Lat, Lng):

// Group 1 — dot-notation callers — WILL break, and ARE found by grep:
var coords = GetCoords();
Console.WriteLine(coords.Latitude);   // CS1061 after the rename
// A text search for ".Latitude" DOES find this call site — safe to
// assess via grep.

// Group 2 — deconstructing callers — will NOT break, and are NOT
// found by grepping for ".Latitude" at all, because the field name
// never appears in their source:
var (lat, lng) = GetCoords();
Console.WriteLine(lat);               // still compiles, still correct
// Grepping the codebase for ".Latitude" gives ZERO hits here even
// though this caller genuinely depends on the tuple's SHAPE (a
// 2-element double tuple) — it just doesn't reference the display name.

// The teammate's "it's a tiny change" framing undercounts the real
// risk two ways: (1) it IS a breaking change for an unknown number of
// dot-notation callers elsewhere in the codebase or in downstream
// consumers, and (2) a grep-based audit for the old name will UNDER-
// REPORT how many callers exist in total, because deconstructing
// callers are invisible to that search — though they are also, in
// this specific case, unaffected by the change, so the risk is really
// just "dot-notation callers break, and there is no complete text-
// search way to guarantee you found every one across a large or
// externally-consumed codebase."`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'renaming a named tuple field is always either fully breaking or fully safe for every caller.',
      reality: 'the same rename is a compile-time break for dot-notation callers (result.OldName) but a complete no-op for positional deconstruction callers (var (x, y) = ...) — the actual impact depends on how each caller chose to consume the tuple.',
    },
    {
      thought: 'grepping a codebase for the old field name (e.g. ".Latitude") is a reliable way to find every caller affected by a tuple field rename.',
      reality: 'deconstructing callers never reference the field name in their source at all, so a text search only finds dot-notation callers — it can under-report the true number of callers depending on the tuple\'s shape.',
    },
    {
      thought: 'named tuples are just as safe to expose in a public, evolving API as a record or class, since both let you name fields.',
      reality: 'a class or record property rename is uniformly breaking for every consumer; a named tuple\'s rename has an asymmetric, partially-silent blast radius — prefer a record for a genuinely public, evolving contract, per the main topic page\'s own guidance.',
    },
  ];
}
