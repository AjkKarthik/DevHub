import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-rx-missing',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './missing-exchange-closes-the-channel.html',
  styleUrl: './missing-exchange-closes-the-channel.scss'
})
export class MissingExchangeClosesTheChannelSubtopic {
  topicLabel = 'RabbitMQ Exchanges';
  topicRoute = '/messaging/rabbitmq-exchanges';

  theory: TheoryPoint[] = [
    {
      heading: 'Missing exchange versus unroutable message',
      points: [
        'The fourth mistake block said a message published to a non-existent exchange is "silently dropped". RabbitMQ\'s publisher guide says the opposite: publishing to a non-existent exchange is a channel error, and the channel is closed so nothing more can be published or done on it.',
        'The silent drop belongs to a different situation: the exchange exists but no binding matches the routing key. That message is discarded (or handed to an alternate exchange), and the channel stays open.',
        'Because <code>publish()</code> in amqplib is fire-and-forget, the error arrives later as an event on the channel, not as an exception thrown at the call. Attach <code>error</code> and <code>close</code> handlers, or the failure is easy to miss.'
      ]
    },
    {
      heading: 'Why assertExchange is the wrong typo guard',
      points: [
        'The old fix said to assert the exchange before publishing "to catch typos". In amqplib, asserting an exchange creates it when it is absent, so asserting the typo\'d name simply creates a brand-new exchange with that name.',
        'Publishing to it then no longer errors. With no queue bound to that new exchange, every message is silently dropped, which is a worse outcome than a loud channel error.',
        'To verify that an existing exchange is really there, use <code>checkExchange</code>. It fails if the exchange is missing, but that failure is itself a channel error, so run the check on a dedicated channel you can afford to lose (for example at startup).'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: missing vs unroutable',
      language: 'typescript',
      code: `class Channel {
  open = true;
  log: string[] = [];
  constructor(private exchanges: Map<string, string[]>) {}   // exchange -> bound routing keys

  publish(ex: string, key: string) {
    if (!this.open) throw new Error('Channel closed');
    const keys = this.exchanges.get(ex);
    if (!keys) { this.open = false; this.log.push('404 NOT_FOUND - no exchange ' + ex); return; }
    if (!keys.includes(key)) this.log.push('dropped: no binding for ' + key);
  }
  assertExchange(ex: string) { if (!this.exchanges.has(ex)) this.exchanges.set(ex, []); }
}

const exchanges = new Map([['notifications', ['email']]]);
const ch = new Channel(exchanges);

ch.publish('notifications', 'sms');          // exchange exists, no binding for 'sms'
console.log(ch.open, ch.log);                // true  [ 'dropped: no binding for sms' ]

ch.publish('notification', 'email');         // typo: no such exchange
console.log(ch.open, ch.log);                // false [ ..., '404 NOT_FOUND - no exchange notification' ]

try { ch.publish('notifications', 'email'); } catch (e) { console.log((e as Error).message); }  // Channel closed

// assertExchange on the typo creates it instead of catching it:
const ch2 = new Channel(exchanges);
ch2.assertExchange('notification');
ch2.publish('notification', 'email');
console.log(ch2.open, ch2.log);              // true  [ 'dropped: no binding for email' ]  <- silent again`
    },
    {
      label: 'Guarding it in amqplib',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

const conn = await amqplib.connect('amqp://localhost');

// Startup check on a throwaway channel: a missing exchange closes THIS channel only.
const checker = await conn.createChannel();
checker.on('error', (err) => console.error('exchange check failed', err.message));
await checker.checkExchange('notifications');
await checker.close();

// The channel you publish on: always listen for errors and closes.
const ch = await conn.createChannel();
ch.on('error', (err) => console.error('channel error', err.message));
ch.on('close', () => console.warn('channel closed, recreate it'));
ch.publish('notifications', 'email', Buffer.from('hello'));`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A producer publishes to <code>notification</code> (a typo, that exchange does not exist) on a channel with no <code>error</code> handler, and then publishes a second message to the correct <code>notifications</code> exchange on the same channel. What happens to each message, and why?',
    hint: 'A missing exchange is a channel error. What can a closed channel still do?',
    solution: 'The first publish triggers a 404 NOT_FOUND channel error and the broker closes the channel; the message is not delivered anywhere. The second publish is attempted on a channel that is now closed, so it fails as well (amqplib reports that the channel is closed) even though notifications exists. With no error handler the first failure is easy to miss, so the second message is lost too.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'AMQP silently drops messages published to an exchange that does not exist.',
      reality: 'It raises a channel error and closes the channel. Only messages to an <em>existing</em> exchange that match no binding are silently dropped.'
    },
    {
      thought: 'Calling <code>assertExchange</code> before publishing catches exchange-name typos.',
      reality: 'It creates the exchange under whatever name you pass, so a typo becomes a new exchange with no bindings and every message to it is dropped silently. Use <code>checkExchange</code> to verify existence.'
    },
    {
      thought: 'A publish to a bad exchange throws at the call site.',
      reality: 'Publishing is fire-and-forget. The failure surfaces later as an <code>error</code> event and a <code>close</code> event on the channel, which is why handlers for both matter.'
    }
  ];
}
