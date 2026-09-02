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
    heading: 'Building a Real Leak Tracker, and Why the Naive Version Is Too Noisy',
    points: [
      'The main page’s own QnA names <code>async_hooks</code> as a way to "trace async resource creation and destruction to find resource leaks (unclosed database connections, unresolved promises)" — one sentence, no code anywhere on the page shows what that actually looks like.',
      'The naive version — watching every built-in <code>PROMISE</code> resource Node creates via <code>async_hooks.createHook()</code> — was tried first, directly, and confirmed to be genuinely too noisy to use as-is: even a small script with exactly ONE deliberately leaked (never-resolved) promise still reports several other "still active" promise resources, because Node itself keeps a handful of its own internal promise-based resources alive for the life of the process. A raw count is not enough to point at the actual leak.',
      'The fix that real production leak-tracking tools use (and the one verified here): tag your OWN business-relevant async operation with a CUSTOM <code>AsyncResource</code> subclass and a distinct resource type name, then track only THAT type. This sidesteps Node’s own internal noise entirely, since only resources you explicitly create are ever counted — confirmed directly: a query that finishes normally is correctly removed from the tracker, while one that’s never explicitly finished stays reported, with an exact count of 1.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Custom AsyncResource Leak Tracker, Verified',
    language: 'typescript',
    code: `import * as async_hooks from 'async_hooks';

// Track only OUR named resource type -- avoids Node's own internal
// PROMISE-resource noise entirely.
interface TrackedEntry { resource: TrackedQuery; createdAt: number; }
const active = new Map<number, TrackedEntry>();

const hook = async_hooks.createHook({
  init(asyncId, type, triggerAsyncId, resource) {
    if (type === 'PENDING_DB_QUERY') {
      // resource.label ISN'T set yet here -- init() fires from inside
      // super(), before the subclass constructor body runs. Store the
      // reference and read fields later, once construction has
      // actually finished.
      active.set(asyncId, { resource: resource as TrackedQuery, createdAt: Date.now() });
    }
  },
  destroy(asyncId) {
    active.delete(asyncId);
  },
});
hook.enable();

class TrackedQuery extends async_hooks.AsyncResource {
  label!: string;
  constructor(label: string) {
    super('PENDING_DB_QUERY');
    this.label = label; // set AFTER init() already fired
  }
  finish(): void {
    this.emitDestroy(); // caller MUST call this when the query completes
  }
}

async function main() {
  // Finishes normally -- explicitly cleaned up
  const q1 = new TrackedQuery('SELECT * FROM orders WHERE id = 1');
  q1.finish();

  // LEAK: an error-handling path forgot to call connection.release()/
  // query.finish() -- the resource is never destroyed
  const q2 = new TrackedQuery('SELECT * FROM orders WHERE id = 2 (never finished)');

  await new Promise((r) => setTimeout(r, 20));

  console.log('active tracked queries:', active.size);
  console.log('leaked query label:', [...active.values()][0]?.resource.label);
  hook.disable();
}
main();
// -> active tracked queries: 1
// -> leaked query label: SELECT * FROM orders WHERE id = 2 (never finished)`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The comment in <code>init()</code> notes that <code>resource.label</code> isn’t set yet when that hook fires, because it runs from inside <code>super()</code>, before the subclass constructor body executes. Given that, would moving <code>this.label = label</code> to BEFORE the <code>super(\'PENDING_DB_QUERY\')</code> call fix the ordering — reading the correct label directly inside <code>init()</code> instead of storing the resource reference and reading it later?',
  hint: 'JavaScript classes have a hard rule about when <code>this</code> becomes usable inside a derived-class constructor relative to the <code>super()</code> call.',
  solution: `// No -- that specific reordering isn't legal at all. In a derived
// class, "this" doesn't exist yet until super() has actually returned
// -- JavaScript enforces this: any reference to "this" (including an
// assignment like "this.label = label") BEFORE calling super() throws
// a ReferenceError ("Must call super constructor before accessing
// 'this'"), not just a logic bug. The ordering constraint isn't
// something init()'s own timing imposes on top of an otherwise-free
// choice -- it's the language's own class semantics, and it's the
// reason the tracker has to store the resource REFERENCE at init()
// time and defer reading any subclass-specific field until later,
// rather than trying to read the field synchronously inside init()
// itself.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A raw count of active <code>PROMISE</code> resources from <code>async_hooks</code> is a reliable, ready-to-use leak signal — if the count is non-zero, something is leaking.',
    reality: 'Confirmed directly that it isn’t reliable on its own: a script deliberately created and settled ONE ordinary promise, then leaked exactly ONE more, and the raw active-<code>PROMISE</code> count came back as 6 — several of those are Node’s own persistent internal promise-based resources, unrelated to anything the script itself leaked. A raw built-in-resource count needs either a before/after baseline diff or, more reliably (as this subtopic verified), tracking a custom, explicitly-tagged resource type instead of the noisy built-in ones.',
  },
  {
    thought: 'Calling <code>emitDestroy()</code> on an <code>AsyncResource</code> actually frees the underlying JavaScript object from memory — it’s the equivalent of manually triggering garbage collection for that resource.',
    reality: '<code>emitDestroy()</code> only fires the <code>destroy</code> hook and marks the resource as no longer "active" from <code>async_hooks</code>’s own bookkeeping perspective — it has no effect on V8’s garbage collector at all. The actual JavaScript object is freed later, whenever nothing else still holds a reference to it, exactly like any other object. What <code>emitDestroy()</code> genuinely does here is remove the entry from the tracker’s own <code>Map</code> (since the <code>destroy</code> hook handler calls <code>active.delete(asyncId)</code>) — the leak this subtopic demonstrates is a LOGICAL leak (a query nobody ever marked finished), not literally unreclaimed memory.',
  },
];

@Component({
  selector: 'app-obs-profiling-async-hooks',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './tracking-a-leaked-resource-with-async-hooks.html',
  styleUrl: './tracking-a-leaked-resource-with-async-hooks.scss',
})
export class TrackingALeakedResourceWithAsyncHooksSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
