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
  templateUrl: './gzip-approximation-is-wildly-inaccurate.html',
  styleUrl: './gzip-approximation-is-wildly-inaccurate.scss'
})
export class GzipApproximationIsWildlyInaccurateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "Custom CI budget assertion" code sample approximates gzip size as raw size × 0.3',
      points: [
        'The code sample\'s own comment admits this: <code>// Use actual gzip for accuracy; approximation: file size × 0.3</code> — it is explicitly labeled a shortcut, not a claim of accuracy.',
        'Gzip compression ratio depends entirely on how REDUNDANT the content is — highly repetitive text (like minified JS with repeated tokens) compresses far better than 0.3×; high-entropy content (hashes, base64 images, already-compressed data) compresses far worse.',
      ]
    },
    {
      heading: 'Confirmed directly, using the browser\'s real CompressionStream(\'gzip\') API — the ×0.3 approximation was off by -60% in one direction and +1190% in the other',
      points: [
        'A repetitive, minified-JS-like sample (151,200 raw bytes of the same handful of function patterns repeated) real-gzipped down to just 3,516 bytes (a 0.023 compression ratio) — the ×0.3 approximation predicted 45,360 bytes, overstating the real size by roughly 12x (+1190% error).',
        'A high-entropy sample (60,000 bytes of genuinely random characters, simulating a base64 blob or hash-heavy payload) real-gzipped to 44,945 bytes (a 0.749 ratio, barely compressible) — the ×0.3 approximation predicted only 18,000 bytes, UNDERSTATING the real size by 60%.',
        'Both errors are dangerous in opposite ways: overstating size on repetitive code could fail a CI budget that should pass; understating size on high-entropy assets could pass a budget that should genuinely fail — exactly the kind of silent inaccuracy a real CI gate should not rely on.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>the size × 0.3 gzip approximation is wildly inaccurate</title>
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
      content: `// Compare the main page's own "file size × 0.3" gzip approximation against the browser's
// REAL CompressionStream('gzip') API, on two genuinely different kinds of content.
async function realGzipSize(text: string): Promise<number> {
  const bytes = new TextEncoder().encode(text);
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const compressed = await new Response(cs.readable).arrayBuffer();
  return compressed.byteLength;
}

(async () => {
  // Sample 1: repetitive, minified-JS-like text — lots of repeated tokens, typical of real bundles
  const minifiedJsLike = Array.from({ length: 3000 }, (_, i) =>
    \`function fn\${i % 50}(a,b){return a+b*\${i % 7};}var x\${i % 50}=fn\${i % 50}(1,2);\`
  ).join('');

  // Sample 2: high-entropy random text — simulates base64 image data or content hashes
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomLike = Array.from({ length: 60000 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

  for (const [label, text] of [['repetitive JS-like', minifiedJsLike], ['high-entropy random', randomLike]] as const) {
    const rawSize = new TextEncoder().encode(text).length;
    const realGzip = await realGzipSize(text);
    const approxGzip = Math.round(rawSize * 0.3);
    const errorPct = (((approxGzip - realGzip) / realGzip) * 100).toFixed(1);

    console.log(\`--- \${label} ---\`);
    console.log(\`raw size:          \${rawSize.toLocaleString()} bytes\`);
    console.log(\`REAL gzip size:    \${realGzip.toLocaleString()} bytes (ratio \${(realGzip / rawSize).toFixed(3)})\`);
    console.log(\`×0.3 approximation: \${approxGzip.toLocaleString()} bytes\`);
    console.log(\`approximation error: \${errorPct}%\`);
  }
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s CI budget script uses the main page\'s "size × 0.3" approximation to estimate gzip size. A PR that adds a large, highly repetitive generated CSS file (thousands of near-identical utility classes) fails the budget check. Based on this subtopic\'s measured result, is the failure necessarily a real regression?',
    hint: 'Think about which direction the approximation error goes for HIGHLY REPETITIVE content, specifically — this subtopic measured that exact case.',
    solution: 'Not necessarily — this subtopic\'s demo measured exactly this scenario: highly repetitive content (the minified-JS-like sample) had its size dramatically OVERSTATED by the ×0.3 approximation, by roughly 12x (+1190% error) compared to the real gzip size. Highly repetitive generated CSS (thousands of near-identical utility classes) is exactly the kind of content that compresses far better than 0.3×, so a budget failure based on the approximation could easily be a false positive — the REAL gzipped size might be well under budget even though the raw-size-based estimate says otherwise. The fix is to measure real gzip size (e.g. Node\'s zlib.gzipSync, or the same CompressionStream API used in this demo) rather than relying on a fixed ratio that varies wildly by content type.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A fixed compression ratio like "gzip is roughly 30% of the original size" is a reasonable rule of thumb that works consistently across different kinds of web assets.',
      reality: 'This subtopic\'s demo shows the ratio varies by over 30x depending on content redundancy alone — 0.023 for highly repetitive text versus 0.749 for high-entropy text — a single fixed ratio cannot represent both, or anything realistic in between.'
    },
    {
      thought: 'Since minified JS looks "already compact," it must be close to its gzip size already, so the ×0.3 approximation should be reasonably close for real bundle code.',
      reality: 'Minification removes whitespace and shortens variable names, but does NOT remove the kind of repeated structural patterns (similar function shapes, repeated keywords, common syntax) that gzip specifically exploits — this subtopic\'s repetitive-JS-like sample, despite being dense text with no extra whitespace, still compressed to just 2.3% of its raw size, far beyond what the 0.3 approximation assumes.'
    },
    {
      thought: 'CompressionStream(\'gzip\') is a Node.js-only or build-tool-only API — checking real gzip size requires a server-side build step, not something a CI script running in a browser-like environment could do directly.',
      reality: 'CompressionStream is a standard Web API, confirmed working directly in this subtopic\'s live browser demo — it can compute genuine gzip-compressed byte counts without any server, build tool, or Node.js zlib dependency, making it a viable option for any environment that runs JavaScript, not just Node build scripts.'
    }
  ];
}
