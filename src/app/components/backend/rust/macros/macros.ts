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
  selector: 'app-rust-macros',
  standalone: true,
  imports: [PageMetaComponent, PrerequisitesComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './macros.html',
  styleUrl: './macros.scss'
})
export class RustMacros {
  readingTime = 24;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'advanced';
  since = "Rust 2024";
  route = 'rust-macros';
  nextRoute = '/rust/performance-profiling';
  nextLabel = "Performance & Profiling";

  prerequisites: Prerequisite[] = [
    {
      "label": "Traits & Generics",
      "route": "/rust/traits-generics"
    },
    {
      "label": "Pattern Matching",
      "route": "/rust/pattern-matching"
    }
  ];

  quickRef: QuickRefItem[] = [
    {
      "name": "macro_rules! name { (pattern) => { expansion }; }",
      "type": "syntax",
      "desc": "Declarative macro: arms are tried top to bottom"
    },
    {
      "name": "$e:expr  $t:ty  $i:ident  $p:pat  $l:literal  $b:block  $tt:tt",
      "type": "token",
      "desc": "Fragment specifiers: what kind of syntax a metavariable matches"
    },
    {
      "name": "$( $x:expr ),*",
      "type": "syntax",
      "desc": "Repetition: zero or more, comma separated (+ for one or more, ? for optional)"
    },
    {
      "name": "$( ... )* in the expansion",
      "type": "syntax",
      "desc": "Repeat the expansion once per captured item"
    },
    {
      "name": "#[macro_export]",
      "type": "decorator",
      "desc": "Make a macro_rules! macro usable by other crates"
    },
    {
      "name": "$crate::path",
      "type": "token",
      "desc": "Refer to items of the defining crate from inside an exported macro"
    },
    {
      "name": "#[proc_macro_derive(Name)]",
      "type": "decorator",
      "desc": "Custom derive macro (proc-macro crate)"
    },
    {
      "name": "#[proc_macro_attribute] / #[proc_macro]",
      "type": "decorator",
      "desc": "Attribute macro / function-like procedural macro"
    },
    {
      "name": "syn::parse_macro_input! + quote!",
      "type": "function",
      "desc": "Parse the input token stream and generate output tokens"
    },
    {
      "name": "cargo expand",
      "type": "syntax",
      "desc": "Show the code a macro expands to (cargo-expand tool)"
    }
  ];

