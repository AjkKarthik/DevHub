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
  { name: 'CAP',         type: 'keyword', desc: 'Consistency, Availability, Partition Tolerance — pick any 2 when a network partition occurs.' },
  { name: 'CP systems',  type: 'keyword', desc: 'HBase, ZooKeeper, etcd, MongoDB (w:majority). Sacrifice availability for consistency during partition.' },
  { name: 'AP systems',  type: 'keyword', desc: 'Cassandra, DynamoDB, CouchDB. Sacrifice consistency for availability. Data eventually consistent.' },
  { name: 'PACELC',      type: 'keyword', desc: 'Extension: even without partition (else), trade Latency vs Consistency. Most real systems are PA/EL or PC/EC.' },
  { name: 'ACID',        type: 'keyword', desc: 'Atomicity, Consistency, Isolation, Durability. Traditional SQL guarantees.' },
  { name: 'BASE',        type: 'keyword', desc: 'Basically Available, Soft state, Eventually consistent. NoSQL philosophy.' },
  { name: 'Linearisable',type: 'keyword', desc: 'Strongest consistency: reads always see latest write. Expensive — requires coordination.' },
  { name: 'Eventual',    type: 'keyword', desc: 'Replicas converge to the same value given no new writes. Lower latency, no coordination needed.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'CAP Theorem',
    points: [
      'Brewer\'s theorem (2000): a distributed system can guarantee at most 2 of 3 properties simultaneously.',
      'Consistency (C): every read returns the most recent write or an error.',
      'Availability (A): every request receives a response (not necessarily latest data).',
      'Partition Tolerance (P): system continues operating even if network partitions split nodes.',
      'In practice, P is non-negotiable — networks always fail eventually. So the real choice is C vs A during a partition.',
    ],
  },
  {
    heading: 'CP Systems',
    points: [
      'When a partition occurs, CP systems refuse requests on the minority partition rather than serve stale data.',
      'Examples: HBase, ZooKeeper, etcd, Spanner, MongoDB with majority write concern.',
      'Use when: financial transactions, distributed locks, configuration stores — where stale data is harmful.',
    ],
  },
  {
    heading: 'AP Systems',
    points: [
      'When a partition occurs, AP systems continue serving requests but may return stale or conflicting data.',
      'Examples: Cassandra, DynamoDB, CouchDB, Riak.',
      'Use when: social feeds, product catalogs, DNS — where slightly stale data is acceptable.',
    ],
  },
  {
    heading: 'PACELC Theorem',
    points: [
      'Extends CAP: even when no partition (E = "else"), systems must choose between Latency (L) and Consistency (C).',
      'PA/EL: available during partition AND low latency otherwise — e.g. DynamoDB, Cassandra.',
      'PC/EC: consistent during partition AND strong consistency otherwise — e.g. VoltDB, HBase.',
      'PA/EC: Cassandra in quorum mode — available during partition but you can opt into consistency.',
    ],
  },
  {
    heading: 'Consistency models (spectrum)',
    points: [
      'Linearisability (strongest): reads see latest write. Think single-node semantics.',
      'Sequential consistency: writes appear in order, but not necessarily immediately.',
      'Causal consistency: causally related operations are seen in order.',
      'Eventual consistency (weakest): all replicas converge eventually. Allows highest throughput.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'CP vs AP Decision',
    language: 'typescript',
    code: `// Decision guide: CP vs AP

interface SystemTradeoff {
  system: string;
  model: 'CP' | 'AP';
  useCase: string;
  exampleDB: string;
}

const guide: SystemTradeoff[] = [
  {
    system: 'Payment ledger',
    model: 'CP',
    useCase: 'Cannot show stale balance — money must not be double-spent',
    exampleDB: 'Spanner, CockroachDB (serialisable isolation)',
  },
  {
    system: 'Shopping cart',
    model: 'AP',
    useCase: 'Prefer availability; merge conflicts on checkout',
    exampleDB: 'DynamoDB (eventual consistency)',
  },
  {
    system: 'Leader election',
    model: 'CP',
    useCase: 'Only one leader must exist at any time',
    exampleDB: 'ZooKeeper, etcd (linearisable writes)',
  },
  {
    system: 'DNS / CDN cache',
    model: 'AP',
    useCase: 'Stale records for minutes is fine; availability matters',
    exampleDB: 'Anycast DNS (TTL-based eventual consistency)',
  },
  {
    system: 'Social feed',
    model: 'AP',
    useCase: 'Missing a post for seconds is acceptable',
    exampleDB: 'Cassandra (tunable consistency)',
  },
];`,
  },
  {
    label: 'Cassandra Tunable Consistency',
    language: 'bash',
    code: `# Cassandra: tune consistency per query (PACELC in action)

# Strong consistency (CP mode): W + R > N
# N=3 replicas → QUORUM = 2
# Read: QUORUM ensures you see the latest write
cqlsh> SELECT * FROM users WHERE id = 123 USING CONSISTENCY QUORUM;

# Eventual consistency (AP mode): W=1, R=1
# Fast, but may return stale data
cqlsh> SELECT * FROM users WHERE id = 123 USING CONSISTENCY ONE;

# Write with 3 replicas, read from 1 → NOT strongly consistent
# W=1 (ANY), R=1 → W + R = 2 ≤ N=3 → reads may miss latest write

# Formula: W + R > N  →  strong consistency guaranteed
# W=QUORUM(2), R=QUORUM(2), N=3: 2+2=4 > 3 ✓`,
  },
  {
    label: 'PACELC Matrix',
    language: 'bash',
    code: `# PACELC classification of popular databases

# PA/EL (Partition tolerant + Available; Else: Low Latency)
#   DynamoDB (default), Cassandra (ONE consistency), CouchDB
#   → Best for: social, e-commerce catalog, IoT telemetry

# PC/EC (Partition tolerant + Consistent; Else: Consistent)
#   HBase, Spanner, VoltDB, etcd, ZooKeeper
#   → Best for: financial, config management, distributed locks

# PA/EC (tunable — available during partition, consistent otherwise)
#   Cassandra with QUORUM, MongoDB with majority
#   → Best for: systems that need both but can tolerate partition sacrifice

# Real-world note:
# Most companies use AP for user-facing services (speed matters)
# and CP for back-office / financial (correctness matters)`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: '"You must sacrifice P" — misunderstanding CAP',
    wrong: `// "We can choose CA — consistent and available, no partition tolerance"`,
    right: `// P is non-negotiable in distributed systems — network partitions always happen.
// The real choice is: C vs A DURING a partition.
// CA only exists in single-node systems (not distributed).`,
    explanation: 'Network partitions are inevitable. CAP choice is really "what do we do when a partition occurs — serve stale data (A) or return an error (C)?"',
  },
  {
    title: 'Treating "eventual consistency" as "inconsistent"',
    wrong: `// "Cassandra is inconsistent — we can\'t use it for anything important"`,
    right: `// Eventual consistency means replicas converge GIVEN no new writes.
// With read-repair + QUORUM reads, Cassandra can be strongly consistent.
// Many successful financial systems use Cassandra with tuned consistency.`,
    explanation: '"Eventual" is a lower bound, not the ceiling. Most NoSQL systems let you tune consistency per operation.',
  },
  {
    title: 'Confusing ACID consistency with CAP consistency',
    wrong: `// "SQL databases are consistent per CAP theorem"`,
    right: `// ACID Consistency = data satisfies integrity constraints after each transaction.
// CAP Consistency = all nodes see the same data at the same time.
// These are different properties. A distributed SQL DB can violate CAP-C.`,
    explanation: 'The C in ACID and the C in CAP are different. ACID-C is about constraints; CAP-C is about distributed linearisability.',
  },
  {
    title: 'Not mentioning PACELC in interviews',
    wrong: `// "We use DynamoDB — it\'s AP."`,
    right: `// "DynamoDB is PA/EL: available during partition, and optimises for
// low latency over strong consistency otherwise. That\'s fine for our
// shopping cart — eventual consistency is acceptable here."`,
    explanation: 'PACELC adds the latency dimension missing from CAP. Mentioning it shows depth and differentiates you from candidates who only know basic CAP.',
  },
];

