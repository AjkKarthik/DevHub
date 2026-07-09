import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-revalidatepath-is-cache-not-push-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './revalidatepath-is-cache-not-push.html',
  styleUrl: './revalidatepath-is-cache-not-push.scss',
})
export class RevalidatepathIsCacheNotPushSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA Answer Says "the Route Stays Cached Until the Next Request" — What Does That Actually Mean for Open Tabs?',
      points: [
        'The QnA section explains: "the route stays cached until the next request after the interval, or until explicitly invalidated — no background worker needed." The quiz answer for revalidatePath similarly says it "invalidates the cached data... Next.js will re-fetch and re-render on the next request."',
        'This subtopic makes the consequence explicit: revalidatePath is a SERVER-SIDE cache invalidation. It does not push any update to browser tabs that already have the OLD page rendered. A user sitting on <code>/posts</code> in one tab, while a Server Action in another tab calls <code>revalidatePath("/posts")</code>, will keep seeing the stale list until THEY cause a new request — a manual refresh, or a client-side navigation that re-requests that route.',
      ],
    },
    {
      heading: 'Why This Differs From What "Revalidate" Sounds Like It Should Do',
      points: [
        'The word "revalidate" can suggest an active push — like a WebSocket update nudging every open client. That is NOT what revalidatePath does. It marks the Next.js server-side cache entry for that path as stale, so the VERY NEXT time any request (from any client) asks for that path, the server re-runs the Server Component, re-fetches the data, and serves the fresh result instead of the cached one.',
        'An already-open tab holds an already-rendered page in memory — revalidatePath has no mechanism to reach into that tab and force a re-render. Getting fresh data into an already-open tab requires that tab to make a NEW request: the user navigating away and back, a router.refresh() call, a manual reload, or (for genuinely live updates) a separate mechanism entirely, like polling or a WebSocket.',
        'This is precisely why the main page recommends revalidatePath + redirect together after a mutation (see the Server Actions code tab) — the redirect forces the CURRENT tab (the one that just submitted the form) to make a fresh request to the now-invalidated path, which is what actually shows the mutation\'s result to that user. Other tabs remain stale until they separately re-request.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What revalidatePath actually invalidates',
      language: 'typescript',
      code: `// app/actions/post.ts
'use server';
import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  await db.post.create({ data: { title } });

  // This does ONE thing: mark the Next.js server cache entry
  // for "/posts" as stale. It does NOT:
  //  - push a WebSocket message to any browser
  //  - re-render any already-open tab
  //  - notify any client that anything changed
  revalidatePath('/posts');
}`,
    },
    {
      label: 'The submitting tab sees fresh data — because of redirect, not revalidatePath',
      language: 'typescript',
      code: `'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPost(formData: FormData) {
  await db.post.create({ data: { title: formData.get('title') as string } });

  revalidatePath('/posts');   // marks the server cache stale
  redirect('/posts');         // forces THIS tab to make a NEW request
  // -- the redirect is what actually shows fresh data to the user
  // who just submitted the form. revalidatePath alone, without a
  // redirect or a client-side re-navigation, would leave the
  // submitting tab exactly where it was -- on the OLD page it was
  // already viewing before the form submit, now just with a
  // (now-stale, but not yet re-fetched) cache marked dirty
  // for whenever the NEXT request happens to come in.
}`,
    },
    {
      label: 'A second, already-open tab: still stale after revalidatePath',
      language: 'typescript',
      code: `// Tab A: submits the form above. createPost() runs, revalidatePath
// fires, redirect sends Tab A to a FRESH /posts (new request -> new data).

// Tab B: had /posts open in the browser BEFORE Tab A's submission,
// and never navigated away. Tab B's DOM still shows the OLD list --
// revalidatePath('/posts') from Tab A's Server Action has no channel
// to reach Tab B's already-rendered page.

// Tab B only sees the new post once IT makes a new request:
//   - the user manually reloads Tab B, OR
//   - the user navigates away and back within Tab B, OR
//   - code in Tab B calls the Next.js router's refresh:
'use client';
import { useRouter } from 'next/navigation';

function RefreshButton() {
  const router = useRouter();
  // router.refresh() re-fetches the current route's Server
  // Component data WITHOUT a full page reload -- this is the
  // client-side mechanism to actually observe the now-invalidated
  // cache, since revalidatePath itself never pushed anything to Tab B.
  return <button onClick={() => router.refresh()}>Refresh</button>;
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two browser tabs both have <code>/dashboard</code> open. In Tab A, a Server Action runs <code>revalidatePath(\'/dashboard\')</code> after a mutation, with no redirect. Does Tab B\'s already-rendered dashboard update automatically? What about Tab A\'s?',
    hint: 'revalidatePath only affects the SERVER-side cache entry — it never reaches into a browser tab\'s already-rendered DOM. Ask: does either tab make a NEW request after the Server Action runs?',
    solution: `Neither tab updates automatically -- and this is the key insight
that goes beyond what the main page states.

Tab B: definitely stays stale. It had no involvement in the mutation
at all, and revalidatePath has no mechanism to reach an already-open
tab. It will only see fresh data the next time IT makes a new
request (reload, navigation, or a manual router.refresh() call).

Tab A: ALSO stays stale, somewhat counterintuitively, because the
scenario explicitly says "with no redirect." revalidatePath marks
the server cache dirty, but Tab A's own page was already rendered
BEFORE the Server Action ran -- without a redirect (or a client-side
router.refresh()) forcing Tab A to make a fresh request, Tab A's DOM
is left exactly where it was, same as Tab B.

The only reason the main page's own createPost example "just works"
from the user's perspective is that it pairs revalidatePath with
redirect('/posts') -- the redirect is what forces a NEW request in
the tab that just submitted. Drop the redirect, and even the
submitting tab needs a separate refresh to see its own mutation.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'revalidatePath actively pushes updated data to every browser tab currently viewing that path, similar to how a WebSocket subscription would.',
      reality: 'revalidatePath only invalidates a SERVER-side cache entry — it has no mechanism to reach any already-open browser tab. Fresh data only appears in a tab when that specific tab makes a new request.',
    },
    {
      thought: 'since the main page\'s createPost example "just works" and shows the new post immediately, revalidatePath alone must be responsible for that.',
      reality: 'the redirect(\'/posts\') call sitting right next to revalidatePath is what actually causes the submitting tab to see fresh data — it forces that tab to issue a brand-new request to the now-invalidated path.',
    },
    {
      thought: 'a second tab that already has the affected page open will pick up the change the next time React re-renders that component tree, without needing a full new request.',
      reality: 'Server Component data is fetched once per request on the server — there is no client-side re-render mechanism that would pick up server-side data changes without an actual new request (reload, navigation, or router.refresh()) being made.',
    },
  ];
}
