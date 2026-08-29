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
    heading: 'The Same Three Threats, a Different Lens',
    points: [
      'The QnA explains PASTA\'s seven stages in detail and contrasts it with STRIDE: "PASTA is better for business-aligned risk assessment... STRIDE produces a technically-oriented threat list; PASTA produces a business-centric risk register." That is a precise distinction, but the main page never applies it to an actual example.',
      'This subtopic reuses the exact three threats (T1, T2, T3) and their DREAD scores from the main page\'s own "STRIDE Analysis" codeTab, then applies PASTA\'s Stage 7 ("Risk and Impact Analysis") — asking what a pure technical score misses once real business context is added.',
    ],
  },
  {
    heading: 'What Raw DREAD Doesn\'t Know About',
    points: [
      'DREAD scores a threat purely on its OWN technical dimensions — Damage, Reproducibility, Exploitability, Affected users, Discoverability. It has no field for anything OUTSIDE the technical incident itself: which regulator would care, what a breach disclosure costs in fines, or which threat a customer contract explicitly calls out.',
      'PASTA\'s business-alignment stages are exactly the layer that adds this in: the same DREAD-ranked list gets a SECOND pass asking "does this threat carry consequences a purely technical score can\'t see?" — and, as the worked example below shows, that second pass can genuinely change which threat should be fixed first.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Stage 1–6: Raw DREAD Ranking (from the main page)',
    language: 'typescript',
    code: `// Exactly the main page's own three threats and DREAD scores.
const threats = [
  {
    id: 'T1', category: 'Spoofing',
    description: 'Attacker uses stolen JWT to impersonate a legitimate user',
    dread: { damage: 8, reproducibility: 7, exploitability: 6, affected: 1, discovery: 5 },
  },
  {
    id: 'T2', category: 'Tampering',
    description: 'Attacker intercepts and modifies payment amount in transit',
    dread: { damage: 10, reproducibility: 3, exploitability: 5, affected: 3, discovery: 4 },
  },
  {
    id: 'T3', category: 'Elevation of Privilege',
    description: 'Regular user calls /admin/refund endpoint',
    dread: { damage: 9, reproducibility: 9, exploitability: 8, affected: 5, discovery: 8 },
  },
];

const score = (t: typeof threats[0]) => {
  const d = t.dread;
  return (d.damage + d.reproducibility + d.exploitability + d.affected + d.discovery) / 5;
};

threats
  .slice()
  .sort((a, b) => score(b) - score(a))
  .forEach(t => console.log(\`\${t.id}: \${score(t).toFixed(1)}\`));
// T3: 7.8  <- ranked highest by raw DREAD
// T1: 5.4
// T2: 5.0  <- ranked lowest by raw DREAD`,
  },
  {
    label: 'Stage 7: PASTA Business-Context Re-Weighting',
    language: 'typescript',
    code: `// PASTA Stage 7 asks: does this threat carry a business consequence
// the raw technical DREAD score has no field for at all? Each of these
// factors is a fact about the BUSINESS, not the vulnerability itself.
const businessContext: Record<string, { factor: string; multiplier: number }[]> = {
  T1: [],  // stolen-JWT impersonation has no special regulatory angle beyond the incident itself
  T2: [
    // Payment amount tampering falls directly under PCI-DSS's core
    // integrity requirement for cardholder transaction data -- a
    // successful exploit isn't just "one bad transaction," it is a
    // reportable compliance failure with contractual penalties.
    { factor: 'PCI-DSS transaction-integrity violation -- mandatory disclosure + processor fines', multiplier: 1.8 },
  ],
  T3: [],  // no threat-specific regulatory angle beyond the incident itself
};

function pastaScore(t: { id: string; dread: any }, rawScore: number): number {
  const factors = businessContext[t.id] ?? [];
  const combinedMultiplier = factors.reduce((acc, f) => acc * f.multiplier, 1);
  return rawScore * combinedMultiplier;
}

const rescored = threats.map(t => ({ id: t.id, pasta: pastaScore(t, score(t)) }));
rescored
  .sort((a, b) => b.pasta - a.pasta)
  .forEach(t => console.log(\`\${t.id}: \${t.pasta.toFixed(1)}\`));
// T2: 9.0   <- 5.0 x 1.8 -- now ranked HIGHEST once the compliance
//               consequence is weighed in, despite having the LOWEST
//               raw DREAD score of the three
// T3: 7.8   <- unchanged, no business multiplier applies
// T1: 5.4   <- unchanged, no business multiplier applies

// The technical severity of T2 never changed -- what changed is that
// PASTA's business-alignment stage asked a question DREAD's five
// dimensions have no field for at all, and that question flipped
// which threat should be fixed FIRST.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Suppose a fourth threat, "T4: An internal analytics dashboard leaks anonymised, aggregate transaction COUNTS (not individual card data) to any authenticated employee, regardless of role" scores a raw DREAD average of 6.0. Would this threat likely receive a PASTA business-context multiplier similar to T2\'s, and why or why not?',
  hint: 'PCI-DSS\'s integrity/confidentiality requirements are specifically about CARDHOLDER DATA — check whether "anonymised, aggregate counts" is the kind of data those requirements actually cover.',
  solution: `// T4 would most likely NOT receive a business-context multiplier
// anywhere close to T2's -- and probably none at all.

// PCI-DSS's core requirements are scoped to CARDHOLDER DATA
// specifically (card numbers, expiry, CVV, and the systems that
// process/store/transmit them) -- not to every number a payment
// company happens to compute. "Anonymised, aggregate transaction
// counts" is exactly the kind of data PCI-DSS scoping deliberately
// excludes: it cannot be tied back to an individual cardholder or
// transaction, so a leak of it (while still a real, worth-fixing
// access-control gap) does not carry the mandatory-disclosure,
// processor-fine consequence that T2's raw cardholder-data tampering
// does.

// The general lesson: a PASTA-style business multiplier isn't
// "any threat involving payment systems automatically scores higher"
// -- it specifically checks whether THIS threat's data or impact
// falls inside a regulation's or contract's actual defined scope.
// T2 (payment AMOUNT tampering) sits squarely inside PCI-DSS scope;
// T4 (anonymised, aggregate counts) does not, even though both
// threats live in the same broader "payment system."`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'PASTA replaces DREAD scoring — you pick one methodology or the other for a given threat model.',
    reality: 'The worked example above shows the opposite: PASTA\'s Stage 7 business-context multiplier is applied ON TOP OF the raw DREAD scores, not instead of them — the main page\'s own QnA already states "many teams use STRIDE for technical threat identification and then apply PASTA-style risk prioritization," which is exactly the two-pass structure shown here: DREAD produces the raw technical ranking first, then a business-alignment pass re-weighs it.',
  },
  {
    thought: 'A threat with a high business multiplier is automatically more technically severe, or vice versa.',
    reality: 'T2 in the worked example has the LOWEST raw DREAD score of the three threats (5.0) — it is not the most technically dangerous threat on the list. What makes it PASTA\'s top priority is entirely a fact about the business (a specific compliance framework\'s scope), completely independent of its technical severity. A low-DREAD, high-business-consequence threat and a high-DREAD, no-business-consequence threat are both real risks — PASTA\'s contribution is surfacing the FIRST kind, which a technical-only scoring pass has no way to see.',
  },
];

@Component({
  selector: 'app-sec-tm-pasta',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-pasta-style-business-risk-reprioritization.html',
  styleUrl: './a-pasta-style-business-risk-reprioritization.scss',
})
export class APastaStyleBusinessRiskReprioritizationSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
