import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-why-diskless-sync-needs-a-delay-to-batch-replicas',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './why-diskless-sync-needs-a-delay-to-batch-replicas.html',
  styleUrl: './why-diskless-sync-needs-a-delay-to-batch-replicas.scss',
})
export class WhyDisklessSyncNeedsADelayToBatchReplicasSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The main page presented the pre-7.0 default as if it were the only mechanism',
      points: [
        'The main page\'s own theory, QnA, and a quiz question all described full sync as "the master forks and performs BGSAVE (RDB snapshot), sends the RDB to the replica" — a disk-based description with no version qualifier. Verified directly against Redis\'s own shipped <code>redis.conf</code> at two tagged releases: <code>repl-diskless-sync</code> defaulted to <code>no</code> (disk-based) at Redis 6.2.6, and to <code>yes</code> (diskless) at Redis 7.0.0 — the CURRENT default is the opposite of what the main page described unconditionally.',
        'Diskless sync, per Redis\'s own current <code>redis.conf</code> comment, works by having "the Redis master create a new process that directly writes the RDB file to replica sockets, without touching the disk at all" — no RDB file is ever written to the master\'s own filesystem in this mode.',
      ],
    },
    {
      heading: 'Why diskless sync needs a delay that disk-based sync never needed',
      points: [
        'With DISK-based sync, a replica arriving WHILE the RDB is still being written can simply wait — once the fork finishes and the file is complete, that same saved file can serve every replica that queued up during the save, with no extra work.',
        'With DISKLESS sync, there is no saved file to hand out later — the RDB is streamed live, directly into one specific transfer. Once that transfer starts, a replica that arrives mid-stream cannot join it; it must wait for an entirely NEW transfer to start once the current one finishes.',
        '<code>repl-diskless-sync-delay</code> (default 5 seconds, per Redis\'s own current <code>redis.conf</code>) exists specifically to close this gap: the master waits up to this many seconds BEFORE starting the diskless transfer, hoping multiple replicas connect within that window so ONE transfer can serve all of them — trading a small startup delay for avoiding N separate full transfers when N replicas restart or reconnect around the same time.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Modeling the batching effect of the delay',
      language: 'typescript',
      code: `interface ReplicaArrival { name: string; arrivesAtMs: number }

// Simulates how many separate full-sync TRANSFERS are needed for a given
// set of replica arrival times, with and without the diskless-sync-delay.
function countTransfersNeeded(arrivals: ReplicaArrival[], diskless: boolean, delayMs: number): number {
  const sorted = [...arrivals].sort((a, b) => a.arrivesAtMs - b.arrivesAtMs);
  if (!diskless) return 1; // disk-based: the saved RDB file serves every arrival, one transfer total

  let transfers = 0;
  let windowStart: number | null = null;
  for (const r of sorted) {
    if (windowStart === null || r.arrivesAtMs > windowStart + delayMs) {
      transfers++;
      windowStart = r.arrivesAtMs;
    }
    // else: this replica arrived within the current batching window -- joins the same transfer
  }
  return transfers;
}

// Three replicas all restart within a 3-second window (well inside the 5s default delay).
const closeArrivals: ReplicaArrival[] = [
  { name: 'replica-a', arrivesAtMs: 0 },
  { name: 'replica-b', arrivesAtMs: 1500 },
  { name: 'replica-c', arrivesAtMs: 3000 },
];

console.log('Disk-based, 3 close arrivals:', countTransfersNeeded(closeArrivals, false, 5000), 'transfer(s)');
console.log('Diskless (5s delay), 3 close arrivals:', countTransfersNeeded(closeArrivals, true, 5000), 'transfer(s)');

// One replica restarts, then a SECOND arrives 8 seconds later -- outside the 5s window.
const spreadArrivals: ReplicaArrival[] = [
  { name: 'replica-a', arrivesAtMs: 0 },
  { name: 'replica-b', arrivesAtMs: 8000 },
];
console.log('Diskless (5s delay), spread arrivals:', countTransfersNeeded(spreadArrivals, true, 5000), 'transfer(s)');
// Disk-based, 3 close arrivals: 1 transfer(s)
// Diskless (5s delay), 3 close arrivals: 1 transfer(s)
// Diskless (5s delay), spread arrivals: 2 transfer(s)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets <code>repl-diskless-sync-delay</code> to <code>0</code>, reasoning "we want replicas synced as fast as possible, no artificial delay." Three replicas are expected to reconnect within 2 seconds of each other after a network blip. What actually happens to the number of full-sync transfers needed, compared to leaving the delay at its 5-second default?',
    hint: 'A delay of 0 means the master starts transferring the instant the FIRST replica connects — trace what that does to the batching window for the other two.',
    solution: `With the delay set to 0, the master starts the diskless transfer immediately when the first replica connects, with no window open for the other two to join. Since diskless transfers cannot admit new replicas once started, the second and third replicas (arriving even a few hundred milliseconds later) each miss the in-flight transfer and must wait for their OWN separate transfers -- producing 3 total transfers instead of 1, exactly the opposite of what "sync as fast as possible" was meant to achieve for the fleet as a whole.

The individual FIRST replica does get synced marginally faster (no 5-second wait), but the other two now each pay for a full, separate RDB generation-and-transfer cycle -- worse for total master load and total time-to-fully-synced-fleet than accepting the small delay would have been. This is exactly why the main page's own theory bullet frames the delay as "hoping multiple replicas will arrive" rather than a pure inefficiency to eliminate.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Diskless replication is strictly better than disk-based replication, which is why it became the Redis 7.0+ default — there\'s no real tradeoff."',
      reality: 'Diskless sync trades one limitation (no disk I/O on the master during sync, faster on slow disks) for a different one (no serving late-arriving replicas from an already-completed transfer) — verified above, disk-based sync always needs exactly ONE transfer regardless of arrival spread, while diskless sync can need several if replicas arrive outside the batching window. It became the default because slow-disk/fast-network is the more common modern deployment shape, not because it eliminates every tradeoff.',
    },
    {
      thought: '"repl-diskless-sync-delay only matters for the very first replica connecting to a brand-new master — it\'s irrelevant once a cluster is already running normally."',
      reality: 'It matters any time multiple replicas need a fresh full sync around the same moment — a rolling restart of several replicas, a network partition that drops several replicas at once and they all reconnect together, or scaling up by adding several new replicas simultaneously are all completely ordinary operational events where this delay\'s batching effect applies.',
    },
  ];

  topicLabel = 'Replication & Sentinel';
  topicRoute = '/redis/replication-sentinel';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'Sentinel’s Replica-Selection Tiebreaker, Implemented',
    route: '/redis/replication-sentinel/sentinel-replica-selection-tiebreaker-implemented',
  };
}
