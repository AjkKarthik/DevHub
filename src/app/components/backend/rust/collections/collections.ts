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
  selector: 'app-rust-collections',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './collections.html',
  styleUrl: './collections.scss'
})
export class RustCollections {
  readingTime = 28;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Rust 2021+';
  route = 'rust-collections';

  quickRef: QuickRefItem[] = [
    { name: 'Vec<T>', type: 'type', desc: 'A growable, heap-allocated array of T — the default collection; create with vec![...] or Vec::new()' },
    { name: 'String', type: 'type', desc: 'An owned, growable, UTF-8 text buffer' },
    { name: '&str', type: 'type', desc: 'A borrowed view into UTF-8 text — the right type for function parameters' },
    { name: 'HashMap<K, V>', type: 'type', desc: 'A hash table of key-value pairs; keys must implement Eq and Hash; iteration order is unspecified' },
    { name: 'HashSet<T>', type: 'type', desc: 'A set of unique values with fast membership tests and set operations' },
    { name: 'map.entry(k).or_insert(v)', type: 'method', desc: 'The entry API — insert a default if the key is missing and get a mutable reference either way' },
    { name: 'v.get(i)', type: 'method', desc: 'Returns Option of a reference instead of panicking on a bad index' },
    { name: '.iter() / .iter_mut() / .into_iter()', type: 'method', desc: 'Iterate by shared reference, by mutable reference, or by consuming the collection' },
    { name: '.collect()', type: 'method', desc: 'Consumes an iterator and builds a collection — usually needs a type annotation' },
    { name: '.map() / .filter()', type: 'method', desc: 'Lazy iterator adapters — nothing runs until a consuming method is called' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Vec — the default collection',
      points: [
        '<code>Vec&lt;T&gt;</code> is a growable array stored on the heap. Create one with the <code>vec![1, 2, 3]</code> macro or <code>Vec::new()</code>, add with <code>push</code>, and remove from the end with <code>pop</code>, which returns an Option.',
        'Indexing with <code>v[i]</code> PANICS if i is out of range. Use <code>v.get(i)</code> when the index might be bad; it returns an <code>Option&lt;&amp;T&gt;</code> you are forced to handle.',
        'You can iterate three ways: <code>for x in &amp;v</code> borrows each element, <code>for x in &amp;mut v</code> lets you modify them in place, and <code>for x in v</code> consumes the vector and moves it, so v cannot be used afterwards.',
        'A slice such as <code>&amp;v[1..3]</code> is a borrowed view of part of a vector. Functions should usually accept <code>&amp;[T]</code> rather than <code>&amp;Vec&lt;T&gt;</code>, because it accepts arrays, vectors and slices alike.',
        'You cannot hold a reference to an element while pushing, because growing may reallocate the buffer and leave the reference dangling. The borrow checker rejects it with E0502 — this is a real bug it prevents in other languages.',
      ]
    },
    {
      heading: 'String versus &str, and UTF-8',
      points: [
        '<code>String</code> is an owned, growable buffer of UTF-8 text on the heap. <code>&amp;str</code> is a borrowed slice into text that lives somewhere else, such as a String or a string literal in the binary.',
        'Prefer <code>&amp;str</code> for function parameters. A <code>&amp;String</code> automatically coerces to <code>&amp;str</code>, so callers can pass either, and you never force an allocation just to read text.',
        'Because text is UTF-8, one character can take one to four bytes. That is why you cannot index a string by integer: <code>s[0]</code> is a compile error, since a byte position does not necessarily mean a character.',
        '<code>len()</code> returns the number of BYTES, while <code>s.chars().count()</code> counts characters. Slicing with <code>&amp;s[0..2]</code> uses byte offsets and panics if an offset falls in the middle of a character.',
        'Build strings with <code>push_str</code>, <code>format!</code> or the plus operator. Plus takes ownership of the left String and a borrowed right side, so <code>a + &amp;b</code> moves a. Use <code>format!</code> to combine several pieces without moving any of them.',
      ]
    },
    {
      heading: 'HashMap, HashSet and their sorted cousins',
      points: [
        '<code>HashMap&lt;K, V&gt;</code> stores key-value pairs. <code>insert</code> adds or replaces, <code>get</code> returns an <code>Option&lt;&amp;V&gt;</code>, and indexing with <code>map["key"]</code> panics when the key is missing.',
        'Inserting MOVES owned keys and values into the map. Types that implement Copy are copied, while a String is moved in and can no longer be used by the caller.',
        'The entry API is the idiomatic way to update: <code>*map.entry(word).or_insert(0) += 1</code> inserts zero when the key is new and hands back a mutable reference either way, so counting is a one-liner.',
        'Iteration order of a HashMap or HashSet is UNSPECIFIED and can differ between runs, because the default hasher is randomised. If you need a stable order, sort the keys or use a BTreeMap.',
        '<code>HashSet&lt;T&gt;</code> holds unique values and offers union, intersection and difference. <code>BTreeMap</code> and <code>BTreeSet</code> keep keys sorted and support range queries, in exchange for slower lookups than hashing.',
      ]
    },
    {
      heading: 'Iterators — lazy pipelines',
      points: [
        'An iterator produces items one at a time. <code>iter()</code> yields shared references, <code>iter_mut()</code> yields mutable references, and <code>into_iter()</code> consumes the collection and yields the values themselves.',
        'Adapters such as <code>map</code>, <code>filter</code>, <code>enumerate</code>, <code>zip</code>, <code>take</code>, <code>skip</code> and <code>rev</code> build a new iterator LAZILY. Nothing runs until a consuming method such as <code>collect</code>, <code>sum</code>, <code>count</code> or a for loop pulls items through.',
        'Consumers turn the pipeline into a result: <code>collect</code> builds a collection, <code>sum</code> and <code>fold</code> reduce to a value, <code>any</code>, <code>all</code> and <code>find</code> short-circuit as soon as the answer is known.',
        '<code>collect</code> usually needs to be told what to build, either from an annotated variable (<code>let v: Vec&lt;i32&gt; = ...</code>) or with the turbofish syntax <code>.collect::&lt;Vec&lt;_&gt;&gt;()</code>.',
        'Iterator chains compile down to the same machine code as a hand-written loop, so there is no performance penalty for the clearer style. This is one of Rust\'s zero-cost abstractions.',
      ]
    },
    {
      heading: 'Choosing the right collection',
      points: [
        'Start with <code>Vec</code>. It has the best cache behaviour and covers most needs. Switch only when you have a concrete reason.',
        'Use <code>VecDeque</code> when you push and pop at both ends, such as a queue, and <code>BinaryHeap</code> for a priority queue that always yields the largest item first.',
        'Use <code>HashMap</code> for fast lookup by key and <code>BTreeMap</code> when you need sorted iteration or range queries. Use the Set variants when you only care about membership.',
        'Handy Vec methods: <code>sort</code> and <code>sort_by_key</code> order in place, <code>dedup</code> removes consecutive duplicates, <code>retain</code> keeps only items matching a predicate, and <code>extend</code> appends another iterator.',
        'Accept the most general borrowed type in signatures: <code>&amp;[T]</code> instead of <code>&amp;Vec&lt;T&gt;</code>, and <code>&amp;str</code> instead of <code>&amp;String</code>. It makes your functions usable in more places.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Vec',
      language: 'rust',
      code: `fn main() {
    let mut v = vec![1, 2, 3];
    v.push(4);
    println!("{:?} len={}", v, v.len()); // [1, 2, 3, 4] len=4

    // get returns an Option instead of panicking
    println!("{:?}", v.get(10)); // None
    let first = v[0];            // v[10] would panic
    println!("{first}");

    // Modify in place by iterating over a mutable reference
    for x in &mut v {
        *x *= 10;
    }
    println!("{:?}", v); // [10, 20, 30, 40]

    // A slice is a borrowed view of part of the vector
    let slice = &v[1..3];
    println!("{:?}", slice); // [20, 30]

    v.retain(|x| *x > 15);          // keep only items above 15
    v.sort_by(|a, b| b.cmp(a));     // sort descending
    println!("{:?}", v);            // [40, 30, 20]

    // let f = &v[0];
    // v.push(5);
    // println!("{f}");
    // error[E0502]: cannot borrow v as mutable because it is also borrowed as immutable
}`
    },
    {
      label: 'Strings',
      language: 'rust',
      code: `fn main() {
    let mut s = String::from("héllo");
    s.push_str(" wörld");

    // len counts bytes, chars().count() counts characters
    println!("{} bytes, {} chars", s.len(), s.chars().count()); // 13 bytes, 11 chars

    // let c = s[0];
    // error[E0277]: the type str cannot be indexed by an integer

    println!("{}", &s[0..1]); // h
    // &s[0..2] would panic: byte 2 is in the middle of the two-byte character é

    // Iterate by character instead
    for c in s.chars().take(3) {
        print!("{c} ");
    }
    println!(); // h é l

    let first_word: &str = s.split_whitespace().next().unwrap();
    println!("{first_word}"); // héllo

    // + moves the left String; format! moves nothing
    let a = String::from("Hello, ");
    let b = String::from("world");
    let c = a + &b; // a is moved here
    println!("{c} {b}");

    let msg = format!("{}-{}-{}", "x", "y", "z");
    println!("{msg}"); // x-y-z
}`
    },
    {
      label: 'HashMap & HashSet',
      language: 'rust',
      code: `use std::collections::{BTreeMap, HashMap, HashSet};

fn main() {
    let text = "the quick brown fox jumps over the lazy dog the end";

    // Counting with the entry API
    let mut counts: HashMap<&str, u32> = HashMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word).or_insert(0) += 1;
    }
    println!("{}", counts["the"]);         // 3 (indexing panics if the key is missing)
    println!("{:?}", counts.get("cat"));   // None

    // HashMap order is unspecified, so sort before printing
    let mut pairs: Vec<_> = counts.iter().collect();
    pairs.sort_by(|a, b| b.1.cmp(a.1).then(a.0.cmp(b.0)));
    println!("{:?}", &pairs[..2]); // [("the", 3), ("brown", 1)]

    // Sets: uniqueness and set operations
    let a: HashSet<i32> = [1, 2, 3, 4].into_iter().collect();
    let b: HashSet<i32> = [3, 4, 5].into_iter().collect();
    let mut both: Vec<_> = a.intersection(&b).copied().collect();
    both.sort();
    println!("{:?}", both); // [3, 4]

    // BTreeMap keeps its keys sorted
    let mut sorted = BTreeMap::new();
    sorted.insert("b", 2);
    sorted.insert("a", 1);
    println!("{:?}", sorted); // {"a": 1, "b": 2}
}`
    },
    {
      label: 'Iterators',
      language: 'rust',
      code: `fn main() {
    let nums = vec![1, 2, 3, 4, 5, 6];

    // Adapters are lazy; collect runs the pipeline
    let evens_squared: Vec<i32> = nums
        .iter()
        .filter(|&&n| n % 2 == 0)
        .map(|n| n * n)
        .collect();
    println!("{:?}", evens_squared); // [4, 16, 36]

    let total: i32 = nums.iter().sum();
    let any_big = nums.iter().any(|&n| n > 5);
    let product = nums.iter().fold(1, |acc, n| acc * n);
    println!("{total} {any_big} {product}"); // 21 true 720

    let names = vec!["ana", "bo", "cy"];
    for (i, name) in names.iter().enumerate() {
        println!("{i}: {name}");
    }

    let pairs: Vec<(i32, &str)> = nums.iter().copied().zip(names.iter().copied()).collect();
    println!("{:?}", pairs); // [(1, "ana"), (2, "bo"), (3, "cy")]

    // Laziness: nothing is printed until the iterator is consumed
    let lazy = nums.iter().map(|n| {
        println!("mapping {n}");
        n * 2
    });
    println!("nothing has run yet");
    let first_two: Vec<i32> = lazy.take(2).collect(); // prints mapping 1, mapping 2
    println!("{:?}", first_two); // [2, 4]
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Indexing a Vec with a value that might be out of range',
      wrong: `let v = vec![1, 2, 3];
let x = v[10];
// thread main panicked: index out of bounds: the len is 3 but the index is 10`,
      right: `let v = vec![1, 2, 3];
match v.get(10) {
    Some(x) => println!("{x}"),
    None => println!("no such element"),
}`,
      explanation: 'Direct indexing assumes the index is valid and panics otherwise. When the index comes from user input or a computation you cannot be sure of, use get and handle the None case.'
    },
    {
      title: 'Holding a reference into a Vec while pushing to it',
      wrong: `let mut v = vec![1, 2, 3];
let first = &v[0];
v.push(4);
println!("{first}");
// error[E0502]: cannot borrow v as mutable because it is also borrowed as immutable`,
      right: `let mut v = vec![1, 2, 3];
let first = v[0]; // copy the value out instead of borrowing
v.push(4);
println!("{first}");`,
      explanation: 'Pushing may reallocate the buffer, which would leave the earlier reference pointing at freed memory. The borrow checker turns that classic dangling-pointer bug into a compile error. Copy or clone the value, or finish using the reference before mutating.'
    },
    {
      title: 'Trying to index a String by integer',
      wrong: `let s = String::from("hello");
let c = s[0];
// error[E0277]: the type str cannot be indexed by an integer`,
      right: `let s = String::from("hello");
let c = s.chars().next();       // Some('h')
let first = &s[0..1];           // "h", valid because the boundary is on a character
let third = s.chars().nth(2);   // Some('l')`,
      explanation: 'Text is UTF-8, so bytes and characters are different things and integer indexing would be ambiguous. Iterate with chars, or slice by byte range when you know the boundaries are valid.'
    },
    {
      title: 'Looping over a Vec by value and then using it again',
      wrong: `let names = vec![String::from("ana"), String::from("bo")];
for name in names {
    println!("{name}");
}
println!("{}", names.len());
// error[E0382]: borrow of moved value: names`,
      right: `let names = vec![String::from("ana"), String::from("bo")];
for name in &names {
    println!("{name}");
}
println!("{}", names.len());`,
      explanation: 'A for loop over the vector itself calls into_iter, which consumes and moves it. Loop over a reference to borrow each element instead, and the vector stays usable afterwards.'
    },
    {
      title: 'Forgetting that iterator adapters are lazy',
      wrong: `let nums = vec![1, 2, 3];
nums.iter().map(|n| println!("{n}"));
// warning: unused Map that must be used — iterators are lazy
// nothing is printed`,
      right: `let nums = vec![1, 2, 3];
for n in &nums {
    println!("{n}");
}
// or: nums.iter().for_each(|n| println!("{n}"));`,
      explanation: 'map only describes a transformation; it does not run until something consumes the iterator. For side effects use a for loop or for_each, and reserve map for producing new values that you then collect or fold.'
    },
    {
      title: 'Relying on HashMap iteration order',
      wrong: `let mut m = HashMap::new();
m.insert("a", 1);
m.insert("b", 2);
m.insert("c", 3);
for (k, v) in &m {
    println!("{k}={v}"); // order differs between runs
}`,
      right: `let mut keys: Vec<_> = m.keys().collect();
keys.sort();
for k in keys {
    println!("{k}={}", m[k]);
}
// or use a BTreeMap, which keeps its keys sorted`,
      explanation: 'The default hasher is randomised per map, so iteration order is unspecified and can change between runs. Sort explicitly, or pick BTreeMap when ordered output matters, especially in tests and generated output.'
    },
  ];

  challenge: Challenge = {
    title: 'Top Words',
    language: 'rust',
    description: `Write \`fn top_words(text: &str, n: usize) -> Vec<(String, usize)>\` that returns the \`n\` most frequent words.

Rules:
- Split the text on whitespace, lower-case each word, and strip any leading or trailing characters that are not alphanumeric (so \`"Hat."\` becomes \`"hat"\`). Skip words that end up empty.
- Count how often each word occurs.
- Sort by count, highest first. Words with the same count are ordered alphabetically.
- Return only the first \`n\` entries (fewer if there are fewer distinct words).

Example:
\`\`\`
top_words("The cat and the hat. The end!", 2)  // [("the", 3), ("and", 1)]
top_words("", 3)                                // []
\`\`\``,
    hints: [
      'Use HashMap<String, usize> and the entry API: *counts.entry(word).or_insert(0) += 1.',
      'str::trim_matches takes a closure, so word.trim_matches(|c: char| !c.is_alphanumeric()) removes punctuation from both ends.',
      'Turn the map into a Vec of pairs with into_iter().collect(), then sort_by with b.1.cmp(&a.1).then(a.0.cmp(&b.0)).',
      'Vec::truncate(n) keeps at most n entries and does nothing if there are fewer.',
    ],
    starterCode: `use std::collections::HashMap;

fn top_words(text: &str, n: usize) -> Vec<(String, usize)> {
    // TODO: count words, sort by count desc then word asc, keep the first n
    Vec::new()
}

fn main() {
    println!("{:?}", top_words("The cat and the hat. The end!", 2));
    println!("{:?}", top_words("", 3));
}`,
    solution: `use std::collections::HashMap;

fn top_words(text: &str, n: usize) -> Vec<(String, usize)> {
    let mut counts: HashMap<String, usize> = HashMap::new();
    for word in text.split_whitespace() {
        let w = word
            .trim_matches(|c: char| !c.is_alphanumeric())
            .to_lowercase();
        if w.is_empty() {
            continue;
        }
        *counts.entry(w).or_insert(0) += 1;
    }

    let mut pairs: Vec<(String, usize)> = counts.into_iter().collect();
    pairs.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));
    pairs.truncate(n);
    pairs
}

fn main() {
    println!("{:?}", top_words("The cat and the hat. The end!", 2)); // [("the", 3), ("and", 1)]
    println!("{:?}", top_words("", 3));                              // []
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does v.get(10) return for a vector with three elements?',
      options: [
        'It panics',
        'None, wrapped in an Option',
        '0',
        'The last element',
      ],
      answer: 1,
      explanation: 'get returns an Option of a reference, so an out-of-range index gives None instead of a panic. Direct indexing with v[10] is the version that panics.'
    },
    {
      q: 'Why can you not write let c = s[0]; for a String s?',
      options: [
        'Indexing requires the unsafe keyword',
        'Strings can only be indexed with u8',
        'Strings are immutable',
        'Text is UTF-8, so a byte position does not necessarily identify a character, and Rust forbids integer indexing',
      ],
      answer: 3,
      explanation: 'A character can occupy one to four bytes. Rust refuses integer indexing rather than guess, and gives you chars() for characters and byte-range slicing when you know the boundaries.'
    },
    {
      q: 'What is the effect of writing nums.iter().map(|n| n * 2); as a statement on its own?',
      options: [
        'Nothing happens, because the iterator is lazy and never consumed (the compiler warns)',
        'It panics',
        'It doubles every element of nums in place',
        'It returns a new Vec',
      ],
      answer: 0,
      explanation: 'Adapters only build a description of the work. Without a consuming call such as collect, sum or a for loop, no items are ever pulled through the pipeline.'
    },
    {
      q: 'Which statement about HashMap iteration order is correct?',
      options: [
        'Items come out in insertion order',
        'Items come out sorted by key',
        'The order is unspecified and can change between runs',
        'It is always reverse insertion order',
      ],
      answer: 2,
      explanation: 'The default hasher is randomised, so the order is deliberately unspecified. Use a BTreeMap or sort the keys when a stable order is required.'
    },
    {
      q: 'After for x in v { ... } where v is a Vec of Strings, what is the state of v?',
      options: [
        'Cleared but usable',
        'Copied',
        'Unchanged and fully usable',
        'Moved into the loop, so it cannot be used again',
      ],
      answer: 3,
      explanation: 'Looping over the vector by value calls into_iter, which consumes it. Loop over &v to borrow, or over v.iter().'
    },
    {
      q: 'What is the idiomatic way to increment a counter for a key that might not exist yet?',
      options: [
        '*map.entry(k).or_insert(0) += 1',
        'map[k] += 1',
        'map.get(k) += 1',
        'if map.contains_key(k) { map.insert(k, map[k] + 1) } else { map.insert(k, 1) }',
      ],
      answer: 0,
      explanation: 'The entry API inserts a default when the key is missing and returns a mutable reference either way, so the increment is a single expression with one hash lookup.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between String and &str?',
      a: 'A String owns its text: it lives on the heap, can grow, and is freed when dropped. A &str is a borrowed view of UTF-8 text that lives elsewhere, such as inside a String or in the program binary for literals. Take &str in function parameters so callers can pass either kind without cloning.'
    },
    {
      q: 'What is the difference between iter, iter_mut and into_iter?',
      a: 'iter yields shared references, so the collection is untouched. iter_mut yields mutable references so you can modify elements in place. into_iter consumes the collection and yields owned values. A for loop over &v, &mut v and v use these three respectively.'
    },
    {
      q: 'Why does collect sometimes need a type annotation?',
      a: 'collect can build many different collections, such as a <code>Vec&lt;T&gt;</code>, a HashSet, a String or a HashMap, and the compiler cannot guess which you want. Annotate the variable, as in let v: Vec&lt;i32&gt; = ..., or use the turbofish syntax .collect::&lt;Vec&lt;_&gt;&gt;() to say so explicitly.'
    },
    {
      q: 'When would I choose a BTreeMap over a HashMap?',
      a: 'Choose a BTreeMap when you need keys in sorted order, want to iterate a range of keys, or need deterministic output. A HashMap is usually faster for plain lookup and insertion, but its iteration order is unspecified, and keys must implement Hash rather than only Ord.'
    },
    {
      q: 'Are iterator chains slower than a for loop?',
      a: 'No. Iterators are a zero-cost abstraction: the compiler inlines the closures and typically generates the same machine code as a hand-written loop, and sometimes better, because it can prove more about bounds and remove checks. Write the clearer version first.'
    },
    {
      q: 'What does Vec capacity mean?',
      a: 'A vector has a length (how many elements it holds) and a capacity (how many it can hold before reallocating). Pushing beyond the capacity allocates a larger buffer and copies the elements. If you know the size ahead of time, Vec::with_capacity avoids repeated reallocations.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Vec, String, HashMap and HashSet cover most needs; text is UTF-8 so it cannot be indexed by integer; and iterators are lazy pipelines that compile to the same code as a hand-written loop.',
    mustKnow: [
      '<code>v[i]</code> panics on a bad index; <code>v.get(i)</code> returns an Option',
      'A reference into a Vec blocks push, because growing may reallocate the buffer',
      '<code>String</code> owns text, <code>&amp;str</code> borrows it — prefer <code>&amp;str</code> parameters',
      '<code>len()</code> counts bytes; use <code>chars()</code> for characters, and byte slices must fall on character boundaries',
      'Update maps with <code>*map.entry(k).or_insert(0) += 1</code>; HashMap order is unspecified',
      '<code>iter</code> borrows, <code>iter_mut</code> mutates and <code>into_iter</code> consumes',
      'Adapters are lazy; nothing runs until a consumer such as <code>collect</code> or <code>sum</code> pulls items through',
    ],
    interviewFocus: [
      'Why is integer indexing into a String not allowed?',
      'Explain the difference between iter, iter_mut and into_iter',
      'Why is it a compile error to push to a vector while holding a reference to one of its elements?',
      'When would you choose BTreeMap or VecDeque over the defaults?',
      'What does it mean that iterators are lazy, and why does it matter?',
    ],
  };
}
