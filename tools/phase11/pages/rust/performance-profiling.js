module.exports = {
  slug: 'performance-profiling',
  subtitle: 'Measure before you optimise: release builds and profiles, criterion benchmarks with black_box, flamegraphs and perf to find hot spots, then the usual fixes — fewer allocations and clones, borrowing, Cow, with_capacity, and better data layout.',
  readingTime: 24,
  prerequisites: [
    { label: 'Ownership & Borrowing', route: '/rust/ownership-borrowing' },
    { label: 'Collections', route: '/rust/collections' },
  ],
  apis: ['cargo build --release', '[profile.release]', 'criterion / std::hint::black_box', 'cargo flamegraph', 'Vec::with_capacity', 'Cow<str>'],
  tip: 'Never judge speed from a debug build. cargo run without --release can be 10–100x slower for iterator-heavy code, and it also checks integer overflow. Profile the release build, with debug symbols enabled so the profiler can name functions.',
  gotchas: [
    'The optimiser deletes work whose result is never used, so naive timing loops can measure nothing. Wrap inputs and outputs in std::hint::black_box or use criterion.',
    'Debug builds panic on integer overflow while release builds wrap by default — a behaviour difference, not just a speed difference.',
    'clone() inside a loop is a common hidden cost: cloning a String or Vec allocates and copies every time.',
  ],
  quickRef: [
    { name: 'cargo build --release', type: 'syntax', desc: 'Optimised build (opt-level 3); always benchmark this' },
    { name: '[profile.release] debug = true', type: 'syntax', desc: 'Keep symbols in release builds so profilers show function names' },
    { name: 'lto = "fat" / codegen-units = 1', type: 'syntax', desc: 'Slower compile, often faster and smaller binary' },
    { name: 'std::hint::black_box(x)', type: 'function', desc: 'Stop the optimiser from removing or precomputing benchmark work' },
    { name: 'criterion_group! / criterion_main!', type: 'function', desc: 'Statistically sound benchmarks in benches/' },
    { name: 'cargo flamegraph', type: 'syntax', desc: 'Profile a binary and render where CPU time goes' },
    { name: 'Vec::with_capacity(n) / String::with_capacity', type: 'method', desc: 'Pre-allocate to avoid repeated reallocation' },
    { name: 'Cow<\'a, str>', type: 'type', desc: 'Borrow when possible, allocate only when you must modify' },
    { name: '&str / &[T] parameters', type: 'type', desc: 'Accept borrowed views instead of owned String / Vec' },
    { name: 'RUSTFLAGS="-C target-cpu=native"', type: 'syntax', desc: 'Use every instruction your CPU supports (binary is less portable)' },
  ],
  theory: [
    { heading: 'Build settings that matter', points: [
      'The `dev` profile optimises for compile speed (opt-level 0) and enables overflow checks and debug assertions. `--release` uses opt-level 3, which is where iterator chains, generics and inlining become zero-cost.',
      'Release tuning knobs: `lto = "fat"` or `"thin"` (cross-crate inlining), `codegen-units = 1` (better optimisation, slower builds), `panic = "abort"` (smaller binaries), and `debug = true` or `"line-tables-only"` so profilers can attribute samples to source lines.',
      'A custom profile such as `[profile.profiling] inherits = "release"` with `debug = true` keeps your shipping build lean while giving profilers what they need.',
      'The allocator can matter for allocation-heavy servers: switching the global allocator to `mimalloc` or `jemalloc` is a one-line change worth measuring.',
    ] },
    { heading: 'Benchmarking correctly', points: [
      'Micro-benchmarks with `Instant::now()` loops are easily fooled: the optimiser may hoist or delete the work, the CPU warms up, and noise varies between runs. Use `criterion` (or `divan`) for warm-up, many samples, statistics and comparison with the previous run.',
      'Wrap inputs and results in `std::hint::black_box` so the compiler cannot constant-fold the input or drop an unused result.',
      'Benchmark realistic sizes and data. A function that wins on 10 elements can lose on 10 million because of cache behaviour or allocation.',
      'Track performance over time: keep benches in `benches/`, run them before and after a change, and treat a regression like a failing test.',
    ] },
    { heading: 'Profiling', points: [
      'Profile before guessing. On Linux, `perf record -g` plus `perf report`, or `cargo flamegraph` for an interactive SVG, shows which functions consume CPU time; `samply` gives a Firefox-profiler UI on Linux and macOS.',
      'For allocations, `heaptrack`, `dhat` (the `dhat` crate) or `bytehound` show where memory is allocated and how often — frequently the real bottleneck in Rust services.',
      'Async code: `tokio-console` shows tasks that poll for too long, a common cause of latency when blocking work sneaks onto runtime threads.',
      'Read a flamegraph by width, not height: the widest boxes are where the time goes. Optimise the widest box you control, re-measure, repeat.',
    ] },
    { heading: 'Common fixes', points: [
      'Avoid needless allocation: pre-size with `with_capacity`, reuse buffers with `clear()` instead of creating new ones, and build strings with `push_str` or `write!` instead of repeated `format!`.',
      'Borrow instead of cloning: take `&str` and `&[T]` parameters, return references or iterators, and use `Cow<str>` when a function only sometimes needs to modify its input.',
      'Prefer iterator chains over index loops; they let the compiler remove bounds checks. Use `sort_unstable` when stability is not needed, and `HashMap` with a faster hasher (e.g. `rustc-hash`) for trusted keys.',
      'Data layout matters: a `Vec` of small `Copy` structs is cache-friendly, while `Vec<Box<T>>` or linked structures chase pointers. Splitting hot and cold fields can make loops several times faster.',
      'Parallelise CPU-bound work over collections with `rayon`: changing `.iter()` to `.par_iter()` spreads it across all cores.',
    ] },
  ],
  codeTabs: [
    { label: 'Cargo profiles', language: 'bash', code: `# Cargo.toml
[profile.release]
lto = "thin"            # cross-crate inlining at modest build cost
codegen-units = 1       # better optimisation, slower compile
panic = "abort"         # smaller binary, no unwinding

[profile.profiling]     # cargo build --profile profiling
inherits = "release"
debug = true            # symbols for perf / flamegraph

[[bench]]
name = "parse"
harness = false         # criterion provides its own main

# Commands
cargo build --release
cargo bench                          # run criterion benches
cargo install flamegraph
cargo flamegraph --profile profiling --bin server
perf record -g ./target/profiling/server && perf report` },
    { label: 'criterion benchmark', language: 'rust', run: false, code: `// benches/parse.rs
use criterion::{Criterion, criterion_group, criterion_main};
use std::hint::black_box;

fn sum_digits_alloc(s: &str) -> u32 {
    s.chars().filter(|c| c.is_ascii_digit())
        .map(|c| c.to_string().parse::<u32>().unwrap())   // allocates per char
        .sum()
}

fn sum_digits(s: &str) -> u32 {
    s.bytes().filter(u8::is_ascii_digit).map(|b| (b - b'0') as u32).sum()
}

fn bench(c: &mut Criterion) {
    let input = "a1b2c3d4e5f6g7h8i9".repeat(1000);
    c.bench_function("sum_digits_alloc", |b| b.iter(|| sum_digits_alloc(black_box(&input))));
    c.bench_function("sum_digits", |b| b.iter(|| sum_digits(black_box(&input))));
}

criterion_group!(benches, bench);
criterion_main!(benches);` },
    { label: 'Allocation & clone fixes', language: 'rust', code: `use std::borrow::Cow;
use std::fmt::Write;
use std::time::Instant;

// Clones every name although it only reads them
fn longest_clone(names: &Vec<String>) -> String {
    let mut best = String::new();
    for n in names.clone() {               // allocates a copy of every String
        if n.len() >= best.len() { best = n; }  // last longest, like max_by_key
    }
    best
}

// Borrows: no allocation at all
fn longest(names: &[String]) -> &str {
    names.iter().max_by_key(|n| n.len()).map(String::as_str).unwrap_or("")
}

// Allocate only when a change is needed
fn normalize(s: &str) -> Cow<'_, str> {
    if s.contains('\\t') { Cow::Owned(s.replace('\\t', "    ")) } else { Cow::Borrowed(s) }
}

fn render(rows: &[(u32, &str)]) -> String {
    let mut out = String::with_capacity(rows.len() * 16);  // one allocation
    for (id, name) in rows {
        writeln!(out, "{id}: {name}").unwrap();               // no temporary String per row
    }
    out
}

fn main() {
    let names: Vec<String> = (0..200_000).map(|i| format!("user-{i}")).collect();

    let t = Instant::now();
    let a = longest_clone(&names);   // 200,000 extra String allocations
    println!("clone version: {:?}", t.elapsed());
    let t = Instant::now();
    let b = longest(&names);         // zero allocations
    println!("borrow version: {:?}", t.elapsed());
    println!("{a} == {b}: {}", a == b);   // user-199999 == user-199999: true

    println!("{:?} {:?}", normalize("no tabs"), normalize("a\\tb"));
    print!("{}", render(&[(1, "ada"), (2, "bob")]));
}` },
    { label: 'Parallel with rayon', language: 'rust', code: `use rayon::prelude::*;

fn is_prime(n: u64) -> bool {
    if n < 2 { return false; }
    let mut d = 2;
    while d * d <= n {
        if n % d == 0 { return false; }
        d += 1;
    }
    true
}

fn main() {
    let numbers: Vec<u64> = (1..200_000).collect();

    let serial = numbers.iter().filter(|&&n| is_prime(n)).count();
    let parallel = numbers.par_iter().filter(|&&n| is_prime(n)).count(); // same code, all cores

    println!("{serial} {parallel}");   // 17984 17984
}` },
  ],
  mistakes: [
    { title: 'Benchmarking a debug build', wrong: `cargo run          # "my Rust is slower than Python!"
cargo test --bench # benches without --release`, right: `cargo run --release
cargo bench        # criterion benches build with the bench profile (optimised)`, explanation: 'Debug builds skip optimisation and add overflow checks. Iterator-heavy code can be orders of magnitude slower. Only release-mode numbers mean anything.' },
    { title: 'Timing loops the optimiser deletes', wrong: `let t = Instant::now();
for _ in 0..1_000_000 { compute(42); }   // result unused, input constant
println!("{:?}", t.elapsed());            // may print a few nanoseconds`, right: `use std::hint::black_box;
let t = Instant::now();
for _ in 0..1_000_000 { black_box(compute(black_box(42))); }
println!("{:?}", t.elapsed());
// better: a criterion benchmark`, explanation: 'If the result is unused and the input constant, LLVM may compute it once or not at all. black_box hides values from the optimiser so the work really happens.' },
    { title: 'Cloning to satisfy the borrow checker', wrong: `fn total(items: Vec<Item>) -> u64 { items.iter().map(|i| i.price).sum() }
let t = total(cart.items.clone());   // copies the whole Vec just to read it`, right: `fn total(items: &[Item]) -> u64 { items.iter().map(|i| i.price).sum() }
let t = total(&cart.items);`, explanation: 'Taking ownership when you only read forces callers to clone. Accept &[T] or &str; clone only when you genuinely need an independent copy.' },
    { title: 'Growing collections one element at a time', wrong: `let mut out = Vec::new();
for x in input { out.push(transform(x)); }   // reallocates as it grows`, right: `let out: Vec<_> = input.iter().map(transform).collect(); // size hint used
// or Vec::with_capacity(input.len()) before pushing`, explanation: 'Vec doubles its capacity when full, copying elements each time. collect() uses the iterator size hint, and with_capacity allocates once when you know the size.' },
    { title: 'Optimising without profiling', wrong: `// Rewrote the JSON parser with unsafe and SIMD...
// ...the flamegraph later showed 80% of time in a database call`, right: `// 1. cargo flamegraph (or perf) on a realistic workload
// 2. fix the widest box you control
// 3. re-measure with criterion`, explanation: 'Intuition about hot spots is often wrong. Profile realistic workloads first so effort goes where the time actually is.' },
  ],
  challenge: {
    title: 'Remove the allocations',
    language: 'rust',
    description: 'The function word_lengths_slow lowercases the whole text into a new String, splits it, collects Vec<String> and formats each length into a fresh String before joining. Rewrite it as word_lengths(text: &str) -> String producing the same output (lengths separated by commas) with a single output allocation: iterate with split_whitespace over the borrowed text, count chars without lowercasing, and write into one String created with with_capacity. Confirm both versions agree.',
    hints: ['Lowercasing does not change the char count for ASCII text — and you do not need it at all for lengths.', 'Use std::fmt::Write and write!(out, "{}", n) to append without temporary Strings.', 'Add the comma before every item except the first.'],
    starterCode: `fn word_lengths_slow(text: &str) -> String {
    let lower = text.to_lowercase();
    let words: Vec<String> = lower.split_whitespace().map(|w| w.to_string()).collect();
    let lens: Vec<String> = words.iter().map(|w| w.chars().count().to_string()).collect();
    lens.join(",")
}

fn word_lengths(text: &str) -> String {
    todo!()
}

fn main() {
    let text = "The quick brown fox jumps over the lazy dog";
    println!("{}", word_lengths_slow(text));
}`,
    solution: `use std::fmt::Write;

fn word_lengths_slow(text: &str) -> String {
    let lower = text.to_lowercase();
    let words: Vec<String> = lower.split_whitespace().map(|w| w.to_string()).collect();
    let lens: Vec<String> = words.iter().map(|w| w.chars().count().to_string()).collect();
    lens.join(",")
}

fn word_lengths(text: &str) -> String {
    let mut out = String::with_capacity(text.len() / 2);
    for (i, word) in text.split_whitespace().enumerate() {
        if i > 0 { out.push(','); }
        write!(out, "{}", word.chars().count()).unwrap();
    }
    out
}

fn main() {
    let text = "The quick brown fox jumps over the lazy dog";
    println!("{}", word_lengths(text));               // 3,5,5,3,5,4,3,4,3
    assert_eq!(word_lengths(text), word_lengths_slow(text));
    let big = text.repeat(10_000);
    assert_eq!(word_lengths(&big), word_lengths_slow(&big));
    println!("both versions agree");
}`,
  },
  quiz: [
    { q: 'Why can a micro-benchmark report almost zero time?', options: ['Rust is infinitely fast', 'The optimiser removed or precomputed work whose result was unused', 'The timer is broken', 'Debug assertions were disabled'], answer: 1, explanation: 'Dead-code elimination and constant folding remove work that has no observable effect. black_box prevents that.' },
    { q: 'Which setting keeps function names visible to profilers in an optimised build?', options: ['opt-level = 0', 'debug = true in the release (or a profiling) profile', 'panic = "abort"', 'incremental = true'], answer: 1, explanation: 'Debug info can be emitted alongside full optimisation so perf and flamegraph can map samples to functions and lines.' },
    { q: 'What does Cow<str> let a function do?', options: ['Share a string across threads', 'Return the borrowed input unchanged or an owned modified copy, allocating only when needed', 'Make strings immutable', 'Compress strings'], answer: 1, explanation: 'Cow (clone on write) is either Borrowed or Owned, so the common no-change path avoids allocation.' },
    { q: 'In a flamegraph, what indicates where most CPU time is spent?', options: ['The tallest stack', 'The widest boxes', 'The colour red', 'The leftmost box'], answer: 1, explanation: 'Width is proportional to the share of samples; height is just call-stack depth.' },
    { q: 'What is a typical effect of changing .iter() to rayon\'s .par_iter() on a CPU-bound pipeline?', options: ['Compile error for all code', 'The work is split across a thread pool using all cores', 'It becomes async', 'Memory is shared without synchronisation'], answer: 1, explanation: 'Rayon\'s parallel iterators use work stealing across a thread pool; the closures must be Send/Sync, which the compiler checks.' },
  ],
  qna: [
    { q: 'How do you approach a performance problem in a Rust service?', a: 'Reproduce it with a realistic workload, measure end-to-end latency and throughput, then profile the release build (with debug symbols) using perf/flamegraph or samply, plus an allocation profiler if memory churn is suspected. Fix the biggest box you control — often allocations, clones, blocking calls on async runtime threads, lock contention or N+1 database calls — and confirm the gain with a criterion benchmark or load test before moving on.' },
    { q: 'Why is clone() sometimes a performance problem and how do you avoid it?', a: 'For heap-owning types like String, Vec or HashMap, `clone` allocates and copies all contents. It often appears to silence borrow-checker errors. Instead, borrow (`&str`, `&[T]`), restructure so ownership moves rather than copies, share with `Rc`/`Arc` when many owners are needed, or use `Cow` for "maybe modified" data. Cloning small `Copy` types or an `Arc` is cheap and fine.' },
    { q: 'What do LTO and codegen-units do?', a: 'Link-time optimisation lets LLVM optimise across crate boundaries, enabling inlining of dependency functions and removal of unused code — often faster and smaller binaries at the cost of longer builds. `codegen-units` splits a crate into parallel compilation units; setting it to 1 gives the optimiser the whole crate at once (better code, slower compile). Both are commonly enabled for release builds where compile time is less critical.' },
    { q: 'How do you benchmark Rust code reliably?', a: 'Use a harness such as criterion or divan in `benches/`: they warm up, collect many samples, report confidence intervals and compare against the previous run. Feed realistic input sizes, wrap inputs and outputs in `black_box`, run on a quiet machine, and keep benchmarks under version control so regressions are visible.' },
  ],
  revision: {
    oneLiner: 'Measure release builds with criterion and profilers, then cut allocations and clones, borrow instead of copying, choose cache-friendly layouts and parallelise with rayon.',
    mustKnow: [
      'Only benchmark `--release`; debug builds are unoptimised and check overflow.',
      'Use `black_box` and a harness like criterion for micro-benchmarks.',
      'Keep debug symbols for profiling; read flamegraphs by width.',
      'Prefer `&str`/`&[T]` parameters; avoid needless `clone()`.',
      '`with_capacity`, buffer reuse, `write!` into one String.',
      '`Cow` for maybe-modified data; `rayon` for data parallelism.',
    ],
    interviewFocus: [
      'Walk through how you would find and fix a hot spot.',
      'Explain why debug and release builds differ.',
      'Give examples of hidden allocation costs in Rust code.',
    ],
  },
};
