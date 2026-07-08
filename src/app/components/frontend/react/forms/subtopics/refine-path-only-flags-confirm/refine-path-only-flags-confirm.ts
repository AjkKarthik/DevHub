import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-refine-path-only-flags-confirm-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './refine-path-only-flags-confirm.html',
  styleUrl: './refine-path-only-flags-confirm.scss',
})
export class RefinePathOnlyFlagsConfirmSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page Shows Only the Field That Gets Flagged',
      points: [
        'The React Hook Form + Zod code tab and Quiz Q7 both show the exact same pattern: <code>.refine(d =&gt; d.password === d.confirm, { message: \'Passwords do not match\', path: [\'confirm\'] })</code>.',
        'Both fields — <code>password</code> and <code>confirm</code> — are equally responsible for the mismatch; neither one is "more wrong" than the other. But <code>path</code> only lists <code>[\'confirm\']</code>. This subtopic tests what actually happens to <code>errors.password</code> when this exact refine fails — does it also get flagged, or does ONLY the listed field show an error?',
      ],
    },
    {
      heading: 'Why path Is a Manual, One-Sided Assignment',
      points: [
        '<code>.refine()</code> validates the WHOLE schema object as a unit — its failure is not inherently "about" any single field. The <code>path</code> option is how the developer manually tells Zod (and by extension React Hook Form) which field(s) in <code>formState.errors</code> should receive the resulting error.',
        '<code>path: [\'confirm\']</code> means exactly that and nothing more: only <code>errors.confirm</code> gets populated. <code>errors.password</code> is completely untouched by this refine — from RHF\'s perspective, the <code>password</code> field individually passed its own rule (<code>z.string().min(8)</code>) and has no idea the refine even ran.',
        'This is a deliberate design choice, not a bug — but it means a form built exactly like the main page\'s own example visually flags only the SECOND password field as wrong, even though a user re-reading their FIRST password field would find nothing indicating anything is amiss there.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'package.json',
      content: `{
  "name": "refine-path-demo",
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
  <head><title>refine() path and cross-field errors</title></head>
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

// The main page's own exact schema and refine, unchanged.
const schema = z.object({
  password: z.string().min(8, 'Min 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

export default function App() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(() => {})} style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <div>
        <label>Password <input type="password" {...register('password')} /></label>
        <p>errors.password: {errors.password ? errors.password.message : '(none)'}</p>
      </div>
      <div>
        <label>Confirm <input type="password" {...register('confirm')} /></label>
        <p>errors.confirm: {errors.confirm ? errors.confirm.message : '(none)'}</p>
      </div>
      <button type="submit">Submit</button>
      <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
        Type two DIFFERENT values into the two fields, then click
        Submit. Which field(s) show an error?
      </p>
    </form>
  );
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Type two different (8+ character) values into Password and Confirm, then click Submit. Which of errors.password / errors.confirm actually shows a message?',
    hint: '`path: [\'confirm\']` in the refine is the ONLY thing that decides which field gets the resulting error — password individually already passed its own min(8) rule.',
    solution: `errors.confirm shows "Passwords do not match". errors.password
shows "(none)" -- completely unflagged, even though the two fields
are equally responsible for the mismatch.

This confirms path: ['confirm'] does exactly what it says: it routes
the refine's single error to formState.errors.confirm only. RHF has
no independent signal that password is "wrong" in this scenario --
its own individual rule (min(8)) passed, and nothing else points an
error at it.

The practical lesson: a form built exactly like the main page's own
example will visually clear the FIRST password field of any error
indicator, even while the whole form remains invalid because of a
mismatch. A user re-checking their first password entry, guided by
the UI's error styling, has no visual cue to look there -- only the
second field shows red. If both fields should visually indicate the
problem, path needs to list both: path: ['password', 'confirm'], or
the message needs to be shown at the form level instead of pinned to
a single field.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'when a `.refine()` cross-field check fails, React Hook Form intelligently flags every field that was involved in the comparison — `password` and `confirm` would both show an error for a mismatch.',
      reality: 'only the field(s) explicitly listed in the refine\'s `path` option receive the error — `password` in this exact example receives nothing at all, regardless of how "involved" it conceptually is in the mismatch.',
    },
    {
      thought: 'the main page\'s `path: [\'confirm\']` choice is an arbitrary example detail — listing `path: [\'password\']` instead, or omitting `path` entirely, would produce an equivalent user experience.',
      reality: 'the choice of `path` directly and solely determines which field\'s error UI lights up — omitting `path` attaches the error to the schema root instead of any field (typically requiring separate root-level error handling to display it at all), and swapping to `[\'password\']` would flag the opposite field.',
    },
    {
      thought: 'a field with no active `errors.<field>` entry after a failed submit can be assumed to have passed all relevant validation, including cross-field checks.',
      reality: '`errors.password` being empty here says only that password passed its OWN rule — a cross-field refine can fail entirely without that failure ever touching a specific field\'s own error slot, depending entirely on how `path` was written.',
    },
  ];
}
