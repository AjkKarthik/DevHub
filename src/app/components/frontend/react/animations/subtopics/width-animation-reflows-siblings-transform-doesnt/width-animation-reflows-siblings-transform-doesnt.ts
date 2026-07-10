import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-width-vs-transform-reflow-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './width-animation-reflows-siblings-transform-doesnt.html',
  styleUrl: './width-animation-reflows-siblings-transform-doesnt.scss',
})
export class WidthAnimationReflowsSiblingsTransformDoesntSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #3 Names "Layout Thrashing" — But What Does It Actually Move?',
      points: [
        'Mistake #3\'s explanation says animating width/height/margin/padding "triggers layout recalculation and paint on every frame," while transform/opacity "run on the GPU compositor thread with zero layout cost." This is stated as a performance claim, but it has a direct, VISIBLE consequence that has nothing to do with frame rate measurement: does a SIBLING element next to the animating box actually move during the animation?',
        'This subtopic renders a box animating its <code>width</code> directly next to a sibling box, alongside an identical setup animating <code>scaleX</code> (a transform) instead — and simply watches whether the sibling box\'s position visibly shifts during each animation.',
      ],
    },
    {
      heading: 'Why Layout Properties Move Siblings and Transform Never Does',
      points: [
        'width is a LAYOUT property — the browser\'s layout algorithm (flexbox, in a row) recalculates every affected element\'s position whenever an element\'s width changes, because it needs to know how much space is now available for elements after it. This recalculation is not optional or skippable; it is what "layout" means.',
        'transform (including scaleX) is applied AFTER layout, purely as a visual/paint-time transformation of an element\'s already-computed box — the browser does not re-run layout for a transform change, because transform is explicitly defined in the CSS spec to not affect the document flow or trigger reflow. A scaled element can visually grow into or over its neighbors, but it never actually pushes them.',
        'This is precisely why Mistake #3\'s recommended fix (<code>scaleX</code> + <code>transformOrigin</code> instead of literal <code>width</code>) works as a drop-in replacement for many "growing box" animations — visually the box appears to widen, but WITHOUT the layout recalculation cost, because no sibling ever needs to be told to move.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "framer-motion-reflow-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "framer-motion": "^11.0.0"
  },
  "scripts": {
    "start": "react-scripts start"
  }
}
`,
    },
    {
      path: 'public/index.html',
      content: `<!DOCTYPE html>
<html>
  <head><title>width vs transform reflow demo</title></head>
  <body>
    <div id="root"></div>
  </body>
</html>
`,
    },
    {
      path: 'src/index.js',
      content: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')).render(<App />);
`,
    },
    {
      path: 'src/App.js',
      content: `import { motion } from 'framer-motion';
import { useState } from 'react';

// Animating WIDTH directly -- a layout property.
function WidthRow() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 24 }}>
      <h3>Animating width (layout property)</h3>
      <button onClick={() => setOpen(o => !o)}>Toggle</button>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, background: '#f3f4f6' }}>
        <motion.div
          animate={{ width: open ? 200 : 60 }}
          transition={{ duration: 0.6 }}
          style={{ height: 40, background: '#0ea5e9' }}
        />
        <div style={{ height: 40, width: 40, background: 'red', flexShrink: 0 }}>
          SIB
        </div>
      </div>
      <p style={{ fontSize: 12, color: '#555' }}>Watch the red "SIB" box -- does it move as the blue box animates?</p>
    </div>
  );
}

// Animating scaleX (transform) instead -- no layout property touched.
function TransformRow() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <h3>Animating scaleX (transform)</h3>
      <button onClick={() => setOpen(o => !o)}>Toggle</button>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, background: '#f3f4f6' }}>
        <motion.div
          animate={{ scaleX: open ? 3.33 : 1 }}   // 60 * 3.33 ≈ 200, same visual size as above
          transition={{ duration: 0.6 }}
          style={{ height: 40, width: 60, background: '#0ea5e9', transformOrigin: 'left' }}
        />
        <div style={{ height: 40, width: 40, background: 'red', flexShrink: 0, marginLeft: 8 }}>
          SIB
        </div>
      </div>
      <p style={{ fontSize: 12, color: '#555' }}>Watch the red "SIB" box -- does IT move this time?</p>
    </div>
  );
}

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <p>Click both "Toggle" buttons and compare whether the red sibling box moves in each case.</p>
      <WidthRow />
      <TransformRow />
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Toggle" in both rows. In the width row, does the red "SIB" box move as the blue box grows? In the scaleX row, does the red box move?',
    hint: 'Ask which CSS property actually participates in the browser\'s layout algorithm — width does, transform explicitly does not.',
    solution: `In the width row, the red "SIB" box visibly SLIDES to the right as
the blue box's width animates from 60px to 200px -- because width is
a layout property, and the flex container has to recompute where
every element after the animating box belongs, on every single
animation frame. The sibling's movement isn't a side effect or a
bug; it's literally what "affecting layout" means.

In the scaleX row, the red "SIB" box stays COMPLETELY STILL, even
though the blue box visually grows to the exact same final size
(scaleX: 3.33 on a 60px box ≈ 200px, matching the width row's target).
The blue box visually overlaps or grows past where the red box was
positioned, because transform is a paint-time visual effect applied
AFTER layout is calculated -- the browser's layout engine has
already placed the red box based on the blue box's ORIGINAL,
unscaled 60px width, and transform never gets a chance to change
that calculation.

This is the exact, concrete meaning behind Mistake #3's "layout
thrashing" claim: it's not an abstract performance number, it's
directly observable as "does anything else on the page have to move
because of this animation." Zero other elements moving is the
signature of a transform-only animation; siblings shifting is the
signature of a layout-affecting one -- and that's also exactly why
the fix (scaleX/transformOrigin instead of width) requires slightly
more setup: the box's LAYOUT SPACE stays reserved at its original
size the whole time, only its visual paint grows into (or over)
whatever's already there.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the performance difference between animating width and animating transform is only measurable with performance-profiling tools — visually, the two approaches look identical.',
      reality: 'the difference is directly visible without any profiling tool — sibling elements physically move during a width animation (because layout recalculates their position) and stay completely still during a transform animation (because transform never touches layout).',
    },
    {
      thought: 'a scaleX-based "growing box" only visually approximates the same effect as animating width — it\'s a reasonable trade-off, not a literal equivalent.',
      reality: 'scaleX can produce the exact same final visual size as a width animation (with the right math and transformOrigin) — the actual trade-off is that the box\'s reserved LAYOUT SPACE does not grow with it, so surrounding content doesn\'t make room the way it would for a real width change.',
    },
    {
      thought: 'since scaleX doesn\'t affect layout, it\'s always a safe drop-in replacement for any width animation, with no visual difference to account for.',
      reality: 'because scaleX doesn\'t reserve new layout space, a genuinely growing UI element (like an expanding accordion that needs to push content below it down) still needs the layout prop or an actual width/height change — scaleX is the right tool specifically when nothing else needs to react to the size change.',
    },
  ];
}
