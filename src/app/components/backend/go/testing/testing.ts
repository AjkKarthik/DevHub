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
  selector: 'app-go-testing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './testing.html',
  styleUrl: './testing.scss'
})
export class GoTesting {
  readingTime = 24;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  since = 'Go 1.21+';
  route = 'go-testing';
  nextRoute = '/go/cli';
  nextLabel = 'Go CLI Tools';

  quickRef: QuickRefItem[] = [
    { name: 'go test ./...', type: 'function', desc: 'Run all tests in the module (recursive)' },
    { name: 'go test -v ./...', type: 'function', desc: 'Verbose: print each test name and PASS/FAIL' },
    { name: 'go test -run TestName', type: 'function', desc: 'Run only tests matching a regex' },
    { name: 'go test -cover ./...', type: 'function', desc: 'Show test coverage percentage per package' },
    { name: 'go test -coverprofile=c.out', type: 'function', desc: 'Write coverage data; view with go tool cover -html=c.out' },
    { name: 'go test -race ./...', type: 'function', desc: 'Enable the data race detector' },
    { name: 'go test -bench=.', type: 'function', desc: 'Run all benchmark functions (Benchmark*)' },
    { name: 'go test -benchmem', type: 'function', desc: 'Report memory allocations per benchmark operation' },
    { name: 'testing.T.Helper()', type: 'method', desc: 'Mark caller as a test helper — error lines point to the caller' },
    { name: 'testing.T.Parallel()', type: 'method', desc: 'Run this test in parallel with other parallel tests' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Testing basics — testing.T and file conventions',
      points: [
        'Go testing is built in: no third-party framework needed. Test files end in _test.go and are compiled only by go test.',
        'Test functions must be: func TestXxx(t *testing.T) — starts with Test, takes *testing.T, no return value.',
        'testing.T.Error()/Errorf() — mark test as failed but continue running. Fatal()/Fatalf() — fail and stop immediately.',
        'Tests live in the same package (white-box) or in a package_test package (black-box external tests).',
        'go test ./... discovers and runs all _test.go files recursively. Sub-test results are cached for identical inputs.',
      ]
    },
    {
      heading: 'Table-driven tests — the Go idiom',
      points: [
        'Table-driven tests define a slice of test cases (name + inputs + expected) and loop over them with t.Run.',
        't.Run("name", func(t *testing.T) {...}) creates a subtest — named, individually runnable, independently failable.',
        'Name subtests descriptively: t.Run(tc.name, ...) — go test -run "TestAdd/adds_two_negatives" targets one case.',
        'Table-driven is the standard Go idiom for reducing duplication across similar test cases.',
        'Add t.Parallel() inside t.Run subtests to run cases concurrently and catch data races.',
      ]
    },
    {
      heading: 'Test helpers and testify',
      points: [
        'Write assertion helpers with t.Helper() so error lines point to the call site, not inside the helper function.',
        'Standard library only provides t.Error/Fatal — no assert library. Many teams add github.com/stretchr/testify.',
        'testify/assert: assert.Equal(t, expected, actual), assert.NoError(t, err) — prints diff on failure.',
        'testify/require: same as assert but fatal (stops test on first failure) — use for preconditions.',
        'testify/mock: generate mock implementations satisfying interfaces for unit isolation.',
      ]
    },
    {
      heading: 'Benchmarks and coverage',
      points: [
        'Benchmark functions: func BenchmarkXxx(b *testing.B) — the body loops b.N times; Go calibrates N automatically.',
        'b.ResetTimer() after setup code so setup time is excluded from benchmark timing.',
        'b.ReportAllocs() or go test -benchmem reports bytes/op and allocs/op — key for allocation-sensitive code.',
        'Coverage: go test -cover shows %. go test -coverprofile=c.out + go tool cover -html=c.out opens a browser view.',
        'Target > 80% coverage for business logic; 100% is impractical. Focus on critical paths, not line count.',
      ]
    },
    {
      heading: 'Integration and race detection',
      points: [
        'go test -race enables the Go race detector — instruments memory accesses to catch concurrent reads/writes.',
        'Race detection has ~2–20x overhead — run in CI, not every local build.',
        'Integration tests: use build tags (//go:build integration) or TestMain to skip/gate expensive tests.',
        'TestMain(m *testing.M): runs before all tests in a package — use for shared setup (DB connections, test containers).',
        'httptest.NewServer / httptest.NewRecorder: test HTTP handlers without a real network — fast, portable.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Table-Driven Tests',
      language: 'typescript',
      code: `// math/add.go
package math

func Add(a, b int) int { return a + b }
func Divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("division by zero")
    }
    return a / b, nil
}

// math/add_test.go
package math

import "testing"

func TestAdd(t *testing.T) {
    t.Parallel()  // this test can run in parallel with other tests

    cases := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"both positive", 2, 3, 5},
        {"both negative", -2, -3, -5},
        {"mixed signs", -2, 3, 1},
        {"zero values", 0, 0, 0},
    }

    for _, tc := range cases {
        tc := tc  // capture range variable (required pre-Go 1.22)
        t.Run(tc.name, func(t *testing.T) {
            t.Parallel()  // subtests also run in parallel
            got := Add(tc.a, tc.b)
            if got != tc.expected {
                t.Errorf("Add(%d, %d) = %d; want %d", tc.a, tc.b, got, tc.expected)
            }
        })
    }
}

func TestDivide(t *testing.T) {
    cases := []struct {
        name      string
        a, b      float64
        want      float64
        wantError bool
    }{
        {"normal division", 10, 2, 5, false},
        {"division by zero", 10, 0, 0, true},
        {"negative divisor", 10, -2, -5, false},
    }

    for _, tc := range cases {
        t.Run(tc.name, func(t *testing.T) {
            got, err := Divide(tc.a, tc.b)
            if tc.wantError {
                if err == nil { t.Error("expected error, got nil") }
                return
            }
            if err != nil { t.Fatalf("unexpected error: %v", err) }
            if got != tc.want { t.Errorf("got %v, want %v", got, tc.want) }
        })
    }
}

// Run specific subtest:
// go test -run "TestAdd/both_positive" ./math/`
    },
    {
      label: 'Test Helpers & testify',
      language: 'typescript',
      code: `// Custom assertion helper (stdlib only):
func assertNoError(t *testing.T, err error) {
    t.Helper()  // error line points to the CALLER of this helper, not here
    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }
}

func assertEqual[T comparable](t *testing.T, got, want T) {
    t.Helper()
    if got != want {
        t.Errorf("got %v, want %v", got, want)
    }
}

// --- Using testify (most popular third-party assertion lib) ---
// go get github.com/stretchr/testify

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestWithTestify(t *testing.T) {
    user, err := GetUser(1)

    // require: fatal on failure — stops test immediately
    require.NoError(t, err, "GetUser should not fail for existing user")
    require.NotNil(t, user)

    // assert: non-fatal — test continues to collect more failures
    assert.Equal(t, "Alice", user.Name)
    assert.Equal(t, "alice@example.com", user.Email)
    assert.True(t, user.Active)
    assert.ElementsMatch(t, []string{"admin", "user"}, user.Roles)  // order-independent
}

// Mock with testify/mock:
type MockUserRepo struct{ mock.Mock }

func (m *MockUserRepo) GetByID(id int) (*User, error) {
    args := m.Called(id)
    return args.Get(0).(*User), args.Error(1)
}

func TestServiceWithMock(t *testing.T) {
    repo := new(MockUserRepo)
    repo.On("GetByID", 1).Return(&User{Name: "Alice"}, nil)

    svc := NewUserService(repo)
    user, err := svc.GetUser(1)

    require.NoError(t, err)
    assert.Equal(t, "Alice", user.Name)
    repo.AssertExpectations(t)  // verify all expected calls were made
}`
    },
    {
      label: 'HTTP & Integration Tests',
      language: 'typescript',
      code: `// Testing HTTP handlers with httptest (stdlib):
import (
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"
)

func TestCreateUser(t *testing.T) {
    // Create request recorder — captures response without a real server
    body := strings.NewReader('{"name":"Alice","email":"alice@example.com"}')
    req := httptest.NewRequest(http.MethodPost, "/users", body)
    req.Header.Set("Content-Type", "application/json")
    w := httptest.NewRecorder()

    // Call handler directly — no network, no port, no cleanup
    handler := NewUserHandler(fakeDB)
    handler.CreateUser(w, req)

    res := w.Result()
    if res.StatusCode != http.StatusCreated {
        t.Errorf("expected 201, got %d", res.StatusCode)
    }

    var created User
    json.NewDecoder(res.Body).Decode(&created)
    if created.Name != "Alice" {
        t.Errorf("expected Alice, got %s", created.Name)
    }
}

// Full server test (for middleware integration):
func TestServerIntegration(t *testing.T) {
    // httptest.NewServer starts a real local server on a random port
    srv := httptest.NewServer(setupRouter())
    defer srv.Close()  // always close to free the port

    resp, err := http.Get(srv.URL + "/health")
    if err != nil {
        t.Fatalf("request failed: %v", err)
    }
    if resp.StatusCode != 200 {
        t.Errorf("health check failed: %d", resp.StatusCode)
    }
}

// TestMain — shared setup for the whole package:
func TestMain(m *testing.M) {
    // Setup: start test DB, seed data, etc.
    db := setupTestDB()

    // Run all tests in this package
    code := m.Run()

    // Teardown: close DB, clean up
    db.Close()
    os.Exit(code)
}`
    },
    {
      label: 'Benchmarks',
      language: 'typescript',
      code: `// Benchmark function signature: BenchmarkXxx(b *testing.B)
import "testing"

func BenchmarkStringConcat(b *testing.B) {
    // b.N is set automatically by the testing framework
    for i := 0; i < b.N; i++ {
        s := ""
        for j := 0; j < 100; j++ {
            s += "x"  // this allocates on every iteration
        }
        _ = s
    }
}

func BenchmarkStringBuilder(b *testing.B) {
    for i := 0; i < b.N; i++ {
        var sb strings.Builder
        for j := 0; j < 100; j++ {
            sb.WriteByte('x')  // no allocs in the loop
        }
        _ = sb.String()
    }
}

// Benchmark with setup (excluded from timing):
func BenchmarkSort(b *testing.B) {
    data := makeRandomSlice(1000)  // setup

    b.ResetTimer()  // exclude setup time from measurement

    for i := 0; i < b.N; i++ {
        d := make([]int, len(data))
        copy(d, data)
        sort.Ints(d)
    }
}

// Sub-benchmarks (vary input size):
func BenchmarkSearch(b *testing.B) {
    for _, size := range []int{100, 1000, 10000} {
        b.Run(fmt.Sprintf("size_%d", size), func(b *testing.B) {
            data := makeSlice(size)
            b.ResetTimer()
            for i := 0; i < b.N; i++ {
                search(data, data[size/2])
            }
        })
    }
}

// Run benchmarks:
// go test -bench=. -benchmem ./...
// go test -bench=BenchmarkStringBuilder -benchtime=5s

// Output:
// BenchmarkStringConcat-8     100000   12345 ns/op   6400 B/op  99 allocs/op
// BenchmarkStringBuilder-8   1000000    1234 ns/op      0 B/op   0 allocs/op`
    },
    {
      label: 'Race Detection & Fuzz',
      language: 'typescript',
      code: `// Race detection — run with: go test -race ./...
func TestConcurrentCounter(t *testing.T) {
    counter := &Counter{}  // Counter has a mutex inside
    var wg sync.WaitGroup

    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter.Increment()
        }()
    }
    wg.Wait()

    if counter.Value() != 100 {
        t.Errorf("expected 100, got %d", counter.Value())
    }
}

// Without the mutex, -race would print:
// WARNING: DATA RACE
// Write at 0x... by goroutine 7
// Previous read at 0x... by goroutine 5

// Fuzz testing (Go 1.18+) — auto-generates inputs:
// go test -fuzz=FuzzReverse -fuzztime=30s

func FuzzReverse(f *testing.F) {
    // Seed corpus — initial inputs:
    f.Add("hello")
    f.Add("")
    f.Add("racecar")

    f.Fuzz(func(t *testing.T, s string) {
        // Property: reversing twice returns the original
        rev := Reverse(s)
        revRev := Reverse(rev)
        if s != revRev {
            t.Errorf("Reverse(Reverse(%q)) = %q, want %q", s, revRev, s)
        }

        // Property: length is preserved
        if len(rev) != len(s) {
            t.Errorf("Reverse changed length: %q -> %q", s, rev)
        }
    })
}

// Found failures are saved to testdata/fuzz/FuzzReverse/
// These become permanent regression tests on subsequent go test runs`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not using t.Helper() in assertion helpers',
      wrong: `func assertNoError(t *testing.T, err error) {
    // no t.Helper() call
    if err != nil {
        t.Fatal(err)  // error line points HERE, not to the caller
    }
}`,
      right: `func assertNoError(t *testing.T, err error) {
    t.Helper()  // marks this function as a helper
    if err != nil {
        t.Fatal(err)  // error line now points to the caller of assertNoError
    }
}`,
      explanation: 'Without t.Helper(), the error output shows the line inside the helper function — not the test line that triggered the failure. Debugging requires tracing back manually. t.Helper() tells the testing framework to skip this frame in the error output, so failures point directly to the meaningful test line.'
    },
    {
      title: 'Using t.Error for precondition failures instead of t.Fatal',
      wrong: `result, err := GetUser(1)
t.Error(err)        // t.Error does NOT stop the test!
// the test continues — result is nil, next line panics
if result.Name != "Alice" { ... }  // nil pointer panic`,
      right: `result, err := GetUser(1)
if err != nil {
    t.Fatalf("GetUser failed: %v", err)  // stops immediately
}
// safe to use result here
if result.Name != "Alice" { ... }`,
      explanation: 't.Error and t.Errorf mark the test as failed but let it continue executing — good for collecting multiple unrelated failures. t.Fatal and t.Fatalf fail and immediately stop the test function via runtime.Goexit. Use Fatal when subsequent code would panic or give misleading errors if a precondition fails.'
    },
    {
      title: 'Forgetting tc := tc in pre-Go 1.22 loop closures',
      wrong: `// Go < 1.22: loop variable is shared
for _, tc := range cases {
    t.Run(tc.name, func(t *testing.T) {
        t.Parallel()
        // tc is captured by reference — all subtests see the LAST value!
        result := process(tc.input)
        assertEqual(t, result, tc.expected)
    })
}`,
      right: `for _, tc := range cases {
    tc := tc  // shadow with a copy (required in Go < 1.22)
    t.Run(tc.name, func(t *testing.T) {
        t.Parallel()
        result := process(tc.input)
        assertEqual(t, result, tc.expected)
    })
}
// In Go 1.22+, range creates per-iteration variables automatically — tc := tc is no longer needed`,
      explanation: 'In Go < 1.22, a for-range loop has a single loop variable. Goroutines or subtests that capture it by reference (closures) all see the final value. Adding tc := tc inside the loop body creates a new copy per iteration. Go 1.22 fixed this by making each iteration its own variable — the idiom is now a no-op but harmless.'
    },
    {
      title: 'Calling os.Exit in tests instead of t.FailNow',
      wrong: `func TestSomething(t *testing.T) {
    if err := setup(); err != nil {
        fmt.Println("setup failed:", err)
        os.Exit(1)  // bypasses deferred functions + test cleanup!
    }
}`,
      right: `func TestSomething(t *testing.T) {
    if err := setup(); err != nil {
        t.Fatalf("setup failed: %v", err)  // runs deferred cleanup
    }
    t.Cleanup(func() { teardown() })  // always runs on test end
}`,
      explanation: 'os.Exit skips all deferred functions — open files, database connections, and t.Cleanup callbacks are never closed/run. This can leave test state dirty for subsequent tests. t.Fatal / t.FailNow call runtime.Goexit, which runs deferred functions properly. Always use testing primitives for test control flow.'
    },
    {
      title: 'Testing implementation details instead of behaviour',
      wrong: `func TestInternalQueue(t *testing.T) {
    q := &Queue{}
    q.items = append(q.items, "x")  // accessing internal field directly
    if q.items[0] != "x" { t.Error(...) }
}`,
      right: `func TestQueueBehaviour(t *testing.T) {
    q := NewQueue()
    q.Enqueue("x")
    q.Enqueue("y")
    got, ok := q.Dequeue()
    if !ok || got != "x" { t.Errorf("expected x, got %v", got) }
}`,
      explanation: 'Testing unexported fields or internal structure makes tests brittle — any refactoring that preserves behaviour breaks the tests. Test the public API: what it does, not how it does it. Black-box testing (from a _test package) enforces this — you can only access exported symbols, naturally discouraging testing internals.'
    },
    {
      title: 'Not running the race detector in CI',
      wrong: `# CI just runs:
go test ./...
# Race conditions pass silently — only discovered in production`,
      right: `# CI always adds -race:
go test -race ./...
# Race conditions caught immediately on the branch`,
      explanation: 'The Go race detector is highly effective at catching concurrent memory access bugs that may appear intermittently in production. It adds ~2-20x overhead — acceptable in CI. Skipping it means data races accumulate silently. The overhead argument is invalid for CI: CI is the place to catch these, not production at 3am.'
    },
  ];

  challenge: Challenge = {
    title: 'Test a Stack Data Structure',
    language: 'typescript',
    description: `Write a complete, table-driven test file for a generic Stack[T] data structure.

**The Stack interface you are testing:**
\`\`\`go
type Stack[T any] struct { items []T }

func (s *Stack[T]) Push(v T)
func (s *Stack[T]) Pop() (T, bool)    // returns zero value + false if empty
func (s *Stack[T]) Peek() (T, bool)   // returns top without removing
func (s *Stack[T]) Len() int
func (s *Stack[T]) IsEmpty() bool
\`\`\`

**Write tests that:**
1. Test Push + Len (table-driven: push 0, 1, 3 items)
2. Test Pop with subtests: pop from empty stack (must return false), pop single item, pop restores LIFO order
3. Test Peek: doesn't remove item, returns false on empty
4. Test IsEmpty: true on new stack, false after push
5. Add a helper function \`requireEmpty(t, s)\` using t.Helper()
6. Add a benchmark: BenchmarkPushPop — push then pop N items

All tests must be table-driven where applicable.`,
    hints: [
      'Use t.Parallel() at the test function level and inside t.Run subtests',
      'LIFO order test: push A, B, C then pop should give C, B, A',
      'Pop and Peek both return (T, bool) — check both return values',
      'Benchmark: loop b.N times, each iteration push one item then pop it',
    ],
    starterCode: `package stack_test

import (
    "testing"
    . "github.com/alice/myapp/stack"
)

func TestPush(t *testing.T) {
    // TODO: table-driven tests for Push + Len
}

func TestPop(t *testing.T) {
    // TODO: subtests — empty stack, single item, LIFO order
}

func TestPeek(t *testing.T) {
    // TODO
}

func TestIsEmpty(t *testing.T) {
    // TODO
}

func requireEmpty[T any](t *testing.T, s *Stack[T]) {
    // TODO: t.Helper() + check IsEmpty
}

func BenchmarkPushPop(b *testing.B) {
    // TODO
}`,
    solution: `package stack_test

import (
    "testing"
    . "github.com/alice/myapp/stack"
)

func requireEmpty[T any](t *testing.T, s *Stack[T]) {
    t.Helper()
    if !s.IsEmpty() {
        t.Errorf("expected stack to be empty, len=%d", s.Len())
    }
}

func TestPush(t *testing.T) {
    t.Parallel()
    cases := []struct {
        name  string
        items []int
        want  int
    }{
        {"empty stack", nil, 0},
        {"single item", []int{1}, 1},
        {"three items", []int{1, 2, 3}, 3},
    }
    for _, tc := range cases {
        tc := tc
        t.Run(tc.name, func(t *testing.T) {
            t.Parallel()
            s := &Stack[int]{}
            for _, v := range tc.items {
                s.Push(v)
            }
            if s.Len() != tc.want {
                t.Errorf("Len() = %d, want %d", s.Len(), tc.want)
            }
        })
    }
}

func TestPop(t *testing.T) {
    t.Parallel()

    t.Run("empty stack returns false", func(t *testing.T) {
        t.Parallel()
        s := &Stack[int]{}
        _, ok := s.Pop()
        if ok { t.Error("expected false from empty stack, got true") }
    })

    t.Run("single item", func(t *testing.T) {
        t.Parallel()
        s := &Stack[string]{}
        s.Push("hello")
        got, ok := s.Pop()
        if !ok || got != "hello" {
            t.Errorf("Pop() = %q, %v; want hello, true", got, ok)
        }
        requireEmpty(t, s)
    })

    t.Run("LIFO order", func(t *testing.T) {
        t.Parallel()
        s := &Stack[int]{}
        for _, v := range []int{1, 2, 3} { s.Push(v) }
        for _, want := range []int{3, 2, 1} {
            got, ok := s.Pop()
            if !ok || got != want {
                t.Errorf("Pop() = %d, %v; want %d, true", got, ok, want)
            }
        }
        requireEmpty(t, s)
    })
}

func TestPeek(t *testing.T) {
    t.Parallel()

    t.Run("empty stack returns false", func(t *testing.T) {
        s := &Stack[int]{}
        _, ok := s.Peek()
        if ok { t.Error("expected false, got true") }
    })

    t.Run("does not remove item", func(t *testing.T) {
        s := &Stack[int]{}
        s.Push(42)
        got, ok := s.Peek()
        if !ok || got != 42 { t.Errorf("Peek() = %d, %v; want 42, true", got, ok) }
        if s.Len() != 1 { t.Errorf("Len() = %d after Peek; want 1", s.Len()) }
    })
}

func TestIsEmpty(t *testing.T) {
    s := &Stack[bool]{}
    if !s.IsEmpty() { t.Error("new stack should be empty") }
    s.Push(true)
    if s.IsEmpty() { t.Error("stack with item should not be empty") }
}

func BenchmarkPushPop(b *testing.B) {
    s := &Stack[int]{}
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        s.Push(i)
        s.Pop()
    }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between t.Error and t.Fatal?',
      options: [
        't.Error marks the test failed and continues; t.Fatal marks failed and immediately stops the test via runtime.Goexit',
        't.Error logs a warning without failing; t.Fatal is the only way to actually fail a test',
        't.Error stops the test; t.Fatal panics so deferred functions run',
        'There is no difference — both stop test execution immediately',
      ],
      answer: 0,
      explanation: 't.Error/t.Errorf mark the test as failed but let it keep running — useful for collecting multiple independent failures in one run. t.Fatal/t.Fatalf call runtime.Goexit, which terminates the test goroutine after running all deferred functions. Use Fatal when subsequent code would panic or give misleading errors if a precondition fails (e.g., after err != nil).'
    },
    {
      q: 'What does t.Helper() do in a test helper function?',
      options: [
        'It marks the function as a helper so error line numbers point to the caller, not inside the helper',
        'It registers cleanup functions that run when the test ends',
        'It marks the function as safe for concurrent use by multiple goroutines',
        'It skips the test if the helper setup fails',
      ],
      answer: 0,
      explanation: 'Without t.Helper(), failing t.Error/t.Fatal inside a helper function reports the line inside the helper — not where the test called the helper. t.Helper() tells the testing framework: "when reporting failures, skip this frame." This makes error output immediately actionable — you see the test line that caused the failure, not the assertion implementation.'
    },
    {
      q: 'What does `go test -race` do?',
      options: [
        'Instruments memory accesses to detect concurrent read/write data races at runtime',
        'Runs tests in parallel to make the test suite faster',
        'Generates a race between test and production builds to spot version mismatches',
        'Orders tests alphabetically to detect state ordering bugs',
      ],
      answer: 0,
      explanation: 'The Go race detector instruments every memory access. When two goroutines access the same memory concurrently and at least one write occurs without synchronization, the detector reports a race. It adds 2–20x overhead so it\'s usually run in CI, not on every local build. It catches real bugs that intermittently fail in production.'
    },
    {
      q: 'What does b.ResetTimer() do in a benchmark?',
      options: [
        'Resets the benchmark timer to exclude setup code from the measured time',
        'Resets b.N to 1 so the benchmark starts fresh',
        'Zeroes memory allocations so -benchmem starts counting from zero',
        'Marks the end of one benchmark iteration',
      ],
      answer: 0,
      explanation: 'Benchmark functions often do setup before the timed loop (allocating data, opening connections). That setup time should not be counted as benchmark overhead. b.ResetTimer() zeroes the elapsed time and allocation counters. Call it immediately after setup, before the b.N loop. If setup is trivial, it\'s safe to omit.'
    },
    {
      q: 'What is the purpose of TestMain(m *testing.M)?',
      options: [
        'It runs before all tests in the package — use for shared setup like DB connections; call m.Run() to run the tests',
        'It is the entry point for the main package under test',
        'It marks the main test that all other tests depend on',
        'It controls which tests run based on command-line flags',
      ],
      answer: 0,
      explanation: 'TestMain is an optional hook — if defined, the testing framework calls it instead of running tests directly. You perform shared setup (start a DB, seed test data, spin up a test server), call m.Run() to run all tests in the package, then perform teardown, then os.Exit(m.Run()). Without TestMain, tests run automatically.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I run a specific test or subtest?',
      a: 'Use go test -run with a regular expression: go test -run TestAdd runs any test matching "TestAdd". go test -run "TestAdd/both_positive" targets a specific subtest — the name is built from the outer test name and the t.Run name joined with a slash. Spaces in subtest names become underscores in the -run filter. go test -run "^TestAdd$" pins to an exact match.'
    },
    {
      q: 'What is the difference between internal and external test packages?',
      a: 'Internal test files use package foo (same package) — they can access unexported identifiers. External test files use package foo_test — they can only access exported identifiers, simulating a real consumer. Both can live in the same directory. External tests ensure your public API is testable on its own and discourage testing internal implementation details. Use internal for white-box unit tests, external for black-box integration tests.'
    },
    {
      q: 'How do I use test fixtures and golden files?',
      a: 'Store fixture files in a testdata/ directory — the Go toolchain ignores this directory for builds but go test has access. Load them with os.ReadFile("testdata/input.json"). For golden files (expected output): read the expected from testdata/expected.txt and compare to actual. Add -update flag handling to regenerate golden files: if *update { os.WriteFile("testdata/expected.txt", actual, 0644) }. This pattern is common for testing complex output (JSON, HTML, SQL).'
    },
    {
      q: 'How do I test code that depends on time or random numbers?',
      a: 'Inject time via an interface or function parameter rather than calling time.Now() directly. Define: type Clock interface { Now() time.Time }. Pass a real clock in production and a fake clock in tests. For random numbers, pass a *rand.Rand or seed with a fixed value. Alternatively, accept a now func() time.Time parameter. This is the "seam" pattern — inject the variable dependency so tests control it.'
    },
    {
      q: 'What is fuzzing and when should I use it?',
      a: 'Fuzzing (Go 1.18+) auto-generates random inputs to find crashes, panics, and incorrect behaviour. Define a FuzzXxx(f *testing.F) function, provide seed inputs with f.Add, and implement f.Fuzz to test invariants on each generated input. Run: go test -fuzz=FuzzXxx -fuzztime=60s. Use fuzzing for: parsers (JSON, XML, config files), codec round-trips, string manipulation, untrusted input handling. The fuzzer saves failing inputs to testdata/ as permanent regression tests.'
    },
    {
      q: 'How do I measure and improve test coverage?',
      a: 'Run: go test -coverprofile=c.out ./... then go tool cover -html=c.out to open a browser view showing covered (green) and uncovered (red) lines. Focus coverage efforts on business logic and error paths — 100% coverage is impractical and often counterproductive. A line being covered means it was executed; it does not mean it was tested correctly. Use coverage to find untested branches, not as a quality metric on its own.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Go testing is built in: _test.go files, TestXxx(t *testing.T), table-driven with t.Run, benchmarks with b.N, and race detection with -race.',
    mustKnow: [
      't.Error/Errorf: fail and continue. t.Fatal/Fatalf: fail and stop immediately.',
      'Table-driven tests: slice of cases, loop with t.Run(tc.name, ...) — Go\'s standard idiom.',
      't.Helper() in assertion helpers makes error lines point to the caller, not the helper.',
      'go test -race: catches concurrent data races — always run in CI.',
      'Benchmarks: func BenchmarkXxx(b *testing.B) — loop b.N times; b.ResetTimer() after setup.',
      'httptest.NewRecorder and httptest.NewServer: test HTTP handlers without a real port.',
      'TestMain(m *testing.M): shared setup before all tests; must call os.Exit(m.Run()).',
    ],
    interviewFocus: [
      'What is the difference between t.Error and t.Fatal?',
      'What does t.Helper() do and why use it in assertion helpers?',
      'How do you write table-driven tests in Go?',
      'What does go test -race detect and when should you run it?',
      'How do you test HTTP handlers without starting a real server?',
    ],
  };
}
