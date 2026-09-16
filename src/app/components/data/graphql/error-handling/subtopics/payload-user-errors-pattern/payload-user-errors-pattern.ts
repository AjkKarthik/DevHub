import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-payload-user-errors-pattern',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './payload-user-errors-pattern.html',
  styleUrl: './payload-user-errors-pattern.scss',
})
export class PayloadUserErrorsPatternSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The QnA names it, but never shows the schema',
      points: [
        'The main page\'s own QnA draws the line precisely: "Use top-level errors for unexpected system errors, auth failures, and invalid queries. Use payload UserErrors for domain validation failures... these are expected outcomes, not exceptions." No codeTab on the page ever writes the actual <code>UserError</code> type or the mutation payload shape that carries it.',
        'This is the convention Shopify\'s Admin API and GitHub\'s GraphQL API both use for exactly this reason: a mutation returns a payload object with BOTH the data field (nullable) AND a typed <code>userErrors: [UserError!]!</code> list — always present, empty on success, populated on expected validation failure.',
        'The key structural difference from throwing: <code>userErrors</code> is an ordinary, schema-typed field. A client selects exactly the sub-fields it wants (<code>field</code>, <code>message</code>, <code>code</code>) the same way it selects any other field — it is not a separate error-shaped object the client has to parse out of a different part of the response.',
      ],
    },
    {
      heading: 'Why a single throw can\'t replace this for form-style validation',
      points: [
        'Throwing <code>GraphQLError</code> is a single event per resolver — one field either resolves or it throws once. A form submitting a title, a slug, and a body can have THREE independent validation failures at once (title too short, slug already taken, body empty), and a user filling out a form wants to see all three at the same time, not fix one, resubmit, and discover the next.',
        '<code>userErrors</code> is a list specifically because it needs to hold zero, one, or many entries from a single mutation call — something a single thrown error structurally cannot represent.',
        'The two mechanisms are not competitors — they compose. A mutation still throws <code>GraphQLError</code> for the things that really are exceptional (not authenticated, database unreachable) and only reaches for the <code>userErrors</code> list once it knows the request is legitimate and just has form-level problems.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Schema',
      language: 'typescript',
      code: `type Mutation {
  createPost(input: CreatePostInput!): CreatePostPayload!
}

type CreatePostPayload {
  post: Post          # null when userErrors is non-empty
  userErrors: [UserError!]!   # always present, [] on success
}

type UserError {
  field: [String!]    # which input field(s) this error relates to
  message: String!    # human-readable, safe to show directly in a form
  code: String!       # machine-readable: TOO_SHORT, SLUG_TAKEN, ...
}

input CreatePostInput {
  title: String!
  slug: String!
  body: String!
}`,
    },
    {
      label: 'Resolver — throw vs userErrors, side by side',
      language: 'typescript',
      code: `const resolvers = {
  Mutation: {
    createPost: async (_, { input }, { user, db }) => {
      // Not authenticated: unexpected/exceptional -- throw, don't return a userError.
      if (!user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Everything below IS an expected outcome for a logged-in user
      // filling out a form -- collect every problem, don't stop at the first.
      const userErrors: { field: string[]; message: string; code: string }[] = [];

      if (input.title.length < 3) {
        userErrors.push({
          field: ['title'], code: 'TOO_SHORT',
          message: 'Title must be at least 3 characters',
        });
      }
      if (await db.posts.findBySlug(input.slug)) {
        userErrors.push({
          field: ['slug'], code: 'SLUG_TAKEN',
          message: 'That slug is already in use',
        });
      }
      if (input.body.trim().length === 0) {
        userErrors.push({
          field: ['body'], code: 'EMPTY',
          message: 'Post body cannot be empty',
        });
      }

      if (userErrors.length > 0) {
        return { post: null, userErrors };
      }

      const post = await db.posts.create(input);
      return { post, userErrors: [] };
    },
  },
};`,
    },
    {
      label: 'Client',
      language: 'typescript',
      code: `const { data } = await createPost({ variables: { input } });

// data.createPost.userErrors always exists -- no separate error
// object to check, no data/error branching, just an ordinary field.
if (data.createPost.userErrors.length > 0) {
  for (const err of data.createPost.userErrors) {
    // err.field lets you highlight the exact form input
    showFieldError(err.field, err.message);
  }
} else {
  // data.createPost.post is guaranteed non-null here
  router.push(\`/posts/\${data.createPost.post.slug}\`);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A <code>updateAccountEmail</code> mutation needs to check three things: (1) the caller is authenticated, (2) the caller owns the account being updated, (3) the new email is a valid, correctly-formatted email address. For each of the three, should the check throw a <code>GraphQLError</code> or push to the <code>userErrors</code> list?',
    hint: 'Ask: is this something the CALLER could reasonably trigger through normal, legitimate use of the form, or does it mean something is wrong at a level above the form itself?',
    solution: `(1) Not authenticated -- throw. This means there is no valid session at all; it is not a form-validation outcome, it is "you should never have reached this resolver." UNAUTHENTICATED code.

(2) Caller doesn't own the account -- throw, with FORBIDDEN. A logged-in user deliberately or accidentally targeting someone else's account is not a normal, expected path through the form -- there is no form field a legitimate user could fill in differently to reach this outcome, so it isn't a "validation error" in the userErrors sense.

(3) Malformed email -- userErrors. This is exactly the expected-outcome case: a real user, typing in a real form, can absolutely submit a typo'd email address. The resolver should collect this as a userErrors entry (field: ['email'], code: 'INVALID_FORMAT') so the client can highlight the email field inline, the same way it would for any other field-level validation problem -- not throw and force the whole mutation to fail with no field-level detail.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Payload userErrors and the top-level errors array do the same job, so I only need one."',
      reality: '<code>userErrors</code> is an ordinary, schema-typed field the client selects like any other — it shows up in <code>data</code>, not in a separate error-shaped part of the response. The top-level <code>errors</code> array is for the genuinely unexpected: auth failures, invalid queries, system errors. Real APIs use both, for different failure classes.',
    },
    {
      thought: '"Field-level form validation like \'title too short\' should always throw BAD_USER_INPUT."',
      reality: 'A single throw can only report one problem per resolver call. A form validating multiple fields at once needs a LIST of problems, which is exactly what the <code>userErrors: [UserError!]!</code> field exists to hold — something one thrown error structurally cannot represent.',
    },
    {
      thought: '"As long as userErrors has a message string, that\'s enough — the client can just display it."',
      reality: 'Give each <code>UserError</code> its own machine-readable <code>code</code> field too, the same convention the main page\'s Quick Reference already establishes for <code>extensions.code</code>. A client should be able to branch on <code>err.code === \'SLUG_TAKEN\'</code> without string-matching a human-readable message that could change wording later.',
    },
  ];

  topicLabel = 'Mutation Error Handling';
  topicRoute = '/graphql/error-handling';
  prev: SubtopicLink | null = {
    label: 'Apollo Server v4 Removed Its Built-In Error Classes',
    route: '/graphql/error-handling/apollo-server-v4-removed-error-classes',
  };
  next: SubtopicLink | null = {
    label: 'ApolloServerErrorCode: Recognizing Apollo’s Own Errors',
    route: '/graphql/error-handling/apollo-server-error-code-enum',
  };
}
