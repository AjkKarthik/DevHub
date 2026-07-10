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
  selector: 'app-name-not-id-formdata-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './name-not-id-determines-the-submitted-formdata-key.html',
  styleUrl: './name-not-id-determines-the-submitted-formdata-key.scss',
})
export class NameNotIdDeterminesSubmittedKeySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Claim, Proven With a Real Missing Field',
      points: [
        'The main page states directly: "The <code>name</code> attribute (not <code>id</code>) is what determines the key used when form data is submitted — a common beginner mistake is setting only an <code>id</code> and wondering why the field never appears in the submitted data." This subtopic builds a form with one input that has ONLY an <code>id</code> (no <code>name</code>) and one that has both, then reads the actual submitted data via <code>FormData</code> — proving the id-only field is genuinely, completely absent.',
        '<code>id</code> and <code>name</code> serve two COMPLETELY DIFFERENT purposes that happen to often look similar or identical in example code, which is exactly why this mistake is so easy to make: <code>id</code> exists for DOM/CSS purposes (label association via <code>for</code>, JavaScript\'s <code>getElementById</code>, CSS selectors) — it has NOTHING to do with what gets submitted. <code>name</code> is the ACTUAL submission key, used in nothing but form submission and <code>FormData</code>.',
      ],
    },
    {
      heading: 'Why This Silent Omission Is Especially Dangerous',
      points: [
        'An input missing its <code>name</code> attribute doesn\'t throw any error, doesn\'t fail HTML validation, and looks and behaves completely normally to the user filling out the form — they can type into it, see their input reflected, everything APPEARS to work right up until the form is actually submitted and that field\'s data is simply, silently, never there.',
        'This is especially easy to introduce by accident in a form built with a component library or a copy-pasted template, where a developer might rename or add an <code>id</code> for styling/testing purposes (like adding a <code>data-testid</code> or a unique <code>id</code> for a specific CSS override) while forgetting the field ALSO needs its own distinct <code>name</code>, or assuming the two are somehow linked when they are entirely independent attributes.',
        '<code>FormData(formElement)</code> is precisely the mechanism that makes this observable — it walks the form\'s actual controls and collects exactly the <code>name</code>/value pairs that would be sent in a real submission, which is why inspecting a <code>FormData</code> object (rather than just looking at the rendered inputs) is the reliable way to verify a form is actually wired up correctly.',
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
  <title>name vs id demo</title>
</head>
<body>
  <form id="signup-form">
    <label for="username-field">Username</label>
    <input id="username-field" name="username" type="text" value="alice">

    <label for="email-field">Email (missing name attribute!)</label>
    <input id="email-field" type="email" value="alice@example.com">

    <label for="bio-field">Bio</label>
    <input id="bio-field" name="bio" type="text" value="Frontend developer">
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

console.log('--- All THREE inputs are visibly filled in and rendering correctly ---');
console.log('username-field value:', (document.getElementById('username-field') as HTMLInputElement).value);
console.log('email-field value:', (document.getElementById('email-field') as HTMLInputElement).value, '<-- has a value, looks completely normal');
console.log('bio-field value:', (document.getElementById('bio-field') as HTMLInputElement).value);

console.log('--- Now inspecting what would ACTUALLY be submitted, via FormData ---');
const formData = new FormData(form);
const entries = Array.from(formData.entries());
console.log('FormData entries:', entries);

console.log('--- Was "email" (or ANY key for the email field) present in the submission? ---');
console.log('formData.has("email"):', formData.has('email'));
console.log('formData.get("email"):', formData.get('email'));

console.log('--- Total number of visible inputs vs. total FormData entries ---');
console.log('Visible <input> elements in the form:', form.querySelectorAll('input').length);
console.log('Entries that would actually be submitted:', entries.length, '<-- one fewer! the email field vanished entirely');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The email field has an <code>id</code> and a value, and renders exactly like the other two fields. Does it appear anywhere in the form\'s submitted <code>FormData</code>?',
    hint: 'Ask what FormData(formElement) actually reads from each control to build its entries -- is it keyed by id, or by a completely different attribute?',
    solution: `No -- formData.has("email") returns false, and there is no key
anywhere in the FormData entries corresponding to the email field at
all, despite the field having a real value ("alice@example.com")
visibly rendered on the page.

FormData(formElement) builds its entries using each control's name
attribute as the key -- NOT its id. The email input only has
id="email-field", with no name attribute at all, so FormData has
nothing to key that field's value under, and simply skips it
entirely. There's no error, no warning, no placeholder key -- the
field is just completely absent from the result.

The final comparison makes this concrete: the form has 3 visible
<input> elements, but only 2 entries actually show up in FormData --
exactly the 2 that have a name attribute (username and bio). The
email field, despite looking and behaving identically to the other
two from the user's perspective, contributes ZERO data to an actual
form submission.

The lesson: id and name look similar and are easy to conflate,
especially in code that was copy-pasted or refactored, but they
serve completely unrelated purposes -- id is for DOM/CSS/label
association, name is the ONLY thing that determines what key a
field's value is submitted under. Every input a form actually needs
to submit MUST have its own name attribute, independent of whether
it also has an id.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'an input\'s id attribute is what determines the key used when the form is submitted, since id is the "identifier" for the element.',
      reality: 'the id attribute has nothing to do with form submission at all — it exists purely for DOM/CSS purposes (label association, getElementById, CSS selectors); the name attribute is the ONLY thing that determines the submitted key.',
    },
    {
      thought: 'if an input is missing its name attribute, the browser would show a validation error, a console warning, or at minimum some visible indication before allowing the form to be submitted.',
      reality: 'a missing name attribute produces absolutely no error, warning, or visible sign of any kind — the field renders and behaves completely normally right up until submission, where its data is silently, completely absent with no indication anything went wrong.',
    },
    {
      thought: 'since id must be unique per page while name can be shared (e.g. across a radio button group), the two attributes are just different flavors of the same underlying "identifier" concept.',
      reality: 'id and name are unrelated attributes serving entirely different purposes, not two flavors of the same concept — one input can have an id, a name, both, or neither, and having one says nothing about whether it needs (or has) the other; a form control genuinely needs BOTH set independently for full identification AND correct data submission.',
    },
  ];
}
