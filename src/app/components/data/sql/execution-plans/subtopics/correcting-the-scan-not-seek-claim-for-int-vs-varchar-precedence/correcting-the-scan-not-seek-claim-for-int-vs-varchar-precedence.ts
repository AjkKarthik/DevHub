import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-int-varchar-precedence-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './correcting-the-scan-not-seek-claim-for-int-vs-varchar-precedence.html',
  styleUrl: './correcting-the-scan-not-seek-claim-for-int-vs-varchar-precedence.scss',
})
export class CorrectingTheScanNotSeekClaimForIntVsVarcharPrecedenceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Claim',
      points: [
        'The "Fixing implicit conversion" code tab shows: DECLARE @id VARCHAR(10) = \'12345\'; SELECT * FROM orders WHERE customer_id = @id;  -- scan, not seek! — presented as a second BAD example, alongside CONVERT(VARCHAR, customer_id) = \'12345\' which genuinely does force a scan by wrapping the column.',
        'But these two examples are not the same kind of implicit conversion. The first wraps the COLUMN in CONVERT(). The second compares an untouched INT column directly to a VARCHAR parameter — no function is applied to either side in the SQL text. Whether that disables the seek depends on which side SQL Server\'s data type precedence rules convert.',
      ],
    },
    {
      heading: 'Data Type Precedence Decides Which Side Converts',
      points: [
        'SQL Server\'s documented Data Type Precedence order ranks int higher than varchar (the order runs …, bigint, int, smallint, tinyint, bit, …, nvarchar, nchar, varchar, char, …). When two different types are compared, the LOWER-precedence type is converted to the HIGHER-precedence type — never the other way around.',
        'customer_id is int (higher precedence); @id is varchar (lower precedence). SQL Server therefore converts @id to int before comparing — effectively customer_id = CONVERT(int, @id). The column itself is never wrapped in a function, so the optimizer can still seek on customer_id directly.',
        'This is the OPPOSITE of the well-known nvarchar-vs-varchar gotcha (nvarchar outranks varchar, so a VARCHAR COLUMN gets converted to nvarchar, disabling that column\'s seek) — the direction of the conversion, and therefore whether the seek survives, depends entirely on which type outranks which in this specific pairing.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the main page\'s exact example',
      language: 'sql',
      code: `CREATE INDEX ix_orders_customer_id ON orders (customer_id);

DECLARE @id VARCHAR(10) = '12345';
SELECT * FROM orders WHERE customer_id = @id;

-- Look at the actual execution plan (Include Actual Execution Plan in SSMS):
-- Index Seek (ix_orders_customer_id), Seek Predicate:
--   [orders].[customer_id] = CONVERT_IMPLICIT(int,[@id],0)
--
-- This IS an Index Seek, not a scan -- the main page's own
-- "-- scan, not seek!" comment does not match what SQL Server
-- actually does for this specific type pairing.`,
    },
    {
      label: 'Confirming the direction with sys.dm_exec_query_plan / STATISTICS IO',
      language: 'sql',
      code: `SET STATISTICS IO ON;
DECLARE @id VARCHAR(10) = '12345';
SELECT * FROM orders WHERE customer_id = @id;
SET STATISTICS IO OFF;
-- Table 'orders'. Scan count 1, logical reads 3, ...
-- A handful of logical reads on a large table confirms a seek,
-- not a scan (a scan would report reads roughly equal to the
-- table's full page count).`,
    },
    {
      label: 'The genuine column-side conversion (for contrast)',
      language: 'sql',
      code: `-- customer_id_code is stored as VARCHAR(10); nvarchar OUTRANKS varchar
DECLARE @code NVARCHAR(10) = N'CUST-0012345';
SELECT * FROM orders WHERE customer_id_code = @code;

-- Here varchar is the LOWER-precedence type, so the COLUMN
-- customer_id_code is what gets implicitly converted to nvarchar --
-- Seek Predicate: CONVERT_IMPLICIT(nvarchar(10),[customer_id_code],0) = @code
-- The column-side conversion genuinely disables a seek on
-- customer_id_code's own index. This is the real "scan, not seek"
-- case the main page's INT/VARCHAR example only appears to describe.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two predicates: (1) WHERE customer_id = @id where customer_id is INT and @id is VARCHAR(10); (2) WHERE customer_id_code = @code where customer_id_code is VARCHAR(10) and @code is NVARCHAR(10). Both look like "different types being compared." Which one actually loses its index seek, and why?',
    hint: 'Check SQL Server\'s Data Type Precedence order for both pairings — the side that gets implicitly converted is always the LOWER-precedence type.',
    solution: `Only predicate (2) loses its seek.

In (1), int outranks varchar in SQL Server's precedence order, so
the VARCHAR parameter @id is converted to int -- the INT column
customer_id is never touched by a conversion function, and the
optimizer can still seek on it directly.

In (2), nvarchar outranks varchar, so the VARCHAR COLUMN
customer_id_code is the one implicitly converted to nvarchar before
comparison. Wrapping the column in an implicit CONVERT disables the
B-tree seek on that column's index -- this predicate does force a
scan.

The lesson: "comparing two different types" is not itself the
problem -- only a conversion applied to the COLUMN side disables a
seek. Whether that happens depends on which of the two types
outranks the other, which requires checking the precedence table,
not just noticing the types differ.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'comparing an INT column to a VARCHAR parameter always causes an implicit conversion that disables an index seek, exactly like CONVERT() wrapping the column does.',
      reality: 'SQL Server\'s data type precedence converts the LOWER-precedence side. Since int outranks varchar, the varchar parameter is converted, not the int column -- the seek survives. Only when the column\'s own type is the lower-precedence one does the column get converted.',
    },
    {
      thought: '"scan, not seek!" in a code comment is a reliable guide to what SQL Server\'s optimizer will actually do.',
      reality: 'the comment describes what the CONVERT(VARCHAR, customer_id) example above it does -- it was carried over to the @id VARCHAR(10) example without re-checking whether the same outcome actually applies, and it does not.',
    },
    {
      thought: 'any time two different data types appear on either side of a WHERE predicate, one should assume the worst and explicitly cast to be safe.',
      reality: 'explicit casting the correct side (or, better, matching the parameter\'s declared type to the column\'s type from the start) avoids ambiguity -- but blindly wrapping the COLUMN in a cast to "be safe" is exactly the mistake that disables a seek that data type precedence would otherwise have preserved.',
    },
  ];
}
