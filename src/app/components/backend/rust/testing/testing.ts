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
  selector: 'app-rust-testing',
  standalone: true,
  imports: [PageMetaComponent, PrerequisitesComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './testing.html',
  styleUrl: './testing.scss'
})
export class RustTesting {
  readingTime = 24;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = "Rust 2024";
  route = 'rust-testing';
  nextRoute = '/rust/macros';
  nextLabel = "Macros";

  prerequisites: Prerequisite[] = [
    {
      "label": "Modules & Cargo",
      "route": "/rust/modules-cargo"
    },
    {
      "label": "Traits & Generics",
      "route": "/rust/traits-generics"
    }
  ];

  quickRef: QuickRefItem[] = [
    {
      "name": "#[cfg(test)] mod tests { use super::*; }",
      "type": "syntax",
      "desc": "Unit tests next to the code, compiled only for cargo test"
    },
    {
      "name": "#[test] fn name() { ... }",
      "type": "decorator",
      "desc": "Mark a function as a test; a panic means failure"
    },
    {
      "name": "assert_eq!(a, b, \"msg {x}\")",
      "type": "function",
      "desc": "Compare with Debug output of both sides on failure"
    },
    {
      "name": "#[should_panic(expected = \"...\")]",
      "type": "decorator",
      "desc": "Pass only if the code panics with that message"
    },
    {
      "name": "fn t() -> Result<(), E>",
      "type": "function",
      "desc": "Use ? inside tests; an Err fails the test"
    },
    {
      "name": "#[ignore]",
      "type": "decorator",
      "desc": "Skip slow tests unless run with -- --ignored"
    },
    {
      "name": "tests/api.rs",
      "type": "syntax",
      "desc": "Integration test: a separate crate using only the public API"
    },
    {
      "name": "/// ``` assert_eq!(add(1, 2), 3); ```",
      "type": "syntax",
      "desc": "Doc test: an example in docs, compiled and run by cargo test"
    },
    {
      "name": "#[tokio::test]",
      "type": "decorator",
      "desc": "Async test with its own runtime"
    },
    {
      "name": "proptest! { fn p(x in 0..100i32) { ... } }",
      "type": "function",
      "desc": "Property-based test with generated inputs and shrinking"
    }
  ];

