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

const quickRef: QuickRefItem[] = [
  { name: 'STRIDE',        type: 'keyword', desc: 'Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation of Privilege — threat categories.' },
  { name: 'DFD',           type: 'keyword', desc: 'Data Flow Diagram — maps trust boundaries, data stores, processes, and external entities.' },
  { name: 'Trust Boundary', type: 'keyword', desc: 'Line in a DFD where data changes trust level — e.g. internet → DMZ, DMZ → internal network.' },
  { name: 'DREAD',         type: 'keyword', desc: 'Damage, Reproducibility, Exploitability, Affected users, Discoverability — risk scoring model.' },
  { name: 'Attack Tree',   type: 'keyword', desc: 'Tree structure where root = attacker goal, branches = ways to achieve it.' },
  { name: 'Mitigations',   type: 'keyword', desc: 'Controls that reduce threat likelihood or impact — authentication, encryption, rate limiting.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Why Threat Model?',
    points: [
      'Threat modelling finds security flaws at design time — the cheapest point to fix them (vs. post-deployment).',
      'A threat model answers four questions: What are we building? What can go wrong? What do we do about it? Did we do a good enough job?',
      'Without threat modelling, teams fix vulnerabilities reactively after penetration tests or incidents — expensive and demoralising.',
      'Even a 30-minute whiteboard session with STRIDE before sprint planning catches architectural flaws that code review will miss.',
    ],
  },
  {
    heading: 'Data Flow Diagrams (DFD)',
    points: [
      'DFDs map how data moves through a system: external entities (users, third parties), processes (your code), data stores (databases), and data flows (arrows).',
      'Trust boundaries are the key element — draw a dashed line where data crosses from one trust level to another.',
      'Every data flow that crosses a trust boundary is a potential attack surface that must be protected.',
      'Tools: OWASP Threat Dragon (free, open-source), Microsoft Threat Modeling Tool (free), Miro/draw.io for quick sessions.',
    ],
  },
  {
    heading: 'STRIDE Threat Categories',
    points: [
      'Spoofing — pretending to be someone else (phishing, IP spoofing). Mitigation: authentication.',
      'Tampering — modifying data in transit or at rest. Mitigation: integrity checks (HMAC, digital signatures, checksums).',
      'Repudiation — denying an action was performed. Mitigation: audit logging with tamper-evident storage.',
      'Information Disclosure — exposing data to unauthorised parties. Mitigation: encryption, access controls, least privilege.',
      'Denial of Service — making a system unavailable. Mitigation: rate limiting, redundancy, auto-scaling, DDoS protection.',
      'Elevation of Privilege — gaining higher access than intended. Mitigation: authorisation checks, least privilege, sandbox.',
    ],
  },
  {
    heading: 'DREAD Risk Scoring',
    points: [
      'DREAD assigns 1–10 scores to each threat to prioritise which to fix first.',
      'Damage: how bad is the worst-case outcome? (1 = minimal, 10 = catastrophic, all user data exposed).',
      'Reproducibility: how easily can the attack be repeated? Exploitability: how much skill is required?',
      'Affected Users: what percentage of users are impacted? Discoverability: how easy is it to find the vulnerability?',
      'Total score = sum/average of five dimensions; highest scores get fixed first.',
    ],
  },
  {
    heading: 'Practical Threat Modelling Process',
    points: [
      'Step 1: Decompose the application — draw the DFD with all processes, data stores, flows, and external entities.',
      'Step 2: Identify threats — apply STRIDE to each element and each data flow crossing a trust boundary.',
      'Step 3: Rate threats using DREAD or similar scoring.',
      'Step 4: Define mitigations — for each threat, pick a control (authentication, encryption, validation, rate limiting).',
      'Step 5: Validate — verify mitigations are implemented during code review and security testing.',
      'Update the threat model when architecture changes significantly — it is a living document.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'STRIDE Analysis',
    language: 'typescript',
    code: `// Example threat model for a payment API
// System: User → [HTTPS] → Payment API → [Internal] → Database
//                                       → [HTTPS] → Payment Gateway

const threatModel = {
  system: 'Payment Processing API',
  trustBoundaries: [
    'Internet ↔ API gateway',
    'API ↔ Database (internal network)',
    'API ↔ Payment gateway (external HTTPS)',
  ],
  threats: [
    // Per STRIDE on the "User → API" trust boundary crossing
    {
      id: 'T1',
      category: 'Spoofing',
      description: 'Attacker uses stolen JWT to impersonate a legitimate user',
      dread: { damage: 8, reproducibility: 7, exploitability: 6, affected: 1, discovery: 5 },
      mitigation: 'Short JWT expiry (15 min) + refresh token rotation + device fingerprint',
    },
    {
      id: 'T2',
      category: 'Tampering',
      description: 'Attacker intercepts and modifies payment amount in transit',
      dread: { damage: 10, reproducibility: 3, exploitability: 5, affected: 3, discovery: 4 },
      mitigation: 'TLS 1.3 for all transit; server-side price calculation — never trust client-supplied amounts',
    },
    {
      id: 'T3',
      category: 'Elevation of Privilege',
      description: 'Regular user calls /admin/refund endpoint',
      dread: { damage: 9, reproducibility: 9, exploitability: 8, affected: 5, discovery: 8 },
      mitigation: 'Role-based authorisation check on every endpoint; default-deny',
    },
  ],
};

// Calculate DREAD score
const score = (t: typeof threatModel.threats[0]) => {
  const d = t.dread;
  return (d.damage + d.reproducibility + d.exploitability + d.affected + d.discovery) / 5;
};

threatModel.threats
  .sort((a, b) => score(b) - score(a))
  .forEach(t => console.log(\`\${t.id} [\${t.category}]: \${score(t).toFixed(1)} — \${t.mitigation}\`));`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Doing threat modelling once and never updating it',
    wrong: `// Threat model done at project start, never revisited
// Team adds a new external API integration → no analysis done`,
    right: `// Update threat model when: new external integrations, auth changes, new data flows
// Add threat modelling to architecture review checklist`,
    explanation: 'Threat models go stale as systems evolve. Every significant architectural change — new service, external integration, auth mechanism — should trigger a threat model update. Treat it as a living document.',
  },
  {
    title: 'Modelling threats without defining mitigations',
    wrong: `// STRIDE analysis completed — 15 threats identified
// No mitigations assigned, no backlog items created`,
    right: `// Each threat has an assigned mitigation and a backlog item with priority
// High DREAD score threats block release`,
    explanation: 'Identifying threats without acting on them provides false comfort. Every identified threat must have an owner, a mitigation strategy, and a ticket. High-severity unmitigated threats should block deployment.',
  },
  {
    title: 'Only modelling external threats, ignoring insider threats',
    wrong: `// Trust boundary = internet/DMZ only
// Internal services trust each other implicitly`,
    right: `// Draw trust boundaries between internal services too
// mTLS between microservices; least-privilege service accounts`,
    explanation: 'Insider threats and compromised internal services are real. Lateral movement in breaches exploits implicit trust between internal systems. Apply zero trust — verify every internal call, not just external ones.',
  },
  {
    title: 'Skipping threat modelling because "we do pentesting"',
    wrong: `// We get pentested every quarter — that covers security`,
    right: `// Pentesting finds implementation bugs; threat modelling finds design flaws
// Both are necessary — design flaws survive code rewrites`,
    explanation: 'Penetration testing finds implementation bugs. Threat modelling finds architectural design flaws — flaws that survive code rewrites because they are baked into the system design. Both are complementary, not substitutes.',
  },
];

const challenge: Challenge = {
  title: 'STRIDE Classifier',
  language: 'typescript',
  description: `Implement classifyThreat(description: string): string that returns the STRIDE category.
- Contains 'impersonate' or 'pretend' or 'forge' → 'Spoofing'
- Contains 'modify' or 'tamper' or 'alter' → 'Tampering'
- Contains 'deny' or 'repudiate' → 'Repudiation'
- Contains 'expose' or 'leak' or 'disclose' → 'Information Disclosure'
- Contains 'unavailable' or 'crash' or 'flood' → 'Denial of Service'
- Contains 'escalate' or 'privilege' or 'admin' → 'Elevation of Privilege'
- Otherwise → 'Unknown'`,
  hints: [
    'Use toLowerCase() for case-insensitive matching',
    'Check each keyword group with Array.some()',
    'Order matters — check all patterns',
  ],
  starterCode: `function classifyThreat(description: string): string {
  const d = description.toLowerCase();
  // TODO: return the STRIDE category
  return 'Unknown';
}`,
  solution: `function classifyThreat(description: string): string {
  const d = description.toLowerCase();
  if (['impersonate', 'pretend', 'forge'].some(k => d.includes(k))) return 'Spoofing';
  if (['modify', 'tamper', 'alter'].some(k => d.includes(k)))       return 'Tampering';
  if (['deny', 'repudiate'].some(k => d.includes(k)))               return 'Repudiation';
  if (['expose', 'leak', 'disclose'].some(k => d.includes(k)))      return 'Information Disclosure';
  if (['unavailable', 'crash', 'flood'].some(k => d.includes(k)))   return 'Denial of Service';
  if (['escalate', 'privilege', 'admin'].some(k => d.includes(k)))  return 'Elevation of Privilege';
  return 'Unknown';
}

console.log(classifyThreat('Attacker forges JWT to impersonate admin'));  // Spoofing
console.log(classifyThreat('Flood API with requests to make it crash'));  // Denial of Service
console.log(classifyThreat('Escalate from user to admin role'));          // Elevation of Privilege`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'An attacker floods an API with millions of requests causing it to become unreachable. Which STRIDE category is this?',
    options: ['Spoofing', 'Tampering', 'Denial of Service', 'Elevation of Privilege'],
    answer: 2,
    explanation: 'Denial of Service (the D in STRIDE) means making a service unavailable. Mitigations include rate limiting, auto-scaling, DDoS protection services (Cloudflare, AWS Shield), and circuit breakers.',
  },
  {
    q: 'What is a trust boundary in a Data Flow Diagram?',
    options: [
      'A firewall rule between two network segments',
      'A line where data crosses between two different trust levels, creating a potential attack surface',
      'A TLS certificate that verifies the identity of a server',
      'The boundary of a database transaction',
    ],
    answer: 1,
    explanation: 'A trust boundary is a dashed line in a DFD where data moves from one trust level to another — e.g. internet to API, API to database, or between two microservices with different privileges. Every crossing is a potential attack point that requires a security control.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What four questions does threat modelling answer?',
    a: '<ol><li><strong>What are we building?</strong> — draw the DFD, map components and data flows</li><li><strong>What can go wrong?</strong> — apply STRIDE to identify threats</li><li><strong>What do we do about it?</strong> — define and prioritise mitigations</li><li><strong>Did we do a good enough job?</strong> — validate mitigations are implemented and effective</li></ol>',
  },
  {
    q: 'When should threat modelling happen in the development lifecycle?',
    a: 'Ideally at design time — before any code is written. This is when fixing flaws is cheapest (a design change takes minutes; a deployed refactor takes weeks). In practice: during sprint 0 or architecture review for new features. Also revisit when: adding external integrations, changing authentication, introducing new data stores, or significantly changing data flows. Brief sessions (30–60 min) are better than exhaustive one-time workshops.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Threat modelling is a structured process — DFD + STRIDE + DREAD — to identify and mitigate security risks at design time before code is written.',
  mustKnow: [
    'STRIDE: Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation of Privilege',
    'DFD: external entities, processes, data stores, data flows, trust boundaries',
    'Trust boundary: every crossing is a potential attack surface that needs a control',
    'DREAD: 5-dimension risk scoring — Damage, Reproducibility, Exploitability, Affected, Discoverability',
    'Threat modelling is done at design time — cheapest point to fix architectural flaws',
    'Update the threat model when architecture changes — it is a living document',
  ],
  interviewFocus: [
    'Name the six STRIDE threat categories and a mitigation for each',
    'What is the purpose of a trust boundary in a DFD?',
    'How is threat modelling different from penetration testing?',
  ],
};

@Component({
  selector: 'app-sec-threat-modelling',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './threat-modelling.html',
  styleUrl: './threat-modelling.scss',
})
export class SecThreatModelling {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
