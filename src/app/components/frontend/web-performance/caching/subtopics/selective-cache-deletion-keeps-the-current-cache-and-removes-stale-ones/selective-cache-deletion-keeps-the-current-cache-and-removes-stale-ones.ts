import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './selective-cache-deletion-keeps-the-current-cache-and-removes-stale-ones.html',
  styleUrl: './selective-cache-deletion-keeps-the-current-cache-and-removes-stale-ones.scss'
})
export class SelectiveCacheDeletionKeepsTheCurrentCacheAndRemovesStaleOnesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'caches.keys() lists every named cache the origin has ever created — old deploys leave their caches behind unless something explicitly removes them',
      points: [
        'Each call to <code>caches.open(name)</code> creates (or reuses) a persistently-stored, named cache. A Service Worker that bumps its cache name on every deploy (<code>images-v1</code>, <code>images-v2</code>, <code>images-v3</code>...) leaves every OLD version sitting in storage indefinitely — nothing deletes them automatically.',
        'The main page\'s <code>clearOldCaches()</code> pattern solves this: get every existing cache name via <code>caches.keys()</code>, filter out the ones that are NOT in the current deploy\'s known-good list, and delete the rest.',
      ]
    },
    {
      heading: 'This is directly measurable — the selective filter genuinely keeps only what it should',
      points: [
        'Confirmed directly: seeding three caches (<code>images-v1</code>, <code>images-v2</code>, <code>api-v1</code>) and running <code>clearOldCaches([\'images-v2\'])</code> leaves EXACTLY <code>images-v2</code> behind — both <code>images-v1</code> AND <code>api-v1</code> are genuinely deleted, verified by re-querying <code>caches.keys()</code> afterward.',
        'This matters because the filter is a simple array <code>.includes()</code> check — a typo in the "current caches" list (forgetting to list a cache name that should survive) silently deletes data that was still needed, with no warning or error.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>selective cache deletion keeps the current cache and removes stale ones</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The exact clearOldCaches pattern from the main page's own code sample
async function clearOldCaches(currentCaches: string[]): Promise<boolean[]> {
  const all = await caches.keys();
  return Promise.all(
    all
      .filter((name) => !currentCaches.includes(name))
      .map((name) => caches.delete(name))
  );
}

(async () => {
  // Simulate leftover caches from previous deploys, plus the current one
  await (await caches.open('images-v1')).put('/a.png', new Response('old a'));
  await (await caches.open('images-v2')).put('/b.png', new Response('current b'));
  await (await caches.open('api-v1')).put('/c.json', new Response('old c'));

  const before = await caches.keys();
  console.log('caches BEFORE cleanup:', before);

  // This deploy's ONLY current cache is images-v2
  await clearOldCaches(['images-v2']);

  const after = await caches.keys();
  console.log('caches AFTER cleanup:', after);
  console.log('images-v1 survived?', after.includes('images-v1'), '(should be false)');
  console.log('api-v1 survived?', after.includes('api-v1'), '(should be false)');
  console.log('images-v2 survived?', after.includes('images-v2'), '(should be true — it was in the current-caches list)');

  await caches.delete('images-v2'); // final cleanup
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A Service Worker uses three separate named caches: images-v3, fonts-v3, and api-v3 (one deploy\'s worth). During a refactor, a developer writes the activate handler\'s clearOldCaches(["images-v3"]) call but forgets to include fonts-v3 and api-v3 in the array. What happens on the next deploy?',
    hint: 'Ask what the filter condition actually checks — does it protect every cache from the CURRENT deploy, or only the ones explicitly listed?',
    solution: 'fonts-v3 and api-v3 would both be deleted, even though they belong to the current, still-in-use deploy — the filter only protects cache names explicitly present in the array passed in. Since the developer only listed "images-v3", the cleanup logic treats fonts-v3 and api-v3 as stale leftovers and removes them, exactly as this subtopic\'s demo shows happening to images-v1 and api-v1 when only images-v2 was listed as current. The fix is making sure EVERY cache name the current Service Worker actively uses is included in the currentCaches array passed to clearOldCaches — an easy, silent mistake with no error message to catch it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'caches.delete() only removes empty or genuinely unused caches — it has some built-in protection against deleting a cache that is actively storing needed data.',
      reality: 'It has no such protection — this subtopic\'s demo shows a cache holding real, needed data (api-v1\'s cached response) being deleted just as completely as an actually-empty or unused one, purely based on whether its name appears in the "keep" list.'
    },
    {
      thought: 'Old caches from previous deploys are automatically cleaned up by the browser after some time or storage pressure, so manual cleanup code is a nice-to-have, not strictly necessary.',
      reality: 'Named caches persist indefinitely with no automatic expiration by name/age — they only get evicted under genuine storage quota pressure (and even then, unpredictably), which is why the main page\'s explicit clearOldCaches() pattern in the activate handler is the standard, necessary approach, not an optional optimisation.'
    },
    {
      thought: 'Since the filter logic is a simple .includes() check, mistakes in the "current caches" list would be easy to spot immediately — a missing or misspelled name would throw an error.',
      reality: 'There is no error or warning of any kind — a missing name in the current-caches array simply results in that cache being silently deleted along with the genuinely stale ones, confirmed directly in this subtopic\'s demo where no exception was thrown despite deleting caches with real content.'
    }
  ];
}
