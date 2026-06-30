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
  selector: 'app-go-context',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './context.html',
  styleUrl: './context.scss'
})
export class GoContext {
  readingTime = 22;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Go 1.7+';
  route = 'go-context';
  nextRoute = '/go/net-http';
  nextLabel = 'net/http & REST';

  quickRef: QuickRefItem[] = [
    { name: 'context.Background()', type: 'function', desc: 'Root context — use at top-level (main, server handler start)' },
    { name: 'context.TODO()', type: 'function', desc: 'Placeholder context — signals "will add cancellation later"' },
    { name: 'context.WithCancel(parent)', type: 'function', desc: 'Returns (ctx, cancel) — call cancel() to signal done' },
    { name: 'context.WithTimeout(parent, d)', type: 'function', desc: 'Cancels automatically after duration d' },
    { name: 'context.WithDeadline(parent, t)', type: 'function', desc: 'Cancels at absolute time t' },
    { name: 'context.WithValue(parent, key, val)', type: 'function', desc: 'Attach request-scoped value — use unexported key type' },
    { name: 'ctx.Done()', type: 'method', desc: 'Channel closed when context is cancelled or timed out' },
    { name: 'ctx.Err()', type: 'method', desc: 'context.Canceled or context.DeadlineExceeded after Done closes' },
    { name: 'ctx.Deadline()', type: 'method', desc: 'Returns the deadline time and whether one is set' },
    { name: 'defer cancel()', type: 'syntax', desc: 'Always defer cancel() to release resources when context is no longer needed' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is context.Context?',
      points: [
        '`context.Context` carries a cancellation signal, deadline, and request-scoped values across API boundaries and goroutines.',
        'It is the standard way to propagate cancellation: "stop what you\'re doing — the caller no longer needs the result."',
        'Context forms a tree: child contexts derive from parent contexts. Cancelling a parent cancels all descendants.',
        'Pass Context as the first parameter named `ctx` to every function that does I/O, waits for goroutines, or calls external services.',
        'Never store a Context in a struct — pass it explicitly through function calls.',
      ]
    },
    {
      heading: 'Creating contexts',
      points: [
        '`context.Background()` — root context for top-level calls (main, server entry). Never cancelled.',
        '`context.TODO()` — placeholder; signals you intend to wire up cancellation later. Equivalent to Background at runtime.',
        '`context.WithCancel(parent)` — returns a child context and a cancel function. Call cancel() when done.',
        '`context.WithTimeout(parent, d)` — auto-cancels after duration d OR when parent is cancelled.',
        '`context.WithDeadline(parent, t)` — auto-cancels at absolute time t. WithTimeout is a convenience wrapper.',
      ]
    },
    {
      heading: 'Responding to cancellation',
      points: [
        '`ctx.Done()` returns a channel that is closed when the context is cancelled.',
        'In blocking operations, use `select { case <-ctx.Done(): return ctx.Err() }` to stop cleanly.',
        '`ctx.Err()` returns `context.Canceled` (explicit cancel) or `context.DeadlineExceeded` (timeout).',
        'Long-running loops should check `ctx.Done()` at each iteration to honour cancellation promptly.',
        'Always defer cancel() immediately after creating a cancellable context to free resources even if the function returns early.',
      ]
    },
    {
      heading: 'context.WithValue — request-scoped data',
      points: [
        '`context.WithValue(parent, key, val)` attaches a value to the context. Retrieve with `ctx.Value(key)`.',
        'Use an unexported type for keys to avoid key collisions across packages: `type ctxKey struct{}`.',
        'Store only request-scoped data: trace IDs, auth tokens, request IDs. Never use it for optional function parameters.',
        '`ctx.Value` returns `any` — always type-assert: `v, ok := ctx.Value(myKey).(string)`.',
        'Values propagate through the context tree but cannot travel "up" — only children inherit parent values.',
      ]
    },
    {
      heading: 'Context in HTTP servers & clients',
      points: [
        'Every `*http.Request` carries a context: `r.Context()`. It is cancelled when the client disconnects.',
        'Pass `r.Context()` to downstream DB queries, RPC calls, and goroutines so they all stop if the client leaves.',
        'For outgoing HTTP requests, use `http.NewRequestWithContext(ctx, method, url, body)` to respect the caller\'s deadline.',
        'Database/SQL: `db.QueryContext(ctx, ...)` — the query is cancelled if ctx is cancelled.',
        'gRPC propagates context metadata and deadlines automatically between client and server.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'WithCancel',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "time"
)

func worker(ctx context.Context, id int) {
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("worker %d stopped: %v\\n", id, ctx.Err())
            return
        default:
            fmt.Printf("worker %d working...\\n", id)
            time.Sleep(100 * time.Millisecond)
        }
    }
}

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel() // always defer cancel

