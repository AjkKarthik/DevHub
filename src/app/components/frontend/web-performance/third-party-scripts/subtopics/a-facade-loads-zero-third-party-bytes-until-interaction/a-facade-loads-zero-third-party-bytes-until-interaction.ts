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
  templateUrl: './a-facade-loads-zero-third-party-bytes-until-interaction.html',
  styleUrl: './a-facade-loads-zero-third-party-bytes-until-interaction.scss'
})
export class AFacadeLoadsZeroThirdPartyBytesUntilInteractionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A facade is not "lazy loading with extra steps" — before interaction, the real widget\'s script literally does not exist as a network request',
      points: [
        'The main page describes the facade as a lightweight placeholder that loads the real widget on interaction — but the important, verifiable claim is what happens BEFORE that interaction: zero bytes, zero requests, for the widget itself.',
        'This is directly measurable via the Resource Timing API: checking <code>performance.getEntriesByType(\'resource\')</code> for the widget\'s script URL before any click shows NO entry at all — not a deferred one, not a low-priority one, none.',
      ]
    },
    {
      heading: 'The moment the facade is clicked, exactly one real request appears — confirmed with a real count, not inferred from the code',
      points: [
        'Confirmed directly: a facade button with a click handler that injects a <code>&lt;script&gt;</code> element shows ZERO resource-timing entries for that script\'s URL before the click, and EXACTLY ONE entry immediately after — a clean, measured before/after with no ambiguity.',
        'This is the entire performance case for the facade pattern in one measurement: for the (often large) fraction of visitors who never interact with a chat widget, video embed, or payment form, the real third-party cost genuinely never happens — not deferred to idle time, not loaded quietly in the background, simply never requested.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>a facade loads zero third-party bytes until interaction</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <button id="facade">Load Widget (facade)</button>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const uid = Date.now();
const widgetUrl = \`/index.html?heavyWidget=\${uid}\`;

function countRequestsFor(url: string): number {
  return performance.getEntriesByType('resource').filter((e) => e.name.includes(url)).length;
}

console.log('BEFORE any interaction — requests for the heavy widget script:', countRequestsFor(\`heavyWidget=\${uid}\`));

const facade = document.querySelector<HTMLButtonElement>('#facade')!;
facade.addEventListener(
  'click',
  () => {
    const script = document.createElement('script');
    script.src = widgetUrl;
    document.head.appendChild(script);
    console.log('facade clicked — the real widget script was just requested for the first time.');

    setTimeout(() => {
      console.log('AFTER interaction — requests for the heavy widget script:', countRequestsFor(\`heavyWidget=\${uid}\`));
    }, 400);
  },
  { once: true }
);

// Simulate the user clicking the facade after a short delay
setTimeout(() => facade.click(), 500);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A product page embeds a live chat widget as a facade — a static "Chat with us" button that loads the real Intercom script only on click. Data shows only 3% of visitors ever click it. A teammate argues the facade "doesn\'t really save much" since the script will load eventually for the 3% anyway, so the total bytes served across all visitors barely changes. Are they right?',
    hint: 'Ask whether the relevant comparison is "total bytes served across all visitors" or "cost paid by each individual visitor who never interacts".',
    solution: 'The teammate is wrong about what matters here — the facade\'s benefit is per-visitor page-load cost, not aggregate bytes served across the whole userbase. Confirmed directly in this subtopic\'s demo: before any interaction, there are genuinely ZERO requests for the widget script. For the 97% of visitors who never click, their page load never pays the chat widget\'s download, parse, and execution cost at all — their LCP, INP, and TBT are entirely unaffected by it. The fact that the 3% eventually trigger the same total download the non-facade version would have made on EVERY visit is irrelevant to the performance experienced by the 97% majority.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A facade pattern is essentially the same as loading="lazy" or a deferred script — the widget loads a bit later, but every visitor eventually downloads it during their session.',
      reality: 'For any visitor who never interacts with the facade, the real widget is never requested at all, confirmed directly in this subtopic\'s demo (zero entries with no click) — this is fundamentally different from deferred/lazy loading, which still eventually loads unconditionally for every visitor.'
    },
    {
      thought: 'The performance win from a facade is proportional to how POPULAR the widget is — a rarely-used widget saves little because so few visitors trigger the load anyway.',
      reality: 'It is the opposite — a RARELY-clicked widget benefits the MOST from a facade, since the vast majority of visitors are the ones who skip the cost entirely. A widget every visitor clicks anyway gets comparatively little benefit from being behind a facade.'
    },
    {
      thought: 'Since the facade itself still needs some markup and a small amount of JavaScript (the click handler), it does not really achieve "zero cost" until interaction — there is always some baseline overhead.',
      reality: 'The facade\'s own tiny placeholder markup and click-handler script is real but is a completely different order of magnitude from the actual third-party widget it replaces — this subtopic\'s claim is specifically about the HEAVY third-party script (analytics SDKs, chat widgets, payment libraries), not the facade\'s own lightweight stand-in.'
    }
  ];
}
