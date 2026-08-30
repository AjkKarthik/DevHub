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
    heading: 'Named in a Clause, Never Shown',
    points: [
      'The Low Coupling QnA lists it as one strategy among several: "Avoid accessing dependencies through other dependencies (Law of Demeter)." That is the entire treatment — one parenthetical, no code showing what "accessing dependencies through other dependencies" actually looks like or how to fix it.',
      'The Law of Demeter (informally, "only talk to your immediate friends") says a method should only call methods on: itself, its own fields, its parameters, or objects it directly creates — NOT on objects returned by calling a method on one of those. Chaining through multiple objects (<code>order.Customer.Address.City</code>) is the classic violation shape, often nicknamed a "train wreck."',
    ],
  },
  {
    heading: 'Why This Is a Low Coupling Concern Specifically',
    points: [
      'A "train wreck" call chain couples the calling code to the ENTIRE internal shape of every object along the chain — <code>order.Customer.Address.City</code> means the caller breaks if <code>Order</code> changes how it references <code>Customer</code>, if <code>Customer</code> changes how it references <code>Address</code>, OR if <code>Address</code> renames <code>City</code>. That is coupling to three separate classes\' internal structure, not just one.',
      'The fix pushes the responsibility for reaching through that structure INTO the class that owns it — <code>Order</code> exposes a method like <code>GetShippingCity()</code> that does the reaching internally, so the caller couples to ONE method on ONE class instead of the full chain\'s shape.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before — A Train Wreck',
    language: 'csharp',
    code: `// Violates the Law of Demeter: this method reaches THROUGH Order,
// THROUGH Customer, to get to Address -- coupled to the internal
// shape of three classes, not one.
public class ShippingLabelPrinter
{
    public string BuildLabel(Order order) =>
        $"Ship to: {order.Customer.Address.Street}, " +
        $"{order.Customer.Address.City}, {order.Customer.Address.PostalCode}";
}

// If Order later stores a SEPARATE ShippingAddress (distinct from
// the customer's own default address), every caller doing this same
// chain has to be found and updated -- the chain is scattered
// coupling to structure, not a single, controlled dependency.`,
  },
  {
    label: 'After — Order Owns the Reach-Through',
    language: 'csharp',
    code: `// Order (the class that actually HAS the Customer/Address chain --
// Information Expert applies here too) exposes what callers need
// as its own responsibility, not something they reach for themselves.
public class Order
{
    public Customer Customer { get; private set; }

    public string GetShippingAddressLine() =>
        $"{Customer.Address.Street}, {Customer.Address.City}, {Customer.Address.PostalCode}";
}

// ShippingLabelPrinter now only talks to Order directly -- coupled
// to ONE method on ONE class, not to Customer's or Address's shape.
public class ShippingLabelPrinter
{
    public string BuildLabel(Order order) => $"Ship to: {order.GetShippingAddressLine()}";
}

// If Order later needs a separate ShippingAddress, only
// GetShippingAddressLine() changes -- ShippingLabelPrinter, and
// every other caller of it, needs zero changes.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A second caller, <code>InvoiceService</code>, also needs the customer\'s city — but ONLY the city, not the full address line. Using the AFTER version\'s approach, what would you add, and would it need to touch <code>ShippingLabelPrinter</code> or <code>InvoiceService</code>\'s existing code?',
  hint: 'Think about whether the fix is "one method that does everything" or "add methods to Order as new needs arise."',
  solution: `// Add a second, narrower method to Order -- following the exact
// same pattern as GetShippingAddressLine(), just returning less:

public string GetShippingCity() => Customer.Address.City;

// This touches ONLY Order -- ShippingLabelPrinter's existing code
// (which calls GetShippingAddressLine()) needs zero changes, and
// InvoiceService gets its own narrow, purpose-built method to call
// instead of reaching through order.Customer.Address.City itself.
// Each new caller need gets its own small, Order-owned method,
// rather than every caller independently re-deriving the same
// train-wreck chain for slightly different slices of the same data.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The Law of Demeter means a method can only ever call ONE other method total — any chaining at all is a violation.',
    reality: 'It specifically restricts chaining through OBJECTS RETURNED BY OTHER CALLS, not method calls in general. Fluent APIs like LINQ\'s <code>.Where(...).Select(...).ToList()</code> are NOT Demeter violations, because each call in the chain operates on the SAME kind of object (an <code>IEnumerable</code>), not on a progressively different, unrelated object\'s internal structure the way <code>order.Customer.Address.City</code> does.',
  },
  {
    thought: 'Adding <code>GetShippingAddressLine()</code> to <code>Order</code> just moves the coupling problem — <code>Order</code> is now coupled to <code>Customer</code>\'s and <code>Address</code>\'s shape instead of <code>ShippingLabelPrinter</code> being coupled to it.',
    reality: 'That coupling is intentional and appropriate, not a workaround — <code>Order</code> already legitimately depends on <code>Customer</code> (it holds a reference to one), so <code>Order</code> reaching one level further into <code>Customer.Address</code> is a SINGLE, controlled, well-understood dependency in ONE place. The whole point of the fix is concentrating that structural knowledge into the ONE class that already has a direct relationship with the chain, instead of scattering it across every caller that happens to need a piece of it.',
  },
];

@Component({
  selector: 'app-dp-grasp-demeter',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './avoiding-a-law-of-demeter-violation.html',
  styleUrl: './avoiding-a-law-of-demeter-violation.scss',
})
export class AvoidingALawOfDemeterViolationSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
