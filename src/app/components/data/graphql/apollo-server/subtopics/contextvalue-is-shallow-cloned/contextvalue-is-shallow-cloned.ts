import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-apollo-server-context-clone',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './contextvalue-is-shallow-cloned.html',
  styleUrl: './contextvalue-is-shallow-cloned.scss'
})
export class ContextvalueIsShallowClonedSubtopic {
  topicLabel = 'Apollo Server';
  topicRoute = '/graphql/apollo-server';

  theory: TheoryPoint[] = [
    {
      heading: 'Verified directly from Apollo Server\'s own source',
      points: [
        'Reading `internalExecuteOperation` in the installed `@apollo/server` package directly confirms the request context is built with `contextValue: cloneObject(options?.contextValue ?? {})` — NOT a direct reference to whatever object you passed in.',
        '`cloneObject` is `Object.assign(Object.create(Object.getPrototypeOf(object)), object)` — a genuine SHALLOW clone. It copies every top-level property onto a brand-new object; it does not reuse the original object itself.',
        'Because it is only a shallow clone, existing nested objects referenced by a top-level property (e.g. a database connection passed as `contextValue: { db }`) ARE the same object inside the request — mutating `db`\'s own properties is visible outside the request.',
        'What is NOT visible outside the request: adding or reassigning a NEW top-level property directly on `requestContext.contextValue` inside a plugin. That mutation only ever touches the clone, never the object the caller originally passed to `executeOperation`.'
      ]
    },
    {
      heading: 'Verified end-to-end against a real, installed Apollo Server',
      points: [
        'Running an actual `@apollo/server` instance with a plugin that sets `requestContext.contextValue.requestId = randomUUID()` in `requestDidStart`, then checking the ORIGINAL `contextValue` object after `executeOperation()` resolves, confirms `requestId` is `undefined` on the original object every time — even though the plugin\'s own `willSendResponse` hook, reading from `requestContext.contextValue` directly, sees the correct value and can successfully attach it to a response header.',
        'This means a plugin CAN reliably read and act on a value it wrote earlier in the SAME request (since every hook receives the same `requestContext.contextValue`), but that same value can never leak back out to whatever object the CALLER of `executeOperation` is still holding a reference to.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The mutation that never escapes',
      language: 'typescript',
      code: `import { ApolloServer } from '@apollo/server';
import { randomUUID } from 'crypto';

function RequestIdPlugin() {
  return {
    async requestDidStart(requestContext) {
      // This mutates the CLONE Apollo Server built internally --
      // never the object the caller passed to executeOperation().
      requestContext.contextValue.requestId = randomUUID();

      return {
        async willSendResponse({ response, contextValue }) {
          // This DOES work correctly -- every hook in the SAME
          // request shares the identical requestContext.contextValue.
          response.http?.headers.set('x-request-id', contextValue.requestId);
        },
      };
    },
  };
}

const server = new ApolloServer({ typeDefs, resolvers, plugins: [RequestIdPlugin()] });

const original = {};
const res = await server.executeOperation({ query: '{ hello }' }, { contextValue: original });

console.log(res.http?.headers.get('x-request-id')); // a real UUID -- works
console.log(original.requestId);                     // undefined -- never mutated`
    },
    {
      label: "The clone, straight from Apollo Server's own source",
      language: 'typescript',
      code: `// From the installed @apollo/server package's own ApolloServer.js
// (confirmed by direct inspection, not assumed from documentation):

function cloneObject(object) {
  return Object.assign(Object.create(Object.getPrototypeOf(object)), object);
}

// ...and where it's actually used, inside internalExecuteOperation:
//
//   contextValue: cloneObject(options?.contextValue ?? {}),
//
// Every call to executeOperation() gets a FRESH shallow clone of
// whatever contextValue you pass -- the original object is read from
// once, then never touched again by the request pipeline.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A test passes <code>contextValue: { db: fakeDb }</code> to <code>executeOperation()</code>, where <code>fakeDb</code> is a mutable in-memory fake with its own methods that record calls (e.g. <code>fakeDb.calls.push(...)</code>). After the call resolves, the test checks <code>fakeDb.calls</code> to verify a resolver actually queried the fake database. Given that <code>contextValue</code> is shallow-cloned, does this assertion work correctly?',
    hint: 'A shallow clone copies the TOP-LEVEL property (here, the reference to <code>fakeDb</code> itself) onto a new object — it does not deep-clone <code>fakeDb</code>\'s own internals.',
    solution: 'Yes, this assertion works correctly. The shallow clone creates a NEW top-level object, but the fakeDb reference stored under its db property is copied by reference, not deep-cloned -- so requestContext.contextValue.db and the original contextValue.db both point at the exact same fakeDb instance. When a resolver calls a method on ctx.db that pushes onto fakeDb.calls, that array is mutated in place, and the test\'s own external fakeDb.calls reference sees the identical mutation. The only case that breaks is adding or reassigning a NEW top-level property directly on contextValue itself (like the requestId example in this subtopic\'s own codeTab) -- reading or mutating something ALREADY nested one level down, like fakeDb.calls, works exactly as expected.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since JavaScript objects are passed by reference, mutating <code>requestContext.contextValue</code> inside a plugin always mutates the same object the caller passed to <code>executeOperation()</code>.',
      reality: 'Verified directly from Apollo Server\'s own source: <code>internalExecuteOperation</code> calls <code>cloneObject()</code> on the passed-in <code>contextValue</code> before storing it on the request context. The reference INSIDE the request is a fresh clone, not the caller\'s original object — this is a deliberate implementation detail, not a JavaScript language behavior.'
    },
    {
      thought: 'Because <code>contextValue</code> is cloned, nothing a plugin does to it can ever be observed outside the request.',
      reality: 'Only true for NEW top-level properties. Since the clone is SHALLOW, any object already referenced by an existing top-level property (a database connection, a mutable array, a class instance) is the SAME object inside and outside the request — mutating that nested object\'s own properties or calling its own methods IS visible to the caller, as this subtopic\'s own Try It demonstrates.'
    },
    {
      thought: 'This shallow-clone behavior is specific to `executeOperation()` for testing, and does not apply to real HTTP requests served via `expressMiddleware`.',
      reality: 'The clone happens inside <code>internalExecuteOperation</code>, the SAME internal function every request path — HTTP-served or test-only — ultimately calls. The context object a real `expressMiddleware` request builds via its own `context` function is cloned exactly the same way before a plugin ever sees it.'
    }
  ];

  prev: SubtopicLink | null = { label: 'executeOperation’s ‘incremental’ Response Kind, and Why You Probably Won’t See It', route: '/graphql/apollo-server/executeoperation-incremental-response-kind' };
  next: SubtopicLink | null = null;
}
