import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickRefComponent, QuickRefItem }         from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint }       from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab }             from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake }  from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge }      from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion }        from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem }              from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary }  from '../../../shared/revision-card/revision-card';
import { PageMetaComponent }                       from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent }                   from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-perf-inp',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './inp.html',
  styleUrl: './inp.scss',
})
export class PerfInp {

  quickRef: QuickRefItem[] = [
    { name: 'INP good threshold',    type: 'keyword', desc: '< 200 ms — measured as the worst interaction latency across the page visit' },
    { name: 'INP needs improvement', type: 'keyword', desc: '200–500 ms — visible delay; users notice' },
    { name: 'INP poor',              type: 'keyword', desc: '> 500 ms — page feels unresponsive; likely causes abandonment' },
    { name: 'Input delay',           type: 'syntax',  desc: 'Time from user gesture to event handler running — long tasks on main thread are the culprit' },
    { name: 'Processing time',       type: 'syntax',  desc: 'Time spent running event handlers — heavy JS work here raises INP' },
    { name: 'Presentation delay',    type: 'syntax',  desc: 'Time from handler done → browser paints update — forced style/layout adds delay' },
    { name: 'scheduler.yield()',     type: 'function', desc: 'Yields to the browser mid-task so pending input events can be processed' },
    { name: 'isInputPending()',      type: 'function', desc: 'navigator.scheduling.isInputPending() — check before yielding inside loops' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What INP measures',
      points: [
        'INP (Interaction to Next Paint) became a Core Web Vital in March 2024, replacing FID.',
        'Where FID only measured the FIRST interaction, INP tracks every click, tap, and key press and reports the WORST one.',
        'Formula: INP = input delay + processing time + presentation delay.',
        'Thresholds — good: < 200 ms; needs improvement: 200–500 ms; poor: > 500 ms.',
        'Field-only metric — Chrome DevTools "Interactions" track shows per-interaction sub-part breakdown.',
      ],
    },
    {
      heading: 'Input delay — long tasks are the primary cause',
      points: [
        'Input delay is the gap between the user gesture and the browser calling the event handler.',
        'Any long task (> 50 ms) running on the main thread at gesture time becomes input delay.',
        'Common sources: large JS bundles at startup, third-party scripts, synchronous localStorage reads, framework hydration.',
        'Fix: break long tasks with scheduler.yield(), offload to Web Workers, defer non-critical JS.',
      ],
    },
    {
      heading: 'Processing time — expensive event handlers',
      points: [
        'Once the handler runs, expensive DOM mutation or synchronous layout queries inflate processing time.',
        'Reading offsetHeight/scrollTop AFTER writing DOM forces synchronous layout — each read-after-write costs extra.',
        'Debounce search inputs — fire expensive work only after 200 ms typing pause.',
        'Batch DOM writes before reads; use virtual scrolling for large lists.',
      ],
    },
    {
      heading: 'scheduler.yield() — breaking long tasks',
      points: [
        'scheduler.yield() (Chrome 115+) pauses the current task, lets pending input run, then resumes with user-visible priority.',
        'Pattern: if (i % 50 === 0) await scheduler.yield() inside loops — keeps each chunk < 50 ms.',
        'Fallback for older browsers: await new Promise(r => setTimeout(r, 0)) — but yields to ALL tasks, not just input.',
        'navigator.scheduling.isInputPending() lets you skip yields when no input is queued, improving throughput.',
      ],
    },
    {
      heading: 'Presentation delay — paint back-pressure',
      points: [
        'After the handler finishes, the browser recalculates style, layout, and paints the frame.',
        'Large DOM trees (> 1 500 nodes) make layout expensive; virtualise long lists.',
        'Animating layout-triggering properties (width, top) instead of transform/opacity forces layout on every frame.',
        'Fix: batch all DOM mutations before any layout reads; use transform/opacity for animations.',
      ],
    },
    {
      heading: 'Measuring INP in the field and lab',
      points: [
        'Field: web-vitals library onINP() — reports the worst interaction; send on visibilitychange/pagehide.',
        'Attribution build: attribution object reveals interactionType, inputDelay, processingDuration, presentationDelay, and target element.',
        'Lab: Chrome DevTools → Performance panel → "Interactions" track shows each interaction as a bar; hover for breakdown.',
        'Long tasks appear as red rectangles above the main thread track.',
        'Lighthouse "Interactions" audit provides a simulated INP score (may differ from field data).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Measure INP (web-vitals)',
      language: 'typescript',
      code: `import { onINP } from 'web-vitals/attribution';

onINP(({ value, rating, attribution }) => {
  const { interactionType, inputDelay, processingDuration, presentationDelay,
          interactionTargetElement } = attribution;

  console.log('INP:', value, 'ms (', rating, ')');
  console.log('Type:', interactionType);           // 'pointer' | 'keyboard'
  console.log('Input delay:', inputDelay, 'ms');
  console.log('Processing:', processingDuration, 'ms');
  console.log('Presentation:', presentationDelay, 'ms');
  console.log('Target:', interactionTargetElement);

  // Send to analytics on page hide
  navigator.sendBeacon('/analytics', JSON.stringify({
    metric: 'INP', value, rating, inputDelay, processingDuration, presentationDelay,
  }));
}, { reportAllChanges: true });  // fire on every interaction, not just worst`,
    },
    {
      label: 'scheduler.yield() pattern',
      language: 'typescript',
      code: `// Break a long loop into yielding chunks
async function buildLargeList(data) {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < data.length; i++) {
    const li = document.createElement('li');
    li.textContent = data[i].name;
    fragment.appendChild(li);

    // Yield every 100 items so input events are handled mid-loop
    if (i % 100 === 0) {
      await scheduler.yield();  // Chrome 115+; polyfill: await new Promise(r => setTimeout(r, 0))
    }
  }

  document.querySelector('ul').appendChild(fragment);
}

// Polyfill for browsers without scheduler.yield
const yieldToMain = () =>
  'scheduler' in globalThis
    ? scheduler.yield()
    : new Promise(resolve => setTimeout(resolve, 0));`,
    },
    {
      label: 'Debounce search handler',
      language: 'typescript',
      code: `// Bad: fires expensive search on every keypress — kills INP on fast typists
input.addEventListener('input', () => {
  fetchSearchResults(input.value);  // network + DOM update on every keystroke
});

// Good: wait until typing pauses 200ms before doing expensive work
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const debouncedSearch = debounce(async (query) => {
  const results = await fetchSearchResults(query);
  renderResults(results);
}, 200);

input.addEventListener('input', () => debouncedSearch(input.value));`,
    },
    {
      label: 'Avoid forced layout (layout thrashing)',
      language: 'typescript',
      code: `// BAD: Read → Write → Read → Write interleaved forces layout each iteration
items.forEach(item => {
  const height = item.offsetHeight;     // READ  — layout computed
  item.style.height = height + 10 + 'px'; // WRITE — layout invalidated
  const width = item.offsetWidth;       // READ  — layout forced again
  item.style.width = width + 10 + 'px';   // WRITE
});

// GOOD: Batch all reads, then all writes
const heights = items.map(item => item.offsetHeight);  // all reads
const widths  = items.map(item => item.offsetWidth);   // all reads (one layout)

items.forEach((item, i) => {
  item.style.height = heights[i] + 10 + 'px';          // all writes
  item.style.width  = widths[i]  + 10 + 'px';
});
// Only ONE layout computation for the reads, zero forced layouts during writes`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Confusing INP with FID',
      wrong: '// FID = first interaction only; INP = worst across ALL interactions\nif (fid < 100) { /* page is responsive */ }',
      right: '// Check INP — it covers every click/tap/key during the visit\nonINP(({ rating }) => { if (rating !== "good") report(); });',
      explanation: 'FID (now retired) only measured the first interaction\'s input delay. INP measures all interactions and reports the worst — a page can have great FID but poor INP if later interactions are slow.',
    },
    {
      title: 'Blocking the main thread during initialisation',
      wrong: `// Synchronous parse of 5MB JSON on load = long task = high input delay
const data = JSON.parse(largeJsonString);
buildUI(data);`,
      right: `// Stream parse in a Worker; or defer to idle time
const worker = new Worker('json-parser.js');
worker.postMessage(largeJsonString);
worker.onmessage = ({ data }) => buildUI(data);`,
      explanation: 'If the main thread is busy parsing or evaluating JS when the user first clicks, that becomes input delay — often the largest INP component.',
    },
    {
      title: 'Reading layout properties after mutating DOM',
      wrong: `element.style.width = '200px';       // invalidates layout
const h = element.offsetHeight;      // forces synchronous layout — expensive`,
      right: `// Read all layout values BEFORE writing, or use ResizeObserver
const h = element.offsetHeight;      // read
element.style.width = '200px';       // write (no forced layout now)`,
      explanation: 'Reading layout-dependent properties (offsetHeight, getBoundingClientRect) after writing forces the browser to synchronously recompute layout, adding milliseconds to processing time.',
    },
    {
      title: 'Using setTimeout(fn, 0) instead of scheduler.yield()',
      wrong: `// setTimeout yields to ALL tasks — random tasks can jump the queue
await new Promise(r => setTimeout(r, 0));`,
      right: `// scheduler.yield() prioritises continuing this task over unrelated work
if ('scheduler' in globalThis) await scheduler.yield();
else await new Promise(r => setTimeout(r, 0)); // fallback`,
      explanation: 'setTimeout(fn, 0) yields to every queued task including ads and timers, potentially adding more delay. scheduler.yield() re-queues with "user-visible" priority so the continuation runs soon after input handling.',
    },
    {
      title: 'Not reporting INP on page hide',
      wrong: `// Fires too early — misses later interactions
onINP(({ value }) => sendToAnalytics(value));`,
      right: `// Use visibilitychange / pagehide to get the FINAL worst INP
onINP(({ value }) => {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendToAnalytics(value);
  }, { once: true });
});`,
      explanation: 'INP value can update throughout the visit as new worst interactions occur. Sending early captures an incomplete picture. The web-vitals library handles this automatically when you don\'t pass reportAllChanges.',
    },
    {
      title: 'Heavy third-party scripts inflating input delay',
      wrong: `<!-- Analytics + chat + ads all load eagerly, blocking main thread -->
<script src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXX"></script>
<script src="https://cdn.intercom.io/widget.js"></script>`,
      right: `<!-- Defer non-critical third-party scripts -->
<script defer src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXX"></script>
<!-- Load chat widget only when user scrolls down or clicks support -->`,
      explanation: 'Third-party scripts that parse and execute large bundles on load are a leading cause of long tasks and high input delay. Defer them or load on demand.',
    },
  ];

  challenge: Challenge = {
    title: 'Fix the sluggish button handler',
    language: 'html',
    description: `The button below has a click handler with THREE INP anti-patterns.
Identify and fix all three:

1. A synchronous 200ms loop that blocks the main thread
2. Layout thrashing (read → write interleaved)
3. A missing yield before updating the DOM

Rewrite the handler so clicking the button feels instant (< 50 ms processing time).`,
    hints: [
      'The loop runs 2 000 iterations synchronously — break it with scheduler.yield()',
      'Reading element.offsetHeight after writing triggers forced layout — separate reads from writes',
      'After the loop, yield once more before applying the final DOM update',
    ],
    starterCode: `const btn = document.getElementById('process-btn');
const items = document.querySelectorAll('.item');

btn.addEventListener('click', () => {
  // Anti-pattern 1: synchronous blocking loop
  let sum = 0;
  for (let i = 0; i < 2000; i++) sum += heavyCalc(i);

  // Anti-pattern 2: layout thrashing
  items.forEach(el => {
    el.style.opacity = '0.5';                  // write
    const h = el.offsetHeight;                 // read — forces layout
    el.style.height = (h - 10) + 'px';         // write
  });

  // Anti-pattern 3: no yield before DOM update
  document.querySelector('#total').textContent = sum;
});`,
    solution: `const btn = document.getElementById('process-btn');
const items = document.querySelectorAll('.item');

const yieldToMain = () =>
  'scheduler' in globalThis ? scheduler.yield() : new Promise(r => setTimeout(r, 0));

btn.addEventListener('click', async () => {
  // Fix 1: break the loop with yields every 200 iterations
  let sum = 0;
  for (let i = 0; i < 2000; i++) {
    sum += heavyCalc(i);
    if (i % 200 === 0) await yieldToMain();
  }

  // Fix 2: batch reads first, then writes (no layout thrashing)
  const heights = [...items].map(el => el.offsetHeight);  // all reads
  items.forEach((el, i) => {
    el.style.opacity = '0.5';
    el.style.height = (heights[i] - 10) + 'px';           // write uses cached value
  });

  // Fix 3: yield before final DOM update so browser can handle any pending paint
  await yieldToMain();
  document.querySelector('#total').textContent = sum;
});`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'INP replaced which earlier Core Web Vital in March 2024?',
      options: ['FCP', 'FID', 'TTFB', 'TBT'],
      answer: 1,
      explanation: 'INP replaced FID (First Input Delay). FID only measured the first interaction\'s input delay; INP tracks every interaction and reports the worst.',
    },
    {
      q: 'What is the "good" INP threshold?',
      options: ['< 100 ms', '< 200 ms', '< 500 ms', '< 1 000 ms'],
      answer: 1,
      explanation: 'INP < 200 ms is "good". 200–500 ms is "needs improvement". > 500 ms is "poor".',
    },
    {
      q: 'Which of the three INP sub-parts is caused by long tasks running at the moment of a user gesture?',
      options: ['Processing time', 'Presentation delay', 'Input delay', 'TTFB'],
      answer: 2,
      explanation: 'Input delay is the gap between the gesture and the event handler starting. It occurs when a long task is already running on the main thread.',
    },
    {
      q: 'What does scheduler.yield() do that setTimeout(fn, 0) does NOT?',
      options: [
        'Runs on a separate thread',
        'Re-queues the continuation with user-visible priority, ahead of unrelated tasks',
        'Cancels the current task entirely',
        'Pauses the garbage collector',
      ],
      answer: 1,
      explanation: 'scheduler.yield() re-queues the continuation as a user-visible task, so it resumes promptly after input handling. setTimeout(fn, 0) yields to all tasks in the queue without priority.',
    },
    {
      q: 'Layout thrashing occurs when you:',
      options: [
        'Use transform and opacity together',
        'Call requestAnimationFrame inside a loop',
        'Interleave DOM writes and layout reads, forcing repeated synchronous layouts',
        'Load CSS asynchronously',
      ],
      answer: 2,
      explanation: 'Writing to DOM then immediately reading a layout property (offsetHeight, getBoundingClientRect) forces the browser to flush pending style/layout changes synchronously before returning the value. Repeated write-read-write cycles multiply the cost.',
    },
    {
      q: 'What is the purpose of scheduler.yield() for improving INP?',
      options: ['It pauses the event loop permanently', 'It yields control back to the browser mid-task so pending renders and other interactions can be processed', 'It schedules work on a Web Worker', 'It batches DOM updates'],
      answer: 1,
      explanation: 'scheduler.yield() is a Promise-based API that pauses the current task and returns control to the browser — allowing it to process any pending user interactions (paint frame, other events) before resuming. Unlike setTimeout(0), it has higher priority and resumes in the correct task origin. Use it to break up long event handlers that would otherwise block INP.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why does INP report the worst interaction rather than the average?',
      a: 'Because a single bad interaction destroys the user\'s trust in the page — even if 95% of interactions are fast, the one painful click they remember. Reporting the worst (with 98th-percentile trimming for long sessions) surfaces the real pain point.',
    },
    {
      q: 'How do I find which interaction is causing poor INP in the field?',
      a: 'Use the web-vitals library with attribution enabled: the attribution object tells you the interactionType, the target element selector, and the split between input delay/processing/presentation. Log this to your analytics to identify the worst offenders by page and element.',
    },
    {
      q: 'Can a React or Angular SPA have good INP despite heavy re-renders?',
      a: 'Yes, with care. Use concurrent rendering (React\'s startTransition / Angular Signals\'s fine-grained reactivity) to yield during renders, virtualise long lists, debounce expensive updates, and defer non-critical state updates to after the user sees the first paint.',
    },
    {
      q: 'Does INP include hover events?',
      a: 'No. INP only tracks discrete interactions: clicks, taps, and key presses. Hover/mousemove events are excluded because they fire continuously and are not discrete user intentions.',
    },
    {
      q: 'What is the 98th-percentile trimming rule for long sessions?',
      a: 'For sessions with many interactions, Chrome uses the 98th percentile rather than the absolute worst to avoid outliers from accidental clicks or background tab activity inflating the score.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'INP measures the worst interaction delay (input delay + processing + presentation) — target < 200 ms by eliminating long tasks and layout thrashing.',
    mustKnow: [
      'INP = input delay + processing time + presentation delay',
      'Good < 200 ms; needs improvement 200–500 ms; poor > 500 ms',
      'INP replaced FID in March 2024 — it covers ALL interactions, not just first',
      'Long tasks (> 50 ms) cause input delay — break with scheduler.yield()',
      'Interleaved DOM reads/writes (layout thrashing) inflate processing time',
      'Report final INP value on visibilitychange / pagehide',
    ],
    interviewFocus: [
      'Explain the three sub-parts of INP and which is hardest to fix',
      'How does scheduler.yield() differ from setTimeout(fn, 0)?',
      'What is layout thrashing and how do you prevent it?',
      'How would you debug a React SPA with poor INP?',
    ],
  };
}
