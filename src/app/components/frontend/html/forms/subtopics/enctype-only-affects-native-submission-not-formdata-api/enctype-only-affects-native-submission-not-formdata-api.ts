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
  selector: 'app-enctype-formdata-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './enctype-only-affects-native-submission-not-formdata-api.html',
  styleUrl: './enctype-only-affects-native-submission-not-formdata-api.scss',
})
export class RequiredEnctypeForFileUploadSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Rule, Pushed Past Its Unstated Assumption',
      points: [
        'The main page states: "<code>enctype="multipart/form-data"</code> is required when the form includes a file input. Without it, only the filename is sent, not the file content." This is completely true — but ONLY for the browser\'s own NATIVE form submission (a real HTTP request triggered by the browser itself). This subtopic proves a genuinely surprising exception: <code>new FormData(formElement)</code>, called directly from JavaScript, correctly captures the FULL <code>File</code> object — including its actual content — regardless of what the form\'s <code>enctype</code> attribute says, even if it\'s completely missing.',
        'This distinction matters enormously in modern web development, where forms are frequently submitted via <code>fetch()</code> rather than letting the browser perform a native submission — and that JS-driven path never actually goes through the <code>enctype</code> attribute\'s encoding logic at all.',
      ],
    },
    {
      heading: 'Why FormData() Sidesteps enctype Entirely',
      points: [
        '<code>enctype</code> only controls HOW the browser itself encodes and serializes form data into the body of an HTTP request during a NATIVE form submission — it is an instruction to the browser\'s own internal submission mechanism, not a general rule about how form data behaves everywhere.',
        '<code>new FormData(formElement)</code> is a completely separate JavaScript API that reads each control\'s current value directly from the LIVE DOM — for a file input, that means reading the actual <code>File</code> object(s) the user selected, which it always does correctly, since it never needs to serialize anything into a request body at all. The resulting <code>FormData</code> object already correctly holds real <code>File</code> objects, ready to be sent via <code>fetch(url, { method: \'POST\', body: formData })</code> — and when <code>fetch</code> sends a <code>FormData</code> body, IT automatically sets the correct <code>multipart/form-data</code> Content-Type header itself, with no <code>enctype</code> attribute involved anywhere in that path.',
        'This means the main page\'s <code>enctype</code> rule is specifically about ONE submission path (letting the browser handle a native, non-JS form submission) — the moment you\'re submitting via JavaScript (<code>fetch</code>, <code>XMLHttpRequest</code>) using a <code>FormData</code> object built from the form, the <code>enctype</code> attribute becomes entirely irrelevant to whether file content is correctly captured and sent.',
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
  <title>enctype vs FormData API demo</title>
</head>
<body>
  <!-- Deliberately NO enctype attribute at all -->
  <form id="upload-form">
    <label for="doc-field">Choose a file</label>
    <input id="doc-field" name="document" type="file">
  </form>

  <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
  <script type="module" src="index.ts"></script>
</body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const form = document.getElementById('upload-form') as HTMLFormElement;
const fileInput = document.getElementById('doc-field') as HTMLInputElement;

console.log('--- This form has NO enctype attribute set at all ---');
console.log('form.enctype (browser default):', form.enctype, '<-- defaults to application/x-www-form-urlencoded, which the main page says loses file content on NATIVE submission');

console.log('--- Simulating a file selection by constructing a real File object ---');
const fakeFile = new File(['This is the actual file content, not just a filename.'], 'notes.txt', { type: 'text/plain' });
const dt = new DataTransfer();
dt.items.add(fakeFile);
fileInput.files = dt.files; // simulate the user having picked this file

console.log('--- Building FormData directly from the form via the JS API ---');
const formData = new FormData(form);
const fileFromFormData = formData.get('document');

console.log('typeof fileFromFormData:', typeof fileFromFormData);
console.log('Is it a real File object?', fileFromFormData instanceof File);

if (fileFromFormData instanceof File) {
  console.log('fileFromFormData.name:', fileFromFormData.name);
  console.log('fileFromFormData.size (bytes):', fileFromFormData.size, '<-- real byte size, not just a filename string');
  const content = await fileFromFormData.text();
  console.log('Actual file CONTENT read back out:', content, '<-- the real content survived, despite enctype being the DEFAULT (non-multipart) value!');
}

console.log('--- This FormData is now ready to send via fetch() with the file content fully intact ---');
console.log('fetch(url, { method: "POST", body: formData }) would correctly send the real file -- fetch sets the multipart Content-Type header itself, with zero involvement from the form\\'s own (missing) enctype attribute.');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'This form has NO <code>enctype</code> attribute at all (defaulting to <code>application/x-www-form-urlencoded</code>, which the main page says loses file content). Does the <code>File</code> object\'s actual content still survive when read via <code>FormData</code>?',
    hint: 'Ask exactly WHICH submission path the main page\'s enctype rule is describing -- the browser\'s own native form-submission mechanism, or the completely separate FormData() JavaScript API that reads values straight from the live DOM?',
    solution: `Yes -- the file's actual content survives completely intact.
fileFromFormData instanceof File is true, fileFromFormData.size
reports the real byte size, and calling .text() on it successfully
reads back the exact original content string -- all despite the
form's enctype being the DEFAULT application/x-www-form-urlencoded
value the main page specifically warns loses file content.

Here's the resolution: the main page's enctype rule describes what
happens during a NATIVE form submission -- the browser's own internal
mechanism for encoding form data into an HTTP request body when the
browser itself handles the submit (e.g., a plain form submit with no
JavaScript intercepting it). In THAT specific path, a non-multipart
enctype really does lose file content, exactly as documented.

new FormData(formElement), by contrast, is a completely separate
JavaScript API. It reads each control's CURRENT value directly from
the live DOM -- for the file input, that means grabbing the actual
File object(s) currently selected, with no serialization or encoding
step involved at all. It has no reason to consult (or be affected by)
the form's enctype attribute, since it isn't performing a native
submission in the first place.

This is exactly why the resulting formData object is safe to hand
directly to fetch(url, { method: 'POST', body: formData }) -- fetch
recognizes a FormData body and automatically sets the correct
multipart/form-data Content-Type header itself, completely
independent of whatever (if anything) the original form's enctype
attribute said. The main page's rule remains completely correct for
native submissions; it simply doesn't apply to this JS-driven path.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the enctype="multipart/form-data" requirement for file uploads is a universal rule that applies any time a form contains a file input, regardless of how the form data is ultimately gathered or sent.',
      reality: 'the enctype requirement is specific to the browser\'s NATIVE form submission mechanism — the completely separate FormData(formElement) JavaScript API reads file inputs\' actual File objects directly from the DOM and is entirely unaffected by whatever the form\'s enctype attribute says.',
    },
    {
      thought: 'submitting a form via fetch() with a FormData body still requires the original &lt;form&gt; element to have enctype="multipart/form-data" set, or the file content will be lost the same way it would be in a native submission.',
      reality: 'fetch() automatically sets the correct multipart/form-data Content-Type header itself whenever the request body is a FormData object — the form\'s own enctype attribute is never consulted or needed anywhere in this JavaScript-driven submission path.',
    },
    {
      thought: 'if a form\'s enctype is missing or set incorrectly, that\'s always a real, correctness-affecting bug that will cause file uploads to silently lose data.',
      reality: 'whether a missing/incorrect enctype is actually a bug depends entirely on the submission mechanism in use — it\'s a genuine problem for a native browser-driven form submission, but completely irrelevant if the form is instead submitted via JavaScript using FormData() and fetch(), which never touches the enctype attribute at all.',
    },
  ];
}
