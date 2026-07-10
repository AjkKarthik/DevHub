import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-sizes-not-media-picks-srcset-candidate',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './sizes-not-media-picks-srcset-candidate.html',
  styleUrl: './sizes-not-media-picks-srcset-candidate.scss'
})
export class SizesNotMediaPicksSrcsetCandidateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'srcset only lists candidates — it never says how big the slot is',
      points: [
        'The main page describes <code>srcset="img-400.jpg 400w, img-800.jpg 800w"</code> as a list of candidate files with their real intrinsic widths (the <code>w</code> descriptor). By itself, this list tells the browser nothing about how large the image will actually render on the page.',
        'Without a correct <code>sizes</code> hint, the browser has no way to know whether the slot is 300px or 1200px wide, and can only fall back to guessing (usually treating it as 100vw) — which very often means downloading a needlessly large candidate.',
      ]
    },
    {
      heading: 'sizes is a CSS-length hint, not a media query selector',
      points: [
        'Despite looking similar to a media query, <code>sizes="(max-width: 600px) 100vw, 50vw"</code> is answering a different question than <code>&lt;picture&gt;</code>\'s <code>&lt;source media="..."&gt;</code>. A picture <code>media</code> attribute picks which SOURCE to use; a <code>sizes</code> entry picks what CSS WIDTH the browser should assume the image renders at.',
        'The browser evaluates the <code>sizes</code> list top to bottom and uses the first condition that matches the current viewport — the matched value (e.g. <code>50vw</code>) is then multiplied by the device pixel ratio to get an effective pixel width, which is compared against every candidate\'s own <code>w</code> descriptor to choose the closest match at or above that width.',
      ]
    },
    {
      heading: 'A wrong sizes value causes real over-fetching, even with a perfectly correct srcset',
      points: [
        'If <code>sizes</code> claims the image renders at <code>1200px</code> wide but it is actually displayed at <code>300px</code> via CSS, the browser has no way to know the CSS lied — it will select the 1200w (or largest available) candidate, downloading far more data than the page actually needs.',
        'You can observe exactly which candidate the browser picked via <code>img.currentSrc</code> after the image loads — this reflects the browser\'s real resolved choice, not the raw <code>src</code> or <code>srcset</code> attribute strings.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>sizes picks the srcset candidate</title>
    <style>
      .slot { width: 300px; border: 2px dashed #999; margin-bottom: 1rem; }
      .slot img { display: block; width: 100%; }
    </style>
  </head>
  <body>
    <p id="status">Loading two 300px-wide slots with different sizes hints…</p>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>

    <p>Correct sizes (matches the real 300px CSS width):</p>
    <div class="slot">
      <img id="correctImg"
           src="https://picsum.photos/id/1018/400/300"
           srcset="https://picsum.photos/id/1018/400/300 400w,
                   https://picsum.photos/id/1018/800/600 800w,
                   https://picsum.photos/id/1018/1200/900 1200w"
           sizes="300px"
           alt="mountain lake, correct sizes hint">
    </div>

    <p>Wrong sizes (lies that the slot is 1200px, even though CSS still renders it at 300px):</p>
    <div class="slot">
      <img id="wrongImg"
           src="https://picsum.photos/id/1019/400/300"
           srcset="https://picsum.photos/id/1019/400/300 400w,
                   https://picsum.photos/id/1019/800/600 800w,
                   https://picsum.photos/id/1019/1200/900 1200w"
           sizes="1200px"
           alt="mountain lake, wrong sizes hint">
    </div>

    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;
const correctImg = document.getElementById('correctImg') as HTMLImageElement;
const wrongImg = document.getElementById('wrongImg') as HTMLImageElement;

function report(label: string, img: HTMLImageElement) {
  // currentSrc is the browser's own RESOLVED choice from the srcset list —
  // not the raw src/srcset attribute strings.
  const chosen = img.currentSrc;
  const widthDescriptor = chosen.includes('1200') ? '1200w (largest)'
    : chosen.includes('800') ? '800w (medium)'
    : chosen.includes('400') ? '400w (smallest)'
    : 'unknown';
  output.textContent += \`\${label}: browser chose \${widthDescriptor}\\n  currentSrc = \${chosen}\\n\\n\`;
}

function reportBoth() {
  output.textContent = '';
  report('Correct sizes="300px" (slot really is 300px)', correctImg);
  report('Wrong sizes="1200px" (slot is STILL 300px via CSS)', wrongImg);
}

if (correctImg.complete && wrongImg.complete) {
  reportBoth();
} else {
  let loaded = 0;
  const onLoad = () => { if (++loaded === 2) reportBoth(); };
  correctImg.addEventListener('load', onLoad);
  wrongImg.addEventListener('load', onLoad);
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Both images above render at the exact same 300px CSS width — the <code>.slot</code> class fixes that. Before reading the code, predict: will <code>wrongImg.currentSrc</code> end up pointing at the 400w, 800w, or 1200w candidate, and why doesn\'t the browser just look at the actual rendered CSS width to correct for the lie?',
    hint: 'The browser resolves <code>srcset</code>/<code>sizes</code> during the PARSING phase, before layout has necessarily even run — it has no built-in mechanism to go back and re-fetch a smaller candidate once it discovers the real CSS width later.',
    solution: `wrongImg.currentSrc resolves to the 1200w candidate. The sizes attribute is the browser's ONLY
signal for "how wide will this render" at the time it needs to pick a srcset candidate — it does
not wait for CSS layout to be computed and does not retroactively correct a bad guess once the
real rendered width becomes known. This is exactly why sizes must be kept in sync with your actual
CSS — a correct srcset list can't compensate for a sizes value that lies about the slot width.`
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>sizes</code> is basically a second, redundant place to write media queries, similar to <code>&lt;source media="..."&gt;</code> in a <code>&lt;picture&gt;</code>.',
      reality: 'A <code>sizes</code> entry answers "how wide does the image render," not "which source file to use." <code>&lt;picture&gt;</code>\'s <code>media</code> attribute answers the latter — they solve genuinely different problems even though the syntax looks similar.'
    },
    {
      thought: 'If <code>srcset</code> lists the correct candidate widths, the browser will always pick an appropriately-sized one automatically.',
      reality: 'The browser can only pick correctly if <code>sizes</code> accurately reports the rendered slot width. A correct <code>srcset</code> combined with a wrong <code>sizes</code> still produces real over-fetching.'
    },
    {
      thought: 'Checking <code>img.src</code> or the raw <code>srcset</code> string tells you which candidate actually got downloaded.',
      reality: '<code>img.currentSrc</code> is the only property that reflects the browser\'s actual resolved choice — <code>src</code> and <code>srcset</code> just echo back the original attribute values you wrote in HTML.'
    },
  ];
}
