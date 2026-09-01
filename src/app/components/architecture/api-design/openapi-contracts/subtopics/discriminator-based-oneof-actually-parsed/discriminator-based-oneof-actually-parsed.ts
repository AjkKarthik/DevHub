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
    heading: 'The YAML Describes Discriminator Routing — Nothing on the Page Actually Does It',
    points: [
      'The main page’s QnA writes out a full <code>oneOf</code> + <code>discriminator</code> YAML block: a <code>PaymentMethod</code> that is either <code>CreditCard</code> or <code>BankTransfer</code>, with a <code>type</code> field naming which one and a <code>mapping</code> pointing each value at its schema. No codeTab, mistake, or Challenge on the page shows what CODE actually reads that <code>type</code> field and picks the right schema at runtime.',
      'The <code>discriminator</code> keyword exists precisely so a parser does NOT have to try validating a payload against every schema in the <code>oneOf</code> list one at a time (slow, and ambiguous if a payload accidentally matches more than one shape) — it reads the discriminator field first, looks it up in <code>mapping</code>, and validates against exactly that one schema.',
      'This is a plain <code>switch</code> on the discriminator field’s value — the OpenAPI spec doesn’t require any special library to consume a discriminator, it’s just documenting a naming convention a parser can rely on.',
      'An unrecognized discriminator value (a <code>type</code> the <code>mapping</code> doesn’t list) is a real error case worth handling explicitly — it usually means the client is sending a payload shape the spec doesn’t know about yet, not a payload that happens to be invalid for a known shape.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Discriminator-Based Routing',
    language: 'typescript',
    code: `interface CreditCard {
  kind: 'CreditCard';
  cardNumber: string;
  expiryMonth: number;
}

interface BankTransfer {
  kind: 'BankTransfer';
  accountNumber: string;
  routingNumber: string;
}

type PaymentMethod = CreditCard | BankTransfer;

// Mirrors the main page's own discriminator mapping:
//   credit_card    -> #/components/schemas/CreditCard
//   bank_transfer  -> #/components/schemas/BankTransfer
function parsePaymentMethod(data: any): PaymentMethod {
  switch (data.type) {
    case 'credit_card':
      if (typeof data.cardNumber !== 'string' || typeof data.expiryMonth !== 'number') {
        throw new Error('Invalid CreditCard payload');
      }
      return { kind: 'CreditCard', cardNumber: data.cardNumber, expiryMonth: data.expiryMonth };

    case 'bank_transfer':
      if (typeof data.accountNumber !== 'string' || typeof data.routingNumber !== 'string') {
        throw new Error('Invalid BankTransfer payload');
      }
      return { kind: 'BankTransfer', accountNumber: data.accountNumber, routingNumber: data.routingNumber };

    default:
      // The discriminator's whole job is to make this case reachable and
      // explicit, instead of silently falling through to "doesn't match
      // any known shape" after trying every oneOf branch.
      throw new Error('Unknown discriminator value: ' + data.type);
  }
}

console.log(parsePaymentMethod({ type: 'credit_card', cardNumber: '4111111111111111', expiryMonth: 12 }));
// { kind: 'CreditCard', cardNumber: '4111111111111111', expiryMonth: 12 }

console.log(parsePaymentMethod({ type: 'bank_transfer', accountNumber: '12345', routingNumber: '021000021' }));
// { kind: 'BankTransfer', accountNumber: '12345', routingNumber: '021000021' }

try {
  parsePaymentMethod({ type: 'crypto', address: 'abc' });
} catch (e: any) {
  console.log('THREW:', e.message);
  // THREW: Unknown discriminator value: crypto
}

try {
  parsePaymentMethod({ type: 'credit_card', cardNumber: '4111' }); // missing expiryMonth
} catch (e: any) {
  console.log('THREW:', e.message);
  // THREW: Invalid CreditCard payload
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate proposes skipping the <code>switch</code> entirely: just try validating the payload against <code>CreditCard</code>’s schema, and if that fails, try <code>BankTransfer</code>’s schema instead — trying each <code>oneOf</code> branch in order until one validates. What does using the discriminator field save you, beyond fewer lines of code?',
  hint: 'What happens if a malformed payload happens to accidentally satisfy BOTH schemas’ required-field checks — or neither, but for two completely different reasons? Which approach tells you WHICH schema the client actually intended to send?',
  solution: `// Trying each oneOf branch in order has two real problems the
// discriminator field avoids:
//
// 1. AMBIGUITY: if a malformed payload happens to satisfy more than one
//    branch's required-field checks (a real risk once a oneOf list has
//    several schemas with overlapping optional fields), "try each one in
//    order" silently picks whichever branch happens to come first --
//    not necessarily the shape the client actually meant to send.
//
// 2. USELESS ERROR MESSAGES: if a payload satisfies NEITHER schema, all
//    you can report is "didn't match CreditCard AND didn't match
//    BankTransfer" -- you have no idea which one the client was TRYING
//    to send, so you can't tell them exactly what's missing from it.
//
// Reading the discriminator field first sidesteps both: the client's
// own "type": "credit_card" value tells you UNAMBIGUOUSLY which single
// schema to validate against, so validation failures can report exactly
// what's wrong with THAT specific shape (as the codeTab's own "Invalid
// CreditCard payload" error does) instead of a vague "didn't match
// anything" for the whole oneOf list.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '<code>discriminator</code> is a validation keyword — it’s what actually enforces that a payload conforms to one of the <code>oneOf</code> schemas.',
    reality: 'The VALIDATION still comes entirely from the individual schemas inside <code>oneOf</code> — <code>discriminator</code> is purely a ROUTING hint that tells a parser (or a hand-written function like the one above) which single schema to check a payload against, instead of trying every schema in the list. Removing <code>discriminator</code> from the spec wouldn’t change what’s VALID, only how efficiently and unambiguously a consumer can figure out which schema applies.',
  },
  {
    thought: 'Since OpenAPI is just documentation, a discriminator field only matters for generating clearer docs — it has no bearing on how real client/server code should be written.',
    reality: 'The discriminator field is a real field the CLIENT sends in the actual request/response body (<code>"type": "credit_card"</code> in this subtopic’s example) — it’s not a documentation-only annotation. Real server code has to read that field to know which schema to validate against, exactly as the <code>parsePaymentMethod()</code> function above does.',
  },
  {
    thought: 'An unrecognized discriminator value should be handled the same way as any other validation failure — just report "invalid payload" and move on.',
    reality: 'An unrecognized discriminator value is a meaningfully DIFFERENT situation from an otherwise-valid-shape payload with a bad field — it usually means the client is sending an entirely new payment method type the API doesn’t know about yet (a client running ahead of the server’s deployed spec, or a genuine bug sending garbage). Reporting it distinctly, as the codeTab’s own <code>default</code> case does, makes that difference visible instead of collapsing it into a generic validation error.',
  },
];

@Component({
  selector: 'app-api-openapi-discriminator',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './discriminator-based-oneof-actually-parsed.html',
  styleUrl: './discriminator-based-oneof-actually-parsed.scss',
})
export class DiscriminatorBasedOneofActuallyParsedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
