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
  templateUrl: './localstorage-only-stores-strings-not-objects.html',
  styleUrl: './localstorage-only-stores-strings-not-objects.scss'
})
export class LocalstorageOnlyStoresStringsNotObjectsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'localStorage.setItem() silently coerces its value to a string — it never throws for a non-string value',
      points: [
        'The Web Storage API\'s <code>setItem(key, value)</code> signature only accepts strings, but JavaScript\'s automatic type coercion means passing an object doesn\'t error — it calls the object\'s <code>.toString()</code> method instead, exactly like string concatenation would.',
        'A plain object\'s default <code>.toString()</code> produces the literal text <code>"[object Object]"</code> — genuinely useless data that silently overwrites whatever was there, with zero indication anything went wrong.',
      ]
    },
    {
      heading: 'The fix is symmetric: serialize on write, deserialize on read',
      points: [
        '<code>JSON.stringify(value)</code> before <code>setItem()</code> converts the object into a real, faithful string representation instead of relying on the useless default <code>.toString()</code>.',
        '<code>JSON.parse(getItem(key))</code> reverses it on the way out — and since the stored data could be corrupted, missing, or from an old schema, wrapping this in <code>try/catch</code> is standard defensive practice, not optional paranoia.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>localStorage only stores strings</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const user = { name: 'Alice', age: 30 };

// The naive way — passing the object directly.
localStorage.setItem('user-naive', user as any);
console.log('naive read-back:', localStorage.getItem('user-naive'));

// The correct way — JSON.stringify on write, JSON.parse on read.
localStorage.setItem('user-correct', JSON.stringify(user));
const raw = localStorage.getItem('user-correct')!;
console.log('correct raw stored string:', raw);
console.log('correct parsed back:', JSON.parse(raw));

localStorage.clear();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Code calls <code>localStorage.setItem("cart", cartObject)</code> directly, without <code>JSON.stringify()</code>. No error is thrown. What does <code>localStorage.getItem("cart")</code> return afterward?',
    hint: 'setItem() only accepts strings — think about what JavaScript does automatically when a non-string value is used somewhere a string is expected, the same mechanism behind string concatenation.',
    solution: 'The literal string <code>"[object Object]"</code> — the object\'s default <code>.toString()</code> is called silently, discarding all the actual data with no error or warning of any kind.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Passing an object directly to <code>localStorage.setItem()</code> will throw a TypeError, since the API is documented as string-only.',
      reality: 'It never throws — JavaScript\'s automatic type coercion silently converts the object to a string via its default <code>.toString()</code> method, which for a plain object produces the useless literal text "[object Object]".'
    },
    {
      thought: 'If storing an object "worked" without an error, the data was probably stored correctly.',
      reality: 'The absence of an error tells you nothing here — "[object Object]" is a completely valid string as far as the API is concerned, even though every bit of the original object\'s actual data has been lost.'
    },
    {
      thought: '<code>JSON.parse(localStorage.getItem(key))</code> is safe to call without a try/catch, since you control what your own code wrote there.',
      reality: 'Stored data can be missing (key never set), corrupted (a browser extension or another script wrote something else), or from an old schema your current code doesn\'t expect — wrapping the parse in try/catch is standard defensive practice.'
    }
  ];
}
