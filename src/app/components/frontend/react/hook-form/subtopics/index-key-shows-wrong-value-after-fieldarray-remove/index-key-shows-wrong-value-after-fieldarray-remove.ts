import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-index-key-fieldarray-remove-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './index-key-shows-wrong-value-after-fieldarray-remove.html',
  styleUrl: './index-key-shows-wrong-value-after-fieldarray-remove.scss',
})
export class IndexKeyShowsWrongValueAfterFieldarrayRemoveSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #2 Names the Bug, But Never Shows It Actually Happening',
      points: [
        'Mistake #2\'s explanation says using array index as key "causes inputs to receive wrong values and animations to glitch when items are reordered or removed from the middle of the array" — a strong claim, but the main page never shows an actual sequence of user actions that triggers it.',
        'This subtopic builds exactly that sequence: type distinct text into 3 rows, remove the MIDDLE row, and directly compare what the remaining rows show with index-as-key versus field.id-as-key. The difference is not subtle — it is the wrong text sitting in the wrong row.',
      ],
    },
    {
      heading: 'Why the Uncontrolled-Input Nature of RHF Makes This Worse Than a Typical React List',
      points: [
        'In an ordinary React list of controlled inputs, a wrong key still causes an issue, but the VALUE is at least coming from React state, which gets reconciled (if imperfectly) against the new array. RHF inputs are UNCONTROLLED — register() attaches values via ref, and the actual text sitting in the DOM input element is not being re-set by React on every render.',
        'When React reuses a DOM node because of a matching (but semantically wrong) key, the uncontrolled input\'s ACTUAL TYPED TEXT stays physically in that DOM node — React has no reason to touch it, because from React\'s perspective, "the same key" means "the same element, don\'t touch its uncontrolled content." The result: after removing the middle item, the remaining rows visually show the WRONG typed values, sitting in the wrong logical row, with no re-render needed to cause it — it is a direct consequence of index keys plus DOM node reuse plus uncontrolled inputs.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "rhf-fieldarray-key-demo",
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
  <head><title>useFieldArray key demo</title></head>
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
      content: `import { useForm, useFieldArray } from 'react-hook-form';

// WRONG: keyed by index.
function IndexKeyedForm() {
  const { register, control } = useForm({
    defaultValues: { items: [{ name: '' }, { name: '' }, { name: '' }] },
  });
  const { fields, remove } = useFieldArray({ control, name: 'items' });

  return (
    <div style={{ border: '1px solid #ccc', padding: 12, marginBottom: 16 }}>
      <h3>Keyed by index (wrong)</h3>
      {fields.map((field, index) => (
        <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <input {...register(\`items.\${index}.name\`)} placeholder={\`Row \${index}\`} />
          <button type="button" onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
    </div>
  );
}

// CORRECT: keyed by field.id, RHF's own stable identifier.
function StableKeyedForm() {
  const { register, control } = useForm({
    defaultValues: { items: [{ name: '' }, { name: '' }, { name: '' }] },
  });
  const { fields, remove } = useFieldArray({ control, name: 'items' });

  return (
    <div style={{ border: '1px solid #ccc', padding: 12 }}>
      <h3>Keyed by field.id (correct)</h3>
      {fields.map((field, index) => (
        <div key={field.id} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <input {...register(\`items.\${index}.name\`)} placeholder={\`Row \${index}\`} />
          <button type="button" onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <p>
        In BOTH forms: type "AAA" in row 0, "BBB" in row 1, "CCC" in
        row 2. Then click Remove on row 1 (the middle one, "BBB") in
        BOTH forms. Compare what the remaining two rows show.
      </p>
      <IndexKeyedForm />
      <StableKeyedForm />
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In both forms, type "AAA" in row 0, "BBB" in row 1, "CCC" in row 2. Click Remove on the middle row ("BBB") in BOTH forms. What does each form show in its two remaining rows afterward?',
    hint: 'Ask: after removal, does React reuse the SAME DOM input elements for the wrong logical rows, and if so, what uncontrolled text is physically still sitting inside them?',
    solution: `Index-keyed form: after removing the middle row, the two remaining
rows show "AAA" and "CCC" -- but a closer look reveals the SECOND
row (which is now logically item index 1, previously holding "CCC"
in position 2) is showing "CCC" in a position that used to belong to
"BBB". More precisely: React sees keys 0 and 1 both still exist
after removal (there were keys 0,1,2 before; now there are just 0,1
for the two remaining items) -- so it reuses the SAME two DOM input
elements for positions 0 and 1. The DOM node that physically had
"AAA" typed into it stays at position 0 (correct, coincidentally),
but the DOM node that physically had "BBB" typed into it is now
reused for what should be "CCC" -- so it still shows "BBB", the
STALE uncontrolled value, not "CCC".

Stable-keyed form (field.id): after removing the middle row, the two
remaining rows correctly show "AAA" and "CCC" -- because field.id
values are tied to the actual array items, not positions. React
correctly identifies that the DOM node for "BBB"'s field.id should
be REMOVED (not reused), while the DOM nodes for "AAA" and "CCC"'s
own stable field.ids are preserved as-is, each keeping its own
correct value.

This confirms the exact mechanism the theory section describes:
uncontrolled inputs make wrong-key bugs WORSE than in a typical
controlled list, because React has no value to re-set on the reused
DOM node -- whatever was physically typed into it stays there,
silently attached to the wrong logical row.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'index keys are risky for controlled React lists, but since RHF fields are uncontrolled (values live in the DOM, not React state), index keys should actually be SAFER here, not riskier.',
      reality: 'the opposite is true — because RHF inputs are uncontrolled, React has no state value to re-apply to a reused DOM node when the key incorrectly matches across a reordered/removed list, so the STALE typed text stays physically stuck in the wrong row\'s input element.',
    },
    {
      thought: 'the index-key bug only shows up with fast typing or React 18\'s concurrent rendering — under normal conditions the list corrects itself.',
      reality: 'the bug is a direct, deterministic consequence of key-based DOM node reuse — it happens every time an item is removed/reordered from the middle of an index-keyed list of uncontrolled inputs, regardless of typing speed or React version.',
    },
    {
      thought: 'field.id fixes the bug by triggering a re-render that syncs the input values correctly.',
      reality: 'field.id fixes the bug by giving React the correct information to NOT reuse the wrong DOM node in the first place — it prevents the stale-value problem from ever occurring, rather than correcting it after the fact via a re-render.',
    },
  ];
}
