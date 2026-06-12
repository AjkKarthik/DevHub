import { Component, signal, computed } from '@angular/core';

interface QuizQ { q: string; options: string[]; answer: number; explanation: string; topic: string; }

@Component({
  selector: 'app-sql-quiz-practice',
  standalone: true,
  imports: [],
  templateUrl: './quiz-practice.html',
  styleUrl: './quiz-practice.scss',
})
export class SqlQuizPractice {
  phase = signal<'setup' | 'quiz' | 'result'>('setup');
  selectedTopic = signal('All Topics');
  currentIndex = signal(0);
  selected = signal<number | null>(null);
  score = signal(0);

  topics = ['All Topics', 'SQL Basics', 'Joins', 'Aggregations', 'Subqueries', 'CTEs', 'Window Functions', 'Indexes', 'Transactions', 'Schema Design'];

  allQuestions: QuizQ[] = [
    { topic: 'SQL Basics', q: 'Which clause is evaluated FIRST in logical query processing?', options: ['SELECT', 'WHERE', 'FROM', 'ORDER BY'], answer: 2, explanation: 'FROM is first — the source tables must be identified before any filtering or projection occurs.' },
    { topic: 'SQL Basics', q: 'What does BETWEEN 10 AND 20 mean?', options: ['> 10 and < 20', '>= 10 and <= 20', '> 10 and <= 20', '>= 10 and < 20'], answer: 1, explanation: 'BETWEEN is inclusive on both ends — equivalent to >= 10 AND <= 20.' },
    { topic: 'SQL Basics', q: 'How do you check if a column value is NULL?', options: ['col = NULL', 'col == NULL', 'col IS NULL', 'ISNULL(col)'], answer: 2, explanation: 'Any comparison with NULL using = or <> returns NULL (unknown). Always use IS NULL or IS NOT NULL.' },
    { topic: 'Joins', q: 'Which join type returns ALL rows from both tables, with NULLs where no match exists?', options: ['INNER JOIN', 'LEFT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN'], answer: 2, explanation: 'FULL OUTER JOIN returns all rows from both tables. Where no match exists in the other table, NULL is placed.' },
    { topic: 'Joins', q: 'A CROSS JOIN on table A (4 rows) and table B (3 rows) returns how many rows?', options: ['7', '4', '3', '12'], answer: 3, explanation: 'CROSS JOIN is a Cartesian product: 4 × 3 = 12 rows.' },
    { topic: 'Joins', q: 'After LEFT JOIN, adding `WHERE right_table.id IS NULL` in WHERE returns:', options: ['All rows', 'Rows where right_table.id happens to be NULL', 'Left rows with NO match in right table (anti-join)', 'An error'], answer: 2, explanation: 'This is the anti-join pattern. LEFT JOIN produces NULLs for right-table columns where no match exists; IS NULL isolates those.' },
    { topic: 'Aggregations', q: 'You cannot use aggregate functions in:', options: ['SELECT', 'HAVING', 'WHERE', 'ORDER BY'], answer: 2, explanation: 'WHERE is evaluated before GROUP BY, so aggregate results don\'t exist yet. Use HAVING to filter on aggregates.' },
    { topic: 'Aggregations', q: 'AVG(salary) on [100, NULL, NULL, 200] returns:', options: ['100', '150', '200', '400'], answer: 1, explanation: 'AVG ignores NULLs. Sum of non-NULLs = 300, count of non-NULLs = 2, so AVG = 150.' },
    { topic: 'Aggregations', q: 'GROUP BY ROLLUP(Country, City) adds:', options: ['Nothing extra', 'Only a grand total row', 'A subtotal per Country and a grand total row', 'Subtotals for all combinations'], answer: 2, explanation: 'ROLLUP adds a subtotal row per Country (collapsing cities) and a grand total row.' },
    { topic: 'Subqueries', q: 'A scalar subquery that returns more than one row:', options: ['Returns the first row silently', 'Causes a runtime error', 'Returns NULL', 'Is treated as IN'], answer: 1, explanation: 'A scalar subquery must return exactly one row and one column. Multiple rows cause a runtime error.' },
    { topic: 'Subqueries', q: 'NOT IN returns no rows when the list contains:', options: ['Zero rows', 'A NULL value', 'Duplicate values', 'More than 100 values'], answer: 1, explanation: 'col NOT IN (..., NULL) reduces to col <> NULL for the NULL element = UNKNOWN, which filters out every outer row.' },
    { topic: 'CTEs', q: 'In a recursive CTE, what stops the recursion?', options: ['A STOP RECURSION statement', 'The recursive member returning no rows', 'MAXRECURSION = 0', 'A BREAK keyword'], answer: 1, explanation: 'Recursion stops automatically when the recursive member produces zero rows. MAXRECURSION is a safety cap.' },
    { topic: 'Window Functions', q: 'Which ranking function produces 1, 2, 2, 3 (no gaps after ties)?', options: ['ROW_NUMBER()', 'RANK()', 'DENSE_RANK()', 'NTILE(4)'], answer: 2, explanation: 'DENSE_RANK assigns the same rank to ties and increments without gaps. RANK would produce 1, 2, 2, 4.' },
    { topic: 'Window Functions', q: 'Can a window function appear in a WHERE clause?', options: ['Yes, with OVER()', 'No — use a subquery or CTE', 'Only RANK() can', 'Only with PARTITION BY'], answer: 1, explanation: 'Window functions execute after WHERE. To filter on window results, wrap the query in a subquery or CTE.' },
    { topic: 'Indexes', q: 'How many clustered indexes can a table have?', options: ['Unlimited', '1', '2', 'Up to 999'], answer: 1, explanation: 'Only one clustered index per table — it defines the physical row order.' },
    { topic: 'Indexes', q: 'An index INCLUDE clause:', options: ['Adds columns to the B-tree key', 'Adds columns to leaf level only — covers SELECT without widening the key', 'Creates a partial index', 'Sets the fill factor'], answer: 1, explanation: 'INCLUDE adds columns to the leaf node so the query can retrieve them without a key lookup, making the index covering.' },
    { topic: 'Transactions', q: 'Which ACID property ensures all-or-nothing execution?', options: ['Consistency', 'Isolation', 'Atomicity', 'Durability'], answer: 2, explanation: 'Atomicity guarantees that all statements in a transaction commit or all roll back.' },
    { topic: 'Transactions', q: 'XACT_STATE() = -1 means:', options: ['Transaction committed successfully', 'No active transaction', 'Transaction is uncommittable — must ROLLBACK', 'Deadlock detected'], answer: 2, explanation: 'XACT_STATE() = -1 indicates an uncommittable transaction. You must ROLLBACK; attempting COMMIT raises an error.' },
    { topic: 'Schema Design', q: 'Which data type should you use for monetary values?', options: ['FLOAT', 'REAL', 'DECIMAL(p,s)', 'MONEY'], answer: 2, explanation: 'FLOAT/REAL use binary floating-point with rounding errors. DECIMAL is exact — essential for financial calculations.' },
    { topic: 'Schema Design', q: 'A Products table has CategoryID and CategoryName. CategoryName depends on CategoryID. This violates:', options: ['1NF', '2NF', '3NF', 'BCNF'], answer: 2, explanation: '3NF: no non-key column should determine another non-key column. CategoryName depends on CategoryID (not the PK), a transitive dependency.' },
  ];

  filteredQuestions = computed(() => {
    const t = this.selectedTopic();
    return t === 'All Topics' ? this.allQuestions : this.allQuestions.filter(q => q.topic === t);
  });

  currentQ = computed(() => this.filteredQuestions()[this.currentIndex()] ?? null);
  total     = computed(() => this.filteredQuestions().length);
  pct       = computed(() => this.total() ? Math.round((this.currentIndex() / this.total()) * 100) : 0);

  start() { this.currentIndex.set(0); this.score.set(0); this.selected.set(null); this.phase.set('quiz'); }

  select(i: number) {
    if (this.selected() !== null) return;
    this.selected.set(i);
    if (i === this.currentQ()!.answer) this.score.update(s => s + 1);
  }

  next() {
    const nextIdx = this.currentIndex() + 1;
    if (nextIdx >= this.total()) { this.phase.set('result'); return; }
    this.currentIndex.set(nextIdx);
    this.selected.set(null);
  }

  restart() { this.phase.set('setup'); this.selected.set(null); }

  optionClass(i: number) {
    const sel = this.selected();
    if (sel === null) return '';
    const correct = this.currentQ()!.answer;
    if (i === correct) return 'correct';
    if (i === sel && sel !== correct) return 'incorrect';
    return '';
  }
}
