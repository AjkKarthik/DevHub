module.exports = {
  slug: 'collections',
  subtitle: 'Vec, HashMap, HashSet, BTreeMap and VecDeque; String vs &str and UTF-8; and the lazy iterator adapters that replace most hand-written loops.',
  readingTime: 24,
  apis: ['Vec<T>', 'HashMap entry API', 'HashSet / BTreeMap', 'String / &str', 'iter / iter_mut / into_iter', 'map / filter / collect'],
  tip: 'Reach for iterator chains before index loops: they cannot go out of bounds, they express intent (filter, map, sum), and they compile to the same machine code as a hand-written loop.',
  gotchas: [
    'You cannot index a String with s[0]: strings are UTF-8 and a byte index might fall inside a character. Use chars(), bytes() or byte-range slices on char boundaries.',
    'Iterator adapters are lazy — v.iter().map(f); does nothing until consumed by collect, sum, for_each or a for loop (the compiler warns).',
    'HashMap iteration order is unspecified and differs between runs; use BTreeMap (or sort the keys) when output order matters.',
  ],
  quickRef: [
    { name: 'vec![1, 2, 3] / Vec::with_capacity(n)', type: 'function', desc: 'Create a vector; pre-size it when the final length is known' },
    { name: 'v.get(i)', type: 'method', desc: 'Option<&T> instead of panicking like v[i]' },
    { name: 'map.entry(k).or_insert(0)', type: 'method', desc: 'Get or create a value in one lookup — the idiomatic counter/grouping tool' },
    { name: 'HashSet / BTreeMap / VecDeque', type: 'type', desc: 'Unique items / sorted map / double-ended queue' },
    { name: 'String vs &str', type: 'type', desc: 'Owned growable UTF-8 buffer vs borrowed string slice' },
    { name: 'iter() / iter_mut() / into_iter()', type: 'method', desc: 'Yield &T / &mut T / T (consuming the collection)' },
    { name: '.map(f).filter(p).collect::<Vec<_>>()', type: 'method', desc: 'Lazy adapters, then a consumer that builds a collection' },
    { name: '.sum() / .count() / .fold(init, f)', type: 'method', desc: 'Consumers that reduce an iterator to one value' },
    { name: 'collect::<Result<Vec<_>, _>>()', type: 'method', desc: 'Stop at the first Err while collecting' },
    { name: 'v.retain(|x| ..) / v.sort_by_key(..)', type: 'method', desc: 'In-place filter and sort' },
  ],
  theory: [
    { heading: 'Vec<T>', points: [
      'A `Vec` is a heap buffer with a length and a capacity. Pushing beyond capacity reallocates to a larger buffer and moves the elements, so `push` is amortised O(1).',
      'Any reallocation invalidates references into the old buffer — that is exactly why the borrow checker forbids pushing while you hold a reference into the vector.',
      '`v[i]` panics when out of range; `v.get(i)` returns `Option<&T>`. Use `first()`, `last()`, `split_at()`, `windows(n)` and `chunks(n)` for common access patterns.',
      'Useful in-place operations: `sort` (stable), `sort_unstable` (faster, no allocation), `dedup`, `retain`, `drain(..)`, `extend`, `truncate`. `binary_search` requires a sorted vector.',
    ] },
    { heading: 'Maps and sets', points: [
      '`HashMap<K, V>` offers average O(1) insert and lookup. Keys must implement `Eq + Hash`; derive both for your own key types.',
      'The default hasher (SipHash 1-3) is designed to resist hash-flooding attacks from untrusted keys. For trusted, performance-critical keys, crates like `ahash` or `rustc-hash` are faster.',
      'The entry API does lookup-or-insert in one step: `*counts.entry(word).or_insert(0) += 1`, `groups.entry(k).or_default().push(v)`.',
      '`BTreeMap`/`BTreeSet` keep keys sorted (O(log n)) and support range queries; `HashSet` gives fast membership tests and set operations (`union`, `intersection`, `difference`).',
      '`VecDeque` is a ring buffer with O(1) push and pop at both ends — use it for queues and sliding windows.',
    ] },
    { heading: 'Strings are UTF-8', points: [
      '`String` owns UTF-8 bytes; `&str` borrows them. `s.len()` is a byte count, not a character count — `"é".len()` is 2.',
      'You cannot write `s[0]` (E0277: the type `str` cannot be indexed by `{integer}`). Iterate with `chars()` for Unicode scalar values or `bytes()` for raw bytes.',
      'Byte-range slicing `&s[0..3]` is allowed but panics if a boundary falls inside a multi-byte character; `s.get(0..3)` returns `None` instead.',
      'Build strings with `push_str`, `push`, `format!` or by collecting an iterator of `char`/`&str`. `+` takes ownership of the left operand: `let c = a + &b;` moves `a`.',
    ] },
    { heading: 'Iterators', points: [
      'An iterator implements `next(&mut self) -> Option<Self::Item>`. Adapters like `map`, `filter`, `enumerate`, `zip`, `take`, `skip`, `rev`, `flat_map` and `chain` build a lazy pipeline.',
      'Nothing runs until a consumer pulls values: `collect`, `sum`, `count`, `min`/`max`, `any`/`all`, `find`, `position`, `fold`, `for_each` or a `for` loop.',
      'On a `Vec`, `iter()` yields `&T`, `iter_mut()` yields `&mut T` and `into_iter()` yields `T` and consumes the vector. A `for x in v` loop calls `into_iter()`; `for x in &v` calls `iter()`.',
      '`collect` is driven by the target type: `Vec<_>`, `HashMap<_, _>` from pairs, `String` from chars, and `Result<Vec<_>, E>` which stops at the first error.',
      'Iterator chains are zero-cost: after optimisation they compile to the same loop you would write by hand, usually without bounds checks.',
    ] },
  ],
  codeTabs: [
    { label: 'Vec & HashMap', language: 'rust', code: `use std::collections::{BTreeMap, HashMap, HashSet};

fn main() {
    let mut v = Vec::with_capacity(4);
    v.extend([5, 3, 8, 3, 1]);
    v.sort_unstable();
    v.dedup();                         // [1, 3, 5, 8]
    v.retain(|&x| x != 5);             // [1, 3, 8]
    println!("{v:?} get(10)={:?}", v.get(10));

    // Word count with the entry API
    let text = "the cat and the hat and the bat";
    let mut counts: HashMap<&str, usize> = HashMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word).or_insert(0) += 1;
    }
    // BTreeMap for a deterministic, sorted view
    let sorted: BTreeMap<_, _> = counts.iter().collect();
    println!("{sorted:?}");

    // Grouping with or_default
    let mut by_len: HashMap<usize, Vec<&str>> = HashMap::new();
    for w in ["hi", "yo", "hey", "sup"] {
        by_len.entry(w.len()).or_default().push(w);
    }
    println!("{:?}", by_len[&3]);

    let a: HashSet<i32> = [1, 2, 3].into();
    let b: HashSet<i32> = [2, 3, 4].into();
    let mut common: Vec<_> = a.intersection(&b).copied().collect();
    common.sort();
    println!("{common:?}");
}` },
    { label: 'Strings & UTF-8', language: 'rust', code: `fn main() {
    let s = String::from("héllo 🦀");
    println!("bytes={} chars={}", s.len(), s.chars().count()); // 11 vs 7

    // let c = s[0];                  // E0277: str cannot be indexed by integer
    let first: Option<char> = s.chars().next();
    println!("{first:?}");

    println!("{:?}", s.get(0..2));   // None: 2 is inside 'é'
    println!("{:?}", s.get(0..3));   // Some("hé")

    // Building strings
    let mut out = String::new();
    out.push_str("rust");
    out.push('!');
    let joined = ["a", "b", "c"].join("-");
    let owned = out + " " + &joined;   // \`out\` is moved by +
    println!("{owned}");

    let reversed: String = "stressed".chars().rev().collect();
    println!("{reversed}");
}` },
    { label: 'Iterator pipelines', language: 'rust', code: `#[derive(Debug)]
struct Order { customer: &'static str, cents: u64, paid: bool }

fn main() {
    let orders = vec![
        Order { customer: "ada", cents: 1250, paid: true },
        Order { customer: "bob", cents: 990, paid: false },
        Order { customer: "ada", cents: 300, paid: true },
    ];

    let paid_total: u64 = orders.iter().filter(|o| o.paid).map(|o| o.cents).sum();
    let biggest = orders.iter().max_by_key(|o| o.cents).map(|o| o.customer);
    let names: Vec<String> = orders.iter().map(|o| o.customer.to_uppercase()).collect();
    println!("{paid_total} {biggest:?} {names:?}");

    for (i, o) in orders.iter().enumerate().skip(1) {
        println!("#{i}: {} {}", o.customer, o.cents);
    }

    // collect into Result: stops at the first error
    let ok: Result<Vec<u32>, _> = ["1", "2", "3"].iter().map(|s| s.parse::<u32>()).collect();
    let bad: Result<Vec<u32>, _> = ["1", "x", "3"].iter().map(|s| s.parse::<u32>()).collect();
    println!("{ok:?} {}", bad.is_err());

    // iter_mut to modify in place; into_iter consumes
    let mut prices = vec![100, 200];
    for p in prices.iter_mut() { *p += 10; }
    let doubled: Vec<i32> = prices.into_iter().map(|p| p * 2).collect();
    println!("{doubled:?}");    // prices was moved by into_iter
}` },
  ],
  mistakes: [
    { title: 'Indexing a String by position', checkWrong: true, wrapFn: true, wrong: `let s = String::from("hello");
let c = s[0];`, right: `let s = String::from("hello");
let c = s.chars().next();       // Option<char>
let b = s.as_bytes()[0];        // u8, if you really want bytes`, explanation: 'str cannot be indexed by an integer (E0277) because UTF-8 characters have variable width. Iterate characters or work with bytes explicitly.' },
    { title: 'Forgetting to consume an iterator', wrong: `v.iter().map(|x| println!("{x}")); // does nothing (warning: unused Map)`, right: `for x in &v { println!("{x}"); }
// or v.iter().for_each(|x| println!("{x}"));`, explanation: 'Adapters are lazy; without a consumer the closure never runs. The compiler warns "unused Map that must be used". Use a for loop for side effects.' },
    { title: 'Two lookups instead of the entry API', wrong: `if map.contains_key(&k) {
    *map.get_mut(&k).unwrap() += 1;
} else {
    map.insert(k, 1);
}`, right: `*map.entry(k).or_insert(0) += 1;`, explanation: 'The entry API hashes the key once and avoids the unwrap. It also works with or_default, or_insert_with and and_modify.' },
    { title: 'Relying on HashMap iteration order', wrong: `for (k, v) in &scores { println!("{k}: {v}"); } // order changes between runs`, right: `let mut keys: Vec<_> = scores.keys().collect();
keys.sort();
// or store the data in a BTreeMap`, explanation: 'HashMap order is unspecified and randomised per process. Sort the keys or use BTreeMap when output must be stable (tests, reports, snapshots).' },
    { title: 'Using into_iter and then the original Vec', checkWrong: true, wrapFn: true, wrong: `let names = vec![String::from("a")];
let upper: Vec<String> = names.into_iter().map(|n| n.to_uppercase()).collect();
println!("{:?}", names);`, right: `let names = vec![String::from("a")];
let upper: Vec<String> = names.iter().map(|n| n.to_uppercase()).collect();
println!("{:?} {:?}", names, upper);`, explanation: 'into_iter consumes the vector (E0382 on later use). Use iter() when you only need to read the elements.' },
  ],
  challenge: {
    title: 'Top-N word frequencies',
    language: 'rust',
    description: 'Write top_words(text: &str, n: usize) -> Vec<(String, usize)> that lowercases the text, splits on any non-alphabetic character, ignores empty pieces, counts words with a HashMap, and returns the n most frequent words sorted by count descending, then alphabetically for ties. Use iterator adapters and the entry API — no index loops.',
    hints: ['text.split(|c: char| !c.is_alphabetic()).filter(|w| !w.is_empty())', 'Collect the map into a Vec<(String, usize)>, then sort_by with b.1.cmp(&a.1).then(a.0.cmp(&b.0)).', 'truncate(n) keeps only the first n entries.'],
    starterCode: `use std::collections::HashMap;

fn top_words(text: &str, n: usize) -> Vec<(String, usize)> {
    todo!()
}

fn main() {
    let text = "It was the best of times, it was the worst of times.";
    println!("{:?}", top_words(text, 3));
}`,
    solution: `use std::collections::HashMap;

fn top_words(text: &str, n: usize) -> Vec<(String, usize)> {
    let lower = text.to_lowercase();
    let mut counts: HashMap<&str, usize> = HashMap::new();
    for w in lower.split(|c: char| !c.is_alphabetic()).filter(|w| !w.is_empty()) {
        *counts.entry(w).or_insert(0) += 1;
    }
    let mut ranked: Vec<(String, usize)> =
        counts.into_iter().map(|(w, c)| (w.to_string(), c)).collect();
    ranked.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));
    ranked.truncate(n);
    ranked
}

fn main() {
    let text = "It was the best of times, it was the worst of times.";
    println!("{:?}", top_words(text, 3));
    // [("it", 2), ("of", 2), ("the", 2)]
}`,
  },
  quiz: [
    { q: 'What does "héllo".len() return?', options: ['5', '6', '4', 'It does not compile'], answer: 1, explanation: 'len() counts bytes. é is two bytes in UTF-8, so the result is 6; chars().count() would be 5.' },
    { q: 'Which call yields owned elements and consumes the Vec?', options: ['v.iter()', 'v.iter_mut()', 'v.into_iter()', 'v.as_slice()'], answer: 2, explanation: 'into_iter takes the vector by value and yields T. iter yields &T and iter_mut yields &mut T.' },
    { q: 'What happens with `let x: Vec<i32> = v.iter().map(|n| n * 2);`?', options: ['It compiles and doubles the values', 'Type error: map returns an iterator, you need .collect()', 'It doubles in place', 'Runtime panic'], answer: 1, explanation: 'map returns a lazy Map iterator, not a Vec. Add .collect() to run it and build the vector.' },
    { q: 'Collecting an iterator of Result<u32, E> into Result<Vec<u32>, E> does what on the first Err?', options: ['Skips it', 'Panics', 'Stops and returns that Err', 'Collects all errors'], answer: 2, explanation: 'FromIterator for Result short-circuits: it returns the first error and stops iterating.' },
    { q: 'Which map keeps keys in sorted order?', options: ['HashMap', 'BTreeMap', 'HashSet', 'VecDeque'], answer: 1, explanation: 'BTreeMap is an ordered map with O(log n) operations and range queries. HashMap order is unspecified.' },
  ],
  qna: [
    { q: 'Why can you not index a String by integer?', a: 'Rust strings are UTF-8, where a character takes 1 to 4 bytes. An integer index would either be a byte offset (which could land in the middle of a character) or a character offset (which would make indexing O(n)). Rather than hide that cost or risk invalid data, Rust forbids `s[i]` and offers explicit alternatives: `chars()`, `bytes()`, `char_indices()` and byte-range slicing with boundary checks.' },
    { q: 'What is the difference between iter, iter_mut and into_iter?', a: '`iter()` borrows the collection and yields shared references `&T`; `iter_mut()` borrows it mutably and yields `&mut T` so you can modify elements in place; `into_iter()` takes the collection by value and yields owned `T`, leaving nothing behind. `for x in &v`, `for x in &mut v` and `for x in v` call these three respectively.' },
    { q: 'Are iterator chains slower than loops?', a: 'No — iterators are a zero-cost abstraction. Adapters are small structs that the optimiser inlines, and the final machine code is typically identical to a hand-written loop, sometimes better because bounds checks can be removed. The main costs to watch are unnecessary `collect` calls that allocate intermediate collections.' },
    { q: 'When would you choose BTreeMap over HashMap?', a: 'When you need ordered iteration (stable output, ranges like "all keys between A and F"), when keys implement `Ord` but not `Hash`, or when worst-case guarantees matter more than average speed. `HashMap` is usually faster for plain lookups. `BTreeMap` also gives you `first_key_value`/`last_key_value` for min/max queries.' },
    { q: 'What does the entry API solve?', a: 'It replaces the "check, then insert or update" pattern, which hashes the key twice and often needs `unwrap`. `map.entry(key)` returns an `Entry` that is either occupied or vacant, with helpers like `or_insert`, `or_insert_with`, `or_default` and `and_modify`, so counting, grouping and caching become one-liners.' },
  ],
  revision: {
    oneLiner: 'Vec, HashMap and friends cover most needs; strings are UTF-8 so you iterate instead of indexing; lazy iterator chains replace loops at zero cost.',
    mustKnow: [
      '`Vec` reallocates when full — references into it cannot survive a push.',
      '`get()` returns `Option`; indexing panics when out of range.',
      'Entry API: `*map.entry(k).or_insert(0) += 1`.',
      '`String` is UTF-8: `len()` is bytes; no `s[i]`; use `chars()`.',
      'Iterators are lazy; consumers like `collect`, `sum` and `for` drive them.',
      '`iter` / `iter_mut` / `into_iter` yield `&T` / `&mut T` / `T`.',
    ],
    interviewFocus: [
      'Explain why strings cannot be indexed by integer.',
      'Explain iterator laziness and zero-cost abstractions.',
      'Choose between HashMap, BTreeMap, HashSet and VecDeque for a scenario.',
    ],
  },
};
