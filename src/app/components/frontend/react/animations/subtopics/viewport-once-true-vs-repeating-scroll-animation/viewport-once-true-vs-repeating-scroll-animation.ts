import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-viewport-once-vs-repeat-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './viewport-once-true-vs-repeating-scroll-animation.html',
  styleUrl: './viewport-once-true-vs-repeating-scroll-animation.scss',
})
export class ViewportOnceTrueVsRepeatingScrollAnimationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Theory Section States the Behavior Plainly — Worth Verifying Directly',
      points: [
        'The Gesture animations theory says: "viewport={{ once: true }}: the whileInView animation fires only on the first scroll-into-view. Without it, the animation reverses when the element scrolls out and repeats on every re-entry." This is a precise, testable claim about a default behavior that is easy to accidentally ship without realizing it.',
        'This subtopic builds two identical scroll-triggered reveal sections in a tall scrollable container — one with <code>viewport={{ once: true }}</code>, one without it (the default) — so scrolling an element in and out of view repeatedly shows the literal difference the theory describes.',
      ],
    },
    {
      heading: 'Why the Default Behaves This Way',
      points: [
        'whileInView is fundamentally built on an IntersectionObserver watching whether the element is currently within the viewport. By default, that observer keeps firing for BOTH directions — entering AND leaving — because Framer Motion has no way to know, without being told, whether you want a one-time reveal or a genuinely toggle-able in/out state.',
        'viewport={{ once: true }} tells Framer Motion to disconnect the observer (or ignore further callbacks) after the FIRST time the element enters the viewport — the animation plays once, and the element then holds its animate state permanently, regardless of how many more times the user scrolls it in and out.',
        'The practical consequence for a real page: a "fade in on scroll" reveal animation intended as a one-time entrance effect will, WITHOUT once: true, replay every single time the user scrolls up and back down past that section — often perceived as glitchy or repetitive rather than polished, especially on a long page a user scrolls up and down while reading.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "framer-motion-viewport-once-demo",
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
  <head><title>viewport.once demo</title></head>
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

function Spacer({ label }) {
  return (
    <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
      {label}
    </div>
  );
}

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', height: '100vh', overflowY: 'scroll', padding: 20 }}>
      <p>Scroll down slowly, then scroll back UP past each box, then back down again. Watch each box's counter.</p>

      <Spacer label="Scroll down ↓" />

      <BoxWithCounter title="viewport={{ once: true }}" once={true} />

      <Spacer label="keep scrolling ↓" />

      <BoxWithCounter title="No viewport.once (default)" once={false} />

      <Spacer label="Scroll back UP to re-trigger, then back down" />
    </div>
  );
}

function BoxWithCounter({ title, once }) {
  const playCountRef = React.useRef(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-100px' }}
      onAnimationStart={() => { playCountRef.current += 1; }}
      style={{ background: '#0ea5e9', color: '#fff', padding: 24, borderRadius: 12, textAlign: 'center' }}
    >
      <h3>{title}</h3>
      <p>This animation has started {'{'}playCountRef.current{'}'} times so far -- reload to reset.</p>
    </motion.div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Scroll both boxes into view, then scroll back up past them, then back down again — repeat 2-3 times. Which box\'s animation replays each time, and which one stays static after the first reveal?',
    hint: 'Ask which box\'s IntersectionObserver keeps firing on every entry vs disconnects after the first one.',
    solution: `The "No viewport.once (default)" box replays its fade-in animation
EVERY time it scrolls back into view -- scroll it out, scroll it
back in, and it fades in again from opacity 0, exactly as the theory
section's "reverses when the element scrolls out and repeats on
every re-entry" describes. Its internal play-count would increment
on every single re-entry.

The "viewport={{ once: true }}" box plays its fade-in animation
exactly ONCE, the very first time it enters the viewport -- after
that, no matter how many more times you scroll it out and back in,
it stays visually settled at its final animate state (opacity 1,
y: 0) and does not replay.

This confirms the theory section's claim precisely, and makes the
DEFAULT behavior (once: false, implicitly) concrete: without adding
{{ once: true }} explicitly, EVERY whileInView reveal on a page will
replay on every scroll re-entry -- for a typical "fade in as you
scroll down the page" design intent, this is very likely NOT what
was wanted, since real users often scroll up briefly (to re-read
something) and back down while reading a long page, which would
replay the animation each time under the default setting.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'whileInView animations only play once by default — viewport.once is for the opposite case, when you deliberately WANT the animation to repeat.',
      reality: 'the DEFAULT behavior (viewport.once unset, effectively false) is to REPLAY the animation on every scroll re-entry — once: true is what you add to get the one-time reveal that most "fade in on scroll" designs actually intend.',
    },
    {
      thought: 'a repeating whileInView animation without once: true is a rare edge case that only shows up with unusual scrolling patterns.',
      reality: 'this is a very common real-world scenario — any user scrolling up briefly to re-read content and then back down will retrigger the animation, making the missing once: true immediately noticeable on ordinary, everyday page reading behavior.',
    },
    {
      thought: 'viewport.once controls whether the IntersectionObserver is created at all — setting it to false means whileInView never actually observes the element.',
      reality: 'the observer is created and active either way — once controls whether it keeps firing (and the animation keeps replaying) after the FIRST successful entry, or disconnects/is ignored after that first trigger.',
    },
  ];
}