    for i := 1; i <= 3; i++ {
        go worker(ctx, i)
    }

    time.Sleep(250 * time.Millisecond)
    cancel() // signal all workers to stop
    time.Sleep(50 * time.Millisecond)
    fmt.Println("all workers signalled")
}`
    },
    {
      label: 'WithTimeout',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "time"
)

func fetchData(ctx context.Context) (string, error) {
    // Simulate slow operation
    select {
    case <-time.After(200 * time.Millisecond):
        return "data", nil
    case <-ctx.Done():
        return "", fmt.Errorf("fetchData: %w", ctx.Err())
    }
}

func main() {
    // Fast enough — succeeds
    ctx1, cancel1 := context.WithTimeout(context.Background(), 300*time.Millisecond)
    defer cancel1()
    data, err := fetchData(ctx1)
    fmt.Println(data, err) // data <nil>

    // Too slow — times out
    ctx2, cancel2 := context.WithTimeout(context.Background(), 100*time.Millisecond)
    defer cancel2()
    data, err = fetchData(ctx2)
    fmt.Println(data, err) // "" fetchData: context deadline exceeded
}`
    },
    {
      label: 'WithValue',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
)

// Unexported key type prevents collisions
type ctxKey struct{}
type requestIDKey struct{}

func WithRequestID(ctx context.Context, id string) context.Context {
    return context.WithValue(ctx, requestIDKey{}, id)
}

func RequestIDFromCtx(ctx context.Context) (string, bool) {
    id, ok := ctx.Value(requestIDKey{}).(string)
    return id, ok
}

func handleRequest(ctx context.Context) {
    id, ok := RequestIDFromCtx(ctx)
    if !ok {
        fmt.Println("no request ID")
        return
    }
    fmt.Printf("[req:%s] processing\\n", id)
    processStep(ctx)
}

func processStep(ctx context.Context) {
    id, _ := RequestIDFromCtx(ctx)
    fmt.Printf("[req:%s] step done\\n", id)
}

func main() {
    ctx := context.Background()
    ctx = WithRequestID(ctx, "abc-123")
    handleRequest(ctx)
}`
    },
    {
      label: 'HTTP with Context',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "net/http"
    "time"
)

func queryDB(ctx context.Context, query string) (string, error) {
    select {
    case <-time.After(50 * time.Millisecond):
        return "result for: " + query, nil
    case <-ctx.Done():
        return "", fmt.Errorf("queryDB: %w", ctx.Err())
    }
}

func handler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context() // already has cancellation tied to client disconnect

    // Add a per-request timeout on top of the incoming context
    ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
    defer cancel()

    result, err := queryDB(ctx, r.URL.Query().Get("q"))
    if err != nil {
        http.Error(w, err.Error(), http.StatusServiceUnavailable)
        return
    }
    fmt.Fprintln(w, result)
}

func main() {
    http.HandleFunc("/search", handler)
    http.ListenAndServe(":8080", nil)
}`
    },
    {
      label: 'Context Tree',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "time"
)

func printStatus(name string, ctx context.Context) {
    select {
    case <-ctx.Done():
        fmt.Printf("%s cancelled: %v\\n", name, ctx.Err())
    default:
        fmt.Printf("%s alive\\n", name)
    }
}

