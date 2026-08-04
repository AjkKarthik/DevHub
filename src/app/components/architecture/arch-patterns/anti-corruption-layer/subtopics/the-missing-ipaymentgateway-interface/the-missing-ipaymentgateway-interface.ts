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
  templateUrl: './the-missing-ipaymentgateway-interface.html',
  styleUrl: './the-missing-ipaymentgateway-interface.scss'
})
export class TheMissingIPaymentGatewayInterfaceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A claim made twice in prose, shown zero times in code',
      points: [
        'This page\'s QnA states it directly: "The ACL belongs in the Infrastructure layer. The Domain defines the interface (IPaymentGateway); the ACL implementation in Infrastructure wraps the external client and translates. The Domain never imports from Infrastructure."',
        'The revision\'s own <code>mustKnow</code> list repeats the same claim: "ACL belongs in Infrastructure; Domain defines the interface (IPaymentGateway)."',
        'But every codeTab on the page defines <code>StripePaymentAdapter</code> as a bare class — <code>class StripePaymentAdapter { constructor(private stripe: StripeClient) {} ... }</code> — with no <code>implements</code> clause, and <code>IPaymentGateway</code> never appears anywhere in any codeTab at all. The dependency-inversion structure the page describes in words is never actually demonstrated.',
      ]
    },
    {
      heading: 'Why the missing interface is not just a documentation gap',
      points: [
        'Without <code>IPaymentGateway</code> actually existing and living in the Domain layer, there is nothing forcing <code>StripePaymentAdapter</code>\'s public shape to match what the Domain actually needs — the class could drift to expose Stripe-specific methods or return Stripe-shaped data, and nothing in the type system would catch it.',
        'This is the same dependency-inversion principle this hub\'s own Hexagonal Architecture and Layered Architecture topics already cover in depth: the Domain defines the CONTRACT (an interface), and Infrastructure provides an IMPLEMENTATION that satisfies it — never the other way around.',
        'Making the interface concrete also makes the ACL trivially swappable for a test double: anything implementing <code>IPaymentGateway</code> — a real <code>StripePaymentAdapter</code>, or an in-memory fake for tests — can stand in for the Domain\'s dependency, which the ACL Test Strategy codeTab\'s approach (testing <code>translate()</code> directly via bracket-notation access) does not actually require, but a full swap-in-a-fake integration test would.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Making the Domain-defined interface real',
      language: 'typescript',
      code: `// DOMAIN LAYER -- defines the contract, knows nothing about Stripe
interface IPaymentGateway {
  chargeCard(customerId: string, amount: Money): Promise<PaymentResult>;
}

// A domain use case depends ONLY on the interface -- never on Stripe,
// never on StripePaymentAdapter by name.
class CheckoutService {
  constructor(private paymentGateway: IPaymentGateway) {}

  async completeCheckout(customerId: string, total: Money): Promise<PaymentResult> {
    // ... domain logic ...
    return this.paymentGateway.chargeCard(customerId, total);
  }
}

// INFRASTRUCTURE LAYER -- the ACL now explicitly satisfies the contract
class StripePaymentAdapter implements IPaymentGateway {
  constructor(private stripe: StripeClient) {}

  async chargeCard(customerId: string, amount: Money): Promise<PaymentResult> {
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount.amount * 100),
      currency: amount.currency.toLowerCase(),
      customer: customerId,
      confirm: true,
    });
    return this.translate(intent);
  }

  private translate(intent: StripePaymentIntent): PaymentResult {
    // ... unchanged translation logic ...
    return {} as PaymentResult;
  }
}

// A test double satisfies the SAME interface -- no Stripe involved at all
class FakePaymentGateway implements IPaymentGateway {
  async chargeCard(customerId: string, amount: Money): Promise<PaymentResult> {
    return { paymentId: 'fake-1', amount, status: 'succeeded', customerId };
  }
}

// CheckoutService works identically with either implementation --
// this is only possible BECAUSE IPaymentGateway actually exists.
const realCheckout = new CheckoutService(new StripePaymentAdapter(stripeClient));
const testCheckout = new CheckoutService(new FakePaymentGateway());`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Without <code>IPaymentGateway</code> actually declared anywhere, a teammate writes <code>class CheckoutService { constructor(private stripeAdapter: StripePaymentAdapter) {} }</code> — naming the CONCRETE class directly instead of an interface. What breaks, concretely, if the team later needs to swap Stripe for a different payment provider?',
    hint: 'How many places in the codebase would need to change their TYPE ANNOTATION, not just their runtime wiring, if <code>CheckoutService</code> depends on the concrete <code>StripePaymentAdapter</code> type?',
    solution: 'Every place that declares a variable, parameter, or field typed as <code>StripePaymentAdapter</code> -- starting with <code>CheckoutService</code>\'s own constructor parameter -- would need its TYPE ANNOTATION changed to whatever the new provider\'s adapter class is called, not just its runtime wiring swapped. With <code>IPaymentGateway</code> in place, only the WIRING changes (which concrete class gets constructed and passed in); the type annotation on <code>CheckoutService</code>\'s constructor never needs to change at all, since any class implementing <code>IPaymentGateway</code> is already a valid substitute. This is the concrete, mechanical payoff of the Domain defining the interface rather than depending on a specific Infrastructure class by name -- it is not just an abstract principle, it is the difference between a one-line wiring change and hunting down every direct reference to the old concrete type.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since <code>StripePaymentAdapter</code> already exposes a clean, domain-shaped <code>chargeCard()</code> method, whether or not it formally <code>implements</code> an interface is a minor detail.',
      reality: 'Per this subtopic\'s theory, the interface is what actually FORCES the class\'s public shape to stay aligned with what the Domain needs — without it, nothing in the type system catches the adapter\'s shape silently drifting toward Stripe-specific concepts over time.'
    },
    {
      thought: 'The page\'s own claim that "the Domain defines the interface" is just a general principle being illustrated by the Stripe example, not something the example needs to literally show in code.',
      reality: 'Per this subtopic\'s theory, dependency inversion is a structural claim about WHERE the interface lives and WHO depends on WHAT — a claim that is either demonstrated in code or it isn\'t; the original codeTabs described the pattern in prose but never actually wrote the interface the prose depends on.'
    },
    {
      thought: 'Testing the ACL\'s <code>translate()</code> method directly (as the "ACL Test Strategy" codeTab does) is equivalent to having a swappable <code>IPaymentGateway</code> interface for integration-style tests.',
      reality: 'Per this subtopic\'s theory, these solve different problems — unit-testing <code>translate()</code> in isolation checks the translation logic itself, while an actual <code>IPaymentGateway</code> interface is what lets a <code>CheckoutService</code> integration test swap in a fake gateway without touching Stripe at all.'
    }
  ];
}