const challenge: Challenge = {
  title: 'Choose the consistency model for each scenario',
  language: 'typescript',
  description: `For each system below, determine whether CP or AP is more appropriate and justify your choice.

Systems to analyse:
1. Bank account balance reads
2. Facebook "likes" counter
3. Distributed job scheduler (only one worker runs each job)
4. Product inventory count in an e-commerce store
5. User authentication session store`,
  hints: [
    'Ask: "What is the cost of serving stale data in this scenario?"',
    'Ask: "Is it worse to be unavailable or to show incorrect data?"',
    'Monetary / safety: lean CP. User experience / engagement: lean AP.',
    'Consider "last-write-wins" vs "merge on conflict" strategies for AP',
  ],
  starterCode: `interface ConsistencyDecision {
  system: string;
  model: 'CP' | 'AP';
  reason: string;
}

const decisions: ConsistencyDecision[] = [
  { system: 'Bank account balance', model: /* ? */'CP', reason: '' },
  { system: 'Facebook likes counter', model: /* ? */'AP', reason: '' },
  { system: 'Distributed job scheduler', model: /* ? */'CP', reason: '' },
  { system: 'Product inventory count', model: /* ? */'CP', reason: '' },
  { system: 'Session store', model: /* ? */'AP', reason: '' },
];`,
  solution: `const decisions = [
  {
    system: 'Bank account balance',
    model: 'CP',
    reason: 'Stale balance = double-spend risk. Refuse reads during partition; money loss > downtime.'
  },
  {
    system: 'Facebook likes counter',
    model: 'AP',
    reason: 'Showing 1,234 instead of 1,237 likes for a few seconds is imperceptible. Availability matters.'
  },
  {
    system: 'Distributed job scheduler',
    model: 'CP',
    reason: 'Only one worker can hold the lock. Two workers running the same job = data corruption. Must be CP.'
  },
  {
    system: 'Product inventory',
    model: 'CP',
    reason: 'Overselling 1 unit is bad UX and costly. Strong consistency prevents selling item at count=0.'
    // AP with compensation (refund) is also a valid business choice — trade-off to mention.
  },
  {
    system: 'Session store',
    model: 'AP',
    reason: 'Stale session for a few seconds is fine. User staying logged in during partition beats "session invalid".'
  },
];`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which property must ALL distributed systems sacrifice during a network partition according to CAP?',
    options: ['Consistency', 'Availability', 'Neither — partition tolerance is the sacrifice', 'Both C and A are sacrificed'],
    answer: 2,
    explanation: 'Partition tolerance (P) is non-negotiable — partitions always happen. The real tradeoff is C vs A during a partition. You cannot give up P in a distributed system.',
  },
  {
    q: 'Cassandra is typically classified as which CAP type?',
    options: ['CA', 'CP', 'AP', 'PC'],
    answer: 2,
    explanation: 'Cassandra is AP by default (availability + partition tolerance). During a partition, it serves potentially stale data rather than refusing requests. With QUORUM, it can behave as CP.',
  },
  {
    q: 'What does PACELC add over CAP?',
    options: ['It adds the S (scalability) dimension', 'It models the latency vs consistency trade-off even when no partition exists', 'It replaces A with Availability SLA', 'It includes economics of distributed systems'],
    answer: 1,
    explanation: 'PACELC extends CAP with the "Else" branch: even when no partition, systems trade off Latency (L) vs Consistency (C). This is the normal operating mode.',
  },
  {
    q: 'In Cassandra with N=3, which quorum settings guarantee strong consistency?',
    options: ['W=1, R=1', 'W=2, R=1', 'W=2, R=2', 'W=3, R=3'],
    answer: 2,
    explanation: 'Strong consistency requires W + R > N. With N=3, W=2 and R=2 gives 2+2=4 > 3. W=2, R=1 gives 3 which is not > 3.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Can a system be both CP and AP?',
    a: 'Not simultaneously during a partition. However, systems like Cassandra (tunable consistency) can be configured to behave as CP for some operations (QUORUM reads) and AP for others (ONE reads). This is the PACELC approach in practice.',
  },
  {
    q: 'Is a single-node PostgreSQL instance CP or AP?',
    a: 'Neither — a single node has no network partition by definition, so CAP does not apply. PostgreSQL is ACID-compliant, which is a different property. When you add read replicas, the distributed system becomes CP (with synchronous replication) or AP (asynchronous).',
  },
  {
    q: 'What does "linearisable" mean?',
    a: 'Linearisability (also called atomic consistency) means the system behaves as if there is only one copy of the data. Once a write is acknowledged, all subsequent reads — from any node — must return that value or a newer one. It is the strongest consistency guarantee and requires global coordination (e.g. Paxos, Raft).',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'CAP: distributed systems choose C or A during partition. PACELC adds latency vs consistency trade-off in normal operation.',
  mustKnow: [
    'CAP: Consistency, Availability, Partition Tolerance — real choice is C vs A during partition',
    'CP: ZooKeeper, etcd, HBase — refuse requests, never serve stale',
    'AP: Cassandra, DynamoDB (default), CouchDB — serve stale, eventually converge',
    'PACELC: PA/EL (DynamoDB), PC/EC (Spanner), tunable (Cassandra)',
    'W + R > N → strong consistency in quorum systems',
    'ACID-C ≠ CAP-C: different definitions of "consistency"',
  ],
  interviewFocus: [
    'State the trade-off: "I prefer AP here because stale data is acceptable and availability is critical"',
    'Mention PACELC for latency angle — differentiates from basic CAP answers',
    'Know CP vs AP examples for common databases',
    'Quorum formula W + R > N for Cassandra/DynamoDB consistency tuning',
  ],
};

@Component({
  selector: 'app-sysdesign-cap-theorem',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './cap-theorem.html',
  styleUrl: './cap-theorem.scss',
})
export class SysdesignCapTheorem {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
