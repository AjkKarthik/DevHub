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
  selector: 'app-rust-fundamentals',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fundamentals.html',
  styleUrl: './fundamentals.scss'
})
export class RustFundamentals {
  readingTime = 20;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  since = 'Rust 2021+';
  route = 'rust-fundamentals';

  quickRef: QuickRefItem[] = [
    { name: 'let x = 5;', type: 'syntax', desc: 'Immutable binding — the default for every let' },
    { name: 'let mut x = 5;', type: 'syntax', desc: 'Mutable binding — opts explicitly into reassignment' },
    { name: 'const MAX: u32 = 100_000;', type: 'keyword', desc: 'Compile-time constant — always immutable, type required' },
    { name: 'fn main() { }', type: 'syntax', desc: 'Entry point — every binary crate needs exactly one' },
    { name: 'i32 / u32 / f64 / bool / char', type: 'type', desc: 'Core scalar types — i32 is the default integer type' },
    { name: '(T1, T2, ...)', type: 'type', desc: 'Tuple type — fixed length, can mix different types' },
    { name: '[T; N]', type: 'type', desc: 'Array type — fixed length N, all elements the same type T' },
    { name: 'if / else', type: 'syntax', desc: 'A full expression — both branches must produce the same type' },
    { name: 'loop { break value; }', type: 'syntax', desc: 'The only loop construct that can return a value' },
    { name: 'println!("{x}")', type: 'function', desc: 'Macro (note the !) — validates the format string at compile time' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Cargo, rustc, and a project\'s layout',
      points: [
        '`rustc` is the compiler itself; almost nobody calls it directly on a real project — `cargo` wraps it and handles dependencies, builds, and tests.',
        '`cargo new my_app` scaffolds `Cargo.toml` (the manifest — name, version, dependencies) and `src/main.rs` (the entry point for a binary crate).',
        '`cargo run` compiles and runs in one step; `cargo build` compiles only; `cargo build --release` compiles with optimizations turned on.',
        '`cargo check` runs the compiler\'s type- and borrow-checking passes without producing a binary — much faster, and what most editors run on every save.',
        'Dependencies go in <code>Cargo.toml</code> under <code>[dependencies]</code>; <code>cargo add &lt;crate&gt;</code> adds one and fetches it for you. <code>Cargo.lock</code> pins the exact resolved versions.',
      ]
    },
    {
      heading: 'Variables, mutability, and shadowing',
      points: [
        '`let x = 5;` creates an IMMUTABLE binding — this is the default, the opposite of most mainstream languages.',
        '`let mut x = 5;` opts explicitly into reassignment. Every `mut` in a Rust codebase is a deliberate, searchable signal that this value changes.',
        'Shadowing — declaring `let x = ...` again with the same name — creates a brand-new binding. Unlike `mut`, shadowing can change the TYPE: `let spaces = "   "; let spaces = spaces.len();` goes from `&str` to `usize`.',
        '`const MAX_POINTS: u32 = 100_000;` declares a compile-time constant. Constants always require an explicit type annotation and are always immutable — `mut` is not allowed on a `const`.',
        'Underscores in numeric literals (`100_000`) are purely a readability separator — the compiler ignores them entirely.',
      ]
    },
    {
      heading: 'Scalar and compound types',
      points: [
        'Scalar types: signed/unsigned integers (`i8`..`i128`, `u8`..`u128`, plus the pointer-sized `isize`/`usize`), floats (`f32`, `f64`), `bool`, and `char`.',
        'When a numeric literal\'s type isn\'t inferable from context, Rust defaults to `i32` for integers and `f64` for floats.',
        '`char` is always exactly 4 bytes and represents one full Unicode scalar value (`\'z\'`, `\'é\'`, `\'🦀\'` are all valid single `char`s) — not just ASCII.',
        'Tuples `(T1, T2, ...)` group a fixed number of possibly-different-typed values; access with `.0`, `.1`, ... or destructure with `let (a, b) = pair;`.',
        'Arrays <code>[T; N]</code> have their length baked into the TYPE at compile time — <code>[i32; 3]</code> and <code>[i32; 5]</code> are different types, and the length never changes. <code>Vec&lt;T&gt;</code> (a growable, heap-allocated list) is a separate type covered once ownership is introduced.',
      ]
    },
    {
      heading: 'Control flow as expressions',
      points: [
        '`if`/`else` is an EXPRESSION in Rust, not just a statement — `let msg = if cond { "yes" } else { "no" };` is valid, and both branches must produce the same type.',
        '`loop { }` runs forever until an explicit `break`. Uniquely among Rust\'s loops, `break value;` exits the loop AND makes the whole `loop { ... }` evaluate to `value`.',
        '`while condition { }` checks the condition before every iteration — standard while-loop semantics, always evaluates to `()`.',
        '`for item in collection { }` is the idiomatic way to iterate — it consumes an iterator directly, so there is no index variable and no off-by-one class of bug.',
        '`0..3` is an exclusive range (0, 1, 2); `0..=3` is inclusive (0, 1, 2, 3) — the extra `=` is easy to miss when reading someone else\'s range.',
      ]
    },
    {
      heading: 'Functions and implicit returns',
      points: [
        'Function parameters MUST have explicit type annotations — Rust never infers a parameter\'s type across a function boundary the way it does for local `let` bindings.',
        'The last line of a function body, written WITHOUT a trailing semicolon, is its implicit return value — `fn add(a: i32, b: i32) -> i32 { a + b }`.',
        'Adding a semicolon turns that same line into a statement, which evaluates to the unit type `()` — this is the single most common first-week compile error (`expected i32, found ()`).',
        'An explicit `return value;` works from anywhere in the function body, including nested inside an `if` for an early exit — the trailing semicolon rule does not apply to `return` itself.',
        'Functions are values too: `fn apply_twice(f: fn(i32) -> i32, x: i32) -> i32 { f(f(x)) }` takes a plain function pointer as an argument.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Variables & Mutability',
      language: 'rust',
      code: `fn main() {
    let x = 5;          // immutable by default
    // x = 6;            // error[E0384]: cannot assign twice to immutable variable

    let mut y = 5;
    y = 6;               // fine — y is mutable
    println!("y = {y}");

    // Shadowing: re-declaring \`x\` with \`let\` creates a NEW binding
    let x = x + 1;       // x is now 6, still immutable
    let x = x * 2;       // x is now 12
    println!("x = {x}");

    // Shadowing can change the type — mutation with \`mut\` cannot
    let spaces = "   ";
    let spaces = spaces.len(); // now a usize, not a &str
    println!("spaces = {spaces}");

    const MAX_POINTS: u32 = 100_000; // requires an explicit type, always immutable
    println!("max points = {MAX_POINTS}");
}`
    },
    {
      label: 'Scalar & Compound Types',
      language: 'rust',
      code: `fn main() {
    // Scalar types
    let a: i32 = -42;        // signed 32-bit integer
    let b: u64 = 42;         // unsigned 64-bit integer
    let c: f64 = 3.14;       // 64-bit float — the default float type
    let d: bool = true;
    let e: char = 'z';       // 4 bytes — a full Unicode scalar value

    // Integer overflow panics in debug builds, wraps in release builds
    let f: u8 = 255;
    let g = f.wrapping_add(1); // explicit wrap: 0

    // Tuples — fixed length, can mix types
    let point: (i32, i32, f64) = (3, 7, 2.5);
    let (x, y, z) = point;    // destructuring
    println!("{x} {y} {z}");
    println!("first = {}", point.0); // dot + index for direct access

    // Arrays — fixed length, single type, stack-allocated
    let scores: [i32; 3] = [90, 85, 77];
    let zeros = [0; 5];        // [0, 0, 0, 0, 0]
    println!("{}", scores[1]); // 85

    println!("{a} {b} {c} {d} {e} {g}");
    println!("{:?}", zeros);
}`
    },
    {
      label: 'Control Flow',
      language: 'rust',
      code: `fn main() {
    let number = 7;

    // if is an EXPRESSION — both branches must produce the same type
    let description = if number % 2 == 0 { "even" } else { "odd" };
    println!("{number} is {description}");

    // loop can return a value via \`break value\`
    let mut counter = 0;
    let result = loop {
        counter += 1;
        if counter == 10 {
            break counter * 2; // exits the loop with a value
        }
    };
    println!("result = {result}"); // 20

    // while — condition checked before each iteration
    let mut n = 3;
    while n != 0 {
        println!("{n}!");
        n -= 1;
    }

    // for — the idiomatic way to iterate; no index variable needed
    let items = ["a", "b", "c"];
    for item in items {
        println!("item: {item}");
    }
    for i in 0..3 {          // exclusive range: 0, 1, 2
        println!("i = {i}");
    }
}`
    },
    {
      label: 'Functions',
      language: 'rust',
      code: `fn add(a: i32, b: i32) -> i32 {
    a + b   // no semicolon — this is the return EXPRESSION, not a statement
}

fn describe(n: i32) -> &'static str {
    if n < 0 {
        return "negative"; // explicit early return still needs \`return\`
    }
    if n == 0 { "zero" } else { "positive" } // trailing expression — implicit return
}

fn square(x: i32) -> i32 { x * x }

fn apply_twice(f: fn(i32) -> i32, x: i32) -> i32 {
    f(f(x))
}

fn main() {
    let sum = add(3, 4);
    println!("sum = {sum}"); // 7

    println!("{}", describe(-5)); // negative
    println!("{}", describe(0));  // zero
    println!("{}", describe(5));  // positive

    println!("{}", apply_twice(square, 3)); // 81 — square(square(3))
}`
    },
    {
      label: 'Cargo Workflow',
      language: 'bash',
      code: `# Create a new binary project
cargo new hello_rust
cd hello_rust

# Project layout:
#   Cargo.toml   — manifest: name, version, dependencies
#   src/main.rs  — entry point for a binary crate
#   .gitignore   — ignores target/ by default

# Compile + run in one step (debug build, unoptimized, fast to compile)
cargo run

# Compile only, without running
cargo build

# Compile with optimizations — for what you actually ship
cargo build --release

# Run the tests in the current crate
cargo test

# Add a dependency to Cargo.toml and fetch it
cargo add serde

# Check for compile errors without producing a binary — much faster than build
cargo check`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting mut on a variable you intend to reassign',
      wrong: `let count = 0;
count = count + 1; // error[E0384]: cannot assign twice to immutable variable \`count\``,
      right: `let mut count = 0;
count = count + 1; // fine — mut opts into reassignment`,
      explanation: 'Bindings are immutable by default in Rust — the opposite default from most languages. Add mut explicitly whenever you intend to reassign a variable.'
    },
    {
      title: 'Adding a semicolon to a function\'s final expression',
      wrong: `fn double(x: i32) -> i32 {
    x * 2; // semicolon turns this into a statement — evaluates to (), not i32
}`,
      right: `fn double(x: i32) -> i32 {
    x * 2 // no semicolon — this is the return expression
}`,
      explanation: 'A semicolon converts an expression into a statement, and statements evaluate to the unit type (). Leaving off the trailing semicolon on the last line is Rust\'s idiomatic implicit return — this is the single most common first-week compile error, "mismatched types, expected i32, found ()".'
    },
    {
      title: 'Assuming integer overflow panics in every build',
      wrong: `let x: u8 = 250;
let y = x + 10; // panics in debug builds — "attempt to add with overflow"
                 // silently WRAPS instead in a --release build`,
      right: `let x: u8 = 250;
let y = x.checked_add(10);    // None on overflow — handle explicitly
let z = x.wrapping_add(10);   // explicit wrap: 4
let w = x.saturating_add(10); // explicit clamp: 255`,
      explanation: 'Overflow behavior differs between debug (panics) and release (wraps, two\'s-complement style) builds — code that "works" in cargo run can behave differently once shipped with cargo build --release. Use checked_/wrapping_/saturating_ methods to make the intended behavior explicit rather than relying on the build profile.'
    },
    {
      title: 'Treating char like a single byte',
      wrong: `let s = "héllo";
let byte = s.as_bytes()[1]; // NOT the 'é' character — é is 2 bytes in UTF-8`,
      right: `let s = "héllo";
let ch = s.chars().nth(1); // Some('é') — iterate by char, not by byte index`,
      explanation: 'A Rust String/&str is UTF-8 encoded, and indexing directly into the byte array can land in the middle of a multi-byte character. char is always 4 bytes (a full Unicode scalar value), but the underlying UTF-8 encoding of a string is variable-width — always iterate with .chars() when you mean "characters," not bytes.'
    },
    {
      title: 'Mismatched types between if/else branches',
      wrong: `let x = 5;
let msg = if x > 0 { "positive" } else { 0 }; // error: if and else have incompatible types`,
      right: `let x = 5;
let msg = if x > 0 { "positive".to_string() } else { "non-positive".to_string() };`,
      explanation: 'Since if is an expression in Rust, both branches must produce the same type — there is no implicit coercion between a &str and an i32 the way some languages coerce mismatched ternary branches. This is the compiler enforcing that a let binding always has one well-defined type.'
    },
    {
      title: 'Missing an else branch on an if used as an expression',
      wrong: `let x = 5;
let y = if x > 0 { 10 }; // error: if may be missing an else clause`,
      right: `let x = 5;
let y = if x > 0 { 10 } else { 0 }; // both branches required when the result is used`,
      explanation: 'An if without an else is fine as a plain statement (nothing is bound to its result), but the moment you assign its value to a variable, every branch — including the implicit "did not enter the if" case — must produce a value of the same type. Rust has no implicit null fallback for a missing branch.'
    },
  ];

  challenge: Challenge = {
    title: 'Triangle Classifier',
    language: 'rust',
    description: `Write a function \`classify_triangle(a: f64, b: f64, c: f64) -> &'static str\` that classifies a triangle given its three side lengths.

Return one of:
- \`"invalid"\` — if any side is <= 0, or the triangle inequality is violated (the sum of any two sides must exceed the third)
- \`"equilateral"\` — all three sides equal
- \`"isosceles"\` — exactly two sides equal
- \`"scalene"\` — all three sides different

Example:
\`\`\`
classify_triangle(3.0, 3.0, 3.0) // "equilateral"
classify_triangle(3.0, 3.0, 5.0) // "isosceles"
classify_triangle(3.0, 4.0, 5.0) // "scalene"
classify_triangle(1.0, 1.0, 5.0) // "invalid" — 1 + 1 is not greater than 5
\`\`\``,
    hints: [
      'A valid triangle needs all three sides positive AND must satisfy the triangle inequality: the sum of any two sides must exceed the third.',
      'Check invalidity first with early return statements — the rest of the function can then assume a valid triangle.',
      'Use == to compare the f64 side lengths for exact matches — the test inputs are deliberately exact values.',
      'The final classification reads naturally as a trailing if/else-if/else expression — no semicolons on the arms.',
    ],
    starterCode: `fn classify_triangle(a: f64, b: f64, c: f64) -> &'static str {
    // TODO: return "invalid", "equilateral", "isosceles", or "scalene"
    "invalid"
}

fn main() {
    println!("{}", classify_triangle(3.0, 3.0, 3.0)); // equilateral
    println!("{}", classify_triangle(3.0, 3.0, 5.0)); // isosceles
    println!("{}", classify_triangle(3.0, 4.0, 5.0)); // scalene
    println!("{}", classify_triangle(1.0, 1.0, 5.0)); // invalid
}`,
    solution: `fn classify_triangle(a: f64, b: f64, c: f64) -> &'static str {
    if a <= 0.0 || b <= 0.0 || c <= 0.0 {
        return "invalid";
    }
    if a + b <= c || a + c <= b || b + c <= a {
        return "invalid";
    }

    if a == b && b == c {
        "equilateral"
    } else if a == b || b == c || a == c {
        "isosceles"
    } else {
        "scalene"
    }
}

fn main() {
    println!("{}", classify_triangle(3.0, 3.0, 3.0)); // equilateral
    println!("{}", classify_triangle(3.0, 3.0, 5.0)); // isosceles
    println!("{}", classify_triangle(3.0, 4.0, 5.0)); // scalene
    println!("{}", classify_triangle(1.0, 1.0, 5.0)); // invalid — fails the triangle inequality
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does `let x = 5;` create, by default, in Rust?',
      options: ['A mutable binding', 'An immutable binding', 'A constant', 'A reference'],
      answer: 1,
      explanation: 'Bindings created with let are immutable by default in Rust — the opposite default from most mainstream languages. Reassigning x without mut is a compile error.'
    },
    {
      q: 'What does adding a semicolon to a Rust expression do?',
      options: ['Nothing — it is purely stylistic', 'Turns the expression into a statement that evaluates to the unit type ()', 'Marks the value as immutable', 'Ends the current scope'],
      answer: 1,
      explanation: 'A semicolon converts an expression into a statement. Statements do not produce a value — they evaluate to the unit type (). This is why the last line of a function body is usually left without a semicolon: it becomes the function\'s implicit return value.'
    },
    {
      q: 'Which of these correctly declares a variable you intend to reassign later?',
      options: ['let x = 5;', 'mutable x = 5;', 'let mut x = 5;', 'var x = 5;'],
      answer: 2,
      explanation: 'let mut x = 5; is the only valid option — Rust requires the explicit mut keyword to opt into reassignment. mutable and var are not Rust keywords.'
    },
    {
      q: 'What is the key difference between shadowing (declaring `let x = ...` again) and mutating a `mut` variable?',
      options: ['They are identical', 'Shadowing can change the type of the binding; mutation with the same variable cannot', 'Mutation can change the type; shadowing cannot', 'Shadowing only works inside loops'],
      answer: 1,
      explanation: 'Shadowing creates an entirely new binding that happens to reuse the same name, so its type can differ from the original — for example, let spaces = "   "; let spaces = spaces.len(); goes from &str to usize. Mutating a mut variable keeps the same binding and the same type throughout.'
    },
    {
      q: 'How do you get a value OUT of a `loop { }` in Rust?',
      options: ['loop { } cannot return a value', 'return value; exits the enclosing function, not just the loop', 'break value; exits the loop and the whole expression evaluates to value', 'yield value;'],
      answer: 2,
      explanation: 'loop is the only Rust loop construct that can produce a value: break value; exits the loop and the whole loop { ... } expression evaluates to value. while and for loops always evaluate to ().'
    },
    {
      q: 'In a `cargo build --release` binary, what happens when an unsigned integer operation overflows (e.g. 250u8 + 10)?',
      options: ['It panics, same as debug builds', "It silently wraps around (two's-complement style)", 'It returns None automatically', 'It is a compile error'],
      answer: 1,
      explanation: 'Debug builds panic on integer overflow to catch bugs during development; release builds silently wrap instead, prioritizing performance. Because the behavior differs by build profile, relying on either implicitly is risky — use checked_add/wrapping_add/saturating_add to make the intended behavior explicit regardless of build profile.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why does Rust make variables immutable by default instead of mutable by default?',
      a: 'Immutability-by-default nudges code toward fewer accidental mutations, which pays off heavily once ownership and borrowing enter the picture — many of Rust\'s aliasing guarantees are easier to reason about when most values never change. It also means every mut in a codebase is a genuine, searchable signal: "this value changes," rather than noise. You still opt into mutation freely with mut — the compiler just enforces that the intent is stated, not that mutation is rare.'
    },
    {
      q: 'Is println! a function call?',
      a: 'No — the ! marks it as a macro invocation, not a function call. println! is expanded at compile time into code that validates the format string against the arguments (giving a compile error for a mismatched {} placeholder, something a plain function could only ever catch at runtime) and writes to standard output. Macros like println!, vec!, and format! are a core part of idiomatic Rust and are recognizable by their trailing !.'
    },
    {
      q: 'Why does cargo check exist when cargo build already reports errors?',
      a: 'cargo check runs the compiler\'s type-checking and borrow-checking passes WITHOUT the slower code-generation and linking steps that produce an actual binary. For a large project this can be several times faster than a full cargo build, making it the natural command to run continuously while you edit — most IDE Rust integrations (rust-analyzer) run something equivalent to cargo check on every save.'
    },
    {
      q: 'What is the difference between i32 and u32, and why does i32 default when a type isn\'t specified?',
      a: 'i32 is a signed 32-bit integer (roughly -2.1 billion to +2.1 billion); u32 is unsigned, covering 0 to roughly 4.3 billion. When a numeric literal\'s type can\'t be inferred from context, Rust defaults to i32 because it\'s a reasonable general-purpose choice that avoids surprising underflow panics from an accidental negative value on a u32. You still choose u32/u64/etc. explicitly whenever a value is genuinely non-negative by definition (a length, a count).'
    },
    {
      q: 'Are arrays and Vec the same thing?',
      a: 'No. An array (<code>[T; N]</code>) has its length baked into its TYPE at compile time — <code>[i32; 3]</code> and <code>[i32; 5]</code> are different types, and the length can never change. <code>Vec&lt;T&gt;</code> is a growable, heap-allocated collection whose length is tracked at runtime and can change via <code>.push()</code>/<code>.pop()</code>. Fundamentals sticks to arrays and tuples since they don\'t require understanding ownership of heap data yet — Vec gets its own coverage once ownership is introduced.'
    },
    {
      q: 'Why does for item in items not need an index variable, unlike a C-style for loop?',
      a: 'Rust\'s for loop consumes an iterator directly — for item in items calls .into_iter() on items under the hood and binds each yielded value to item in turn. This removes the classic off-by-one class of bug entirely (there is no index expression to get wrong), and it works uniformly over arrays, ranges (0..n), Vecs, and any other type that implements the Iterator trait.'
    },
    {
      q: 'What does the char type actually store, and how is it different from a byte?',
      a: "A Rust char is always exactly 4 bytes and represents one Unicode scalar value — the full range of a valid Unicode code point ('z', 'é', '🦀' are all single chars). A u8 byte, by contrast, is just 8 bits with no notion of what character it represents. This matters directly for strings: String/&str are UTF-8 encoded, so a single char can occupy 1 to 4 BYTES within the string's underlying storage — s.len() returns the byte length, not the character count."
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Rust bindings are immutable by default, every expression has a type, and the compiler enforces both at compile time — Cargo, not rustc directly, is how you build, run, and test real projects.',
    mustKnow: [
      'let is immutable by default; let mut opts into reassignment',
      'A trailing semicolon turns an expression into a statement that evaluates to ()',
      'if/else and loop are expressions — they can produce a value',
      'Scalar types: i32/u32/f64/bool/char; compound: tuples (T1, T2, ...) and arrays [T; N]',
      'loop { break value; } is the only loop construct that can return a value directly',
      'Integer overflow panics in debug builds, wraps in release builds — use checked_/wrapping_/saturating_ to be explicit',
      'cargo new/build/run/test/check wrap rustc — cargo check is the fast, no-binary compile pass',
    ],
    interviewFocus: [
      'Why is Rust immutable by default, and what does that buy you later with ownership?',
      'Explain why a trailing semicolon changes a function\'s return type',
      'What is the difference between an array and a Vec, and when would you reach for each?',
      'How does integer overflow behave differently in debug vs. release builds?',
      'Why is println! a macro and not a function?',
    ],
  };
}
