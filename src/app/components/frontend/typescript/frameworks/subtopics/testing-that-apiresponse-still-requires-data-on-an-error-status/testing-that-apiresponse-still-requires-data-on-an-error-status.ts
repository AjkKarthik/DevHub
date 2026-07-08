import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-apiresponse-requires-data-error-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-apiresponse-still-requires-data-on-an-error-status.html',
  styleUrl: './testing-that-apiresponse-still-requires-data-on-an-error-status.scss',
})
export class TestingThatApiresponseStillRequiresDataOnAnErrorStatusSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s ApiResponse Looks Like a Discriminated Union, But Isn\'t',
      points: [
        'The Vite env vars &amp; ComponentProps tab defines <code>interface ApiResponse&lt;T&gt; { data: T; meta: {...}; status: \'ok\' | \'error\'; message?: string; }</code> — the <code>status: \'ok\' | \'error\'</code> field looks exactly like a discriminant, the same shape Zod\'s <code>discriminatedUnion()</code> (mentioned earlier on this very page) is specifically built to model.',
        'This subtopic tests whether <code>ApiResponse&lt;T&gt;</code> actually behaves like a discriminated union — specifically, whether constructing an object with <code>status: \'error\'</code> can OMIT the <code>data</code> field, since a genuine error response conceptually has no real data to report.',
      ],
    },
    {
      heading: 'Why a Flat Interface Doesn\'t Get Discriminated-Union Behavior for Free',
      points: [
        '<code>ApiResponse&lt;T&gt;</code> is a single, FLAT interface — <code>status</code> being one of two string literals does not automatically link its value to whether <code>data</code> is required. TypeScript treats <code>data: T</code> as unconditionally required, regardless of what <code>status</code> is set to, because nothing in the interface\'s definition connects the two fields.',
        'A genuine discriminated union would need to be written as TWO separate interfaces joined with <code>|</code>: <code>{ status: \'ok\'; data: T } | { status: \'error\'; message: string }</code> — THAT structure lets TypeScript narrow based on <code>status</code> and correctly make <code>data</code> unavailable (or optional) on the error branch.',
        'This means every <code>{ status: \'error\', ... }</code> object built from the page\'s own <code>ApiResponse&lt;T&gt;</code> interface must still supply SOME value for <code>data</code> — typically an unwanted cast like <code>data: null as unknown as T</code> or <code>data: [] as T</code> — purely to satisfy the type checker, even though that value is semantically meaningless for an error response.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>ApiResponse and error-status data</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own ApiResponse<T>, unchanged
interface ApiResponse<T> {
  data:    T;
  meta:    { page: number; total: number; perPage: number };
  status:  'ok' | 'error';
  message?: string;
}
interface User { id: string; name: string; email: string; }

// A genuine success response -- data is meaningful here
const ok: ApiResponse<User> = {
  data: { id: '1', name: 'Alice', email: 'alice@example.com' },
  meta: { page: 1, total: 1, perPage: 10 },
  status: 'ok',
};
console.log('ok response:', ok);

// An error response -- does TypeScript let us OMIT data, since
// there's genuinely nothing meaningful to put there?
// const err: ApiResponse<User> = {
//   meta: { page: 1, total: 0, perPage: 10 },
//   status: 'error',
//   message: 'User not found',
// };
// Uncomment above -- does this compile without a data field?

// The workaround every caller ends up needing:
const err: ApiResponse<User> = {
  data: null as unknown as User, // meaningless, but required by the interface
  meta: { page: 1, total: 0, perPage: 10 },
  status: 'error',
  message: 'User not found',
};
console.log('error response, data is a meaningless placeholder:', err.data);

// Compare: a GENUINE discriminated union version
type RealApiResponse<T> =
  | { status: 'ok'; data: T; meta: { page: number; total: number; perPage: number } }
  | { status: 'error'; message: string };

const realErr: RealApiResponse<User> = {
  status: 'error',
  message: 'User not found',
  // no data field needed at all -- and none allowed
};
console.log('real discriminated-union error response:', realErr);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment the `err` object that omits `data`. Read the exact compiler error. Then compare it against `realErr`, which correctly omits `data` with zero error.',
    hint: 'ApiResponse<T> is one flat interface where data is unconditionally required -- RealApiResponse<T> is a union of two separate object shapes, one of which simply never mentions data at all.',
    solution: `Uncommenting the data-less err object fails to compile: "Property
'data' is missing in type '{ meta: ...; status: \"error\"; message:
string; }' but required in type 'ApiResponse<User>'." -- confirming
data is unconditionally required regardless of status.

realErr, built from the genuine discriminated union
RealApiResponse<T>, compiles with zero error while completely
omitting data -- because the { status: 'error'; message: string }
branch of the union simply never declares a data field at all, so
there's nothing to satisfy.

The practical lesson: a field that merely LOOKS like a discriminant
(a string-literal-union property sitting next to other fields in one
flat interface) does not behave like one unless the type is
genuinely structured as a union of separate shapes. The page's own
Zod section already demonstrates the correct pattern
(discriminatedUnion()) — applying that same structure to
ApiResponse<T> would remove the awkward placeholder data value
every error response currently needs.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'because `ApiResponse<T>` has a `status: \'ok\' | \'error\'` field, TypeScript treats it as a discriminated union and correctly relaxes which other fields are required based on the current `status` value.',
      reality: '`ApiResponse<T>` is one flat interface — `status` being a two-value string literal type does not automatically connect to `data`\'s optionality; `data: T` remains unconditionally required no matter what `status` is set to.',
    },
    {
      thought: 'a field named something like `status` or `type` that holds a small set of string literals is, by itself, enough to give a type discriminated-union behavior.',
      reality: 'discriminated-union narrowing requires the type to actually BE a union of separate object shapes joined with `|` — a single interface with a literal-typed field looks similar on the surface but has none of that narrowing behavior.',
    },
    {
      thought: 'this is a purely cosmetic issue — providing a placeholder `data` value for error responses is a minor inconvenience with no real downside.',
      reality: 'a placeholder value like `null as unknown as T` is a type-safety hole disguised as boilerplate — any code that later reads `data` off an "error" response without checking `status` first gets a value that was never real, with no compiler warning that it might be meaningless.',
    },
  ];
}
