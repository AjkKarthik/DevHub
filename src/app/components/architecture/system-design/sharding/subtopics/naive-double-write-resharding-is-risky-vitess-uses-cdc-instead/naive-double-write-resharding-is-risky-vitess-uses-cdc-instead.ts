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
  templateUrl: './naive-double-write-resharding-is-risky-vitess-uses-cdc-instead.html',
  styleUrl: './naive-double-write-resharding-is-risky-vitess-uses-cdc-instead.scss'
})
export class NaiveDoubleWriteReshardingIsRiskyVitessUsesCdcInsteadSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names a real technique, but glosses over its best-known failure mode',
      points: [
        'The main page\'s "Resharding" section describes zero-downtime resharding as: "double-write to old + new shard, backfill, verify, cutover." This names a real, commonly-taught pattern — but "double-write" (the application itself writing to both the old and new shard on every request) has a well-documented reliability problem that the one-line description never surfaces.',
        'Worth noting up front: this is the SAME company\'s tooling (Vitess) the main page cites elsewhere for automated resharding — so it is worth checking what Vitess itself actually does under the hood, rather than assuming the page\'s generic "double-write" description matches it.',
      ]
    },
    {
      heading: 'Why naive application-level dual writes are a known-risky migration pattern',
      points: [
        'The core problem: when application code issues two separate writes (old shard, then new shard) with no shared transaction across them, there is a real window where one write succeeds and the other fails — a crashed process, a network blip, or a timeout between the two calls leaves the old and new shard silently disagreeing about that row.',
        'This class of bug is well known enough in the industry to have a name — "the dual-write problem" — precisely because it is easy to implement, easy to test happily in a demo, and hard to catch in production, since the failure only shows up as scattered, hard-to-reproduce data drift rather than a loud error.',
        'The reliability fix used by mature migration tooling is to stop having the APPLICATION perform two writes at all, and instead have exactly ONE write happen (to the old/source shard, business as usual) with a separate process tailing that database\'s own transaction log (Change Data Capture, CDC) to propagate each committed change to the new shard — turning "two independent writes that can each fail separately" into "one write, plus a reliable replay of what actually committed."',
      ]
    },
    {
      heading: 'Confirmed: Vitess\'s own resharding tool does not use naive application dual writes at all',
      points: [
        'Vitess resharding is implemented via a component called VReplication, and specifically its VStreamer sub-component — which works by reading events directly from the source MySQL shard\'s own binary log (binlog), the same mechanism MySQL replication itself uses.',
        'This means Vitess\'s "zero-downtime reshard" is CDC-based, not a naive double-write: the application keeps writing to the OLD shard exactly as before (a single write path, no added failure mode at the write call site), while VReplication independently streams every committed binlog event to populate and keep the new shards continuously up to date until cutover.',
        'The main page\'s one-line "double-write" description is a reasonable SIMPLIFICATION of "keep both shards in sync during migration" as a concept — but taken literally as an implementation instruction, it points toward the less reliable of the two real approaches, not the one the very tool the page names (Vitess) actually uses.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Naive dual-write vs. CDC-based resharding',
      language: 'typescript',
      code: `// The risky pattern: application-level dual write
async function insertOrder(order: Order) {
  await oldShardDb.query('INSERT INTO orders ...', order);
  // If the process crashes / times out / network-partitions
  // RIGHT HERE, the new shard silently never gets this row --
  // no error is raised anywhere that surfaces the gap.
  await newShardDb.query('INSERT INTO orders ...', order);
}

// The safer pattern: single write path + CDC-based replication
async function insertOrder(order: Order) {
  // Only ONE write call, to the shard the app has always used.
  await oldShardDb.query('INSERT INTO orders ...', order);
  // A SEPARATE process (Vitess VReplication / Debezium / any
  // binlog-tailing CDC tool) independently reads the committed
  // transaction log and replays it to the new shard -- so a
  // crash right after the app's single write still leaves a
  // durable, committed change for CDC to pick up and forward.
}

// Vitess's real resharding flow (conceptually):
// 1. VReplication does a full initial COPY of existing rows
//    from source shard(s) to target shard(s).
// 2. VStreamer then tails the source shard's binlog, replaying
//    every new committed change to the target shard(s).
// 3. Once target shards are caught up and verified, traffic
//    cuts over -- the app never had to perform a second write.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team implements zero-downtime resharding by having every write endpoint call both the old shard and the new shard directly, one after another, in application code. During a deploy, a brief network blip causes some new-shard writes to fail silently (errors were logged but not alerted on). Weeks later, they discover the new shard is missing thousands of rows the old shard has. What structural choice caused this, and what would Vitess have done differently?',
    hint: 'How many independent points of failure exist between "the application decided to write this row" and "both shards actually have it" in each approach?',
    solution: 'The structural cause is the dual-write itself: two independent writes (old shard, new shard) with no shared transaction and no reconciliation mechanism means any failure between the two calls (crash, network blip, timeout) leaves the shards silently disagreeing, and nothing in that design detects or repairs the gap on its own — it just accumulates as drift until someone notices. Vitess\'s own resharding tool (VReplication/VStreamer) avoids this entirely by keeping the application\'s write path unchanged (a single write to the source shard) and using a separate process that tails the source shard\'s own binary log to reliably propagate every COMMITTED change to the new shard — since the binlog only contains changes that actually succeeded and durably committed, there is no equivalent "silent gap" window: a failure in the CDC pipeline can be retried by re-reading the log from where it left off, rather than requiring the original write to somehow happen twice.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s "double-write to old + new shard" description is literally how production-grade resharding tools like Vitess actually keep two shards in sync during migration.',
      reality: 'Per this subtopic\'s theory, Vitess\'s own resharding (VReplication/VStreamer) is CDC-based — it tails the source shard\'s binlog rather than having the application perform two separate writes. The main page\'s phrase is a reasonable high-level simplification, not a literal implementation description.'
    },
    {
      thought: 'Naive application-level dual writes are fine as long as both write calls are wrapped in a try/catch that logs errors.',
      reality: 'Per this subtopic\'s theory, logging an error after a partial failure does not repair the resulting inconsistency — the two shards are already out of sync, and without an active reconciliation mechanism, that drift accumulates silently rather than self-healing.'
    },
    {
      thought: 'CDC-based migration is only relevant for large, sophisticated companies — a smaller team\'s naive dual-write approach is an acceptable simplification.',
      reality: 'Per this subtopic\'s theory, the dual-write problem is a structural risk (a failure window between two independent writes), not a scale problem — it affects a two-shard migration just as much as it affects Vitess\'s own large-scale usage, which is exactly why Vitess itself does not use the naive approach.'
    }
  ];
}
