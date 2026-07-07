import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-jsonb-set-null-target-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './jsonb-set-silently-no-ops-on-a-null-target.html',
  styleUrl: './jsonb-set-silently-no-ops-on-a-null-target.scss',
})
export class JsonbSetSilentlyNoOpsOnANullTargetSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Nullable Column Breaks Its Own Update Pattern',
      points: [
        'The main page\'s own JSONB example declares custom_attrs JSONB NULL -- nullable -- and later demonstrates UPDATE products SET custom_attrs = jsonb_set(custom_attrs, \'{color}\', \'"blue"\') WHERE sku = \'SHIRT-RED-M\'; as the way to update a single key. This works correctly for a row that already has a JSONB object in custom_attrs. But jsonb_set() is a strict function: if custom_attrs IS NULL for the target row -- which the schema explicitly permits -- jsonb_set(NULL, \'{color}\', \'"blue"\') returns NULL. The UPDATE silently sets custom_attrs to NULL again, not to a fresh {"color": "blue"} object. No error, no warning -- the row\'s custom_attrs reads NULL both before and after the UPDATE, and the intended attribute is never actually stored.',
        'This is easy to miss because the main page\'s own INSERT example always supplies a full custom_attrs JSON object, so every demonstrated row already has a non-NULL JSONB value, and the jsonb_set() UPDATE example against THAT specific row genuinely works. The failure only surfaces for a different, equally valid row where custom_attrs was left NULL at insert time -- exactly the case the schema\'s own JSONB NULL declaration exists to allow.',
      ],
    },
    {
      heading: 'The Fix: Substitute an Empty Object Before jsonb_set() Ever Sees NULL',
      points: [
        'COALESCE(custom_attrs, \'{}\'::jsonb) substitutes an empty JSONB object whenever custom_attrs is NULL, before jsonb_set() runs. Wrapped around the target argument -- jsonb_set(COALESCE(custom_attrs, \'{}\'::jsonb), \'{color}\', \'"blue"\') -- a NULL starting value is now treated as an empty object to build upon, and the update correctly produces {"color": "blue"} instead of silently staying NULL.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'PostgreSQL — reproducing the silent no-op',
      language: 'sql',
      code: `-- A product row with custom_attrs left NULL (the schema explicitly allows this):
INSERT INTO products (sku, price, custom_attrs)
VALUES ('PLAIN-ITEM', 9.99, NULL);

-- The main page's own UPDATE pattern:
UPDATE products
SET custom_attrs = jsonb_set(custom_attrs, '{color}', '"blue"')
WHERE sku = 'PLAIN-ITEM';

SELECT sku, custom_attrs FROM products WHERE sku = 'PLAIN-ITEM';
-- custom_attrs is STILL NULL -- jsonb_set(NULL, ...) returned NULL.
-- No error was raised; the "blue" color was silently never stored.`,
    },
    {
      label: 'PostgreSQL — the COALESCE fix',
      language: 'sql',
      code: `UPDATE products
SET custom_attrs = jsonb_set(COALESCE(custom_attrs, '{}'::jsonb), '{color}', '"blue"')
WHERE sku = 'PLAIN-ITEM';

SELECT sku, custom_attrs FROM products WHERE sku = 'PLAIN-ITEM';
-- custom_attrs is now {"color": "blue"} -- COALESCE substituted an
-- empty object before jsonb_set() ran, so the NULL never reached it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A support ticket reports that setting a product\'s color via the app\'s "edit custom attributes" feature silently does nothing for SOME products but works fine for others. Using the schema and UPDATE pattern from the main page\'s own examples, what\'s the most likely distinguishing factor between the products where it fails and the ones where it works?',
    hint: 'The main page\'s own INSERT example always populates custom_attrs with a full JSON object. Think about which products might not have gone through that exact path.',
    solution: `The most likely distinguishing factor is whether each affected
product's custom_attrs was NULL at the time the UPDATE ran -- products
created without any custom attributes specified (custom_attrs left at
its NULL default, which the schema explicitly permits) versus products
that already had SOME JSONB object stored, even an empty {}. For the
NULL case, jsonb_set(NULL, '{color}', '"blue"') returns NULL -- the
UPDATE silently "succeeds" (no error) but leaves custom_attrs exactly
as NULL as before, so the color is never actually recorded. For the
non-NULL case, jsonb_set() correctly merges the new key into the
existing object.

The fix is the COALESCE pattern from the second code tab -- wrapping
custom_attrs in COALESCE(custom_attrs, '{}'::jsonb) before it reaches
jsonb_set() ensures a NULL starting value is treated as an empty
object rather than causing the entire function call to short-circuit
to NULL. This should be applied everywhere the application performs a
partial JSONB update, not just this one support ticket's query.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'jsonb_set(custom_attrs, \'{color}\', \'"blue"\') will correctly initialize a fresh {"color": "blue"} object even if custom_attrs starts out NULL, since the function is meant to add a key.',
      reality: 'jsonb_set() is a strict function -- if ANY argument, including the target JSONB value itself, is NULL, the entire function call returns NULL. It does not treat a NULL target as an empty object to build upon.',
    },
    {
      thought: 'if the main page\'s own UPDATE ... SET custom_attrs = jsonb_set(...) pattern works correctly for the SHIRT-RED-M example row, it will work correctly for every row in the products table.',
      reality: 'it only works for rows where custom_attrs is already a non-NULL JSONB value -- a row where custom_attrs was left at its NULL default, which the schema\'s own custom_attrs JSONB NULL declaration explicitly permits, silently fails to store the update at all.',
    },
    {
      thought: 'a JSONB UPDATE that runs without raising an error and reports a normal "success" row count must have actually applied the intended change.',
      reality: 'jsonb_set() returning NULL for a NULL target is not an error -- the UPDATE statement completes normally, updates the row, and reports success, even though the actual JSONB value written is unchanged (still NULL), silently failing to apply the intended change.',
    },
  ];
}
