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
  templateUrl: './has-parent-selector-actually-selects-the-parent.html',
  styleUrl: './has-parent-selector-actually-selects-the-parent.scss'
})
export class HasParentSelectorActuallySelectsTheParentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: ':has() styles the ELEMENT IT\'S WRITTEN ON, based on what\'s inside it — a genuine "look inside, style outside" selector',
      points: [
        '<code>.card:has(img) { padding: 0; }</code> doesn\'t style the <code>img</code> — it styles the <code>.card</code> itself, conditionally, based on whether it contains an <code>img</code> descendant anywhere.',
        'Before <code>:has()</code>, this exact pattern — "style a container differently depending on its contents" — genuinely required JavaScript (checking for a child, then adding a class to the parent). <code>:has()</code> does it in pure CSS.',
      ]
    },
    {
      heading: 'This is directly, deterministically testable — two structurally-identical containers, one with the matching content and one without',
      points: [
        'Two <code>.card</code> elements with the SAME base styles — one containing an <code>&lt;img&gt;</code>, one containing only text — render with genuinely different computed padding once <code>.card:has(img) { padding: 0; }</code> is added, provable by reading <code>getComputedStyle(el).padding</code> on each.',
        '<code>:has()</code> can also look at siblings via a combinator inside it — <code>label:has(+ input:invalid)</code> matches the LABEL (not the input) when the input immediately after it is invalid, extending the same "look elsewhere, style here" pattern to sibling relationships.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>:has() as a parent selector</title>
    <style>
      .card { padding: 20px; border: 1px solid #e2e8f0; }
      .card:has(img) { padding: 0px; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div class="card" id="cardWithImg">
      <img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="" />
    </div>
    <div class="card" id="cardNoImg">
      <p>Just text, no image</p>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const cardWithImg = document.querySelector<HTMLElement>('#cardWithImg')!;
const cardNoImg = document.querySelector<HTMLElement>('#cardNoImg')!;

console.log('.card:has(img) { padding: 0px; } is the only rule that differs between these two cards.');
console.log('cardWithImg computed padding:', getComputedStyle(cardWithImg).padding);
console.log('cardNoImg computed padding:', getComputedStyle(cardNoImg).padding);
console.log('the CARD itself (not the image) is what gets styled differently:',
  getComputedStyle(cardWithImg).padding === '0px' && getComputedStyle(cardNoImg).padding === '20px');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A rule reads <code>.form-group:has(input:invalid) label { color: red; }</code>. Which element\'s color actually changes — the input, or the label?',
    hint: ':has() styles whatever selector comes AFTER it in the compound/complex selector — think about what ".form-group:has(...)" as a whole is describing, versus what comes after it.',
    solution: 'The label — :has(input:invalid) is a condition on .form-group (does this form-group CONTAIN an invalid input?), and once that condition is true, the styling applies to label, a descendant of the matched .form-group. The input itself is never directly styled by this rule.'
  };

  misconceptions: Misconception[] = [
    {
      thought: ':has(img) in .card:has(img) styles the img element that was found inside the card.',
      reality: 'It styles .card itself — :has() is a condition checked against the element it\'s attached to (does THIS element contain a match?), not a way to reach into and style the matched descendant.'
    },
    {
      thought: 'Achieving "style a parent based on its children" always required JavaScript before :has(), and still does for anything beyond simple cases.',
      reality: ':has() handles this entirely in CSS now, including fairly complex conditions — combining it with sibling combinators (label:has(+ input:invalid)) covers cases that used to need real JS DOM inspection.'
    },
    {
      thought: ':has() can only check for direct children — it can\'t match a descendant nested several levels deep.',
      reality: 'By default :has() checks for ANY descendant match, at any depth, exactly like a normal descendant combinator would — .card:has(img) matches even if the img is nested three divs deep inside the card.'
    }
  ];
}
