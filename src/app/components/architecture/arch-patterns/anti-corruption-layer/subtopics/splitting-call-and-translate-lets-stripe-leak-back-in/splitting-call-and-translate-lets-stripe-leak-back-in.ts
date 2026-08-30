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
  templateUrl: './splitting-call-and-translate-lets-stripe-leak-back-in.html',
  styleUrl: './splitting-call-and-translate-lets-stripe-leak-back-in.scss'
})
export class SplittingCallAndTranslateLetsStripeLeakBackInSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A risk named in one sentence, never shown happening',
      points: [
        'The page\'s own QnA raises the risk directly, then moves on: "Splitting \'make the call\' and \'translate the result\' into separate layers is also valid, but risks the translation-only layer becoming a thin pass-through that domain code bypasses under time pressure, reintroducing the exact leak the ACL exists to prevent." It never shows what that bypass actually looks like.',
        'The full-round-trip <code>StripePaymentAdapter</code> shown elsewhere on this page avoids the risk entirely by construction — <code>chargeCard()</code> both makes the Stripe call AND translates the result, so there is no separate "translate-only" layer for domain code to route around.',
        'The failure mode only appears once the two responsibilities are split into different classes — which is exactly the alternative structure the QnA calls "also valid," so it is worth seeing concretely what makes it fragile.',
      ]
    },
    {
      heading: 'How the bypass actually happens, step by step',
      points: [
        'Split the ACL into two pieces: a thin <code>StripeApiCaller</code> that only makes the network request and returns the RAW <code>StripePaymentIntent</code>, and a separate <code>PaymentTranslator</code> whose only job is <code>translate(intent: StripePaymentIntent): PaymentResult</code>.',
        'Under time pressure — a bug needs a quick fix, a new feature needs "just one more field" from Stripe\'s response — a developer working in domain code reaches for <code>StripeApiCaller</code> directly, since it is right there and already returns something usable, and skips <code>PaymentTranslator</code> entirely "just this once."',
        'The moment that happens, a raw <code>StripePaymentIntent</code> — Stripe\'s field names, Stripe\'s status strings, Stripe\'s cents-based amount — is now sitting inside domain code. The translation-only layer did not prevent this; it was never in the bypassed code path\'s way at all, because nothing forced domain code to go through it.',
        'The full-round-trip version does not have this failure mode: there is no way to "just call Stripe directly" without also getting <code>StripePaymentAdapter</code>\'s translation, because the SAME method that makes the call also returns the translated, domain-shaped result. There is nothing to bypass.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The split structure and exactly where the bypass happens',
      language: 'typescript',
      code: `// SPLIT ACL -- two separate classes, two separate responsibilities
class StripeApiCaller {
  constructor(private stripe: StripeClient) {}

  // Returns the RAW Stripe type -- nothing translated yet
  async callChargeCard(customerId: string, amountCents: number): Promise<StripePaymentIntent> {
    return this.stripe.paymentIntents.create({
      amount: amountCents, currency: 'usd', customer: customerId, confirm: true,
    });
  }
}

class PaymentTranslator {
  translate(intent: StripePaymentIntent): PaymentResult {
    // ... same translation logic as the full-round-trip version ...
    return {} as PaymentResult;
  }
}

// THE INTENDED PATH -- domain code goes through both
async function intendedCheckout(caller: StripeApiCaller, translator: PaymentTranslator) {
  const intent = await caller.callChargeCard('cus_123', 4999);
  return translator.translate(intent); // returns clean PaymentResult
}

// THE BYPASS -- nothing stops this from compiling or running
async function underTimePressureCheckout(caller: StripeApiCaller) {
  const intent = await caller.callChargeCard('cus_123', 4999);
  // "I just need the raw status real quick..."
  if (intent.status === 'requires_payment_method') {   // <- Stripe's own
    //                     ^^^^^^^^^^^^^^^^^^^^^^^^        string literal,
    //                                                      now living in
    //                                                      domain code
  }
  return intent; // <- a raw StripePaymentIntent, never translated,
                 //    now the return value of a "checkout" function
}

// Compare: the full-round-trip StripePaymentAdapter.chargeCard() shown
// elsewhere on this page CANNOT be called without ALSO getting the
// translation -- there is no equivalent shortcut to reach for.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate proposes fixing the split-layer version by adding a code review checklist item: "Reviewers must reject any PR that calls StripeApiCaller directly instead of going through PaymentTranslator." Does this close the gap the same way the full-round-trip design does?',
    hint: 'Does a checklist item change what the TYPE SYSTEM allows, or only what a human reviewer is expected to catch?',
    solution: 'It helps, but it does not close the gap the same way -- it is a process control, not a structural one. A checklist item depends on every reviewer remembering it, every time, including on a rushed PR late in a sprint -- exactly the "under time pressure" condition the page\'s own QnA names as the risk in the first place. The full-round-trip design closes the gap STRUCTURALLY: there is no code path where calling the Stripe-touching method returns anything other than an already-translated PaymentResult, so there is nothing for a reviewer to have to remember to check. A checklist is a reasonable second line of defense, but relying on it as the PRIMARY defense reintroduces the same dependence on human vigilance that "under time pressure" already describes as unreliable.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Splitting the ACL into a call layer and a translate layer is a straightforward refactor with no real downside compared to the full-round-trip version.',
      reality: 'Per this subtopic\'s theory, splitting them creates a real structural risk the full-round-trip version does not have — a "raw call" method that domain code can reach for directly, bypassing translation entirely, something the single-method design makes impossible by construction.'
    },
    {
      thought: 'A code review checklist requiring "always go through the translator" is functionally equivalent to a class structure that makes bypassing impossible.',
      reality: 'Per this subtopic\'s theory, a checklist is a process control that depends on human vigilance under time pressure — the exact condition named as the risk — while a structural fix (one method that both calls and translates) removes the bypass path entirely, with nothing for a reviewer to have to remember.'
    },
    {
      thought: 'The risk of Stripe leaking into domain code only exists if a developer is being careless or ignoring the ACL pattern on purpose.',
      reality: 'Per this subtopic\'s theory, the bypass happens through completely ordinary behavior — reaching for the nearest already-available thing under deadline pressure — not through carelessness about the pattern; the fix is removing the shortcut, not expecting more discipline.'
    }
  ];
}
