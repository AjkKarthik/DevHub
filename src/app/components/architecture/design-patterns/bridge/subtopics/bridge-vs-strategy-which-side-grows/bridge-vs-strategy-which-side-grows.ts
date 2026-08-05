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
    heading: 'A Fuzzy Distinction Worth Making Concrete',
    points: [
      'The main page\'s own QnA says: "In Strategy, both the context and strategy are typically concrete ' +
      'classes. In Bridge, both the abstraction and the implementation are hierarchies of related types." ' +
      'True, but stated abstractly enough that it is easy to nod along without being able to apply it.',
      'The concrete version of that claim: Bridge is designed with the expectation that BOTH sides will grow ' +
      '— new Refined Abstractions AND new ConcreteImplementors are both first-class extension points. Strategy ' +
      'expects growth on ONE side only — new strategies — while Context stays a single class.',
    ],
  },
  {
    heading: 'Extending Both Sides of a Bridge',
    points: [
      'Starting from the main page\'s <code>Shape</code>/<code>IRenderer</code> hierarchy: adding a THIRD ' +
      'shape (Triangle) needs one new class that implements <code>Draw()</code>/<code>Resize()</code> in ' +
      'terms of <code>IRenderer</code> — nothing about <code>IRenderer</code>, <code>VectorRenderer</code>, or ' +
      '<code>RasterRenderer</code> changes.',
      'Adding a THIRD renderer (a hypothetical <code>SvgRenderer</code>) needs one new class implementing ' +
      '<code>IRenderer</code> — nothing about <code>Shape</code>, <code>Circle</code>, or <code>Square</code> ' +
      'changes, and the new renderer immediately works with every existing shape, including the new Triangle.',
      'Both extensions are genuinely independent — this two-sided extensibility, not just "there are two ' +
      'classes involved," is what the QnA means by "hierarchies of related types" on both ends.',
    ],
  },
  {
    heading: 'Why Strategy Only Grows on One Side',
    points: [
      'A typical Strategy setup — say, a <code>PriceCalculator</code> that accepts a ' +
      '<code>IDiscountStrategy</code> — adds new behavior by writing a new ' +
      '<code>IDiscountStrategy</code> implementation (SeasonalDiscount, LoyaltyDiscount, and so on).',
      '<code>PriceCalculator</code> itself almost never grows into its own hierarchy — there is usually no ' +
      '"Refined PriceCalculator" concept the way Bridge has Refined Abstractions. The context class stays one ' +
      'class; only the algorithm side varies.',
      'This is the structural tell: if a design has an interface for the "algorithm" side but the "context" ' +
      'side is a single, non-extended class, that is Strategy. If BOTH sides are designed as extensible ' +
      'hierarchies from the start, that is Bridge.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Bridge — Both Sides Extend',
    language: 'csharp',
    code: `// New Refined Abstraction — zero changes to IRenderer or existing renderers
public class Triangle(IRenderer renderer, float baseLength, float height) : Shape(renderer)
{
    private float _base = baseLength, _height = height;
    public override void Draw() => Renderer.RenderTriangle(_base, _height);
    public override void Resize(float factor) { _base *= factor; _height *= factor; }
}

// New ConcreteImplementor — zero changes to Shape or existing shapes.
// IRenderer needs RenderTriangle added once; every OTHER renderer needs it
// added too, but that is the one honest cost of adding a new abstraction —
// still far cheaper than the N x M explosion Bridge exists to avoid.
public interface IRenderer
{
    void RenderCircle(float radius);
    void RenderSquare(float side);
    void RenderTriangle(float baseLength, float height);
}

public class SvgRenderer : IRenderer
{
    public void RenderCircle(float r) => Console.WriteLine($"<circle r=\\"{r}\\" />");
    public void RenderSquare(float s) => Console.WriteLine($"<rect width=\\"{s}\\" height=\\"{s}\\" />");
    public void RenderTriangle(float b, float h) => Console.WriteLine($"<polygon points=\\"triangle b={b} h={h}\\" />");
}

// The new renderer works with EVERY shape, old and new, with no shape-side changes
IRenderer svg = new SvgRenderer();
var shapes = new Shape[] { new Circle(svg, 5), new Triangle(svg, 4, 3) };
foreach (var s in shapes) s.Draw();`,
  },
  {
    label: 'Strategy — Only One Side Extends',
    language: 'csharp',
    code: `// Algorithm side grows freely — this is what Strategy is FOR
public interface IDiscountStrategy { decimal Apply(decimal price); }
public class NoDiscount : IDiscountStrategy { public decimal Apply(decimal p) => p; }
public class SeasonalDiscount(decimal pct) : IDiscountStrategy
{
    public decimal Apply(decimal p) => p * (1 - pct);
}
public class LoyaltyDiscount(int yearsAsCustomer) : IDiscountStrategy
{
    public decimal Apply(decimal p) => p * (1 - Math.Min(0.2m, yearsAsCustomer * 0.02m));
}

// Context side does NOT grow into a hierarchy — one class, swappable strategy
public class PriceCalculator(IDiscountStrategy discount)
{
    public decimal FinalPrice(decimal basePrice) => discount.Apply(basePrice);
}

// There is no "SeasonalPriceCalculator" or "LoyaltyPriceCalculator" — the
// SAME single PriceCalculator class works with every strategy, forever.
var calc = new PriceCalculator(new SeasonalDiscount(0.15m));
Console.WriteLine(calc.FinalPrice(100m));`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A codebase has a <code>ReportGenerator</code> class that accepts an ' +
    '<code>IExportFormat</code> (Pdf, Csv, Excel). Over time, someone adds a ' +
    '<code>MonthlyReportGenerator</code> and a <code>QuarterlyReportGenerator</code>, both subclassing ' +
    '<code>ReportGenerator</code>, and each of THOSE needs to work with every export format. Has this ' +
    'codebase quietly turned from Strategy into Bridge, or is it still Strategy? Justify your answer using ' +
    'the "which side grows" test from this subtopic.',
  hint:
    'Check both sides independently: is the export-format side still a flat set of interchangeable ' +
    'implementations, and has the "context" side gone from one class to its own hierarchy?',
  solution:
    'It has turned into Bridge. Originally, with ONE ReportGenerator class and multiple IExportFormat ' +
    'implementations, that was textbook Strategy — only the algorithm side (export format) varied. Once ' +
    'MonthlyReportGenerator and QuarterlyReportGenerator exist as subclasses, each expected to work with ' +
    'every export format, the CONTEXT side has become its own hierarchy of related types too — exactly the ' +
    'two-sided extensibility that defines Bridge, not Strategy. The tell is that both dimensions (report type ' +
    'x export format) are now independently variable, which is precisely the situation Bridge exists to keep ' +
    'from becoming an N x M mess. Nothing about the CODE necessarily needs to change for this shift — it is a ' +
    'shift in which pattern description now fits, driven by how the hierarchy actually grew.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since both Bridge and Strategy use composition and delegate to an interface, they are really ' +
      'the same pattern with different names.',
    reality:
      'They share a MECHANISM (hold a reference to an interface, delegate to it) but differ in INTENT and ' +
      'expected shape. Bridge is a structural pattern designed to prevent an N x M class explosion across two ' +
      'independently-growing hierarchies. Strategy is a behavioral pattern designed to let ONE class swap its ' +
      'algorithm at runtime. The code can look nearly identical while solving different design problems.',
  },
  {
    thought: 'If a pattern uses an interface with 3+ implementations, that alone signals Bridge rather than ' +
      'Strategy.',
    reality:
      'A Strategy interface routinely has many implementations too (NoDiscount, SeasonalDiscount, ' +
      'LoyaltyDiscount, and more) — the number of implementations on ONE side says nothing about which ' +
      'pattern this is. What distinguishes them is whether the OTHER side (the context/abstraction) also ' +
      'grows into its own hierarchy, or stays a single class.',
  },
  {
    thought: 'Once you commit to Bridge for two dimensions, both dimensions will always keep growing at the ' +
      'same rate.',
    reality:
      'Nothing requires balanced growth — a Bridge-shaped design might see 10 new Refined Abstractions and ' +
      'only 2 new ConcreteImplementors over its lifetime, or vice versa. Bridge is justified whenever BOTH ' +
      'sides are EXPECTED to vary independently, even if, in practice, one side ends up varying far more often ' +
      'than the other.',
  },
];

@Component({
  selector: 'app-bridge-bridge-vs-strategy-which-side-grows',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './bridge-vs-strategy-which-side-grows.html',
  styleUrl: './bridge-vs-strategy-which-side-grows.scss',
})
export class BridgeVsStrategyWhichSideGrowsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
