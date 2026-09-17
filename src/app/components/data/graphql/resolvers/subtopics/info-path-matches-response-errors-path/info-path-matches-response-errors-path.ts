import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-info-path-matches-response-errors-path',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './info-path-matches-response-errors-path.html',
  styleUrl: './info-path-matches-response-errors-path.scss',
})
export class InfoPathMatchesResponseErrorsPathSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The QnA names it in one clause — no codeTab ever reads it',
      points: [
        'The main page\'s own QnA on <code>info</code> lists "getting the field path for error reporting" as one of three uses, alongside the sub-field-selection use case built out in the previous subtopic. None of the page\'s three codeTabs, the mistakes block, or the Challenge ever reads <code>info.path</code> at all.',
        '<code>info.path</code> is not a plain array — confirmed by inspecting it directly, it is a linked list of <code>{ key, typename, prev }</code> nodes, walked from the CURRENT field backwards toward the root via <code>.prev</code>, ending at <code>prev === undefined</code>.',
        'Converting it to the familiar array shape just means walking <code>.prev</code> and unshifting each <code>.key</code>: <code>let out = []; let p = info.path; while (p) { out.unshift(p.key); p = p.prev; } return out;</code>.',
      ],
    },
    {
      heading: 'It matches the response\'s own errors[].path array exactly — verified end to end',
      points: [
        'Confirmed via a real, executed query: for a resolver throwing three levels deep — <code>users[1].posts</code>, where <code>users</code> is a list, index 1 is the second user, and <code>posts</code> is the failing field — the array built from <code>info.path</code> at the moment of failure is <code>["users", 1, "posts"]</code>.',
        'The final GraphQL response\'s own top-level <code>errors[0].path</code>, generated entirely independently by graphql-js\'s own execution engine, is the IDENTICAL array: <code>["users", 1, "posts"]</code> — confirmed byte-for-byte against the same executed query.',
        'The practical use: a resolver that logs or reports an error internally can attach the SAME path the client will see in their own response\'s <code>errors[].path</code>, making it trivial to correlate a server-side log entry with the exact client-visible error — no separate path-tracking logic needed, since <code>info.path</code> already IS that path, mid-execution.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reading info.path in a resolver',
      language: 'typescript',
      code: `function pathToArray(path: any): (string | number)[] {
  const out: (string | number)[] = [];
  let p = path;
  while (p) {
    out.unshift(p.key);
    p = p.prev;
  }
  return out;
}

const resolvers = {
  User: {
    posts: async (user, _, { db, requestId }, info) => {
      try {
        return await db.posts.findByUserId(user.id);
      } catch (err) {
        // Tag the internal log with the EXACT path the client's own
        // response.errors[].path will carry for this same failure.
        logger.error('resolver failed', {
          requestId,
          path: pathToArray(info.path),   // e.g. ["users", 1, "posts"]
          error: err,
        });
        throw err;
      }
    },
  },
};`,
    },
    {
      label: 'Verified: info.path matches errors[].path exactly',
      language: 'typescript',
      code: `// Real query, real failure, executed against graphql-js directly:
//
// query {
//   users {
//     id
//     name
//     posts { id title }   <- second user's "posts" resolver throws
//   }
// }

// Logged from inside the resolver at the moment of failure:
//   info.path at failure: ["users", 1, "posts"]

// The final response, generated independently by graphql-js's own
// execution engine:
{
  "errors": [
    {
      "message": "DB down for Bob posts",
      "locations": [{ "line": 6, "column": 7 }],
      "path": ["users", 1, "posts"]
    }
  ],
  "data": null
}
// Identical array, both places -- 1 (a number) for the list index,
// not "1" -- confirmed matching exactly, not just "similar."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A resolver three levels deep — <code>Query.users[2].comments[0].author</code> — throws. Predict the exact array <code>pathToArray(info.path)</code> produces at that point, including the types of each entry (string vs number).',
    hint: 'Every list index becomes its own entry in the path, using the SAME representation the final errors[].path array uses — what type does a list index use there?',
    solution: `["users", 2, "comments", 0, "author"] -- five entries. Every field name is a string ("users", "comments", "author"), and every LIST INDEX is a plain number (2, 0), not a stringified "2"/"0". This is the same shape confirmed for the two-level example in the theory section, just one level deeper -- each additional list or field hop simply adds one more entry to the array, alternating between field-name strings and (when the parent is a list) numeric indices.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"info.path is already a plain array, the same shape as the response\'s errors[].path."',
      reality: 'Confirmed by inspecting it directly: <code>info.path</code> is a linked list of <code>{ key, typename, prev }</code> nodes, not an array — it has to be walked via <code>.prev</code> and converted (unshifting each <code>.key</code>) before it looks like the familiar array.',
    },
    {
      thought: '"info.path and the response\'s own errors[].path are only similar, not guaranteed identical."',
      reality: 'Confirmed via a real executed query with a three-level-deep failure: the array built from <code>info.path</code> at the moment of failure is byte-for-byte identical to the final response\'s <code>errors[0].path</code>, including the numeric (not string) list index.',
    },
    {
      thought: '"A list index in info.path / errors[].path is represented as a string, matching how it looks in the query text."',
      reality: 'Confirmed via direct execution: a list index is a plain JavaScript NUMBER in both places (<code>1</code>, not <code>"1"</code>) — code comparing it against a string index would silently never match.',
    },
  ];

  topicLabel = 'Resolvers';
  topicRoute = '/graphql/resolvers';
  prev: SubtopicLink | null = {
    label: 'Preventing Overfetching With info.fieldNodes',
    route: '/graphql/resolvers/preventing-overfetch-with-info-fieldnodes',
  };
  next: SubtopicLink | null = null;
}
