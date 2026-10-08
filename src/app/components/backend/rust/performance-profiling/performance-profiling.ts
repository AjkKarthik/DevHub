import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-rust-performance-profiling',
  standalone: true,
  imports: [PageMetaComponent, PrerequisitesComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './performance-profiling.html',
  styleUrl: './performance-profiling.scss'
})
export class RustPerformanceProfiling {
  readingTime = 24;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'advanced';
  since = "Rust 2024";
  route = 'rust-performance-profiling';
  nextRoute = '/rust';
  nextLabel = "Rust Home";

  prerequisites: Prerequisite[] = [
    {
      "label": "Ownership & Borrowing",
      "route": "/rust/ownership-borrowing"
    },
    {
      "label": "Collections",
      "route": "/rust/collections"
    }
  ];

  quickRef: QuickRefItem[] = [
    {
      "name": "cargo build --release",
      "type": "syntax",
      "desc": "Optimised build (opt-level 3); always benchmark this"
    },
    {
      "name": "[profile.release] debug = true",
      "type": "syntax",
      "desc": "Keep symbols in release builds so profilers show function names"
    },
    {
      "name": "lto = \"fat\" / codegen-units = 1",
      "type": "syntax",
      "desc": "Slower compile, often faster and smaller binary"
    },
    {
      "name": "std::hint::black_box(x)",
      "type": "function",
      "desc": "Stop the optimiser from removing or precomputing benchmark work"
    },
    {
      "name": "criterion_group! / criterion_main!",
      "type": "function",
      "desc": "Statistically sound benchmarks in benches/"
    },
    {
      "name": "cargo flamegraph",
      "type": "syntax",
      "desc": "Profile a binary and render where CPU time goes"
    },
    {
      "name": "Vec::with_capacity(n) / String::with_capacity",
      "type": "method",
      "desc": "Pre-allocate to avoid repeated reallocation"
    },
    {
      "name": "Cow<'a, str>",
      "type": "type",
      "desc": "Borrow when possible, allocate only when you must modify"
    },
    {
      "name": "&str / &[T] parameters",
      "type": "type",
      "desc": "Accept borrowed views instead of owned String / Vec"
    },
    {
      "name": "RUSTFLAGS=\"-C target-cpu=native\"",
      "type": "syntax",
      "desc": "Use every instruction your CPU supports (binary is less portable)"
    }
  ];

