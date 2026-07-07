import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-mssql-merge-duplicate-source-bug-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-mssql-merge-duplicate-source-bug-is-real.html',
  styleUrl: './testing-that-the-mssql-merge-duplicate-source-bug-is-real.scss',
})
export class TestingThatTheMssqlMergeDuplicateSourceBugIsRealSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Warning Stated, Never Demonstrated',
      points: [
        'The main page\'s "Common pitfalls" section states as fact that "if the source has duplicate rows matching the same target row, the behaviour is undefined and the statement may apply multiple updates incorrectly" — but no code on the main page ever actually triggers this. The reader is asked to trust the warning and to trust that the page\'s own "Safe MSSQL MERGE (deduplicated source)" tab fixes it, without seeing either half proven.',
        'This subtopic runs both halves as an actual test: first reproduce the duplicate-source failure against the plain MERGE tab, then run the identical scenario against the deduplicated-source tab and confirm it succeeds.',
      ],
    },
    {
      heading: 'Why the Bug Happens',
      points: [
        'MERGE\'s WHEN MATCHED THEN UPDATE clause is not designed to handle a 1-to-many relationship between target and source on the ON condition. When two or more source rows match one target row, SQL Server does not deterministically pick "the last one" or merge the values — instead it raises error 8672 ("The MERGE statement attempted to UPDATE or DELETE the same row more than once") as soon as it detects the second match during execution, aborting the entire statement.',
        'This is actually a safer failure mode than the main page\'s wording ("may apply multiple updates incorrectly") suggests — SQL Server does not silently apply a wrong update; it throws a hard runtime error and rolls back. The real risk is an unhandled error crashing an unattended sync job, not silent data corruction.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup — a source with a genuine duplicate match',
      language: 'sql',
      code: `CREATE TABLE products (product_id INT PRIMARY KEY, name VARCHAR(100), price DECIMAL(10,2));
CREATE TABLE staging_products (product_id INT, name VARCHAR(100), price DECIMAL(10,2));

INSERT INTO products VALUES (1, 'Widget', 9.99);

-- Two staging rows both map to product_id = 1 -- e.g. a bad ETL export
INSERT INTO staging_products VALUES (1, 'Widget v2', 12.99);
INSERT INTO staging_products VALUES (1, 'Widget v2 (dup)', 13.99);`,
    },
    {
      label: 'tSQLt — reproducing the failure on the plain MERGE',
      language: 'sql',
      code: `EXEC tSQLt.NewTestClass 'MergeTests';
GO

CREATE PROCEDURE MergeTests.[test plain MERGE raises 8672 on duplicate source match]
AS
BEGIN
    EXEC tSQLt.FakeTable 'products';
    EXEC tSQLt.FakeTable 'staging_products';
    INSERT INTO products VALUES (1, 'Widget', 9.99);
    INSERT INTO staging_products VALUES (1, 'Widget v2', 12.99), (1, 'Widget v2 (dup)', 13.99);

    DECLARE @errorRaised BIT = 0;
    BEGIN TRY
        MERGE products AS target
        USING staging_products AS source ON target.product_id = source.product_id
        WHEN MATCHED THEN UPDATE SET target.name = source.name, target.price = source.price
        WHEN NOT MATCHED THEN INSERT (product_id, name, price) VALUES (source.product_id, source.name, source.price);
    END TRY
    BEGIN CATCH
        SET @errorRaised = 1;
        -- Confirms it's specifically 8672, not some unrelated failure
        EXEC tSQLt.AssertEquals @Expected = 8672, @Actual = ERROR_NUMBER();
    END CATCH

    EXEC tSQLt.AssertEquals @Expected = 1, @Actual = @errorRaised;
END;
GO

EXEC tSQLt.Run 'MergeTests';
-- PASSES: the plain MERGE against a duplicate-matching source
-- reliably raises error 8672 and rolls back -- exactly the bug the
-- main page warns about, now proven rather than asserted.`,
    },
    {
      label: 'tSQLt — confirming the deduplicated-source tab actually fixes it',
      language: 'sql',
      code: `CREATE PROCEDURE MergeTests.[test deduplicated source MERGE succeeds and picks the newest row]
AS
BEGIN
    EXEC tSQLt.FakeTable 'products';
    EXEC tSQLt.FakeTable 'staging_products';
    ALTER TABLE staging_products ADD updated DATETIME DEFAULT SYSDATETIME();
    INSERT INTO products VALUES (1, 'Widget', 9.99);
    INSERT INTO staging_products (product_id, name, price, updated) VALUES
        (1, 'Widget v2', 12.99, '2026-01-01'),
        (1, 'Widget v2 (dup)', 13.99, '2026-01-02');  -- newer row

    WITH deduped_source AS (
        SELECT product_id, name, price,
               ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY updated DESC) AS rn
        FROM staging_products
    )
    MERGE products AS target
    USING (SELECT * FROM deduped_source WHERE rn = 1) AS source
        ON target.product_id = source.product_id
    WHEN MATCHED THEN UPDATE SET target.name = source.name, target.price = source.price
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (product_id, name, price) VALUES (source.product_id, source.name, source.price);
    -- No error -- ROW_NUMBER() collapses the two competing rows to one per key first

    EXEC tSQLt.AssertEquals @Expected = 'Widget v2 (dup)', @Actual = (SELECT name FROM products WHERE product_id = 1);
    -- Confirms the fix doesn't just avoid the error -- it deterministically
    -- keeps the newest row, unlike the plain MERGE which never reaches a result at all.
END;
GO

EXEC tSQLt.Run 'MergeTests';`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says "the MERGE duplicate-source bug is scary because it silently applies the wrong update, so I need to add extra validation logic to catch bad data before it corrupts my target table." Based on what the tSQLt tests above actually proved, is their fear about <em>silent</em> corruption accurate?',
    hint: 'Look at what the CATCH block in the first test actually asserts — what error is raised, and does the MERGE statement leave any of its changes applied afterward?',
    solution: `No -- the tests show the opposite of "silent" corruption. SQL Server
detects the duplicate match mid-execution and raises error 8672,
aborting the entire MERGE statement (including any matches or inserts
it had already processed for OTHER, non-duplicated rows in the same
batch). Nothing commits. The real risk isn't silent bad data -- it's
an unhandled 8672 crashing an unattended nightly sync job with no
useful error message pointing at which row caused it.

The main page's own wording ("may apply multiple updates incorrectly")
somewhat overstates the risk in the direction of silent corruption.
The teammate's instinct to validate is still good practice, but the
specific concern should be reframed: wrap the MERGE in a TRY/CATCH
that logs or alerts on error 8672 specifically, and deduplicate the
source with ROW_NUMBER() as a matter of routine, not just defensive
validation against a possible silent corruption.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the MSSQL MERGE duplicate-source bug silently applies one of the conflicting updates without telling you, corrupting the target table.',
      reality: 'SQL Server detects the duplicate match during execution and raises error 8672, rolling back the entire MERGE statement -- nothing commits. The danger is an unhandled crash, not silent corruption.',
    },
    {
      thought: 'deduplicating the source with ROW_NUMBER() is just a defensive habit that avoids a hypothetical edge case.',
      reality: 'it directly prevents a real, reproducible runtime error (8672) that will occur on the very first sync batch that happens to contain two rows for the same key -- not a rare edge case for any pipeline ingesting from an upstream system that doesn\'t guarantee uniqueness.',
    },
    {
      thought: 'since the deduplicated MERGE tab avoids the error, it must not matter which of the duplicate rows ROW_NUMBER() happens to keep.',
      reality: 'ORDER BY updated DESC in the ROW_NUMBER() window is what makes the outcome deterministic (always keeps the newest row) -- without an explicit, meaningful ORDER BY, ROW_NUMBER() would still avoid the 8672 error but could arbitrarily keep either duplicate.',
    },
  ];
}
