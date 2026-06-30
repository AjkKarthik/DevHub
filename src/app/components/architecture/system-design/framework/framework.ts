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
  { name: 'Step 1 — Clarify',     type: 'keyword', desc: 'Gather functional + non-functional requirements. Ask about users, scale, latency SLA, durability.' },
  { name: 'Step 2 — Estimate',    type: 'keyword', desc: 'Back-of-envelope: QPS, storage, bandwidth, memory. Define read:write ratio.' },
  { name: 'Step 3 — Design',      type: 'keyword', desc: 'High-level diagram: clients → LB → services → cache → DB → CDN.' },
  { name: 'Step 4 — Deep Dive',   type: 'keyword', desc: 'Pick 2-3 components to elaborate. Data model, API contracts, failure modes.' },
  { name: 'Non-functional reqs',  type: 'syntax',  desc: 'Availability, consistency, latency, scalability, durability. Always ask about these.' },
  { name: 'Functional reqs',      type: 'syntax',  desc: 'Core features: what must the system do? Write them down explicitly before designing.' },
  { name: 'Trade-off language',   type: 'keyword', desc: 'Say "I prefer X here because … but the trade-off is Y." Interviewers reward this.' },
  { name: 'Time box',             type: 'keyword', desc: 'Spend ~5 min per step in a 45-min interview. Do not over-index on step 1.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Why a framework matters',
    points: [
      'Open-ended questions panic candidates who jump straight to components.',
      'A repeatable 4-step skeleton keeps you structured and gives the interviewer checkpoints.',
      'Interviewers score communication, trade-off awareness, and depth — not just correctness.',
    ],
  },
  {
    heading: 'Step 1 — Clarify requirements (~5 min)',
    points: [
      'Ask: Who are the users? What scale — 1M or 1B DAU?',
      'Functional: must-have features vs nice-to-have.',
      'Non-functional: availability target (99.9%? 99.99%?), latency SLA, data consistency.',
      'Constraints: budget, existing infra, read-heavy vs write-heavy?',
    ],
  },
  {
    heading: 'Step 2 — Capacity estimation (~5 min)',
    points: [
      'Write down numbers so the interviewer can follow: 100M DAU × 10 requests/day = ~12k QPS.',
      'Storage: entities × avg size × retention. Add 3× for replicas.',
      'Bandwidth: QPS × avg response size.',
      'Memory (cache sizing): 20% hot data × storage size.',
    ],
  },
  {
    heading: 'Step 3 — High-level design (~10-15 min)',
    points: [
      'Draw the primary data flow: client → DNS → CDN → LB → API servers → cache → DB.',
      'Choose DB type (SQL vs NoSQL) based on access patterns, not popularity.',
      'Identify where to add a queue for async processing.',
      'State your assumptions out loud.',
    ],
  },
  {
    heading: 'Step 4 — Deep dive (~15 min)',
    points: [
      'Let the interviewer guide you or pick 2-3 tricky components.',
      'Data model: schema, index strategy, sharding key.',
      'API design: REST endpoints, request/response shapes.',
      'Failure scenarios: what happens when the DB primary fails?',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Requirements Template',
    language: 'bash',
    code: `# FUNCTIONAL REQUIREMENTS
# - Core feature 1 (create, read, update, delete)
# - Core feature 2 (e.g. search, notifications)
# [out of scope: analytics, admin dashboard]

# NON-FUNCTIONAL REQUIREMENTS
# - Availability: 99.99% (~52 min downtime/year)
# - Latency: P99 < 200ms for reads
# - Consistency: eventual OK for feeds; strong for payments
# - Scale: 50M DAU, 500 QPS writes, 5k QPS reads
# - Durability: no data loss (0 RPO) for financial data`,
  },
  {
    label: 'Estimation Template',
    language: 'bash',
    code: `# CAPACITY ESTIMATION — URL Shortener example

# Traffic
# 100M URLs shortened/day  →  1,157 writes/sec
# 10:1 read:write ratio   → 11,570 reads/sec

# Storage
# Avg URL record: 500 bytes
# 100M/day × 365 days × 5 years = 182.5B records
# 182.5B × 500B = ~91 TB  (with 3× replication: ~273 TB)

# Bandwidth
# Write: 1157 req/s × 500B = ~578 KB/s
# Read:  11570 req/s × 100B = ~1.1 MB/s

# Cache (80/20 rule — cache top 20% hot URLs)
# 11570 req/s × 86400 sec × 0.2 × 100B = ~20 GB/day`,
  },
  {
    label: 'High-Level Design',
    language: 'bash',
    code: `# HIGH-LEVEL DESIGN SKELETON

Client
  ↓
DNS (Route 53 / Cloudflare)
  ↓
CDN (Cloudflare / Fastly)    ← static assets, cached responses
  ↓
Load Balancer (L7, HTTPS termination)
  ↓
API Gateway (rate limiting, auth, routing)
  ↓
┌─────────────────────────────────┐
│   Service Layer (stateless)     │
│   - Read Service (scale out)    │
│   - Write Service               │
└──────┬───────────────┬──────────┘
       │               │
   Cache (Redis)    Message Queue (Kafka)
       │               │
       └───────┬───────┘
           Database
       ┌────────────────┐
       │  Primary (RW)  │
       │  Replica × N   │ ← read replicas
       └────────────────┘
       Object Store (S3) ← blobs, media`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Jumping straight to components',
    wrong: `// Interview answer: "I'd use Redis for caching and Kafka for events."`,
    right: `// First clarify: "Before I design, let me confirm requirements:
// Are we targeting 1M or 100M users?
// What's the acceptable latency — 100ms or 1s?"`,
    explanation: 'Without requirements, component choices are cargo-culting. Interviewers mark you down for skipping clarification.',
  },
  {
    title: 'Ignoring non-functional requirements',
    wrong: `// Only listing features:
// "Users can post, follow, see a feed"`,
    right: `// Always ask about NFRs:
// "Should the feed be strongly consistent or eventually consistent?
// Target availability — 99.9% or 99.99%?
// Maximum acceptable read latency?"`,
    explanation: 'Non-functional requirements drive the entire architecture. Missing them leads to wrong design choices.',
  },
  {
    title: 'Over-engineering step 1',
    wrong: `// Spending 20 minutes on requirements in a 45-minute session`,
    right: `// ~5 minutes max on clarification, then move to estimation.
// If the interviewer says "make reasonable assumptions" — do so.`,
    explanation: 'Time management is part of the evaluation. Over-indexing on requirements leaves no time for the actual design.',
  },
  {
    title: 'Missing the data model',
    wrong: `// Designing the full flow without specifying schema:
// "We store users and posts in a database"`,
    right: `// Specify primary entities and keys:
// User { userId, username, createdAt }
// Post { postId, userId (FK), content, createdAt }
// Index: (userId, createdAt DESC) for user timelines`,
    explanation: 'The data model reveals sharding strategy, index design, and whether SQL or NoSQL is appropriate.',
  },
  {
    title: 'Forgetting failure modes',
    wrong: `// Happy path only: "the API calls the DB and returns data"`,
    right: `// "If the primary DB fails, the write fails — we use leader election
// (AWS RDS Multi-AZ). Reads fail over to replica in ~30s.
// We accept at most 30 seconds of read downtime."`,
    explanation: 'Senior engineers are expected to address failure modes. Always state what happens when a component goes down.',
  },
];

