import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-code-generation-near-operation-file',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './near-operation-file-preset.html',
  styleUrl: './near-operation-file-preset.scss'
})
export class NearOperationFilePresetSubtopic {
  topicLabel = 'Code Generation';
  topicRoute = '/graphql/code-generation';

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names near-operation-file in one QnA sentence with zero config',
      points: [
        'The main page\'s own QnA says: "It generates type files co-located with each operation file: <code>GetPost.graphql</code> to <code>GetPost.generated.ts</code>." -- accurate, but no codeTab anywhere on the page ever sets it up.',
        'Verified directly against GraphQL Code Generator\'s own near-operation-file-preset docs: the preset needs TWO separate outputs -- one plain <code>typescript</code>-plugin output that emits the base schema types, and a SECOND output using the preset itself for per-operation files.',
        'The preset\'s own <code>baseTypesPath</code> config points every generated per-operation file back at that shared base-types file, so <code>Post</code>, <code>User</code>, etc. are only ever defined once.'
      ]
    },
    {
      heading: 'A real gotcha the QnA\'s one sentence never mentions',
      points: [
        'A <code>documents</code> glob broad enough to include <code>.tsx</code> files (like <code>src/**/*.tsx</code>) will also re-scan the FILES near-operation-file just generated -- since <code>.generated.tsx</code> files still contain <code>gql</code>/<code>graphql()</code> calls.',
        'Verified against GraphQL Code Generator\'s own official docs: the fix is excluding the generated extension from the documents glob, e.g. <code>src/**/!(*.generated).{ts,tsx}</code>.',
        'Without the exclusion, codegen re-reads its own output as new source documents on every run -- at best wasted work, at worst duplicate-fragment-name errors if the generated file happens to re-declare something codegen already emitted.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'codegen.ts with near-operation-file',
      language: 'typescript',
      code: `import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/schema.json',
  // Exclude *.generated.tsx from the documents glob -- otherwise codegen
  // re-scans its own output as new source documents on every run.
  documents: 'src/**/!(*.generated).{ts,tsx}',
  generates: {
    // (1) Base schema types, generated once.
    'src/types.ts': {
      plugins: ['typescript']
    },
    // (2) One .generated.tsx file per operation, colocated next to it,
    //     importing shared types from src/types.ts via baseTypesPath.
    'src/': {
      preset: 'near-operation-file',
      presetConfig: {
        extension: '.generated.tsx',
        baseTypesPath: 'types.ts'
      },
      plugins: ['typescript-operations', 'typescript-react-apollo']
    }
  }
};

export default config;`
    },
    {
      label: 'What actually gets generated',
      language: 'typescript',
      code: `// src/components/PostPage.tsx  (your source file)
import { gql, useQuery } from '@apollo/client';
import { GetPostDocument } from './PostPage.generated';

const GET_POST = gql\`
  query GetPost($id: ID!) {
    post(id: $id) { id title }
  }
\`;

function PostPage({ id }: { id: string }) {
  const { data } = useQuery(GetPostDocument, { variables: { id } });
  return <h1>{data?.post?.title}</h1>;
}

// src/components/PostPage.generated.tsx  (codegen output, colocated
// right next to PostPage.tsx -- NOT in a shared __generated__/ folder)
//
// import * as Types from '../types';
// export type GetPostQuery = { post?: { id: string; title: string } };
// export type GetPostQueryVariables = Types.Exact<{ id: string }>;
// export const GetPostDocument = /* typed DocumentNode */;
// export function useGetPostQuery(baseOptions: ...) { ... }`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team deletes <code>src/types.ts</code> from git (it is listed in <code>.gitignore</code>) and someone runs <code>tsc</code> right after a fresh clone, before ever running codegen. What error would every <code>.generated.tsx</code> file across the project produce, and why?',
    hint: 'The theory above states every per-operation file imports shared schema types FROM the file <code>baseTypesPath</code> points at -- what happens to that import if the target file genuinely does not exist on disk yet?',
    solution: 'Every .generated.tsx file that has already been committed (or that still exists from a previous build) would fail with a TypeScript module-resolution error along the lines of "Cannot find module \'../types\' or its corresponding type declarations" -- because baseTypesPath: \'types.ts\' makes every near-operation-file output import shared schema types from that one file, and nothing else in the project regenerates it automatically. The fix is running the codegen command itself first (which regenerates src/types.ts from the schema, since it is one of the two configured outputs) before ever running tsc -- exactly the ordering the main page\'s own mistake block already teaches for the client-preset case, just applying identically here since near-operation-file has the same base-types dependency.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'near-operation-file is a completely separate tool from client-preset, requiring a different mental model to set up.',
      reality: 'Both are presets built on the same underlying <code>typescript</code> + <code>typescript-operations</code> plugin machinery -- the real difference is purely about FILE LAYOUT (one shared barrel folder vs. one file per operation, next to the operation itself), not the type-generation mechanism.'
    },
    {
      thought: 'Since the QnA describes near-operation-file as "good for large projects," a small project should default to client-preset without ever considering it.',
      reality: 'Project size is one factor, but the real deciding question is whether a team prefers navigating to one central <code>__generated__/</code> folder (client-preset) or having each operation\'s own generated types sit right next to it in the file tree (near-operation-file) -- a preference that can matter even on a small project, depending on how the team likes to browse code.'
    },
    {
      thought: 'The documents glob only needs to find real, hand-written .graphql/.tsx files -- it has no relationship to what codegen itself outputs.',
      reality: 'A broad enough documents glob will re-match codegen\'s OWN generated files on the next run, since they still contain gql/graphql() calls codegen\'s document scanner recognizes -- the exclusion pattern (<code>!(*.generated)</code>) exists specifically to stop this self-referential re-scan.'
    }
  ];

  prev: SubtopicLink | null = { label: 'Fragment Masking Blocks Direct Field Access', route: '/graphql/code-generation/fragment-masking-blocks-direct-access' };
  next: SubtopicLink | null = { label: 'Authenticating codegen Against a Protected Endpoint', route: '/graphql/code-generation/authenticated-introspection-endpoint' };
}
