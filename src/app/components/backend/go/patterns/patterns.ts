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
  selector: 'app-go-patterns',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './patterns.html',
  styleUrl: './patterns.scss'
})
export class GoPatterns {
  readingTime = 25;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Go 1.21+';
  route = 'go-patterns';
  nextRoute = '/go/modules';
  nextLabel = 'Modules & Toolchain';

  quickRef: QuickRefItem[] = [
    { name: 'Functional Options', type: 'keyword', desc: 'func WithTimeout(d time.Duration) Option — flexible config without breaking APIs' },
    { name: 'sync.Once', type: 'keyword', desc: 'Singleton pattern — run init logic exactly once across goroutines' },
    { name: 'io.Writer / io.Reader', type: 'interface', desc: 'Dependency injection via interfaces — accept interfaces, return structs' },
    { name: 'Table-Driven Tests', type: 'keyword', desc: 't.Run(tc.name, func) — one struct slice, N test cases' },
    { name: 'Middleware (http.Handler)', type: 'keyword', desc: 'func(next http.Handler) http.Handler — composable request pipeline' },
    { name: 'Pipeline (channels)', type: 'keyword', desc: 'Each stage reads from upstream chan, writes to downstream chan' },
    { name: 'Fan-out / Fan-in', type: 'keyword', desc: 'Distribute work to N goroutines, merge results back to one channel' },
    { name: 'Repository pattern', type: 'keyword', desc: 'Interface for data access — swap real DB with in-memory mock in tests' },
    { name: 'errgroup.Group', type: 'keyword', desc: 'golang.org/x/sync — concurrent tasks with error propagation' },
    { name: 'Sentinel errors', type: 'keyword', desc: 'var ErrNotFound = errors.New(...) — exported package-level errors for Is checks' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Go idioms vs GoF patterns',
      points: [
        'Most GoF (Gang of Four) patterns exist in Go but are expressed differently — Go uses composition and interfaces rather than class inheritance.',
        'Factory: return a concrete struct from a constructor function (NewServer, NewClient). The interface is returned, hiding the implementation.',
        'Singleton: sync.Once runs initialisation exactly once across goroutines — the idiomatic Go singleton.',
        'Decorator: the middleware pattern wraps http.Handler functions — pure composition with no special syntax.',
        'Strategy: pass functions as arguments or accept interfaces — Go functions are first-class, making strategy trivially expressible.',
      ]
    },
    {
      heading: 'Functional options pattern',
      points: [
        'Problem: constructors with many optional parameters break callers when new options are added.',
        'Solution: define a type Option func(*config) and accept ...Option in the constructor.',
        'Each With... function returns an Option closure that sets one field. Callers compose options.',
        'Adding a new option never changes the function signature — backwards compatible by design.',
        'Used by gRPC, zerolog, and many major Go libraries. The most idiomatic Go pattern for optional configuration.',
      ]
    },
    {
      heading: 'Concurrency patterns',
      points: [
        'Pipeline: a series of stages connected by channels. Each stage is a goroutine that reads from one channel and writes to another.',
        'Fan-out: one goroutine distributes work to N worker goroutines. Fan-in: N goroutines write results to one channel.',
        'Done channel: a context.Context or a closed channel signals all goroutines in a pipeline to stop.',
        'errgroup.Group (golang.org/x/sync): runs goroutines concurrently, collects the first error, and cancels a shared context.',
        'Worker pool: N goroutines read from a shared job channel. Controls parallelism without spawning unbounded goroutines.',
      ]
    },
    {
      heading: 'Error handling patterns',
      points: [
        'Sentinel errors: var ErrNotFound = errors.New("not found"). Callers use errors.Is(err, ErrNotFound). Export them as package-level variables.',
        'Error types: define a struct implementing error. Callers use errors.As to extract the type and inspect fields (code, details).',
        'Wrap with context: return fmt.Errorf("getUser %d: %w", id, err). Preserve the original error for Is/As while adding context.',
        'Never ignore errors: if you cannot handle an error, at minimum log it. Silently swallowing errors hides bugs.',
        'Error-as-value: in Go, errors are values — handle them at each layer with the information available, wrap upward.',
      ]
    },
    {
      heading: 'Dependency injection and testability',
      points: [
        'Accept interfaces, return structs: func NewServer(db Database, logger Logger) *Server. Callers can inject mocks.',
        'Repository pattern: type UserRepository interface — the real implementation hits the DB, tests use an in-memory struct.',
        'Constructor injection is preferred over global state — avoids hidden dependencies and makes unit tests straightforward.',
        'Table-driven tests: define []struct{ name, input, expected } and range over them with t.Run. One test function covers many cases.',
        'testcontainers-go spins up a real Postgres/Redis in Docker for integration tests — no flaky mocks for DB logic.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Functional Options',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "time"
)

type serverConfig struct {
    host     string
    port     int
    timeout  time.Duration
    maxConns int
}

type Option func(*serverConfig)

func WithHost(h string) Option {
    return func(c *serverConfig) { c.host = h }
}
func WithPort(p int) Option {
    return func(c *serverConfig) { c.port = p }
}
func WithTimeout(d time.Duration) Option {
    return func(c *serverConfig) { c.timeout = d }
}
func WithMaxConns(n int) Option {
    return func(c *serverConfig) { c.maxConns = n }
}

type Server struct{ cfg serverConfig }

func NewServer(opts ...Option) *Server {
    cfg := serverConfig{ // sensible defaults
        host: "localhost", port: 8080,
        timeout: 30 * time.Second, maxConns: 100,
    }
    for _, opt := range opts { opt(&cfg) }
    return &Server{cfg: cfg}
}

func main() {
    // Minimal — uses all defaults
    s1 := NewServer()
    fmt.Println(s1.cfg.port) // 8080

    // Custom — only override what you need
    s2 := NewServer(
        WithPort(9090),
        WithTimeout(10*time.Second),
        WithMaxConns(500),
    )
    fmt.Println(s2.cfg.port, s2.cfg.maxConns) // 9090 500
}`
    },
    {
      label: 'Singleton & Repository',
      language: 'typescript',
      code: `package main

import (
    "errors"
    "fmt"
    "sync"
)

// --- Singleton with sync.Once ---
type Config struct{ DSN string }
var (
    config     *Config
    configOnce sync.Once
)

func GetConfig() *Config {
    configOnce.Do(func() {
        config = &Config{DSN: "postgres://localhost/mydb"}
        // expensive init: read file, connect, etc.
    })
    return config
}

// --- Repository pattern ---
var ErrNotFound = errors.New("not found")

type User struct{ ID int; Name string }

type UserRepository interface {
    GetByID(id int) (*User, error)
    Save(u *User) error
    Delete(id int) error
}

// In-memory implementation for tests
type memUserRepo struct {
    mu    sync.RWMutex
    users map[int]*User
    next  int
}

func NewMemUserRepo() UserRepository {
    return &memUserRepo{users: make(map[int]*User), next: 1}
}

func (r *memUserRepo) GetByID(id int) (*User, error) {
    r.mu.RLock(); defer r.mu.RUnlock()
    u, ok := r.users[id]
    if !ok { return nil, fmt.Errorf("GetByID %d: %w", id, ErrNotFound) }
    return u, nil
}

func (r *memUserRepo) Save(u *User) error {
    r.mu.Lock(); defer r.mu.Unlock()
    if u.ID == 0 { u.ID = r.next; r.next++ }
    r.users[u.ID] = u
    return nil
}

func (r *memUserRepo) Delete(id int) error {
    r.mu.Lock(); defer r.mu.Unlock()
    delete(r.users, id)
    return nil
}

func main() {
    cfg := GetConfig()
    fmt.Println(cfg.DSN)

    repo := NewMemUserRepo()
    u := &User{Name: "Alice"}
    repo.Save(u)
    found, _ := repo.GetByID(u.ID)
    fmt.Println(found.Name) // Alice

    _, err := repo.GetByID(99)
    fmt.Println(errors.Is(err, ErrNotFound)) // true
}`
    },
    {
      label: 'Pipeline Pattern',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
)

// Each stage: reads from upstream, sends to downstream, stops on ctx.Done()

func generate(ctx context.Context, nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for _, n := range nums {
            select {
            case out <- n:
            case <-ctx.Done():
                return
            }
        }
    }()
    return out
}

func square(ctx context.Context, in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            select {
            case out <- n * n:
            case <-ctx.Done():
                return
            }
        }
    }()
    return out
}

func filterEven(ctx context.Context, in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            if n%2 == 0 {
                select {
                case out <- n:
                case <-ctx.Done():
                    return
                }
            }
        }
    }()
    return out
}

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    // Pipeline: generate -> square -> filterEven
    nums := generate(ctx, 1, 2, 3, 4, 5, 6)
    squared := square(ctx, nums)
    evens := filterEven(ctx, squared)

    for v := range evens {
        fmt.Println(v) // 4 16 36
    }
}`
    },
    {
      label: 'errgroup & Fan-out',
      language: 'typescript',
      code: `package main

import (
    "context"
    "fmt"
    "sync"

    "golang.org/x/sync/errgroup"
)

// errgroup: concurrent tasks with error propagation
func fetchAll(ctx context.Context, urls []string) ([]string, error) {
    results := make([]string, len(urls))
    g, ctx := errgroup.WithContext(ctx)

    for i, url := range urls {
        i, url := i, url // capture loop vars
        g.Go(func() error {
            // simulate fetch
            if url == "https://bad.example.com" {
                return fmt.Errorf("fetch %s: connection refused", url)
            }
            results[i] = "response from " + url
            return nil
        })
    }

    if err := g.Wait(); err != nil {
        return nil, err
    }
    return results, nil
}

// Fan-out worker pool: distribute jobs to N workers
func workerPool(jobs []int, numWorkers int) []int {
    jobCh := make(chan int, len(jobs))
    for _, j := range jobs { jobCh <- j }
    close(jobCh)

    var mu sync.Mutex
    var results []int

    var wg sync.WaitGroup
    for w := 0; w < numWorkers; w++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for j := range jobCh {
                res := j * j // work
                mu.Lock()
                results = append(results, res)
                mu.Unlock()
            }
        }()
    }
    wg.Wait()
    return results
}

func main() {
    ctx := context.Background()
    urls := []string{"https://a.com", "https://b.com"}
    responses, err := fetchAll(ctx, urls)
    fmt.Println(responses, err)

    results := workerPool([]int{1, 2, 3, 4, 5}, 3)
    fmt.Println("results:", results)
}`
    },
    {
      label: 'Table-Driven Tests',
      language: 'typescript',
      code: `package main

// production code
import "fmt"

func Divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("divide by zero")
    }
    return a / b, nil
}

// --- test file (divide_test.go) ---
// package main
//
// import (
//     "errors"
//     "math"
//     "testing"
// )
//
// func TestDivide(t *testing.T) {
//     tests := []struct {
//         name    string
//         a, b    float64
//         want    float64
//         wantErr bool
//     }{
//         {"positive", 10, 2, 5, false},
//         {"negative numerator", -10, 2, -5, false},
//         {"divide by zero", 10, 0, 0, true},
//         {"fractional", 1, 3, 1.0 / 3.0, false},
//     }
//
//     for _, tc := range tests {
//         tc := tc // capture loop var (pre-Go 1.22)
//         t.Run(tc.name, func(t *testing.T) {
//             t.Parallel() // run sub-tests in parallel
//
//             got, err := Divide(tc.a, tc.b)
//             if (err != nil) != tc.wantErr {
//                 t.Fatalf("error = %v, wantErr %v", err, tc.wantErr)
//             }
//             if !tc.wantErr && math.Abs(got-tc.want) > 1e-9 {
//                 t.Errorf("got %v, want %v", got, tc.want)
//             }
//         })
//     }
// }
//
// Run: go test -v -run TestDivide ./...

func main() {
    r, _ := Divide(10, 2)
    fmt.Println(r) // 5
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using global state instead of dependency injection',
      wrong: `var db *sql.DB // package-level global

func GetUser(id int) (*User, error) {
    return queryUser(db, id) // hidden dependency — hard to test
}`,
      right: `type UserService struct{ db *sql.DB }

func NewUserService(db *sql.DB) *UserService { return &UserService{db: db} }

func (s *UserService) GetUser(id int) (*User, error) {
    return queryUser(s.db, id) // explicit dependency — inject a mock in tests
}`,
      explanation: 'Global state makes functions impossible to unit test without a real database and creates hidden coupling. Inject dependencies through constructors or function parameters — callers can pass mocks, fakes, or in-memory implementations in tests without changing production code.'
    },
    {
      title: 'Defining interfaces in the wrong package',
      wrong: `// producer package: defines the interface it implements
package userrepo
type UserRepository interface { // defined here by the implementer
    GetUser(id int) (*User, error)
}
type postgresRepo struct{}
func (r *postgresRepo) GetUser(id int) (*User, error) { ... }`,
      right: `// consumer package: defines the interface it needs
package service
type UserRepository interface { // defined by the consumer
    GetUser(id int) (*User, error)
}
// Now any type with GetUser satisfies it — loose coupling`,
      explanation: 'In Go, interfaces are satisfied implicitly. Define interfaces in the package that uses them (the consumer), not in the package that implements them (the producer). This keeps packages loosely coupled — the producer does not import the consumer, and the interface only contains what the consumer actually needs.'
    },
    {
      title: 'Not capturing loop variables in goroutines (pre-Go 1.22)',
      wrong: `for _, url := range urls {
    go func() {
        fetch(url) // all goroutines see the same url — last iteration's value
    }()
}`,
      right: `for _, url := range urls {
    url := url // capture by shadowing (pre-Go 1.22)
    go func() {
        fetch(url)
    }()
}
// OR in Go 1.22+: loop vars are re-allocated each iteration — no capture needed`,
      explanation: 'Before Go 1.22, all goroutines spawned in a for-range loop share the same loop variable. By the time goroutines run, the loop has finished and url holds the last value. Shadow the variable (url := url) to give each goroutine its own copy. In Go 1.22+, this is fixed — loop variables are unique per iteration.'
    },
    {
      title: 'Returning concrete types from constructors instead of interfaces',
      wrong: `func NewUserService() *UserService { return &UserService{} }
// callers are locked to the concrete type — cannot swap implementations`,
      right: `type UserServicer interface { GetUser(id int) (*User, error) }
func NewUserService(db *sql.DB) UserServicer { return &userService{db: db} }
// callers depend on the interface — easy to mock or swap`,
      explanation: 'Accept interfaces, return interfaces from constructors when callers do not need to construct the concrete type themselves. This enables mocking in tests and implementation swapping without changing callers. Exception: if the concrete type has additional methods callers need, return the concrete type.'
    },
    {
      title: 'Panicking instead of returning errors',
      wrong: `func ParseConfig(path string) Config {
    data, err := os.ReadFile(path)
    if err != nil {
        panic(err) // crashes the server for a missing config file
    }
    ...
}`,
      right: `func ParseConfig(path string) (Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return Config{}, fmt.Errorf("ParseConfig %s: %w", path, err)
    }
    ...
}`,
      explanation: 'Panics are for programmer errors (index out of bounds, nil pointer dereference) — situations that should never happen in correct code. Expected failures (file not found, network timeout, invalid input) should return errors. A panic in a goroutine that lacks recovery crashes the entire process.'
    },
    {
      title: 'Large interfaces instead of small focused ones',
      wrong: `type Storage interface {
    GetUser(id int) (*User, error)
    SaveUser(u *User) error
    DeleteUser(id int) error
    GetProduct(id int) (*Product, error)
    SaveProduct(p *Product) error
    // ...20 more methods
}
// Tests must implement all 20 methods even to test one function`,
      right: `// Each consumer defines only what it needs
type UserGetter interface { GetUser(id int) (*User, error) }
type UserSaver  interface { SaveUser(u *User) error }
// Functions accept the minimal interface they need`,
      explanation: 'Large interfaces are hard to mock — test doubles must implement every method even if a function uses only one. Go\'s interface motto: "the bigger the interface, the weaker the abstraction." Prefer interfaces with 1–3 methods. Compose them when needed: type ReadWriter interface { Reader; Writer }.'
    },
  ];

