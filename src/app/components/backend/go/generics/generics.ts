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
  selector: 'app-go-generics',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './generics.html',
  styleUrl: './generics.scss'
})
export class GoGenerics {
  readingTime = 24;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Go 1.18+';
  route = 'go-generics';
  nextRoute = '/go/patterns';
  nextLabel = 'Design Patterns';

  quickRef: QuickRefItem[] = [
    { name: 'func F[T any](v T) T', type: 'syntax', desc: 'Generic function with type parameter T constrained to any' },
    { name: '[T comparable]', type: 'constraint', desc: 'T supports == and != — required for map keys' },
    { name: '[T int | float64]', type: 'constraint', desc: 'Union constraint: T must be int or float64' },
    { name: 'type Number interface { ~int | ~float64 }', type: 'syntax', desc: '~ means "underlying type is" — includes named types like type MyInt int' },
    { name: 'type Stack[T any] struct', type: 'syntax', desc: 'Generic struct with type parameter' },
    { name: 'constraints.Ordered', type: 'constraint', desc: 'Types that support < > <= >= (golang.org/x/exp/constraints)' },
    { name: 'slices.SortFunc(s, cmp)', type: 'function', desc: 'Go 1.21 generic sort in stdlib (replaces sort.Slice)' },
    { name: 'maps.Keys(m)', type: 'function', desc: 'Go 1.21 generic maps helper — returns []K' },
    { name: 'F[int](v)', type: 'syntax', desc: 'Explicit type argument — usually inferred, rarely needed' },
    { name: 'func (s *Stack[T]) Push(v T)', type: 'syntax', desc: 'Method on a generic type — T already bound from the struct' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why generics?',
      points: [
        'Before Go 1.18, reusable data structures (stacks, queues, sets) required either code duplication per type or interface{} with unsafe type assertions.',
        'Generics let you write a single function or type parameterised over a type T, with compile-time type safety and no runtime overhead from boxing.',
        'Go generics use type parameters in square brackets: func Map[T, U any](s []T, f func(T) U) []U. The compiler generates specialised code for each concrete type used.',
        'Generics are NOT a replacement for interfaces — use interfaces when runtime polymorphism matters, generics when the type is fixed at the call site.',
        'The stdlib (Go 1.21+) ships slices, maps, and cmp packages built on generics — use them before writing your own.',
      ]
    },
    {
      heading: 'Type parameters and constraints',
      points: [
        'A type parameter is declared in [brackets]: func F[T any](v T) T. The constraint (any, comparable, etc.) limits what operations are valid on T.',
        'any (alias for interface{}) allows any type but permits no operations — you can only assign and pass the value.',
        'comparable allows == and != — needed for map keys and sets.',
        'Union constraints: interface{ int | float64 } means T must be exactly int or float64.',
        'Tilde prefix (~): interface{ ~int } means T\'s underlying type is int — includes type MyInt int. Always use ~ in constraints for named types.',
      ]
    },
    {
      heading: 'Generic types (structs)',
      points: [
        'Declare type parameters after the type name: type Stack[T any] struct { items []T }.',
        'Methods on a generic type receive the type parameter from the struct — no new parameters on the method: func (s *Stack[T]) Push(v T).',
        'Instantiate: var s Stack[int]; s.Push(42). The compiler checks that all operations are valid for int.',
        'You cannot add type parameters to existing methods (on non-generic types) — only on standalone functions or new generic types.',
        'Type inference: the compiler infers type arguments from function arguments. Explicit type arguments F[int](v) are rarely needed.',
      ]
    },
    {
      heading: 'Practical patterns',
      points: [
        'Map/Filter/Reduce: generic higher-order functions over slices, replacing repeated for-range patterns.',
        'Generic result type: type Result[T any] struct { Value T; Err error } — typed error-or-value wrapper.',
        'Generic Set: type Set[T comparable] map[T]struct{} — uses comparable constraint for map key.',
        'Generic Option/Maybe: type Option[T any] struct { value T; ok bool } — replaces *T with clearer semantics.',
        'Use the slices package (Go 1.21) for Contains, Index, Sort, Reverse — no need to write these yourself.',
      ]
    },
    {
      heading: 'When NOT to use generics',
      points: [
        'If the function body only uses interface methods: use an interface parameter instead of a type parameter.',
        'Do not add generics to a function just because the types differ — if the logic differs per type, generics do not help.',
        'Avoid generic methods on non-generic types — Go does not support them; restructure as a top-level generic function instead.',
        'Do not over-constrain: start with any and add constraints only when you need a specific operation (== for comparable, < for Ordered).',
        'If callers always pass the same type, a generic adds complexity with no benefit — profile before optimising with generics.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Generics',
      language: 'typescript',
      code: `package main

import "fmt"

// Generic function: T can be any ordered type (supports <)
type Ordered interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64 |
        ~float32 | ~float64 | ~string
}

func Min[T Ordered](a, b T) T {
    if a < b { return a }
    return b
}

func Max[T Ordered](a, b T) T {
    if a > b { return a }
    return b
}

// Generic Map: transform a slice of T into a slice of U
func Map[T, U any](s []T, f func(T) U) []U {
    result := make([]U, len(s))
    for i, v := range s {
        result[i] = f(v)
    }
    return result
}

// Generic Filter
func Filter[T any](s []T, keep func(T) bool) []T {
    var result []T
    for _, v := range s {
        if keep(v) {
            result = append(result, v)
        }
    }
    return result
}

func main() {
    fmt.Println(Min(3, 7))          // 3
    fmt.Println(Min("apple", "banana")) // apple — works with strings too

    nums := []int{1, 2, 3, 4, 5}
    doubled := Map(nums, func(n int) int { return n * 2 })
    fmt.Println(doubled) // [2 4 6 8 10]

    evens := Filter(nums, func(n int) bool { return n%2 == 0 })
    fmt.Println(evens) // [2 4]
}`
    },
    {
      label: 'Generic Stack',
      language: 'typescript',
      code: `package main

import (
    "errors"
    "fmt"
)

// Generic Stack — type-safe, no interface{} needed
type Stack[T any] struct {
    items []T
}

func (s *Stack[T]) Push(v T) {
    s.items = append(s.items, v)
}

func (s *Stack[T]) Pop() (T, error) {
    var zero T
    if len(s.items) == 0 {
        return zero, errors.New("stack is empty")
    }
    top := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return top, nil
}

func (s *Stack[T]) Peek() (T, bool) {
    if len(s.items) == 0 {
        var zero T
        return zero, false
    }
    return s.items[len(s.items)-1], true
}

func (s *Stack[T]) Len() int { return len(s.items) }

func main() {
    var intStack Stack[int]
    intStack.Push(1)
    intStack.Push(2)
    intStack.Push(3)

    v, _ := intStack.Pop()
    fmt.Println(v)          // 3
    fmt.Println(intStack.Len()) // 2

    var strStack Stack[string]
    strStack.Push("hello")
    strStack.Push("world")
    top, _ := strStack.Peek()
    fmt.Println(top) // world
}`
    },
    {
      label: 'Constraints & Union',
      language: 'typescript',
      code: `package main

import "fmt"

// Constraint: only numeric types
type Number interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64 |
        ~float32 | ~float64
}

func Sum[T Number](s []T) T {
    var total T
    for _, v := range s {
        total += v
    }
    return total
}

// The ~ matters: this works with named types
type Celsius float64
type Fahrenheit float64

func ToFahrenheit[T interface{ ~float64 }](c T) Fahrenheit {
    return Fahrenheit(c*9/5 + 32)
}

// comparable constraint: needed for maps and sets
type Set[T comparable] map[T]struct{}

func NewSet[T comparable](items ...T) Set[T] {
    s := make(Set[T], len(items))
    for _, v := range items {
        s[v] = struct{}{}
    }
    return s
}

func (s Set[T]) Contains(v T) bool {
    _, ok := s[v]
    return ok
}

func main() {
    ints := []int{1, 2, 3, 4, 5}
    fmt.Println(Sum(ints)) // 15

    floats := []float64{1.1, 2.2, 3.3}
    fmt.Println(Sum(floats)) // 6.6

    var temp Celsius = 100
    fmt.Println(ToFahrenheit(temp)) // 212

    tags := NewSet("go", "generics", "types")
    fmt.Println(tags.Contains("go"))     // true
    fmt.Println(tags.Contains("python")) // false
}`
    },
    {
      label: 'stdlib slices & maps',
      language: 'typescript',
      code: `package main

import (
    "cmp"
    "fmt"
    "slices"
    "maps"
)

type Person struct {
    Name string
    Age  int
}

func main() {
    // slices package (Go 1.21) — generic functions for slices
    nums := []int{3, 1, 4, 1, 5, 9, 2, 6}

    slices.Sort(nums) // in-place sort
    fmt.Println(nums) // [1 1 2 3 4 5 6 9]

    fmt.Println(slices.Contains(nums, 5)) // true
    fmt.Println(slices.Index(nums, 4))    // 4

    reversed := slices.Clone(nums)
    slices.Reverse(reversed)
    fmt.Println(reversed) // [9 6 5 4 3 2 1 1]

    // Custom sort with SortFunc and cmp.Compare
    people := []Person{{"Alice", 30}, {"Bob", 25}, {"Carol", 35}}
    slices.SortFunc(people, func(a, b Person) int {
        return cmp.Compare(a.Age, b.Age) // sort by age ascending
    })
    fmt.Println(people[0].Name) // Bob

    // maps package — generic map utilities
    m := map[string]int{"a": 1, "b": 2, "c": 3}
    keys := slices.Collect(maps.Keys(m))
    slices.Sort(keys)
    fmt.Println(keys) // [a b c]

    vals := slices.Collect(maps.Values(m))
    slices.Sort(vals)
    fmt.Println(vals) // [1 2 3]
}`
    },
    {
      label: 'Result & Option types',
      language: 'typescript',
      code: `package main

import (
    "errors"
    "fmt"
    "strconv"
)

// Generic Result type — typed error-or-value
type Result[T any] struct {
    value T
    err   error
}

func OK[T any](v T) Result[T]          { return Result[T]{value: v} }
func Err[T any](err error) Result[T]   { return Result[T]{err: err} }

func (r Result[T]) Unwrap() (T, error) { return r.value, r.err }
func (r Result[T]) IsOk() bool         { return r.err == nil }

func parseNumber(s string) Result[int] {
    n, err := strconv.Atoi(s)
    if err != nil {
        return Err[int](fmt.Errorf("not a number: %q", s))
    }
    return OK(n)
}

// Generic Option — explicit "has value" vs zero-value ambiguity
type Option[T any] struct {
    value T
    ok    bool
}

func Some[T any](v T) Option[T]  { return Option[T]{value: v, ok: true} }
func None[T any]() Option[T]     { return Option[T]{} }
func (o Option[T]) Get() (T, bool) { return o.value, o.ok }

func findFirst[T any](s []T, pred func(T) bool) Option[T] {
    for _, v := range s {
        if pred(v) { return Some(v) }
    }
    return None[T]()
}

func main() {
    r := parseNumber("42")
    if n, err := r.Unwrap(); err == nil {
        fmt.Println("parsed:", n) // 42
    }

    r2 := parseNumber("abc")
    fmt.Println(r2.IsOk()) // false

    nums := []int{1, 3, 5, 8, 9}
    first := findFirst(nums, func(n int) bool { return n%2 == 0 })
    if v, ok := first.Get(); ok {
        fmt.Println("first even:", v) // 8
    }

    _ = errors.New // suppress import
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using any constraint when a specific operation is needed',
      wrong: `func Contains[T any](s []T, v T) bool {
    for _, item := range s {
        if item == v { // compile error: == not defined for T with any
            return true
        }
    }
    return false
}`,
      right: `func Contains[T comparable](s []T, v T) bool {
    for _, item := range s {
        if item == v { return true }
    }
    return false
}`,
      explanation: 'any (alias for interface{}) permits no operations on T beyond assignment. To use ==, the constraint must be comparable. Start with any and add the minimal constraint the function body actually requires. Use comparable for equality, Ordered for </>.'
    },
    {
      title: 'Missing ~ in type constraints (excluding named types)',
      wrong: `type Number interface { int | float64 }
// This excludes: type Celsius float64 — underlying type is float64 but NOT float64 itself`,
      right: `type Number interface { ~int | ~float64 }
// Now: type Celsius float64 satisfies Number (underlying type is float64)`,
      explanation: 'Without ~, the constraint requires the type to be exactly int or float64. With ~, it requires the underlying type to be int or float64, which includes named types like type Celsius float64. Almost always use ~ in constraints — bare type unions are rarely what you want.'
    },
    {
      title: 'Trying to add a type parameter to a method on a non-generic type',
      wrong: `type MyList struct { items []any }

func (l *MyList) Map[U any](f func(any) U) []U { // compile error: not allowed
    ...
}`,
      right: `// Option 1: make the whole type generic
type MyList[T any] struct { items []T }
func (l *MyList[T]) Items() []T { return l.items }

// Option 2: top-level generic function
func MapList[T, U any](l *MyList, f func(any) U) []U { ... }`,
      explanation: 'Go does not allow adding type parameters to individual methods — only to standalone functions or to all methods by making the receiver type generic. If you need a generic operation on a non-generic type, convert it to a top-level generic function instead of a method.'
    },
    {
      title: 'Using a generic function when an interface is clearer',
      wrong: `// Generic overkill — the body only uses the Write method
func WriteAll[T io.Writer](w T, data []byte) error {
    _, err := w.Write(data)
    return err
}`,
      right: `// Interface is simpler — same semantics, no type parameter needed
func WriteAll(w io.Writer, data []byte) error {
    _, err := w.Write(data)
    return err
}`,
      explanation: 'If the function body only calls methods defined on an interface, use the interface directly. Generics are needed when: (1) you return T (not a common interface), (2) you need comparable or Ordered operations, or (3) you are building a data structure that stores T. Runtime polymorphism via interface is Go\'s primary mechanism.'
    },
    {
      title: 'Forgetting that type inference only works for function arguments',
      wrong: `result := Map[string](nums, strconv.Itoa) // explicit type arg often unnecessary
// or worse:
var s Stack[int]()     // compile error — not valid syntax`,
      right: `result := Map(nums, strconv.Itoa) // compiler infers T=int, U=string from args
var s Stack[int]       // generic type instantiation — type arg always required here`,
      explanation: 'Type inference works for generic functions — the compiler infers T from the argument types. For generic types (structs), you must always provide type arguments explicitly: Stack[int], not Stack. Explicit function type arguments (F[int](v)) are only needed when inference fails or for clarity.'
    },
    {
      title: 'Implementing generic utilities that already exist in slices/maps',
      wrong: `// Go 1.21+ already provides these in the stdlib
func Contains[T comparable](s []T, v T) bool { ... }
func Map[T, U any](s []T, f func(T) U) []U   { ... }
func Keys[K comparable, V any](m map[K]V) []K { ... }`,
      right: `import (
    "maps"
    "slices"
)
slices.Contains(s, v)          // built-in since Go 1.21
slices.Collect(maps.Keys(m))   // built-in since Go 1.23`,
      explanation: 'Go 1.21 shipped the slices and maps packages with generic implementations of the most common slice/map utilities: Contains, Index, Sort, SortFunc, Reverse, Clone, Compact, Max, Min (slices) and Keys, Values, Clone (maps). Always check the stdlib before implementing generic helpers.'
    },
  ];

  challenge: Challenge = {
    title: 'Generic Cache with TTL',
    language: 'typescript',
    description: `Implement a generic in-memory cache with time-to-live (TTL) support.

\`\`\`go
type Cache[K comparable, V any] struct { ... }

func NewCache[K comparable, V any](ttl time.Duration) *Cache[K, V]
func (c *Cache[K, V]) Set(key K, value V)
func (c *Cache[K, V]) Get(key K) (V, bool)   // (zero, false) if missing or expired
func (c *Cache[K, V]) Delete(key K)
func (c *Cache[K, V]) Len() int               // count of non-expired entries
\`\`\`

Requirements:
- K must be comparable (map key)
- Entries expire after the TTL duration
- Get should return false for expired entries and not count them in Len()
- Protect with sync.RWMutex for concurrent access`,
    hints: [
      'Store entry as a struct with the value V and an expiresAt time.Time',
      'In Get: check time.Now().After(entry.expiresAt) to detect expiry',
      'In Len: iterate the map and count only non-expired entries',
      'Use RLock/RUnlock for Get and Len; Lock/Unlock for Set and Delete',
    ],
    starterCode: `package main

import (
    "fmt"
    "sync"
    "time"
)

type entry[V any] struct {
    value     V
    expiresAt time.Time
}

type Cache[K comparable, V any] struct {
    mu    sync.RWMutex
    items map[K]entry[V]
    ttl   time.Duration
}

func NewCache[K comparable, V any](ttl time.Duration) *Cache[K, V] {
    // TODO
    return nil
}

func (c *Cache[K, V]) Set(key K, value V) {
    // TODO
}

func (c *Cache[K, V]) Get(key K) (V, bool) {
    // TODO
    var zero V
    return zero, false
}

func (c *Cache[K, V]) Delete(key K) {
    // TODO
}

func (c *Cache[K, V]) Len() int {
    // TODO: count only non-expired entries
    return 0
}

func main() {
    c := NewCache[string, int](100 * time.Millisecond)
    c.Set("a", 1)
    c.Set("b", 2)

    v, ok := c.Get("a")
    fmt.Println(v, ok) // 1 true

    time.Sleep(150 * time.Millisecond)

    _, ok = c.Get("a")
    fmt.Println(ok)        // false — expired
    fmt.Println(c.Len())   // 0
}`,
    solution: `package main

import (
    "fmt"
    "sync"
    "time"
)

type entry[V any] struct {
    value     V
    expiresAt time.Time
}

type Cache[K comparable, V any] struct {
    mu    sync.RWMutex
    items map[K]entry[V]
    ttl   time.Duration
}

func NewCache[K comparable, V any](ttl time.Duration) *Cache[K, V] {
    return &Cache[K, V]{
        items: make(map[K]entry[V]),
        ttl:   ttl,
    }
}

func (c *Cache[K, V]) Set(key K, value V) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.items[key] = entry[V]{value: value, expiresAt: time.Now().Add(c.ttl)}
}

func (c *Cache[K, V]) Get(key K) (V, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    e, ok := c.items[key]
    if !ok || time.Now().After(e.expiresAt) {
        var zero V
        return zero, false
    }
    return e.value, true
}

func (c *Cache[K, V]) Delete(key K) {
    c.mu.Lock()
    defer c.mu.Unlock()
    delete(c.items, key)
}

func (c *Cache[K, V]) Len() int {
    c.mu.RLock()
    defer c.mu.RUnlock()
    count := 0
    now := time.Now()
    for _, e := range c.items {
        if !now.After(e.expiresAt) {
            count++
        }
    }
    return count
}

func main() {
    c := NewCache[string, int](100 * time.Millisecond)
    c.Set("a", 1)
    c.Set("b", 2)

    v, ok := c.Get("a")
    fmt.Println(v, ok) // 1 true

    time.Sleep(150 * time.Millisecond)

    _, ok = c.Get("a")
    fmt.Println(ok)        // false — expired
    fmt.Println(c.Len())   // 0
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does the ~ prefix mean in a type constraint like `~int`?',
      options: [
        'The type\'s underlying type must be int — includes named types like `type MyInt int`',
        'The type must be approximately equal to int at runtime',
        'The type must be a pointer to int',
        'The type must implement the int interface',
      ],
      answer: 0,
      explanation: 'Without ~, the constraint requires the type to be exactly int. With ~int, any type whose underlying type is int satisfies the constraint — including type MyInt int, type UserID int, etc. Almost always use ~ in union constraints for named types to behave correctly.'
    },
    {
      q: 'Why does the `any` constraint not allow using == on type parameter T?',
      options: [
        'any permits no operations beyond assignment — use `comparable` to allow == and !=',
        'any is an alias for interface{} which always supports ==',
        'any requires explicit type assertion before comparison',
        'any is only valid for primitive types, not structs',
      ],
      answer: 0,
      explanation: 'any (interface{}) as a constraint means T can be any type, but the compiler cannot guarantee that T supports ==. Not all types in Go are comparable (slices, maps, and functions are not). Use the comparable constraint when you need == — the compiler then guarantees T supports equality comparison.'
    },
    {
      q: 'How do you declare a method on a generic struct type in Go?',
      options: [
        'func (s *Stack[T]) Push(v T) — T is already bound by the struct, no new type parameter on the method',
        'func (s *Stack) Push[T any](v T) — add the type parameter to the method signature',
        'func[T any] (s *Stack[T]) Push(v T) — type parameter before the receiver',
        'func (s *Stack[T any]) Push(v T) — repeat the constraint in the receiver',
      ],
      answer: 0,
      explanation: 'When a method belongs to a generic type, the type parameter is inherited from the struct declaration. Write func (s *Stack[T]) Push(v T) — T is already in scope from type Stack[T any]. You cannot add new type parameters to individual methods; only the struct declaration can introduce T.'
    },
    {
      q: 'Which Go 1.21+ package provides generic Contains, Sort, and Index functions for slices?',
      options: [
        'slices — import "slices"',
        'sort — the existing sort package was updated with generics',
        'generic — a new standard package for generic utilities',
        'iter — the iteration package added in Go 1.23',
      ],
      answer: 0,
      explanation: 'Go 1.21 shipped the "slices" package with generic functions: slices.Contains, slices.Index, slices.Sort, slices.SortFunc, slices.Reverse, slices.Clone, slices.Max, slices.Min, etc. The "maps" package provides maps.Keys, maps.Values, maps.Clone. Use these before writing your own generic utilities.'
    },
    {
      q: 'When should you use an interface parameter instead of a type parameter?',
      options: [
        'When the function only calls methods defined on the interface — no return of T or comparable/ordered operations needed',
        'When the function is called from multiple goroutines',
        'When the type is known at runtime but not compile time',
        'Interfaces and type parameters are interchangeable — choose based on syntax preference',
      ],
      answer: 0,
      explanation: 'If a function only calls methods on a value and does not need to return the concrete type, store it, or use ==/<, an interface is simpler and more idiomatic Go. Use type parameters when: you return T, store T in a data structure, need comparable (==) or Ordered (<) operations, or need the concrete type at the call site.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I write a generic function that works with both slices and channels?',
      a: 'Not directly with a single type parameter — slices and channels have different syntax (range works on both, but index access and len are only on slices). You can define an interface that abstracts the common operations, but it gets complex quickly. For most real cases, write separate functions or use the iter.Seq[T] pattern (Go 1.23) to abstract over different sources with a pull-based iterator.'
    },
    {
      q: 'Does Go generate separate code for each generic instantiation?',
      a: 'Yes — the Go compiler uses a technique called "GCShape stenciling." Types with the same GCShape (same memory layout, same pointer/non-pointer nature) share a single implementation at the binary level. Most concrete types (int, float64, string) get their own stencil; all pointer types share one. This gives near-zero overhead for most use cases while keeping binary size manageable.'
    },
    {
      q: 'Can I use a type parameter as a map key in a generic function?',
      a: 'Only if constrained with comparable: func F[K comparable, V any](m map[K]V). The comparable constraint guarantees == and != are defined, which is required for map keys. If you forget comparable and try to use T as a map key, you get a compile error: "K is not comparable."'
    },
    {
      q: 'What is the difference between constraints.Ordered and comparable?',
      a: 'comparable allows == and != (equality). Ordered (from golang.org/x/exp/constraints, or you can define your own as ~int | ~float64 | ~string) allows <, >, <=, >= (ordering). comparable includes types like structs with comparable fields; Ordered is a subset covering only numeric types and string. For a sort function you need Ordered; for a set you need comparable.'
    },
    {
      q: 'Can generic types be used with type assertions?',
      a: 'Yes, but carefully. You can type-assert inside a generic function: v.(SomeInterface), but the compiler may not be able to verify this is always safe. If T is constrained to any, the assertion may panic at runtime if T does not implement the interface. If you need type-specific behaviour, use interface constraints or switch type patterns. Generics and type assertions tend to fight each other — if you find yourself asserting the type parameter, reconsider the design.'
    },
    {
      q: 'How do I write a Reduce function in Go generics?',
      a: 'func Reduce[T, U any](s []T, init U, f func(U, T) U) U { acc := init; for _, v := range s { acc = f(acc, v) }; return acc }. Usage: sum := Reduce(nums, 0, func(acc, n int) int { return acc + n }). The two type parameters T (element type) and U (accumulator type) allow the accumulator to be a different type than the slice elements — e.g., building a map from a slice.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Go generics use type parameters in [brackets] with constraints — use comparable for ==, ~ for underlying types, and prefer stdlib slices/maps over custom implementations.',
    mustKnow: [
      'Type parameters: func F[T any](v T) T — constraint limits valid operations on T.',
      'any allows no operations; comparable allows ==; Ordered allows < > for sort.',
      '~ prefix in constraints: ~int includes named types with underlying type int.',
      'Generic struct: type Stack[T any] struct — methods use func (s *Stack[T]) Push(v T).',
      'Type inference works for function args; generic types (structs) always need explicit [Type].',
      'Go 1.21 stdlib: slices.Sort, slices.Contains, maps.Keys — use before writing your own.',
      'Prefer interfaces over type parameters when the function only calls interface methods.',
    ],
    interviewFocus: [
      'What is the difference between any and comparable constraints?',
      'What does the ~ prefix do in a type constraint?',
      'When would you use an interface instead of a type parameter?',
      'How do you define a method on a generic struct type?',
      'What generic utilities does the Go 1.21 stdlib provide?',
    ],
  };
}
