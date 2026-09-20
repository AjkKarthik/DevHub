import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-mp-claim',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './claim-check-limits-and-byte-length.html',
  styleUrl: './claim-check-limits-and-byte-length.scss'
})
export class ClaimCheckLimitsAndByteLengthSubtopic {
  topicLabel = 'Enterprise Messaging Patterns';
  topicRoute = '/messaging/messaging-patterns';

  theory: TheoryPoint[] = [
    {
      heading: 'The size limits on the page were stale or wrong',
      points: [
        'The Claim Check theory listed "SQS: 256KB, Kafka: default 1MB", and a mistake block said "Kafka and RabbitMQ have message size limits (default 1MB)". AWS increased the SQS maximum message payload from 256 KiB to 1 MiB on 4 August 2025, for both standard and FIFO queues, so 256 KB is now the old figure.',
        'RabbitMQ does not default to 1MB. RabbitMQ 4.0 reduced the default <code>max_message_size</code> to 16 MiB, down from 128 MiB in the 3.8 to 3.13 releases, and it is configurable in <code>rabbitmq.conf</code>.',
        'Kafka is the closest to the old claim: the producer <code>max.request.size</code> defaults to 1048576 bytes and the broker <code>message.max.bytes</code> default was set to 1048588 bytes, about 1MB. The two settings have to be aligned, or the producer or broker rejects the record.'
      ]
    },
    {
      heading: 'Measure bytes, not string length',
      points: [
        'The Claim Check code sample decided whether a payload was too large with <code>json.length &gt; 900_000</code>. <code>length</code> counts UTF-16 code units, not bytes. A payload full of non-ASCII characters is much larger on the wire than its length suggests.',
        'A JSON string of 400,000 euro signs has a length of about 400,000 but takes about 1.2 million bytes in UTF-8, so a length check lets it through and the broker rejects it. The sample now uses <code>Buffer.byteLength</code>.',
        'Brokers also slow down well before the hard limit, which is why the pattern is worth using for big payloads even when the broker would technically accept them. Pick a threshold below the smallest limit among the brokers you use.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: length vs bytes',
      language: 'typescript',
      code: `// A payload of 400,000 euro signs (each takes 3 bytes in UTF-8)
const json = JSON.stringify({ note: '\\u20ac'.repeat(400000) });

console.log(json.length);                    // 400011   string length (UTF-16 code units)
console.log(Buffer.byteLength(json));        // 1200011  bytes on the wire

console.log(json.length > 900_000);                  // false  the old check lets it through
console.log(Buffer.byteLength(json) > 900_000);      // true   measuring bytes catches it`
    },
    {
      label: 'A claim-check threshold in bytes',
      language: 'typescript',
      code: `// Kafka: about 1MB by default. RabbitMQ: 16 MiB (4.0+). SQS: 1 MiB (since August 2025).
// Use a threshold below the smallest limit you must respect.
const CLAIM_CHECK_THRESHOLD_BYTES = 900_000;

async function publish(payload: object) {
  const json = JSON.stringify(payload);
  if (Buffer.byteLength(json) > CLAIM_CHECK_THRESHOLD_BYTES) {
    const ref = await storeInObjectStorage(json);           // S3 / Blob upload
    return send({ type: 'claim-check', ref });
  }
  return send({ type: 'inline', data: payload });
}`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A service publishes JSON that is mostly non-ASCII text. Its claim-check test is <code>json.length &gt; 900_000</code> and the broker limit is about 1MB. Why can a payload that passes the test still be rejected, and what should the test use?',
    hint: 'What does length count, and how many bytes does a character like the euro sign take in UTF-8?',
    solution: 'String length counts UTF-16 code units, not bytes. A non-ASCII character such as the euro sign is one code unit but three UTF-8 bytes, so a payload with a length under 900,000 can be well over 1MB on the wire and be rejected. The test should use Buffer.byteLength(json) (the UTF-8 size) against a threshold below the broker limit.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SQS messages are limited to 256KB.',
      reality: 'That was the limit until AWS raised it to 1 MiB on 4 August 2025. The 256 KiB figure still appears in older code and docs.'
    },
    {
      thought: 'RabbitMQ and Kafka both default to a 1MB message limit.',
      reality: 'Kafka is about 1MB. RabbitMQ 4.0 and later default to 16 MiB (128 MiB in 3.8 to 3.13).'
    },
    {
      thought: '<code>string.length</code> is the size of the message.',
      reality: 'It is the number of UTF-16 code units. The size on the wire is the byte length, which <code>Buffer.byteLength</code> gives you.'
    }
  ];
}
