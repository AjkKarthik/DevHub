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
  templateUrl: './cleardata-selectively-removes-one-type-not-all.html',
  styleUrl: './cleardata-selectively-removes-one-type-not-all.scss'
})
export class CleardataSelectivelyRemovesOneTypeNotAllSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'dataTransfer.clearData(type) is scoped to exactly the one MIME type you pass it — everything else survives untouched',
      points: [
        'If a <code>dragstart</code> handler sets both <code>"text/plain"</code> and <code>"text/html"</code> data, calling <code>clearData("text/plain")</code> removes ONLY that entry — <code>getData("text/html")</code> still returns its original value afterward, and <code>types</code> drops to just the remaining one.',
        'This makes <code>clearData(type)</code> useful for narrowing what a drag operation offers mid-flight (e.g. removing a format a particular drop target shouldn\'t receive) without discarding every other format you\'ve set.',
      ]
    },
    {
      heading: 'Calling clearData() with NO arguments is the one case that removes everything',
      points: [
        'Only the zero-argument form — <code>clearData()</code> — clears every type at once, leaving <code>dataTransfer.types</code> as an empty array.',
        'This is the same "selective vs. total" distinction as <code>localStorage.removeItem(key)</code> vs <code>localStorage.clear()</code> — a single-argument call narrows to one entry, the no-argument call wipes everything.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>clearData selective removal</title></head>
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
dt.setData('text/plain', 'plain-value');
dt.setData('text/html', '<b>html-value</b>');

console.log('types before clearing anything:', Array.from(dt.types));

dt.clearData('text/plain');
console.log('types after clearData("text/plain"):', Array.from(dt.types));
console.log('text/plain after clearing it:', JSON.stringify(dt.getData('text/plain')));
console.log('text/html still intact?', dt.getData('text/html'));

dt.clearData(); // no-argument form
console.log('types after clearData() with no arguments:', Array.from(dt.types));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A DataTransfer object has both <code>"text/plain"</code> and <code>"text/html"</code> data set. Code calls <code>dataTransfer.clearData("text/plain")</code>. What does <code>dataTransfer.getData("text/html")</code> return afterward?',
    hint: 'clearData() takes an optional type argument — think about what passing a specific type narrows the operation to, versus what omitting it entirely does.',
    solution: 'The original HTML value, completely unaffected — <code>"&lt;b&gt;html-value&lt;/b&gt;"</code>. Passing a type to <code>clearData()</code> scopes the removal to exactly that one MIME type; every other type set on the same DataTransfer object survives untouched.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Calling <code>dataTransfer.clearData(type)</code> with any argument clears ALL data on the object, the same as calling it with no arguments.',
      reality: 'Passing a specific type scopes the removal to exactly that one entry — every other MIME type set on the same DataTransfer object remains completely intact. Only the zero-argument form clears everything.'
    },
    {
      thought: 'Once you\'ve called <code>clearData()</code> on a specific type, that type can never be set again on the same DataTransfer object.',
      reality: 'clearData() only removes the current value — calling <code>setData()</code> again for that same type afterward works exactly as it would on a fresh object, adding it right back.'
    },
    {
      thought: 'This selective-vs-total distinction is unique to dataTransfer.clearData() and doesn\'t appear anywhere else in the platform.',
      reality: 'The same pattern shows up elsewhere — <code>localStorage.removeItem(key)</code> (selective) vs <code>localStorage.clear()</code> (total) is the exact same one-argument-narrows, no-argument-wipes-everything shape.'
    }
  ];
}
