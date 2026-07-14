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
  templateUrl: './before-after-need-content-to-exist-at-all.html',
  styleUrl: './before-after-need-content-to-exist-at-all.scss'
})
export class BeforeAfterNeedContentToExistAtAllSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Without a content declaration, ::before and ::after are never generated — every other property on them is moot',
      points: [
        'The <code>content</code> property is what actually triggers pseudo-element GENERATION in the first place — it\'s not just "what text appears," it\'s the switch that decides whether the pseudo-element exists at all.',
        'Setting <code>width</code>, <code>background</code>, or <code>display: block</code> on a <code>::before</code> with no <code>content</code> declared has zero visible effect — those properties are computed on a pseudo-element that was never generated.',
      ]
    },
    {
      heading: 'This is directly checkable via getComputedStyle(el, "::before").content, which reports the special keyword "none" when nothing was generated',
      points: [
        '<code>getComputedStyle(element, "::before").content</code> returns the literal string <code>"none"</code> when no <code>content</code> property was set — a genuinely different value from an intentional empty string, which reports as <code>\'""\'</code> (quotes included in the string).',
        'The fix is always the same: add <code>content: \'\';</code> (an empty string still counts as "content was declared") whenever a pseudo-element is being used purely for decorative styling with no actual text.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>::before/::after need content to exist</title>
    <style>
      #noContent::before { width: 50px; height: 10px; background: red; display: block; }
      #withContent::before { content: ''; width: 50px; height: 10px; background: blue; display: block; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="noContent">no content declared on ::before</div>
    <div id="withContent">content: '' declared on ::before</div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const noContent = document.querySelector<HTMLElement>('#noContent')!;
const withContent = document.querySelector<HTMLElement>('#withContent')!;

const noContentValue = getComputedStyle(noContent, '::before').content;
const withContentValue = getComputedStyle(withContent, '::before').content;

console.log('::before with NO content property declared -> computed content:', noContentValue);
console.log('::before WITH content: \\'\\' declared -> computed content:', withContentValue);
console.log('the pseudo-element without content genuinely was never generated:', noContentValue === 'none');
console.log('the one with content: \\'\\' genuinely exists (even though the string is empty):', withContentValue === '""');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A rule sets <code>.icon::before { width: 24px; height: 24px; background: url(icon.svg); display: block; }</code> — no <code>content</code> property anywhere. What renders?',
    hint: 'Ask whether the pseudo-element was ever generated in the first place — every other property is irrelevant if it wasn\'t.',
    solution: 'Nothing — the ::before pseudo-element is never generated without a content declaration, so its width, height, background, and display values are all computed on an element that doesn\'t exist. Adding content: \'\'; (even an empty string) is required for anything to appear.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'content is only needed on ::before/::after when you actually want text to appear — for purely decorative styling (background, borders, icons), it can be omitted.',
      reality: 'It\'s required in every case, including purely decorative ones — content: \'\'; (empty string) is the standard way to trigger generation without adding any visible text.'
    },
    {
      thought: 'If a ::before rule "isn\'t working," the width/height/background values themselves are probably wrong.',
      reality: 'Before troubleshooting individual property values, check whether content is declared at all — getComputedStyle(el, "::before").content reporting "none" means the pseudo-element was never generated, making every other property moot.'
    },
    {
      thought: 'An empty content: \'\'; and no content property at all produce the same practical result, since neither displays visible text.',
      reality: 'They\'re fundamentally different — content: \'\'; still triggers generation (the pseudo-element exists, with an empty string as its content, and CAN be styled with width/background/etc.), while no content property means the pseudo-element never exists at all.'
    }
  ];
}
