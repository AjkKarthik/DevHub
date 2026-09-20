import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-sr-transitive',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './backward-checks-only-the-latest-version.html',
  styleUrl: './backward-checks-only-the-latest-version.scss'
})
export class BackwardChecksOnlyTheLatestVersionSubtopic {
  topicLabel = 'Schema Registry';
  topicRoute = '/messaging/schema-registry';

  theory: TheoryPoint[] = [
    {
      heading: 'BACKWARD is not BACKWARD_TRANSITIVE',
      points: [
        'The page told you to "set BACKWARD or FULL on all production subjects" and described BACKWARD as "new schema can read old data". Both are true, but neither says which old data the registry actually checks.',
        'Confluent\'s documentation says the default compatibility mode is BACKWARD, and that the non-transitive modes (BACKWARD, FORWARD, FULL) check a new schema only against the latest registered schema. The transitive variants check it against all previously registered schemas.',
        'With three versions (X-2, X-1, X), a transitive mode also guarantees X-2 with X, not just X-2 with X-1 and X-1 with X. So a chain of individually compatible steps can still leave the newest schema unable to read the oldest data.'
      ]
    },
    {
      heading: 'When the difference bites',
      points: [
        'The docs give a reason for BACKWARD being the default rather than the transitive form: it allows consumers to be rewound to the beginning of a topic. Rewinding through years of data means reading every schema version ever written, which is what BACKWARD_TRANSITIVE guarantees.',
        'If consumers only ever read recent data, plain BACKWARD is enough. If they might replay a topic from the start, or a compacted topic holds records from many schema generations, use a transitive mode.',
        'The upgrade order follows the mode: BACKWARD and BACKWARD_TRANSITIVE mean upgrade all consumers before producing new events; FORWARD modes mean upgrade producers first; FULL modes let you upgrade either side independently.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: latest-only vs all versions',
      language: 'typescript',
      code: `type Field = { name: string; default?: unknown };
const canRead = (reader: Field[], writer: Field[]) =>
  reader.every(f => writer.some(w => w.name === f.name) || 'default' in f);
const backward = (newS: Field[], oldS: Field[]) => canRead(newS, oldS);   // new reader, old data

const v1: Field[] = [{ name: 'id' }];
const v2: Field[] = [{ name: 'id' }, { name: 'currency', default: 'USD' }];   // compatible with v1
const v3: Field[] = [{ name: 'id' }, { name: 'currency' }];                    // default dropped

const check = (nw: Field[], previous: Field[][], transitive: boolean) =>
  (transitive ? previous : previous.slice(-1)).every(p => backward(nw, p));

console.log(check(v3, [v1, v2], false));  // true   BACKWARD looks at v2 only: currency exists there
console.log(check(v3, [v1, v2], true));   // false  BACKWARD_TRANSITIVE also checks v1: no currency, no default`
    },
    {
      label: 'Setting the mode on a subject',
      language: 'bash',
      code: `# Per-subject compatibility. The default is BACKWARD (latest version only).
curl -X PUT http://schema-registry:8081/config/orders-value \\
  -H 'Content-Type: application/vnd.schemaregistry.v1+json' \\
  -d '{"compatibility": "BACKWARD_TRANSITIVE"}'

# Read it back
curl http://schema-registry:8081/config/orders-value`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A subject has versions v1 (<code>id</code>), v2 (<code>id</code> plus <code>currency</code> with a default) and you propose v3 (<code>id</code> plus <code>currency</code> with no default). Does <code>BACKWARD</code> accept v3? Does <code>BACKWARD_TRANSITIVE</code>? Which one protects a consumer that replays the topic from the start?',
    hint: 'BACKWARD compares v3 with the latest version; the transitive mode compares it with all of them.',
    solution: 'BACKWARD accepts v3: compared with v2 only, currency exists in v2 data, so the new reader can read it. BACKWARD_TRANSITIVE rejects v3: v1 data has no currency and v3 gives it no default. A consumer replaying from the start would hit v1 records, so the transitive mode is the one that protects it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'BACKWARD means the new schema can read every old message.',
      reality: 'Only the latest registered version is checked. The guarantee for all old versions comes from BACKWARD_TRANSITIVE.'
    },
    {
      thought: 'The registry default protects consumers that replay a topic from the beginning.',
      reality: 'The default is BACKWARD, which is not transitive. Replaying old data safely needs a transitive mode.'
    },
    {
      thought: 'Every compatible step keeps the whole chain compatible.',
      reality: 'Compatibility is not transitive unless you ask for it: v2 can read v1 and v3 can read v2 without v3 being able to read v1.'
    }
  ];
}
