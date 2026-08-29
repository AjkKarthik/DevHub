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
    heading: 'A Clause, Never a Worked Example',
    points: [
      'The QnA on intentional duplication lists it as ONE bullet among four: "different bounded contexts — microservices intentionally duplicate domain models to avoid shared coupling." No codeTab on the page shows what a duplicated-on-purpose model actually looks like, or traces through what goes wrong when it\'s SHARED instead.',
      'This directly extends the main page\'s own "accidental duplication vs. duplication of knowledge" QnA — two services both having a "Customer" concept is NOT automatically duplicated knowledge, because each service usually cares about a genuinely DIFFERENT slice of what a customer means to it.',
    ],
  },
  {
    heading: 'Why a Shared Customer Model Is the WRONG Kind of DRY Here',
    points: [
      'A Billing service and a Shipping service both have a legitimate concept of "Customer" — but Billing cares about payment methods and tax IDs; Shipping cares about delivery addresses and package preferences. A single shared <code>Customer</code> class serving both accumulates fields NEITHER service fully understands or owns, and a change driven by Billing\'s needs (a new payment-related field) forces Shipping to redeploy for a change that has nothing to do with it.',
      'This is the SAME "different knowledge, coincidentally similar shape" distinction the main page\'s own <code>IsValidEmail</code>/<code>IsValidUsername</code> mistake block already makes for methods — just applied at the scale of an entire domain model shared across a service boundary instead of two functions in one codebase.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Shared Model — The Wrong Kind of DRY',
    language: 'csharp',
    code: `// A SINGLE Customer class, referenced by BOTH services via a
// shared NuGet package -- looks like textbook DRY.
namespace Shared.Contracts;

public class Customer
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    // Billing-owned fields:
    public string TaxId { get; set; } = "";
    public string PaymentMethodToken { get; set; } = "";
    // Shipping-owned fields:
    public string DeliveryAddress { get; set; } = "";
    public bool RequiresSignature { get; set; } = false;
}

// Billing Service -- only ever touches TWO of these four fields,
// but depends on (and must redeploy for) changes to all four.
public class InvoiceGenerator
{
    public Invoice Generate(Customer c) =>
        new(c.Id, c.TaxId, c.PaymentMethodToken);
}

// Shipping Service -- only ever touches the OTHER two fields, but
// shares the exact same coupling problem in reverse.
public class LabelPrinter
{
    public string PrintLabel(Customer c) =>
        $"{c.Name}\\n{c.DeliveryAddress}" + (c.RequiresSignature ? " (Signature required)" : "");
}
// A new Billing requirement (e.g. adding InvoicingCurrency) forces
// BOTH services to take the new shared package version -- even
// though Shipping never reads that field at all.`,
  },
  {
    label: 'Duplicated on Purpose — Each Service Owns Its Own Shape',
    language: 'csharp',
    code: `// Billing Service's OWN Customer -- exactly what Billing needs,
// nothing more.
namespace BillingService;

public class Customer
{
    public Guid Id { get; set; }
    public string TaxId { get; set; } = "";
    public string PaymentMethodToken { get; set; } = "";
}

public class InvoiceGenerator
{
    public Invoice Generate(Customer c) => new(c.Id, c.TaxId, c.PaymentMethodToken);
}

// Shipping Service's OWN Customer -- a completely separate type,
// same name, genuinely different shape.
namespace ShippingService;

public class Customer
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string DeliveryAddress { get; set; } = "";
    public bool RequiresSignature { get; set; } = false;
}

public class LabelPrinter
{
    public string PrintLabel(Customer c) =>
        $"{c.Name}\\n{c.DeliveryAddress}" + (c.RequiresSignature ? " (Signature required)" : "");
}
// Adding InvoicingCurrency to Billing's Customer now touches ONLY
// Billing -- ShippingService's own Customer type is completely
// unaffected, because it was never the same type to begin with.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Both services publish an <code>OrderPlacedEvent</code> carrying a <code>CustomerId</code> (just the GUID, no other customer fields). Is including ONLY the ID across this event a DRY violation of the "different domain models" principle this subtopic just established, or something else entirely?',
  hint: 'Check whether a bare <code>CustomerId</code> encodes any of the SERVICE-SPECIFIC knowledge (tax ID, delivery address) that made the shared <code>Customer</code> class problematic.',
  solution: `// It's something else entirely -- not a DRY violation at all, in
// either direction. A bare CustomerId is a stable, service-agnostic
// IDENTIFIER, not a duplicated domain MODEL -- it carries none of
// the service-specific knowledge (TaxId, DeliveryAddress) that made
// sharing a full Customer class problematic. Each service receiving
// the event looks up ITS OWN Customer record using that ID, in its
// own database, with its own shape.

// This is actually the standard, correct integration pattern for
// microservices precisely BECAUSE it avoids the shared-model
// problem: services agree on a stable, minimal, cross-cutting
// IDENTIFIER (an ID, a correlation key), never on a shared,
// evolving DOMAIN MODEL full of fields only one side understands.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Having two classes named <code>Customer</code> with overlapping fields (<code>Id</code>, <code>Name</code>) in two different services IS a DRY violation, just one that\'s harder to fix because they\'re in separate codebases.',
    reality: 'The main page\'s own distinction is precise here: DRY is about KNOWLEDGE, not textual/structural similarity. Both services genuinely need SOME notion of "a customer," but each owns a DIFFERENT piece of business knowledge about what a customer means to it — overlapping field names (<code>Id</code>, <code>Name</code>) are a coincidence of both needing basic identification, not evidence the two types represent the same underlying knowledge that needs a single authoritative home.',
  },
  {
    thought: 'This subtopic\'s advice contradicts the main page\'s own core DRY teaching — "duplicate on purpose" sounds like the opposite of "don\'t repeat yourself."',
    reality: 'It is a direct APPLICATION of the main page\'s own distinction, not a contradiction of it: DRY targets duplicated KNOWLEDGE, and the whole point of separate bounded contexts is that Billing\'s knowledge about a customer and Shipping\'s knowledge about a customer are NOT the same knowledge, even though both happen to be called "Customer." Sharing the model would be the actual DRY violation in spirit — forcing two genuinely different pieces of business knowledge to pretend they\'re one.',
  },
];

@Component({
  selector: 'app-dp-dky-microservices',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './why-microservices-duplicate-domain-models.html',
  styleUrl: './why-microservices-duplicate-domain-models.scss',
})
export class WhyMicroservicesDuplicateDomainModelsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
