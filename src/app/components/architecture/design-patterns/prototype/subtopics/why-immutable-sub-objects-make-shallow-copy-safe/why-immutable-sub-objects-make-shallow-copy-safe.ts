import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './why-immutable-sub-objects-make-shallow-copy-safe.html',
  styleUrl: './why-immutable-sub-objects-make-shallow-copy-safe.scss'
})
export class WhyImmutableSubObjectsMakeShallowCopySafeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A one-line claim, and a codeTab that only ever shows the opposite case',
      points: [
        'The theory states it directly, in one line: "For immutable sub-objects, shallow copy is safe. For mutable sub-objects, deep copy is required to avoid shared state bugs." The page then goes on to show <code>EmailTemplate</code>\'s <code>ShallowClone()</code> — which is exactly the DANGEROUS half, sharing a mutable <code>List&lt;string&gt; Recipients</code> — and the mistakes block reinforces only that half too.',
        'The SAFE half of the claim — a shallow copy involving an immutable sub-object, where sharing the reference is genuinely fine — is never actually shown. This subtopic builds that missing contrast directly.',
      ]
    },
    {
      heading: 'Why sharing a reference to an immutable object can never cause a bug',
      points: [
        'The entire danger of a shallow copy is that BOTH the original and the clone point at the SAME underlying object — if that object can be mutated, a change made through one reference is visible through the other, which is rarely what anyone intended.',
        'If the shared sub-object is IMMUTABLE (its own state can never change after construction — no setters, no mutating methods), there is no such thing as "a change made through one reference" at all. Sharing the reference is completely safe, because there is nothing to accidentally mutate.',
        'This is exactly why C# records with `with` expressions (covered elsewhere on this page) default to shallow copying every field by design — records are conventionally treated as immutable, so sharing references to their own nested immutable value objects carries none of the risk a shallow copy of a mutable class like <code>EmailTemplate</code> has.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Same shallow-copy mechanism, opposite safety depending on mutability',
      language: 'csharp',
      code: `// DANGEROUS shallow copy -- Recipients is a MUTABLE List<string>
public class EmailTemplate
{
    public string Subject { get; set; } = "";
    public List<string> Recipients { get; set; } = new();

    public EmailTemplate ShallowClone() => (EmailTemplate)MemberwiseClone();
}

var original = new EmailTemplate { Recipients = ["admin@devhub.io"] };
var clone = original.ShallowClone();
clone.Recipients.Add("intruder@evil.com"); // MUTATES the shared list
Console.WriteLine(original.Recipients.Count); // 2 -- original corrupted!

// SAFE shallow copy -- Address is an IMMUTABLE record (init-only, no
// mutating methods at all)
public sealed record Address(string Street, string City, string ZipCode);

public class Order
{
    public string OrderId { get; set; } = "";
    public Address ShippingAddress { get; set; } = null!;

    // A plain shallow copy -- Address reference is SHARED between
    // original and clone, exactly like Recipients was shared above
    public Order ShallowClone() => (Order)MemberwiseClone();
}

var orderA = new Order { OrderId = "A1", ShippingAddress = new Address("Main St", "Springfield", "12345") };
var orderB = orderA.ShallowClone();

// There is NO METHOD on Address that could mutate orderA's copy through
// orderB's reference -- Address has no setters, no Add(), nothing.
// The only way to get a DIFFERENT address on orderB is to assign a
// brand-new Address value -- which does not touch orderA at all:
orderB.ShippingAddress = orderB.ShippingAddress with { City = "Shelbyville" };
Console.WriteLine(orderA.ShippingAddress.City); // "Springfield" -- untouched
Console.WriteLine(orderB.ShippingAddress.City); // "Shelbyville"

// Same MemberwiseClone() mechanism in both examples -- the safety
// difference comes ENTIRELY from whether the shared sub-object can
// be mutated in place, not from anything about the cloning code itself.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues: "ShallowClone() on Order is still risky, because orderA and orderB share the exact same Address reference — that\'s the same danger as EmailTemplate sharing its Recipients list." Is sharing an Address reference the same risk as sharing a Recipients list reference?',
    hint: 'For the risk to materialize, does SOMETHING need to actually mutate the shared object through one of the two references — and does Address have any way to do that?',
    solution: 'No -- sharing the reference is identical in MECHANISM, but not in RISK. The danger in the EmailTemplate example is not "two references point at the same object" by itself -- it is that List<string> has a mutating method (Add()) that changes the shared object\'s state IN PLACE, visible through both references. Address, being an immutable record, has no equivalent -- there is no method that could change orderA\'s ShippingAddress instance while looking like you are only touching orderB\'s. The ONLY way to give orderB a "different" address is orderB.ShippingAddress = orderB.ShippingAddress with { ... }, which REPLACES the reference orderB holds with a brand-new Address value -- it never reaches into and mutates the object orderA is still pointing at. Two references sharing an object is only dangerous when that object CAN be mutated through one of them.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Any time a shallow copy results in two objects sharing a reference to the same sub-object, that is inherently a bug waiting to happen.',
      reality: 'Per this subtopic\'s theory, the danger comes specifically from the shared object being MUTABLE — sharing a reference to something that can never change after construction (like an immutable record) carries none of the risk, since there is nothing to accidentally mutate through the shared reference.'
    },
    {
      thought: 'Record with expressions are safe from the shared-mutable-state problem because records use a fundamentally different cloning mechanism than MemberwiseClone().',
      reality: 'Per this subtopic\'s theory, records default to the SAME shallow-copy-by-field mechanism — they are safe by convention (records are treated as immutable), not because the underlying copying mechanism is different from what MemberwiseClone() does.'
    },
    {
      thought: 'To make Order.ShallowClone() safe, the ShippingAddress field would need to be deep-cloned, the same way EmailTemplate\'s Recipients list needs deep cloning.',
      reality: 'Per this subtopic\'s theory, deep-cloning Address would be unnecessary work — since Address is immutable, there is nothing a deep clone would protect against that the shallow, shared reference does not already handle safely.'
    }
  ];
}
