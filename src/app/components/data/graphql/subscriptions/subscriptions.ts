import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-gql-subscriptions',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './subscriptions.html',
  styleUrl: './subscriptions.scss'
})
export class GqlSubscriptions {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: 'subscription', desc: 'Operation keyword for long-lived server-push connections' },
    { type: 'type', name: 'PubSub', desc: 'In-memory event bus from graphql-subscriptions (dev only)' },
    { type: 'method', name: 'pubsub.publish(topic, payload)', desc: 'Emit an event with a payload to all subscribers of a topic' },
    { type: 'method', name: 'pubsub.asyncIterator(topic)', desc: 'Subscribe field subscribe function — returns an async iterator' },
    { type: 'keyword', name: 'WebSocket', desc: 'Transport for subscriptions — graphql-ws or legacy subscriptions-transport-ws' },
    { type: 'method', name: 'useSubscription()', desc: 'Apollo Client React hook for receiving subscription events' },
    { type: 'keyword', name: 'graphql-ws', desc: 'Modern WebSocket protocol library for GraphQL subscriptions' },
    { type: 'keyword', name: 'SSE', desc: 'Server-Sent Events — HTTP alternative to WebSockets for push (one-way)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What Are Subscriptions?',
      points: [
        'Subscriptions are long-lived operations where the server pushes updates to the client when events occur.',
        'Unlike queries (request-response), subscriptions keep an open connection (WebSocket) and stream multiple results.',
        'The schema defines subscriptions in the Subscription root type — each field represents a subscribable event.',
        'Subscriptions execute a resolver on initial subscribe and then again each time a matching event is published.'
      ]
    },
    {
      heading: 'PubSub Pattern',
      points: [
        'The publish/subscribe pattern decouples event producers (mutations) from event consumers (subscription resolvers).',
        'A mutation publishes an event: `pubsub.publish("POST_CREATED", { postCreated: post })`.',
        'A subscription resolver\'s `subscribe` function returns an async iterator that listens for that topic.',
        'For production, replace the in-memory PubSub with Redis Pub/Sub or a message broker that works across server instances.'
      ]
    },
    {
      heading: 'Subscription Resolver Shape',
      points: [
        'A subscription resolver has two functions: `subscribe` (returns async iterator) and `resolve` (transforms each event).',
        '`subscribe` filters events: use `withFilter` to only push events matching the subscriber\'s arguments.',
        '`resolve` is optional — if omitted, the raw event payload is returned. Use it to reshape or select event fields.',
        'The subscription type field name must match the key in the published payload.'
      ]
    },
    {
      heading: 'WebSocket Transport',
      points: [
        'graphql-ws is the modern protocol library (replaces subscriptions-transport-ws). Use it unless a legacy client forces the old protocol.',
        'The WebSocket server runs alongside the HTTP server — typically on the same port with an upgrade handler.',
        'Subscription context is established at connection time, not per-operation — pass auth tokens in connection params.',
        'graphql-sse provides Server-Sent Events as a simpler alternative when clients only need server-push (no bi-directional).'
      ]
    },
    {
      heading: 'When to Use Subscriptions',
      points: [
        'Use subscriptions for genuinely real-time events: live chat, collaborative editing, stock tickers, live notifications.',
        'For infrequent updates, polling with a query is simpler and more scalable than a persistent WebSocket.',
        'Subscriptions are stateful connections — each subscriber holds a server resource. Design with scale in mind.',
        'Federated graphs: subscriptions are harder to federate. Consider dedicated subscription services at the edge.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Schema & Resolvers',
      language: 'typescript',
      code: `import { PubSub, withFilter } from 'graphql-subscriptions';

const pubsub = new PubSub();

// Schema
const typeDefs = \`
  type Subscription {
    postCreated: Post!
    commentAdded(postId: ID!): Comment!
  }
  type Mutation {
    createPost(input: CreatePostInput!): Post!
    addComment(postId: ID!, body: String!): Comment!
  }
\`;

const resolvers = {
  Mutation: {
    createPost: async (_, { input }, { db }) => {
      const post = await db.posts.create(input);
      // Publish event after creating
      pubsub.publish('POST_CREATED', { postCreated: post });
      return post;
    },
    addComment: async (_, { postId, body }, { db }) => {
      const comment = await db.comments.create({ postId, body });
      pubsub.publish('COMMENT_ADDED', { commentAdded: comment, postId });
      return comment;
    }
  },
  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterator('POST_CREATED')
    },
    commentAdded: {
      // withFilter only emits to subscribers watching this postId
      subscribe: withFilter(
        () => pubsub.asyncIterator('COMMENT_ADDED'),
        (payload, variables) => payload.postId === variables.postId
      )
    }
  }
};`
    },
    {
      label: 'Server Setup (graphql-ws)',
      language: 'typescript',
      code: `import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';

const app = express();
const httpServer = createServer(app);

// HTTP server for queries + mutations
const apolloServer = new ApolloServer({ schema });
await apolloServer.start();
app.use('/graphql', expressMiddleware(apolloServer, {
  context: async ({ req }) => ({ user: getUser(req.headers.authorization) })
}));

// WebSocket server for subscriptions
const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
useServer({
  schema,
  context: async (ctx) => {
    // Auth via WebSocket connection params
    const token = ctx.connectionParams?.authToken as string;
    return { user: getUserFromToken(token) };
  }
}, wsServer);

httpServer.listen(4000);`
    },
    {
      label: 'Apollo Client',
      language: 'typescript',
      code: `import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { useSubscription, gql } from '@apollo/client';

// Split link: HTTP for queries/mutations, WS for subscriptions
const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4000/graphql',
  connectionParams: { authToken: getAuthToken() }
}));

const client = new ApolloClient({
  link: split(
    ({ query }) => {
      const def = getMainDefinition(query);
      return def.kind === 'OperationDefinition' && def.operation === 'subscription';
    },
    wsLink,
    new HttpLink({ uri: '/graphql' })
  ),
  cache: new InMemoryCache()
});

// React hook
function CommentFeed({ postId }: { postId: string }) {
  const { data, loading } = useSubscription(gql\`
    subscription OnCommentAdded($postId: ID!) {
      commentAdded(postId: $postId) { id body author { name } }
    }
  \`, { variables: { postId } });

  return <div>{data?.commentAdded && <NewComment comment={data.commentAdded} />}</div>;
}`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using in-memory PubSub in production',
      wrong: `// PubSub from graphql-subscriptions is in-memory
// Multiple server instances won't share events
const pubsub = new PubSub();`,
      right: `// Use Redis Pub/Sub for multi-instance production
import { RedisPubSub } from 'graphql-redis-subscriptions';
const pubsub = new RedisPubSub({ connection: { host: 'redis', port: 6379 } });`,
      explanation: 'In-memory PubSub only works within a single process. In a multi-instance deployment, events published on one instance never reach subscribers on another.'
    },
    {
      title: 'Not filtering subscription events',
      wrong: `commentAdded: {
  subscribe: () => pubsub.asyncIterator('COMMENT_ADDED')
  // All subscribers receive ALL comments regardless of postId
}`,
      right: `commentAdded: {
  subscribe: withFilter(
    () => pubsub.asyncIterator('COMMENT_ADDED'),
    (payload, variables) => payload.postId === variables.postId
  )
}`,
      explanation: 'Without withFilter, every subscriber receives every event. Use withFilter to route events only to subscribers whose arguments match.'
    },
    {
      title: 'Not handling WebSocket auth correctly',
      wrong: `// Trying to read HTTP headers from WebSocket — not available
useServer({ context: (ctx) => ({ user: ctx.extra.request.headers.authorization }) })`,
      right: `// Auth via connectionParams sent at WebSocket connection time
useServer({
  context: (ctx) => {
    const token = ctx.connectionParams?.authToken;
    return { user: getUserFromToken(token) };
  }
})`,
      explanation: 'WebSocket connections do not carry HTTP headers after the initial upgrade. Pass auth tokens in connectionParams (graphql-ws) instead.'
    },
    {
      title: 'Using subscriptions for infrequent updates',
      wrong: `// Subscription for hourly analytics report — wasteful persistent connection`,
      right: `// Use polling query for infrequent updates
useQuery(GET_ANALYTICS, { pollInterval: 3600000 })`,
      explanation: 'Persistent WebSocket connections consume server resources. For infrequent updates, polling is simpler and scales better than subscriptions.'
    },
    {
      title: 'Mixing graphql-ws and subscriptions-transport-ws protocols',
      wrong: `// Client uses graphql-ws but server uses legacy subscriptions-transport-ws protocol`,
      right: `// Match protocol: both use graphql-ws (modern) or both use the legacy protocol
// Modern: npm i graphql-ws @apollo/client/link/subscriptions`,
      explanation: 'graphql-ws and subscriptions-transport-ws use different WebSocket sub-protocols. They are not interoperable — client and server must use the same library.'
    }
  ];

  challenge: Challenge = {
    title: 'Build a Live Notification Subscription',
    language: 'typescript',
    description: 'Create a `notificationAdded(userId: ID!): Notification!` subscription. Write: (1) the schema type for Notification (id, message, type: NotificationType enum), (2) the resolver with withFilter so subscribers only receive their own notifications, (3) a mutation `sendNotification(userId: ID!, message: String!)` that publishes to the topic.',
    hints: [
      'NotificationType enum: INFO, WARNING, ERROR',
      'Publish payload: { notificationAdded: { id, message, type }, userId }',
      'withFilter: payload.userId === variables.userId',
      'Mutation returns Notification and publishes event'
    ],
    starterCode: `import { PubSub, withFilter } from 'graphql-subscriptions';
const pubsub = new PubSub();

const typeDefs = \`
  enum NotificationType { INFO WARNING ERROR }
  type Notification { # fields }
  type Mutation { sendNotification(userId: ID!, message: String!): Notification! }
  type Subscription { notificationAdded(userId: ID!): Notification! }
\`;

const resolvers = {
  Mutation: {
    sendNotification: async (_, args) => { /* publish */ }
  },
  Subscription: {
    notificationAdded: {
      subscribe: withFilter(/* ... */)
    }
  }
};`,
    solution: `import { PubSub, withFilter } from 'graphql-subscriptions';
const pubsub = new PubSub();

const typeDefs = \`
  enum NotificationType { INFO WARNING ERROR }
  type Notification { id: ID!; message: String!; type: NotificationType! }
  type Mutation { sendNotification(userId: ID!, message: String!, type: NotificationType = INFO): Notification! }
  type Subscription { notificationAdded(userId: ID!): Notification! }
\`;

const resolvers = {
  Mutation: {
    sendNotification: async (_, { userId, message, type = 'INFO' }, { db }) => {
      const notification = await db.notifications.create({ userId, message, type });
      pubsub.publish('NOTIFICATION_ADDED', { notificationAdded: notification, userId });
      return notification;
    }
  },
  Subscription: {
    notificationAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('NOTIFICATION_ADDED'),
        (payload, variables) => payload.userId === variables.userId
      )
    }
  }
};`
  };

  quiz: QuizQuestion[] = [
    { q: 'What transport does GraphQL typically use for subscriptions?', options: ['HTTP long-polling', 'WebSockets', 'Server-Sent Events only', 'TCP sockets'], answer: 1, explanation: 'WebSockets (via graphql-ws or subscriptions-transport-ws) are the standard transport for GraphQL subscriptions, enabling bi-directional persistent connections.' },
    { q: 'Why is in-memory PubSub unsuitable for production?', options: ['It is too slow', 'It only works in a single process — events are lost across instances', 'It does not support filtering', 'It has no TypeScript types'], answer: 1, explanation: 'In-memory PubSub does not share state across server instances. In a horizontally scaled deployment, subscribers on different instances miss events published elsewhere.' },
    { q: 'What does withFilter do in subscription resolvers?', options: ['Filters GraphQL errors', 'Filters which events are pushed to each subscriber based on their arguments', 'Validates event payloads', 'Compresses the WebSocket payload'], answer: 1, explanation: 'withFilter wraps the asyncIterator and only emits events where the filter function returns true — typically comparing payload data to subscriber arguments.' },
    { q: 'How should auth tokens be passed for WebSocket subscriptions?', options: ['As Authorization HTTP header', 'Via connectionParams at WebSocket connection time', 'As URL query parameters', 'Inside each operation\'s variables'], answer: 1, explanation: 'HTTP headers are not available after the WebSocket upgrade. Pass auth tokens in connectionParams (graphql-ws), which are available in the server\'s context function.' },
    { q: 'When is polling preferable to subscriptions?', options: ['For real-time chat', 'For live stock tickers', 'For infrequent updates where persistent connections are wasteful', 'Never — subscriptions are always better'], answer: 2, explanation: 'Subscriptions hold persistent server connections. For data that changes rarely, polling with `pollInterval` in a useQuery is simpler and more scalable.' },
    { q: 'What is the resolve function in a subscription resolver?', options: ['The function that creates the subscription', 'A function that transforms each event payload before sending to the client', 'The filter for events', 'The mutation that triggers the event'], answer: 1, explanation: 'The resolve function (optional) transforms each emitted event. Without it, the raw event payload is returned. Use it to reshape data or select specific fields.' }
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between graphql-ws and subscriptions-transport-ws?', a: 'graphql-ws is the modern standard. subscriptions-transport-ws is the legacy library that Apollo used until ~2022. They use incompatible WebSocket sub-protocols. New projects should use graphql-ws.' },
    { q: 'Can subscriptions be used in GraphQL federation?', a: 'It\'s complex. Apollo Router supports subscriptions via a federated graph using a WebSocket or SSE transport at the router level. Each subgraph can publish subscription events that the router aggregates. This requires careful design and Apollo Federation v2+.' },
    { q: 'What is graphql-sse?', a: 'graphql-sse implements the GraphQL-over-SSE specification. Server-Sent Events are simpler than WebSockets (unidirectional, HTTP-based, auto-reconnect) and work well for subscriptions where the client never sends data after subscribing.' },
    { q: 'How do I unsubscribe from a subscription on the client?', a: 'useSubscription automatically unsubscribes when the component unmounts. For manual subscriptions via client.subscribe(), store the returned ObservableQuery and call .unsubscribe().' },
    { q: 'Can a subscription return multiple fields at the root level?', a: 'A subscription operation can only have one root field. This is a GraphQL spec requirement — subscriptions are semantically one stream of events per subscription operation.' },
    { q: 'How do I test subscriptions?', a: 'Use createTestClient from @apollo/server/testing or a WebSocket client like ws in tests. Publish events via pubsub.publish() and assert the subscription emits the expected data. For integration tests, use a real Redis PubSub.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'Subscriptions are server-push streams over WebSocket — PubSub connects mutations to subscribers, and withFilter routes events precisely.',
    mustKnow: [
      'Subscriptions keep a persistent WebSocket connection for server-push',
      'PubSub: publish from mutations, asyncIterator in subscribe function',
      'withFilter routes events only to matching subscribers',
      'In-memory PubSub is dev-only — use Redis Pub/Sub for production',
      'Auth via connectionParams, not HTTP headers, for WebSocket',
      'graphql-ws is the modern protocol (replaces subscriptions-transport-ws)'
    ],
    interviewFocus: [
      'How do GraphQL subscriptions work under the hood?',
      'Why can\'t you use in-memory PubSub in production?',
      'How do you authenticate WebSocket subscription connections?'
    ]
  };
}
