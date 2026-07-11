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
  templateUrl: './quotaexceedederror-is-a-real-catchable-exception.html',
  styleUrl: './quotaexceedederror-is-a-real-catchable-exception.scss'
})
export class QuotaexceedederrorIsARealCatchableExceptionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'localStorage does NOT silently fail or truncate data when it runs out of room — it throws a real, catchable exception',
      points: [
        'Once a write would push a domain past its storage quota (typically 5-10 MB, varying by browser), <code>setItem()</code> throws a <code>DOMException</code> named <code>QuotaExceededError</code> — synchronously, on the exact call that pushes it over the limit.',
        'Nothing about this is silent: the write that would have exceeded quota does not happen at all, and every byte already stored before that call remains intact and unaffected.',
      ]
    },
    {
      heading: 'This means production code should treat every setItem() call as something that CAN throw — not something that can\'t',
      points: [
        'A try/catch specifically checking for <code>e.name === \'QuotaExceededError\'</code> (or the legacy numeric <code>e.code === 22</code> in older engines) lets an application respond gracefully — clearing old cached data, warning the user, or falling back to a smaller storage strategy — instead of crashing on an uncaught exception.',
        'This is especially important defensively in private/incognito mode, where several browsers impose a much smaller effective quota than normal browsing mode, making this exception far more likely to occur in practice than developers testing only in normal mode might expect.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>QuotaExceededError</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `localStorage.clear();

const chunk = 'x'.repeat(1024 * 1024); // 1 MB per write attempt
let writes = 0;
let caught: DOMException | null = null;

try {
  for (let i = 0; i < 50; i++) {
    localStorage.setItem('chunk-' + i, chunk);
    writes++;
  }
} catch (e) {
  caught = e as DOMException;
}

console.log('successful writes before quota was hit:', writes);
console.log('exception name:', caught?.name);
console.log('is it a real, catchable DOMException?', caught instanceof DOMException);

localStorage.clear();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A loop repeatedly calls <code>localStorage.setItem()</code> with ever-larger data, uncaught, until storage is full. What actually happens on the write that pushes it over quota?',
    hint: 'Compare this to the earlier subtopic about storing objects — that one silently produced wrong data with no error at all. Is running out of QUOTA the same kind of silent failure, or a different one?',
    solution: 'It throws a real <code>DOMException</code> named <code>QuotaExceededError</code>, synchronously, on that exact call — an uncaught version of this would crash the surrounding function. Every write before that point already succeeded and remains stored; nothing is silently truncated or lost.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When localStorage runs out of space, setItem() silently fails or truncates the data being written, similar to how storing an object silently produces "[object Object]".',
      reality: 'It does the opposite of silent — it throws a real, catchable <code>QuotaExceededError</code> DOMException. The write simply does not happen; nothing gets truncated or corrupted.'
    },
    {
      thought: 'QuotaExceededError is rare enough in practice that wrapping every setItem() call in try/catch is unnecessary defensive overkill.',
      reality: 'It\'s meaningfully more likely than developers testing only in normal browsing mode might expect — several browsers impose a much smaller effective quota in private/incognito mode specifically, making this a realistic production scenario, not just a theoretical edge case.'
    },
    {
      thought: 'Once QuotaExceededError is thrown once, all previously-stored data in localStorage for that origin is lost or becomes unreadable.',
      reality: 'Everything written successfully BEFORE the exception remains completely intact — the exception only prevents the ONE write call that would have exceeded the limit; it has no effect on data already stored.'
    }
  ];
}
