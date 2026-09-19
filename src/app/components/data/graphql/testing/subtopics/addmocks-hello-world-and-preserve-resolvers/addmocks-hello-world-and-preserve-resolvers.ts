import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-testing-addmocks-defaults',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './addmocks-hello-world-and-preserve-resolvers.html',
  styleUrl: './addmocks-hello-world-and-preserve-resolvers.scss'
})
export class AddmocksHelloWorldAndPreserveResolversSubtopic {
  topicLabel = 'Testing GraphQL APIs';
  topicRoute = '/graphql/testing';

  theory: TheoryPoint[] = [
    {
      heading: 'What the default mocks really are',
      points: [
        'Verified against a real @graphql-tools/mock 9.1.14 install: the default String mock is always the literal <code>Hello World</code>. ID is a UUID, and Int, Float and Boolean are random. Negative Int and Float values do appear in runs.',
        'The original bullet said the defaults are "random strings, numbers, booleans". Only the numbers and booleans are random; strings are constant, which is why snapshot-style assertions on String fields are stable.',
        'A mock function for a type overrides only the fields you return. Verified: <code>mocks: { User: () => ({ name: "Alice" }) }</code> gave name Alice while id and age still came from the defaults.'
      ]
    },
    {
      heading: 'Mocks replace real resolvers, and values repeat',
      points: [
        'By default the mocks REPLACE real resolvers. Verified: a schema whose real Query.user resolver returned name "Real Name" came back with name "Hello World" once wrapped by addMocksToSchema with default options.',
        'With <code>preserveResolvers: true</code> the real resolvers win: the same query returned "Real Name" and age 40, and the String mock was ignored for that field.',
        'Querying the SAME mocked schema twice returned identical values, including the "random" id, score and age. The mock store memoizes what it generated, so build a fresh mocked schema per test when you want fresh random data.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Defaults, memoization, overrides',
      language: 'typescript',
      code: `import { makeExecutableSchema } from '@graphql-tools/schema';
import { addMocksToSchema } from '@graphql-tools/mock';
import { graphql } from 'graphql';

const schema = makeExecutableSchema({
  typeDefs: 'type User { id: ID! name: String! age: Int! } type Query { user: User! }',
  resolvers: { Query: { user: () => ({ id: 'real', name: 'Real Name', age: 40 }) } },
});

const mocked = addMocksToSchema({ schema });
const run = () => graphql({ schema: mocked, source: '{ user { id name age } }' });

console.log((await run()).data);
// shape: { user: { id: '<uuid>', name: 'Hello World', age: <random int> } }
// The real resolver was NOT used.

console.log((await run()).data);
// Identical to the first run: the mock store memoizes generated values.

const overridden = addMocksToSchema({ schema, mocks: { User: () => ({ name: 'Alice' }) } });
// { user: { id: '<uuid>', name: 'Alice', age: <random int> } } -- only name overridden`
    },
    {
      label: 'preserveResolvers: true',
      language: 'typescript',
      code: `// Same schema as the previous tab, with the real Query.user resolver.
const preserved = addMocksToSchema({
  schema,
  preserveResolvers: true,
  mocks: { String: () => 'MOCKED' },
});

const res = await graphql({ schema: preserved, source: '{ user { id name age } }' });
console.log(res.data);
// { user: { id: 'real', name: 'Real Name', age: 40 } }
// The real resolver is kept, so the String mock never applies to name.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A test builds <code>addMocksToSchema({ schema })</code> from a schema that has real resolvers, then asserts that a <code>jest.fn()</code> resolver was called. The query returns data, yet the assertion fails. Why?',
    hint: 'By default, which wins when a field has both a real resolver and a mock?',
    solution: 'By default the mocks replace the real resolvers, so the jest.fn() resolver never runs and the data comes from generated mocks (String fields are always Hello World). Pass preserveResolvers: true to keep the real resolvers, or test the resolver directly with a unit test instead of through a fully mocked schema.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'addMocksToSchema generates a random string for every String field.',
      reality: 'The default String mock is always <code>Hello World</code>. Only Int, Float and Boolean are random, and ID is a UUID.'
    },
    {
      thought: 'Mocking a schema layers on top of my real resolvers and only fills in missing data.',
      reality: 'By default the mocks replace the real resolvers entirely. You must pass <code>preserveResolvers: true</code> to keep them.'
    },
    {
      thought: 'Running the same query twice against a mocked schema gives fresh random data each time.',
      reality: 'The same mocked schema returned identical values, including its random-looking ones, on a repeat query. Create a new mocked schema per test for fresh values.'
    }
  ];

  prev: SubtopicLink | null = { label: 'Subscriptions Need graphql-js subscribe(), Not executeOperation', route: '/graphql/testing/subscriptions-need-graphql-js-subscribe' };
}