func main() {
    root, rootCancel := context.WithCancel(context.Background())
    defer rootCancel()

    // Child with timeout
    child, childCancel := context.WithTimeout(root, 100*time.Millisecond)
    defer childCancel()

    // Grandchild from child
    grandchild, gcCancel := context.WithCancel(child)
    defer gcCancel()

    printStatus("root", root)           // root alive
    printStatus("child", child)         // child alive
    printStatus("grandchild", grandchild) // grandchild alive

    time.Sleep(150 * time.Millisecond) // child times out

    printStatus("root", root)           // root alive
    printStatus("child", child)         // child cancelled: context deadline exceeded
    printStatus("grandchild", grandchild) // grandchild cancelled: context deadline exceeded
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting to call cancel() — resource leak',
      wrong: `ctx, cancel := context.WithTimeout(parent, 5*time.Second)
// forgot defer cancel() — internal timer goroutine leaks until timeout`,
      right: `ctx, cancel := context.WithTimeout(parent, 5*time.Second)
defer cancel() // always defer immediately after creation`,
      explanation: 'WithCancel, WithTimeout, and WithDeadline all allocate internal resources (timers, goroutines). If cancel() is never called, these resources leak until the parent context is cancelled. Always defer cancel() right after creation.'
    },
    {
      title: 'Storing context in a struct field',
      wrong: `type Server struct {
    ctx context.Context // wrong — context has request scope, not struct scope
}`,
      right: `// Pass context explicitly through function parameters
func (s *Server) HandleRequest(ctx context.Context, req *Request) error {
    return s.db.Query(ctx, req.Query)
}`,
      explanation: 'Context has request scope — it should live for the duration of one operation. Storing it in a struct ties it to the struct\'s lifetime, which may outlive the request or carry stale cancellation. Pass ctx as the first function parameter instead.'
    },
    {
      title: 'Passing context.Background() when the caller\'s context should be used',
      wrong: `func handleRequest(ctx context.Context) {
    // Creates a fresh context — ignores caller's cancellation!
    dbCtx := context.Background()
    results, _ := db.QueryContext(dbCtx, "SELECT ...")
}`,
      right: `func handleRequest(ctx context.Context) {
    results, _ := db.QueryContext(ctx, "SELECT ...") // propagate caller's ctx
}`,
      explanation: 'Calling context.Background() inside a function ignores the caller\'s deadline and cancellation. If the HTTP client disconnects, the DB query will continue running unnecessarily. Always thread the caller\'s ctx through to downstream calls.'
    },
    {
      title: 'Using string keys with WithValue',
      wrong: `ctx = context.WithValue(ctx, "userID", "alice")
// Any package can read/overwrite "userID" — collision risk`,
      right: `type userIDKey struct{}
ctx = context.WithValue(ctx, userIDKey{}, "alice")
// Only this package knows the key type — no collisions`,
      explanation: 'Using a built-in type (string, int) as a context key risks collision with other packages using the same key. Always define a private unexported struct type as the key so it is unique to your package.'
    },
    {
      title: 'Using context.TODO() in production code',
      wrong: `func SaveUser(user User) error {
    return db.ExecContext(context.TODO(), "INSERT ...") // shipped to production
}`,
      right: `func SaveUser(ctx context.Context, user User) error {
    return db.ExecContext(ctx, "INSERT ...")
}`,
      explanation: 'context.TODO() is a placeholder for functions not yet wired up. It should never appear in production code — it means the function cannot be cancelled or timed out from the outside. Add ctx as a parameter and propagate it.'
    },
    {
      title: 'Checking ctx.Done() without select',
      wrong: `if ctx.Done() != nil {
    return ctx.Err() // wrong — Done() is a channel, not a bool
}`,
      right: `select {
case <-ctx.Done():
    return ctx.Err()
default:
    // continue
}`,
      explanation: 'ctx.Done() returns a channel, not a boolean. You cannot check it with an if. Use select with a default case for a non-blocking check, or block on it with a case in a select alongside other channel operations.'
    },
  ];

  challenge: Challenge = {
    title: 'Cancellable Task Runner',
    language: 'typescript',
    description: `Write a \`RunWithTimeout\` function that runs a task with a timeout and returns its result or an error.

\`\`\`go
func RunWithTimeout(timeout time.Duration, task func(ctx context.Context) (string, error)) (string, error)
\`\`\`

Requirements:
- Create a context with the given timeout
- Run the task in a goroutine
- If task completes before timeout: return the result
- If timeout fires first: return "", context.DeadlineExceeded
- Always clean up — no goroutine leaks

Test cases:
\`\`\`go
// Fast task — succeeds
result, _ := RunWithTimeout(200*time.Millisecond, func(ctx context.Context) (string, error) {
    time.Sleep(50*time.Millisecond)
    return "done", nil
})
// result == "done"

// Slow task — times out
_, err := RunWithTimeout(50*time.Millisecond, func(ctx context.Context) (string, error) {
    time.Sleep(200*time.Millisecond)
    return "done", nil
})
// errors.Is(err, context.DeadlineExceeded) == true
\`\`\``,
    hints: [
      'Use context.WithTimeout to create the ctx and get cancel',
      'Use a buffered channel of size 1 to receive the result without blocking',
      'Use select to wait on either the result channel or ctx.Done()',
      'Call defer cancel() to clean up the timeout timer',
    ],
    starterCode: `package main

import (
    "context"
    "errors"
    "fmt"
    "time"
)

type result struct {
    val string
    err error
}

func RunWithTimeout(timeout time.Duration, task func(ctx context.Context) (string, error)) (string, error) {
    // TODO: implement
    return "", nil
}

func main() {
    // Fast task
    val, err := RunWithTimeout(200*time.Millisecond, func(ctx context.Context) (string, error) {
        time.Sleep(50 * time.Millisecond)
        return "completed", nil
    })
    fmt.Println(val, err) // completed <nil>

    // Slow task
    val, err = RunWithTimeout(50*time.Millisecond, func(ctx context.Context) (string, error) {
        select {
        case <-time.After(200 * time.Millisecond):
            return "completed", nil
        case <-ctx.Done():
            return "", ctx.Err()
        }
    })
    fmt.Println(val, err) // "" context deadline exceeded
    fmt.Println(errors.Is(err, context.DeadlineExceeded)) // true
}`,
    solution: `package main

import (
    "context"
    "errors"
    "fmt"
    "time"
)

type result struct {
    val string
    err error
}

func RunWithTimeout(timeout time.Duration, task func(ctx context.Context) (string, error)) (string, error) {
    ctx, cancel := context.WithTimeout(context.Background(), timeout)
    defer cancel()

    ch := make(chan result, 1) // buffered — goroutine never blocks on send
    go func() {
        v, err := task(ctx)
        ch <- result{v, err}
    }()

    select {
    case r := <-ch:
        return r.val, r.err
    case <-ctx.Done():
        return "", ctx.Err()
    }
}

func main() {
    val, err := RunWithTimeout(200*time.Millisecond, func(ctx context.Context) (string, error) {
        time.Sleep(50 * time.Millisecond)
        return "completed", nil
    })
    fmt.Println(val, err) // completed <nil>

    val, err = RunWithTimeout(50*time.Millisecond, func(ctx context.Context) (string, error) {
        select {
        case <-time.After(200 * time.Millisecond):
            return "completed", nil
        case <-ctx.Done():
            return "", ctx.Err()
        }
    })
    fmt.Println(val, err)
    fmt.Println(errors.Is(err, context.DeadlineExceeded)) // true
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the purpose of context.Context in Go?',
      options: [
        'To carry cancellation signals, deadlines, and request-scoped values across API boundaries',
        'To store global application configuration',
        'To manage goroutine scheduling priorities',
        'To replace error return values with a unified mechanism',
      ],
      answer: 0,
      explanation: 'context.Context propagates three things: (1) a cancellation signal so goroutines know to stop, (2) a deadline/timeout, and (3) request-scoped values like trace IDs. It flows through function calls and across goroutines.'
    },
    {
      q: 'When should you call the cancel function returned by context.WithCancel?',
      options: [
        'Always defer it immediately after creation to prevent resource leaks',
        'Only when the operation actually fails',
        'At the end of the program',
        'Cancel is optional — Go cleans up automatically',
      ],
      answer: 0,
      explanation: 'Always defer cancel() right after calling WithCancel, WithTimeout, or WithDeadline. These functions allocate internal resources (a timer goroutine) that are only released when cancel() is called. Forgetting to call it leaks resources until the parent context is cancelled.'
    },
    {
      q: 'What does context.WithTimeout return?',
      options: [
        'A child context and a cancel function — the context cancels after the duration OR when cancel() is called',
        'Only a child context — no cancel function needed',
        'A channel that closes after the duration',
        'A context that cancels after the duration only (cancel() has no effect)',
      ],
      answer: 0,
      explanation: 'context.WithTimeout(parent, d) returns (ctx, cancel). ctx cancels automatically after duration d OR when the parent is cancelled OR when cancel() is called explicitly. Always defer cancel() to free resources promptly even if the operation completes before the timeout.'
    },
    {
      q: 'Why should you use an unexported struct type as a context value key?',
      options: [
        'To prevent key collisions between packages that might use the same string key',
        'Because context.WithValue requires struct types',
        'To improve lookup performance',
        'String keys cause a compile error',
      ],
      answer: 0,
      explanation: 'Context value lookup uses == comparison. If two packages both use the string "userID" as a key, they collide. An unexported struct type like `type ctxKey struct{}` is unique to your package — no other package can create an identical key type.'
    },
    {
      q: 'What does ctx.Err() return after ctx.Done() is closed?',
      options: [
        'context.Canceled if cancel() was called, or context.DeadlineExceeded if the deadline passed',
        'nil always',
        'The original error that caused cancellation',
        'A string describing why the context was cancelled',
      ],
      answer: 0,
      explanation: 'ctx.Err() returns nil while the context is active. Once Done() is closed, it returns context.Canceled (if cancel() was called) or context.DeadlineExceeded (if the timeout or deadline fired). Wrap it: fmt.Errorf("operation: %w", ctx.Err()).'
    },
    {
      q: 'What is the difference between context.WithTimeout and context.WithDeadline?',
      options: ['They are identical', 'WithTimeout takes a duration (relative); WithDeadline takes an absolute time.Time', 'WithDeadline is deprecated', 'WithTimeout creates a child context; WithDeadline does not'],
      answer: 1,
      explanation: 'context.WithTimeout(ctx, 5*time.Second) cancels after 5 seconds from now. context.WithDeadline(ctx, time.Now().Add(5*time.Second)) cancels at an absolute time — equivalent in this case but necessary when the deadline is calculated externally (e.g., from an HTTP request deadline). Both return a cancel function that must be deferred to avoid resource leaks.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I always pass context as the first parameter?',
      a: 'Yes — the convention in Go is `func F(ctx context.Context, ...)`. This makes the function cancellable and composable with the rest of the standard library. The only exceptions are constructors and methods that run synchronously without any I/O (e.g., pure computation). If a function does any I/O, waits on goroutines, or calls external services, it should accept a context.'
    },
    {
      q: 'What is the difference between context.Background() and context.TODO()?',
      a: 'At runtime they are identical — both return a non-cancellable, non-timeout root context. The difference is semantic intent. Background() means "this is the top-level context; cancellation is managed elsewhere." TODO() means "I know this needs a real context but haven\'t wired it up yet — fix me." Linters and code reviewers treat TODO() as a marker to revisit. Never ship TODO() to production.'
    },
    {
      q: 'What happens to child contexts when the parent is cancelled?',
      a: 'Context cancellation propagates downward. When a parent context is cancelled, all child and grandchild contexts derived from it are also cancelled immediately. This is the cascade property of the context tree. Cancelling a child does not affect its parent or siblings.'
    },
    {
      q: 'Can I use context values as a replacement for function parameters?',
      a: 'No. Context values should only carry request-scoped data that crosses API boundaries where adding explicit parameters is impractical — trace IDs, auth tokens, request IDs. Using context as a bag of optional function parameters hides dependencies, makes functions harder to test, and makes the data flow opaque to the reader. Function parameters are always preferred for data that influences function behaviour.'
    },
    {
      q: 'How does context work with database/sql?',
      a: 'database/sql has context-aware variants of all blocking methods: `db.QueryContext(ctx, ...)`, `db.ExecContext(ctx, ...)`, `tx.QueryContext(ctx, ...)`. Pass the incoming request context so that if the HTTP client disconnects (its context is cancelled), the database query is cancelled too. This avoids wasted database work and connection pool exhaustion. Without context, long queries run to completion even when nobody is waiting for the result.'
    },
    {
      q: 'What is the relationship between context and goroutine leaks?',
      a: 'Goroutine leaks often happen because goroutines block on channels or I/O with no way to stop. Context solves this: pass ctx to every goroutine, and have the goroutine select on ctx.Done(). When the parent operation finishes or times out, cancel() is called, ctx.Done() is closed, and all goroutines in the tree can exit cleanly. Without context, goroutines must rely on ad-hoc done channels — context standardises this pattern.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'context.Context propagates cancellation, deadlines, and request values through call chains — always pass it first, always defer cancel().',
    mustKnow: [
      'context.Background() for top-level; context.TODO() as a placeholder in-progress.',
      'WithCancel, WithTimeout, WithDeadline — always defer cancel() right after creation.',
      'ctx.Done() is a channel closed on cancellation; ctx.Err() tells you why.',
      'Pass ctx as the FIRST parameter to every function doing I/O or goroutines.',
      'Never store ctx in a struct — it has request scope, not struct scope.',
      'WithValue key must be an unexported struct type to avoid cross-package collisions.',
      'Cancelling a parent propagates to all children — context forms a tree.',
    ],
    interviewFocus: [
      'What does context.Context carry and why do we need it?',
      'Why must you always defer cancel() after WithTimeout/WithCancel?',
      'How do you propagate cancellation to a goroutine?',
      'Why use an unexported struct as a context value key?',
      'What is the difference between context.Background() and context.TODO()?',
    ],
  };
}
