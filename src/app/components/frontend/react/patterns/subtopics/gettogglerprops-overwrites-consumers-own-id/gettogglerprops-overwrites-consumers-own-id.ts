import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-gettogglerprops-overwrites-id-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './gettogglerprops-overwrites-consumers-own-id.html',
  styleUrl: './gettogglerprops-overwrites-consumers-own-id.scss',
})
export class GettogglerpropsOverwritesConsumersOwnIdSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Same Function Follows Its Own Composition Rule for onClick, But Not for id',
      points: [
        'Mistake #4 establishes a rule: "Prop getters must compose, not overwrite." The fix\'s <code>onClick</code> field respects this precisely — it calls the consumer\'s handler first, then the internal one.',
        'The <code>useToggle</code> hook\'s own <code>getTogglerProps</code> function, right there on the main page, returns: <code>{ ...rest, \'aria-pressed\': on, id, onClick(e) {...} }</code>. Notice <code>id</code> sits AFTER <code>...rest</code> in the object literal — this subtopic tests what happens when a consumer passes their own <code>id</code> into <code>getTogglerProps({ id: \'my-id\' })</code>.',
      ],
    },
    {
      heading: 'Why id Loses to Object Literal Field Order, Silently',
      points: [
        'In a JS object literal, when the same key appears more than once, the LAST occurrence wins. <code>{ ...rest, id, ... }</code> spreads <code>rest</code> first (which may include the consumer\'s own <code>id</code>), then explicitly sets <code>id</code> to the internal <code>useId()</code> value — unconditionally overwriting whatever <code>rest.id</code> held, if anything.',
        'This is exactly the "overwrite" behavior Mistake #4 warns against for <code>onClick</code> — except here it happens to <code>id</code>, and there is no composition logic for it at all (unlike <code>onClick</code>, which explicitly destructures and re-wraps the consumer\'s version). A consumer calling <code>getTogglerProps({ id: \'my-custom-id\' })</code> gets their <code>id</code> silently discarded, with no error, warning, or any signal that their choice was ignored.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "gettogglerprops-id-overwrite-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
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
  <head><title>getTogglerProps and id overwrite</title></head>
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
      content: `import { useState, useId, useCallback } from 'react';

// The main page's own useToggle / getTogglerProps, unchanged.
function useToggle(defaultOn = false) {
  const [on, setOn] = useState(defaultOn);
  const id = useId();
  const toggle = useCallback(() => setOn(o => !o), []);

  function getTogglerProps({ onClick, ...rest } = {}) {
    return {
      ...rest,
      'aria-pressed': on,
      id, // <-- always the internal id, placed AFTER ...rest
      onClick(e) {
        onClick && onClick(e); // consumer's handler DOES run first (composes correctly)
        toggle();
      },
    };
  }

  return { on, toggle, getTogglerProps };
}

export default function App() {
  const { on, getTogglerProps } = useToggle();

  // Consumer explicitly asks for their OWN id.
  const props = getTogglerProps({
    id: 'my-custom-id',
    onClick: () => console.log('consumer onClick ran'),
  });

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <button {...props}>{on ? 'ON' : 'OFF'}</button>
      <p>Requested id: "my-custom-id"</p>
      <p>Actual id on the rendered button: "{props.id}"</p>
      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        The consumer explicitly passed id: 'my-custom-id' into
        getTogglerProps(). Does the button actually receive that id,
        or does it silently get replaced?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The consumer explicitly requested id: \'my-custom-id\'. Check the "Actual id on the rendered button" line — does it show the requested id, or something else?',
    hint: '`{ ...rest, id, ... }` — when the same key appears twice in an object literal, whichever occurrence comes LAST in the source wins, regardless of what the spread contained.',
    solution: `The "Actual id on the rendered button" line does NOT show
"my-custom-id" -- it shows the internally-generated useId() value
instead (something like ":r0:"), completely silently overwriting the
consumer's explicit request.

This is the direct consequence of { ...rest, id, ... } placing the
bare id field AFTER the ...rest spread in the object literal --
whatever id the consumer passed inside rest is simply discarded the
moment the internal id key gets assigned afterward. There is no
error, no console warning, nothing to indicate the consumer's choice
was ignored.

Notice the console DOES log "consumer onClick ran" when you click the
button -- onClick correctly composes both handlers, exactly as
Mistake #4 teaches. The SAME function, in the SAME return statement,
gets this right for onClick and wrong for id -- proving that "prop
getters must compose, not overwrite" is a rule the code author
clearly understood and applied to one field, but didn't apply
uniformly across every field the getter returns.

The practical lesson: a prop getter needs case-by-case attention to
EVERY field it returns, not just the "obvious" one like onClick or
onChange. A field like id, which a consumer might have real reasons
to set (linking to an external <label for>, matching a test selector,
matching a CSS rule), needs the same "consumer wins, or explicitly
merge" treatment.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'because `getTogglerProps` correctly composes the consumer\'s `onClick` handler with its own internal logic (calling both, in the right order), the function must apply that same composition philosophy consistently to every field it returns.',
      reality: 'composition has to be implemented per-field — `onClick` gets explicit merge logic in this exact function, while `id` is unconditionally overwritten by placement order in the object literal, with no merge logic applied to it at all.',
    },
    {
      thought: 'if a prop getter silently drops a value a consumer passed in, that would be visible immediately — either a console warning, a TypeScript error, or an obviously broken UI.',
      reality: 'a silently overwritten `id` produces a perfectly functional-looking button with zero errors or warnings — the only way to notice is checking the actual rendered `id` attribute against what was requested, exactly as this subtopic\'s demo does.',
    },
    {
      thought: 'this kind of field-overwrite bug would only matter for a genuinely custom, unusual field — common fields like `id`, `className`, or `style` are safe because prop getter libraries handle them specially.',
      reality: '`id` is arguably one of the MORE likely fields for a consumer to want to override (for accessibility linking, testing selectors, or CSS targeting) — there is nothing special about it that a naive prop getter implementation, like the one shown here, would automatically protect.',
    },
  ];
}
