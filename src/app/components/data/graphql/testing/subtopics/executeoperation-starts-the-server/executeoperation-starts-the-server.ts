import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-testing-executeoperation-starts',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './executeoperation-starts-the-server.html',
  styleUrl: './executeoperation-starts-the-server.scss'
})
export class ExecuteoperationStartsTheServerSubtopic {
  topicLabel = 'Testing GraphQL APIs';
  topicRoute = '/graphql/testing';

  theory: TheoryPoint[] = [
    {
      heading: 'executeOperation does not need a started server',
      points: [
        'Verified against a real @apollo/server 5.5.1 install: a fresh <code>new ApolloServer(...)</code> that never had <code>start()</code> called still answers <code>executeOperation({ query: "{ hello }" })</code> with real data. The server starts itself on that first call.',
        'Apollo\'s own testing docs say the same: if executeOperation is the only thing you do with the server, you do not have to call start().',
        'The original bullet on this page said to call start() in beforeAll as if it were required. It is optional here. An explicit start() is still harmless, and it makes a startup failure surface in your setup hook instead of inside the first test.'
      ]
    },
    {
      heading: 'The lifecycle traps that come with auto-start',
      points: [
        'start() may only be called once. Verified: calling <code>await server.start()</code> AFTER an executeOperation has already run throws an error saying start() should only be called once on your ApolloServer.',
        'So a shared helper where one test calls executeOperation directly and a later beforeAll calls start() on the same instance fails inside the setup hook, far from the real cause.',
        'stop() has the opposite trap: calling it before the server has ever started throws. Calling it after an auto-start works, and calling stop() twice did not throw in the same run.',
        'That means a file whose tests are all skipped can fail in afterAll: no executeOperation ran, so the server never started, so stop() throws.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Auto-start, then start() again',
      language: 'typescript',
      code: `import { ApolloServer } from '@apollo/server';

const server = new ApolloServer({ typeDefs, resolvers });

// 1. No start() call at all -- executeOperation starts the server itself.
const res = await server.executeOperation({ query: '{ hello }' });
// res.body -> { kind: 'single', singleResult: { data: { hello: 'hi' } } }

// 2. start() AFTER that first executeOperation throws:
await server.start();
// Error: You should only call 'start()' or
//   'startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests()'
//   once on your ApolloServer.

// 3. stop() is fine, even though we never called start() ourselves:
await server.stop();`
    },
    {
      label: 'A lifecycle-safe test file',
      language: 'typescript',
      code: `import { ApolloServer } from '@apollo/server';

let server: ApolloServer;

beforeAll(async () => {
  server = new ApolloServer({ typeDefs, resolvers });
  // Starting explicitly here means:
  //  - a startup error fails THIS hook, not the first test
  //  - stop() below is safe even if every test in the file is skipped
  await server.start();
});

afterAll(async () => {
  await server.stop();
});

it('answers a query', async () => {
  // Do not call server.start() again anywhere else -- it may run only once.
  const res = await server.executeOperation({ query: '{ hello }' });
  if (res.body.kind !== 'single') throw new Error('Expected single response');
  expect(res.body.singleResult.errors).toBeUndefined();
});`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A test file creates a server in <code>beforeAll</code>, never calls start(), and calls <code>await server.stop()</code> in <code>afterAll</code>. When every test in the file is skipped, afterAll fails. Why, and what is the smallest fix?',
    hint: 'What starts the server if no test ever calls executeOperation, and what does stop() do to a server that never started?',
    solution: 'Nothing started the server: executeOperation is what auto-starts it, and no test ran it. stop() before the server has started throws, so afterAll fails. Smallest fix: call await server.start() in beforeAll so the server is always started, or guard the stop() call with a flag that is set once the server has started.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'executeOperation needs a started server, so <code>server.start()</code> in beforeAll is mandatory.',
      reality: 'executeOperation starts the server itself on its first call, so start() is optional when it is all you use. It is still a good habit because it moves startup errors into the setup hook.'
    },
    {
      thought: 'It is always safe to also call <code>start()</code> in beforeAll, even if a helper already ran executeOperation on that instance.',
      reality: 'start() may only be called once per ApolloServer. After executeOperation has auto-started it, a second start() throws.'
    },
    {
      thought: 'Since I never called start(), I do not need <code>stop()</code> either.',
      reality: 'The auto-started server still needs shutting down, which is the same leak this page\'s own mistake block warns about. stop() works after an auto-start, but throws if the server never started at all.'
    }
  ];

  next: SubtopicLink | null = { label: 'Subscriptions Need graphql-js subscribe(), Not executeOperation', route: '/graphql/testing/subscriptions-need-graphql-js-subscribe' };
}
