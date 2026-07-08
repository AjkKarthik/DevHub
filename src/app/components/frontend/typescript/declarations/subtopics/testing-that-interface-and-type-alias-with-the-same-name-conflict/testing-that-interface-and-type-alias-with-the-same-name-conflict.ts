import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-interface-type-alias-conflict-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-interface-and-type-alias-with-the-same-name-conflict.html',
  styleUrl: './testing-that-interface-and-type-alias-with-the-same-name-conflict.scss',
})
export class TestingThatInterfaceAndTypeAliasWithTheSameNameConflictSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Quiz Only Tests type vs type',
      points: [
        'Quiz Q6 establishes that "duplicate type aliases are always an error" — testing <code>type Foo = ...</code> declared twice. The theory section separately shows <code>interface Foo</code> declared twice merging successfully.',
        'Neither example tests the MIXED case: what happens when the SAME name is used for one <code>interface</code> declaration AND one <code>type</code> alias declaration, in the same scope? Does declaration merging bridge across the two different KINDS of declaration, or does it strictly require both sides to be the same kind?',
      ],
    },
    {
      heading: 'Why Merging Never Crosses interface and type',
      points: [
        'Declaration merging is deliberately narrow: it only combines multiple declarations of the exact SAME declaration kind — two <code>interface</code> blocks merge; two <code>namespace</code> blocks merge; a <code>function</code> and a <code>namespace</code> can merge (a documented special case); a <code>class</code> and a <code>namespace</code> or <code>interface</code> can merge. A <code>type</code> alias never participates in ANY of these merge combinations, in either direction.',
        'This means <code>interface Config { a: string }</code> followed by <code>type Config = { b: number }</code> is NOT a partial merge or a silent override — it is a hard compile error, "Duplicate identifier \'Config\'," treated exactly the same as declaring the SAME type-alias name twice.',
        'The underlying reason: <code>interface</code> declarations are specifically designed to be extensible (open) — TypeScript keeps a running, mergeable definition for each interface name. <code>type</code> aliases are a single, closed binding to whatever the aliased type expression evaluates to — there is no "merge slot" for a type alias to participate in at all.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Interface vs type alias merging</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own interface merging -- works fine
interface AppConfig {
  apiUrl: string;
  timeout: number;
}
interface AppConfig { // same file -- merges!
  debug?: boolean;
}
const cfg: AppConfig = { apiUrl: '/api', timeout: 5000, debug: true };
console.log('interface + interface merged correctly:', cfg);

// This subtopic's test: interface + type alias, SAME name
interface Widget {
  id: string;
}

// type Widget = {
//   label: string;
// };
// Uncomment the type alias above -- does this compile alongside the
// interface Widget declared right above it?

console.log('If the build above did not fail, interface + type alias merged (it does not).');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment the `type Widget = { label: string };` block. Read the exact compiler error. Then try renaming just that type alias to `WidgetLabel` and confirm the conflict disappears.',
    hint: 'Declaration merging only combines declarations of the exact same kind -- interface with interface, namespace with namespace, and a few documented cross-kind pairs that never include type aliases.',
    solution: `Uncommenting produces: "Duplicate identifier 'Widget'." -- the
exact same error you would get from two duplicate type aliases, or
two conflicting incompatible declarations of any kind. TypeScript
makes no attempt to merge the interface's { id: string } with the
type alias's { label: string }.

Renaming the type alias to WidgetLabel removes the conflict
entirely, since the two declarations no longer share a name -- they
become two completely independent, unrelated type definitions.

The practical rule: if you need a name to be extensible or mergeable
across multiple files (the entire point of interface merging, used
for module augmentation throughout this topic), it must be declared
as an interface everywhere, consistently -- introducing even one
type alias with the same name anywhere in the program breaks the
whole mechanism with a hard error, not a partial merge.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'declaration merging works based on the NAME alone — any two declarations sharing a name, regardless of whether they are interfaces or type aliases, will attempt to merge.',
      reality: 'merging only ever combines declarations of the exact SAME kind — an `interface` and a `type` alias sharing a name produce a hard "Duplicate identifier" error, not a partial or silent merge.',
    },
    {
      thought: 'the main page\'s two separate facts (interfaces merge; duplicate type aliases error) describe two unrelated situations that never interact.',
      reality: 'they describe the SAME underlying rule from two angles — type aliases are fundamentally excluded from merging, whether the conflicting declaration is another type alias OR an interface with the identical name.',
    },
    {
      thought: 'if an interface/type-alias name conflict occurs, TypeScript picks one of the two declarations to "win" and silently ignores the other.',
      reality: 'TypeScript never silently resolves this — it is always a hard compile error requiring the developer to rename one of the two conflicting declarations.',
    },
  ];
}
