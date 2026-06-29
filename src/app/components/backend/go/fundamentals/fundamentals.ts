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
  selector: 'app-go-fundamentals',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fundamentals.html',
  styleUrl: './fundamentals.scss'
})
export class GoFundamentals {
  readingTime = 21;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  since = 'Go 1.21+';
  route = 'go-fundamentals';
  nextRoute = '/go/structs-interfaces';
  nextLabel = 'Structs & Interfaces';

  quickRef: QuickRefItem[] = [
    { name: 'var x int = 5', type: 'syntax', desc: 'Explicit variable declaration with type' },
    { name: 'x := 5', type: 'syntax', desc: 'Short variable declaration — infers type, only inside functions' },
    { name: 'const Pi = 3.14', type: 'keyword', desc: 'Untyped constant — adapts to context' },
    { name: 'iota', type: 'keyword', desc: 'Auto-incrementing counter inside const blocks' },
    { name: 'for i := 0; i < n; i++', type: 'syntax', desc: 'Go\'s only loop keyword — also works as while' },
    { name: 'defer f()', type: 'keyword', desc: 'Schedules f() to run when enclosing function returns' },
    { name: 'func f() (int, error)', type: 'syntax', desc: 'Multiple return values — idiomatic Go pattern' },
    { name: '*T / &x', type: 'operator', desc: 'Pointer type / address-of operator' },
    { name: 'fmt.Println / fmt.Sprintf', type: 'function', desc: 'Print to stdout / format string without printing' },
    { name: 'package main + func main()', type: 'syntax', desc: 'Entry point — every executable must have both' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Package system & imports',
      points: [
        'Every Go file starts with `package <name>`. The `main` package is special — it compiles to an executable binary.',
        'Exported identifiers begin with an uppercase letter; lowercase = package-private.',
        'Imports use full module paths: `"fmt"`, `"net/http"`, `"github.com/gin-gonic/gin"`.',
        'Unused imports are a compile error — Go enforces clean dependencies.',
        'Group imports: stdlib first, then third-party (goimports does this automatically).',
      ]
    },
    {
      heading: 'Variables, zero values & short declaration',
      points: [
        'Every variable has a zero value before assignment: `0` for numbers, `""` for strings, `false` for booleans, `nil` for pointers/slices/maps.',
        '`var x int = 5` — explicit declaration (required at package scope).',
        '`x := 5` — short declaration, infers type, only valid inside functions.',
        'Multiple assignment: `a, b := 10, 20` — swap without temp: `a, b = b, a`.',
        '`const Pi = 3.14` — compile-time constant. `iota` auto-increments inside a `const` block (useful for enums and bit flags).',
      ]
    },
    {
      heading: 'Control flow — if, for, switch',
      points: [
        'Go has only three control-flow keywords: `if`, `for`, and `switch`. There is no `while` keyword.',
        '`for condition { }` is a while loop. `for { }` is an infinite loop. `for i, v := range slice { }` iterates collections.',
        '`if` supports an init statement: `if err := f(); err != nil { }` — scopes `err` to the if block.',
        '`switch` does not fall through by default. List multiple cases: `case "a", "b":`. Use `fallthrough` to opt in.',
        '`break` and `continue` accept labels to target outer loops: `break outer`.',
      ]
    },
    {
      heading: 'Functions & multiple return values',
      points: [
        'Functions are first-class values — store them in variables, pass them as arguments, return them.',
        'Multiple return values are idiomatic: `func f() (int, error)`. The caller checks the error immediately.',
        'Named return values document intent and allow bare `return` — use sparingly to avoid confusion.',
        'Variadic functions: `func sum(nums ...int) int` — caller passes any number of args. Spread a slice: `sum(nums...)`.',
        'Closures capture variables by reference — shadow loop variables with `v := v` to avoid sharing.',
      ]
    },
    {
      heading: 'Pointers & defer',
      points: [
        '`*T` is a pointer type. `&x` gets the address of `x`. `*p` dereferences. No pointer arithmetic in Go.',
        'Use pointers when a function must mutate the caller\'s value, or when copying a large struct is wasteful.',
        'New allocates on the heap and returns a pointer: `p := new(int)` — same as `var x int; p = &x`.',
        '`defer fn()` schedules `fn` to run when the enclosing function returns, in LIFO order.',
        'defer arguments are evaluated immediately — only the call is deferred. Great for `defer f.Close()` and `defer mu.Unlock()`.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Variables & Types',
      language: 'typescript',
      code: `package main

import "fmt"

func main() {
    // Numeric types
    var i int = 100        // platform-sized (32 or 64 bit)
    var f float64 = 3.14
    var b byte = 'A'       // byte = uint8
    var r rune = '🐹'      // rune = int32 (Unicode code point)

    // String is immutable UTF-8 bytes
    s := "Hello, Go!"
    fmt.Println(len(s))    // byte length, not character count

    // Type conversions are explicit
    var x int32 = 100
    var y int64 = int64(x) // must cast explicitly

    fmt.Println(i, f, b, r, y)

    // Zero values
    var (
        zInt    int     // 0
        zFloat  float64 // 0.0
        zStr    string  // ""
        zBool   bool    // false
    )
    fmt.Println(zInt, zFloat, zStr, zBool)
}`
    },
    {
      label: 'Control Flow',
      language: 'typescript',
      code: `package main

import "fmt"

func classify(n int) string {
    switch {
    case n < 0:
        return "negative"
    case n == 0:
        return "zero"
    case n < 10:
        return "small"
    default:
        return "large"
    }
}

func fibonacci(n int) []int {
    fibs := make([]int, n)
    for i := range fibs {
        if i < 2 {
            fibs[i] = i
        } else {
            fibs[i] = fibs[i-1] + fibs[i-2]
        }
    }
    return fibs
}

func main() {
    fmt.Println(classify(-5))  // negative
    fmt.Println(classify(7))   // small
    fmt.Println(fibonacci(8))  // [0 1 1 2 3 5 8 13]

    // Labeled break
outer:
    for i := 0; i < 3; i++ {
        for j := 0; j < 3; j++ {
            if i == 1 && j == 1 {
                break outer
            }
            fmt.Printf("(%d,%d) ", i, j)
        }
    }
}`
    },
    {
      label: 'Functions',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "strings"
)

// Function as value / closure
func makeCounter(start int) func() int {
    count := start
    return func() int {
        count++
        return count
    }
}

// First-class functions
func apply(nums []int, fn func(int) int) []int {
    result := make([]int, len(nums))
    for i, n := range nums {
        result[i] = fn(n)
    }
    return result
}

func main() {
    counter := makeCounter(0)
    fmt.Println(counter(), counter(), counter()) // 1 2 3

    doubled := apply([]int{1, 2, 3, 4}, func(n int) int {
        return n * 2
    })
    fmt.Println(doubled) // [2 4 6 8]

    // Immediately invoked function
    result := func(a, b int) int { return a + b }(3, 4)
    fmt.Println(result) // 7

    // String builder pattern
    words := []string{"Go", "is", "fast"}
    sentence := strings.Join(words, " ")
    fmt.Println(sentence) // Go is fast
}`
    },
    {
      label: 'Defer & Panic/Recover',
      language: 'typescript',
      code: `package main

import "fmt"

// defer runs cleanup even on early return
func safeDiv(a, b int) (result int, err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("recovered: %v", r)
        }
    }()

    if b == 0 {
        panic("cannot divide by zero")
    }
    return a / b, nil
}

func deferOrder() {
    fmt.Println("start")
    for i := 0; i < 3; i++ {
        i := i // capture loop var
        defer fmt.Println("defer:", i)
    }
    fmt.Println("end")
    // Prints: start, end, defer:2, defer:1, defer:0
}

func main() {
    if v, err := safeDiv(10, 2); err == nil {
        fmt.Println("10/2 =", v)
    }
    if _, err := safeDiv(10, 0); err != nil {
        fmt.Println("error:", err)
    }
    deferOrder()
}`
    },
    {
      label: 'Pointers',
      language: 'typescript',
      code: `package main

import "fmt"

type Config struct {
    Host string
    Port int
}

// Pointer receiver — modifies original
func (c *Config) SetPort(port int) {
    c.Port = port
}

// Value receiver — works on copy
func (c Config) Address() string {
    return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

func swap(a, b *int) {
    *a, *b = *b, *a
}

func newConfig(host string) *Config {
    return &Config{Host: host, Port: 8080} // returns pointer to heap value
}

func main() {
    cfg := newConfig("localhost")
    cfg.SetPort(9090)
    fmt.Println(cfg.Address()) // localhost:9090

    x, y := 1, 2
    swap(&x, &y)
    fmt.Println(x, y) // 2 1

    // nil pointer guard
    var p *int
    if p == nil {
        fmt.Println("p is nil")
    }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using := at package scope',
      wrong: `package main

x := 42  // compile error: := not allowed at package scope`,
      right: `package main

var x = 42  // use var at package scope`,
      explanation: ':= is only valid inside function bodies. Package-level variables must use var.'
    },
    {
      title: 'Ignoring the error return value',
      wrong: `f, _ := os.Open("file.txt")
data, _ := io.ReadAll(f)`,
      right: `f, err := os.Open("file.txt")
if err != nil {
    return fmt.Errorf("open: %w", err)
}
defer f.Close()
data, err := io.ReadAll(f)
if err != nil {
    return fmt.Errorf("read: %w", err)
}`,
      explanation: 'Blanking errors with _ hides failures silently. Always handle errors — even if just logging and returning them.'
    },
    {
      title: 'Capturing loop variable in goroutine/defer',
      wrong: `for _, v := range items {
    go func() {
        fmt.Println(v) // all goroutines print the last v
    }()
}`,
      right: `for _, v := range items {
    v := v // shadow with a new variable per iteration
    go func() {
        fmt.Println(v)
    }()
}`,
      explanation: 'Closures capture variables by reference. In Go 1.21 and earlier, all iterations share the same loop variable. Shadow it with v := v to get a per-iteration copy. (Go 1.22+ fixes this for range loops.)'
    },
    {
      title: 'Unused imports or variables',
      wrong: `import (
    "fmt"
    "os"   // unused — compile error
)

func main() {
    x := 5  // declared but not used — compile error
    fmt.Println("hello")
}`,
      right: `import "fmt"

func main() {
    fmt.Println("hello")
}`,
      explanation: 'Go enforces that every imported package and declared local variable is used. This is a compile error, not a warning. Remove unused items or use _ as a blank identifier.'
    },
    {
      title: 'Comparing structs with == when they contain slices',
      wrong: `type Item struct { Tags []string }
a := Item{Tags: []string{"x"}}
b := Item{Tags: []string{"x"}}
fmt.Println(a == b) // compile error: slice is not comparable`,
      right: `import "reflect"
fmt.Println(reflect.DeepEqual(a, b)) // true

// or use slices.Equal from "slices" package (Go 1.21+)`,
      explanation: 'Structs are comparable with == only when all fields are comparable. Slices, maps, and functions are not. Use reflect.DeepEqual or write a custom Equal method.'
    },
    {
      title: 'Shadowing err in nested if blocks',
      wrong: `result, err := fetchData()
if err == nil {
    extra, err := processResult(result) // shadows outer err
    _ = extra
}
// outer err is still nil here even if processResult failed`,
      right: `result, err := fetchData()
if err != nil {
    return err
}
extra, err := processResult(result) // reuses outer err
_ = extra
if err != nil {
    return err
}`,
      explanation: ':= creates a new variable if any left-hand name is new. When err is already declared in the outer scope and you re-declare it inside an if block, the inner err is a different variable.'
    },
  ];

