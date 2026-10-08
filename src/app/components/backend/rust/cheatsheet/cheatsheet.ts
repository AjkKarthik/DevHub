import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';

@Component({
  selector: 'app-rust-cheatsheet',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, QnaBlockComponent],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss'
})
export class RustCheatsheet {
  readingTime = 12;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  since = "Rust 2024";

  quickRef: QuickRefItem[] = [
    {
      "name": "let x = 5; let mut y = 5;",
      "type": "keyword",
      "desc": "Immutable by default; mut opts in"
    },
    {
      "name": "let x = x + 1;",
      "type": "syntax",
      "desc": "Shadowing: a new binding, may change type"
    },
    {
      "name": "i8..i128 u8..u128 isize usize f32 f64 bool char",
      "type": "type",
      "desc": "Scalar types (char is a 4-byte Unicode scalar)"
    },
    {
      "name": "(i32, &str)  [u8; 4]  &[T]  Vec<T>",
      "type": "type",
      "desc": "Tuple, array, slice, growable vector"
    },
    {
      "name": "String / &str",
      "type": "type",
      "desc": "Owned UTF-8 buffer / borrowed string slice"
    },
    {
      "name": "&T / &mut T",
      "type": "operator",
      "desc": "Many shared borrows OR one mutable borrow"
    },
    {
      "name": "fn f(x: i32) -> i32 { x + 1 }",
      "type": "function",
      "desc": "Last expression without ; is the return value"
    },
    {
      "name": "|x| x * 2   move || ...",
      "type": "syntax",
      "desc": "Closures; move takes ownership of captures"
    },
    {
      "name": "match / if let / let else / while let",
      "type": "keyword",
      "desc": "Pattern matching forms"
    },
    {
      "name": "impl Trait / dyn Trait / T: Trait",
      "type": "keyword",
      "desc": "Static dispatch, dynamic dispatch, generic bound"
    },
    {
      "name": "#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]",
      "type": "decorator",
      "desc": "Most common derives"
    },
    {
      "name": "Box / Rc / Arc / RefCell / Mutex / RwLock",
      "type": "class",
      "desc": "Heap, shared, thread-safe shared, runtime-borrow, locks"
    },
    {
      "name": "?",
      "type": "operator",
      "desc": "Return early with Err/None, converting errors with From"
    },
    {
      "name": "'a / 'static",
      "type": "token",
      "desc": "Lifetime parameter / lives for the whole program"
    }
  ];

