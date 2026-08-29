import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Technique Named, Cost Mentioned, Never Shown',
    points: [
      'The main page\'s own QnA states: "in statically typed languages (C#), dynamic (runtime type ' +
      'resolution) can replace the Accept/Visit pattern at a performance cost." No codeTab on the page shows ' +
      'what this actually looks like, or demonstrates the cost being referenced.',
      'The technique removes the need for elements to implement <code>Accept()</code> — or even know about ' +
      '<code>IOrderVisitor</code> — AT ALL. Instead, the VISITOR itself uses C#\'s <code>dynamic</code> ' +
      'keyword to force the runtime (via the DLR — Dynamic Language Runtime) to resolve which ' +
      '<code>Visit</code> overload matches an element\'s ACTUAL runtime type, rather than relying on ' +
      'compile-time overload resolution.',
    ],
  },
  {
    heading: 'What Is Actually Gained, and What "Performance Cost" Really Means',
    points: [
      'Element classes need ZERO changes — no <code>IOrderElement</code> interface, no <code>Accept()</code> ' +
      'method at all. This is a genuine structural advantage over classic double dispatch when the element ' +
      'classes are from a THIRD-PARTY library you cannot modify to add an <code>Accept()</code> method to.',
      'The "performance cost" is concrete and measurable: every <code>dynamic</code> call the FIRST time a ' +
      'given combination of runtime types is seen triggers the DLR\'s own call-site caching and binding ' +
      'machinery (reflection-based overload resolution) — meaningfully slower than a direct virtual method ' +
      'call, though the DLR does cache the resolved binding per call site for SUBSEQUENT calls with the same ' +
      'types, so the cost is front-loaded rather than paid identically on every single call.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Classic Accept/Visit vs. dynamic',
    language: 'csharp',
    code: `// CLASSIC — the main page's own approach. Elements implement
// Accept(); the compiler resolves overloads via double dispatch.
public interface IOrderElement { void Accept(IOrderVisitor visitor); }
public class ProductItem(decimal price, int qty) : IOrderElement
{
    public decimal Price { get; } = price;
    public int Qty { get; } = qty;
    public void Accept(IOrderVisitor visitor) => visitor.Visit(this);
}

// dynamic-BASED — no Accept() anywhere. ProductItem/DiscountItem/
// ShippingItem could be completely unmodified third-party classes.
public class ProductItem { public decimal Price; public int Qty; }
public class DiscountItem { public decimal Amount; }

public class TotalCalculator
{
    public decimal Total { get; private set; }

    // ONE public entry point — the caller never needs to know the
    // element's concrete type.
    public void Visit(object element)
    {
        dynamic d = element;
        VisitDynamic(d); // forces the DLR to resolve at runtime
    }

    // Overload resolution now happens via the DLR, based on the
    // ACTUAL runtime type wrapped in 'dynamic' — not the compile-time
    // type of the 'object element' parameter above.
    private void VisitDynamic(ProductItem item)  => Total += item.Price * item.Qty;
    private void VisitDynamic(DiscountItem item) => Total -= item.Amount;
}

var calc = new TotalCalculator();
object[] elements = { new ProductItem { Price = 9.99m, Qty = 3 }, new DiscountItem { Amount = 5m } };
foreach (var e in elements) calc.Visit(e);
// Correctly dispatches to VisitDynamic(ProductItem) then
// VisitDynamic(DiscountItem) — despite 'elements' being a plain
// object[] with no shared interface, and neither class implementing
// Accept() at all.

// What happens with NO matching overload — the real risk dynamic
// introduces that classic double dispatch does not have:
var elements2 = new object[] { "not an order element" };
foreach (var e in elements2) calc.Visit(e);
// Throws RuntimeBinderException at RUNTIME — "no overload for
// method 'VisitDynamic' takes 1 arguments" (well, closer to "cannot
// convert" for a string) — a runtime failure. The classic
// Accept/Visit version would have caught a mismatched type at
// COMPILE TIME instead, since IOrderElement itself constrains what
// can ever be passed in.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A caller mistakenly passes an element type that has NO matching <code>VisitDynamic</code> overload at ' +
    'all into <code>calc.Visit(e)</code>. Under the classic Accept/Visit approach (the main page\'s own ' +
    'codeTab), would the equivalent mistake be caught at compile time or runtime? What about the ' +
    '<code>dynamic</code>-based version?',
  hint:
    'Think about what actually constrains which objects can be passed into each approach\'s entry point — an ' +
    'interface requirement, versus a bare <code>object</code> parameter.',
  solution:
    'Under the classic Accept/Visit approach, this mistake is caught at COMPILE TIME — only objects ' +
    'implementing IOrderElement can be passed to Accept() at all, and the compiler enforces that every such ' +
    'object has a corresponding Visit() overload available (since IOrderElement itself has no other way to be ' +
    'called). Under the dynamic-based version, it is caught only at RUNTIME, via a RuntimeBinderException, ' +
    'since the entry point accepts a bare object with no compile-time guarantee that a matching VisitDynamic ' +
    'overload exists at all. This is the real trade-off dynamic introduces: more flexibility about which ' +
    'classes can participate, at the cost of moving a whole category of errors from compile time to runtime.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the dynamic-based approach avoids needing an Accept() method, it is a strictly simpler, ' +
      'better alternative to classic Visitor for any C# codebase.',
    reality:
      'The main page\'s own QnA already names the trade-off precisely: a real performance cost (DLR ' +
      'resolution overhead), and — as this subtopic\'s own exercise shows — a category of errors that moves ' +
      'from compile-time (classic Accept/Visit) to runtime (dynamic). "Idiomatic, performant" is literally how ' +
      'the same QnA describes the classic approach for C# specifically; dynamic is presented as the exception ' +
      'for cases where modifying the element classes to add Accept() genuinely is not possible.',
  },
  {
    thought: 'The DLR resolves a dynamic call exactly the same way every single time it runs, so there is no ' +
      'meaningful difference between the first call and the hundredth call with the same argument type.',
    reality:
      'The DLR caches the resolved binding PER CALL SITE once a given combination of runtime types has been ' +
      'seen there — so the real performance cost is concentrated on the FIRST call for a given type at a given ' +
      'call site (or after the cache is invalidated), not spread identically across every call. This nuance ' +
      'matters for correctly reasoning about where the "performance cost" the main page\'s own QnA mentions ' +
      'actually shows up in a real profiling session.',
  },
];

@Component({
  selector: 'app-visitor-simulating-double-dispatch-with-dynamic',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './simulating-double-dispatch-with-dynamic.html',
  styleUrl: './simulating-double-dispatch-with-dynamic.scss',
})
export class SimulatingDoubleDispatchWithDynamicSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