const challenge: Challenge = {
  title: 'Design a file-sharing system (Dropbox-like)',
  language: 'typescript',
  description: `Apply the 4-step framework to design a cloud file storage system.

Requirements to consider:
- Users upload/download files (up to 5 GB each)
- Files must be synced across devices
- 10M DAU, 1M uploads/day, 10:1 read:write ratio
- 99.99% availability, P99 download latency < 500ms
- Files must never be lost

Your tasks:
1. Write out functional + non-functional requirements
2. Estimate QPS, storage after 5 years, bandwidth
3. Sketch the high-level design (components and data flow)
4. Identify 2 deep-dive areas (e.g. chunked upload, sync protocol)`,
  hints: [
    'How do you handle large files? Chunking + multipart upload',
    'Where does deduplication help? Hash chunks and deduplicate at storage layer',
    'How do you sync across devices? Metadata service tracks file versions + delta sync',
    'What DB for metadata vs file bytes? SQL for metadata, object store (S3) for bytes',
  ],
  starterCode: `// STEP 1 — REQUIREMENTS
// Functional:
// Non-functional:

// STEP 2 — ESTIMATION
// Writes: 1M uploads/day = ~12 QPS
// Storage: ?
// Bandwidth: ?

// STEP 3 — HIGH-LEVEL DESIGN
// [sketch your component diagram in comments]

// STEP 4 — DEEP DIVE
// Deep dive 1: chunked upload protocol
// Deep dive 2: cross-device sync algorithm`,
  solution: `// STEP 1 — REQUIREMENTS
// Functional: upload file, download file, sync across devices, share link
// Non-functional: 99.99% availability, P99 < 500ms downloads, zero data loss

// STEP 2 — ESTIMATION
// Writes: 1M/day = 12 QPS; Reads: 120 QPS
// Avg file: 5 MB; Storage: 1M × 5MB × 365 × 5y = ~9 PB (+ 3× replication = 27 PB)
// Bandwidth: 120 QPS × 5MB = ~600 MB/s peak

// STEP 3 — HIGH-LEVEL DESIGN
// Client → Metadata Service (SQL: file, chunks, versions, users)
//       → Chunk Service → Object Store (S3/GCS)
//       → Sync Notification (long-poll or WebSocket)
// CDN sits in front for download acceleration

// STEP 4 — DEEP DIVE: Chunked Upload
// 1. Client splits file into 4MB chunks, hashes each
// 2. POST /upload/init  → uploadId
// 3. PUT /upload/:uploadId/chunk/:seq  (parallel, up to 5 threads)
// 4. POST /upload/:uploadId/complete  (server assembles)
// Dedup: if hash already in store, skip re-upload (content-addressable storage)`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'In which step of the 4-step framework do you draw the high-level component diagram?',
    options: ['Step 1 — Clarify', 'Step 2 — Estimate', 'Step 3 — Design', 'Step 4 — Deep Dive'],
    answer: 2,
    explanation: 'Step 3 is High-Level Design: draw the primary data flow and identify components. Estimation (Step 2) comes before; deep-dives (Step 4) come after.',
  },
  {
    q: 'A system must never lose data. Which non-functional requirement does this describe?',
    options: ['Availability', 'Durability', 'Consistency', 'Latency'],
    answer: 1,
    explanation: 'Durability means data persists once acknowledged (e.g. RPO = 0). Availability is about uptime; consistency is about read-after-write guarantees.',
  },
  {
    q: '100M DAU each make 10 requests/day. Approximate QPS?',
    options: ['~1,000', '~11,600', '~1,000,000', '~100,000'],
    answer: 1,
    explanation: '100M × 10 / 86,400 ≈ 11,574 QPS. Memorise this: 100M req/day ≈ 1,157 QPS.',
  },
  {
    q: 'Which question is MOST important to ask before choosing SQL vs NoSQL?',
    options: ['Which is faster?', 'What are the access patterns and consistency needs?', 'What does the team know best?', 'Which has better cloud support?'],
    answer: 1,
    explanation: 'Access patterns (point lookups, range scans, joins) and consistency requirements (ACID vs BASE) are the primary drivers. Performance and familiarity are secondary.',
  },
  { q: 'What is a non-functional requirement in system design and how does it differ from a functional requirement?', options: ['Non-functional requirements are optional features; functional requirements are mandatory', 'Functional requirements describe what the system does; non-functional requirements describe how well it does it, like latency, availability, and consistency constraints', 'Non-functional requirements apply only to infrastructure; functional requirements apply to application code', 'They are equivalent terms used interchangeably in system design interviews'], answer: 1, explanation: 'Functional requirements define the behaviors and capabilities of the system: what it does. Example: users can post messages, search for content, and follow other users. Non-functional requirements define quality attributes: how the system performs. Examples: availability of 99.99%, read latency under 100ms at P99, support for 100 million users. Non-functional requirements directly drive architectural decisions like choice of database, consistency model, caching strategy, and deployment topology. Always clarify both types at the start of a system design discussion.' },
  { q: 'What is the difference between horizontal and vertical scaling?', options: ['Horizontal scaling increases hardware specs; vertical scaling adds more machines', 'Vertical scaling increases the capacity of a single machine; horizontal scaling adds more machines to distribute load', 'Horizontal scaling applies only to databases; vertical scaling applies only to application servers', 'They are equivalent strategies with different naming conventions'], answer: 1, explanation: 'Vertical scaling (scale up): upgrade a single machine with more CPU, RAM, or faster storage. Simple operationally because no distributed coordination is needed, but has a hard ceiling at the maximum hardware specifications and creates a single point of failure. Horizontal scaling (scale out): add more machines and distribute load across them. Has no theoretical upper limit and provides redundancy, but requires stateless design or distributed state management. Stateless application servers scale horizontally easily; stateful systems like databases require sharding or clustering for horizontal scaling.' },
];

