import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-preventing-overfetch-with-info-fieldnodes',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './preventing-overfetch-with-info-fieldnodes.html',
  styleUrl: './preventing-overfetch-with-info-fieldnodes.scss',
})
export class PreventingOverfetchWithInfoFieldnodesSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The mistake block warns against parsing info — but never shows the legitimate reason to',
      points: [
        'The main page\'s QnA on the <code>info</code> argument names exactly this use case: "checking which sub-fields are requested (to avoid fetching unused data)." The mistakes block, meanwhile, warns that parsing <code>info.fieldNodes</code> "on every request is expensive." Neither one ever shows the actual code — the page gestures at both the benefit and the cost without demonstrating either.',
        'The mechanism, confirmed via direct execution against graphql-js: <code>info.fieldNodes[0].selectionSet.selections</code> is the array of AST nodes for whatever the client selected directly on THIS field\'s own type. Filtering for <code>selection.kind === \'Field\'</code> and reading <code>selection.name.value</code> gives you the requested field names — for a query selecting just <code>{ id title }</code> on a Post, that returns exactly <code>[\'id\', \'title\']</code>, verified byte-for-byte.',
        'The practical payoff: a resolver backed by a wide table or an expensive-to-compute column can build a targeted <code>SELECT</code> list (or ORM field-selection call) instead of always fetching every column — real savings when some columns are large (a full article body) or costly (a computed aggregate) and frequently NOT requested.',
      ],
    },
    {
      heading: 'A naive version silently misses fields selected through a fragment',
      points: [
        'Confirmed via a direct, deliberate test: filtering only for <code>kind === \'Field\'</code> and ignoring everything else works for a query written as literal fields, but breaks the moment a client uses a fragment spread instead — <code>{ id ...PostFields }</code> with <code>fragment PostFields on Post { title body }</code> produces a <code>selections</code> array of <code>[\'Field\', \'FragmentSpread\']</code>, and the naive filter returns only <code>[\'id\']</code>, silently dropping <code>title</code> and <code>body</code> from the "requested fields" list entirely.',
        'This is not a rare edge case — fragments are the default way most real GraphQL clients (Apollo Client, Relay) structure queries, specifically so a component can declare its own data needs independently of the top-level query. A field-selection optimization that only handles literal fields will under-fetch for a large share of real traffic.',
        'The fix: also handle <code>FragmentSpread</code> nodes by looking the fragment definition up on <code>info.fragments</code> (keyed by fragment name) and reading ITS <code>selectionSet.selections</code> too — confirmed via direct execution that this correctly recovers the full <code>[\'id\', \'title\', \'body\']</code> list. A production implementation would also need to handle inline fragments (<code>... on Post { ... }</code>) and recurse for nested field selections; libraries like <code>graphql-parse-resolve-info</code> (already named in the page\'s own mistake block) exist specifically to do this fully and correctly.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Naive: always fetch every column',
      language: 'typescript',
      code: `Query: {
  post: async (_, { id }, { db }) => {
    // Always fetches EVERY column, including a large "body" text
    // column and an expensive computed "viewCount" aggregate --
    // regardless of whether the client asked for either.
    return db.posts.findById(id);  // SELECT * FROM posts WHERE id = ?
  }
}`,
    },
    {
      label: 'Verified: targeted SELECT from requested fields',
      language: 'typescript',
      code: `function getRequestedFields(info): string[] {
  const fieldNames = new Set<string>();
  const selections = info.fieldNodes[0].selectionSet.selections;

  for (const sel of selections) {
    if (sel.kind === 'Field') {
      fieldNames.add(sel.name.value);
    } else if (sel.kind === 'FragmentSpread') {
      // Fragments are a SEPARATE node kind -- look the definition
      // up on info.fragments (keyed by fragment name) and read
      // its own selections too, or you silently miss these fields.
      const frag = info.fragments[sel.name.value];
      for (const fs of frag.selectionSet.selections) {
        if (fs.kind === 'Field') fieldNames.add(fs.name.value);
      }
    }
  }
  return [...fieldNames];
}

Query: {
  post: async (_, { id }, { db }, info) => {
    const requested = getRequestedFields(info);
    // requested = ['id', 'title'] for { id title }
    // requested = ['id', 'title', 'body'] for { id ...PostFields }
    return db.posts.findById(id, { select: requested });
  }
}`,
    },
    {
      label: 'Verified output (real graphql-js execution)',
      language: 'typescript',
      code: `// query { post(id: "1") { id ...PostFields } }
// fragment PostFields on Post { title body }

// Naive (Field-only filter):
//   naive extraction: [ 'id' ]                    <- WRONG, missed title/body
//   raw selection kinds: [ 'Field', 'FragmentSpread' ]

// Fixed (also resolves FragmentSpread via info.fragments):
//   fixed extraction: [ 'id', 'title', 'body' ]    <- correct`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A resolver uses the naive <code>getRequestedFields</code> (Field-kind only, no FragmentSpread handling) to build a targeted SQL <code>SELECT</code> list for a <code>Post</code>. A client queries <code>{ post(id: "1") { id ...PostFields } }</code> where <code>PostFields</code> selects <code>title</code> and <code>body</code>. What does the client actually receive back for <code>title</code> and <code>body</code>?',
    hint: 'The naive filter never sees the fragment\'s own selections at all — what does the SQL query end up selecting, and what does the resolver return for the columns it never fetched?',
    solution: `Both title and body come back as null (or undefined, coerced to null for nullable fields) -- not an error, just silently missing data. The naive getRequestedFields returns only ['id'], so the SQL SELECT list built from it is just id. The database row still HAS a title and body, but the resolver's own returned object never includes them, since it only selected what the naive function told it to.

This is a genuine correctness bug, not just a performance issue -- a client using perfectly valid GraphQL syntax (a fragment) silently gets back less data than it asked for, with no error or warning anywhere in the response. The fix is exactly the FragmentSpread-handling version: resolving info.fragments[fragmentName] to recover the fields the fragment itself selects.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Reading info.fieldNodes to see which fields were requested only matters for performance, not correctness."',
      reality: 'It can be a real correctness bug. Confirmed via direct execution: a naive Field-only extraction silently under-selects when the client uses a fragment spread, and a resolver that trusts that list to build a database SELECT returns null for fields the client legitimately asked for.',
    },
    {
      thought: '"info.fieldNodes[0].selectionSet.selections only ever contains Field nodes — that is what \'selections\' means."',
      reality: 'Confirmed via direct execution: the selections array can also contain FragmentSpread nodes (<code>...FragmentName</code>) and InlineFragment nodes (<code>... on Type { }</code>), neither of which carries a <code>.name.value</code> the same way a Field node does — code that assumes every selection is a Field will silently skip both.',
    },
    {
      thought: '"Since parsing info is expensive, as the main page\'s own mistake block warns, it should never be done in a resolver."',
      reality: 'The mistake block warns against doing it UNMEMOIZED, on every request, in a hot path — not against doing it at all. For a resolver backed by a wide or expensive table, the savings from a targeted SELECT can easily outweigh the AST-walking cost; the main page\'s own "right" column even names a library (graphql-parse-resolve-info) built specifically to do this efficiently.',
    },
  ];

  topicLabel = 'Resolvers';
  topicRoute = '/graphql/resolvers';
  prev: SubtopicLink | null = {
    label: 'graphql-middleware and graphql-shield Are Effectively Unmaintained',
    route: '/graphql/resolvers/graphql-middleware-shield-unmaintained',
  };
  next: SubtopicLink | null = {
    label: 'info.path Matches the Response’s Own errors[].path Array Exactly',
    route: '/graphql/resolvers/info-path-matches-response-errors-path',
  };
}
