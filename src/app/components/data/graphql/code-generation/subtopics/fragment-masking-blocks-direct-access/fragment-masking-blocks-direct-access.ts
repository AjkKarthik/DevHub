import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-code-generation-fragment-masking',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './fragment-masking-blocks-direct-access.html',
  styleUrl: './fragment-masking-blocks-direct-access.scss'
})
export class FragmentMaskingBlocksDirectAccessSubtopic {
  topicLabel = 'Code Generation';
  topicRoute = '/graphql/code-generation';

  theory: TheoryPoint[] = [
    {
      heading: 'client-preset masks fragment fields by default',
      points: [
        'Verified directly against GraphQL Code Generator\'s own client-preset docs: "the <code>client-preset</code> comes with Fragment Masking enabled by default."',
        'A field spreading a fragment -- e.g. <code>author { ...AuthorFields }</code> -- is generated as an OPAQUE type, <code>FragmentType&lt;typeof AUTHOR_FIELDS&gt;</code>, not the fragment\'s real field shape.',
        'The only way to read the real fields is <code>useFragment(AUTHOR_FIELDS, post.author)</code>, which unwraps the masked value and returns a properly-typed object.',
        'This is the mechanism BEHIND the main page\'s own "FragmentType utility ensures you can only use fragments where intended" bullet -- masking is what enforces that a component can only read fragment data it explicitly declared a dependency on.'
      ]
    },
    {
      heading: 'The main page\'s own comment described the OPPOSITE of masked behavior',
      points: [
        'The "Client Usage" codeTab spreads <code>...AuthorFields</code> onto <code>post.author</code>, and its own comment claimed <code>data.post.author.name has type string</code> -- direct, unmasked field access.',
        'With fragment masking (the client-preset\'s own default), that access is a TypeScript compile error: <code>post.author</code> has no <code>name</code> property in its generated type at all, only an internal masking brand.',
        'The codeTab\'s own JSX never actually tried to read <code>post.author.name</code> -- only the trailing COMMENT made the incorrect claim, which is exactly the kind of gap a build never catches, since the code itself was syntactically fine either way.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Wrong: reading a masked field directly',
      language: 'typescript',
      code: `import { graphql } from '../__generated__/gql';
import { useQuery } from '@apollo/client';

const AUTHOR_FIELDS = graphql(\`
  fragment AuthorFields on User {
    id
    name
    avatarUrl
  }
\`);

const GET_POST = graphql(\`
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      title
      author { ...AuthorFields }
    }
  }
\`);

function PostByline({ id }: { id: string }) {
  const { data } = useQuery(GET_POST, { variables: { id } });
  const post = data?.post;

  // TS2339: Property 'name' does not exist on type
  // 'FragmentType<DocumentTypeDecoration<AuthorFieldsFragment, unknown>>'.
  return <span>By {post?.author.name}</span>;
}`
    },
    {
      label: 'Right: useFragment() unmasks it first',
      language: 'typescript',
      code: `import { graphql } from '../__generated__/gql';
import { useFragment } from '../__generated__/fragment-masking';
import { useQuery } from '@apollo/client';

const AUTHOR_FIELDS = graphql(\`
  fragment AuthorFields on User {
    id
    name
    avatarUrl
  }
\`);

const GET_POST = graphql(\`
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      title
      author { ...AuthorFields }
    }
  }
\`);

function PostByline({ id }: { id: string }) {
  const { data } = useQuery(GET_POST, { variables: { id } });
  const post = data?.post;

  // useFragment() unmasks post.author into its real shape.
  // Only runs when post.author actually exists.
  const author = post?.author ? useFragment(AUTHOR_FIELDS, post.author) : undefined;

  // author.name is now a real, typed string -- no compile error.
  return <span>By {author?.name}</span>;
}`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate "fixes" the compile error from the first codeTab above by changing <code>post?.author.name</code> to <code>(post?.author as any)?.name</code> instead of calling <code>useFragment()</code>. Does this actually solve the problem the client-preset\'s fragment masking exists to prevent?',
    hint: 'What is fragment masking actually FOR, according to the theory above -- and does casting to <code>any</code> preserve or defeat that purpose?',
    solution: 'No -- it only silences the compiler, it does not solve the underlying problem. Fragment masking exists to enforce that a component only reads fields it explicitly declared a dependency on via a spread fragment, so that a parent query can freely add, remove, or restructure OTHER fields without breaking components that never asked for them. Casting to any restores unmasked access without going through useFragment(), which means the component is now silently coupled to the AuthorFields fragment\'s internal shape again -- exactly the coupling masking was designed to prevent -- and TypeScript can no longer catch it if that fragment is later renamed or its fields change. The any cast trades a real compile-time safety net for a false sense that the type system approves.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Fragment masking only matters for large teams with many components sharing fragments -- for a small codebase it is safe to ignore.',
      reality: 'Masking is ON by default the moment you use the <code>client-preset</code>, regardless of project size -- it is not an opt-in convention, it is how the generated types are actually shaped. Any query with a spread fragment produces a masked field, and TypeScript will reject direct access to it whether the codebase has 1 component or 100.'
    },
    {
      thought: 'Since <code>useFragment()</code> "unwraps" the data, it must be doing some kind of runtime transformation or re-fetch.',
      reality: '<code>useFragment()</code> is a pure type-level unwrap with a trivial runtime implementation (essentially an identity function with a type assertion) -- the actual field data was already present in the query response the whole time. Masking is a TypeScript-only mechanism; it adds zero network requests and no meaningful runtime cost.'
    },
    {
      thought: 'The main page\'s comment claiming direct field access "has type string" was just a minor documentation typo, unrelated to how the actual generated code behaves.',
      reality: 'It described the exact opposite of the client-preset\'s own default behavior, not a typo in a detail -- masking is the headline feature the "Fragments are typed separately" theory bullet on the same page was trying to describe, and the comment described the pre-masking (or masking-disabled) mental model instead of what client-preset actually ships with.'
    }
  ];

  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = { label: 'Setting Up near-operation-file for Colocated Types', route: '/graphql/code-generation/near-operation-file-preset' };
}
