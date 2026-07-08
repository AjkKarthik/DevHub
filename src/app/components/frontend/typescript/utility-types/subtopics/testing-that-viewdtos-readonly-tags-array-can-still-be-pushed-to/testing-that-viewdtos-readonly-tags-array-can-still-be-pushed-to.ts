import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-viewdto-readonly-tags-push-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-viewdtos-readonly-tags-array-can-still-be-pushed-to.html',
  styleUrl: './testing-that-viewdtos-readonly-tags-array-can-still-be-pushed-to.scss',
})
export class TestingThatViewdtosReadonlyTagsArrayCanStillBePushedToSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Challenge\'s AdminView',
      points: [
        'The challenge solution defines <code>type AdminView = ViewDTO&lt;Post, keyof Post&gt;; // Readonly&lt;Post&gt; — all fields, readonly</code>, where <code>Post.tags</code> is <code>string[]</code>. The comment describes this as "all fields, readonly" without qualifying what "readonly" means for the <code>tags</code> array specifically.',
        'Common Mistake #1 already establishes that <code>Partial&lt;T&gt;</code> is shallow — it only affects top-level properties. This subtopic tests whether <code>Readonly&lt;T&gt;</code> has the SAME kind of shallowness gap, specifically for the one array-typed field the challenge\'s own <code>Post</code> interface has.',
      ],
    },
    {
      heading: 'Why readonly on a Property Doesn\'t Protect the Array\'s Contents',
      points: [
        '<code>Readonly&lt;T&gt;</code> is implemented as <code>{ readonly [K in keyof T]: T[K] }</code> — the <code>readonly</code> modifier applies to the PROPERTY itself, preventing <code>adminView.tags = [...]</code> (reassigning which array the property points to). It does NOT change the VALUE TYPE of that property — <code>tags</code> is still typed as the fully mutable <code>string[]</code>, not <code>ReadonlyArray&lt;string&gt;</code>.',
        'This means array-mutating methods — <code>.push()</code>, <code>.pop()</code>, <code>.splice()</code>, direct index assignment (<code>tags[0] = \'x\'</code>) — remain fully callable on <code>adminView.tags</code> through a <code>Readonly&lt;Post&gt;</code> reference, silently mutating the SAME underlying array that the original, non-readonly <code>Post</code> object still references.',
        'To genuinely protect array contents, the source type itself needs <code>readonly string[]</code> or <code>ReadonlyArray&lt;string&gt;</code> for the <code>tags</code> field — <code>Readonly&lt;T&gt;</code> wrapping a type that already has a mutable array field cannot retroactively make that array\'s elements immutable.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Readonly<T> and nested array mutation</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The challenge's own Post interface, unchanged
interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  published: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

type ViewDTO<T, K extends keyof T> = Readonly<Pick<T, K>>;
type AdminView = ViewDTO<Post, keyof Post>; // "all fields, readonly" per the challenge's own comment

const post: Post = {
  id: '1', title: 'Hello', content: '...', authorId: 'u1',
  published: true, tags: ['ts', 'generics'],
  createdAt: new Date(), updatedAt: new Date(),
};

const adminView: AdminView = post;

// adminView.title = 'New Title';
// Uncomment above -- reassigning a top-level property: does it compile?

console.log('tags before push:', adminView.tags);
adminView.tags.push('mutated-through-readonly-view'); // does THIS compile?
console.log('tags after push:', adminView.tags);

// Confirm this is the SAME array the original mutable "post" object sees --
// not a defensive copy
console.log('post.tags now shows the mutation too:', post.tags);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment `adminView.title = \'New Title\';`. Compare its compiler error against the fact that `adminView.tags.push(...)` compiled with zero errors just below it.',
    hint: 'Readonly<T> blocks reassigning the tags PROPERTY itself (adminView.tags = [...]) but says nothing about what you can do to the array object that property currently points to.',
    solution: `adminView.title = 'New Title' fails to compile: "Cannot assign to
'title' because it is a read-only property." -- exactly the
protection Readonly<T> is documented to provide at the property level.

adminView.tags.push(...) compiles with NO error at all, and actually
mutates the array -- console.log confirms post.tags (the original,
supposedly-separate mutable object) shows the pushed value too,
because adminView and post share the exact same tags array reference;
Readonly<Post> never created a copy.

The fix, if array immutability is actually needed: change Post.tags
to readonly string[] (or ReadonlyArray<string>) in the SOURCE type.
Then Readonly<Post> (which only adds readonly to the property,
already redundant at that point) combined with the array's own
readonly element type together block both property reassignment
AND array mutation. Wrapping a type in Readonly<T> after the fact
cannot retroactively add that protection to an already-mutable
array field.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '`type AdminView = ViewDTO<Post, keyof Post>` being "all fields, readonly" (per the challenge\'s own comment) means every field, including the tags array\'s CONTENTS, is protected from mutation.',
      reality: '`Readonly<T>` only prevents reassigning each property itself — `tags: string[]` remains a fully mutable array type, so `.push()`, `.pop()`, and index assignment on `adminView.tags` all still compile and mutate the shared underlying array.',
    },
    {
      thought: 'this is a different, unrelated issue from the main page\'s already-documented "Partial is shallow" Common Mistake.',
      reality: 'it is the exact same category of shallowness — both `Partial<T>` and `Readonly<T>` only transform the TOP-LEVEL property modifiers of `T`; neither one recurses into or transforms the types of nested objects or arrays.',
    },
    {
      thought: 'a `Readonly<Post>` view and the original mutable `Post` object are separate, independently-mutable copies of the data.',
      reality: '`Readonly<T>` performs no copying at all — it is purely a compile-time type transformation applied to the SAME runtime object, so mutations that slip through (like array methods) are visible through every reference to that object, readonly-typed or not.',
    },
  ];
}
