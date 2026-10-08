module.exports = {
  slug: 'macros',
  subtitle: 'Macros write code for you at compile time: macro_rules! matches token patterns with fragment specifiers and repetitions, hygiene keeps local names apart, and procedural macros (derive, attribute, function-like) transform token streams with syn and quote.',
  readingTime: 24,
  prerequisites: [
    { label: 'Traits & Generics', route: '/rust/traits-generics' },
    { label: 'Pattern Matching', route: '/rust/pattern-matching' },
  ],
  apis: ['macro_rules!', '$x:expr / $t:ty / $i:ident', '$( ... ),*', '#[macro_export]', 'proc_macro_derive', 'syn / quote'],
  tip: 'Reach for a function or a generic first and a macro last. Macros are the right tool when you need something functions cannot do — a variable number of arguments, generating items such as structs or impls, or compile-time checks on syntax.',
  gotchas: [
    'Macro arguments are substituted as syntax, not values: $x used twice in the expansion evaluates the expression twice. Bind it once with let.',
    'macro_rules! macros must be defined before use in source order within a module, unless exported with #[macro_export] (which places them at the crate root).',
    'Procedural macros must live in their own crate with proc-macro = true, and they slow down compile times — especially with syn\'s full feature set.',
  ],
  quickRef: [
    { name: 'macro_rules! name { (pattern) => { expansion }; }', type: 'syntax', desc: 'Declarative macro: arms are tried top to bottom' },
    { name: '$e:expr  $t:ty  $i:ident  $p:pat  $l:literal  $b:block  $tt:tt', type: 'token', desc: 'Fragment specifiers: what kind of syntax a metavariable matches' },
    { name: '$( $x:expr ),*', type: 'syntax', desc: 'Repetition: zero or more, comma separated (+ for one or more, ? for optional)' },
    { name: '$( ... )* in the expansion', type: 'syntax', desc: 'Repeat the expansion once per captured item' },
    { name: '#[macro_export]', type: 'decorator', desc: 'Make a macro_rules! macro usable by other crates' },
    { name: '$crate::path', type: 'token', desc: 'Refer to items of the defining crate from inside an exported macro' },
    { name: '#[proc_macro_derive(Name)]', type: 'decorator', desc: 'Custom derive macro (proc-macro crate)' },
    { name: '#[proc_macro_attribute] / #[proc_macro]', type: 'decorator', desc: 'Attribute macro / function-like procedural macro' },
    { name: 'syn::parse_macro_input! + quote!', type: 'function', desc: 'Parse the input token stream and generate output tokens' },
    { name: 'cargo expand', type: 'syntax', desc: 'Show the code a macro expands to (cargo-expand tool)' },
  ],
  theory: [
    { heading: 'Why macros exist', points: [
      'A macro runs at compile time and produces code. Rust uses them where functions cannot help: `println!` checks its format string against its arguments, `vec!` accepts any number of elements, and `#[derive(Debug)]` writes a whole `impl` for you.',
      'Macros operate on tokens before type checking. That makes them powerful (they can generate structs, impls and tests) but also means error messages point into generated code and IDE support is weaker.',
      'Rule of thumb: use a function, generic or trait if it can do the job; use `macro_rules!` for small syntax conveniences and repetitive item generation; use procedural macros for derives and attributes that need to inspect the structure of a type.',
    ] },
    { heading: 'macro_rules!', points: [
      'A declarative macro is a list of arms `(matcher) => { transcriber }`. The first arm whose matcher fits the input wins, so put specific arms before general ones.',
      'Metavariables capture syntax fragments: `$e:expr`, `$t:ty`, `$i:ident`, `$p:pat`, `$l:literal`, `$b:block`, and `$tt:tt` for any single token tree (the escape hatch for anything else).',
      'Repetitions `$( ... ),*`, `$( ... );+` and `$( ... )?` match a separated list; the same repetition in the transcriber emits the body once per item. Nested repetitions must be used at the same depth they were matched.',
      'Macros can recurse — call themselves on the remaining tokens — which is how "tt munchers" parse custom mini-languages. Recursion is limited (default 128 levels, `#![recursion_limit]` raises it).',
      'Export a macro for other crates with `#[macro_export]` and refer to your own items inside it with `$crate::` so paths resolve no matter where the macro is called.',
    ] },
    { heading: 'Hygiene', points: [
      'Identifiers introduced inside a `macro_rules!` expansion live in their own syntax context: a `let tmp` in the macro does not clash with a caller\'s `tmp`, and the macro cannot accidentally capture the caller\'s variables.',
      'To make the macro define a name the caller can use, take the identifier as a parameter (`$name:ident`) — then it carries the caller\'s context.',
      'Hygiene in `macro_rules!` covers local variables, labels and `$crate`; item names such as functions and types are not hygienic, so a macro defining `fn helper()` can collide with the caller\'s `helper`.',
    ] },
    { heading: 'Procedural macros', points: [
      'Procedural macros are Rust functions that take a `TokenStream` and return a `TokenStream`. They live in a separate crate with `[lib] proc-macro = true` and run inside the compiler.',
      'Three kinds: derive macros (`#[derive(Builder)]`, add items next to a type), attribute macros (`#[route(GET, "/")]`, `#[tokio::main]`, replace the item they annotate) and function-like macros (`sql!(...)`, used like `macro_rules!` but with arbitrary parsing).',
      'Almost every proc macro uses `syn` to parse tokens into a syntax tree and `quote!` to generate code with `#var` interpolation. Report errors with `syn::Error::new_spanned(...).to_compile_error()` so they point at the user\'s code.',
      'Well-known examples: serde\'s `Serialize`/`Deserialize`, `thiserror::Error`, clap\'s `Parser`, `tokio::main`, sqlx\'s `query!` (which even checks SQL against a database at compile time).',
    ] },
  ],
  codeTabs: [
    { label: 'macro_rules! basics', language: 'rust', code: `// Variadic max with one arm per shape
macro_rules! max {
    ($x:expr) => { $x };
    ($x:expr, $($rest:expr),+ $(,)?) => {{
        let a = $x;
        let b = max!($($rest),+);
        if a > b { a } else { b }
    }};
}

// Build a HashMap literal
macro_rules! hashmap {
    ($($k:expr => $v:expr),* $(,)?) => {{
        let mut m = std::collections::HashMap::new();
        $( m.insert($k, $v); )*
        m
    }};
}

// Generate items: a newtype with Display for each name
macro_rules! id_types {
    ($($name:ident),*) => {
        $(
            #[derive(Debug, Clone, Copy, PartialEq)]
            pub struct $name(pub u64);
            impl std::fmt::Display for $name {
                fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
                    write!(f, "{}#{}", stringify!($name), self.0)
                }
            }
        )*
    };
}
id_types!(UserId, OrderId);

fn main() {
    println!("{}", max!(3, 9, 4));               // 9
    let m = hashmap! { "a" => 1, "b" => 2, };
    println!("{}", m["b"]);                       // 2
    println!("{} {}", UserId(7), OrderId(42));    // UserId#7 OrderId#42
    // UserId(7) == OrderId(7)  -> compile error: different types
}` },
    { label: 'Hygiene & double evaluation', language: 'rust', code: `macro_rules! square_bad {
    ($x:expr) => { $x * $x };          // $x is evaluated twice
}
macro_rules! square {
    ($x:expr) => {{ let v = $x; v * v }};   // evaluate once
}

macro_rules! swap_with_tmp {
    ($a:ident, $b:ident) => {
        let tmp = $a;    // this tmp is hygienic: invisible to the caller
        $a = $b;
        $b = tmp;
    };
}

fn next(counter: &mut i32) -> i32 { *counter += 1; *counter }

fn main() {
    let mut c = 0;
    println!("{}", square_bad!(next(&mut c)));  // 1 * 2 = 2  (called twice!)
    let mut c = 0;
    println!("{}", square!(next(&mut c)));      // 1 * 1 = 1

    let tmp = "caller's tmp";
    let (mut x, mut y) = (1, 2);
    swap_with_tmp!(x, y);
    println!("{x} {y} {tmp}");                  // 2 1 caller's tmp
}` },
    { label: 'A derive macro (proc-macro crate)', language: 'rust', check: false, code: `// hello_derive/Cargo.toml:
//   [lib] proc-macro = true
//   [dependencies] syn = "2"  quote = "1"  proc-macro2 = "1"

use proc_macro::TokenStream;
use quote::quote;
use syn::{DeriveInput, parse_macro_input};

/// #[derive(Describe)] adds fn describe() -> String listing the field names
#[proc_macro_derive(Describe)]
pub fn derive_describe(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;

    let fields: Vec<String> = match &ast.data {
        syn::Data::Struct(s) => s.fields.iter()
            .filter_map(|f| f.ident.as_ref().map(|i| i.to_string()))
            .collect(),
        _ => {
            return syn::Error::new_spanned(&ast, "Describe only supports structs")
                .to_compile_error()
                .into();
        }
    };
    let list = fields.join(", ");

    quote! {
        impl #name {
            pub fn describe() -> String {
                format!("{} {{ {} }}", stringify!(#name), #list)
            }
        }
    }
    .into()
}

// In the user crate:
// #[derive(Describe)] struct Point { x: f64, y: f64 }
// Point::describe() == "Point { x, y }"` },
  ],
  mistakes: [
    { title: 'Evaluating a macro argument twice', wrong: `macro_rules! double {
    ($x:expr) => { $x + $x };
}
double!(expensive_call())   // expensive_call runs twice`, right: `macro_rules! double {
    ($x:expr) => {{ let v = $x; v + v }};
}`, explanation: 'Macro arguments are pasted as syntax. Bind the expression to a local once so side effects and costs happen a single time.' },
    { title: 'Using a macro when a function would do', wrong: `macro_rules! add_tax {
    ($price:expr) => { $price * 1.2 };
}`, right: `fn add_tax(price: f64) -> f64 {
    price * 1.2
}`, explanation: 'Functions are type-checked at the definition, show up in docs and IDE tooling, and give clearer errors. Macros are for things functions cannot express.' },
    { title: 'Putting the general arm before the specific one', checkWrong: true, wrong: `macro_rules! show {
    ($e:expr) => { println!("expr: {}", $e) };
    (empty) => { println!("nothing") };
}
fn main() { show!(empty); }`, right: `macro_rules! show {
    (empty) => { println!("nothing") };
    ($e:expr) => { println!("expr: {}", $e) };
}
fn main() { show!(empty); }`, checkRight: true, explanation: 'Arms are tried in order. With the expr arm first, `empty` is parsed as an expression — a path to a variable that does not exist — and compilation fails (E0425). Put literal-token arms first.' },
    { title: 'Referring to crate items without $crate', wrong: `#[macro_export]
macro_rules! log_event {
    ($e:expr) => { helpers::record($e) };   // breaks in other crates
}`, right: `#[macro_export]
macro_rules! log_event {
    ($e:expr) => { $crate::helpers::record($e) };
}`, explanation: 'An exported macro expands in the caller\'s crate, where helpers is not in scope. $crate always resolves to the crate that defined the macro.' },
    { title: 'Panicking inside a proc macro', wrong: `let fields = match &ast.data {
    Data::Struct(s) => &s.fields,
    _ => panic!("only structs"),   // error points at the derive, not the user code
};`, right: `_ => return syn::Error::new_spanned(&ast.ident, "only structs are supported")
    .to_compile_error()
    .into(),`, explanation: 'A panic produces a generic "proc-macro derive panicked" error. syn::Error with a span highlights the exact user code that is wrong.' },
  ],
  challenge: {
    title: 'An enum with string conversions',
    language: 'rust',
    description: 'Write a macro_rules! macro string_enum! that takes an enum name and a list of `Variant => "text"` pairs and generates: the enum (deriving Debug, Clone, Copy, PartialEq), a const ALL slice of every variant, fn as_str(&self) -> &\'static str, and an impl of std::str::FromStr that returns Err(String) for unknown text. Use it for a Status enum.',
    hints: ['Matcher: ($name:ident { $($variant:ident => $text:literal),+ $(,)? })', 'Use the same repetition three times in the expansion: in the enum body, in ALL, and in each match.', 'FromStr needs type Err = String; and fn from_str(s: &str) -> Result<Self, Self::Err>.'],
    starterCode: `macro_rules! string_enum {
    // TODO: replace this placeholder arm
    ($name:ident { $($variant:ident => $text:literal),+ $(,)? }) => { todo!() };
}

// string_enum!(Status { Active => "active", Suspended => "suspended", Closed => "closed" });

fn main() {}`,
    solution: `macro_rules! string_enum {
    ($name:ident { $($variant:ident => $text:literal),+ $(,)? }) => {
        #[derive(Debug, Clone, Copy, PartialEq)]
        pub enum $name { $($variant),+ }

        impl $name {
            pub const ALL: &'static [$name] = &[$($name::$variant),+];

            pub fn as_str(&self) -> &'static str {
                match self { $($name::$variant => $text),+ }
            }
        }

        impl std::str::FromStr for $name {
            type Err = String;
            fn from_str(s: &str) -> Result<Self, Self::Err> {
                match s {
                    $($text => Ok($name::$variant),)+
                    other => Err(format!("unknown {}: {other:?}", stringify!($name))),
                }
            }
        }
    };
}

string_enum!(Status { Active => "active", Suspended => "suspended", Closed => "closed" });

fn main() {
    for s in Status::ALL {
        println!("{s:?} -> {}", s.as_str());
    }
    println!("{:?}", "closed".parse::<Status>());   // Ok(Closed)
    println!("{:?}", "deleted".parse::<Status>());  // Err("unknown Status: \\"deleted\\"")
}`,
  },
  quiz: [
    { q: 'When do macro_rules! macros run?', options: ['At runtime, like functions', 'At compile time, before type checking', 'At link time', 'Only in debug builds'], answer: 1, explanation: 'Declarative macros are expanded during compilation, operating on tokens before the code is type-checked.' },
    { q: 'What does the fragment specifier $i:ident match?', options: ['Any expression', 'An identifier such as a variable or type name', 'An integer literal', 'A whole block'], answer: 1, explanation: 'ident matches identifiers; expr matches expressions, literal matches literals, block matches { ... }.' },
    { q: 'With macro_rules! square { ($x:expr) => { $x * $x } }, how many times does f() run in square!(f())?', options: ['Once', 'Twice', 'Zero', 'It does not compile'], answer: 1, explanation: 'The expression is pasted in twice. Bind it with let inside the expansion to evaluate it once.' },
    { q: 'Why must procedural macros live in a separate crate?', options: ['For licensing reasons', 'They are compiled for the host and loaded by the compiler while compiling the user crate', 'They are written in another language', 'It is only a convention'], answer: 1, explanation: 'proc-macro crates (proc-macro = true) are built as compiler plugins that run during compilation of the crates that use them.' },
    { q: 'What does $crate solve in an exported macro?', options: ['Performance', 'It resolves paths to the defining crate regardless of where the macro is invoked', 'It enables recursion', 'It makes the macro public'], answer: 1, explanation: 'Paths in the expansion are resolved in the calling crate; $crate::... always points back to the crate that defined the macro.' },
  ],
  qna: [
    { q: 'What is the difference between declarative and procedural macros?', a: 'Declarative macros (`macro_rules!`) match token patterns with metavariables and repetitions and substitute them into a template — no code runs, it is pattern rewriting. Procedural macros are real Rust functions in a `proc-macro` crate that receive and return token streams, so they can parse arbitrary input (usually with `syn`) and generate any code (with `quote!`). Derives and attribute macros must be procedural; small syntax helpers are usually declarative.' },
    { q: 'What is macro hygiene?', a: 'Identifiers created inside a `macro_rules!` expansion carry the macro\'s syntax context, so local variables in the expansion never clash with, or accidentally capture, variables at the call site. To let the macro bind a name the caller can use, pass the identifier in as a `$name:ident`. Hygiene applies to locals, labels and `$crate`; items such as functions are not hygienic.' },
    { q: 'What are the downsides of macros?', a: 'They can be harder to read, debug and document; error messages may point into generated code; IDE completion and refactoring work less well inside them; and procedural macros add noticeable compile time, especially when many crates depend on `syn`. Use `cargo expand` to inspect expansions, keep macros small, and prefer functions and generics when they suffice.' },
    { q: 'How does println! check its format string at compile time?', a: '`println!` expands to `format_args!`, a compiler built-in that parses the literal format string during compilation, matches each `{}` placeholder (including inline names like `{name}`) to an argument, and checks that each argument implements the required formatting trait (`Display`, `Debug`...). A mismatch is a compile error, not a runtime exception.' },
  ],
  revision: {
    oneLiner: 'Macros generate code at compile time: macro_rules! for pattern-based expansion, procedural macros (derive, attribute, function-like) with syn and quote for anything structural.',
    mustKnow: [
      'Arms are tried in order; put specific (literal-token) arms first.',
      'Fragment specifiers: `expr`, `ty`, `ident`, `pat`, `literal`, `block`, `tt`.',
      'Repetition `$(...),*` in both matcher and expansion.',
      'Arguments are pasted as syntax — bind once to avoid double evaluation.',
      'Hygiene isolates locals; use `$crate::` in exported macros.',
      'Proc macros need their own `proc-macro = true` crate; use syn + quote and span-aware errors.',
    ],
    interviewFocus: [
      'Compare declarative and procedural macros with examples.',
      'Explain hygiene and the double-evaluation pitfall.',
      'When would you write a derive macro instead of a trait with a blanket impl?',
    ],
  },
};
