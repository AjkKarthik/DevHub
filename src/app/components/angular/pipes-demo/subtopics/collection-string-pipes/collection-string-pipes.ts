import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-collection-string-pipes-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './collection-string-pipes.html',
  styleUrl: './collection-string-pipes.scss',
})
export class CollectionStringPipesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Case pipes — UpperCase, LowerCase, TitleCase',
      points: [
        '<code>UpperCasePipe</code> and <code>LowerCasePipe</code> transform casing outright. <code>TitleCasePipe</code> capitalizes the FIRST LETTER OF EACH WORD — genuinely different from simple uppercasing, and the one most people reach for when they actually want "Each Word Capitalized" rather than "ALL CAPS".',
      ],
    },
    {
      heading: 'SlicePipe — works on both arrays and strings',
      points: [
        '<code>SlicePipe</code> operates on EITHER arrays or strings with the same syntax: <code>&#123;&#123; fruits | slice:1:3 &#125;&#125;</code> returns a NEW array containing indices 1 and 2 (start inclusive, end exclusive — same semantics as JavaScript\'s native <code>.slice()</code>). NEGATIVE indices count from the end, exactly like the native method.',
        'Because <code>SlicePipe</code> always returns a NEW array reference, it is safe to chain with a downstream PURE pipe that needs a reference change to know it should re-run.',
      ],
    },
    {
      heading: 'JsonPipe — invaluable for debugging, dangerous in production',
      points: [
        '<code>JsonPipe</code> converts any value to a pretty-printed JSON string — genuinely useful for quickly inspecting an object\'s full shape directly in a template during development, no separate <code>console.log</code> needed.',
        'REMOVE <code>JsonPipe</code> usage before shipping to production — it exposes the FULL structure of whatever object it is bound to directly in the rendered DOM, which can accidentally leak internal data (user IDs, tokens, unfiltered API responses) that was never meant to be user-visible.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { JsonPipe, SlicePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SlicePipe, JsonPipe, TitleCasePipe, UpperCasePipe],
  template: \`
    <p>Original: {{ fruits() | json }}</p>
    <p>Slice(1,3): {{ fruits() | slice:1:3 | json }}</p>
    <p>Last two (negative index): {{ fruits() | slice:-2 | json }}</p>

    <p>Uppercase: {{ 'hello world' | uppercase }}</p>
    <p>Title case: {{ 'the quick brown fox' | titlecase }}</p>

    <hr />
    <p><strong>⚠ Remove before shipping — this exposes the full object:</strong></p>
    <pre>{{ user() | json }}</pre>
  \`,
})
export class App {
  fruits = signal(['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']);
  user = signal({ id: 42, name: 'Ada', internalNotes: 'do not expose this' });
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Collection and string pipes</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a display showing just the FIRST two fruits using a POSITIVE slice, and compare it to the existing negative-index example for the LAST two.',
    hint: '{{ fruits() | slice:0:2 | json }} — slice:0:2 returns indices 0 and 1 (the first two), directly comparable to the existing slice:-2 (the last two) already in the template.',
    solution: `<p>First two: {{ fruits() | slice:0:2 | json }}</p>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'UpperCasePipe and TitleCasePipe produce the same visual result, just with different names.',
      reality: 'UpperCasePipe makes EVERYTHING uppercase ("HELLO WORLD"), while TitleCasePipe capitalizes only the FIRST LETTER of each word ("Hello World") — genuinely different output for the same input.',
    },
    {
      thought: 'SlicePipe mutates the original array in place, the same way Array.prototype.splice() would.',
      reality: 'SlicePipe always returns a brand NEW array — the original is never touched, matching JavaScript\'s native non-mutating .slice() method (not the mutating .splice()).',
    },
    {
      thought: 'JsonPipe is safe to leave in production code as long as the object being displayed does not LOOK sensitive.',
      reality: 'JsonPipe exposes the ENTIRE object structure verbatim in the rendered DOM — fields you did not think to check (internal IDs, flags, nested data) can leak this way even when the object\'s obvious top-level fields look harmless. Remove it before shipping.',
    },
  ];
}