  challenge: Challenge = {
    title: 'Functional Options + Repository',
    language: 'typescript',
    description: `Build a configurable notification service using functional options and the repository pattern.

**Task 1 — Functional Options:**
\`\`\`go
type NotifierConfig struct {
    MaxRetries int           // default 3
    Timeout    time.Duration // default 5s
    DryRun     bool          // default false
}
func NewNotifier(opts ...Option) *Notifier
func WithMaxRetries(n int) Option
func WithTimeout(d time.Duration) Option
func WithDryRun() Option
\`\`\`

**Task 2 — Repository pattern:**
\`\`\`go
type Notification struct { ID string; To string; Message string }
type NotificationRepository interface {
    Save(n Notification) error
    GetByID(id string) (Notification, error)
    List() []Notification
}
\`\`\`
Implement an in-memory \`memNotificationRepo\`.

**Task 3:** Wire them together — \`Notifier.Send(to, message string)\` should:
- Generate an ID (fmt.Sprintf)
- Save via the repository
- If DryRun, print "DRY RUN: ..." instead of "sending"`,
    hints: [
      'type Option func(*NotifierConfig) — same pattern as the theory section',
      'WithDryRun returns an Option that sets DryRun = true (no parameter needed)',
      'memNotificationRepo wraps map[string]Notification with sync.RWMutex',
      'GetByID returns ErrNotFound if the key is missing from the map',
    ],
    starterCode: `package main

import (
    "errors"
    "fmt"
    "sync"
    "time"
)

var ErrNotFound = errors.New("not found")

type NotifierConfig struct {
    MaxRetries int
    Timeout    time.Duration
    DryRun     bool
}

type Option func(*NotifierConfig)

// TODO: implement WithMaxRetries, WithTimeout, WithDryRun

type Notifier struct {
    cfg  NotifierConfig
    repo NotificationRepository
}

func NewNotifier(repo NotificationRepository, opts ...Option) *Notifier {
    // TODO: apply opts to default config
    return nil
}

func (n *Notifier) Send(to, message string) error {
    // TODO: generate ID, save, print based on DryRun
    return nil
}

type Notification struct {
    ID      string
    To      string
    Message string
}

type NotificationRepository interface {
    Save(n Notification) error
    GetByID(id string) (Notification, error)
    List() []Notification
}

type memNotificationRepo struct {
    mu    sync.RWMutex
    items map[string]Notification
    seq   int
}

func NewMemRepo() NotificationRepository {
    // TODO
    return nil
}

// TODO: implement Save, GetByID, List

var _ = time.Second // suppress unused import`,
    solution: `package main

import (
    "errors"
    "fmt"
    "sync"
    "time"
)

var ErrNotFound = errors.New("not found")

type NotifierConfig struct {
    MaxRetries int
    Timeout    time.Duration
    DryRun     bool
}

type Option func(*NotifierConfig)

func WithMaxRetries(n int) Option   { return func(c *NotifierConfig) { c.MaxRetries = n } }
func WithTimeout(d time.Duration) Option { return func(c *NotifierConfig) { c.Timeout = d } }
func WithDryRun() Option            { return func(c *NotifierConfig) { c.DryRun = true } }

type Notifier struct {
    cfg  NotifierConfig
    repo NotificationRepository
}

func NewNotifier(repo NotificationRepository, opts ...Option) *Notifier {
    cfg := NotifierConfig{MaxRetries: 3, Timeout: 5 * time.Second}
    for _, o := range opts { o(&cfg) }
    return &Notifier{cfg: cfg, repo: repo}
}

func (n *Notifier) Send(to, message string) error {
    id := fmt.Sprintf("notif-%d", time.Now().UnixNano())
    notif := Notification{ID: id, To: to, Message: message}
    if err := n.repo.Save(notif); err != nil {
        return fmt.Errorf("send: %w", err)
    }
    if n.cfg.DryRun {
        fmt.Printf("DRY RUN: to=%s msg=%s\\n", to, message)
        return nil
    }
    fmt.Printf("sending to=%s msg=%s\\n", to, message)
    return nil
}

type Notification struct {
    ID, To, Message string
}

type NotificationRepository interface {
    Save(n Notification) error
    GetByID(id string) (Notification, error)
    List() []Notification
}

type memNotificationRepo struct {
    mu    sync.RWMutex
    items map[string]Notification
}

func NewMemRepo() NotificationRepository {
    return &memNotificationRepo{items: make(map[string]Notification)}
}

func (r *memNotificationRepo) Save(n Notification) error {
    r.mu.Lock(); defer r.mu.Unlock()
    r.items[n.ID] = n; return nil
}

func (r *memNotificationRepo) GetByID(id string) (Notification, error) {
    r.mu.RLock(); defer r.mu.RUnlock()
    n, ok := r.items[id]
    if !ok { return Notification{}, fmt.Errorf("GetByID %s: %w", id, ErrNotFound) }
    return n, nil
}

func (r *memNotificationRepo) List() []Notification {
    r.mu.RLock(); defer r.mu.RUnlock()
    list := make([]Notification, 0, len(r.items))
    for _, n := range r.items { list = append(list, n) }
    return list
}

func main() {
    repo := NewMemRepo()
    n := NewNotifier(repo, WithMaxRetries(5), WithDryRun())
    n.Send("alice@example.com", "Hello!")
    fmt.Println("saved:", len(repo.List()))
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What problem does the Functional Options pattern solve?',
      options: [
        'It allows optional configuration without breaking existing callers when new options are added',
        'It enforces that all options are set before the object is used',
        'It replaces struct literals with a builder that validates fields',
        'It ensures configuration is immutable after construction',
      ],
      answer: 0,
      explanation: 'When a constructor has many optional parameters, callers must either pass all of them (with zero values for unused ones) or new parameters break all existing call sites. Functional options use variadic ...Option — callers pass only what they need, and adding a new WithX() option never changes the function signature.'
    },
    {
      q: 'Where should you define interfaces in Go?',
      options: [
        'In the package that uses them (the consumer), not the package that implements them',
        'In a shared "interfaces" package imported by both producer and consumer',
        'In the package that implements them, so implementations are co-located with the contract',
        'In the main package, close to where they are first used',
      ],
      answer: 0,
      explanation: 'Go interfaces are satisfied implicitly. The consumer defines the interface it needs — only the methods it actually calls. This keeps the producer package independent of the consumer. If the producer defined the interface, every new consumer would force the producer to change, creating backwards coupling.'
    },
    {
      q: 'What is the table-driven test pattern?',
      options: [
        'Define a slice of test cases as structs and run each with t.Run — one function, many cases',
        'Run tests against a real database table to verify SQL correctness',
        'Generate test cases automatically from a CSV file',
        'Run the same test function multiple times with different random seeds',
      ],
      answer: 0,
      explanation: 'Table-driven tests define test cases as a []struct with fields like name, input, want, wantErr. A single t.Run(tc.name, func) loop exercises all cases. Adding a new case is one line in the slice. Each sub-test gets its own name in go test -v output, and t.Parallel() runs them concurrently.'
    },
    {
      q: 'In the pipeline pattern, how do you signal all stages to stop early?',
      options: [
        'Pass a context.Context to each stage and select on ctx.Done() alongside the channel send/receive',
        'Close the first channel in the pipeline — closing propagates automatically',
        'Send a nil value as a sentinel to signal termination',
        'Use a global sync.WaitGroup and call wg.Done() when a stage should stop',
      ],
      answer: 0,
      explanation: 'Each pipeline stage goroutine selects between its channel operation and ctx.Done(). When the context is cancelled (context.WithCancel), all stages detect it on the next select iteration and return, closing their output channel. This cascades down the pipeline. Closing the first channel alone does not propagate — downstream stages block on their input.'
    },
    {
      q: 'Why prefer small (1-3 method) interfaces over large ones?',
      options: [
        'Small interfaces are easier to mock, satisfy accidentally, and compose — larger ones create strong coupling',
        'The Go compiler optimises small interfaces better than large ones',
        'Large interfaces cannot be embedded in structs',
        'Go limits interfaces to 10 methods maximum',
      ],
      answer: 0,
      explanation: 'A large interface requires mocks to implement every method even if the function under test uses only one. Small interfaces can be satisfied by many types (accidentally or intentionally), making code more composable. io.Reader (1 method) can be satisfied by files, buffers, HTTP bodies, and any custom type — a large interface would exclude most of them.'
    },
    {
      q: 'What is the functional options pattern in Go and what problem does it solve?',
      options: ['A way to implement functional programming', 'A way to provide optional constructor parameters without breaking backward compatibility — using variadic ...Option functions that modify a config struct', 'A pattern for pure functions only', 'Replaces dependency injection'],
      answer: 1,
      explanation: 'Functional options solve the "how do you add optional config to a New() function without breaking callers?" problem. Define a type Option func(*Config), provide WithX() functions that return Options, and accept ...Option in New(). Callers use only the options they care about. Adding a new option is backward-compatible. This pattern is used by gRPC, zap, and many standard Go libraries.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between a sentinel error and an error type?',
      a: 'A sentinel error is a package-level variable: var ErrNotFound = errors.New("not found"). Callers check it with errors.Is(err, ErrNotFound). An error type is a struct implementing the error interface: type NotFoundError struct { ID string }. Callers use errors.As to extract the struct and inspect its fields. Use sentinel errors for simple conditions; use error types when callers need structured data from the error (HTTP status code, field name, database error code).'
    },
    {
      q: 'When should I use sync.Once for a singleton vs package-level init()?',
      a: 'Use package init() for always-required setup that has no failure mode and runs at program start (registering types, setting up constants). Use sync.Once for expensive setup that might not always be needed, that can fail and needs error handling, or that must be lazily initialised (first call triggers setup). sync.Once is also safer for global DB connections — it handles concurrent goroutines racing to initialise correctly.'
    },
    {
      q: 'How do I test a function that depends on time.Now()?',
      a: 'Inject a clock abstraction. Define type Clock interface { Now() time.Time } and accept it as a dependency. In production, pass a RealClock struct. In tests, pass a FakeClock that returns a fixed time. Alternatively, accept a time.Time argument instead of calling time.Now() inside the function. Avoid calling time.Now() inside functions that need to be deterministically testable.'
    },
    {
      q: 'What is the fan-out fan-in pattern and when do you use it?',
      a: 'Fan-out: distribute a stream of work items from one channel to N worker goroutines, each processing items independently. Fan-in: merge N result channels back into one. Use when: individual items can be processed independently (no ordering requirement between items), processing is CPU or I/O bound, and you want to limit concurrency with a fixed worker pool. errgroup simplifies the fan-out case when you just need parallel execution with error collection.'
    },
    {
      q: 'How does the middleware pattern work for non-HTTP use cases?',
      a: 'The middleware pattern is just function composition. Define your handler type: type HandlerFunc func(ctx context.Context, event Event) error. A middleware is func(HandlerFunc) HandlerFunc. Wrap: final := logging(auth(rateLimiter(baseHandler))). This applies to CLI commands, message queue consumers, gRPC interceptors, database hooks — anywhere you have a handler you want to wrap with cross-cutting concerns (logging, auth, metrics, retry).'
    },
    {
      q: 'Should I use an ORM or write raw SQL in tests?',
      a: 'For unit tests: avoid both — use a repository interface and an in-memory fake. Tests run instantly with no database. For integration tests: hit a real database (testcontainers-go spins Docker automatically). Test the real SQL/ORM behaviour — mocked DB libraries cannot detect schema mismatch, wrong column names, or missing indexes. The in-memory fake is for testing business logic; the integration test is for testing data access correctness.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Go patterns are composition-based — functional options for config, interfaces in consumer packages, repository for testability, and pipeline/fan-out for concurrency.',
    mustKnow: [
      'Functional options: type Option func(*config) — WithX returns a closure; variadic ...Option is backwards-compatible.',
      'Accept interfaces, return structs (or interfaces) — enables mocking without framework overhead.',
      'Define interfaces in the consumer package — keeps the producer independent.',
      'Table-driven tests: []struct + t.Run(tc.name, ...) — one function, many cases.',
      'Pipeline: stages connected by channels; cancel via context.Context, not custom done channels.',
      'Small interfaces (1-3 methods) are easier to mock, compose, and satisfy accidentally.',
      'Return errors, not panics — panics are for programmer bugs, not expected failures.',
    ],
    interviewFocus: [
      'Explain the functional options pattern and why it is backwards compatible.',
      'Why should interfaces be defined in the consumer package, not the producer?',
      'How do you write a pipeline that can be cancelled mid-stream?',
      'What is the difference between sentinel errors and error types?',
      'How do you make a function testable when it depends on a database?',
    ],
  };
}
