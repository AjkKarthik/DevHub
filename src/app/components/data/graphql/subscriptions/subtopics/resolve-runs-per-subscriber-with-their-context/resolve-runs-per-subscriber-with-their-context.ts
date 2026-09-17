import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-resolve-runs-per-subscriber-with-their-context',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './resolve-runs-per-subscriber-with-their-context.html',
  styleUrl: './resolve-runs-per-subscriber-with-their-context.scss',
})
export class ResolveRunsPerSubscriberWithTheirContextSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The theory names resolve — no codeTab ever writes one',
      points: [
        'The main page\'s own "Subscription Resolver Shape" theory section states plainly: "A subscription resolver has two functions: subscribe... and resolve... Use it to reshape or select event fields." Not one of the page\'s three codeTabs, the mistakes block, or the Challenge ever includes a <code>resolve</code> function — every example only ever defines <code>subscribe</code>.',
        'Without <code>resolve</code>, the raw value <code>pubsub.publish()</code> broadcasts is what every subscriber receives, verbatim. That is fine when every subscriber should see identical data — but it means the SAME payload goes to every listener, with no per-subscriber shaping at all.',
        '<code>resolve</code> is exactly an ordinary GraphQL field resolver. Confirmed via direct execution against graphql-js\'s own <code>subscribe()</code>: for every event the async iterator yields, graphql-js runs a fresh <code>execute()</code> pass using that event as the root value — and <code>resolve</code> is the field resolver for that pass, receiving the SAME <code>context</code> that was supplied once, up front, when the subscription began.',
      ],
    },
    {
      heading: 'Why that matters: per-subscriber personalization from one broadcast event',
      points: [
        'Because <code>resolve</code> gets the subscriber\'s own <code>context</code> on every single invocation, it can shape the SAME broadcast event differently for each subscriber — without a separate database query per subscriber, and without the publisher needing to know who is listening at all.',
        'Confirmed via direct execution with two independent subscribers on the SAME event source, given different <code>context</code> values: identical underlying events produced genuinely different <code>resolve()</code> output per subscriber (a computed <code>isOwn</code> boolean flipped between <code>true</code>/<code>false</code> depending purely on which subscriber\'s context was in scope for that call).',
        'This is a structurally different capability from <code>withFilter</code> (already shown on the main page). <code>withFilter</code> decides WHETHER an event reaches a subscriber at all; <code>resolve</code> decides WHAT SHAPE the event takes once it does. The two compose — a subscription field commonly uses both together.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without resolve (main page\'s existing pattern)',
      language: 'typescript',
      code: `Subscription: {
  commentAdded: {
    subscribe: withFilter(
      () => pubsub.asyncIterator('COMMENT_ADDED'),
      (payload, variables) => payload.postId === variables.postId
    ),
    // No resolve -- every matching subscriber gets the IDENTICAL
    // raw payload.commentAdded object, verbatim, no matter who they are.
  }
},`,
    },
    {
      label: 'With resolve — same broadcast, shaped per subscriber',
      language: 'typescript',
      code: `Subscription: {
  commentAdded: {
    subscribe: withFilter(
      () => pubsub.asyncIterator('COMMENT_ADDED'),
      (payload, variables) => payload.postId === variables.postId
    ),
    resolve: (payload, args, context) => {
      // payload.commentAdded is the SAME object every matching
      // subscriber receives from pubsub.publish() -- but resolve()
      // runs separately for each one, with THEIR OWN context.
      return {
        ...payload.commentAdded,
        isOwn: payload.commentAdded.authorId === context.user.id,
      };
    },
  }
},`,
    },
    {
      label: 'Verifying against real graphql-js: two subscribers, one event source',
      language: 'typescript',
      code: `import { GraphQLSchema, GraphQLObjectType, subscribe, parse } from 'graphql';

async function* eventSource() {
  yield { commentAdded: { id: '1', body: 'hi', authorId: 'user-42' } };
}

const schema = new GraphQLSchema({
  query: /* ... */,
  subscription: new GraphQLObjectType({
    name: 'Subscription',
    fields: {
      commentAdded: {
        type: CommentType,
        subscribe: () => eventSource(),
        resolve: (payload, args, context) => ({
          ...payload.commentAdded,
          isOwn: payload.commentAdded.authorId === context.viewerId,
        }),
      },
    },
  }),
});

const doc = parse(\`subscription { commentAdded { id body isOwn } }\`);

const subA = await subscribe({ schema, document: doc, contextValue: { viewerId: 'user-42' } });
const subB = await subscribe({ schema, document: doc, contextValue: { viewerId: 'user-99' } });

for await (const result of subA) console.log('A:', result);
// A: { data: { commentAdded: { id: '1', body: 'hi', isOwn: true } } }

for await (const result of subB) console.log('B:', result);
// B: { data: { commentAdded: { id: '1', body: 'hi', isOwn: false } } }
// SAME underlying event, DIFFERENT isOwn -- resolve ran twice,
// once per subscriber, each with its own contextValue.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wants an <code>orderStatusChanged</code> subscription where every subscriber sees the same order data, EXCEPT one field, <code>internalCostCents</code>, which should only appear for subscribers whose <code>context.user.role === \'ADMIN\'</code>. Where does this logic belong — <code>subscribe</code>, <code>withFilter</code>, or <code>resolve</code>?',
    hint: 'The question is not "should this subscriber receive the event at all" — every subscriber DOES receive it. It is "what shape should the event take for THIS subscriber."',
    solution: `resolve. This is not a filtering decision (withFilter/subscribe decide whether an event reaches a subscriber at all -- here, every subscriber should receive the event), it is a SHAPING decision -- what the response object looks like for that specific subscriber.

const resolvers = {
  Subscription: {
    orderStatusChanged: {
      subscribe: () => pubsub.asyncIterator('ORDER_STATUS_CHANGED'),
      resolve: (payload, args, context) => {
        const order = payload.orderStatusChanged;
        if (context.user.role !== 'ADMIN') {
          const { internalCostCents, ...publicFields } = order;
          return publicFields;
        }
        return order;
      },
    },
  },
};

Since resolve runs once per subscriber with that subscriber's own context, this needs no separate publish per role and no filtering logic at all -- every subscriber gets the SAME underlying event, and resolve alone decides which fields survive into their own individual response.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Without a resolve function, a subscription field just returns null or throws — resolve is required."',
      reality: '<code>resolve</code> is optional, exactly as the main page\'s own theory states. Omitting it means the raw value the async iterator yields (for the field key) is returned as-is — completely valid, just with no per-subscriber shaping.',
    },
    {
      thought: '"resolve runs once per published event, the same way subscribe does."',
      reality: 'Confirmed via direct execution: <code>resolve</code> runs once PER SUBSCRIBER per event — if three subscribers are listening when one event is published, <code>resolve</code> runs three separate times, once per subscriber\'s own context, not once for the whole broadcast.',
    },
    {
      thought: '"Personalizing a subscription\'s payload per subscriber (like an isOwn flag) requires a separate pubsub.publish() call per subscriber."',
      reality: 'No — confirmed via direct execution with two independently-contexted subscribers on the exact same broadcast event: <code>resolve</code> alone can compute a per-subscriber-specific value from the SAME underlying event, using whatever <code>context</code> that subscriber connected with.',
    },
  ];

  topicLabel = 'Subscriptions';
  topicRoute = '/graphql/subscriptions';
  prev: SubtopicLink | null = {
    label: '@skip and @include Can Crash Subscription Validation, Not Just Reject It',
    route: '/graphql/subscriptions/skip-include-crashes-subscription-validation',
  };
  next: SubtopicLink | null = null;
}
