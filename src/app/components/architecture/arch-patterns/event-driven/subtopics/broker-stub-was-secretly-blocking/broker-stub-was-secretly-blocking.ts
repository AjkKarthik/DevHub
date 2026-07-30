import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './broker-stub-was-secretly-blocking.html',
  styleUrl: './broker-stub-was-secretly-blocking.scss'
})
export class BrokerStubWasSecretlyBlockingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A demo broker that quietly did the opposite of the page\'s core claim',
      points: [
        'The page repeats this principle in multiple places: "The producer publishes and moves on — it does not know who consumes the event or when" (Core Concepts), and the quiz\'s own explanation for event-driven vs. request-response: "the publisher fires an event without waiting for any response."',
        'The Challenge\'s reference solution built its own in-memory broker stub: <code>publish: async (e) => { for (const s of subscribers) await s(e); }</code>. Reading this literally: <code>publish()</code> loops through every subscriber and AWAITS each one\'s FULL processing before moving to the next, and doesn\'t return until all of them are done.',
        'That means <code>placeOrder()</code>, which itself <code>await</code>s <code>broker.publish(...)</code>, did not actually return until the Loyalty Service consumer had fully finished awarding points — the caller of <code>placeOrder()</code> was, in effect, blocked waiting on consumer processing. This is exactly the synchronous, waiting behavior the page\'s own theory says event-driven publishing is NOT supposed to have.',
      ]
    },
    {
      heading: 'Why a demo/stub still needs to model the real behavior it\'s teaching',
      points: [
        'A simplified in-memory stub is a completely reasonable way to make a Challenge runnable without real message-broker infrastructure — the problem here wasn\'t simplification itself, it was that the simplification accidentally changed WHICH concept was being demonstrated (from "fire and forget" to "fire and wait").',
        'The fix keeps the stub just as simple, but calls each subscriber WITHOUT awaiting it (<code>s(e).catch(...)</code> instead of <code>await s(e)</code>) — the publisher genuinely returns immediately, exactly like the page\'s own theory describes, while still catching subscriber errors so one failing consumer can\'t crash the whole demo process.',
        'This connects directly to this page\'s own "Event-Driven Architecture\'s Debugging and Observability Challenges" theory section — the fact that a producer genuinely doesn\'t know when (or in what order) consumers finish is exactly WHY tracing an event-driven flow is harder than tracing a synchronous call stack; a stub that accidentally makes publish synchronous hides that reality instead of teaching it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Blocking vs. fire-and-forget broker stub',
      language: 'typescript',
      code: `interface OrderPlacedEvent { id: string; data: { orderId: string; customerId: string; totalAmount: number } }

// BEFORE -- publish() awaits every subscriber before returning
const subscribersBroken: Array<(e: OrderPlacedEvent) => Promise<void>> = [];
const brokerBroken = {
  publish: async (e: OrderPlacedEvent) => {
    for (const s of subscribersBroken) await s(e); // <- blocks until EACH one finishes
  },
  subscribe: (fn: (e: OrderPlacedEvent) => Promise<void>) => { subscribersBroken.push(fn); },
};

async function placeOrderBroken(customerId: string, total: number): Promise<string> {
  const orderId = 'ord-1';
  await brokerBroken.publish({ id: 'evt-1', data: { orderId, customerId, totalAmount: total } });
  // placeOrderBroken() does NOT return here until every subscriber has
  // fully finished -- the caller is effectively blocked on consumer work.
  return orderId;
}

// AFTER -- publish() fires subscribers without awaiting them
const subscribers: Array<(e: OrderPlacedEvent) => Promise<void>> = [];
const broker = {
  publish: async (e: OrderPlacedEvent) => {
    for (const s of subscribers) s(e).catch(err => console.error('Consumer error:', err));
    // no 'await' on s(e) -- publish() returns as soon as every subscriber
    // has been INVOKED, not once they've finished processing
  },
  subscribe: (fn: (e: OrderPlacedEvent) => Promise<void>) => { subscribers.push(fn); },
};

async function placeOrder(customerId: string, total: number): Promise<string> {
  const orderId = 'ord-1';
  await broker.publish({ id: 'evt-1', data: { orderId, customerId, totalAmount: total } });
  // Returns immediately -- matches "publisher fires and moves on"
  return orderId;
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A junior engineer building a demo event bus writes publish as: async (e) => { for (const s of subscribers) await s(e); }. They ask: "this looks right to me — it processes every subscriber, what\'s the problem?" What would you tell them?',
    hint: 'The bug isn\'t about whether every subscriber eventually gets called -- it\'s about whether publish() blocks the CALLER until they\'re all done.',
    solution: 'It does correctly invoke every subscriber -- that part is fine. The problem is the await inside the loop: it makes publish() (and therefore anything that awaits publish()) block until EVERY subscriber has fully finished processing, one after another. In a real event-driven system, the whole point is that the publisher does NOT wait on consumers -- it fires the event and moves on immediately, and consumers process independently, possibly seconds or minutes later. A publish() that blocks on consumer completion is secretly behaving like a synchronous request-response call chain, not an asynchronous event bus -- exactly the distinction this page\'s own theory and quiz explanations draw repeatedly.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'As long as every subscriber eventually gets invoked and processes the event, it doesn\'t matter whether publish() awaits them or not.',
      reality: 'Per this subtopic\'s theory, it matters a great deal for the CALLER of publish() — awaiting each subscriber makes the publish call (and anything awaiting it) block until all consumer processing finishes, turning an asynchronous fire-and-forget operation into a hidden synchronous one.'
    },
    {
      thought: 'A simplified in-memory stub built for a coding exercise doesn\'t need to model real asynchronous broker behavior — it just needs to demonstrate the general idea.',
      reality: 'Per this subtopic\'s theory, the specific behavior being demonstrated (publisher fires and moves on, without waiting) IS the core concept the page teaches — a stub that gets this backwards teaches the opposite lesson, even if it "processes events" in some sense.'
    },
    {
      thought: 'This kind of accidental-blocking bug in demo code is purely cosmetic since it only affects a Challenge exercise, not real production code.',
      reality: 'Per this subtopic\'s theory, a reader learning the pattern from this exact Challenge solution could reasonably copy the same awaited-loop pattern into a real system, carrying the same accidental blocking behavior into production code.'
    }
  ];
}
