module.exports = {
  slug: 'cheatsheet',
  subtitle: 'One page of Rust you reach for daily: ownership rules, syntax, Option and Result combinators, iterator adapters, common traits, smart pointers, concurrency types and Cargo commands.',
  readingTime: 12,
  apis: ['Ownership rules', 'Option / Result methods', 'Iterator adapters', 'Common derives', 'Smart pointers', 'Cargo commands'],
  tip: 'Bookmark std\'s Option and Result pages: most "how do I unwrap this nicely" questions are answered by one combinator (map, and_then, ok_or, unwrap_or_else, ?).',
  gotchas: [
    'String vs &str: own with String, accept &str in parameters.',
    'unwrap() and expect() panic — use ? in functions that return Result or Option.',
    'Rc and RefCell are single-threaded; their thread-safe counterparts are Arc and Mutex/RwLock.',
  ],
  quickRef: [
    { name: 'let x = 5; let mut y = 5;', type: 'keyword', desc: 'Immutable by default; mut opts in' },
    { name: 'let x = x + 1;', type: 'syntax', desc: 'Shadowing: a new binding, may change type' },
    { name: 'i8..i128 u8..u128 isize usize f32 f64 bool char', type: 'type', desc: 'Scalar types (char is a 4-byte Unicode scalar)' },
    { name: '(i32, &str)  [u8; 4]  &[T]  Vec<T>', type: 'type', desc: 'Tuple, array, slice, growable vector' },
    { name: 'String / &str', type: 'type', desc: 'Owned UTF-8 buffer / borrowed string slice' },
    { name: '&T / &mut T', type: 'operator', desc: 'Many shared borrows OR one mutable borrow' },
    { name: 'fn f(x: i32) -> i32 { x + 1 }', type: 'function', desc: 'Last expression without ; is the return value' },
    { name: '|x| x * 2   move || ...', type: 'syntax', desc: 'Closures; move takes ownership of captures' },
    { name: 'match / if let / let else / while let', type: 'keyword', desc: 'Pattern matching forms' },
    { name: 'impl Trait / dyn Trait / T: Trait', type: 'keyword', desc: 'Static dispatch, dynamic dispatch, generic bound' },
    { name: '#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]', type: 'decorator', desc: 'Most common derives' },
    { name: 'Box / Rc / Arc / RefCell / Mutex / RwLock', type: 'class', desc: 'Heap, shared, thread-safe shared, runtime-borrow, locks' },
    { name: '?', type: 'operator', desc: 'Return early with Err/None, converting errors with From' },
    { name: "'a / 'static", type: 'token', desc: 'Lifetime parameter / lives for the whole program' },
  ],
  theory: [
    { heading: 'Ownership in five rules', points: [
      'Each value has exactly one owner; when the owner goes out of scope the value is dropped.',
      'Assigning or passing a non-`Copy` value moves it; the old binding becomes unusable. `Copy` types (integers, floats, bool, char, `&T`, tuples of Copy) are copied instead.',
      'At any time you may have either any number of `&T` or exactly one `&mut T` to a value.',
      'References must never outlive the data they point to — the borrow checker enforces this with lifetimes.',
      'Borrows end at their last use (non-lexical lifetimes), not at the end of the block.',
    ] },
    { heading: 'Option and Result toolkit', points: [
      'Transform: `map`, `map_err`, `and_then`, `or_else`, `filter`, `flatten`, `zip`.',
      'Extract with a default: `unwrap_or(v)`, `unwrap_or_else(|| ...)`, `unwrap_or_default()`; panic deliberately with `expect("reason")`.',
      'Convert: `ok_or(err)` / `ok_or_else` (Option to Result), `.ok()` (Result to Option), `transpose` (Option<Result> to Result<Option>).',
      'Inspect: `is_some`, `is_none`, `is_ok`, `is_err`, `is_some_and(|x| ...)`, and `as_ref()` / `as_deref()` to borrow the contents.',
      'Propagate with `?`; collect many results with `collect::<Result<Vec<_>, _>>()`.',
    ] },
    { heading: 'Iterator toolkit', points: [
      'Create: `iter()` (&T), `iter_mut()` (&mut T), `into_iter()` (T), ranges `0..n` / `0..=n`, `chars()`, `bytes()`, `lines()`, `split_whitespace()`.',
      'Adapt (lazy): `map`, `filter`, `filter_map`, `flat_map`, `enumerate`, `zip`, `chain`, `skip`, `take`, `take_while`, `rev`, `peekable`, `windows`/`chunks` on slices.',
      'Consume: `collect`, `sum`, `product`, `count`, `min`/`max`, `min_by_key`, `fold`, `any`, `all`, `find`, `position`, `last`, `for_each`.',
      'Sorting is on slices: `sort`, `sort_unstable`, `sort_by_key`, `sort_by(|a, b| a.x.cmp(&b.x).then(b.y.cmp(&a.y)))`, `dedup`, `binary_search`.',
    ] },
    { heading: 'Concurrency and async at a glance', points: [
      '`thread::spawn(move || ...)` returns a `JoinHandle`; `thread::scope(|s| ...)` lets threads borrow local data.',
      'Shared mutable state: `Arc<Mutex<T>>` or `Arc<RwLock<T>>`; simple counters: `AtomicUsize`. Message passing: `std::sync::mpsc` or crossbeam channels.',
      '`Send`: safe to move to another thread. `Sync`: safe to share `&T` between threads. `Rc` and `RefCell` are neither (in the relevant sense).',
      'Async: `async fn` returns a lazy `Future`; `#[tokio::main]` runs it; `tokio::spawn` needs `Send + \'static` futures; `join!` waits for all, `select!` for the first; `spawn_blocking` for blocking work.',
    ] },
    { heading: 'Cargo commands', points: [
      '`cargo new app` / `cargo new --lib mylib` — create a project. `cargo add serde --features derive` — add a dependency.',
      '`cargo check` (fast type check), `cargo build --release`, `cargo run -- args`, `cargo test`, `cargo bench`, `cargo doc --open`.',
      '`cargo fmt` (format), `cargo clippy` (lints), `cargo update` (refresh Cargo.lock within SemVer), `cargo tree` (dependency graph).',
      '`cargo install ripgrep` installs a binary; `rustup update` updates the toolchain; `rustup target add wasm32-unknown-unknown` adds a target.',
    ] },
  ],
  codeTabs: [
    { label: 'Syntax tour', language: 'rust', code: `use std::collections::HashMap;
use std::fmt;

#[derive(Debug, Clone, PartialEq)]
enum Shape { Circle { r: f64 }, Rect { w: f64, h: f64 } }

impl Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Circle { r } => std::f64::consts::PI * r * r,
            Shape::Rect { w, h } => w * h,
        }
    }
}

impl fmt::Display for Shape {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?} with area {:.1}", self, self.area())
    }
}

fn parse_kv(line: &str) -> Option<(&str, i32)> {
    let (k, v) = line.split_once('=')?;      // ? on Option
    Some((k.trim(), v.trim().parse().ok()?))
}

fn main() {
    let shapes = vec![Shape::Circle { r: 1.0 }, Shape::Rect { w: 2.0, h: 3.0 }];
    let total: f64 = shapes.iter().map(Shape::area).sum();
    println!("{} | total {total:.2}", shapes[1]);

    let mut counts: HashMap<&str, i32> = HashMap::new();
    for line in ["a = 1", "b = 2", "a = 5", "bad"] {
        if let Some((k, v)) = parse_kv(line) {
            *counts.entry(k).or_insert(0) += v;
        }
    }
    let mut keys: Vec<_> = counts.into_iter().collect();
    keys.sort();
    println!("{keys:?}");                       // [("a", 6), ("b", 2)]

    let Some(first) = shapes.first() else { return };
    println!("first area {:.2}", first.area());
}` },
    { label: 'Option / Result one-liners', language: 'rust', code: `fn main() {
    let name: Option<&str> = Some("ada");
    let missing: Option<&str> = None;

    println!("{}", name.map(str::to_uppercase).unwrap_or_default()); // ADA
    println!("{}", missing.unwrap_or("anonymous"));                   // anonymous
    println!("{:?}", missing.ok_or("no name"));                       // Err("no name")
    println!("{}", name.is_some_and(|n| n.len() == 3));               // true

    let n: Result<i32, _> = "42".parse::<i32>();
    let bad: Result<i32, _> = "x".parse::<i32>();
    println!("{:?}", n.as_ref().map(|v| v * 2));                      // Ok(84)
    println!("{}", bad.clone().unwrap_or(0));                         // 0
    println!("{:?}", bad.ok());                                       // None

    let all: Result<Vec<i32>, _> = ["1", "2", "3"].iter().map(|s| s.parse::<i32>()).collect();
    println!("{all:?}");                                              // Ok([1, 2, 3])
}` },
  ],
  qna: [
    { q: 'String or &str in a function signature?', a: 'Accept `&str` when you only read the text — callers can pass a `String` (it derefs), a literal or a slice. Take `String` (or `impl Into<String>`) when the function stores the text, so the caller decides whether to move or clone.' },
    { q: 'When should I use unwrap()?', a: 'In tests, examples, and for invariants you have just proven (for example a regex literal that you know compiles). Prefer `expect("why this cannot fail")` so the panic explains itself, and use `?` everywhere a failure is a normal possibility.' },
    { q: 'Box, Rc or Arc?', a: '`Box<T>`: one owner, value on the heap (recursive types, trait objects, large values). `Rc<T>`: several owners on one thread. `Arc<T>`: several owners across threads. Add `RefCell` (single thread) or `Mutex`/`RwLock` (multi-thread) when the shared value must be mutated.' },
    { q: 'impl Trait or dyn Trait?', a: '`impl Trait` (and generics) are resolved at compile time — fast, one concrete type per use. `dyn Trait` uses a vtable at runtime and allows mixing different types in one collection (`Vec<Box<dyn Trait>>`) at the cost of an indirect call.' },
    { q: 'Which derives should a plain data struct usually have?', a: '`Debug` almost always; `Clone` if it should be copyable; `Copy` only for small, plain values; `PartialEq`/`Eq` for comparisons; `Hash` to use as a map key; `Default` for zero-value construction; `Serialize`/`Deserialize` from serde when it crosses a boundary.' },
  ],
};
