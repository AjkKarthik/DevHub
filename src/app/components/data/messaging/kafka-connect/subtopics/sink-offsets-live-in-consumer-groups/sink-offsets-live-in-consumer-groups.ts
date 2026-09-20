import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-kc-offsets',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sink-offsets-live-in-consumer-groups.html',
  styleUrl: './sink-offsets-live-in-consumer-groups.scss'
})
export class SinkOffsetsLiveInConsumerGroupsSubtopic {
  topicLabel = 'Kafka Connect';
  topicRoute = '/messaging/kafka-connect';

  theory: TheoryPoint[] = [
    {
      heading: 'Two kinds of offset, two places',
      points: [
        'The page said connector offsets are stored in a Kafka topic, "connect-offsets". That describes only source connectors. A source connector\'s offset is a position in the external system (a log position, a table id), and Connect keeps it in an offsets topic that you set with <code>offset.storage.topic</code> in distributed mode.',
        'A sink connector has no such position to track: it reads Kafka topics. Its offsets are ordinary consumer group offsets in <code>__consumer_offsets</code>, under a group named <code>connect-&lt;connector name&gt;</code> by default. KIP-875 says resetting a sink connector\'s offsets is done by deleting that consumer group.',
        'So the Elasticsearch sink in the page\'s own example resumes from the consumer group <code>connect-elasticsearch-sink</code>, while the Debezium Postgres source resumes from the offsets topic.'
      ]
    },
    {
      heading: 'What that changes in practice',
      points: [
        'Lag for a sink connector is visible with the normal consumer group tooling, for example <code>kafka-consumer-groups.sh --describe</code> on the connect group. The offsets topic tells you nothing about a sink.',
        'The page\'s crashed-worker answer holds for both types: offsets live in Kafka, not on the worker, so a surviving worker resumes the task from the committed position. For a source connector the replication of the offsets topic matters; for a sink, the replication of <code>__consumer_offsets</code> does.',
        'Since Kafka 3.6, KIP-875 adds REST endpoints to read, alter and reset offsets: <code>GET</code>, <code>PATCH</code> and <code>DELETE</code> on <code>/connectors/{name}/offsets</code>. The connector must be in the new STOPPED state (<code>PUT /connectors/{name}/stop</code>) to alter or reset them.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: where does this connector resume from?',
      language: 'typescript',
      code: `function offsetsFor(kind: 'source' | 'sink', name: string): string {
  return kind === 'source'
    ? 'offset.storage.topic (positions in the source system)'
    : 'consumer group connect-' + name + ' in __consumer_offsets';
}

console.log(offsetsFor('source', 'postgres-cdc'));
// offset.storage.topic (positions in the source system)
console.log(offsetsFor('sink', 'elasticsearch-sink'));
// consumer group connect-elasticsearch-sink in __consumer_offsets`
    },
    {
      label: 'Inspecting and resetting offsets',
      language: 'bash',
      code: `# Sink connector: normal consumer group tooling
kafka-consumer-groups.sh --bootstrap-server broker:9092 --describe --group connect-elasticsearch-sink

# Any connector (Kafka 3.6+, KIP-875): read offsets over REST
curl http://connect:8083/connectors/elasticsearch-sink/offsets

# To alter or reset offsets the connector must be STOPPED first
curl -X PUT    http://connect:8083/connectors/elasticsearch-sink/stop
curl -X DELETE http://connect:8083/connectors/elasticsearch-sink/offsets   # reset
curl -X PUT    http://connect:8083/connectors/elasticsearch-sink/resume`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Your <code>elasticsearch-sink</code> connector is falling behind. Where do you look for its lag, and can you find its progress by reading the <code>connect-offsets</code> topic?',
    hint: 'Sink connectors read from Kafka topics.',
    solution: 'Look at the consumer group connect-elasticsearch-sink with kafka-consumer-groups.sh --describe: a sink connector\'s offsets are ordinary consumer group offsets in __consumer_offsets. The connect-offsets topic holds source connector positions, so it will not show the sink\'s progress.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'All Kafka Connect offsets are stored in the <code>connect-offsets</code> topic.',
      reality: 'That is where source connectors keep their positions. Sink connector offsets are consumer group offsets in <code>__consumer_offsets</code>.'
    },
    {
      thought: 'The offsets topic name is always <code>connect-offsets</code>.',
      reality: 'In distributed mode you set it with <code>offset.storage.topic</code>. The name in the page is a common choice, not a built-in rule.'
    },
    {
      thought: 'I can reset a running connector\'s offsets with a REST call.',
      reality: 'KIP-875 requires the connector to be in the STOPPED state before offsets can be altered or reset.'
    }
  ];
}
