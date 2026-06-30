import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'Intent',         type: 'keyword',   desc: 'Define a new operation on elements of an object structure without changing their classes.' },
  { name: 'Visitor',        type: 'interface', desc: 'Declares a Visit method per concrete element type — one overload per element.' },
  { name: 'Element',        type: 'interface', desc: 'Declares Accept(IVisitor) — calls visitor.Visit(this) to dispatch to the correct Visit overload.' },
  { name: 'Double Dispatch', type: 'keyword',  desc: 'Accept(visitor) on the element then Visit(element) on the visitor — two virtual calls to reach the right method.' },
  { name: 'Open/Closed',    type: 'keyword',   desc: 'New operations = new Visitor classes. New element types = new Visit overloads in ALL visitors.' },
  { name: 'vs Iterator',    type: 'keyword',   desc: 'Iterator traverses a collection. Visitor performs operations on each element during traversal.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Visitor Pattern?',
    points: [
      'Visitor adds new operations to an existing class hierarchy without modifying the classes.',
      'Each Visitor class represents one operation (TaxCalculation, Serialisation, PrettyPrint).',
      'Each element class accepts a visitor — delegating to visitor.Visit(this) via double dispatch.',
      'New operations = new Visitor classes; element classes never change.',
    ],
  },
  {
    heading: 'Double Dispatch',
    points: [
      'Single dispatch: method selection based on one object\'s runtime type (normal virtual calls).',
      'Double dispatch: selection based on TWO objects\' runtime types — the element type AND the visitor type.',
      'element.Accept(visitor): first dispatch — selects the concrete element\'s Accept().',
      'visitor.Visit(this): second dispatch — selects the Visit() overload for this element type.',
    ],
  },
  {
    heading: 'Visitor vs Other Patterns',
    points: [
      'Composite + Visitor: very common pairing — Composite builds the tree; Visitor traverses and operates on it.',
      'Visitor vs Strategy: Strategy replaces one algorithm; Visitor adds operations to a type hierarchy without changing it.',
      'Visitor vs Iterator: Iterator traverses; Visitor operates. Often combined: Iterator provides traversal; Visitor operates during traversal.',
      'Trade-off: Visitor makes adding new operations easy; adding new element types is hard (all visitors need a new Visit overload).',
    ],
  },
  {
    heading: '.NET Examples',
    points: [
      'LINQ Expression Trees: ExpressionVisitor base class — visitors traverse and transform expression trees.',
      'Roslyn Syntax Trees: CSharpSyntaxWalker/Rewriter — visitors for C# code analysis and transformation.',
      'ReSharper/Analyzers: code analysis tools use Visitor over syntax trees.',
      'JSON.NET / System.Text.Json: serialisation visitors that traverse object graphs.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Price + Tax Visitor',
    language: 'csharp',
    code: `// Element interface
public interface IOrderElement
{
    void Accept(IOrderVisitor visitor);
}

// Visitor interface — one Visit overload per element type
public interface IOrderVisitor
{
    void Visit(ProductItem item);
    void Visit(DiscountItem item);
    void Visit(ShippingItem item);
}

// Concrete Elements
public class ProductItem(string name, decimal price, int qty) : IOrderElement
{
    public string  Name  { get; } = name;
    public decimal Price { get; } = price;
    public int     Qty   { get; } = qty;

    // Double dispatch: calls visitor.Visit(this) → routes to ProductItem overload
    public void Accept(IOrderVisitor visitor) => visitor.Visit(this);
}

public class DiscountItem(string code, decimal amount) : IOrderElement
{
    public string  Code   { get; } = code;
    public decimal Amount { get; } = amount;
    public void Accept(IOrderVisitor visitor) => visitor.Visit(this);
}

public class ShippingItem(string method, decimal cost) : IOrderElement
{
    public string  Method { get; } = method;
    public decimal Cost   { get; } = cost;
    public void Accept(IOrderVisitor visitor) => visitor.Visit(this);
}

// Visitor 1: calculate order total
public class TotalCalculator : IOrderVisitor
{
    public decimal Total { get; private set; }

    public void Visit(ProductItem item) => Total += item.Price * item.Qty;
    public void Visit(DiscountItem item) => Total -= item.Amount;
    public void Visit(ShippingItem item) => Total += item.Cost;
}

// Visitor 2: generate receipt
public class ReceiptPrinter : IOrderVisitor
{
    private readonly List<string> _lines = new();
    public string Receipt => string.Join("\n", _lines);

    public void Visit(ProductItem item) =>
        _lines.Add($"{item.Name} x{item.Qty} @ {item.Price:C} = {item.Price * item.Qty:C}");

    public void Visit(DiscountItem item) =>
        _lines.Add($"Discount [{item.Code}]: -{item.Amount:C}");

    public void Visit(ShippingItem item) =>
        _lines.Add($"Shipping ({item.Method}): {item.Cost:C}");
}

// Usage — same elements, two operations, no element classes changed
var elements = new IOrderElement[]
{
    new ProductItem("Widget", 9.99m, 3),
    new ProductItem("Gadget", 24.99m, 1),
    new DiscountItem("SAVE10", 5.00m),
    new ShippingItem("Standard", 4.99m)
};

var calc    = new TotalCalculator();
var printer = new ReceiptPrinter();
foreach (var e in elements) { e.Accept(calc); e.Accept(printer); }

Console.WriteLine(printer.Receipt);
Console.WriteLine($"Total: {calc.Total:C}");`,
  },
  {
    label: 'Expression Tree Visitor',
    language: 'csharp',
    code: `// .NET ExpressionVisitor — built-in Visitor for LINQ expression trees
public class ParameterReplacer(ParameterExpression old, ParameterExpression @new)
    : ExpressionVisitor
{
    protected override Expression VisitParameter(ParameterExpression node) =>
        node == old ? @new : base.VisitParameter(node);
}

// Usage: combine two predicates that use different parameters
Expression<Func<User, bool>> isActive = u => u.IsActive;
Expression<Func<User, bool>> isAdmin  = u => u.IsAdmin;

var param   = isActive.Parameters[0];
var body2   = new ParameterReplacer(isAdmin.Parameters[0], param).Visit(isAdmin.Body);
var combined = Expression.Lambda<Func<User, bool>>(
    Expression.AndAlso(isActive.Body, body2), param);

// combined: u => u.IsActive && u.IsAdmin — ready for EF Core
var admins = db.Users.Where(combined).ToList();`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not implementing Accept() — calling Visit() directly',
    wrong: `visitor.Visit((ProductItem)element); // breaks double dispatch — relies on cast`,
    right: `element.Accept(visitor); // double dispatch: element routes to correct Visit() overload`,
    explanation: 'Calling Visit() directly requires knowing the element\'s concrete type. Accept() enables double dispatch — the element dispatches to the right Visit() overload based on its own runtime type, with no type-checking by the caller.',
  },
  {
    title: 'Visitor accumulating state without resetting between uses',
    wrong: `var calc = new TotalCalculator();
// Process order 1
foreach (var e in order1) e.Accept(calc);
// Process order 2 — Total still includes order 1!
foreach (var e in order2) e.Accept(calc);`,
    right: `// Either reset: calc.Reset() before each use,
// or create a new visitor instance per operation`,
    explanation: 'Visitor classes accumulate state (total, receipt lines). Reusing a visitor across multiple operations gives wrong results. Create a new visitor instance per operation or provide an explicit Reset() method.',
  },
  {
    title: 'Adding element-specific logic to the visitor',
    wrong: `public void Visit(ProductItem item)
{
    if (item.Name.StartsWith("SALE-")) Total -= item.Price * 0.1m; // element knowledge in visitor
}`,
    right: `// Element-specific rules belong in the element or a domain service
// Visitor knows the interface, not the domain rules of specific element types`,
    explanation: 'Visitors should operate on the element\'s public interface — they must not contain special-cased logic based on element-specific knowledge that bypasses the interface.',
  },
  {
    title: 'Forgetting to add a Visit overload when a new element type is added',
    wrong: `// Added new TaxItem : IOrderElement
// Forgot to add Visit(TaxItem) to IOrderVisitor interface and all implementations`,
    right: `// When adding a new element type:
// 1. Add Visit(NewElement) to IOrderVisitor
// 2. Update ALL concrete Visitor classes
// This is the known trade-off — Visitor makes adding elements hard`,
    explanation: 'Adding a new element type requires updating ALL visitor implementations. This is the classic Visitor trade-off: easy to add operations (new visitor class), hard to add element types (all visitors change).',
  },
];

