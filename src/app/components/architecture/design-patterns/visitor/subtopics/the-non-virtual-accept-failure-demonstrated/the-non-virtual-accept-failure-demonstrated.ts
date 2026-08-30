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
    heading: 'A Failure Mode Described in Prose, Never Actually Triggered',
    points: [
      'One of the main page\'s own quiz questions describes a precise failure: "If accept() is not itself an ' +
      'overridden virtual method on each concrete element... the call resolves visitor.visit(this) using ' +
      'this\'s COMPILE-TIME type... rather than its runtime type, silently invoking the wrong overload." ' +
      'Neither codeTab on the page actually triggers this — both use an INTERFACE (<code>IOrderElement</code>) ' +
      'for elements, and interface method calls are always dispatched on the concrete runtime type by ' +
      'definition, so the exact bug the quiz describes cannot happen with the page\'s own code as written.',
      'The bug the quiz describes specifically needs an ABSTRACT BASE CLASS with a NON-VIRTUAL ' +
      '<code>Accept()</code> that is merely INHERITED (not overridden) by concrete subclasses — a genuinely ' +
      'different shape from what either codeTab demonstrates.',
    ],
  },
  {
    heading: 'Why the Wrong Overload Gets Called, Traced Precisely',
    points: [
      'If <code>Accept()</code> is defined ONCE on the base class and never overridden, calling it through a ' +
      'base-typed reference still correctly reaches that single, shared method body (this part works fine ' +
      'without virtual dispatch, since there is only one Accept() to find). The actual problem is INSIDE that ' +
      'shared method body: <code>this</code> has a COMPILE-TIME type of the BASE class there, since the code ' +
      'is physically written in the base class\'s own file — so <code>visitor.Visit(this)</code> resolves via ' +
      'ORDINARY C# OVERLOAD RESOLUTION (a compile-time decision) against that base-class-typed ' +
      '<code>this</code>, picking whichever <code>Visit</code> overload matches the BASE type, not the ' +
      'object\'s actual runtime concrete type.',
      'This is why double dispatch specifically requires <code>Accept()</code> to be virtual/abstract and ' +
      'OVERRIDDEN separately in every concrete element class: only then does each override\'s own method body ' +
      'have <code>this</code> typed as that SPECIFIC concrete class at compile time, making the second ' +
      '(Visit-side) dispatch resolve correctly.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Broken vs Fixed Accept()',
    language: 'csharp',
    code: `// BROKEN — Accept() is defined ONCE on the base class, never
// overridden. Looks like it should work (every element responds to
// Accept()), but the SECOND dispatch silently resolves wrong.
public abstract class OrderElementBase
{
    // NOT virtual, NOT overridden anywhere — a single shared method.
    public void Accept(IOrderVisitor visitor) => visitor.Visit(this);
    // Inside THIS method body, 'this' has compile-time type
    // OrderElementBase — no matter which concrete subclass actually
    // calls Accept() at runtime.
}

public class ProductItem : OrderElementBase { /* Price, Qty, etc. */ }
public class DiscountItem : OrderElementBase { /* Code, Amount, etc. */ }

// For this to even compile, IOrderVisitor would need a
// Visit(OrderElementBase) overload — and THAT overload is the only
// one 'visitor.Visit(this)' can ever resolve to, regardless of
// whether the actual object is a ProductItem or a DiscountItem.
public interface IOrderVisitor
{
    void Visit(OrderElementBase item); // the ONLY one ever called
    void Visit(ProductItem item);      // silently unreachable via Accept()
    void Visit(DiscountItem item);     // silently unreachable via Accept()
}

var product = new ProductItem();
product.Accept(calculator);
// Calls IOrderVisitor.Visit(OrderElementBase), NOT
// IOrderVisitor.Visit(ProductItem) — even though 'product' is
// genuinely a ProductItem at runtime. No exception, no warning —
// just the wrong overload, silently.

// FIXED — Accept() is abstract on the base, OVERRIDDEN by every
// concrete subclass, exactly like the main page's own interface-
// based elements.
public abstract class OrderElementBase
{
    public abstract void Accept(IOrderVisitor visitor);
}

public class ProductItem : OrderElementBase
{
    public override void Accept(IOrderVisitor visitor) => visitor.Visit(this);
    // Inside THIS override's own body, 'this' has compile-time type
    // ProductItem — so visitor.Visit(this) now correctly resolves to
    // Visit(ProductItem), not Visit(OrderElementBase).
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'In the BROKEN version above, would removing the ' +
    '<code>Visit(OrderElementBase item)</code> overload from <code>IOrderVisitor</code> entirely (leaving ' +
    'only <code>Visit(ProductItem)</code> and <code>Visit(DiscountItem)</code>) fix the bug, make it worse, ' +
    'or something else?',
  hint:
    'Think about what <code>visitor.Visit(this)</code> needs to compile at all, given that <code>this</code> ' +
    'still has compile-time type <code>OrderElementBase</code> inside the shared, non-overridden ' +
    '<code>Accept()</code> method.',
  solution:
    'It would make the bug into a COMPILE ERROR instead of a silent wrong-overload call — arguably an ' +
    'improvement, since the mistake becomes immediately visible instead of hiding at runtime. With no ' +
    'Visit(OrderElementBase) overload available, visitor.Visit(this) inside the shared Accept() method has no ' +
    'matching overload to resolve to at all (this is still statically typed as OrderElementBase there), so ' +
    'the code fails to compile with a clear "no overload matches" error — forcing the actual fix (making ' +
    'Accept() abstract and overridden per concrete class) rather than letting the bug ship silently.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'The main page\'s own quiz question about this failure is purely theoretical — it describes a ' +
      'mistake nobody would realistically make, since Accept() obviously needs to be per-class.',
    reality:
      'It is a genuinely easy mistake for exactly the reason this subtopic\'s BROKEN version demonstrates: the ' +
      'code LOOKS like it should work — every element responds to <code>.Accept(visitor)</code>, nothing ' +
      'throws, nothing looks obviously wrong at the call site. The failure is entirely invisible without ' +
      'either reading the base class\'s own Accept() implementation carefully or noticing the wrong output at ' +
      'runtime.',
  },
  {
    thought: 'Since the main page\'s own codeTabs use an interface (IOrderElement) rather than an abstract ' +
      'class, they must have specifically avoided this bug on purpose.',
    reality:
      'It is likely more that using an interface is simply the more common, idiomatic choice for the Element ' +
      'role in Visitor (no shared implementation to provide, just a contract) — and interfaces happen to make ' +
      'this SPECIFIC bug structurally impossible as a side effect, not because of an explicit design decision ' +
      'to dodge it. An abstract base class remains a completely valid choice for Element, provided Accept() is ' +
      'made abstract (or virtual) and genuinely overridden in every subclass, exactly as this subtopic\'s FIXED ' +
      'version does.',
  },
];

@Component({
  selector: 'app-visitor-the-non-virtual-accept-failure-demonstrated',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-non-virtual-accept-failure-demonstrated.html',
  styleUrl: './the-non-virtual-accept-failure-demonstrated.scss',
})
export class TheNonVirtualAcceptFailureDemonstratedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
