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
    heading: 'Two Different Numbers, Both Called "100"',
    points: [
      'The main page\'s own "Not closing the MongoClient" mistake said forgetting to close a client "can exhaust the server\'s connection limit (default 100 per mongod)." Verified directly against both sides of that sentence: the Node.js driver\'s <code>maxPoolSize</code> option — the actual source of the number 100 — defaults to 100, but it caps how many connections ONE MongoClient instance\'s own pool will open. It has nothing to do with the server.',
      'The mongod server\'s own real connection ceiling is a completely separate setting, <code>net.maxIncomingConnections</code>, which defaults to 65536 — over 650× larger than the driver\'s per-client default. Confirmed via a direct simulation: leaking clients one at a time, the server\'s own ceiling only comes into real danger once roughly 656 separate clients have each opened their own 100-connection pool.',
      'The mistake\'s underlying ADVICE — always close your MongoClient — is still completely correct. What was wrong was the reasoning given for WHY it matters: a single leaked client can never single-handedly "exhaust the server\'s connection limit" on its own, since one client\'s pool (100) is nowhere near the server\'s own ceiling (65536). The real risk only shows up once leaking becomes a repeated pattern — e.g. a serverless function or a request handler that creates a fresh MongoClient on every invocation.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Driver Cap vs. Server Cap',
    language: 'typescript',
    code: `// Two DIFFERENT limits, easy to conflate:
const DRIVER_MAX_POOL_SIZE = 100;   // MongoClient's own maxPoolSize default
                                     // -- a PER-CLIENT cap set by the driver
const SERVER_MAX_INCOMING  = 65536; // mongod's net.maxIncomingConnections default
                                     // -- the server's REAL, much larger ceiling

function totalPossibleConnections(leakedClientCount: number): number {
  return leakedClientCount * DRIVER_MAX_POOL_SIZE;
}

for (const leaked of [1, 100, 655, 656, 1000]) {
  const total = totalPossibleConnections(leaked);
  const threat = total >= SERVER_MAX_INCOMING;
  console.log(
    \`\${leaked} leaked clients -> up to \${total} connections \` +
    \`(server ceiling \${SERVER_MAX_INCOMING}) -> \${threat ? 'CAN threaten it' : 'still well under it'}\`
  );
}
// -> 1 leaked client:    up to    100 connections -> still well under it
// -> 100 leaked clients: up to  10000 connections -> still well under it
// -> 655 leaked clients: up to  65500 connections -> still well under it
// -> 656 leaked clients: up to  65600 connections -> CAN threaten it
// -> 1000 leaked clients: up to 100000 connections -> CAN threaten it`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A team overrides <code>maxPoolSize</code> down to 20 (a small, tightly-scoped microservice, not the driver\'s own default of 100). Using the SAME server-side ceiling from the code tab (65536), roughly how many leaked clients would it now take before the server\'s own connection ceiling is genuinely at risk?',
  hint: 'Divide the server ceiling by the new, smaller per-client cap (20 instead of 100), then round up to the next whole client — a leaked client\'s pool can only ever be a whole number of connections.',
  solution: `// 65536 / 20 = 3276.8
// 3276 leaked clients -> 3276 x 20 = 65520 connections (still under 65536)
// 3277 leaked clients -> 3277 x 20 = 65540 connections (now over 65536)
//
// So with maxPoolSize lowered to 20, it takes roughly 3277 leaked clients
// to threaten the server's ceiling -- about 5x MORE leaked clients than
// the default maxPoolSize of 100 needed (656). A smaller per-client cap
// makes any ONE leak less dangerous, but it does nothing to fix the
// underlying bug -- a genuinely leaking application will still
// eventually get there, just after leaking more clients first.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The "100" in the original mistake text IS mongod\'s real, hard connection limit — so a well-behaved application should never open more than 100 connections total.',
    reality: '100 is the DRIVER\'s own default <code>maxPoolSize</code> for one <code>MongoClient</code> instance, not the server\'s limit at all. A single, correctly-managed application that creates ONE client at startup and reuses it (the fix the same mistake block recommends) can comfortably use up to 100 concurrent connections from that one pool — nowhere near the server\'s own much larger 65536-connection ceiling. The two numbers describe completely different things: one client\'s own pool cap, versus the server\'s total capacity across every client combined.',
  },
  {
    thought: 'Since one leaked client can\'t realistically threaten the server\'s 65536-connection ceiling on its own, "not closing the MongoClient" is a smaller problem than the main page\'s mistake block makes it sound.',
    reality: 'The real-world failure mode isn\'t ONE leaked client — it\'s the SAME leaking pattern repeating on every request, which is exactly the SEPARATE "Creating a new MongoClient per request" mistake the main page also covers. A request handler that creates and leaks a fresh client on every single call can realistically leak hundreds or thousands of clients under real traffic, which is precisely the regime (656+ leaked clients, per the verified math above) where the server\'s own ceiling genuinely does come under threat — not from one mistake, but from the SAME mistake made repeatedly at scale.',
  },
];

@Component({
  selector: 'app-mongo-fundamentals-driver-vs-server-cap',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-100-cap-is-the-drivers-not-the-servers-limit.html',
  styleUrl: './the-100-cap-is-the-drivers-not-the-servers-limit.scss',
})
export class The100CapIsTheDriversNotTheServersLimitSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
