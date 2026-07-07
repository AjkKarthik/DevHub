import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-create-aggregate-real-example-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './writing-an-actual-create-aggregate-example-the-quiz-only-describes.html',
  styleUrl: './writing-an-actual-create-aggregate-example-the-quiz-only-describes.scss',
})
export class WritingAnActualCreateAggregateExampleTheQuizOnlyDescribesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Quiz Question With No Working Example Anywhere',
      points: [
        'The main page\'s quiz asks how to create a custom aggregate function in PostgreSQL, and its answer describes the shape correctly in words: "CREATE AGGREGATE name(sfunc, stype, finalfunc) following the CREATE AGGREGATE syntax with state function, state type, and optional final function." But no code tab, Q&A, or challenge anywhere on the page actually writes out a working CREATE AGGREGATE statement — a reader has no way to see what SFUNC, STYPE, and FINALFUNC actually look like as real code, or how they fit together.',
        'This subtopic builds a genuinely useful custom aggregate SQL doesn\'t provide out of the box: PRODUCT(numeric_column) — multiplying all values in a group together, the multiplicative equivalent of SUM. It follows exactly the SFUNC/STYPE/FINALFUNC shape the quiz answer names, with real, runnable code.',
      ],
    },
    {
      heading: 'How the Pieces Fit Together',
      points: [
        'SFUNC (state transition function) is called once per input row — it takes the aggregate\'s current running STATE plus the new row\'s value, and returns the updated state. STYPE declares the data type of that running state value carried between calls.',
        'An optional FINALFUNC runs once, after all rows have been processed, transforming the final accumulated state into the aggregate\'s actual output type — useful when the internal running state isn\'t the same shape as the desired result (not needed for PRODUCT, since the running product IS the final answer, but essential for aggregates like AVG that need a final division step).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The state transition function (SFUNC)',
      language: 'sql',
      code: `-- The running state is simply "the product so far" -- a NUMERIC.
-- Each call multiplies the current state by the new row's value.
CREATE OR REPLACE FUNCTION product_sfunc(state NUMERIC, next_val NUMERIC)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT state * COALESCE(next_val, 1);  -- ignore NULLs, like SUM does
$$;`,
    },
    {
      label: 'The aggregate definition itself',
      language: 'sql',
      code: `CREATE AGGREGATE product(NUMERIC) (
    SFUNC = product_sfunc,
    STYPE = NUMERIC,
    INITCOND = '1'    -- starting state: multiplying by 1 is a no-op
);

-- No FINALFUNC needed here -- the running product IS the final
-- answer already, unlike an aggregate like AVG that needs a
-- final division step to turn (sum, count) into an average.`,
    },
    {
      label: 'Using it exactly like a built-in aggregate',
      language: 'sql',
      code: `CREATE TABLE probability_events (scenario TEXT, step_probability NUMERIC);
INSERT INTO probability_events VALUES
    ('A', 0.5), ('A', 0.8), ('A', 0.9),
    ('B', 0.9), ('B', 0.9);

SELECT scenario, product(step_probability) AS combined_probability
FROM probability_events
GROUP BY scenario
ORDER BY scenario;

--  scenario | combined_probability
-- ----------+-----------------------
--     A     |         0.3600
--     B     |         0.8100
--
-- product() works exactly like SUM(), AVG(), or any built-in
-- aggregate -- usable in GROUP BY, HAVING, window functions (OVER),
-- and everywhere else aggregates are valid -- because from SQL's
-- perspective, a CREATE AGGREGATE-defined function IS a real
-- aggregate, indistinguishable in usage from a built-in one.`,
    },
    {
      label: 'Where FINALFUNC becomes necessary — a running-average example',
      language: 'sql',
      code: `-- To show why FINALFUNC exists (unlike product(), which didn't
-- need one): a custom aggregate that tracks (sum, count) as its
-- state, then divides at the end -- essentially reimplementing AVG():
CREATE TYPE sum_count_state AS (running_sum NUMERIC, running_count INT);

CREATE OR REPLACE FUNCTION avg_sfunc(state sum_count_state, next_val NUMERIC)
RETURNS sum_count_state LANGUAGE sql IMMUTABLE AS $$
    SELECT ROW(state.running_sum + COALESCE(next_val, 0),
               state.running_count + CASE WHEN next_val IS NULL THEN 0 ELSE 1 END)::sum_count_state;
$$;

CREATE OR REPLACE FUNCTION avg_finalfunc(state sum_count_state)
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE WHEN state.running_count = 0 THEN NULL
                ELSE state.running_sum / state.running_count END;
$$;

CREATE AGGREGATE my_avg(NUMERIC) (
    SFUNC = avg_sfunc,
    STYPE = sum_count_state,
    FINALFUNC = avg_finalfunc,
    INITCOND = '(0,0)'
);
-- Here FINALFUNC is essential -- the running state (sum, count) is
-- NOT the answer by itself; only after the final division does it
-- become the actual average.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer wants to add a MEDIAN(numeric) custom aggregate using this same SFUNC/STYPE/FINALFUNC pattern. Based on how PRODUCT and the running-average example above work, would a simple "running state updated one value at a time" approach (like PRODUCT\'s single NUMERIC state) work for MEDIAN, or does MEDIAN need something structurally different?',
    hint: 'PRODUCT and running-average both only need to remember a small, fixed-size summary (a running total, or a sum+count pair) — think about what information MEDIAN fundamentally requires that a fixed-size summary can\'t capture.',
    solution: `MEDIAN cannot be computed from a small, fixed-size running summary
the way PRODUCT (a single running product) or AVG (a running sum and
count) can — unlike sum, count, or product, the median genuinely
requires access to the FULL set of values (or at least their sorted
order) to determine the middle value, since adding one new value can
change which existing value is "the middle one" in a way that isn't
predictable from any fixed-size summary statistic.

A working MEDIAN custom aggregate needs its STYPE to be something
that can grow to hold every value seen so far (e.g. an array,
accumulated via array_append in the SFUNC), and the FINALFUNC would
then need to sort that full array and pick the middle element(s) --
structurally different from PRODUCT and AVG, which only ever needed
a small, constant amount of running state regardless of how many
rows were aggregated. This is exactly why SQL engines don't ship
MEDIAN as a built-in the same way they ship SUM/AVG/COUNT — it has a
fundamentally different memory profile.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'CREATE AGGREGATE is a rare, exotic PostgreSQL feature that\'s rarely actually usable in practice, given how little real example code exists for it.',
      reality: 'it\'s a fully supported, standard PostgreSQL feature — the main page\'s own quiz names it as a real, testable topic, it simply never shows the actual code, which this subtopic fills in with a genuinely runnable example.',
    },
    {
      thought: 'a custom aggregate created via CREATE AGGREGATE behaves differently from built-in aggregates like SUM or AVG — for example, requiring different syntax to call, or not working in GROUP BY.',
      reality: 'a CREATE AGGREGATE-defined function is a real aggregate from SQL\'s perspective — it works in GROUP BY, HAVING, and window function OVER clauses exactly like SUM, AVG, or COUNT, with zero special-case calling syntax.',
    },
    {
      thought: 'every custom aggregate needs a FINALFUNC, since the quiz answer lists it as part of the standard CREATE AGGREGATE shape.',
      reality: 'FINALFUNC is optional and only needed when the running STATE isn\'t already the final answer (like AVG\'s sum+count needing a final division) — PRODUCT\'s running state IS the answer, so it needs no FINALFUNC at all.',
    },
  ];
}
