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
  templateUrl: './shard-doc-count-mismatch.html',
  styleUrl: './shard-doc-count-mismatch.scss'
})
export class ThirtyShardsDoesntDivideTo33mDocsPerShardSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A worked example whose division doesn\'t match its own numbers',
      points: [
        'The Challenge solution\'s "indexStructure" states: 500M docs, 30 primary shards, "~33M docs" per shard. 500,000,000 ÷ 30 = 16,666,667 — roughly 16.7M, not 33M. The page has been corrected.',
        'This is catchable with a calculator and nothing else — no Elasticsearch expertise required, just dividing the two numbers the page\'s own worked example already provides.',
      ]
    },
    {
      heading: 'A likely explanation for exactly this error: a storage figure mislabeled as a document count',
      points: [
        'The SAME worked example separately states the index totals 1 TB (500M docs × ~2KB each). Dividing storage instead of document count: 1 TB ÷ 30 shards ≈ 33 GB per shard — which is where "33" actually comes from.',
        'That 33 GB/shard figure is a real, useful number — it even fits neatly inside the page\'s own QnA recommendation elsewhere on the page ("targeting shard sizes of 10-50 GB each for optimal performance"). The error was writing "~33M docs" (a document count) when the calculation that produces 33 was actually measuring GB (a storage size) — two different units that happen to share the same leading number by coincidence of this example\'s specific inputs.',
        'The corrected version keeps BOTH true numbers separately: ~33 GB per shard (storage, fits the recommended range) AND ~16.7M docs per shard (document count, from 500M ÷ 30) — rather than conflating them into one wrong "33M docs" figure.',
      ]
    },
    {
      heading: 'Why checking a worked example\'s own arithmetic matters',
      points: [
        'A system design answer that states a document-count-per-shard figure is often used downstream to reason about per-shard memory, cache sizing, or query latency — a document count that\'s off by roughly 2x (16.7M actual vs. 33M stated) would propagate an inaccurate assumption into any of those follow-on calculations.',
        'Worked examples with concrete numbers are valuable specifically because they\'re checkable — a vague claim like "shard appropriately for scale" can\'t be verified, but "500M docs across 30 shards" invites (and rewards) a reader actually doing the division.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two different divisions, two different units',
      language: 'typescript',
      code: `interface ShardEstimate {
  metric: 'documents' | 'storage-GB';
  totalValue: number;
  shardCount: number;
  perShard: number;
}

function estimate(metric: 'documents' | 'storage-GB', total: number, shards: number): ShardEstimate {
  return { metric, totalValue: total, shardCount: shards, perShard: total / shards };
}

const totalDocs = 500_000_000;
const totalStorageGB = 1000; // 500M docs x ~2KB each = 1TB = 1000GB
const shardCount = 30;

const docEstimate = estimate('documents', totalDocs, shardCount);
console.log(docEstimate.perShard); // ~16,666,667 docs per shard

const storageEstimate = estimate('storage-GB', totalStorageGB, shardCount);
console.log(storageEstimate.perShard); // ~33.3 GB per shard

// The two results share a leading "33" purely by coincidence of
// THESE specific inputs (1000GB / 30 = 33.3) -- they are not the
// same quantity, and conflating them produces a wrong document count.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A system design solution states: "500M docs, 1 TB total index size, 30 primary shards -- each ~33M docs." Is the "~33M docs" figure correct? If not, where does the number 33 actually come from?',
    hint: 'Try dividing both the document count AND the storage size by 30 separately, and compare which one actually produces ~33.',
    solution: 'The "~33M docs" figure is incorrect -- 500,000,000 / 30 = ~16.7M docs per shard, not 33M. The number 33 actually comes from a DIFFERENT calculation: 1 TB (1000 GB) / 30 shards = ~33 GB per shard, a STORAGE size, not a document count. The two divisions happen to share the same leading digits purely by coincidence of this example\'s specific numbers (1000/30 and 500/30 both round to values starting with 1-3 in different units) -- but ~33 GB per shard and ~16.7M docs per shard are the two correct, distinct figures; "~33M docs" conflates a storage number with a document-count label.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'In a system design worked example, the exact numbers in a claim like "X shards, ~Y docs each" are usually illustrative round figures, not something worth checking precisely.',
      reality: 'Per this subtopic\'s theory, this specific figure was checkable with simple division against numbers stated earlier on the SAME page (500M docs, 30 shards) — and the stated answer (33M) was roughly 2x off from the correct one (16.7M), a large enough gap to matter if used for downstream capacity reasoning.'
    },
    {
      thought: 'A "33" appearing in both a storage estimate (33 GB/shard) and a document-count estimate (should be 16.7M, not 33M) for the same worked example is evidence the original figures are internally consistent.',
      reality: 'Per this subtopic\'s theory, the shared leading digit is coincidental to this specific example\'s numbers (1TB and 500M happen to both divide by 30 into values that could plausibly round to "33" in their respective units) — it is not evidence of consistency, and actually suggests the storage figure was likely mislabeled as a document count.'
    },
    {
      thought: 'Once a worked example states both a total quantity (500M docs) and a shard count (30), any "docs per shard" figure derived from those two numbers is guaranteed correct as long as the two input numbers themselves are accurate.',
      reality: 'Per this subtopic\'s theory, the two INPUT numbers (500M docs, 30 shards) were both accurate — the error was purely in the DIVISION/labeling step that combined them, producing a stated result (33M) that doesn\'t match what those correct inputs actually compute to (16.7M).'
    }
  ];
}
