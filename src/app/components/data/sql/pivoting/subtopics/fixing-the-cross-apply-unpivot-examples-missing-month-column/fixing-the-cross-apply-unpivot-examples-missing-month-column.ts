import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-fixing-cross-apply-unpivot-missing-month-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './fixing-the-cross-apply-unpivot-examples-missing-month-column.html',
  styleUrl: './fixing-the-cross-apply-unpivot-examples-missing-month-column.scss',
})
export class FixingTheCrossApplyUnpivotExamplesMissingMonthColumnSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A SELECT List That References a Column Nobody Provides',
      points: [
        'The main page\'s Q&A on multi-value-column UNPIVOT gives this exact query: "SELECT month, metric, value FROM sales CROSS APPLY (VALUES (\'qty\', jan_qty), (\'qty\', feb_qty), (\'price\', jan_price)) v(metric, value)." Read closely: the outer SELECT asks for a column called month — but neither sales (a wide table with columns like jan_qty, feb_qty, jan_price, not a month column) nor the CROSS APPLY\'s VALUES table v(metric, value) — which only defines two columns, metric and value — provides one.',
        'Running this exact query against SQL Server raises "Invalid column name \'month\'." It is not runnable as written. The VALUES rows tag each unpivoted value with a metric name (\'qty\' or \'price\') but never tag WHICH month that value came from — which is the entire point of the pattern the Q&A is trying to demonstrate.',
      ],
    },
    {
      heading: 'The Fix: Tag Each Row With Both Dimensions',
      points: [
        'A correct multi-value-column UNPIVOT via CROSS APPLY needs each VALUES row to carry BOTH the month AND the metric name alongside the actual value — three columns in the VALUES table alias, not two: v(month, metric, value). Each row becomes (\'Jan\', \'qty\', jan_qty), (\'Feb\', \'qty\', feb_qty), (\'Jan\', \'price\', jan_price), and so on for every month/metric combination that exists as a source column.',
        'This is exactly the missing piece: the ORIGINAL wide table encodes month as PART OF the column name (jan_qty, feb_qty) — unpivoting has to manually re-attach that month label to each value as it\'s pulled out, since SQL has no way to parse "jan_qty" and automatically split it into month="Jan", metric="qty".',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own Q&A example — fails to run',
      language: 'sql',
      code: `-- sales(product, jan_qty, feb_qty, mar_qty, jan_price, feb_price, mar_price)

-- As written in the main page's Q&A:
SELECT month, metric, value
FROM sales
CROSS APPLY (VALUES
    ('qty', jan_qty),
    ('qty', feb_qty),
    ('price', jan_price)
) v(metric, value);

-- Msg 207, Level 16, State 1
-- Invalid column name 'month'.
--
-- "month" appears nowhere: not as a column of "sales" (which stores
-- month IN the column names, like jan_qty), and not in the CROSS
-- APPLY's own alias list v(metric, value) -- which only names two
-- columns.`,
    },
    {
      label: 'The fix — tag month AND metric in every VALUES row',
      language: 'sql',
      code: `SELECT product, month, metric, value
FROM sales
CROSS APPLY (VALUES
    ('Jan', 'qty',   jan_qty),
    ('Feb', 'qty',   feb_qty),
    ('Mar', 'qty',   mar_qty),
    ('Jan', 'price', jan_price),
    ('Feb', 'price', feb_price),
    ('Mar', 'price', mar_price)
) v(month, metric, value);

-- Runs successfully. Each of the 6 rows in the VALUES table carries
-- its own explicit (month, metric) label alongside the actual
-- pulled-out value -- product | month | metric | value, one row per
-- (product, month, metric) combination. This is what the Q&A's own
-- prose describes ("qty and price for each month") but its code
-- never actually produced.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer copies the main page\'s exact CROSS APPLY Q&A example into SQL Server Management Studio and gets "Invalid column name \'month\'." Rather than assuming the whole CROSS APPLY multi-column UNPIVOT technique is broken, what specifically should they check first?',
    hint: 'Count the columns named in the CROSS APPLY\'s v(...) alias versus the columns the outer SELECT actually asks for.',
    solution: `They should check whether every column referenced in the outer
SELECT is actually produced somewhere — either by the base table
(sales) or by the CROSS APPLY's own VALUES alias list. In this exact
case, the outer SELECT asks for month, but the alias list v(metric,
value) only defines two columns, neither named month -- that mismatch
is the entire bug, not a flaw in the CROSS APPLY technique itself.

The technique is genuinely sound and is a real, commonly used pattern
for unpivoting multiple value columns at once -- it just needs each
VALUES row to explicitly carry every dimension the final output
needs to distinguish rows by. Since month is encoded only in the
SOURCE column names (jan_qty, feb_qty), it has to be manually
re-attached as a literal in each VALUES row: ('Jan', 'qty',
jan_qty), not inferred automatically. The fix is adding month as a
third column in both the VALUES rows and the v(...) alias list.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s CROSS APPLY example for multi-column UNPIVOT is runnable as documented — it\'s just an advanced pattern that takes some study to understand.',
      reality: 'the example as written references a "month" column that is produced by neither the source table nor the CROSS APPLY\'s own VALUES alias — running it exactly as shown raises "Invalid column name \'month\'."',
    },
    {
      thought: 'SQL can automatically figure out that a column named jan_qty "contains" a month (January) and a metric (quantity) without being told explicitly.',
      reality: 'column names are just strings to the SQL engine — there is no automatic parsing of jan_qty into separate month/metric dimensions; a correct CROSS APPLY unpivot has to manually re-attach each dimension as an explicit literal in the VALUES rows.',
    },
    {
      thought: 'CROSS APPLY with VALUES is an unreliable or overly complex way to unpivot multiple value columns, given how easy it is to get wrong.',
      reality: 'the technique itself is sound and widely used — the main page\'s specific example just has a genuine, fixable bug (a missing month dimension in the VALUES rows), not a flaw in the underlying approach.',
    },
  ];
}
