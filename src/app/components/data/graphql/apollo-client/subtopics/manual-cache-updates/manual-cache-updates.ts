import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-apollo-client-manual-cache',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './manual-cache-updates.html',
  styleUrl: './manual-cache-updates.scss'
})
export class ManualCacheUpdatesSubtopic {
  topicLabel = 'Apollo Client';
  topicRoute = '/graphql/apollo-client';

  theory: TheoryPoint[] = [
    {
      heading: 'The main page distinguishes refetchQueries from update, but never shows update as code',
      points: [
        'The main page\'s own QnA is precise about the tradeoff: "<code>refetchQueries</code> fires additional network requests after the mutation. <code>update</code> modifies the cache directly with data already returned in the mutation response — no extra round-trip." — but no codeTab on the page ever writes a real <code>update</code> function.',
        'The main page\'s own "Setup" and "useQuery & useMutation" codeTabs both use <code>refetchQueries: [\'GetPosts\']</code> instead — the more expensive option the QnA itself describes as the alternative.',
        '<code>cache.modify()</code> is the standard tool for an <code>update</code> function that needs to append a newly-created item to an EXISTING cached list, without re-fetching that list from the server.'
      ]
    },
    {
      heading: 'What actually makes cache.modify() work correctly',
      points: [
        'The mutation\'s own GraphQL selection set must return enough fields to normalize the new object in the cache — at minimum <code>__typename</code> and <code>id</code> (Apollo\'s default cache-key fields). Without both, <code>toReference()</code> cannot build a valid reference to the new object.',
        '<code>cache.modify()</code>\'s <code>fields</code> option lets you rewrite a specific cached field\'s value in place — for a list field like <code>posts</code>, the modifier function receives the EXISTING cached array and returns the new array, which is where the new item\'s reference gets appended.',
        'This entirely avoids re-running the <code>GetPosts</code> query against the server — the local cache is updated directly from data the mutation response already contained.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Mutation with an update function',
      language: 'typescript',
      code: `import { useMutation, gql } from '@apollo/client';

const CREATE_POST = gql\`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      __typename
      id
      title
      author { name }
    }
  }
\`;

function usePostCreation() {
  const [createPost] = useMutation(CREATE_POST, {
    update(cache, { data }) {
      const newPost = data?.createPost;
      if (!newPost) return;

      cache.modify({
        fields: {
          posts(existingPostRefs = [], { toReference }) {
            const newPostRef = toReference(newPost);
            // Avoid appending a duplicate if this ref is already cached.
            if (existingPostRefs.some((ref: any) => ref.__ref === newPostRef?.__ref)) {
              return existingPostRefs;
            }
            return [...existingPostRefs, newPostRef];
          },
        },
      });
    },
  });

  return createPost;
}

// Compare to the main page's own approach in "Setup" / "useQuery & useMutation":
//   useMutation(CREATE_POST, { refetchQueries: ['GetPosts'] })
// That re-runs the ENTIRE GetPosts query against the server. The update()
// version above achieves the same visible result -- the new post appears in
// the list -- using only data the mutation response already returned.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team writes the <code>update</code> function exactly as shown, but their mutation\'s selection set is <code>createPost(input: $input) { title }</code> — it never requests <code>__typename</code> or <code>id</code>. What happens when <code>toReference(newPost)</code> is called inside <code>cache.modify()</code>?',
    hint: 'Apollo\'s normalized cache identifies every object by a cache key built from <code>__typename</code> and (by default) <code>id</code> — can <code>toReference()</code> build a reference to an object it cannot compute a cache key for?',
    solution: 'toReference(newPost) returns undefined, because Apollo cannot compute a cache key for an object missing __typename and id -- both are required (by default) to normalize an object in the cache at all. The result: existingPostRefs.some(...) never matches (comparing against undefined), and [...existingPostRefs, newPostRef] would push undefined into the list -- the UI would then either crash trying to read fields off that undefined entry, or Apollo would warn and skip it depending on version. The fix is simple: the mutation\'s own selection set must include __typename and id (or whatever fields the type\'s keyFields policy specifies) so the newly created object can actually be normalized and referenced.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The <code>update</code> function and <code>refetchQueries</code> are two ways of achieving the exact same result, so either is fine to reach for by default.',
      reality: '<code>refetchQueries</code> triggers a genuine extra network round-trip; <code>update</code> uses only data the mutation response already returned. They produce the same visible UI result, but with a real performance difference — <code>update</code> is the better default whenever the mutation response already contains enough data.'
    },
    {
      thought: '<code>cache.modify()</code> can update any cached field as long as you know its name, regardless of what the mutation itself returned.',
      reality: 'For a LIST field specifically, appending a new item still requires that item to already be normalizable in the cache — which requires the mutation\'s own selection set to have returned <code>__typename</code> and <code>id</code> for it. <code>cache.modify()</code> updates cached REFERENCES; it does not fetch or fabricate data the mutation never returned.'
    },
    {
      thought: 'Since the main page\'s own examples all use <code>refetchQueries</code>, that must be the recommended default approach for updating a list after a mutation.',
      reality: 'The main page\'s own QnA already states the opposite preference in prose ("update... no extra round-trip") — its codeTabs simply never got around to demonstrating that recommended approach as working code, which is exactly the gap this subtopic closes.'
    }
  ];

  prev: SubtopicLink | null = { label: 'Reactive Variables for Global Client-Side State', route: '/graphql/apollo-client/reactive-variables-global-state' };
  next: SubtopicLink | null = null;
}
