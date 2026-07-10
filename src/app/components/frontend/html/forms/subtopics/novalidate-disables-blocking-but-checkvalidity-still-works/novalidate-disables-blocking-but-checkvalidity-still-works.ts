import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-novalidate-checkvalidity-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './novalidate-disables-blocking-but-checkvalidity-still-works.html',
  styleUrl: './novalidate-disables-blocking-but-checkvalidity-still-works.scss',
})
export class NovalidateAttributeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own QnA and Theory, Proven With a Genuinely Submittable Invalid Form',
      points: [
        'The main page\'s theory states: "Use the <code>novalidate</code> attribute on <code>&lt;form&gt;</code> to disable browser validation and handle it yourself with JS." Its Quiz Q5 clarifies further: it disables the browser\'s automatic blocking "so you can handle it with JavaScript" — while the <code>required</code>/<code>pattern</code> attributes remain "as hints for your own code." This subtopic proves BOTH halves of that claim: a <code>novalidate</code> form with an empty <code>required</code> field genuinely submits (no native error bubble blocks it), while <code>form.checkValidity()</code> still correctly reports the field as invalid.',
        '<code>novalidate</code> does not remove, disable, or nullify the constraint validation ATTRIBUTES (<code>required</code>, <code>pattern</code>, <code>min</code>, etc.) themselves — it only disables the BROWSER\'S OWN automatic behavior of blocking submission and showing a native validation bubble when those constraints fail. The underlying Constraint Validation API (<code>checkValidity()</code>, <code>reportValidity()</code>, the <code>validity</code> property) keeps working exactly as if <code>novalidate</code> weren\'t there.',
      ],
    },
    {
      heading: 'Why This Split Exists — It\'s What Makes Custom Validation UX Possible',
      points: [
        'If <code>novalidate</code> ALSO disabled the underlying constraint attributes\' meaning, there would be no way to build custom validation UI (a styled error message, a shake animation, a toast) that still leverages the SAME <code>required</code>/<code>pattern</code> rules already declared in the markup — you\'d have to re-implement every validation rule in JavaScript from scratch, duplicating logic that already exists as HTML attributes.',
        'Instead, the standard pattern is: add <code>novalidate</code> to suppress the browser\'s native (often visually inconsistent across browsers) validation bubbles, then call <code>form.checkValidity()</code> (or <code>input.validity.valid</code> per-field) yourself inside a <code>submit</code> event handler, and render your OWN styled error UI based on exactly the same validation rules the HTML attributes already declare.',
        '<code>reportValidity()</code> is the middle ground worth knowing: unlike <code>checkValidity()</code> (which silently returns true/false), <code>reportValidity()</code> DOES trigger the browser\'s native validation bubble UI on the first invalid field — useful if you want the native bubble behavior back at a specific moment under your own control, rather than automatically on every submit attempt.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>novalidate demo</title>
</head>
<body>
  <form id="signup-form" novalidate>
    <label for="email-field">Email (required, left EMPTY)</label>
    <input id="email-field" name="email" type="email" required>
    <button type="submit">Submit</button>
  </form>

  <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
  <script type="module" src="index.ts"></script>
</body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const form = document.getElementById('signup-form') as HTMLFormElement;
const emailField = document.getElementById('email-field') as HTMLInputElement;

let submitCount = 0;
form.addEventListener('submit', (e) => {
  submitCount++;
  console.log('--- submit event #' + submitCount + ' fired ---');
  console.log('emailField.value (empty, but required):', JSON.stringify(emailField.value));

  console.log('--- Checking validity via the Constraint Validation API ---');
  console.log('emailField.validity.valid:', emailField.validity.valid, '<-- correctly reports INVALID, even with novalidate on the form');
  console.log('emailField.validity.valueMissing:', emailField.validity.valueMissing, '<-- specifically flags the missing required value');
  console.log('form.checkValidity():', form.checkValidity(), '<-- the whole form correctly reports invalid too');

  console.log('--- Because novalidate is set, does the browser block this submission automatically? ---');
  console.log('(If novalidate were NOT set, a native "Please fill out this field" bubble would have appeared and submission would have been blocked BEFORE this handler ever ran.)');
  console.log('This handler DID run, proving novalidate successfully suppressed that automatic blocking.');

  e.preventDefault(); // just to keep this demo from actually navigating away
  console.log('--- Custom validation UI would go here, driven by the SAME validity info above ---');
});

console.log('Programmatically submitting the form now (simulating a user clicking Submit)...');
form.requestSubmit();

console.log('--- For comparison: reportValidity() DOES trigger the native bubble UI on demand ---');
console.log('form.reportValidity() would show the native "Please fill out this field" bubble RIGHT NOW, unlike checkValidity() which stays silent.');
form.reportValidity();`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The email field is <code>required</code> but left empty, and the form has <code>novalidate</code>. Does the <code>submit</code> event handler actually run? Does <code>form.checkValidity()</code> still correctly report the form as invalid?',
    hint: 'Ask specifically what novalidate turns off -- the constraint validation ATTRIBUTES themselves, or just the browser\'s own automatic "block submission and show a bubble" behavior on top of them?',
    solution: `Yes to both -- the submit event handler runs completely normally
(you see "submit event #1 fired" in the console), proving novalidate
successfully suppressed the browser's automatic submission-blocking
behavior for the missing required field. AND form.checkValidity()
still correctly returns false, with emailField.validity.valueMissing
reporting true -- the underlying constraint validation logic is
completely unaffected by novalidate.

This is exactly the split the main page's theory describes: novalidate
only disables the BROWSER'S OWN reflexive behavior of blocking
submission and popping up a native "Please fill out this field"
bubble. It does nothing to the required attribute's actual meaning,
or to the Constraint Validation API (validity, checkValidity(),
reportValidity()) that reads that meaning -- those keep working
exactly as if novalidate weren't there at all.

The final reportValidity() call demonstrates the middle ground: it's
a DIFFERENT method from checkValidity() specifically because it DOES
trigger the native bubble UI, on demand, whenever you choose to call
it -- letting you selectively bring back the native validation
experience at a moment of your own choosing, rather than
automatically on every submit attempt.

This split is precisely what makes custom validation UX possible
without reimplementing every rule from scratch in JavaScript -- your
custom error-rendering code can read the exact same required/pattern
rules already declared in the HTML, via the same validity object the
browser itself uses internally.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'adding novalidate to a form removes the meaning of its required/pattern/min attributes entirely — the constraint validation attributes become inert, decorative markup once novalidate is present.',
      reality: 'novalidate only disables the browser\'s own automatic behavior of BLOCKING submission and showing a native validation bubble — the constraint attributes keep their full meaning, readable via checkValidity(), reportValidity(), and the validity property, exactly as if novalidate weren\'t set.',
    },
    {
      thought: 'if novalidate is set on a form, calling form.checkValidity() would always return true, since validation has effectively been "turned off" for that form.',
      reality: 'checkValidity() reads the SAME underlying constraint rules regardless of novalidate — it correctly returns false for a form with an empty required field whether or not novalidate is present; novalidate only affects the browser\'s automatic submit-blocking behavior, not what checkValidity() itself reports.',
    },
    {
      thought: 'checkValidity() and reportValidity() are just two names for the exact same operation — calling either one produces the identical visible result.',
      reality: 'these are meaningfully different — checkValidity() silently returns a boolean with no visible UI effect, while reportValidity() additionally triggers the browser\'s native validation bubble on the first invalid field, giving you a way to selectively bring back that native UI on demand.',
    },
  ];
}
