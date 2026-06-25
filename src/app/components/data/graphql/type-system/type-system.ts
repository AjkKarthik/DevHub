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
  selector: 'app-gql-type-system',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './type-system.html',
  styleUrl: './type-system.scss'
})
export class GqlTypeSystem {
  quickRef: QuickRefItem[] = [
    { type: 'type', name: 'String', desc: 'UTF-8 character sequence' },
    { type: 'type', name: 'Int', desc: 'Signed 32-bit integer' },
    { type: 'type', name: 'Float', desc: '64-bit double-precision floating point' },
    { type: 'type', name: 'Boolean', desc: 'true or false' },
    { type: 'type', name: 'ID', desc: 'Unique identifier, serialized as String' },
    { type: 'type', name: '__Schema', desc: 'Introspection type — describes the schema itself' },
    { type: 'type', name: '__Type', desc: 'Describes any type in the schema' },
    { type: 'type', name: '__Field', desc: 'Describes a field on an object type' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Five Type Categories',
      points: [
        'GraphQL has five kinds of types: Scalar, Object, Interface, Union, and Enum. Input objects are a sixth kind used only for arguments.',
        'Leaf types (Scalar and Enum) produce the actual values in a JSON response. Every field chain must terminate at a leaf.',
        'Object, Interface, and Union types are composite — they contain fields that themselves must be selected with sub-selections.',
        'Wrapping types (NonNull and List) modify other types and are not standalone — they only appear as field type wrappers.'
      ]
    },
    {
      heading: 'Built-in Scalars',
      points: [
        'GraphQL ships with five built-in scalars: String, Int, Float, Boolean, and ID.',
        'ID is special — it\'s always serialized as a String, even if stored as an integer in the database.',
        'Scalars have no sub-selection: `{ user { id name } }` — `id` and `name` are scalars and cannot have `{ }` after them.',
        'Custom scalars extend the type system for domain values like Date, URL, Email, and JSON.'
      ]
    },
    {
      heading: 'Type Introspection',
      points: [
        'GraphQL schemas are self-describing. Every schema exposes __schema and __type introspection fields.',
        'Tools like GraphiQL use introspection to build autocompletion, documentation, and validation without a separate API description file.',
        'You can query `{ __schema { types { name kind } } }` to list all types in the schema.',
        'Introspection can be disabled in production for security — it prevents schema discovery by attackers.'
      ]
    },
    {
      heading: 'Abstract Types & resolveType',
      points: [
        'When a field returns an interface or union, GraphQL needs to know the concrete type of each resolved value.',
        '__resolveType is a function on the resolver map that receives the value and returns the type name as a string.',
        'Without __resolveType, GraphQL falls back to instanceof checks (only works with class instances, not plain objects).',
        'Apollo Server also supports isTypeOf on each type as an alternative to __resolveType on the abstract type.'
      ]
    },
    {
      heading: 'Type Modifiers — Wrapping & Unwrapping',
      points: [
        'Type modifiers (NonNull, List) wrap types. `[Post!]!` is NonNull(List(NonNull(Post))).',
        'Introspection returns types with ofType references you must follow until you reach a named type.',
        'Schemas can nest modifiers: `[[Int!]!]!` is a non-null list of non-null lists of non-null Ints.',
        'Type coercion: GraphQL coerces Int to Float where needed but never String to Int — arguments must match exactly.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Introspection',
      language: 'typescript',
      code: `# List all types
query {
  __schema {
    types {
      name
      kind
      description
    }
  }
}

# Inspect a specific type
query {
  __type(name: "User") {
    name
    kind
    fields {
      name
      type {
        name
        kind
        ofType {
          name
          kind
        }
      }
    }
  }
}

# Check if a field is non-null
# kind: "NON_NULL" wraps the actual type via ofType`
    },
    {
      label: 'resolveType',
      language: 'typescript',
      code: `import { makeExecutableSchema } from '@graphql-tools/schema';

const typeDefs = \`
  interface Node { id: ID! }
  type Post implements Node { id: ID!; title: String! }
  type User implements Node { id: ID!; name: String! }
  union SearchResult = Post | User
  type Query {
    node(id: ID!): Node
    search(q: String!): [SearchResult!]!
  }
\`;

const resolvers = {
  Node: {
    __resolveType(obj: any) {
      if (obj.title !== undefined) return 'Post';
      if (obj.name !== undefined) return 'User';
      return null;
    }
  },
  SearchResult: {
    __resolveType(obj: any) {
      return obj.title ? 'Post' : 'User';
    }
  },
  Query: {
    node: (_, { id }) => db.findById(id),
    search: (_, { q }) => db.search(q)
  }
};

export const schema = makeExecutableSchema({ typeDefs, resolvers });`
    },
    {
      label: 'Custom Scalar',
      language: 'typescript',
      code: `import { GraphQLScalarType, Kind } from 'graphql';

// Custom Date scalar
export const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO 8601 date-time string',
  // Output: JS Date → JSON string
  serialize(value: unknown) {
    if (value instanceof Date) return value.toISOString();
    throw new Error('DateTime must be a Date');
  },
  // Input variable: string → JS Date
  parseValue(value: unknown) {
    if (typeof value === 'string') return new Date(value);
    throw new Error('DateTime must be a string');
  },
  // Inline literal in query: AST node → JS Date
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) return new Date(ast.value);
    throw new Error('DateTime must be a string literal');
  }
});

// Wire into resolvers
const resolvers = {
  DateTime: DateTimeScalar,
  // ... other resolvers
};`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Missing __resolveType for interfaces/unions',
      wrong: `// No __resolveType — GraphQL cannot determine concrete type
const resolvers = { SearchResult: {} }`,
      right: `const resolvers = {
  SearchResult: {
    __resolveType: (obj) => obj.title ? 'Post' : 'User'
  }
}`,
      explanation: 'Without __resolveType, GraphQL throws "Abstract type must resolve to an Object type at runtime."'
    },
    {
      title: 'Treating ID as a number',
      wrong: `user(id: 42) { name }  # Int literal — type mismatch if schema expects ID`,
      right: `user(id: "42") { name }  # ID is always a String in GraphQL`,
      explanation: 'ID type is serialized as String. Passing Int literals may work in some clients but is semantically wrong and causes issues with string-keyed databases.'
    },
    {
      title: 'Selecting fields on leaf types',
      wrong: `{ user { name { length } } }  # name is String — cannot have sub-selection`,
      right: `{ user { name } }`,
      explanation: 'Scalar and Enum types are leaf types. They produce values directly and cannot have selection sets.'
    },
    {
      title: 'Disabling introspection in development',
      wrong: `// Disabling introspection everywhere breaks GraphiQL and tooling`,
      right: `// Only disable in production, keep enabled in dev
const server = new ApolloServer({
  introspection: process.env.NODE_ENV !== 'production'
})`,
      explanation: 'Introspection powers GraphiQL, codegen, and schema exploration. Only disable in production for security.'
    },
    {
      title: 'Using String for all IDs instead of ID scalar',
      wrong: `type User { id: String! }  # String — not semantically an ID`,
      right: `type User { id: ID! }  # ID — clients know this is an opaque identifier`,
      explanation: 'The ID scalar signals that this field is an opaque identifier. Apollo Client uses ID fields for cache normalization.'
    }
  ];

  challenge: Challenge = {
    title: 'Write an Introspection Query',
    language: 'typescript',
    description: 'Write a GraphQL introspection query that retrieves: (1) all type names and kinds, (2) all fields on the "Post" type including their types and whether they are non-null. Use ofType to unwrap wrapped types.',
    hints: [
      'Use __schema { types { name kind } } for all types',
      'Use __type(name: "Post") { fields { ... } } for field details',
      'Check field.type.kind === "NON_NULL" to detect non-null fields',
      'Use ofType to get the inner type name when kind is NON_NULL or LIST'
    ],
    starterCode: `# Introspection query — fill in the missing parts
query IntrospectSchema {
  __schema {
    types {
      # fields here
    }
  }
  __type(name: "Post") {
    fields {
      # fields here
    }
  }
}`,
    solution: `query IntrospectSchema {
  __schema {
    types {
      name
      kind
      description
    }
  }
  __type(name: "Post") {
    name
    fields {
      name
      description
      type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  }
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What are the five kinds of GraphQL types?', options: ['Object, Input, Enum, Array, Null', 'Scalar, Object, Interface, Union, Enum', 'String, Int, Float, Boolean, ID', 'Type, Input, Query, Mutation, Subscription'], answer: 1, explanation: 'The five named type kinds are Scalar, Object, Interface, Union, and Enum. NonNull and List are wrapping type modifiers, not named kinds.' },
    { q: 'What does the ID scalar serialize as?', options: ['Integer', 'Float', 'String', 'Boolean'], answer: 2, explanation: 'The ID scalar always serializes as a String in the JSON response, even if the underlying data is stored as a number.' },
    { q: 'What function must you implement to resolve interface/union fields?', options: ['__typeName', '__resolveType', '__resolveAbstract', 'isTypeOf'], answer: 1, explanation: '__resolveType on the abstract type tells GraphQL which concrete type a resolved value belongs to.' },
    { q: 'Which types cannot have a selection set in a query?', options: ['Object types', 'Interface types', 'Scalar and Enum types', 'Union types'], answer: 2, explanation: 'Scalar and Enum are leaf types — they produce terminal values and cannot have sub-selections.' },
    { q: 'How does GraphQL expose its own type system?', options: ['Via a separate REST endpoint', 'Via introspection fields __schema and __type', 'Via a JSON schema file', 'Via the OPTIONS HTTP method'], answer: 1, explanation: 'GraphQL schemas are self-describing via introspection. __schema and __type are built-in meta-fields available on every schema.' },
    { q: 'What is the correct type for `[Post!]!`?', options: ['Nullable list of non-null Posts', 'Non-null list of non-null Posts', 'Non-null list of nullable Posts', 'Nullable list of nullable Posts'], answer: 1, explanation: 'Inner `!` = Post items are non-null. Outer `!` = the list itself is non-null. Both must hold.' }
  ];

  qna: QnaItem[] = [
    { q: 'Why does GraphQL use an ID type instead of just String?', a: 'ID carries semantic meaning — it signals that this field is an opaque, stable identifier. Apollo Client and Relay use the ID type for cache normalization (identifying unique objects). Using String loses this semantic signal.' },
    { q: 'Can I add custom scalars without a library?', a: 'Yes. Implement a GraphQLScalarType with serialize, parseValue, and parseLiteral. However, graphql-scalars provides battle-tested implementations for Date, URL, Email, UUID, and more — prefer it over rolling your own.' },
    { q: 'What is the difference between kind and name in introspection?', a: 'kind is the category of type: SCALAR, OBJECT, INTERFACE, UNION, ENUM, INPUT_OBJECT, NON_NULL, LIST. name is the string name of a named type. NON_NULL and LIST types have a null name and use ofType to point to the wrapped type.' },
    { q: 'When should I disable introspection?', a: 'In production, where you don\'t want attackers to discover your full schema. Keep it enabled in development for GraphiQL and codegen. Some teams use allowlist-based access (authenticated introspection) as a middle ground.' },
    { q: 'What is the difference between isTypeOf and __resolveType?', a: '__resolveType is a single function on the abstract type (Interface/Union) that returns the type name for any value. isTypeOf is a per-type function that returns true if the value belongs to that type. __resolveType is preferred — it\'s one lookup instead of trying each type in sequence.' },
    { q: 'Can a type implement multiple interfaces?', a: 'Yes. `type Article implements Node & Timestamped` is valid. The type must include all fields declared by every implemented interface.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'GraphQL\'s type system is self-describing, strongly typed, and built around five named type kinds plus wrapping modifiers.',
    mustKnow: [
      'Five kinds: Scalar, Object, Interface, Union, Enum (+ Input for arguments)',
      'Leaf types (Scalar, Enum) cannot have selection sets',
      'ID always serializes as String regardless of underlying storage',
      '__resolveType is required for interface/union fields to resolve correctly',
      'Introspection exposes the entire schema via __schema and __type',
      'Custom scalars need serialize, parseValue, parseLiteral implementations'
    ],
    interviewFocus: [
      'Explain the role of __resolveType and when it\'s needed',
      'What\'s the purpose of the ID scalar vs String?',
      'How does introspection work and when would you disable it?'
    ]
  };
}
