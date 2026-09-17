import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-apollo-server-error-code-enum',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './apollo-server-error-code-enum.html',
  styleUrl: './apollo-server-error-code-enum.scss',
})
export class ApolloServerErrorCodeEnumSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Recognizing Apollo\'s OWN errors, not the ones you throw',
      points: [
        'The removed classes from the previous subtopic weren\'t just a convenience for resolvers to throw — Apollo Server 4 also stopped exporting subclasses like <code>SyntaxError</code> and <code>ValidationError</code> that it used to raise itself, BEFORE any resolver ever ran.',
        'In their place, <code>@apollo/server/errors</code> exports one enum: <code>ApolloServerErrorCode</code>. Every error Apollo Server generates internally — a malformed query string, a query that fails schema validation, an unknown persisted-query hash — gets one of these codes in <code>extensions.code</code>.',
        'This is a completely different, SEPARATE set of codes from the ones your own resolvers throw (<code>UNAUTHENTICATED</code>, <code>NOT_FOUND</code>, and so on — the page\'s own QuickRef conventions). Those are strings you invent; <code>ApolloServerErrorCode</code> is the fixed set Apollo itself produces.',
      ],
    },
    {
      heading: 'Why formatError should check it',
      points: [
        'A <code>GRAPHQL_VALIDATION_FAILED</code> error means the request never reached a single resolver — the client sent a query that doesn\'t match your schema (a typo\'d field name, a missing required argument). That is a client bug, not a server incident.',
        'An <code>INTERNAL_SERVER_ERROR</code> — the fallback code for anything unclassified, including an uncaught exception inside a resolver — is exactly the opposite: something genuinely broke on the server, and it is worth paging/logging loudly for.',
        'The main page\'s own <code>formatError</code> codeTab only ever checks <code>=== \'INTERNAL_SERVER_ERROR\'</code> as a string literal. Using the enum instead of a bare string gets you autocomplete, a compile error if Apollo ever renames a code, and — more importantly — the full, discoverable list of every pre-execution failure mode Apollo itself can produce.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The full enum',
      language: 'typescript',
      code: `import { ApolloServerErrorCode } from '@apollo/server/errors';

// Every value ApolloServerErrorCode can hold -- these are ALL
// pre-execution failures. Not one resolver has run by the time
// any of these codes shows up in extensions.code.

ApolloServerErrorCode.GRAPHQL_PARSE_FAILED         // query string has a syntax error
ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED    // query doesn't match your schema
ApolloServerErrorCode.BAD_USER_INPUT               // an argument's value is invalid
ApolloServerErrorCode.PERSISTED_QUERY_NOT_FOUND    // APQ hash not in the cache
ApolloServerErrorCode.PERSISTED_QUERY_NOT_SUPPORTED // client tried APQ, server disabled it
ApolloServerErrorCode.OPERATION_RESOLUTION_FAILURE // couldn't tell which named op to run
ApolloServerErrorCode.BAD_REQUEST                  // malformed before parsing even started
ApolloServerErrorCode.INTERNAL_SERVER_ERROR        // fallback -- includes your own
                                                    // unclassified resolver exceptions`,
    },
    {
      label: 'formatError, routed by origin',
      language: 'typescript',
      code: `import { ApolloServerErrorCode } from '@apollo/server/errors';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (formattedError, error) => {
    const code = formattedError.extensions?.code;

    // Apollo's own pre-execution failures: the client's fault,
    // not a server incident. Log quietly, never alert on-call.
    const clientFacingCodes: string[] = [
      ApolloServerErrorCode.GRAPHQL_PARSE_FAILED,
      ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED,
      ApolloServerErrorCode.BAD_USER_INPUT,
      ApolloServerErrorCode.PERSISTED_QUERY_NOT_FOUND,
    ];
    if (typeof code === 'string' && clientFacingCodes.includes(code)) {
      metrics.increment('graphql.client_error', { code });
      return formattedError;
    }

    // Everything else, including INTERNAL_SERVER_ERROR and your
    // own resolver-thrown codes -- log with full detail, and page
    // on the truly unclassified ones.
    console.error('[GraphQL Error]', error);
    if (code === ApolloServerErrorCode.INTERNAL_SERVER_ERROR) {
      alerting.page('graphql-internal-error', { error });
    }

    return process.env.NODE_ENV === 'production'
      ? { message: formattedError.message, path: formattedError.path, extensions: { code } }
      : formattedError;
  },
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A client sends a query for <code>{ user(id: "42") { naem } }</code> (a typo\'d field name). Which <code>ApolloServerErrorCode</code> does the response carry, and does the on-call alerting from the "formatError, routed by origin" codeTab fire for it?',
    hint: 'Does querying a field that doesn\'t exist on the schema ever reach a resolver at all?',
    solution: `GRAPHQL_VALIDATION_FAILED. A query is checked against the schema's own shape BEFORE execution starts -- "naem" isn't a field GraphQL knows how to resolve on the User type, so the request is rejected at the validation step, and no resolver (including the real user resolver) ever runs.

No, the alerting does not fire. GRAPHQL_VALIDATION_FAILED is in the clientFacingCodes list in the formatError example, so it gets a quiet metrics.increment() call and returns early -- it never reaches the console.error()/alerting.page() branch reserved for INTERNAL_SERVER_ERROR and genuinely unclassified failures. That's the whole point of checking the enum: a typo in a client's query string is not a server incident, and the on-call rotation shouldn't be paged for it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"UNAUTHENTICATED, NOT_FOUND, and the other codes I throw myself are part of ApolloServerErrorCode."',
      reality: '<code>ApolloServerErrorCode</code> only covers errors APOLLO SERVER ITSELF generates before any resolver runs — parse failures, schema validation, persisted-query issues. The codes your own resolvers throw are strings YOU invent; they never appear in this enum.',
    },
    {
      thought: '"Since Apollo Server 4 removed its error subclasses, there is no way to recognize its own built-in errors anymore."',
      reality: 'There is — it just moved from <code>instanceof</code> checks against removed classes like <code>SyntaxError</code>/<code>ValidationError</code> to checking <code>extensions.code</code> against the <code>ApolloServerErrorCode</code> enum instead.',
    },
    {
      thought: '"A GRAPHQL_VALIDATION_FAILED error might still have partially executed some resolvers."',
      reality: 'No — validation happens entirely before execution begins. If a query fails validation, GraphQL never starts resolving any field, correct or not. The whole request is rejected before a single resolver function is called.',
    },
  ];

  topicLabel = 'Mutation Error Handling';
  topicRoute = '/graphql/error-handling';
  prev: SubtopicLink | null = {
    label: 'The Payload UserErrors Pattern, Built Out',
    route: '/graphql/error-handling/payload-user-errors-pattern',
  };
  next: SubtopicLink | null = null;
}
