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
  selector: 'app-gql-schema-definition-language',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './schema-definition-language.html',
  styleUrl: './schema-definition-language.scss'
})
export class GqlSchemaDefinitionLanguage {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: 'type', desc: 'Define an object type with named fields' },
    { type: 'keyword', name: 'scalar', desc: 'Define a primitive leaf value (String, Int, Float, Boolean, ID, custom)' },
    { type: 'keyword', name: 'enum', desc: 'Enumeration type with a fixed set of values' },
    { type: 'keyword', name: 'input', desc: 'Input object type — only used as mutation/query arguments' },
    { type: 'keyword', name: 'interface', desc: 'Abstract type that other types can implement' },
    { type: 'keyword', name: 'union', desc: 'A type that can be one of several object types' },
    { type: 'keyword', name: '!', desc: 'Non-null modifier — field or argument can never return null' },
    { type: 'keyword', name: '[Type]', desc: 'List type — returns an array of the wrapped type' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is the SDL?',
      points: [
        'The Schema Definition Language (SDL) is GraphQL\'s human-readable syntax for describing your API\'s type system.',
        'Every GraphQL server is backed by a schema written in SDL — it acts as a contract between client and server.',
        'SDL defines types (Object, Scalar, Enum, Input, Interface, Union) and the special root types Query, Mutation, Subscription.',
        'Tooling such as GraphQL Code Generator, GraphiQL, and IDEs parse the SDL to provide autocompletion and type checking.'
      ]
    },
    {
      heading: 'Object Types & Fields',
      points: [
        'An object type groups related fields. Each field has a name, a return type, and optional arguments.',
        'Types can reference each other, forming a graph — a Post can have an author of type User.',
        'Field arguments are declared inline: `title(format: String): String`. Arguments are always optional unless marked non-null.',
        'The root types (Query, Mutation, Subscription) are special object types that serve as entry points.'
      ]
    },
    {
      heading: 'Nullability & Lists',
      points: [
        'By default every field is nullable — the server can return null. The `!` modifier makes it non-null.',
        '`[Post]` is a nullable list of nullable Posts. `[Post!]!` is a non-null list of non-null Posts.',
        'Non-null on an argument means the argument is required. `userId: ID!` must be provided by the caller.',
        'Over-using `!` is a footgun — if a field errors and it\'s non-null, the error bubbles up and nullifies the parent.'
      ]
    },
    {
      heading: 'Interfaces & Unions',
      points: [
        'An interface defines a set of fields that implementing types must include. Useful for polymorphic queries.',
        'A union is like an interface but with no shared fields — purely a "one of these types" marker.',
        'Clients must use inline fragments (`... on Dog { breed }`) to access type-specific fields.',
        '__typename is a built-in meta-field that returns the runtime type name — always available without declaration.'
      ]
    },
    {
      heading: 'Input Types & Custom Scalars',
      points: [
        'Input types look like object types but use the `input` keyword and can only appear as arguments.',
        'You cannot use a regular `type` as an argument — input types enforce a clear separation between output and input shapes.',
        'Custom scalars (e.g., `scalar Date`) add semantic meaning. You must implement serialization/parsing on the server.',
        'Popular custom scalar libraries (graphql-scalars) provide ready-made Date, URL, Email, JSON, UUID scalars.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Types',
      language: 'typescript',
      code: `# Object type
type Post {
  id: ID!
  title: String!
  body: String
  published: Boolean!
  author: User!
  tags: [String!]!
}

type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

# Enum
enum Role {
  ADMIN
  EDITOR
  VIEWER
}

# Custom scalar
scalar DateTime

# Root type
type Query {
  post(id: ID!): Post
  posts(first: Int, after: String): [Post!]!
  me: User
}`
    },
    {
      label: 'Input & Interface',
      language: 'typescript',
      code: `# Interface
interface Node {
  id: ID!
}

interface Timestamped {
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Article implements Node & Timestamped {
  id: ID!
  title: String!
  body: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# Input type
input CreatePostInput {
  title: String!
  body: String
  tags: [String!]
  published: Boolean
}

type Mutation {
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: CreatePostInput!): Post
  deletePost(id: ID!): Boolean!
}`
    },
    {
      label: 'Union & Fragment',
      language: 'typescript',
      code: `# Union type — no shared fields required
union SearchResult = Post | User | Tag

type Tag {
  id: ID!
  name: String!
}

type Query {
  search(query: String!): [SearchResult!]!
}

# Client query using inline fragments
query Search($q: String!) {
  search(query: $q) {
    __typename
    ... on Post {
      id
      title
    }
    ... on User {
      id
      name
    }
    ... on Tag {
      id
      name
    }
  }
}`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using type instead of input for arguments',
      wrong: `type CreatePostArgs { title: String! }
mutation { createPost(args: CreatePostArgs!) }`,
      right: `input CreatePostInput { title: String! }
mutation { createPost(input: CreatePostInput!) }`,
      explanation: 'Object types cannot be used as argument types. Input types are a separate concept for this purpose.'
    },
    {
      title: 'Making everything non-null',
      wrong: `type User { address: Address! }  # errors bubble and null the parent`,
      right: `type User { address: Address }   # nullable — errors stay contained`,
      explanation: 'If a non-null field throws, the error propagates to the nearest nullable parent, potentially hiding other valid data.'
    },
    {
      title: 'Returning input types from resolvers',
      wrong: `input UserInput { name: String! }
type Query { user: UserInput }`,
      right: `type User { name: String! }
type Query { user: User }`,
      explanation: 'Input types are write-only shapes. They cannot appear as field return types.'
    },
    {
      title: 'Forgetting __typename in union queries',
      wrong: `query { search { ... on Post { title } } }  # crashes if result is a User`,
      right: `query { search { __typename ... on Post { title } ... on User { name } } }`,
      explanation: 'Without __typename and exhaustive fragments, clients cannot discriminate union members at runtime.'
    },
    {
      title: 'Naming input types without the Input suffix',
      wrong: `input Post { title: String! }  # conflicts with output type Post`,
      right: `input PostInput { title: String! }`,
      explanation: 'Naming convention `XxxInput` prevents namespace collisions and clarifies purpose in codegen output.'
    }
  ];

  challenge: Challenge = {
    title: 'Design a Blog Schema',
    language: 'typescript',
    description: 'Write a GraphQL SDL schema for a blog with Users, Posts, and Comments. Include an enum for PostStatus, a custom DateTime scalar, and input types for creating posts and comments. Add Query and Mutation root types.',
    hints: [
      'PostStatus enum: DRAFT, PUBLISHED, ARCHIVED',
      'Post should have an author (User) and comments ([Comment!]!)',
      'Mutation createPost should accept an input type, not individual args',
      'Use ID! for all id fields and DateTime! for timestamps'
    ],
    starterCode: `# Write your GraphQL SDL schema here

scalar DateTime

enum PostStatus {
  # Add values
}

type User {
  # Add fields
}

# Continue the schema...`,
    solution: `scalar DateTime

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Comment {
  id: ID!
  body: String!
  author: User!
  createdAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  body: String!
  status: PostStatus!
  author: User!
  comments: [Comment!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

input CreatePostInput {
  title: String!
  body: String!
  status: PostStatus
}

input CreateCommentInput {
  postId: ID!
  body: String!
}

type Query {
  post(id: ID!): Post
  posts(status: PostStatus): [Post!]!
  me: User
}

type Mutation {
  createPost(input: CreatePostInput!): Post!
  createComment(input: CreateCommentInput!): Comment!
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What keyword defines a type that can only be used as an argument?', options: ['type', 'input', 'interface', 'scalar'], answer: 1, explanation: '`input` types are write-only shapes intended for arguments and variables.' },
    { q: 'What does `[Post!]!` mean?', options: ['nullable list of non-null Posts', 'non-null list of nullable Posts', 'non-null list of non-null Posts', 'nullable list of nullable Posts'], answer: 2, explanation: 'The inner `!` means list items cannot be null; the outer `!` means the list itself cannot be null.' },
    { q: 'Which built-in meta-field returns the runtime type name of an object?', options: ['__type', '__typename', '__schema', 'typeName'], answer: 1, explanation: '`__typename` is available on every object type without explicit declaration in the schema.' },
    { q: 'What is the difference between interface and union?', options: ['No difference', 'Interfaces require shared fields; unions do not', 'Unions require shared fields; interfaces do not', 'Interfaces are for scalars'], answer: 1, explanation: 'Interfaces define a common set of fields all implementors must have. Unions are purely "one of these types" with no shared structure.' },
    { q: 'If a non-null field\'s resolver throws an error, what happens?', options: ['The field returns null', 'The error is silently swallowed', 'The error propagates to the nearest nullable parent', 'The entire query fails'], answer: 2, explanation: 'Non-null fields cannot return null, so errors bubble up to the nearest nullable ancestor, potentially nulling a larger object.' },
    { q: 'What suffix convention is recommended for input types?', options: ['Type', 'Arg', 'Input', 'Payload'], answer: 2, explanation: 'The `XxxInput` suffix is the GraphQL community convention for argument input types and avoids naming conflicts with output types.' }
  ];

  qna: QnaItem[] = [
    { q: 'Can a field return both an interface type and a concrete type?', a: 'No — a field returns exactly one type in the schema. If you want polymorphism, declare the field to return the interface or union type; resolvers then return concrete objects and GraphQL resolves __resolveType.' },
    { q: 'When should I use a union vs an interface?', a: 'Use an interface when the returned types share meaningful common fields (id, name). Use a union when types are unrelated but can appear in the same list or field — like a search result that can be a Post, User, or Tag.' },
    { q: 'How do I add documentation to my schema?', a: 'SDL supports block string descriptions: place triple-quoted strings directly above any type, field, or argument. These appear in GraphiQL and are accessible via introspection.' },
    { q: 'What is schema-first vs code-first GraphQL?', a: 'Schema-first: you write the SDL manually and implement resolvers to match. Code-first: you define types in code (TypeGraphQL, Nexus) and the SDL is generated. Schema-first is explicit and easier to review; code-first reduces duplication when the schema is large.' },
    { q: 'Can I nest input types?', a: 'Yes. An input type can reference other input types as field types. You cannot reference regular object types inside input types — only scalars, enums, and other input types.' },
    { q: 'How do custom scalars work?', a: 'You declare `scalar MyScalar` in SDL, then implement three functions on the server: `serialize` (output), `parseValue` (variables), `parseLiteral` (inline values). The graphql-scalars library provides battle-tested implementations for common types.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'SDL is the contract language for your GraphQL API — mastering types, nullability, and modifiers is foundational.',
    mustKnow: [
      'type, scalar, enum, input, interface, union keywords',
      '! = non-null; [T!]! = non-null list of non-null items',
      'input types are write-only; cannot return them from fields',
      'interfaces require shared fields; unions do not',
      '__typename is a built-in meta-field on every object',
      'Custom scalars need serialize/parseValue/parseLiteral implementations'
    ],
    interviewFocus: [
      'Explain the difference between interface and union with an example',
      'What happens when a non-null field throws? Why does nullability design matter?',
      'Why does GraphQL use input types instead of regular types for arguments?'
    ]
  };
}
