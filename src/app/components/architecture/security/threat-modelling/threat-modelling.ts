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
  { q: 'What are the four key questions that threat modelling attempts to answer?', options: ['Who are the users? What do they want? How do they interact? What can go wrong?', 'What are we building? What can go wrong? What should we do about it? Did we do a good enough job?', 'What assets exist? What threats apply? What controls exist? What is the residual risk?', 'Who are the attackers? What are their motivations? What tools do they use? How do we stop them?'], answer: 1, explanation: 'The four questions (Shostack): What are we building? — create a diagram of the system (DFD, architecture diagram) showing components, data flows, and trust boundaries. What can go wrong? — identify threats for each element (use STRIDE or attack trees). What should we do about it? — for each threat, determine a mitigation (accept, transfer, mitigate, eliminate) and assign owners. Did we do a good enough job? — verify mitigations are implemented, test the model against the actual system, repeat when the system changes. This structured approach prevents ad-hoc security thinking and ensures coverage.' },
  { q: 'What is a Data Flow Diagram (DFD) in threat modelling and what elements does it contain?', options: ['A database schema showing how data fields flow between tables', 'A diagram showing how data moves through a system with external entities, processes, data stores, and data flows across trust boundaries', 'A network topology diagram showing firewall and router placement', 'A UML sequence diagram for security-relevant user interactions'], answer: 1, explanation: 'DFD in threat modelling (Level 0/Level 1): External entities (rectangles): things outside the system boundary that interact with it (users, external services, third-party APIs). Processes (circles/ovals): transform or act on data (the application server, a microservice). Data stores (parallel lines): places where data is stored at rest (database, cache, file system, browser localStorage). Data flows (arrows): data moving between elements (API request, database query, response). Trust boundaries (dashed lines): lines across which data crosses between different trust zones (internet to DMZ, user to backend, internal to external API). STRIDE threat identification: for each element type, consider relevant STRIDE categories. Processes have all six STRIDE categories. Data stores face Tampering, Repudiation, Information Disclosure.' },
  { q: 'What is an attack tree and how does it differ from STRIDE?', options: ['An attack tree is a graphical STRIDE implementation for visual threat identification', 'An attack tree models attacks as a tree structure with the attack goal as root and attack steps as branches, showing how attackers could achieve the goal; STRIDE categorizes threats by type against system components', 'An attack tree is used for incident response; STRIDE is used for threat identification', 'STRIDE produces attack trees; an attack tree is the output of a STRIDE analysis'], answer: 1, explanation: 'Attack tree: a goal-oriented threat model. Root: the attack goal (e.g., steal customer credit card data). Branches: ways to achieve the goal (compromise web server, compromise database directly, insider threat, supply chain). Sub-branches: steps to achieve each branch goal. AND/OR nodes: some branches require all sub-steps (AND); some require any one sub-step (OR). Quantifiable: attach probability, cost, or difficulty estimates to leaves. Used for targeted analysis: when you want to understand a specific attack scenario in depth. STRIDE: a component-oriented model. For each system component, enumerate which STRIDE categories apply. Better for comprehensive coverage of a system than for modeling a specific attack path. Use both: STRIDE for coverage, attack trees for deep analysis of high-priority threats.' },
  { q: 'When in the development lifecycle should threat modelling be performed and how often should it be updated?', options: ['Only at the start of a project, as a one-time activity before development begins', 'During design phase initially; updated when the architecture changes, new features are added, new attack techniques emerge, or after a security incident', 'Only after a security incident to understand what could have been done differently', 'During penetration testing, using the pen test findings to reverse-engineer the threat model'], answer: 1, explanation: 'Threat modelling timing: design phase: catch security issues before code is written (lowest cost to fix). New features: any significant new component, data flow, or trust boundary change requires a threat model update. Significant architecture changes: moving from monolith to microservices, adding a new external API integration, changing authentication systems. Post-incident: update the threat model to include the attack path used. Periodically: annually or when the threat landscape significantly changes. Agile integration: threat modelling as a recurring activity per sprint or per epic, not a one-time gate. Lightweight approaches: rapid threat model (15-30 minutes per feature) using STRIDE on a whiteboard. More thorough models for high-risk features (payment, authentication). The threat model is a living document, not a one-time artifact.' },
];

