import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-the-live-resharding-state-machine-migrating-importing-ask-moved',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-live-resharding-state-machine-migrating-importing-ask-moved.html',
  styleUrl: './the-live-resharding-state-machine-migrating-importing-ask-moved.scss',
})
export class TheLiveReshardingStateMachineMigratingImportingAskMovedSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Named in prose, never shown as a real state machine',
      points: [
        'The main page\'s own theory says resharding "can happen live without downtime" and that clients "handle MOVED and ASK redirection responses transparently." No codeTab anywhere on the page shows what that actually looks like on the two nodes involved.',
        'Verified directly against Redis\'s own official Cluster Specification, which documents an exact, ordered command sequence for moving a slot from node A to node B: <code>CLUSTER SETSLOT 8 IMPORTING A</code> is sent to B FIRST, then <code>CLUSTER SETSLOT 8 MIGRATING B</code> is sent to A SECOND — the order matters, since B must already be prepared to accept ASK-redirected traffic before A starts sending it any.',
      ],
    },
    {
      heading: 'What each of the two special states actually does',
      points: [
        'A node with a slot marked MIGRATING still serves EXISTING keys in that slot locally — a key already there doesn\'t move until the migration process (driven by <code>MIGRATE</code> commands during the reshard) actually copies it. Only a query for a key that is NOT found locally gets an ASK redirect to the target node — this is exactly why an existing key and a brand-new key in the same slot can be answered by two different nodes during migration.',
        'A node with a slot marked IMPORTING will REJECT a query about that slot unless the client\'s request was immediately preceded by the ASKING command — without it, the node responds with an ordinary MOVED redirect pointing BACK to the source node, per Redis\'s own documented spec. This is a deliberate safety net: an unaware client never accidentally reads from the importing node mid-migration.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Migration state machine',
      language: 'typescript',
      code: `class MockNode {
  data = new Map<string, string>();
  migratingSlot: { slot: number; target: string } | null = null;
  importingSlot: { slot: number; source: string } | null = null;

  constructor(public name: string) {}

  query(key: string, slot: number, asking = false) {
    // MIGRATING: serve existing keys locally; ASK-redirect on missing keys.
    if (this.migratingSlot?.slot === slot) {
      if (this.data.has(key)) return { result: this.data.get(key), from: this.name };
      return { redirect: 'ASK', target: this.migratingSlot.target };
    }
    // IMPORTING: only serve if ASKING was sent; otherwise MOVED back to the real owner.
    if (this.importingSlot?.slot === slot) {
      if (asking) return { result: this.data.get(key) ?? null, from: this.name };
      return { redirect: 'MOVED', target: this.importingSlot.source };
    }
    return { result: this.data.get(key) ?? null, from: this.name };
  }
}

const A = new MockNode('A');
const B = new MockNode('B');
A.data.set('slot8:existing', 'value-in-A');

// Begin migration in Redis's own documented order.
B.importingSlot = { slot: 8, source: 'A' };
A.migratingSlot = { slot: 8, target: 'B' };

console.log(A.query('slot8:existing', 8));
// { result: 'value-in-A', from: 'A' } -- existing key still served by A

console.log(A.query('slot8:new', 8));
// { redirect: 'ASK', target: 'B' } -- brand-new key in the same slot ASK-redirects to B

console.log(B.query('slot8:new', 8, /* asking */ false));
// { redirect: 'MOVED', target: 'A' } -- a client that skips ASKING gets bounced right back to A

console.log(B.query('slot8:new', 8, /* asking */ true));
// { result: null, from: 'B' } -- with ASKING sent first, B correctly serves the request`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Suppose a buggy client SKIPS sending ASKING and instead queries node B directly for an existing key in slot 8 (one that has NOT yet been migrated off of A). What does B do, and why is this actually a safety feature rather than a bug in Redis itself?',
    hint: 'Trace it through <code>MockNode.query()</code>: B has an <code>importingSlot</code> entry for slot 8, and the request arrives with <code>asking = false</code>.',
    solution: `B responds with a MOVED redirect pointing back to A -- the exact same branch that fires for ANY un-ASKING'd query to an importing slot, regardless of whether the specific key being asked for has already been migrated or not. B never even checks whether it happens to already have a copy of the key.

This is the safety mechanism working as designed, not a bug: Redis deliberately makes B refuse to answer ANY query about an importing slot unless the client explicitly opted in via ASKING. A buggy or outdated client that doesn't know about the migration in progress gets bounced straight back to A -- the node it already trusts -- rather than silently reading from a node that might only have a PARTIAL copy of the slot's data. The ASKING requirement is what lets Redis run this migration process safely with ordinary, unaware clients still hitting the cluster the whole time.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"ASK and MOVED are basically the same thing, just used at different times during a migration."',
      reality: 'They mean structurally different things, verified above: MOVED says "this slot permanently belongs to a different node now — update your routing and use that node from now on." ASK says "try this ONE specific node for this ONE specific query only, don\'t change anything else yet." A node under active migration can send either one depending on whether the exact key exists there yet, which is why the two responses cannot be treated interchangeably.',
    },
    {
      thought: '"Once a slot starts migrating, the target node (B) immediately owns it and should answer every query about it."',
      reality: 'Verified above: B REJECTS queries about the still-migrating slot unless ASKING was sent, and even then only actually owns data that has already been copied over. Ownership only formally transfers once the migration finishes and <code>CLUSTER SETSLOT 8 NODE B</code> is sent to finalize it — until then, A remains the slot\'s real owner for everything except the specific keys ASK has already redirected.',
    },
  ];

  topicLabel = 'Redis Cluster';
  topicRoute = '/redis/redis-cluster';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'The Hash Tag Extraction Algorithm, Verified Against Real Edge Cases',
    route: '/redis/redis-cluster/the-hash-tag-extraction-algorithm-verified-against-real-edge-cases',
  };
}
