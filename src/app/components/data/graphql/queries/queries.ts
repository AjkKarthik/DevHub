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
  selector: 'app-gql-queries',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './queries.html',
  styleUrl: './queries.scss'
})
export class GqlQueries {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: 'query', desc: 'Read operation — fetch data without side effects' },
    { type: 'keyword', name: 'fragment', desc: 'Reusable selection set defined once, spread anywhere' },
    { type: 'syntax', name: '...FragName', desc: 'Spread a named fragment into a selection set' },
    { type: 'syntax', name: '... on Type', desc: 'Inline fragment — applies fields conditionally for a type' },
    { type: 'keyword', name: '@skip(if:)', desc: 'Omit a field when the argument evaluates to true' },
    { type: 'keyword', name: '@include(if:)', desc: 'Include a field only when the argument evaluates to true' },
    { type: 'syntax', name: 'alias: field', desc: 'Rename a field in the response — useful for same field with diff args' },
    { type: 'syntax', name: 'field(arg: $var)', desc: 'Pass a variable as an argument — declared in the operation header' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Query Anatomy',
      points: [
        'A GraphQL query is a document containing one or more operations. Each operation has an optional name, variables, and a selection set.',
        'The root of a query is the Query type — every top-level field you select maps to a root resolver.',
        'Field selection is hierarchical: select exactly the fields you need, including nested objects.',
        'Anonymous queries (`{ user { name } }`) are valid for quick exploration but named queries are best practice for production.'
      ]
    },
    {
      heading: 'Variables',
      points: [
        'Variables parameterize queries. Declare them in the operation: `query GetUser($id: ID!) { user(id: $id) { name } }`.',
        'Variable values are sent as a separate JSON object alongside the query string — never interpolated into the query.',
        'Variables support default values: `$limit: Int = 10`. The default is used when no value is passed.',
        'Variable types in the declaration must match the argument type in the schema. Mismatches are caught before execution.'
      ]
    },
    {
      heading: 'Fragments',
      points: [
        'Named fragments define a selection set once and reuse it across multiple queries: `fragment UserFields on User { id name email }`.',
        'Inline fragments (`... on Post { title }`) apply fields only when an object is of a specific type — essential for unions/interfaces.',
        'Fragments can reference other fragments but cannot be circular.',
        'Fragment names must be unique per document. Identical names in the same document cause a validation error.'
      ]
    },
    {
      heading: 'Aliases',
      points: [
        'Aliases rename a field in the response: `authorPosts: posts(authorId: "1") { title }` returns `authorPosts` in the JSON.',
        'Aliases are required when querying the same field twice with different arguments.',
        'Aliases do not affect the resolver — the resolver still receives the original field name and arguments.',
        'Aliases make responses easier to consume when field names would conflict or are ambiguous.'
      ]
    },
    {
      heading: 'Directives',
      points: [
        '@skip(if: Boolean) and @include(if: Boolean) control whether a field is included at query time.',
        'Directives take effect on the client side — the server only receives the final included/excluded selection.',
        'You can use variables in directive arguments: `@skip(if: $skipDetails)` for dynamic queries.',
        'Custom directives can be defined in the schema for server-side logic (auth, caching, transformation).'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Query',
      language: 'typescript',
      code: `# Simple anonymous query
{ user(id: "1") { name email } }

# Named query with variable
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    posts {
      id
      title
      publishedAt
    }
  }
}

# Query with default variable
query GetPosts($limit: Int = 10, $offset: Int = 0) {
  posts(limit: $limit, offset: $offset) {
    id
    title
    author { name }
  }
}`
    },
    {
      label: 'Fragments & Aliases',
      language: 'typescript',
      code: `# Named fragment
fragment UserSummary on User {
  id
  name
  avatarUrl
}

# Reuse fragment in multiple queries
query GetPosts {
  posts {
    title
    author { ...UserSummary }
    likedBy { ...UserSummary }
  }
}

# Aliases — same field with different args
query ComparePosts {
  featured: posts(category: "featured", limit: 3) {
    id title
  }
  recent: posts(sortBy: "createdAt", limit: 5) {
    id title createdAt
  }
}

# Inline fragment for interface/union
query SearchAll($q: String!) {
  search(query: $q) {
    __typename
    ... on Post { title author { name } }
    ... on User { name email }
  }
}`
    },
    {
      label: 'Directives',
      language: 'typescript',
      code: `# @include — field included when true
query GetUser($id: ID!, $showDetails: Boolean!) {
  user(id: $id) {
    id
    name
    # Only fetch email when showDetails is true
    email @include(if: $showDetails)
    bio @include(if: $showDetails)
  }
}

# @skip — field skipped when true
query GetPosts($skipBody: Boolean!) {
  posts {
    title
    body @skip(if: $skipBody)
    author { name }
  }
}

# Variables sent alongside the query:
# { "showDetails": true, "skipBody": false }`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'String interpolation instead of variables',
      wrong: `const id = '42';
const query = \`{ user(id: "\${id}") { name } }\`;`,
      right: `const query = gql\`query GetUser($id: ID!) { user(id: $id) { name } }\`;
client.query({ query, variables: { id } });`,
      explanation: 'Interpolating values into query strings risks injection and prevents query caching. Always use variables.'
    },
    {
      title: 'Over-fetching with wildcard fields',
      wrong: `{ post { ...AllPostFields } }  # fetches every field including expensive relations`,
      right: `{ post { id title } }  # fetch only what the component needs`,
      explanation: 'GraphQL\'s advantage is precise field selection. Over-fetching via large fragments defeats this and slows performance.'
    },
    {
      title: 'Forgetting __typename in union queries',
      wrong: `{ search { ... on Post { title } } }  # client can\'t discriminate type`,
      right: `{ search { __typename ... on Post { title } ... on User { name } } }`,
      explanation: 'Without __typename, clients cannot determine which union member was returned — required for conditional rendering.'
    },
    {
      title: 'Circular fragment references',
      wrong: `fragment A on Post { related { ...B } }
fragment B on Post { related { ...A } }`,
      right: `fragment PostPreview on Post { id title }  # flat, no cycles`,
      explanation: 'Circular fragment references cause a validation error. Fragments must form a directed acyclic graph.'
    },
    {
      title: 'Using @skip and @include on the same field',
      wrong: `name @skip(if: $s) @include(if: $i)  # confusing — which wins?`,
      right: `name @skip(if: $skipName)  # use one directive per field`,
      explanation: '@skip and @include evaluate independently. Using both on one field creates confusing logic — pick one.'
    }
  ];

  challenge: Challenge = {
    title: 'Build a Parameterized Blog Query',
    language: 'typescript',
    description: 'Write a named GraphQL query `GetBlogPage` that accepts $authorId (ID!), $limit (Int, default 10), and $showBody (Boolean!). Fetch posts filtered by author, each with id, title, and body (only when showBody is true). Use a named fragment `AuthorInfo` for the author\'s id, name, and avatarUrl.',
    hints: [
      'Declare variables in the operation signature with types',
      'Use fragment AuthorInfo on User { ... }',
      'Use @include(if: $showBody) on the body field',
      'Default values go in the variable declaration: $limit: Int = 10'
    ],
    starterCode: `fragment AuthorInfo on User {
  # Add fields
}

query GetBlogPage(# variables) {
  posts(# args) {
    # fields
  }
}`,
    solution: `fragment AuthorInfo on User {
  id
  name
  avatarUrl
}

query GetBlogPage($authorId: ID!, $limit: Int = 10, $showBody: Boolean!) {
  posts(authorId: $authorId, limit: $limit) {
    id
    title
    body @include(if: $showBody)
    author { ...AuthorInfo }
    createdAt
  }
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the purpose of GraphQL variables?', options: ['To name the operation', 'To pass dynamic values safely without string interpolation', 'To alias fields in the response', 'To skip optional fields'], answer: 1, explanation: 'Variables parameterize queries — values are sent as separate JSON, never embedded in the query string. This prevents injection and enables caching.' },
    { q: 'When must you use aliases?', options: ['Always', 'When querying the same field with different arguments', 'When using fragments', 'When the field is nullable'], answer: 1, explanation: 'Aliases are required when the same field appears twice with different arguments in the same selection set, to avoid key collisions in the response.' },
    { q: 'What does @skip(if: true) do?', options: ['Includes the field', 'Excludes the field', 'Makes the field nullable', 'Causes a validation error'], answer: 1, explanation: '@skip(if: true) excludes the field from the response. @skip(if: false) includes it.' },
    { q: 'What is a named fragment?', options: ['A query with a name', 'A reusable selection set defined with the fragment keyword', 'An inline type condition', 'A field alias'], answer: 1, explanation: 'A named fragment (`fragment UserFields on User { ... }`) defines a reusable selection set that can be spread into any query with `...UserFields`.' },
    { q: 'Can you use a variable as a directive argument?', options: ['No, directives only accept literals', 'Yes — e.g., @skip(if: $skip)', 'Only with @include', 'Only on root fields'], answer: 1, explanation: 'Directives fully support variable references. `@skip(if: $skipField)` is valid and commonly used for dynamic queries.' },
    { q: 'What happens when an anonymous query and a named query exist in the same document?', options: ['Anonymous query always runs', 'Named query always runs', 'You must specify which operation to execute', 'Both run in parallel'], answer: 2, explanation: 'When a document contains multiple operations, the client must specify which one to execute via operationName. Anonymous operations are only allowed when the document has exactly one operation.' }
  ];

  qna: QnaItem[] = [
    { q: 'Can a query document contain multiple operations?', a: 'Yes. A document can contain multiple named operations. When sending the request, you specify the operationName to execute. Anonymous operations are only allowed when the document has exactly one operation.' },
    { q: 'How does fragment spreading affect the wire size?', a: 'Fragment definitions are included in the query string sent to the server, increasing its size. Fragments are a DX tool — they don\'t reduce wire size. For that, use persisted queries, which replace the query string with a short hash.' },
    { q: 'What is the difference between @skip and @include?', a: '@skip(if: true) excludes a field; @include(if: true) includes a field. They are inverses. Using both on the same field is valid but confusing — the field is included only when skip=false AND include=true.' },
    { q: 'Can field arguments accept multiple values?', a: 'Yes — use list input: `posts(tags: ["graphql", "api"])`. The schema must declare the argument as a list type: `tags: [String!]`.' },
    { q: 'What is query batching?', a: 'Some clients (Apollo) support sending multiple queries in one HTTP request as a JSON array. The server processes each and returns an array of responses. Useful for reducing round-trips but adds server complexity.' },
    { q: 'How do I query the same field with two different argument sets?', a: 'Use aliases: `featured: posts(category: "featured") { ... } recent: posts(sortBy: "date") { ... }`. Aliases rename the field in the response, preventing collisions.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'GraphQL queries are declarative, typed, and parameterized — variables, fragments, and aliases give full control over shape and reuse.',
    mustKnow: [
      'Variables keep queries injection-safe and cacheable',
      'Fragments enable DRY selection sets — spread with `...FragName`',
      'Aliases required when using same field with different arguments',
      '@skip(if:) and @include(if:) drive conditional field selection',
      '__typename is essential for union/interface discrimination',
      'Inline fragments (`... on Type`) are for type-specific fields'
    ],
    interviewFocus: [
      'Why use variables instead of string interpolation?',
      'Explain fragments and when you would use inline vs named fragments',
      'When are aliases required in a GraphQL query?'
    ]
  };
}