const qna: QnaItem[] = [
  {
    q: 'Why is "Did we do a good enough job?" (the fourth threat modelling question) often the one teams skip, and what happens when they do?',
    a: 'The first three questions (what are we building, what can go wrong, what do we do about it) produce a concrete artifact — a diagram, a threat list, a mitigation plan — that feels like "finishing" the exercise, so teams often stop there under time pressure. Skipping validation means mitigations documented on paper may never actually get implemented, or get implemented incorrectly (a planned rate limit that was never actually wired up, an auth check that has a logic bug), and nobody catches the gap because no one circled back to verify the mitigation works as designed. Without this closing step, threat modelling becomes a paperwork exercise that produces a nice-looking document with no guarantee the identified risks were ever actually closed.',
  },
  {
    q: 'What is a practical sign that a team is threat modelling too INFREQUENTLY, even if they did a thorough session at project kickoff?',
    a: 'If the system has since added new external integrations, changed its authentication mechanism, introduced new data stores, or meaningfully altered its data flows since the last threat model — and none of those changes triggered a fresh (even brief) threat modelling pass — the original model is now stale and may be actively misleading, since it no longer reflects the actual attack surface. A one-time threat model at kickoff, never revisited, is a common anti-pattern: threat modelling needs to be triggered by significant architectural change, not treated as a single checkbox exercise completed once and considered permanently valid.',
  },
  { q: 'How do you prioritize threats from a threat model?', a: 'Threat prioritization approaches: DREAD scoring (Microsoft, now deprecated): Damage potential, Reproducibility, Exploitability, Affected users, Discoverability. Each scored 1-10. Sum gives relative priority. CVSS (Common Vulnerability Scoring System): standardized severity scoring. Used for known CVEs. Attack tree probability: assign likelihood and impact scores to attack paths. Risk = likelihood x impact. Qualitative risk matrix: categorize threats as low/medium/high/critical based on likelihood and impact. Practical factors for prioritization: exploitability (is there a public exploit or does it require physical access?). Attractiveness to attackers (does exploiting this give access to valuable data or systems?). Existing mitigations (is there already a compensating control?). Cost to fix (a 1-hour code change vs a 3-month architectural change). Regulatory impact (a vulnerability that causes regulatory violation moves to the top). Focus on high-impact, exploitable, low-cost-to-fix threats first.' },
  { q: 'What are trust boundaries and why are they critical in threat modelling?', a: 'Trust boundary: a line in the system where the trust level changes. Data crossing a trust boundary must be validated, authenticated, or authorized. Examples: internet to DMZ (user input enters the internal network). External API to application server. Application server to database. Microservice A to microservice B (even if both internal). User session to server-side code. Why critical: most security vulnerabilities occur at trust boundaries. SQL injection: user input (untrusted) flows to a database query without validation. SSRF: user input (untrusted) controls a URL the server fetches. Privilege escalation: a request crosses from unprivileged to privileged context. Identifying trust boundaries: draw the system diagram. For every data flow, ask: does the data cross from a less-trusted to a more-trusted zone? Every such crossing is a trust boundary requiring explicit security controls.' },
  { q: 'What is PASTA (Process for Attack Simulation and Threat Analysis) and when is it used over STRIDE?', a: 'PASTA: a risk-centric threat modelling methodology with seven stages: define objectives (business and security objectives). Define technical scope (system components, data flows). Application decomposition (DFD, identify assets and existing controls). Threat analysis (identify relevant threats based on attacker profiles). Vulnerability and weakness analysis (identify vulnerabilities in each component). Attack modelling (model attack paths using attack trees). Risk and impact analysis (prioritize risks by business impact, calculate residual risk). When to use over STRIDE: PASTA is better for business-aligned risk assessment, where business stakeholders need to understand the cost/benefit of security investments. STRIDE is better for technical teams to systematically cover all threat categories per component. PASTA produces a business-centric risk register. STRIDE produces a technically-oriented threat list. In practice, many teams use STRIDE for technical threat identification and then apply PASTA-style risk prioritization.' },
  { q: 'What is the role of threat intelligence in threat modelling?', a: 'Threat intelligence: information about current and emerging threats, attacker techniques, and known vulnerabilities, used to inform and improve threat models. Sources: MITRE ATT&CK framework: a knowledge base of attacker tactics, techniques, and procedures (TTPs). Map your system components to relevant ATT&CK techniques. CVE databases and security advisories: known vulnerabilities in components you use. Industry threat intelligence feeds: sector-specific attack trends (finance, healthcare). Government advisories (CISA KEV catalog, UK NCSC). Vendor security bulletins. Application: use threat intelligence to identify which threats are currently actively exploited. Update threat models when new TTPs are discovered that apply to your system. ATT&CK for threat prioritization: if a TTP is actively used by threat actors targeting your industry, elevate the priority of threats that use that TTP. Threat intelligence moves threat modelling from a static exercise to a continuous process.' },
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
