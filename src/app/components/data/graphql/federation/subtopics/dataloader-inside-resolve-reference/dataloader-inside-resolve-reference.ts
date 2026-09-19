import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-federation-dataloader-resolve-reference',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './dataloader-inside-resolve-reference.html',
  styleUrl: './dataloader-inside-resolve-reference.scss'
})
export class DataloaderInsideResolveReferenceSubtopic {
  topicLabel = 'Schema Stitching & Federation';
  topicRoute = '/graphql/federation';

  theory: TheoryPoint[] = [
    {
      heading: 'Two different levels of batching',
      points: [
        'Verified against Apollo\'s own N+1 handling guide: the Router extracts every reference to one entity type in an operation and fetches them in a batch through a single <code>Query._entities</code> call to the owning subgraph -- one network round trip, not one per reference.',
        'That is Router-level query-plan batching. It says nothing about what the SUBGRAPH does with the N representations it receives: the list returned by <code>_entities</code> is resolved element by element, so <code>__resolveReference</code> still runs once per representation.',
        'The original bullet said the Router "calls it with multiple references at once for efficiency," which blurs these two levels together -- the efficiency is real at the network layer only.'
      ]
    },
    {
      heading: 'Where the N+1 hides, and what DataLoader batches',
      points: [
        'If each <code>__resolveReference</code> call does its own database lookup, one <code>_entities</code> call carrying 50 User representations still causes 50 database queries -- a data-source-level N+1 even though the GraphQL-level call was already batched.',
        'DataLoader inside <code>__resolveReference</code> collects the lookups made during one tick and issues ONE batched query for all of them, and de-duplicates repeated keys within the batch.',
        '<code>_entities</code> results must come back in the same order as the input representations, so the batch function must return results keyed back to the requested ids, not in whatever order the database returned rows.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Naive: one _entities call, N database calls',
      language: 'typescript',
      code: `// The Router sends ONE query to this subgraph:
//   query { _entities(representations: [
//     { __typename: "User", id: "1" }, { __typename: "User", id: "2" },
//     { __typename: "User", id: "3" }, { __typename: "User", id: "1" }
//   ]) { ... on User { id name } } }
//
// graphql-js resolves the returned LIST element by element, so
// __resolveReference below runs 4 times -- once per representation.
const resolvers = {
  User: {
    __resolveReference: async ({ id }: { id: string }, { db }: Context) => {
      return db.users.findById(id); // 1 database call PER representation
    },
  },
};

// Simulated result (verified by direct execution):
//   NAIVE: db calls = 4
// -- one network call from the Router, still 4 database round trips.`
    },
    {
      label: 'DataLoader-batched __resolveReference',
      language: 'typescript',
      code: `import DataLoader from 'dataloader';

// One loader per request, created in the context factory.
function createUserLoader(db: Db) {
  return new DataLoader<string, User>(async (ids) => {
    const rows = await db.users.findByIds([...ids]); // ONE query
    const byId = new Map(rows.map((u) => [u.id, u]));
    // Results must line up with the requested ids, in order.
    return ids.map((id) => byId.get(id) as User);
  });
}

const resolvers = {
  User: {
    __resolveReference: ({ id }: { id: string }, { loaders }: Context) => {
      return loaders.user.load(id); // queued, not executed yet
    },
  },
};

// Same 4 representations as before, including the repeated id "1":
//   BATCHED: batch function invocations = 1
//   underlying findById calls = 3   (id "1" de-duplicated)
// Results still come back in the original order for all 4 entries.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s Router metrics show exactly one fetch to the Users subgraph for an operation that references 50 users, and they conclude there is no N+1 problem in that subgraph. Is that conclusion justified?',
    hint: 'The single fetch is the Router-to-subgraph network call. What does the subgraph do with the 50 representations inside it?',
    solution: 'No. One fetch only proves the Router batched at the network level. Inside that one _entities call, __resolveReference still runs once per representation, and if each run queries the database on its own, the subgraph makes 50 queries. The team must check the subgraph\'s own database query count. Fix: route __resolveReference through a per-request DataLoader so all 50 lookups collapse into one batched query, with results returned in the same order as the input representations.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Because the Router batches references into one <code>_entities</code> call, a subgraph cannot have an N+1 problem on entity resolution.',
      reality: 'The Router removes the network-level N+1 only. Inside the subgraph, each representation is still resolved separately, so a per-reference database lookup reproduces the N+1 at the data-source level.'
    },
    {
      thought: '<code>__resolveReference</code> receives an array of all the references at once, so it can just run one query for the array.',
      reality: 'It is called once per representation, with a single reference object. Batching the underlying lookups is exactly the job DataLoader does for you inside it.'
    },
    {
      thought: 'A DataLoader batch function may return rows in whatever order the database produced them.',
      reality: 'Results must match the order of the requested keys, and the <code>_entities</code> response must preserve the order of the input representations. Map rows back by id before returning.'
    }
  ];

  prev: SubtopicLink | null = { label: 'A Missing @link Silently Falls Back to v1', route: '/graphql/federation/missing-link-falls-back-to-v1' };
}
