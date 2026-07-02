import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-custom-validators-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './custom-validators.html',
  styleUrl: './custom-validators.scss',
})
export class CustomValidatorsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A synchronous custom validator is just a function',
      points: [
        '<code>function noEmoji(control: AbstractControl): ValidationErrors | null { return emojiRegex.test(control.value) ? { noEmoji: true } : null; }</code> — return <code>null</code> when valid, or an object with an error key when invalid. That is the entire contract; no class, no special registration beyond passing it in the validators array like a built-in.',
        'Custom and built-in validators mix freely in the same array: <code>[Validators.required, noEmoji]</code> — Angular runs all of them and merges any errors into one <code>errors</code> object.',
      ],
    },
    {
      heading: 'Async validators — Observable or Promise, and the PENDING status',
      points: [
        'An async validator has the same idea but returns <code>Observable&lt;ValidationErrors | null&gt;</code> or <code>Promise&lt;ValidationErrors | null&gt;</code> instead of a synchronous value — needed for anything that requires a network round-trip, like checking if a username is already taken.',
        'While an async validator is running, <code>control.status</code> is <code>\'PENDING\'</code> — NOT <code>\'VALID\'</code>. <code>form.valid</code> is <code>false</code> during this window too, which naturally blocks premature submission until the check resolves.',
      ],
    },
    {
      heading: 'debounceTime + switchMap — do not fire a request on every keystroke',
      points: [
        'An async validator that hits an API should always debounce: <code>timer(300).pipe(switchMap(() =&gt; svc.checkExists(control.value)))</code> — this waits 300ms of no further typing before firing, and <code>switchMap</code> automatically cancels a still-in-flight previous check when a newer one starts, so a slow first response never overwrites a faster later one.',
      ],
    },
    {
      heading: 'updateOn — controlling WHEN validation (and value sync) runs',
      points: [
        'By default, controls validate on every keystroke (<code>updateOn: \'change\'</code>). Setting <code>updateOn: \'blur\'</code> or <code>updateOn: \'submit\'</code> — either per-control or for the whole group via <code>fb.group({...}, { updateOn: \'blur\' })</code> — reduces validation noise, which matters even more for async validators since it also delays when the HTTP check fires, not just when the error message appears.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { switchMap, map, timer, of } from 'rxjs';

// Sync custom validator — plain function
function noEmoji(control: AbstractControl): ValidationErrors | null {
  const emojiRegex = /\\p{Emoji}/u;
  return emojiRegex.test(control.value ?? '') ? { noEmoji: true } : null;
}

// Pretend "check if username exists" API call
function checkUsernameExists(name: string) {
  return of(['admin', 'root', 'taken'].includes(name.toLowerCase()));
}

// Async validator factory — debounced, cancellable
function uniqueUsernameValidator(): AsyncValidatorFn {
  return (control: AbstractControl) =>
    timer(300).pipe(
      switchMap(() => checkUsernameExists(control.value ?? '')),
      map(exists => exists ? { usernameTaken: true } : null),
    );
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="form">
      <input formControlName="username" placeholder="Try: admin, root, or anything else" />
      <p>Status: {{ usernameControl.status }}</p>
      @if (usernameControl.errors?.['noEmoji'])       { <p>No emoji allowed.</p> }
      @if (usernameControl.errors?.['usernameTaken'])  { <p>That username is taken.</p> }
    </form>
  \`,
})
export class App {
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, noEmoji], [uniqueUsernameValidator()]],
  });

  get usernameControl() { return this.form.controls.username; }
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
  <head><title>Custom validators</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a synchronous startsWithUppercase validator that requires the username to start with an uppercase letter, and wire it into the existing validators array alongside noEmoji.',
    hint: 'function startsWithUppercase(control: AbstractControl): ValidationErrors | null { const v = control.value ?? \'\'; return v.length && v[0] === v[0].toUpperCase() && v[0] !== v[0].toLowerCase() ? null : { startsWithUppercase: true }; } — then add it to the sync validators array: [Validators.required, noEmoji, startsWithUppercase].',
    solution: `function startsWithUppercase(control: AbstractControl): ValidationErrors | null {
  const v = control.value ?? '';
  const ok = v.length > 0 && v[0] === v[0].toUpperCase() && v[0] !== v[0].toLowerCase();
  return ok ? null : { startsWithUppercase: true };
}

form = this.fb.nonNullable.group({
  username: [
    '',
    [Validators.required, noEmoji, startsWithUppercase],
    [uniqueUsernameValidator()],
  ],
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a custom validator must return an Observable, even for a simple synchronous check.',
      reality: 'a synchronous validator returns <code>ValidationErrors | null</code> directly — no Observable involved. Only ASYNC validators (things that genuinely need to wait on something, like an HTTP call) return an <code>Observable</code> or <code>Promise</code>.',
    },
    {
      thought: 'control.status is "VALID" while an async validator is still running, since nothing has failed yet.',
      reality: 'control.status is <code>\'PENDING\'</code> while any async validator is in flight — not <code>\'VALID\'</code>. <code>form.valid</code> is <code>false</code> during this window, which is exactly what prevents a premature submit before the check resolves.',
    },
    {
      thought: 'async validators should fire immediately on every keystroke to feel responsive.',
      reality: 'firing an HTTP request on every keystroke wastes requests and can return results out of order. Debouncing (e.g. <code>timer(300)</code>) plus <code>switchMap</code> (which cancels a stale in-flight request when a newer one starts) is the standard, correct pattern — it is not a niche performance-only optimization.',
    },
  ];
}
