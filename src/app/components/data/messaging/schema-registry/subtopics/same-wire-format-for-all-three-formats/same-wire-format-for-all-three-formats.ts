import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-sr-wire',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './same-wire-format-for-all-three-formats.html',
  styleUrl: './same-wire-format-for-all-three-formats.scss'
})
export class SameWireFormatForAllThreeFormatsSubtopic {
  topicLabel = 'Schema Registry';
  topicRoute = '/messaging/schema-registry';

  theory: TheoryPoint[] = [
    {
      heading: 'JSON Schema does not embed the schema either',
      points: [
        'A theory bullet contrasted the compact schema ID that Avro and Protobuf messages carry with "embedding a full schema (like JSON Schema) in every single message". That is not how the Confluent serializers work. Confluent\'s SerDes documentation says the wire format applies uniformly to the Avro, Protobuf and JSON Schema serializers.',
        'The format is: byte 0 is the serialization format version (0 when using a schema ID, the default), bytes 1 to 4 are the 4-byte schema ID returned by Schema Registry, and the serialized data follows. The page\'s own wire-format quiz question already described it this way for all three formats; the theory bullet contradicted it.',
        'So a JSON Schema message on the wire is a 5-byte header followed by JSON. It is bigger than Avro because JSON is verbose, not because it carries a schema.'
      ]
    },
    {
      heading: 'Protobuf adds message indexes',
      points: [
        'For Protobuf there is one more piece. After the 5-byte header comes an array of indexes that correspond to the message type, then the serialized data. A Protobuf schema file can define several message types, and the indexes say which one this record is.',
        'That means the payload of a Protobuf message does not start at byte 5. A hand-written parser that assumes a fixed 5-byte header, fine for Avro and JSON Schema, will misread Protobuf records.',
        'The same wire format applies to both message keys and message values, so a keyed topic has a header on the key as well as on the value.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: where the payload starts',
      language: 'typescript',
      code: `type Format = 'avro' | 'json-schema' | 'protobuf';

// Byte 0: format version (0). Bytes 1-4: 4-byte schema ID. Protobuf: message indexes follow.
function header(format: Format, schemaId: number, indexBytes = 0) {
  return {
    magic: 0,
    schemaId,
    payloadStartsAt: 5 + (format === 'protobuf' ? indexBytes : 0),
  };
}

console.log(header('avro', 7));            // { magic: 0, schemaId: 7, payloadStartsAt: 5 }
console.log(header('json-schema', 7));     // { magic: 0, schemaId: 7, payloadStartsAt: 5 }
console.log(header('protobuf', 7, 1));     // { magic: 0, schemaId: 7, payloadStartsAt: 6 }  indexes come first`
    },
    {
      label: 'Reading the header by hand',
      language: 'typescript',
      code: `// Read the schema ID from a Confluent-framed message (any of the three formats).
function readSchemaId(buf: Buffer): number {
  if (buf[0] !== 0) throw new Error('Not a Schema Registry framed message');
  return buf.readUInt32BE(1);          // bytes 1-4, big-endian
}

// For Avro and JSON Schema the payload is buf.subarray(5).
// For Protobuf, message indexes sit between the header and the payload, so use the
// serializer library to decode; do not assume the payload starts at byte 5.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'You write a small tool that reads the schema ID from bytes 1 to 4 and treats everything from byte 5 onward as the payload. Which of Avro, Protobuf and JSON Schema messages does it read correctly, and which does it misread?',
    hint: 'Only one format puts extra data between the 5-byte header and the payload.',
    solution: 'It handles Avro and JSON Schema correctly: their payload starts at byte 5. It misreads Protobuf, where an array of message indexes sits between the 5-byte header and the payload, so the real payload starts later. The schema ID it reads is still right for all three.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'JSON Schema messages carry the whole schema, which is why they are bigger.',
      reality: 'They carry the same 5-byte header with a schema ID as Avro and Protobuf. They are bigger because JSON is verbose.'
    },
    {
      thought: 'Every framed message has exactly a 5-byte header.',
      reality: 'Avro and JSON Schema do. Protobuf adds an array of message indexes after the 5 bytes.'
    },
    {
      thought: 'Only message values are framed with a schema ID.',
      reality: 'The wire format applies to both message keys and message values.'
    }
  ];
}