  challenge: Challenge = {
    title: 'Word Frequency Counter',
    language: 'typescript',
    description: `Write a Go function \`wordFrequency(text string) map[string]int\` that counts how many times each word appears in the input string.

Requirements:
- Split on whitespace
- Normalize to lowercase
- Strip punctuation (commas, periods, exclamation marks, question marks)
- Return a map of word → count

Example:
\`\`\`
wordFrequency("Go is great! Go is fast.")
// map[go:2 is:2 great:1 fast:1]
\`\`\`

Bonus: write a second function \`topN(freq map[string]int, n int) []string\` that returns the top N words sorted by frequency descending.`,
    hints: [
      'Use strings.Fields() to split on any whitespace',
      'strings.ToLower() and strings.Trim() are your friends',
      'Build the map with make(map[string]int) and increment with freq[word]++',
      'For topN, collect map keys into a slice and sort with sort.Slice()',
    ],
    starterCode: `package main

import (
    "fmt"
    "sort"
    "strings"
)

func wordFrequency(text string) map[string]int {
    freq := make(map[string]int)
    // TODO: implement
    return freq
}

func topN(freq map[string]int, n int) []string {
    // TODO: implement
    return nil
}

func main() {
    text := "Go is great! Go is fast. Go is simple."
    freq := wordFrequency(text)
    fmt.Println(freq)
    fmt.Println(topN(freq, 3))
}`,
    solution: `package main

import (
    "fmt"
    "sort"
    "strings"
)

func wordFrequency(text string) map[string]int {
    freq := make(map[string]int)
    words := strings.Fields(text)
    for _, w := range words {
        w = strings.ToLower(w)
        w = strings.Trim(w, ".,!?;:\"'")
        if w != "" {
            freq[w]++
        }
    }
    return freq
}

func topN(freq map[string]int, n int) []string {
    type kv struct{ word string; count int }
    var pairs []kv
    for k, v := range freq {
        pairs = append(pairs, kv{k, v})
    }
    sort.Slice(pairs, func(i, j int) bool {
        if pairs[i].count != pairs[j].count {
            return pairs[i].count > pairs[j].count
        }
        return pairs[i].word < pairs[j].word // stable alpha order
    })
    result := make([]string, 0, n)
    for i := 0; i < n && i < len(pairs); i++ {
        result = append(result, pairs[i].word)
    }
    return result
}

func main() {
    text := "Go is great! Go is fast. Go is simple."
    freq := wordFrequency(text)
    fmt.Println(freq)
    fmt.Println(topN(freq, 3)) // [go is fast] or [go is great] or [go is simple]
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which of the following is a valid variable declaration inside a function?',
      options: ['x := 42', 'x = 42', 'int x = 42', 'let x = 42'],
      answer: 0,
      explanation: ':= is the short variable declaration operator. It declares and initialises in one step, inferring the type. x = 42 requires x to already be declared. The C and JS syntaxes are not valid Go.'
    },
    {
      q: 'What is the zero value of a string in Go?',
      options: ['""', 'nil', '"null"', '0'],
      answer: 0,
      explanation: 'Every type has a zero value in Go — the value it holds before assignment. For string it is the empty string "". Numeric types are 0, booleans are false, pointers/slices/maps/interfaces are nil.'
    },
    {
      q: 'In what order do deferred calls execute?',
      options: ['LIFO — last deferred runs first', 'FIFO — first deferred runs first', 'Concurrently in any order', 'Same order they were called'],
      answer: 0,
      explanation: 'Deferred calls are pushed onto a stack and execute in last-in-first-out (LIFO) order when the surrounding function returns. This mirrors the "undo" pattern — the last resource acquired is the first released.'
    },
    {
      q: 'Which keyword does Go use for while-style loops?',
      options: ['for', 'while', 'loop', 'repeat'],
      answer: 0,
      explanation: 'Go has only the for keyword. `for condition { }` behaves like a while loop. `for { }` is an infinite loop. `for range` iterates over collections. There is no while, do-while, or repeat.'
    },
    {
      q: 'What happens if you import a package in Go but never use it?',
      options: ['Compile error', 'Runtime warning', 'It is silently ignored', 'Lint warning only'],
      answer: 0,
      explanation: 'Unused imports are a compile error in Go, not a warning. This enforces clean dependencies and faster compile times. Use the blank identifier _ as the alias if you need a side-effect import: import _ "pkg".'
    },
    {
      q: 'What is the difference between := and = in Go?',
      options: ['They are identical', ':= declares and assigns a new variable; = assigns to an existing one. := requires at least one new variable on the left side', '= is for constants only', ':= only works in function bodies'],
      answer: 1,
      explanation: 'x := 42 is a short variable declaration — it infers the type and creates the variable. x = 42 assigns to an already-declared x. := in a block with multiple variables requires at least one new variable on the left: x, err := f() is valid even if x exists, as long as err is new. Using := to shadow outer variables (same name in inner scope) is a common source of bugs.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between := and = in Go?',
      a: ':= is the short variable declaration operator — it declares a new variable AND assigns it a value, inferring the type. It can only be used inside function bodies. = is the assignment operator — it assigns to an already-declared variable. At least one name on the left of := must be new; others can already exist (in which case they are just reassigned).'
    },
    {
      q: 'Why does Go have multiple return values instead of exceptions?',
      a: 'Go uses multiple return values (typically result, error) as an explicit error-handling mechanism. This makes error paths visible in the call site and forces the caller to deal with failures. Exceptions can silently propagate up call stacks without the intermediate code being aware. The Go philosophy is that explicit is better than implicit — errors are just values.'
    },
    {
      q: 'What is iota and when would you use it?',
      a: 'iota is a predeclared identifier representing the index (0, 1, 2 …) of the current constant in a const block. It resets to 0 at each new const keyword. It is used to create enumeration-like constants, bit flags (1 << iota), or any sequence of related constants without repeating magic numbers. Example: const (Sun = iota; Mon; Tue) gives Sun=0, Mon=1, Tue=2.'
    },
    {
      q: 'When should I use a pointer vs a value in Go?',
      a: 'Use a pointer (*T) when: (1) the function needs to modify the caller\'s value, (2) the struct is large and copying is expensive, (3) you need to represent "optional" with nil. Use a value (T) when: (1) the type is small (int, struct with 1-2 fields), (2) you want immutable semantics, (3) the type is a primitive or immutable type like time.Time. Consistency within a type matters — all methods of a type should either use pointer receivers or value receivers, not mix them.'
    },
    {
      q: 'What does defer actually do, and when does it run?',
      a: 'defer schedules a function call to execute when the surrounding function returns — either normally or via panic. Arguments to the deferred call are evaluated immediately at the defer statement, but the call itself is delayed. Multiple defers run in LIFO order. Common uses: closing files/connections, unlocking mutexes, recovering from panics. Note: deferred functions can read and modify named return values.'
    },
    {
      q: 'How does Go handle nil vs zero value?',
      a: 'Zero value is the default value for any type when declared without initialisation (0 for numbers, "" for strings, false for booleans). nil is the zero value for pointer, slice, map, channel, function, and interface types. A nil slice is valid and has length 0 — you can range over it. A nil map panics on write but returns zero values on read. Always check for nil before dereferencing pointers.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Go is a statically-typed, compiled language built on simplicity: one loop keyword, explicit errors as values, and zero values everywhere.',
    mustKnow: [
      ':= declares + assigns inside functions; var is used at package scope',
      'Zero values: 0, false, "", nil — Go always initialises variables',
      'for is the only loop keyword — covers C-style, while, and infinite loops',
      'Multiple return values (result, error) replace exceptions as the error idiom',
      'defer pushes calls onto a LIFO stack, running when the function returns',
      'Pointers (*T, &x) allow mutation; Go has no pointer arithmetic',
      'Unused imports and unused local variables are compile errors',
    ],
    interviewFocus: [
      'Explain the difference between := and var — when to use each',
      'How does Go\'s error handling differ from exception-based languages?',
      'What is defer and what problem does it solve? Give a real use case.',
      'When would you use a pointer receiver vs a value receiver on a method?',
      'What is iota and how would you use it for bitmask flags?',
    ],
  };
}