  theory: TheoryPoint[] = [
    {
      "heading": "Build settings that matter",
      "points": [
        "The <code>dev</code> profile optimises for compile speed (opt-level 0) and enables overflow checks and debug assertions. <code>--release</code> uses opt-level 3, which is where iterator chains, generics and inlining become zero-cost.",
        "Release tuning knobs: <code>lto = \"fat\"</code> or <code>\"thin\"</code> (cross-crate inlining), <code>codegen-units = 1</code> (better optimisation, slower builds), <code>panic = \"abort\"</code> (smaller binaries), and <code>debug = true</code> or <code>\"line-tables-only\"</code> so profilers can attribute samples to source lines.",
        "A custom profile such as <code>[profile.profiling] inherits = \"release\"</code> with <code>debug = true</code> keeps your shipping build lean while giving profilers what they need.",
        "The allocator can matter for allocation-heavy servers: switching the global allocator to <code>mimalloc</code> or <code>jemalloc</code> is a one-line change worth measuring."
      ]
    },
    {
      "heading": "Benchmarking correctly",
      "points": [
        "Micro-benchmarks with <code>Instant::now()</code> loops are easily fooled: the optimiser may hoist or delete the work, the CPU warms up, and noise varies between runs. Use <code>criterion</code> (or <code>divan</code>) for warm-up, many samples, statistics and comparison with the previous run.",
        "Wrap inputs and results in <code>std::hint::black_box</code> so the compiler cannot constant-fold the input or drop an unused result.",
        "Benchmark realistic sizes and data. A function that wins on 10 elements can lose on 10 million because of cache behaviour or allocation.",
        "Track performance over time: keep benches in <code>benches/</code>, run them before and after a change, and treat a regression like a failing test."
      ]
    },
    {
      "heading": "Profiling",
      "points": [
        "Profile before guessing. On Linux, <code>perf record -g</code> plus <code>perf report</code>, or <code>cargo flamegraph</code> for an interactive SVG, shows which functions consume CPU time; <code>samply</code> gives a Firefox-profiler UI on Linux and macOS.",
        "For allocations, <code>heaptrack</code>, <code>dhat</code> (the <code>dhat</code> crate) or <code>bytehound</code> show where memory is allocated and how often — frequently the real bottleneck in Rust services.",
        "Async code: <code>tokio-console</code> shows tasks that poll for too long, a common cause of latency when blocking work sneaks onto runtime threads.",
        "Read a flamegraph by width, not height: the widest boxes are where the time goes. Optimise the widest box you control, re-measure, repeat."
      ]
    },
    {
      "heading": "Common fixes",
      "points": [
        "Avoid needless allocation: pre-size with <code>with_capacity</code>, reuse buffers with <code>clear()</code> instead of creating new ones, and build strings with <code>push_str</code> or <code>write!</code> instead of repeated <code>format!</code>.",
        "Borrow instead of cloning: take <code>&amp;str</code> and <code>&amp;[T]</code> parameters, return references or iterators, and use <code>Cow&lt;str&gt;</code> when a function only sometimes needs to modify its input.",
        "Prefer iterator chains over index loops; they let the compiler remove bounds checks. Use <code>sort_unstable</code> when stability is not needed, and <code>HashMap</code> with a faster hasher (e.g. <code>rustc-hash</code>) for trusted keys.",
        "Data layout matters: a <code>Vec</code> of small <code>Copy</code> structs is cache-friendly, while <code>Vec&lt;Box&lt;T&gt;&gt;</code> or linked structures chase pointers. Splitting hot and cold fields can make loops several times faster.",
        "Parallelise CPU-bound work over collections with <code>rayon</code>: changing <code>.iter()</code> to <code>.par_iter()</code> spreads it across all cores."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Cargo profiles",
      "code": "# Cargo.toml\n[profile.release]\nlto = \"thin\"            # cross-crate inlining at modest build cost\ncodegen-units = 1       # better optimisation, slower compile\npanic = \"abort\"         # smaller binary, no unwinding\n\n[profile.profiling]     # cargo build --profile profiling\ninherits = \"release\"\ndebug = true            # symbols for perf / flamegraph\n\n[[bench]]\nname = \"parse\"\nharness = false         # criterion provides its own main\n\n# Commands\ncargo build --release\ncargo bench                          # run criterion benches\ncargo install flamegraph\ncargo flamegraph --profile profiling --bin server\nperf record -g ./target/profiling/server && perf report",
      "language": "bash"
    },
    {
      "label": "criterion benchmark",
      "code": "// benches/parse.rs\nuse criterion::{Criterion, criterion_group, criterion_main};\nuse std::hint::black_box;\n\nfn sum_digits_alloc(s: &str) -> u32 {\n    s.chars().filter(|c| c.is_ascii_digit())\n        .map(|c| c.to_string().parse::<u32>().unwrap())   // allocates per char\n        .sum()\n}\n\nfn sum_digits(s: &str) -> u32 {\n    s.bytes().filter(u8::is_ascii_digit).map(|b| (b - b'0') as u32).sum()\n}\n\nfn bench(c: &mut Criterion) {\n    let input = \"a1b2c3d4e5f6g7h8i9\".repeat(1000);\n    c.bench_function(\"sum_digits_alloc\", |b| b.iter(|| sum_digits_alloc(black_box(&input))));\n    c.bench_function(\"sum_digits\", |b| b.iter(|| sum_digits(black_box(&input))));\n}\n\ncriterion_group!(benches, bench);\ncriterion_main!(benches);",
      "language": "rust"
    },
    {
      "label": "Allocation & clone fixes",
      "code": "use std::borrow::Cow;\nuse std::fmt::Write;\nuse std::time::Instant;\n\n// Clones every name although it only reads them\nfn longest_clone(names: &Vec<String>) -> String {\n    let mut best = String::new();\n    for n in names.clone() {               // allocates a copy of every String\n        if n.len() >= best.len() { best = n; }  // last longest, like max_by_key\n    }\n    best\n}\n\n// Borrows: no allocation at all\nfn longest(names: &[String]) -> &str {\n    names.iter().max_by_key(|n| n.len()).map(String::as_str).unwrap_or(\"\")\n}\n\n// Allocate only when a change is needed\nfn normalize(s: &str) -> Cow<'_, str> {\n    if s.contains('\\t') { Cow::Owned(s.replace('\\t', \"    \")) } else { Cow::Borrowed(s) }\n}\n\nfn render(rows: &[(u32, &str)]) -> String {\n    let mut out = String::with_capacity(rows.len() * 16);  // one allocation\n    for (id, name) in rows {\n        writeln!(out, \"{id}: {name}\").unwrap();               // no temporary String per row\n    }\n    out\n}\n\nfn main() {\n    let names: Vec<String> = (0..200_000).map(|i| format!(\"user-{i}\")).collect();\n\n    let t = Instant::now();\n    let a = longest_clone(&names);   // 200,000 extra String allocations\n    println!(\"clone version: {:?}\", t.elapsed());\n    let t = Instant::now();\n    let b = longest(&names);         // zero allocations\n    println!(\"borrow version: {:?}\", t.elapsed());\n    println!(\"{a} == {b}: {}\", a == b);   // user-199999 == user-199999: true\n\n    println!(\"{:?} {:?}\", normalize(\"no tabs\"), normalize(\"a\\tb\"));\n    print!(\"{}\", render(&[(1, \"ada\"), (2, \"bob\")]));\n}",
      "language": "rust"
    },
    {
      "label": "Parallel with rayon",
      "code": "use rayon::prelude::*;\n\nfn is_prime(n: u64) -> bool {\n    if n < 2 { return false; }\n    let mut d = 2;\n    while d * d <= n {\n        if n % d == 0 { return false; }\n        d += 1;\n    }\n    true\n}\n\nfn main() {\n    let numbers: Vec<u64> = (1..200_000).collect();\n\n    let serial = numbers.iter().filter(|&&n| is_prime(n)).count();\n    let parallel = numbers.par_iter().filter(|&&n| is_prime(n)).count(); // same code, all cores\n\n    println!(\"{serial} {parallel}\");   // 17984 17984\n}",
      "language": "rust"
    }
  ];

  mistakes: CommonMistake[] = [
    {
      "title": "Benchmarking a debug build",
      "wrong": "cargo run          # \"my Rust is slower than Python!\"\ncargo test --bench # benches without --release",
      "right": "cargo run --release\ncargo bench        # criterion benches build with the bench profile (optimised)",
      "explanation": "Debug builds skip optimisation and add overflow checks. Iterator-heavy code can be orders of magnitude slower. Only release-mode numbers mean anything."
    },
    {
      "title": "Timing loops the optimiser deletes",
      "wrong": "let t = Instant::now();\nfor _ in 0..1_000_000 { compute(42); }   // result unused, input constant\nprintln!(\"{:?}\", t.elapsed());            // may print a few nanoseconds",
      "right": "use std::hint::black_box;\nlet t = Instant::now();\nfor _ in 0..1_000_000 { black_box(compute(black_box(42))); }\nprintln!(\"{:?}\", t.elapsed());\n// better: a criterion benchmark",
      "explanation": "If the result is unused and the input constant, LLVM may compute it once or not at all. black_box hides values from the optimiser so the work really happens."
    },
    {
      "title": "Cloning to satisfy the borrow checker",
      "wrong": "fn total(items: Vec<Item>) -> u64 { items.iter().map(|i| i.price).sum() }\nlet t = total(cart.items.clone());   // copies the whole Vec just to read it",
      "right": "fn total(items: &[Item]) -> u64 { items.iter().map(|i| i.price).sum() }\nlet t = total(&cart.items);",
      "explanation": "Taking ownership when you only read forces callers to clone. Accept &[T] or &str; clone only when you genuinely need an independent copy."
    },
    {
      "title": "Growing collections one element at a time",
      "wrong": "let mut out = Vec::new();\nfor x in input { out.push(transform(x)); }   // reallocates as it grows",
      "right": "let out: Vec<_> = input.iter().map(transform).collect(); // size hint used\n// or Vec::with_capacity(input.len()) before pushing",
      "explanation": "Vec doubles its capacity when full, copying elements each time. collect() uses the iterator size hint, and with_capacity allocates once when you know the size."
    },
    {
      "title": "Optimising without profiling",
      "wrong": "// Rewrote the JSON parser with unsafe and SIMD...\n// ...the flamegraph later showed 80% of time in a database call",
      "right": "// 1. cargo flamegraph (or perf) on a realistic workload\n// 2. fix the widest box you control\n// 3. re-measure with criterion",
      "explanation": "Intuition about hot spots is often wrong. Profile realistic workloads first so effort goes where the time actually is."
    }
  ];

  challenge: Challenge = {
    "title": "Remove the allocations",
    "language": "rust",
    "description": "The function word_lengths_slow lowercases the whole text into a new String, splits it, collects Vec<String> and formats each length into a fresh String before joining. Rewrite it as word_lengths(text: &str) -> String producing the same output (lengths separated by commas) with a single output allocation: iterate with split_whitespace over the borrowed text, count chars without lowercasing, and write into one String created with with_capacity. Confirm both versions agree.",
    "hints": [
      "Lowercasing does not change the char count for ASCII text — and you do not need it at all for lengths.",
      "Use std::fmt::Write and write!(out, \"{}\", n) to append without temporary Strings.",
      "Add the comma before every item except the first."
    ],
    "starterCode": "fn word_lengths_slow(text: &str) -> String {\n    let lower = text.to_lowercase();\n    let words: Vec<String> = lower.split_whitespace().map(|w| w.to_string()).collect();\n    let lens: Vec<String> = words.iter().map(|w| w.chars().count().to_string()).collect();\n    lens.join(\",\")\n}\n\nfn word_lengths(text: &str) -> String {\n    todo!()\n}\n\nfn main() {\n    let text = \"The quick brown fox jumps over the lazy dog\";\n    println!(\"{}\", word_lengths_slow(text));\n}",
    "solution": "use std::fmt::Write;\n\nfn word_lengths_slow(text: &str) -> String {\n    let lower = text.to_lowercase();\n    let words: Vec<String> = lower.split_whitespace().map(|w| w.to_string()).collect();\n    let lens: Vec<String> = words.iter().map(|w| w.chars().count().to_string()).collect();\n    lens.join(\",\")\n}\n\nfn word_lengths(text: &str) -> String {\n    let mut out = String::with_capacity(text.len() / 2);\n    for (i, word) in text.split_whitespace().enumerate() {\n        if i > 0 { out.push(','); }\n        write!(out, \"{}\", word.chars().count()).unwrap();\n    }\n    out\n}\n\nfn main() {\n    let text = \"The quick brown fox jumps over the lazy dog\";\n    println!(\"{}\", word_lengths(text));               // 3,5,5,3,5,4,3,4,3\n    assert_eq!(word_lengths(text), word_lengths_slow(text));\n    let big = text.repeat(10_000);\n    assert_eq!(word_lengths(&big), word_lengths_slow(&big));\n    println!(\"both versions agree\");\n}"
  };

  quiz: QuizQuestion[] = [
    {
      "q": "Why can a micro-benchmark report almost zero time?",
      "options": [
        "Rust is infinitely fast",
        "The optimiser removed or precomputed work whose result was unused",
        "The timer is broken",
        "Debug assertions were disabled"
      ],
      "answer": 1,
      "explanation": "Dead-code elimination and constant folding remove work that has no observable effect. black_box prevents that."
    },
    {
      "q": "Which setting keeps function names visible to profilers in an optimised build?",
      "options": [
        "opt-level = 0",
        "debug = true in the release (or a profiling) profile",
        "panic = \"abort\"",
        "incremental = true"
      ],
      "answer": 1,
      "explanation": "Debug info can be emitted alongside full optimisation so perf and flamegraph can map samples to functions and lines."
    },
    {
      "q": "What does Cow<str> let a function do?",
      "options": [
        "Share a string across threads",
        "Return the borrowed input unchanged or an owned modified copy, allocating only when needed",
        "Make strings immutable",
        "Compress strings"
      ],
      "answer": 1,
      "explanation": "Cow (clone on write) is either Borrowed or Owned, so the common no-change path avoids allocation."
    },
    {
      "q": "In a flamegraph, what indicates where most CPU time is spent?",
      "options": [
        "The tallest stack",
        "The widest boxes",
        "The colour red",
        "The leftmost box"
      ],
      "answer": 1,
      "explanation": "Width is proportional to the share of samples; height is just call-stack depth."
    },
    {
      "q": "What is a typical effect of changing .iter() to rayon's .par_iter() on a CPU-bound pipeline?",
      "options": [
        "Compile error for all code",
        "The work is split across a thread pool using all cores",
        "It becomes async",
        "Memory is shared without synchronisation"
      ],
      "answer": 1,
      "explanation": "Rayon's parallel iterators use work stealing across a thread pool; the closures must be Send/Sync, which the compiler checks."
    }
  ];

  qna: QnaItem[] = [
    {
      "q": "How do you approach a performance problem in a Rust service?",
      "a": "Reproduce it with a realistic workload, measure end-to-end latency and throughput, then profile the release build (with debug symbols) using perf/flamegraph or samply, plus an allocation profiler if memory churn is suspected. Fix the biggest box you control — often allocations, clones, blocking calls on async runtime threads, lock contention or N+1 database calls — and confirm the gain with a criterion benchmark or load test before moving on."
    },
    {
      "q": "Why is clone() sometimes a performance problem and how do you avoid it?",
      "a": "For heap-owning types like String, Vec or HashMap, <code>clone</code> allocates and copies all contents. It often appears to silence borrow-checker errors. Instead, borrow (<code>&amp;str</code>, <code>&amp;[T]</code>), restructure so ownership moves rather than copies, share with <code>Rc</code>/<code>Arc</code> when many owners are needed, or use <code>Cow</code> for \"maybe modified\" data. Cloning small <code>Copy</code> types or an <code>Arc</code> is cheap and fine."
    },
    {
      "q": "What do LTO and codegen-units do?",
      "a": "Link-time optimisation lets LLVM optimise across crate boundaries, enabling inlining of dependency functions and removal of unused code — often faster and smaller binaries at the cost of longer builds. <code>codegen-units</code> splits a crate into parallel compilation units; setting it to 1 gives the optimiser the whole crate at once (better code, slower compile). Both are commonly enabled for release builds where compile time is less critical."
    },
    {
      "q": "How do you benchmark Rust code reliably?",
      "a": "Use a harness such as criterion or divan in <code>benches/</code>: they warm up, collect many samples, report confidence intervals and compare against the previous run. Feed realistic input sizes, wrap inputs and outputs in <code>black_box</code>, run on a quiet machine, and keep benchmarks under version control so regressions are visible."
    }
  ];

  revision: RevisionSummary = {
    "oneLiner": "Measure release builds with criterion and profilers, then cut allocations and clones, borrow instead of copying, choose cache-friendly layouts and parallelise with rayon.",
    "mustKnow": [
      "Only benchmark <code>--release</code>; debug builds are unoptimised and check overflow.",
      "Use <code>black_box</code> and a harness like criterion for micro-benchmarks.",
      "Keep debug symbols for profiling; read flamegraphs by width.",
      "Prefer <code>&amp;str</code>/<code>&amp;[T]</code> parameters; avoid needless <code>clone()</code>.",
      "<code>with_capacity</code>, buffer reuse, <code>write!</code> into one String.",
      "<code>Cow</code> for maybe-modified data; <code>rayon</code> for data parallelism."
    ],
    "interviewFocus": [
      "Walk through how you would find and fix a hot spot.",
      "Explain why debug and release builds differ.",
      "Give examples of hidden allocation costs in Rust code."
    ]
  };
}
