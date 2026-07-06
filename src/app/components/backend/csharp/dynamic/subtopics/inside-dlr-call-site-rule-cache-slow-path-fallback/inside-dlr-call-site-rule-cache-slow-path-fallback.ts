import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-inside-dlr-call-site-rule-cache-slow-path-fallback-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './inside-dlr-call-site-rule-cache-slow-path-fallback.html',
  styleUrl: './inside-dlr-call-site-rule-cache-slow-path-fallback.scss',
})
export class InsideDlrCallSiteRuleCacheSlowPathFallbackSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states call sites cache "per operand types" — this is the actual mechanism, and what happens when it stops helping',
      points: [
        'The main dynamic & the DLR page states that a <code>CallSite&lt;T&gt;</code> "caches the binder result per operand types" and that "when operand types vary widely across iterations, the call-site cache degrades." This is precisely the SAME concept as a polymorphic inline cache in other dynamic-dispatch runtimes (JavaScript engines, Smalltalk) — worth seeing the actual monomorphic → polymorphic → megamorphic progression concretely.',
      ],
    },
    {
      heading: 'Monomorphic: one type seen, one cached rule, near-delegate speed',
      points: [
        'The FIRST time a <code>dynamic</code> call site executes with a SPECIFIC combination of operand runtime types, the C# binder does real work: it resolves which member/overload applies, and produces a "Rule" — essentially compiled logic that says "IF the operand is exactly THIS type, THEN do THIS." That rule is stored directly on the call site. As long as EVERY subsequent call uses operands of the SAME type, the call site just executes the cached rule directly — this is the "monomorphic" (one shape) case, and it is genuinely close to static-dispatch speed.',
      ],
    },
    {
      heading: 'Polymorphic: a handful of distinct types, a small ordered list of rules, checked in sequence',
      points: [
        'When the SAME call site is later invoked with a DIFFERENT operand type, the existing monomorphic rule\'s type check fails — the binder resolves a NEW rule for this new type and adds it to a small, ordered LIST of rules on the call site (rather than replacing the old one), because the SAME call site may keep alternating between a few known types (e.g. a loop processing a mixed collection of 2-3 distinct object types). Each call now checks the list of cached rules in order, using the first one whose type guard matches — still much faster than a fresh binder resolution, but slower than the pure monomorphic case since multiple guards may need checking.',
        'This is exactly what the main page means by "it stores multiple rules and falls back to a lookup on each miss" — the "lookup" IS this ordered-list check against the small set of accumulated rules.',
      ],
    },
    {
      heading: 'Megamorphic: too many distinct types, the rule list stops helping, back to full re-resolution',
      points: [
        'If a call site keeps encountering GENUINELY DIFFERENT operand types call after call (a truly polymorphic/heterogeneous workload — e.g. dynamic dispatch over dozens of distinct types with no pattern of repetition), the rule list grows without ever converging — every call is effectively a NEW type, so no cached rule ever matches, and the binder must re-resolve from scratch on EVERY call. This "megamorphic" case is exactly the scenario where the main page recommends "explicit interfaces or expression trees compile down to something faster" — the entire benefit of call-site caching evaporates when there is no type repetition to exploit.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Monomorphic — one type, cached rule reused every iteration',
      language: 'csharp',
      code: `// A loop calling the SAME member on the SAME runtime type, every
// single iteration — the textbook monomorphic call site:
List<dynamic> sameTypeItems = Enumerable.Range(0, 1000)
    .Select(i => (dynamic)new Product { Name = $"Item{i}" })
    .ToList();

foreach (dynamic item in sameTypeItems)
{
    // FIRST call: binder does real work — resolves "Name" against
    // Product's actual member, produces and caches a Rule.
    //
    // Every SUBSEQUENT call: the SAME cached rule matches immediately
    // (operand is STILL a Product every time) — this is near
    // delegate-call speed, exactly as the main page describes:
    Console.WriteLine(item.Name);
}

record Product { public string Name { get; set; } = ""; }`,
    },
    {
      label: 'Polymorphic — a small, stable set of alternating types, multiple cached rules',
      language: 'csharp',
      code: `// A call site alternating between a SMALL, STABLE set of distinct
// types — e.g. two known shapes in a visitor-style pattern:
List<dynamic> mixedItems = new()
{
    (dynamic)new Product { Name = "Widget" },
    (dynamic)new Customer { Name = "Alice" },
    (dynamic)new Product { Name = "Gadget" },
    (dynamic)new Customer { Name = "Bob" },
};

foreach (dynamic item in mixedItems)
{
    // The call site now accumulates TWO cached rules — one for
    // Product.Name, one for Customer.Name — checked in order on each
    // call. Still much faster than fresh resolution every time, since
    // the SET of types repeats and stabilizes quickly:
    Console.WriteLine(item.Name);
}

record Product  { public string Name { get; set; } = ""; }
record Customer { public string Name { get; set; } = ""; }
// A call site handling 2-3 STABLE, REPEATING types like this stays
// "polymorphic" rather than degrading further — the rule list simply
// grows to accommodate the small, fixed set actually encountered.`,
    },
    {
      label: 'Megamorphic — genuinely never-repeating types, every call re-resolves from scratch',
      language: 'csharp',
      code: `// A call site seeing a GENUINELY NEW, never-repeated type on
// EVERY call — the rule cache can never converge, because no type
// ever matches a PREVIOUSLY cached rule:
static void PrintName(dynamic obj) => Console.WriteLine(obj.Name);

// Each of these calls has a DIFFERENT anonymous type shape — the
// runtime type is genuinely distinct every single time:
PrintName(new { Name = "A", Extra1 = 1 });
PrintName(new { Name = "B", Extra1 = 1, Extra2 = 2 });
PrintName(new { Name = "C", Extra1 = 1, Extra2 = 2, Extra3 = 3 });
// ... imagine hundreds more, each with a slightly different shape ...

// This is the MEGAMORPHIC case: the rule cache never helps, because
// no two calls share the same runtime type. Every single call pays
// the FULL binder-resolution cost, exactly the scenario the main
// page warns "explicit interfaces or expression trees compile down
// to something faster" for — call-site caching provides ZERO benefit
// when there is no type repetition to exploit at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A dynamic call site inside a hot loop processes a collection where 95% of items are one type (<code>OrderLine</code>) and 5% are a rare second type (<code>DiscountLine</code>), appearing in no particular pattern. Explain whether this call site behaves closer to the monomorphic, polymorphic, or megamorphic case, and what that means for its actual performance.',
    hint: 'Consider how many DISTINCT types the call site sees overall (not how often each one appears) — the rule cache accumulates one rule per distinct type it has ever seen, regardless of how rare that type is.',
    solution: `// This scenario is genuinely POLYMORPHIC, not megamorphic — even
// though the SPLIT is heavily skewed (95%/5%), there are only TWO
// distinct runtime types involved TOTAL, appearing repeatedly:
//
//   OrderLine     — appears ~950 times per 1000 items
//   DiscountLine  — appears ~50 times per 1000 items
//
// The call site accumulates exactly TWO cached rules (one per type)
// and stabilizes quickly — after both types have been seen at least
// once, EVERY subsequent call (whichever type it happens to be)
// matches an ALREADY-cached rule, checked via the small ordered list.
//
// Performance-wise, this is much closer to the polymorphic case's
// "near-delegate speed with a small list-check overhead" than to the
// megamorphic case's "full re-resolution every single call" — the
// KEY factor is the number of DISTINCT types ever encountered (here,
// just 2), not their relative FREQUENCY. A call site that alternates
// between the SAME two known types forever, even if wildly unevenly
// split, never degrades to megamorphic — it would only become
// megamorphic if it kept encountering GENUINELY NEW, never-repeated
// types call after call, which is not what's happening here at all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a dynamic call site\'s performance depends primarily on how OFTEN a specific type appears relative to others.',
      reality: 'it depends on how many DISTINCT types the call site has EVER encountered, and whether that set stabilizes — a heavily skewed 95%/5% split between just two types stays comfortably polymorphic, while genuinely new, never-repeating types on every call degrade to megamorphic regardless of any particular type\'s frequency.',
    },
    {
      thought: 'once a call site has cached ANY rule, all future calls through it are equally fast regardless of operand type.',
      reality: 'a cached rule only accelerates calls whose operand type MATCHES that specific rule\'s guard — a call site with multiple cached rules (polymorphic case) still pays a small ordered-list-check cost, and completely new types pay full binder-resolution cost regardless of how many OTHER rules are already cached.',
    },
    {
      thought: 'the "monomorphic/polymorphic/megamorphic" terminology is specific to JavaScript engines and unrelated to how C#\'s dynamic keyword actually works.',
      reality: 'the DLR\'s CallSite<T> rule-caching mechanism follows the exact same conceptual progression as polymorphic inline caching in other dynamic-dispatch runtimes — the main page\'s own description of caching "per operand types" and degrading when "types vary widely" is describing precisely this same behavior.',
    },
  ];
}
