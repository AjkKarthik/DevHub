import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-watch-rerenders-whole-component-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './watch-rerenders-whole-component-every-keystroke.html',
  styleUrl: './watch-rerenders-whole-component-every-keystroke.scss',
})
export class WatchRerendersWholeComponentEveryKeystrokeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #1 Names the Problem, But Not Its Blast Radius',
      points: [
        'Mistake #1\'s explanation says: "watch() causes a re-render every time the watched field changes... use getValues() inside event handlers for one-shot reads." What it doesn\'t make explicit is WHICH component re-renders — the answer is the ENTIRE component that called watch(), not just the piece of JSX that displays the watched value.',
        'This subtopic renders a visible count of re-renders alongside a watch() call and a getValues()-based equivalent, side by side in the same component, to show exactly how many times each approach causes the whole component function to run while typing in a completely unrelated field.',
      ],
    },
    {
      heading: 'Why RHF\'s Whole Performance Pitch Is Undermined by One watch() Call',
      points: [
        'RHF\'s core selling point (from the main page\'s own theory) is that register() uses refs so typing causes ZERO re-renders. Calling watch() anywhere in a component opts that ENTIRE component back into React state-driven re-rendering for every keystroke in the watched field — undoing the exact optimization RHF exists to provide, for that component.',
        'This is a per-component cost, not a per-field cost: if a form has 10 fields and you watch just 1 of them, typing in that ONE field re-renders the whole component (including the other 9 fields\' surrounding JSX, any computed values, any conditional rendering) on every keystroke — not just the watched field\'s own display.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "rhf-watch-rerender-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "react-hook-form": "^7.51.0"
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
  <head><title>watch() re-render demo</title></head>
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
      content: `import { useForm } from 'react-hook-form';
import { useRef } from 'react';

// A form with watch() -- the whole component re-renders on every
// keystroke in the watched field.
function WatchedForm() {
  const { register, watch } = useForm({ defaultValues: { name: '', notes: '' } });
  const renderCount = useRef(0);
  renderCount.current += 1;

  const name = watch('name');   // subscribes the WHOLE component to name changes

  return (
    <div style={{ border: '1px solid #ccc', padding: 12, marginBottom: 16 }}>
      <h3>Using watch('name')</h3>
      <p>Render count: <strong>{renderCount.current}</strong></p>
      <input {...register('name')} placeholder="Type here (watched)" />
      <input {...register('notes')} placeholder="Type here too (NOT watched)" />
      <p>Live value: {name}</p>
    </div>
  );
}

// A form with NO watch() -- register()'s refs mean zero re-renders
// while typing in either field.
function UnwatchedForm() {
  const { register, getValues } = useForm({ defaultValues: { name: '', notes: '' } });
  const renderCount = useRef(0);
  renderCount.current += 1;

  return (
    <div style={{ border: '1px solid #ccc', padding: 12 }}>
      <h3>No watch() -- getValues() only</h3>
      <p>Render count: <strong>{renderCount.current}</strong></p>
      <input {...register('name')} placeholder="Type here (unwatched)" />
      <input {...register('notes')} placeholder="Type here too" />
      <button type="button" onClick={() => alert(JSON.stringify(getValues()))}>
        Read current values (one-shot)
      </button>
    </div>
  );
}

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <p>Type in each form's fields and compare the render counts.</p>
      <WatchedForm />
      <UnwatchedForm />
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Type 5 characters into the "watched" field in the top form, then type 5 characters into its unwatched "notes" field in the SAME form. Compare both render counts to the bottom form\'s render count after typing 10 characters total.',
    hint: 'watch() subscribes the whole component, not just the field it watches — check whether typing in the NON-watched field in the top form also bumps the render count.',
    solution: `Typing in EITHER field of the top form (WatchedForm) bumps the
render count by 1 per keystroke -- including the "notes" field,
which is never passed to watch() at all. This confirms the
subtopic's core claim: watch() subscribes the WHOLE component to
re-render on relevant changes, not just the specific input it names
-- every keystroke anywhere that triggers RHF's internal state
update causes the component function to run again while any watch()
call is active in it.

The bottom form (UnwatchedForm) stays at render count 1 no matter
how much you type in either field -- confirming RHF's refs-based
uncontrolled approach genuinely produces zero re-renders while
typing, exactly as the main page's theory claims, but ONLY when no
watch() call is present anywhere in that component.

This is the practical lesson: a single watch() call, even one
watching just one field for a live preview, opts the ENTIRE
component back into state-driven re-rendering for every RHF update --
not a narrow, field-scoped cost. For a form with many fields, isolate
the watch() call into its own small child component (or use RHF's
useWatch hook, which subscribes independently of the parent) so the
re-render cost is contained to just that piece of UI.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'watch(\'fieldName\') only causes the specific piece of JSX displaying that field\'s value to re-render, similar to how a signal or fine-grained reactive value would.',
      reality: 'watch() causes the ENTIRE component function that called it to re-render — React has no way to re-run only part of a component, so every keystroke in the watched field re-executes the whole component, including unrelated JSX and other inputs\' surrounding code.',
    },
    {
      thought: 'watching one field out of many in a form only costs re-renders proportional to that one field — the other fields stay just as fast as before.',
      reality: 'the re-render cost is per-component, not per-field — typing in ANY field that triggers an RHF update while a watch() call exists anywhere in that component causes the whole component (all fields\' JSX included) to re-render.',
    },
    {
      thought: 'since RHF is fundamentally uncontrolled, there\'s no way to accidentally undo that performance benefit short of switching to useState entirely.',
      reality: 'a single watch() call is enough to reintroduce full re-render-on-every-keystroke behavior for that component, even though every input is still technically registered via register() and uncontrolled at the DOM level.',
    },
  ];
}
