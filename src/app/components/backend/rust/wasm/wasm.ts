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
  selector: 'app-rust-wasm',
  standalone: true,
  imports: [PageMetaComponent, PrerequisitesComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './wasm.html',
  styleUrl: './wasm.scss'
})
export class RustWasm {
  readingTime = 22;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'advanced';
  since = "Rust 2024";
  route = 'rust-wasm';
  nextRoute = '/rust/testing';
  nextLabel = "Testing in Rust";

  prerequisites: Prerequisite[] = [
    {
      "label": "Modules & Cargo",
      "route": "/rust/modules-cargo"
    },
    {
      "label": "Ownership & Borrowing",
      "route": "/rust/ownership-borrowing"
    }
  ];

  quickRef: QuickRefItem[] = [
    {
      "name": "rustup target add wasm32-unknown-unknown",
      "type": "syntax",
      "desc": "Install the browser/bare WebAssembly target"
    },
    {
      "name": "wasm32-wasip1 / wasm32-wasip2",
      "type": "token",
      "desc": "WASI targets for runtimes like Wasmtime (wasm32-wasi was renamed wasm32-wasip1)"
    },
    {
      "name": "[lib] crate-type = [\"cdylib\"]",
      "type": "syntax",
      "desc": "Produce a standalone .wasm module from a library crate"
    },
    {
      "name": "#[wasm_bindgen] pub fn ...",
      "type": "decorator",
      "desc": "Export a Rust function (or struct) to JavaScript"
    },
    {
      "name": "#[wasm_bindgen] extern \"C\" { fn alert(s: &str); }",
      "type": "decorator",
      "desc": "Import a JavaScript function into Rust"
    },
    {
      "name": "wasm-pack build --target web",
      "type": "syntax",
      "desc": "Compile, run wasm-bindgen and emit an ES module package"
    },
    {
      "name": "JsValue",
      "type": "type",
      "desc": "An opaque handle to any JavaScript value"
    },
    {
      "name": "js-sys / web-sys",
      "type": "class",
      "desc": "Bindings to JS built-ins (Array, Date) and browser APIs (document, fetch)"
    },
    {
      "name": "wasm-opt -O",
      "type": "syntax",
      "desc": "Binaryen optimiser that shrinks and speeds up the .wasm file"
    }
  ];

