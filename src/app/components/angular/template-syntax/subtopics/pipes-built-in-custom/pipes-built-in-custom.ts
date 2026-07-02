import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-pipes-built-in-custom-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './pipes-built-in-custom.html',
  styleUrl: './pipes-built-in-custom.scss',
})
export class PipesBuiltInCustomSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'What a pipe does — transform for display, without mutating',
      points: [
        '<code>{{ value | pipeName:arg1:arg2 }}</code> transforms a value for DISPLAY without touching the underlying data. Angular ships <code>DatePipe</code>, <code>CurrencyPipe</code>, <code>DecimalPipe</code>, <code>UpperCasePipe</code>, <code>LowerCasePipe</code>, <code>SlicePipe</code>, <code>JsonPipe</code>, <code>KeyValuePipe</code>, and <code>AsyncPipe</code> — each must be imported INDIVIDUALLY into a standalone component\'s <code>imports</code> array, there is no barrel pipe module.',
      ],
    },
    {
      heading: 'The async pipe — subscribes and unsubscribes for you',
      points: [
        '<code>{{ observable$ | async }}</code> subscribes to an Observable (or Promise), renders each emitted value, and AUTOMATICALLY UNSUBSCRIBES when the component is destroyed. This eliminates the classic leak pattern of a manual <code>.subscribe()</code> call with no matching <code>.unsubscribe()</code> — the single most valuable thing the async pipe does.',
      ],
    },
    {
      heading: 'Pure by default — and why that matters for performance',
      points: [
        'Pipes are PURE by default — they only re-run when the INPUT REFERENCE changes. This is highly efficient: if the same array reference is passed repeatedly, the pipe does not re-run even if the array\'s CONTENTS were mutated in place (which is itself usually a signal-graph mistake, covered elsewhere on this site). For pipes that genuinely need to react to in-place mutation, mark them <code>pure: false</code> — but sparingly, since an impure pipe re-runs on EVERY change detection cycle.',
      ],
    },
    {
      heading: 'Writing a custom pipe',
      points: [
        'Implement <code>PipeTransform</code>: <code>&#64;Pipe({ name: \'truncate\' }) export class TruncatePipe implements PipeTransform { transform(value: string, limit = 100): string { return value.length > limit ? value.slice(0, limit) + \'…\' : value; } }</code>. Import the pipe CLASS in the consuming component\'s <code>imports</code> array — same mechanism as importing a component or directive.',
      ],
    },
    {
      heading: 'Chaining pipes',
      points: [
        'Chaining is supported and evaluates LEFT TO RIGHT: <code>{{ sentence | titlecase | slice:0:20 }}</code>. A genuinely useful debugging pattern: <code>{{ data$ | async | json }}</code> — inspect an Observable\'s emitted payload directly in the template without writing a separate subscription just to <code>console.log</code> it.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/truncate.pipe.ts',
      content: `import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 20): string {
    return value.length > limit ? value.slice(0, limit) + '…' : value;
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { AsyncPipe, CurrencyPipe, DatePipe, JsonPipe, TitleCasePipe } from '@angular/common';
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { TruncatePipe } from './truncate.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DatePipe, JsonPipe, TitleCasePipe, TruncatePipe],
  template: \`
    <p>{{ price | currency }}</p>
    <p>{{ today | date:'shortDate' }}</p>
    <p>{{ 'the quick brown fox' | titlecase }}</p>

    <!-- Custom pipe -->
    <p>{{ longText | truncate:15 }}</p>

    <!-- async pipe — auto subscribes/unsubscribes, no manual .subscribe() -->
    <p>Tick count: {{ tick$ | async }}</p>

    <!-- Chained pipes — left to right -->
    <pre>{{ tick$ | async | json }}</pre>
  \`,
})
export class App {
  price = 42.5;
  today = new Date();
  longText = 'This sentence is definitely longer than fifteen characters.';

  tick$ = interval(1000).pipe(map(n => ({ tick: n })));
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
  <head><title>Pipes — built-in and custom</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add an optional "suffix" parameter to TruncatePipe (defaulting to "…") so callers can customize the truncation marker, e.g. {{ longText | truncate:15:\' [more]\' }}.',
    hint: 'transform(value: string, limit = 20, suffix = \'…\'): string { return value.length > limit ? value.slice(0, limit) + suffix : value; } — pipe arguments after the first are just additional parameters to transform(), passed positionally with colons in the template.',
    solution: `transform(value: string, limit = 20, suffix = '…'): string {
  return value.length > limit ? value.slice(0, limit) + suffix : value;
}

// Template:
// {{ longText | truncate:15:' [more]' }}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the async pipe still requires a manual unsubscribe in ngOnDestroy, the same as a plain .subscribe() call.',
      reality: 'the async pipe automatically unsubscribes when the component is destroyed — this is precisely the leak-prevention benefit it provides over calling .subscribe() directly. No ngOnDestroy cleanup needed for anything piped through async.',
    },
    {
      thought: 'a pure pipe re-runs whenever the underlying data changes, including in-place mutations of an array or object.',
      reality: 'a pure pipe only re-runs when the INPUT REFERENCE changes — mutating an array in place (push, sort) while keeping the same reference means a pure pipe watching that array will NOT re-run, the same reference-equality behavior signals rely on elsewhere in Angular.',
    },
    {
      thought: 'built-in pipes like DatePipe or CurrencyPipe are globally available in every component automatically.',
      reality: 'every pipe, built-in or custom, must be imported individually into each standalone component\'s imports array — there is no ambient global registration, the same explicit-import discipline as components and directives.',
    },
  ];
}
