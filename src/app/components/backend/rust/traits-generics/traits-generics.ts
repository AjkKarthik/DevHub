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
  selector: 'app-rust-traits-generics',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './traits-generics.html',
  styleUrl: './traits-generics.scss'
})
export class RustTraitsGenerics {
  readingTime = 28;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Rust 2021+';
  route = 'rust-traits-generics';

  quickRef: QuickRefItem[] = [
    { name: 'trait Name { fn m(&self); }', type: 'keyword', desc: 'Declares a set of methods that types can implement — Rust\'s version of an interface' },
    { name: 'impl Trait for Type { ... }', type: 'syntax', desc: 'Implements a trait for a specific type, supplying the required methods' },
    { name: 'fn f<T: Trait>(x: T)', type: 'constraint', desc: 'A generic function with a trait bound — accepts any type that implements the trait' },
    { name: 'where T: A + B', type: 'constraint', desc: 'A where clause — the same bounds as inline, but easier to read when there are several' },
    { name: 'x: &impl Trait', type: 'syntax', desc: 'Shorthand for a bounded generic parameter — accepts any type implementing the trait' },
    { name: '-> impl Trait', type: 'syntax', desc: 'Returns some single concrete type that implements the trait, without naming it' },
    { name: 'Box<dyn Trait>', type: 'type', desc: 'A trait object — an owned pointer to any type implementing the trait, dispatched at runtime' },
    { name: 'fn m(&self) { ... } in a trait', type: 'syntax', desc: 'A default method body that implementors get for free and may override' },
    { name: 'struct Wrapper<T> { v: T }', type: 'syntax', desc: 'A generic struct — the type parameter is filled in when the struct is used' },
    { name: 'type Output;', type: 'syntax', desc: 'An associated type — a placeholder type an implementor chooses, used by traits like Add and Iterator' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Traits — shared behaviour without inheritance',
      points: [
        'A trait declares a set of method signatures that a type can promise to provide. A type opts in with <code>impl Trait for Type</code>, and from then on can be used anywhere that trait is required.',
        'Rust has no class inheritance. Instead of a base class, you describe capabilities with traits and implement them independently for as many types as you like, including types you did not write.',
        'A trait method can have a DEFAULT body. Implementors inherit it automatically and may override it, so a trait can require one or two methods and provide the rest.',
        'To call a trait method the trait must be in scope, which usually means a <code>use</code> statement. This is why <code>use std::io::Write</code> is needed before you can call write or flush.',
        'The orphan rule says you may implement a trait for a type only if the trait or the type is defined in your own crate. That prevents two libraries from providing conflicting implementations of the same trait for the same type.',
      ]
    },
    {
      heading: 'Generics and monomorphization',
      points: [
        'Generics let one definition work for many types: <code>fn largest&lt;T: PartialOrd&gt;(list: &amp;[T]) -&gt; &amp;T</code> works for integers, floats and chars alike. Structs and enums can be generic too, as <code>Option&lt;T&gt;</code> and <code>Vec&lt;T&gt;</code> are.',
        'Generic code has NO runtime cost. The compiler performs monomorphization: it generates a separate, specialised copy of the function for every concrete type it is used with, so calls are as fast as hand-written code.',
        'The trade-off is compile time and binary size, because each instantiation is compiled separately. Heavy use of generics across many types can make builds slower and executables larger.',
        'Methods for a generic type go in an <code>impl&lt;T&gt;</code> block. You can add extra methods only for certain types with a bounded impl block, such as <code>impl&lt;T: Display&gt; Stack&lt;T&gt;</code>.',
        'Const generics let you be generic over a value, typically an array length: <code>fn sum&lt;const N: usize&gt;(a: [i32; N])</code>. They make fixed-size arrays first-class in generic code.',
      ]
    },
    {
      heading: 'Trait bounds',
      points: [
        'A bound restricts what a generic parameter may be: <code>T: Display</code> means "any type that can be displayed". Without a bound you can do almost nothing with a T, because the compiler knows nothing about it.',
        'Combine bounds with a plus sign, <code>T: Display + Clone</code>. When the list grows, move them to a where clause: <code>fn f&lt;T&gt;(x: T) where T: Display + Clone</code>, which keeps the signature readable.',
        '<code>impl Trait</code> in argument position, as in <code>fn notify(item: &amp;impl Summary)</code>, is shorthand for a generic parameter with that bound. In return position, <code>-&gt; impl Iterator&lt;Item = u32&gt;</code> hides a concrete type but promises exactly one.',
        'A blanket implementation implements a trait for every type meeting a bound. The standard library does this: any type implementing Display automatically gets the ToString trait and its to_string method.',
        'The compiler error for a missing bound points straight at the fix — for example E0369 when you use the comparison operator on an unbounded T. Adding <code>PartialOrd</code> to the bound resolves it.',
      ]
    },
    {
      heading: 'Trait objects and dynamic dispatch',
      points: [
        'When you need values of DIFFERENT types in one collection, use a trait object: <code>Vec&lt;Box&lt;dyn Shape&gt;&gt;</code>. Each element is a pointer to some type implementing Shape, and the actual method is chosen at runtime through a vtable.',
        'Generics give STATIC dispatch: the concrete type is known at compile time, calls can be inlined, and there is no indirection. Trait objects give DYNAMIC dispatch: one compiled function serves every type, at the cost of a pointer lookup per call.',
        'A trait object type such as <code>dyn Shape</code> has no known size, so it must always live behind a pointer: <code>&amp;dyn Shape</code>, <code>Box&lt;dyn Shape&gt;</code> or <code>Rc&lt;dyn Shape&gt;</code>.',
        'Not every trait can be turned into a trait object. It must be "dyn compatible": methods cannot return Self or have their own generic type parameters, or the compiler could not build a vtable. Violations produce error E0038.',
        'A function returning <code>impl Trait</code> must still return ONE concrete type on every path. To return different types depending on a condition, return <code>Box&lt;dyn Trait&gt;</code> instead.',
      ]
    },
    {
      heading: 'The standard traits you will implement constantly',
      points: [
        '<code>Debug</code> and <code>Display</code> control how a value prints with {:?} and {}. Debug can be derived; Display is written by hand.',
        '<code>Clone</code> and <code>Copy</code> control duplication, while <code>PartialEq</code>, <code>Eq</code>, <code>PartialOrd</code> and <code>Ord</code> enable comparison, and <code>Default</code> provides a sensible starting value. All can usually be derived.',
        '<code>From</code> and <code>Into</code> express conversions between types. Implement From and you get Into for free, and the question-mark operator uses From to convert errors.',
        'Operators are traits. Implementing <code>std::ops::Add</code> gives a type the plus operator, and <code>Iterator</code> (with its associated type Item) makes it work with for loops and the whole family of iterator adapters.',
        'An associated type, such as the Output in Add or the Item in Iterator, is a type chosen by each implementor. It keeps signatures short compared with adding another generic parameter to the trait.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Defining Traits',
      language: 'rust',
      code: `trait Summary {
    // Required: every implementor must provide this
    fn author(&self) -> String;

    // Default method: implementors get it for free, and may override it
    fn summarize(&self) -> String {
        format!("(Read more from {}...)", self.author())
    }
}

struct Post {
    author: String,
    title: String,
}

struct Tweet {
    handle: String,
}

impl Summary for Post {
    fn author(&self) -> String {
        self.author.clone()
    }

    // Overrides the default
    fn summarize(&self) -> String {
        format!("{} by {}", self.title, self.author)
    }
}

impl Summary for Tweet {
    fn author(&self) -> String {
        format!("@{}", self.handle)
    }
    // uses the default summarize
}

// Accepts any type that implements Summary
fn notify(item: &impl Summary) {
    println!("Breaking! {}", item.summarize());
}

fn main() {
    let post = Post { author: String::from("ana"), title: String::from("Rust 2024") };
    let tweet = Tweet { handle: String::from("bo") };
    notify(&post);  // Breaking! Rust 2024 by ana
    notify(&tweet); // Breaking! (Read more from @bo...)
}`
    },
    {
      label: 'Generics & Bounds',
      language: 'rust',
      code: `use std::fmt::Display;

// Without the PartialOrd bound, the > comparison would not compile
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

struct Pair<T> {
    a: T,
    b: T,
}

// Methods that exist only when T can be displayed AND compared
impl<T: Display + PartialOrd> Pair<T> {
    fn show_largest(&self) {
        if self.a >= self.b {
            println!("largest is a = {}", self.a);
        } else {
            println!("largest is b = {}", self.b);
        }
    }
}

// A where clause keeps long bounds readable
fn describe<T>(x: T) -> String
where
    T: Display + Clone,
{
    format!("<{}>", x.clone())
}

// impl Trait in return position: one concrete type, not named
fn evens() -> impl Iterator<Item = u32> {
    (0..10).filter(|n| n % 2 == 0)
}

fn main() {
    println!("{}", largest(&[3, 9, 2]));         // 9
    println!("{}", largest(&['a', 'z', 'c']));   // z
    Pair { a: 5, b: 10 }.show_largest();         // largest is b = 10
    println!("{}", describe("x"));               // <x>
    println!("{:?}", evens().collect::<Vec<_>>()); // [0, 2, 4, 6, 8]
}`
    },
    {
      label: 'Trait Objects',
      language: 'rust',
      code: `use std::f64::consts::PI;

trait Shape {
    fn area(&self) -> f64;
    fn name(&self) -> String;
}

struct Circle(f64);
struct Square(f64);

impl Shape for Circle {
    fn area(&self) -> f64 { PI * self.0 * self.0 }
    fn name(&self) -> String { "circle".to_string() }
}

impl Shape for Square {
    fn area(&self) -> f64 { self.0 * self.0 }
    fn name(&self) -> String { "square".to_string() }
}

// Static dispatch: a separate copy is compiled for each concrete S
fn print_static<S: Shape>(shape: &S) {
    println!("{} {:.2}", shape.name(), shape.area());
}

// Dynamic dispatch: one function, the method is looked up at runtime
fn print_dynamic(shape: &dyn Shape) {
    println!("{} {:.2}", shape.name(), shape.area());
}

fn total_area(shapes: &[Box<dyn Shape>]) -> f64 {
    shapes.iter().map(|s| s.area()).sum()
}

fn main() {
    print_static(&Circle(1.0));   // circle 3.14
    print_dynamic(&Square(2.0));  // square 4.00

    // Different concrete types in one collection
    let shapes: Vec<Box<dyn Shape>> = vec![Box::new(Circle(1.0)), Box::new(Square(2.0))];
    println!("{:.2}", total_area(&shapes)); // 7.14
}`
    },
    {
      label: 'Std Traits & Operators',
      language: 'rust',
      code: `use std::fmt;
use std::ops::Add;

#[derive(Debug, Clone, Copy, PartialEq, Default)]
struct Point {
    x: i32,
    y: i32,
}

// Operators are traits: this gives Point the + operator
impl Add for Point {
    type Output = Point; // associated type chosen by the implementor

    fn add(self, other: Point) -> Point {
        Point { x: self.x + other.x, y: self.y + other.y }
    }
}

// Display is written by hand and controls how {} prints
impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

struct Celsius(f64);
struct Fahrenheit(f64);

// Implementing From automatically provides Into
impl From<Celsius> for Fahrenheit {
    fn from(c: Celsius) -> Self {
        Fahrenheit(c.0 * 9.0 / 5.0 + 32.0)
    }
}

fn main() {
    let p = Point { x: 1, y: 2 } + Point { x: 3, y: 4 };
    println!("{p}");                   // (4, 6)
    println!("{:?}", Point::default()); // Point { x: 0, y: 0 }

    let f: Fahrenheit = Celsius(100.0).into();
    println!("{}", f.0); // 212
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting a trait bound on a generic type',
      wrong: `fn largest<T>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest { largest = item; }
    }
    largest
}
// error[E0369]: binary operation > cannot be applied to type &T`,
      right: `fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest { largest = item; }
    }
    largest
}`,
      explanation: 'A bare T could be anything, including a type that cannot be compared, so the compiler allows no operations on it. State the capability you need as a bound and the code compiles for exactly the types that qualify.'
    },
    {
      title: 'Calling a trait method without importing the trait',
      wrong: `fn main() {
    let mut out = std::io::stdout();
    out.flush().unwrap();
}
// error[E0599]: no method named flush found for struct Stdout
// items from traits can only be used if the trait is in scope`,
      right: `use std::io::Write;

fn main() {
    let mut out = std::io::stdout();
    out.flush().unwrap();
}`,
      explanation: 'A trait\'s methods are only callable when the trait itself is in scope. The compiler even suggests the missing use statement, so read the help text under the error.'
    },
    {
      title: 'Implementing a foreign trait for a foreign type',
      wrong: `use std::fmt;

impl fmt::Display for Vec<i32> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { write!(f, "list") }
}
// error[E0117]: only traits defined in the current crate can be implemented for types defined outside of the crate`,
      right: `use std::fmt;

struct IntList(Vec<i32>); // a local newtype wrapper

impl fmt::Display for IntList {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { write!(f, "list of {}", self.0.len()) }
}`,
      explanation: 'The orphan rule requires either the trait or the type to be yours. Wrapping the foreign type in a local newtype satisfies it, and is the standard workaround.'
    },
    {
      title: 'Returning two different types from a function returning impl Trait',
      wrong: `fn make(flag: bool) -> impl Shape {
    if flag { Circle(1.0) } else { Square(1.0) }
}
// error[E0308]: if and else have incompatible types`,
      right: `fn make(flag: bool) -> Box<dyn Shape> {
    if flag { Box::new(Circle(1.0)) } else { Box::new(Square(1.0)) }
}`,
      explanation: 'impl Trait in return position hides ONE concrete type that is fixed at compile time. When the type depends on a runtime condition you need a trait object, so that both branches have the same type: a boxed dyn Shape.'
    },
    {
      title: 'Using a trait object without a pointer',
      wrong: `fn describe(shape: dyn Shape) {
    println!("{}", shape.name());
}
// error[E0277]: the size for values of type dyn Shape cannot be known at compilation time`,
      right: `fn describe(shape: &dyn Shape) {
    println!("{}", shape.name());
}
// or: fn describe(shape: Box<dyn Shape>)`,
      explanation: 'Different types implementing the trait have different sizes, so a bare dyn Shape has no size the compiler can reserve. Put it behind a reference or a Box, which have a known size regardless.'
    },
    {
      title: 'Writing a trait that cannot be made into a trait object',
      wrong: `trait Duplicate {
    fn duplicate(&self) -> Self;
}

fn keep(x: Box<dyn Duplicate>) {}
// error[E0038]: the trait Duplicate is not dyn compatible
// because method duplicate references the Self type in its return type`,
      right: `trait Duplicate {
    fn duplicate(&self) -> Self
    where
        Self: Sized; // excluded from the vtable, so the trait stays dyn compatible
}`,
      explanation: 'A trait object erases the concrete type, so a method returning Self or taking generic parameters cannot be called through it. Either avoid those signatures, return a Box of the trait, or mark the method with where Self: Sized to keep it out of the vtable.'
    },
  ];

  challenge: Challenge = {
    title: 'Generic Stack',
    language: 'rust',
    description: `Build a generic stack and add a method that only exists for displayable types.

Define \`struct Stack<T> { items: Vec<T> }\` with these methods for any T:
- \`fn new() -> Self\`
- \`fn push(&mut self, item: T)\`
- \`fn pop(&mut self) -> Option<T>\`
- \`fn peek(&self) -> Option<&T>\` — the top item, without removing it.
- \`fn len(&self) -> usize\`
- \`fn is_empty(&self) -> bool\`

Then, in a separate impl block that requires \`T: std::fmt::Display\`, add \`fn render(&self) -> String\` returning the items in push order, comma separated, in square brackets.

Example:
\`\`\`
let mut s = Stack::new();
s.push(1); s.push(2); s.push(3);
s.peek()    // Some(3)
s.pop()     // Some(3)
s.render()  // "[1, 2]"
\`\`\``,
    hints: [
      'Wrap a Vec<T> and delegate: push to Vec::push, pop to Vec::pop, peek to slice last().',
      'Put the ordinary methods in impl<T> Stack<T> and render in a second block, impl<T: std::fmt::Display> Stack<T>.',
      'Build the text by mapping each item with to_string(), collecting into a Vec<String>, then joining with ", ".',
      'peek returns Option<&T> — a reference to the top element, not a copy.',
    ],
    starterCode: `struct Stack<T> {
    items: Vec<T>,
}

impl<T> Stack<T> {
    // TODO: new, push, pop, peek, len, is_empty
}

// TODO: an impl block for T: std::fmt::Display that adds render

fn main() {
    // let mut s = Stack::new();
    // s.push(1); s.push(2); s.push(3);
    // println!("{:?}", s.peek());     // Some(3)
    // println!("{:?}", s.pop());      // Some(3)
    // println!("{}", s.render());     // [1, 2]
    // println!("{} {}", s.len(), s.is_empty()); // 2 false
}`,
    solution: `struct Stack<T> {
    items: Vec<T>,
}

impl<T> Stack<T> {
    fn new() -> Self {
        Stack { items: Vec::new() }
    }

    fn push(&mut self, item: T) {
        self.items.push(item);
    }

    fn pop(&mut self) -> Option<T> {
        self.items.pop()
    }

    fn peek(&self) -> Option<&T> {
        self.items.last()
    }

    fn len(&self) -> usize {
        self.items.len()
    }

    fn is_empty(&self) -> bool {
        self.items.is_empty()
    }
}

impl<T: std::fmt::Display> Stack<T> {
    fn render(&self) -> String {
        let parts: Vec<String> = self.items.iter().map(|i| i.to_string()).collect();
        format!("[{}]", parts.join(", "))
    }
}

fn main() {
    let mut s = Stack::new();
    s.push(1);
    s.push(2);
    s.push(3);
    println!("{:?}", s.peek());                // Some(3)
    println!("{:?}", s.pop());                 // Some(3)
    println!("{}", s.render());                // [1, 2]
    println!("{} {}", s.len(), s.is_empty());  // 2 false
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is monomorphization?',
      options: [
        'Converting a generic type into a trait object at runtime',
        'The compiler generating a specialised copy of a generic function for each concrete type it is used with',
        'A garbage collection technique',
        'Removing generics from the source code',
      ],
      answer: 1,
      explanation: 'Monomorphization is why Rust generics have no runtime overhead: each instantiation is compiled to code specific to its types. The cost is longer compile times and larger binaries.'
    },
    {
      q: 'Why does fn largest<T>(list: &[T]) -> &T fail to compile when it compares items with >?',
      options: [
        'The function must return a copy',
        'Generics do not support operators',
        'Slices cannot be compared',
        'A bare T could be any type, so the compiler needs a PartialOrd bound before allowing comparison',
      ],
      answer: 3,
      explanation: 'Without a bound the compiler knows nothing about T. Adding T: PartialOrd states the capability required, and the function then works for every type that has it.'
    },
    {
      q: 'When would you choose Vec<Box<dyn Shape>> over a generic Vec<T>?',
      options: [
        'When you need to store values of several different concrete types in one collection',
        'When all elements are the same type and speed is critical',
        'When you want to avoid traits',
        'Never — they are identical',
      ],
      answer: 0,
      explanation: 'A generic Vec of T holds exactly one concrete type. A vector of boxed trait objects holds pointers to any mix of types implementing the trait, at the cost of dynamic dispatch and a heap allocation per element.'
    },
    {
      q: 'What does the orphan rule forbid?',
      options: [
        'Naming a struct after a trait',
        'Implementing your own trait for your own type',
        'Implementing a trait for a type when neither the trait nor the type is defined in your crate',
        'Using more than one trait bound',
      ],
      answer: 2,
      explanation: 'It prevents two crates from supplying conflicting implementations of the same trait for the same type. Wrap the foreign type in your own newtype to work around it.'
    },
    {
      q: 'A function returns impl Shape, and one branch returns a Circle while another returns a Square. What happens?',
      options: [
        'It compiles with a runtime check',
        'It compiles only in release builds',
        'It compiles and picks the larger type',
        'It fails to compile because impl Trait must be a single concrete type; use Box<dyn Shape> instead',
      ],
      answer: 3,
      explanation: 'The return type is a hidden but single concrete type decided at compile time. Choosing between types at runtime needs a trait object so that both branches share one type.'
    },
    {
      q: 'Why can a bare dyn Shape parameter not be used directly?',
      options: [
        'Its size is unknown at compile time, so it must be behind a pointer such as &dyn Shape or Box<dyn Shape>',
        'It requires the unsafe keyword',
        'It can only be used in main',
        'Traits are not allowed as parameters',
      ],
      answer: 0,
      explanation: 'Different implementors have different sizes, so the compiler cannot reserve stack space for a bare trait object. A reference or Box has a fixed size no matter what it points to.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How is a trait different from an interface in Java or C#?',
      a: 'They serve a similar purpose, but traits can be implemented for types you did not write (subject to the orphan rule), can supply default method bodies, and support associated types. Traits also work with static dispatch through generics, where the compiler inlines the call, so abstraction is often free. There is no inheritance of data; only behaviour is shared.'
    },
    {
      q: 'Should I use generics or trait objects?',
      a: 'Default to generics: they are faster, allow inlining, and every type is known at compile time. Choose trait objects when you truly need different types together in one collection, when the set of types is decided at runtime such as plug-ins, or when you want to reduce the code size that many monomorphized copies produce.'
    },
    {
      q: 'What is the difference between impl Trait and dyn Trait?',
      a: 'impl Trait means "some single concrete type that implements the trait", resolved at compile time with static dispatch. dyn Trait means "any type implementing the trait", resolved at runtime with dynamic dispatch through a vtable. impl Trait is unnamed sugar for generics; dyn Trait is a real type that must live behind a pointer.'
    },
    {
      q: 'What is a blanket implementation?',
      a: 'It implements a trait for every type that satisfies a bound, using a generic impl such as <code>impl&lt;T: Display&gt; ToString for T</code>. It is why every displayable type has to_string without anyone writing it. You can write your own, but the orphan rule limits blanket impls of foreign traits.'
    },
    {
      q: 'What does dyn compatible (object safe) mean?',
      a: 'A trait is dyn compatible when it can be turned into a trait object. A method must not return Self, take generic type parameters, or lack a receiver, because the compiler could not create a vtable entry for it. Methods that break the rules can be excluded with where Self: Sized. Breaking them elsewhere gives error E0038.'
    },
    {
      q: 'What are associated types for?',
      a: 'They let each implementation of a trait choose one related type. Iterator has an associated type Item, and Add has an associated type Output. Compared with making the trait generic, an associated type means a given type can implement the trait only once, and signatures stay much shorter.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Traits describe shared behaviour that types implement, generics with trait bounds write code once for many types at no runtime cost, and trait objects trade a little speed for runtime flexibility.',
    mustKnow: [
      'A trait is implemented with <code>impl Trait for Type</code> and can supply default methods',
      'The trait must be in scope to call its methods, and the orphan rule limits who may implement it',
      'Generics are monomorphized: fast at runtime, but they cost compile time and binary size',
      'Bounds like <code>T: Display + Clone</code> (or a where clause) say what a generic type can do',
      '<code>impl Trait</code> is one hidden concrete type; <code>Box&lt;dyn Trait&gt;</code> allows different types at runtime',
      'A bare <code>dyn Trait</code> is unsized and must sit behind a reference or Box',
      'Operators and conversions are traits: Add, Display, From, Into, Iterator',
    ],
    interviewFocus: [
      'Compare static dispatch with generics to dynamic dispatch with trait objects',
      'What is the orphan rule, and how does the newtype pattern get around it?',
      'Explain what monomorphization is and what it costs',
      'Why can a function returning impl Trait not return two different types?',
      'What makes a trait dyn compatible?',
    ],
  };
}
