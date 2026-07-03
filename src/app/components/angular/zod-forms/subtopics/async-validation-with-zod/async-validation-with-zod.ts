import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-async-validation-with-zod-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './async-validation-with-zod.html',
  styleUrl: './async-validation-with-zod.scss',
})
export class AsyncValidationWithZodSubtopic {

  zodDeps = { zod: 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'Async .refine() and safeParseAsync()',
      points: [
        '<code>.refine(async val =&gt; await checkUnique(val), { message: \'Already taken\' })</code> attaches an async check to a schema — but calling regular <code>safeParse()</code> on a schema with an async refinement THROWS, because synchronous parsing cannot wait for a Promise.',
        'Use <code>await schema.safeParseAsync(value)</code> instead — it returns the same <code>{ success, data }</code> / <code>{ success, error }</code> shape as <code>safeParse</code>, but properly awaits every async refinement before resolving.',
      ],
    },
    {
      heading: 'Bridging to Angular\'s AsyncValidatorFn — a genuinely different interface',
      points: [
        'Angular has TWO separate validator function types: <code>ValidatorFn</code> (synchronous, returns <code>ValidationErrors | null</code> directly) and <code>AsyncValidatorFn</code> (returns <code>Observable&lt;ValidationErrors | null&gt;</code> or a Promise). A Zod async refinement must bridge to <code>AsyncValidatorFn</code>, NOT the synchronous <code>zodValidator</code> pattern used for plain schemas.',
        'The bridge: <code>(control: AbstractControl) =&gt; from(schema.safeParseAsync(control.value)).pipe(map(r =&gt; r.success ? null : { zod: r.error.issues[0].message }))</code> — wrap the Promise from <code>safeParseAsync</code> in RxJS\'s <code>from()</code> and map the result to Angular\'s expected shape.',
        'Register async validators in the THIRD argument slot of a form control array: <code>username: [\'\', [Validators.required], [asyncZodValidator]]</code> — the second array is sync validators, the third is async validators. Mixing them up silently means the async check never runs.',
      ],
    },
    {
      heading: 'Debouncing and pending state for async checks',
      points: [
        'Async validators run on every value change by default — for a network-backed check (e.g. "is this username taken?"), this fires a request per keystroke unless the control\'s <code>updateOn</code> is set to <code>\'blur\'</code> or the validator itself debounces internally.',
        'While an async validator is running, the control\'s status is <code>\'PENDING\'</code> — check <code>control.pending</code> (or <code>control.status === \'PENDING\'</code>) in the template to show a spinner, and disable the submit button until pending resolves to avoid submitting before the async result is known.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, AbstractControl, AsyncValidatorFn, Validators } from '@angular/forms';
import { from } from 'rxjs';
import { map, debounceTime, switchMap } from 'rxjs/operators';
import { z } from 'zod';

// A "server check" that treats 'admin' and 'root' as already taken
function checkUsernameAvailable(username: string): Promise<boolean> {
  return new Promise(resolve => {
    setTimeout(() => resolve(!['admin', 'root'].includes(username.toLowerCase())), 600);
  });
}

const usernameSchema = z.string()
  .min(3, 'At least 3 characters')
  .refine(checkUsernameAvailable, { message: 'Username is already taken' });

// Bridge: Zod async refinement -> Angular AsyncValidatorFn
function asyncZodValidator(): AsyncValidatorFn {
  return (control: AbstractControl) =>
    from(Promise.resolve()).pipe(
      debounceTime(300),
      switchMap(() => from(usernameSchema.safeParseAsync(control.value))),
      map(result => (result.success ? null : { zod: result.error.issues[0].message })),
    );
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <h3>Async Zod validation — try "admin", "root", or anything else</h3>
    <input [formControl]="username" placeholder="Pick a username" />
    @if (username.pending) {
      <p>⏳ Checking availability...</p>
    } @else if (username.errors?.['zod']) {
      <p style="color: red;">❌ {{ username.errors?.['zod'] }}</p>
    } @else if (username.valid && username.value) {
      <p style="color: green;">✅ Available</p>
    }
  \`,
})
export class App {
  private fb = inject(FormBuilder);
  username = this.fb.control('', {
    validators: [Validators.required, Validators.minLength(3)],
    asyncValidators: [asyncZodValidator()],
  });
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
  <head><title>Async validation with Zod</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add "guest" to the list of taken usernames in checkUsernameAvailable, and verify typing "guest" shows the "already taken" error after the pending check resolves.',
    hint: 'Change the array from [\'admin\', \'root\'] to [\'admin\', \'root\', \'guest\'] inside checkUsernameAvailable.',
    solution: `function checkUsernameAvailable(username: string): Promise<boolean> {
  return new Promise(resolve => {
    setTimeout(() => resolve(!['admin', 'root', 'guest'].includes(username.toLowerCase())), 600);
  });
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a Zod schema with an async .refine() can still be validated with the regular safeParse() method.',
      reality: 'calling safeParse() on a schema with an async refinement throws, because synchronous parsing cannot wait for a Promise — you must use await schema.safeParseAsync(value) instead.',
    },
    {
      thought: 'the same zodValidator factory used for synchronous schemas also works for async ones — just await inside it.',
      reality: 'Angular has genuinely separate ValidatorFn and AsyncValidatorFn interfaces — an async check must return an Observable or Promise of ValidationErrors | null, and must be registered in the third (async) argument slot of the control array, not mixed in with sync validators.',
    },
    {
      thought: 'an async validator without debouncing is just a minor inefficiency, not a real problem.',
      reality: 'without debouncing, a network-backed async validator fires a fresh request on every keystroke — a genuine performance and backend-load problem, not just a style preference; debounceTime (or updateOn: \'blur\') is the standard fix.',
    },
  ];
}
