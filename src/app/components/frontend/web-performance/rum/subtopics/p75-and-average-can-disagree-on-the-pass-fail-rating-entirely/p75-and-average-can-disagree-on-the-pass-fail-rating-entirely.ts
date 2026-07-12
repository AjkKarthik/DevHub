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
  templateUrl: './p75-and-average-can-disagree-on-the-pass-fail-rating-entirely.html',
  styleUrl: './p75-and-average-can-disagree-on-the-pass-fail-rating-entirely.scss'
})
export class P75AndAverageCanDisagreeOnThePassFailRatingEntirelySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s warning is not about a small numerical gap — average and P75 can land on opposite sides of the "good" threshold entirely',
      points: [
        'An average blends every session into one number, letting a majority of fast sessions numerically outweigh a real, meaningful slow tail — the slow sessions still happened, they are just diluted into invisibility.',
        'The 75th percentile answers a fundamentally different question: "what value do 75% of sessions meet or beat?" — this is exactly Google\'s own CWV methodology, and it does not get diluted by how much FASTER the good sessions are than necessary.',
      ]
    },
    {
      heading: 'Confirmed with a concrete, realistic dataset — not a contrived edge case',
      points: [
        'A 20-session dataset with 14 genuinely fast sessions (900–1200ms) and 6 genuinely slow sessions (2,600–5,000ms, a real mobile/3G-style tail) produces an AVERAGE of 1,839ms — comfortably under the 2,500ms "good" LCP threshold.',
        'The SAME dataset\'s P75 is 2,600ms — over the threshold, rated "poor". The identical underlying data tells two completely different stories depending on which statistic is used, confirmed by computing both directly rather than assuming the direction or size of the gap.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>P75 and average can disagree on the pass/fail rating entirely</title>
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
      content: `// A realistic 20-session LCP dataset: 14 fast sessions, 6 genuinely slow ones
// (the kind of tail a real mobile/3G user segment produces)
const lcpSamples = [
  900, 950, 1000, 1050, 1100, 1080, 1020, 970, 1150, 1200,
  1100, 1050, 980, 1120,             // 14 fast sessions
  2600, 3100, 3800, 4200, 5000, 3400, // 6 genuinely slow sessions
];

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((sorted.length * p) / 100) - 1);
  return sorted[idx];
}

const GOOD_THRESHOLD = 2500; // ms, the real LCP "good" cutoff

const average = lcpSamples.reduce((a, b) => a + b, 0) / lcpSamples.length;
const p75 = percentile(lcpSamples, 75);

const averageRating = average < GOOD_THRESHOLD ? 'GOOD' : 'POOR';
const p75Rating = p75 < GOOD_THRESHOLD ? 'GOOD' : 'POOR';

console.log('20-session LCP dataset — 14 fast, 6 genuinely slow (mobile/3G-style tail)');
console.log('AVERAGE:', Math.round(average), 'ms  -> rated', averageRating);
console.log('P75:    ', Math.round(p75), 'ms  -> rated', p75Rating);
console.log('same underlying data, two completely different pass/fail outcomes.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A performance dashboard shows "Average LCP: 1.8s — Good" for a page, and the team deprioritises further LCP work. Meanwhile, Google Search Console\'s Core Web Vitals report flags the same URL as "Poor" for LCP. Both numbers are computed from real, honest data — no bugs, no bot traffic. How can this happen, and which report should the team trust for search-ranking purposes?',
    hint: 'Ask what statistic Search Console\'s Core Web Vitals report is actually built on (the same source CrUX uses), versus what the dashboard\'s "average" is computed from.',
    solution: 'Both numbers can be simultaneously true and non-contradictory — confirmed directly in this subtopic\'s demo, where an identical 20-session dataset produced an average of 1,839ms (comfortably "good") and a P75 of 2,600ms (rated "poor"). Search Console\'s Core Web Vitals report is built on CrUX field data, which uses the 75th percentile methodology, exactly matching Google\'s actual ranking signal. The team should trust the P75 number and Search Console\'s rating for anything related to search ranking or real-world user experience at the tail — the dashboard\'s average is technically accurate but is answering a different, less relevant question and should not be used to judge Core Web Vitals compliance.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Average and P75 might differ by a few percent due to normal statistical variance, but they should generally agree on whether a metric is "good" or "poor" for the same dataset.',
      reality: 'They can disagree entirely on the pass/fail rating, confirmed directly in this subtopic\'s demo — an honest, realistic dataset produced a "good" average and a "poor" P75 for the exact same 20 sessions, not a rounding-level discrepancy.'
    },
    {
      thought: 'A large enough sample size makes average and P75 converge — the disagreement in a small demo dataset is just a small-sample artifact.',
      reality: 'The disagreement is structural, not a sample-size artifact — as long as a consistent fraction of sessions (here, 30%) falls into a genuinely slow tail, P75 will consistently land in that tail region regardless of how many total sessions are sampled, while the average keeps being pulled toward the majority\'s faster values.'
    },
    {
      thought: 'Since P75 is the "stricter" of the two measures, using it is simply the more conservative, safety-margin choice — teams could reasonably choose average instead if they want a less alarmist view.',
      reality: 'P75 is not a stylistic choice toward caution — it is the specific statistic Google\'s search ranking and CrUX field-data reporting are built on, confirmed in the main page\'s own theory; reporting average instead does not just present a "less alarmist" view, it measures against a threshold Google is not actually using to judge the site.'
    }
  ];
}
