import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-post-type-missing-author-field',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './post-type-missing-author-field.html',
  styleUrl: './post-type-missing-author-field.scss',
})
export class PostTypeMissingAuthorFieldSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'One schema, two code tabs, one contradiction',
      points: [
        'The main page\'s "First Query" code tab declares the whole schema up front. Its <code>Post</code> type has exactly three fields: <code>id</code>, <code>title</code>, and <code>published</code> — no <code>author</code>.',
        'The "Mutation &amp; Subscription" code tab, further down the same page, sends a subscription that selects <code>postPublished { id title author { name } }</code> — reaching into a <code>Post.author</code> field the schema above never defined.',
        'GraphQL validates every operation against the schema BEFORE any resolver runs. An unknown field is not a runtime surprise — it is a hard validation error, rejected before execution: <code>Cannot query field "author" on type "Post"</code>. The subscription as written could never execute against the schema as written.',
        'The fix is a one-line schema addition, not a query change: <code>Post</code> genuinely needs an <code>author</code> field for the subscription to be meaningful, and the main page\'s own Challenge solution already declares <code>author: User!</code> on its blog <code>Post</code> type. The two code tabs simply drifted apart.',
      ],
    },
    {
      heading: 'Why non-null (User!) and not nullable',
      points: [
        'A published post always has an author — there is no sensible "post with no author" state. Declaring <code>author: User!</code> makes that guarantee part of the contract: a client selecting <code>author { name }</code> never has to write a null check for the author object itself.',
        'It also completes a bi-directional relationship the schema already half-declared: <code>User.posts</code> was there from the start (<code>[Post!]!</code>), but <code>Post.author</code> — the reverse edge — was missing. Object graphs are usually navigable in both directions.',
        'The non-null choice has a real consequence covered in the next subtopic: if an <code>author</code> resolver ever returns null, the error does not stay local — it propagates up and nulls the entire <code>Post</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The mismatch, made executable',
      language: 'typescript',
      code: `// A tiny validator: walk a selection set against a schema map.
type SchemaMap = Record<string, Record<string, string>>;

function validate(schema: SchemaMap, typeName: string, selection: any[], path: string[] = []): string[] {
  const type = schema[typeName];
  const errors: string[] = [];
  for (const field of selection) {
    const def = type?.[field.name];
    if (!def) {
      errors.push(\`Cannot query field "\${field.name}" on type "\${typeName}" (at \${[...path, field.name].join('.')})\`);
      continue;
    }
    if (field.sel) {
      const childType = def.replace(/[![\\]]/g, '');
      errors.push(...validate(schema, childType, field.sel, [...path, field.name]));
    }
  }
  return errors;
}

// The schema as the "First Query" tab originally wrote it — no Post.author
const brokenSchema: SchemaMap = {
  Subscription: { postPublished: 'Post' },
  User: { id: 'ID!', name: 'String!', email: 'String!', posts: '[Post!]!' },
  Post: { id: 'ID!', title: 'String!', published: 'Boolean!' },
};

// The subscription the "Mutation & Subscription" tab actually sends
const subQuery = [
  { name: 'postPublished', sel: [
    { name: 'id' }, { name: 'title' },
    { name: 'author', sel: [{ name: 'name' }] },
  ]},
];

console.log(validate(brokenSchema, 'Subscription', subQuery));
// [ 'Cannot query field "author" on type "Post" (at postPublished.author)' ]

// The one-line fix
const fixedSchema: SchemaMap = {
  ...brokenSchema,
  Post: { ...brokenSchema.Post, author: 'User!' },
};
console.log(validate(fixedSchema, 'Subscription', subQuery)); // []`,
    },
    {
      label: 'The resolver that pairs with the fixed schema',
      language: 'typescript',
      code: `// SDL — Post now carries the reverse edge
// type Post {
//   id: ID!
//   title: String!
//   published: Boolean!
//   author: User!
// }

// Resolvers — Post.author resolves from the row's foreign key.
const resolvers = {
  Subscription: {
    postPublished: {
      subscribe: () => pubsub.asyncIterator('POST_PUBLISHED'),
    },
  },
  Post: {
    // parent is the raw post row: { id, title, published, authorId }
    author: (post: { authorId: string }, _args: unknown, ctx: Ctx) =>
      ctx.loaders.user.load(post.authorId),
  },
};

// A subscription payload is validated against the SAME schema as every
// query and mutation — publishing { id, title, authorId } is enough,
// because the Post.author resolver fills the author selection on demand.
function onPostPublished(row: PostRow) {
  pubsub.publish('POST_PUBLISHED', { postPublished: row });
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate proposes fixing the mismatch the other way — deleting <code>author { name }</code> from the subscription selection instead of adding <code>Post.author</code> to the schema. The build passes and validation is clean. What is lost?',
    hint: 'Think about what a subscription client actually needs when a post is published, and what the main page\'s own Challenge schema already decided.',
    solution: `Deleting the selection makes the contradiction go away without making the schema correct. A "post published" event whose payload cannot include the author is far less useful -- most subscribers want to show "Alice published X", which needs the author's name.

The main page's own Challenge solution already declares author: User! on its blog Post type, so the schema-side fix aligns the fundamentals page with the rest of the same page. Adding the field is the fix that makes both code tabs describe one coherent API; removing the selection just hides that they disagree.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"A field referenced in a query but missing from the schema is a runtime error the resolver layer will surface."',
      reality: 'It never reaches a resolver. GraphQL runs a full validation pass against the schema before execution begins, and an unknown field fails that pass with <code>Cannot query field "author" on type "Post"</code>. The operation is rejected whole — no partial data, no resolver invoked.',
    },
    {
      thought: '"Each code sample on a docs page is self-contained, so a schema shown in one tab does not constrain a query shown in another."',
      reality: 'When code tabs are presented as one running example — same <code>User</code> and <code>Post</code> types, same API — a query in a later tab is read against the schema in the earlier tab. A field the schema never declared is a genuine defect in the combined example, even though each tab compiles in isolation.',
    },
  ];

  topicLabel = 'GraphQL Fundamentals';
  topicRoute = '/graphql/fundamentals';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'Non-Null Field Errors Bubble Up',
    route: '/graphql/fundamentals/non-null-error-propagation',
  };
}
