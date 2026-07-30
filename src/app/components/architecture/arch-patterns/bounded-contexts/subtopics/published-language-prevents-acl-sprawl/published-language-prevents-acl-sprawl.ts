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
  templateUrl: './published-language-prevents-acl-sprawl.html',
  styleUrl: './published-language-prevents-acl-sprawl.scss'
})
export class PublishedLanguagePreventsAclSprawlSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The page names Published Language once, in the QnA, and never shows it in code',
      points: [
        'The QnA describes it in one line: "Published Language: contexts communicate via a shared, well-documented exchange format like an industry standard." Every other pattern on the page (ACL, Open Host Service, Event Publisher) gets a concrete codeTab — Published Language does not.',
        'The page\'s own "Context-Specific Models" codeTab already shows the problem Published Language solves without naming it: Catalog and Warehouse each have their own <code>Product</code> model, and every OTHER context that needs product data (Orders, via its ACL) has to build its own bespoke translation against Catalog\'s specific internal shape.',
        'That works for one consumer. It breaks down once five contexts all need product data — five separate ACLs, each hand-translating Catalog\'s internal model, each breaking independently whenever Catalog changes something even slightly.',
      ]
    },
    {
      heading: 'What a Published Language actually adds on top of a plain API',
      points: [
        'Open Host Service (already shown on the page for Payment) means upstream exposes ITS OWN stable API — consumers still translate from Payment\'s specific shape to their own.',
        'Published Language goes one step further: instead of every consumer translating from the upstream\'s own internal shape, the whole ecosystem agrees on a SHARED, upstream-independent schema — often an industry standard (e.g. a canonical Order event schema, or something like the GS1 product-data standard) that no single context owns.',
        'The practical payoff: a NEW context joining the system does not need to reverse-engineer Catalog\'s internal model at all — it just needs to speak the published schema, the same schema every other context already speaks. One shared contract replaces N bespoke ACLs.',
        'Published Language and Open Host Service commonly appear together: the Open Host Service is the mechanism (the API you call), and the Published Language is the CONTRACT that API exposes (a schema that is not tied to any one context\'s internal model).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Bespoke ACL per consumer vs. one Published Language',
      language: 'typescript',
      code: `// WITHOUT a Published Language -- every consumer hand-translates
// Catalog's OWN internal model, independently, N times over.
class OrdersCatalogAdapter {
  async getProduct(id: string): Promise<OrdersProductView> {
    const raw = await catalogApi.getProduct(id);      // Catalog's shape
    return { productId: raw.id, name: raw.name, unitPrice: raw.price };
  }
}
class ShippingCatalogAdapter {
  async getProduct(id: string): Promise<ShippingProductView> {
    const raw = await catalogApi.getProduct(id);      // Catalog's shape, again
    return { productId: raw.id, weightHint: raw.category };  // fragile guess!
  }
}
// Every one of these breaks independently the moment Catalog
// renames or restructures a field on ITS OWN internal model.

// WITH a Published Language -- one shared, upstream-independent schema
// that no single context owns. Catalog publishes TO this schema;
// everyone else consumes FROM this schema, never from Catalog directly.
interface PublishedProductSchema {
  productId: string;      // stable, versioned, documented independently
  displayName: string;    // of any single context's internal model
  price: { amount: number; currencyCode: string };
  category: string;
}
// Catalog's OWN Product model can be renamed, restructured, or even
// replaced entirely -- as long as Catalog keeps publishing to this
// schema, every consumer built against it keeps working unchanged.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A sixth context is about to be added to the system, and it also needs product data from Catalog. The team is about to write a sixth bespoke ACL, hand-translating Catalog\'s internal model the same way Orders did. What would a Published Language change about this plan?',
    hint: 'Where does the new context\'s ACL translate FROM — Catalog\'s own internal model, or a schema that does not belong to Catalog at all?',
    solution: 'With a Published Language already established, the new context does not need to reverse-engineer Catalog\'s internal model the way Orders did — it just needs to consume the shared, already-documented Published Schema every other context already speaks. There is still a translation step (mapping the schema into the new context\'s own domain model), but that translation is against a STABLE, SHARED contract instead of Catalog\'s ever-changing internals — so it is far less fragile, and the new context does not need any special knowledge of Catalog specifically. Without a Published Language, the sixth ACL repeats the same one-off, Catalog-specific reverse-engineering the first five ACLs each did independently -- six different translations of the same underlying data, six different places that break whenever Catalog changes something internally.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Published Language and Open Host Service are two names for the same pattern — both describe upstream exposing an API for others to use.',
      reality: 'Per this subtopic\'s theory, they answer different questions and often combine — Open Host Service is the mechanism (the API you call), while Published Language is the CONTRACT that API exposes: a shared schema not tied to any single context\'s internal model.'
    },
    {
      thought: 'Building a separate Anti-Corruption Layer for each new consumer of a context is just the normal, unavoidable cost of protecting your domain model.',
      reality: 'Per this subtopic\'s theory, that cost is only unavoidable when there is no shared contract — a Published Language lets many consumers translate against ONE stable, upstream-independent schema instead of each hand-translating the upstream\'s own internal model separately.'
    },
    {
      thought: 'A Published Language has to be an external industry standard (like an official specification) — a schema a project defines for itself does not count.',
      reality: 'Per this subtopic\'s theory, an industry standard is only the most recognizable EXAMPLE — what actually defines a Published Language is that the schema is shared and independent of any single context\'s internal model, whether it is an external standard or a schema the team itself agreed on together.'
    }
  ];
}
