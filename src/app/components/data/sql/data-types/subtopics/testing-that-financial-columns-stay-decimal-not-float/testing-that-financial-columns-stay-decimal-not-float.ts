import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-financial-columns-decimal-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-financial-columns-stay-decimal-not-float.html',
  styleUrl: './testing-that-financial-columns-stay-decimal-not-float.scss',
})
export class TestingThatFinancialColumnsStayDecimalNotFloatSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A One-Off Demonstration Is Not a Regression Test',
      points: [
        'The main page\'s own "FLOAT precision trap" demonstration — CAST(0.1 + 0.2 AS FLOAT) = 0.3 returning FALSE — proves the general fact that binary floating-point cannot represent 0.1 or 0.2 exactly. But it is a one-off ad hoc query, run once, about floating-point arithmetic in the abstract. Nothing on the main page would catch a future migration that accidentally recreates a financial column like a price or total_sales column as FLOAT or REAL instead of DECIMAL/NUMERIC — reintroducing the exact rounding-error risk the page warns against, silently, in a completely different table than the one demonstrated.',
        'A schema-level test closes this gap by asserting directly on the database\'s own catalog metadata: what data type is THIS column actually declared as, right now? This is a fundamentally different kind of check than testing data or business rules — it tests the SCHEMA itself, catching a type-choice regression the moment a migration runs, before a single row of bad data is ever written.',
      ],
    },
    {
      heading: 'Why This Catches What Data-Level Tests Cannot',
      points: [
        'A migration that recreates a table with the wrong column type often produces a brand-new, still-empty table — there is no data yet to run an arithmetic test against. A schema-level assertion works regardless: it reads the column\'s type declaration from sys.columns/sys.types (MSSQL) or information_schema (PostgreSQL, via pgTAP\'s col_type_is()) and fails immediately if the type doesn\'t match what was intended, with zero dependency on the table having any rows.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL — tSQLt schema-level assertion',
      language: 'sql',
      code: `EXEC tSQLt.NewTestClass 'SchemaTypeTests';
GO

CREATE PROCEDURE SchemaTypeTests.[test financial columns are never FLOAT or REAL]
AS
BEGIN
    DECLARE @BadColumns TABLE (TableName SYSNAME, ColumnName SYSNAME, TypeName SYSNAME);

    INSERT INTO @BadColumns (TableName, ColumnName, TypeName)
    SELECT OBJECT_NAME(c.object_id), c.name, t.name
    FROM sys.columns c
    JOIN sys.types   t ON c.user_type_id = t.user_type_id
    WHERE t.name IN ('float', 'real')
      AND (c.name LIKE '%price%' OR c.name LIKE '%amount%' OR c.name LIKE '%total%');

    -- Fails (listing the offending columns) if ANY financial-sounding
    -- column anywhere in the schema is declared FLOAT or REAL.
    EXEC tSQLt.AssertEquals 0, (SELECT COUNT(*) FROM @BadColumns);
END;
GO

EXEC tSQLt.Run 'SchemaTypeTests';`,
    },
    {
      label: 'PostgreSQL — pgTAP col_type_is()',
      language: 'sql',
      code: `BEGIN;
SELECT plan(2);

-- col_type_is() asserts a column's exact declared type against the catalog
SELECT col_type_is('products', 'price', 'numeric(10,2)',
                    'price column must be NUMERIC, not FLOAT/REAL');
SELECT col_type_is('orders', 'total_sales', 'numeric(18,2)',
                    'total_sales column must be NUMERIC, not FLOAT/REAL');

SELECT * FROM finish();
ROLLBACK;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate runs a migration that accidentally recreates the <code>products</code> table with <code>price REAL NOT NULL</code> instead of <code>price NUMERIC(10,2) NOT NULL</code> — a copy-paste mistake from an unrelated table. It\'s a brand-new empty table with zero rows. Why does the schema-level test above catch this regression, and why wouldn\'t the main page\'s own ad hoc <code>CAST(0.1+0.2 AS FLOAT) = 0.3</code> demonstration have helped here?',
    hint: 'The ad hoc demonstration proves a fact about floating-point arithmetic in general — it never checks what type any specific column in your actual schema is declared as.',
    solution: `The schema-level test (col_type_is('products', 'price', 'numeric(10,2)',
...)) directly queries the actual column definition in the database's
catalog and fails immediately if price is declared as anything other
than NUMERIC(10,2), including REAL. This catches the regression the
moment the migration runs, regardless of whether the table has any
rows yet, because it never depends on data — only on metadata.

The main page's own ad hoc demonstration (CAST(0.1+0.2 AS FLOAT) = 0.3)
proves a general fact about floating-point arithmetic — it says
nothing about what type any SPECIFIC column in your real schema is
declared as. It's a conceptual illustration, not a check against your
actual tables. Without a schema-level assertion like col_type_is(), a
REAL column introduced by a bad migration sits completely undetected
until enough transactions accumulate rounding errors that someone
notices a financial report doesn't reconcile — potentially months
later, and much harder to trace back to the migration that caused it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own FLOAT precision demonstration (CAST(0.1+0.2 AS FLOAT) = 0.3 returning FALSE) is itself a test that would catch a financial column being declared FLOAT in your schema.',
      reality: 'that query only demonstrates a general fact about floating-point arithmetic — it never checks what type any actual column in your database is declared as. A schema-level assertion (querying sys.columns/sys.types, or pgTAP\'s col_type_is()) is needed to catch a real column-type regression.',
    },
    {
      thought: 'a type-choice regression like "price column accidentally recreated as FLOAT" can only be caught by noticing rounding errors in application data after the fact.',
      reality: 'a schema-level test can catch this the moment a migration runs, even against a brand-new, empty table with zero rows — it asserts on the column\'s DECLARED TYPE in the catalog, not on any data written to it.',
    },
    {
      thought: 'testing a database schema only means testing constraints (CHECK, FK) and triggers — column TYPE choices don\'t need their own tests.',
      reality: 'a column\'s data type is just as much a schema-level correctness property as a constraint, and just as capable of silently regressing during a careless migration — making it just as worth a dedicated, automated test.',
    },
  ];
}
