import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-client-caching-embedded',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './embedded-vs-normalized-objects.html',
  styleUrl: './embedded-vs-normalized-objects.scss'
})
export class EmbeddedVsNormalizedObjectsSubtopic {
  topicLabel = 'Client-Side Caching';
  topicRoute = '/graphql/client-caching';

  theory: TheoryPoint[] = [
    {
      heading: 'The main page had this exactly backwards',
      points: [
        'The main page\'s original theory bullet said objects without a <code>__typename</code>/<code>id</code> "cannot be normalized and are stored BY REFERENCE under their parent object" — verified against Apollo\'s own documentation that this is the OPPOSITE of what actually happens.',
        'A <code>Reference</code> (the exact type the SAME page\'s own "Field Policies" codeTab imports: <code>import { InMemoryCache, Reference } from \'@apollo/client\'</code>) is Apollo\'s own term for a NORMALIZED entity — a pointer object shaped like <code>{ __ref: \'Type:id\' }</code> that stands in for the real cached data stored elsewhere.',
        'An object that CANNOT be normalized (no id, or an explicit <code>keyFields: false</code> policy) is stored the opposite way: EMBEDDED — copied inline, in full, directly inside its parent\'s own cache entry, with no separate <code>Type:id</code> lookup entry created for it at all.'
      ]
    },
    {
      heading: 'Why the distinction has a real, observable consequence',
      points: [
        'A NORMALIZED object shared by two different queries occupies exactly ONE cache entry — mutating it through either query updates both, because both queries hold the same Reference pointing at the same underlying data.',
        'An EMBEDDED object appearing in two different queries\' results is stored as two SEPARATE, independent copies — updating the copy fetched by one query has zero effect on the copy fetched by the other, since there is no shared entry linking them at all.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Normalized (by reference) vs embedded (inline)',
      language: 'typescript',
      code: `import { InMemoryCache } from '@apollo/client';

const cache = new InMemoryCache({
  typePolicies: {
    // Post HAS an id -- objects of this type get normalized, i.e.
    // stored under their own 'Post:<id>' entry and referenced from
    // wherever they appear, using Apollo's own Reference type.
    Post: { keyFields: ['id'] },

    // Metric has NO stable identifier that's useful across requests --
    // objects of this type are embedded (duplicated inline) wherever
    // they appear, never given their own top-level cache entry.
    Metric: { keyFields: false },
  },
});

// Conceptually, after a query returns { post: {...}, metrics: [{...}] }:
//
//   ROOT_QUERY.post   -> Reference { __ref: 'Post:42' }   -- normalized
//   'Post:42'          -> { __typename: 'Post', id: '42', title: '...' }
//
//   ROOT_QUERY.metrics -> [ { __typename: 'Metric', value: 12, ts: 1000 } ]
//                          -- embedded directly, no separate entry, no
//                          -- Reference pointer anywhere involved.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Two separate queries, <code>GetPostSummary</code> and <code>GetPostDetail</code>, both return the SAME underlying post: <code>{ __typename: \'Post\', id: \'42\', title: \'Hello\' }</code>. A mutation updates the post\'s title and writes the new value into the cache. If <code>Post</code> uses the default identity policy (normalized by <code>__typename</code>+<code>id</code>), do BOTH queries reflect the new title? What if <code>Post</code> instead used <code>keyFields: false</code>?',
    hint: 'A normalized object has exactly ONE cache entry that every query referencing it points at. An embedded (<code>keyFields: false</code>) object gets a SEPARATE, independent copy inside each query result that returned it.',
    solution: 'With the default identity policy (normalized), YES -- both queries update, because GetPostSummary and GetPostDetail both hold a Reference pointing at the SAME single \'Post:42\' cache entry; writing a new title into that one entry is visible through both references. With keyFields: false instead, NO -- each query\'s own result would have received a completely separate, embedded copy of the post object with no shared entry linking them, so updating one copy (via whichever query the mutation\'s update function targeted) would have zero effect on the other query\'s own independent copy. This is precisely why the main page\'s original "stored by reference" phrasing for the id-less case was backwards: normalization (by reference) is what PRODUCES this cross-query sync behavior, and an id-less/keyFields:false object explicitly opts OUT of it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An object without a usable id is still "referenced" somehow in the cache — it just does not get its own dedicated lookup entry.',
      reality: 'It is not referenced at all in Apollo\'s own sense of the term. It is copied inline (embedded) directly into whichever parent object\'s cache entry it appeared in — verified against Apollo\'s own docs, which describe this explicitly as storing the object "embedded within their parent object in the cache."'
    },
    {
      thought: 'The <code>Reference</code> type (imported and used in the main page\'s own Field Policies codeTab) is just Apollo\'s internal name for "any cached object."',
      reality: 'It specifically represents a NORMALIZED entity — a <code>{ __ref: \'Type:id\' }</code> pointer standing in for data stored under its own dedicated cache entry. An embedded (unnormalized) object is never wrapped in a <code>Reference</code> at all; it is nested directly, in full, wherever it appears.'
    }
  ];

  prev: SubtopicLink | null = { label: 'INVALIDATE Alone Doesn’t Force a Refetch', route: '/graphql/client-caching/invalidate-does-not-force-refetch' };
  next: SubtopicLink | null = { label: 'Persisting the Cache with apollo3-cache-persist', route: '/graphql/client-caching/persisting-cache-apollo3' };
}
