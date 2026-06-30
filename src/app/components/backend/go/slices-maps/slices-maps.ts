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
  selector: 'app-go-slices-maps',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './slices-maps.html',
  styleUrl: './slices-maps.scss'
})
export class GoSlicesMaps {
  readingTime = 23;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Go 1.21+';
  route = 'go-slices-maps';
  nextRoute = '/go/goroutines';
  nextLabel = 'Goroutines';

  quickRef: QuickRefItem[] = [
    { name: 'make([]T, len, cap)', type: 'function', desc: 'Create a slice with length and optional capacity' },
    { name: 'append(s, v...)', type: 'function', desc: 'Append one or more values; may allocate a new backing array' },
    { name: 's[low:high]', type: 'syntax', desc: 'Slice expression — shares the underlying array' },
    { name: 'copy(dst, src)', type: 'function', desc: 'Copy min(len(dst), len(src)) elements; returns count' },
    { name: 'slices.Contains(s, v)', type: 'function', desc: 'Check membership (Go 1.21 slices package)' },
    { name: 'slices.SortFunc(s, cmp)', type: 'function', desc: 'Sort with a custom comparator (Go 1.21)' },
    { name: 'make(map[K]V)', type: 'function', desc: 'Create an empty map — always use make, never map literal for mutation' },
    { name: 'v, ok := m[key]', type: 'syntax', desc: 'Two-value map lookup — ok=false means key absent' },
    { name: 'delete(m, key)', type: 'function', desc: 'Remove a key from a map — no-op if key absent' },
    { name: 'maps.Keys(m)', type: 'function', desc: 'Return all keys as a slice (Go 1.21 maps package)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Slices — dynamic views over arrays',
      points: [
        'A slice is a descriptor with three fields: pointer to an underlying array, length, and capacity.',
        'Create with a literal `[]int{1, 2, 3}`, with `make([]int, len, cap)`, or by slicing an array/slice `arr[1:4]`.',
        '`len(s)` returns the number of elements; `cap(s)` returns how many the backing array can hold from the start of the slice.',
        '`append(s, v)` adds an element. If len == cap, Go allocates a new array (typically doubling capacity) and copies.',
        'Slices of slices share the same backing array — mutations through one slice are visible through others pointing to the same data.',
      ]
    },
    {
      heading: 'Slice operations & the slices package',
      points: [
        'Sub-slicing `s[low:high]` creates a slice sharing the same array — no copy. Use `s[low:high:max]` to limit capacity.',
        '`copy(dst, src)` copies min(len(dst), len(src)) elements — use it when you need an independent copy.',
        '`sort.Slice(s, less)` sorts in place. Go 1.21 adds the `slices` package: `slices.Sort`, `slices.SortFunc`, `slices.Contains`, `slices.Index`, `slices.Reverse`.',
        'Delete element at index i: `s = append(s[:i], s[i+1:]...)` — this modifies the original slice.',
        'A nil slice is valid — `len` and `cap` return 0, `append` works. Distinguish from empty slice `[]T{}`.',
      ]
    },
    {
      heading: 'Maps — hash tables',
      points: [
        'Maps are unordered hash tables: `map[KeyType]ValueType`. Keys must be comparable (no slices, functions, or maps).',
        'Always initialise with `make(map[K]V)` or a literal `map[K]V{k: v}` before writing. Writing to a nil map panics.',
        'Two-value lookup: `v, ok := m[key]`. If key is absent, `v` is the zero value and `ok` is false.',
        'Iteration order is deliberately randomised to prevent callers from depending on insertion order.',
        '`delete(m, key)` removes a key silently. Check existence first with the two-value form if needed.',
      ]
    },
    {
      heading: 'Maps & slices as function arguments',
      points: [
        'Slices are passed by header (pointer + len + cap). The callee can mutate elements but `append` to a local copy won\'t affect the caller.',
        'Maps are reference types — the callee mutating map contents IS visible to the caller.',
        'To prevent a caller\'s slice from being affected, pass a copy: `copy(dst, src)` or `slices.Clone(s)` (Go 1.21).',
        'Map operations are not goroutine-safe — use `sync.RWMutex` or `sync.Map` for concurrent access.',
        'Go 1.21 adds the `maps` package: `maps.Keys`, `maps.Values`, `maps.Clone`, `maps.Equal`.',
      ]
    },
    {
      heading: 'Common patterns',
      points: [
        'Grouping: accumulate into `map[K][]V` — check for existence then append.',
        'Set: `map[string]struct{}{}` — struct{} costs zero bytes.',
        'Frequency count: `map[string]int` — increment with `m[key]++`.',
        'Ordered map keys: collect with `maps.Keys`, sort with `slices.Sort`, then iterate.',
        'Filter slice in-place (avoiding allocation): `n := 0; for _, v := range s { if keep(v) { s[n] = v; n++ } }; s = s[:n]`.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Slices',
      language: 'typescript',
      code: `package main

import "fmt"

func main() {
    // Literal
    nums := []int{1, 2, 3, 4, 5}

    // Append
    nums = append(nums, 6, 7)
    fmt.Println(nums)    // [1 2 3 4 5 6 7]
    fmt.Println(len(nums), cap(nums)) // 7 10

    // Slicing — shares backing array
    sub := nums[1:4]
    sub[0] = 99
    fmt.Println(nums[1]) // 99 — original affected!

    // Independent copy
    clone := make([]int, len(nums))
    copy(clone, nums)
    clone[0] = 0
    fmt.Println(nums[0]) // still 1 — independent

    // make with length & capacity
    s := make([]int, 0, 10) // len=0, cap=10
    for i := 0; i < 5; i++ {
        s = append(s, i)  // no reallocation
    }

    // Delete element at index 2
    s = append(s[:2], s[3:]...)
    fmt.Println(s) // [0 1 3 4]
}`
    },
    {
      label: 'Maps',
      language: 'typescript',
      code: `package main

import "fmt"

func main() {
    // Create
    scores := make(map[string]int)
    scores["Alice"] = 95
    scores["Bob"]   = 87

    // Literal
    capitals := map[string]string{
        "France": "Paris",
        "Japan":  "Tokyo",
        "India":  "New Delhi",
    }

    // Two-value lookup
    v, ok := capitals["France"]
    fmt.Println(v, ok)           // Paris true
    v, ok = capitals["Germany"]
    fmt.Println(v, ok)           // "" false

    // Delete
    delete(capitals, "France")

    // Iterate (order is random)
    for country, city := range capitals {
        fmt.Printf("%s -> %s\\n", country, city)
    }

    // Zero-value increment
    wordCount := make(map[string]int)
    words := []string{"go", "is", "fast", "go", "is", "go"}
    for _, w := range words {
        wordCount[w]++ // safe even on first access
    }
    fmt.Println(wordCount) // map[fast:1 go:3 is:2]
}`
    },
    {
      label: 'Patterns',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "sort"
)

// Set using map[T]struct{}
func uniqueStrings(words []string) []string {
    seen := make(map[string]struct{})
    result := make([]string, 0, len(words))
    for _, w := range words {
        if _, exists := seen[w]; !exists {
            seen[w] = struct{}{}
            result = append(result, w)
        }
    }
    return result
}

// Group by first letter
func groupByFirstLetter(words []string) map[string][]string {
    groups := make(map[string][]string)
    for _, w := range words {
        key := string(w[0])
        groups[key] = append(groups[key], w)
    }
    return groups
}

// Sorted map iteration
func printSorted(m map[string]int) {
    keys := make([]string, 0, len(m))
    for k := range m { keys = append(keys, k) }
    sort.Strings(keys)
    for _, k := range keys {
        fmt.Printf("%s: %d\\n", k, m[k])
    }
}

func main() {
    words := []string{"banana", "apple", "cherry", "apple", "banana"}
    fmt.Println(uniqueStrings(words))
    fmt.Println(groupByFirstLetter([]string{"ant", "bear", "ape", "cat", "bee"}))
    printSorted(map[string]int{"z": 1, "a": 3, "m": 2})
}`
    },
    {
      label: 'slices Package (Go 1.21)',
      language: 'typescript',
      code: `package main

import (
    "cmp"
    "fmt"
    "slices"
)

type Person struct {
    Name string
    Age  int
}

func main() {
    nums := []int{3, 1, 4, 1, 5, 9, 2, 6}

    // Sort
    slices.Sort(nums)
    fmt.Println(nums) // [1 1 2 3 4 5 6 9]

    // Search (binary, slice must be sorted)
    idx, found := slices.BinarySearch(nums, 5)
    fmt.Println(idx, found) // 5 true

    // Contains
    fmt.Println(slices.Contains(nums, 7)) // false

    // Clone (independent copy)
    clone := slices.Clone(nums)
    clone[0] = 99
    fmt.Println(nums[0]) // 1 — unaffected

    // Sort structs
    people := []Person{
        {Name: "Charlie", Age: 30},
        {Name: "Alice", Age: 25},
        {Name: "Bob", Age: 30},
    }
    slices.SortFunc(people, func(a, b Person) int {
        if n := cmp.Compare(a.Age, b.Age); n != 0 { return n }
        return cmp.Compare(a.Name, b.Name)
    })
    fmt.Println(people) // Alice 25, Bob 30, Charlie 30
}`
    },
    {
      label: 'Filter & Transform',
      language: 'typescript',
      code: `package main

import "fmt"

// Filter in-place (no allocation)
func filter[T any](s []T, keep func(T) bool) []T {
    n := 0
    for _, v := range s {
        if keep(v) {
            s[n] = v
            n++
        }
    }
    return s[:n]
}

// Map (allocates new slice)
func mapSlice[T, U any](s []T, fn func(T) U) []U {
    result := make([]U, len(s))
    for i, v := range s { result[i] = fn(v) }
    return result
}

// Reduce
func reduce[T, U any](s []T, init U, fn func(U, T) U) U {
    acc := init
    for _, v := range s { acc = fn(acc, v) }
    return acc
}

func main() {
    nums := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

    evens := filter(append([]int{}, nums...), func(n int) bool { return n%2 == 0 })
    fmt.Println(evens) // [2 4 6 8 10]

    doubled := mapSlice(nums, func(n int) int { return n * 2 })
    fmt.Println(doubled) // [2 4 6 8 10 12 14 16 18 20]

    sum := reduce(nums, 0, func(acc, n int) int { return acc + n })
    fmt.Println(sum) // 55
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Writing to a nil map',
      wrong: `var m map[string]int
m["key"] = 1  // panic: assignment to entry in nil map`,
      right: `m := make(map[string]int)
m["key"] = 1  // fine`,
      explanation: 'A var-declared map is nil. Reading from a nil map returns the zero value (safe), but writing to one panics. Always initialise with make or a literal.'
    },
    {
      title: 'Mutating a slice element via a sub-slice',
      wrong: `original := []int{1, 2, 3, 4, 5}
sub := original[1:3]
sub[0] = 99
// original[1] is now 99 — unintended side effect`,
      right: `sub := make([]int, 2)
copy(sub, original[1:3])
sub[0] = 99
// original is unchanged`,
      explanation: 'Slicing creates a view sharing the same backing array. Mutations through the sub-slice affect the original. Use copy or slices.Clone when you need an independent copy.'
    },
    {
      title: 'Appending to a shared slice',
      wrong: `a := []int{1, 2, 3}
b := a[:2]        // b shares a's array
b = append(b, 99) // if cap(a) > 2, this overwrites a[2]!
fmt.Println(a)    // might print [1 2 99]`,
      right: `b := make([]int, 2)
copy(b, a[:2])
b = append(b, 99) // safe — b has its own array`,
      explanation: 'Appending to a sub-slice that still has capacity modifies the original backing array. Use the three-index slice a[:2:2] to cap the sub-slice, or copy it before appending.'
    },
    {
      title: 'Iterating over a map and expecting consistent order',
      wrong: `m := map[string]int{"a": 1, "b": 2, "c": 3}
for k, v := range m {
    fmt.Println(k, v)
} // order differs every run — do not depend on it`,
      right: `keys := make([]string, 0, len(m))
for k := range m { keys = append(keys, k) }
sort.Strings(keys)
for _, k := range keys { fmt.Println(k, m[k]) }`,
      explanation: 'Go deliberately randomises map iteration order. If you need a consistent order, collect the keys, sort them, then iterate the sorted keys.'
    },
    {
      title: 'Using len instead of checking map key existence',
      wrong: `count := m["missing"] // returns 0 — was it zero or absent?
if count == 0 { ... }  // cannot distinguish zero value from absent`,
      right: `count, ok := m["missing"]
if !ok {
    // key does not exist
}`,
      explanation: 'Map lookup returns the zero value for absent keys. Use the two-value form (v, ok) when you need to distinguish a stored zero from a missing key.'
    },
    {
      title: 'Modifying a map during range iteration',
      wrong: `for k, v := range m {
    if v == 0 {
        delete(m, k) // technically safe in Go but discouraged
        m["extra"] = 1 // adding during range — NOT safe
    }
}`,
      right: `toDelete := []string{}
for k, v := range m {
    if v == 0 { toDelete = append(toDelete, k) }
}
for _, k := range toDelete { delete(m, k) }`,
      explanation: 'Deleting keys during range is defined in Go (the deleted key will not appear later in iteration). However, adding keys during iteration has undefined visit order. Collect changes and apply after iteration.'
    },
  ];

  challenge: Challenge = {
    title: 'Top K Elements',
    language: 'typescript',
    description: `Write a function \`TopK(nums []int, k int) []int\` that returns the K most frequent elements in \`nums\`, in any order.

Example:
\`\`\`
TopK([]int{1, 1, 1, 2, 2, 3}, 2) // [1, 2]
TopK([]int{1}, 1)                 // [1]
\`\`\`

Also write \`GroupBy[T comparable, K comparable](items []T, key func(T) K) map[K][]T\` — a generic grouping function.

Example:
\`\`\`
GroupBy([]string{"ant","bear","ape","bee"}, func(s string) byte { return s[0] })
// map[97:[ant ape] 98:[bear bee]]
\`\`\``,
    hints: [
      'Step 1: build a frequency map with map[int]int',
      'Step 2: collect unique elements into a slice and sort by frequency descending',
      'Step 3: return the first k elements',
      'For GroupBy: use map[K][]T and append each item under its key',
    ],
    starterCode: `package main

import (
    "fmt"
    "sort"
)

func TopK(nums []int, k int) []int {
    // TODO: implement
    return nil
}

func GroupBy[T comparable, K comparable](items []T, key func(T) K) map[K][]T {
    // TODO: implement
    return nil
}

func main() {
    fmt.Println(TopK([]int{1, 1, 1, 2, 2, 3}, 2)) // [1 2]
    fmt.Println(TopK([]int{1}, 1))                  // [1]

    result := GroupBy([]string{"ant", "bear", "ape", "bee"}, func(s string) byte { return s[0] })
    fmt.Println(result) // map[97:[ant ape] 98:[bear bee]]
}`,
    solution: `package main

import (
    "fmt"
    "sort"
)

func TopK(nums []int, k int) []int {
    freq := make(map[int]int)
    for _, n := range nums { freq[n]++ }

    unique := make([]int, 0, len(freq))
    for n := range freq { unique = append(unique, n) }

    sort.Slice(unique, func(i, j int) bool {
        return freq[unique[i]] > freq[unique[j]]
    })
    return unique[:k]
}

func GroupBy[T comparable, K comparable](items []T, key func(T) K) map[K][]T {
    result := make(map[K][]T)
    for _, item := range items {
        k := key(item)
        result[k] = append(result[k], item)
    }
    return result
}

func main() {
    fmt.Println(TopK([]int{1, 1, 1, 2, 2, 3}, 2)) // [1 2]
    fmt.Println(TopK([]int{1}, 1))                  // [1]

    result := GroupBy([]string{"ant", "bear", "ape", "bee"}, func(s string) byte { return s[0] })
    fmt.Println(result)
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What are the three components of a slice header?',
      options: [
        'Pointer to backing array, length, and capacity',
        'Pointer to backing array, type, and size',
        'Start index, end index, and element type',
        'Data pointer, hash code, and length',
      ],
      answer: 0,
      explanation: 'A slice is a struct with three fields: a pointer to the first element of the underlying array, the length (number of elements accessible), and the capacity (total elements the backing array can hold from the pointer).'
    },
    {
      q: 'What happens when you append to a slice that is at full capacity?',
      options: [
        'Go allocates a new backing array and copies the existing elements',
        'Go extends the existing array in place',
        'append returns an error',
        'The slice panics',
      ],
      answer: 0,
      explanation: 'When len == cap, append allocates a new backing array (typically doubling the capacity for small slices), copies all existing elements, then appends the new element. The original backing array is unaffected.'
    },
    {
      q: 'What is the result of reading a missing key from a map?',
      options: [
        'The zero value of the value type',
        'A panic',
        'nil',
        'An error',
      ],
      answer: 0,
      explanation: 'Reading a missing key returns the zero value for the value type (0 for int, "" for string, nil for pointer/slice/map). Use the two-value form (v, ok) to distinguish between a stored zero and an absent key.'
    },
    {
      q: 'Which of these map key types is NOT valid in Go?',
      options: [
        '[]int (slice)',
        'string',
        'struct { X, Y int }',
        'int',
      ],
      answer: 0,
      explanation: 'Map keys must be comparable with ==. Slices, maps, and functions are not comparable and cannot be used as map keys. Strings, integers, booleans, pointers, and comparable structs are all valid.'
    },
    {
      q: 'What does sub := s[1:3] create?',
      options: [
        'A slice sharing s\'s backing array, containing s[1] and s[2]',
        'An independent copy of s[1] through s[2]',
        'A new array with elements from index 1 to 3 inclusive',
        'A slice starting at index 1 with length 3',
      ],
      answer: 0,
      explanation: 's[1:3] creates a slice from index 1 (inclusive) to 3 (exclusive), containing s[1] and s[2]. It shares the same backing array — mutations through sub affect s and vice versa.'
    },
    {
      q: 'Why do maps in Go not have a guaranteed iteration order?',
      options: ['It is a bug that was never fixed', 'Go intentionally randomises map iteration order to prevent code from depending on an undefined ordering — each range loop may produce a different order', 'Maps are sorted alphabetically', 'Order depends on the hash function'],
      answer: 1,
      explanation: 'Go deliberately randomises map iteration order (since Go 1.0) to prevent developers from relying on implementation-specific behaviour. The hash table\'s internal bucket layout depends on the runtime, machine, and Go version. Sort the keys explicitly (sort.Strings(keys)) if you need deterministic output — for logging, JSON, or tests. Use a slice of structs or a sorted external list for ordered data.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When does append allocate a new backing array?',
      a: 'append allocates when len(s) == cap(s) — the slice has no room for the new element. The growth strategy is implementation-defined: typically 2x for small slices, less aggressive for large ones. After append causes a reallocation, the returned slice points to a new array; the original is unaffected. This is why you must always assign the result: s = append(s, v).'
    },
    {
      q: 'What is the difference between a nil slice and an empty slice?',
      a: 'A nil slice (`var s []int`) has a nil pointer, length 0, and capacity 0. An empty slice (`s := []int{}` or `make([]int, 0)`) has a non-nil pointer, length 0, and capacity 0. Both have len 0 and can be ranged over. `append` works on both. The difference matters when marshalling to JSON: nil slice becomes `null`, empty slice becomes `[]`. Use `len(s) == 0` to check for empty rather than `s == nil`.'
    },
    {
      q: 'Why is map iteration order randomised in Go?',
      a: 'Go randomises iteration order to prevent programs from accidentally depending on hash-insertion order, which differs across Go versions, architectures, and even runs (a security measure against hash-flooding attacks). If you need a stable order, sort the keys: `slices.Sort(maps.Keys(m))` (Go 1.21) or collect, sort, and iterate manually.'
    },
    {
      q: 'Are maps safe to use concurrently?',
      a: 'No. Reading concurrently is safe, but concurrent read+write or concurrent writes cause a data race and will panic with "concurrent map read and map write" at runtime. Solutions: (1) `sync.RWMutex` wrapping the map — read-lock for reads, write-lock for writes; (2) `sync.Map` — built-in concurrent map optimised for keys written once and read many times; (3) channel-based access pattern. Always guard map writes in goroutines.'
    },
    {
      q: 'What is the three-index slice s[low:high:max]?',
      a: 'The three-index slice sets the capacity of the resulting slice to max-low instead of the parent\'s capacity-low. This "capacity clamp" prevents the sub-slice from seeing — or accidentally overwriting — elements beyond high when you append to it. Use it when sharing sub-slices that will be independently appended to: `safe := original[:2:2]` — appending to safe will always allocate a new array instead of clobbering original[2].'
    },
    {
      q: 'When should I use a map vs a slice for lookup?',
      a: 'Use a map (O(1) average) when you look up by an arbitrary key and the key set is not a dense range of integers. Use a slice (O(n) scan or O(log n) binary search) when: the number of elements is small (<~20), keys are consecutive integers (slice as a lookup table), or you need ordered iteration. For frequent membership tests, a `map[T]struct{}` set pattern is idiomatic.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Slices are views over arrays with len+cap; maps are hash tables — both are reference types that share underlying data.',
    mustKnow: [
      'Slice = pointer + len + cap. Slicing creates a view; copy or slices.Clone creates independence.',
      'append may reallocate; always assign back: s = append(s, v).',
      'nil slice is valid for range and append. Check empty with len(s) == 0, not s == nil.',
      'Initialise maps with make before writing. Writing to nil map panics.',
      'Two-value map lookup: v, ok := m[key] — distinguishes absent from zero value.',
      'Map iteration is deliberately randomised — sort keys for stable output.',
      'Maps are not goroutine-safe — protect concurrent access with sync.RWMutex or sync.Map.',
    ],
    interviewFocus: [
      'What happens internally when append exceeds capacity?',
      'Difference between nil slice and empty slice — when does it matter?',
      'Why is map iteration order random and how do you get sorted output?',
      'How do you safely share a sub-slice without accidental mutations?',
      'How do you make concurrent map access safe?',
    ],
  };
}
