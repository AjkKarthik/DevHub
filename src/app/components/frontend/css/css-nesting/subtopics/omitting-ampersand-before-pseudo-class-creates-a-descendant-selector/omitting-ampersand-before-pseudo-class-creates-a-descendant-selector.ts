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
  templateUrl: './omitting-ampersand-before-pseudo-class-creates-a-descendant-selector.html',
  styleUrl: './omitting-ampersand-before-pseudo-class-creates-a-descendant-selector.scss'
})
export class OmittingAmpersandBeforePseudoClassCreatesADescendantSelectorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Writing :hover without a leading & inside a nested rule doesn\'t attach it to the parent — it silently becomes a descendant selector instead',
      points: [
        '<code>.card { &:hover { } }</code> expands to <code>.card:hover</code> — the parent element itself, when hovered.',
        '<code>.card { :hover { } }</code> (no &) expands to <code>.card :hover</code> — WITH a space — meaning "any hovered element that is a descendant of .card", a completely different, much broader selector.',
      ]
    },
    {
      heading: 'This is directly observable in the browser\'s own parsed CSSOM — the missing & is silently rewritten as an explicit space by the parser itself',
      points: [
        'Reading a stylesheet\'s <code>cssRules</code> after inserting <code>.card { :hover { } }</code> shows the browser\'s own serialized selector as <code>.card :hover</code> — the space is really there in the parsed rule, not just a visual illusion in the source.',
        'Practically, this means hovering a completely unrelated child element deep inside <code>.card</code> — a link, a button, an icon — can trigger styles meant only for hovering the card itself, since <code>:hover</code> without <code>&</code> matches ANY hovered descendant.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>omitting & before a pseudo-class creates a descendant selector</title>
    <style>
      .card {
        background: #fff;
        border: 1px solid #ccc;

        /* Missing & -- this is NOT .card:hover */
        :hover {
          background: yellow;
        }
      }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div class="card" id="card">
      Card text
      <button id="innerBtn">Unrelated inner button</button>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const sheet = document.styleSheets[0];
const rules = Array.from(sheet.cssRules).map(r => r.cssText);

console.log('parsed CSS rules:', rules);

const cardRule = rules.find(r => r.includes('.card'));
console.log('the missing & was rewritten as an explicit descendant selector:', cardRule?.includes('.card :hover'));
console.log('it is NOT .card:hover (which would attach to the card itself):', !cardRule?.includes('.card:hover'));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes <code>.tooltip-trigger { :hover { .tooltip { opacity: 1; } } }</code> intending "when you hover the trigger, show the tooltip". Does hovering the trigger itself reveal the tooltip?',
    hint: 'Ask what :hover (without &) actually expands to when nested — whose hover state does it really respond to?',
    solution: 'Not reliably as intended — :hover without & means ".tooltip-trigger :hover", which only fires when hovering some DESCENDANT of .tooltip-trigger, not the trigger itself. If the trigger has no hoverable descendant besides the tooltip, hovering the trigger\'s own text/background never matches at all. The fix is &:hover to correctly target hovering the trigger element itself.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Nesting :hover directly inside a rule (without &) should obviously apply it to that same parent element — the intent seems clear from the code\'s visual structure.',
      reality: 'CSS nesting doesn\'t infer intent from visual indentation — a nested selector that starts with a pseudo-class needs the explicit & to attach to the parent. Without it, the nested selector is parsed as an ordinary descendant selector, exactly like nesting .title { } would mean .card .title.'
    },
    {
      thought: 'This is a rare mistake that would be immediately obvious from broken visual behavior during development.',
      reality: 'It can be subtle — if the intended descendant styling coincidentally looks similar, or if there happens to be a hoverable descendant that legitimately should highlight, the bug can go unnoticed for a while, especially since there is no console warning at all for this valid-but-wrong selector.'
    },
    {
      thought: 'Only :hover is affected by this — other pseudo-classes are more forgiving about needing &.',
      reality: 'Every pseudo-class, pseudo-element, and attribute selector needs & the same way — &:focus-visible, &::before, &[disabled] all require it, and omitting it produces the same silent descendant-selector behavior in each case.'
    }
  ];
}
