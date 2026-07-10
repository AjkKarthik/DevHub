import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-merging-ignores-generic-names-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-declaration-merging-ignores-generic-parameter-names.html',
  styleUrl: './testing-that-declaration-merging-ignores-generic-parameter-names.scss',
})
export class TestingThatDeclarationMergingIgnoresGenericParameterNamesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Merge Example Is Non-Generic',
      points: [
        'The Declaration merging theory section demonstrates interface merging with a plain, non-generic example: <code>interface Foo { a: string }</code> + <code>interface Foo { b: number }</code> = <code>{ a: string; b: number }</code>. Neither declaration has a type parameter.',
        'This subtopic tests what happens when the SAME interface name is declared generically in two places — with DIFFERENT type parameter names, like <code>Box&lt;T&gt;</code> in one declaration and <code>Box&lt;U&gt;</code> in another. Do these merge at all? If they do, does the naming mismatch cause any problem?',
      ],
    },
    {
      heading: 'Why the Type Parameter\'s Name Never Matters',
      points: [
        'A generic type parameter name (<code>T</code>, <code>U</code>, <code>TItem</code>, whatever) is purely a LOCAL LABEL used to reference that parameter within its own declaration\'s body — it has no meaning outside that declaration and is never part of the interface\'s public identity.',
        'TypeScript merges generic interfaces of the same name as long as they have the SAME NUMBER of type parameters (matching arity) — the actual names used for those parameters in each separate declaration are completely irrelevant to whether the merge succeeds.',
        '<code>interface Box&lt;T&gt; { value: T }</code> and <code>interface Box&lt;U&gt; { label: string }</code> merge cleanly into a single <code>Box&lt;T&gt;</code> (or equivalently thought of as <code>Box&lt;U&gt;</code> — the merged declaration\'s own parameter name comes from wherever TypeScript happens to report it, but functionally it is one shared parameter used by both merged members) with <code>value: T</code> AND <code>label: string</code> both present, and constructing <code>Box&lt;string&gt;</code> correctly types <code>value</code> as <code>string</code>.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Generic interface merging</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// First declaration -- type parameter named T
interface Box<T> {
  value: T;
}

// Second declaration -- SAME interface name, DIFFERENT type parameter name (U)
interface Box<U> {
  label: string;
}

// Does this merge into a single generic Box<T> with BOTH members?
const b: Box<number> = { value: 42, label: 'a numeric box' };
console.log('merged generic Box:', b);
console.log('value is typed as the generic parameter:', b.value);

// Confirm the generic substitution genuinely applies to the member
// that came from the FIRST declaration (value: T), even though the
// SECOND declaration used a different parameter name (U)
const stringBox: Box<string> = { value: 'hello', label: 'a string box' };
console.log('value.toUpperCase() should compile if value is string:', stringBox.value.toUpperCase());

// const bad: Box<number> = { value: 'not a number', label: 'x' };
// Uncomment above -- does the generic constraint still correctly
// apply even though the two declarations used different parameter names?
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment the `bad` example (assigning a string to `value` on a `Box<number>`). Confirm it fails to compile — proving the merge genuinely respects the generic substitution, not just structurally combining the members.',
    hint: 'If the merge worked but somehow lost track of the generic relationship, value might end up typed as `unknown` or `any` instead of correctly tracking T. Test that value stays precisely typed per the type argument.',
    solution: `Uncommenting the bad example fails to compile: "Type 'string' is
not assignable to type 'number'." -- confirming that the merged
Box<T> interface correctly threads the generic type argument through
to the value: T member, exactly as if both members had originally
been declared together in one interface using the same parameter
name throughout.

This confirms declaration merging for generics is a genuine,
type-safe merge -- not just a superficial combination of member
lists that happens to compile. The type parameter NAME each
individual declaration chose (T vs U) is discarded as irrelevant
bookkeeping; only the parameter's POSITION and constraint (if any)
matter for merging correctly.

Practical implication: when writing ambient module augmentations for
an already-generic interface (a common pattern for augmenting
library types), you do not need to match the original library's
exact type parameter name — only the number of type parameters
needs to line up.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'two generic interface declarations with the same name only merge successfully if they use the exact same type parameter name (both `T`, or both `U`, etc.).',
      reality: 'the type parameter\'s NAME is purely a local label with no bearing on merging — only the NUMBER of type parameters (arity) needs to match; `Box<T>` and `Box<U>` merge exactly the same as if both had used `T`.',
    },
    {
      thought: 'if a merge "succeeds" across differently-named type parameters, the resulting type is somehow looser or less type-safe than a single, unified declaration would be.',
      reality: 'the merge is fully type-safe — the generic substitution correctly threads through every member from every merged declaration, exactly as if all the members had been written together under one shared parameter name from the start.',
    },
    {
      thought: 'this generic-parameter-naming detail is a minor curiosity with no practical relevance to real code.',
      reality: 'it directly matters for module augmentation of already-generic library interfaces — a common real pattern — since the augmenting declaration never needs to guess or match the original library\'s internal type parameter naming choice.',
    },
  ];
}
