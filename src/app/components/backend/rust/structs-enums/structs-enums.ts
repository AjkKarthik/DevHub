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
  selector: 'app-rust-structs-enums',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './structs-enums.html',
  styleUrl: './structs-enums.scss'
})
export class RustStructsEnums {
  readingTime = 25;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  since = 'Rust 2021+';
  route = 'rust-structs-enums';

  quickRef: QuickRefItem[] = [
    { name: 'struct Point { x: i32, y: i32 }', type: 'syntax', desc: 'A struct with named fields — the everyday way to group related data into one type' },
    { name: 'struct Color(u8, u8, u8);', type: 'syntax', desc: 'A tuple struct — fields accessed by position (c.0), useful for newtypes' },
    { name: 'struct Marker;', type: 'syntax', desc: 'A unit struct — no fields, used as a marker or to implement a trait on nothing' },
    { name: 'User { email, ..old }', type: 'syntax', desc: 'Field init shorthand plus struct update syntax — fills remaining fields from another instance' },
    { name: 'impl Point { ... }', type: 'syntax', desc: 'Attaches methods and associated functions to a type without any inheritance' },
    { name: '&self / &mut self / self', type: 'syntax', desc: 'Method receivers: borrow to read, borrow to modify, or consume the value entirely' },
    { name: 'Type::new(...)', type: 'function', desc: 'An associated function — no self receiver, called with :: rather than a dot' },
    { name: 'enum Shape { Circle(f64), Point }', type: 'syntax', desc: 'A sum type — a value is exactly ONE of the variants, and each variant can carry its own data' },
    { name: '#[derive(Debug, Clone)]', type: 'decorator', desc: 'Asks the compiler to generate common trait implementations for your type' },
    { name: 'Option', type: 'type', desc: 'An ordinary standard-library enum with variants Some(value) and None — Rust has no null' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Structs — grouping data into a type',
      points: [
        'A struct groups named fields into one type: <code>struct User { username: String, active: bool }</code>. You create an instance by naming every field, in any order.',
        'Field init shorthand lets you write <code>User { username, active }</code> when a local variable has the same name as the field, instead of <code>username: username</code>.',
        'Struct update syntax <code>User { active: false, ..old }</code> fills every unspecified field from another instance. Beware: any non-Copy field taken from <code>old</code> is MOVED out of it, so <code>old</code> is only partially usable afterwards.',
        'Tuple structs (<code>struct Meters(f64);</code>) give a distinct type to a tuple, which is the basis of the "newtype" pattern; unit structs (<code>struct Marker;</code>) have no fields at all.',
        'Mutability belongs to the binding, not to individual fields. If you declare <code>let mut user</code> you can change any field; with plain <code>let</code> you can change none of them.',
      ]
    },
    {
      heading: 'impl blocks, methods and associated functions',
      points: [
        'Behaviour is attached to a type in an <code>impl</code> block. There is no inheritance — data lives in the struct or enum, behaviour lives in impl blocks and traits.',
        'A function whose first parameter is <code>self</code>, <code>&amp;self</code> or <code>&amp;mut self</code> is a METHOD, called with dot syntax: <code>rect.area()</code>. The receiver decides whether it reads, modifies or consumes the value.',
        '<code>&amp;self</code> borrows immutably, <code>&amp;mut self</code> borrows mutably, and plain <code>self</code> takes ownership — after calling a consuming method the original value can no longer be used.',
        'A function in an impl block with NO self parameter is an ASSOCIATED FUNCTION, called with a double colon: <code>Rectangle::new(3, 4)</code>. Constructors like <code>new</code> are just ordinary associated functions by convention.',
        '<code>Self</code> is an alias for the type the impl block is for. A type may have several impl blocks, which is useful when organising large types or adding methods conditionally.',
      ]
    },
    {
      heading: 'Enums — values that are exactly one of several variants',
      points: [
        'An enum defines a type whose value is exactly ONE of a fixed set of variants. Unlike enums in many languages, each variant can carry its own different data.',
        'Variants can be unit-like (<code>Quit</code>), tuple-like (<code>Write(String)</code>) or struct-like (<code>Move { x: i32, y: i32 }</code>), and one enum can mix all three styles.',
        'This makes enums a true sum type: <code>Shape::Circle { radius }</code> and <code>Shape::Rectangle { width, height }</code> are different shapes of data under one type, and the compiler knows which variant you hold.',
        'You get the data back out with pattern matching (<code>match</code>, <code>if let</code>), which forces you to handle each variant. The full toolkit for that is the next topic.',
        'An enum value takes as much memory as its largest variant plus a small tag identifying which variant is active — there is no hidden allocation.',
      ]
    },
    {
      heading: 'Option is just an enum — modelling absence',
      points: [
        'Rust has no null. A value that might be absent is wrapped in the standard-library enum <code>Option&lt;T&gt;</code>, defined as <code>enum Option&lt;T&gt; { None, Some(T) }</code>.',
        'Because <code>Option&lt;String&gt;</code> and <code>String</code> are different types, you cannot forget to handle the missing case — calling a String method on an Option is a compile error, not a runtime crash.',
        'The same idea generalises: model states as enum variants so that impossible combinations cannot even be written down, instead of using several optional fields and a status flag.',
        'C-like enums (variants with no data) can be cast to integers with <code>as</code> and can have explicit discriminant values, which is handy for talking to C code and binary formats.',
        'Result, the type used for errors, is another ordinary enum with two variants, Ok and Err — it gets its own topic later in this hub.',
      ]
    },
    {
      heading: 'Deriving common behaviour',
      points: [
        '<code>#[derive(Debug)]</code> generates the code needed to print a value with <code>{:?}</code> (or pretty-printed with <code>{:#?}</code>). Without it, a struct cannot be printed with the debug formatter.',
        '<code>Clone</code> gives an explicit <code>.clone()</code>, <code>PartialEq</code> gives <code>==</code>, and <code>Default</code> gives <code>Type::default()</code> — useful with struct update syntax: <code>Config { port: 80, ..Default::default() }</code>.',
        '<code>Copy</code> can only be derived when EVERY field is itself Copy. A struct containing a String can be Clone but never Copy.',
        'The user-facing formatter <code>{}</code> requires the <code>Display</code> trait, which is never derived — you implement it by hand so that you control exactly how the value reads.',
        'Fields and methods are private to the module by default; the <code>pub</code> keyword opts each one into wider visibility, which is covered in the modules topic.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Structs',
      language: 'rust',
      code: `#[derive(Debug, Clone, PartialEq)]
struct User {
    username: String,
    email: String,
    active: bool,
    sign_in_count: u64,
}

struct Color(u8, u8, u8); // tuple struct
struct Marker;            // unit struct

// Field init shorthand: the parameter names match the field names.
fn build_user(email: String, username: String) -> User {
    User { email, username, active: true, sign_in_count: 1 }
}

fn main() {
    let user1 = build_user(String::from("ana@example.com"), String::from("ana"));

    // Struct update syntax: everything not listed comes from user1.
    // username is a String, so it is MOVED out of user1.
    let user2 = User { email: String::from("bo@example.com"), ..user1 };
    println!("{:?}", user2);

    println!("{}", user1.active); // fine — bool is Copy, user1.active is still usable
    // println!("{}", user1.username);
    // error[E0382]: borrow of moved value: user1.username

    let red = Color(255, 0, 0);
    println!("{}", red.0); // fields of a tuple struct are accessed by position
    let _marker = Marker;
}`
    },
    {
      label: 'Methods & Associated Fns',
      language: 'rust',
      code: `#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // Associated functions — no self, called as Rectangle::new(...)
    fn new(width: u32, height: u32) -> Self {
        Self { width, height }
    }

    fn square(size: u32) -> Self {
        Self { width: size, height: size }
    }

    // &self: borrow to read
    fn area(&self) -> u32 {
        self.width * self.height
    }

    // &mut self: borrow to modify
    fn scale(&mut self, factor: u32) {
        self.width *= factor;
        self.height *= factor;
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }

    // self: consumes the value — the caller cannot use it afterwards
    fn into_dimensions(self) -> (u32, u32) {
        (self.width, self.height)
    }
}

fn main() {
    let mut r = Rectangle::new(30, 50);
    println!("{}", r.area()); // 1500

    r.scale(2);
    println!("{:?}", r); // Rectangle { width: 60, height: 100 }

    let sq = Rectangle::square(10);
    println!("{}", r.can_hold(&sq)); // true

    let dims = r.into_dimensions(); // r is moved here
    println!("{:?}", dims); // (60, 100)
    // println!("{:?}", r); // error[E0382]: borrow of moved value: r
}`
    },
    {
      label: 'Enums with Data',
      language: 'rust',
      code: `use std::f64::consts::PI;

#[derive(Debug)]
enum Shape {
    Circle { radius: f64 },
    Rectangle { width: f64, height: f64 },
    Point,
}

impl Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Circle { radius } => PI * radius * radius,
            Shape::Rectangle { width, height } => width * height,
            Shape::Point => 0.0,
        }
    }
}

// One enum can mix unit, tuple and struct-like variants.
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(u8, u8, u8),
}

fn main() {
    let shapes = [
        Shape::Circle { radius: 1.0 },
        Shape::Rectangle { width: 2.0, height: 3.0 },
        Shape::Point,
    ];
    for shape in &shapes {
        println!("{:?} -> {:.2}", shape, shape.area());
    }

    let msg = Message::Write(String::from("hello"));
    if let Message::Write(text) = msg {
        println!("{text}");
    }
}`
    },
    {
      label: 'Option as an Enum',
      language: 'rust',
      code: `// The standard library defines Option like this:
//
//   enum Option<T> {
//       None,
//       Some(T),
//   }

fn find_user(id: u32) -> Option<String> {
    if id == 1 {
        Some(String::from("ana"))
    } else {
        None
    }
}

fn main() {
    match find_user(1) {
        Some(name) => println!("found {name}"),
        None => println!("no such user"),
    }

    // A convenient way to supply a default for the None case
    let name = find_user(2).unwrap_or(String::from("guest"));
    println!("{name}"); // guest

    // let len = find_user(1).len();
    // error[E0599]: no method named len found for enum Option<String>
    // The compiler forces you to deal with the None case before using the String.
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using a struct after struct update syntax moved one of its fields',
      wrong: `let user2 = User { email: String::from("bo@example.com"), ..user1 };
println!("{}", user1.username);
// error[E0382]: borrow of moved value: user1.username`,
      right: `let user2 = User {
    email: String::from("bo@example.com"),
    username: user1.username.clone(), // clone the field you still need
    ..user1
};
println!("{}", user1.username);`,
      explanation: 'The ..base part moves every non-Copy field it uses out of the original instance, leaving it partially moved. Either stop using the original, or list the String fields you want to keep and clone them explicitly.'
    },
    {
      title: 'Trying to mutate a field of an immutable binding',
      wrong: `let rect = Rectangle::new(3, 4);
rect.width = 10;
// error[E0594]: cannot assign to rect.width, as rect is not declared as mutable`,
      right: `let mut rect = Rectangle::new(3, 4);
rect.width = 10;`,
      explanation: 'Rust has no per-field mutability. The whole binding is either mutable or not, and that same rule decides whether &mut self methods can be called on it.'
    },
    {
      title: 'Writing a method that takes self by value when it only needs to read',
      wrong: `impl Rectangle {
    fn area(self) -> u32 {
        self.width * self.height
    }
}

let r = Rectangle::new(3, 4);
println!("{}", r.area());
println!("{}", r.area());
// error[E0382]: use of moved value: r`,
      right: `impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}`,
      explanation: 'A plain self receiver consumes the value, which is right for conversions like into_dimensions but wrong for a simple getter. Default to &self for reading and &mut self for modifying; reserve self for methods that genuinely transform or consume the value.'
    },
    {
      title: 'Printing a struct with {} or {:?} without the matching trait',
      wrong: `struct Point { x: i32, y: i32 }
let p = Point { x: 1, y: 2 };
println!("{:?}", p);
// error[E0277]: Point does not implement Debug`,
      right: `#[derive(Debug)]
struct Point { x: i32, y: i32 }
let p = Point { x: 1, y: 2 };
println!("{:?}", p); // Point { x: 1, y: 2 }`,
      explanation: 'Formatting is opt-in. Derive Debug for developer-facing output; implement Display by hand when you need a user-facing {} format, because Display cannot be derived.'
    },
    {
      title: 'Modelling states with several optional fields instead of an enum',
      wrong: `struct Payment {
    kind: String,              // "card" or "bank"
    card_number: Option<String>,
    iban: Option<String>,
}
// Nothing stops kind = "card" with card_number = None and iban = Some(...)`,
      right: `enum Payment {
    Card { card_number: String },
    Bank { iban: String },
}
// Only valid combinations can even be constructed`,
      explanation: 'When data depends on which case you are in, an enum makes the invalid combinations unrepresentable, so the compiler enforces the rule rather than every function re-checking it at runtime.'
    },
    {
      title: 'Trying to read enum variant data with field syntax',
      wrong: `let msg = Message::Write(String::from("hi"));
println!("{}", msg.0);
// error[E0609]: no field 0 on type Message`,
      right: `let msg = Message::Write(String::from("hi"));
if let Message::Write(text) = msg {
    println!("{text}");
}`,
      explanation: 'An enum value could be any variant, so the compiler cannot let you assume a particular one. You must pattern match, which checks the variant first and only then binds the data it carries.'
    },
  ];

  challenge: Challenge = {
    title: 'Traffic Light Intersection',
    language: 'rust',
    description: `Model a traffic light with an enum and a struct.

Define:
- \`enum Light { Red, Green, Yellow }\` deriving Debug, Clone, Copy and PartialEq.
- \`Light::next(self) -> Light\` — the cycle is Red -> Green -> Yellow -> Red.
- \`Light::duration_secs(self) -> u32\` — Red is 30, Green is 25, Yellow is 5.
- \`struct Intersection { light: Light, cycles: u32 }\` with:
  - \`fn new() -> Self\` — starts at Red with 0 cycles.
  - \`fn advance(&mut self)\` — moves to the next light, and adds one to \`cycles\` every time the light becomes Red again.
  - \`fn seconds_in_state(&self) -> u32\` — the duration of the current light.

Example:
\`\`\`
let mut i = Intersection::new();
for _ in 0..3 { i.advance(); }
// i.light == Light::Red, i.cycles == 1, i.seconds_in_state() == 30
\`\`\``,
    hints: [
      'A match on self with one arm per variant is exhaustive — the compiler will complain if you forget one.',
      'Derive Copy on Light so that calling next(self) on the field through &mut self does not try to move it out of the struct.',
      'Derive PartialEq so you can write if self.light == Light::Red.',
      'advance should assign self.light = self.light.next() first, THEN check whether the new light is Red.',
    ],
    starterCode: `#[derive(Debug)]
enum Light {
    Red,
    Green,
    Yellow,
}

impl Light {
    // TODO: fn next(self) -> Light
    // TODO: fn duration_secs(self) -> u32
}

struct Intersection {
    light: Light,
    cycles: u32,
}

impl Intersection {
    // TODO: new, advance, seconds_in_state
}

fn main() {
    // let mut i = Intersection::new();
    // for _ in 0..3 { i.advance(); }
    // println!("{:?} {}", i.light, i.cycles); // Red 1
    // println!("{}", i.seconds_in_state());   // 30
}`,
    solution: `#[derive(Debug, Clone, Copy, PartialEq)]
enum Light {
    Red,
    Green,
    Yellow,
}

impl Light {
    fn next(self) -> Light {
        match self {
            Light::Red => Light::Green,
            Light::Green => Light::Yellow,
            Light::Yellow => Light::Red,
        }
    }

    fn duration_secs(self) -> u32 {
        match self {
            Light::Red => 30,
            Light::Green => 25,
            Light::Yellow => 5,
        }
    }
}

struct Intersection {
    light: Light,
    cycles: u32,
}

impl Intersection {
    fn new() -> Self {
        Intersection { light: Light::Red, cycles: 0 }
    }

    fn advance(&mut self) {
        self.light = self.light.next();
        if self.light == Light::Red {
            self.cycles += 1;
        }
    }

    fn seconds_in_state(&self) -> u32 {
        self.light.duration_secs()
    }
}

fn main() {
    let mut i = Intersection::new();
    for _ in 0..3 {
        i.advance();
    }
    println!("{:?} {}", i.light, i.cycles); // Red 1
    println!("{}", i.seconds_in_state());   // 30
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'After let user2 = User { email: new_email, ..user1 }; where username is a String, which statement is true?',
      options: [
        'user1 is completely unusable',
        'user1.username has been moved into user2, but Copy fields such as user1.active remain usable',
        'user1 is unchanged because ..user1 always copies',
        'The code does not compile',
      ],
      answer: 1,
      explanation: 'Struct update syntax moves each non-Copy field it takes from the base instance. The instance becomes partially moved: the moved String fields are gone, but Copy fields such as bool remain accessible.'
    },
    {
      q: 'Which of these is an associated function rather than a method?',
      options: [
        'fn into_dimensions(self) -> (u32, u32)',
        'fn area(&self) -> u32',
        'fn scale(&mut self, factor: u32)',
        'fn new(width: u32, height: u32) -> Self',
      ],
      answer: 3,
      explanation: 'A function in an impl block with no self parameter is an associated function and is called with ::, as in Rectangle::new(3, 4). The others all take some form of self and are called with dot syntax.'
    },
    {
      q: 'What can a single enum variant carry?',
      options: [
        'Its own data: none, a tuple of values, or named fields, differing from variant to variant',
        'Only the same data type as every other variant',
        'Nothing — enum variants are only named constants',
        'Only a single integer',
      ],
      answer: 0,
      explanation: 'Each variant can have a different shape — unit, tuple-like or struct-like — which is why Rust enums are true sum types rather than lists of named integers.'
    },
    {
      q: 'What happens with let r = Rectangle::new(1, 2); r.width = 5;',
      options: [
        'It works if the field is declared pub',
        'It works because fields are mutable by default',
        'It fails to compile because the binding r is not declared mut',
        'It fails only at runtime',
      ],
      answer: 2,
      explanation: 'Mutability is a property of the binding. Without mut you can neither assign to a field nor call a method taking &mut self.'
    },
    {
      q: 'What does a method declared as fn consume(self) do to the caller\'s value?',
      options: [
        'Copies it automatically for every type',
        'Borrows it immutably',
        'Borrows it mutably',
        'Takes ownership, so the caller cannot use the original afterwards (unless the type is Copy)',
      ],
      answer: 3,
      explanation: 'A plain self receiver moves the value into the method. That is the right choice for conversions and builders, but not for simple read-only getters.'
    },
    {
      q: 'How does Rust represent a value that might be absent?',
      options: [
        'The enum Option, with variants Some(value) and None',
        'A special sentinel value such as -1',
        'An exception thrown on access',
        'A null pointer that is checked at runtime',
      ],
      answer: 0,
      explanation: 'Option is an ordinary standard-library enum. Because Option of String is a different type from String, the compiler forces you to handle the None case before using the value.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between a struct, a tuple struct and a unit struct?',
      a: 'A regular struct names its fields and is the everyday choice. A tuple struct gives a distinct type to positional fields, which is the basis of the newtype pattern, such as wrapping an f64 as Meters so it cannot be mixed up with Seconds. A unit struct has no fields and is used as a marker or to implement a trait on something that carries no data.'
    },
    {
      q: 'Why does Rust use impl blocks instead of putting methods inside the struct?',
      a: 'Rust separates data from behaviour. The struct or enum declares what the data is, and impl blocks (and traits) declare what you can do with it. That keeps the type definition short, allows several impl blocks per type, and lets you add behaviour without inheritance or a class hierarchy.'
    },
    {
      q: 'When should I choose an enum over a struct?',
      a: 'Use a struct when a value always has all of its fields at once. Use an enum when a value is one of several alternatives and the data differs between them, such as a payment that is either a card or a bank transfer. An enum makes invalid combinations impossible to construct, where a struct with optional fields relies on every function checking the rules.'
    },
    {
      q: 'How much memory does an enum use?',
      a: 'An enum value is as large as its biggest variant plus a small tag that records which variant is active. There is no hidden heap allocation; if a variant holds a String, the String\'s own pointer, length and capacity sit inside the enum and the text lives on the heap as usual.'
    },
    {
      q: 'Why can I derive Debug but not Display?',
      a: 'Debug output is meant for developers, so a mechanical format is acceptable and can be generated automatically. Display is meant for end users, and there is no single sensible automatic format, so Rust requires you to implement the Display trait yourself and decide how the value should read.'
    },
    {
      q: 'What do the receivers &self, &mut self and self mean?',
      a: 'They are shorthand for self: &Self, self: &mut Self and self: Self. The first borrows the value for reading, the second borrows it exclusively for modification, and the third takes ownership. They map directly onto the ownership rules from the earlier topic.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Structs group fields into a type, enums model values that are exactly one of several variants that can each carry data, and impl blocks attach methods and associated functions to both.',
    mustKnow: [
      'Struct update syntax <code>..base</code> moves non-Copy fields out of the base instance',
      'Mutability belongs to the binding — there is no per-field <code>mut</code>',
      'Methods take <code>&amp;self</code>, <code>&amp;mut self</code> or <code>self</code>; functions without self are associated functions called with <code>::</code>',
      'Each enum variant can be unit-like, tuple-like or struct-like, and can hold different data',
      'Rust has no null: absence is the enum <code>Option&lt;T&gt;</code> with variants Some and None',
      'Model states as enum variants so invalid combinations cannot be represented',
      'Derive Debug, Clone, PartialEq and Default; Copy needs every field to be Copy, and Display must be written by hand',
    ],
    interviewFocus: [
      'Explain the difference between a method and an associated function, with an example of each',
      'Why are Rust enums more powerful than enums in C or Java?',
      'What happens to the original struct when you use struct update syntax with a String field?',
      'How does Option remove the need for null, and what does the compiler force you to do?',
      'When would a method take self by value instead of by reference?',
    ],
  };
}
