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
  templateUrl: './rotate-before-translate-changes-the-direction-of-movement.html',
  styleUrl: './rotate-before-translate-changes-the-direction-of-movement.scss'
})
export class RotateBeforeTranslateChangesTheDirectionOfMovementSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'transform: rotate(90deg) translateX(100px) moves the element DOWN, not right — because rotate() runs first and rotates the coordinate system translateX() then moves along',
      points: [
        'CSS transform functions are applied as a chain where each one modifies the LOCAL coordinate system for everything after it — <code>rotate(90deg)</code> listed first means the element\'s own X and Y axes are rotated 90° BEFORE <code>translateX()</code> gets to use them.',
        'Once the local X axis has been rotated 90°, it now points in the direction that used to be "down" on screen — so <code>translateX(100px)</code>, which always moves along the CURRENT local X axis, ends up moving the element downward instead of rightward.',
      ]
    },
    {
      heading: 'This is directly measurable: swapping the order of the exact same two functions produces two different final positions, confirmed via getBoundingClientRect()',
      points: [
        'An element with <code>transform: rotate(90deg) translateX(100px)</code> ends up with its center offset purely in the Y direction (moved down) from its untransformed position — X stays the same.',
        'The SAME element with the functions reversed — <code>transform: translateX(100px) rotate(90deg)</code> — ends up offset purely in the X direction (moved right) instead, since <code>translateX()</code> now runs first in the still-unrotated coordinate system, before the rotation spins the (already-moved) element in place.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>rotate before translate changes the direction of movement</title>
    <style>
      #rotateFirst { width: 20px; height: 20px; background: crimson; position: fixed; top: 100px; left: 100px; transform: rotate(90deg) translateX(100px); }
      #translateFirst { width: 20px; height: 20px; background: royalblue; position: fixed; top: 200px; left: 100px; transform: translateX(100px) rotate(90deg); }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="rotateFirst"></div>
    <div id="translateFirst"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const rotateFirst = document.querySelector<HTMLElement>('#rotateFirst')!;
const translateFirst = document.querySelector<HTMLElement>('#translateFirst')!;

const rectRotateFirst = rotateFirst.getBoundingClientRect();
const rectTranslateFirst = translateFirst.getBoundingClientRect();

// Both boxes start at the same untransformed position (top:100/200, left:100),
// so compare how far each one's center moved from its own starting box.
const rotateFirstDeltaX = rectRotateFirst.left - 100;
const rotateFirstDeltaY = rectRotateFirst.top - 100;
const translateFirstDeltaX = rectTranslateFirst.left - 100;
const translateFirstDeltaY = rectTranslateFirst.top - 200;

console.log('rotate(90deg) translateX(100px) -- moved by:', { x: rotateFirstDeltaX, y: rotateFirstDeltaY });
console.log('translateX(100px) rotate(90deg) -- moved by:', { x: translateFirstDeltaX, y: translateFirstDeltaY });
console.log('rotate-first moved DOWN (Y), not right:', Math.abs(rotateFirstDeltaY) > 50 && Math.abs(rotateFirstDeltaX) < 10);
console.log('translate-first moved RIGHT (X), not down:', Math.abs(translateFirstDeltaX) > 50 && Math.abs(translateFirstDeltaY) < 10);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer wants to move a tooltip 20px to the right, then rotate it 15deg for a playful tilt. They write <code>transform: rotate(15deg) translateX(20px);</code>. Does the tooltip end up 20px to the right of its original position, tilted 15deg?',
    hint: 'Ask which function runs FIRST in the listed order, and what that does to the coordinate system the second function operates in.',
    solution: 'Not quite — rotate(15deg) runs first, tilting the local coordinate system by 15° before translateX(20px) applies. The element ends up moved 20px along the TILTED axis (mostly right, slightly down), not purely horizontally, and the final rotation is visually correct but the translation direction is off by 15°. The intended effect requires the opposite order: transform: translateX(20px) rotate(15deg) — move right first in the original coordinate system, then tilt the already-positioned element.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Multiple transform functions in one declaration all apply "at once," relative to the element\'s original, untransformed position — so listing order shouldn\'t matter for the final visual result.',
      reality: 'Each function genuinely modifies the coordinate system for whatever comes after it in the list. Order changes the result because later functions operate in the ALREADY-transformed space, not the original one.'
    },
    {
      thought: 'transform: rotate(90deg) translateX(100px) should be read left-to-right like a sentence: "rotate, then translate" meaning translate happens in screen-space AFTER the rotation is visually complete.',
      reality: 'It\'s closer to functional composition, evaluated in terms of which axis SUBSEQUENT functions operate on — rotate(90deg) changes what "X" even means for translateX() that follows, producing a screen-space movement that looks like "translate, then rotate the result" rather than the other way around.'
    },
    {
      thought: 'This order-dependency is a minor CSS quirk unlikely to cause real bugs, since developers usually only chain two transform functions at most.',
      reality: 'It\'s a common, genuine source of "why is my animation moving in the wrong direction" bugs — precisely because two chained functions is exactly the common case (a hover lift + rotate, a translate + scale), and the wrong order silently produces a diagonal or perpendicular movement instead of the intended one.'
    }
  ];
}
