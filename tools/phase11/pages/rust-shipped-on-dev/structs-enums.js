module.exports = {
  slug: 'structs-enums',
  subtitle: 'Model data with named, tuple and unit structs and with enums whose variants carry data; attach behaviour with impl blocks, methods and associated functions.',
  readingTime: 20,
  apis: ['struct / tuple struct', 'impl block', '&self / &mut self / self', 'Self::new()', 'enum with data', 'Option<T>', '#[derive(Debug, Clone, PartialEq)]'],
  tip: 'Make illegal states unrepresentable: if a value can only be in one of several shapes, use an enum whose variants each carry exactly the data that shape needs, instead of a struct full of Option fields that must be kept consistent by hand.',
  gotchas: [
    'Field init shorthand only works when the local variable has the same name as the field.',
    'A method taking self (not &self) consumes the value — the caller cannot use it afterwards.',
    'Struct fields are private outside their module unless marked pub, even if the struct itself is pub.',
  ],
  quickRef: [
    { name: 'struct User { name: String, age: u8 }', type: 'syntax', desc: 'Named-field struct; fields are accessed with .name' },
    { name: 'struct Meters(f64);', type: 'syntax', desc: 'Tuple struct — handy for newtypes that give a primitive its own type' },
    { name: 'struct Marker;', type: 'syntax', desc: 'Unit struct with no fields, often used as a type-level tag' },
    { name: 'User { name, ..other }', type: 'syntax', desc: 'Field init shorthand plus struct update syntax (moves remaining fields from other)' },
    { name: 'impl User { fn new(..) -> Self }', type: 'syntax', desc: 'Associated function (no self) — called as User::new(..)' },
    { name: 'fn area(&self) -> f64', type: 'method', desc: 'Method borrowing the value; &mut self to modify, self to consume' },
    { name: 'enum Shape { Circle(f64), Rect { w: f64, h: f64 } }', type: 'syntax', desc: 'Each variant can hold tuple-like or named data' },
    { name: 'Option<T>', type: 'type', desc: 'Some(T) or None — Rust has no null' },
    { name: '#[derive(Debug, Clone, PartialEq, Default)]', type: 'decorator', desc: 'Auto-generate common trait implementations' },
  ],
  theory: [
    { heading: 'Three kinds of struct', points: [
      'Named-field structs group related data: `struct Order { id: u64, total_cents: u64 }`. Construct with every field set, in any order.',
      'Tuple structs name a tuple: `struct Rgb(u8, u8, u8)`. The newtype pattern `struct UserId(u64)` prevents mixing up two `u64`s with different meanings at zero runtime cost.',
      'Unit structs (`struct Utc;`) have no fields; they are useful as markers or as implementors of a trait that needs no state.',
      'Struct update syntax `Config { verbose: true, ..base }` copies or moves the remaining fields from `base`; if any moved field is not `Copy`, `base` can no longer be used as a whole.',
    ] },
    { heading: 'impl blocks, methods and associated functions', points: [
      'Behaviour goes in `impl Type { ... }`. A type can have several impl blocks.',
      'Associated functions have no `self` parameter and are called with `Type::name()`; `new` is a convention, not a keyword.',
      'Methods take `&self` (read), `&mut self` (modify) or `self` (consume and possibly transform into something else, like a builder\'s `build(self)`).',
      'Method calls auto-reference: `rect.area()` works whether `rect` is a value, `&Rect` or `&mut Rect` — the compiler inserts `&`, `&mut` or `*` as needed.',
      '`Self` inside an impl is an alias for the implementing type, which keeps signatures short and rename-proof.',
    ] },
    { heading: 'Enums with data', points: [
      'An enum value is exactly one of its variants. Variants can carry no data (`Quit`), tuple data (`Move(i32, i32)`) or named fields (`Resize { w: u32, h: u32 }`).',
      'Enums can have impl blocks too, so behaviour sits next to the data that drives it.',
      'Unlike C enums, Rust enums are tagged unions: the compiler tracks which variant is active and only lets you read its data through pattern matching.',
      'The size of an enum is roughly the size of its largest variant plus a tag; very large variants can be boxed to keep the enum small.',
    ] },
    { heading: 'Option instead of null', points: [
      '`Option<T>` is a normal enum: `Some(T)` or `None`. Because it is a different type from `T`, you cannot accidentally use a missing value as if it were present.',
      'Common helpers: `unwrap_or(default)`, `map`, `and_then`, `ok_or(err)`, `as_ref()`, `take()`; `?` works on `Option` inside a function that returns `Option`.',
      '`Option<&T>` and `Option<Box<T>>` are the same size as a plain pointer — the "null pointer optimisation" uses the null value to represent `None`.',
      'Prefer an enum with named variants over `Option<bool>` or several related `Option` fields when the states have meaning.',
    ] },
    { heading: 'Derives', points: [
      '`#[derive(Debug)]` enables `{:?}` printing; `#[derive(Clone, Copy)]` enables duplication; `PartialEq`/`Eq` enable `==`; `PartialOrd`/`Ord` enable ordering; `Hash` enables use as a `HashMap` key; `Default` provides `Type::default()`.',
      'Derives only work when every field implements the same trait.',
      'Derived `PartialOrd` on enums orders by variant declaration order, then by field values.',
    ] },
  ],
  codeTabs: [
    { label: 'Structs & methods', language: 'rust', code: `#[derive(Debug, Clone, PartialEq)]
struct Rect {
    width: f64,
    height: f64,
}

impl Rect {
    // associated function (constructor)
    fn new(width: f64, height: f64) -> Self {
        Self { width, height }      // field init shorthand
    }

    fn square(size: f64) -> Self {
        Self::new(size, size)
    }

    fn area(&self) -> f64 {           // read-only
        self.width * self.height
    }

    fn scale(&mut self, factor: f64) { // modifies in place
        self.width *= factor;
        self.height *= factor;
    }

    fn into_square(self) -> Rect {     // consumes self
        let side = self.width.max(self.height);
        Rect::square(side)
    }
}

// Newtype: a distinct type with no runtime cost
#[derive(Debug, Clone, Copy, PartialEq)]
struct Meters(f64);

fn main() {
    let mut r = Rect::new(3.0, 4.0);
    r.scale(2.0);
    println!("{r:?} area={}", r.area());

    let wide = Rect { width: 10.0, ..r.clone() }; // update syntax
    println!("{}", wide.area());

    let sq = r.into_square();   // r is moved here
    println!("{sq:?}");

    let d = Meters(5.5);
    println!("{} m", d.0);
}` },
    { label: 'Enums with data', language: 'rust', code: `#[derive(Debug)]
enum Command {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    Color(u8, u8, u8),
}

impl Command {
    fn describe(&self) -> String {
        match self {
            Command::Quit => "quit".to_string(),
            Command::Move { x, y } => format!("move to ({x}, {y})"),
            Command::Write(text) => format!("write {} chars", text.len()),
            Command::Color(r, g, b) => format!("color #{r:02x}{g:02x}{b:02x}"),
        }
    }
}

fn main() {
    let cmds = vec![
        Command::Move { x: 3, y: -1 },
        Command::Write(String::from("hello")),
        Command::Color(255, 128, 0),
        Command::Quit,
    ];
    for c in &cmds {
        println!("{}", c.describe());
    }
}` },
    { label: 'Option in practice', language: 'rust', code: `#[derive(Debug, Default)]
struct Profile {
    nickname: Option<String>,
    age: Option<u8>,
}

fn display_name(p: &Profile, real: &str) -> String {
    // as_deref: Option<String> -> Option<&str>
    p.nickname.as_deref().unwrap_or(real).to_string()
}

fn birth_year(p: &Profile, current: u16) -> Option<u16> {
    let age = p.age?;              // early-return None if missing
    Some(current - age as u16)
}

fn main() {
    let a = Profile { nickname: Some("Ace".into()), age: Some(30) };
    let b = Profile::default();
    println!("{} {:?}", display_name(&a, "Ada"), birth_year(&a, 2026));
    println!("{} {:?}", display_name(&b, "Bo"), birth_year(&b, 2026));

    // Null pointer optimisation: no extra space for None
    println!("{} {}",
        std::mem::size_of::<&u64>(),
        std::mem::size_of::<Option<&u64>>());
}` },
  ],
  mistakes: [
    { title: 'Several Option fields instead of an enum', wrong: `struct Payment {
    card_number: Option<String>,
    iban: Option<String>,
    paypal_email: Option<String>,
}`, right: `enum Payment {
    Card { number: String },
    BankTransfer { iban: String },
    PayPal { email: String },
}`, explanation: 'The struct allows nonsensical states (none set, or two set) that every caller must guard against. The enum makes exactly one method present, and match forces each case to be handled.' },
    { title: 'Using a value after a consuming method', checkWrong: true, prelude: `struct Builder { name: String }
impl Builder { fn build(self) -> String { self.name } }`, wrapFn: true, wrong: `let b = Builder { name: "x".into() };
let s = b.build();
println!("{}", b.name);`, right: `let b = Builder { name: "x".into() };
let s = b.build(); // b is gone; use s
println!("{s}");`, explanation: 'build takes self, so it moves the builder (E0382 on later use). That is usually intentional for builders and conversions; take &self if the caller needs to keep the value.' },
    { title: 'Forgetting derive(Debug) and then printing', checkWrong: true, wrapFn: true, wrong: `struct Point { x: i32, y: i32 }
let p = Point { x: 1, y: 2 };
println!("{:?}", p);`, right: `#[derive(Debug)]
struct Point { x: i32, y: i32 }
let p = Point { x: 1, y: 2 };
println!("{:?}", p);`, explanation: '{:?} requires the Debug trait. Add #[derive(Debug)] (and Clone, PartialEq etc. as needed) — the compiler error E0277 even suggests it.' },
    { title: 'Using primitive types for everything', wrong: `fn transfer(from: u64, to: u64, amount: u64) {}
transfer(amount, from_id, to_id); // compiles, wrong order`, right: `struct AccountId(u64);
struct Cents(u64);
fn transfer(from: AccountId, to: AccountId, amount: Cents) {}`, explanation: 'Three u64 parameters are easy to swap. Newtypes make the mistake a compile error and document intent, with no runtime overhead.' },
  ],
  challenge: {
    title: 'A traffic light state machine',
    language: 'rust',
    description: 'Model a traffic light with enum Light { Red, Green, Yellow }. Implement next(self) -> Light following Red → Green → Yellow → Red, and duration_secs(&self) -> u32 (Red 30, Green 25, Yellow 5). Add a struct Intersection { name: String, light: Light, ticks: u32 } with a method advance(&mut self) that moves to the next light and counts ticks. In main, advance 4 times and print the light and its duration each time.',
    hints: ['Derive Debug, Clone, Copy and PartialEq on Light so it can be printed and copied.', 'next can take self because Light is Copy.', 'In advance, write self.light = self.light.next();'],
    starterCode: `#[derive(Debug, Clone, Copy, PartialEq)]
enum Light { Red, Green, Yellow }

impl Light {
    fn next(self) -> Light { todo!() }
    fn duration_secs(&self) -> u32 { todo!() }
}

struct Intersection { name: String, light: Light, ticks: u32 }

impl Intersection {
    fn advance(&mut self) { todo!() }
}

fn main() {
    let mut i = Intersection { name: "Main & 5th".into(), light: Light::Red, ticks: 0 };
    for _ in 0..4 { i.advance(); }
}`,
    solution: `#[derive(Debug, Clone, Copy, PartialEq)]
enum Light { Red, Green, Yellow }

impl Light {
    fn next(self) -> Light {
        match self {
            Light::Red => Light::Green,
            Light::Green => Light::Yellow,
            Light::Yellow => Light::Red,
        }
    }
    fn duration_secs(&self) -> u32 {
        match self {
            Light::Red => 30,
            Light::Green => 25,
            Light::Yellow => 5,
        }
    }
}

struct Intersection { name: String, light: Light, ticks: u32 }

impl Intersection {
    fn advance(&mut self) {
        self.light = self.light.next();
        self.ticks += 1;
        println!("{} tick {}: {:?} for {}s", self.name, self.ticks, self.light, self.light.duration_secs());
    }
}

fn main() {
    let mut i = Intersection { name: "Main & 5th".into(), light: Light::Red, ticks: 0 };
    for _ in 0..4 { i.advance(); }
    // Green 25s, Yellow 5s, Red 30s, Green 25s
    assert_eq!(i.light, Light::Green);
}`,
  },
  quiz: [
    { q: 'How is an associated function such as new called?', options: ['instance.new()', 'Type::new()', 'new Type()', 'Type.new()'], answer: 1, explanation: 'Associated functions have no self parameter and are called through the type path with ::.' },
    { q: 'What happens to the original value after calling a method that takes self (not &self)?', options: ['It is copied', 'It is moved into the method and cannot be used afterwards (unless it is Copy)', 'It is borrowed until the method returns', 'It becomes immutable'], answer: 1, explanation: 'A self receiver takes ownership. For non-Copy types the caller loses access, which is how builders and into_* conversions work.' },
    { q: 'Which statement about Rust enums is true?', options: ['Variants can only be integers', 'Each variant can carry different data, and the active variant is tracked', 'You can read any variant\'s fields without matching', 'Enums cannot have methods'], answer: 1, explanation: 'Rust enums are tagged unions: each variant has its own payload and the compiler only allows access through pattern matching.' },
    { q: 'What is the size of Option<&u64> on a 64-bit platform?', options: ['16 bytes', '9 bytes', '8 bytes', '1 byte'], answer: 2, explanation: 'References are never null, so the compiler uses the null value to represent None (the null pointer optimisation). The Option adds no space.' },
    { q: 'What is the main benefit of the newtype pattern struct UserId(u64)?', options: ['It makes the value heap allocated', 'It prevents mixing up values with the same primitive type, at no runtime cost', 'It makes the field public', 'It enables automatic serialisation'], answer: 1, explanation: 'A distinct type turns a swapped-argument bug into a compile error and documents meaning. The wrapper compiles away.' },
  ],
  qna: [
    { q: 'When should you use a struct vs an enum?', a: 'Use a struct when a value has all of its fields at once ("a user has a name AND an email"). Use an enum when a value is one of several alternatives, each with its own data ("a payment is a card OR a bank transfer OR PayPal"). Combining them is common: an enum of structs, or a struct with an enum field.' },
    { q: 'What are the three ways a method can take self?', a: '`&self` borrows immutably and is the default for getters and calculations. `&mut self` borrows mutably to change fields in place. `self` takes ownership, used when the method consumes or transforms the value (builders, `into_*` conversions, closing a resource). There is also `self: Box<Self>` and other smart-pointer receivers for advanced cases.' },
    { q: 'Why does Rust use Option instead of null?', a: 'With null, any reference might be missing and the type system cannot tell you which. `Option<T>` makes "might be missing" part of the type: you cannot call a `T` method on an `Option<T>` without first handling `None`, so null-pointer errors become compile errors. Thanks to the null pointer optimisation `Option<&T>` costs nothing extra.' },
    { q: 'What does "make illegal states unrepresentable" mean in Rust?', a: 'Design types so that invalid combinations cannot be constructed. For example, instead of a `Connection` struct with `socket: Option<TcpStream>` and `state: String`, use `enum Connection { Disconnected, Connecting { attempt: u32 }, Connected(TcpStream) }`. Code that receives a `Connected` value knows a socket exists. Enums, newtypes and private fields with validating constructors are the main tools.' },
  ],
  revision: {
    oneLiner: 'Structs hold data that exists together, enums hold one of several alternatives, and impl blocks attach behaviour — together they let the type system rule out invalid states.',
    mustKnow: [
      'Named, tuple and unit structs; the newtype pattern costs nothing at runtime.',
      'Associated functions use `Type::f()`; methods take `&self`, `&mut self` or `self`.',
      'Enum variants can carry different data; access is only through matching.',
      '`Option<T>` replaces null; `?` and helpers like `unwrap_or`, `map`, `as_deref` work with it.',
      '`#[derive(...)]` generates Debug, Clone, PartialEq, Hash, Default and more.',
    ],
    interviewFocus: [
      'Explain the difference between `&self`, `&mut self` and `self` receivers.',
      'Model a domain with an enum instead of several Option fields.',
      'Explain how Option eliminates null-pointer errors and the null pointer optimisation.',
    ],
  },
};
