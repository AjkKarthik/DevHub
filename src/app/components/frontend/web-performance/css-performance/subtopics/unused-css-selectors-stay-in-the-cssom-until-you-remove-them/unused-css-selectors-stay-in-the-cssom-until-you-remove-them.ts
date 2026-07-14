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
  templateUrl: './unused-css-selectors-stay-in-the-cssom-until-you-remove-them.html',
  styleUrl: './unused-css-selectors-stay-in-the-cssom-until-you-remove-them.scss'
})
export class UnusedCssSelectorsStayInTheCssomUntilYouRemoveThemSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The browser has no built-in mechanism to skip or discard CSS rules that match nothing on the page',
      points: [
        'Every rule in a loaded stylesheet is parsed and stored in the CSSOM (CSS Object Model) regardless of whether any element in the DOM currently matches its selector — the browser cannot know in advance that a rule is "unused."',
        'This is exactly why the main page recommends build-time tools (PurgeCSS, Tailwind\'s JIT engine): removing unused CSS is a job for something that scans your actual templates ahead of time, not something the browser does automatically at runtime.',
      ]
    },
    {
      heading: 'Confirmed directly — a rule for a class that matches zero elements on the page is still fully present and queryable in the live CSSOM',
      points: [
        'Injecting a <code>&lt;style&gt;</code> block containing a rule for <code>.totally-unused-class-xyz-123</code> (a class name deliberately not used anywhere in the document) still resulted in <code>document.querySelectorAll(\'.totally-unused-class-xyz-123\').length === 0</code> — confirming zero elements match it.',
        'Despite matching nothing, <code>document.styleSheets</code> still reports the rule as present — <code>cssRules[0].selectorText === \'.totally-unused-class-xyz-123\'</code> — the browser parsed it, stored it, and keeps it ready to apply the instant a matching element ever appears, exactly as if it were in active use.',
        'This is the mechanism behind why shipping a 200 KB CSS framework when you use 3% of it genuinely costs the full 200 KB of parse/storage — the browser has no way to know which 3% you\'ll actually need until it checks every element against every rule.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>unused CSS selectors stay in the CSSOM until you remove them</title>
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
      content: `// Inject a CSS rule for a class name that is deliberately used NOWHERE in this document,
// then check whether the browser stores it in the CSSOM anyway.
const unusedStyle = document.createElement('style');
unusedStyle.textContent = \`
  .totally-unused-class-xyz-123 { color: red; font-weight: 900; }
  .also-unused-abc-789 { display: grid; grid-template-columns: 1fr 1fr; }
\`;
document.head.appendChild(unusedStyle);

const matchingElements = document.querySelectorAll('.totally-unused-class-xyz-123').length;
console.log('elements matching .totally-unused-class-xyz-123:', matchingElements);

const sheet = unusedStyle.sheet!;
console.log('rules stored in the CSSOM for this <style> block:', sheet.cssRules.length);
for (const rule of Array.from(sheet.cssRules) as CSSStyleRule[]) {
  console.log('  -', rule.selectorText, '→', rule.style.cssText);
}

console.log('---');
console.log('Zero elements match, yet the browser parsed and kept both rules ready — nothing in the runtime ever strips them.');
console.log('This is why PurgeCSS / Tailwind JIT exist: they scan your ACTUAL templates at BUILD time, before the browser ever sees a byte of unused CSS.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate suggests: "We don\'t need PurgeCSS — modern browsers are smart, they\'ll just skip parsing or applying CSS rules for classes that don\'t exist on the page, so unused CSS doesn\'t really cost us anything at runtime." Is this accurate?',
    hint: 'Think about what this subtopic\'s demo showed happening to a rule for a class matching ZERO elements — was it skipped, or fully stored?',
    solution: 'No — this is a genuine misconception, directly contradicted by this subtopic\'s demo. A rule for a class matching zero elements was still fully parsed and stored in the live CSSOM (confirmed via document.styleSheets), with no skipping or lazy-parsing behavior. The browser cannot know in advance which rules will eventually match something, so it must parse and retain every rule in every loaded stylesheet. The cost of unused CSS is real: extra bytes to download, extra time to parse, and a larger CSSOM for the browser to check every element against. PurgeCSS/Tailwind JIT solve this the only way it can actually be solved — by removing the unused rules BEFORE they ever reach the browser, at build time.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Modern browsers lazily parse CSS rules — a rule only gets fully processed once an element on the page actually needs it.',
      reality: 'This subtopic\'s demo shows the opposite: a rule matching ZERO elements was still fully parsed and present in document.styleSheets\' cssRules the moment the stylesheet loaded — there is no lazy or on-demand parsing of individual rules based on DOM matches.'
    },
    {
      thought: 'Shipping a large CSS framework "just in case" is harmless as long as you don\'t reference most of its classes in your HTML — unreferenced CSS costs nothing.',
      reality: 'The browser parses and stores every byte of every loaded stylesheet regardless of DOM usage, confirmed directly in this subtopic — a 200 KB framework where 3% is used still costs the full 200 KB of download and parse time, exactly why PurgeCSS/Tailwind JIT (build-time removal) exist as a real, necessary optimization rather than a nice-to-have.'
    },
    {
      thought: 'PurgeCSS and Tailwind\'s JIT engine work by having the BROWSER skip unused rules at runtime, using some kind of usage-tracking API.',
      reality: 'There is no browser-level "used CSS" tracking API these tools rely on — they work entirely at BUILD time, statically scanning your HTML/template/JS source files as plain text to determine which class names appear anywhere, then physically remove or never generate the rules for everything else, before the browser ever receives the file.'
    }
  ];
}
