module.exports = {
  slug: 'lifetimes',
  subtitle: 'Lifetime annotations describe how long references are valid relative to each other — elision rules, structs that borrow, \'static, and reading the common errors.',
  readingTime: 22,
  prerequisites: [{ label: 'Ownership & Borrowing', route: '/rust/ownership-borrowing' }],
  apis: ["'a lifetime parameter", 'lifetime elision', "&'static str", "T: 'static", 'struct Parser<\'a>', 'use<..> precise capturing'],
  tip: 'Lifetimes never change how long a value lives — they only describe relationships the compiler then checks. If you find yourself adding \'static to make an error go away, step back: usually the data should be owned (String, Vec) instead of borrowed.',
  gotchas: [
    "T: 'static does not mean the value lives forever — it means T contains no borrowed data that could expire. String and Vec<u8> are 'static types.",
    'A struct that holds a reference can never outlive the data it borrows; storing &str in a long-lived struct usually means you wanted String.',
    'Returning a reference requires the reference to come from an input — a reference to a local always dangles (E0515/E0106).',
  ],
  quickRef: [
    { name: "fn f<'a>(x: &'a str) -> &'a str", type: 'syntax', desc: 'Declare a lifetime parameter and tie the output to the input' },
    { name: 'Elision rule 1', type: 'constraint', desc: 'Each elided reference parameter gets its own lifetime parameter' },
    { name: 'Elision rule 2', type: 'constraint', desc: 'Exactly one input lifetime? It is used for all elided output lifetimes' },
    { name: 'Elision rule 3', type: 'constraint', desc: 'A method with &self or &mut self gives elided outputs the lifetime of self' },
    { name: "struct Token<'a> { text: &'a str }", type: 'syntax', desc: 'A struct holding a reference must declare the lifetime it borrows for' },
    { name: "&'static str", type: 'type', desc: 'A reference valid for the whole program, e.g. a string literal' },
    { name: "T: 'static", type: 'constraint', desc: 'T owns all its data or only holds &\'static references; required by thread::spawn' },
    { name: "'b: 'a", type: 'constraint', desc: "Outlives bound: 'b lives at least as long as 'a" },
    { name: "impl Trait + use<'a>", type: 'syntax', desc: 'Precise capturing (Rust 1.82+): list exactly which lifetimes a returned impl Trait may use' },
  ],
  theory: [
    { heading: 'What a lifetime is', points: [
      'A lifetime is the region of code during which a reference must be valid. Every reference has one; most are inferred.',
      'Annotations like `\'a` do not extend or shorten anything. They let you state relationships ("the output borrows from this input") that the compiler then verifies at every call site.',
      'The borrow checker compares lifetimes to prove no reference outlives its referent. If it cannot prove it, you get E0597 ("borrowed value does not live long enough") or E0106 ("missing lifetime specifier").',
      'Lifetimes are a compile-time concept only; they generate no code and have no runtime cost.',
    ] },
    { heading: 'Elision: when you can leave them out', points: [
      'Rule 1: each reference parameter without an explicit lifetime gets its own distinct lifetime.',
      'Rule 2: if there is exactly one input lifetime, it is assigned to every elided lifetime in the return type — so `fn first_word(s: &str) -> &str` needs no annotations.',
      'Rule 3: in methods, if one parameter is `&self` or `&mut self`, elided output lifetimes get the lifetime of `self`.',
      'If the rules do not determine the output lifetime — for example two reference parameters and a returned reference — you must annotate: `fn longest<\'a>(a: &\'a str, b: &\'a str) -> &\'a str`.',
      'In the `longest` example the single `\'a` means "the result is valid for the shorter of the two inputs", which is exactly what the caller can rely on.',
    ] },
    { heading: 'Structs that borrow', points: [
      'A struct field that is a reference needs a lifetime parameter: `struct Parser<\'a> { input: &\'a str }`. The struct value cannot outlive the borrowed input.',
      'Borrowing structs are great for zero-copy parsing and short-lived views; they are a poor fit for long-lived state such as caches, config or anything stored in a `static`.',
      'In `impl<\'a> Parser<\'a>`, a method returning `&\'a str` hands out slices of the original input that stay valid even after the parser is dropped, while a method returning `&str` (elided) is tied to the borrow of `self`.',
      'The anonymous lifetime `\'_` can be written where a lifetime is required but its name is irrelevant: `impl fmt::Display for Parser<\'_>`.',
    ] },
    { heading: "'static and owned data", points: [
      '`&\'static T` is a reference that is valid for the entire program: string literals, data in `static` items, or memory deliberately leaked with `Box::leak`.',
      'The bound `T: \'static` is different: it says the type holds no non-\'static borrows. Every owned type (`String`, `Vec<T>`, `Arc<T>`) satisfies it. That is why `thread::spawn` and `tokio::spawn` require `\'static` — the task may outlive the current stack frame.',
      'The fix for "borrowed value does not live long enough" in spawned work is almost always to move owned data into the closure (`move ||`), or to use `thread::scope` so the borrow provably ends before the function returns.',
      'Since the 2024 edition, a returned `impl Trait` captures every in-scope lifetime by default; when that is too broad, Rust 1.82+ lets you say exactly which ones with `use<\'a, T>`.',
    ] },
  ],
  codeTabs: [
    { label: 'Annotating functions', language: 'rust', code: `// Elision rule 2: one input lifetime -> used for the output
fn first_word(s: &str) -> &str {
    s.split_whitespace().next().unwrap_or("")
}

// Two inputs: the compiler cannot guess, so we say the result
// lives as long as BOTH inputs (i.e. the shorter of the two)
fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() >= b.len() { a } else { b }
}

// The output only ever borrows from \`text\`, so only it needs 'a
fn prefix<'a>(text: &'a str, sep: &str) -> &'a str {
    text.split(sep).next().unwrap_or(text)
}

fn main() {
    let s1 = String::from("long string is long");
    let result;
    {
        let s2 = String::from("xyz");
        result = longest(&s1, &s2);
        println!("inside: {result}");   // OK: s2 still alive here
    }
    // println!("{result}");          // E0597 if uncommented: s2 dropped

    let p;
    {
        let sep = String::from(":");
        p = prefix("key:value", &sep);
    }
    println!("{} | {p}", first_word(&s1)); // OK: p only borrows the literal
}` },
    { label: 'Borrowing struct', language: 'rust', code: `struct Parser<'a> {
    input: &'a str,
    pos: usize,
}

impl<'a> Parser<'a> {
    fn new(input: &'a str) -> Self {
        Parser { input, pos: 0 }
    }

    // Returns slices of the ORIGINAL input ('a), not of &self,
    // so tokens stay valid after the parser is gone.
    fn next_token(&mut self) -> Option<&'a str> {
        let rest = &self.input[self.pos..];
        let rest_trimmed = rest.trim_start();
        if rest_trimmed.is_empty() { return None; }
        let start = self.pos + (rest.len() - rest_trimmed.len());
        let len = rest_trimmed.find(' ').unwrap_or(rest_trimmed.len());
        self.pos = start + len;
        Some(&self.input[start..start + len])
    }
}

fn main() {
    let source = String::from("let total = 42");
    let tokens: Vec<&str> = {
        let mut p = Parser::new(&source);
        let mut out = Vec::new();
        while let Some(t) = p.next_token() { out.push(t); }
        out
    }; // parser dropped here; tokens still borrow \`source\`
    println!("{tokens:?}");
}` },
    { label: "'static & spawning", language: 'rust', code: `use std::thread;

fn main() {
    let names = vec![String::from("ada"), String::from("grace")];

    // thread::spawn requires F: 'static -> move owned data in
    let handle = thread::spawn(move || names.len());
    println!("spawned saw {} names", handle.join().unwrap());

    // thread::scope lets threads borrow from the stack safely,
    // because every scoped thread is joined before scope returns
    let data = vec![1, 2, 3, 4];
    let total: i32 = thread::scope(|s| {
        let left = s.spawn(|| data[..2].iter().sum::<i32>());
        let right = s.spawn(|| data[2..].iter().sum::<i32>());
        left.join().unwrap() + right.join().unwrap()
    });
    println!("total {total}, data still here: {data:?}");

    // A String is a 'static TYPE even though it is not a 'static reference
    fn needs_static<T: 'static>(_t: T) {}
    needs_static(String::from("owned"));
    let literal: &'static str = "lives forever";
    needs_static(literal);
}` },
  ],
  mistakes: [
    { title: 'Missing annotation when two references go in and one comes out', checkWrong: true, wrong: `fn longest(a: &str, b: &str) -> &str {
    if a.len() > b.len() { a } else { b }
}`, right: `fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() > b.len() { a } else { b }
}`, explanation: 'With two input references the elision rules cannot pick the output lifetime, so the compiler reports E0106 missing lifetime specifier. Declare which inputs the result may borrow from.' },
    { title: 'Using a result after one of its inputs is dropped', checkWrong: true, prelude: `fn longest<'a>(a: &'a str, b: &'a str) -> &'a str { if a.len() > b.len() { a } else { b } }`, wrapFn: true, wrong: `let a = String::from("abcd");
let r;
{
    let b = String::from("xyz");
    r = longest(&a, &b);
}
println!("{r}");`, right: `let a = String::from("abcd");
let b = String::from("xyz");
let r = longest(&a, &b);
println!("{r}");`, explanation: 'The signature says the result may borrow from b, so it cannot be used after b is dropped (E0597), even though at runtime it happens to point into a. The compiler reasons from the signature, not from the function body.' },
    { title: "Reaching for 'static to silence an error", wrong: `struct Config { name: &'static str }
// forces callers to leak or use literals only`, right: `struct Config { name: String }`, explanation: "'static references can only come from literals, statics or leaked memory. If a struct needs to keep data around, let it own the data." },
    { title: 'Borrowing struct stored in long-lived state', wrong: `struct Cache<'a> { entries: Vec<&'a str> }
// the cache can never outlive the strings it points to`, right: `struct Cache { entries: Vec<String> }`, explanation: 'A lifetime parameter on a long-lived type spreads to everything that holds it and pins the borrowed data in place. Borrowing structs suit short-lived views; long-lived state should own its data.' },
    { title: 'Spawning a thread that borrows a local', checkWrong: true, wrapFn: true, wrong: `let v = vec![1, 2, 3];
let h = std::thread::spawn(|| println!("{:?}", v));
h.join().unwrap();`, right: `let v = vec![1, 2, 3];
let h = std::thread::spawn(move || println!("{:?}", v));
h.join().unwrap();`, explanation: 'The closure borrows v, but spawn requires a \'static closure because the thread may outlive the function (E0373). Move ownership into the thread, or use std::thread::scope to borrow safely.' },
  ],
  challenge: {
    title: 'Key-value splitter that borrows',
    language: 'rust',
    description: 'Write a struct Pair<\'a> { key: &\'a str, value: &\'a str } and a function parse_pairs(input: &str) -> Vec<Pair<\'_>> that parses "a=1;b=2;c=3" into pairs without allocating any Strings (only the Vec). Skip empty segments and segments without "=". Add a method fn get<\'a>(pairs: &[Pair<\'a>], key: &str) -> Option<&\'a str> that returns the value slice, still borrowed from the original input.',
    hints: ["split(';') and split_once('=') both return slices of the input.", 'The returned value must have lifetime \'a (from the pairs), not the lifetime of key.', 'Vec<Pair<\'_>> lets elision tie the pairs to the single input reference.'],
    starterCode: `struct Pair<'a> {
    key: &'a str,
    value: &'a str,
}

fn parse_pairs(input: &str) -> Vec<Pair<'_>> {
    todo!()
}

fn get<'a>(pairs: &[Pair<'a>], key: &str) -> Option<&'a str> {
    todo!()
}

fn main() {
    let raw = String::from("host=localhost;;port=8080;bad;mode=dev");
    let pairs = parse_pairs(&raw);
    println!("{:?}", get(&pairs, "port"));
}`,
    solution: `struct Pair<'a> {
    key: &'a str,
    value: &'a str,
}

fn parse_pairs(input: &str) -> Vec<Pair<'_>> {
    input
        .split(';')
        .filter_map(|seg| seg.split_once('='))
        .map(|(key, value)| Pair { key: key.trim(), value: value.trim() })
        .collect()
}

fn get<'a>(pairs: &[Pair<'a>], key: &str) -> Option<&'a str> {
    pairs.iter().find(|p| p.key == key).map(|p| p.value)
}

fn main() {
    let raw = String::from("host=localhost;;port=8080;bad;mode=dev");
    let pairs = parse_pairs(&raw);
    println!("{} pairs", pairs.len());               // 3 pairs
    let port = {
        let lookup = String::from("port");
        get(&pairs, &lookup)                          // not tied to lookup
    };
    println!("{:?} {:?}", port, get(&pairs, "nope")); // Some("8080") None
}`,
  },
  quiz: [
    { q: 'What does annotating a function with lifetime \'a do at runtime?', options: ['Extends how long the referenced values live', 'Inserts reference-count checks', 'Nothing — lifetimes are a compile-time description checked by the borrow checker', 'Allocates the data in a longer-lived region'], answer: 2, explanation: 'Annotations only describe relationships between references so the compiler can verify them. They generate no code.' },
    { q: 'Which signature compiles without explicit lifetimes?', options: ['fn pick(a: &str, b: &str) -> &str', 'fn first(s: &str) -> &str', 'fn make() -> &str', 'fn both(a: &i32, b: &i32) -> &i32'], answer: 1, explanation: 'With exactly one input reference, elision rule 2 assigns its lifetime to the output. The others have zero or two inputs, so the output lifetime is ambiguous.' },
    { q: "What does the bound T: 'static require?", options: ['T is a string literal', 'T lives until the program exits', 'T contains no references that could expire (owned types qualify)', 'T is stored in a static variable'], answer: 2, explanation: "'static as a bound means the type has no non-'static borrows. String, Vec and Arc satisfy it; a struct holding &'a str (with a shorter 'a) does not." },
    { q: 'In a method fn name(&self, other: &str) -> &str, whose lifetime does the output get?', options: ["other's", "self's (elision rule 3)", 'Both, the shorter wins', 'It is a compile error'], answer: 1, explanation: 'Rule 3: when a method takes &self or &mut self, elided output lifetimes take the lifetime of self.' },
    { q: 'longest<\'a>(a: &\'a str, b: &\'a str) -> &\'a str is called with a long-lived a and a short-lived b. How long is the result usable?', options: ["As long as a", "As long as b (the shorter one)", 'Until the end of main', 'Only inside longest'], answer: 1, explanation: "Both inputs share 'a, so 'a is the overlap of their lifetimes — the shorter one. The compiler does not look at which branch the body returns." },
    { q: 'Why does thread::spawn require its closure to be \'static?', options: ['Threads cannot use references at all', 'The thread may keep running after the current function returns, so borrowed locals could dangle', 'To make the closure Copy', "Because 'static closures are faster"], answer: 1, explanation: 'spawn returns immediately and the thread can outlive the caller\'s stack frame. thread::scope lifts this restriction by joining all threads before it returns.' },
  ],
  qna: [
    { q: 'Do lifetime annotations change how long a value lives?', a: 'No. Values live until their owner goes out of scope (or they are moved and dropped elsewhere). Lifetime annotations only describe how references relate to each other — for example that a returned `&str` points into one particular argument — so the compiler can check every caller. If the description contradicts what callers do, compilation fails; the program\'s behaviour is never changed.' },
    { q: 'What are the lifetime elision rules?', a: 'Three rules let you omit annotations in common cases. (1) Each elided reference parameter gets its own lifetime. (2) If there is exactly one input lifetime, it is assigned to all elided output lifetimes. (3) If a method has `&self` or `&mut self`, the lifetime of `self` is assigned to elided outputs. When these rules leave an output lifetime undetermined, you must write it yourself.' },
    { q: "What is the difference between &'static str and T: 'static?", a: "`&'static str` is a reference that is valid for the whole program, such as a string literal. `T: 'static` is a bound saying the type contains no borrowed data with a shorter lifetime; any owned type satisfies it, even a `String` that will be dropped in a millisecond. APIs like `thread::spawn` and `tokio::spawn` use the bound so a spawned task cannot hold references into a stack frame that may disappear." },
    { q: 'When should a struct hold references instead of owned data?', a: 'When it is a short-lived view over data owned elsewhere — parsers, iterators, zero-copy deserialisation, or a request handler working on a borrowed buffer. The struct then gets a lifetime parameter and cannot outlive the source. For long-lived or shared state (caches, config, anything stored in a collection that outlives the input) own the data with `String`/`Vec` or share it with `Arc`; otherwise the lifetime parameter spreads through every type that holds the struct.' },
    { q: 'How do you fix "borrowed value does not live long enough"?', a: 'Find the value named in the error and the place where the borrow is still needed. Common fixes: move the owner to an outer scope so it lives long enough; return owned data instead of a reference; clone just the piece you need; `move` owned data into a spawned thread or use `thread::scope`; or restructure so the borrow ends earlier. Adding `\'static` is rarely the right fix.' },
  ],
  revision: {
    oneLiner: 'Lifetimes describe how long references must stay valid relative to each other; the compiler infers most of them and checks every relationship you declare.',
    mustKnow: [
      'Annotations describe relationships; they never change how long data lives.',
      'Three elision rules cover one-input functions and `&self` methods.',
      'Two reference inputs and a reference output usually need an explicit `\'a`.',
      'A struct holding `&\'a T` cannot outlive the data it borrows.',
      "`T: 'static` means no short-lived borrows; owned types qualify.",
      '`thread::spawn` needs `\'static`; `thread::scope` allows borrowing.',
    ],
    interviewFocus: [
      'Walk through the three elision rules with examples.',
      "Explain &'static str versus the T: 'static bound.",
      'Explain why the compiler reasons from signatures, not function bodies.',
      'Discuss when to use borrowing structs vs owned data.',
    ],
  },
};
