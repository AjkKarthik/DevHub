import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-valuetuple-8-element-limit-trest-chaining-mechanism-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './valuetuple-8-element-limit-trest-chaining-mechanism.html',
  styleUrl: './valuetuple-8-element-limit-trest-chaining-mechanism.scss',
})
export class Valuetuple8ElementLimitTrestChainingMechanismSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions the 8-element limit in one line — this is the mechanism behind it',
      points: [
        'The main Tuples & Anonymous Types page\'s own Q&amp;A notes, in passing, that beyond 7 elements "the 8th slot is a TRest that itself is another ValueTuple, forming a nested chain" — but never shows what that actually looks like. The BCL only defines <code>ValueTuple</code> through <code>ValueTuple&lt;T1,...,T7&gt;</code> (arity 0 through 7) — there is NO <code>ValueTuple&lt;T1...T8&gt;</code> overload.',
        'For 8 or more elements, the compiler generates <code>ValueTuple&lt;T1,T2,T3,T4,T5,T6,T7,TRest&gt;</code>, where the 8th generic parameter, <code>TRest</code>, is filled in with ANOTHER <code>ValueTuple</code> instance holding the remaining elements — nesting as deep as needed for any arity.',
      ],
    },
    {
      heading: 'The literal 8-tuple syntax is a compiler illusion over the nested TRest chain',
      points: [
        'Writing <code>var t = (1, 2, 3, 4, 5, 6, 7, 8);</code> looks like flat 8-element tuple syntax, but the compiler silently LOWERS it to <code>new ValueTuple&lt;int,int,int,int,int,int,int, ValueTuple&lt;int&gt;&gt;(1,2,3,4,5,6,7, new ValueTuple&lt;int&gt;(8))</code> — the 8th value is wrapped in its own single-element <code>ValueTuple</code>, stored in the <code>Rest</code> field of the outer instance.',
        'This is WHY the runtime field for the 8th-and-beyond elements is literally called <code>.Rest</code> (not <code>.Item8</code>) if you inspect the outer <code>ValueTuple</code> directly via reflection or the debugger — <code>.Item8</code> only exists as a compiler-synthesized convenience property that reaches through <code>.Rest.Item1</code> for you.',
      ],
    },
    {
      heading: 'Named field access still works transparently across the TRest boundary, but only through compiler support',
      points: [
        'A tuple literal like <code>(A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8)</code> still lets you write <code>result.H</code> for the 8th element — the compiler tracks the name-to-position mapping (via <code>TupleElementNamesAttribute</code>, exactly as the main page\'s own theory on named-field erasure describes) and silently rewrites <code>.H</code> into <code>.Rest.Item1</code> at compile time, completely hiding the nested-TRest structure from source code.',
        'This has a real, if rare, practical consequence: reflecting over an 8+ element tuple at RUNTIME (e.g. via <code>ITuple</code> or raw reflection, without the compiler\'s help) exposes the actual nested shape — <code>((ITuple)result).Length</code> correctly reports 8 (it flattens the chain for you), but manually walking <code>.GetType().GetFields()</code> on the outer instance shows only 7 <code>ItemN</code> fields plus one <code>Rest</code> field, not 8 flat fields.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What the literal 8-tuple syntax actually compiles to',
      language: 'csharp',
      code: `// Source code — looks like one flat 8-element tuple:
var t = (1, 2, 3, 4, 5, 6, 7, 8);

Console.WriteLine(t.Item8); // 8 — reads naturally

// What the compiler ACTUALLY generates (simplified, decompiled shape):
ValueTuple<int, int, int, int, int, int, int, ValueTuple<int>> lowered =
    new ValueTuple<int, int, int, int, int, int, int, ValueTuple<int>>(
        1, 2, 3, 4, 5, 6, 7,
        new ValueTuple<int>(8)   // <-- the 8th value, wrapped in its OWN tuple
    );

// ".Item8" is a compiler-synthesized property on ValueTuple<...,TRest>
// that is literally defined as "return Rest.Item1;" — there is no real
// Item8 FIELD on the outer struct, only Item1..Item7 and Rest:
Console.WriteLine(lowered.Rest.Item1); // 8 — same value, direct field access`,
    },
    {
      label: 'Named fields still work across the TRest boundary — via compiler bookkeeping',
      language: 'csharp',
      code: `(int A, int B, int C, int D, int E, int F, int G, int H) named =
    (1, 2, 3, 4, 5, 6, 7, 8);

// This reads naturally, but "H" does not exist as a real field anywhere —
// TupleElementNamesAttribute records the name-to-position mapping, and the
// compiler rewrites ".H" to ".Rest.Item1" behind the scenes:
Console.WriteLine(named.H); // 8

// Proof the underlying storage is still the nested TRest shape —
// casting away the compile-time names and inspecting raw fields:
var raw = ((int, int, int, int, int, int, int, (int,)))(object)named;
Console.WriteLine(raw.Item7);        // 7 — a real field
Console.WriteLine(raw.Rest.Item1);   // 8 — reached through Rest, not Item8`,
    },
    {
      label: 'ITuple flattens the chain at runtime; raw reflection does not',
      language: 'csharp',
      code: `using System.Runtime.CompilerServices;

var t = (1, 2, 3, 4, 5, 6, 7, 8, 9); // 9 elements — two levels of TRest nesting

ITuple asTuple = t;
Console.WriteLine(asTuple.Length);     // 9 — ITuple correctly flattens the chain
Console.WriteLine(asTuple[8]);         // 9 — indexer walks the nested Rest chain for you

// But raw reflection on the OUTER struct's own declared fields tells a
// different story — only 8 fields exist directly on it (Item1..Item7, Rest),
// NOT 9 flat ItemN fields:
var fields = t.GetType().GetFields();
foreach (var f in fields)
    Console.WriteLine(f.Name);
// Output: Item1, Item2, Item3, Item4, Item5, Item6, Item7, Rest
// — "Rest" here is itself a ValueTuple<int, ValueTuple<int>>, nested one
// level deeper to hold elements 8 and 9.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given a 10-element tuple literal <code>(1,2,3,4,5,6,7,8,9,10)</code>, how many LEVELS of nested <code>ValueTuple&lt;..., TRest&gt;</code> does the compiler generate, and what type does the innermost <code>Rest</code> field hold?',
    hint: 'The outer ValueTuple holds elements 1-7 directly, with TRest holding the remaining 3 (elements 8, 9, 10). Since ValueTuple only goes up to 7 elements + TRest, a TRest holding 3 remaining elements just needs ONE more level — it becomes a plain ValueTuple<int,int,int> (arity 3, no further TRest needed since 3 ≤ 7).',
    solution: `// 10-element tuple: (1,2,3,4,5,6,7,8,9,10)
//
// Level 1 (outer): ValueTuple<int,int,int,int,int,int,int, TRest>
//   Item1..Item7 = 1..7
//   Rest (TRest) = holds elements 8, 9, 10
//
// Since only 3 elements remain (8, 9, 10) — and ValueTuple supports up
// to 7 elements directly WITHOUT needing its own TRest — the innermost
// Rest is simply:
//
//   ValueTuple<int, int, int>   (a plain 3-arity ValueTuple, NO further nesting)
//
// So the total nesting is just 2 levels deep (outer + one Rest), not 3 —
// nesting only recurses again if the REMAINING count itself exceeds 7.
// A 15-element tuple, by contrast, WOULD need three levels: outer (1-7),
// then TRest holding 8 more, itself needing its own TRest for element 15.

var t = (1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
Console.WriteLine(t.Item10); // 10 — reached via Rest.Rest.Item... chain
                              // (Item8/9/10 all synthesized through Rest)`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ValueTuple supports any number of elements natively — the BCL must define overloads all the way up.',
      reality: 'the BCL only defines ValueTuple through arity 7 (ValueTuple&lt;T1...T7&gt;) — anything beyond that is the COMPILER nesting ValueTuple&lt;T1...T7,TRest&gt; instances inside each other, invisible in ordinary source code.',
    },
    {
      thought: '.Item8 on an 8+ element tuple is a real field on the outer struct, just like .Item1 through .Item7 are.',
      reality: '.Item8 (and beyond) is a compiler-synthesized property that reaches through the outer struct\'s real .Rest field — inspecting the type\'s actual declared fields via reflection shows only Item1..Item7 and Rest, never a literal Item8.',
    },
    {
      thought: 'reflecting over a large tuple with GetType().GetFields() will show you all N elements as flat, named fields.',
      reality: 'raw reflection on the outer struct only ever shows up to 7 ItemN fields plus one Rest field holding the remainder — use the ITuple interface (Length/indexer) instead if you need a flattened, arity-agnostic view at runtime.',
    },
  ];
}
