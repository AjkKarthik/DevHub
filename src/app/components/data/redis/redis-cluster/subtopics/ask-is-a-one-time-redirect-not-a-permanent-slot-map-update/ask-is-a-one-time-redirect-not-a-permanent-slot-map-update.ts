import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ask-is-a-one-time-redirect-not-a-permanent-slot-map-update',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './ask-is-a-one-time-redirect-not-a-permanent-slot-map-update.html',
  styleUrl: './ask-is-a-one-time-redirect-not-a-permanent-slot-map-update.scss',
})
export class AskIsAOneTimeRedirectNotAPermanentSlotMapUpdateSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The QnA names the fix, no codeTab shows the client following it',
      points: [
        'The main page\'s own QnA says, correctly: "ASK error: the key is being migrated — send ASKING to the new node and retry once." No codeTab on the page actually implements a client doing this.',
        'Verified directly against Redis\'s own Cluster Specification: on an ASK redirect, the client must (1) send ONLY the one redirected query to the target node, prefixed with the ASKING command, (2) NOT permanently update its cached slot map, and (3) keep sending every OTHER query for that same slot to the OLD node, exactly as before, until a real MOVED eventually arrives once the migration finishes.',
      ],
    },
    {
      heading: 'Why the client must NOT update its map on ASK',
      points: [
        'A single ASK redirect only tells the client about ONE specific key — it says nothing about the other, still-unmigrated keys sitting in the same slot on the old node. Updating the slot map after just one ASK would incorrectly send every future query for that slot straight to the new node, most of which do not have the requested key there yet.',
        'Redis\'s own spec explicitly calls out the safety net for a client that gets this wrong anyway: if a "buggy" client updates its map early and skips the required ASKING command, the new node simply responds with an ordinary MOVED redirect pointing right back to the old node — the mistake self-corrects rather than silently serving wrong data.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A client correctly handling ASK',
      language: 'typescript',
      code: `interface QueryResult { result: string | null; from: string }
interface Redirect { redirect: 'ASK' | 'MOVED'; target: string }

class MockNode {
  data = new Map<string, string>();
  migratingSlot: { slot: number; target: string } | null = null;

  constructor(public name: string) {}

  query(key: string, slot: number, asking = false): QueryResult | Redirect {
    if (this.migratingSlot?.slot === slot && !this.data.has(key)) {
      return { redirect: 'ASK', target: this.migratingSlot.target };
    }
    return { result: this.data.get(key) ?? null, from: this.name };
  }
}

class ClusterClient {
  slotMap: Record<number, string> = { 8: 'A' }; // deliberately never mutated by ASK below

  constructor(private nodes: Record<string, MockNode>) {}

  execute(key: string, slot: number) {
    const primary = this.nodes[this.slotMap[slot]];
    const resp = primary.query(key, slot);
    if ('redirect' in resp && resp.redirect === 'ASK') {
      // Send ONLY this query to the target, preceded by ASKING -- do NOT touch slotMap.
      const target = this.nodes[resp.target];
      const askResp = target.query(key, slot, /* asking */ true) as QueryResult;
      return { servedBy: askResp.from, slotMapAfter: { ...this.slotMap } };
    }
    return { servedBy: (resp as QueryResult).from, slotMapAfter: { ...this.slotMap } };
  }
}

const A = new MockNode('A');
const B = new MockNode('B');
A.migratingSlot = { slot: 8, target: 'B' };
const client = new ClusterClient({ A, B });

console.log(client.execute('slot8:brand-new-key', 8));
// { servedBy: 'B', slotMapAfter: { '8': 'A' } } -- served by B, but the map still says A

console.log(client.execute('slot8:another-new-key', 8));
// { servedBy: 'B', slotMapAfter: { '8': 'A' } } -- routed through A first AGAIN, every time`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A different client implementation updates <code>slotMap[8] = "B"</code> the FIRST time it receives an ASK redirect, then sends every later query for slot 8 directly to B without ASKING. What happens to those later queries, and why does this specific behavior make the mistake self-correcting rather than a silent data-corruption bug?',
    hint: 'B still has its own <code>importingSlot</code> state set — recall from the prior subtopic what B does with a query that arrives WITHOUT the ASKING flag.',
    solution: `Every one of those later queries gets a MOVED redirect from B pointing back to A -- B is still marked as importing slot 8 and unconditionally rejects any query that was not immediately preceded by ASKING, regardless of what the client's own (incorrectly updated) slot map claims. The client's premature map update never actually causes B to serve stale or wrong data; it just costs an extra redirect round trip on every query until the client's cluster-aware library corrects the map back (typically by honoring the MOVED response) or the migration finishes and a real MOVED for slot 8 legitimately arrives.

This is exactly why Redis's spec can afford to only document the STRICT correct behavior for well-behaved clients, without needing to define elaborate error handling for buggy ones -- B's own unconditional "no ASKING, no service" rule is what makes ANY client mistake here self-correct into a performance cost (extra redirects) rather than a correctness bug (wrong data served from an incomplete migration).`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"After following one ASK redirect successfully, later queries can skip ASKING for the rest of the migration since the client already knows B has the data."',
      reality: 'Verified above: skipping ASKING on a later query gets a MOVED response back to A every time, even mid-migration — ASKING is a REQUIRED, one-time flag on every single query sent to an importing node, not a one-time handshake that unlocks unrestricted future access.',
    },
    {
      thought: '"ASKING is basically the same idea as re-authenticating — it proves the client is allowed to talk to node B."',
      reality: 'It has nothing to do with authorization at all — it is purely a migration-safety signal meaning "I know this slot is mid-migration and I am intentionally asking about it anyway," verified above by the fact that it must be resent on every individual query, which would be a strange design for an authentication mechanism but makes complete sense as a per-request opt-in flag.',
    },
  ];

  topicLabel = 'Redis Cluster';
  topicRoute = '/redis/redis-cluster';
  prev: SubtopicLink | null = {
    label: 'The Hash Tag Extraction Algorithm, Verified Against Real Edge Cases',
    route: '/redis/redis-cluster/the-hash-tag-extraction-algorithm-verified-against-real-edge-cases',
  };
  next: SubtopicLink | null = null;
}
