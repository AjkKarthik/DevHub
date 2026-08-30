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
    heading: 'Named as "Very Common," Never Built on the Page\'s Own Elements',
    points: [
      'The main page\'s own revision summary states it as a must-know fact: "Visitor + Composite is a very ' +
      'common pairing." The QnA elaborates with a DIFFERENT example (an AST, generic composite/leaf nodes) — ' +
      'neither ever applies this pairing to the page\'s own <code>IOrderElement</code>/' +
      '<code>ProductItem</code>/<code>DiscountItem</code>/<code>ShippingItem</code> hierarchy that every other ' +
      'codeTab on the page already uses.',
      'A real-world order structure genuinely has this shape: a <code>SplitShipmentGroup</code> (multiple ' +
      'boxes shipped separately for one logical order) containing its OWN nested elements — exactly the tree ' +
      'shape Composite exists to model, and exactly the traversal Visitor exists to operate over.',
    ],
  },
  {
    heading: 'The Recursive Half of Double Dispatch',
    points: [
      'A LEAF element\'s <code>Accept(visitor)</code> works exactly as already shown on the main page — one ' +
      'call to <code>visitor.Visit(this)</code>. A COMPOSITE element\'s <code>Accept(visitor)</code> does two ' +
      'things: it visits ITSELF (so a visitor can react to the group as a whole, e.g. counting how many ' +
      'sub-shipments exist), then RECURSIVELY calls <code>Accept(visitor)</code> on every CHILD — which means ' +
      'a child that is ITSELF a composite continues the recursion arbitrarily deep, with no special-casing ' +
      'needed anywhere in the visitor for how deep the tree actually goes.',
      'This is what makes the pairing so natural: the SAME visitor written for a flat list of elements (the ' +
      'main page\'s own <code>TotalCalculator</code>) works completely unchanged against an arbitrarily nested ' +
      'tree — all the recursion logic lives entirely inside the Composite\'s own <code>Accept()</code> ' +
      'implementation, never inside the visitor.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'SplitShipmentGroup Composite',
    language: 'csharp',
    code: `// A Composite element over the main page's OWN IOrderElement
// hierarchy — reusing IOrderElement and IOrderVisitor unchanged.
public class SplitShipmentGroup : IOrderElement
{
    private readonly List<IOrderElement> _items = new();
    public string GroupName { get; }

    public SplitShipmentGroup(string groupName) => GroupName = groupName;
    public void Add(IOrderElement item) => _items.Add(item);

    public void Accept(IOrderVisitor visitor)
    {
        visitor.Visit(this);                       // visit the GROUP itself
        foreach (var item in _items) item.Accept(visitor); // then recurse into children
    }
}

// IOrderVisitor needs one new overload for the composite type —
// exactly the known Visitor trade-off the main page's own mistake #4
// already names (adding an element type means updating every visitor).
public interface IOrderVisitor
{
    void Visit(ProductItem item);
    void Visit(DiscountItem item);
    void Visit(ShippingItem item);
    void Visit(SplitShipmentGroup group); // new overload for the composite
}

// TotalCalculator, UNCHANGED from the main page's own codeTab except
// for one added line — it never needed to know about recursion at all.
public class TotalCalculator : IOrderVisitor
{
    public decimal Total { get; private set; }
    public void Visit(ProductItem item) => Total += item.Price * item.Qty;
    public void Visit(DiscountItem item) => Total -= item.Amount;
    public void Visit(ShippingItem item) => Total += item.Cost;
    public void Visit(SplitShipmentGroup group) { } // group itself adds nothing to the total
}

// A visitor that specifically CARES about the group structure —
// impossible to express meaningfully without the composite existing.
public class ShipmentCounter : IOrderVisitor
{
    public int GroupCount { get; private set; }
    public void Visit(ProductItem item) { }
    public void Visit(DiscountItem item) { }
    public void Visit(ShippingItem item) { }
    public void Visit(SplitShipmentGroup group) => GroupCount++;
}

// Usage — a nested tree, built from the SAME element types already
// shown on the main page.
var box1 = new SplitShipmentGroup("Box 1");
box1.Add(new ProductItem("Widget", 9.99m, 2));
box1.Add(new ShippingItem("Standard", 4.99m));

var box2 = new SplitShipmentGroup("Box 2");
box2.Add(new ProductItem("Gadget", 24.99m, 1));

var order = new SplitShipmentGroup("Order #1001");
order.Add(box1);
order.Add(box2);
order.Add(new DiscountItem("SAVE10", 5.00m)); // a top-level discount, outside either box

var calc = new TotalCalculator();
order.Accept(calc); // recurses through box1, box2, and the top-level discount
Console.WriteLine($"Total: {calc.Total:C}");`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'If <code>SplitShipmentGroup.Accept()</code> were changed to skip the ' +
    '<code>visitor.Visit(this)</code> call and ONLY recurse into children ' +
    '(<code>foreach (var item in _items) item.Accept(visitor);</code>), what would break for ' +
    '<code>ShipmentCounter</code> specifically, and would <code>TotalCalculator</code> notice any difference ' +
    'at all?',
  hint:
    'Check exactly what each visitor DOES inside its own <code>Visit(SplitShipmentGroup group)</code> ' +
    'overload — does it use the group itself for anything, or only its descendants?',
  solution:
    'ShipmentCounter.GroupCount would stay stuck at 0 forever, since its ONLY source of information is the ' +
    'Visit(SplitShipmentGroup group) call that would no longer happen — the entire point of that visitor is ' +
    'to react to the group itself, not to any leaf element inside it. TotalCalculator, on the other hand, ' +
    'would produce the EXACT SAME total either way, because its own Visit(SplitShipmentGroup group) override ' +
    'is a no-op — it only ever accumulates from the leaf Visit(ProductItem)/Visit(DiscountItem)/' +
    'Visit(ShippingItem) overloads, which still run identically since only the recursion into children was ' +
    'preserved. This shows why the main page\'s own theory ("Composite builds the tree; Visitor traverses and ' +
    'operates on it") really means TWO separable things — visiting the STRUCTURE and visiting the LEAVES are ' +
    'independent capabilities a well-built composite needs to support both of, since different visitors care ' +
    'about different ones.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since TotalCalculator\'s own Visit(SplitShipmentGroup group) is an empty no-op, adding the ' +
      'composite overload to IOrderVisitor was pointless busywork for that specific visitor.',
    reality:
      'The interface-level requirement is what makes this SAFE, not wasted: every visitor, including future ' +
      'ones, is FORCED by the compiler to at least acknowledge the composite type exists (even if only with an ' +
      'empty body), rather than silently having no defined behavior for it at all. This is the same discipline ' +
      'the main page\'s own mistake #4 already argues for — an omitted overload is a compile error, not a ' +
      'silent gap, precisely because Visitor makes "did every visitor handle every element type" a checkable ' +
      'property.',
  },
  {
    thought: 'A SplitShipmentGroup nested inside another SplitShipmentGroup (a group of groups) would need ' +
      'special-case code somewhere to handle the extra nesting level correctly.',
    reality:
      'It needs zero special-case code — this is precisely what makes the recursive Accept() pattern work at ' +
      'arbitrary depth. A nested SplitShipmentGroup is itself just another IOrderElement inside the outer ' +
      'group\'s own _items list; when the outer group\'s Accept() loop reaches it, that nested group\'s OWN ' +
      'Accept() runs the identical visit-self-then-recurse-into-children logic, naturally continuing the ' +
      'traversal as deep as the tree actually goes.',
  },
];

@Component({
  selector: 'app-visitor-visitor-plus-composite-recursive-order-group',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './visitor-plus-composite-recursive-order-group.html',
  styleUrl: './visitor-plus-composite-recursive-order-group.scss',
})
export class VisitorPlusCompositeRecursiveOrderGroupSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
