import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-sentinel-replica-selection-tiebreaker-implemented',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sentinel-replica-selection-tiebreaker-implemented.html',
  styleUrl: './sentinel-replica-selection-tiebreaker-implemented.scss',
})
export class SentinelReplicaSelectionTiebreakerImplementedSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Named precisely in a QnA, never actually implemented',
      points: [
        'The main page\'s own QnA names the exact tiebreaker order Sentinel uses to pick which replica to promote: "(1) replica-priority config (lower = preferred; 0 = never promote); (2) replication offset (most up-to-date wins); (3) run ID as a tiebreaker." No codeTab anywhere on the page shows this logic actually running.',
        'This is a genuine THREE-LEVEL tiebreaker, not a single comparison — priority is checked FIRST and can decide the winner outright regardless of how far behind that replica\'s offset is; offset is only consulted when priority ties; run ID is only consulted when BOTH priority and offset tie.',
      ],
    },
    {
      heading: 'Why priority outranks offset, not the other way around',
      points: [
        'A lower <code>replica-priority</code> is an explicit, operator-set signal of INTENT ("promote this one first if you have to choose") — typically used to prefer a replica in the same availability zone as most application traffic, or one on beefier hardware, over one that merely happens to be slightly more caught-up.',
        'Replication offset measures how CURRENT a replica\'s data is — a real correctness signal, but a purely observational one with no notion of operator intent. Sentinel checking priority first means an operator\'s explicit preference always wins over a marginal data-freshness difference, only falling back to offset when the operator expressed no preference (equal priorities).',
        '<code>priority: 0</code> is a special case meaning "never promote this replica at all" — useful for a read-only analytics replica or one in a degraded/maintenance state that should never become the primary, regardless of how current its data is.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Sentinel’s 3-tier tiebreaker, implemented',
      language: 'typescript',
      code: `interface ReplicaCandidate {
  host: string;
  priority: number; // lower preferred; 0 = never promote
  offset: number;   // higher = more up-to-date
  runId: string;    // final tiebreaker
}

function selectBestReplica(replicas: ReplicaCandidate[]): ReplicaCandidate | null {
  const eligible = replicas.filter(r => r.priority !== 0);
  if (eligible.length === 0) return null;

  eligible.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority; // (1) lower priority wins
    if (a.offset !== b.offset) return b.offset - a.offset;         // (2) higher offset wins
    return a.runId < b.runId ? -1 : 1;                             // (3) run ID as final tiebreaker
  });
  return eligible[0];
}

const replicas: ReplicaCandidate[] = [
  { host: 'replica-a', priority: 100, offset: 5000, runId: 'bbb111' },
  { host: 'replica-b', priority: 100, offset: 5000, runId: 'aaa222' }, // tied priority+offset -- runId decides
  { host: 'replica-c', priority: 50,  offset: 4000, runId: 'ccc333' }, // lower priority wins despite lower offset
  { host: 'replica-d', priority: 0,   offset: 9999, runId: 'ddd444' }, // priority 0 -- excluded entirely
];

console.log('Best replica:', selectBestReplica(replicas)?.host);
console.log('Reason: priority 50 beats priority 100, regardless of the offset comparison.');
// Best replica: replica-c
// Reason: priority 50 beats priority 100, regardless of the offset comparison.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Remove replica-c from the pool entirely, leaving only replica-a, replica-b (both priority 100, offset 5000), and replica-d (priority 0, excluded). Which replica does <code>selectBestReplica</code> choose, and which of the three tiers actually decides it this time?',
    hint: 'With replica-c gone, the two remaining eligible candidates are tied on the FIRST two tiers — trace which comparison the sort function actually falls through to.',
    solution: `selectBestReplica chooses replica-b. Both remaining eligible candidates (replica-a and replica-b) share the identical priority (100) AND the identical offset (5000), so neither of the first two tiers can distinguish them -- the comparison falls all the way through to the THIRD tier, run ID, where 'aaa222' (replica-b) sorts lexicographically before 'bbb111' (replica-a).

This demonstrates the tiebreaker chain is genuinely sequential, not "pick whichever field happens to differ" -- each tier is checked in a FIXED order (priority, then offset, then run ID), and a later tier is only ever consulted when every earlier tier produced an exact tie. A different pair of candidates with even slightly different offsets would never reach the run ID comparison at all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Since offset measures actual data freshness and priority is just a config number, offset should be checked first — the more objective signal ought to win."',
      reality: 'Sentinel deliberately checks priority FIRST, per the main page\'s own QnA — verified above that a lower-priority replica wins even against a HIGHER-offset competitor. This is intentional: priority encodes an operator\'s explicit intent, which is meant to override a marginal freshness difference between otherwise-acceptable candidates.',
    },
    {
      thought: '"Run ID being the final tiebreaker means ties are resolved essentially randomly, since a run ID is just an arbitrary generated string."',
      reality: 'It is deterministic, not random — the SAME two run IDs always sort the SAME way (lexicographic string comparison), verified above. "Arbitrary" only describes how a run ID is originally generated; once generated, comparing two of them is a fixed, repeatable operation, which is exactly what a tiebreaker needs to be for failover to behave predictably.',
    },
  ];

  topicLabel = 'Replication & Sentinel';
  topicRoute = '/redis/replication-sentinel';
  prev: SubtopicLink | null = {
    label: 'Why Diskless Sync Needs a Delay to Batch Replicas',
    route: '/redis/replication-sentinel/why-diskless-sync-needs-a-delay-to-batch-replicas',
  };
  next: SubtopicLink | null = {
    label: 'Using WAIT for Selective Write Durability',
    route: '/redis/replication-sentinel/using-wait-for-selective-write-durability',
  };
}
