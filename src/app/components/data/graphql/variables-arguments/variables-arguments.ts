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
  selector: 'app-gql-variables-arguments',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './variables-arguments.html',
  styleUrl: './variables-arguments.scss'
})
export class GqlVariablesArguments {
  quickRef: QuickRefItem[] = [
    { type: 'syntax', name: '$varName: Type', desc: 'Declare a variable in the operation signature' },
    { type: 'syntax', name: '$varName: Type = default', desc: 'Variable with a default value' },
    { type: 'syntax', name: 'field(arg: $var)', desc: 'Pass a variable as an argument value' },
    { type: 'syntax', name: 'field(arg: "literal")', desc: 'Pass an inline literal argument' },
    { type: 'keyword', name: 'variables', desc: 'JSON object sent alongside the query with variable values' },
    { type: 'syntax', name: 'arg: { nested: value }', desc: 'Inline input object literal as argument' },
    { type: 'syntax', name: 'arg: [val1, val2]', desc: 'Inline list literal as argument' },
    { type: 'syntax', name: 'operationName', desc: 'HTTP field specifying which operation to run when doc has multiple' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Arguments vs Variables',
      points: [
        'Arguments are values passed directly to fields: `user(id: "42") { name }`. They can be literals or variables.',
        'Variables are named placeholders declared in the operation signature and passed as a separate JSON map.',
        'Using variables instead of literal interpolation prevents injection, enables query caching, and improves readability.',
        'Every variable used in a query must be declared in the operation signature with its type.'
      ]
    },
    {
      heading: 'Variable Types & Defaults',
      points: [
        'Variable types follow the same syntax as SDL field types: `$id: ID!`, `$limit: Int`, `$tags: [String!]`.',
        'Non-null variables (`$id: ID!`) must always be provided. Null values for non-null variables cause a validation error before execution.',
        'Default values: `$limit: Int = 10`. If the client omits $limit, the default is used. Non-null variables can still have defaults.',
        'Variable types must match the argument type in the schema exactly. Mismatches are caught at validation time.'
      ]
    },
    {
      heading: 'Input Object Arguments',
      points: [
        'Input types can be passed as arguments: `createPost(input: $postInput)` where `$postInput: CreatePostInput!`.',
        'Inline input objects are also valid: `createPost(input: { title: "Hello", published: true })`.',
        'Mixing variables and inline literals is common: `posts(filter: $filter, limit: 10)` — some from variables, some literal.',
        'Input object fields follow the same non-null rules as query variables.'
      ]
    },
    {
      heading: 'Coercion & Validation',
      points: [
        'GraphQL coerces compatible types: Int to Float if the schema expects Float. No coercion for String→Int.',
        'Enum values in arguments are unquoted identifiers: `status: PUBLISHED` (not `"PUBLISHED"`).',
        'Variables go through the same coercion and validation as inline literals.',
        'Validation happens before execution — invalid argument types, missing required fields, or unknown fields all fail at the validation stage.'
      ]
    },
    {
      heading: 'HTTP Transport',
      points: [
        'GraphQL is transport-agnostic but most implementations use HTTP POST with a JSON body.',
        'The JSON body has three optional fields: `query` (string), `variables` (object), and `operationName` (string).',
        'GET requests can be used for queries: `?query=...&variables=...` as URL-encoded params — useful for CDN caching.',
        'Persisted queries send only a hash; the server looks up the full query — reduces bandwidth and improves caching.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Variables',
      language: 'typescript',
      code: `# Declare variables in operation signature
query GetUserPosts($userId: ID!, $limit: Int = 10, $status: PostStatus) {
  user(id: $userId) {
    name
    posts(limit: $limit, status: $status) {
      id
      title
      status
    }
  }
}

# Variables JSON (sent in HTTP body):
# {
#   "userId": "user-123",
#   "limit": 5,
#   "status": "PUBLISHED"
# }`
    },
    {
      label: 'Input Objects',
      language: 'typescript',
      code: `# Variable is an input type
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    status
  }
}

# Variables:
# {
#   "input": {
#     "title": "GraphQL Deep Dive",
#     "body": "Content here...",
#     "status": "DRAFT",
#     "tags": ["graphql", "api"]
#   }
# }

# Inline input object (no variable needed for simple cases)
mutation {
  createPost(input: { title: "Quick Post", published: true }) {
    id
  }
}`
    },
    {
      label: 'HTTP Request',
      language: 'typescript',
      code: `// Standard POST request
const response = await fetch('/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: \`
      query GetUser($id: ID!) {
        user(id: $id) { name email }
      }
    \`,
    variables: { id: 'user-123' },
    operationName: 'GetUser'  // required when doc has multiple ops
  })
});
const { data, errors } = await response.json();

// GET request — good for CDN caching
const params = new URLSearchParams({
  query: '{ posts { title } }',
  variables: JSON.stringify({ limit: 5 })
});
const res = await fetch(\`/graphql?\${params}\`);`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Quoting enum values in variables',
      wrong: `# Variables JSON: { "status": "PUBLISHED" }
# But in inline literal — wrong:
posts(status: "PUBLISHED")`,
      right: `# Inline literals: unquoted identifier
posts(status: PUBLISHED)
# Variables JSON is always a string: { "status": "PUBLISHED" }`,
      explanation: 'Enum values in query literals are unquoted identifiers. In variables JSON they are strings. Do not quote them in the query document.'
    },
    {
      title: 'Mismatching variable type with argument type',
      wrong: `query($id: String!) { user(id: $id) { name } }  # schema expects ID!`,
      right: `query($id: ID!) { user(id: $id) { name } }`,
      explanation: 'Variable types must exactly match the argument type in the schema. String and ID are different types — validation rejects the mismatch.'
    },
    {
      title: 'Using non-null variable without providing it',
      wrong: `query GetPost($id: ID!) { post(id: $id) { title } }
// Then calling with: client.query({ query }) — no variables`,
      right: `// Always provide required variables
client.query({ query, variables: { id: postId } })`,
      explanation: 'Omitting a non-null variable causes a validation error before the query executes. The error is clear but the fix requires providing the variable.'
    },
    {
      title: 'Interpolating user input into the query string',
      wrong: `const q = \`{ post(id: "\${userInput}") { title } }\``,
      right: `const q = gql\`query($id: ID!) { post(id: $id) { title } }\`;
client.query({ query: q, variables: { id: userInput } })`,
      explanation: 'Interpolation enables injection attacks and breaks query caching. Always use variables for dynamic values.'
    },
    {
      title: 'Missing operationName with multiple operations',
      wrong: `// Document has GetUser and GetPosts but no operationName sent`,
      right: `fetch('/graphql', {
  body: JSON.stringify({ query, variables, operationName: 'GetUser' })
})`,
      explanation: 'When a document contains multiple named operations, operationName is required. Omitting it causes an "Must provide operation name" error.'
    }
  ];

  challenge: Challenge = {
    title: 'Filter Posts with Complex Variables',
    language: 'typescript',
    description: 'Write a query `FilterPosts` that accepts: $filter (PostFilterInput — an input type with optional title: String and status: PostStatus), $pagination (PaginationInput with page: Int and limit: Int, both with defaults), and $sortBy: String = "createdAt". Return id, title, status, and author name.',
    hints: [
      'Declare all three variables in the operation signature',
      'PostFilterInput and PaginationInput are input types — use them as variable types',
      'Use $sortBy: String = "createdAt" for the default',
      'Pass variables directly to field arguments'
    ],
    starterCode: `input PostFilterInput {
  title: String
  status: PostStatus
}

input PaginationInput {
  page: Int = 1
  limit: Int = 10
}

# Write the query below
query FilterPosts(# variables) {
  # fields
}`,
    solution: `# Schema (for reference — write this query below)
# input PostFilterInput { title: String; status: PostStatus }
# input PaginationInput { page: Int = 1; limit: Int = 10 }

query FilterPosts(
  $filter: PostFilterInput
  $pagination: PaginationInput
  $sortBy: String = "createdAt"
) {
  posts(
    filter: $filter
    pagination: $pagination
    sortBy: $sortBy
  ) {
    id
    title
    status
    author {
      name
    }
  }
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'How are variable values sent to a GraphQL server?', options: ['Embedded in the query string', 'As a separate JSON variables object in the request body', 'As HTTP headers', 'As URL path parameters'], answer: 1, explanation: 'Variables are sent as a separate JSON object alongside the query string — never interpolated into the query.' },
    { q: 'What is the correct syntax for an inline enum argument?', options: ['"PUBLISHED"', "'PUBLISHED'", 'PUBLISHED', '{ value: "PUBLISHED" }'], answer: 2, explanation: 'Enum values in GraphQL query literals are unquoted identifiers. In variables JSON they are regular strings.' },
    { q: 'What happens when a non-null variable is omitted?', options: ['The field returns null', 'The default is used', 'A validation error is thrown before execution', 'The query runs with undefined'], answer: 2, explanation: 'Variables marked non-null must be provided. Omitting them causes validation failure — the query never reaches resolvers.' },
    { q: 'When is operationName required in an HTTP request?', options: ['Always', 'Never', 'When the document contains multiple named operations', 'Only for mutations'], answer: 2, explanation: 'When the document has multiple operations, operationName tells the server which to execute. With a single operation it is optional.' },
    { q: 'Which HTTP method supports CDN caching for GraphQL queries?', options: ['POST', 'PUT', 'GET', 'PATCH'], answer: 2, explanation: 'GET requests with query and variables as URL parameters can be cached by CDNs. POST requests are never cached.' },
    { q: 'Can a variable with a default be non-null?', options: ['No, non-null variables cannot have defaults', 'Yes, if omitted the default is used; if explicitly null a validation error occurs', 'Yes, and null is always allowed', 'Only with the @optional directive'], answer: 1, explanation: 'Non-null variables can have defaults. If omitted, the default is used. If explicitly set to null, validation still rejects it.' }
  ];

  qna: QnaItem[] = [
    { q: 'Why does GraphQL use a separate variables JSON rather than embedding values in the query?', a: 'Security (prevents injection), caching (query string stays constant — only variables change), and developer ergonomics (no string escaping needed for complex input objects).' },
    { q: 'Can I pass a variable to a directive argument?', a: 'Yes. `@skip(if: $skip)` and `@include(if: $include)` both accept variable references. The variable must be declared in the operation signature.' },
    { q: 'How do persisted queries work with variables?', a: 'The client registers queries by hash. Subsequent requests send only the hash + variables. The server looks up the full query. Variables are still sent normally — only the query string is compressed to a hash.' },
    { q: 'Can I send multiple operations in one HTTP request?', a: 'GraphQL batching (supported by Apollo) sends an array of request objects: `[{ query, variables }, { query, variables }]`. The server returns an array of results. This is optional and requires server support.' },
    { q: 'What is coercion in GraphQL arguments?', a: 'Coercion converts a compatible input type to the expected type. Int is coerced to Float if the schema expects Float. GraphQL does not coerce String to Int or Boolean to String — those are type errors.' },
    { q: 'What is the difference between arguments and fields?', a: 'Fields are what you select in the response. Arguments are key-value pairs passed to a field (or directive) to modify how it resolves — like function parameters. Every field can accept zero or more arguments defined in the schema.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'Variables decouple dynamic values from the query string — declared in the signature, passed as JSON, validated before execution.',
    mustKnow: [
      'Variables declared in operation signature with type: `$id: ID!`',
      'Values sent as separate JSON — never interpolated into query strings',
      'Non-null variables must be provided; defaults apply when omitted',
      'Variable types must match argument types exactly',
      'Enum literals in queries are unquoted; in JSON they are strings',
      'operationName is required when document has multiple operations'
    ],
    interviewFocus: [
      'Why use variables instead of string interpolation? What problems does it prevent?',
      'How does HTTP transport work for GraphQL — POST vs GET?',
      'What is coercion and when does it apply?'
    ]
  };
}
