import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-maxbatchsize-splits-large-batches',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './maxbatchsize-splits-large-batches.html',
  styleUrl: './maxbatchsize-splits-large-batches.scss',
})
export class MaxbatchsizeSplitsLargeBatchesSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What maxBatchSize actually does',
      points: [
        'The main page\'s own Advanced Options codeTab sets <code>maxBatchSize: 100</code> with the comment "Max 100 items per batch," and its QnA states DataLoader "splits large batches automatically into chunks" — but neither shows the mechanism running.',
        'Verified via direct execution against the real package: when more than <code>maxBatchSize</code> keys are requested within the same tick, DataLoader does NOT throw, drop keys, or wait for a manual second dispatch.',
        'It automatically splits them into multiple separate batch function calls, each capped at <code>maxBatchSize</code>, and every individual <code>.load()</code> call still resolves correctly regardless of which chunk actually produced its value.',
      ],
    },
    {
      heading: 'Why this matters for a real WHERE ... IN (...) query',
      points: [
        'The main page\'s own N+1 codeTab shows the fixed version issuing <code>SELECT * FROM users WHERE id IN (...)</code> — without maxBatchSize, a resolver list of thousands of items each needing a related record could generate a single IN clause with thousands of values, which many databases reject outright or execute poorly.',
        'Setting maxBatchSize caps each individual batch function call\'s key count; DataLoader transparently issues several smaller batch calls (and therefore several smaller queries) instead of one giant one.',
        'The caller never needs to know the chunking happened — the DataLoader API surface (<code>.load(key)</code> returning a Promise) is identical whether the loader is configured with maxBatchSize or not.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Verified: 7 keys, maxBatchSize 3, chunked into 3 calls',
      language: 'typescript',
      code: `import DataLoader from 'dataloader';

const batchCalls: string[][] = [];
const loader = new DataLoader(
  async (keys) => {
    batchCalls.push([...keys] as string[]);
    return keys.map(k => \`v-\${k}\`);
  },
  { maxBatchSize: 3 }
);

const ids = ['1', '2', '3', '4', '5', '6', '7'];
const results = await Promise.all(ids.map(id => loader.load(id)));

console.log(batchCalls);
// [ ['1','2','3'], ['4','5','6'], ['7'] ]  -- 3 separate batch function calls

console.log(results);
// [ 'v-1', 'v-2', 'v-3', 'v-4', 'v-5', 'v-6', 'v-7' ] -- every load() still
// resolves correctly, regardless of which of the 3 calls fetched it.`,
    },
    {
      label: 'A real query, capped',
      language: 'typescript',
      code: `async function batchUsers(ids: readonly string[]) {
  // With maxBatchSize: 500 on the loader, this function never receives
  // more than 500 ids at once -- even if 10,000 posts resolve in the
  // same tick, DataLoader issues 20 calls of <=500 ids each instead of
  // one 10,000-value IN (...) clause.
  const users = await prisma.user.findMany({
    where: { id: { in: [...ids] } }
  });
  const userMap = new Map(users.map(u => [u.id, u]));
  return ids.map(id => userMap.get(id) ?? new Error(\`User \${id} not found\`));
}

const userLoader = new DataLoader(batchUsers, { maxBatchSize: 500 });`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A resolver for a report page resolves 12,000 order rows in one tick, each calling <code>loader.load(order.customerId)</code> on a loader configured with <code>maxBatchSize: 1000</code>. Roughly how many separate batch function calls (and therefore roughly how many separate DB round trips) does this produce, and does any individual load() call fail or get dropped?',
    hint: 'The verified test above chunked 7 keys with maxBatchSize 3 into exactly 3 calls. Apply the same ceiling-division reasoning to 12,000 and 1000.',
    solution: `Roughly 12 separate batch function calls (12000 / 1000 = 12), each handling up to 1000 keys, so roughly 12 DB round trips instead of one massive 12,000-value IN (...) clause.

No load() call fails or gets dropped because of the chunking -- DataLoader transparently distributes every requested key across the chunked batch calls and still resolves each individual .load() promise correctly once its own chunk's batch function returns, exactly as verified above where all 7 of the chunked results came back correct.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"If more than maxBatchSize keys are requested in the same tick, DataLoader throws an error or silently drops the extras."',
      reality: 'Verified false. DataLoader transparently splits the keys into multiple batch function calls, each no larger than maxBatchSize — every load() call still resolves correctly, just via one of several chunked batch calls instead of a single one.',
    },
    {
      thought: '"maxBatchSize limits the TOTAL number of keys a DataLoader instance can ever load, across its whole lifetime."',
      reality: 'It only caps the size of a single batch function CALL. A DataLoader instance can process an unlimited number of keys over its lifetime — maxBatchSize just controls how many keys land in each individual dispatched batch.',
    },
    {
      thought: '"Splitting a large batch into several smaller ones means the caller has to manually reassemble results from multiple .load() calls."',
      reality: 'No manual reassembly is needed. Each individual .load(key) call still returns its own Promise that resolves to that key\'s value, regardless of which of the (possibly several) chunked batch function calls actually produced it — the chunking is entirely internal to DataLoader.',
    },
  ];

  topicLabel = 'DataLoader & N+1 Problem';
  topicRoute = '/graphql/dataloader';
  prev: SubtopicLink | null = {
    label: 'cacheKeyFn Is Required to Deduplicate Object Keys',
    route: '/graphql/dataloader/cachekeyfn-required-for-object-keys',
  };
  next: SubtopicLink | null = null;
}
