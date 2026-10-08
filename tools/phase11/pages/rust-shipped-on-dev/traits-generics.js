module.exports = {
  slug: 'traits-generics',
  subtitle: 'Define shared behaviour with traits, write code once for many types with generics and bounds, and choose between static dispatch (impl Trait) and dynamic dispatch (dyn Trait).',
  readingTime: 26,
  prerequisites: [{ label: 'Structs & Enums', route: '/rust/structs-enums' }, { label: 'Ownership & Borrowing', route: '/rust/ownership-borrowing' }],
  apis: ['trait / impl Trait for Type', 'fn f<T: Trait>(x: T)', 'where clauses', 'impl Trait', 'Box<dyn Trait>', 'associated types'],
  tip: 'Default to generics (static dispatch) and switch to dyn Trait when you need a collection of different types, want to cut compile times and binary size, or need to choose an implementation at runtime.',
  gotchas: [
    'The orphan rule: you can implement a trait for a type only if the trait or the type is defined in your crate — wrap foreign types in a newtype otherwise.',
    'Returning impl Trait still means ONE concrete type; two branches returning different types need Box<dyn Trait> or an enum.',
    'Not every trait can be used as dyn Trait: generic methods or methods returning Self make a trait not dyn-compatible (formerly called "object safe").',
  ],
  quickRef: [
    { name: 'trait Summary { fn summarize(&self) -> String; }', type: 'syntax', desc: 'Declare required methods (and optional default implementations)' },
    { name: 'impl Summary for Article { .. }', type: 'syntax', desc: 'Implement a trait for a type' },
    { name: 'fn notify<T: Summary>(item: &T)', type: 'syntax', desc: 'Generic with a trait bound — monomorphised per concrete type' },
    { name: 'where T: Display + Clone', type: 'constraint', desc: 'Readable form for several bounds' },
    { name: 'fn f(x: &impl Summary)', type: 'syntax', desc: 'Argument-position impl Trait: shorthand for an anonymous generic' },
    { name: 'fn make() -> impl Iterator<Item = u32>', type: 'syntax', desc: 'Return-position impl Trait: one concrete type, name hidden' },
    { name: 'Box<dyn Summary> / &dyn Summary', type: 'type', desc: 'Trait object: dynamic dispatch through a vtable' },
    { name: 'type Item;', type: 'syntax', desc: 'Associated type: one implementation per type (Iterator::Item)' },
    { name: 'trait Pet: Animal', type: 'syntax', desc: 'Supertrait: implementing Pet requires Animal' },
    { name: 'impl<T: Display> MyTrait for T', type: 'syntax', desc: 'Blanket implementation for every type meeting a bound' },
  ],
  theory: [
    { heading: 'Traits define shared behaviour', points: [
      'A trait lists method signatures a type must provide. Types opt in explicitly with `impl Trait for Type` — there is no implicit structural typing.',
      'Traits can provide default method bodies that implementors may override; defaults can call other (required) methods of the same trait.',
      'Standard traits power the language: `Display` for `{}`, `Debug` for `{:?}`, `Clone`, `PartialEq` for `==`, `Iterator` for `for` loops, `Add` for `+`, `From`/`Into` for conversions, `Drop` for destructors.',
      'The orphan rule (coherence) allows `impl Trait for Type` only when the trait or the type is local to your crate. To add a foreign trait to a foreign type, wrap the type in a newtype.',
    ] },
    { heading: 'Generics and trait bounds', points: [
      'Generic functions and types (`fn largest<T: PartialOrd>(v: &[T]) -> &T`, `struct Stack<T>`) work for any type that satisfies the bounds.',
      'Bounds say what a generic type must support; without `T: PartialOrd` you cannot compare two `T` values.',
      'The compiler monomorphises generics: it generates a specialised copy for each concrete type used. The result is as fast as hand-written code, at the cost of compile time and binary size.',
      '`where` clauses keep complex signatures readable, and allow bounds on things other than type parameters (`where Vec<T>: Debug`).',
      'Associated types (`type Item;`) are used when each implementing type has exactly one natural choice; generic trait parameters (`trait From<T>`) allow one type to implement the trait many times.',
    ] },
    { heading: 'impl Trait vs dyn Trait', points: [
      'In argument position `fn f(x: impl Display)` is shorthand for a generic parameter. In return position `fn f() -> impl Iterator<Item = u32>` returns one concrete type whose name is hidden — essential for closures and iterator chains, which have unnameable types.',
      '`dyn Trait` is a trait object: a fat pointer (data pointer + vtable pointer) behind `&`, `Box` or `Arc`. Calls go through the vtable at runtime (dynamic dispatch).',
      'Use `dyn` for heterogeneous collections (`Vec<Box<dyn Shape>>`), plug-in style designs, or to reduce code bloat in large generic code paths.',
      'Only dyn-compatible traits (historically "object safe") can become trait objects: methods cannot be generic and cannot return `Self` (unless bounded with `where Self: Sized`).',
      'Since Rust 1.86 a `&dyn SubTrait` can be upcast to `&dyn SuperTrait` directly.',
    ] },
    { heading: 'Useful patterns', points: [
      'Blanket impls implement a trait for every type meeting a bound — the standard library\'s `impl<T: Display> ToString for T` is why every `Display` type has `.to_string()`.',
      'Supertraits (`trait Named: Display`) let default methods rely on the supertrait\'s methods.',
      'Marker traits like `Send`, `Sync`, `Copy` and `Sized` have no methods; they tell the compiler something about a type.',
      'Implementing `From<A> for B` gives you `Into<B> for A` for free; accept `impl Into<String>` to let callers pass `&str` or `String`.',
      'Since Rust 1.75 traits can declare `async fn` methods; they are usable with static dispatch, while `dyn` with async methods still needs helper crates or manual boxing.',
    ] },
  ],
  codeTabs: [
    { label: 'Traits & defaults', language: 'rust', code: `use std::fmt;

trait Summary {
    fn author(&self) -> String;
    // default method that uses a required one
    fn summarize(&self) -> String {
        format!("(Read more from {}...)", self.author())
    }
}

struct Tweet { user: String, text: String }
struct Article { title: String, by: String }

impl Summary for Tweet {
    fn author(&self) -> String { format!("@{}", self.user) }
    fn summarize(&self) -> String { format!("{}: {}", self.author(), self.text) } // override
}

impl Summary for Article {
    fn author(&self) -> String { self.by.clone() }   // keeps the default summarize
}

// Implementing a std trait gives us {} formatting and .to_string()
impl fmt::Display for Article {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "\\"{}\\" by {}", self.title, self.by)
    }
}

fn main() {
    let t = Tweet { user: "rustlang".into(), text: "1.94 is out".into() };
    let a = Article { title: "Traits".into(), by: "Ferris".into() };
    println!("{}", t.summarize());
    println!("{}", a.summarize());
    println!("{a} / {}", a.to_string().len()); // to_string via blanket impl
}` },
    { label: 'Generics & bounds', language: 'rust', code: `use std::fmt::Debug;

// Works for any T that can be compared
fn largest<T: PartialOrd>(items: &[T]) -> Option<&T> {
    let mut best = items.first()?;
    for item in items {
        if item > best { best = item; }
    }
    Some(best)
}

// where clause for several bounds
fn describe<T, U>(a: T, b: U) -> String
where
    T: Debug + Clone,
    U: Into<String>,
{
    format!("{:?} and {}", a.clone(), b.into())
}

// A generic type with an impl that has its own bound
#[derive(Debug, Default)]
struct Stack<T> { items: Vec<T> }

impl<T> Stack<T> {
    fn push(&mut self, item: T) { self.items.push(item); }
    fn pop(&mut self) -> Option<T> { self.items.pop() }
}

impl<T: std::fmt::Display> Stack<T> {
    fn render(&self) -> String {
        self.items.iter().map(|i| i.to_string()).collect::<Vec<_>>().join(" | ")
    }
}

fn main() {
    println!("{:?} {:?}", largest(&[3, 9, 2]), largest(&["pear", "apple"]));
    println!("{}", describe(vec![1, 2], "owned or borrowed"));
    let mut s = Stack::default();
    s.push(1.5); s.push(2.5);
    println!("{} / popped {:?}", s.render(), s.pop());
}` },
    { label: 'impl Trait vs dyn Trait', language: 'rust', code: `trait Shape {
    fn area(&self) -> f64;
    fn name(&self) -> &'static str { "shape" }
}

struct Circle(f64);
struct Square(f64);
impl Shape for Circle {
    fn area(&self) -> f64 { 3.14159 * self.0 * self.0 }
    fn name(&self) -> &'static str { "circle" }
}
impl Shape for Square { fn area(&self) -> f64 { self.0 * self.0 } }

// Static dispatch: one copy compiled per concrete type
fn print_area(s: &impl Shape) { println!("{} {:.1}", s.name(), s.area()); }

// Return-position impl Trait: a single hidden concrete type
fn evens(limit: u32) -> impl Iterator<Item = u32> {
    (0..limit).filter(|n| n % 2 == 0)
}

// Dynamic dispatch: different types behind one pointer type
fn make_shape(round: bool, size: f64) -> Box<dyn Shape> {
    if round { Box::new(Circle(size)) } else { Box::new(Square(size)) }
}

fn main() {
    print_area(&Circle(1.0));
    let shapes: Vec<Box<dyn Shape>> = vec![make_shape(true, 2.0), make_shape(false, 3.0)];
    let total: f64 = shapes.iter().map(|s| s.area()).sum();
    println!("total area {total:.2}");
    println!("{:?}", evens(10).collect::<Vec<_>>());
    // A trait object is a fat pointer: data + vtable
    println!("{} vs {}", std::mem::size_of::<&Circle>(), std::mem::size_of::<&dyn Shape>());
}` },
    { label: 'Newtype & upcasting', language: 'rust', code: `use std::fmt;

// Orphan rule: we can't impl Display for Vec<String> (both foreign),
// so we wrap it in a local newtype.
struct List(Vec<String>);

impl fmt::Display for List {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}

trait Animal { fn name(&self) -> String; }
trait Pet: Animal {                         // supertrait
    fn greet(&self) -> String { format!("{} wags", self.name()) }
}

struct Dog;
impl Animal for Dog { fn name(&self) -> String { "Rex".into() } }
impl Pet for Dog {}

fn main() {
    println!("{}", List(vec!["a".into(), "b".into()]));
    let pet: &dyn Pet = &Dog;
    let animal: &dyn Animal = pet;          // trait upcasting (Rust 1.86+)
    println!("{} / {}", pet.greet(), animal.name());
}` },
  ],
  mistakes: [
    { title: 'Missing trait bound on a generic', checkWrong: true, wrong: `fn largest<T>(items: &[T]) -> &T {
    let mut best = &items[0];
    for i in items { if i > best { best = i; } }
    best
}`, right: `fn largest<T: PartialOrd>(items: &[T]) -> &T {
    let mut best = &items[0];
    for i in items { if i > best { best = i; } }
    best
}`, explanation: 'Generic code may only use what the bounds promise. Without T: PartialOrd the compiler rejects > with E0369 and suggests adding the bound.' },
    { title: 'Returning different types from impl Trait', checkWrong: true, prelude: `trait Shape { fn area(&self) -> f64; }
struct C; struct S;
impl Shape for C { fn area(&self) -> f64 { 1.0 } }
impl Shape for S { fn area(&self) -> f64 { 2.0 } }`, wrong: `fn make(round: bool) -> impl Shape {
    if round { C } else { S }
}`, right: `fn make(round: bool) -> Box<dyn Shape> {
    if round { Box::new(C) } else { Box::new(S) }
}`, explanation: 'impl Trait in return position stands for exactly one concrete type, so the branches must agree (E0308 mismatched types). Use Box<dyn Trait> or an enum when the type varies at runtime.' },
    { title: 'Trying to use a non-dyn-compatible trait as an object', wrong: `trait Cloner { fn dup(&self) -> Self; }
let v: Vec<Box<dyn Cloner>> = vec![]; // error: not dyn compatible`, right: `trait Cloner { fn dup_box(&self) -> Box<dyn Cloner>; }`, explanation: 'A method returning Self cannot work through a vtable because the size of Self is unknown. Return Box<dyn Trait> instead, or add where Self: Sized to exclude that method from trait objects.' },
    { title: 'Implementing a foreign trait for a foreign type', wrong: `impl std::fmt::Display for Vec<u8> { /* E0117: orphan rule */ }`, right: `struct Bytes(Vec<u8>);
impl std::fmt::Display for Bytes { /* ... */ }`, explanation: 'Coherence forbids implementing a trait from another crate for a type from another crate, so two crates cannot provide conflicting impls. Wrap the type in a local newtype.' },
    { title: 'Using dyn Trait everywhere by default', wrong: `fn total(items: &[Box<dyn Priced>]) -> u64 // forces boxing for every caller`, right: `fn total<T: Priced>(items: &[T]) -> u64      // static dispatch
// keep dyn for genuinely mixed collections`, explanation: 'Dynamic dispatch prevents inlining and forces heap allocation when boxing. Prefer generics unless you need runtime polymorphism or want to limit monomorphisation bloat.' },
  ],
  challenge: {
    title: 'A pluggable notification system',
    language: 'rust',
    description: 'Define trait Notifier { fn channel(&self) -> &str; fn send(&self, to: &str, msg: &str) -> String; fn send_all(&self, to: &[&str], msg: &str) -> Vec<String> } where send_all has a default implementation calling send. Implement it for Email { from: String } and Sms { sender_id: u16 }. Write broadcast(notifiers: &[Box<dyn Notifier>], to: &str, msg: &str) using dynamic dispatch, and a generic loudest<N: Notifier>(n: &N, msg: &str) -> String that sends msg uppercased.',
    hints: ['A default method body can call self.send(...).', 'Box<dyn Notifier> lets Email and Sms live in one Vec.', 'msg.to_uppercase() returns a new String; pass &upper to send.'],
    starterCode: `trait Notifier {
    fn channel(&self) -> &str;
    fn send(&self, to: &str, msg: &str) -> String;
    fn send_all(&self, to: &[&str], msg: &str) -> Vec<String> {
        todo!()
    }
}

struct Email { from: String }
struct Sms { sender_id: u16 }

fn main() {}`,
    solution: `trait Notifier {
    fn channel(&self) -> &str;
    fn send(&self, to: &str, msg: &str) -> String;
    fn send_all(&self, to: &[&str], msg: &str) -> Vec<String> {
        to.iter().map(|t| self.send(t, msg)).collect()
    }
}

struct Email { from: String }
struct Sms { sender_id: u16 }

impl Notifier for Email {
    fn channel(&self) -> &str { "email" }
    fn send(&self, to: &str, msg: &str) -> String {
        format!("[email {} -> {to}] {msg}", self.from)
    }
}

impl Notifier for Sms {
    fn channel(&self) -> &str { "sms" }
    fn send(&self, to: &str, msg: &str) -> String {
        format!("[sms #{} -> {to}] {msg}", self.sender_id)
    }
}

fn broadcast(notifiers: &[Box<dyn Notifier>], to: &str, msg: &str) -> Vec<String> {
    notifiers.iter().map(|n| n.send(to, msg)).collect()
}

fn loudest<N: Notifier>(n: &N, msg: &str) -> String {
    let upper = msg.to_uppercase();
    n.send("everyone", &upper)
}

fn main() {
    let all: Vec<Box<dyn Notifier>> = vec![
        Box::new(Email { from: "ops@example.com".into() }),
        Box::new(Sms { sender_id: 42 }),
    ];
    for line in broadcast(&all, "ada", "deploy done") { println!("{line}"); }
    println!("{:?}", Sms { sender_id: 7 }.send_all(&["a", "b"], "hi"));
    println!("{}", loudest(&Email { from: "x@y.z".into() }, "fire drill"));
    println!("channels: {:?}", all.iter().map(|n| n.channel()).collect::<Vec<_>>());
}`,
  },
  quiz: [
    { q: 'What does monomorphisation mean?', options: ['Generics are erased at runtime like Java', 'The compiler generates a specialised copy of generic code for each concrete type used', 'Only one implementation of a trait is allowed', 'Trait objects are converted to generics'], answer: 1, explanation: 'Each use of a generic function with a new type produces specialised code, giving full static dispatch performance at the cost of compile time and binary size.' },
    { q: 'Which is true of fn make() -> impl Iterator<Item = u32>?', options: ['It can return different iterator types from different branches', 'It returns one concrete type whose name is hidden from the caller', 'It allocates the iterator on the heap', 'It uses dynamic dispatch'], answer: 1, explanation: 'Return-position impl Trait is static: one concrete type, chosen by the function, opaque to callers. Different types per branch need Box<dyn Iterator>.' },
    { q: 'What does a &dyn Trait reference contain?', options: ['Just a pointer to the data', 'A pointer to the data and a pointer to the vtable', 'A copy of the data', 'A type ID and a hash'], answer: 1, explanation: 'Trait objects are fat pointers: data pointer plus vtable pointer, so &dyn Shape is twice the size of &Circle.' },
    { q: 'Why might `impl Display for Vec<u8>` be rejected?', options: ['Display is not a real trait', 'Orphan rule: both the trait and the type are foreign to your crate', 'Vec cannot implement traits', 'You must use derive'], answer: 1, explanation: 'Coherence rules require the trait or the type to be local. Wrap Vec<u8> in a newtype to implement Display.' },
    { q: 'When should you prefer an associated type over a generic trait parameter?', options: ['When a type should implement the trait many times with different parameters', 'When each implementing type has exactly one natural choice for the type (like Iterator::Item)', 'Never — they are identical', 'Only for async traits'], answer: 1, explanation: 'Associated types give one implementation per type and simpler call sites. Generic parameters (From<T>) allow several implementations for one type.' },
    { q: 'Which method signature makes a trait unusable as dyn Trait?', options: ['fn name(&self) -> String', 'fn clone_me(&self) -> Self', 'fn len(&self) -> usize', 'fn print(&self)'], answer: 1, explanation: 'Returning Self requires knowing the concrete size, which a vtable call cannot provide. Add where Self: Sized to such methods, or return Box<dyn Trait>.' },
  ],
  qna: [
    { q: 'What is the difference between static and dynamic dispatch?', a: 'With static dispatch (generics, `impl Trait`) the compiler knows the concrete type and calls the method directly — it can inline and optimise, but generates code per type. With dynamic dispatch (`dyn Trait`) the method is looked up through a vtable at runtime, which allows mixing types in one collection and keeps one copy of the code, but adds an indirect call and usually a heap allocation (`Box`). Choose static by default and dynamic when you need runtime polymorphism.' },
    { q: 'What is the orphan rule and how do you work around it?', a: 'You may write `impl Trait for Type` only if `Trait` or `Type` is defined in the current crate. This prevents two crates from providing conflicting implementations. To implement a foreign trait for a foreign type, wrap the type in a local newtype (`struct Wrapper(Vec<u8>)`) and implement the trait for the wrapper; `Deref` can make the wrapper convenient to use.' },
    { q: 'Associated types vs generic parameters on a trait?', a: 'An associated type (`trait Iterator { type Item; }`) means each implementor picks exactly one type, so callers write `I: Iterator<Item = u32>` and type inference is easy. A generic parameter (`trait From<T>`) lets a type implement the trait multiple times for different `T` — `String` implements `From<&str>`, `From<char>` and more. Use an associated type when there is one natural answer per implementing type.' },
    { q: 'What makes a trait dyn-compatible (object safe)?', a: 'A trait object only knows the vtable, not the concrete type. So methods cannot be generic over types (the vtable cannot hold infinitely many instantiations) and cannot return `Self` or take `Self` by value without a `where Self: Sized` bound; the trait cannot require `Self: Sized` itself. Methods that break these rules can be kept by adding `where Self: Sized`, which excludes them from the vtable.' },
    { q: 'What is a blanket implementation?', a: 'An `impl` for every type that satisfies a bound, e.g. `impl<T: Display> ToString for T`. It is how the standard library gives every `Display` type a `to_string` method and every `From` implementation a matching `Into`. Blanket impls are powerful but can conflict with more specific impls, so the coherence rules restrict where they can be written.' },
  ],
  revision: {
    oneLiner: 'Traits define behaviour, generics with bounds reuse code with zero-cost static dispatch, and dyn Trait gives runtime polymorphism through a vtable.',
    mustKnow: [
      'Types implement traits explicitly; default methods reduce boilerplate.',
      'Generic bounds (`T: Trait`, `where`) say what generic code may use.',
      'Generics are monomorphised: fast, but more compile time and code size.',
      'Return-position `impl Trait` is one hidden concrete type; `dyn Trait` is a fat pointer with a vtable.',
      'Orphan rule: the trait or the type must be local — use newtypes otherwise.',
      'Associated types for one-per-type choices; generic params for many impls.',
    ],
    interviewFocus: [
      'Compare static and dynamic dispatch and when to use each.',
      'Explain the orphan rule and the newtype workaround.',
      'Explain dyn compatibility and why returning Self breaks it.',
      'Associated types vs generic parameters.',
    ],
  },
};
