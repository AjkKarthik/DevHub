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
  templateUrl: './tolerant-reader-pattern-for-contracts.html',
  styleUrl: './tolerant-reader-pattern-for-contracts.scss'
})
export class TolerantReaderPatternForContractsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The page\'s fix names a strategy ("additive-only changes") without naming the pattern that makes it actually work',
      points: [
        'The page\'s "Versioning service contracts too frequently" mistake block recommends: use additive-only changes (new optional fields) until a breaking change is unavoidable. That advice describes what the PRODUCER of a contract should do — but it quietly assumes the CONSUMER side cooperates too, and the page never names the consumer-side half of the deal.',
        'The underlying idea traces back to Jon Postel\'s "Robustness Principle" from early internet protocol design (RFC 761, 1980): "be conservative in what you send, be liberal in what you accept." Martin Fowler later named the API-consumer application of this the Tolerant Reader pattern.',
        'A Tolerant Reader only extracts the specific fields it actually needs from a response, and ignores everything else — including fields it has never seen before. That single design choice is what actually makes additive-only producer changes non-breaking in practice.',
      ]
    },
    {
      heading: 'Why "additive-only" alone doesn\'t guarantee a non-breaking change',
      points: [
        'A producer can follow the additive-only rule perfectly — adding a brand-new optional field, changing nothing existing — and still break a consumer if that consumer is built to reject anything it doesn\'t explicitly recognize (a strict schema validator with "no unknown fields allowed," or a SOAP client bound tightly to an exact WSDL-generated type).',
        'This is exactly the trap classic SOA/SOAP tooling fell into in practice: WSDL-generated client stubs were often bound to the EXACT shape of a contract, so even a purely additive server-side change could fail deserialization on the client, undermining the "stable, reusable contracts" benefit SOA was supposed to deliver.',
        'Safe contract evolution needs BOTH halves working together: the producer commits to additive-only changes, AND the consumer is written as a tolerant reader that extracts only what it needs and doesn\'t choke on the unexpected. Either half alone is incomplete.',
      ]
    },
    {
      heading: 'What a tolerant reader looks like in practice, applied to this page\'s own scenario',
      points: [
        'For this page\'s own legacy-ERP integration example: a tolerant REST adapter reads only the specific SOAP-response fields it needs (order ID, customer number, amount, status code) and simply ignores any additional field the legacy system might one day add to its response — rather than validating the entire response shape strictly.',
        'This complements, rather than replaces, the page\'s Canonical Data Model pattern: the Canonical Data Model defines the shared TARGET schema services transform to/from, while Tolerant Reader is about HOW the transformation code on the receiving end should be written — permissively, extracting only what it needs, not validating everything it receives.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tolerant reader vs. a brittle strict-schema consumer',
      language: 'typescript',
      code: `interface SoapOrderResponse {
  ORDER_ID: string;
  CUST_NO: string;
  AMT: number;
  STAT_CD: string;
}

// BRITTLE -- fails the moment the legacy system adds ANY new field,
// even though nothing this consumer actually needs has changed.
function parseStrict(raw: unknown): SoapOrderResponse {
  const knownKeys = ['ORDER_ID', 'CUST_NO', 'AMT', 'STAT_CD'];
  const actualKeys = Object.keys(raw as object);
  const hasUnknownField = actualKeys.some(k => !knownKeys.includes(k));
  if (hasUnknownField) {
    throw new Error('Unexpected field in SOAP response -- rejecting.');
  }
  return raw as SoapOrderResponse;
}

// TOLERANT READER -- extracts only the four fields it needs and ignores
// everything else. A new field added by the legacy system (WAREHOUSE_ID,
// PROMO_CODE, whatever) simply passes through unread. No consumer-side
// change required when the producer makes an additive-only change.
function parseTolerant(raw: any): SoapOrderResponse {
  return {
    ORDER_ID: raw.ORDER_ID,
    CUST_NO: raw.CUST_NO,
    AMT: raw.AMT,
    STAT_CD: raw.STAT_CD,
  };
}

// The producer's "additive-only changes" promise (from this page's own
// mistakes section) is only actually non-breaking for consumers written
// the second way.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A producer team adds a new optional field, discountCode, to their order API response — a textbook additive-only change per this page\'s own advice. A downstream consumer, written with a JSON Schema validator configured additionalProperties: false, starts failing immediately after the deploy. Whose change actually broke the integration?',
    hint: 'The producer followed the additive-only rule. What does additionalProperties: false do to any field the schema doesn\'t already list?',
    solution: 'Both sides played a role, but the immediate cause is the consumer\'s own strict validator, not the producer\'s change. additionalProperties: false tells the validator to reject any object containing a field not explicitly listed in the schema -- which means the consumer was never actually built as a tolerant reader, regardless of how carefully the producer followed the additive-only rule. The producer\'s change was correct by this page\'s own guidance; the fix is on the consumer side -- either relax the schema to allow unknown properties, or (better, per the Tolerant Reader pattern) parse only the specific fields the consumer actually needs instead of strictly validating the entire response shape.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a contract producer commits to additive-only changes, that alone guarantees existing consumers won\'t break.',
      reality: 'Per this subtopic\'s theory, additive-only changes are only non-breaking if consumers are ALSO built as tolerant readers — a strict, schema-validating consumer (a common pattern in classic SOAP/WSDL tooling) can still break on a purely additive change.'
    },
    {
      thought: 'The Tolerant Reader pattern is an old SOAP/XML-era concept with no relevance to modern REST/JSON integrations.',
      reality: 'Per this subtopic\'s theory, the same failure mode shows up with modern tooling too — a JSON Schema validator configured with additionalProperties: false enforces exactly the same brittleness that broke SOAP clients, just with different syntax.'
    },
    {
      thought: 'The Canonical Data Model pattern and the Tolerant Reader pattern solve the same problem, so a page covering one has effectively covered the other.',
      reality: 'Per this subtopic\'s theory, they solve complementary but distinct problems — the Canonical Data Model defines the shared TARGET schema services transform to and from, while Tolerant Reader is about how consumer-side parsing code should be written to survive additive changes to what it receives.'
    }
  ];
}