  theory: TheoryPoint[] = [
    {
      "heading": "Three kinds of test",
      "points": [
        "Unit tests live in a <code>#[cfg(test)] mod tests</code> inside the file they test. Because the module is a child, <code>use super::*;</code> gives access to private functions too.",
        "Integration tests are files in the top-level <code>tests/</code> directory. Each file is compiled as its own crate that imports your library like any outside user would, so they can only reach the public API. Shared helpers go in <code>tests/common/mod.rs</code>.",
        "Doc tests are the code blocks in <code>///</code> comments. <code>cargo test</code> compiles and runs them, so examples in your documentation cannot silently go stale. Mark a block <code>no_run</code>, <code>ignore</code> or <code>should_panic</code> when it should not run normally.",
        "<code>cargo test</code> runs all three; filter with <code>cargo test parse</code> (name substring), <code>--lib</code>, <code>--test api</code> or <code>--doc</code>. Arguments after <code>--</code> go to the test binary: <code>--nocapture</code>, <code>--test-threads=1</code>, <code>--ignored</code>."
      ]
    },
    {
      "heading": "Writing assertions",
      "points": [
        "A test fails by panicking. <code>assert!</code>, <code>assert_eq!</code> and <code>assert_ne!</code> panic with a message showing the values, so the compared types must implement <code>Debug</code> (and <code>PartialEq</code> for the equality forms).",
        "A test can return <code>Result&lt;(), E&gt;</code>: then <code>?</code> works inside, and returning <code>Err</code> fails the test. This keeps setup code free of <code>unwrap()</code> noise.",
        "<code>#[should_panic(expected = \"divide by zero\")]</code> asserts that a panic happens and that its message contains the given text — checking the message avoids passing because of an unrelated panic.",
        "Floating-point values rarely compare equal; assert with a tolerance: <code>assert!((a - b).abs() &lt; 1e-9)</code>."
      ]
    },
    {
      "heading": "Test doubles without a framework",
      "points": [
        "Rust has no runtime reflection, so classic mocking frameworks are less central. Instead, depend on a trait and pass in a fake implementation in tests (the same dependency inversion you would use in any language).",
        "Generic parameters (<code>fn new(clock: C) where C: Clock</code>) keep production code zero-cost; <code>Box&lt;dyn Clock&gt;</code> or <code>Arc&lt;dyn Clock&gt;</code> is simpler when the dependency is chosen at runtime.",
        "For recording calls in a fake, use interior mutability (<code>RefCell&lt;Vec&lt;String&gt;&gt;</code> or a <code>Mutex</code>) because trait methods usually take <code>&amp;self</code>.",
        "When you do want generated mocks, the <code>mockall</code> crate derives them from a trait with <code>#[automock]</code>, including expectations on arguments and call counts."
      ]
    },
    {
      "heading": "Async and property-based tests",
      "points": [
        "<code>#[tokio::test]</code> creates a runtime per test so you can <code>.await</code> inside. <code>#[tokio::test(start_paused = true)]</code> (requires tokio's <code>test-util</code> feature, usually as a dev-dependency) pauses the clock so <code>tokio::time</code> timeouts and retry delays elapse instantly.",
        "Property-based testing states a rule that must hold for all inputs — \"decode(encode(x)) == x\", \"sorting is idempotent\", \"the output length never exceeds the input\" — and lets <code>proptest</code> generate hundreds of inputs.",
        "When a property fails, proptest shrinks the input to a minimal failing case and saves it in <code>proptest-regressions/</code> so it is re-tested every run. Commit that directory.",
        "Coverage and quality tooling: <code>cargo llvm-cov</code> for coverage, <code>cargo nextest</code> as a faster test runner with better output, and <code>cargo mutants</code> for mutation testing."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Unit tests",
      "code": "pub fn divide(a: i32, b: i32) -> i32 {\n    if b == 0 {\n        panic!(\"divide by zero\");\n    }\n    a / b\n}\n\nfn parse_port(s: &str) -> Result<u16, String> {\n    s.parse::<u16>().map_err(|e| format!(\"bad port {s:?}: {e}\"))\n}\n\n#[cfg(test)]\nmod tests {\n    use super::*; // includes the private parse_port\n\n    #[test]\n    fn divides() {\n        assert_eq!(divide(10, 3), 3, \"integer division truncates\");\n    }\n\n    #[test]\n    #[should_panic(expected = \"divide by zero\")]\n    fn panics_on_zero() {\n        divide(1, 0);\n    }\n\n    #[test]\n    fn parses_ports() -> Result<(), String> {\n        assert_eq!(parse_port(\"8080\")?, 8080);\n        assert!(parse_port(\"99999\").is_err());\n        Ok(())\n    }\n\n    #[test]\n    #[ignore = \"slow: run with cargo test -- --ignored\"]\n    fn exhaustive_check() {\n        for p in 0..=u16::MAX { assert_eq!(parse_port(&p.to_string()), Ok(p)); }\n    }\n}\n\nfn main() {}",
      "language": "rust"
    },
    {
      "label": "Integration & doc tests",
      "code": "# Project layout\nmy_crate/\n├── src/\n│   └── lib.rs          # pub fn slugify(..)  with a /// doc test\n└── tests/\n    ├── common/\n    │   └── mod.rs      # shared helpers (not a test file itself)\n    └── slugify.rs      # integration test: uses my_crate::slugify\n\n# src/lib.rs\n/// Turns a title into a URL slug.\n///\n/// ```\n/// assert_eq!(my_crate::slugify(\"Hello, World!\"), \"hello-world\");\n/// ```\npub fn slugify(s: &str) -> String { /* ... */ }\n\n# tests/slugify.rs\nmod common;\nuse my_crate::slugify;\n\n#[test]\nfn collapses_separators() {\n    assert_eq!(slugify(\"a  --  b\"), \"a-b\");\n}\n\n# Commands\ncargo test                    # unit + integration + doc tests\ncargo test --test slugify     # one integration test file\ncargo test --doc              # only doc tests\ncargo test slug -- --nocapture  # name filter, show println! output",
      "language": "bash"
    },
    {
      "label": "Trait-based test double",
      "code": "use std::cell::RefCell;\n\npub trait Mailer {\n    fn send(&self, to: &str, body: &str) -> Result<(), String>;\n}\n\npub struct Signup<M: Mailer> { mailer: M }\n\nimpl<M: Mailer> Signup<M> {\n    pub fn new(mailer: M) -> Self { Signup { mailer } }\n\n    pub fn register(&self, email: &str) -> Result<(), String> {\n        if !email.contains('@') {\n            return Err(\"invalid email\".into());\n        }\n        self.mailer.send(email, \"Welcome!\")\n    }\n}\n\n#[cfg(test)]\nmod tests {\n    use super::*;\n\n    #[derive(Default)]\n    struct FakeMailer { sent: RefCell<Vec<String>>, fail: bool }\n\n    impl Mailer for FakeMailer {\n        fn send(&self, to: &str, _body: &str) -> Result<(), String> {\n            if self.fail { return Err(\"smtp down\".into()); }\n            self.sent.borrow_mut().push(to.to_string());\n            Ok(())\n        }\n    }\n\n    #[test]\n    fn sends_welcome_mail() {\n        let signup = Signup::new(FakeMailer::default());\n        signup.register(\"ada@example.com\").unwrap();\n        assert_eq!(*signup.mailer.sent.borrow(), vec![\"ada@example.com\"]);\n    }\n\n    #[test]\n    fn invalid_email_sends_nothing() {\n        let signup = Signup::new(FakeMailer::default());\n        assert!(signup.register(\"nope\").is_err());\n        assert!(signup.mailer.sent.borrow().is_empty());\n    }\n\n    #[test]\n    fn mailer_failure_is_reported() {\n        let signup = Signup::new(FakeMailer { fail: true, ..Default::default() });\n        assert_eq!(signup.register(\"ada@example.com\"), Err(\"smtp down\".to_string()));\n    }\n}\n\nfn main() {}",
      "language": "rust"
    },
    {
      "label": "proptest & async",
      "code": "pub fn encode(s: &str) -> String {\n    s.chars().map(|c| match c {\n        '%' => \"%25\".to_string(),\n        ' ' => \"%20\".to_string(),\n        c => c.to_string(),\n    }).collect()\n}\n\npub fn decode(s: &str) -> String {\n    s.replace(\"%20\", \" \").replace(\"%25\", \"%\")\n}\n\npub async fn fetch_with_timeout() -> Result<u32, &'static str> {\n    tokio::time::timeout(std::time::Duration::from_secs(5), async {\n        tokio::time::sleep(std::time::Duration::from_secs(60)).await;\n        42\n    })\n    .await\n    .map_err(|_| \"timed out\")\n}\n\n#[cfg(test)]\nmod tests {\n    use super::*;\n    use proptest::prelude::*;\n\n    proptest! {\n        // For ANY string, decoding an encoded value gives it back\n        #[test]\n        fn roundtrip(s in \".*\") {\n            prop_assert_eq!(decode(&encode(&s)), s);\n        }\n\n        #[test]\n        fn encoded_has_no_spaces(s in \"[a-z %]{0,40}\") {\n            prop_assert!(!encode(&s).contains(' '));\n        }\n    }\n\n    // Paused clock (tokio feature \"test-util\"): the 5 s timeout elapses instantly\n    #[tokio::test(start_paused = true)]\n    async fn times_out() {\n        assert_eq!(fetch_with_timeout().await, Err(\"timed out\"));\n    }\n}\n\nfn main() {}",
      "language": "rust"
    }
  ];

  mistakes: CommonMistake[] = [
    {
      "title": "should_panic without an expected message",
      "wrong": "#[test]\n#[should_panic]\nfn rejects_negative() {\n    let v: Vec<i32> = vec![];\n    let _first = v[0];          // panics for the WRONG reason\n    validate(-1);\n}",
      "right": "#[test]\n#[should_panic(expected = \"must be positive\")]\nfn rejects_negative() {\n    validate(-1);\n}",
      "explanation": "A bare should_panic passes on any panic, including an index-out-of-bounds in your setup. expected = \"...\" checks that the panic message contains the text you mean."
    },
    {
      "title": "Tests sharing global state",
      "wrong": "#[test] fn a() { std::fs::write(\"/tmp/state.txt\", \"a\").unwrap(); /* ... */ }\n#[test] fn b() { std::fs::write(\"/tmp/state.txt\", \"b\").unwrap(); /* ... */ }\n// flaky: tests run in parallel and overwrite each other's file",
      "right": "#[test] fn a() {\n    let dir = std::env::temp_dir().join(format!(\"a-{}\", std::process::id()));\n    // or use the tempfile crate: tempfile::tempdir()\n}",
      "explanation": "cargo test runs tests concurrently in one process. Give each test its own temporary directory, port or database, or serialize only the tests that truly must share."
    },
    {
      "title": "Integration tests for a binary-only crate",
      "wrong": "// src/main.rs contains all the logic\n// tests/cli.rs:\nuse my_tool::parse;   // error[E0432]: unresolved import — there is no library",
      "right": "// src/lib.rs   -> pub fn parse(..)  (all logic)\n// src/main.rs  -> fn main() { my_tool::run() }\n// tests/cli.rs -> use my_tool::parse;",
      "explanation": "Integration tests import a library crate. Put the logic in src/lib.rs and keep main.rs as a thin wrapper; then both unit and integration tests can reach it."
    },
    {
      "title": "Comparing floats with assert_eq!",
      "wrong": "assert_eq!(0.1 + 0.2, 0.3);   // fails: 0.30000000000000004 != 0.3",
      "right": "let got = 0.1_f64 + 0.2;\nassert!((got - 0.3).abs() < 1e-12, \"got {got}\");",
      "explanation": "Floating-point arithmetic is inexact. Compare against a tolerance (or use a crate such as approx) instead of exact equality."
    },
    {
      "title": "unwrap everywhere in test setup",
      "wrong": "#[test]\nfn loads() {\n    let text = std::fs::read_to_string(\"fixtures/a.json\").unwrap();\n    let cfg: Config = serde_json::from_str(&text).unwrap();\n    assert_eq!(cfg.port, 80);\n}",
      "right": "#[test]\nfn loads() -> Result<(), Box<dyn std::error::Error>> {\n    let text = std::fs::read_to_string(\"fixtures/a.json\")?;\n    let cfg: Config = serde_json::from_str(&text)?;\n    assert_eq!(cfg.port, 80);\n    Ok(())\n}",
      "explanation": "Returning Result lets ? propagate setup failures with their real error message, which reads better than a chain of unwrap panics."
    }
  ];

  challenge: Challenge = {
    "title": "Test a rate limiter with a fake clock",
    "language": "rust",
    "description": "A RateLimiter allows at most max calls per window_secs seconds. It depends on a Clock trait (fn now(&self) -> u64, seconds). Implement allow(&mut self) -> bool, then write unit tests using a FakeClock whose time you can advance: calls within the limit pass, the next one is rejected, and calls pass again after the window. No real sleeping.",
    "hints": [
      "Store the timestamps of allowed calls in a VecDeque<u64>; drop entries older than now - window_secs.",
      "FakeClock can hold a Cell<u64> so tests can change the time through &self.",
      "Pass the clock by reference or Rc so the test keeps a handle to advance it."
    ],
    "starterCode": "use std::collections::VecDeque;\n\npub trait Clock { fn now(&self) -> u64; }\n\npub struct RateLimiter<C: Clock> { clock: C, max: usize, window_secs: u64, hits: VecDeque<u64> }\n\nimpl<C: Clock> RateLimiter<C> {\n    pub fn new(clock: C, max: usize, window_secs: u64) -> Self {\n        RateLimiter { clock, max, window_secs, hits: VecDeque::new() }\n    }\n    pub fn allow(&mut self) -> bool {\n        todo!()\n    }\n}\n\n#[cfg(test)]\nmod tests {\n    // TODO: FakeClock + tests\n}\n\nfn main() {}",
    "solution": "use std::collections::VecDeque;\n\npub trait Clock { fn now(&self) -> u64; }\n\npub struct RateLimiter<C: Clock> { clock: C, max: usize, window_secs: u64, hits: VecDeque<u64> }\n\nimpl<C: Clock> RateLimiter<C> {\n    pub fn new(clock: C, max: usize, window_secs: u64) -> Self {\n        RateLimiter { clock, max, window_secs, hits: VecDeque::new() }\n    }\n\n    pub fn allow(&mut self) -> bool {\n        let now = self.clock.now();\n        while let Some(&t) = self.hits.front() {\n            if now - t >= self.window_secs { self.hits.pop_front(); } else { break; }\n        }\n        if self.hits.len() < self.max {\n            self.hits.push_back(now);\n            true\n        } else {\n            false\n        }\n    }\n}\n\n#[cfg(test)]\nmod tests {\n    use super::*;\n    use std::cell::Cell;\n\n    struct FakeClock(Cell<u64>);\n    impl Clock for &FakeClock {\n        fn now(&self) -> u64 { self.0.get() }\n    }\n\n    #[test]\n    fn allows_up_to_max_then_rejects() {\n        let clock = FakeClock(Cell::new(100));\n        let mut rl = RateLimiter::new(&clock, 2, 10);\n        assert!(rl.allow());\n        assert!(rl.allow());\n        assert!(!rl.allow(), \"third call in the window must be rejected\");\n    }\n\n    #[test]\n    fn allows_again_after_window() {\n        let clock = FakeClock(Cell::new(100));\n        let mut rl = RateLimiter::new(&clock, 1, 10);\n        assert!(rl.allow());\n        clock.0.set(109);\n        assert!(!rl.allow());\n        clock.0.set(110);              // exactly one window later\n        assert!(rl.allow());\n    }\n}\n\nfn main() {}"
  };

  quiz: QuizQuestion[] = [
    {
      "q": "Where do integration tests live and what can they access?",
      "options": [
        "In src/ with access to private items",
        "In tests/, compiled as separate crates using only the public API",
        "In benches/",
        "Inside main.rs"
      ],
      "answer": 1,
      "explanation": "Each file in tests/ is its own crate that imports your library from the outside, so only pub items are reachable."
    },
    {
      "q": "What does #[should_panic(expected = \"overflow\")] check?",
      "options": [
        "That the test panics at least once",
        "That the test panics with a message containing \"overflow\"",
        "That no panic occurs",
        "That the function returns Err"
      ],
      "answer": 1,
      "explanation": "expected matches a substring of the panic message, so an unrelated panic does not count as a pass."
    },
    {
      "q": "How do you see println! output from a passing test?",
      "options": [
        "It is always shown",
        "cargo test -- --nocapture",
        "cargo test --verbose",
        "RUST_LOG=debug"
      ],
      "answer": 1,
      "explanation": "Output of passing tests is captured; --nocapture (or --show-output) prints it."
    },
    {
      "q": "What happens when a proptest property fails?",
      "options": [
        "It reports the first random input",
        "It shrinks the input to a minimal failing case and records it for future runs",
        "It retries until it passes",
        "It panics without details"
      ],
      "answer": 1,
      "explanation": "proptest shrinks toward the simplest failing input and saves it in proptest-regressions/ so the case is always re-checked."
    },
    {
      "q": "Doc tests are...",
      "options": [
        "Comments ignored by the compiler",
        "Code blocks in /// comments that cargo test compiles and runs",
        "Markdown files in docs/",
        "Only run on nightly"
      ],
      "answer": 1,
      "explanation": "cargo test runs examples in doc comments, keeping documentation correct."
    },
    {
      "q": "What is the idiomatic way to replace a dependency (like an email sender) in a unit test?",
      "options": [
        "Monkey-patch the function",
        "Depend on a trait and pass a fake implementation",
        "Use unsafe to swap the function pointer",
        "Set an environment variable"
      ],
      "answer": 1,
      "explanation": "Rust has no runtime patching; depending on a trait (generic or dyn) lets tests supply a fake. mockall can generate such fakes."
    }
  ];

  qna: QnaItem[] = [
    {
      "q": "How are unit, integration and doc tests different in Rust?",
      "a": "Unit tests sit in a <code>#[cfg(test)]</code> module inside the source file and can test private functions. Integration tests live in <code>tests/</code>, each file compiled as a separate crate that sees only the public API — they test the crate the way users will. Doc tests are code examples in <code>///</code> comments, compiled and run by <code>cargo test</code>, so documentation stays correct. <code>cargo test</code> runs all three."
    },
    {
      "q": "How do you mock dependencies in Rust?",
      "a": "Design for it: depend on a trait rather than a concrete type, and inject the implementation (via a generic parameter or <code>Box&lt;dyn Trait&gt;</code>/<code>Arc&lt;dyn Trait&gt;</code>). Tests pass a hand-written fake that records calls or returns canned results, typically using <code>RefCell</code> or <code>Mutex</code> for state behind <code>&amp;self</code>. For larger traits, <code>mockall</code>'s <code>#[automock]</code> generates mocks with expectations. Time and randomness are handled the same way, or with tools like tokio's paused clock."
    },
    {
      "q": "What is property-based testing and when is it worth it?",
      "a": "Instead of hand-picked examples you state invariants that must hold for every input — round-trips, idempotence, ordering, \"never panics\" — and a library like <code>proptest</code> generates many random inputs, then shrinks any failure to a minimal case. It shines for parsers, encoders, data structures and numeric code, where hand-written examples miss edge cases such as empty strings, unicode, huge values or duplicates."
    },
    {
      "q": "Why might tests pass alone but fail together?",
      "a": "cargo test runs tests in parallel threads within one process. Tests that share a file path, port, database, environment variable or global static can race. Fix it by isolating resources per test (temp dirs, random ports, transactions rolled back at the end), or serialize the few tests that must share state (for example with the <code>serial_test</code> crate) rather than forcing <code>--test-threads=1</code> for everything."
    }
  ];

  revision: RevisionSummary = {
    "oneLiner": "cargo test runs unit tests (#[cfg(test)]), integration tests (tests/) and doc tests; inject traits for fakes and add proptest for invariants.",
    "mustKnow": [
      "Unit tests can reach private items via <code>use super::*</code>.",
      "Integration tests in <code>tests/</code> use only the public API — needs a lib crate.",
      "Doc-comment examples are compiled and run.",
      "Use <code>should_panic(expected = ...)</code> and Result-returning tests.",
      "Tests run in parallel; isolate files, ports and env vars.",
      "Trait-based fakes replace mocking frameworks; mockall when needed.",
      "proptest shrinks failures and stores regressions."
    ],
    "interviewFocus": [
      "Explain the three kinds of Rust tests and where each lives.",
      "Show how you would test code that depends on time or an external service.",
      "Explain property-based testing with an example invariant."
    ]
  };
}
