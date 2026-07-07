import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-merge-wipes-nested-keys-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-merge-silently-wipes-out-nested-keys-instead-of-deep-merging.html',
  styleUrl: './testing-that-merge-silently-wipes-out-nested-keys-instead-of-deep-merging.scss',
})
export class TestingThatMergeSilentlyWipesOutNestedKeysInsteadOfDeepMergingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Limitation Stated, Never Demonstrated as Data Loss',
      points: [
        'The main page\'s own theory states the || operator "cannot target a nested path — only works at the top level of the document." This is technically accurate but stated so briefly that its actual consequence — silent, permanent data loss — is easy to miss. The page\'s own "Hybrid schema pattern" example only merges TOP-LEVEL keys (tracking_id, shipped_at), which happens to work correctly and never demonstrates what goes wrong with a nested key.',
        'When the right-hand side of || contains a key that already exists in the left-hand document, || REPLACES that key\'s entire value wholesale — it does not recursively merge nested objects. If that key\'s existing value was itself an object with several fields, all of those fields are silently discarded unless the replacement object happens to repeat them.',
      ],
    },
    {
      heading: 'The Fix Requires an Explicit Nested Merge',
      points: [
        'jsonb_set() with an explicit path can update a single nested key without touching its siblings: jsonb_set(data, \'{address,zip}\', \'"12345"\'). For merging several nested keys into an existing sub-object without losing the ones not mentioned, extract the sub-object, merge into IT with ||, then set it back: jsonb_set(data, \'{address}\', (data->\'address\') || \'{"zip":"12345"}\').',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the data loss',
      language: 'sql',
      code: `-- A document with a nested address object containing TWO fields:
INSERT INTO events (payload) VALUES
('{"type":"order","address":{"city":"London","country":"UK"}}');

-- Naive expectation: merging {"address":{"zip":"12345"}} should ADD
-- zip while keeping city and country -- like a deep merge:
UPDATE events
SET payload = payload || '{"address":{"zip":"12345"}}'
WHERE payload->>'type' = 'order';

SELECT payload->'address' AS address FROM events WHERE payload->>'type' = 'order';
-- Returns: {"zip": "12345"}
-- city and country are GONE -- || replaced the entire top-level
-- "address" value with the right-hand side's "address" value,
-- rather than merging their nested contents.`,
    },
    {
      label: 'The fix — merge the nested sub-object explicitly',
      language: 'sql',
      code: `-- Reset the fixture
UPDATE events SET payload = '{"type":"order","address":{"city":"London","country":"UK"}}'
WHERE payload->>'type' = 'order';

-- Correct approach: extract the existing sub-object, merge INTO it,
-- then set the result back at the same path:
UPDATE events
SET payload = jsonb_set(
    payload,
    '{address}',
    (payload->'address') || '{"zip":"12345"}'
)
WHERE payload->>'type' = 'order';

SELECT payload->'address' AS address FROM events WHERE payload->>'type' = 'order';
-- Returns: {"city": "London", "country": "UK", "zip": "12345"}
-- All three fields preserved -- the nested merge happened on the
-- sub-object itself, not on the whole document.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team follows the main page\'s own <code>||</code> merge pattern to add a <code>tracking_id</code> field to an order\'s existing <code>shipping: {"carrier": "UPS", "method": "ground"}</code> nested object, writing <code>payload || \'{"shipping":{"tracking_id":"TRK123"}}\'</code>. After deploying, customer support reports that shipping carrier information has disappeared from many recent orders. What happened, and how would the fix from the second code tab prevent this?',
    hint: 'Check what the "shipping" key looked like BEFORE the update, and what the right-hand side of the || operator actually replaces it with.',
    solution: `The || operator replaced the entire "shipping" value with the
right-hand side's "shipping" value, which only contained tracking_id --
it did not merge tracking_id into the EXISTING shipping object. Since
the existing shipping object had carrier and method fields that the
merge's right-hand side never mentioned, those fields were silently
discarded the moment the UPDATE ran, for every order that received
this update. This is exactly the data loss pattern demonstrated in the
first code tab, just with different field names.

The fix from the second code tab would have prevented this: instead of
payload || '{"shipping":{"tracking_id":"TRK123"}}', the correct
update extracts the existing shipping sub-object first --
jsonb_set(payload, '{shipping}', (payload->'shipping') ||
'{"tracking_id":"TRK123"}') -- merging tracking_id INTO the existing
carrier/method object rather than replacing it wholesale. This
preserves carrier and method while still adding tracking_id.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the jsonb || operator performs a recursive deep merge, so merging a partial nested object only adds or updates the specific fields mentioned, leaving sibling fields untouched.',
      reality: '|| only merges at the TOP LEVEL of the document — when a top-level key\'s value is itself an object, that entire object is replaced wholesale by the right-hand side\'s value for that key, discarding any fields not repeated in the replacement.',
    },
    {
      thought: 'the main page\'s own theory statement that || "only works at the top level" is a minor technical footnote that doesn\'t meaningfully affect how the operator should be used in practice.',
      reality: 'this limitation causes silent, permanent data loss the moment a nested key is merged with an incomplete replacement object — it is one of the most consequential details about the operator, not a footnote.',
    },
    {
      thought: 'the main page\'s own "Hybrid schema pattern" example, which uses || successfully to add tracking_id and shipped_at, demonstrates that || is generally safe to use for adding fields to a jsonb document.',
      reality: 'that example only merges TOP-LEVEL keys, which is exactly the case where || behaves safely — it does not demonstrate (and therefore does not validate) the nested-key case, which behaves completely differently.',
    },
  ];
}