  theory: TheoryPoint[] = [
    {
      "heading": "Why macros exist",
      "points": [
        "A macro runs at compile time and produces code. Rust uses them where functions cannot help: <code>println!</code> checks its format string against its arguments, <code>vec!</code> accepts any number of elements, and <code>#[derive(Debug)]</code> writes a whole <code>impl</code> for you.",
        "Macros operate on tokens before type checking. That makes them powerful (they can generate structs, impls and tests) but also means error messages point into generated code and IDE support is weaker.",
        "Rule of thumb: use a function, generic or trait if it can do the job; use <code>macro_rules!</code> for small syntax conveniences and repetitive item generation; use procedural macros for derives and attributes that need to inspect the structure of a type."
      ]
    },
    {
      "heading": "macro_rules!",
      "points": [
        "A declarative macro is a list of arms <code>(matcher) =&gt; { transcriber }</code>. The first arm whose matcher fits the input wins, so put specific arms before general ones.",
        "Metavariables capture syntax fragments: <code>$e:expr</code>, <code>$t:ty</code>, <code>$i:ident</code>, <code>$p:pat</code>, <code>$l:literal</code>, <code>$b:block</code>, and <code>$tt:tt</code> for any single token tree (the escape hatch for anything else).",
        "Repetitions <code>$( ... ),*</code>, <code>$( ... );+</code> and <code>$( ... )?</code> match a separated list; the same repetition in the transcriber emits the body once per item. Nested repetitions must be used at the same depth they were matched.",
        "Macros can recurse — call themselves on the remaining tokens — which is how \"tt munchers\" parse custom mini-languages. Recursion is limited (default 128 levels, <code>#![recursion_limit]</code> raises it).",
        "Export a macro for other crates with <code>#[macro_export]</code> and refer to your own items inside it with <code>$crate::</code> so paths resolve no matter where the macro is called."
      ]
    },
    {
      "heading": "Hygiene",
      "points": [
        "Identifiers introduced inside a <code>macro_rules!</code> expansion live in their own syntax context: a <code>let tmp</code> in the macro does not clash with a caller's <code>tmp</code>, and the macro cannot accidentally capture the caller's variables.",
        "To make the macro define a name the caller can use, take the identifier as a parameter (<code>$name:ident</code>) — then it carries the caller's context.",
        "Hygiene in <code>macro_rules!</code> covers local variables, labels and <code>$crate</code>; item names such as functions and types are not hygienic, so a macro defining <code>fn helper()</code> can collide with the caller's <code>helper</code>."
      ]
    },
    {
      "heading": "Procedural macros",
      "points": [
        "Procedural macros are Rust functions that take a <code>TokenStream</code> and return a <code>TokenStream</code>. They live in a separate crate with <code>[lib] proc-macro = true</code> and run inside the compiler.",
        "Three kinds: derive macros (<code>#[derive(Builder)]</code>, add items next to a type), attribute macros (<code>#[route(GET, \"/\")]</code>, <code>#[tokio::main]</code>, replace the item they annotate) and function-like macros (<code>sql!(...)</code>, used like <code>macro_rules!</code> but with arbitrary parsing).",
        "Almost every proc macro uses <code>syn</code> to parse tokens into a syntax tree and <code>quote!</code> to generate code with <code>#var</code> interpolation. Report errors with <code>syn::Error::new_spanned(...).to_compile_error()</code> so they point at the user's code.",
        "Well-known examples: serde's <code>Serialize</code>/<code>Deserialize</code>, <code>thiserror::Error</code>, clap's <code>Parser</code>, <code>tokio::main</code>, sqlx's <code>query!</code> (which even checks SQL against a database at compile time)."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "macro_rules! basics",
      "code": "// Variadic max with one arm per shape\nmacro_rules! max {\n    ($x:expr) => { $x };\n    ($x:expr, $($rest:expr),+ $(,)?) => {{\n        let a = $x;\n        let b = max!($($rest),+);\n        if a > b { a } else { b }\n    }};\n}\n\n// Build a HashMap literal\nmacro_rules! hashmap {\n    ($($k:expr => $v:expr),* $(,)?) => {{\n        let mut m = std::collections::HashMap::new();\n        $( m.insert($k, $v); )*\n        m\n    }};\n}\n\n// Generate items: a newtype with Display for each name\nmacro_rules! id_types {\n    ($($name:ident),*) => {\n        $(\n            #[derive(Debug, Clone, Copy, PartialEq)]\n            pub struct $name(pub u64);\n            impl std::fmt::Display for $name {\n                fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {\n                    write!(f, \"{}#{}\", stringify!($name), self.0)\n                }\n            }\n        )*\n    };\n}\nid_types!(UserId, OrderId);\n\nfn main() {\n    println!(\"{}\", max!(3, 9, 4));               // 9\n    let m = hashmap! { \"a\" => 1, \"b\" => 2, };\n    println!(\"{}\", m[\"b\"]);                       // 2\n    println!(\"{} {}\", UserId(7), OrderId(42));    // UserId#7 OrderId#42\n    // UserId(7) == OrderId(7)  -> compile error: different types\n}",
      "language": "rust"
    },
    {
      "label": "Hygiene & double evaluation",
      "code": "macro_rules! square_bad {\n    ($x:expr) => { $x * $x };          // $x is evaluated twice\n}\nmacro_rules! square {\n    ($x:expr) => {{ let v = $x; v * v }};   // evaluate once\n}\n\nmacro_rules! swap_with_tmp {\n    ($a:ident, $b:ident) => {\n        let tmp = $a;    // this tmp is hygienic: invisible to the caller\n        $a = $b;\n        $b = tmp;\n    };\n}\n\nfn next(counter: &mut i32) -> i32 { *counter += 1; *counter }\n\nfn main() {\n    let mut c = 0;\n    println!(\"{}\", square_bad!(next(&mut c)));  // 1 * 2 = 2  (called twice!)\n    let mut c = 0;\n    println!(\"{}\", square!(next(&mut c)));      // 1 * 1 = 1\n\n    let tmp = \"caller's tmp\";\n    let (mut x, mut y) = (1, 2);\n    swap_with_tmp!(x, y);\n    println!(\"{x} {y} {tmp}\");                  // 2 1 caller's tmp\n}",
      "language": "rust"
    },
    {
      "label": "A derive macro (proc-macro crate)",
      "code": "// hello_derive/Cargo.toml:\n//   [lib] proc-macro = true\n//   [dependencies] syn = \"2\"  quote = \"1\"  proc-macro2 = \"1\"\n\nuse proc_macro::TokenStream;\nuse quote::quote;\nuse syn::{DeriveInput, parse_macro_input};\n\n/// #[derive(Describe)] adds fn describe() -> String listing the field names\n#[proc_macro_derive(Describe)]\npub fn derive_describe(input: TokenStream) -> TokenStream {\n    let ast = parse_macro_input!(input as DeriveInput);\n    let name = &ast.ident;\n\n    let fields: Vec<String> = match &ast.data {\n        syn::Data::Struct(s) => s.fields.iter()\n            .filter_map(|f| f.ident.as_ref().map(|i| i.to_string()))\n            .collect(),\n        _ => {\n            return syn::Error::new_spanned(&ast, \"Describe only supports structs\")\n                .to_compile_error()\n                .into();\n        }\n    };\n    let list = fields.join(\", \");\n\n    quote! {\n        impl #name {\n            pub fn describe() -> String {\n                format!(\"{} {{ {} }}\", stringify!(#name), #list)\n            }\n        }\n    }\n    .into()\n}\n\n// In the user crate:\n// #[derive(Describe)] struct Point { x: f64, y: f64 }\n// Point::describe() == \"Point { x, y }\"",
      "language": "rust"
    }
  ];

  mistakes: CommonMistake[] = [
    {
      "title": "Evaluating a macro argument twice",
      "wrong": "macro_rules! double {\n    ($x:expr) => { $x + $x };\n}\ndouble!(expensive_call())   // expensive_call runs twice",
      "right": "macro_rules! double {\n    ($x:expr) => {{ let v = $x; v + v }};\n}",
      "explanation": "Macro arguments are pasted as syntax. Bind the expression to a local once so side effects and costs happen a single time."
    },
    {
      "title": "Using a macro when a function would do",
      "wrong": "macro_rules! add_tax {\n    ($price:expr) => { $price * 1.2 };\n}",
      "right": "fn add_tax(price: f64) -> f64 {\n    price * 1.2\n}",
      "explanation": "Functions are type-checked at the definition, show up in docs and IDE tooling, and give clearer errors. Macros are for things functions cannot express."
    },
    {
      "title": "Putting the general arm before the specific one",
      "wrong": "macro_rules! show {\n    ($e:expr) => { println!(\"expr: {}\", $e) };\n    (empty) => { println!(\"nothing\") };\n}\nfn main() { show!(empty); }",
      "right": "macro_rules! show {\n    (empty) => { println!(\"nothing\") };\n    ($e:expr) => { println!(\"expr: {}\", $e) };\n}\nfn main() { show!(empty); }",
      "explanation": "Arms are tried in order. With the expr arm first, empty is parsed as an expression — a path to a variable that does not exist — and compilation fails (E0425). Put literal-token arms first."
    },
    {
      "title": "Referring to crate items without $crate",
      "wrong": "#[macro_export]\nmacro_rules! log_event {\n    ($e:expr) => { helpers::record($e) };   // breaks in other crates\n}",
      "right": "#[macro_export]\nmacro_rules! log_event {\n    ($e:expr) => { $crate::helpers::record($e) };\n}",
      "explanation": "An exported macro expands in the caller's crate, where helpers is not in scope. $crate always resolves to the crate that defined the macro."
    },
    {
      "title": "Panicking inside a proc macro",
      "wrong": "let fields = match &ast.data {\n    Data::Struct(s) => &s.fields,\n    _ => panic!(\"only structs\"),   // error points at the derive, not the user code\n};",
      "right": "_ => return syn::Error::new_spanned(&ast.ident, \"only structs are supported\")\n    .to_compile_error()\n    .into(),",
      "explanation": "A panic produces a generic \"proc-macro derive panicked\" error. syn::Error with a span highlights the exact user code that is wrong."
    }
  ];

  challenge: Challenge = {
    "title": "An enum with string conversions",
    "language": "rust",
    "description": "Write a macro_rules! macro string_enum! that takes an enum name and a list of Variant => \"text\" pairs and generates: the enum (deriving Debug, Clone, Copy, PartialEq), a const ALL slice of every variant, fn as_str(&self) -> &'static str, and an impl of std::str::FromStr that returns Err(String) for unknown text. Use it for a Status enum.",
    "hints": [
      "Matcher: ($name:ident { $($variant:ident => $text:literal),+ $(,)? })",
      "Use the same repetition three times in the expansion: in the enum body, in ALL, and in each match.",
      "FromStr needs type Err = String; and fn from_str(s: &str) -> Result<Self, Self::Err>."
    ],
    "starterCode": "macro_rules! string_enum {\n    // TODO: replace this placeholder arm\n    ($name:ident { $($variant:ident => $text:literal),+ $(,)? }) => { todo!() };\n}\n\n// string_enum!(Status { Active => \"active\", Suspended => \"suspended\", Closed => \"closed\" });\n\nfn main() {}",
    "solution": "macro_rules! string_enum {\n    ($name:ident { $($variant:ident => $text:literal),+ $(,)? }) => {\n        #[derive(Debug, Clone, Copy, PartialEq)]\n        pub enum $name { $($variant),+ }\n\n        impl $name {\n            pub const ALL: &'static [$name] = &[$($name::$variant),+];\n\n            pub fn as_str(&self) -> &'static str {\n                match self { $($name::$variant => $text),+ }\n            }\n        }\n\n        impl std::str::FromStr for $name {\n            type Err = String;\n            fn from_str(s: &str) -> Result<Self, Self::Err> {\n                match s {\n                    $($text => Ok($name::$variant),)+\n                    other => Err(format!(\"unknown {}: {other:?}\", stringify!($name))),\n                }\n            }\n        }\n    };\n}\n\nstring_enum!(Status { Active => \"active\", Suspended => \"suspended\", Closed => \"closed\" });\n\nfn main() {\n    for s in Status::ALL {\n        println!(\"{s:?} -> {}\", s.as_str());\n    }\n    println!(\"{:?}\", \"closed\".parse::<Status>());   // Ok(Closed)\n    println!(\"{:?}\", \"deleted\".parse::<Status>());  // Err(\"unknown Status: \\\"deleted\\\"\")\n}"
  };

  quiz: QuizQuestion[] = [
    {
      "q": "When do macro_rules! macros run?",
      "options": [
        "At runtime, like functions",
        "At compile time, before type checking",
        "At link time",
        "Only in debug builds"
      ],
      "answer": 1,
      "explanation": "Declarative macros are expanded during compilation, operating on tokens before the code is type-checked."
    },
    {
      "q": "What does the fragment specifier $i:ident match?",
      "options": [
        "Any expression",
        "An identifier such as a variable or type name",
        "An integer literal",
        "A whole block"
      ],
      "answer": 1,
      "explanation": "ident matches identifiers; expr matches expressions, literal matches literals, block matches { ... }."
    },
    {
      "q": "With macro_rules! square { ($x:expr) => { $x * $x } }, how many times does f() run in square!(f())?",
      "options": [
        "Once",
        "Twice",
        "Zero",
        "It does not compile"
      ],
      "answer": 1,
      "explanation": "The expression is pasted in twice. Bind it with let inside the expansion to evaluate it once."
    },
    {
      "q": "Why must procedural macros live in a separate crate?",
      "options": [
        "For licensing reasons",
        "They are compiled for the host and loaded by the compiler while compiling the user crate",
        "They are written in another language",
        "It is only a convention"
      ],
      "answer": 1,
      "explanation": "proc-macro crates (proc-macro = true) are built as compiler plugins that run during compilation of the crates that use them."
    },
    {
      "q": "What does $crate solve in an exported macro?",
      "options": [
        "Performance",
        "It resolves paths to the defining crate regardless of where the macro is invoked",
        "It enables recursion",
        "It makes the macro public"
      ],
      "answer": 1,
      "explanation": "Paths in the expansion are resolved in the calling crate; $crate::... always points back to the crate that defined the macro."
    }
  ];

  qna: QnaItem[] = [
    {
      "q": "What is the difference between declarative and procedural macros?",
      "a": "Declarative macros (<code>macro_rules!</code>) match token patterns with metavariables and repetitions and substitute them into a template — no code runs, it is pattern rewriting. Procedural macros are real Rust functions in a <code>proc-macro</code> crate that receive and return token streams, so they can parse arbitrary input (usually with <code>syn</code>) and generate any code (with <code>quote!</code>). Derives and attribute macros must be procedural; small syntax helpers are usually declarative."
    },
    {
      "q": "What is macro hygiene?",
      "a": "Identifiers created inside a <code>macro_rules!</code> expansion carry the macro's syntax context, so local variables in the expansion never clash with, or accidentally capture, variables at the call site. To let the macro bind a name the caller can use, pass the identifier in as a <code>$name:ident</code>. Hygiene applies to locals, labels and <code>$crate</code>; items such as functions are not hygienic."
    },
    {
      "q": "What are the downsides of macros?",
      "a": "They can be harder to read, debug and document; error messages may point into generated code; IDE completion and refactoring work less well inside them; and procedural macros add noticeable compile time, especially when many crates depend on <code>syn</code>. Use <code>cargo expand</code> to inspect expansions, keep macros small, and prefer functions and generics when they suffice."
    },
    {
      "q": "How does println! check its format string at compile time?",
      "a": "<code>println!</code> expands to <code>format_args!</code>, a compiler built-in that parses the literal format string during compilation, matches each <code>{}</code> placeholder (including inline names like <code>{name}</code>) to an argument, and checks that each argument implements the required formatting trait (<code>Display</code>, <code>Debug</code>...). A mismatch is a compile error, not a runtime exception."
    }
  ];

  revision: RevisionSummary = {
    "oneLiner": "Macros generate code at compile time: macro_rules! for pattern-based expansion, procedural macros (derive, attribute, function-like) with syn and quote for anything structural.",
    "mustKnow": [
      "Arms are tried in order; put specific (literal-token) arms first.",
      "Fragment specifiers: <code>expr</code>, <code>ty</code>, <code>ident</code>, <code>pat</code>, <code>literal</code>, <code>block</code>, <code>tt</code>.",
      "Repetition <code>$(...),*</code> in both matcher and expansion.",
      "Arguments are pasted as syntax — bind once to avoid double evaluation.",
      "Hygiene isolates locals; use <code>$crate::</code> in exported macros.",
      "Proc macros need their own <code>proc-macro = true</code> crate; use syn + quote and span-aware errors."
    ],
    "interviewFocus": [
      "Compare declarative and procedural macros with examples.",
      "Explain hygiene and the double-evaluation pitfall.",
      "When would you write a derive macro instead of a trait with a blanket impl?"
    ]
  };
}
