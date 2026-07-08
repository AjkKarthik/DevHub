import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-fetch-customers-not-refcursor-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-that-fetch-customers-is-not-really-a-refcursor-example.html',
  styleUrl: './demonstrating-that-fetch-customers-is-not-really-a-refcursor-example.scss',
})
export class DemonstratingThatFetchCustomersIsNotReallyARefcursorExampleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Label That Promises Something the Code Doesn\'t Deliver',
      points: [
        'The main page\'s "PostgreSQL FOR loop" code tab includes a second function, fetch_customers(), introduced with the comment "Explicit cursor in PostgreSQL (useful for REFCURSOR)." But the function\'s DECLARE section — cur CURSOR FOR SELECT * FROM customers WHERE active = TRUE; — declares a plain BOUND cursor, not a refcursor. The quiz elsewhere on the same page correctly shows what an actual refcursor declaration looks like: DECLARE cur REFCURSOR; OPEN cur FOR SELECT ... WHERE id = param; — a genuinely different pattern that never appears together with working code anywhere on the page.',
        'A bound cursor (DECLARE cur CURSOR FOR <fixed query>) has its query fixed at declaration time and can only be opened, fetched, and closed within the SAME function or block. A refcursor (DECLARE cur REFCURSOR; OPEN cur FOR <query>) is a genuinely different, more flexible object — a reference that CAN be returned to the caller (or passed between functions) as an open, positioned cursor the caller then fetches from independently, which is the actual "useful for" scenario the fetch_customers label is describing but never builds.',
      ],
    },
    {
      heading: 'What fetch_customers Should Have Been, and What It Actually Needed',
      points: [
        'This subtopic writes the genuine refcursor version the label promised — a function that OPENs a refcursor and returns its NAME to the caller, who then FETCHes from it independently, in a separate round trip. This is the real "useful for REFCURSOR" scenario: streaming a large result set to a client without materializing it all at once inside a single function call.',
        'It also shows that the main page\'s ACTUAL fetch_customers function — which returns SETOF customers by manually looping FETCH/EXIT WHEN NOT FOUND/RETURN NEXT — has nothing to do with refcursors at all, and is dramatically over-engineered for what it does: the entire function body collapses to a single RETURN QUERY statement, exactly the technique the main page\'s own theory section names ("RETURN QUERY inside a PL/pgSQL function streams rows without materialising them all") but never applies here.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own fetch_customers — not actually a refcursor',
      language: 'sql',
      code: `-- Exactly as published, labeled "useful for REFCURSOR":
CREATE OR REPLACE FUNCTION fetch_customers()
RETURNS SETOF customers
LANGUAGE plpgsql
AS $$
DECLARE
    cur CURSOR FOR SELECT * FROM customers WHERE active = TRUE;  -- a
                                                                  -- BOUND
                                                                  -- cursor,
                                                                  -- not a
                                                                  -- REFCURSOR
    rec customers%ROWTYPE;
BEGIN
    OPEN cur;
    LOOP
        FETCH cur INTO rec;
        EXIT WHEN NOT FOUND;
        RETURN NEXT rec;
    END LOOP;
    CLOSE cur;
END;
$$;
-- "cur" here is typed as a plain cursor bound to a fixed query --
-- there is no REFCURSOR type anywhere in this function, despite the
-- label's claim.`,
    },
    {
      label: 'The entire function, collapsed to what the page\'s own theory recommends',
      language: 'sql',
      code: `-- The main page's own theory states: "RETURN QUERY inside a PL/pgSQL
-- function streams rows without materialising them all." Applying
-- that exact technique here:
CREATE OR REPLACE FUNCTION fetch_customers_simple()
RETURNS SETOF customers
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY SELECT * FROM customers WHERE active = TRUE;
END;
$$;

-- Same result, same streaming behavior, zero cursor machinery --
-- no DECLARE, no OPEN, no FETCH/EXIT WHEN NOT FOUND loop, no CLOSE.
-- The original 12-line function does nothing a single RETURN QUERY
-- statement doesn't already do.`,
    },
    {
      label: 'What a GENUINE refcursor example looks like',
      language: 'sql',
      code: `-- The actual "useful for REFCURSOR" scenario: returning an OPEN,
-- positioned cursor reference to the caller, who fetches from it
-- independently -- across a SEPARATE round trip, not inside one
-- single function call:
CREATE OR REPLACE FUNCTION open_customer_cursor()
RETURNS REFCURSOR
LANGUAGE plpgsql
AS $$
DECLARE
    cur REFCURSOR := 'customer_cur';  -- named refcursor
BEGIN
    OPEN cur FOR SELECT * FROM customers WHERE active = TRUE;
    RETURN cur;   -- returns the CURSOR ITSELF, still open, not the rows
END;
$$;

-- Caller (must be inside a transaction -- refcursors only live for
-- the duration of the transaction that opened them):
BEGIN;
SELECT open_customer_cursor();     -- returns: customer_cur
FETCH 10 FROM customer_cur;        -- the CALLER fetches, independently,
                                    -- in its own separate statement
FETCH 10 FROM customer_cur;        -- and can keep fetching in batches
CLOSE customer_cur;
COMMIT;
-- THIS is what a refcursor is actually for -- letting the CALLER
-- control fetching in batches across multiple round trips, unlike
-- the main page's fetch_customers, which fetches everything inside
-- one single function call regardless of cursor type.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer copies the main page\'s fetch_customers function expecting to learn the REFCURSOR pattern (based on its own comment), then tries to adapt it so a client application can fetch results in batches of 100 across multiple round trips — and gets stuck, since the function returns all rows in one RETURNS SETOF call. What\'s the root cause of their confusion, and which of the two alternative functions above actually supports batched fetching?',
    hint: 'Batched, multi-round-trip fetching requires the cursor to stay OPEN and referenceable BETWEEN separate calls — check which of the two alternatives actually returns a live, fetchable cursor reference versus a fully materialized/streamed row set.',
    solution: `The root cause is that fetch_customers, despite its "useful for
REFCURSOR" label, never actually uses a REFCURSOR — it's a bound
cursor whose entire OPEN/FETCH/CLOSE lifecycle happens inside one
single function call, and RETURNS SETOF customers delivers the
complete result set to the caller in one round trip (via a
row-streaming protocol, but still one logical call) — there's no way
for the caller to pause and resume fetching across separate calls
with this design, since the cursor itself never leaves the function.

open_customer_cursor() (the third code tab) is what actually supports
batched fetching: RETURNS REFCURSOR returns a live reference to a
cursor that stays open in the current transaction, letting the caller
run independent FETCH 10 FROM customer_cur; statements across
multiple round trips, controlling the batch size and pacing itself.
fetch_customers_simple() (the RETURN QUERY version) has the same
"all rows in one call" limitation as the original — it's a
simplification of the WRONG pattern for the developer's actual need,
even though it's the right fix for what fetch_customers was actually
trying to accomplish.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s fetch_customers() function demonstrates PostgreSQL\'s REFCURSOR feature, since its own comment says "useful for REFCURSOR."',
      reality: 'the function declares a plain bound cursor (CURSOR FOR <query>), not a REFCURSOR type — the two are genuinely different PL/pgSQL constructs, and the comment doesn\'t match what the code actually does.',
    },
    {
      thought: 'a 12-line function with an explicit OPEN/FETCH/EXIT WHEN NOT FOUND/CLOSE loop is necessary to return a filtered set of rows from a PL/pgSQL function.',
      reality: 'for a function that simply returns the rows of a query as-is, a single RETURN QUERY statement replaces the entire cursor loop — the main page\'s own theory section names this exact technique but never applies it to simplify this specific example.',
    },
    {
      thought: 'REFCURSOR and RETURNS SETOF/RETURN QUERY are interchangeable ways to return a set of rows from a PostgreSQL function.',
      reality: 'they solve different problems — RETURNS SETOF/RETURN QUERY delivers the complete result within one function call, while REFCURSOR returns a live, still-open cursor reference the caller can fetch from in independent batches across multiple separate round trips.',
    },
  ];
}
