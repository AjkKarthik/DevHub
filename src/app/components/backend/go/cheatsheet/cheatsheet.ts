import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';

@Component({
  selector: 'app-go-cheatsheet',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, QnaBlockComponent],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss'
})
export class GoCheatsheet {
  readingTime = 15;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  since = 'Go 1.21+';

  quickRef: QuickRefItem[] = [
    { name: 'var x int = 5', type: 'syntax', desc: 'Explicit variable declaration with type' },
    { name: 'x := 5', type: 'syntax', desc: 'Short variable declaration (type inferred, inside functions only)' },
    { name: 'const Pi = 3.14', type: 'keyword', desc: 'Compile-time constant — value evaluated at compile time' },
    { name: 'func f(a, b int) (int, error)', type: 'syntax', desc: 'Function with two int params and multiple return values' },
    { name: 'defer f()', type: 'keyword', desc: 'Run f() when the surrounding function returns (LIFO order)' },
    { name: 'go f()', type: 'keyword', desc: 'Start f() in a new goroutine — does not block the caller' },
    { name: 'ch := make(chan int, n)', type: 'function', desc: 'Buffered channel with capacity n; unbuffered if n=0' },
    { name: 'select { case v := <-ch: }', type: 'keyword', desc: 'Wait on multiple channel operations; picks whichever is ready' },
    { name: 'fmt.Errorf("op: %w", err)', type: 'function', desc: 'Wrap an error with context; errors.Is/As unwrap the chain' },
    { name: 'errors.Is(err, target)', type: 'function', desc: 'Check if any error in the chain matches target (sentinel)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Toolchain commands',
      points: [
        'go mod init <path>  — create new module',
        'go get pkg@version  — add/upgrade dependency',
        'go mod tidy         — sync go.mod + go.sum',
        'go build -o bin/app ./cmd/app  — build binary',
        'go test ./...       — run all tests',
        'go test -race ./... — run with race detector',
        'go test -bench=. -benchmem ./... — run benchmarks with alloc reporting',
        'go vet ./...        — static analysis',
        'go run ./cmd/app    — build + run in one step (dev only)',
        'go doc pkg.Symbol   — show documentation for a symbol',
      ]
    },
    {
      heading: 'Types quick reference',
      points: [
        'bool, string, int, int8, int16, int32, int64',
        'uint, uint8, uint16, uint32, uint64, uintptr',
        'float32, float64, complex64, complex128',
        'byte (alias for uint8), rune (alias for int32 — a Unicode code point)',
        'Zero values: 0 (numeric), false (bool), "" (string), nil (pointer/slice/map/chan/func/interface)',
        'Type conversion is always explicit: int(x), float64(n) — no implicit coercion',
        'any (alias for interface{}) — accepts any type',
      ]
    },
    {
      heading: 'Concurrency primitives',
      points: [
        'goroutine: go f() — lightweight user-space thread, ~2KB initial stack',
        'channel: make(chan T) / make(chan T, n) — typed communication pipe',
        'sync.Mutex / sync.RWMutex — protect shared state',
        'sync.WaitGroup: Add/Done/Wait — coordinate goroutine completion',
        'sync.Once — run a function exactly once (init, singleton)',
        'sync.Pool — recycle allocations to reduce GC pressure',
        'context.Context — cancellation, deadlines, and request-scoped values',
        'select — multiplex channel operations; default case makes it non-blocking',
      ]
    },
    {
      heading: 'Error handling patterns',
      points: [
        'Errors are values: error is an interface with Error() string',
        'Check immediately: if err != nil { return fmt.Errorf("context: %w", err) }',
        'Sentinel errors: var ErrNotFound = errors.New("not found"); check with errors.Is',
        'Custom types: type ValidationError struct{ Field string }; check with errors.As',
        'Wrap with %w: errors.Is/As unwrap the chain; %v just formats without unwrapping',
        'panic only for unrecoverable programmer errors (nil pointer, out-of-bounds); never for user errors',
        'recover() in a deferred function catches panics — use sparingly (middleware, test cleanup)',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Variables & Types',
      language: 'typescript',
      code: `// Variables
var x int                    // zero value: 0
var s string = "hello"
x := 42                      // short declaration (functions only)
a, b := 1, 2                 // multiple assignment
_, err := doWork()           // blank identifier discards a value

// Constants
const Pi = 3.14159
const (
    StatusOK  = 200
    StatusErr = 500
)

// iota — auto-incrementing constant
type Day int
const (
    Mon Day = iota + 1  // 1
    Tue                 // 2
    Wed                 // 3
)

// Type aliases and definitions
type UserID int              // new type (cannot mix with int without conversion)
type Alias = int             // alias (interchangeable with int)

// Pointers
p := &x                     // p is *int, points to x
*p = 99                     // dereference — changes x
fmt.Println(x)              // 99

// Slices
s := []int{1, 2, 3}
s = append(s, 4, 5)
sub := s[1:3]               // [2 3] — shares backing array!
s2 := make([]int, 0, 10)    // len=0, cap=10

// Maps
m := map[string]int{"a": 1}
v, ok := m["b"]             // ok=false if key absent
delete(m, "a")

// Structs
type Point struct { X, Y float64 }
p := Point{X: 1.0, Y: 2.0}
p.X = 3.0`
    },
    {
      label: 'Functions & Interfaces',
      language: 'typescript',
      code: `// Functions — multiple return values
func divide(a, b float64) (float64, error) {
    if b == 0 { return 0, errors.New("division by zero") }
    return a / b, nil
}

// Named return values + naked return
func minMax(a, b int) (min, max int) {
    if a < b { return a, b }
    return b, a
}

// Variadic function
func sum(nums ...int) int {
    total := 0
    for _, n := range nums { total += n }
    return total
}
sum(1, 2, 3)          // positional
sum(nums...)          // spread slice

// First-class functions
type Handler func(req Request) Response
apply := func(f func(int) int, x int) int { return f(x) }

// Closures capture variables by reference
func counter() func() int {
    n := 0
    return func() int { n++; return n }
}

// Interfaces — implicit satisfaction
type Stringer interface { String() string }

type User struct{ Name string }
func (u User) String() string { return u.Name }  // User satisfies Stringer

// Interface composition
type ReadWriter interface {
    io.Reader
    io.Writer
}

// Type assertion
var i interface{} = "hello"
s, ok := i.(string)         // safe assertion
switch v := i.(type) {      // type switch
case string:  fmt.Println(v)
case int:     fmt.Println(v * 2)
}`
    },
    {
      label: 'Concurrency',
      language: 'typescript',
      code: `// Goroutines + WaitGroup
var wg sync.WaitGroup
results := make([]int, 5)

for i := range results {
    wg.Add(1)
    go func(idx int) {
        defer wg.Done()
        results[idx] = compute(idx)
    }(i)
}
wg.Wait()

// Channel patterns
ch := make(chan int)

// Pipeline: producer -> ch -> consumer
go func() {
    for i := 0; i < 5; i++ { ch <- i }
    close(ch)  // receiver's range loop exits when channel closes
}()
for v := range ch { fmt.Println(v) }

// Select with timeout
select {
case v := <-ch:    fmt.Println("got", v)
case <-time.After(1 * time.Second): fmt.Println("timeout")
}

// Non-blocking send/receive:
select {
case ch <- value:  // sent
default:           // channel full or no receiver
}

// Mutex for shared state
var mu sync.Mutex
var count int
mu.Lock()
count++
mu.Unlock()

// Context propagation
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

// Pass ctx to every call that may block:
result, err := db.QueryContext(ctx, "SELECT ...")
req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)`
    },
    {
      label: 'Error Handling',
      language: 'typescript',
      code: `// Sentinel errors (package-level)
var (
    ErrNotFound   = errors.New("not found")
    ErrPermission = errors.New("permission denied")
)

func getUser(id int) (*User, error) {
    if id <= 0 { return nil, ErrNotFound }
    return &User{}, nil
}

u, err := getUser(-1)
if errors.Is(err, ErrNotFound) {
    // handle specifically
}

// Custom error type for structured data
type ValidationError struct {
    Field   string
    Message string
}
func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation: %s — %s", e.Field, e.Message)
}

var ve *ValidationError
if errors.As(err, &ve) {
    fmt.Println("bad field:", ve.Field)
}

// Error wrapping with %w
func processUser(id int) error {
    u, err := getUser(id)
    if err != nil {
        return fmt.Errorf("processUser(%d): %w", id, err)
    }
    return validate(u)
}

// errors.Is unwraps the chain:
err = processUser(-1)
fmt.Println(errors.Is(err, ErrNotFound))  // true

// Panic / recover (use sparingly)
func safeDiv(a, b int) (result int, err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("recovered panic: %v", r)
        }
    }()
    return a / b, nil  // panics if b==0
}`
    },
    {
      label: 'Testing & Benchmarks',
      language: 'typescript',
      code: `// Test file: xxx_test.go (same package or package_test)

// Table-driven test
func TestAdd(t *testing.T) {
    cases := []struct{ a, b, want int }{
        {2, 3, 5}, {-1, 1, 0}, {0, 0, 0},
    }
    for _, tc := range cases {
        t.Run(fmt.Sprintf("%d+%d", tc.a, tc.b), func(t *testing.T) {
            if got := Add(tc.a, tc.b); got != tc.want {
                t.Errorf("got %d, want %d", got, tc.want)
            }
        })
    }
}

// Assertion helper
func assertEqual[T comparable](t *testing.T, got, want T) {
    t.Helper()
    if got != want { t.Errorf("got %v, want %v", got, want) }
}

// Benchmark
func BenchmarkProcess(b *testing.B) {
    data := setup()
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        process(data)
    }
}

// HTTP handler test
func TestHandler(t *testing.T) {
    req := httptest.NewRequest("GET", "/users/1", nil)
    w := httptest.NewRecorder()
    handler(w, req)
    if w.Code != 200 { t.Errorf("expected 200, got %d", w.Code) }
}

// Commands
// go test ./...                       — run all tests
// go test -run TestAdd/0+0 ./...      — specific subtest
// go test -race ./...                 — race detector
// go test -bench=. -benchmem ./...   — benchmarks with alloc info
// go test -cover -coverprofile=c.out; go tool cover -html=c.out`
    },
    {
      label: 'Common Patterns',
      language: 'typescript',
      code: `// Functional options
type Server struct { host string; timeout time.Duration }
type Option func(*Server)
func WithTimeout(d time.Duration) Option { return func(s *Server) { s.timeout = d } }
func NewServer(opts ...Option) *Server {
    s := &Server{host: "localhost", timeout: 5 * time.Second}
    for _, o := range opts { o(s) }
    return s
}

// Repository pattern
type UserRepo interface {
    GetByID(ctx context.Context, id int) (*User, error)
    Create(ctx context.Context, u *User) error
}

// errgroup — concurrent tasks with error propagation
g, ctx := errgroup.WithContext(context.Background())
g.Go(func() error { return fetchUsers(ctx) })
g.Go(func() error { return fetchOrders(ctx) })
if err := g.Wait(); err != nil { log.Fatal(err) }

// Worker pool
jobs := make(chan Job, 100)
for w := 0; w < 5; w++ {
    go func() {
        for j := range jobs { process(j) }
    }()
}

// Graceful shutdown
ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
defer stop()
<-ctx.Done()
srv.Shutdown(context.Background())

// Retry with backoff
for attempt := 0; attempt < 3; attempt++ {
    err = doRequest()
    if err == nil { break }
    time.Sleep(time.Duration(attempt+1) * 200 * time.Millisecond)
}

// slog structured logging (Go 1.21+)
slog.Info("request handled", "method", r.Method, "path", r.URL.Path, "duration", elapsed)`
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the zero value in Go and why does it matter?',
      a: 'Every type has a zero value: 0 for numeric types, false for bool, "" for string, nil for pointer/slice/map/chan/func/interface. Variables are always initialised to their zero value — no uninitialised memory bugs. This makes many patterns safe without explicit initialisation: var mu sync.Mutex is ready to use, var sb strings.Builder works immediately, var wg sync.WaitGroup needs no constructor.'
    },
    {
      q: 'When should you use a pointer receiver vs a value receiver on a method?',
      a: 'Use a pointer receiver (*T) when: the method modifies the receiver, the struct is large (avoids copying), or you need consistent receiver type (all methods pointer or all value). Use a value receiver (T) when: the method does not modify the receiver and the struct is small. If any method needs a pointer receiver, make all methods pointer receivers for consistency. Pointer receivers also satisfy interfaces when the variable is addressable.'
    },
    {
      q: 'What is the difference between nil and an empty slice?',
      a: 'A nil slice (var s []int) has len=0, cap=0, and is nil. An empty slice (s := []int{} or make([]int, 0)) has len=0, cap=0, but is not nil. Both work with append, len, and range. The distinction matters for JSON: json.Marshal(nil slice) = null; json.Marshal(empty slice) = []. For API responses, prefer make([]T, 0) to ensure JSON arrays instead of null.'
    },
    {
      q: 'What does "goroutine leak" mean and how do you prevent it?',
      a: 'A goroutine leak is a goroutine that starts but never terminates — it stays in the runtime\'s scheduler consuming memory and a goroutine slot forever. Common causes: goroutine blocked on a channel send/receive that never completes, goroutine waiting for a context that is never cancelled, goroutine in an infinite loop with no exit condition. Prevention: always cancel context in defer cancel(); use errgroup which cancels all goroutines on the first error; close channels to signal completion to ranging goroutines.'
    },
    {
      q: 'What is the difference between errors.Is and errors.As?',
      a: 'errors.Is(err, target) checks if any error in the chain is equal to a specific sentinel value (var ErrNotFound = errors.New(...)). errors.As(err, &target) checks if any error in the chain can be assigned to the target type (a custom error struct). Use Is for sentinel errors, As for typed errors. Both unwrap the error chain automatically through errors.Unwrap() — so %w wrapping works with both.'
    },
    {
      q: 'When should you use make vs new?',
      a: 'make(T, args): for slices, maps, and channels — returns an initialised (non-nil) T, not *T. You cannot use new for these because the zero value is nil and not usable. new(T): allocates zeroed memory for any type and returns *T — rarely used directly in Go. Prefer &T{} for structs (clearer) and make for slice/map/chan. The short form m := map[string]int{} is usually clearer than new(map[string]int).'
    },
  ];
}
