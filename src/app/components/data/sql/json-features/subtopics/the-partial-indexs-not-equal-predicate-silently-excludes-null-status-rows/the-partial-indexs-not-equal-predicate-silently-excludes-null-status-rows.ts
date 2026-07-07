import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-partial-index-not-equal-null-exclusion-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './the-partial-indexs-not-equal-predicate-silently-excludes-null-status-rows.html',
  styleUrl: './the-partial-indexs-not-equal-predicate-silently-excludes-null-status-rows.scss',
})
export class ThePartialIndexsNotEqualPredicateSilentlyExcludesNullStatusRowsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Missing Key Extracts as SQL NULL, and NULL != Anything Is UNKNOWN',
      points: [
        'The main page\'s own partial GIN index example — CREATE INDEX IX_events_active ON events USING GIN (payload) WHERE payload->>\'status\' != \'archived\' — is intended to index only "active" (non-archived) events. But for any row where the status key is entirely ABSENT from the JSON payload (not merely set to some other value, but genuinely missing), payload->>\'status\' returns SQL NULL, not an empty string or a sentinel.',
        'NULL != \'archived\' evaluates to UNKNOWN under standard three-valued SQL logic, not TRUE — so any row with no status key at all is NOT included in this partial index\'s coverage, even though a reasonable application interpretation of "no status set" would typically mean "not archived," i.e., implicitly active.',
      ],
    },
    {
      heading: 'The Index and Equivalent Queries Are (at Least) Self-Consistent',
      points: [
        'A direct query using the identical predicate — SELECT * FROM events WHERE payload->>\'status\' != \'archived\' — excludes the SAME NULL-status rows for the exact same reason. So the partial index does correctly cover every row that this specific query would return; the surprise is that BOTH the index and the query silently drop rows a reasonable person might expect to see.',
        'The fix uses IS DISTINCT FROM, which treats NULL as a genuine, comparable value rather than propagating UNKNOWN: payload->>\'status\' IS DISTINCT FROM \'archived\' evaluates to TRUE when status is NULL (since NULL is indeed "distinct from" the string \'archived\'), correctly including "no status key" rows as not-archived.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the silent exclusion',
      language: 'sql',
      code: `-- Three events: one archived, one active, one with NO status key at all
INSERT INTO events (payload) VALUES
  ('{"type":"order","status":"archived"}'),
  ('{"type":"order","status":"active"}'),
  ('{"type":"order"}');                      -- no "status" key present

-- The main page's own predicate:
SELECT payload FROM events WHERE payload->>'status' != 'archived';
-- Returns only the "active" row -- the row with NO status key is
-- SILENTLY EXCLUDED, even though it was never explicitly archived.
-- payload->>'status' for that row is SQL NULL, and
-- NULL != 'archived' evaluates to UNKNOWN, not TRUE.

-- Confirm the partial index built on this same predicate has the
-- identical blind spot:
CREATE INDEX IX_events_active ON events USING GIN (payload)
WHERE payload->>'status' != 'archived';
-- The no-status-key row is NOT covered by this index -- a query
-- against it (using this exact predicate) cannot use the index to
-- find that row, because the index was never built to include it.`,
    },
    {
      label: 'The fix — IS DISTINCT FROM treats NULL as a real value',
      language: 'sql',
      code: `-- Correct predicate: NULL genuinely "is distinct from" 'archived'
SELECT payload FROM events WHERE payload->>'status' IS DISTINCT FROM 'archived';
-- Returns BOTH the "active" row AND the no-status-key row --
-- IS DISTINCT FROM does not propagate NULL as UNKNOWN the way
-- standard != does; NULL IS DISTINCT FROM 'archived' evaluates to
-- TRUE, correctly treating "no status set" as "not archived."

-- Rebuild the partial index with the corrected predicate:
DROP INDEX IX_events_active;
CREATE INDEX IX_events_active ON events USING GIN (payload)
WHERE payload->>'status' IS DISTINCT FROM 'archived';
-- Now the index covers all three semantically "active" rows,
-- including the one with no status key at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team migrates older event records into a table where <code>status</code> was only introduced partway through the application\'s history — older events have no status key at all, while newer ones always have one. After adding the main page\'s own partial index and dashboard query (both using <code>!= \'archived\'</code>), the "active events" dashboard undercounts by exactly the number of pre-migration events. Using the mechanics above, explain the undercounting, and confirm whether simply backfilling a <code>status</code> value onto the old rows would be a valid alternative fix.',
    hint: 'Check what value payload->>\'status\' evaluates to for the pre-migration rows specifically, and how that value behaves in a != comparison.',
    solution: `The undercounting happens because every pre-migration event has no
status key at all, so payload->>'status' evaluates to SQL NULL for
each of them. NULL != 'archived' evaluates to UNKNOWN, which the
WHERE clause treats as FALSE -- excluding every one of these rows from
both the partial index's coverage and the dashboard query's results,
even though none of them were ever archived. The undercount exactly
matches the pre-migration row count because that's precisely the set
of rows with a NULL status.

Backfilling an explicit status value (e.g., setting status: "active"
on all pre-migration rows) IS a valid alternative fix -- it eliminates
the NULL case entirely, so the existing != 'archived' predicate would
then correctly include them without needing IS DISTINCT FROM at all.
Which fix is more appropriate depends on the situation: IS DISTINCT
FROM is the more general fix (correctly handles any future rows that
also lack a status key, without requiring a backfill), while
backfilling is a one-time data cleanup that only resolves the existing
rows and would need to be repeated if the application can still create
rows without a status key going forward.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own partial index predicate payload->>\'status\' != \'archived\' correctly captures "every event that is not archived," including events that never had a status assigned.',
      reality: 'a JSON payload with no status key at all extracts as SQL NULL, and NULL != \'archived\' evaluates to UNKNOWN — those rows are silently excluded from both the partial index and any query using the same predicate, despite intuitively being "not archived."',
    },
    {
      thought: 'if a partial index and a query both use the identical predicate, any row missing from the query\'s results must also be a row the index correctly excludes on purpose.',
      reality: 'the index and the query share the SAME predicate, so they share the SAME NULL-handling blind spot — both silently drop rows with a missing status key for the same underlying reason, which is a shared bug, not a deliberate, correct exclusion.',
    },
    {
      thought: 'IS DISTINCT FROM and != are interchangeable in PostgreSQL, since both express "not equal to."',
      reality: 'IS DISTINCT FROM treats NULL as a comparable value (NULL IS DISTINCT FROM anything-non-null evaluates to TRUE), while != propagates NULL as UNKNOWN — the two produce different results specifically when one side of the comparison can be NULL, which is exactly the case that matters here.',
    },
  ];
}
