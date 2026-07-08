import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-search-table-injection-vs-access-control-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './search-table-is-injection-safe-but-not-access-control-safe.html',
  styleUrl: './search-table-is-injection-safe-but-not-access-control-safe.scss',
})
export class SearchTableIsInjectionSafeButNotAccessControlSafeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two Different Kinds of "Safe," Conflated Into One',
      points: [
        'The main page\'s search_table() function is presented as a demonstration of safe dynamic SQL: it uses FORMAT(...%I...%I...%I...%L...) to quote every identifier and value, and the surrounding theory correctly explains that %I/%L prevent SQL injection. That part is true — no attacker can break out of the query structure via p_table, p_column, or p_value.',
        'But injection-safety and access-control-safety are two completely different properties. search_table(p_table, p_column, p_value) accepts p_table and p_column as free-form caller input with NO validation against a whitelist — meaning any caller who can invoke this function can read from ANY table and ANY column the database role executing it has SELECT access to, simply by passing a different table/column name. The page\'s own separate Q&A on multi-tenant schema switching states this exact requirement directly: "Validate the schema name against a whitelist (tenant table) before using it in the query — never trust a raw caller-supplied schema string." search_table() never does this.',
      ],
    },
    {
      heading: 'Why This Matters More Than It Looks',
      points: [
        'If search_table() is exposed to an application role broader than intended — or worse, marked SECURITY DEFINER to run with elevated privileges — a caller who was only supposed to search a "products" table can instead call search_table(\'employees\', \'ssn\', \'123-45-6789\') and read data they were never authorized to see. No SQL injection occurred at any point; the function did exactly what its (unsafe) design allows.',
        'This subtopic demonstrates the exposure directly, then adds the whitelist check the page\'s own Q&A already recommends — turning "safely quoted, but unrestricted" into "safely quoted AND restricted to an approved set of tables."',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own search_table — injection-safe, access-unsafe',
      language: 'sql',
      code: `-- Tables the caller was intended to search:
CREATE TABLE products (id INT, name TEXT);
INSERT INTO products VALUES (1, 'Widget');

-- A table the caller was NEVER meant to access:
CREATE TABLE employees (id INT, ssn TEXT);
INSERT INTO employees VALUES (1, '123-45-6789');

-- The main page's own function, exactly as published:
CREATE OR REPLACE FUNCTION search_table(
    p_table  TEXT, p_column TEXT, p_value TEXT
)
RETURNS TABLE(id INT, result TEXT)
LANGUAGE plpgsql
AS $$
DECLARE sql TEXT;
BEGIN
    sql := FORMAT(
        'SELECT id, %I::TEXT FROM %I WHERE %I = %L',
        p_column, p_table, p_column, p_value
    );
    RETURN QUERY EXECUTE sql;
END;
$$;

-- The intended use:
SELECT * FROM search_table('products', 'name', 'Widget');
-- id | result
-- ---+--------
--  1 | Widget

-- No SQL injection attempt at all -- just a different, valid table name:
SELECT * FROM search_table('employees', 'ssn', '123-45-6789');
-- id | result
-- ---+------------
--  1 | 123-45-6789
-- The function happily returns SSNs. %I quoted "employees" and "ssn"
-- perfectly safely -- there is no injection here. The function was
-- simply never restricted to the tables it was meant to search.`,
    },
    {
      label: 'Adding the whitelist the page\'s own Q&A already recommends',
      language: 'sql',
      code: `CREATE TABLE searchable_tables (table_name TEXT PRIMARY KEY);
INSERT INTO searchable_tables VALUES ('products');   -- only products is approved

CREATE OR REPLACE FUNCTION search_table_safe(
    p_table  TEXT, p_column TEXT, p_value TEXT
)
RETURNS TABLE(id INT, result TEXT)
LANGUAGE plpgsql
AS $$
DECLARE sql TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM searchable_tables WHERE table_name = p_table) THEN
        RAISE EXCEPTION 'Table % is not searchable', p_table;
    END IF;

    sql := FORMAT(
        'SELECT id, %I::TEXT FROM %I WHERE %I = %L',
        p_column, p_table, p_column, p_value
    );
    RETURN QUERY EXECUTE sql;
END;
$$;

SELECT * FROM search_table_safe('products', 'name', 'Widget');  -- works
SELECT * FROM search_table_safe('employees', 'ssn', '123-45-6789');
-- ERROR: Table employees is not searchable
-- Now access is restricted to an explicit, approved list -- exactly
-- what the page's own multi-tenant Q&A describes as required, applied
-- to the search_table() example the page never actually applied it to.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security review approves the main page\'s search_table() function because "it uses FORMAT with %I and %L, so it\'s not vulnerable to SQL injection" — which is true. A penetration test later flags it anyway. Based on the demonstration above, what did the security review miss, and was the pen test wrong to flag it?',
    hint: 'The pen test isn\'t claiming SQL injection — check what OTHER category of vulnerability the function exposes despite being injection-safe.',
    solution: `The security review's injection assessment was correct but incomplete
— it verified one property (injection-safety, via %I/%L) and treated
that as sufficient, without checking a completely separate property
(access control). The pen test was right to flag it: search_table()
lets any caller read from ANY table the database role can SELECT
from, simply by passing a different table name — no injection needed,
since the function's DESIGN, not its quoting, is what's unsafe.

This is exactly the distinction the main page's own multi-tenant
schema-switching Q&A describes elsewhere: "Validate the schema name
against a whitelist... never trust a raw caller-supplied schema
string" — advice search_table() never follows. The fix isn't better
quoting (the quoting was already correct) — it's adding the
whitelist check shown above, restricting p_table to an explicit,
approved set of tables regardless of how safely the SQL string
around it is constructed.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a dynamic SQL function correctly uses %I and %L (or QUOTENAME/sp_executesql parameters) for every identifier and value, it is fully "safe" with no further review needed.',
      reality: 'correct quoting only guarantees injection-safety — it says nothing about whether the function should be allowed to access whatever table/column name a caller happens to supply, which is a separate, access-control concern.',
    },
    {
      thought: 'a penetration test flagging a properly-quoted dynamic SQL function as vulnerable must indicate the quoting itself is broken somewhere.',
      reality: 'a function can be perfectly injection-safe (correct quoting throughout) while still being an authorization bypass — allowing access to data the caller was never meant to see, simply because the target table/column isn\'t restricted to an approved list.',
    },
    {
      thought: 'a generic "search any table by name" utility function is inherently useful and safe to expose broadly, as long as its SQL construction is injection-safe.',
      reality: 'a generic search-any-table function is exactly the kind of utility that needs a whitelist or role-based restriction — its generality is precisely what makes it dangerous to expose without one, regardless of how safely it builds its SQL.',
    },
  ];
}