  theory: TheoryPoint[] = [
    {
      "heading": "Rust and WebAssembly",
      "points": [
        "WebAssembly (Wasm) is a portable, sandboxed bytecode that browsers and standalone runtimes (Wasmtime, Wasmer, edge platforms) execute at near-native speed. Rust is one of the best-supported source languages because it needs no garbage collector or heavy runtime.",
        "For browsers you compile to <code>wasm32-unknown-unknown</code>: no operating system, no filesystem, no threads by default. For server-side and plugin use cases, the WASI targets (<code>wasm32-wasip1</code>, <code>wasm32-wasip2</code>) add standardised access to files, clocks and sockets.",
        "Good fits: CPU-heavy pure computation (image and video processing, parsing, compression, cryptography, simulations, game logic) and sharing one Rust core between a backend and a web front end. Poor fits: code that mostly manipulates the DOM.",
        "A library compiled as <code>crate-type = [\"cdylib\"]</code> produces the <code>.wasm</code> file. Adding <code>\"rlib\"</code> as well keeps the crate usable from normal Rust code and tests."
      ]
    },
    {
      "heading": "wasm-bindgen",
      "points": [
        "Raw Wasm functions only exchange numbers. <code>wasm-bindgen</code> generates glue on both sides so you can pass strings, slices, structs, closures and <code>JsValue</code> handles across the boundary.",
        "<code>#[wasm_bindgen]</code> on a <code>pub fn</code> exports it; on a struct with an <code>impl</code> block it exports a JavaScript class whose methods call into Rust. On an <code>extern \"C\"</code> block it imports JavaScript functions, including methods and constructors via attributes such as <code>js_namespace</code>.",
        "<code>js-sys</code> binds ECMAScript built-ins (<code>Array</code>, <code>Promise</code>, <code>Date</code>); <code>web-sys</code> binds browser APIs (<code>Window</code>, <code>Document</code>, <code>fetch</code>), each behind a Cargo feature so you only compile what you use. <code>wasm-bindgen-futures</code> converts between Rust futures and JS promises.",
        "Since 2025 the original <code>rustwasm</code> GitHub organisation has been sunset: wasm-bindgen moved to its own <code>wasm-bindgen</code> organisation, and other tools moved to individual maintainers or were archived. Check each tool's current repository before adopting it."
      ]
    },
    {
      "heading": "Building and shipping",
      "points": [
        "<code>wasm-pack build --target web</code> (or <code>bundler</code>, <code>nodejs</code>) compiles in release mode, runs <code>wasm-bindgen</code>, optionally <code>wasm-opt</code>, and writes a <code>pkg/</code> directory with the <code>.wasm</code>, JS glue, TypeScript definitions and a <code>package.json</code>.",
        "Without wasm-pack: <code>cargo build --release --target wasm32-unknown-unknown</code>, then <code>wasm-bindgen --target web --out-dir pkg target/wasm32-unknown-unknown/release/your_crate.wasm</code>. The CLI version must match the <code>wasm-bindgen</code> crate version.",
        "Binary size matters for downloads: build with <code>opt-level = \"s\"</code> or <code>\"z\"</code>, <code>lto = true</code> and <code>codegen-units = 1</code>, run <code>wasm-opt</code>, and avoid pulling in heavy formatting or regex code unless needed.",
        "Install <code>console_error_panic_hook</code> during development so a panic prints its message to the browser console instead of an opaque <code>RuntimeError: unreachable</code>."
      ]
    },
    {
      "heading": "Crossing the boundary efficiently",
      "points": [
        "Wasm has its own linear memory. Numbers pass directly; strings and <code>Vec</code>s are copied into or out of that memory, and strings are re-encoded between UTF-8 and UTF-16.",
        "Batch work: pass a whole <code>&amp;[u8]</code> or <code>&amp;[f32]</code> (copied once) rather than calling per element, and return one result. For very large shared buffers, expose a pointer into Wasm memory and view it from JS as a typed array.",
        "Keep long-lived state on the Rust side inside an exported struct, so JavaScript holds a small handle instead of re-sending data every call. Call <code>.free()</code> (or rely on <code>FinalizationRegistry</code> support in newer glue) to release it.",
        "Measure before porting: modern JavaScript engines are fast, and the gain only appears when the Rust side does substantial work per boundary crossing."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "lib.rs",
      "code": "use wasm_bindgen::prelude::*;\n\n// Import a JavaScript function\n#[wasm_bindgen]\nextern \"C\" {\n    #[wasm_bindgen(js_namespace = console)]\n    fn log(s: &str);\n}\n\n// Export a plain function\n#[wasm_bindgen]\npub fn greet(name: &str) -> String {\n    format!(\"Hello, {name}!\")\n}\n\n// Export a whole slice at once: one copy in, one number out\n#[wasm_bindgen]\npub fn checksum(bytes: &[u8]) -> u32 {\n    bytes.iter().fold(0u32, |acc, &b| acc.wrapping_mul(31).wrapping_add(b as u32))\n}\n\n// Export a class: state stays on the Rust side\n#[wasm_bindgen]\npub struct Counter { count: u32 }\n\n#[wasm_bindgen]\nimpl Counter {\n    #[wasm_bindgen(constructor)]\n    pub fn new() -> Counter { Counter { count: 0 } }\n\n    pub fn increment(&mut self) -> u32 {\n        self.count += 1;\n        log(&format!(\"count is now {}\", self.count));\n        self.count\n    }\n}",
      "language": "rust"
    },
    {
      "label": "Cargo.toml & build",
      "code": "# Cargo.toml\n[package]\nname = \"hello-wasm\"\nversion = \"0.1.0\"\nedition = \"2024\"\n\n[lib]\ncrate-type = [\"cdylib\", \"rlib\"]   # cdylib -> .wasm, rlib -> normal tests\n\n[dependencies]\nwasm-bindgen = \"0.2\"\n\n[profile.release]\nopt-level = \"s\"     # optimise for size\nlto = true\n\n# ---- build ----\nrustup target add wasm32-unknown-unknown\n\n# Option A: wasm-pack (compile + wasm-bindgen + package)\nwasm-pack build --target web          # writes pkg/\n\n# Option B: by hand\ncargo build --release --target wasm32-unknown-unknown\nwasm-bindgen --target web --out-dir pkg \\\n  target/wasm32-unknown-unknown/release/hello_wasm.wasm",
      "language": "bash"
    },
    {
      "label": "Using it from JavaScript",
      "code": "// main.ts — with --target web the glue is an ES module\nimport init, { greet, checksum, Counter } from './pkg/hello_wasm.js';\n\nawait init();                       // fetch + instantiate the .wasm\n\nconsole.log(greet('Ada'));          // \"Hello, Ada!\"\n\nconst bytes = new TextEncoder().encode('large input...');\nconsole.log(checksum(bytes));       // one boundary crossing for the whole buffer\n\nconst c = new Counter();\nc.increment();                      // logs \"count is now 1\" via the imported console.log\nc.increment();\nc.free();                           // release the Rust-side memory",
      "language": "typescript"
    },
    {
      "label": "Testing the core natively",
      "code": "// Keep the real logic in plain Rust functions; the #[wasm_bindgen]\n// wrappers stay thin. Then normal cargo test runs on your machine.\npub fn checksum(bytes: &[u8]) -> u32 {\n    bytes.iter().fold(0u32, |acc, &b| acc.wrapping_mul(31).wrapping_add(b as u32))\n}\n\npub fn grayscale(rgba: &mut [u8]) {\n    for px in rgba.chunks_exact_mut(4) {\n        let y = (0.299 * px[0] as f32 + 0.587 * px[1] as f32 + 0.114 * px[2] as f32) as u8;\n        px[0] = y; px[1] = y; px[2] = y;   // alpha untouched\n    }\n}\n\nfn main() {\n    println!(\"{}\", checksum(b\"abc\"));     // 96354\n    let mut img = vec![255, 0, 0, 255, 0, 0, 255, 128];\n    grayscale(&mut img);\n    println!(\"{img:?}\");                  // [76, 76, 76, 255, 29, 29, 29, 128]\n}",
      "language": "rust"
    }
  ];

  mistakes: CommonMistake[] = [
    {
      "title": "Calling into Wasm once per element",
      "wrong": "for (let i = 0; i < pixels.length; i += 4) {\n  pixels[i] = wasm.brighten(pixels[i]);   // a million boundary crossings\n}",
      "right": "wasm.brighten_all(pixels);   // pass the Uint8Array once, loop inside Rust",
      "explanation": "Each call crosses the JS/Wasm boundary. Batch the work so Rust receives the whole buffer and loops internally; that is where the speed-up comes from."
    },
    {
      "title": "Expecting Wasm to speed up DOM work",
      "wrong": "// Rewriting a React-style UI renderer in Rust/Wasm \"for speed\"\n// every element creation still goes through web-sys -> JS glue -> DOM",
      "right": "// Keep DOM work in JavaScript; move the heavy computation\n// (parsing, layout maths, image processing) into Rust",
      "explanation": "Wasm cannot access the DOM directly; web-sys calls go through JavaScript. DOM-bound code rarely gets faster and usually gets bigger."
    },
    {
      "title": "Forgetting crate-type = cdylib",
      "wrong": "[lib]\n# no crate-type: cargo build --target wasm32-unknown-unknown produces only an .rlib",
      "right": "[lib]\ncrate-type = [\"cdylib\", \"rlib\"]",
      "explanation": "Without cdylib there is no .wasm module to load. Keeping rlib alongside lets ordinary Rust tests and other crates still use the library."
    },
    {
      "title": "Mismatched wasm-bindgen CLI and crate versions",
      "wrong": "# Cargo.lock has wasm-bindgen 0.2.100, installed CLI is 0.2.92\nwasm-bindgen --target web target/.../app.wasm\n# error: it looks like the Rust project used to create this wasm file was linked against\n# version of wasm-bindgen that uses a different bindgen format than this binary",
      "right": "cargo install wasm-bindgen-cli --version 0.2.100   # match Cargo.lock exactly\n# or let wasm-pack pick the matching CLI",
      "explanation": "The CLI and the crate share an internal schema. Pin the CLI to the exact version in Cargo.lock, which wasm-pack does for you."
    },
    {
      "title": "Debugging panics without a panic hook",
      "wrong": "// Browser console: RuntimeError: unreachable executed\n// no message, no location",
      "right": "#[wasm_bindgen(start)]\npub fn start() {\n    console_error_panic_hook::set_once();  // panics now log their message\n}",
      "explanation": "By default a Rust panic in Wasm traps with \"unreachable\". The panic hook forwards the message and location to console.error, which is essential during development."
    }
  ];

  challenge: Challenge = {
    "title": "A Wasm-ready text statistics core",
    "language": "rust",
    "description": "Write the plain-Rust core of a Wasm module: a struct TextStats { words: u32, sentences: u32, avg_word_len: f32 } and fn analyze(text: &str) -> TextStats. Count words with split_whitespace, sentences as the number of ., ! or ? characters (at least 1 if the text has any words), and average word length in characters ignoring trailing punctuation. Keep it free of wasm_bindgen so it can be unit-tested natively; a thin #[wasm_bindgen] wrapper would call it.",
    "hints": [
      "word.trim_end_matches(|c: char| c.is_ascii_punctuation()) strips trailing punctuation.",
      "Use chars().count() for length, not len().",
      "Guard against division by zero for empty input."
    ],
    "starterCode": "#[derive(Debug, PartialEq)]\npub struct TextStats { pub words: u32, pub sentences: u32, pub avg_word_len: f32 }\n\npub fn analyze(text: &str) -> TextStats {\n    todo!()\n}\n\nfn main() {\n    println!(\"{:?}\", analyze(\"Rust compiles to Wasm. It is fast!\"));\n}",
    "solution": "#[derive(Debug, PartialEq)]\npub struct TextStats { pub words: u32, pub sentences: u32, pub avg_word_len: f32 }\n\npub fn analyze(text: &str) -> TextStats {\n    let words: Vec<&str> = text\n        .split_whitespace()\n        .map(|w| w.trim_end_matches(|c: char| c.is_ascii_punctuation()))\n        .filter(|w| !w.is_empty())\n        .collect();\n    let word_count = words.len() as u32;\n    let mut sentences = text.chars().filter(|c| matches!(c, '.' | '!' | '?')).count() as u32;\n    if sentences == 0 && word_count > 0 { sentences = 1; }\n    let total_chars: usize = words.iter().map(|w| w.chars().count()).sum();\n    let avg_word_len = if word_count == 0 { 0.0 } else { total_chars as f32 / word_count as f32 };\n    TextStats { words: word_count, sentences, avg_word_len }\n}\n\n// The thin Wasm wrapper would be:\n// #[wasm_bindgen] pub fn word_count(text: &str) -> u32 { analyze(text).words }\n\nfn main() {\n    println!(\"{:?}\", analyze(\"Rust compiles to Wasm. It is fast!\"));\n    // TextStats { words: 7, sentences: 2, avg_word_len: 3.7142856 }\n    println!(\"{:?}\", analyze(\"\"));\n    // TextStats { words: 0, sentences: 0, avg_word_len: 0.0 }\n}"
  };

  quiz: QuizQuestion[] = [
    {
      "q": "Which target do you use for browser WebAssembly with wasm-bindgen?",
      "options": [
        "wasm32-wasip1",
        "wasm32-unknown-unknown",
        "x86_64-unknown-linux-gnu",
        "wasm64-browser"
      ],
      "answer": 1,
      "explanation": "wasm32-unknown-unknown has no OS assumptions and is what wasm-bindgen targets. WASI targets are for runtimes that provide the WASI system interface."
    },
    {
      "q": "What does crate-type = [\"cdylib\"] provide?",
      "options": [
        "A static Rust library",
        "A standalone dynamic library — for Wasm, the .wasm module",
        "A binary executable",
        "A procedural macro"
      ],
      "answer": 1,
      "explanation": "cdylib produces a library with a C-style ABI suitable for loading from other environments; on wasm32 that is the .wasm module."
    },
    {
      "q": "Why is passing a large string to a Wasm function on every keystroke potentially slow?",
      "options": [
        "Wasm cannot take strings",
        "The string is copied into linear memory and re-encoded from UTF-16 to UTF-8 each call",
        "Strings are serialized to JSON",
        "It triggers garbage collection in Rust"
      ],
      "answer": 1,
      "explanation": "JS strings are UTF-16 and live outside Wasm memory, so each crossing copies and transcodes them."
    },
    {
      "q": "How does Rust code in Wasm access document.getElementById?",
      "options": [
        "Directly through Wasm instructions",
        "Through web-sys bindings that call generated JavaScript glue",
        "It cannot at all",
        "Through std::fs"
      ],
      "answer": 1,
      "explanation": "Wasm has no DOM access of its own; web-sys exposes typed bindings implemented by wasm-bindgen JavaScript glue."
    },
    {
      "q": "What does console_error_panic_hook improve?",
      "options": [
        "Binary size",
        "Panic messages show in the browser console instead of an opaque \"unreachable\"",
        "Thread support",
        "Startup time"
      ],
      "answer": 1,
      "explanation": "Without it, a panic traps with RuntimeError: unreachable and no message."
    }
  ];

  qna: QnaItem[] = [
    {
      "q": "When does it make sense to use Rust and WebAssembly in a web app?",
      "a": "When there is substantial CPU-bound work that can run with few boundary crossings — image or audio processing, parsers, compression, crypto, physics or game logic — or when you want to reuse an existing Rust library in the browser. It rarely pays off for DOM-heavy UI code, small utilities or anything I/O bound, where JavaScript is already fast and the glue adds size and complexity."
    },
    {
      "q": "What does wasm-bindgen actually do?",
      "a": "Core Wasm functions only accept and return numbers. <code>wasm-bindgen</code> reads metadata emitted by the <code>#[wasm_bindgen]</code> macro and generates JavaScript (and TypeScript definitions) that convert richer types — strings, slices, structs-as-classes, closures, promises, <code>JsValue</code> handles — to and from Wasm linear memory, plus Rust shims for imported JS functions."
    },
    {
      "q": "How do you keep a Rust/Wasm bundle small?",
      "a": "Build in release with <code>opt-level = \"s\"</code> or <code>\"z\"</code>, enable <code>lto</code> and <code>codegen-units = 1</code>, consider <code>panic = \"abort\"</code>, run <code>wasm-opt</code>, enable only the <code>web-sys</code> features you use, and avoid pulling in large dependencies (formatting machinery, regex, serde_json) unless needed. Tools like <code>twiggy</code> show which functions take the space."
    },
    {
      "q": "What is the difference between wasm32-unknown-unknown and the WASI targets?",
      "a": "<code>wasm32-unknown-unknown</code> assumes no host interface at all — the embedder (usually a browser via wasm-bindgen glue) supplies everything. WASI targets (<code>wasm32-wasip1</code>, and the component-model-based <code>wasm32-wasip2</code>) compile against a standard system interface for files, clocks, randomness and sockets, so <code>std::fs</code> and friends work in runtimes like Wasmtime, Wasmer or serverless edge platforms."
    }
  ];

  revision: RevisionSummary = {
    "oneLiner": "Compile a cdylib to wasm32-unknown-unknown, expose a coarse API with #[wasm_bindgen], package with wasm-pack, and keep boundary crossings and binary size small.",
    "mustKnow": [
      "<code>wasm32-unknown-unknown</code> for browsers; <code>wasm32-wasip1</code>/<code>wasip2</code> for WASI runtimes.",
      "<code>crate-type = [\"cdylib\", \"rlib\"]</code> produces the .wasm and keeps tests working.",
      "<code>#[wasm_bindgen]</code> exports functions and classes and imports JS functions.",
      "No direct DOM access: web-sys goes through JS glue.",
      "Strings and slices are copied across the boundary — batch the work.",
      "Use console_error_panic_hook while developing; optimise size with opt-level \"s\", LTO and wasm-opt."
    ],
    "interviewFocus": [
      "When is Wasm a good or bad fit for a web feature?",
      "Explain what wasm-bindgen generates and why it is needed.",
      "How would you minimise boundary cost and binary size?"
    ]
  };
}
