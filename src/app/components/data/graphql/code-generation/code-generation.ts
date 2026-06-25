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
  selector: 'app-gql-code-generation',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './code-generation.html',
  styleUrl: './code-generation.scss'
})
export class GqlCodeGeneration {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: 'GraphQL Code Generator', desc: 'CLI tool that reads your schema + operations and generates typed code' },
    { type: 'keyword', name: 'codegen.ts', desc: 'Config file that defines schema source, document globs, and plugins' },
    { type: 'keyword', name: 'typescript plugin', desc: 'Generates TypeScript types for all schema types' },
    { type: 'keyword', name: 'typescript-operations', desc: 'Generates types for your query/mutation/subscription documents' },
    { type: 'keyword', name: 'typescript-react-apollo', desc: 'Generates typed useQuery/useMutation hooks for each operation' },
    { type: 'keyword', name: 'client-preset', desc: 'Modern all-in-one preset — typed DocumentNode + hooks + fragments' },
    { type: 'keyword', name: 'near-operation-file', desc: 'Preset that generates type files next to each .graphql document file' },
    { type: 'method', name: 'graphql-codegen --watch', desc: 'Watch mode — regenerates types on schema or operation file changes' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Code Generation?',
      points: [
        'GraphQL is strongly typed on the server but without codegen, clients use untyped query results.',
        'GraphQL Code Generator reads your SDL schema and operation documents (.graphql files) and outputs TypeScript types.',
        'Generated types catch field name typos, wrong argument types, and missing fields at compile time — not runtime.',
        'The client-preset also generates typed hooks per operation — `useGetPostQuery` instead of generic `useQuery<any>`.'
      ]
    },
    {
      heading: 'Setup & Configuration',
      points: [
        'Install: `npm i -D @graphql-codegen/cli @graphql-codegen/client-preset`.',
        'Run `npx graphql-code-generator init` to create a guided `codegen.ts` config file.',
        'The config specifies: schema source (URL or file), documents glob (*.graphql or *.tsx), outputs, and plugins.',
        'Add `"codegen": "graphql-codegen --config codegen.ts"` to package.json scripts.'
      ]
    },
    {
      heading: 'client-preset',
      points: [
        'The modern `client-preset` is the recommended starting point for Apollo Client + React.',
        'It generates: TypeScript types for all schema types, operation-specific result types, and typed DocumentNodes.',
        'Import from the generated barrel: `import { graphql } from "./__generated__/gql"` instead of gql tag from apollo.',
        'Fragments are typed separately: the generated `FragmentType` utility ensures you can only use fragments where intended.'
      ]
    },
    {
      heading: 'Server-Side Generation',
      points: [
        'For server resolvers, the `typescript-resolvers` plugin generates a typed resolver map.',
        'Generated types: `Resolvers` (the full resolver map type), `QueryResolvers`, `MutationResolvers`, individual field resolver types.',
        'Resolver types accept generic context type: `Resolvers<MyContext>` ensures your resolvers type the context argument.',
        'Mappers customize what type the parent argument has — map `Post` to your Prisma model type to avoid any-casting.'
      ]
    },
    {
      heading: 'Watch Mode & CI',
      points: [
        'Development: run `graphql-codegen --watch` to regenerate on every schema or operation file change.',
        'CI: run `graphql-codegen` as part of the build step before TypeScript compilation.',
        'Schema-first workflow: schema.graphql changes → codegen runs → TypeScript compiler catches resolver mismatches.',
        'Add generated files to .gitignore if they are rebuilt in CI, or commit them for offline development.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'codegen.ts Config',
      language: 'typescript',
      code: `import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:4000/graphql',  // or path to SDL file
  documents: ['src/**/*.tsx', 'src/**/*.graphql'],
  generates: {
    // Client-side types and typed hooks
    './src/__generated__/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'graphql'  // import { graphql } from "__generated__/gql"
      }
    },
    // Server-side typed resolver map
    './src/generated/resolvers.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        contextType: '../context#MyContext',  // import MyContext for resolver types
        mappers: {
          Post: '../models#PostModel',  // map Post type to your DB model
          User: '../models#UserModel'
        }
      }
    }
  }
};

export default config;`
    },
    {
      label: 'Client Usage',
      language: 'typescript',
      code: `// Import graphql() tag from generated barrel — NOT from @apollo/client
import { graphql } from '../__generated__/gql';
import { useQuery, useMutation } from '@apollo/client';

// Define operation with graphql() — fully typed
const GET_POST = graphql(\`
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      title
      body
      author {
        ...AuthorFields
      }
    }
  }
\`);

// Fragment definition — also typed
const AUTHOR_FIELDS = graphql(\`
  fragment AuthorFields on User {
    id
    name
    avatarUrl
  }
\`);

function PostPage({ id }: { id: string }) {
  // useQuery is fully typed — data.post.author.name has type string
  const { data, loading } = useQuery(GET_POST, { variables: { id } });

  if (loading) return null;

  // TypeScript knows the exact shape of data
  const post = data?.post;
  return <h1>{post?.title}</h1>;
}`
    },
    {
      label: 'Server Resolvers',
      language: 'typescript',
      code: `// Generated from schema — Resolvers<Context> type
import { Resolvers } from './generated/resolvers';
import { MyContext } from './context';

// Resolver map is fully typed against the schema
const resolvers: Resolvers<MyContext> = {
  Query: {
    post: async (_, { id }, { db }) => {
      // Return type is inferred from schema — PostModel (via mapper)
      return db.posts.findById(id);
    },
    posts: async (_, { limit }, { db }) => {
      return db.posts.findAll({ limit });
    }
  },
  Post: {
    // parent is typed as PostModel (from mapper)
    author: (post, _, { db }) => db.users.findById(post.authorId)
  },
  Mutation: {
    createPost: async (_, { input }, { db, user }) => {
      if (!user) throw new Error('Unauthenticated');
      return db.posts.create({ ...input, authorId: user.id });
    }
  }
};

export default resolvers;`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using gql from @apollo/client instead of generated graphql()',
      wrong: `import { gql } from '@apollo/client';
const GET_POST = gql\`query { post(id: "1") { title } }\`;  // untyped`,
      right: `import { graphql } from './__generated__/gql';
const GET_POST = graphql(\`query { post(id: "1") { title } }\`);  // typed`,
      explanation: 'The gql tag from @apollo/client is untyped. The generated graphql() tag returns a typed DocumentNode with result and variable types inferred from the schema.'
    },
    {
      title: 'Not running codegen after schema changes',
      wrong: `// Schema adds newField: String to Post
// TypeScript still uses old generated types — data.post.newField is a TS error`,
      right: `// Run codegen after every schema change
// npm run codegen  (or use --watch mode in development)`,
      explanation: 'Generated types go stale when the schema changes. Run codegen as part of your development workflow and before every CI build.'
    },
    {
      title: 'Committing generated files with sensitive schema URLs',
      wrong: `// codegen.ts has schema: 'https://internal-api.company.com/graphql'
// Also commits __generated__/ files with internal type names`,
      right: `// Use environment variable for schema URL
schema: process.env.GRAPHQL_SCHEMA_URL || 'schema.graphql'`,
      explanation: 'Hardcoded internal API URLs in codegen config or generated files can leak sensitive infrastructure details. Use environment variables or a committed SDL file.'
    },
    {
      title: 'Not using mappers for resolver parent types',
      wrong: `// Post resolvers receive any as parent — no type safety on post.authorId
Post: { author: (post) => db.users.findById(post.authorId) }`,
      right: `// codegen.ts: mappers: { Post: '../models#PostModel' }
// Post resolvers receive PostModel — post.authorId is typed`,
      explanation: 'Without mappers, generated resolver types use the GraphQL schema type for the parent, which may not match your DB model. Mappers map GraphQL types to your actual model types.'
    },
    {
      title: 'Ignoring codegen errors in CI',
      wrong: `"build": "tsc && vite build"  # codegen not in CI — generated types may be stale`,
      right: `"build": "graphql-codegen && tsc && vite build"  # codegen first, then compile`,
      explanation: 'Running TypeScript compilation with stale generated types passes silently. Run codegen before tsc in CI to catch schema drift.'
    }
  ];

  challenge: Challenge = {
    title: 'Set Up GraphQL Code Generator',
    language: 'typescript',
    description: 'Write a complete `codegen.ts` configuration that: (1) reads from a local schema file (schema.graphql), (2) scans all .tsx and .graphql files for operations, (3) generates typed client code in src/__generated__/ using the client preset with gqlTagName "graphql", (4) generates typed resolver map in src/generated/resolvers.ts with typescript + typescript-resolvers plugins and a context type from ../context#AppContext.',
    hints: [
      'Import CodegenConfig from @graphql-codegen/cli',
      'schema: path to local SDL file or URL',
      'documents: ["src/**/*.tsx", "src/**/*.graphql"]',
      'Client: preset: "client" with presetConfig',
      'Server: plugins array with typescript and typescript-resolvers'
    ],
    starterCode: `import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: /* TODO */,
  documents: /* TODO */,
  generates: {
    // TODO: client output
    // TODO: server resolvers output
  }
};

export default config;`,
    solution: `import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.graphql',
  documents: ['src/**/*.tsx', 'src/**/*.graphql'],
  generates: {
    './src/__generated__/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'graphql'
      }
    },
    './src/generated/resolvers.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        contextType: '../context#AppContext'
      }
    }
  }
};

export default config;`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does GraphQL Code Generator produce?', options: ['A GraphQL server', 'TypeScript types for schema types and operation results', 'A REST API wrapper', 'GraphQL schema from TypeScript'], answer: 1, explanation: 'GraphQL Code Generator reads your SDL schema and operation documents and outputs TypeScript types, typed hooks, and typed resolver maps.' },
    { q: 'What is the client-preset?', options: ['A set of Apollo Client plugins', 'An all-in-one codegen preset that generates typed DocumentNodes, result types, and hooks', 'A CSS preset for GraphQL UIs', 'A server-side preset'], answer: 1, explanation: 'client-preset is the modern recommended codegen preset for React + Apollo Client. It generates typed graphql() tags, operation types, and fragment utilities.' },
    { q: 'Why use the generated graphql() tag instead of gql from @apollo/client?', options: ['It is faster', 'It returns a typed DocumentNode with inferred result and variable types', 'It supports more query features', 'It reduces bundle size'], answer: 1, explanation: 'The generated graphql() tag returns a TypedDocumentNode — a DocumentNode with attached TypeScript generics for the result and variable types, enabling type-safe useQuery calls.' },
    { q: 'What are mappers in typescript-resolvers?', options: ['Database connection poolers', 'Type mappings from GraphQL types to your actual DB model types', 'Cache key functions', 'Schema stitching helpers'], answer: 1, explanation: 'Mappers tell codegen to use your DB model type (e.g., PrismaPost) as the parent type in resolvers instead of the generated GraphQL schema type, enabling type-safe resolver arguments.' },
    { q: 'When should you run graphql-codegen in CI?', options: ['Never — only run locally', 'Before TypeScript compilation', 'After deployment', 'Only on schema changes'], answer: 1, explanation: 'Run codegen before tsc in CI. This ensures generated types are up-to-date with the current schema before TypeScript compilation catches any resolver mismatches.' },
    { q: 'What does the --watch flag do?', options: ['Watches for syntax errors', 'Regenerates types on schema or operation file changes', 'Monitors server health', 'Watches the network tab'], answer: 1, explanation: 'graphql-codegen --watch starts a file watcher. When schema files or operation documents change, it automatically regenerates the TypeScript types.' }
  ];

  qna: QnaItem[] = [
    { q: 'Do I need to commit generated files?', a: 'It depends. If you run codegen in CI before tsc, generated files are always fresh and don\'t need committing. If contributors work offline or CI is slow, committing generated files provides a consistent baseline. The trade-off is merge conflicts on regeneration.' },
    { q: 'Can I use codegen with a remote schema?', a: 'Yes — set schema to the introspection URL: `schema: "https://api.example.com/graphql"`. You can also download the schema once and commit it as a .graphql or .json file for offline development and CI.' },
    { q: 'What is the near-operation-file preset?', a: 'It generates type files co-located with each operation file: `GetPost.graphql` → `GetPost.generated.ts`. Good for large projects where you want types next to their operations.' },
    { q: 'Can codegen generate resolvers for other frameworks (NestJS, TypeORM)?', a: 'Yes. There are plugins for NestJS (typescript-graphql-files-modules), TypeORM, Mikro-ORM, and others. The community maintains a large plugin ecosystem.' },
    { q: 'How do I handle schema introspection endpoint being auth-protected?', a: 'Pass headers to the schema config: `schema: { "https://api.example.com/graphql": { headers: { Authorization: "Bearer <token>" } } }`. Or download the schema via curl with auth and commit it as a file.' },
    { q: 'What is the difference between typescript and typescript-operations plugins?', a: 'typescript generates types for all SDL types (User, Post, etc.). typescript-operations generates types specifically for your query/mutation/subscription documents (GetPostQuery, CreatePostMutation, etc.). Use both together or use client-preset which includes them.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'GraphQL Code Generator turns your schema + operations into TypeScript types and hooks — end-to-end type safety without manual type writing.',
    mustKnow: [
      'codegen reads SDL schema + .graphql documents → emits TypeScript',
      'client-preset: typed graphql() tag + operation types + fragment utilities',
      'Use generated graphql() instead of gql from @apollo/client for type safety',
      'typescript-resolvers + mappers give type-safe resolver parent arguments',
      'Run codegen before tsc in CI to catch schema drift',
      '--watch mode regenerates on file changes during development'
    ],
    interviewFocus: [
      'What problem does GraphQL Code Generator solve?',
      'Explain the difference between typescript, typescript-operations, and client-preset plugins',
      'What are mappers in typescript-resolvers and why are they needed?'
    ]
  };
}
