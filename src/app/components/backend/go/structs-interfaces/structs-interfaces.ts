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
  selector: 'app-go-structs-interfaces',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './structs-interfaces.html',
  styleUrl: './structs-interfaces.scss'
})
export class GoStructsInterfaces {
  readingTime = 24;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Go 1.21+';
  route = 'go-structs-interfaces';
  nextRoute = '/go/error-handling';
  nextLabel = 'Error Handling';

  quickRef: QuickRefItem[] = [
    { name: 'type Person struct { Name string }', type: 'syntax', desc: 'Struct definition with exported field' },
    { name: 'p := Person{Name: "Alice"}', type: 'syntax', desc: 'Struct literal with named fields (preferred)' },
    { name: 'p.Name', type: 'accessor', desc: 'Field access — works on both value and pointer' },
    { name: 'func (p Person) String() string', type: 'method', desc: 'Value receiver method — works on a copy' },
    { name: 'func (p *Person) SetName(n string)', type: 'method', desc: 'Pointer receiver method — mutates original' },
    { name: 'type Stringer interface { String() string }', type: 'interface', desc: 'Interface — implemented implicitly when method set matches' },
    { name: 'var _ Stringer = (*Person)(nil)', type: 'syntax', desc: 'Compile-time interface satisfaction check' },
    { name: 'type Dog struct { Animal }', type: 'syntax', desc: 'Embedding — promotes Animal fields/methods onto Dog' },
    { name: 'v, ok := i.(MyType)', type: 'syntax', desc: 'Type assertion — ok=false means i does not hold MyType' },
    { name: 'switch v := i.(type) { case *Dog: }', type: 'syntax', desc: 'Type switch — dispatches on the concrete type in an interface' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Structs — custom data types',
      points: [
        'A struct groups named fields of arbitrary types: `type Point struct { X, Y float64 }`.',
        'Instantiate with a struct literal using field names: `p := Point{X: 1, Y: 2}`. Positional literals exist but are fragile.',
        'Fields are accessed with dot notation. When you have a pointer, Go auto-dereferences: `(*ptr).Field` and `ptr.Field` are identical.',
        'Struct embedding (`type Dog struct { Animal }`) promotes Animal\'s fields and methods directly onto Dog — Go\'s composition mechanism.',
        'Struct tags annotate fields for encoding packages: `json:"name,omitempty"` or `db:"user_id"`.',
      ]
    },
    {
      heading: 'Methods & receivers',
      points: [
        'A method is a function with a receiver: `func (p *Person) Greet() string`. The receiver appears between `func` and the method name.',
        'Value receiver (`func (p Person) F()`) works on a copy — safe for read-only operations on small structs.',
        'Pointer receiver (`func (p *Person) F()`) mutates the original and avoids copying large structs.',
        'Be consistent: if any method on a type uses a pointer receiver, all methods should use pointer receivers.',
        'Methods are called identically on values and pointers — Go automatically takes or dereferences the address as needed.',
      ]
    },
    {
      heading: 'Interfaces — implicit satisfaction',
      points: [
        'An interface defines a set of method signatures. A type implements an interface just by having those methods — no `implements` keyword.',
        'This implicit satisfaction enables polymorphism without inheritance hierarchies.',
        'The empty interface `interface{}` (or `any` in Go 1.18+) accepts any value — used sparingly for generic containers.',
        'Interface values hold (type, value) pairs internally. A nil interface is different from an interface holding a nil pointer.',
        'Keep interfaces small — the standard library\'s most powerful interfaces have 1-3 methods: `io.Reader`, `io.Writer`, `fmt.Stringer`.',
      ]
    },
    {
      heading: 'Type assertions & type switches',
      points: [
        'A type assertion extracts the concrete value from an interface: `v, ok := i.(T)`. Without `ok`, it panics if wrong.',
        'Use the two-value form (`v, ok`) defensively to avoid panics at runtime.',
        'A type switch dispatches on the runtime type: `switch v := i.(type) { case *Dog: ... case *Cat: ... }`.',
        'Type switches replace the need for reflection in most dispatch scenarios.',
        '`.(type)` is only valid inside a switch statement.',
      ]
    },
    {
      heading: 'Embedding vs inheritance',
      points: [
        'Go has no classes or inheritance. Composition via embedding is the idiomatic alternative.',
        'Embedding promotes all exported methods and fields of the embedded type to the outer struct.',
        'You can override a promoted method by defining a method with the same name on the outer struct.',
        'Embedding an interface in a struct is used for partial implementations and mocking in tests.',
        'Multiple structs can be embedded simultaneously — method ambiguity at the same depth is a compile error.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Structs & Methods',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "math"
)

type Point struct {
    X, Y float64
}

// Value receiver — read-only
func (p Point) Distance(q Point) float64 {
    dx := p.X - q.X
    dy := p.Y - q.Y
    return math.Sqrt(dx*dx + dy*dy)
}

// Pointer receiver — mutates
func (p *Point) Scale(factor float64) {
    p.X *= factor
    p.Y *= factor
}

// Implement fmt.Stringer
func (p Point) String() string {
    return fmt.Sprintf("(%.2f, %.2f)", p.X, p.Y)
}

func main() {
    a := Point{X: 0, Y: 0}
    b := Point{X: 3, Y: 4}
    fmt.Println(a.Distance(b)) // 5

    b.Scale(2)
    fmt.Println(b)             // (6.00, 8.00) via Stringer

    p := &Point{X: 1, Y: 1}
    p.Scale(10)
    fmt.Println(p.X, p.Y)     // 10 10
}`
    },
    {
      label: 'Interfaces',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "math"
)

type Shape interface {
    Area() float64
    Perimeter() float64
}

type Circle struct{ Radius float64 }
type Rect struct{ Width, Height float64 }

func (c Circle) Area() float64      { return math.Pi * c.Radius * c.Radius }
func (c Circle) Perimeter() float64 { return 2 * math.Pi * c.Radius }

func (r Rect) Area() float64      { return r.Width * r.Height }
func (r Rect) Perimeter() float64 { return 2 * (r.Width + r.Height) }

func printShape(s Shape) {
    fmt.Printf("Area: %.2f  Perimeter: %.2f\\n", s.Area(), s.Perimeter())
}

// Compile-time check
var _ Shape = Circle{}
var _ Shape = Rect{}

func main() {
    shapes := []Shape{
        Circle{Radius: 5},
        Rect{Width: 4, Height: 6},
    }
    for _, s := range shapes {
        printShape(s)
    }
}`
    },
    {
      label: 'Embedding',
      language: 'typescript',
      code: `package main

import "fmt"

type Animal struct {
    Name string
}

func (a Animal) Speak() string {
    return a.Name + " speaks"
}

type Dog struct {
    Animal        // embed — promotes Name and Speak
    Breed string
}

// Override promoted method
func (d Dog) Speak() string {
    return d.Name + " says: Woof!"
}

type Cat struct {
    Animal
}

func main() {
    d := Dog{Animal: Animal{Name: "Rex"}, Breed: "Labrador"}
    fmt.Println(d.Name)    // Rex — from Animal
    fmt.Println(d.Speak()) // Rex says: Woof! — overridden

    c := Cat{Animal: Animal{Name: "Whiskers"}}
    fmt.Println(c.Speak()) // Whiskers speaks — promoted
}`
    },
    {
      label: 'Type Assert & Switch',
      language: 'typescript',
      code: `package main

import "fmt"

type Animal interface {
    Sound() string
}

type Dog struct{ Name string }
type Cat struct{ Name string }

func (d Dog) Sound() string { return "Woof" }
func (c Cat) Sound() string { return "Meow" }
func (d Dog) Fetch() string { return d.Name + " fetches!" }

func describe(a Animal) {
    switch v := a.(type) {
    case Dog:
        fmt.Printf("Dog %s: %s. %s\\n", v.Name, v.Sound(), v.Fetch())
    case Cat:
        fmt.Printf("Cat %s: %s\\n", v.Name, v.Sound())
    default:
        fmt.Printf("Unknown: %T\\n", v)
    }
}

func main() {
    animals := []Animal{Dog{Name: "Rex"}, Cat{Name: "Whiskers"}}
    for _, a := range animals {
        describe(a)
    }

    // Single type assertion
    var a Animal = Dog{Name: "Buddy"}
    if d, ok := a.(Dog); ok {
        fmt.Println("Dog:", d.Name)
    }
}`
    },
    {
      label: 'Struct Tags & JSON',
      language: 'typescript',
      code: `package main

import (
    "encoding/json"
    "fmt"
)

type User struct {
    ID       int    \`json:"id"\`
    Username string \`json:"username"\`
    Email    string \`json:"email,omitempty"\`
    password string  // unexported — never serialised
}

func main() {
    u := User{ID: 1, Username: "alice"}
    data, _ := json.Marshal(u)
    fmt.Println(string(data))
    // {"id":1,"username":"alice"}

    u2 := User{ID: 2, Username: "bob", Email: "bob@example.com"}
    data2, _ := json.Marshal(u2)
    fmt.Println(string(data2))
    // {"id":2,"username":"bob","email":"bob@example.com"}

    raw := \`{"id":3,"username":"carol","email":"carol@example.com"}\`
    var u3 User
    json.Unmarshal([]byte(raw), &u3)
    fmt.Printf("%+v\\n", u3) // {ID:3 Username:carol Email:carol@example.com password:}
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Mixing pointer and value receivers on the same type',
      wrong: `func (p Person) Name() string      { return p.name }
func (p *Person) SetName(n string) { p.name = n }`,
      right: `// All methods use pointer receiver
func (p *Person) Name() string       { return p.name }
func (p *Person) SetName(n string)   { p.name = n }`,
      explanation: 'If any method needs a pointer receiver (to mutate), make ALL methods pointer receivers. Mixing causes subtle bugs: an interface holding a value type cannot call pointer-receiver methods.'
    },
    {
      title: 'Nil interface vs interface holding nil pointer',
      wrong: `var p *Person = nil
var i fmt.Stringer = p  // i is NOT nil!
fmt.Println(i == nil)   // false`,
      right: `var i fmt.Stringer = nil // truly nil interface
fmt.Println(i == nil)   // true`,
      explanation: 'An interface value is nil only when both its type and value are nil. Assigning a nil *Person gives the interface a non-nil type, so i != nil even though the pointer is nil.'
    },
    {
      title: 'Positional struct literals break on field reorder',
      wrong: `c := Config{"localhost", 8080, true} // breaks if fields reorder`,
      right: `c := Config{
    Host: "localhost",
    Port: 8080,
    TLS:  true,
}`,
      explanation: 'Always use named fields outside the defining package. Positional literals silently assign wrong values if the struct definition changes.'
    },
    {
      title: 'Type asserting without checking ok',
      wrong: `n := i.(int)  // panics if i is not an int`,
      right: `n, ok := i.(int)
if !ok {
    fmt.Println("not an int")
    return
}`,
      explanation: 'Single-value type assertion panics at runtime on failure. Always use the two-value form (v, ok) unless you are certain about the type from a preceding type switch.'
    },
    {
      title: 'Embedding creates composition, not inheritance',
      wrong: `type Base struct{}
type Child struct{ Base }
// Cannot pass Child where Base is expected`,
      right: `type Namer interface{ Name() string }
// Both Base and Child satisfy Namer independently`,
      explanation: 'Embedding promotes methods but does not create an is-a relationship. Use interfaces for polymorphism; use embedding for code reuse.'
    },
    {
      title: 'Returning interface from constructor hides type info',
      wrong: `func NewWriter() io.Writer {
    return &myWriter{} // caller cannot access myWriter-specific methods
}`,
      right: `func NewWriter() *myWriter {
    return &myWriter{} // caller gets full access; assign to io.Writer if needed
}`,
      explanation: 'Go proverb: "Accept interfaces, return concrete types." Returning the concrete type lets callers use all methods. They can always assign to an interface variable themselves.'
    },
  ];

