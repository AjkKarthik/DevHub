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
  selector: 'app-arch-anti-corruption-layer',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './anti-corruption-layer.html',
  styleUrl: './anti-corruption-layer.scss',
})
export class ArchAntiCorruptionLayer {

  quickRef: QuickRefItem[] = [
    { name: 'ACL', type: 'keyword', desc: 'Anti-Corruption Layer — translation adapter between your domain and an external model' },
    { name: 'Adapter', type: 'keyword', desc: 'Converts external types to your internal model types' },
    { name: 'Facade', type: 'keyword', desc: 'Simplified interface over a complex external API — hides external complexity from your domain' },
    { name: 'Translator', type: 'keyword', desc: 'Maps external concepts to internal ubiquitous language' },
    { name: 'Domain Pollution', type: 'keyword', desc: 'When external model concepts leak into your domain — strings, enums, field names from the external system' },
    { name: 'Upstream', type: 'keyword', desc: 'The external system or bounded context whose model you are integrating with' },
    { name: 'Seam', type: 'keyword', desc: 'The explicit integration point — the ACL is the seam between your context and the external world' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is the ACL?',
      points: [
        'The Anti-Corruption Layer (Evans, DDD 2003) is a translation layer that protects your domain model from an external model you do not control.',
        'Without an ACL: external concepts, field names, enums, and IDs leak directly into your domain. When the external system changes, your domain must change.',
        'With an ACL: external model changes are absorbed at the boundary. Your domain model stays clean and stable.',
        'The ACL typically consists of three components: Facade (simplifies external API), Adapter (converts types), and Translator (maps concepts).',
      ],
    },
    {
      heading: 'When to Use an ACL',
      points: [
        'Integrating with a legacy system that has a messy, inconsistent model.',
        'Consuming a third-party SaaS API (Stripe, Salesforce, SAP) whose model does not match your domain language.',
        'Crossing a bounded context boundary where the upstream model uses different terminology.',
        'When the upstream system is dominant (Conformist would mean adopting their model) but you want to protect your domain.',
      ],
    },
    {
      heading: 'ACL vs Other Integration Patterns',
      points: [
        'Conformist: adopt the upstream model as-is — no translation. Simpler but your domain is polluted.',
        'Shared Kernel: both teams agree on and co-own a small shared model. Requires coordination.',
        'ACL: translate at the boundary — your domain stays independent. Requires translation code.',
        'Open Host Service: upstream publishes a stable versioned API designed for many consumers. Often combined with ACL on the downstream side.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ACL: Stripe Integration',
      language: 'typescript',
      code: `// EXTERNAL MODEL (Stripe API) — you do not control this
interface StripePaymentIntent {
  id: string;
  amount: number;           // in cents!
  currency: string;         // lowercase ISO code
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
  customer: string | null;
  metadata: Record<string, string>;
}

// YOUR DOMAIN MODEL — clean, uses your language
interface PaymentResult {
  paymentId: string;
  amount: Money;            // your Money value object
  status: 'pending' | 'succeeded' | 'failed';
  customerId: string | null;
}

// ANTI-CORRUPTION LAYER — Adapter + Translator
class StripePaymentAdapter {
  constructor(private stripe: StripeClient) {}

  // Facade — simplified interface hiding Stripe complexity
  async chargeCard(customerId: string, amount: Money): Promise<PaymentResult> {
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount.amount * 100),     // your $49.99 → Stripe 4999 cents
      currency: amount.currency.toLowerCase(),
      customer: customerId,
      confirm: true,
    });
    return this.translate(intent);  // Stripe model → your domain model
  }

  // Translator — maps Stripe concepts to your ubiquitous language
  private translate(intent: StripePaymentIntent): PaymentResult {
    const STATUS_MAP: Record<string, PaymentResult['status']> = {
      'succeeded': 'succeeded',
      'requires_payment_method': 'failed',
      'canceled': 'failed',
      'requires_confirmation': 'pending',
    };
    return {
      paymentId: intent.id,
      amount: new Money(intent.amount / 100, intent.currency.toUpperCase()),
      status: STATUS_MAP[intent.status] ?? 'pending',
      customerId: intent.customer,
    };
  }
}`
    },
    {
      label: 'ACL: Legacy ERP Integration',
      language: 'typescript',
      code: `// LEGACY ERP — inconsistent field names, codes, formats
interface ErpOrderRecord {
  ORD_NO: string;           // your orderId
  CUST_CD: string;          // your customerId
  STAT_CD: '10' | '20' | '30' | '40';  // cryptic status codes
  TOT_AMT: number;          // in legacy currency units (×100)
  ORD_DT: string;           // 'YYYYMMDD' format (!)
  LN_CNT: number;
}

// YOUR DOMAIN MODEL
interface Order {
  orderId: string;
  customerId: string;
  status: 'pending' | 'processing' | 'shipped' | 'cancelled';
  totalAmount: Money;
  placedAt: Date;
  lineCount: number;
}

// ACL — translates ERP mess to your clean domain model
class LegacyErpAdapter {
  private readonly STATUS_MAP: Record<string, Order['status']> = {
    '10': 'pending', '20': 'processing', '30': 'shipped', '40': 'cancelled',
  };

  translate(record: ErpOrderRecord): Order {
    const dateStr = record.ORD_DT;  // 'YYYYMMDD'
    const placedAt = new Date(
      \`\${dateStr.slice(0,4)}-\${dateStr.slice(4,6)}-\${dateStr.slice(6,8)}\`
    );
    return {
      orderId:     record.ORD_NO,
      customerId:  record.CUST_CD,
      status:      this.STATUS_MAP[record.STAT_CD] ?? 'pending',
      totalAmount: new Money(record.TOT_AMT / 100, 'USD'),
      placedAt,
      lineCount:   record.LN_CNT,
    };
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const record = await this.erpClient.fetchOrder(orderId);
    return record ? this.translate(record) : null;
  }
}`
    },
    {
      label: 'ACL Test Strategy',
      language: 'typescript',
      code: `// Test the ACL translation logic — no external calls
describe('StripePaymentAdapter.translate', () => {
  const adapter = new StripePaymentAdapter(mockStripeClient);

  it('maps succeeded status', () => {
    const result = adapter['translate']({
      id: 'pi_123', amount: 4999, currency: 'usd',
      status: 'succeeded', customer: 'cus_abc', metadata: {},
    });
    expect(result.paymentId).toBe('pi_123');
    expect(result.amount.amount).toBe(49.99);
    expect(result.amount.currency).toBe('USD');
    expect(result.status).toBe('succeeded');
    expect(result.customerId).toBe('cus_abc');
  });

  it('maps failed statuses', () => {
    const result = adapter['translate']({
      id: 'pi_456', amount: 1000, currency: 'usd',
      status: 'requires_payment_method', customer: null, metadata: {},
    });
    expect(result.status).toBe('failed');
  });
});

// ACL tests focus on translation correctness — not Stripe's behaviour
// Stripe behaviour is their responsibility; translation is yours`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Letting external model types leak into the domain',
      wrong: `// Domain Order references StripePaymentIntent directly
class Order { stripeIntent: StripePaymentIntent; }`,
      right: `// Domain Order references your own PaymentResult
class Order { payment: PaymentResult; }`,
      explanation: 'External types inside your domain mean your domain changes whenever the external API changes. ACL keeps the external model at the boundary.',
    },
    {
      title: 'Putting business logic in the ACL',
      wrong: `// ACL decides whether to apply a discount based on Stripe customer tier`,
      right: `// ACL only translates; business logic belongs in the domain service or use case`,
      explanation: 'The ACL is a translation layer, not a business logic layer. Mix in business rules and you cannot test the translation separately from the domain.',
    },
    {
      title: 'Skipping the ACL for "just one field"',
      wrong: `// "We only use Stripe's payment ID — no need for a full ACL"
order.stripePaymentId = intent.id; // now Stripe leaks in`,
      right: `// PaymentResult.paymentId wraps the Stripe ID with a domain concept`,
      explanation: 'ACL leaks start small. "Just one field" becomes five fields, then an entire external type. Draw the line at the first external concept that enters your domain.',
    },
    {
      title: 'Not testing ACL translation logic',
      wrong: `// ACL only tested via end-to-end tests with real Stripe calls`,
      right: `// Unit test the translate() method with stubbed external responses`,
      explanation: 'Translation logic is complex and failure-prone. Unit test every status mapping, field conversion, and edge case without any external calls.',
    },
  ];

  challenge: Challenge = {
    title: 'Build an ACL for a Weather API',
    language: 'typescript',
    description: `An external weather API returns temperature in Fahrenheit and uses numeric condition codes.
Your domain uses Celsius and string condition names.

Build an ACL that:
1. Defines the external WeatherApiResponse type.
2. Defines your domain WeatherReport type (Celsius, string conditions).
3. Writes a translate() method mapping F→C and code→condition name.
4. Maps codes: 1→'sunny', 2→'cloudy', 3→'rainy', else→'unknown'.`,
    hints: [
      'Celsius = (Fahrenheit - 32) × 5/9',
      'Use a Record<number, string> for code mapping',
      'Round Celsius to 1 decimal',
    ],
    starterCode: `interface WeatherApiResponse {
  temp_f: number;
  condition_code: number;
  city: string;
}

interface WeatherReport {
  city: string;
  temperatureCelsius: number;
  condition: string;
}

class WeatherAcl {
  translate(response: WeatherApiResponse): WeatherReport {
    // TODO
  }
}`,
    solution: `interface WeatherApiResponse {
  temp_f: number;
  condition_code: number;
  city: string;
}

interface WeatherReport {
  city: string;
  temperatureCelsius: number;
  condition: string;
}

class WeatherAcl {
  private readonly CONDITIONS: Record<number, string> = {
    1: 'sunny', 2: 'cloudy', 3: 'rainy',
  };

  translate(response: WeatherApiResponse): WeatherReport {
    const celsius = Math.round(((response.temp_f - 32) * 5 / 9) * 10) / 10;
    return {
      city: response.city,
      temperatureCelsius: celsius,
      condition: this.CONDITIONS[response.condition_code] ?? 'unknown',
    };
  }
}

const acl = new WeatherAcl();
console.log(acl.translate({ temp_f: 77, condition_code: 1, city: 'London' }));
// { city: 'London', temperatureCelsius: 25, condition: 'sunny' }
console.log(acl.translate({ temp_f: 32, condition_code: 99, city: 'Oslo' }));
// { city: 'Oslo', temperatureCelsius: 0, condition: 'unknown' }`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary purpose of an Anti-Corruption Layer?',
      options: [
        'To encrypt data between services',
        'To prevent external model concepts from leaking into your domain model',
        'To validate user input at the API boundary',
        'To rate-limit external API calls',
      ],
      answer: 1,
      explanation: 'The ACL translates between external models and your domain model, protecting your domain\'s ubiquitous language from external terminology and structure.',
    },
    {
      q: 'What three components typically make up an ACL?',
      options: [
        'Router, Controller, Repository',
        'Facade, Adapter, Translator',
        'Command, Handler, Event',
        'Interface, Implementation, Factory',
      ],
      answer: 1,
      explanation: 'Facade: simplifies the external API. Adapter: converts external types. Translator: maps external concepts to your ubiquitous language.',
    },
    {
      q: 'When would you use Conformist instead of an ACL?',
      options: [
        'When the external model is complex',
        'When you can negotiate API changes with the upstream team',
        'When the upstream is too dominant to push back on and adopting their model is acceptable',
        'When you need strict data validation',
      ],
      answer: 2,
      explanation: 'Conformist means adopting the upstream model as-is — simpler than building a translation layer, acceptable when the external model is stable and not too alien to your domain.',
    },
    { q: 'What is an Anti-Corruption Layer (ACL) and when do you need one?', options: ['A security layer that prevents injection attacks in the API', 'A translation layer that converts between the model of an external system and your own domain model, protecting your domain from foreign concepts', 'A validation layer that rejects invalid inputs before they enter the database', 'A rate-limiting layer that prevents external systems from overloading your service'], answer: 1, explanation: 'An ACL translates between the data and concepts of an external system and your domain model. Without an ACL, external system concepts leak into your domain: you may start using an external ID type, naming conventions, or data structures that pollute your model. The ACL isolates your domain from the external model: incoming data from the external system is translated to your domain objects, and outgoing data is translated back. This is especially important when integrating with legacy systems, third-party APIs, or bounded contexts with different modeling choices.' },
    { q: 'In which strategic DDD relationship is an ACL most commonly used?', options: ['Partnership, where both teams co-evolve their models collaboratively', 'Conformist, where the downstream team copies the upstream model', 'Customer-Supplier, where the downstream team adjusts to whatever the upstream provides', 'Shared Kernel, where both bounded contexts share a common model'], answer: 2, explanation: 'The Customer-Supplier relationship: the upstream context publishes its model (the Supplier) and the downstream context (the Customer) must use it. If the upstream model is poorly suited to the downstream domain, the downstream team uses an ACL to translate from the upstream model to their own. Without an ACL in this relationship, the downstream becomes a Conformist that simply copies the upstream model into its own domain, losing modeling autonomy.' },
    { q: 'What is the difference between an ACL and a simple adapter or mapper?', options: ['They are identical; ACL is just a DDD-specific name for an adapter', 'An ACL translates between domain models including concepts and semantics; adapters typically handle technical protocol differences without semantic translation', 'Adapters are for databases; ACLs are for HTTP APIs', 'An ACL is more complex because it must always transform data bidirectionally'], answer: 1, explanation: 'A simple adapter handles structural or protocol translation: convert XML to JSON, translate an HTTP response to a domain object. It does not require understanding of the domain. An ACL performs semantic translation: it understands the external domain model and maps its concepts to your domain concepts. For example, the external system calls it a client with a client_code, but your domain calls it a Customer with a customerId. The ACL understands both conceptual models and translates between them, protecting your model from the vocabulary and structure of external systems.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How is an ACL different from a simple DTO mapper?',
      a: 'A DTO mapper is a mechanical field-by-field copy between data shapes. An ACL does conceptual translation: it maps between different ubiquitous languages (Stripe\'s "amount in cents" → your Money value object), resolves semantic differences (ERP status codes → domain status enum), and hides external API complexity behind a clean facade.',
    },
    {
      q: 'Should the ACL live in the Domain, Application, or Infrastructure layer?',
      a: 'The ACL belongs in the Infrastructure layer. The Domain defines the interface (IPaymentGateway); the ACL implementation in Infrastructure wraps the external client and translates. The Domain never imports from Infrastructure — the ACL is an adapter that implements a Domain interface.',
    },
    {
      q: 'Does an ACL add performance overhead?',
      a: 'Negligible. Object mapping and field translation are CPU-bound micro-operations (nanoseconds). The network call to the external system dominates latency by orders of magnitude. The architectural benefit of a clean domain model far outweighs any translation overhead.',
    },
    { q: 'How do you implement an Anti-Corruption Layer technically?', a: 'An ACL is typically implemented as a set of classes at the boundary of your bounded context. A translator or mapper class converts external DTOs (data transfer objects) to your domain objects and vice versa. A facade or service wraps the external system call, converts the request from your domain terms to the external system terms, makes the call, and translates the response back. The ACL may also buffer or cache calls, retry on transient failures, and handle versioning when the external API changes. Place the ACL in its own module or package to make the boundary explicit and keep external dependencies from leaking into your core domain.' },
    { q: 'How does an ACL help with legacy system integration?', a: 'Legacy systems often have data models shaped by decades of accumulated workarounds: cryptic field names, overloaded fields, inconsistent naming, and domain concepts that no longer match the current business. Without an ACL, modernizing the domain model means fighting against legacy system constraints throughout the new system. The ACL absorbs the mismatch: the modern system uses clean domain objects and the ACL handles the messy translation to and from the legacy system. When the legacy system is eventually replaced, only the ACL needs to change, not the entire domain model. This is the strangler fig pattern applied at the model level.' },
    { q: 'When should you NOT use an Anti-Corruption Layer?', a: 'An ACL adds complexity and maintenance overhead. Skip it when: the external system uses the same domain language and concepts as your domain (a Partnership or Shared Kernel relationship where models align well). The integration is very simple and the external model maps cleanly to yours without ambiguity. The external system is owned by your team and you can coordinate model changes. The integration is temporary and will be replaced soon. Over-engineering an ACL for every integration adds unnecessary layers. Apply it when the external model would genuinely pollute your domain without it, particularly for long-lived integrations with poorly aligned external models.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'The ACL translates between external models and your domain at the integration boundary — keeping your ubiquitous language clean regardless of what upstream systems look like.',
    mustKnow: [
      'ACL: Facade (simplify API) + Adapter (convert types) + Translator (map concepts)',
      'Protects your domain from external model changes — absorbs upstream churn at the boundary',
      'External types must not appear in your domain classes — only your own types',
      'No business logic in the ACL — only translation logic',
      'ACL belongs in Infrastructure; Domain defines the interface (IPaymentGateway)',
    ],
    interviewFocus: [
      'What problem does an ACL solve that a Conformist relationship does not?',
      'Where in Clean/Layered Architecture does an ACL belong?',
      'How would you test an ACL translation without calling the external API?',
    ],
  };
}
