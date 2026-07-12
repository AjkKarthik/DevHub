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
  templateUrl: './reading-chunk-by-chunk-beats-waiting-for-the-full-response.html',
  styleUrl: './reading-chunk-by-chunk-beats-waiting-for-the-full-response.scss'
})
export class ReadingChunkByChunkBeatsWaitingForTheFullResponseSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'How you consume a stream determines whether you actually get the streaming benefit — or throw it away',
      points: [
        'A <code>ReadableStream</code> can be consumed two genuinely different ways: reading it chunk-by-chunk as pieces arrive (via <code>reader.read()</code> in a loop), or collecting the WHOLE thing into one value before doing anything with it (e.g. <code>await new Response(stream).text()</code>).',
        'Both approaches eventually see the same bytes — but they differ completely in WHEN the caller gets access to the early data. Reading chunk-by-chunk hands you the first chunk the moment it exists; collecting the full text makes you wait for the LAST chunk before you get anything at all.',
      ]
    },
    {
      heading: 'Confirmed directly — chunk-by-chunk reading returns the first chunk immediately, while waiting for the full text blocks for the entire duration',
      points: [
        'Against the identical underlying stream (a shell chunk immediately, then two data-dependent chunks after real delays), reading with <code>reader.read()</code> got the FIRST chunk at +0ms, while <code>await new Response(stream).text()</code> on a separate instance of the exact same stream did not resolve until +1020ms — the full time needed for every chunk to finish.',
        'This is the literal client-side reason streaming SSR has a performance advantage in a browser rendering a response body: a browser parsing a streamed HTTP response behaves like the chunk-by-chunk reader — it can act on early bytes immediately — while any code path that waits for a complete response before touching it (e.g. <code>res.send()</code> with a fully-built string on the server, or client code that awaits <code>response.text()</code>) forfeits that advantage entirely, even if the underlying transport was technically capable of streaming.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>reading chunk-by-chunk beats waiting for the full response</title>
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
      content: `// A factory so we can build two independent, identical streams —
// one for the chunk-by-chunk reader, one for the "wait for everything" approach.
function makeStream(): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      controller.enqueue(new TextEncoder().encode('shell '));
      await new Promise((r) => setTimeout(r, 300));
      controller.enqueue(new TextEncoder().encode('fast-section '));
      await new Promise((r) => setTimeout(r, 720));
      controller.enqueue(new TextEncoder().encode('slow-section'));
      controller.close();
    },
  });
}

(async () => {
  // Approach 1: read chunk-by-chunk as data arrives
  const chunkStart = performance.now();
  const reader = makeStream().getReader();
  const { value: firstChunk } = await reader.read();
  const firstChunkElapsed = Math.round(performance.now() - chunkStart);
  console.log(\`chunk-by-chunk: first chunk ("\${new TextDecoder().decode(firstChunk)}") available at +\${firstChunkElapsed}ms\`);
  // drain the rest so the stream finishes cleanly
  while (!(await reader.read()).done) {}

  // Approach 2: wait for the ENTIRE stream to finish before touching anything
  const fullStart = performance.now();
  const fullText = await new Response(makeStream()).text();
  const fullElapsed = Math.round(performance.now() - fullStart);
  console.log(\`wait-for-everything: full text ("\${fullText}") available at +\${fullElapsed}ms\`);

  console.log('---');
  console.log(\`chunk-by-chunk got useful data \${fullElapsed - firstChunkElapsed}ms earlier than the wait-for-everything approach, against the IDENTICAL underlying stream.\`);
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team migrates their Express server from res.send(fullyBuiltHtmlString) to a streaming renderToPipeableStream() call — but their reverse proxy in front of the app has response buffering enabled, so it still collects the entire response before forwarding it to the browser. Do users see any streaming benefit?',
    hint: 'Think about this subtopic\'s "wait for everything" approach — does it matter that the STREAM itself was capable of delivering early chunks, if something downstream chooses to wait for all of it anyway?',
    solution: 'No — users see no streaming benefit at all in this setup. This subtopic\'s demo proves the benefit comes specifically from consuming a stream chunk-by-chunk as data arrives; the exact same underlying stream, consumed by something that waits for the full response before acting (the "wait-for-everything" approach), took the full duration regardless of the stream being technically capable of delivering data earlier. A buffering reverse proxy does precisely this: it acts like the response.text() consumer, holding every chunk until the last one arrives before forwarding anything downstream — so the browser never sees early bytes, even though the origin server genuinely streamed them. The fix has to happen at every hop in the chain (server, proxy, CDN) — streaming code alone is not sufficient if anything in front of it buffers the full response.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'As long as the server code technically streams its response (e.g. calling res.write() multiple times), the performance benefit is guaranteed regardless of how the client or any intermediary consumes it.',
      reality: 'This subtopic\'s demo proves the benefit depends entirely on the CONSUMPTION pattern — the identical stream produced a genuinely early first chunk when read chunk-by-chunk, but the same stream collected via response.text() took the full duration, confirming a streaming producer can still be fully negated by a buffering consumer.'
    },
    {
      thought: 'Reading chunk-by-chunk is just a more complicated way to get the same data — since you still eventually have all the bytes, there is no real difference from just awaiting the full text.',
      reality: 'The BYTES are the same, but the real, measured TIMING to first access differs completely — confirmed directly: +0ms for the first chunk via chunk-by-chunk reading versus +1020ms waiting for the identical stream\'s full text, a difference that is exactly what a browser exploits when it parses and paints an HTML response as bytes arrive.'
    },
    {
      thought: 'The performance difference between chunk-by-chunk reading and waiting for the full response would only be measurable for very large responses (megabytes of data), not something that matters for typical HTML page sizes.',
      reality: 'The measured difference in this subtopic\'s demo came entirely from TIMING GAPS between chunks becoming ready (server-side work like data fetching), not from raw byte size — a small, simple HTML page can still have a large gap between its shell and a slow, data-dependent section, which is exactly the scenario streaming SSR is designed to address.'
    }
  ];
}
