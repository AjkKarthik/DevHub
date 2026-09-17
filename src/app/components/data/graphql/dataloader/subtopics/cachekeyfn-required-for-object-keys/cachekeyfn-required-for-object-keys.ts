import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-cachekeyfn-required-for-object-keys',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './cachekeyfn-required-for-object-keys.html',
  styleUrl: './cachekeyfn-required-for-object-keys.scss',
})
export class CachekeyfnRequiredForObjectKeysSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The default cacheKeyFn is the identity function',
      points: [
        'Verified directly against the installed <code>dataloader</code> package\'s own source: when no <code>cacheKeyFn</code> option is passed, the default is <code>key => key</code> — the exact same reference is used as the internal cache Map\'s key.',
        'JavaScript\'s built-in <code>Map</code> compares object keys by REFERENCE, not by structural equality. Two structurally-identical object literals created separately (e.g. a <code>{tenantId, userId}</code> pair rebuilt fresh inside each resolver call) are treated as two DIFFERENT keys.',
        'The main page\'s own QnA names the fix in one line ("use cacheKeyFn to customize how complex keys are compared... JSON.stringify as the cacheKeyFn") but never shows what actually breaks without it.',
      ],
    },
    {
      heading: 'What actually breaks without it',
      points: [
        'Verified via direct execution: loading two structurally-identical-but-separately-created objects with no <code>cacheKeyFn</code> sends BOTH into the batch function as separate entries — the batch function does redundant work for what is logically the same key.',
        'With <code>cacheKeyFn: key => JSON.stringify(key)</code>, the same two loads collapse into ONE batch entry, and both <code>.load()</code> calls resolve to the identical cached result.',
        'This is not just a performance nuance. For a batch function that has a real side effect per distinct key (which the main page\'s own theory raises as a possibility for write-batching), an un-deduplicated composite key means that side effect fires twice for one logical key.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without cacheKeyFn — NOT deduplicated',
      language: 'typescript',
      code: `import DataLoader from 'dataloader';

interface PermissionKey { tenantId: string; userId: string; }

const batchCalls: number[] = [];
const loader = new DataLoader<PermissionKey, boolean>(async (keys) => {
  batchCalls.push(keys.length);
  return keys.map(() => true);
});

// Two resolvers building the SAME logical key independently --
// completely realistic: neither resolver knows about the other's object.
const keyA: PermissionKey = { tenantId: 't1', userId: 'u1' };
const keyB: PermissionKey = { tenantId: 't1', userId: 'u1' }; // structurally equal, different reference

const [r1, r2] = await Promise.all([loader.load(keyA), loader.load(keyB)]);

console.log(batchCalls); // [ 2 ] -- both objects sent to the batch function separately`,
    },
    {
      label: 'With cacheKeyFn — deduplicated',
      language: 'typescript',
      code: `import DataLoader from 'dataloader';

interface PermissionKey { tenantId: string; userId: string; }

const batchCalls: number[] = [];
const loader = new DataLoader<PermissionKey, boolean>(
  async (keys) => {
    batchCalls.push(keys.length);
    return keys.map(() => true);
  },
  { cacheKeyFn: (key) => JSON.stringify(key) }
);

const keyC: PermissionKey = { tenantId: 't1', userId: 'u1' };
const keyD: PermissionKey = { tenantId: 't1', userId: 'u1' };

const [r3, r4] = await Promise.all([loader.load(keyC), loader.load(keyD)]);

console.log(batchCalls); // [ 1 ] -- one entry, both loads resolve the SAME cached result
console.log(r3 === r4);  // true`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A batch function for a "hasPermission" loader is keyed by <code>{tenantId, userId}</code> and has a real side effect — it increments a per-tenant rate-limit counter once per DISTINCT key it processes. Two resolvers in the same query independently build and load structurally-identical <code>{tenantId, userId}</code> objects, with no cacheKeyFn configured. What happens to the rate-limit counter?',
    hint: 'The batch function receives however many keys are in the batchCalls count shown above — trace what "batch size 2 for one logical key" means for a counter incremented once per key the batch function processes.',
    solution: `The counter is incremented TWICE for what is logically one distinct (tenantId, userId) pair, because without cacheKeyFn the two structurally-identical objects are treated as two separate keys and both get sent to the batch function.

The fix is the same cacheKeyFn shown above (or any function that maps the object to a stable primitive) -- it collapses both loads into a single batch entry, so the side-effecting batch function runs exactly once per logically distinct key, matching what "batching" is supposed to guarantee.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"DataLoader automatically figures out that two objects with the same properties represent the same key."',
      reality: 'Verified false. The default cacheKeyFn is the identity function, and the internal cache is a plain Map, which compares object keys by reference. Two separately-created objects with identical properties are two different keys unless you supply a cacheKeyFn.',
    },
    {
      thought: '"cacheKeyFn only affects the cross-request/cross-call CACHE — it has no effect on batching within a single tick."',
      reality: 'Verified false. cacheKeyFn\'s key is what both the within-tick batch AND the longer-lived cache use to decide whether two load() calls refer to the same thing. Without it, structurally-identical object keys are sent to the batch function as separate entries even in the SAME batch call.',
    },
    {
      thought: '"JSON.stringify is always a safe, general-purpose cacheKeyFn for object keys."',
      reality: 'JSON.stringify is order-sensitive for object property enumeration in some cases and silently drops undefined-valued properties — it works well for the simple, consistently-shaped keys shown here, but a key object with properties inserted in varying order, or optional fields, needs a more deliberate cacheKeyFn (e.g. sorting keys before stringifying) to stay reliable.',
    },
  ];

  topicLabel = 'DataLoader & N+1 Problem';
  topicRoute = '/graphql/dataloader';
  prev: SubtopicLink | null = {
    label: 'The Default Batch Scheduler Is a Microtask, Not a Bare process.nextTick',
    route: '/graphql/dataloader/default-scheduler-microtask-then-nexttick',
  };
  next: SubtopicLink | null = {
    label: 'maxBatchSize Splits One Tick Into Multiple Batch Calls',
    route: '/graphql/dataloader/maxbatchsize-splits-large-batches',
  };
}
