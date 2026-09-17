import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-abstract-type-no-instanceof-fallback',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './abstract-type-no-instanceof-fallback.html',
  styleUrl: './abstract-type-no-instanceof-fallback.scss',
})
export class AbstractTypeNoInstanceofFallbackSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the default resolver actually does',
      points: [
        'The main page previously said "Without __resolveType, GraphQL falls back to instanceof checks". That is not how graphql-js works — there is no <code>instanceof</code> anywhere in the type-resolution path.',
        'When a field returns an interface or union and the abstract type has no <code>resolveType</code> function, graphql-js runs a default in this exact order: (1) if the resolved value has a <code>__typename</code> string property, use it; (2) otherwise call each possible type’s <code>isTypeOf(value)</code> in the order the types were defined, and take the first that returns true.',
        'If step 1 finds nothing and step 2 matches nothing, execution throws: <code>Abstract type "X" must resolve to an Object type at runtime. Either "X" should provide a "resolveType" function or each possible type should provide an "isTypeOf" function.</code>',
        'So there are three ways to make an abstract field resolve: a <code>resolveType</code> on the abstract type, a <code>__typename</code> on every value it can return, or an <code>isTypeOf</code> on every member type. A class instance with none of these does not resolve — the runtime never inspects its prototype.',
      ],
    },
    {
      heading: 'Why the instanceof idea is tempting but wrong',
      points: [
        'Many ORMs return rows as class instances (<code>new PostModel(row)</code>), so it feels like GraphQL "should" be able to tell a <code>PostModel</code> from a <code>UserModel</code>. It cannot — that knowledge lives in your code, not the runtime.',
        'To use the class identity, you have to write it yourself: <code>isTypeOf: (value) => value instanceof PostModel</code> on the <code>Post</code> type. Now the check exists, but because <em>you</em> put it there, not because graphql-js guessed.',
        'The cleanest option for a data layer you control is to stamp <code>__typename</code> onto each row as you load it. Then no <code>resolveType</code> or <code>isTypeOf</code> is needed at all, and the default’s step 1 handles everything.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The default, modelled',
      language: 'typescript',
      code: `type PossibleType = { name: string; isTypeOf?: (v: any) => boolean };

// Mirrors graphql-js's default resolveType behaviour.
function defaultResolveType(value: any, possibleTypes: PossibleType[]): string {
  // 1. a __typename on the value wins outright
  if (value && typeof value.__typename === 'string') return value.__typename;

  // 2. otherwise, each possible type's isTypeOf in definition order; first match wins
  for (const t of possibleTypes) {
    if (typeof t.isTypeOf === 'function' && t.isTypeOf(value)) return t.name;
  }

  // 3. nothing matched -> the runtime error (NOT an instanceof guess)
  throw new Error(
    'Abstract type "SearchResult" must resolve to an Object type at runtime. ' +
    'Either "SearchResult" should provide a "resolveType" function or each ' +
    'possible type should provide an "isTypeOf" function.'
  );
}`,
    },
    {
      label: 'Three inputs, three outcomes',
      language: 'typescript',
      code: `class PostModel { constructor(public title: string) {} }

const withIsTypeOf = [
  { name: 'Post', isTypeOf: (v: any) => v.title !== undefined },
  { name: 'User', isTypeOf: (v: any) => v.name  !== undefined },
];
const bare = [{ name: 'Post' }, { name: 'User' }];

// A value carrying its own __typename: resolves with no isTypeOf needed.
console.log(defaultResolveType({ __typename: 'Post', title: 'Hi' }, bare));
// Post

// A plain object, no __typename, but isTypeOf is registered: resolves.
console.log(defaultResolveType({ title: 'Hi' }, withIsTypeOf));
// Post

// A class instance, no __typename, no isTypeOf: throws.
// graphql-js never checks 'new PostModel(...) instanceof PostModel' for you.
try {
  defaultResolveType(new PostModel('Hi'), bare);
} catch (e) {
  console.log((e as Error).message.slice(0, 52) + '...');
  // Abstract type "SearchResult" must resolve to an Ob...
}

// Same class instance resolves once YOU add the instanceof check yourself:
console.log(defaultResolveType(new PostModel('Hi'), [
  { name: 'Post', isTypeOf: (v: any) => v instanceof PostModel },
  { name: 'User' },
]));
// Post`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Your data layer returns rows as class instances — <code>PostRow</code>, <code>CommentRow</code>, <code>UserRow</code> — and a <code>union FeedItem = Post | Comment | User</code> field returns a mixed array of them. You wrote no <code>resolveType</code> and no <code>isTypeOf</code>, reasoning "they are already distinct classes, GraphQL can tell them apart." The query fails. Why, and what are the two smallest fixes?',
    hint: 'graphql-js’s default never looks at an object’s constructor or prototype.',
    solution: `It fails because graphql-js's default resolveType only checks for a __typename property, then tries each member type's isTypeOf. It never inspects the value's class, constructor, or prototype -- "distinct classes" means nothing to it. With none of the three mechanisms present, the field throws "Abstract type FeedItem must resolve to an Object type at runtime."

Two smallest fixes:
1. Add an isTypeOf per member type that uses the class identity you already have:
   Post: { isTypeOf: (v) => v instanceof PostRow }   (and likewise for Comment, User)
2. Or, in the data layer, set row.__typename = 'Post' (etc.) when you construct each row. Then the default's first step resolves every value with zero resolver code.

Adding a single resolveType on the FeedItem union works too, but it duplicates a mapping the class instances already encode -- the isTypeOf or __typename approach reuses it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"If my resolvers return real class instances, GraphQL can work out the concrete type by checking <code>instanceof</code>."',
      reality: 'It cannot. graphql-js’s default type resolution checks for a <code>__typename</code> property, then calls each member’s <code>isTypeOf</code>. The constructor and prototype chain are never consulted. If you want to use class identity you must write <code>isTypeOf: (v) => v instanceof Foo</code> yourself.',
    },
    {
      thought: '"Every interface and union field must have a <code>__resolveType</code> function."',
      reality: 'Not strictly. A <code>__typename</code> on each value the field can return, or an <code>isTypeOf</code> on each member type, both satisfy the default resolver. <code>resolveType</code> is the most direct option, but it is one of three, not a hard requirement.',
    },
    {
      thought: '"Returning <code>null</code> from <code>__resolveType</code> is a harmless fallthrough."',
      reality: 'It produces the same outcome as having no resolver at all — the field throws "Abstract type must resolve to an Object type at runtime". A <code>resolveType</code> that cannot decide should throw a descriptive error, not return <code>null</code>.',
    },
  ];

  topicLabel = 'Type System Deep Dive';
  topicRoute = '/graphql/type-system';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'Unwrapping Introspection Types: Following ofType',
    route: '/graphql/type-system/unwrapping-oftype',
  };
}
