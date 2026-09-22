import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-performance-aliased-root-fields',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './aliased-root-fields-bypass-batching-disable.html',
  styleUrl: './aliased-root-fields-bypass-batching-disable.scss'
})
export class AliasedRootFieldsBypassBatchingDisableSubtopic {
  topicLabel = 'Performance & Security';
  topicRoute = '/graphql/performance';

  theory: TheoryPoint[] = [
    {
      heading: 'Two genuinely different mechanisms share the word "batching"',
      points: [
        'Verified directly against Apollo Server\'s own GitHub discussion of the feature: transport-level HTTP batching (an array of SEPARATE operations in one POST body) is controlled by the <code>allowBatchedHttpRequests</code> option, and has been OFF by default since Apollo Server 4.',
        'A query aliasing multiple root fields inside ONE operation -- <code>mutation { m1: login(...) m2: login(...) }</code> -- is completely ordinary GraphQL syntax, always available, and has nothing to do with that setting at all: it is still a single HTTP request carrying a single operation.',
        'The main page\'s own QnA example uses exactly this second form, but lists "disabling query batching" as a mitigation -- a fix aimed at the FIRST mechanism, which does nothing for the second.'
      ]
    },
    {
      heading: 'The real fix is a root-field-count limit, not a transport setting',
      points: [
        'Mutations execute their root fields SERIALLY (one after another, in document order) per the GraphQL spec, so <code>mutation { m1: login(...) m2: login(...) }</code> genuinely calls the login resolver twice, in one request, regardless of any HTTP-batching config.',
        'A per-HTTP-request rate limiter that counts REQUESTS never sees this -- it counts one request no matter how many root fields it aliases, which is exactly the bypass the main page names.',
        'The working fix caps the NUMBER of root-level selections a single operation is allowed to have, via a custom validation rule -- the same general mechanism as depth limiting, just measuring root-field count instead of nesting depth.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bypass: one request, many logins',
      language: 'typescript',
      code: `// A naive per-request rate limiter -- this is what the main page's
// own mistake block "Rate limiting by IP only" already warns is
// insufficient, but even a PER-USER version has the same gap here.
const requestCounts = new Map<string, number>();

function checkRateLimit(userId: string, limitPerMinute: number): boolean {
  const count = requestCounts.get(userId) ?? 0;
  if (count >= limitPerMinute) return false;
  requestCounts.set(userId, count + 1);
  return true;
}

// One HTTP request. checkRateLimit() is called ONCE by the
// framework's own per-request middleware -- but the mutation
// document below attempts 5 logins, not 1.
const attackDocument = \`
  mutation {
    a1: login(username: "victim", password: "guess1") { token }
    a2: login(username: "victim", password: "guess2") { token }
    a3: login(username: "victim", password: "guess3") { token }
    a4: login(username: "victim", password: "guess4") { token }
    a5: login(username: "victim", password: "guess5") { token }
  }
\`;
// checkRateLimit('attacker-id', 10) -> true. One "request" consumed
// from the budget, but 5 real login attempts execute against the
// login resolver. A 100-request/minute budget is really a
// 500-guess/minute budget if root fields aren't also counted.`
    },
    {
      label: 'The fix: a root-field-count validation rule',
      language: 'typescript',
      code: `import { ValidationRule, GraphQLError, Kind, OperationDefinitionNode } from 'graphql';

// Caps how many root-level selections a single operation may have.
// This is the mechanism that actually stops the attack above --
// disabling allowBatchedHttpRequests would not, since that only
// blocks an ARRAY of separate operations, not aliases within one.
function createRootFieldLimitRule(maxRootFields: number): ValidationRule {
  return (context) => ({
    OperationDefinition(node: OperationDefinitionNode) {
      const rootFieldCount = node.selectionSet.selections.filter(
        (s) => s.kind === Kind.FIELD
      ).length;

      if (rootFieldCount > maxRootFields) {
        context.reportError(
          new GraphQLError(
            \`Operation has \${rootFieldCount} root fields; maximum allowed is \${maxRootFields}.\`,
            { nodes: node }
          )
        );
      }
    },
  });
}

// In the ApolloServer constructor, alongside depthLimit and complexity:
const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [createRootFieldLimitRule(3)]
});
// The 5-field attack document above is now rejected at VALIDATION
// time, before any resolver (and therefore any login attempt) runs.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets <code>allowBatchedHttpRequests: false</code> (Apollo Server 4\'s own default) and considers the batched-mutation attack fully closed. Does the attack document with 5 aliased <code>login</code> calls in one operation still succeed against this server?',
    hint: '<code>allowBatchedHttpRequests</code> controls one specific transport feature -- does the attack document use that feature at all, or is it a single ordinary operation?',
    solution: 'Yes, it still succeeds -- the attack document is a single GraphQL operation with 5 aliased root fields, sent as one ordinary HTTP request. It never uses the array-of-operations batching format that allowBatchedHttpRequests controls, so setting that option to false (or leaving it at its own default) has zero effect on this specific attack. The team\'s server is just as exposed as one with allowBatchedHttpRequests: true; only a root-field-count validation rule (or a rate limiter that counts root fields, not HTTP requests) actually closes this gap.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Disable query batching" is a correct, complete fix for the main page\'s own <code>m1: login... m2: login...</code> example.',
      reality: 'It fixes a DIFFERENT attack shape -- an array of separate operations in one POST body -- and has no effect on aliased root fields inside a single operation, which is what the example actually shows. The two mechanisms share the word "batching" in casual discussion but are unrelated features with unrelated fixes.'
    },
    {
      thought: 'Since Apollo Server 4 disables HTTP batching by default, any GraphQL API built on a current version is automatically safe from the "send many mutations in one request" attack.',
      reality: 'The default only closes the array-of-operations transport feature. The aliased-root-fields form works on every version of every spec-compliant GraphQL server, with no config to disable, since it is not a separate feature at all -- it is core GraphQL selection-set syntax that has always behaved this way.'
    },
    {
      thought: 'A root-field-count limit and a depth limit accomplish the same thing, just described differently.',
      reality: 'They cap two independent dimensions of a query: depth limiting bounds how deeply NESTED a selection can go (catching the runaway-fragment-chain style of attack), while a root-field-count rule bounds how many SIBLING top-level operations run in one request (catching this aliasing attack) -- a query can violate one without coming close to violating the other.'
    }
  ];

  prev: SubtopicLink | null = { label: 'Computing the Response’s Real Cache-Control Header', route: '/graphql/performance/cache-control-header-computation' };
  next: SubtopicLink | null = { label: 'How Field-Suggestion Blocking Actually Works', route: '/graphql/performance/field-suggestion-blocking-mechanism' };
}
