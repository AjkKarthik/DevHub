import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-time-datetime-diverge-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './times-datetime-property-can-diverge-from-its-own-text.html',
  styleUrl: './times-datetime-property-can-diverge-from-its-own-text.scss',
})
export class OmittingDatetimeOnTimeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #4, Taken One Step Further',
      points: [
        'The main page\'s Mistake #4 warns about OMITTING <code>datetime</code> entirely: "Without <code>datetime</code>, machines cannot parse the date." This subtopic goes further and shows an even more surprising case: a <code>&lt;time&gt;</code> element where <code>datetime</code> is PRESENT but its value is a completely different date than the visible text — and confirms the browser makes ZERO attempt to detect or flag this mismatch.',
        'The DOM exposes <code>datetime</code> not just as an HTML attribute but as a genuine JavaScript property — <code>HTMLTimeElement.dateTime</code> — specifically so scripts and browser features (calendar integrations, "add to calendar" buttons, structured data extraction) can read the machine-readable value directly, completely independent of whatever text happens to be visually displayed inside the element.',
      ],
    },
    {
      heading: 'Why the Browser Trusts Your datetime Value Completely — No Cross-Checking',
      points: [
        'There is no validation step anywhere in the rendering pipeline that compares a <code>&lt;time&gt;</code> element\'s <code>datetime</code> attribute against its own text content and warns on a mismatch — the browser (and every tool built on top of it: search engines, screen readers, calendar integrations) simply TRUSTS whatever value <code>datetime</code> holds, using it exactly as given, with no cross-check against what a human would visually read.',
        'This places the ENTIRE burden of correctness on whoever authors the markup — if a CMS template, a build script, or a manual edit ever produces a <code>&lt;time&gt;</code> element where the <code>datetime</code> attribute and the displayed text disagree, every machine consumer (search engine rich snippets, screen readers announcing the date, a browser extension\'s "add to calendar" feature) will silently use the WRONG date, while every human just reading the page will see the CORRECT one — a genuinely hard class of bug to notice, since it only manifests in non-visual consumption of the page.',
        'The takeaway isn\'t "avoid <code>&lt;time&gt;</code>\'s power" — it\'s that any system generating <code>&lt;time&gt;</code> elements dynamically (templating engines, CMS platforms) needs to derive BOTH the <code>datetime</code> attribute and the visible text from the exact same underlying date value, rather than letting them be set independently anywhere in the pipeline.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>time datetime mismatch demo</title>
</head>
<body>
  <p>Published: <time id="mismatched-time" datetime="2025-01-01">March 15, 2025</time></p>
  <p>Published: <time id="correct-time" datetime="2025-03-15">March 15, 2025</time></p>
  <p>Published: <time id="no-datetime-time">March 15, 2025</time></p>

  <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
  <script type="module" src="index.ts"></script>
</body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `console.log('--- Reading the mismatched <time> element ---');
const mismatched = document.getElementById('mismatched-time') as HTMLTimeElement;
console.log('Visible text (what a human reads):', mismatched.textContent);
console.log('mismatched.dateTime (the machine-readable value):', mismatched.dateTime);
console.log('Do they represent the SAME date?', mismatched.textContent === 'March 15, 2025' && mismatched.dateTime === '2025-01-01' ? 'NO -- January 1 vs March 15, genuinely different dates' : 'unexpected');

console.log('--- Did the browser throw any error, warning, or validation failure for this mismatch? ---');
console.log('document.readyState:', document.readyState, '<-- loaded completely normally, zero warnings about the mismatch');

console.log('--- Simulating what a "calendar integration" or search engine would actually use ---');
function whatWouldACalendarAppUse(el: HTMLTimeElement) {
  return 'A calendar integration would schedule this event on: ' + el.dateTime + ' (ignoring the visible text entirely)';
}
console.log(whatWouldACalendarAppUse(mismatched));

console.log('--- Contrast: the CORRECT time element, where both agree ---');
const correct = document.getElementById('correct-time') as HTMLTimeElement;
console.log('correct.dateTime:', correct.dateTime, '-- matches the visible text, "March 15, 2025"');

console.log('--- Contrast: a <time> with NO datetime attribute at all ---');
const noDatetime = document.getElementById('no-datetime-time') as HTMLTimeElement;
console.log('noDatetime.dateTime:', JSON.stringify(noDatetime.dateTime), '<-- empty string, not undefined or an error -- machines get NOTHING usable from this element');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The first <code>&lt;time&gt;</code> element has <code>datetime="2025-01-01"</code> but visibly displays "March 15, 2025" — two genuinely different dates. Does the browser detect or flag this contradiction in any way?',
    hint: 'Ask whether anything in the rendering pipeline ever actually COMPARES a time element\'s datetime attribute against its own visible text -- or whether the two are treated as two completely independent, unrelated pieces of information.',
    solution: `No -- the browser detects nothing. The page loads with
document.readyState reporting "complete" exactly as normal, with
zero warnings, errors, or any indication that mismatched.dateTime
("2025-01-01") and mismatched.textContent ("March 15, 2025")
represent two genuinely different dates.

This is because the browser never cross-checks a <time> element's
datetime attribute against its own displayed text at all -- they
are two completely independent pieces of information as far as the
rendering engine is concerned. datetime is exposed as a real DOM
property (HTMLTimeElement.dateTime) specifically so scripts and
browser features can read the MACHINE-READABLE value directly,
without ever looking at (or validating against) the human-readable
text sitting inside the element.

The whatWouldACalendarAppUse() simulation makes the practical
consequence concrete: any tool consuming this markup programmatically
(a calendar integration, a search engine's rich snippet generator, a
screen reader announcing structured data) would use "2025-01-01" --
the WRONG date -- while every human simply reading the page sees the
CORRECT date, "March 15, 2025". This is a genuinely hard class of
bug to notice, since it's invisible to anyone just looking at the
rendered page.

The final example shows a related but distinct case: a <time> with
NO datetime attribute at all returns an EMPTY STRING from .dateTime
(not undefined, not an error) -- machines get literally nothing
usable from it, exactly as the main page's own Mistake #4 warns.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the browser cross-checks a &lt;time&gt; element\'s datetime attribute against its own visible text content, and would warn (or at least log something) if the two clearly represent different dates.',
      reality: 'the browser performs no such cross-check at all — datetime and the element\'s visible text are treated as two completely independent pieces of information, with zero validation that they agree, no matter how obviously mismatched they are.',
    },
    {
      thought: 'a mismatch between a &lt;time&gt; element\'s datetime attribute and its visible text is a purely theoretical concern that would be immediately obvious to anyone looking at the page.',
      reality: 'this mismatch is completely invisible to anyone just reading the rendered page — it only manifests in NON-VISUAL consumption of the markup (screen readers, search engine rich snippets, calendar integrations), making it a genuinely easy bug to introduce and hard to notice, especially in dynamically-generated markup from a CMS or templating engine.',
    },
    {
      thought: 'a &lt;time&gt; element with no datetime attribute at all still provides SOME machine-readable value, perhaps by having the browser attempt to parse the visible text automatically as a fallback.',
      reality: 'a &lt;time&gt; element with no datetime attribute returns an empty string from its .dateTime property — the browser makes no attempt to parse or infer a date from the visible text as a fallback; machines get literally nothing usable from it.',
    },
  ];
}
