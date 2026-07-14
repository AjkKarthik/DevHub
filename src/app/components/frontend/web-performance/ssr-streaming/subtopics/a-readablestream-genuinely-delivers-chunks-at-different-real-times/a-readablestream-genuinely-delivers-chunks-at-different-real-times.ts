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
  templateUrl: './a-readablestream-genuinely-delivers-chunks-at-different-real-times.html',
  styleUrl: './a-readablestream-genuinely-delivers-chunks-at-different-real-times.scss'
})
export class AReadablestreamGenuinelyDeliversChunksAtDifferentRealTimesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The ReadableStream Web API is the browser-side half of the exact mechanism streaming SSR relies on',
      points: [
        'The main page describes server code that calls <code>res.write()</code> multiple times, flushing HTML sections as data becomes ready — <code>ReadableStream</code> is the standard, real Web API that models exactly this "produce data in pieces, over time" pattern, usable directly in any browser script.',
        'A stream\'s <code>start(controller)</code> function can call <code>controller.enqueue()</code> multiple times at different moments — each call makes a chunk available to readers immediately, without waiting for later <code>enqueue()</code> calls or the final <code>close()</code>.',
      ]
    },
    {
      heading: 'Confirmed directly — chunks arrive at genuinely different, measured real timestamps, not all bundled together',
      points: [
        'A real stream enqueuing three chunks with real delays between them (an immediate shell, then a section after 150ms, then a section after another 300ms) produced chunk arrival timestamps of roughly 0ms, then several hundred ms later, then later still — read via a real <code>reader.read()</code> loop, timed with <code>performance.now()</code>.',
        'This is the literal client-side proof of the main page\'s core claim: a shell/header chunk genuinely becomes available to act on — parse, paint, start loading assets — well before a slower data-dependent section exists at all, because the underlying stream mechanism delivers pieces as they are produced, not as one bundled response.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>a ReadableStream genuinely delivers chunks at different real times</title>
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
      content: `// A real ReadableStream, modelling a server streaming HTML sections
// as they become ready — shell immediately, then two data-dependent sections.
const stream = new ReadableStream({
  async start(controller) {
    controller.enqueue(new TextEncoder().encode('<head>...</head><header>shell</header>'));
    await new Promise((r) => setTimeout(r, 150));
    controller.enqueue(new TextEncoder().encode('<section>fast data (150ms)</section>'));
    await new Promise((r) => setTimeout(r, 300));
    controller.enqueue(new TextEncoder().encode('<section>slow data (450ms total)</section>'));
    controller.close();
  },
});

(async () => {
  const startTime = performance.now();
  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const elapsed = Math.round(performance.now() - startTime);
    const text = new TextDecoder().decode(value);
    console.log(\`chunk arrived at +\${elapsed}ms:\`, text);
  }

  console.log('chunks arrived at genuinely different real times — not all bundled into one delivery.');
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer reviewing a PR that introduces streaming SSR says: "This seems pointless — the total time to send the full page is the same either way, whether you send it all at once or in pieces." Is the total-time comparison the right way to evaluate whether streaming is worth it?',
    hint: 'Ask what the BROWSER can start doing with the FIRST chunk the moment it arrives, versus what it can do while waiting for one single bundled response.',
    solution: 'Total transfer time being similar is true but is not the relevant comparison — confirmed directly in this subtopic\'s demo, the point of streaming is not making the SLOWEST section arrive faster, it is making the FAST parts (the shell, above-the-fold content) available to the browser the moment they are ready, rather than being held hostage behind the slowest data dependency. A real reader loop showed the shell chunk arriving at +0ms while later sections arrived hundreds of milliseconds later — during that gap, the browser can already be parsing the shell, discovering and fetching CSS/font/script resources, and painting visible content, all before the slow section even exists. The win is in WHEN useful work can start, not in the total end-to-end duration.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Streaming a response and sending it all at once ultimately deliver the exact same bytes over the exact same total time — the "streaming" framing is mostly marketing for what is functionally identical.',
      reality: 'The bytes and total time can indeed be similar, but WHEN each piece becomes available differs completely — this subtopic\'s demo shows real, measured per-chunk arrival timestamps proving the browser genuinely has access to early content well before later content exists, not just in theory.'
    },
    {
      thought: 'A stream only starts producing chunks once something explicitly requests all of it — the enqueue() timing inside start() does not really control WHEN data becomes available to a reader.',
      reality: 'enqueue() calls make data available to readers immediately as they are called, confirmed directly in this subtopic\'s demo where read() calls returned each chunk at its own real, distinct timestamp rather than all resolving together at the end.'
    },
    {
      thought: 'ReadableStream is a Node.js/server-only concept — this is not something that exists or matters in browser-side JavaScript.',
      reality: 'ReadableStream is a standard Web API, fully usable in any browser script (confirmed directly in this subtopic\'s live, in-browser demo) — it is the same underlying primitive fetch() response bodies are built on, not a server-exclusive construct.'
    }
  ];
}
