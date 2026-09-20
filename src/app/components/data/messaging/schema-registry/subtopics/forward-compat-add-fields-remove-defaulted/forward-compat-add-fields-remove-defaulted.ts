import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-sr-fwd',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './forward-compat-add-fields-remove-defaulted.html',
  styleUrl: './forward-compat-add-fields-remove-defaulted.scss'
})
export class ForwardCompatAddFieldsRemoveDefaultedSubtopic {
  topicLabel = 'Schema Registry';
  topicRoute = '/messaging/schema-registry';

  theory: TheoryPoint[] = [
    {
      heading: 'What the page said about FORWARD',
      points: [
        'The Compatibility Modes list said that under FORWARD "old fields must not be removed", and a second theory bullet said adding a new required field "could break older readers unaware of it". Confluent\'s compatibility documentation says something different.',
        'Its definitions: BACKWARD lets consumers using the new schema read data written with the old one (add optional fields, remove fields). FORWARD lets consumers using the old schema read data written with the new one (remove optional fields, add fields). FULL is both, so only adding or removing optional fields is allowed.',
        'The reason is how Avro resolves a reader schema against a writer schema. A reader can handle data if every field it expects is either present in the data or has a default. Extra fields in the data are simply ignored.'
      ]
    },
    {
      heading: 'Working out each change',
      points: [
        'Adding a field, with or without a default, is FORWARD compatible: old readers ignore it. It is only BACKWARD compatible when the field has a default, because a new reader must be able to fill it in for old data.',
        'Removing a field is BACKWARD compatible: the new reader never asks for it. It is FORWARD compatible only when the removed field had a default in the old schema; otherwise old readers still expect it and cannot fill the gap.',
        'That is why the page\'s removal advice, keep the field as a nullable type with default null, works: the default is exactly what makes the later removal FORWARD safe.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: which changes pass which mode',
      language: 'typescript',
      code: `type Field = { name: string; default?: unknown };

// A reader can read writer data if every reader field is in the writer or has a default.
const canRead = (reader: Field[], writer: Field[]) =>
  reader.every(f => writer.some(w => w.name === f.name) || 'default' in f);

const backward = (newS: Field[], oldS: Field[]) => canRead(newS, oldS);   // new reader, old data
const forward  = (newS: Field[], oldS: Field[]) => canRead(oldS, newS);   // old reader, new data

const base = [{ name: 'orderId' }, { name: 'total' }];

// Remove a field that has NO default
const v1 = [...base, { name: 'legacyCode' }];
console.log(forward(base, v1), backward(base, v1));            // false true

// Remove a field that HAS a default
const v1d = [...base, { name: 'legacyCode', default: null }];
console.log(forward(base, v1d), backward(base, v1d));          // true true

// Add a field WITHOUT a default
const addReq = [...base, { name: 'currency' }];
console.log(forward(addReq, base), backward(addReq, base));    // true false

// Add a field WITH a default
const addDef = [...base, { name: 'currency', default: 'USD' }];
console.log(forward(addDef, base), backward(addDef, base));    // true true`
    },
    {
      label: 'Summary table',
      language: 'typescript',
      code: `// Compatibility as the Confluent docs define it
//
// change                     BACKWARD   FORWARD   FULL
// add field with default        yes        yes      yes
// add field, no default         no         yes      no
// remove field with default     yes        yes      yes
// remove field, no default      yes        no       no
//
// Upgrade order: BACKWARD -> consumers first; FORWARD -> producers first; FULL -> either.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Your registry uses FORWARD compatibility. Is it allowed to (a) add a <code>currency</code> field with no default, (b) remove <code>legacyCode</code> when it has no default, (c) remove <code>legacyCode</code> when it has a default? Explain each with the reader/writer rule.',
    hint: 'Under FORWARD the old schema is the reader and the new schema is the writer. A reader needs every field it expects to be present or defaulted.',
    solution: '(a) Allowed: old readers do not know currency and ignore it. (b) Not allowed: old readers still expect legacyCode, it is absent from new data and has no default to fall back on. (c) Allowed: old readers fill legacyCode from its default when new data lacks it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'FORWARD compatibility forbids removing any field.',
      reality: 'It forbids removing a field that has no default. Removing a field with a default (an optional field) is allowed.'
    },
    {
      thought: 'Adding a required field breaks old readers.',
      reality: 'Old readers ignore fields they do not know, so adding a field is FORWARD compatible. It breaks BACKWARD compatibility unless the field has a default.'
    },
    {
      thought: 'FULL compatibility is required in regulated environments.',
      reality: 'The docs define FULL as both directions, allowing only optional-field changes. The compatibility rules do not tie it to regulated environments; choose it when producers and consumers upgrade independently.'
    }
  ];
}
