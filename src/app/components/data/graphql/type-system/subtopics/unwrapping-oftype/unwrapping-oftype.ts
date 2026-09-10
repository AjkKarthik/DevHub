import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-unwrapping-oftype',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './unwrapping-oftype.html',
  styleUrl: './unwrapping-oftype.scss',
})
export class UnwrappingOftypeSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Wrapped types have no name',
      points: [
        'The main page’s Challenge asks you to write an introspection query with nested <code>ofType</code>, and the theory says "follow ofType until you reach a named type" — but nothing on the page shows the loop that actually does it.',
        'In an introspection result, a type reference is a small tree. <code>NON_NULL</code> and <code>LIST</code> nodes have <code>name: null</code> and an <code>ofType</code> pointing at what they wrap. Only <code>SCALAR</code>, <code>OBJECT</code>, <code>INTERFACE</code>, <code>UNION</code>, <code>ENUM</code>, and <code>INPUT_OBJECT</code> nodes carry a real <code>name</code>, and those never have an <code>ofType</code>.',
        'So <code>[Post!]!</code> arrives as <code>NON_NULL → LIST → NON_NULL → OBJECT("Post")</code>. Reading <code>result.name</code> on the outer node gives <code>null</code>; the useful name is three <code>ofType</code> hops deeper.',
        'Two things you usually want from that tree: the innermost named type (for "which type is this field?"), and the full wrapper string (for displaying the type as SDL, like a codegen tool would).',
      ],
    },
    {
      heading: 'Rendering it back to SDL',
      points: [
        'Wrapper order in the tree maps directly to SDL syntax read outside-in: a <code>NON_NULL</code> node adds a trailing <code>!</code> to whatever it wraps; a <code>LIST</code> node wraps its inner rendering in <code>[ ]</code>.',
        'A short recursive function handles any depth: if the node is <code>NON_NULL</code>, render <code>ofType</code> then append <code>!</code>; if <code>LIST</code>, render <code>ofType</code> inside brackets; otherwise return <code>name</code>.',
        'The nesting really can go deeper than one level — <code>[[Int!]!]!</code> is a valid, if unusual, type, and a generic unwrapper must recurse rather than assume "at most NON_NULL of LIST of NON_NULL of a name".',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The two unwrappers',
      language: 'typescript',
      code: `type TypeRef = {
  kind: 'NON_NULL' | 'LIST' | 'SCALAR' | 'OBJECT' | 'INTERFACE' | 'UNION' | 'ENUM' | 'INPUT_OBJECT';
  name: string | null;
  ofType: TypeRef | null;
};

// Full SDL string, read outside-in.
function renderType(ref: TypeRef | null): string {
  if (ref == null) return '<none>';
  if (ref.kind === 'NON_NULL') return renderType(ref.ofType) + '!';
  if (ref.kind === 'LIST') return '[' + renderType(ref.ofType) + ']';
  return ref.name as string; // a named kind: has a name, has no ofType
}

// Just the innermost named type -- for "what type does this field ultimately return?"
function namedType(ref: TypeRef | null): string | null {
  let cur = ref;
  while (cur && cur.name == null) cur = cur.ofType; // skip every NON_NULL / LIST wrapper
  return cur ? cur.name : null;
}`,
    },
    {
      label: 'Applied to real introspection JSON',
      language: 'typescript',
      code: `// The field "posts: [Post!]!" comes back from __type(...) { fields { type {...} } } as:
const postsField: TypeRef = {
  kind: 'NON_NULL', name: null, ofType: {
    kind: 'LIST', name: null, ofType: {
      kind: 'NON_NULL', name: null, ofType: {
        kind: 'OBJECT', name: 'Post', ofType: null } } } };

console.log(renderType(postsField)); // [Post!]!
console.log(postsField.name);        // null   <- reading .name directly is a trap
console.log(namedType(postsField));  // Post

// A plain scalar field "title: String":
const titleField: TypeRef = { kind: 'SCALAR', name: 'String', ofType: null };
console.log(renderType(titleField)); // String

// Deeper nesting really happens -- "grid: [[Int!]!]!":
const gridField: TypeRef = {
  kind: 'NON_NULL', name: null, ofType: {
    kind: 'LIST', name: null, ofType: {
      kind: 'NON_NULL', name: null, ofType: {
        kind: 'LIST', name: null, ofType: {
          kind: 'NON_NULL', name: null, ofType: {
            kind: 'SCALAR', name: 'Int', ofType: null } } } } } };
console.log(renderType(gridField)); // [[Int!]!]!`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An introspection query returns this for one field’s <code>type</code>: <code>{ kind: "LIST", name: null, ofType: { kind: "NON_NULL", name: null, ofType: { kind: "OBJECT", name: "User", ofType: null } } }</code>. What SDL type is this? Why does <code>result.name</code> give you <code>null</code>, and how many <code>ofType</code> hops reach the real name?',
    hint: 'Read the wrappers outside-in. The outermost node is a LIST — does a LIST node carry a name?',
    solution: `The SDL type is [User!] -- a NULLABLE list of NON-NULL Users. Read outside-in: the outer node is LIST (wrap in [ ]), its ofType is NON_NULL (append !), and that wraps OBJECT "User". There is no trailing ! on the list itself because the outermost node is LIST, not NON_NULL.

result.name is null because the outermost node is a LIST wrapper, and LIST and NON_NULL nodes always have name: null -- only named kinds (SCALAR, OBJECT, INTERFACE, UNION, ENUM, INPUT_OBJECT) carry a name.

It takes 2 ofType hops to reach the named node: LIST.ofType -> NON_NULL, then NON_NULL.ofType -> OBJECT { name: "User" }. A generic unwrapper walks ofType while name == null, so it handles this and any deeper nesting the same way.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"I can read <code>field.type.name</code> to find out what type a field returns."',
      reality: 'Only if the field type is an unwrapped named type. The moment it is <code>[Post]</code>, <code>Post!</code>, or anything wrapped, <code>field.type.name</code> is <code>null</code> and the real name is one or more <code>ofType</code> hops deeper. Walk <code>ofType</code> while <code>name</code> is <code>null</code>.',
    },
    {
      thought: '"The wrapping is always at most NON_NULL of LIST of NON_NULL of a name, so I can hard-code three levels."',
      reality: 'Nested lists are legal: <code>[[Int!]!]!</code> is five wrapper nodes deep. Any unwrapper that assumes a fixed depth breaks on a schema that uses a matrix-shaped field. Recurse on <code>ofType</code> instead.',
    },
    {
      thought: '"A named type node might still have an <code>ofType</code> I need to check."',
      reality: 'It will not. In an introspection type reference, <code>ofType</code> is non-null <em>only</em> on <code>NON_NULL</code> and <code>LIST</code> nodes. Reaching any named kind means you are at the bottom — stop there.',
    },
  ];

  topicLabel = 'Type System Deep Dive';
  topicRoute = '/graphql/type-system';
  prev: SubtopicLink | null = {
    label: 'There Is No instanceof Fallback for Abstract Types',
    route: '/graphql/type-system/abstract-type-no-instanceof-fallback',
  };
  next: SubtopicLink | null = {
    label: 'Disabling Introspection Is Not the Same as Hiding Your Schema',
    route: '/graphql/type-system/disabling-introspection-vs-hiding-schema',
  };
}
