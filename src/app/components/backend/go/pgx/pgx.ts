import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-go-pgx',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './pgx.html',
  styleUrl: './pgx.scss'
})
export class GoPgx {
  readingTime = 25;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'pgx v5+';
  route = 'go-pgx';
  nextRoute = '/go/gorm';
  nextLabel = 'GORM';

  quickRef: QuickRefItem[] = [
    { name: 'pgxpool.New(ctx, connString)', type: 'function', desc: 'Create connection pool — the primary way to connect in pgx v5' },
    { name: 'pool.QueryRow(ctx, sql, args...)', type: 'method', desc: 'Execute query returning a single row; scan immediately' },
    { name: 'pool.Query(ctx, sql, args...)', type: 'method', desc: 'Execute query returning multiple rows; must close rows' },
    { name: 'rows.Scan(&col1, &col2)', type: 'method', desc: 'Scan current row columns into variables' },
    { name: 'pool.Exec(ctx, sql, args...)', type: 'method', desc: 'Execute INSERT/UPDATE/DELETE; returns CommandTag' },
    { name: 'pgx.ErrNoRows', type: 'type', desc: 'Returned by QueryRow.Scan when no rows match — check explicitly' },
    { name: 'pool.Begin(ctx)', type: 'method', desc: 'Start a transaction; returns pgx.Tx with Commit/Rollback' },
    { name: 'defer tx.Rollback(ctx)', type: 'syntax', desc: 'Safe pattern: defer rollback (no-op after Commit succeeds)' },
    { name: 'pgxpool.Config{MaxConns: N}', type: 'type', desc: 'Configure pool size, health checks, and connection lifetime' },
    { name: 'pgx.CollectRows(rows, pgx.RowToStructByName)', type: 'function', desc: 'pgx v5 helper: scan all rows into a slice of structs' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'pgx vs database/sql',
      points: [
        'pgx is a PostgreSQL-only driver and toolkit. It is faster than database/sql because it uses the PostgreSQL binary protocol and avoids reflection-heavy scan.',
        'pgxpool (connection pool) is the standard entry point — use it for servers. pgx.Connect is for one-off connections (scripts, migrations).',
        'pgx v5 (current) ships pgx.CollectRows and pgx.RowToStructByName helpers that eliminate most manual scan boilerplate.',
        'pgx supports PostgreSQL-native types: arrays, JSONB, UUID, hstore, numeric — without the string-conversion workarounds needed in database/sql.',
        'For ORM features on top of pgx: use pggen (code-gen) or GORM with pgx as the underlying driver.',
      ]
    },
    {
      heading: 'Connection pools with pgxpool',
      points: [
        'pgxpool.New(ctx, connString) creates a pool. The connection string can be a DSN or a URL: postgres://user:pass@host/db.',
        'Pool configuration: pgxpool.ParseConfig(connStr) returns *pgxpool.Config; set MaxConns, MinConns, MaxConnLifetime, HealthCheckPeriod before calling pgxpool.NewWithConfig.',
        'Always defer pool.Close() and pass context to every pool method so queries respect deadlines and cancellation.',
        'The pool is goroutine-safe — share one pool across all HTTP handlers. Creating a pool per request is a major antipattern.',
        'Default MaxConns is min(4, GOMAXPROCS). For production web services, tune to 10–20 depending on Postgres server resources.',
      ]
    },
    {
      heading: 'Querying and scanning',
      points: [
        'QueryRow returns a pgx.Row. Call .Scan(&vars) immediately — it is not deferred.',
        'Query returns pgx.Rows. Always defer rows.Close() and check rows.Err() after the scan loop.',
        'pgx v5 helpers: pgx.CollectRows(rows, pgx.RowToStructByName[T]) scans all rows into []T using struct field names matched to column names (case-insensitive).',
        'Use $1, $2, ... positional placeholders — never string-interpolate user input into SQL (SQL injection).',
        'Exec returns pgx.CommandTag: ct.RowsAffected() tells you how many rows were updated or deleted.',
      ]
    },
    {
      heading: 'Transactions',
      points: [
        'pool.Begin(ctx) starts a transaction and returns pgx.Tx. Use tx.QueryRow, tx.Query, tx.Exec inside the transaction.',
        'Idiomatic pattern: defer tx.Rollback(ctx) immediately after Begin. If Commit succeeds, the subsequent Rollback is a no-op.',
        'Always pass the same context to Begin and all transaction operations — if the context is cancelled, the transaction is automatically rolled back.',
        'pgx.BeginTxFunc runs a function inside a transaction and auto-commits or rolls back based on whether the function returns an error.',
        'For serializable isolation or advisory locks, pass pgx.TxOptions to BeginTx.',
      ]
    },
    {
      heading: 'Error handling',
      points: [
        'Check pgx.ErrNoRows after QueryRow.Scan when the query might find nothing — do not treat it as a fatal error.',
        'pgconn.PgError carries PostgreSQL error codes: err.(*pgconn.PgError).Code gives "23505" for unique violation, "23503" for foreign key.',
        'Wrap errors before returning: fmt.Errorf("getUserByID %s: %w", id, err) — preserve the pgx error for the caller to inspect.',
        'context.DeadlineExceeded from a cancelled context propagates correctly — the pool cleans up the connection automatically.',
        'errors.As(err, &pgErr) is the standard way to extract a *pgconn.PgError from a wrapped error chain.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Pool & Basic Query',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "log"
    "time"

    "github.com/jackc/pgx/v5/pgxpool"
)

type User struct {
    ID    int
    Name  string
    Email string
}

func main() {
    ctx := context.Background()

    // Configure pool
    config, err := pgxpool.ParseConfig("postgres://user:pass@localhost/mydb")
    if err != nil {
        log.Fatal(err)
    }
    config.MaxConns = 20
    config.MaxConnLifetime = 30 * time.Minute
    config.HealthCheckPeriod = time.Minute

    pool, err := pgxpool.NewWithConfig(ctx, config)
    if err != nil {
        log.Fatal("connect:", err)
    }
    defer pool.Close()

    // QueryRow — single result
    var u User
    err = pool.QueryRow(ctx,
        "SELECT id, name, email FROM users WHERE id = $1", 1,
    ).Scan(&u.ID, &u.Name, &u.Email)
    if err != nil {
        log.Fatal("scan:", err)
    }
    fmt.Println(u.Name, u.Email)

    // Exec — INSERT / UPDATE / DELETE
    ct, err := pool.Exec(ctx,
        "UPDATE users SET name = $1 WHERE id = $2", "Alice Updated", 1,
    )
    if err != nil {
        log.Fatal("exec:", err)
    }
    fmt.Println("rows affected:", ct.RowsAffected())
}`
    },
    {
      label: 'Rows & CollectRows',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "log"

    "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgxpool"
)

type Product struct {
    ID       int     \`db:"id"\`
    Name     string  \`db:"name"\`
    Price    float64 \`db:"price"\`
    Category string  \`db:"category"\`
}

func listProducts(ctx context.Context, pool *pgxpool.Pool, category string) ([]Product, error) {
    // --- Manual scan ---
    rows, err := pool.Query(ctx,
        "SELECT id, name, price, category FROM products WHERE category = $1",
        category,
    )
    if err != nil {
        return nil, fmt.Errorf("query: %w", err)
    }
    defer rows.Close() // always defer

    var products []Product
    for rows.Next() {
        var p Product
        if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Category); err != nil {
            return nil, fmt.Errorf("scan: %w", err)
        }
        products = append(products, p)
    }
    if err := rows.Err(); err != nil { // check for iteration errors
        return nil, fmt.Errorf("rows: %w", err)
    }
    return products, nil
}

func listProductsV5(ctx context.Context, pool *pgxpool.Pool, category string) ([]Product, error) {
    // --- pgx v5 helper: no manual loop needed ---
    rows, err := pool.Query(ctx,
        "SELECT id, name, price, category FROM products WHERE category = $1",
        category,
    )
    if err != nil {
        return nil, fmt.Errorf("query: %w", err)
    }
    // CollectRows closes rows automatically and returns []Product
    return pgx.CollectRows(rows, pgx.RowToStructByName[Product])
}

func main() {
    // demo — pool setup omitted for brevity
    log.Println("pgx v5 CollectRows eliminates scan boilerplate")
}`
    },
    {
      label: 'Transactions',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"

    "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgxpool"
)

func transferFunds(ctx context.Context, pool *pgxpool.Pool, fromID, toID int, amount float64) error {
    tx, err := pool.Begin(ctx)
    if err != nil {
        return fmt.Errorf("begin: %w", err)
    }
    defer tx.Rollback(ctx) // no-op if Commit already succeeded

    // Deduct from sender
    var balance float64
    err = tx.QueryRow(ctx,
        "SELECT balance FROM accounts WHERE id = $1 FOR UPDATE", fromID,
    ).Scan(&balance)
    if err != nil {
        return fmt.Errorf("get balance: %w", err)
    }
    if balance < amount {
        return fmt.Errorf("insufficient funds: have %.2f, need %.2f", balance, amount)
    }

    _, err = tx.Exec(ctx,
        "UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, fromID,
    )
    if err != nil {
        return fmt.Errorf("deduct: %w", err)
    }

    // Credit recipient
    _, err = tx.Exec(ctx,
        "UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, toID,
    )
    if err != nil {
        return fmt.Errorf("credit: %w", err)
    }

    return tx.Commit(ctx) // rollback deferred above is a no-op after this
}

// Alternative: pgx.BeginTxFunc auto-commits or rolls back
func transferFundsFunc(ctx context.Context, pool *pgxpool.Pool, fromID, toID int, amount float64) error {
    return pgx.BeginTxFunc(ctx, pool, pgx.TxOptions{}, func(tx pgx.Tx) error {
        _, err := tx.Exec(ctx, "UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, fromID)
        if err != nil { return err }
        _, err = tx.Exec(ctx, "UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, toID)
        return err
    })
}`
    },
    {
      label: 'Error Handling',
      language: 'typescript',
      code: `package main

import (
    "context"
    "errors"
    "fmt"

    "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgconn"
    "github.com/jackc/pgx/v5/pgxpool"
)

type User struct{ ID int; Email string }

func getUserByEmail(ctx context.Context, pool *pgxpool.Pool, email string) (*User, error) {
    var u User
    err := pool.QueryRow(ctx,
        "SELECT id, email FROM users WHERE email = $1", email,
    ).Scan(&u.ID, &u.Email)

    if errors.Is(err, pgx.ErrNoRows) {
        return nil, nil // not found — not an error
    }
    if err != nil {
        return nil, fmt.Errorf("getUserByEmail %s: %w", email, err)
    }
    return &u, nil
}

func createUser(ctx context.Context, pool *pgxpool.Pool, email string) error {
    _, err := pool.Exec(ctx,
        "INSERT INTO users (email) VALUES ($1)", email,
    )
    if err != nil {
        // Check for unique violation (PostgreSQL error code 23505)
        var pgErr *pgconn.PgError
        if errors.As(err, &pgErr) && pgErr.Code == "23505" {
            return fmt.Errorf("email %q already exists", email)
        }
        return fmt.Errorf("createUser: %w", err)
    }
    return nil
}

func main() {
    // Usage example
    ctx := context.Background()
    fmt.Println("pgx error handling patterns")
    _ = ctx // pool setup omitted
}`
    },
    {
      label: 'JSONB & Arrays',
      language: 'typescript',
      code: `package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"

    "github.com/jackc/pgx/v5/pgxpool"
)

type Metadata map[string]any

func main() {
    ctx := context.Background()
    pool, _ := pgxpool.New(ctx, "postgres://user:pass@localhost/mydb")
    defer pool.Close()

    // --- JSONB column ---
    // Schema: CREATE TABLE events (id SERIAL, meta JSONB);
    meta := Metadata{"source": "api", "version": 2, "tags": []string{"go", "pgx"}}
    metaJSON, _ := json.Marshal(meta)

    _, err := pool.Exec(ctx,
        "INSERT INTO events (meta) VALUES ($1)", metaJSON,
    )
    if err != nil {
        log.Fatal(err)
    }

    var raw []byte
    pool.QueryRow(ctx, "SELECT meta FROM events LIMIT 1").Scan(&raw)
    var m Metadata
    json.Unmarshal(raw, &m)
    fmt.Println("source:", m["source"])

    // --- PostgreSQL arrays ---
    // Schema: CREATE TABLE tags (id SERIAL, names TEXT[]);
    tags := []string{"go", "postgresql", "pgx"}
    _, err = pool.Exec(ctx,
        "INSERT INTO tags (names) VALUES ($1)", tags,
    )
    if err != nil {
        log.Fatal(err)
    }

    var result []string
    pool.QueryRow(ctx, "SELECT names FROM tags LIMIT 1").Scan(&result)
    fmt.Println("tags:", result) // [go postgresql pgx]
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Creating a pool per request instead of sharing one',
      wrong: `func handler(w http.ResponseWriter, r *http.Request) {
    pool, _ := pgxpool.New(r.Context(), connStr) // new pool per HTTP request!
    defer pool.Close()
    // ...
}`,
      right: `// Create once at startup, inject into handlers
var pool *pgxpool.Pool
func main() {
    pool, _ = pgxpool.New(context.Background(), connStr)
    defer pool.Close()
    http.HandleFunc("/", handler)
    http.ListenAndServe(":8080", nil)
}`,
      explanation: 'pgxpool.New creates a pool of connections with TCP handshakes and authentication. Creating one per request defeats connection pooling entirely and introduces enormous latency. Create one pool at startup and share it across all handlers — it is goroutine-safe.'
    },
    {
      title: 'Not closing rows after Query',
      wrong: `rows, err := pool.Query(ctx, "SELECT id, name FROM users")
if err != nil { return err }
// forgot defer rows.Close() — connection held until GC`,
      right: `rows, err := pool.Query(ctx, "SELECT id, name FROM users")
if err != nil { return err }
defer rows.Close() // always defer immediately after nil check`,
      explanation: 'pgx.Rows holds a database connection from the pool until closed. Forgetting rows.Close() leaks connections — the pool fills up and subsequent queries hang or time out. Always defer rows.Close() right after the nil check on the error.'
    },
    {
      title: 'Not checking rows.Err() after scan loop',
      wrong: `for rows.Next() {
    rows.Scan(&id, &name)
}
// missed: rows may have stopped early due to a network error`,
      right: `for rows.Next() {
    if err := rows.Scan(&id, &name); err != nil {
        return err
    }
}
if err := rows.Err(); err != nil {
    return fmt.Errorf("rows iteration: %w", err)
}`,
      explanation: 'rows.Next() returns false both at end-of-result and on error. If iteration stops due to a network error, you get incomplete data without knowing it. Always check rows.Err() after the loop — it returns nil on normal completion and the error on failure.'
    },
    {
      title: 'String interpolation in SQL (SQL injection)',
      wrong: `userInput := r.FormValue("id")
query := fmt.Sprintf("SELECT * FROM users WHERE id = %s", userInput)
pool.Query(ctx, query) // SQL injection: id = "1 OR 1=1"`,
      right: `userInput := r.FormValue("id")
pool.Query(ctx, "SELECT * FROM users WHERE id = $1", userInput)`,
      explanation: 'Never interpolate user input into SQL strings — it enables SQL injection attacks. pgx uses positional placeholders ($1, $2, ...) and parameterised queries. The driver sends parameters separately from the query, making injection structurally impossible.'
    },
    {
      title: 'Not handling pgx.ErrNoRows in QueryRow',
      wrong: `var u User
err := pool.QueryRow(ctx, "SELECT id, name FROM users WHERE id = $1", id).Scan(&u.ID, &u.Name)
if err != nil {
    return nil, err // returns error when user simply doesn't exist
}`,
      right: `var u User
err := pool.QueryRow(ctx, "SELECT id, name FROM users WHERE id = $1", id).Scan(&u.ID, &u.Name)
if errors.Is(err, pgx.ErrNoRows) {
    return nil, nil // not found — caller decides what to do
}
if err != nil {
    return nil, fmt.Errorf("getUser %d: %w", id, err)
}`,
      explanation: 'When QueryRow finds no matching row, Scan returns pgx.ErrNoRows — a normal condition, not a database error. Treating it as an unhandled error propagates a confusing internal error to the caller. Check for it explicitly and return (nil, nil) or a domain-level "not found" error.'
    },
    {
      title: 'Not deferring tx.Rollback after Begin',
      wrong: `tx, err := pool.Begin(ctx)
if err != nil { return err }
// no defer rollback — if function returns early, transaction leaks`,
      right: `tx, err := pool.Begin(ctx)
if err != nil { return err }
defer tx.Rollback(ctx) // safe: no-op after Commit, prevents leaks on early return
// ... do work ...
return tx.Commit(ctx)`,
      explanation: 'If a function returns before calling Commit (due to an error or early return), an open transaction holds locks and connections until the server-side timeout expires. defer tx.Rollback() releases everything immediately. After Commit succeeds, the deferred Rollback is a no-op.'
    },
  ];

  challenge: Challenge = {
    title: 'User Repository with Transactions',
    language: 'typescript',
    description: `Implement a \`UserRepository\` that manages users in PostgreSQL using pgx.

**Schema:**
\`\`\`sql
CREATE TABLE users (
    id    SERIAL PRIMARY KEY,
    name  TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
);
\`\`\`

**Interface to implement:**
\`\`\`go
type UserRepo interface {
    Create(ctx context.Context, name, email string) (*User, error)
    GetByID(ctx context.Context, id int) (*User, error)   // nil, nil if not found
    List(ctx context.Context) ([]User, error)
    Delete(ctx context.Context, id int) (bool, error)     // bool: was deleted
}
\`\`\`

Requirements:
- Return nil, nil from GetByID when user not found (check pgx.ErrNoRows)
- Wrap PostgreSQL unique violation (code 23505) on Create with a descriptive error
- Delete returns false (not an error) when the user does not exist
- Use parameterised queries — never fmt.Sprintf into SQL`,
    hints: [
      'Use pgx.CollectRows(rows, pgx.RowToStructByName[User]) for List',
      'Check errors.Is(err, pgx.ErrNoRows) in GetByID after Scan',
      'Use errors.As(err, &pgErr) && pgErr.Code == "23505" for unique violation in Create',
      'ct.RowsAffected() == 0 in Delete means the user did not exist',
    ],
    starterCode: `package main

import (
    "context"
    "errors"
    "fmt"

    "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgconn"
    "github.com/jackc/pgx/v5/pgxpool"
)

type User struct {
    ID    int    \`db:"id"\`
    Name  string \`db:"name"\`
    Email string \`db:"email"\`
}

type userRepo struct{ pool *pgxpool.Pool }

func (r *userRepo) Create(ctx context.Context, name, email string) (*User, error) {
    // TODO: INSERT, return user with generated id, handle unique violation
    return nil, fmt.Errorf("not implemented")
}

func (r *userRepo) GetByID(ctx context.Context, id int) (*User, error) {
    // TODO: SELECT by id, return nil,nil if not found
    return nil, fmt.Errorf("not implemented")
}

func (r *userRepo) List(ctx context.Context) ([]User, error) {
    // TODO: SELECT all users using CollectRows
    return nil, fmt.Errorf("not implemented")
}

func (r *userRepo) Delete(ctx context.Context, id int) (bool, error) {
    // TODO: DELETE, return false if rows affected == 0
    return false, fmt.Errorf("not implemented")
}

// suppress unused import warnings in playground
var _ = errors.New
var _ *pgconn.PgError
var _ pgx.ErrNoRows`,
    solution: `package main

import (
    "context"
    "errors"
    "fmt"

    "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgconn"
    "github.com/jackc/pgx/v5/pgxpool"
)

type User struct {
    ID    int    \`db:"id"\`
    Name  string \`db:"name"\`
    Email string \`db:"email"\`
}

type userRepo struct{ pool *pgxpool.Pool }

func (r *userRepo) Create(ctx context.Context, name, email string) (*User, error) {
    var u User
    err := r.pool.QueryRow(ctx,
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email",
        name, email,
    ).Scan(&u.ID, &u.Name, &u.Email)
    if err != nil {
        var pgErr *pgconn.PgError
        if errors.As(err, &pgErr) && pgErr.Code == "23505" {
            return nil, fmt.Errorf("email %q already exists", email)
        }
        return nil, fmt.Errorf("create user: %w", err)
    }
    return &u, nil
}

func (r *userRepo) GetByID(ctx context.Context, id int) (*User, error) {
    var u User
    err := r.pool.QueryRow(ctx,
        "SELECT id, name, email FROM users WHERE id = $1", id,
    ).Scan(&u.ID, &u.Name, &u.Email)
    if errors.Is(err, pgx.ErrNoRows) {
        return nil, nil
    }
    if err != nil {
        return nil, fmt.Errorf("getUser %d: %w", id, err)
    }
    return &u, nil
}

func (r *userRepo) List(ctx context.Context) ([]User, error) {
    rows, err := r.pool.Query(ctx, "SELECT id, name, email FROM users ORDER BY id")
    if err != nil {
        return nil, fmt.Errorf("list users: %w", err)
    }
    return pgx.CollectRows(rows, pgx.RowToStructByName[User])
}

func (r *userRepo) Delete(ctx context.Context, id int) (bool, error) {
    ct, err := r.pool.Exec(ctx, "DELETE FROM users WHERE id = $1", id)
    if err != nil {
        return false, fmt.Errorf("delete user %d: %w", id, err)
    }
    return ct.RowsAffected() > 0, nil
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why should you use pgxpool instead of pgx.Connect for a web server?',
      options: [
        'pgxpool manages a pool of connections so multiple goroutines can query concurrently without waiting',
        'pgxpool automatically retries failed queries',
        'pgx.Connect does not support parameterised queries',
        'pgxpool uses a different protocol that is faster than a single connection',
      ],
      answer: 0,
      explanation: 'A single pgx.Connect connection can only process one query at a time. Web servers handle many concurrent requests — without a pool, queries queue behind each other. pgxpool maintains multiple connections (default: min(4, GOMAXPROCS), tunable) so concurrent goroutines can query in parallel.'
    },
    {
      q: 'What does pgx.ErrNoRows indicate?',
      options: [
        'QueryRow.Scan found no matching rows — a normal condition, not a database failure',
        'The database connection was lost',
        'The query syntax was invalid',
        'The table is empty',
      ],
      answer: 0,
      explanation: 'pgx.ErrNoRows is returned by QueryRow.Scan when the SELECT found no matching rows. This is a normal application condition (user not found, record deleted), not a database error. Always check for it explicitly with errors.Is(err, pgx.ErrNoRows) and return a domain-level "not found" response.'
    },
    {
      q: 'What is the correct pattern for using a transaction in pgx?',
      options: [
        'Begin → defer Rollback → do work → Commit (Rollback is a no-op after Commit)',
        'Begin → do work → Commit or Rollback depending on error',
        'Use pool.WithTx helper — Begin/Commit/Rollback are internal',
        'Begin → Commit → if error call Rollback',
      ],
      answer: 0,
      explanation: 'The idiomatic pgx transaction pattern: tx, err := pool.Begin(ctx); defer tx.Rollback(ctx); // ... work ...; return tx.Commit(ctx). The deferred Rollback is a no-op after a successful Commit, but it ensures the transaction is rolled back on any early return (error, panic). Never skip the defer.'
    },
    {
      q: 'How do you detect a PostgreSQL unique constraint violation in pgx?',
      options: [
        'errors.As(err, &pgErr) where pgErr is *pgconn.PgError, then check pgErr.Code == "23505"',
        'errors.Is(err, pgx.ErrUniqueViolation)',
        'Check err.Error() contains "unique"',
        'pgx returns a typed UniqueViolationError that can be type-asserted directly',
      ],
      answer: 0,
      explanation: 'PostgreSQL sends error codes as 5-character strings. pgx wraps them in *pgconn.PgError. Use errors.As(err, &pgErr) to extract it from the error chain, then check pgErr.Code: "23505" for unique violation, "23503" for foreign key violation. Never string-match the error message.'
    },
    {
      q: 'Why must you always defer rows.Close() after pool.Query?',
      options: [
        'Rows holds a connection from the pool; Close returns it so other goroutines can use it',
        'Close flushes buffered results to the application',
        'Without Close, the query continues running on the server',
        'rows.Next() panics if Close was not called on a previous rows object',
      ],
      answer: 0,
      explanation: 'pgx.Rows borrows a connection from the pool for the duration of the result scan. If you do not call Close (or drain all rows), that connection is never returned to the pool. The pool fills up, subsequent pool.Query calls block waiting for a free connection, and the server appears to hang.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use pgx directly or database/sql with a pgx driver?',
      a: 'Prefer pgx directly (pgxpool) for new Go services. database/sql adds an abstraction layer designed for switching databases — if you are committed to PostgreSQL (and pgx is more commonly used with PostgreSQL), the abstraction adds overhead and hides pgx-specific features (arrays, JSONB, COPY protocol, binary encoding). Use database/sql only if you genuinely need to support multiple databases or are integrating with a library that requires the standard interface.'
    },
    {
      q: 'How many connections should I configure in the pool?',
      a: 'Start with 10–20 for a typical web service. Too few connections serialise queries; too many overwhelm Postgres (it spawns a backend process per connection, each using ~5–10 MB of shared memory). The optimal number depends on your query latency and Postgres server capacity. Monitor pool stats (pool.Stat()) and watch pg_stat_activity. RDS/Cloud SQL instances often cap at 100–500 connections total across all clients.'
    },
    {
      q: 'How do I safely use pgx in tests?',
      a: 'For unit tests: wrap your DB code behind an interface and test against a mock. For integration tests: spin up a real Postgres instance (Docker or testcontainers-go), create a fresh database per test with a unique name, run migrations, run the test, then drop the database. testcontainers-go automates the Docker lifecycle. Avoid in-memory SQLite as a Postgres substitute — schema and behaviour differences cause false passes.'
    },
    {
      q: 'What is pgx.BeginTxFunc and when should I use it?',
      a: 'pgx.BeginTxFunc(ctx, pool, opts, fn) runs fn inside a transaction and automatically commits if fn returns nil, or rolls back if it returns an error. It is a convenience wrapper for the Begin → defer Rollback → Commit pattern. Use it for simple transactions to reduce boilerplate. For complex cases where you need access to the transaction after the function returns, use the explicit Begin/Commit/Rollback pattern.'
    },
    {
      q: 'How do I use pgx with PostgreSQL arrays?',
      a: 'pgx natively supports Go slices as PostgreSQL arrays. Pass []string, []int64, etc. directly as query parameters — pgx encodes them as PostgreSQL array literals. For scanning, pgx decodes PostgreSQL arrays back into Go slices. No manual conversion needed: pool.Exec(ctx, "INSERT INTO t (tags) VALUES ($1)", []string{"a","b"}) and rows.Scan(&mySlice).'
    },
    {
      q: 'How do I handle database migrations with pgx?',
      a: 'pgx does not include migration tooling — use a separate library. golang-migrate is the most popular: it reads migration files (*.up.sql, *.down.sql) from a directory and applies them in order. Run migrations at application startup before accepting traffic: migrate.Up(). Use goose as an alternative with slightly different conventions. Never run migrations and application traffic on the same connection simultaneously — use a dedicated migration connection.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'pgx is the idiomatic PostgreSQL driver for Go — use pgxpool for servers, parameterised $1 queries, defer rows.Close(), check ErrNoRows, and always defer tx.Rollback().',
    mustKnow: [
      'Create one pgxpool at startup and share it — never create per-request pools.',
      'Always defer rows.Close() after pool.Query() to return the connection to the pool.',
      'Check rows.Err() after the scan loop — normal end vs network error are both false from Next().',
      'Use $1, $2 placeholders — never fmt.Sprintf SQL with user input (SQL injection).',
      'errors.Is(err, pgx.ErrNoRows) — not found is a normal condition, not a DB error.',
      'pgconn.PgError.Code "23505" = unique violation; "23503" = foreign key violation.',
      'Transaction pattern: Begin → defer Rollback → work → Commit. Rollback is no-op after Commit.',
    ],
    interviewFocus: [
      'Why does Go need a connection pool and how does pgxpool work?',
      'What happens if you forget rows.Close() or rows.Err()?',
      'How do you handle "not found" vs a real database error in pgx?',
      'What is the safe transaction pattern with defer Rollback?',
      'How do you detect a unique constraint violation in pgx?',
    ],
  };
}