  challenge: Challenge = {
    title: 'Shape Calculator',
    language: 'typescript',
    description: `Define a \`Shape\` interface with \`Area() float64\` and \`Perimeter() float64\` methods.

Implement three concrete types: \`Circle\`, \`Rectangle\`, and \`Triangle\` (with sides A, B, C).

Write:
- \`LargestArea(shapes []Shape) Shape\` — returns the shape with the largest area
- \`TotalPerimeter(shapes []Shape) float64\` — sums all perimeters

Example output:
\`\`\`
Largest: Circle(r=5.00)
Total perimeter: 56.42
\`\`\``,
    hints: [
      'Triangle area via Heron\'s formula: s=(a+b+c)/2, area=sqrt(s*(s-a)*(s-b)*(s-c))',
      'math.Sqrt and math.Pi are in the "math" package',
      'Implement fmt.Stringer on each type for readable Printf output',
      'LargestArea: track best with a running max comparison',
    ],
    starterCode: `package main

import (
    "fmt"
    "math"
)

type Shape interface {
    Area() float64
    Perimeter() float64
}

type Circle struct{ Radius float64 }
type Rectangle struct{ Width, Height float64 }
type Triangle struct{ A, B, C float64 }

// TODO: implement methods for each type

func LargestArea(shapes []Shape) Shape {
    return nil // TODO
}

func TotalPerimeter(shapes []Shape) float64 {
    return 0 // TODO
}

func main() {
    shapes := []Shape{
        Circle{Radius: 5},
        Rectangle{Width: 4, Height: 6},
        Triangle{A: 3, B: 4, C: 5},
    }
    fmt.Printf("Largest: %v\\n", LargestArea(shapes))
    fmt.Printf("Total perimeter: %.2f\\n", TotalPerimeter(shapes))
}`,
    solution: `package main

import (
    "fmt"
    "math"
)

type Shape interface {
    Area() float64
    Perimeter() float64
}

type Circle struct{ Radius float64 }
type Rectangle struct{ Width, Height float64 }
type Triangle struct{ A, B, C float64 }

func (c Circle) Area() float64      { return math.Pi * c.Radius * c.Radius }
func (c Circle) Perimeter() float64 { return 2 * math.Pi * c.Radius }
func (c Circle) String() string     { return fmt.Sprintf("Circle(r=%.2f)", c.Radius) }

func (r Rectangle) Area() float64      { return r.Width * r.Height }
func (r Rectangle) Perimeter() float64 { return 2 * (r.Width + r.Height) }
func (r Rectangle) String() string     { return fmt.Sprintf("Rectangle(%.0fx%.0f)", r.Width, r.Height) }

func (t Triangle) Area() float64 {
    s := (t.A + t.B + t.C) / 2
    return math.Sqrt(s * (s-t.A) * (s-t.B) * (s-t.C))
}
func (t Triangle) Perimeter() float64 { return t.A + t.B + t.C }
func (t Triangle) String() string     { return fmt.Sprintf("Triangle(%.0f,%.0f,%.0f)", t.A, t.B, t.C) }

func LargestArea(shapes []Shape) Shape {
    if len(shapes) == 0 { return nil }
    best := shapes[0]
    for _, s := range shapes[1:] {
        if s.Area() > best.Area() { best = s }
    }
    return best
}

func TotalPerimeter(shapes []Shape) float64 {
    total := 0.0
    for _, s := range shapes { total += s.Perimeter() }
    return total
}

func main() {
    shapes := []Shape{
        Circle{Radius: 5},
        Rectangle{Width: 4, Height: 6},
        Triangle{A: 3, B: 4, C: 5},
    }
    fmt.Printf("Largest: %v\\n", LargestArea(shapes))
    fmt.Printf("Total perimeter: %.2f\\n", TotalPerimeter(shapes))
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'How does a type implement an interface in Go?',
      options: [
        'By having methods that match the interface\'s method signatures',
        'By using the implements keyword',
        'By embedding the interface in the struct',
        'By registering with the interface at package init',
      ],
      answer: 0,
      explanation: 'Go uses implicit interface satisfaction. A type automatically implements an interface when it has all the required methods with the correct signatures. No explicit declaration is needed.'
    },
    {
      q: 'What is the difference between a value receiver and a pointer receiver?',
      options: [
        'Value receiver operates on a copy; pointer receiver mutates the original',
        'Pointer receiver is faster for all types',
        'Value receiver is only for primitive types',
        'There is no practical difference',
      ],
      answer: 0,
      explanation: 'A value receiver (func (p Person) F()) operates on a copy — mutations are lost. A pointer receiver (func (p *Person) F()) operates on the original and can mutate it. Pointer receivers also avoid copying large structs.'
    },
    {
      q: 'What does struct embedding achieve?',
      options: [
        'It promotes the embedded type\'s fields and methods onto the outer struct',
        'It creates an inheritance relationship like in OOP',
        'It makes the outer struct a subtype of the embedded type',
        'It copies all data from the embedded type at creation time',
      ],
      answer: 0,
      explanation: 'Embedding (type Dog struct { Animal }) promotes Animal\'s exported fields and methods onto Dog. It is composition, not inheritance — a Dog is not an Animal from Go\'s type system perspective.'
    },
    {
      q: 'What happens when you type-assert without the ok form: v := i.(T)?',
      options: [
        'It panics at runtime if i does not hold a value of type T',
        'It returns nil if the assertion fails',
        'It is a compile error',
        'It returns the zero value of T',
      ],
      answer: 0,
      explanation: 'Single-value type assertion panics at runtime on failure. The two-value form v, ok := i.(T) is safe — ok is false if the assertion fails, v is the zero value of T.'
    },
    {
      q: 'When is an interface value nil?',
      options: [
        'Only when both its dynamic type and dynamic value are nil',
        'When the value it holds is a nil pointer',
        'When it is declared but not assigned',
        'When its underlying type is an empty struct',
      ],
      answer: 0,
      explanation: 'An interface value is nil only when both its type and value components are nil. Assigning a nil *Person to an interface gives it a non-nil type (*Person), making it non-nil even though the pointer is nil.'
    },
    {
      q: 'When should you use a value receiver vs a pointer receiver on a method?',
      options: ['Always use pointer receivers', 'Use pointer receivers when the method modifies the receiver, or when the type is large; use value receivers for small, read-only types where copying is cheap', 'Always use value receivers for interfaces', 'It makes no functional difference'],
      answer: 1,
      explanation: 'Pointer receiver (*T): needed when the method mutates the receiver, or when T is large (avoids copying). Value receiver (T): for read-only methods on small types. Critical rule: if any method uses a pointer receiver, all methods should use pointer receivers for consistency — otherwise the interface satisfaction rules become confusing (only *T satisfies the interface, not T). sync.Mutex must always use pointer receivers to avoid copying the lock state.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why doesn\'t Go have classes and inheritance?',
      a: 'Go\'s designers deliberately chose composition over inheritance. Deep inheritance hierarchies lead to fragile base-class problems and tight coupling. Go uses structs for data, interfaces for polymorphism, and embedding for code reuse — achieving the same goals without the complexity. Go code tends to be easier to read and refactor as a result.'
    },
    {
      q: 'What is the empty interface (any) and when should I use it?',
      a: '`any` (alias for `interface{}`) accepts any value because every type implements the empty interface. It is useful for truly generic containers before generics, in JSON/reflection APIs, and logging. Avoid it when you know the concrete type — use proper interfaces or generics instead. Overusing `any` loses type safety and requires type assertions at every use site.'
    },
    {
      q: 'How do I check at compile time that a type satisfies an interface?',
      a: 'Use a blank identifier assignment: `var _ MyInterface = (*MyType)(nil)`. This compiles only if *MyType implements MyInterface. It is a zero-cost compile-time assertion, useful in libraries to guarantee an interface contract that tests might not fully exercise.'
    },
    {
      q: 'What are struct tags and how are they used?',
      a: 'Struct tags are string literals in backticks after a field declaration: `json:"name,omitempty"`. They are metadata read by reflection at runtime. The `encoding/json` package uses them for serialisation. ORMs use `db:"column_name"`. Validation libraries use `validate:"required,min=3"`. Tags have no runtime behaviour unless a package explicitly reads them via `reflect.StructTag`.'
    },
    {
      q: 'When should I return a concrete type vs an interface from a function?',
      a: 'The Go proverb: "Accept interfaces, return concrete types." Accept the broadest interface that satisfies your needs — `io.Reader` rather than `*os.File`. Return the concrete type so callers can access all methods without type assertions. The exception is when the concrete type is an implementation detail that should be hidden.'
    },
    {
      q: 'Can I embed an interface inside a struct?',
      a: 'Yes. Embedding an interface in a struct is useful for partial implementations — especially in tests where you want to mock only specific methods. You store a concrete implementation at runtime and only override the methods you care about. If the embedded interface field is nil and a method is called through it, it panics at runtime.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Structs hold data, methods attach behaviour, and interfaces define contracts — implicit satisfaction gives Go its flexible polymorphism.',
    mustKnow: [
      'Structs: `type T struct { Field Type }`. Always use named field literals.',
      'Value receiver for read-only; pointer receiver to mutate or avoid copying large structs.',
      'Interfaces are implemented implicitly — having the methods is enough.',
      'Keep interfaces small (1-3 methods); define them near the user, not the implementer.',
      'Embedding promotes fields/methods — composition, not inheritance. No is-a relationship.',
      'Type assertion: `v, ok := i.(T)`. Type switch: `switch v := i.(type)`.',
      'Interface holding a nil pointer is NOT nil — a common source of subtle bugs.',
    ],
    interviewFocus: [
      'Explain implicit interface satisfaction and why Go chose this approach.',
      'Pointer vs value receiver — when to use each and why consistency matters.',
      'Describe the nil interface pitfall with a concrete example.',
      'How does embedding differ from inheritance? What can\'t you do with embedding?',
      'What does "accept interfaces, return concrete types" mean in practice?',
    ],
  };
}
