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
    heading: 'A Tension Named, Never Demonstrated',
    points: [
      'The main page\'s own theory states the tension directly: "These two tension each other: very low coupling can mean low cohesion (classes doing too little)." No codeTab on the page ever shows what "too little" actually looks like, or contrasts it against a properly balanced version doing the SAME job.',
      'The main page\'s own <code>Order</code>/<code>OrderItem</code> example is already well-balanced (each class has a clear, cohesive purpose) — it doesn\'t illustrate what happens when a design goes TOO FAR toward minimizing coupling.',
    ],
  },
  {
    heading: 'What "Too Little" Actually Looks Like',
    points: [
      'Splitting a cohesive operation into several classes purely so no ONE class depends on more than one other class can produce classes with almost no reason to exist on their own — each one is a thin pass-through with barely any behaviour, and understanding the overall operation now requires reading several files instead of one.',
      'The fix isn\'t "always fewer classes" — it\'s recognising when a split was made FOR coupling\'s sake alone, with no cohesive purpose of its own, versus a split that genuinely separates two independent concerns (which the main page\'s own Order/OrderItem split correctly does).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Over-Decoupled — Low Cohesion',
    language: 'csharp',
    code: `// Each class touches only ONE other class -- coupling looks
// minimal on paper -- but none of these classes has a cohesive
// purpose of its own; each is a thin, single-step pass-through.
public class OrderItemQuantityReader
{
    public int Read(OrderItem item) => item.Qty;
}
public class OrderItemPriceReader
{
    public decimal Read(OrderItem item) => item.UnitPrice;
}
public class LineTotalMultiplier
{
    public decimal Multiply(int qty, decimal price) => qty * price;
}
public class LineTotalCalculator(
    OrderItemQuantityReader qtyReader,
    OrderItemPriceReader priceReader,
    LineTotalMultiplier multiplier)
{
    // Understanding "how is a line total computed" now means
    // reading FOUR separate files instead of one property.
    public decimal Calculate(OrderItem item) =>
        multiplier.Multiply(qtyReader.Read(item), priceReader.Read(item));
}`,
  },
  {
    label: 'Balanced — High Cohesion, Reasonable Coupling',
    language: 'csharp',
    code: `// The main page's own version -- one class, one cohesive purpose.
// It IS coupled to Qty and UnitPrice, but that coupling reflects a
// GENUINE, single, cohesive responsibility: computing a line total.
public class OrderItem(Guid productId, int qty, decimal unitPrice)
{
    public int     Qty       { get; } = qty;
    public decimal UnitPrice { get; } = unitPrice;
    public decimal LineTotal => Qty * UnitPrice;
}

// Compare the two versions: the over-decoupled one has MORE classes
// and MORE indirection, but is not meaningfully more flexible --
// nothing about splitting "read quantity" from "read price" from
// "multiply" creates an extension point anything would ever use.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A new requirement arrives: line totals over a certain threshold need a bulk discount applied. Using the OVER-DECOUPLED version, which of its four classes is the natural place to add this, and does the extreme splitting make that decision any easier?',
  hint: 'Check whether any of the four classes actually OWNS the concept of "a line total" as a cohesive whole, or whether each one only owns a single fragment of the calculation.',
  solution: `// None of the four classes cleanly owns it -- LineTotalCalculator
// is the closest candidate (it's the one that produces the final
// number), but the discount logic doesn't obviously belong to
// "multiply quantity by price" any more than it belongs anywhere
// else in the chain. The extreme splitting didn't make this
// decision easier; it just added more places the discount COULD
// awkwardly be bolted onto, with no single class whose cohesive
// purpose ("compute a line total, discount included") the new
// requirement naturally extends.

// In the BALANCED version, the answer is obvious: OrderItem already
// owns the concept of "this item's line total" -- extending
// LineTotal (or adding a DiscountedLineTotal alongside it) is a
// one-class change with a clear owner, exactly Information Expert's
// own answer to "which class should own this?"`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since Low Coupling and High Cohesion are both GRASP principles pointing toward "better design," maximizing BOTH simultaneously is always possible and always the goal.',
    reality: 'The main page\'s own theory explicitly says otherwise: they "tension each other." Pursuing coupling reduction as an END IN ITSELF, past the point where it still tracks a genuine, cohesive responsibility, is exactly how the over-decoupled example above ends up worse on BOTH axes at once — no single class has real cohesion, and the "coupling" saved is illusory, since understanding the whole operation still requires the SAME total amount of cross-class knowledge, just spread across more files.',
  },
  {
    thought: 'More classes with narrower responsibilities is always evidence of following High Cohesion more closely.',
    reality: 'High Cohesion is about whether a class\'s OWN members relate to ONE coherent purpose — not about class count or method count per class. <code>OrderItemQuantityReader</code> is arguably perfectly "cohesive" in a narrow, technical sense (it does exactly one thing) while still being a bad design choice, because that one thing isn\'t a meaningful RESPONSIBILITY on its own — it\'s an arbitrary fragment of a responsibility that belonged together in the first place.',
  },
];

@Component({
  selector: 'app-dp-grasp-coupling-cohesion',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-low-coupling-vs-high-cohesion-tension.html',
  styleUrl: './the-low-coupling-vs-high-cohesion-tension.scss',
})
export class TheLowCouplingVsHighCohesionTensionSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
