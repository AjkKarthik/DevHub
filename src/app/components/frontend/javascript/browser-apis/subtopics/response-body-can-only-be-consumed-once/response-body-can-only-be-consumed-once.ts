import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-response-body-once-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './response-body-can-only-be-consumed-once.html',
  styleUrl: './response-body-can-only-be-consumed-once.scss',
})
export class ResponseBodyCanOnlyBeConsumedOnceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #2, Proven With a Real TypeError',
      points: [
        'The main page states: "Response bodies are streams — they can only be consumed once. Choose one method (json, text, blob, arrayBuffer) and stick to it. To inspect both: clone with <code>res.clone()</code> before reading." This subtopic actually triggers the exact <code>TypeError</code> from calling <code>.json()</code> after <code>.text()</code>, then shows <code>res.clone()</code> as the genuine fix, not a workaround.',
        'A <code>Response</code> object\'s body is backed by a <code>ReadableStream</code> — once any body-reading method (<code>.json()</code>, <code>.text()</code>, <code>.blob()</code>, <code>.arrayBuffer()</code>) has fully drained that stream, there is nothing left to read. This is fundamentally different from a plain string or object property, which can be read any number of times with no side effects.',
      ],
    },
    {
      heading: 'Why res.clone() Is the Real Fix, Not Just a Trick',
      points: [
        '<code>response.clone()</code> creates a genuinely separate <code>Response</code> object with its OWN independent copy of the still-unread body stream — calling <code>.clone()</code> BEFORE either read consumes it is what makes it possible to read the same underlying data twice, once from the original and once from the clone.',
        'Calling <code>.clone()</code> AFTER a body has already been read does not help — the clone would just be a copy of an already-drained stream, with nothing left to give back. The clone must happen BEFORE the first read, while the body is still untouched.',
        'A common legitimate use case: logging the raw response text for debugging while ALSO parsing it as JSON for the application — <code>const clone = res.clone(); const raw = await clone.text(); const data = await res.json();</code> lets both consumers read the full body independently.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Response body can only be consumed once demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function makeFakeResponse(): Response {
  return new Response(JSON.stringify({ id: 1, name: 'Ada' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

console.log('--- Attempt 1: reading the body TWICE without cloning ---');
const res1 = makeFakeResponse();
const text1 = await res1.text();
console.log('First read (.text()) succeeded:', text1);
try {
  const json1 = await res1.json();
  console.log('Second read (.json()) also succeeded:', json1);
} catch (e) {
  console.log('Second read (.json()) THREW:', (e as Error).message, '<-- the body stream was already drained by the first .text() call');
}

console.log('--- Attempt 2: cloning BEFORE either read ---');
const res2 = makeFakeResponse();
const clone = res2.clone(); // clone while the body is still untouched
const text2 = await clone.text();       // read the CLONE as text
console.log('Read the clone as text:', text2);
const json2 = await res2.json();        // read the ORIGINAL as JSON -- independent stream
console.log('Read the original as JSON:', json2, '<-- both reads succeeded, because clone() was called BEFORE either one consumed the body');

console.log('--- Attempt 3: cloning AFTER a read has already happened (does NOT help) ---');
const res3 = makeFakeResponse();
const text3 = await res3.text();  // body already drained here
console.log('First read succeeded:', text3);
try {
  const tooLateClone = res3.clone(); // too late -- there's nothing left to clone
  await tooLateClone.text();
} catch (e) {
  console.log('Cloning AFTER the read still fails:', (e as Error).message, '<-- clone() must happen BEFORE the first read, not after');
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In Attempt 3, <code>res3.clone()</code> is called, but only AFTER <code>res3.text()</code> already ran. Does the clone let you read the body again?',
    hint: 'Ask what clone() is actually copying at the moment it\'s called -- is there still an intact, unread stream to duplicate, or has it already been drained by that point?',
    solution: `No -- cloning after the first read still fails. The clone in
Attempt 3 throws the same "body stream already read" error, because
by the time clone() is called, res3's body stream has ALREADY been
fully drained by the earlier .text() call -- there is nothing left
for clone() to copy.

Attempt 1 shows the base problem: calling .text() then .json() on
the SAME Response object throws on the second call, because the
underlying ReadableStream can only be read to completion once.

Attempt 2 shows the actual correct fix: res2.clone() is called
BEFORE either read happens, while the body is still fully intact.
This creates a genuinely separate Response object with its own copy
of the unread stream -- so reading the clone as text and the
original as JSON both succeed independently, since neither read
affects the other's stream.

The lesson: clone() timing matters -- it must happen before the
FIRST read of either the original or any previous clone, not
"whenever you realize you need to read the body again." If you
already called .json() or .text() once, that data is gone forever
from that Response object; the only way to recover it is if you
still have a reference to a clone that was made in time.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a Response object\'s body works like a regular property — you can call .json() or .text() on it multiple times and get the same data back each time, just like reading response.status repeatedly.',
      reality: 'a Response body is backed by a ReadableStream that can only be fully consumed ONCE — calling a second body-reading method after the first one completes throws a TypeError, since there is nothing left in the stream to read.',
    },
    {
      thought: 'calling response.clone() at any point — even after you\'ve already read the body once — lets you get a fresh, independent copy to read again.',
      reality: 'clone() must be called BEFORE the first read happens, while the body is still untouched — calling it after the body has already been drained just produces a clone of an equally-empty stream, which still throws when you try to read it.',
    },
    {
      thought: 'the "body already read" TypeError only happens if you call the exact same method twice (like .json() then .json() again) — calling two DIFFERENT methods (.text() then .json()) on the same response works fine since they read different formats.',
      reality: 'the error happens regardless of which specific body-reading methods are used or in what combination — ALL of .json(), .text(), .blob(), and .arrayBuffer() draw from the exact same single underlying stream, so any one of them exhausts it for every other one.',
    },
  ];
}
