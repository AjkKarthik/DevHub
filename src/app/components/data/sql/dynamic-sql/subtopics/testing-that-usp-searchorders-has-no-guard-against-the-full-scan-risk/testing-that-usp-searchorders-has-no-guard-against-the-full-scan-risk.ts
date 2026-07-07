import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-usp-searchorders-full-scan-risk-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-usp-searchorders-has-no-guard-against-the-full-scan-risk.html',
  styleUrl: './testing-that-usp-searchorders-has-no-guard-against-the-full-scan-risk.scss',
})
export class TestingThatUspSearchordersHasNoGuardAgainstTheFullScanRiskSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Risk Named in the Q&A, Left Unguarded in the Code',
      points: [
        'The main page\'s Q&A directly warns: "When all filters are NULL, the query degenerates to SELECT * FROM table — potentially scanning millions of rows with no WHERE clause. Always add a TOP / LIMIT safety guard, or require at least one filter to be non-NULL." This describes the exact "Optional filter pattern (MSSQL)" code tab\'s usp_SearchOrders procedure a few sections earlier — but that procedure has no TOP/LIMIT anywhere, and never checks that at least one parameter is non-NULL.',
        'This subtopic runs usp_SearchOrders exactly as published with all three optional parameters omitted (their NULL defaults), and confirms directly that it produces precisely the unguarded full-table scan the page\'s own Q&A warns about — then adds the guard the Q&A recommends.',
      ],
    },
    {
      heading: 'Why This Gap Is Easy to Miss',
      points: [
        'The procedure "works correctly" for every test that supplies at least one filter — the bug is invisible unless someone specifically calls it with all three parameters omitted, which is precisely the "no filters" scenario a real caller (an application\'s "search with no criteria" button, or a malformed request that fails to supply any filter) could trigger without anyone intending it.',
        'Because @customer_id, @status, and @since all default to NULL in the procedure signature, calling EXEC dbo.usp_SearchOrders; with zero arguments is completely valid T-SQL — no error, no warning — and silently returns the entire table.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the unguarded full scan',
      language: 'sql',
      code: `CREATE TABLE orders (order_id INT, customer_id INT, amount DECIMAL(10,2), status VARCHAR(20), order_date DATE);
-- Populated with, say, 5 million historical order rows.

-- The main page's own usp_SearchOrders, exactly as published, called
-- with NO arguments -- perfectly valid T-SQL since every parameter
-- defaults to NULL:
EXEC dbo.usp_SearchOrders;

-- No error. No warning. Returns all 5,000,000 rows from orders --
-- precisely the "SELECT * FROM table" degeneration the page's own
-- Q&A warns about, with the exact procedure the Q&A never explicitly
-- ties the warning back to.

SET STATISTICS IO ON;
EXEC dbo.usp_SearchOrders;
-- Table 'orders'. Scan count 1, logical reads: (very large number
-- proportional to the full table) -- confirming a genuine full
-- table scan, not an accidental empty result set.`,
    },
    {
      label: 'Adding the guard the Q&A itself recommends',
      language: 'sql',
      code: `CREATE OR ALTER PROCEDURE dbo.usp_SearchOrders
    @customer_id INT  = NULL,
    @status      NVARCHAR(50) = NULL,
    @since       DATE = NULL,
    @max_rows    INT  = 1000        -- new: safety guard
AS
BEGIN
    IF @customer_id IS NULL AND @status IS NULL AND @since IS NULL
        THROW 50002, 'At least one filter must be supplied.', 1;

    DECLARE @sql    NVARCHAR(MAX) = N'SELECT TOP (@p_max) order_id, amount, status FROM orders WHERE 1=1';
    DECLARE @params NVARCHAR(MAX) = N'@p_cust INT, @p_status NVARCHAR(50), @p_since DATE, @p_max INT';

    IF @customer_id IS NOT NULL  SET @sql += N' AND customer_id = @p_cust';
    IF @status      IS NOT NULL  SET @sql += N' AND status = @p_status';
    IF @since       IS NOT NULL  SET @sql += N' AND order_date >= @p_since';

    SET @sql += N' ORDER BY order_date DESC';

    EXEC sp_executesql @sql, @params,
        @p_cust   = @customer_id,
        @p_status = @status,
        @p_since  = @since,
        @p_max    = @max_rows;
END;
GO

EXEC dbo.usp_SearchOrders;
-- Msg 50002: At least one filter must be supplied.
-- Now the exact scenario that silently returned 5 million rows
-- raises an explicit, actionable error instead -- and even a call
-- WITH filters is capped by TOP (@p_max), addressing both halves of
-- the Q&A's own recommendation ("add a TOP / LIMIT safety guard, OR
-- require at least one filter to be non-NULL").`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A production incident report says an application\'s "Advanced Search" feature, when a user clears every filter field and clicks Search, caused a multi-second full table scan on the orders table and briefly degraded database performance for other users. The team traces this to usp_SearchOrders. Was this bug documented anywhere on the page they built it from, and what specifically was missing from the implementation?',
    hint: 'Check the Q&A section — does it describe this exact scenario, and does the "Optional filter pattern" code tab actually implement the fix the Q&A recommends?',
    solution: `Yes — this exact scenario is documented in the main page's own Q&A:
"When all filters are NULL, the query degenerates to SELECT * FROM
table — potentially scanning millions of rows with no WHERE clause.
Always add a TOP / LIMIT safety guard, or require at least one filter
to be non-NULL." The bug wasn't undocumented; the RECOMMENDED FIX was
simply never applied to the actual usp_SearchOrders code shown a few
sections earlier on the same page.

What was missing from the implementation is precisely what the Q&A
names: usp_SearchOrders has no TOP/LIMIT clause and no check that at
least one of @customer_id, @status, or @since is non-NULL before
proceeding. Since all three parameters default to NULL, calling the
procedure with no arguments is valid T-SQL that silently executes
SELECT order_id, amount, status FROM orders WHERE 1=1 ORDER BY
order_date DESC — the full-table-scan the incident describes,
occurring exactly when a user submits a search with zero criteria.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s usp_SearchOrders "Optional filter pattern" code tab already includes the TOP/LIMIT safety guard the page\'s own Q&A recommends, since both are on the same topic page.',
      reality: 'the code tab and the Q&A are two independent pieces of content — the Q&A correctly describes the risk and its fix, but the actual usp_SearchOrders procedure shown earlier on the page never implements either recommended guard.',
    },
    {
      thought: 'a stored procedure with all-optional NULL-defaulted parameters will naturally handle the "caller supplies nothing" case safely, since NULL parameters are a normal, expected state.',
      reality: 'NULL-defaulted parameters make "call with zero arguments" completely valid T-SQL with no error — which is exactly what makes an unguarded optional-filter procedure dangerous: the degenerate case isn\'t rejected, it\'s silently accepted and executed as a full scan.',
    },
    {
      thought: 'this kind of full-table-scan bug would only occur from malicious or unusual input, not from an ordinary application user interacting normally with a search feature.',
      reality: 'clearing all filters and clicking "Search" (or a malformed request that fails to populate any filter) is an entirely ordinary, expected user interaction — the bug doesn\'t require anything unusual to trigger.',
    },
  ];
}