const challenge: Challenge = {
  title: 'Document Export Visitor',
  language: 'typescript',
  description: `Implement Visitor for a document model.
Elements: Heading, Paragraph, Image — all implement accept(visitor).
Visitors: HtmlExporter and MarkdownExporter.
Show double dispatch: each element calls visitor.visitX(this).`,
  hints: [
    'IDocVisitor has visitHeading, visitParagraph, visitImage',
    'Each element\'s accept() calls the matching visitor method',
    'HtmlExporter and MarkdownExporter produce different output strings',
  ],
  starterCode: `interface IDocVisitor {
  visitHeading(h: Heading): string;
  visitParagraph(p: Paragraph): string;
  visitImage(img: Image): string;
}

interface IDocElement { accept(v: IDocVisitor): string; }

class Heading implements IDocElement {
  constructor(public text: string, public level: number) {}
  accept(v: IDocVisitor): string { return v.visitHeading(this); }
}

// TODO: Paragraph, Image, HtmlExporter, MarkdownExporter`,
  solution: `interface IDocVisitor {
  visitHeading(h: Heading): string;
  visitParagraph(p: Paragraph): string;
  visitImage(img: DocImage): string;
}

interface IDocElement { accept(v: IDocVisitor): string; }

class Heading implements IDocElement {
  constructor(public text: string, public level: number) {}
  accept(v: IDocVisitor): string { return v.visitHeading(this); }
}

class Paragraph implements IDocElement {
  constructor(public text: string) {}
  accept(v: IDocVisitor): string { return v.visitParagraph(this); }
}

class DocImage implements IDocElement {
  constructor(public src: string, public alt: string) {}
  accept(v: IDocVisitor): string { return v.visitImage(this); }
}

class HtmlExporter implements IDocVisitor {
  visitHeading(h: Heading): string { return \`<h\${h.level}>\${h.text}</h\${h.level}>\`; }
  visitParagraph(p: Paragraph): string { return \`<p>\${p.text}</p>\`; }
  visitImage(img: DocImage): string { return \`<img src="\${img.src}" alt="\${img.alt}">\`; }
}

class MarkdownExporter implements IDocVisitor {
  visitHeading(h: Heading): string { return \`\${'#'.repeat(h.level)} \${h.text}\`; }
  visitParagraph(p: Paragraph): string { return \`\${p.text}\n\`; }
  visitImage(img: DocImage): string { return \`![\${img.alt}](\${img.src})\`; }
}

const doc: IDocElement[] = [
  new Heading('Hello World', 1),
  new Paragraph('This is a document.'),
  new DocImage('logo.png', 'Logo'),
];

const html = new HtmlExporter();
const md   = new MarkdownExporter();
doc.forEach(e => console.log(e.accept(html)));
doc.forEach(e => console.log(e.accept(md)));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is "double dispatch" in the context of Visitor?',
    options: [
      'Calling two visitor methods on the same element',
      'Two virtual calls: element.Accept(visitor) then visitor.Visit(element) — routing based on both objects\' runtime types',
      'Dispatching the same visitor to two different element hierarchies',
      'A performance optimisation for visitor traversal',
    ],
    answer: 1,
    explanation: 'Double dispatch resolves method selection based on TWO objects\' types. element.Accept(visitor) dispatches on the element\'s type (first dispatch). Inside Accept(), visitor.Visit(this) dispatches on the visitor\'s type (second dispatch). Together they reach the exact Visit(ConcreteElement) overload.',
  },
  {
    q: '.NET\'s ExpressionVisitor class is used for:',
    options: [
      'Visiting memory addresses',
      'Traversing and transforming LINQ Expression Trees',
      'Iterating collections with complex predicates',
      'Generating IL code at runtime',
    ],
    answer: 1,
    explanation: 'ExpressionVisitor is a built-in Visitor base class for LINQ Expression Trees. Roslyn\'s CSharpSyntaxWalker/Rewriter follows the same pattern for C# source code trees. These are the most prominent Visitor uses in .NET.',
  },
  {
    q: 'What is the main trade-off of the Visitor pattern?',
    options: [
      'Adding new operations is hard; adding new element types is easy',
      'Adding new operations is easy (new Visitor class); adding new element types is hard (all Visitors need a new Visit overload)',
      'Both operations and element types are easy to add',
      'Both operations and element types are hard to add',
    ],
    answer: 1,
    explanation: 'Visitor\'s trade-off is asymmetric: adding a new operation = one new Visitor class (easy). Adding a new element type = adding a new Visit() overload to the IVisitor interface AND every concrete Visitor (hard). Choose Visitor when operations vary more than element types.',
  },
  { q: 'What is the Visitor pattern and what does it enable?', options: ['A design pattern for controlling access rights of guest users', 'A behavioral pattern that lets you define a new operation on elements of an object structure without modifying the classes of those elements, by separating the algorithm from the object structure', 'A pattern for iterating through a collection and applying a callback', 'A pattern for handling HTTP visitor tracking in web analytics'], answer: 1, explanation: 'Visitor adds new operations to an existing class hierarchy without modifying those classes. The visitor object visits each element in the structure. Each element accepts the visitor: element.accept(visitor). The element then calls the visitor method specific to its type: visitor.visitCircle(this) or visitor.visitRectangle(this). This is called double dispatch: the right method is selected based on both the visitor type and the element type. Adding a new operation: create a new Visitor class with methods for each element type. No change to element classes.' },
  { q: 'What is double dispatch and why does Visitor require it?', options: ['Dispatching a method call twice for reliability', 'Method selection based on the runtime types of two objects (visitor and element), since standard method overloading in most OO languages selects methods based on compile-time types only', 'Calling a method on two different objects simultaneously', 'A pattern for handling both synchronous and asynchronous dispatch'], answer: 1, explanation: 'Single dispatch (normal method calls): the method is selected based on the runtime type of the receiver object only. visitor.visit(element) — the visit overload called depends on the compile-time type of element, not the runtime type. Double dispatch: select the method based on both the visitor type AND the element type. Visitor achieves this via accept(visitor): the element calls visitor.visitCircle(this) — the visitCircle is selected by the visitor runtime type, and this is the runtime Circle type. Both runtime types participate in method selection. Languages with multi-methods (Common Lisp, Julia) support double dispatch natively without the Visitor pattern.' },
  { q: 'What is the trade-off between Visitor and adding virtual methods to elements?', options: ['Visitor is always better because it eliminates the need for virtual methods', 'Visitor makes it easy to add new operations (new Visitor class) but hard to add new element types (all Visitors must be updated); virtual methods make it easy to add elements (override in the subclass) but hard to add operations (change all classes)', 'Virtual methods require double dispatch; Visitor uses single dispatch', 'Visitor operates at compile time; virtual methods operate at runtime'], answer: 1, explanation: 'The Expression Problem: you want to add both new types and new operations easily. Virtual methods (OOP approach): adding a new element type is easy (create a subclass and override). Adding a new operation means adding a method to every element class. Visitor (functional approach): adding a new operation is easy (new Visitor class). Adding a new element type means adding visitNewElement() to every existing Visitor. The choice depends on which dimension changes more: if you add more operations than types, Visitor wins. If you add more types than operations, virtual methods win.' },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use Visitor vs just adding methods to elements?',
    a: 'Add methods to elements when the operation is stable and closely related to the element\'s core behaviour. Use Visitor when: (1) new operations are added frequently, (2) operations are unrelated to core element behaviour, (3) you want to keep element classes small and focused, (4) operations span a complex hierarchy (Composite + Visitor). Visitor prevents element classes from bloating with every new operation.',
  },
  {
    q: 'Can Visitor work without double dispatch (in a dynamically typed language)?',
    a: 'Yes — in Python or JavaScript, you can use pattern matching or dynamic dispatch to simulate double dispatch. But in statically typed languages (C#), dynamic (runtime type resolution) can replace the Accept/Visit pattern at a performance cost. Classic Visitor with Accept() is the idiomatic, performant approach in C#.',
  },
  { q: 'How does Visitor combine with Composite pattern?', a: 'Visitor and Composite work naturally together. The Composite defines a tree structure of elements. Visitor traverses the tree and applies an operation to each node without modifying the node classes. accept(visitor) on the composite calls visitor.visitComposite(this) then iterates children calling child.accept(visitor). accept(visitor) on the leaf calls visitor.visitLeaf(this). The visitor accumulates results across the traversal. Example: AST (Abstract Syntax Tree) with Composite structure. A PrettyPrintVisitor traverses the AST and formats code. A TypeCheckVisitor traverses and validates type rules. An OptimizationVisitor traverses and rewrites the tree. Each is a separate Visitor without modifying the AST node classes.' },
  { q: 'How is Visitor used in compiler design?', a: 'Compilers use Visitor extensively for AST traversal. The AST is built once during parsing. Multiple visitors traverse the same AST for different compiler phases: semantic analysis (type checking), constant folding (optimization), code generation (backend), pretty printing (formatting), and source maps (debugging). Each phase is a separate Visitor class. Adding a new compiler phase (e.g., a new optimization pass) adds a new Visitor without modifying AST nodes. Languages: ANTLR generates Visitor base classes from grammar rules. LLVM uses Visitor-like InstVisitor for instruction processing. Java compiler javac uses Visitor for tree operations in the compiler IR.' },
  { q: 'When is Visitor an anti-pattern?', a: 'Visitor is an anti-pattern when: the class hierarchy changes frequently (new element types). Every type addition requires updating all Visitors. If you have 10 visitors and add a new element type, you must update 10 Visitor classes. In this case, virtual methods on element classes are better. When the element classes can be modified: adding a virtual method to element classes directly is simpler and more type-safe than the Visitor indirection. When there is only one or two operations on a stable hierarchy: Visitor overhead is not justified. Visitor is appropriate for stable, fixed element hierarchies where many operations need to be added over time. If the hierarchy changes more often than operations do, avoid Visitor.' },
  { q: 'How does the accumulate-state visitor work for complex traversals?', a: 'An accumulating visitor maintains state across visits to build a result from the entire structure traversal. Example: TotalCostVisitor on an order structure visits each OrderItem and adds its cost to a running total. OrderGroup visits sub-items recursively. The final total is retrieved from the visitor after traversal: double total = visitor.getTotal(). This is a fold/reduce over the object structure. Another example: DocumentStatisticsVisitor counts words, sentences, and paragraphs by visiting each section and paragraph node. Contrast with stateless visitors that only perform actions (printing, logging) without accumulating a result. Both are valid; stateful visitors produce computed results while stateless visitors perform side effects.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Visitor adds new operations to a type hierarchy without modifying element classes — double dispatch (Accept then Visit) routes to the right method for each element type.',
  mustKnow: [
    'element.Accept(visitor) → visitor.Visit(this): double dispatch to reach exact Visit overload',
    'New operation = new Visitor class (easy); new element type = update ALL visitors (hard)',
    'Visitor + Composite is a very common pairing (traversal + operation)',
    '.NET: ExpressionVisitor for LINQ trees, Roslyn SyntaxWalker for C# AST',
    'Visitor state must be reset (or re-created) between separate operations',
  ],
  interviewFocus: [
    'Explain double dispatch — why is it needed for Visitor?',
    'What is the trade-off: easy to add operations vs hard to add element types?',
    'How does ExpressionVisitor in .NET use the Visitor pattern?',
  ],
};

@Component({
  selector: 'app-dp-visitor',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './visitor.html',
  styleUrl: './visitor.scss',
})
export class DpVisitor {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
