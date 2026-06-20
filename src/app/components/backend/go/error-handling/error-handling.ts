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
  selector: 'app-go-error-handling',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './error-handling.html',
  styleUrl: './error-handling.scss'
})
export class GoErrorHandling {
  readingTime = 22;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Go 1.13+';
  route = 'go-error-handling';
  nextRoute = '/go/slices-maps';
  nextLabel = 'Slices & Maps';

  quickRef: QuickRefItem[] = [
    { name: 'errors.New("msg")', type: 'function', desc: 'Create a simple sentinel error value' },
    { name: 'fmt.Errorf("context: %w", err)', type: 'function', desc: 'Wrap an error with context (Go 1.13+)' },
    { name: 'errors.Is(err, target)', type: 'function', desc: 'Check if err or any wrapped error equals target' },
    { name: 'errors.As(err, &target)', type: 'function', desc: 'Unwrap err chain to find a type assignable to target' },
    { name: 'errors.Unwrap(err)', type: 'function', desc: 'Return the next error in the chain' },
    { name: 'if err != nil { return ... }', type: 'syntax', desc: 'Idiomatic early return on error — handle at the call site' },
    { name: 'panic("message") / recover()', type: 'function', desc: 'Unrecoverable errors / catch a panic in a deferred func' },
    { name: 'type MyError struct{ Code int }', type: 'syntax', desc: 'Custom error type — implement Error() string' },
    { name: 'log.Fatal(err)', type: 'function', desc: 'Log and exit with status 1 — use only in main()' },
    { name: 'var ErrNotFound = errors.New("not found")', type: 'syntax', desc: 'Sentinel error — exported for callers to match with errors.Is' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Errors are values',
      points: [
        'In Go, errors are ordinary values that implement the `error` interface: `Error() string`.',
        'Functions signal failure by returning an `error` as the last return value: `func f() (Result, error)`.',
        'The caller checks `if err != nil` immediately after the call — there are no exceptions to silently propagate.',
        'This explicit handling forces callers to think about failures at every call site.',
        'Ignoring errors with `_` is valid Go but a code smell — only do it when you are certain the call cannot fail.',
      ]
    },
    {
      heading: 'Creating errors: New, Errorf, custom types',
      points: [
        '`errors.New("message")` creates a simple error. Two calls with the same string return different values.',
        '`fmt.Errorf("context: %w", err)` wraps an existing error with additional context — the `%w` verb stores the wrapped error.',
        'Custom error types carry extra fields: `type ValidationError struct { Field, Msg string }`. Implement `Error() string`.',
        'Sentinel errors are package-level `var ErrXxx = errors.New(...)` values that callers compare against.',
        'Prefer wrapping over creating new errors mid-stack so the full chain is preserved.',
      ]
    },
    {
      heading: 'Error wrapping & unwrapping (Go 1.13+)',
      points: [
        '`fmt.Errorf("op: %w", err)` wraps `err` — the `%w` verb connects them in a chain.',
        '`errors.Is(err, target)` traverses the entire chain: returns true if any error in the chain equals `target`.',
        '`errors.As(err, &target)` traverses the chain: assigns the first error assignable to `target`\'s type.',
        '`errors.Unwrap(err)` returns the next error in the chain (the wrapped error).',
        'Do NOT use `err.Error()` string comparison — that is fragile. Use `errors.Is` and `errors.As` instead.',
      ]
    },
    {
      heading: 'Panic & recover',
      points: [
        '`panic(value)` stops normal execution, runs deferred functions, then terminates the goroutine (and crashes the program unless recovered).',
        '`recover()` in a deferred function catches a panic and returns the panicked value.',
        'Use panic only for truly unrecoverable states — programmer errors, invalid state, out-of-bounds not expected at runtime.',
        'Libraries should never let panics escape to callers — recover at the API boundary and return an error.',
        '`log.Fatal` and `os.Exit` bypass defer — never use them inside library code.',
      ]
    },
    {
      heading: 'Error handling patterns',
      points: [
        'Add context at each layer: `return fmt.Errorf("userService.GetUser: %w", err)`. The call stack becomes the error chain.',
        'Sentinel errors for expected conditions: `var ErrNotFound = errors.New("not found")`. Use `errors.Is` to check.',
        'Custom types for structured errors: `type HTTPError struct { Code int; Msg string }`. Use `errors.As` to extract.',
        'The `errors` package (Go stdlib) and `github.com/pkg/errors` (legacy) both support wrapping.',
        'In main(), use `log.Fatalf` or print the error and `os.Exit(1)` — do not silently ignore top-level errors.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Error Handling',
      language: 'typescript',
      code: `package main

import (
    "errors"
    "fmt"
)

var ErrNotFound = errors.New("not found")
var ErrPermission = errors.New("permission denied")

func findUser(id int) (string, error) {
    users := map[int]string{1: "Alice", 2: "Bob"}
    user, ok := users[id]
    if !ok {
        return "", fmt.Errorf("findUser(%d): %w", id, ErrNotFound)
    }
    return user, nil
}

func main() {
    user, err := findUser(3)
    if err != nil {
        if errors.Is(err, ErrNotFound) {
            fmt.Println("User not found — show 404")
        } else {
            fmt.Println("Unexpected error:", err)
        }
        return
    }
    fmt.Println("Found:", user)
}`
    },
    {
      label: 'Custom Error Types',
      language: 'typescript',
      code: `package main

import (
    "errors"
    "fmt"
)

type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error: field %q — %s", e.Field, e.Message)
}

func validateAge(age int) error {
    if age < 0 {
        return &ValidationError{Field: "age", Message: "must be non-negative"}
    }
    if age > 150 {
        return &ValidationError{Field: "age", Message: "unrealistically large"}
    }
    return nil
}

func main() {
    err := validateAge(-5)
    if err != nil {
        var ve *ValidationError
        if errors.As(err, &ve) {
            fmt.Printf("Field: %s, Problem: %s\\n", ve.Field, ve.Message)
        } else {
            fmt.Println("Unknown error:", err)
        }
    }
}`
    },
    {
      label: 'Error Wrapping Chain',
      language: 'typescript',
      code: `package main

import (
    "errors"
    "fmt"
)

var ErrDB = errors.New("database error")

func queryDB(id int) error {
    return fmt.Errorf("queryDB: %w", ErrDB)
}

func getUser(id int) error {
    if err := queryDB(id); err != nil {
        return fmt.Errorf("getUser(%d): %w", id, err)
    }
    return nil
}

func handleRequest(id int) error {
    if err := getUser(id); err != nil {
        return fmt.Errorf("handleRequest: %w", err)
    }
    return nil
}

func main() {
    err := handleRequest(42)
    if err != nil {
        fmt.Println(err)
        // handleRequest: getUser(42): queryDB: database error

        fmt.Println(errors.Is(err, ErrDB)) // true — traverses chain

        // Unwrap manually
        for e := err; e != nil; e = errors.Unwrap(e) {
            fmt.Printf("  -> %v\\n", e)
        }
    }
}`
    },
    {
      label: 'Panic & Recover',
      language: 'typescript',
      code: `package main

import "fmt"

// safeDiv recovers from a division-by-zero panic
func safeDiv(a, b int) (result int, err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("recovered panic: %v", r)
        }
    }()
    result = a / b // panics if b == 0
    return
}

// mustPositive panics on invalid input (programmer error)
func mustPositive(n int) int {
    if n <= 0 {
        panic(fmt.Sprintf("mustPositive: got %d, want > 0", n))
    }
    return n
}

func main() {
    v, err := safeDiv(10, 2)
    fmt.Println(v, err) // 5 <nil>

    v, err = safeDiv(10, 0)
    fmt.Println(v, err) // 0 recovered panic: runtime error: integer divide by zero

    fmt.Println(mustPositive(5)) // 5
    // mustPositive(-1) would panic and crash
}`
    },
    {
      label: 'Real-World Pattern',
      language: 'typescript',
      code: `package main

import (
    "errors"
    "fmt"
    "strconv"
)

type ParseError struct {
    Input string
    Err   error
}

func (e *ParseError) Error() string {
    return fmt.Sprintf("parse %q: %v", e.Input, e.Err)
}
func (e *ParseError) Unwrap() error { return e.Err }

func parsePositiveInt(s string) (int, error) {
    n, err := strconv.Atoi(s)
    if err != nil {
        return 0, &ParseError{Input: s, Err: err}
    }
    if n <= 0 {
        return 0, &ParseError{Input: s, Err: fmt.Errorf("must be positive, got %d", n)}
    }
    return n, nil
}

func main() {
    for _, s := range []string{"42", "abc", "-5"} {
        n, err := parsePositiveInt(s)
        if err != nil {
            var pe *ParseError
            if errors.As(err, &pe) {
                fmt.Printf("Bad input %q: %v\\n", pe.Input, pe.Err)
            }
            continue
        }
        fmt.Println("Parsed:", n)
    }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Ignoring errors with blank identifier',
      wrong: `data, _ := os.ReadFile("config.json")
// If ReadFile fails, data is nil — program silently breaks later`,
      right: `data, err := os.ReadFile("config.json")
if err != nil {
    return fmt.Errorf("load config: %w", err)
}`,
      explanation: 'Blanking errors hides failures. The zero value for []byte is nil — code that uses data without checking will either panic or produce wrong results silently.'
    },
    {
      title: 'Comparing errors with == instead of errors.Is',
      wrong: `if err == ErrNotFound {  // breaks if err is wrapped`,
      right: `if errors.Is(err, ErrNotFound) { // traverses the whole chain`,
      explanation: 'Since Go 1.13, errors can be wrapped with %w. Direct == comparison only matches the top error. errors.Is traverses the full chain and should always be used for sentinel comparisons.'
    },
    {
      title: 'Losing error context by not wrapping',
      wrong: `func getUser(id int) error {
    if err := queryDB(id); err != nil {
        return err  // caller sees "database error" — no context
    }
}`,
      right: `func getUser(id int) error {
    if err := queryDB(id); err != nil {
        return fmt.Errorf("getUser(%d): %w", id, err)
    }
}`,
      explanation: 'Returning errors unwrapped loses the call stack context. Wrap with fmt.Errorf and %w to add the current layer\'s operation name and relevant parameters.'
    },
    {
      title: 'Using panic for expected error conditions',
      wrong: `func findUser(id int) *User {
    u, ok := users[id]
    if !ok {
        panic("user not found") // should be a returned error
    }
    return u
}`,
      right: `func findUser(id int) (*User, error) {
    u, ok := users[id]
    if !ok {
        return nil, fmt.Errorf("findUser(%d): %w", id, ErrNotFound)
    }
    return u, nil
}`,
      explanation: 'Panic is for unrecoverable programmer errors (nil pointer, invariant violation). Expected failures like "user not found" should be returned as errors so callers can handle them gracefully.'
    },
    {
      title: 'Calling log.Fatal inside a library function',
      wrong: `func OpenDB(dsn string) *sql.DB {
    db, err := sql.Open("postgres", dsn)
    if err != nil {
        log.Fatal(err) // kills the whole process!
    }
    return db
}`,
      right: `func OpenDB(dsn string) (*sql.DB, error) {
    db, err := sql.Open("postgres", dsn)
    if err != nil {
        return nil, fmt.Errorf("OpenDB: %w", err)
    }
    return db, nil
}`,
      explanation: 'log.Fatal calls os.Exit(1) which bypasses defer and kills the process immediately. Library code should return errors. Reserve log.Fatal for main() and top-level initialisation.'
    },
    {
      title: 'Returning a nil pointer wrapped in a non-nil error type',
      wrong: `func getError() error {
    var e *MyError = nil
    return e // looks like nil, but is a non-nil interface!
}
fmt.Println(getError() == nil) // false — surprising`,
      right: `func getError() error {
    return nil // return the interface nil directly
}`,
      explanation: 'A typed nil pointer assigned to an interface is not nil — the interface has a non-nil type component. Always return the bare nil when there is no error, never a typed nil pointer.'
    },
  ];

  challenge: Challenge = {
    title: 'Retry with Error Wrapping',
    language: 'typescript',
    description: `Write a \`Retry\` function that calls an operation up to N times, wrapping each failure with context.

\`\`\`go
func Retry(n int, op func() error) error
\`\`\`

Requirements:
- If the operation succeeds on any attempt, return nil
- If all attempts fail, return a combined error that includes the attempt number and wraps the last error
- Write a sentinel \`ErrMaxRetries\` that callers can check with \`errors.Is\`

Example:
\`\`\`
attempts := 0
err := Retry(3, func() error {
    attempts++
    if attempts < 3 { return errors.New("transient") }
    return nil
})
fmt.Println(err)       // nil (succeeded on attempt 3)
\`\`\``,
    hints: [
      'Loop from 1 to n inclusive — track attempt number in the loop variable',
      'Wrap each failure: fmt.Errorf("attempt %d: %w", i, err)',
      'Use errors.Is(err, ErrMaxRetries) by having your final error wrap ErrMaxRetries',
      'Return nil as soon as op() returns nil',
    ],
    starterCode: `package main

import (
    "errors"
    "fmt"
)

var ErrMaxRetries = errors.New("max retries exceeded")

func Retry(n int, op func() error) error {
    // TODO: implement
    return nil
}

func main() {
    attempt := 0
    err := Retry(3, func() error {
        attempt++
        fmt.Printf("attempt %d\\n", attempt)
        if attempt < 3 {
            return errors.New("transient failure")
        }
        return nil
    })
    fmt.Println("result:", err) // nil

    // All fail case
    err2 := Retry(2, func() error {
        return errors.New("always fails")
    })
    fmt.Println("result2:", err2)
    fmt.Println("is max retries:", errors.Is(err2, ErrMaxRetries))
}`,
    solution: `package main

import (
    "errors"
    "fmt"
)

var ErrMaxRetries = errors.New("max retries exceeded")

func Retry(n int, op func() error) error {
    var lastErr error
    for i := 1; i <= n; i++ {
        if err := op(); err != nil {
            lastErr = fmt.Errorf("attempt %d: %w", i, err)
        } else {
            return nil
        }
    }
    return fmt.Errorf("%w after %d attempts: %w", ErrMaxRetries, n, lastErr)
}

func main() {
    attempt := 0
    err := Retry(3, func() error {
        attempt++
        fmt.Printf("attempt %d\\n", attempt)
        if attempt < 3 {
            return errors.New("transient failure")
        }
        return nil
    })
    fmt.Println("result:", err) // nil

    err2 := Retry(2, func() error {
        return errors.New("always fails")
    })
    fmt.Println("result2:", err2)
    fmt.Println("is max retries:", errors.Is(err2, ErrMaxRetries)) // true
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What interface must a type implement to be used as an error in Go?',
      options: ['error — with method Error() string', 'Exception — with method Message() string', 'Throwable — with method Throw()', 'Any type can be used as an error'],
      answer: 0,
      explanation: 'The built-in error interface has a single method: Error() string. Any type that implements this method satisfies the error interface and can be returned as an error.'
    },
    {
      q: 'What is the correct way to check if an error matches a sentinel error after Go 1.13?',
      options: ['errors.Is(err, ErrTarget)', 'err == ErrTarget', 'err.Error() == ErrTarget.Error()', 'reflect.DeepEqual(err, ErrTarget)'],
      answer: 0,
      explanation: 'errors.Is traverses the full error chain created by fmt.Errorf with %w. Direct == comparison only checks the top-level error and breaks when errors are wrapped.'
    },
    {
      q: 'What verb in fmt.Errorf wraps an error so it can be unwrapped later?',
      options: ['%w', '%v', '%s', '%e'],
      answer: 0,
      explanation: '%w is the error-wrapping verb introduced in Go 1.13. It stores the original error in the new error value. %v and %s format the error as a string but lose the original error value.'
    },
    {
      q: 'When should you use panic instead of returning an error?',
      options: [
        'For unrecoverable programmer errors or invalid internal state',
        'For any error condition to simplify code',
        'When an operation might fail for expected reasons',
        'In library code to signal failures to callers',
      ],
      answer: 0,
      explanation: 'panic is for unrecoverable situations: nil pointer dereference, invariant violations, out-of-bounds index that should never happen. Expected failures (network error, user not found) should return errors so callers can handle them.'
    },
    {
      q: 'What does errors.As(err, &target) do?',
      options: [
        'Traverses the error chain and assigns the first error of target\'s type',
        'Checks if err equals target',
        'Converts err to the target type using a type assertion',
        'Creates a new error wrapping both err and target',
      ],
      answer: 0,
      explanation: 'errors.As traverses the error chain and assigns to target the first error value that is assignable to target\'s type. It returns true if found. This is used to extract custom error types (e.g., *ValidationError) from a wrapped chain.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why does Go use explicit error returns instead of exceptions?',
      a: 'Go\'s designers wanted error handling to be visible at every call site. Exceptions can propagate silently through many stack frames without intermediate code being aware. Go\'s approach forces the caller to decide what to do with each failure — handle it, wrap it with context, or return it up the stack. The cost is more verbose code; the benefit is that errors never accidentally escape unhandled.'
    },
    {
      q: 'What is the difference between errors.Is and errors.As?',
      a: '`errors.Is(err, target)` checks whether err or any error in its chain equals the target value — used for sentinel errors. `errors.As(err, &ptr)` checks whether err or any error in its chain can be assigned to the type pointed to by ptr — used for custom error types. Both traverse wrapped chains created with `%w`. Use Is for "did this specific error happen?", As for "is there a structured error I can extract data from?"'
    },
    {
      q: 'How do I add context to an error without losing the original?',
      a: 'Use `fmt.Errorf("operation context: %w", err)`. The `%w` verb wraps the original error. The resulting error string includes the context message and the original, and `errors.Is`/`errors.As` can still find the original in the chain. Convention: use the format `"package.Function(params): %w"` to create a readable breadcrumb trail through the call stack.'
    },
    {
      q: 'What happens to deferred functions when a panic occurs?',
      a: 'When a goroutine panics, Go stops executing the current function and begins unwinding the stack, running all deferred functions in LIFO order along the way. If none of those deferred functions call `recover()`, the goroutine crashes. If a deferred function calls `recover()`, it catches the panic value and the goroutine continues normally from that deferred function\'s return.'
    },
    {
      q: 'What is a sentinel error and when should I use one?',
      a: 'A sentinel error is a package-level variable: `var ErrNotFound = errors.New("not found")`. Use them for expected, named failure conditions that callers might specifically handle (like SQL\'s `sql.ErrNoRows`). Callers use `errors.Is(err, ErrNotFound)` to check. Avoid sentinels for implementation details — only export sentinels that represent meaningful conditions for callers.'
    },
    {
      q: 'Should I always handle every error immediately?',
      a: 'Yes, with rare exceptions. Handle errors at the point where you have enough context to do something useful — log with context, wrap with the current operation, or translate to a domain error. Passing errors up with wrapping is "handling" them. The exception: in test code, `t.Fatal(err)` is fine. In scripts, `log.Fatal` in main is acceptable. What you should never do is silently discard an error with `_` unless you are truly certain it cannot fail.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Errors are values in Go — return them explicitly, wrap them with context, and use errors.Is/As to inspect the chain.',
    mustKnow: [
      'The `error` interface: `Error() string`. Any type implementing it is an error.',
      'Return errors as the last value: `func f() (Result, error)`. Check `if err != nil` immediately.',
      'Wrap with context: `fmt.Errorf("op: %w", err)`. The `%w` verb preserves the chain.',
      '`errors.Is` checks the chain for a sentinel; `errors.As` extracts a typed error from the chain.',
      'Sentinel errors: `var ErrXxx = errors.New(...)`. Custom types: implement `Error() string`.',
      'panic for unrecoverable programmer errors only. Libraries must never let panics escape.',
      'Never use `log.Fatal` inside library code — return errors so callers decide what to do.',
    ],
    interviewFocus: [
      'Why does Go use explicit error returns instead of exceptions?',
      'Explain the difference between errors.Is and errors.As.',
      'How do you wrap an error with context and why?',
      'When is panic appropriate? When is it not?',
      'What is the nil interface pitfall when returning error types?',
    ],
  };
}
