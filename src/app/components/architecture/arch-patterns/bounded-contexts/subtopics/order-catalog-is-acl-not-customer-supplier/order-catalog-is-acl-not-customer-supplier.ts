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
  templateUrl: './order-catalog-is-acl-not-customer-supplier.html',
  styleUrl: './order-catalog-is-acl-not-customer-supplier.scss'
})
export class OrderCatalogIsAclNotCustomerSupplierSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The same relationship, labeled two different ways on the same page',
      points: [
        'The "Context Map Integration" codeTab shows Orders building a <code>CatalogContextAdapter</code> that translates Catalog\'s model into Orders\' own <code>ProductSnapshot</code> — the comment explicitly says "Orders does NOT use CatalogContext.Product directly." That is a textbook Anti-Corruption Layer.',
        'The "Event Storming Output" codeTab, describing the SAME Order-to-Catalog dependency, originally labeled it "Customer/Supplier" — a different pattern from the ACL shown one codeTab earlier, with no explanation for why both apply.',
        'ACL and Customer/Supplier are not the same axis: ACL describes a TRANSLATION mechanism (how you protect your own model from an external one), while Customer/Supplier describes a PLANNING relationship (whether the downstream team can influence the upstream team\'s roadmap). A relationship can be ACL without being Customer/Supplier, and vice versa.',
      ]
    },
    {
      heading: 'What would actually make Order-to-Catalog a Customer/Supplier relationship',
      points: [
        'Customer/Supplier specifically requires that the upstream team accommodates the downstream team\'s needs in its own planning — the downstream has a seat at the table, even if it does not have final say.',
        'Nothing on this page establishes that the Catalog team plans around Orders\' requests. All that is shown is a one-way API call (<code>catalogApi.getProduct(productId)</code>) that Orders defends itself against via translation — that is consistent with Conformist-plus-ACL (Orders adapts to whatever Catalog gives it) just as easily as it is with Customer/Supplier.',
        'Given the page never establishes the planning relationship, the more defensible label for what is actually shown is simply ACL — the mechanism the code demonstrates — rather than asserting an organizational dynamic (Customer/Supplier) the page never shows evidence for.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ACL alone vs. ACL plus an established Customer/Supplier relationship',
      language: 'typescript',
      code: `// WHAT THE PAGE SHOWS -- an ACL, full stop
class CatalogContextAdapter {
  async getProductSnapshot(productId: string): Promise<ProductSnapshot> {
    const catalogProduct = await catalogApi.getProduct(productId);
    // Translates Catalog's model into Orders' own model -- this is the ACL.
    // Nothing here tells you whether Orders can influence Catalog's roadmap.
    return {
      productId: catalogProduct.id,
      name: catalogProduct.name,
      unitPrice: new Money(catalogProduct.price.amount, catalogProduct.price.currency),
    };
  }
}

// WHAT WOULD MAKE IT ALSO Customer/Supplier -- evidence of Catalog
// accommodating Orders' needs in ITS OWN planning, e.g.:
//
// - A field Orders specifically requested now exists in Catalog's API
//   (Catalog's roadmap doc references "added at Orders team's request")
// - Catalog runs its own API versioning/deprecation process that gives
//   Orders formal input, not just a take-it-or-leave-it feed
//
// Without evidence like this, "Customer/Supplier" is an unsupported claim
// about a team relationship the code itself cannot demonstrate --
// the ACL is the only part of the story the code actually proves.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says: "We use an Anti-Corruption Layer against the Catalog context, so by definition we must be in a Customer/Supplier relationship with them." Is that reasoning sound?',
    hint: 'Does using an ACL tell you anything about whether the OTHER team accommodates your requests in their planning?',
    solution: 'No -- ACL and Customer/Supplier answer different questions. ACL is something the DOWNSTREAM team does unilaterally, in its own codebase, regardless of how the upstream team feels about it -- you do not need the upstream team\'s cooperation to build a translation adapter. Customer/Supplier, by contrast, describes an organizational fact about the UPSTREAM team\'s behavior -- whether they plan around your needs. A team can build an ACL against a completely indifferent upstream (that would be Conformist-plus-ACL, or even a hostile/Separate-Ways-plus-ACL relationship), or against a genuinely accommodating one (Customer/Supplier-plus-ACL). The presence of an ACL alone proves nothing about the upstream relationship -- you would need separate evidence, like a documented roadmap process, to justify calling it Customer/Supplier.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Anti-Corruption Layer and Customer/Supplier are alternative names for the same kind of relationship.',
      reality: 'Per this subtopic\'s theory, they sit on different axes — ACL is a translation mechanism the downstream builds unilaterally, while Customer/Supplier is a planning relationship that depends on how the upstream team actually behaves.'
    },
    {
      thought: 'If a team builds an ACL against another context, that alone proves the two teams have a Customer/Supplier relationship.',
      reality: 'Per this subtopic\'s theory, an ACL can be built regardless of the upstream team\'s cooperation — it protects the downstream unilaterally. Calling the relationship Customer/Supplier requires separate evidence that the upstream actually accommodates the downstream\'s needs.'
    },
    {
      thought: 'Once you have picked a context-map pattern for a relationship, that label fully describes the integration and nothing else needs to be said.',
      reality: 'Per this subtopic\'s theory, a single relationship can combine a mechanism-level pattern (ACL, Event Publisher) with a relationship-level pattern (Customer/Supplier, Conformist) at the same time — they describe different things and are not mutually exclusive.'
    }
  ];
}
