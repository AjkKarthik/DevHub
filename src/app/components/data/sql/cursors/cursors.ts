import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-sql-cursors',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './cursors.html',
  styleUrls: ['./cursors.scss']
})
export class SqlCursors {

  quickRef: QuickRefItem[] = [
    { name: 'DECLARE CURSOR',  type: 'keyword', desc: 'Define a cursor over a query' },
    { name: 'OPEN',            type: 'keyword', desc: 'Execute the cursor query and position before first row' },
    { name: 'FETCH NEXT',      type: 'keyword', desc: 'Advance cursor and read the current row' },
    { name: '@@FETCH_STATUS',  type: 'keyword', desc: 'MSSQL: 0 = success, -1 = past end, -2 = row missing' },
    { name: 'CLOSE / DEALLOCATE', type: 'keyword', desc: 'Release cursor resources (always do both)' },
    { name: 'FAST_FORWARD',    type: 'keyword', desc: 'MSSQL: read-only, forward-only cursor (cheapest)' },
    { name: 'FOR loop (PG)',   type: 'keyword', desc: 'PostgreSQL row-by-row loop without explicit CURSOR syntax' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is a cursor and when to use one?',
      points: [
        'A cursor processes a result set row-by-row inside a stored procedure or script.',
        'Cursors are almost always the wrong choice — a set-based SQL statement is 10–1000x faster for the same work.',
        'Legitimate use cases: generating sequential document numbers, calling an external stored procedure per row, or logic too complex to express in a single set-based query.',
      ]
    },
    {
      heading: 'MSSQL cursor lifecycle',
      points: [
        'DECLARE cursor_name CURSOR [options] FOR <query>',
        'OPEN cursor_name — runs the query and positions before the first row.',
        'FETCH NEXT FROM cursor_name INTO @var1, @var2 — reads next row into variables.',
        'Loop while @@FETCH_STATUS = 0. CLOSE cursor_name; DEALLOCATE cursor_name — always clean up.',
      ]
    },
    {
      heading: 'MSSQL cursor options',
      points: [
        'FAST_FORWARD — read-only, forward-only. No scrolling. Cheapest option; use by default.',
        'STATIC — snapshot of data at OPEN time; updates after OPEN not visible.',
        'KEYSET — rows identified by key; updated values visible, deleted rows return @@FETCH_STATUS = -2.',
        'DYNAMIC — reflects all changes; most expensive.',
      ]
    },
    {
      heading: 'PostgreSQL row-by-row patterns',
      points: [
        'FOR rec IN SELECT … LOOP — implicit cursor; clean syntax, no OPEN/CLOSE/DEALLOCATE needed.',
        'DECLARE cur CURSOR FOR <query>; OPEN cur; FETCH cur INTO var; CLOSE cur; — explicit cursor when you need to pass it between functions.',
        'RETURN QUERY inside a PL/pgSQL function streams rows without materialising them all.',
      ]
    },
    {
      heading: 'Set-based alternatives',
      points: [
        'UPDATE with JOIN replaces a cursor that updates rows one-by-one.',
        'Recursive CTE replaces a cursor that walks a hierarchy.',
        'STRING_AGG / LISTAGG replaces a cursor that concatenates values.',
        'If you find yourself writing a cursor, first ask: can this be expressed as a single INSERT/UPDATE/DELETE?',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL FAST_FORWARD cursor',
      language: 'sql',
      code: `DECLARE @customer_id INT;
DECLARE @name        NVARCHAR(200);

-- FAST_FORWARD: cheapest read-only forward-only cursor
DECLARE cur_customers CURSOR FAST_FORWARD FOR
    SELECT customer_id, name
    FROM   customers
    WHERE  active = 1
    ORDER  BY customer_id;

OPEN cur_customers;
FETCH NEXT FROM cur_customers INTO @customer_id, @name;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Row-level work (e.g. call a proc per customer)
    EXEC dbo.usp_SendWelcomeEmail @customer_id, @name;

    FETCH NEXT FROM cur_customers INTO @customer_id, @name;
END;

CLOSE    cur_customers;
DEALLOCATE cur_customers;`
    },
    {
      label: 'MSSQL: cursor vs set-based',
      language: 'sql',
      code: `-- BAD: cursor to add 10% to inactive product prices
DECLARE @id INT, @price DECIMAL(10,2);
DECLARE cur CURSOR FOR SELECT product_id, price FROM products WHERE active = 0;
OPEN cur;
FETCH NEXT FROM cur INTO @id, @price;
WHILE @@FETCH_STATUS = 0
BEGIN
    UPDATE products SET price = @price * 1.10 WHERE product_id = @id;
    FETCH NEXT FROM cur INTO @id, @price;
END;
CLOSE cur; DEALLOCATE cur;

-- GOOD: single set-based update (1 statement, no cursor)
UPDATE products
SET    price = price * 1.10
WHERE  active = 0;

-- Recursive hierarchy walk (replace cursor with rcte)
WITH hierarchy AS (
    SELECT employee_id, manager_id, name, 0 AS depth
    FROM   employees WHERE manager_id IS NULL
    UNION ALL
    SELECT e.employee_id, e.manager_id, e.name, h.depth + 1
    FROM   employees e JOIN hierarchy h ON h.employee_id = e.manager_id
)
SELECT * FROM hierarchy ORDER BY depth, employee_id;`
    },
    {
      label: 'PostgreSQL FOR loop',
      language: 'sql',
      code: `-- PL/pgSQL implicit cursor: clean and concise
CREATE OR REPLACE PROCEDURE send_welcome_emails()
LANGUAGE plpgsql
AS \$\$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT customer_id, name, email
        FROM   customers
        WHERE  active = TRUE
        ORDER  BY customer_id
    LOOP
        -- process each row
        PERFORM send_email(rec.email, 'Welcome ' || rec.name);
    END LOOP;
END;
\$\$;

-- Explicit cursor in PostgreSQL (useful for REFCURSOR)
CREATE OR REPLACE FUNCTION fetch_customers()
RETURNS SETOF customers
LANGUAGE plpgsql
AS \$\$
DECLARE
    cur CURSOR FOR SELECT * FROM customers WHERE active = TRUE;
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
\$\$;`
    },
    {
      label: 'Cursor with UPDATE (MSSQL)',
      language: 'sql',
      code: `-- Updateable cursor: modify the current row with WHERE CURRENT OF
DECLARE @discount DECIMAL(5,2);

DECLARE cur_prices CURSOR FOR
    SELECT price
    FROM   products
    WHERE  category_id = 3
    FOR UPDATE OF price;           -- declare updateable

OPEN cur_prices;
FETCH NEXT FROM cur_prices INTO @discount;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Tiered logic per row — hard to express as a single UPDATE
    SET @discount = CASE
        WHEN @discount < 10    THEN @discount * 1.15
        WHEN @discount < 100   THEN @discount * 1.10
        ELSE @discount * 1.05
    END;

    UPDATE products SET price = @discount
    WHERE  CURRENT OF cur_prices;

    FETCH NEXT FROM cur_prices INTO @discount;
END;
CLOSE    cur_prices;
DEALLOCATE cur_prices;`
    },
  ];

  challenge: Challenge = {
    title: 'Replace a cursor with a set-based query',
    language: 'sql',
    description: 'The following cursor updates each order\'s status to \'Overdue\' if payment_due < GETDATE() and status = \'Pending\'. Rewrite it as a single set-based UPDATE statement. Then write a second version that also logs the changed order_ids into an audit_log table (order_id, changed_at) in the same statement using OUTPUT (MSSQL) or RETURNING + INSERT (PostgreSQL).',
    hints: [
      'The set-based UPDATE replaces the entire DECLARE/OPEN/FETCH/WHILE/CLOSE/DEALLOCATE block.',
      'MSSQL: UPDATE … SET … OUTPUT INSERTED.order_id, GETDATE() INTO audit_log.',
      'PostgreSQL: WITH updated AS (UPDATE … RETURNING order_id) INSERT INTO audit_log SELECT order_id, now() FROM updated.',
    ],
    starterCode: `-- Original cursor (replace this):
DECLARE @id INT;
DECLARE cur CURSOR FOR
    SELECT order_id FROM orders WHERE payment_due < GETDATE() AND status = 'Pending';
OPEN cur; FETCH NEXT FROM cur INTO @id;
WHILE @@FETCH_STATUS = 0
BEGIN
    UPDATE orders SET status = 'Overdue' WHERE order_id = @id;
    FETCH NEXT FROM cur INTO @id;
END;
CLOSE cur; DEALLOCATE cur;

-- Your set-based replacement:`,
    solution: `-- MSSQL: single UPDATE + log via OUTPUT
UPDATE orders
SET    status = 'Overdue'
OUTPUT INSERTED.order_id, GETDATE()
INTO   audit_log (order_id, changed_at)
WHERE  payment_due < GETDATE()
  AND  status = 'Pending';

-- PostgreSQL: CTE + INSERT
WITH updated AS (
    UPDATE orders
    SET    status = 'Overdue'
    WHERE  payment_due < NOW()
      AND  status = 'Pending'
    RETURNING order_id
)
INSERT INTO audit_log (order_id, changed_at)
SELECT order_id, NOW() FROM updated;`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does DEALLOCATE do in MSSQL and why is it required?',
      options: [
        'Commits the cursor\'s changes to the database',
        'Releases the server memory and handle allocated for the cursor; CLOSE alone only repositions it',
        'Deletes rows fetched by the cursor',
        'Removes the cursor definition from the stored procedure'
      ],
      answer: 1,
      explanation: 'CLOSE repositions the cursor to before the first row and releases the result set locks, but the cursor structure still exists. DEALLOCATE removes the cursor definition entirely and frees all associated memory.'
    },
    {
      q: 'Which MSSQL cursor option is the cheapest and should be the default?',
      options: ['STATIC', 'KEYSET', 'DYNAMIC', 'FAST_FORWARD'],
      answer: 3,
      explanation: 'FAST_FORWARD is a read-only, forward-only cursor. It cannot scroll backwards and cannot be updated in place, but it uses minimal resources and is the fastest option for read-only row processing.'
    },
    {
      q: 'In PostgreSQL PL/pgSQL, what does FOR rec IN SELECT … LOOP do?',
      options: [
        'Creates an explicit CURSOR that must be manually opened and closed',
        'Creates a temporary table of query results',
        'Creates an implicit cursor and iterates over each row automatically',
        'Streams rows to the client without materialising'
      ],
      answer: 2,
      explanation: 'FOR rec IN SELECT … LOOP is PL/pgSQL syntactic sugar for an implicit cursor. PostgreSQL handles the open, fetch, and close automatically — you just write the loop body.'
    },
    {
      q: 'Which of these is a legitimate reason to use a cursor over a set-based approach?',
      options: [
        'Updating every row in a large table',
        'Aggregating totals across a result set',
        'Calling a stored procedure that only accepts one row at a time per invocation',
        'Joining two tables on a common key'
      ],
      answer: 2,
      explanation: 'When you must call a stored procedure (or external process) once per row and it has no batch-capable interface, a cursor is sometimes the only practical option. All the other choices have direct set-based solutions.'
    },
    {
      q: 'What does @@FETCH_STATUS = 0 indicate in MSSQL cursor processing?',
      options: [
        'The cursor has reached the end of the result set',
        'The last FETCH succeeded and returned a valid row',
        'The cursor is closed',
        'Zero rows matched the cursor query'
      ],
      answer: 1,
      explanation: '@@FETCH_STATUS returns 0 for a successful fetch, -1 when past the end of the result set, and -2 when the fetched row was deleted. The standard cursor loop is: FETCH NEXT … WHILE @@FETCH_STATUS = 0 BEGIN … FETCH NEXT … END.'
    },
    {
      q: 'In PostgreSQL PL/pgSQL, how do you open and use a cursor with parameters?',
      options: [
        'DECLARE cur CURSOR FOR SELECT ... WHERE id = param; OPEN cur;',
        'OPEN cur FOR SELECT ... WHERE id = param; -- works directly without a prior DECLARE',
        'DECLARE cur REFCURSOR; OPEN cur FOR SELECT ... WHERE id = param;',
        'Only FOR loops support parameters; explicit cursors cannot be parameterised'
      ],
      answer: 2,
      explanation: 'In PL/pgSQL, declare the cursor as a refcursor variable: DECLARE cur REFCURSOR; then OPEN cur FOR SELECT … WHERE id = param;. FETCH cur INTO rec; retrieves rows. This allows dynamic query parameterisation inside a procedure.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I update or delete the current cursor row without knowing its key?',
      a: 'Yes — MSSQL supports WHERE CURRENT OF cursor_name in UPDATE and DELETE statements when the cursor is declared FOR UPDATE. This avoids a separate re-lookup by primary key but requires the cursor to be updateable (not FAST_FORWARD, STATIC, or READ_ONLY).',
    },
    {
      q: 'What is the difference between CLOSE and DEALLOCATE in MSSQL?',
      a: 'CLOSE releases the result set and positioning locks but keeps the cursor in memory so it can be re-OPENed. DEALLOCATE removes the cursor completely. In a stored procedure you should always call both: CLOSE first, then DEALLOCATE. Omitting DEALLOCATE causes a resource leak if the procedure is called in a loop.',
    },
    {
      q: 'My cursor runs fine on 100 rows but times out on 100,000. What should I do?',
      a: 'Almost certainly rewrite it as a set-based query. If that is impossible, consider: (1) committing in batches (e.g. every 1 000 rows) inside a loop rather than one big transaction; (2) adding NOLOCK / READ UNCOMMITTED to avoid blocking; (3) running the loop off-hours. But the real answer is almost always to find the set-based equivalent.',
    },
    {
      q: 'What is the difference between a SCROLL cursor and a FORWARD ONLY cursor?',
      a: 'A FORWARD ONLY (FAST_FORWARD in MSSQL) cursor can only move forward one row at a time with FETCH NEXT. A SCROLL cursor supports all fetch directions: PRIOR, FIRST, LAST, ABSOLUTE N, and RELATIVE N. Scroll cursors are more resource-intensive because the database must materialise the result set to support random access. Only use SCROLL when you genuinely need to navigate backwards.',
    },
    {
      q: 'Can I return a cursor result set from a PostgreSQL function to a client application?',
      a: 'Yes — declare a function that returns SETOF refcursor. Inside, OPEN the cursors and RETURN NEXT cursorvar; the calling code (e.g. PL/pgSQL or JDBC) then FETCHes from each returned cursor name. However, for most use cases, RETURNS TABLE or RETURNS SETOF is simpler and more idiomatic in PostgreSQL.',
    },
    {
      q: 'How many rows does @@ROWCOUNT return after a cursor FETCH?',
      a: '@@ROWCOUNT after a FETCH is always 0 or 1 — 1 if a row was fetched, 0 if @@FETCH_STATUS is -1 (past end) or -2 (deleted). This is different from @@ROWCOUNT after a set-based statement, which returns the total rows affected. Do not confuse them when mixing cursor and set-based code in the same procedure.',
    },
  ];
}
