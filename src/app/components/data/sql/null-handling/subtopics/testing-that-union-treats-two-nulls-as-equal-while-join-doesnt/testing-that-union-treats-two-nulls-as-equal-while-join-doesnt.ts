import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-union-null-equality-vs-join-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-union-treats-two-nulls-as-equal-while-join-doesnt.html',
  styleUrl: './testing-that-union-treats-two-nulls-as-equal-while-join-doesnt.scss',
})
export class TestingThatUnionTreatsTwoNullsAsEqualWhileJoinDoesntSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two Claims, Right Next to Each Other, That Look Contradictory',
      points: [
        'The main page\'s own "NULL in JOINs and set operations" theory section states two facts in adjacent bullet points: a JOIN\'s a.col = b.col does NOT match when both sides are NULL (UNKNOWN, not TRUE); and UNION / INTERSECT / EXCEPT treat NULLs AS EQUAL to each other for deduplication. Neither claim is demonstrated with code, and their apparent contradiction — "NULL doesn\'t equal NULL" right next to "NULL equals NULL for these operators" — is never explicitly resolved for the reader.',
        'Both claims are true simultaneously because they describe two DIFFERENT kinds of equality. JOIN\'s = is a value COMPARISON operator, following strict three-valued logic where comparing two unknowns yields UNKNOWN. UNION/INTERSECT/EXCEPT (and also DISTINCT, GROUP BY, and PARTITION BY) use ROW EQUALITY for the specific purpose of determining which rows belong to the same group — the SQL standard explicitly defines this grouping operation to treat two NULLs as "the same" for that purpose, a deliberate and different rule from value comparison.',
      ],
    },
    {
      heading: 'Proving Both Halves on the Same Underlying Data',
      points: [
        'A single fixture — two tables each containing a row with NULL in the join/comparison column — can demonstrate both behaviors side by side: the JOIN version returns no matching row, while the UNION version of the same two rows collapses into one, on the exact same NULL values.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'JOIN — two NULLs do NOT match',
      language: 'sql',
      code: `CREATE TABLE TableA (id INT, category VARCHAR(20));
CREATE TABLE TableB (id INT, category VARCHAR(20));

INSERT INTO TableA VALUES (1, NULL);
INSERT INTO TableB VALUES (1, NULL);

-- Both rows have category = NULL, id = 1 -- do they join on category?
SELECT a.id, a.category
FROM TableA a
JOIN TableB b ON a.category = b.category;
-- Returns ZERO rows -- a.category = b.category evaluates to UNKNOWN
-- when both sides are NULL, and JOIN's ON clause only keeps rows
-- where the condition is TRUE.`,
    },
    {
      label: 'UNION — the same two NULLs DO collapse into one row',
      language: 'sql',
      code: `-- The exact same two rows, combined via UNION instead of joined:
SELECT id, category FROM TableA
UNION
SELECT id, category FROM TableB;
-- Returns ONE row: (1, NULL) -- UNION treats the two (1, NULL) rows
-- as duplicates of each other and deduplicates them, even though the
-- category values being "equal" is exactly the comparison that
-- returned UNKNOWN (and therefore no match) in the JOIN above.

-- The same grouping-equality rule applies to DISTINCT and GROUP BY:
SELECT DISTINCT category FROM (
    SELECT category FROM TableA
    UNION ALL
    SELECT category FROM TableB
) combined;
-- Returns ONE row: NULL -- DISTINCT groups the two NULL category
-- values together, using the same "grouping equality" UNION relies on.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer, having read that "NULL never equals NULL in SQL," is confused when a UNION query they wrote collapses two rows with NULL in the same column into one, since they expected UNION to treat the two NULLs as "unequal" and keep both rows separately (mirroring what they know about JOIN behavior). Using the distinction above, explain why their JOIN knowledge doesn\'t transfer to UNION, and what general rule DOES correctly predict UNION\'s behavior.',
    hint: 'The developer is applying a rule about VALUE COMPARISON (the = operator) to an operation that actually uses a different kind of equality — GROUPING equality.',
    solution: `The developer's mental model — "NULL never equals NULL" — is correct
specifically for the = value-comparison operator, which is what JOIN's
ON clause uses. But UNION does not use the = operator to decide which
rows are duplicates; it uses SQL's GROUPING/deduplication equality
rule, which is a deliberately different rule defined by the standard:
two NULLs ARE considered "the same" for the purpose of grouping rows
together (whether for UNION's deduplication, DISTINCT, GROUP BY, or
PARTITION BY).

The general rule that correctly predicts UNION's behavior:
value-comparison operators (=, <>, and anything used in a WHERE or ON
clause) follow three-valued logic, where NULL compared to anything
(including another NULL) yields UNKNOWN. Grouping/deduplication
operations (UNION, INTERSECT, EXCEPT, DISTINCT, GROUP BY, PARTITION
BY) use a SEPARATE equality rule where NULLs are grouped together.
These are two different operations with two different, both
intentional, definitions of "equal" — not an inconsistency to resolve,
but a distinction to learn.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own claims — "JOIN doesn\'t match two NULLs" and "UNION treats two NULLs as equal" — describe conflicting SQL behavior, and only one of them can really be true.',
      reality: 'both claims are accurate simultaneously — they describe two genuinely different operations (value comparison via = versus grouping/deduplication equality), each with its own well-defined, standard rule for how NULL participates.',
    },
    {
      thought: 'once you understand that "NULL never equals NULL" for JOIN and WHERE conditions, that same rule applies uniformly to every other SQL construct, including UNION, DISTINCT, and GROUP BY.',
      reality: 'UNION, DISTINCT, GROUP BY, and PARTITION BY all use a SEPARATE grouping-equality rule that treats two NULLs as belonging to the same group — this is a deliberate, standard-defined exception to the "NULL never equals NULL" comparison rule, not an inconsistency or a bug.',
    },
    {
      thought: 'if UNION collapses two rows with NULL in the same column into one, that must mean SQL secretly treats NULL = NULL as TRUE somewhere under the hood.',
      reality: 'UNION\'s deduplication never actually evaluates a NULL = NULL comparison at all — it uses a distinct grouping mechanism defined by the SQL standard specifically for set operations, DISTINCT, and GROUP BY, which is conceptually and operationally separate from the = comparison operator.',
    },
  ];
}