const qna: QnaItem[] = [
  {
    q: 'What if I run out of time before finishing all 4 steps?',
    a: 'Prioritise breadth over depth. Get a working high-level design on the board first, then deep-dive only if time allows. Telling the interviewer "I would next dive into the sharding strategy" scores better than silence.',
  },
  {
    q: 'When should I proactively mention trade-offs?',
    a: 'Whenever you make a binary choice — SQL vs NoSQL, sync vs async writes, cache-aside vs read-through. Say "I choose X because Y; the trade-off is Z." This is what separates senior from mid-level candidates.',
  },
  {
    q: 'Should I always draw a diagram?',
    a: 'Yes. A component diagram anchors the conversation, gives the interviewer something to react to, and forces you to be explicit about data flows. Use boxes + arrows; label every edge.',
  },
  {
    q: 'How do I handle a system I have no idea how to design?',
    a: 'Decompose it into primitives you know: storage, computation, communication. Most systems are combinations of a database, a cache, a queue, and an API. Start there and adapt.',
  },
  { q: 'What is a back-of-the-envelope calculation and how is it used in system design?', a: 'Back-of-the-envelope calculations quickly estimate scale requirements using rough numbers to determine if a design will work before committing to detailed architecture. Key numbers to know: disk seek time (10ms), SSD random read (0.1ms), network round trip within data center (0.5ms), network round trip across regions (150ms). Storage: 1 byte of text per character, compressed images 100KB-1MB, 1 minute of video at 1080p approximately 50MB. Calculation process: estimate DAU and requests per user, derive QPS, then work through each layer (network, app servers, cache, database) to determine required capacity. These estimates reveal whether you need caching, sharding, or CDN before diving into component design.' },
  { q: 'How do you prioritize between different system design trade-offs in an interview?', a: 'Start by clarifying requirements and constraints: what is the scale, what are the latency requirements, and what consistency guarantees are needed. Then identify the single most important constraint: if the system must handle 1 million writes per second, that drives toward NoSQL and async pipelines. If strong consistency is required, that limits distributed architectures. For each component choice, state the trade-off explicitly: choosing Cassandra over PostgreSQL gives write scalability but sacrifices ACID transactions. Choosing synchronous writes gives consistency but increases latency. Good system design is not about picking the right answer but about clearly reasoning through trade-offs relative to the specific requirements stated.' },
];

const revision: RevisionSummary = {
  oneLiner: 'A repeatable 4-step framework — Clarify → Estimate → Design → Deep Dive — for any system design question.',
  mustKnow: [
    'Step 1: functional + non-functional requirements (~5 min)',
    'Step 2: back-of-envelope estimation — QPS, storage, bandwidth (~5 min)',
    'Step 3: high-level component diagram with data flow (~10-15 min)',
    'Step 4: 2-3 deep dives into critical components (~15 min)',
    'Always state trade-offs when making design choices',
    'Time management: ~5 min per step in a 45-minute interview',
  ],
  interviewFocus: [
    'Clarify before designing — interviewers penalise skipping requirements',
    'Estimate QPS and storage before choosing components',
    'Say "I choose X because Y; the trade-off is Z" for every binary decision',
    'Address at least one failure scenario unprompted',
  ],
};

@Component({
  selector: 'app-sysdesign-framework',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './framework.html',
  styleUrl: './framework.scss',
})
export class SysdesignFramework {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
