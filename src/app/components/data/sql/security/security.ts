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
  selector: 'app-sql-security',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './security.html',
  styleUrls: ['./security.scss']
})
export class SqlSecurity {

  quickRef: QuickRefItem[] = [
    { name: 'SQL Injection',           type: 'keyword', desc: 'Vulnerability: untrusted input alters the SQL query structure' },
    { name: 'Parameterized query',     type: 'syntax',  desc: 'Bind parameters — prevents injection by separating code from data' },
    { name: 'GRANT / REVOKE',          type: 'keyword', desc: 'Control which principals can execute which operations on which objects' },
    { name: 'Row-Level Security (RLS)',type: 'keyword', desc: 'MSSQL/PG: filter rows automatically based on user/session context' },
    { name: 'Always Encrypted (MSSQL)',type: 'keyword', desc: 'Encrypt sensitive columns so even DBAs cannot read plaintext' },
    { name: 'pgcrypto (PostgreSQL)',   type: 'keyword', desc: 'Extension: encrypt/decrypt column values with AES or PGP' },
    { name: 'EXECUTE AS / SET ROLE',   type: 'keyword', desc: 'Impersonate a different principal for the scope of a statement/session' },
    { name: 'Audit logging',           type: 'keyword', desc: 'MSSQL: SQL Audit; PG: pgaudit extension or trigger-based logging' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'SQL Injection — the root cause and fix',
      points: [
        'SQL injection happens when user-supplied input is concatenated into a SQL string and the database engine parses it as SQL syntax.',
        'Fix: always use parameterized queries (prepared statements). The parameter value is never parsed as SQL — it is treated as a literal string/number.',
        'ORM frameworks (EF Core, Hibernate, SQLAlchemy) parameterize by default — but raw string interpolation bypasses those protections.',
        'Stored procedures do NOT automatically prevent injection — a proc that builds dynamic SQL with EXEC(\'+input+\') is just as vulnerable.',
      ]
    },
    {
      heading: 'Principle of least privilege',
      points: [
        'Grant each application account only the permissions it needs: SELECT on some tables, INSERT/UPDATE on others, EXECUTE on specific stored procedures.',
        'Never connect application code with a DBA or sysadmin account.',
        'Use separate database users for read-only queries (reports) and write operations (transactional app).',
        'MSSQL: GRANT EXECUTE ON SCHEMA::app TO app_user; — grant execute on all procs in a schema at once.',
      ]
    },
    {
      heading: 'Row-Level Security (RLS)',
      points: [
        'MSSQL 2016+ and PostgreSQL: filter rows transparently based on a predicate function — the application does not need WHERE clauses for tenant isolation.',
        'MSSQL: CREATE SECURITY POLICY with a filter predicate function; PostgreSQL: CREATE POLICY with USING clause.',
        'Useful for multi-tenant databases where each user should only see their own rows.',
        'RLS bypass: MSSQL uses WITH (NOLOCK) / table owner; PostgreSQL uses BYPASSRLS role. Ensure super/admin accounts do not run tenant queries.',
      ]
    },
    {
      heading: 'Column-level encryption',
      points: [
        'Always Encrypted (MSSQL): client-side encryption — ciphertext stored in the database, plaintext never leaves the client. DBAs cannot read it.',
        'Supports deterministic encryption (allows equality filters) and randomized encryption (stronger, but no equality search).',
        'PostgreSQL pgcrypto: pgp_sym_encrypt / pgp_sym_decrypt store AES-encrypted bytes. Simpler but server-side — DBAs with access can decrypt.',
        'Transparent Data Encryption (TDE): encrypts the data file at rest — protects against physical disk theft, not against a compromised DBA account.',
      ]
    },
    {
      heading: 'Auditing',
      points: [
        'MSSQL: SQL Server Audit (CREATE SERVER AUDIT + AUDIT SPECIFICATION) writes to files, Windows Event Log, or Security Log. Capture INSERT/UPDATE/DELETE on sensitive tables.',
        'PostgreSQL: pgaudit extension logs DML/DDL per session or object. ALTER SYSTEM SET pgaudit.log = \'write, ddl\';',
        'Trigger-based auditing: an AFTER INSERT/UPDATE/DELETE trigger writes old/new values to an audit table — flexible but adds write latency.',
        'Always capture: WHO (user), WHAT (object + action), WHEN (timestamp), WHERE (client IP / app name).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'SQL Injection prevention',
      language: 'sql',
      code: `-- VULNERABLE: never do this
DECLARE @sql NVARCHAR(500) = 'SELECT * FROM users WHERE name = ''' + @userInput + '''';
EXEC(@sql);
-- Input "'; DROP TABLE users; --" destroys the table

-- SAFE: parameterized dynamic SQL (MSSQL)
DECLARE @safeSQL NVARCHAR(500) = N'SELECT * FROM users WHERE name = @name';
EXEC sp_executesql @safeSQL, N'@name NVARCHAR(100)', @name = @userInput;

-- SAFE: stored procedure with typed parameter (MSSQL)
CREATE PROCEDURE dbo.GetUser @name NVARCHAR(100)
AS
    SELECT id, name, email FROM dbo.users WHERE name = @name;
-- The @name parameter is always treated as a string value — never SQL

-- PostgreSQL: parameterized dynamic SQL
DO $$
DECLARE
    v_name TEXT := 'Alice';  -- comes from application as bind param
    v_result RECORD;
BEGIN
    -- Application should use $1 placeholder, not string concat
    -- EXECUTE 'SELECT * FROM users WHERE name = $1' USING v_name;
    FOR v_result IN
        SELECT * FROM users WHERE name = v_name
    LOOP
        RAISE NOTICE '%', v_result;
    END LOOP;
END $$;`
    },
    {
      label: 'GRANT / REVOKE (both dialects)',
      language: 'sql',
      code: `-- MSSQL: create an application login and user
CREATE LOGIN app_login WITH PASSWORD = 'Str0ng!Pass#2024';
USE MyDB;
CREATE USER app_user FOR LOGIN app_login;

-- Grant minimum permissions
GRANT SELECT ON dbo.products     TO app_user;
GRANT SELECT ON dbo.categories   TO app_user;
GRANT INSERT, UPDATE ON dbo.orders TO app_user;
GRANT EXECUTE ON SCHEMA::app     TO app_user;  -- all procs in 'app' schema

-- Revoke a permission
REVOKE DELETE ON dbo.orders FROM app_user;

-- Create a read-only role
CREATE ROLE readonly_role;
GRANT SELECT ON SCHEMA::dbo TO readonly_role;
ALTER ROLE readonly_role ADD MEMBER reporting_user;

-- PostgreSQL equivalent
CREATE USER app_user WITH PASSWORD 'Str0ng!Pass#2024';
GRANT CONNECT ON DATABASE mydb TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT ON products, categories TO app_user;
GRANT INSERT, UPDATE ON orders TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Create a read-only role in PostgreSQL
CREATE ROLE readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
GRANT readonly TO reporting_user;`
    },
    {
      label: 'Row-Level Security',
      language: 'sql',
      code: `-- MSSQL: RLS for multi-tenant isolation
-- Predicate function: only return rows where tenant_id matches current user
CREATE FUNCTION security.fn_tenant_filter(@tenant_id INT)
RETURNS TABLE WITH SCHEMABINDING
AS
RETURN SELECT 1 AS result
WHERE @tenant_id = CAST(SESSION_CONTEXT(N'TenantId') AS INT);

-- Create the security policy
CREATE SECURITY POLICY TenantFilter
ADD FILTER PREDICATE security.fn_tenant_filter(tenant_id)
ON dbo.orders
WITH (STATE = ON);

-- Application sets context before each query:
EXEC sp_set_session_context N'TenantId', @currentTenantId;
SELECT * FROM dbo.orders;  -- automatically filtered by tenant

-- PostgreSQL: RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_tenant_policy ON orders
    USING (tenant_id = current_setting('app.current_tenant_id')::INT);

-- Application sets the session variable:
-- SET app.current_tenant_id = '42';
SELECT * FROM orders;  -- automatically filtered`
    },
    {
      label: 'Audit logging via triggers',
      language: 'sql',
      code: `-- MSSQL: trigger-based audit table
CREATE TABLE dbo.orders_audit (
    audit_id   INT IDENTITY PRIMARY KEY,
    action     CHAR(1),          -- I/U/D
    order_id   INT,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by NVARCHAR(128) DEFAULT SYSTEM_USER,
    changed_at DATETIME2     DEFAULT SYSDATETIME()
);

CREATE TRIGGER trg_orders_audit
ON dbo.orders AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.orders_audit (action, order_id, old_status, new_status)
    SELECT
        CASE WHEN EXISTS(SELECT 1 FROM inserted) AND EXISTS(SELECT 1 FROM deleted) THEN 'U'
             WHEN EXISTS(SELECT 1 FROM inserted) THEN 'I'
             ELSE 'D' END,
        COALESCE(i.id, d.id),
        d.status,
        i.status
    FROM inserted i FULL JOIN deleted d ON i.id = d.id;
END;

-- PostgreSQL: audit trigger
CREATE TABLE orders_audit (
    audit_id   BIGSERIAL PRIMARY KEY,
    action     CHAR(1),
    order_id   INT,
    old_status TEXT,
    new_status TEXT,
    changed_by TEXT DEFAULT current_user,
    changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION fn_orders_audit() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO orders_audit (action, order_id, old_status, new_status)
    VALUES (
        LEFT(TG_OP, 1),
        COALESCE(NEW.id, OLD.id),
        OLD.status,
        NEW.status
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_audit
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION fn_orders_audit();`
    },
  ];

  challenge: Challenge = {
    title: 'Lock down a multi-tenant schema',
    language: 'sql',
    description: 'Design a security model for a multi-tenant SaaS application with an orders table that has a tenant_id column. (1) Create an app_user with only INSERT/SELECT/UPDATE on orders (no DELETE, no DDL). (2) Implement Row-Level Security so app_user can only see rows where tenant_id matches the session context. (3) Write a trigger that logs any DELETE on orders to an orders_delete_log table (even though app_user cannot delete — a sysadmin might).',
    hints: [
      'MSSQL: CREATE SECURITY POLICY with a filter predicate on tenant_id = SESSION_CONTEXT(N\'TenantId\').',
      'PostgreSQL: ENABLE ROW LEVEL SECURITY + CREATE POLICY … USING (tenant_id = current_setting(…)::INT).',
      'The audit trigger should capture OLD.* row values on DELETE.',
    ],
    starterCode: `-- Step 1: create restricted user
-- MSSQL / PostgreSQL

-- Step 2: RLS policy
-- CREATE SECURITY POLICY / CREATE POLICY

-- Step 3: delete audit trigger
CREATE TABLE orders_delete_log (...);
CREATE TRIGGER ... ON orders AFTER DELETE ...`,
    solution: `-- MSSQL solution

-- Step 1: restricted user
CREATE USER app_user FOR LOGIN app_login;
GRANT SELECT, INSERT, UPDATE ON dbo.orders TO app_user;
-- no DELETE, no DDL

-- Step 2: RLS
CREATE FUNCTION security.fn_tenant_filter(@tenant_id INT)
RETURNS TABLE WITH SCHEMABINDING
AS
RETURN SELECT 1 AS r
WHERE @tenant_id = CAST(SESSION_CONTEXT(N'TenantId') AS INT);

CREATE SECURITY POLICY TenantPolicy
ADD FILTER PREDICATE security.fn_tenant_filter(tenant_id) ON dbo.orders
WITH (STATE = ON);

-- Step 3: delete audit
CREATE TABLE dbo.orders_delete_log (
    log_id     INT IDENTITY PRIMARY KEY,
    order_id   INT,
    tenant_id  INT,
    deleted_by NVARCHAR(128) DEFAULT SYSTEM_USER,
    deleted_at DATETIME2 DEFAULT SYSDATETIME()
);

CREATE TRIGGER trg_orders_delete_log
ON dbo.orders AFTER DELETE
AS
BEGIN
    INSERT INTO dbo.orders_delete_log (order_id, tenant_id)
    SELECT id, tenant_id FROM deleted;
END;

-- PostgreSQL solution

-- Step 1
CREATE USER app_user WITH PASSWORD 'secure!';
GRANT SELECT, INSERT, UPDATE ON orders TO app_user;

-- Step 2
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_policy ON orders
    USING (tenant_id = current_setting('app.tenant_id')::INT);

-- Step 3
CREATE TABLE orders_delete_log (
    log_id    BIGSERIAL PRIMARY KEY,
    order_id  INT,
    tenant_id INT,
    deleted_by TEXT DEFAULT current_user,
    deleted_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION fn_log_delete() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO orders_delete_log (order_id, tenant_id)
    VALUES (OLD.id, OLD.tenant_id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_delete
AFTER DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION fn_log_delete();`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What makes a parameterized query immune to SQL injection?',
      options: [
        'It encrypts the query before sending it to the database',
        'Parameter values are sent separately from the SQL text and are never parsed as SQL syntax by the engine',
        'It validates that parameter values do not contain quotes',
        'It wraps values in CAST() to convert them to safe types'
      ],
      answer: 1,
      explanation: 'In a parameterized query, the SQL template is compiled once (or sent as a prepared statement), and parameter values are transmitted as typed data. The database engine substitutes them as literal values — the engine never parses the value as SQL text, so no injection is possible regardless of what characters the value contains.'
    },
    {
      q: 'Does using a stored procedure automatically prevent SQL injection?',
      options: [
        'Yes — stored procedures always use parameterized execution',
        'No — a stored procedure that builds dynamic SQL with string concatenation and EXEC() is just as vulnerable as inline SQL',
        'Yes — stored procedures run with fixed permissions that block injection',
        'No — stored procedures are vulnerable only to first-order injection'
      ],
      answer: 1,
      explanation: 'A stored procedure that does EXEC(\'SELECT * FROM \' + @table) or uses untrusted input in string concatenation is fully vulnerable. The stored procedure wrapper itself provides no protection — only parameterized execution (sp_executesql with @params, or typed proc parameters used directly) prevents injection.'
    },
    {
      q: 'What is the difference between TDE and Always Encrypted in MSSQL?',
      options: [
        'TDE encrypts all columns; Always Encrypted selects specific columns',
        'TDE encrypts data files at rest (protects against physical theft); Always Encrypted is client-side and keeps data encrypted even from DBAs and the server process',
        'They are identical — Always Encrypted is the newer name for TDE',
        'TDE works only on Azure; Always Encrypted works on-premises'
      ],
      answer: 1,
      explanation: 'TDE transparently encrypts the database files on disk — the server process decrypts data in memory, so anyone with server access or a DBA account can still read plaintext. Always Encrypted encrypts data in the client application; the server only ever sees ciphertext and cannot decrypt it without the client-side column master key.'
    },
    {
      q: 'In MSSQL Row-Level Security, what does a filter predicate do?',
      options: [
        'It blocks INSERT of rows that fail the predicate',
        'It transparently adds a WHERE condition to SELECT queries so users only see rows the predicate allows',
        'It encrypts rows that match the predicate',
        'It logs any attempt to access rows that fail the predicate'
      ],
      answer: 1,
      explanation: 'A filter predicate is silently added as a WHERE clause to every SELECT against the protected table. Rows where the predicate returns no result are invisible to the user — they do not appear in query results, COUNT(), or aggregates. Block predicates can additionally prevent INSERT/UPDATE/DELETE of rows that fail the predicate.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is EXECUTE AS / SECURITY DEFINER and when is it risky?',
      a: 'MSSQL: EXECUTE AS \'user\' inside a procedure runs it with the named user\'s permissions. PostgreSQL: CREATE FUNCTION … SECURITY DEFINER runs with the function owner\'s permissions. Both are useful for controlled privilege escalation (e.g., let app_user call a proc that queries a table it cannot access directly). Risk: if the function or proc accepts user input and builds dynamic SQL, the elevated privileges make injection far more damaging. Always validate inputs and use parameterization inside SECURITY DEFINER functions.',
    },
    {
      q: 'How do I prevent a user from bypassing RLS in PostgreSQL?',
      a: 'Two things: (1) The table owner and superusers bypass RLS by default. Create a separate role for the table (not a superuser) as the owner, and use FORCE ROW LEVEL SECURITY: ALTER TABLE orders FORCE ROW LEVEL SECURITY — this applies RLS even to the table owner. (2) Do not grant BYPASSRLS to application roles. Create POLICY … TO app_user to scope policies to specific roles.',
    },
    {
      q: 'Should I store passwords in the database?',
      a: 'Never store plaintext passwords. Preferred pattern: hash passwords in the application with bcrypt/Argon2 (slow, salted hashes) before storing. Do not use MD5 or SHA-256 alone — they are fast, making brute-force feasible. If you must hash in the database, PostgreSQL\'s pgcrypto provides crypt(password, gen_salt(\'bf\', 12)) (bcrypt), but application-layer hashing keeps the unhashed password off the wire entirely.',
    },
  ];
}
