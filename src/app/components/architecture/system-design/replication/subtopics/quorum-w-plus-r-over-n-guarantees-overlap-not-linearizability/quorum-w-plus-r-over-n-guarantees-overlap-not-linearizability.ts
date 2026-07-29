import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './quorum-w-plus-r-over-n-guarantees-overlap-not-linearizability.html',
  styleUrl: './quorum-w-plus-r-over-n-guarantees-overlap-not-linearizability.scss'
})
export class QuorumWPlusROverNGuaranteesOverlapNotLinearizabilitySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A formula the main page (and most system design material) states as an unqualified guarantee',
      points: [
        'The main page states: "With N=3: W=2, R=2 → strongly consistent." This is the standard way the quorum formula gets taught — and it is a useful approximation, but "strongly consistent" (usually meaning linearizable — every operation appears to take effect atomically at some point between its start and end) is a stronger claim than W+R>N actually guarantees on its own. The page has been tightened to note the caveat.',
        'This distinction is drawn directly from the same reasoning Kleppmann\'s "Designing Data-Intensive Applications" uses to caution readers against treating quorum overlap as a synonym for full linearizability — a well-established point in the distributed systems literature, not a fringe technicality.',
      ]
    },
    {
      heading: 'Where the guarantee actually holds — and where it quietly breaks',
      points: [
        'Under IDEAL conditions — writes and reads always land on the exact W and R nodes the quorum expects, and no operations overlap in time — W+R>N does guarantee that the read set and write set share at least one node, so a read will see the latest acknowledged write.',
        'Sloppy quorums break this: if a designated node is temporarily unreachable during a write, some systems (Dynamo-style, including Cassandra with certain configurations) write to a DIFFERENT, non-designated node instead (hinted handoff) to keep availability high. When that happens, the W nodes and the R nodes are no longer guaranteed to overlap at all — the write may have landed somewhere the read set never checks.',
        'Concurrent writes break it too: if two writes happen at nearly the same time, it is genuinely ambiguous which one "happened first." Resolving this with last-write-wins (comparing timestamps) can silently lose the losing write due to ordinary clock skew between nodes — a real, well-documented failure mode, not a hypothetical edge case.',
        'Concurrent read-during-write is a third gap: if a read overlaps in time with an in-flight write, different replicas in the read set may return different values (some updated, some not) — the read may return either the old or the new value, and the client generally cannot tell which.',
      ]
    },
    {
      heading: 'Why "close to linearizable" is still the right practical framing',
      points: [
        'None of this means quorum reads/writes are useless or that the main page\'s original framing was a big mistake — under NORMAL operation (no node failures, no sloppy quorums, writes reasonably spaced apart), W+R>N genuinely does behave close enough to strongly consistent for most practical purposes, which is exactly why the pattern is so widely used (Cassandra, Riak, and the original Dynamo paper all rely on it).',
        'The precision worth adding is knowing WHEN the guarantee can break — sloppy quorums during network partitions, concurrent writes to the same key, and reads racing an in-flight write — so a team can decide whether those specific edge cases matter for their workload (e.g. a shopping cart may tolerate this; a bank balance may not).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'When W+R>N holds vs. when it quietly breaks',
      language: 'typescript',
      code: `interface QuorumScenario {
  scenario: string;
  overlapGuaranteed: boolean;
  why: string;
}

const scenarios: QuorumScenario[] = [
  {
    scenario: 'Normal operation, no failures, writes not concurrent',
    overlapGuaranteed: true,
    why: 'W and R land on their designated nodes exactly as expected.',
  },
  {
    scenario: 'Sloppy quorum / hinted handoff during a network blip',
    overlapGuaranteed: false,
    why:
      'A write gets redirected to a non-designated node to preserve ' +
      'availability -- the read set never checks that node.',
  },
  {
    scenario: 'Two writes to the same key at nearly the same time',
    overlapGuaranteed: false, // in the sense of "which write is authoritative" being well-defined
    why:
      'Ambiguous ordering; last-write-wins resolution can silently ' +
      'lose the losing write if clocks are skewed between nodes.',
  },
  {
    scenario: 'A read races an in-flight write (overlapping in time)',
    overlapGuaranteed: false,
    why:
      'Different replicas in the read set may have applied the write ' +
      'at different times -- old or new value, client cannot tell which.',
  },
];

// "W + R > N" is a NECESSARY condition for overlap under ideal
// conditions -- it is not, by itself, a SUFFICIENT condition for
// linearizability once failures, sloppy quorums, or concurrency
// enter the picture.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team runs a Cassandra cluster with N=3, using QUORUM (W=2, R=2) for a "view count" feature, and assumes this makes every read strongly consistent because "2+2=4 > 3." During a brief network partition, one of the 3 nodes becomes temporarily unreachable. What can go wrong with their assumption?',
    hint: 'If the temporarily unreachable node was one of the 2 nodes a write "should" have gone to, what happens to that write under a sloppy-quorum configuration — and does the formula\'s overlap guarantee still hold once that happens?',
    solution: 'If the cluster uses sloppy quorums (common in Dynamo-style systems for availability), a write intended for the unreachable node gets redirected to a different, non-designated node instead (hinted handoff) so the write can still succeed with 2 ACKs. But this breaks the assumption baked into "2+2=4 > 3": that formula only guarantees overlap when writes land on their DESIGNATED nodes. With the write redirected elsewhere, a subsequent QUORUM read of the 2 designated nodes may miss it entirely, returning a stale view count — even though, on paper, W+R>N still holds numerically. The team\'s assumption ("the formula guarantees strong consistency") does not account for this specific, real failure mode that shows up specifically during node unavailability, which is exactly when sloppy quorums kick in.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Whenever W + R > N holds numerically (like 2+2=4 > 3), reads are guaranteed to see the latest write — full stop, under any conditions.',
      reality: 'Per this subtopic\'s theory, the overlap guarantee only holds under IDEAL conditions — no sloppy quorums, no concurrent writes to the same key, no reads racing an in-flight write. Real distributed systems regularly hit at least one of these conditions.'
    },
    {
      thought: 'Sloppy quorums (writing to a substitute node during a failure) are a rare edge case that essentially never happens in practice.',
      reality: 'Per this subtopic\'s theory, sloppy quorums exist specifically BECAUSE node unavailability (network blips, brief outages) is common enough that Dynamo-style systems trade some consistency for availability during exactly those moments — the scenario is a routine part of how these systems maintain uptime, not a rare corner case.'
    },
    {
      thought: 'Since W+R>N has documented caveats, quorum-based consistency is not meaningfully better than a much weaker consistency level like ONE.',
      reality: 'Per this subtopic\'s theory, under normal (non-failure, non-concurrent) operation, W+R>N genuinely does behave close to strongly consistent — the caveats matter specifically during failures or concurrent writes, which is different from the guarantee being worthless generally.'
    }
  ];
}
