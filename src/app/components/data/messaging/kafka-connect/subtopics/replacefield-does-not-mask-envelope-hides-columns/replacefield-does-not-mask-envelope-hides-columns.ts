import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-kc-mask',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './replacefield-does-not-mask-envelope-hides-columns.html',
  styleUrl: './replacefield-does-not-mask-envelope-hides-columns.scss'
})
export class ReplacefieldDoesNotMaskEnvelopeHidesColumnsSubtopic {
  topicLabel = 'Kafka Connect';
  topicRoute = '/messaging/kafka-connect';

  theory: TheoryPoint[] = [
    {
      heading: 'Two problems in the "mask sensitive columns" example',
      points: [
        'The Debezium example used the <code>ReplaceField$Value</code> SMT with a <code>blacklist</code> setting and the comment "mask sensitive columns", and the theory said ReplaceField can mask. Confluent\'s documentation describes ReplaceField as filtering or renaming fields, with the properties <code>exclude</code>, <code>include</code> and <code>renames</code>. It does not mask values.',
        'Masking is a separate SMT, <code>MaskField</code>, which replaces the chosen fields with a type-appropriate null or a replacement value you supply. The page already listed MaskField in its own SMT answer; the example just did not use it.',
        'The second problem is where the column is. A raw Debezium record is an envelope with <code>before</code>, <code>after</code>, <code>source</code> and <code>op</code>; the row columns sit inside <code>before</code> and <code>after</code>. A top-level ReplaceField or MaskField only sees those envelope fields, so <code>credit_card_number</code> is not in reach.'
      ]
    },
    {
      heading: 'Three ways to do it properly',
      points: [
        'Keep the column out at the source: the Debezium connector property <code>column.exclude.list</code> takes fully qualified names such as <code>public.orders.credit_card_number</code>, so the value never reaches Kafka. The main page example now uses this.',
        'Or unwrap first and mask second: chain <code>ExtractNewRecordState</code> to flatten the envelope to the row state, then <code>MaskField$Value</code> on <code>credit_card_number</code>. SMTs run in the order listed, and the result loses the before state and operation type unless you configure the unwrap to add them back.',
        'Whichever you choose, check the actual topic contents afterwards. A transform that silently does nothing leaves the sensitive value in plain text.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: which transform sees the column',
      language: 'typescript',
      code: `type Rec = Record<string, any>;

// Approximations of the SMTs, applied to the top level of whatever record they receive.
const replaceFieldExclude = (r: Rec, fields: string[]) =>
  Object.fromEntries(Object.entries(r).filter(([k]) => !fields.includes(k)));
const maskField = (r: Rec, fields: string[], replacement: unknown = null) => ({
  ...r,
  ...Object.fromEntries(fields.filter(f => f in r).map(f => [f, replacement])),
});
const unwrap = (r: Rec) => r.after;                          // ExtractNewRecordState, roughly

const envelope = { before: null, after: { id: 1, credit_card_number: '4111111111111111' }, op: 'c' };

console.log(JSON.stringify(replaceFieldExclude(envelope, ['credit_card_number'])));
// {"before":null,"after":{"id":1,"credit_card_number":"4111111111111111"},"op":"c"}   <- untouched: the column is nested
console.log(JSON.stringify(maskField(envelope, ['credit_card_number'])));
// same result: MaskField also only sees the envelope fields
console.log(JSON.stringify(maskField(unwrap(envelope), ['credit_card_number'])));
// {"id":1,"credit_card_number":null}     <- unwrap first, then mask
console.log(JSON.stringify(replaceFieldExclude(unwrap(envelope), ['credit_card_number'])));
// {"id":1}                               <- ReplaceField after unwrap DROPS the field; it does not mask it`
    },
    {
      label: 'Connector configs',
      language: 'typescript',
      code: `// Option 1: never emit the column (Debezium connector property).
const excludeAtSource = {
  'column.exclude.list': 'public.orders.credit_card_number',
};

// Option 2: unwrap the envelope first, then mask. SMTs run in the order of 'transforms'.
const unwrapThenMask = {
  'transforms':                        'unwrap,maskCard',
  'transforms.unwrap.type':            'io.debezium.transforms.ExtractNewRecordState',
  'transforms.maskCard.type':          'org.apache.kafka.connect.transforms.MaskField$Value',
  'transforms.maskCard.fields':        'credit_card_number',
  // optional: 'transforms.maskCard.replacement': '****'
};`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A Debezium topic value looks like <code>{ before, after, op }</code> with <code>credit_card_number</code> inside <code>after</code>. You add <code>ReplaceField$Value</code> with <code>exclude=credit_card_number</code>. What appears in the topic, and how would you get a masked value instead?',
    hint: 'Which fields does a top-level transform see, and what does ReplaceField do to a field it finds?',
    solution: 'Nothing changes: the transform only sees the envelope fields before, after and op, so the nested credit_card_number is untouched and still in plain text. Even after unwrapping, ReplaceField would drop the field rather than mask it. To mask, chain ExtractNewRecordState and then MaskField$Value on credit_card_number (giving null or your replacement), or keep the column out entirely with the connector property column.exclude.list.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>ReplaceField</code> masks sensitive columns.',
      reality: 'It filters or renames fields. Masking is <code>MaskField</code>, which replaces the value with a null or a replacement.'
    },
    {
      thought: 'A field-level SMT can reach any column in a Debezium record.',
      reality: 'On the raw record the columns are nested inside the before and after structs. A top-level SMT only sees the envelope fields, so unwrap first or exclude the column in the connector.'
    },
    {
      thought: 'If the transform is configured, the data is safe.',
      reality: 'A transform that does not match anything does nothing silently. Inspect the resulting topic to confirm the value is really gone.'
    }
  ];
}
