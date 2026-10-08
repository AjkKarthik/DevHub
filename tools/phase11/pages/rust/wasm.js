module.exports = {
  slug: 'wasm',
  subtitle: 'Compile Rust to WebAssembly: the wasm32 targets, a cdylib crate, #[wasm_bindgen] exports and imports, building with wasm-pack or wasm-bindgen-cli, and keeping the JavaScript boundary cheap.',
  readingTime: 22,
  prerequisites: [
    { label: 'Modules & Cargo', route: '/rust/modules-cargo' },
    { label: 'Ownership & Borrowing', route: '/rust/ownership-borrowing' },
  ],
  apis: ['wasm32-unknown-unknown', 'crate-type = ["cdylib"]', '#[wasm_bindgen]', 'wasm-pack build --target web', 'js-sys / web-sys', 'JsValue'],
  tip: 'Design the Rust side as a coarse-grained API: hand it a whole buffer or a whole task and get one result back. Thousands of tiny calls across the JS/Wasm boundary, each copying a string, can easily cost more than the work itself.',
  gotchas: [
    'WebAssembly cannot touch the DOM directly. Every browser API goes through generated JavaScript glue (web-sys), so DOM-heavy code is rarely faster in Wasm.',
    'Strings are copied and re-encoded (UTF-8 in Rust, UTF-16 in JS) on every crossing. Pass numbers or typed arrays where you can.',
    'Panics in Wasm surface as a cryptic "unreachable" error unless you install console_error_panic_hook in development.',
  ],
  quickRef: [
    { name: 'rustup target add wasm32-unknown-unknown', type: 'syntax', desc: 'Install the browser/bare WebAssembly target' },
    { name: 'wasm32-wasip1 / wasm32-wasip2', type: 'token', desc: 'WASI targets for runtimes like Wasmtime (wasm32-wasi was renamed wasm32-wasip1)' },
    { name: '[lib] crate-type = ["cdylib"]', type: 'syntax', desc: 'Produce a standalone .wasm module from a library crate' },
    { name: '#[wasm_bindgen] pub fn ...', type: 'decorator', desc: 'Export a Rust function (or struct) to JavaScript' },
    { name: '#[wasm_bindgen] extern "C" { fn alert(s: &str); }', type: 'decorator', desc: 'Import a JavaScript function into Rust' },
    { name: 'wasm-pack build --target web', type: 'syntax', desc: 'Compile, run wasm-bindgen and emit an ES module package' },
    { name: 'JsValue', type: 'type', desc: 'An opaque handle to any JavaScript value' },
    { name: 'js-sys / web-sys', type: 'class', desc: 'Bindings to JS built-ins (Array, Date) and browser APIs (document, fetch)' },
    { name: 'wasm-opt -O', type: 'syntax', desc: 'Binaryen optimiser that shrinks and speeds up the .wasm file' },
  ],
  theory: [
    { heading: 'Rust and WebAssembly', points: [
      'WebAssembly (Wasm) is a portable, sandboxed bytecode that browsers and standalone runtimes (Wasmtime, Wasmer, edge platforms) execute at near-native speed. Rust is one of the best-supported source languages because it needs no garbage collector or heavy runtime.',
      'For browsers you compile to `wasm32-unknown-unknown`: no operating system, no filesystem, no threads by default. For server-side and plugin use cases, the WASI targets (`wasm32-wasip1`, `wasm32-wasip2`) add standardised access to files, clocks and sockets.',
      'Good fits: CPU-heavy pure computation (image and video processing, parsing, compression, cryptography, simulations, game logic) and sharing one Rust core between a backend and a web front end. Poor fits: code that mostly manipulates the DOM.',
      'A library compiled as `crate-type = ["cdylib"]` produces the `.wasm` file. Adding `"rlib"` as well keeps the crate usable from normal Rust code and tests.',
    ] },
    { heading: 'wasm-bindgen', points: [
      'Raw Wasm functions only exchange numbers. `wasm-bindgen` generates glue on both sides so you can pass strings, slices, structs, closures and `JsValue` handles across the boundary.',
      '`#[wasm_bindgen]` on a `pub fn` exports it; on a struct with an `impl` block it exports a JavaScript class whose methods call into Rust. On an `extern "C"` block it imports JavaScript functions, including methods and constructors via attributes such as `js_namespace`.',
      '`js-sys` binds ECMAScript built-ins (`Array`, `Promise`, `Date`); `web-sys` binds browser APIs (`Window`, `Document`, `fetch`), each behind a Cargo feature so you only compile what you use. `wasm-bindgen-futures` converts between Rust futures and JS promises.',
      'Since 2025 the original `rustwasm` GitHub organisation has been sunset: wasm-bindgen moved to its own `wasm-bindgen` organisation, and other tools moved to individual maintainers or were archived. Check each tool\'s current repository before adopting it.',
    ] },
    { heading: 'Building and shipping', points: [
      '`wasm-pack build --target web` (or `bundler`, `nodejs`) compiles in release mode, runs `wasm-bindgen`, optionally `wasm-opt`, and writes a `pkg/` directory with the `.wasm`, JS glue, TypeScript definitions and a `package.json`.',
      'Without wasm-pack: `cargo build --release --target wasm32-unknown-unknown`, then `wasm-bindgen --target web --out-dir pkg target/wasm32-unknown-unknown/release/your_crate.wasm`. The CLI version must match the `wasm-bindgen` crate version.',
      'Binary size matters for downloads: build with `opt-level = "s"` or `"z"`, `lto = true` and `codegen-units = 1`, run `wasm-opt`, and avoid pulling in heavy formatting or regex code unless needed.',
      'Install `console_error_panic_hook` during development so a panic prints its message to the browser console instead of an opaque `RuntimeError: unreachable`.',
    ] },
    { heading: 'Crossing the boundary efficiently', points: [
      'Wasm has its own linear memory. Numbers pass directly; strings and `Vec`s are copied into or out of that memory, and strings are re-encoded between UTF-8 and UTF-16.',
      'Batch work: pass a whole `&[u8]` or `&[f32]` (copied once) rather than calling per element, and return one result. For very large shared buffers, expose a pointer into Wasm memory and view it from JS as a typed array.',
      'Keep long-lived state on the Rust side inside an exported struct, so JavaScript holds a small handle instead of re-sending data every call. Call `.free()` (or rely on `FinalizationRegistry` support in newer glue) to release it.',
      'Measure before porting: modern JavaScript engines are fast, and the gain only appears when the Rust side does substantial work per boundary crossing.',
    ] },
  ],
  codeTabs: [
    { label: 'lib.rs', language: 'rust', run: false, code: `use wasm_bindgen::prelude::*;

// Import a JavaScript function
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Export a plain function
#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {name}!")
}

// Export a whole slice at once: one copy in, one number out
#[wasm_bindgen]
pub fn checksum(bytes: &[u8]) -> u32 {
    bytes.iter().fold(0u32, |acc, &b| acc.wrapping_mul(31).wrapping_add(b as u32))
}

// Export a class: state stays on the Rust side
#[wasm_bindgen]
pub struct Counter { count: u32 }

#[wasm_bindgen]
impl Counter {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Counter { Counter { count: 0 } }

    pub fn increment(&mut self) -> u32 {
        self.count += 1;
        log(&format!("count is now {}", self.count));
        self.count
    }
}` },
    { label: 'Cargo.toml & build', language: 'bash', code: `# Cargo.toml
[package]
name = "hello-wasm"
version = "0.1.0"
edition = "2024"

[lib]
crate-type = ["cdylib", "rlib"]   # cdylib -> .wasm, rlib -> normal tests

[dependencies]
wasm-bindgen = "0.2"

[profile.release]
opt-level = "s"     # optimise for size
lto = true

# ---- build ----
rustup target add wasm32-unknown-unknown

# Option A: wasm-pack (compile + wasm-bindgen + package)
wasm-pack build --target web          # writes pkg/

# Option B: by hand
cargo build --release --target wasm32-unknown-unknown
wasm-bindgen --target web --out-dir pkg \\
  target/wasm32-unknown-unknown/release/hello_wasm.wasm` },
    { label: 'Using it from JavaScript', language: 'typescript', code: `// main.ts — with --target web the glue is an ES module
import init, { greet, checksum, Counter } from './pkg/hello_wasm.js';

await init();                       // fetch + instantiate the .wasm

console.log(greet('Ada'));          // "Hello, Ada!"

const bytes = new TextEncoder().encode('large input...');
console.log(checksum(bytes));       // one boundary crossing for the whole buffer

const c = new Counter();
c.increment();                      // logs "count is now 1" via the imported console.log
c.increment();
c.free();                           // release the Rust-side memory` },
    { label: 'Testing the core natively', language: 'rust', code: `// Keep the real logic in plain Rust functions; the #[wasm_bindgen]
// wrappers stay thin. Then normal cargo test runs on your machine.
pub fn checksum(bytes: &[u8]) -> u32 {
    bytes.iter().fold(0u32, |acc, &b| acc.wrapping_mul(31).wrapping_add(b as u32))
}

pub fn grayscale(rgba: &mut [u8]) {
    for px in rgba.chunks_exact_mut(4) {
        let y = (0.299 * px[0] as f32 + 0.587 * px[1] as f32 + 0.114 * px[2] as f32) as u8;
        px[0] = y; px[1] = y; px[2] = y;   // alpha untouched
    }
}

fn main() {
    println!("{}", checksum(b"abc"));     // 96354
    let mut img = vec![255, 0, 0, 255, 0, 0, 255, 128];
    grayscale(&mut img);
    println!("{img:?}");                  // [76, 76, 76, 255, 29, 29, 29, 128]
}` },
  ],
  mistakes: [
    { title: 'Calling into Wasm once per element', wrong: `for (let i = 0; i < pixels.length; i += 4) {
  pixels[i] = wasm.brighten(pixels[i]);   // a million boundary crossings
}`, right: `wasm.brighten_all(pixels);   // pass the Uint8Array once, loop inside Rust`, explanation: 'Each call crosses the JS/Wasm boundary. Batch the work so Rust receives the whole buffer and loops internally; that is where the speed-up comes from.' },
    { title: 'Expecting Wasm to speed up DOM work', wrong: `// Rewriting a React-style UI renderer in Rust/Wasm "for speed"
// every element creation still goes through web-sys -> JS glue -> DOM`, right: `// Keep DOM work in JavaScript; move the heavy computation
// (parsing, layout maths, image processing) into Rust`, explanation: 'Wasm cannot access the DOM directly; web-sys calls go through JavaScript. DOM-bound code rarely gets faster and usually gets bigger.' },
    { title: 'Forgetting crate-type = cdylib', wrong: `[lib]
# no crate-type: cargo build --target wasm32-unknown-unknown produces only an .rlib`, right: `[lib]
crate-type = ["cdylib", "rlib"]`, explanation: 'Without cdylib there is no .wasm module to load. Keeping rlib alongside lets ordinary Rust tests and other crates still use the library.' },
    { title: 'Mismatched wasm-bindgen CLI and crate versions', wrong: `# Cargo.lock has wasm-bindgen 0.2.100, installed CLI is 0.2.92
wasm-bindgen --target web target/.../app.wasm
# error: it looks like the Rust project used to create this wasm file was linked against
# version of wasm-bindgen that uses a different bindgen format than this binary`, right: `cargo install wasm-bindgen-cli --version 0.2.100   # match Cargo.lock exactly
# or let wasm-pack pick the matching CLI`, explanation: 'The CLI and the crate share an internal schema. Pin the CLI to the exact version in Cargo.lock, which wasm-pack does for you.' },
    { title: 'Debugging panics without a panic hook', wrong: `// Browser console: RuntimeError: unreachable executed
// no message, no location`, right: `#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();  // panics now log their message
}`, explanation: 'By default a Rust panic in Wasm traps with "unreachable". The panic hook forwards the message and location to console.error, which is essential during development.' },
  ],
  challenge: {
    title: 'A Wasm-ready text statistics core',
    language: 'rust',
    description: 'Write the plain-Rust core of a Wasm module: a struct TextStats { words: u32, sentences: u32, avg_word_len: f32 } and fn analyze(text: &str) -> TextStats. Count words with split_whitespace, sentences as the number of ., ! or ? characters (at least 1 if the text has any words), and average word length in characters ignoring trailing punctuation. Keep it free of wasm_bindgen so it can be unit-tested natively; a thin #[wasm_bindgen] wrapper would call it.',
    hints: ['word.trim_end_matches(|c: char| c.is_ascii_punctuation()) strips trailing punctuation.', 'Use chars().count() for length, not len().', 'Guard against division by zero for empty input.'],
    starterCode: `#[derive(Debug, PartialEq)]
pub struct TextStats { pub words: u32, pub sentences: u32, pub avg_word_len: f32 }

pub fn analyze(text: &str) -> TextStats {
    todo!()
}

fn main() {
    println!("{:?}", analyze("Rust compiles to Wasm. It is fast!"));
}`,
    solution: `#[derive(Debug, PartialEq)]
pub struct TextStats { pub words: u32, pub sentences: u32, pub avg_word_len: f32 }

pub fn analyze(text: &str) -> TextStats {
    let words: Vec<&str> = text
        .split_whitespace()
        .map(|w| w.trim_end_matches(|c: char| c.is_ascii_punctuation()))
        .filter(|w| !w.is_empty())
        .collect();
    let word_count = words.len() as u32;
    let mut sentences = text.chars().filter(|c| matches!(c, '.' | '!' | '?')).count() as u32;
    if sentences == 0 && word_count > 0 { sentences = 1; }
    let total_chars: usize = words.iter().map(|w| w.chars().count()).sum();
    let avg_word_len = if word_count == 0 { 0.0 } else { total_chars as f32 / word_count as f32 };
    TextStats { words: word_count, sentences, avg_word_len }
}

// The thin Wasm wrapper would be:
// #[wasm_bindgen] pub fn word_count(text: &str) -> u32 { analyze(text).words }

fn main() {
    println!("{:?}", analyze("Rust compiles to Wasm. It is fast!"));
    // TextStats { words: 7, sentences: 2, avg_word_len: 3.7142856 }
    println!("{:?}", analyze(""));
    // TextStats { words: 0, sentences: 0, avg_word_len: 0.0 }
}`,
  },
  quiz: [
    { q: 'Which target do you use for browser WebAssembly with wasm-bindgen?', options: ['wasm32-wasip1', 'wasm32-unknown-unknown', 'x86_64-unknown-linux-gnu', 'wasm64-browser'], answer: 1, explanation: 'wasm32-unknown-unknown has no OS assumptions and is what wasm-bindgen targets. WASI targets are for runtimes that provide the WASI system interface.' },
    { q: 'What does crate-type = ["cdylib"] provide?', options: ['A static Rust library', 'A standalone dynamic library — for Wasm, the .wasm module', 'A binary executable', 'A procedural macro'], answer: 1, explanation: 'cdylib produces a library with a C-style ABI suitable for loading from other environments; on wasm32 that is the .wasm module.' },
    { q: 'Why is passing a large string to a Wasm function on every keystroke potentially slow?', options: ['Wasm cannot take strings', 'The string is copied into linear memory and re-encoded from UTF-16 to UTF-8 each call', 'Strings are serialized to JSON', 'It triggers garbage collection in Rust'], answer: 1, explanation: 'JS strings are UTF-16 and live outside Wasm memory, so each crossing copies and transcodes them.' },
    { q: 'How does Rust code in Wasm access document.getElementById?', options: ['Directly through Wasm instructions', 'Through web-sys bindings that call generated JavaScript glue', 'It cannot at all', 'Through std::fs'], answer: 1, explanation: 'Wasm has no DOM access of its own; web-sys exposes typed bindings implemented by wasm-bindgen JavaScript glue.' },
    { q: 'What does console_error_panic_hook improve?', options: ['Binary size', 'Panic messages show in the browser console instead of an opaque "unreachable"', 'Thread support', 'Startup time'], answer: 1, explanation: 'Without it, a panic traps with RuntimeError: unreachable and no message.' },
  ],
  qna: [
    { q: 'When does it make sense to use Rust and WebAssembly in a web app?', a: 'When there is substantial CPU-bound work that can run with few boundary crossings — image or audio processing, parsers, compression, crypto, physics or game logic — or when you want to reuse an existing Rust library in the browser. It rarely pays off for DOM-heavy UI code, small utilities or anything I/O bound, where JavaScript is already fast and the glue adds size and complexity.' },
    { q: 'What does wasm-bindgen actually do?', a: 'Core Wasm functions only accept and return numbers. `wasm-bindgen` reads metadata emitted by the `#[wasm_bindgen]` macro and generates JavaScript (and TypeScript definitions) that convert richer types — strings, slices, structs-as-classes, closures, promises, `JsValue` handles — to and from Wasm linear memory, plus Rust shims for imported JS functions.' },
    { q: 'How do you keep a Rust/Wasm bundle small?', a: 'Build in release with `opt-level = "s"` or `"z"`, enable `lto` and `codegen-units = 1`, consider `panic = "abort"`, run `wasm-opt`, enable only the `web-sys` features you use, and avoid pulling in large dependencies (formatting machinery, regex, serde_json) unless needed. Tools like `twiggy` show which functions take the space.' },
    { q: 'What is the difference between wasm32-unknown-unknown and the WASI targets?', a: '`wasm32-unknown-unknown` assumes no host interface at all — the embedder (usually a browser via wasm-bindgen glue) supplies everything. WASI targets (`wasm32-wasip1`, and the component-model-based `wasm32-wasip2`) compile against a standard system interface for files, clocks, randomness and sockets, so `std::fs` and friends work in runtimes like Wasmtime, Wasmer or serverless edge platforms.' },
  ],
  revision: {
    oneLiner: 'Compile a cdylib to wasm32-unknown-unknown, expose a coarse API with #[wasm_bindgen], package with wasm-pack, and keep boundary crossings and binary size small.',
    mustKnow: [
      '`wasm32-unknown-unknown` for browsers; `wasm32-wasip1`/`wasip2` for WASI runtimes.',
      '`crate-type = ["cdylib", "rlib"]` produces the .wasm and keeps tests working.',
      '`#[wasm_bindgen]` exports functions and classes and imports JS functions.',
      'No direct DOM access: web-sys goes through JS glue.',
      'Strings and slices are copied across the boundary — batch the work.',
      'Use console_error_panic_hook while developing; optimise size with opt-level "s", LTO and wasm-opt.',
    ],
    interviewFocus: [
      'When is Wasm a good or bad fit for a web feature?',
      'Explain what wasm-bindgen generates and why it is needed.',
      'How would you minimise boundary cost and binary size?',
    ],
  },
};
