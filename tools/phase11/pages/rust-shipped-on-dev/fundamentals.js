module.exports = {
  slug: 'fundamentals',
  subtitle: 'Cargo and rustc, variables and mutability, shadowing, scalar and compound types, functions, and expression-based control flow.',
  readingTime: 22,
  apis: ['cargo new / run / check', 'let / let mut', 'i32, u64, usize, f64, char', 'loop / while / for', 'checked_add / wrapping_add'],
  tip: 'Run `cargo check` while you edit and `cargo clippy` before you commit. check type-checks without producing a binary, so it is much faster than build, and clippy catches hundreds of non-idiomatic patterns the compiler accepts.',
  gotchas: [
    'Integer overflow panics in debug builds but silently wraps in release builds — use checked_*, wrapping_* or saturating_* to state the behaviour you want.',
    'A block ending in an expression without a semicolon returns that value; adding a semicolon turns it into () and usually causes a type error.',
    'Indexing with v[i] panics on out-of-bounds access at runtime — use v.get(i) when the index might be invalid.',
  ],
  quickRef: [
    { name: 'cargo new app', type: 'function', desc: 'Create a binary crate with Cargo.toml and src/main.rs (use --lib for a library)' },
    { name: 'cargo check', type: 'function', desc: 'Type-check without code generation — the fastest feedback loop' },
    { name: 'cargo run --release', type: 'function', desc: 'Build with optimisations and run; debug builds are much slower' },
    { name: 'let / let mut', type: 'keyword', desc: 'Bindings are immutable by default; mut opts in to mutation' },
    { name: 'const MAX: u32 = 10;', type: 'keyword', desc: 'Compile-time constant: type annotation required, inlined at each use' },
    { name: 'i8..i128, u8..u128, isize, usize', type: 'type', desc: 'Signed/unsigned integers; usize is pointer-sized and used for indexing' },
    { name: 'f32 / f64 / bool / char', type: 'type', desc: 'char is a 4-byte Unicode scalar value, not a single byte' },
    { name: '(i32, &str) / [u8; 4]', type: 'type', desc: 'Tuples group mixed types; arrays are fixed-length and same-typed' },
    { name: 'x.checked_add(y)', type: 'method', desc: 'Returns None on overflow; wrapping_add, saturating_add, overflowing_add also exist' },
    { name: "loop { break value; }", type: 'syntax', desc: 'loop is an expression: break can return a value from it' },
  ],
  theory: [
    { heading: 'Cargo and the toolchain', points: [
      '`rustup` installs and updates toolchains; `rustc` is the compiler; `cargo` is the build tool and package manager you use day to day.',
      '`cargo new` creates `Cargo.toml` (package metadata, edition, dependencies) and `src/main.rs`. Dependencies are downloaded from crates.io and pinned in `Cargo.lock`.',
      'The edition (2015, 2018, 2021, 2024) is set per crate in `Cargo.toml`. Crates of different editions link together fine — editions change syntax and lints, not the ABI.',
      '`cargo build` produces an unoptimised debug binary in `target/debug`; `cargo build --release` produces an optimised one in `target/release`. Always benchmark release builds.',
    ] },
    { heading: 'Variables, mutability and shadowing', points: [
      'Bindings are immutable unless declared with `let mut`. The compiler rejects assignment to an immutable binding at compile time.',
      'Shadowing re-declares a name with a new `let`. Unlike `mut`, shadowing can change the type: `let input = input.trim().parse::<u32>()?;` is idiomatic.',
      '`const` values need an explicit type and must be computable at compile time; they are inlined wherever used. `static` items have one fixed address for the whole program.',
      'Rust has type inference within a function, but function signatures are always written out — inference never crosses a function boundary.',
    ] },
    { heading: 'Scalar and compound types', points: [
      'Integer literals default to `i32` and floats to `f64`. Use suffixes (`5u8`, `2.0f32`) or annotations to pick another type.',
      'Overflow behaviour depends on the build profile: debug builds panic with "attempt to add with overflow"; release builds wrap around (two\'s complement) unless `overflow-checks = true` is set in the profile.',
      '`as` casts never panic: integer-to-integer casts truncate, float-to-integer casts saturate (and NaN becomes 0). Prefer `TryFrom` (`u8::try_from(x)`) when you need to detect lossy conversions.',
      'Tuples (`(i32, f64)`) are destructured with `let (a, b) = t;` or accessed as `t.0`. Arrays (`[i32; 3]`) have a length that is part of their type; use `Vec<T>` when the length is only known at runtime.',
      'Indexing an array or vector out of bounds panics at runtime; when the index is a constant the compiler often rejects it outright with "this operation will panic at runtime".',
    ] },
    { heading: 'Functions and expressions', points: [
      'Almost everything is an expression. A block `{ ... }` evaluates to its final expression when that expression has no trailing semicolon.',
      'A function returns its final expression; `return` is only needed for early exits. Adding a semicolon to the last line changes the value to `()` (the unit type).',
      '`if` is an expression, so there is no ternary operator: `let size = if n > 100 { "big" } else { "small" };`. Both branches must have the same type.',
      'Conditions must be `bool` — there is no truthiness, so `if count { }` does not compile when `count` is an integer.',
    ] },
    { heading: 'Loops', points: [
      '`loop` repeats forever until `break`; `break value` makes the loop evaluate to that value, which is handy for retry loops.',
      '`while cond { }` loops while a condition holds; `for x in iterable { }` is the idiomatic way to iterate and cannot go out of bounds.',
      'Ranges: `0..5` is 0 to 4 (exclusive), `0..=5` includes 5, and `(0..5).rev()` counts down.',
      'Labels like `\'outer: for ...` let `break \'outer;` or `continue \'outer;` target an enclosing loop.',
    ] },
  ],
  codeTabs: [
    { label: 'Variables & types', language: 'rust', code: `fn main() {
    let x = 5;              // immutable, inferred as i32
    let mut count = 0u64;   // mutable, explicit u64 via suffix
    count += 1;

    // Shadowing: same name, new binding, even a new type
    let spaces = "   ";
    let spaces = spaces.len();          // now a usize
    println!("x={x} count={count} spaces={spaces}");

    // Compound types
    let point: (i32, f64) = (3, 4.5);
    let (px, py) = point;               // destructuring
    let grid = [[0u8; 3]; 2];           // 2 rows x 3 columns of zeros
    println!("{px} {py} {} rows", grid.len());

    // char is a Unicode scalar value (4 bytes), not a byte
    let crab = '🦀';
    println!("{crab} uses {} bytes in UTF-8", crab.len_utf8());
}` },
    { label: 'Overflow & casts', language: 'rust', code: `fn main() {
    let a: u8 = 250;
    // a + 10 would panic in a debug build ("attempt to add with overflow")
    println!("{:?}", a.checked_add(10));    // None
    println!("{}", a.wrapping_add(10));     // 4
    println!("{}", a.saturating_add(10));   // 255
    println!("{:?}", a.overflowing_add(10)); // (4, true)

    // 'as' never panics: truncates ints, saturates floats
    println!("{}", 300i32 as u8);           // 44  (300 mod 256)
    println!("{}", -1.5f64 as u8);          // 0   (saturates)
    println!("{}", f64::NAN as i32);        // 0

    // TryFrom reports the lossy case instead of hiding it
    let r = u8::try_from(300i32);
    println!("{}", r.is_err());             // true
}` },
    { label: 'Expressions & loops', language: 'rust', code: `fn classify(n: i32) -> &'static str {
    // if is an expression; this is the function's return value (no semicolon)
    if n < 0 { "negative" } else if n == 0 { "zero" } else { "positive" }
}

fn main() {
    // A block evaluates to its last expression
    let y = {
        let base = 3;
        base * base         // no semicolon -> value of the block
    };
    println!("{y} {}", classify(-2));

    // loop returns a value through break
    let mut attempts = 0;
    let found = loop {
        attempts += 1;
        if attempts * attempts > 50 { break attempts; }
    };
    println!("first n with n*n > 50: {found}");

    // Labelled break out of nested loops
    'outer: for i in 1..=3 {
        for j in 1..=3 {
            if i * j == 4 { println!("stop at {i},{j}"); break 'outer; }
        }
    }

    for n in (1..=3).rev() { print!("{n} "); }
    println!("liftoff");
}` },
    { label: 'Cargo workflow', language: 'bash', code: `cargo new greeter            # binary crate: Cargo.toml + src/main.rs
cd greeter
cargo add rand               # add a dependency to Cargo.toml
cargo check                  # fast type-check, no binary
cargo run                    # build (debug) and run
cargo build --release        # optimised binary in target/release
cargo fmt                    # format with rustfmt
cargo clippy                 # extra lints beyond the compiler
cargo test                   # unit, integration and doc tests` },
  ],
  mistakes: [
    { title: 'Trailing semicolon on the return expression', wrong: `fn square(x: i32) -> i32 {
    x * x;
}`, right: `fn square(x: i32) -> i32 {
    x * x
}`, explanation: 'With the semicolon the last line is a statement, so the body evaluates to () and the compiler reports "mismatched types: expected i32, found ()". Drop the semicolon (or write return x * x;).' },
    { title: 'Relying on wrap-around in release builds', wrong: `let total: u32 = a + b; // works in release, panics in debug`, right: `let total = a.checked_add(b).ok_or("overflow")?;
// or a.wrapping_add(b) if wrapping is really intended`, explanation: 'Debug and release builds behave differently on overflow. Say what you want explicitly with checked_, wrapping_ or saturating_ methods so the behaviour is the same in every profile.' },
    { title: 'Using as for conversions that can lose data', wrong: `let port = user_value as u16; // 70000 silently becomes 4464`, right: `let port = u16::try_from(user_value)
    .map_err(|_| "port out of range")?;`, explanation: 'as truncates integers without any error. TryFrom/TryInto return a Result, so out-of-range input is detected instead of turning into a different valid-looking number.' },
    { title: 'Treating integers as booleans', wrong: `let n = 3;
if n { println!("non-zero"); }`, right: `let n = 3;
if n != 0 { println!("non-zero"); }`, explanation: 'Rust has no truthiness: an if condition must be a bool. Write the comparison you mean.' },
    { title: 'Indexing past the end', wrong: `let v = vec![1, 2, 3];
let x = v[10]; // panics: index out of bounds`, right: `let v = vec![1, 2, 3];
match v.get(10) {
    Some(x) => println!("{x}"),
    None => println!("no element"),
}`, explanation: 'Indexing panics on an invalid index. get returns an Option, so the missing case is handled in code rather than by crashing.' },
  ],
  challenge: {
    title: 'FizzBuzz with a twist',
    language: 'rust',
    description: 'Write fizzbuzz(n: u32) -> String that returns "Fizz" for multiples of 3, "Buzz" for multiples of 5, "FizzBuzz" for both, otherwise the number. Then, in main, use a loop that breaks with a value to find the first n above 100 whose result is "FizzBuzz", and print it. Use if as an expression rather than mutable temporaries.',
    hints: ['n % 15 == 0 covers "both" — check it first.', 'n.to_string() turns a number into a String; .to_string() also works on &str literals.', 'A loop can return a value with break n; bind it with let first = loop { ... };'],
    starterCode: `fn fizzbuzz(n: u32) -> String {
    todo!()
}

fn main() {
    for n in 1..=15 {
        println!("{}", fizzbuzz(n));
    }
    // find the first n > 100 where fizzbuzz(n) == "FizzBuzz"
}`,
    solution: `fn fizzbuzz(n: u32) -> String {
    if n % 15 == 0 {
        "FizzBuzz".to_string()
    } else if n % 3 == 0 {
        "Fizz".to_string()
    } else if n % 5 == 0 {
        "Buzz".to_string()
    } else {
        n.to_string()
    }
}

fn main() {
    for n in 1..=15 {
        println!("{}", fizzbuzz(n));
    }
    let mut n = 101;
    let first = loop {
        if fizzbuzz(n) == "FizzBuzz" {
            break n;
        }
        n += 1;
    };
    println!("first FizzBuzz above 100: {first}"); // 105
}`,
  },
  quiz: [
    { q: 'What happens when a u8 holding 255 is incremented with + 1 in a debug build?', options: ['It wraps to 0', 'It saturates at 255', 'The program panics with "attempt to add with overflow"', 'It fails to compile'], answer: 2, explanation: 'Debug builds enable overflow checks and panic. Release builds wrap to 0 by default. Use wrapping_add, checked_add or saturating_add to choose the behaviour explicitly.' },
    { q: 'What does `300i32 as u8` evaluate to?', options: ['255', '44', 'A runtime panic', 'A compile error'], answer: 1, explanation: 'Integer-to-integer as casts truncate to the low bits: 300 mod 256 = 44. as never panics; use u8::try_from to detect the overflow.' },
    { q: 'What is the value of `let v = { let a = 2; a * 3; };`?', options: ['6', '()', '2', 'It does not compile'], answer: 1, explanation: 'The trailing semicolon makes a * 3 a statement, so the block evaluates to the unit value (). Without the semicolon it would be 6.' },
    { q: 'Which statement about shadowing is true?', options: ['It requires let mut', 'It can change the type of the name', 'It mutates the original value in place', 'It only works inside loops'], answer: 1, explanation: 'Shadowing creates a new binding with a fresh let, so the new binding may have a different type. The old value is not mutated.' },
    { q: 'What does `loop { break 7; }` evaluate to?', options: ['()', '7', 'It never terminates', 'A compile error: loop has no value'], answer: 1, explanation: 'loop is an expression and break can carry a value out of it, so the loop evaluates to 7.' },
    { q: 'How many values does the range 1..5 produce?', options: ['5', '4', '6', '1'], answer: 1, explanation: 'a..b is half-open: 1, 2, 3, 4. Use 1..=5 for an inclusive range.' },
  ],
  qna: [
    { q: 'Why are variables immutable by default in Rust?', a: 'Immutability by default makes data flow obvious: when you read `let x`, you know `x` never changes, which helps both readers and the borrow checker. Mutation is still available, but it is opt-in with `let mut`, so every place that changes state is visible in the code. It also pairs with the borrowing rules: an immutable binding can be shared freely.' },
    { q: 'What is the difference between shadowing and mut?', a: '`let mut x` declares one binding whose value can be reassigned, but its type is fixed. Shadowing (`let x = ...` again) creates a brand-new binding that hides the old one; it can have a different type and the old value is not modified. Shadowing is common for transformations like parsing a string into a number while keeping a meaningful name.' },
    { q: 'How does Rust handle integer overflow?', a: 'In debug builds arithmetic overflow panics. In release builds overflow checks are off by default and values wrap using two\'s complement (you can turn checks on with `overflow-checks = true` in a profile). Because the default differs between profiles, code that cares should use the explicit methods: `checked_add` (returns `Option`), `wrapping_add`, `saturating_add` or `overflowing_add` (returns the value and a flag).' },
    { q: 'When should you use const vs static?', a: '`const` is a compile-time value that is inlined at every use site and has no fixed address — use it for numbers, strings and other constants. `static` is a single item with a fixed memory address for the whole program; use it when you need a stable address or a global with interior mutability (e.g. an atomic or a `OnceLock`). `static mut` requires `unsafe` to access and is almost never the right choice.' },
    { q: 'What is the difference between cargo build, check and run?', a: '`cargo check` only type-checks and runs borrow checking, skipping code generation, so it is the fastest way to find errors. `cargo build` compiles a binary (debug by default, `--release` for optimised). `cargo run` builds and then executes it. For performance work always use `--release`, which is often several times faster than debug.' },
  ],
  revision: {
    oneLiner: 'Rust is expression-based and immutable by default; Cargo builds, tests and manages dependencies, and integer overflow behaves differently in debug and release unless you say what you want.',
    mustKnow: [
      '`let` is immutable, `let mut` is mutable; shadowing creates a new binding and may change the type.',
      'Integers default to `i32`, floats to `f64`; `usize` is used for indexing; `char` is a 4-byte Unicode scalar.',
      'Overflow panics in debug and wraps in release — use `checked_`, `wrapping_`, `saturating_` methods.',
      '`as` truncates/saturates silently; use `TryFrom` to detect lossy conversions.',
      'Blocks, `if` and `loop` are expressions; a trailing semicolon turns a value into `()`.',
      'Use `cargo check` for fast feedback and `--release` for anything performance-related.',
    ],
    interviewFocus: [
      'Explain expressions vs statements and why a trailing semicolon causes a type mismatch.',
      'Compare shadowing with `mut`.',
      'Describe overflow behaviour in debug vs release and the explicit arithmetic methods.',
      'Explain why `as` can be dangerous and what to use instead.',
    ],
  },
};
