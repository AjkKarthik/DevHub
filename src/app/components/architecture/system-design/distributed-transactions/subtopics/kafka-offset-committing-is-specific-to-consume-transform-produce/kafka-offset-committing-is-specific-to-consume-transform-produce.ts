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
  templateUrl: './kafka-offset-committing-is-specific-to-consume-transform-produce.html',
  styleUrl: './kafka-offset-committing-is-specific-to-consume-transform-produce.scss'
})
export class KafkaOffsetCommittingIsSpecificToConsumeTransformProduceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A one-line description that quietly assumed one specific Kafka usage pattern',
      points: [
        'The main page originally described Kafka transactions in a single sentence: "producer writes to topic + marks offset as committed in a single atomic operation." Checking this against Kafka\'s own transaction API reveals it describes ONE specific, common Kafka usage pattern accurately — but presents it as if it describes what every Kafka transaction does. The page has been tightened.',
        'This matters because a plain Kafka producer — one that is not consuming from any input topic at all, just producing new records (e.g. writing an outbox event, or emitting a domain event from a non-streaming service) — has no consumer offset to commit in the first place. The original phrasing would leave a reader wondering what "the offset" even refers to in that simpler, very common case.',
      ]
    },
    {
      heading: 'What Kafka transactions actually guarantee, split by use case',
      points: [
        'For ANY Kafka transaction (the general case): the guarantee is atomic writes across multiple partitions and/or topics — either every record in the transaction becomes visible to consumers, or none of them do. This applies whether or not the producer is also consuming from anything.',
        'For the CONSUME-TRANSFORM-PRODUCE pattern specifically (a stream-processing service that reads from an input topic, transforms records, and writes to an output topic): Kafka\'s transactional API adds a further capability via sendOffsetsToTransaction() — it lets the consumer\'s own progress marker (how far it has read on the INPUT topic) be committed as part of the SAME atomic transaction as the produced OUTPUT records.',
        'This offset-commit capability is what makes stream processing "exactly-once" in practice: if the process crashes mid-transaction, EITHER both the output records AND the advanced input offset are visible together, OR neither is — there is no window where the output was written but the input offset was not advanced (which would cause the same input record to be reprocessed and produce a duplicate output on restart).',
      ]
    },
    {
      heading: 'Why the distinction matters when applying this pattern to the page\'s own outbox example',
      points: [
        'The main page\'s own Outbox pattern example — a service writing business data plus an outbox event in the SAME database transaction, with a separate relay publishing to Kafka — is a case where the Kafka producer side is NOT consuming from any Kafka input topic at all. There is no consumer offset in this picture to commit atomically with anything; the atomicity being achieved here is between the DATABASE write and the outbox row, a different guarantee from Kafka\'s own transactional offset-commit feature.',
        'Recognizing which of the two Kafka-transaction use cases actually applies to a given service avoids reaching for sendOffsetsToTransaction()-style reasoning (and the added complexity of a consumer group / input offset tracking) in a scenario — like a plain outbox relay — that never needed it in the first place.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two different Kafka transaction shapes',
      language: 'typescript',
      code: `interface KafkaTransactionShape {
  usage: string;
  guarantee: string;
  involvesConsumerOffset: boolean;
}

const shapes: KafkaTransactionShape[] = [
  {
    usage: 'Plain producer (e.g. outbox relay, no input topic)',
    guarantee:
      'Atomic write across multiple output partitions/topics -- ' +
      'all records become visible together, or none do.',
    involvesConsumerOffset: false, // there is no input topic to have an offset on
  },
  {
    usage: 'Consume-transform-produce (stream processing)',
    guarantee:
      'The above, PLUS: the consumer\'s own input-topic offset ' +
      'is committed as part of the SAME atomic transaction, via ' +
      'sendOffsetsToTransaction().',
    involvesConsumerOffset: true,
  },
];

// The main page's own outbox example is the FIRST shape -- a
// relay producing events has no input-topic offset to commit,
// so "marks offset as committed" never applied to it at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team building an outbox relay (reading unpublished rows from a database table and publishing them to Kafka — no Kafka input topic involved at all) reads that "Kafka transactions atomically commit offsets" and starts researching how to call sendOffsetsToTransaction() in their relay. Is this the right mechanism for their use case?',
    hint: 'Does the outbox relay consume from any Kafka topic at all — and if not, is there a consumer offset for sendOffsetsToTransaction() to commit?',
    solution: 'No — sendOffsetsToTransaction() is specifically for the consume-transform-produce pattern, where a service reads from a Kafka INPUT topic and needs its progress marker on that input committed atomically with its produced output. An outbox relay has no Kafka input topic at all (it reads from a database table, not Kafka) — there is no consumer offset in this picture for that API to commit. The relay only needs Kafka\'s general transactional guarantee (atomic writes across the output records it produces, if it needs to write to multiple partitions/topics atomically) — reaching for sendOffsetsToTransaction() and consumer-group offset tracking would be solving a problem the relay does not actually have.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Every Kafka transaction inherently involves committing a consumer offset as part of the atomic operation.',
      reality: 'Per this subtopic\'s theory, offset-committing is specific to the consume-transform-produce pattern via sendOffsetsToTransaction() — a plain producer with no input topic (like an outbox relay) has no consumer offset in the picture at all.'
    },
    {
      thought: 'The main page\'s own outbox pattern example needs Kafka\'s offset-committing transaction feature to work correctly.',
      reality: 'Per this subtopic\'s theory, the outbox pattern\'s atomicity guarantee comes from the DATABASE transaction (writing the business row and outbox row together) — the relay\'s Kafka-side publishing is a separate concern that does not involve consuming from Kafka at all, so there is no consumer offset for Kafka\'s transactional API to commit there.'
    },
    {
      thought: 'sendOffsetsToTransaction() is an optional performance optimization for stream processing, not central to what makes it work correctly.',
      reality: 'Per this subtopic\'s theory, this method is precisely what closes the gap that would otherwise let a crash mid-transaction leave output written but the input offset not advanced — without it, a restart could reprocess the same input record and produce a duplicate output.'
    }
  ];
}
