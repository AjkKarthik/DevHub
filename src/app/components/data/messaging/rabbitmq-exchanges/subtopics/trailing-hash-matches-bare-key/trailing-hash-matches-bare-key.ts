import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-rx-hash',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './trailing-hash-matches-bare-key.html',
  styleUrl: './trailing-hash-matches-bare-key.scss'
})
export class TrailingHashMatchesBareKeySubtopic {
  topicLabel = 'RabbitMQ Exchanges';
  topicRoute = '/messaging/rabbitmq-exchanges';

  theory: TheoryPoint[] = [
    {
      heading: 'What the page said versus what RabbitMQ does',
      points: [
        'The third mistake block claimed that <code>order.#</code> does not match the bare routing key <code>order</code>, and told you to add a separate exact binding for it. RabbitMQ\'s exchange documentation says the opposite: its own example shows the pattern <code>audit.events.#</code> matching <code>audit.events</code> as well as <code>audit.events.users.signup</code>.',
        'The rule is simply that <code>*</code> stands for exactly one word and <code>#</code> stands for zero or more words. Zero words means the dot before the <code>#</code> is not needed for a match, so a binding that ends in <code>.#</code> also catches the key without that tail.',
        'The page\'s own theory and quiz already said "zero or more". The mistake block contradicted them by treating the dot as required.'
      ]
    },
    {
      heading: 'Where * and # really differ',
      points: [
        '<code>order.*</code> needs one extra word: it matches <code>order.created</code> but not <code>order</code> and not <code>order.item.created</code>. <code>order.#</code> matches all three.',
        'A <code>#</code> can also sit in the middle or at the start. <code>a.#.c</code> matches both <code>a.c</code> and <code>a.b.c</code>, and <code>#.error</code> matches the bare key <code>error</code>.',
        'A binding of just <code>#</code> matches every routing key, which is why the tutorial says such a queue receives everything, like a fanout exchange.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: zero-or-more matching',
      language: 'typescript',
      code: `// * = exactly one word, # = zero or more words
function match(binding: string, key: string): boolean {
  const b = binding.split('.');
  const k = key === '' ? [] : key.split('.');
  function go(i: number, j: number): boolean {
    if (i === b.length) return j === k.length;
    if (b[i] === '#') {
      for (let n = j; n <= k.length; n++) if (go(i + 1, n)) return true;
      return false;
    }
    if (j === k.length) return false;
    if (b[i] === '*' || b[i] === k[j]) return go(i + 1, j + 1);
    return false;
  }
  return go(0, 0);
}

console.log(match('order.#', 'order'));              // true   <- the case the page got wrong
console.log(match('order.#', 'order.item.created'));  // true
console.log(match('order.*', 'order'));              // false  * needs exactly one word
console.log(match('order.*', 'order.item.created'));  // false
console.log(match('audit.events.#', 'audit.events')); // true   (the RabbitMQ docs example)
console.log(match('audit.events.#', 'audit.users'));  // false
console.log(match('*.stock.#', 'usd.stock'));        // true
console.log(match('*.stock.#', 'stock.nasdaq'));     // false  leading * needs one word first
console.log(match('#.error', 'error'));              // true
console.log(match('a.#.c', 'a.c'));                  // true`
    },
    {
      label: 'Binding it on the exchange',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

const conn = await amqplib.connect('amqp://localhost');
const ch = await conn.createChannel();
await ch.assertExchange('logs', 'topic', { durable: true });
await ch.assertQueue('order-logs', { durable: true });

// One binding is enough: order, order.created, order.item.created all arrive.
await ch.bindQueue('order-logs', 'logs', 'order.#');

// No extra 'order' binding needed.
ch.publish('logs', 'order', Buffer.from('bare key'));
ch.publish('logs', 'order.item.created', Buffer.from('deep key'));`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Which of these routing keys does the binding <code>*.stock.#</code> match: <code>usd.stock</code>, <code>eur.stock.db</code>, <code>stock.nasdaq</code>? And does <code>#.error</code> match the bare key <code>error</code>?',
    hint: 'The * needs exactly one word in its position. The # may match nothing at all.',
    solution: 'usd.stock matches: the leading star takes usd and the hash matches zero words after stock. eur.stock.db matches: the hash takes db. stock.nasdaq does not match, because the leading star needs one word before stock and the key starts with stock. #.error does match the bare key error, since the hash may match zero words.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A binding like <code>order.#</code> needs at least one word after <code>order.</code>.',
      reality: 'The <code>#</code> matches zero or more words, so <code>order.#</code> also matches the bare key <code>order</code>. RabbitMQ\'s own <code>audit.events.#</code> example matches <code>audit.events</code>.'
    },
    {
      thought: '<code>order.*</code> and <code>order.#</code> behave the same.',
      reality: 'They differ on exactly the interesting cases: <code>*</code> needs one word, so <code>order.*</code> misses both <code>order</code> and <code>order.item.created</code>, while <code>order.#</code> catches both.'
    },
    {
      thought: 'I must add a separate exact <code>order</code> binding next to <code>order.#</code> to catch the bare key.',
      reality: 'It adds nothing: the <code>order.#</code> binding already matches the bare key.'
    }
  ];
}
