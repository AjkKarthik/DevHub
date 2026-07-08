import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-stringkeys-excludes-optional-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-stringkeys-excludes-an-optional-string-property.html',
  styleUrl: './testing-that-stringkeys-excludes-an-optional-string-property.scss',
})
export class TestingThatStringkeysExcludesAnOptionalStringPropertySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s StringKeys Filter',
      points: [
        'The Key Remapping tab defines <code>type StringKeys&lt;T&gt; = { [K in keyof T as T[K] extends string ? K : never]: T[K] }</code>, filtering "by value type — keep only string properties." Its <code>Mixed</code> example only tests REQUIRED string properties (<code>id</code>, <code>name</code>), both of which are correctly kept.',
        'This subtopic tests what StringKeys does with an OPTIONAL string property — one that genuinely holds a string when set, declared with <code>?</code>, like <code>nickname?: string</code>. Does the filter still recognize it as a string property?',
      ],
    },
    {
      heading: 'Why an Optional String Property Fails the Check',
      points: [
        'For an optional property, TypeScript\'s indexed-access type <code>T[K]</code> is not just the declared type — it automatically includes <code>| undefined</code>, since the property might genuinely be absent. <code>Mixed[\'nickname\']</code> for <code>nickname?: string</code> is <code>string | undefined</code>, not plain <code>string</code>.',
        'The condition <code>T[K] extends string</code> checks whether the WHOLE type at <code>T[K]</code> is assignable to <code>string</code>. A union only extends a type if EVERY member does — <code>undefined</code> does not extend <code>string</code>, so <code>string | undefined extends string</code> is <code>false</code>, and the key is mapped to <code>never</code>, excluded from the result.',
        'This is the exact same underlying mechanic behind the earlier <code>FunctionKeys</code> gap on the Generic Patterns page — any conditional-type-based filter that checks <code>T[K] extends SomeType</code> directly, without first stripping a possible <code>undefined</code> via <code>NonNullable&lt;T[K]&gt;</code>, silently drops every OPTIONAL member of the matching shape, not just function properties.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>StringKeys and optional properties</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own StringKeys utility, unchanged
type StringKeys<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

// The main page's own Mixed interface, PLUS one optional string
// property added for this test
interface Mixed {
  id: string;
  name: string;
  age: number;
  active: boolean;
  nickname?: string; // genuinely a string when set -- but OPTIONAL
}

type StringProps = StringKeys<Mixed>;
// The main page's original result (without nickname) was
// { id: string; name: string }. With nickname added, is it
// { id: string; name: string; nickname?: string }, or does
// nickname get silently dropped?

function assertIsStringKey<K extends keyof StringProps>(key: K): K { return key; }

assertIsStringKey('id');   // compiles -- required string
assertIsStringKey('name'); // compiles -- required string

// assertIsStringKey('nickname');
// Uncomment above -- nickname genuinely holds a string when present.
// Does this compile?

console.log('If no build error appeared above, nickname WAS included in StringKeys<Mixed>.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment `assertIsStringKey(\'nickname\')`. Read the exact compiler error. Then write a corrected `StringKeysIncludingOptional<T>` using NonNullable<T[K]> that correctly includes nickname.',
    hint: 'This is the identical fix pattern used for the earlier FunctionKeys gap -- strip the | undefined with NonNullable<T[K]> before the extends check.',
    solution: `Uncommenting gives: "Argument of type 'nickname' is not assignable
to parameter of type 'id' | 'name'." -- confirming nickname was
silently excluded from StringKeys<Mixed>.

A corrected version:

type StringKeysIncludingOptional<T> = {
  [K in keyof T as NonNullable<T[K]> extends string ? K : never]: T[K];
};

NonNullable<T[K]> strips the | undefined from nickname's indexed-
access type (string | undefined) before the extends check runs, so
it correctly becomes just string, which does extend string. Applied
to the same Mixed interface, StringKeysIncludingOptional<Mixed> now
correctly yields { id: string; name: string; nickname?: string }.

This confirms the pattern generalizes: ANY "filter by value type"
mapped type on this page (StringKeys, PickByValue, EventHandlers'
missing type check) needs the same NonNullable<T[K]> treatment to
correctly handle optional properties.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s `StringKeys<T>` — described as keeping "only string properties" — correctly identifies any property that genuinely holds a string value, whether required or optional.',
      reality: 'an optional string property\'s indexed-access type includes `| undefined`, which fails the bare `extends string` check — `StringKeys<T>` silently excludes every optional string property unless `NonNullable<T[K]>` is used first.',
    },
    {
      thought: 'this is an isolated quirk specific to this one StringKeys example, unrelated to the FunctionKeys gap tested on a different topic page.',
      reality: 'it is the exact same underlying mechanic — any conditional-type-based key filter that checks `T[K] extends SomeType` directly, without stripping `undefined` first, has this gap for ANY target type, not just function types.',
    },
    {
      thought: 'the main page\'s Mixed example, tested only against required string properties, proves StringKeys works correctly for all string-valued properties in general.',
      reality: 'the example never included an optional string property, so it never exercised this exact failure mode — testing only the easy case (required properties) can hide a real gap in the harder one (optional properties).',
    },
  ];
}
