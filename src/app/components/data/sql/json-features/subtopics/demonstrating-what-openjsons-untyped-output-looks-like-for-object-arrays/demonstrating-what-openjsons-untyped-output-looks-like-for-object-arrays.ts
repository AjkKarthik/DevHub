import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-demonstrating-openjson-untyped-object-arrays-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-what-openjsons-untyped-output-looks-like-for-object-arrays.html',
  styleUrl: './demonstrating-what-openjsons-untyped-output-looks-like-for-object-arrays.scss',
})
export class DemonstratingWhatOpenjsonsUntypedOutputLooksLikeForObjectArraysSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Page\'s Own "Untyped" Example Only Shows the Easy Case',
      points: [
        'The main page\'s own "OPENJSON without schema" example demonstrates a FLAT object with only scalar values — name, age, active — never showing the more commonly confusing case: an array of OBJECTS, like the page\'s own "items" array from its very first example (an array of {"id":..,"qty":..} entries).',
        'For a flat scalar object, the value column\'s content is intuitive (the string "Alice", the number 30). For an array of objects, the value column\'s content is genuinely surprising the first time you see it: it is NOT the individual id/qty scalars — it is the ENTIRE nested object, serialized back into a JSON text string.',
      ],
    },
    {
      heading: 'Why the WITH Clause + Path Syntax Is the Strongly Preferred Pattern',
      points: [
        'To actually extract id and qty as separate typed scalar columns from an untyped OPENJSON result over an object array, you need a SECOND OPENJSON call per row — CROSS APPLY OPENJSON(value) WITH (id INT, qty INT) — shredding the already-shredded value column one level further.',
        'This is exactly why the page\'s own FIRST OPENJSON example correctly uses the WITH clause with explicit path syntax (WITH (id INT \'$.id\', qty INT \'$.qty\')) — it accomplishes in ONE call what the untyped approach would require TWO nested calls to achieve, while also producing properly typed columns directly usable in a JOIN.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'OPENJSON without WITH, against an array of objects',
      language: 'sql',
      code: `DECLARE @json NVARCHAR(MAX) = N'{"items":[{"id":1,"qty":3},{"id":5,"qty":1}]}';

SELECT [key], value, type
FROM OPENJSON(@json, '$.items');

-- Results:
-- key: 0, value: {"id":1,"qty":3}, type: 3   (3 = object)
-- key: 1, value: {"id":5,"qty":1}, type: 3   (3 = object)

-- "key" is the ARRAY INDEX (0, 1, ...), not a field name.
-- "value" is NOT the scalar id or qty -- it is the ENTIRE nested
-- object, re-serialized as a JSON text string. You cannot directly
-- compare value = 1 or extract .id from it without further parsing.
-- "type" = 3 confirms each array element is itself a JSON object.`,
    },
    {
      label: 'Extracting id/qty requires a SECOND, nested OPENJSON call',
      language: 'sql',
      code: `DECLARE @json NVARCHAR(MAX) = N'{"items":[{"id":1,"qty":3},{"id":5,"qty":1}]}';

SELECT outer_items.[key] AS ArrayIndex, inner_fields.id, inner_fields.qty
FROM OPENJSON(@json, '$.items') AS outer_items
CROSS APPLY OPENJSON(outer_items.value)
    WITH (id INT '$.id', qty INT '$.qty') AS inner_fields;

-- ArrayIndex: 0, id: 1, qty: 3
-- ArrayIndex: 1, id: 5, qty: 1
-- Two OPENJSON calls were needed: the outer one shreds the array into
-- one row per object (as raw JSON text), the inner one shreds EACH of
-- those text values into typed scalar columns.`,
    },
    {
      label: 'The page\'s own preferred pattern — one call, WITH + path syntax',
      language: 'sql',
      code: `DECLARE @json NVARCHAR(MAX) = N'{"items":[{"id":1,"qty":3},{"id":5,"qty":1}]}';

-- The main page's own first example -- already the correct approach:
SELECT j.id AS ProductID, j.qty AS Quantity
FROM OPENJSON(@json, '$.items')
    WITH (id INT '$.id', qty INT '$.qty') AS j;

-- ProductID: 1, Quantity: 3
-- ProductID: 5, Quantity: 1
-- Same result as the two-call version above, in a SINGLE OPENJSON
-- call -- the WITH clause's path syntax ('$.id', '$.qty') tells
-- OPENJSON to shred each array element's nested fields directly into
-- typed columns, skipping the intermediate raw-JSON-text step entirely.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer new to OPENJSON writes <code>SELECT value FROM OPENJSON(@json, \'$.items\') WHERE value = 1</code>, expecting to filter for items with id = 1, based on the main page\'s own "OPENJSON without schema" example where value held a clean scalar. The query runs without error but returns zero rows, even though an item with id = 1 genuinely exists in the array. What\'s actually being compared, and why does the WITH-clause version avoid this problem entirely?',
    hint: 'Check what the "value" column actually contains for THIS array — a scalar like the page\'s flat-object example, or something else — before assuming <code>value = 1</code> is comparing against the id field.',
    solution: `The query returns zero rows because "value" for this items array is
NOT the scalar id -- it's the entire nested object serialized as a
JSON text string, e.g. '{"id":1,"qty":3}'. Comparing that string
against the integer 1 with value = 1 can never match, regardless of
what id value the object actually contains -- the comparison is
between a JSON object's text representation and an unrelated integer,
not between the id field and 1.

The main page's own WITH-clause version avoids this entirely by using
path syntax (id INT '$.id') to shred each array element's nested id
field directly into its own properly-typed column at the SAME level as
qty -- there is no intermediate "raw JSON text" value to accidentally
compare against a scalar. WHERE j.id = 1 (using the WITH-clause
version's typed id column) would correctly match, because it compares
an actual extracted INT value, not a serialized object string.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the "value" column returned by OPENJSON without a WITH clause always contains a clean scalar value, matching the behavior shown in the main page\'s own flat-object example.',
      reality: 'for an array of objects (rather than an array of scalars), "value" contains the entire nested object re-serialized as a JSON text string — a fundamentally different, much less directly usable result than a scalar.',
    },
    {
      thought: 'OPENJSON always fully shreds a JSON structure into individual scalar fields in one call, regardless of how the call is written.',
      reality: 'a single OPENJSON call without a WITH clause only shreds ONE LEVEL of nesting — for an array of objects, that one level produces rows containing the objects themselves (as text), not their individual fields, requiring either a second nested OPENJSON call or the WITH-clause path syntax to go one level deeper.',
    },
    {
      thought: 'the WITH clause in OPENJSON is primarily a convenience for naming columns — the underlying shredding behavior is the same with or without it.',
      reality: 'the WITH clause with path syntax changes what gets shredded, not just how it\'s labeled — it reaches directly into each array element\'s nested fields in one step, avoiding the intermediate raw-JSON-text stage that the untyped, no-WITH-clause version produces.',
    },
  ];
}
