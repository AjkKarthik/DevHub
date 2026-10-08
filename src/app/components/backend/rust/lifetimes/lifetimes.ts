import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-rust-lifetimes',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './lifetimes.html',
  styleUrl: './lifetimes.scss'
})
export class RustLifetimes {
  readingTime = 26;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Rust 2021+';
  route = 'rust-lifetimes';

  quickRef: QuickRefItem[] = [
    { name: 'fn f<\'a>(x: &\'a str) -> &\'a str', type: 'syntax', desc: 'Declares a lifetime parameter \'a and ties the returned reference to the input reference' },
    { name: '&\'a T', type: 'type', desc: 'A shared reference that is valid for at least the lifetime \'a' },
    { name: '&\'a mut T', type: 'type', desc: 'A mutable reference that is valid for at least the lifetime \'a' },
    { name: 'struct S<\'a> { r: &\'a str }', type: 'syntax', desc: 'A struct that holds a reference must declare the lifetime of that reference' },
    { name: 'impl<\'a> S<\'a>', type: 'syntax', desc: 'Re-declares the struct\'s lifetime parameter on its impl block' },
    { name: '\'static', type: 'keyword', desc: 'The lifetime that lasts for the whole program — string literals are &\'static str' },
    { name: 'T: \'a', type: 'constraint', desc: 'Lifetime bound — every reference inside T must live at least as long as \'a' },
    { name: 'T: \'static', type: 'constraint', desc: 'T contains no borrowed data with a shorter lifetime — owned types like String satisfy it' },
    { name: '&self', type: 'syntax', desc: 'Elision rule 3: with &self, elided output lifetimes take the lifetime of self' },
    { name: '_', type: 'syntax', desc: 'The anonymous lifetime \'_ asks the compiler to infer a lifetime in a type position' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What a lifetime actually is',
      points: [
        'Every reference in Rust has a lifetime — the region of code during which that reference is valid. Most of the time the compiler infers it and you never write it down.',
        'Lifetimes exist only at compile time. They are erased before the program runs, so they cost nothing in memory or speed.',
        'A lifetime annotation like <code>\'a</code> does NOT make anything live longer. It only DESCRIBES a relationship between the lifetimes of several references so the compiler can check that none of them outlives the data it points to.',
        'The single job of the borrow checker here is to reject dangling references: a reference must never be used after the value it borrows from has been dropped.',
        'You have already relied on this in the previous topic — every borrow had a lifetime, it was simply inferred. Explicit annotations appear only when the compiler cannot work out the relationship on its own.',
      ]
    },
    {
      heading: 'Lifetime annotations on functions',
      points: [
        'Lifetime parameters are declared in angle brackets after the function name, just like generic type parameters, and used after the &: <code>fn longest&lt;\'a&gt;(x: &amp;\'a str, y: &amp;\'a str) -&gt; &amp;\'a str</code>.',
        'That signature reads: "x and y both live at least as long as <code>\'a</code>, and the returned reference is valid for <code>\'a</code>." In practice <code>\'a</code> becomes the SHORTER of the two input lifetimes.',
        'The annotation is needed there because the function may return either input, and the compiler cannot tell from the signature alone which one the result borrows from. Callers are checked against the signature, not against your function body.',
        'A caller that uses the result after the shorter-lived input has been dropped gets error E0597 ("does not live long enough") at the call site — the annotation is what makes that check possible.',
        'If a function only ever returns one of its inputs, annotate only that input: a parameter that does not appear in the return type needs no lifetime tie at all.',
      ]
    },
    {
      heading: 'Lifetime elision — when you can leave them out',
      points: [
        'Rust applies three deterministic elision rules to function signatures before demanding annotations. If, after applying them, every output lifetime is known, you write nothing.',
        'Rule 1: each elided input lifetime becomes its own distinct lifetime parameter. So <code>fn f(a: &amp;str, b: &amp;str)</code> is treated as having two separate lifetimes.',
        'Rule 2: if there is exactly ONE input lifetime, it is assigned to all elided output lifetimes. So <code>fn first_word(s: &amp;str) -&gt; &amp;str</code> needs no annotation.',
        'Rule 3: if there are multiple input lifetimes but one of them is <code>&amp;self</code> or <code>&amp;mut self</code>, the lifetime of self is assigned to all elided output lifetimes. This is why most methods need no annotations.',
        'If the rules cannot determine every output lifetime — typically two reference inputs and a reference output, with no self — the compiler stops with E0106 (missing lifetime specifier) and asks you to write it.',
      ]
    },
    {
      heading: 'Lifetimes in structs and impl blocks',
      points: [
        'A struct that stores a reference must declare the lifetime of that reference: <code>struct Excerpt&lt;\'a&gt; { part: &amp;\'a str }</code>. Leaving it off is error E0106 (expected named lifetime parameter).',
        'The annotation means "an Excerpt cannot outlive the string its part field borrows from" — the struct is only valid while the borrowed data is.',
        'The impl block re-declares the parameter: <code>impl&lt;\'a&gt; Excerpt&lt;\'a&gt; { ... }</code>. The lifetime after impl is a declaration; the one after the type name is a use of it.',
        'Methods taking &amp;self often need no further annotations thanks to elision rule 3, but a method can deliberately return <code>&amp;\'a str</code> to hand back a reference tied to the original data rather than to the borrow of self.',
        'Owning the data instead (a String field) avoids lifetime parameters entirely. Prefer owned fields for long-lived structs, and reach for borrowed fields when you want zero-copy views over existing data such as a parser over an input buffer.',
      ]
    },
    {
      heading: '\'static, bounds, and reading lifetime errors',
      points: [
        '<code>\'static</code> is the lifetime of the entire program. String literals have type <code>&amp;\'static str</code> because the text is baked into the program itself and is never dropped.',
        'A bound like <code>T: \'static</code> does NOT mean T must live forever. It means T holds no references shorter than <code>\'static</code> — so every owned type (String, Vec, i32) satisfies it, while a borrow of a local variable does not.',
        'The most common misuse is adding <code>\'static</code> to make a lifetime error disappear. It usually just moves the error, or forces you to leak memory. Ask first whether the value should be owned instead.',
        'Lifetime bounds such as <code>\'b: \'a</code> read "\'b outlives \'a". You will meet them in more advanced generic code; the rule of thumb is that a longer lifetime can always stand in for a shorter one.',
        'Read the errors in order: E0106 means the compiler needs a signature annotation; E0597 means a borrowed value is dropped while a reference to it is still in use; E0499 and E0502 are the borrowing-rule errors from the previous topic.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Lifetime Annotations',
      language: 'rust',
      code: `// The returned reference is valid for 'a — the shorter of the two inputs.
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() >= y.len() { x } else { y }
}

fn main() {
    let a = String::from("a long string");
    let result;
    {
        let b = String::from("xyz");
        result = longest(a.as_str(), b.as_str());
        println!("{result}"); // fine — b is still alive inside this block
    }
    // println!("{result}");
    // error[E0597]: b does not live long enough
    // result may borrow from b, and b was dropped at the closing brace above
}

// Only x is ever returned, so only x needs to be tied to the output.
// y has its own independent, elided lifetime.
fn first_of<'a>(x: &'a str, _y: &str) -> &'a str {
    x
}`
    },
    {
      label: 'Elision Rules',
      language: 'rust',
      code: `// Rule 2: exactly one input lifetime -> it is used for the output.
// Written:    fn first_word(s: &str) -> &str
// Compiler:   fn first_word<'a>(s: &'a str) -> &'a str
fn first_word(s: &str) -> &str {
    s.split_whitespace().next().unwrap_or("")
}

// Rule 3: with &self, the output gets self's lifetime.
struct Parser {
    text: String,
}

impl Parser {
    // 'other' has its own lifetime, but the output borrows from self.
    fn head(&self, other: &str) -> &str {
        println!("comparing with {other}");
        self.text.as_str()
    }
}

// Two reference inputs, no self, one reference output: NO rule applies.
// fn pick(x: &str, y: &str) -> &str { x }
// error[E0106]: missing lifetime specifier
// the compiler cannot know whether the result borrows from x or from y.
// The fix is an explicit annotation, as in the first tab.

fn main() {
    println!("{}", first_word("hello world")); // hello
    let p = Parser { text: String::from("parser text") };
    println!("{}", p.head("abc")); // parser text
}`
    },
    {
      label: 'Structs with References',
      language: 'rust',
      code: `// A struct holding a reference declares that reference's lifetime.
struct Excerpt<'a> {
    part: &'a str,
}

impl<'a> Excerpt<'a> {
    fn level(&self) -> i32 {
        3
    }

    // Elision rule 3: the returned &str borrows from self.
    fn announce(&self, msg: &str) -> &str {
        println!("Attention: {msg}");
        self.part
    }

    // Explicitly returning &'a str ties the result to the ORIGINAL text,
    // not to the temporary borrow of self — so it can outlive the Excerpt.
    fn part(&self) -> &'a str {
        self.part
    }
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first = novel.split('.').next().expect("no sentence found");

    let kept;
    {
        let excerpt = Excerpt { part: first };
        println!("{} (level {})", excerpt.announce("read this"), excerpt.level());
        kept = excerpt.part(); // tied to novel, not to excerpt
    } // excerpt is dropped here
    println!("{kept}"); // still valid — novel is still alive
}`
    },
    {
      label: '\'static and Bounds',
      language: 'rust',
      code: `use std::fmt::Display;

// A string literal lives in the program itself, so it is &'static str.
fn greeting() -> &'static str {
    "hello"
}

// T: 'static means T holds no short-lived borrows — NOT that it lives forever.
fn print_owned<T: Display + 'static>(value: T) {
    println!("{value}");
}

fn main() {
    println!("{}", greeting());

    print_owned(String::from("owned")); // ok — String owns its data
    print_owned(42);                    // ok — integers own themselves

    let local = String::from("borrowed");
    // print_owned(&local);
    // error[E0597]: local does not live long enough
    // &local is a short-lived borrow, so it does not satisfy 'static

    // The fix is usually to pass ownership, not to weaken the bound:
    print_owned(local);
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Returning a reference from a function with two reference inputs and no annotation',
      wrong: `fn longer(x: &str, y: &str) -> &str {
    if x.len() > y.len() { x } else { y }
}
// error[E0106]: missing lifetime specifier`,
      right: `fn longer<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}`,
      explanation: 'With two input references and no self, none of the elision rules can decide which input the output borrows from, so the compiler refuses to guess. The annotation is not extra ceremony — it is the information the compiler is missing, and it is what lets callers be checked against the signature.'
    },
    {
      title: 'Believing a lifetime annotation makes a value live longer',
      wrong: `fn make<'a>() -> &'a String {
    let s = String::from("hi");
    &s // still an error — 'a does not extend s's life
}
// error[E0515]: cannot return reference to local variable s`,
      right: `fn make() -> String {
    let s = String::from("hi");
    s // return the owned value instead
}`,
      explanation: 'Annotations only describe relationships that already exist; they never change when a value is dropped. A local variable is dropped when the function returns no matter what you write in the signature. The fix is to return ownership, not to find a cleverer annotation.'
    },
    {
      title: 'Using a result after one of its inputs has gone out of scope',
      wrong: `let a = String::from("long string");
let result;
{
    let b = String::from("xyz");
    result = longest(&a, &b);
}
println!("{result}");
// error[E0597]: b does not live long enough`,
      right: `let a = String::from("long string");
let b = String::from("xyz");
let result = longest(&a, &b);
println!("{result}"); // both inputs outlive every use of result`,
      explanation: 'Because longest ties the output to the SHORTER of the two input lifetimes, result is only valid while both a and b are. The error appears at the later use of result, not at the call — read it as "the borrow you are using is no longer backed by live data".'
    },
    {
      title: 'Adding \'static to silence a lifetime error',
      wrong: `fn store(s: &'static str) -> &'static str { s }

let name = String::from("Ana");
store(&name); // error[E0597]: name does not live long enough`,
      right: `fn store(s: &str) -> &str { s } // ordinary elision is enough

let name = String::from("Ana");
println!("{}", store(&name));`,
      explanation: '\'static demands data that lives for the whole program, which a local String never does. Forcing it on a signature usually just moves the error to every caller. Before reaching for \'static, ask whether the function really needs a long-lived borrow or whether an owned value or a plain elided lifetime is what you meant.'
    },
    {
      title: 'Storing a reference in a struct without a lifetime parameter',
      wrong: `struct Excerpt {
    part: &str, // error[E0106]: missing lifetime specifier
}`,
      right: `struct Excerpt<'a> {
    part: &'a str,
}
// or, if the struct should own its text:
struct OwnedExcerpt {
    part: String,
}`,
      explanation: 'The compiler must know how long the borrowed data lasts to guarantee an Excerpt never outlives it. Choose deliberately: a lifetime parameter for a cheap borrowed view, or an owned String when the struct needs to stand on its own.'
    },
    {
      title: 'Tying every parameter to the same lifetime when only one is returned',
      wrong: `fn first<'a>(x: &'a str, y: &'a str) -> &'a str {
    x // y is never returned, but it is now forced to live as long as x
}`,
      right: `fn first<'a>(x: &'a str, _y: &str) -> &'a str {
    x
}`,
      explanation: 'Sharing one lifetime across parameters makes the result valid only as long as the SHORTEST of them, which needlessly restricts callers. Annotate exactly the relationships that exist: the output depends only on x, so only x is tied to it.'
    },
  ];

  challenge: Challenge = {
    title: 'Borrowing Config Parser',
    language: 'rust',
    description: `Build a zero-copy config reader.

Define \`struct Config<'a> { raw: &'a str }\` with:
- \`fn new(raw: &'a str) -> Self\`
- \`fn get(&self, key: &str) -> Option<&'a str>\`

\`raw\` holds lines of the form \`key = value\`. \`get\` returns the trimmed value for the first line whose trimmed key equals \`key\`, or \`None\` if no line matches. Lines without an \`=\` are ignored.

The returned value must borrow from the ORIGINAL text, not from the Config — so it stays usable after the Config itself has been dropped.

Example:
\`\`\`
let text = String::from("host = localhost\\nport = 8080");
Config::new(&text).get("port")    // Some("8080")
Config::new(&text).get("host")    // Some("localhost")
Config::new(&text).get("missing") // None
\`\`\``,
    hints: [
      'str::lines() on a &\'a str yields &\'a str items, so anything derived from them (split_once, trim) keeps the same lifetime.',
      'str::split_once(\'=\') returns Option<(&str, &str)> — perfect for skipping lines with no equals sign.',
      'The return type must be Option<&\'a str>, using the struct\'s lifetime, NOT the elided lifetime of &self — that is what lets the value outlive the Config.',
      'The key parameter is only compared, never returned, so it needs no lifetime annotation at all.',
    ],
    starterCode: `struct Config<'a> {
    raw: &'a str,
}

impl<'a> Config<'a> {
    fn new(raw: &'a str) -> Self {
        // TODO
        Config { raw: "" }
    }

    fn get(&self, key: &str) -> Option<&'a str> {
        // TODO: find the first line whose trimmed key matches
        None
    }
}

fn main() {
    let text = String::from("host = localhost\\nport = 8080");
    let value;
    {
        let cfg = Config::new(&text);
        value = cfg.get("port");
    } // cfg is dropped here
    println!("{:?}", value);                     // Some("8080")
    println!("{:?}", Config::new(&text).get("missing")); // None
}`,
    solution: `struct Config<'a> {
    raw: &'a str,
}

impl<'a> Config<'a> {
    fn new(raw: &'a str) -> Self {
        Config { raw }
    }

    fn get(&self, key: &str) -> Option<&'a str> {
        for line in self.raw.lines() {
            if let Some((k, v)) = line.split_once('=') {
                if k.trim() == key {
                    return Some(v.trim());
                }
            }
        }
        None
    }
}

fn main() {
    let text = String::from("host = localhost\\nport = 8080");
    let value;
    {
        let cfg = Config::new(&text);
        value = cfg.get("port");
    } // cfg is dropped here, but value borrows from text, not cfg
    println!("{:?}", value);                     // Some("8080")
    println!("{:?}", Config::new(&text).get("missing")); // None
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does a lifetime annotation such as \'a actually do?',
      options: [
        'It extends the lifetime of the referenced value so it lasts as long as \'a',
        'It describes how the lifetimes of several references relate, so the compiler can check them',
        'It allocates the value on the heap',
        'It changes when the value is dropped at runtime',
      ],
      answer: 1,
      explanation: 'Annotations never change how long anything lives. They only describe relationships between reference lifetimes so the borrow checker can verify that no reference outlives its data. They are erased at compile time.'
    },
    {
      q: 'Why does fn first_word(s: &str) -> &str compile without any explicit lifetime?',
      options: [
        'Because the function body returns a slice',
        'Because Rust never checks lifetimes for string slices',
        'Because &str is always \'static',
        'Because of elision rule 2: exactly one input lifetime is assigned to the output',
      ],
      answer: 3,
      explanation: 'There is exactly one input reference, so elision rule 2 gives the output the same lifetime. The compiler effectively rewrites the signature as fn first_word<\'a>(s: &\'a str) -> &\'a str.'
    },
    {
      q: 'Why is fn pick(x: &str, y: &str) -> &str rejected?',
      options: [
        'No elision rule can decide whether the output borrows from x or from y, so the compiler reports E0106',
        'Because the return type must be &\'static str',
        'Functions cannot take two references',
        'The body might panic',
      ],
      answer: 0,
      explanation: 'Two elided input lifetimes, no self, and a reference output leaves the output lifetime undetermined. You must write an annotation that says which input (or both) the result is tied to.'
    },
    {
      q: 'What does the bound T: \'static require of T?',
      options: [
        'That T lives for the entire program',
        'That T is allocated in static memory',
        'That T contains no references shorter than \'static — owned types like String satisfy it',
        'That T is a string literal',
      ],
      answer: 2,
      explanation: 'The bound restricts the references INSIDE T, not how long a particular value of T lives. An owned String qualifies; a borrow of a local variable does not.'
    },
    {
      q: 'What must a struct that stores a &str field declare?',
      options: [
        'The struct must be marked unsafe',
        'The field must be wrapped in a Box',
        'Nothing — lifetimes are always inferred for struct fields',
        'A lifetime parameter, such as struct Excerpt<\'a> { part: &\'a str }',
      ],
      answer: 3,
      explanation: 'Elision applies to function signatures, not struct definitions. The compiler needs a named lifetime so it can guarantee the struct never outlives the data it borrows from.'
    },
    {
      q: 'In fn longest<\'a>(x: &\'a str, y: &\'a str) -> &\'a str, what does \'a effectively become at a call site?',
      options: [
        'The shorter of the two input lifetimes',
        'Always \'static',
        'The lifetime of the function itself',
        'The longer of the two input lifetimes',
      ],
      answer: 0,
      explanation: 'The result might be either input, so it is only guaranteed valid while BOTH are. The compiler therefore treats \'a as the overlap, which is the shorter of the two lifetimes.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Do lifetimes exist at runtime?',
      a: 'No. Lifetimes are a purely compile-time concept used by the borrow checker and are erased before code generation. A reference compiles to a plain pointer, so annotations add no memory or speed cost. That is why Rust can offer memory safety with no runtime overhead.'
    },
    {
      q: 'Why do I sometimes have to write lifetimes and sometimes not?',
      a: 'The compiler applies three fixed elision rules to function signatures. When they determine every output lifetime, you write nothing — this covers the large majority of functions and almost all methods. Only when the rules cannot decide, typically two reference inputs with a reference output and no self, do you need explicit annotations.'
    },
    {
      q: 'What is the difference between the lifetime after impl and the one after the type name?',
      a: 'In <code>impl&lt;\'a&gt; Excerpt&lt;\'a&gt;</code>, the first <code>\'a</code> DECLARES the lifetime parameter for the block and the second USES it as an argument to Excerpt. It works exactly like generic type parameters, where impl&lt;T&gt; Foo&lt;T&gt; declares T once and then uses it.'
    },
    {
      q: 'Does \'static mean the value lives forever?',
      a: 'Only for references. A <code>&amp;\'static str</code> really does point at data that lasts the whole program, such as a string literal. As a BOUND, <code>T: \'static</code> merely says T contains no short-lived borrows, which every owned value satisfies. Values with a \'static bound are still dropped normally when their owner goes out of scope.'
    },
    {
      q: 'When should a struct own its data instead of borrowing it?',
      a: 'Own the data when the struct must outlive its source, cross thread boundaries, or be stored long term, because a lifetime parameter spreads through every type that contains it. Borrow when you want a cheap, zero-copy view over data that clearly outlives the struct, such as a parser over an input buffer or a short-lived iterator adaptor.'
    },
    {
      q: 'What is the difference between returning &\'a str and &str from a method taking &self?',
      a: 'With plain <code>&amp;str</code>, elision rule 3 ties the result to the borrow of self, so the result cannot outlive that borrow. Returning <code>&amp;\'a str</code> ties it to the underlying data the struct borrows, so the result can outlive the struct itself — as the Config challenge on this page demonstrates.'
    },
    {
      q: 'How do I read a lifetime error like E0597?',
      a: 'E0597 says a borrowed value is dropped while a reference to it is still in use. Find the reference the compiler names, then look for the earlier closing brace where the borrowed value goes out of scope. Fix it by moving the value to a longer-lived scope, by returning an owned value, or by cloning when a copy is genuinely what you want.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'A lifetime describes how long a reference is valid; annotations relate several lifetimes so the compiler can prove no reference outlives its data, and elision fills them in for you in the common cases.',
    mustKnow: [
      'Lifetimes exist only at compile time and never change when a value is dropped',
      'Annotate with <code>fn f&lt;\'a&gt;(x: &amp;\'a T) -&gt; &amp;\'a T</code> to tie the output to the inputs it may borrow from',
      'Three elision rules: each input gets its own lifetime, a single input lifetime goes to the output, and &amp;self lifetime goes to the output',
      'E0106 means the compiler needs an annotation; E0597 means a borrowed value was dropped while still in use',
      'A struct holding a reference needs a lifetime parameter, re-declared on its impl block',
      'The result of a two-input function is valid only for the shorter of the input lifetimes',
      '<code>T: \'static</code> means T holds no short-lived borrows, not that T lives forever',
    ],
    interviewFocus: [
      'Explain what a lifetime annotation does and, just as importantly, what it does not do',
      'Walk through the three elision rules and give a signature for which none of them apply',
      'When would you choose a borrowed struct field over an owned one?',
      'What is the difference between a reference of type &\'static str and a T: \'static bound?',
      'Why does longest need an annotation but first_word does not?',
    ],
  };
}
