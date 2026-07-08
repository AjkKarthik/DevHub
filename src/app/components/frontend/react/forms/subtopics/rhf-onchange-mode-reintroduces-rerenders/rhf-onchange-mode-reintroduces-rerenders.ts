import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-rhf-onchange-mode-reintroduces-rerenders-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './rhf-onchange-mode-reintroduces-rerenders.html',
  styleUrl: './rhf-onchange-mode-reintroduces-rerenders.scss',
})
export class RhfOnchangeModeReintroducesRerendersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two Claims That Are Never Checked Against Each Other',
      points: [
        'The theory section leads with: React Hook Form "does not re-render the component on every keystroke" because it registers inputs via refs. Separately, "Form UX best practices" recommends: "validate on blur (first time), then switch to on-change validation" for real-time feedback after the first touch.',
        'Both claims are accurate in isolation, but the page never checks whether they conflict. Switching to real-time (per-keystroke) validation means RHF has to know, after every keystroke, whether the form is still valid — does providing that live feedback require re-rendering the component on every keystroke, quietly giving back the exact re-render savings the theory section leads with?',
      ],
    },
    {
      heading: 'Why Real-Time Validation Has a Re-render Cost RHF\'s "No Re-render" Framing Doesn\'t Mention',
      points: [
        'RHF avoids re-renders for the SPECIFIC case of "user types, DOM updates via ref, nothing else needs to know yet." Real-time validation breaks that case on purpose: to show/hide an error message or update <code>formState.isValid</code> immediately after each keystroke, the component that renders those things MUST re-render — there is no way to update visible error text without a render.',
        'Setting <code>useForm({ mode: \'onChange\' })</code> (or accessing <code>formState.isValid</code> at all, which RHF proxies lazily and only subscribes to when read) causes RHF to re-run validation and re-render the calling component after every keystroke in every registered field — not just the field being typed into, since the whole form-level <code>isValid</code>/<code>errors</code> object is what changed.',
        'This is a genuine, direct trade-off the main page\'s own two sections point toward without ever stating explicitly: the "minimal re-renders" pitch is really about the DEFAULT mode (validate on submit); turning on the UX-recommended real-time validation mode reintroduces per-keystroke re-renders of the calling component, the exact cost controlled inputs were said to have.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "rhf-onchange-rerender-demo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "react-hook-form": "^7.49.3",
    "@hookform/resolvers": "^3.3.4",
    "zod": "^3.22.4"
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
  <head><title>RHF mode and re-render count</title></head>
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
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef } from 'react';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
});

// mode: 'onSubmit' -- RHF's default, matches the main page's
// "does not re-render on every keystroke" claim.
function DefaultModeForm() {
  const renderCount = useRef(0);
  renderCount.current += 1;
  const { register, formState: { isValid } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
  });
  // Reading formState.isValid subscribes this component to validity changes.
  return (
    <div>
      <h4>mode: 'onSubmit' (default)</h4>
      <p>Render count: {renderCount.current}</p>
      <input {...register('email')} placeholder="email" />
      <input {...register('password')} placeholder="password" />
    </div>
  );
}

// mode: 'onChange' -- the main page's own recommended real-time
// validation pattern, for showing errors after first touch.
function OnChangeModeForm() {
  const renderCount = useRef(0);
  renderCount.current += 1;
  const { register, formState: { isValid } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });
  return (
    <div>
      <h4>mode: 'onChange' (real-time validation)</h4>
      <p>Render count: {renderCount.current}</p>
      <input {...register('email')} placeholder="email" />
      <input {...register('password')} placeholder="password" />
    </div>
  );
}

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <DefaultModeForm />
      <OnChangeModeForm />
      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        Type a few characters into EACH form's email field. Compare
        the two render counts -- does typing increase either of them?
      </p>
    </div>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Type several characters into the "onSubmit" form\'s email field, then several characters into the "onChange" form\'s email field. Compare each form\'s render count before and after.',
    hint: 'formState.isValid is read (destructured) in both forms — RHF only re-renders on validity changes when something is actually subscribed to formState, and mode governs how often that validity is recomputed.',
    solution: `Typing into the mode: 'onSubmit' form's email field does NOT
increase its render count -- confirming the main page's "no re-render
per keystroke" claim, exactly as advertised.

Typing into the mode: 'onChange' form's email field DOES increase its
render count, roughly once per keystroke -- because RHF re-validates
the whole form (needed to know if isValid should change) after every
change, and this component reads formState.isValid, so it re-renders
whenever that validation completes.

This confirms the trade-off implied but never stated by the main
page: RHF's headline "no re-render on every keystroke" benefit is a
property of its DEFAULT validation timing, not an unconditional
guarantee. The moment you follow the page's own separate UX advice
("switch to on-change validation" for real-time feedback), you
reintroduce the per-keystroke re-render cost -- on the WHOLE form
component, not just the field being typed into, since formState is a
single object covering every field.

This isn't a reason to avoid real-time validation -- immediate
feedback is good UX -- but it means "RHF barely re-renders" should not
be assumed to still hold once mode: 'onChange' (or formState.isValid)
is in play. Uncontrolled-input performance and real-time validation
are in tension, not simultaneously free.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'React Hook Form\'s "minimal re-renders" advantage over controlled inputs holds unconditionally, regardless of which `mode` option is passed to `useForm()`.',
      reality: 'the "no re-render per keystroke" behavior is specific to the default `mode: \'onSubmit\'` — switching to `mode: \'onChange\'` (needed for the main page\'s own recommended real-time validation UX) reintroduces a re-render on every keystroke for any component reading `formState`.',
    },
    {
      thought: 'the main page\'s "validate on blur first, then switch to real-time validation" UX recommendation and its "RHF avoids re-rendering on every keystroke" performance claim are fully compatible — one is about UX, the other about performance, with no interaction.',
      reality: 'they are in direct tension for the SAME field once real-time (on-change) validation is active — the UX improvement is implemented via a mechanism (frequent re-validation) that necessarily costs the re-render savings the performance claim describes.',
    },
    {
      thought: 'the re-render triggered by `mode: \'onChange\'` is scoped to just the field being typed into, similar to how a controlled input only affects its own component.',
      reality: '`formState` (including `isValid` and `errors`) is a single object covering the WHOLE form — any component that reads any part of it re-renders on every validity change, regardless of which specific field the user is currently typing into.',
    },
  ];
}
