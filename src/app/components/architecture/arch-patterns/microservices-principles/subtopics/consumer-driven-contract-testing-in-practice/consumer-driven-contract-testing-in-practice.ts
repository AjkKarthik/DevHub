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
  templateUrl: './consumer-driven-contract-testing-in-practice.html',
  styleUrl: './consumer-driven-contract-testing-in-practice.scss'
})
export class ConsumerDrivenContractTestingInPracticeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The page names the practice but never shows what it actually verifies',
      points: [
        'The page\'s theory states: "Consumer-driven contract testing... is what makes independent deployability safe in practice — without it, teams either deploy cautiously and infrequently... or deploy confidently and occasionally break consumers." That\'s the motivation, but the page never shows what a consumer-driven contract test actually checks or when it runs.',
        'The core idea: instead of the PROVIDER guessing what shape of response consumers need, each CONSUMER records a "contract" — the exact fields and shapes it actually reads from the provider\'s API. The provider\'s CI pipeline then replays every known consumer\'s contract against the provider\'s real implementation before every deploy.',
        'This flips the usual direction of API testing. A normal integration test asks "does my API work?" A consumer-driven contract test asks "does my API still satisfy every consumer that depends on it, specifically?" — a subtly different and more useful question when the goal is safe independent deployment.',
      ]
    },
    {
      heading: 'Where this connects to the Tolerant Reader idea from the Service-Oriented Architecture topic',
      points: [
        'This page\'s own "no service versioning strategy" mistake block recommends additive-only API changes. The Service-Oriented Architecture topic\'s own Tolerant Reader subtopic explains why additive-only changes only stay non-breaking if consumers are ALSO written permissively (extracting only the fields they need).',
        'Consumer-driven contract testing is the automated, CI-enforced version of that same discipline: instead of just hoping every consumer is a tolerant reader, the provider\'s pipeline actually VERIFIES each consumer\'s real, current expectations before every deploy — turning a design principle (be a tolerant reader) into an automated, provably-enforced gate.',
        'A tool like Pact formalizes this: consumer teams publish their contracts to a shared broker; the provider\'s CI fetches every published contract and replays it against the provider\'s actual code before merging, failing the build if any consumer\'s expectations would break.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A consumer-driven contract, conceptually',
      language: 'typescript',
      code: `// CONSUMER SIDE (Order Service, calling Catalog Service) --
// records exactly what it actually reads from the response, nothing more.
interface CatalogContract {
  request: { method: 'GET'; path: '/products/:id' };
  expectedResponse: {
    status: 200;
    // Order Service only reads these two fields -- it does NOT assert
    // anything about fields it doesn't use, which is the whole point:
    // Catalog Service is free to add new fields without breaking this contract.
    body: { productId: string; unitPrice: number };
  };
}

// This contract gets published to a shared broker (e.g. Pact Broker).

// PROVIDER SIDE (Catalog Service's own CI pipeline, before every deploy) --
// fetches every consumer's published contract and replays each one against
// the REAL running implementation, not a mock:
async function verifyAgainstConsumerContracts(contracts: CatalogContract[]) {
  for (const contract of contracts) {
    const actual = await callRealCatalogService(contract.request);
    assertSatisfies(actual, contract.expectedResponse); // fails the build on mismatch
  }
}

// If Catalog Service's team removes 'unitPrice' or renames it, THIS check
// fails in Catalog Service's own CI -- before the bad deploy ever reaches
// Order Service in production. That's the safety net the page's theory
// section refers to without showing.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A provider team wants to remove a field, legacyDiscountCode, from their API response. Their own integration tests all pass (they don\'t check for that field). Should they ship the change?',
    hint: 'Passing the PROVIDER\'s own tests only proves the provider\'s own expectations are met. What does consumer-driven contract testing check that a provider\'s own integration tests don\'t?',
    solution: 'Not safely, without checking consumer contracts first. The provider\'s own integration tests only verify the provider\'s OWN understanding of its API is internally consistent — they say nothing about whether some consumer, written months ago by a different team, still reads legacyDiscountCode. Consumer-driven contract testing exists specifically for this gap: before the change ships, the provider\'s CI replays every published consumer contract against the new implementation. If any consumer\'s contract still expects legacyDiscountCode, that check fails the build -- catching the break before it reaches production, rather than after a consumer team files an incident.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Consumer-driven contract testing and a provider\'s own integration tests check basically the same thing, just from a different angle.',
      reality: 'Per this subtopic\'s theory, they answer genuinely different questions — the provider\'s own tests check "does my API work as I designed it," while consumer-driven contract tests check "does my API still satisfy every consumer that actually depends on it, specifically."'
    },
    {
      thought: 'A consumer-driven contract test is really just a mock-based unit test with an official-sounding name.',
      reality: 'Per this subtopic\'s theory, the defining feature is that the provider\'s CI replays each consumer\'s REAL, currently-published expectations against the PROVIDER\'s real implementation before deploy — it\'s an automated cross-team safety net, not a same-team unit test.'
    },
    {
      thought: 'This page\'s "additive-only changes" advice and the Tolerant Reader pattern (from the SOA topic) and consumer-driven contract testing are three unrelated topics that happen to appear near each other.',
      reality: 'Per this subtopic\'s theory, they are three layers of the SAME discipline: additive-only changes are the producer-side policy, Tolerant Reader is the consumer-side coding practice that makes that policy actually safe, and consumer-driven contract testing is the automated CI check that verifies both sides are actually holding up their end.'
    }
  ];
}
