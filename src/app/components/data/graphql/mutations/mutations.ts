import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-gql-mutations',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './mutations.html',
  styleUrl: './mutations.scss'
})
export class GqlMutations {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: 'mutation', desc: 'Operation keyword for write operations with side effects' },
    { type: 'syntax', name: 'mutation Name($var: Type!) { field(...) }', desc: 'Named mutation with typed variable' },
    { type: 'type', name: 'MutationPayload', desc: 'Convention: return an object with the mutated entity + errors' },
    { type: 'type', name: 'UserError', desc: 'Convention: domain-level validation error returned in payload' },
    { type: 'syntax', name: 'input XxxInput', desc: 'Input type used as the single argument to a mutation' },
    { type: 'syntax', name: 'optimisticResponse', desc: 'Apollo Client: fake response to update UI before server confirms' },
    { type: 'syntax', name: 'update(cache, result)', desc: 'Apollo Client: manual cache update after mutation' },
    { type: 'keyword', name: 'refetchQueries', desc: 'Apollo Client: re-run named queries after a mutation completes' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Mutations vs Queries',
      points: [
        'Mutations are write operations that may have side effects: create, update, delete, send email, process payment.',
        'Unlike queries, multiple mutations in a single request execute serially, not in parallel — order is guaranteed.',
        'Mutations return data just like queries. You select which fields of the mutated object to return.',
        'Everything you can do in a resolver you can do in a mutation — the keyword is a semantic signal, not a technical constraint.'
      ]
    },
    {
      heading: 'Input Type Convention',
      points: [
        'The community convention is one input argument using an input type: `createPost(input: CreatePostInput!)`.',
        'This is future-proof — adding fields to the input type is backward compatible. Adding new top-level arguments is not.',
        'The input type should be named after the mutation with an `Input` suffix: `createPost` → `CreatePostInput`.',
        'Never pass scalars as multiple top-level arguments for mutations — it makes the signature brittle and hard to evolve.'
      ]
    },
    {
      heading: 'Mutation Payload Pattern',
      points: [
        'Instead of returning the entity directly, return a payload object: `createPost: CreatePostPayload`.',
        'The payload includes the mutated entity AND any errors: `{ post: Post, errors: [UserError!]! }`.',
        'This pattern (popularized by Relay) enables returning partial success and domain validation errors alongside the entity.',
        'UserError is distinct from GraphQL errors — it\'s a domain error shown in the payload, not a network/system error.'
      ]
    },
    {
      heading: 'Client-Side Cache Updates',
      points: [
        'After a mutation, the Apollo Client cache may be stale. Three strategies: refetchQueries, update function, or optimistic response.',
        'refetchQueries: re-runs specified queries after mutation — simple but costs an extra network round-trip.',
        'update function: manually update the cache with new data — more complex but immediate.',
        'optimisticResponse: provide a fake result immediately for instant UI feedback, then overwrite with real result.'
      ]
    },
    {
      heading: 'Error Handling in Mutations',
      points: [
        'Two kinds of mutation errors: GraphQL errors (thrown from resolvers — show in the `errors` array) and user errors (returned in payload).',
        'GraphQL errors abort the field and return null + error. User errors let the mutation "succeed" while communicating domain failures.',
        'Use GraphQL errors for unexpected/system errors (DB down, auth failure). Use payload errors for validation failures.',
        'The errors + data dual-presence in GraphQL responses lets clients handle both in one request.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Mutation',
      language: 'typescript',
      code: `# Basic mutation with input type
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    status
    author { name }
    createdAt
  }
}

# Variables:
# { "input": { "title": "Hello", "body": "...", "status": "DRAFT" } }

# Update mutation
mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
  updatePost(id: $id, input: $input) {
    id
    title
    updatedAt
  }
}

# Delete mutation
mutation DeletePost($id: ID!) {
  deletePost(id: $id)  # returns Boolean
}`
    },
    {
      label: 'Payload Pattern',
      language: 'typescript',
      code: `# Schema — Payload + UserError pattern
# type UserError { field: String; message: String! }
# type CreatePostPayload { post: Post; errors: [UserError!]! }

# Query
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    post {
      id
      title
    }
    errors {
      field
      message
    }
  }
}

# Client handles both success and domain errors:
# if (data.createPost.errors.length > 0) { showErrors(...) }
# else { navigate(data.createPost.post.id) }`
    },
    {
      label: 'Apollo Client',
      language: 'typescript',
      code: `import { useMutation, gql } from '@apollo/client';

const CREATE_POST = gql\`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
    }
  }
\`;

function CreatePostForm() {
  const [createPost, { loading, error }] = useMutation(CREATE_POST, {
    // Option 1: refetch a query after mutation
    refetchQueries: ['GetPosts'],

    // Option 2: manual cache update
    update(cache, { data }) {
      cache.modify({
        fields: {
          posts(existingPosts = []) {
            const newRef = cache.writeFragment({
              data: data.createPost,
              fragment: gql\`fragment NewPost on Post { id title }\`
            });
            return [newRef, ...existingPosts];
          }
        }
      });
    },

    // Option 3: optimistic response
    optimisticResponse: {
      createPost: { __typename: 'Post', id: 'temp-id', title: 'My Post' }
    }
  });

  const handleSubmit = (input: any) => {
    createPost({ variables: { input } });
  };
}`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Multiple top-level mutation arguments instead of input type',
      wrong: `mutation CreatePost($title: String!, $body: String, $published: Boolean) {
  createPost(title: $title, body: $body, published: $published) { id }
}`,
      right: `mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) { id }
}`,
      explanation: 'Single input type is future-proof. Adding a new field to CreatePostInput is backward compatible; adding a new top-level argument is not.'
    },
    {
      title: 'Not returning enough data from mutation',
      wrong: `mutation DeletePost($id: ID!) { deletePost(id: $id) }  # returns nothing`,
      right: `mutation DeletePost($id: ID!) {
  deletePost(id: $id) { success deletedId }
}`,
      explanation: 'Return at least an id or success indicator so the client can update its cache correctly without an extra refetch.'
    },
    {
      title: 'Assuming parallel mutation execution',
      wrong: `mutation {
  step1: doThing1(id: "1") { id }
  step2: doThing2(id: "2") { id }  # assumes step1 finished first
}`,
      right: `# Multiple mutations in one operation run serially — this is safe
# But if you need step2 to depend on step1's result, use two separate mutations`,
      explanation: 'Multiple root mutations execute serially (unlike queries). However, if step2 needs data from step1, use separate operations — a single document cannot pass results between mutations.'
    },
    {
      title: 'Throwing GraphQL errors for validation failures',
      wrong: `// Resolver throws for missing title — aborts the mutation
if (!args.input.title) throw new Error('Title required');`,
      right: `// Return user error in payload instead
return { post: null, errors: [{ field: 'title', message: 'Title required' }] };`,
      explanation: 'Validation failures are domain errors — return them in the payload. GraphQL errors are for unexpected system/auth errors that abort execution.'
    },
    {
      title: 'Forgetting optimisticResponse __typename',
      wrong: `optimisticResponse: { createPost: { id: 'temp', title: 'Post' } }`,
      right: `optimisticResponse: { createPost: { __typename: 'Post', id: 'temp', title: 'Post' } }`,
      explanation: 'Apollo Client cache normalization requires __typename to correctly identify and overwrite the optimistic entry when the real response arrives.'
    }
  ];

  challenge: Challenge = {
    title: 'Design a Delete Mutation with Payload',
    language: 'typescript',
    description: 'Write: (1) a schema mutation `deletePost(id: ID!): DeletePostPayload!` where the payload includes `deletedId: ID` and `errors: [UserError!]!`, (2) a TypeScript resolver that returns a payload error if the post doesn\'t exist, and (3) a client-side GraphQL mutation document with cache update that removes the deleted post from a `posts` list.',
    hints: [
      'UserError: { field: String; message: String! }',
      'DeletePostPayload: { deletedId: ID; errors: [UserError!]! }',
      'Resolver: check db.findById — if null, return errors array',
      'cache.modify to filter out the deleted post from existing cache'
    ],
    starterCode: `# 1. Schema types
type UserError { field: String; message: String! }
type DeletePostPayload { # fields }
type Mutation {
  deletePost(id: ID!): DeletePostPayload!
}

# 2. Resolver (TypeScript)
deletePost: async (_, { id }, { db }) => {
  # implement
}

# 3. Client mutation + cache update
const DELETE_POST = gql\`...\`;`,
    solution: `# 1. Schema
type UserError { field: String; message: String! }
type DeletePostPayload { deletedId: ID; errors: [UserError!]! }
type Mutation { deletePost(id: ID!): DeletePostPayload! }

# 2. Resolver
deletePost: async (_, { id }, { db }) => {
  const post = await db.findById(id);
  if (!post) {
    return { deletedId: null, errors: [{ field: 'id', message: 'Post not found' }] };
  }
  await db.delete(id);
  return { deletedId: id, errors: [] };
}

# 3. Client
const DELETE_POST = gql\`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      deletedId
      errors { field message }
    }
  }
\`;

useMutation(DELETE_POST, {
  update(cache, { data }) {
    const { deletedId } = data.deletePost;
    if (!deletedId) return;
    cache.modify({
      fields: {
        posts(existing, { readField }) {
          return existing.filter((ref: any) => readField('id', ref) !== deletedId);
        }
      }
    });
  }
})`
  };

  quiz: QuizQuestion[] = [
    { q: 'In what order do multiple mutations in a single operation execute?', options: ['In parallel', 'Serially, top to bottom', 'In random order', 'Based on field weight'], answer: 1, explanation: 'Unlike queries (parallel), multiple root mutations execute serially in the order they appear — this guarantees ordering.' },
    { q: 'What is the community convention for mutation arguments?', options: ['Multiple scalar arguments', 'A single input type argument', 'A JSON string argument', 'Key-value pairs'], answer: 1, explanation: 'Single `input: XxxInput!` is the convention. It is backward compatible — you can add fields to the input type without changing the mutation signature.' },
    { q: 'What is the difference between a GraphQL error and a UserError?', options: ['No difference', 'GraphQL errors are in the errors array; UserErrors are in the mutation payload', 'UserErrors crash the server', 'GraphQL errors are only for auth'], answer: 1, explanation: 'GraphQL errors abort execution and appear in the top-level errors array. UserErrors are domain-level validation failures returned in the mutation payload alongside the (possibly null) data.' },
    { q: 'What does optimisticResponse do in Apollo Client?', options: ['Caches the query', 'Provides a fake immediate result while the real mutation is in flight', 'Validates the mutation locally', 'Retries on failure'], answer: 1, explanation: 'optimisticResponse tells Apollo to immediately update the cache/UI with the fake result, then overwrite it with the real server response when it arrives.' },
    { q: 'Why is __typename required in optimisticResponse?', options: ['It is not required', 'Apollo needs it to normalize and identify the object in the cache', 'It sets the Content-Type header', 'It determines which resolver runs'], answer: 1, explanation: 'Apollo InMemoryCache normalizes objects by __typename + id. Without __typename, the optimistic entry cannot be matched and replaced by the real response.' },
    { q: 'Which strategy avoids an extra network round-trip after a mutation?', options: ['refetchQueries', 'optimisticResponse + update function', 'waitForAll', 'lazy queries'], answer: 1, explanation: 'refetchQueries fires an extra query. The update function directly modifies the cache with data already in the mutation response — no extra round-trip.' }
  ];

  qna: QnaItem[] = [
    { q: 'Should mutations be idempotent?', a: 'Good practice but not required by GraphQL spec. Idempotent mutations (like upsert) are safer for retry logic and network failures. Destructive or side-effectful mutations (send email, process payment) should be guarded with deduplication tokens.' },
    { q: 'Can I query and mutate in the same operation?', a: 'No. An operation is either query, mutation, or subscription. You cannot mix them. However, mutations can return rich data that you query — the selection set after a mutation field works just like a query.' },
    { q: 'How do I pass file uploads in GraphQL mutations?', a: 'The multipart request spec (graphql-multipart-request-spec) defines how files are sent alongside a mutation. Apollo Server supports it via graphql-upload. The schema uses a `Upload` scalar: `photo: Upload!`.' },
    { q: 'What is an "upsert" mutation?', a: 'An upsert creates the entity if it doesn\'t exist or updates it if it does — a portmanteau of "update" and "insert". Useful for idempotent write operations: `upsertUser(input: UpsertUserInput!): User!`.' },
    { q: 'How do I run mutations in sequence from the client?', a: 'Fire mutations one at a time: `await createPost(...)`, then `await publishPost(...)`. Apollo Client also supports mutation queuing. Never assume ordering inside a single operation for cross-mutation dependencies.' },
    { q: 'What is the Relay mutation convention?', a: 'Relay recommends each mutation returns a payload with the changed data and a `clientMutationId` echo. The GraphQL team has since moved toward simpler payload patterns without the clientMutationId.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'Mutations are serial write operations — use input types, return rich payloads with user errors, and update the client cache explicitly.',
    mustKnow: [
      'Mutations execute serially; queries execute in parallel',
      'Single `input: XxxInput!` argument is the community convention',
      'Return a payload object with entity + UserError[] for domain errors',
      'GraphQL errors vs UserErrors — system vs domain failure distinction',
      'refetchQueries (simple) vs update function (no extra round-trip)',
      '__typename required in optimisticResponse for cache normalization'
    ],
    interviewFocus: [
      'How do mutations differ from queries in execution?',
      'Explain the mutation payload pattern and why it\'s preferred',
      'What is the difference between GraphQL errors and user errors?'
    ]
  };
}
