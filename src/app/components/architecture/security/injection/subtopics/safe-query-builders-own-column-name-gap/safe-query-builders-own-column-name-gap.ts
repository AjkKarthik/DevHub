import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'The Gap: Values Are Parameterized, Columns Are Not',
    points: [
      'The main page\'s own Challenge asks for a query builder that validates the TABLE name against an allowlist — and its reference solution does exactly that, correctly, before ever touching SQL.',
      'But that same solution builds each WHERE condition as <code>`${col} = $${params.length}`</code>, where <code>col</code> comes directly from <code>Object.keys(filters)</code> — with zero validation. Only the VALUES are safely parameterized ($1, $2, ...); the COLUMN NAMES are concatenated straight into the SQL string.',
      'This matches exactly what the main page\'s own separate QnA on ORM raw queries warns about: "dynamic column names or ORDER BY clauses — these cannot be parameterized; use an allowlist of valid column names instead." The Challenge\'s own reference solution never applies that principle to itself.',
      'Parameterization only protects VALUES because placeholders (<code>$1</code>, <code>?</code>) are a database-level mechanism for substituting data — there is no equivalent placeholder mechanism for identifiers like column or table names at all, in any SQL dialect.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Exploiting the Unvalidated Column Name',
    language: 'typescript',
    code: `import { buildSafeQuery } from './safe-query-builder';

// If ANY part of the app builds \`filters\` from user-controlled keys --
// a common pattern for "flexible" search/filter APIs that let callers
// choose which field to filter on -- the column name itself becomes
// attacker-controlled.
const userControlledFilters = {
  // The attacker supplies this as the FIELD NAME to filter by, not
  // the value -- e.g. via a query string like ?field=...&value=...
  '1=1); DROP TABLE users;--': 'anything',
};

const { sql } = buildSafeQuery('users', userControlledFilters);

console.log(sql);
// SELECT * FROM users WHERE 1=1); DROP TABLE users;-- = $1
//
// The table name was correctly allowlisted -- 'users' passes the
// check. But nothing validated the FILTER KEY before it was
// interpolated directly into the SQL string. The value itself
// ('anything') never mattered; the column name WAS the payload.`,
  },
  {
    label: 'The Fix: Allowlist Column Names Too',
    language: 'typescript',
    code: `const ALLOWED_TABLES = ['users', 'orders', 'products'] as const;

// One allowlist PER TABLE -- a column valid on 'orders' isn't
// automatically assumed valid on 'users'.
const ALLOWED_COLUMNS: Record<typeof ALLOWED_TABLES[number], string[]> = {
  users:    ['email', 'active', 'display_name'],
  orders:   ['status', 'user_id', 'created_at'],
  products: ['category', 'in_stock'],
};

function buildSafeQuery(
  table: string,
  filters: Record<string, string | number>
): { sql: string; params: (string | number)[] } {
  if (!ALLOWED_TABLES.includes(table as any)) {
    throw new Error('Invalid table');
  }

  const allowedCols = ALLOWED_COLUMNS[table as typeof ALLOWED_TABLES[number]];
  const params: (string | number)[] = [];
  const conditions: string[] = [];

  for (const [col, val] of Object.entries(filters)) {
    // The fix: reject any column not on THIS table's own allowlist,
    // exactly the same allowlist pattern the Challenge already uses
    // for the table name -- just applied one level deeper.
    if (!allowedCols.includes(col)) {
      throw new Error(\`Invalid column: \${col}\`);
    }
    params.push(val);
    conditions.push(\`\${col} = $\${params.length}\`);
  }

  const where = conditions.length > 0 ? \` WHERE \${conditions.join(' AND ')}\` : '';
  return { sql: \`SELECT * FROM \${table}\${where}\`, params };
}

// The same attack now throws before any SQL string is even built:
// buildSafeQuery('users', { '1=1); DROP TABLE users;--': 'x' });
// -> Error: Invalid column: 1=1); DROP TABLE users;--`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Using the fixed version, a caller requests <code>buildSafeQuery(\'orders\', { status: \'shipped\' })</code>. Does it succeed? What about <code>buildSafeQuery(\'orders\', { in_stock: true })</code>?',
  hint: 'Check the ALLOWED_COLUMNS map for exactly which table each column name is registered under.',
  solution: `// buildSafeQuery('orders', { status: 'shipped' }) -- SUCCEEDS.
// 'status' is in ALLOWED_COLUMNS.orders.

// buildSafeQuery('orders', { in_stock: true }) -- THROWS.
// 'in_stock' is only registered under ALLOWED_COLUMNS.products, not
// orders. This is exactly why the fix uses a PER-TABLE column
// allowlist rather than one flat list of "known good" column names
// shared across every table -- a column name that's legitimately safe
// on one table isn't automatically safe to accept on a different one,
// since it might not even exist as a real column there at all.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the VALUES in the Challenge\'s query builder are correctly parameterized ($1, $2), the whole function is safe from SQL injection.',
    reality: 'Parameterization only protects data VALUES. The column names come from <code>Object.keys(filters)</code> and are concatenated directly into the SQL string with no check at all — a completely separate, unprotected injection vector in the exact same function.',
  },
  {
    thought: 'A placeholder like <code>$1</code> could theoretically be used for a column name too, the same way it\'s used for a value.',
    reality: 'Placeholders are a database-level mechanism specifically for substituting DATA — no SQL dialect (Postgres, MySQL, MSSQL) supports parameterizing an identifier like a column or table name through a bind placeholder. Allowlisting is the only real defense for identifiers.',
  },
  {
    thought: 'One shared list of "safe" column names works for allowlisting across every table in the database.',
    reality: 'A column valid on one table may not exist — or may mean something different — on another. The fix keys the allowlist per table (<code>ALLOWED_COLUMNS[table]</code>), not as one flat list shared across all of them.',
  },
];

@Component({
  selector: 'app-sec-injection-column-gap',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './safe-query-builders-own-column-name-gap.html',
  styleUrl: './safe-query-builders-own-column-name-gap.scss',
})
export class SafeQueryBuildersOwnColumnNameGapSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
