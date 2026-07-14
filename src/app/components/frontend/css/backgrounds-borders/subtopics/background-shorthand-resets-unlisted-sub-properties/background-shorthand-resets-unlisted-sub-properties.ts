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
  templateUrl: './background-shorthand-resets-unlisted-sub-properties.html',
  styleUrl: './background-shorthand-resets-unlisted-sub-properties.scss'
})
export class BackgroundShorthandResetsUnlistedSubPropertiesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Setting the background shorthand resets every sub-property it doesn\'t mention — even ones you set separately moments earlier',
      points: [
        'The <code>background</code> shorthand is not additive — it is a full reset. It always sets all eight background sub-properties (<code>background-color</code>, <code>-image</code>, <code>-position</code>, <code>-size</code>, <code>-repeat</code>, <code>-origin</code>, <code>-clip</code>, <code>-attachment</code>), and any sub-property you don\'t explicitly include in the shorthand string gets reset to its own initial value.',
        'This is easy to miss because CSS specificity/cascade rules make it feel like a later, narrower declaration should only override what it mentions — but the shorthand isn\'t narrow. It always touches all eight properties, whether you wrote them or not.',
      ]
    },
    {
      heading: 'A previously-set background-size: cover silently reverts to auto the moment a background shorthand without a size is applied afterward',
      points: [
        'If you set <code>background-size: cover</code> on an element, then later apply <code>background: url(...) center no-repeat</code> (no size in the shorthand), the size doesn\'t stay at <code>cover</code> — it resets to its initial value, <code>auto</code>.',
        'This is directly checkable via <code>getComputedStyle().backgroundSize</code> before and after applying the shorthand — the computed value changes even though the shorthand statement never mentioned size at all.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>background shorthand resets unlisted sub-properties</title>
    <style>
      #tile { width: 120px; height: 80px; background-size: cover; background-position: center; background-repeat: no-repeat; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="tile"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const tile = document.querySelector<HTMLElement>('#tile')!;

console.log('before shorthand — background-size:', getComputedStyle(tile).backgroundSize);
console.log('before shorthand — background-position:', getComputedStyle(tile).backgroundPosition);

// This shorthand mentions position and repeat, but never size.
tile.style.background = "url('https://example.com/photo.jpg') center no-repeat";

console.log('after shorthand — background-size:', getComputedStyle(tile).backgroundSize);
console.log('after shorthand — background-position:', getComputedStyle(tile).backgroundPosition);
console.log('size silently reset to auto even though the shorthand never mentioned it:', getComputedStyle(tile).backgroundSize === 'auto');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A card component sets <code>background-size: cover</code> in its base CSS class. A later utility class adds <code>background: linear-gradient(...)</code> for a themed variant. Does the card still stretch its cover-sized background image, or does something change?',
    hint: 'Ask whether the second declaration is a narrow addition or a full shorthand that touches every background sub-property.',
    solution: 'The gradient declaration is a background shorthand, so it resets background-size back to auto even though it never mentions size — the card loses its cover sizing. Fix it by re-stating background-size: cover after the shorthand, or by only ever setting background-image (not the full shorthand) for the gradient.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Setting background: url(...) center no-repeat only changes the image, position, and repeat — everything else I set earlier, like background-size, stays untouched.',
      reality: 'The background shorthand always resets all eight background sub-properties to their initial values, then applies whatever the shorthand string specifies. Anything not mentioned in the shorthand reverts — it does not merge with prior declarations.'
    },
    {
      thought: 'CSS specificity means a later declaration only overrides what it explicitly sets, so my earlier background-size: cover should survive since the shorthand never mentions size.',
      reality: 'Specificity governs which declaration WINS when two rules target the SAME property. It doesn\'t change what the shorthand itself expands into — the shorthand expands into all eight longhand properties regardless, with the unmentioned ones set to their initial values.'
    },
    {
      thought: 'This only matters for background-size — the other background sub-properties are less commonly set, so it\'s a narrow edge case.',
      reality: 'The same reset applies to every sub-property the shorthand omits — background-origin, background-clip, background-attachment, and background-repeat are all just as susceptible. Any time a later background shorthand is applied, treat it as a full reset, not a partial update.'
    }
  ];
}
