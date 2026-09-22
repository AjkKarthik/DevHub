import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-testing-subscriptions-subscribe',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './subscriptions-need-graphql-js-subscribe.html',
  styleUrl: './subscriptions-need-graphql-js-subscribe.scss'
})
export class SubscriptionsNeedGraphqlJsSubscribeSubtopic {
  topicLabel = 'Testing GraphQL APIs';
  topicRoute = '/graphql/testing';

  theory: TheoryPoint[] = [
    {
      heading: 'What executeOperation does with a subscription',
      points: [
        'The old QnA claimed you can run a subscription through executeOperation and collect async iterator values. Verified against a real Apollo Server run: <code>executeOperation({ query: "subscription { tick }" })</code> returns exactly one result of kind single. It never hands back an iterator of events.',
        'If the subscription field is non-null (<code>tick: Int!</code>), that single result is an error: it cannot return null for the non-nullable field, with code INTERNAL_SERVER_ERROR.',
        'If the field is nullable (<code>tick: Int</code>), the single result is <code>data: { tick: null }</code> with NO errors at all. A test that only asserts errors is undefined passes while nothing was tested.'
      ]
    },
    {
      heading: 'What works: graphql-js subscribe()',
      points: [
        'graphql-js exports <code>subscribe({ schema, document, contextValue })</code>. For a valid subscription document it returns an async iterator. Verified: three yields from the resolver were collected as 1, 2, 3 with a for await loop.',
        'For an invalid document, or a query operation, subscribe() does not throw and does not return an iterator. It returns an ordinary result with errors (verified: a subscription field that is not defined), so check for that before iterating.',
        'This exercises the subscribe and resolve functions of your subscription fields and the per-event context. It does not exercise the WebSocket transport, so protocol-level tests still need a real server and a graphql-ws client.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'executeOperation on a subscription',
      language: 'typescript',
      code: `const server = new ApolloServer({ schema });

// Non-null field:  type Subscription { tick: Int! }
const r1 = await server.executeOperation({ query: 'subscription { tick }' });
// r1.body.kind === 'single'
// r1.body.singleResult.errors[0].message ->
//   'Cannot return null for non-nullable field Subscription.tick.'

// Nullable field:  type Subscription { tick: Int }
const r2 = await server.executeOperation({ query: 'subscription { tick }' });
// r2.body.singleResult.data   -> { tick: null }
// r2.body.singleResult.errors -> undefined   <-- a silent false pass`
    },
    {
      label: 'subscribe() with for await',
      language: 'typescript',
      code: `import { makeExecutableSchema } from '@graphql-tools/schema';
import { ExecutionResult, parse, subscribe } from 'graphql';

async function* countToThree() { yield 1; yield 2; yield 3; }

const schema = makeExecutableSchema({
  typeDefs: 'type Query { ok: Boolean } type Subscription { tick: Int! }',
  resolvers: {
    Subscription: { tick: { subscribe: () => countToThree(), resolve: (n: number) => n } },
  },
});

it('emits 1, 2, 3', async () => {
  const result = await subscribe({ schema, document: parse('subscription { tick }') });

  // An invalid document comes back as a plain result with errors, not an iterator.
  if ('errors' in result) throw new Error('Subscription did not start');
  const events = result as AsyncGenerator<ExecutionResult>;

  const seen: number[] = [];
  for await (const event of events) seen.push(event.data!['tick'] as number);
  expect(seen).toEqual([1, 2, 3]); // verified by direct execution
});`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team runs <code>server.executeOperation({ query: "subscription { messageAdded }" })</code> against a nullable <code>messageAdded: String</code> field, asserts that errors is undefined, and the test passes. Why is that pass meaningless, and what should they use instead?',
    hint: 'What does executeOperation return for a subscription, and what does a nullable field do when nothing produces a value?',
    solution: 'For a nullable subscription field, executeOperation returns one single result with data messageAdded set to null and no errors, so the assertion holds even though no subscription resolver ever produced an event. Use graphql-js subscribe() on the executable schema, iterate the returned async iterator, and assert on the actual emitted values (or use a graphql-ws client against a real server for transport-level tests).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'executeOperation can run any operation type, including subscriptions, and collect the events.',
      reality: 'It returns a single result. For a subscription that is an error for a non-null field, or a null data value with no errors for a nullable one, and never a stream of events.'
    },
    {
      thought: 'A subscription test that finishes with no errors proves the subscription works.',
      reality: 'A nullable subscription field run through executeOperation comes back with null data and no errors, so a green test can mean nothing was exercised. Assert on emitted values.'
    },
    {
      thought: '<code>subscribe()</code> throws when the document is invalid, so I can skip checking its result.',
      reality: 'It returns a normal result containing errors instead of an iterator. Iterating that with for await fails confusingly, so check the result for errors first.'
    }
  ];

  prev: SubtopicLink | null = { label: 'executeOperation Starts the Server for You', route: '/graphql/testing/executeoperation-starts-the-server' };
  next: SubtopicLink | null = { label: 'addMocksToSchema Defaults, Memoization and preserveResolvers', route: '/graphql/testing/addmocks-hello-world-and-preserve-resolvers' };
}