  theory: TheoryPoint[] = [
    {
      "heading": "Ownership in five rules",
      "points": [
        "Each value has exactly one owner; when the owner goes out of scope the value is dropped.",
        "Assigning or passing a non-<code>Copy</code> value moves it; the old binding becomes unusable. <code>Copy</code> types (integers, floats, bool, char, <code>&amp;T</code>, tuples of Copy) are copied instead.",
        "At any time you may have either any number of <code>&amp;T</code> or exactly one <code>&amp;mut T</code> to a value.",
        "References must never outlive the data they point to — the borrow checker enforces this with lifetimes.",
        "Borrows end at their last use (non-lexical lifetimes), not at the end of the block."
      ]
    },
    {
      "heading": "Option and Result toolkit",
      "points": [
        "Transform: <code>map</code>, <code>map_err</code>, <code>and_then</code>, <code>or_else</code>, <code>filter</code>, <code>flatten</code>, <code>zip</code>.",
        "Extract with a default: <code>unwrap_or(v)</code>, <code>unwrap_or_else(|| ...)</code>, <code>unwrap_or_default()</code>; panic deliberately with <code>expect(\"reason\")</code>.",
        "Convert: <code>ok_or(err)</code> / <code>ok_or_else</code> (Option to Result), <code>.ok()</code> (Result to Option), <code>transpose</code> (Option&lt;Result&gt; to Result&lt;Option&gt;).",
        "Inspect: <code>is_some</code>, <code>is_none</code>, <code>is_ok</code>, <code>is_err</code>, <code>is_some_and(|x| ...)</code>, and <code>as_ref()</code> / <code>as_deref()</code> to borrow the contents.",
        "Propagate with <code>?</code>; collect many results with <code>collect::&lt;Result&lt;Vec&lt;_&gt;, _&gt;&gt;()</code>."
      ]
    },
    {
      "heading": "Iterator toolkit",
      "points": [
        "Create: <code>iter()</code> (&amp;T), <code>iter_mut()</code> (&amp;mut T), <code>into_iter()</code> (T), ranges <code>0..n</code> / <code>0..=n</code>, <code>chars()</code>, <code>bytes()</code>, <code>lines()</code>, <code>split_whitespace()</code>.",
        "Adapt (lazy): <code>map</code>, <code>filter</code>, <code>filter_map</code>, <code>flat_map</code>, <code>enumerate</code>, <code>zip</code>, <code>chain</code>, <code>skip</code>, <code>take</code>, <code>take_while</code>, <code>rev</code>, <code>peekable</code>, <code>windows</code>/<code>chunks</code> on slices.",
        "Consume: <code>collect</code>, <code>sum</code>, <code>product</code>, <code>count</code>, <code>min</code>/<code>max</code>, <code>min_by_key</code>, <code>fold</code>, <code>any</code>, <code>all</code>, <code>find</code>, <code>position</code>, <code>last</code>, <code>for_each</code>.",
        "Sorting is on slices: <code>sort</code>, <code>sort_unstable</code>, <code>sort_by_key</code>, <code>sort_by(|a, b| a.x.cmp(&amp;b.x).then(b.y.cmp(&amp;a.y)))</code>, <code>dedup</code>, <code>binary_search</code>."
      ]
    },
    {
      "heading": "Concurrency and async at a glance",
      "points": [
        "<code>thread::spawn(move || ...)</code> returns a <code>JoinHandle</code>; <code>thread::scope(|s| ...)</code> lets threads borrow local data.",
        "Shared mutable state: <code>Arc&lt;Mutex&lt;T&gt;&gt;</code> or <code>Arc&lt;RwLock&lt;T&gt;&gt;</code>; simple counters: <code>AtomicUsize</code>. Message passing: <code>std::sync::mpsc</code> or crossbeam channels.",
        "<code>Send</code>: safe to move to another thread. <code>Sync</code>: safe to share <code>&amp;T</code> between threads. <code>Rc</code> and <code>RefCell</code> are neither (in the relevant sense).",
        "Async: <code>async fn</code> returns a lazy <code>Future</code>; <code>#[tokio::main]</code> runs it; <code>tokio::spawn</code> needs <code>Send + 'static</code> futures; <code>join!</code> waits for all, <code>select!</code> for the first; <code>spawn_blocking</code> for blocking work."
      ]
    },
    {
      "heading": "Cargo commands",
      "points": [
        "<code>cargo new app</code> / <code>cargo new --lib mylib</code> — create a project. <code>cargo add serde --features derive</code> — add a dependency.",
        "<code>cargo check</code> (fast type check), <code>cargo build --release</code>, <code>cargo run -- args</code>, <code>cargo test</code>, <code>cargo bench</code>, <code>cargo doc --open</code>.",
        "<code>cargo fmt</code> (format), <code>cargo clippy</code> (lints), <code>cargo update</code> (refresh Cargo.lock within SemVer), <code>cargo tree</code> (dependency graph).",
        "<code>cargo install ripgrep</code> installs a binary; <code>rustup update</code> updates the toolchain; <code>rustup target add wasm32-unknown-unknown</code> adds a target."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Syntax tour",
      "code": "use std::collections::HashMap;\nuse std::fmt;\n\n#[derive(Debug, Clone, PartialEq)]\nenum Shape { Circle { r: f64 }, Rect { w: f64, h: f64 } }\n\nimpl Shape {\n    fn area(&self) -> f64 {\n        match self {\n            Shape::Circle { r } => std::f64::consts::PI * r * r,\n            Shape::Rect { w, h } => w * h,\n        }\n    }\n}\n\nimpl fmt::Display for Shape {\n    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {\n        write!(f, \"{:?} with area {:.1}\", self, self.area())\n    }\n}\n\nfn parse_kv(line: &str) -> Option<(&str, i32)> {\n    let (k, v) = line.split_once('=')?;      // ? on Option\n    Some((k.trim(), v.trim().parse().ok()?))\n}\n\nfn main() {\n    let shapes = vec![Shape::Circle { r: 1.0 }, Shape::Rect { w: 2.0, h: 3.0 }];\n    let total: f64 = shapes.iter().map(Shape::area).sum();\n    println!(\"{} | total {total:.2}\", shapes[1]);\n\n    let mut counts: HashMap<&str, i32> = HashMap::new();\n    for line in [\"a = 1\", \"b = 2\", \"a = 5\", \"bad\"] {\n        if let Some((k, v)) = parse_kv(line) {\n            *counts.entry(k).or_insert(0) += v;\n        }\n    }\n    let mut keys: Vec<_> = counts.into_iter().collect();\n    keys.sort();\n    println!(\"{keys:?}\");                       // [(\"a\", 6), (\"b\", 2)]\n\n    let Some(first) = shapes.first() else { return };\n    println!(\"first area {:.2}\", first.area());\n}",
      "language": "rust"
    },
    {
      "label": "Option / Result one-liners",
      "code": "fn main() {\n    let name: Option<&str> = Some(\"ada\");\n    let missing: Option<&str> = None;\n\n    println!(\"{}\", name.map(str::to_uppercase).unwrap_or_default()); // ADA\n    println!(\"{}\", missing.unwrap_or(\"anonymous\"));                   // anonymous\n    println!(\"{:?}\", missing.ok_or(\"no name\"));                       // Err(\"no name\")\n    println!(\"{}\", name.is_some_and(|n| n.len() == 3));               // true\n\n    let n: Result<i32, _> = \"42\".parse::<i32>();\n    let bad: Result<i32, _> = \"x\".parse::<i32>();\n    println!(\"{:?}\", n.as_ref().map(|v| v * 2));                      // Ok(84)\n    println!(\"{}\", bad.clone().unwrap_or(0));                         // 0\n    println!(\"{:?}\", bad.ok());                                       // None\n\n    let all: Result<Vec<i32>, _> = [\"1\", \"2\", \"3\"].iter().map(|s| s.parse::<i32>()).collect();\n    println!(\"{all:?}\");                                              // Ok([1, 2, 3])\n}",
      "language": "rust"
    }
  ];

  qna: QnaItem[] = [
    {
      "q": "String or &str in a function signature?",
      "a": "Accept <code>&amp;str</code> when you only read the text — callers can pass a <code>String</code> (it derefs), a literal or a slice. Take <code>String</code> (or <code>impl Into&lt;String&gt;</code>) when the function stores the text, so the caller decides whether to move or clone."
    },
    {
      "q": "When should I use unwrap()?",
      "a": "In tests, examples, and for invariants you have just proven (for example a regex literal that you know compiles). Prefer <code>expect(\"why this cannot fail\")</code> so the panic explains itself, and use <code>?</code> everywhere a failure is a normal possibility."
    },
    {
      "q": "Box, Rc or Arc?",
      "a": "<code>Box&lt;T&gt;</code>: one owner, value on the heap (recursive types, trait objects, large values). <code>Rc&lt;T&gt;</code>: several owners on one thread. <code>Arc&lt;T&gt;</code>: several owners across threads. Add <code>RefCell</code> (single thread) or <code>Mutex</code>/<code>RwLock</code> (multi-thread) when the shared value must be mutated."
    },
    {
      "q": "impl Trait or dyn Trait?",
      "a": "<code>impl Trait</code> (and generics) are resolved at compile time — fast, one concrete type per use. <code>dyn Trait</code> uses a vtable at runtime and allows mixing different types in one collection (<code>Vec&lt;Box&lt;dyn Trait&gt;&gt;</code>) at the cost of an indirect call."
    },
    {
      "q": "Which derives should a plain data struct usually have?",
      "a": "<code>Debug</code> almost always; <code>Clone</code> if it should be copyable; <code>Copy</code> only for small, plain values; <code>PartialEq</code>/<code>Eq</code> for comparisons; <code>Hash</code> to use as a map key; <code>Default</code> for zero-value construction; <code>Serialize</code>/<code>Deserialize</code> from serde when it crosses a boundary."
    }
  ];
}
