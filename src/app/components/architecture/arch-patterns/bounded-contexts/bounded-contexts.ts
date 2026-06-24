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

@Component({
  selector: 'app-arch-bounded-contexts',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './bounded-contexts.html',
  styleUrl: './bounded-contexts.scss',
})
export class ArchBoundedContexts {

  quickRef: QuickRefItem[] = [
    { name: 'Bounded Context', type: 'keyword', desc: 'Explicit boundary within which one model and one language apply consistently' },
    { name: 'Context Map', type: 'keyword', desc: 'Diagram showing how bounded contexts relate and integrate' },
    { name: 'Shared Kernel', type: 'keyword', desc: 'Small agreed-upon shared subset of the domain model, co-owned by two teams' },
    { name: 'Customer/Supplier', type: 'keyword', desc: 'Upstream context supplies; downstream context consumes — upstream accommodates downstream needs' },
    { name: 'Conformist', type: 'keyword', desc: 'Downstream adopts upstream model without translation — used when upstream is too powerful to negotiate with' },
    { name: 'Anti-Corruption Layer', type: 'keyword', desc: 'Translation adapter protecting your model from an external model you do not control' },
    { name: 'Open Host Service', type: 'keyword', desc: 'A published, versioned API designed to serve multiple downstream contexts' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is a Bounded Context?',
      points: [
        'A bounded context is a boundary within which a particular domain model is defined and applicable.',
        'The same word can mean different things in different contexts. "Product" in Catalog means name, price, description. "Product" in Warehouse means weight, location, stock level.',
        'Within a bounded context, every term in the ubiquitous language has exactly one meaning.',
        'Bounded contexts align naturally with microservices — one service per bounded context is a common (but not mandatory) rule.',
      ],
    },
    {
      heading: 'Context Map — Relationship Patterns',
      points: [
        'Shared Kernel: two contexts share a small piece of the domain model. Changes require agreement from both teams.',
        'Customer/Supplier: the upstream (supplier) context defines an API; the downstream (customer) context depends on it. Upstream accommodates customer needs in its planning.',
        'Conformist: downstream adopts the upstream model as-is — no translation. Use when the upstream is too dominant to negotiate with (e.g., a SaaS API).',
        'Anti-Corruption Layer (ACL): downstream translates the upstream model into its own language using an adapter. Protects domain integrity from external model pollution.',
        'Open Host Service: upstream publishes a formal, versioned API designed for many consumers. More stable than a bilateral Customer/Supplier relationship.',
      ],
    },
    {
      heading: 'Identifying Bounded Context Boundaries',
      points: [
        'Event Storming: workshop technique — map all domain events on a timeline; cluster events into process groups; group into contexts.',
        'Linguistic boundary: when the same word starts meaning different things, you may have crossed a context boundary.',
        'Team boundary: Conway\'s Law — a team can effectively maintain one bounded context. If two teams are modifying the same model constantly, split or clarify ownership.',
        'Change frequency: parts of the model that change together, stay together.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Context-Specific Models',
      language: 'typescript',
      code: `// CATALOG CONTEXT — "Product" means display info + pricing
namespace CatalogContext {
  export class Product {
    constructor(
      public readonly id: string,
      public readonly name: string,
      public readonly description: string,
      public readonly price: Money,
      public readonly category: string,
      public readonly imageUrls: string[],
    ) {}
  }
}

// WAREHOUSE CONTEXT — same concept, very different model
namespace WarehouseContext {
  export class Product {
    constructor(
      public readonly sku: string,       // different ID system!
      public readonly weight: number,    // grams
      public readonly dimensions: Dimensions,
      public readonly storageLocation: string,
      public readonly stockLevel: number,
      public readonly reorderThreshold: number,
    ) {}

    needsReorder(): boolean {
      return this.stockLevel <= this.reorderThreshold;
    }
  }
}

// They are different models — do NOT try to merge them into one "universal Product"`
    },
    {
      label: 'Context Map Integration',
      language: 'typescript',
      code: `// ANTI-CORRUPTION LAYER — Orders context translates Catalog context model
// Orders does not use CatalogContext.Product directly

// In Orders context: a simple ProductSnapshot (what was ordered)
interface ProductSnapshot {
  productId: string;
  name: string;
  unitPrice: Money;
}

// ACL translator — fetches from Catalog API, maps to Orders' own model
class CatalogContextAdapter {
  async getProductSnapshot(productId: string): Promise<ProductSnapshot> {
    // Call Catalog context API
    const catalogProduct = await catalogApi.getProduct(productId);

    // Translate Catalog model → Orders model (no leakage)
    return {
      productId: catalogProduct.id,
      name: catalogProduct.name,
      unitPrice: new Money(catalogProduct.price.amount, catalogProduct.price.currency),
    };
  }
}

// OPEN HOST SERVICE — Catalog exposes a versioned public API
// Other contexts consume this API without needing Catalog's internal model
// GET /api/v1/catalog/products/:id
// → { id, name, price: { amount, currency }, available: boolean }
// Breaking changes → new version /api/v2/`
    },
    {
      label: 'Event Storming Output',
      language: 'typescript',
      code: `// Event Storming → Bounded Contexts → Microservices boundary decisions

// Events discovered in the workshop:
const domainEvents = [
  // CATALOG CONTEXT
  'ProductCreated', 'ProductPriceChanged', 'ProductDiscontinued',

  // ORDER CONTEXT
  'OrderPlaced', 'OrderLineAdded', 'OrderConfirmed', 'OrderCancelled',

  // PAYMENT CONTEXT
  'PaymentInitiated', 'PaymentCharged', 'PaymentFailed', 'RefundIssued',

  // SHIPPING CONTEXT
  'ShipmentCreated', 'ShipmentDispatched', 'ShipmentDelivered',

  // NOTIFICATION CONTEXT
  'OrderConfirmationSent', 'ShipmentNotificationSent',
];

// Context Map relationships:
// Order → Catalog: Customer/Supplier (Catalog serves Order's price needs)
// Order → Payment: Open Host Service (Payment exposes stable versioned API)
// Order → Shipping: Event-driven (Order publishes events; Shipping subscribes)
// Order → Notification: Event-driven (Notification subscribes to all contexts' events)`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Creating a single universal domain model',
      wrong: `// One "Product" class used by Catalog, Warehouse, Orders, and Shipping`,
      right: `// Each context has its own Product model with only the fields it needs`,
      explanation: 'A universal model becomes a compromise that serves no context well. Context-specific models are simpler and evolve independently.',
    },
    {
      title: 'Crossing context boundaries without a translation layer',
      wrong: `// Orders context imports CatalogContext.Product directly and uses its internal fields`,
      right: `// Orders context uses an ACL/adapter that maps Catalog API responses to Orders' own model`,
      explanation: 'Direct import couples two contexts at the class level. A change in Catalog\'s Product breaks Order directly. ACL protects the Order context from Catalog internals.',
    },
    {
      title: 'Confusing a bounded context with a microservice',
      wrong: `// "One microservice per entity" — CustomerService, AddressService, PreferenceService`,
      right: `// "One microservice per bounded context" — CustomerContext owns customers, addresses, preferences`,
      explanation: 'Bounded contexts are about model cohesion and team ownership, not deployment granularity. A bounded context can be one microservice, a module, or part of a monolith.',
    },
    {
      title: 'Shared Kernel growing too large',
      wrong: `// Shared Kernel contains 50 types used across 8 contexts — all teams must coordinate on changes`,
      right: `// Shared Kernel: 3–5 stable value objects (Money, DateRange, CustomerId) — minimal shared surface`,
      explanation: 'A large Shared Kernel creates tight coupling between teams. Keep it to the smallest possible set of stable, broadly-used types.',
    },
  ];

  challenge: Challenge = {
    title: 'Map the Contexts for a Healthcare Scheduling System',
    language: 'typescript',
    description: `A hospital system has these workflows:
- Patients book appointments
- Doctors manage their schedules and availability
- Billing calculates invoices after appointments
- Pharmacy dispenses medications after prescriptions

1. Identify 4 bounded contexts.
2. For each context, describe what "Patient" means in that context.
3. Identify the context map relationship between Scheduling and Billing.
4. What integration pattern would you use between Scheduling and Pharmacy?`,
    hints: [
      'Scheduling: appointments, slots, availability',
      'Billing: invoices, insurance, payment amounts',
      'Pharmacy: prescriptions, medications, dosage',
      'Patient in Billing = account holder with insurance; in Pharmacy = prescription recipient',
    ],
    starterCode: `const contexts = [
  // { name: '...', owns: [...], patientMeaning: '...' }
];

const contextMapRelationships = [
  // { from: '...', to: '...', pattern: 'Customer/Supplier|ACL|Event-Driven|Shared Kernel', reason: '...' }
];`,
    solution: `const contexts = [
  {
    name: 'Scheduling Context',
    owns: ['Appointment', 'TimeSlot', 'DoctorAvailability'],
    patientMeaning: 'A person with a name, DOB, and contact info who books appointments',
  },
  {
    name: 'Clinical Context',
    owns: ['MedicalRecord', 'Diagnosis', 'Prescription'],
    patientMeaning: 'A medical subject with health history, diagnoses, and prescriptions',
  },
  {
    name: 'Billing Context',
    owns: ['Invoice', 'InsuranceClaim', 'Payment'],
    patientMeaning: 'An account holder with insurance policy numbers and a billing address',
  },
  {
    name: 'Pharmacy Context',
    owns: ['Prescription', 'Medication', 'Dispensing'],
    patientMeaning: 'A prescription recipient identified by patient ID — no personal data needed',
  },
];

const contextMapRelationships = [
  {
    from: 'Scheduling', to: 'Billing',
    pattern: 'Customer/Supplier',
    reason: 'Billing needs appointment completion events to generate invoices. Scheduling (upstream) publishes AppointmentCompleted events; Billing (downstream) subscribes.',
  },
  {
    from: 'Clinical', to: 'Pharmacy',
    pattern: 'Event-Driven with ACL',
    reason: 'Clinical publishes PrescriptionCreated event. Pharmacy has its own Prescription model (ACL translates Clinical Prescription → Pharmacy Dispensing order).',
  },
];`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is a Bounded Context?',
      options: [
        'A microservice with a specific database',
        'An explicit boundary within which one domain model and language apply consistently',
        'A security zone in the network',
        'A database schema with strict access controls',
      ],
      answer: 1,
      explanation: 'A Bounded Context defines where a specific model and its ubiquitous language are valid and consistent. The same word can mean different things in different contexts.',
    },
    {
      q: 'What is an Anti-Corruption Layer?',
      options: [
        'A firewall between microservices',
        'A translation adapter that protects your domain model from an external model you do not control',
        'A data validation library',
        'A circuit breaker for database calls',
      ],
      answer: 1,
      explanation: 'The ACL translates between an external context\'s model and your own domain model, preventing external concepts from leaking into your domain.',
    },
    {
      q: 'When would you use a Conformist relationship?',
      options: [
        'When you can negotiate with the upstream team',
        'When the upstream context is too dominant to push back on — you adopt their model as-is',
        'When both contexts share an equal partnership',
        'When both contexts use the same database',
      ],
      answer: 1,
      explanation: 'Conformist: downstream adopts upstream model without translation. Typical when using a powerful SaaS API (Stripe, Salesforce) where you cannot influence the model.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Does one bounded context always mean one microservice?',
      a: 'No — it is a common alignment but not a rule. A bounded context can be: one microservice, one module in a Modular Monolith, or part of a larger service. The bounded context is a logical concept; the microservice is a deployment unit. Start with logical boundaries; let deployment decisions follow team and scale needs.',
    },
    {
      q: 'What is Event Storming?',
      a: 'A collaborative workshop (Alberto Brandolini) where developers and domain experts use sticky notes to map domain events on a timeline. Events cluster into process groups → bounded contexts emerge naturally. Excellent for discovering context boundaries when the domain is new or poorly understood.',
    },
    {
      q: 'How does a Context Map differ from a system architecture diagram?',
      a: 'A Context Map shows the relationships and integration patterns between bounded contexts (Shared Kernel, ACL, Customer/Supplier). A system architecture diagram shows deployment topology, infrastructure, and data flow. Both are valuable; the Context Map is the DDD-specific view of team and model relationships.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'A bounded context is an explicit model boundary — the same term means one thing inside it; context maps define how contexts relate and integrate.',
    mustKnow: [
      'Bounded context: one model, one language, one explicit boundary',
      'Same word = different meaning across contexts (Product in Catalog vs Warehouse)',
      'Context map patterns: Shared Kernel, Customer/Supplier, Conformist, ACL, Open Host Service',
      'ACL: translate external model to your own — never import external model classes directly',
      'Align bounded contexts with teams (Conway\'s Law) and deploy independently',
    ],
    interviewFocus: [
      'What is a Bounded Context and why does the same term mean different things across contexts?',
      'Explain Anti-Corruption Layer — when would you use it?',
      'How do you discover bounded context boundaries in a new domain?',
    ],
  };
}
