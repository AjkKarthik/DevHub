import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './getdata-returns-empty-string-for-missing-type.html',
  styleUrl: './getdata-returns-empty-string-for-missing-type.scss'
})
export class GetdataReturnsEmptyStringForMissingTypeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'dataTransfer.getData(type) returns an empty string for a type that was never set — never null or undefined',
      points: [
        'If <code>dragstart</code> only calls <code>setData("text/plain", ...)</code>, but the drop handler asks for <code>getData("text/html")</code>, the return value is the empty string <code>""</code> — not <code>null</code>, not <code>undefined</code>.',
        'This matters because <code>if (getData("text/html"))</code> and <code>if (getData("text/html") === null)</code> behave completely differently — the first correctly treats an empty string as falsy and works; the second NEVER triggers, since the value is never actually <code>null</code>.',
      ]
    },
    {
      heading: 'This is directly, deterministically testable without any real drag gesture at all',
      points: [
        'A <code>DataTransfer</code> object can be constructed directly with <code>new DataTransfer()</code> and populated with <code>setData()</code> outside of any actual drag event — its <code>getData()</code>/<code>types</code> behavior is plain, scriptable object behavior, not something gated behind a real user-driven drag interaction.',
        'This makes it possible to verify the empty-string return value directly, with no drag simulation needed at all.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>getData returns empty string for missing type</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const dt = new DataTransfer();
dt.setData('text/plain', 'hello');

const missing = dt.getData('text/html');

console.log('getData for a type that was never set:', JSON.stringify(missing));
console.log('is it an empty string?', missing === '');
console.log('is it null?', missing === null);
console.log('is it undefined?', missing === undefined);
console.log('does "if (missing)" treat it as falsy?', !missing);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A <code>dragstart</code> handler only calls <code>dataTransfer.setData("text/plain", "hello")</code>. A drop handler then calls <code>dataTransfer.getData("text/html")</code>. What does that call return?',
    hint: 'The Web API rarely returns null/undefined for "nothing here" on string-returning methods — think about what the empty-string convention means for truthiness checks.',
    solution: 'The empty string <code>""</code> — never <code>null</code> or <code>undefined</code>. A truthiness check like <code>if (getData("text/html"))</code> correctly treats this as "nothing", but a strict <code>=== null</code> check would never match.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Calling <code>getData()</code> for a MIME type that was never set with <code>setData()</code> returns <code>null</code>, the way many other "look up a missing key" APIs do.',
      reality: 'It returns the empty string <code>""</code> instead — a consistent, always-a-string return type, never <code>null</code> or <code>undefined</code>.'
    },
    {
      thought: 'Verifying dataTransfer.getData() behavior requires simulating a real drag-and-drop gesture in a live playground.',
      reality: 'A <code>DataTransfer</code> object can be created directly with <code>new DataTransfer()</code> and populated/queried entirely outside of any drag event — no simulated user gesture needed to test this specific behavior.'
    },
    {
      thought: 'Checking <code>getData("text/html") === null</code> is a safe way to detect "this type was never set".',
      reality: 'That check will NEVER be true, since the return value is always a string. The correct check is either truthiness (<code>if (!value)</code>) or an explicit <code>=== \'\'</code> comparison.'
    }
  ];
}
