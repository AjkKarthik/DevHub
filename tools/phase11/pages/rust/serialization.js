module.exports = {
  slug: 'serialization',
  subtitle: 'Serde separates your data model from the format: derive Serialize and Deserialize, shape the output with field and container attributes, pick an enum representation, and write custom (de)serializers only where derive cannot express the format.',
  readingTime: 24,
  prerequisites: [
    { label: 'Traits & Generics', route: '/rust/traits-generics' },
    { label: 'Structs & Enums', route: '/rust/structs-enums' },
  ],
  apis: ['#[derive(Serialize, Deserialize)]', 'serde_json::to_string / from_str', '#[serde(rename_all, default, skip)]', '#[serde(tag = "...")]', 'serde_json::Value', 'deserialize_with / serialize_with'],
  tip: 'Make Option fields tolerant with #[serde(default)] and fail loudly on typos with #[serde(deny_unknown_fields)] — pick deliberately per type. Public APIs usually want to ignore unknown fields so new server fields do not break old clients.',
  gotchas: [
    'Unknown JSON fields are silently ignored by default. Add #[serde(deny_unknown_fields)] when a typo in a config file should be an error.',
    'A missing field is an error unless the field is an Option or has #[serde(default)] — even if the type implements Default.',
    'Externally tagged enums are the default: a unit variant serializes as a plain string ("Active") but a data variant as an object ({"Banned":{...}}). Choose tag/content explicitly for APIs.',
  ],
  quickRef: [
    { name: '#[derive(Serialize, Deserialize)]', type: 'decorator', desc: 'Generate (de)serialization for a struct or enum at compile time' },
    { name: 'serde_json::to_string(&v) / to_string_pretty', type: 'function', desc: 'Serialize to a JSON string' },
    { name: 'serde_json::from_str::<T>(s)', type: 'function', desc: 'Parse JSON into a typed value; returns Result' },
    { name: '#[serde(rename_all = "camelCase")]', type: 'decorator', desc: 'Map snake_case Rust fields to camelCase JSON keys' },
    { name: '#[serde(rename = "type")]', type: 'decorator', desc: 'Rename one field (useful for Rust keywords)' },
    { name: '#[serde(default)]', type: 'decorator', desc: 'Use Default when the field is missing' },
    { name: '#[serde(skip_serializing_if = "Option::is_none")]', type: 'decorator', desc: 'Omit None fields from the output' },
    { name: '#[serde(tag = "type")] / untagged', type: 'decorator', desc: 'Choose how enums are represented' },
    { name: 'serde_json::Value / json!', type: 'type', desc: 'Untyped JSON tree for unknown or dynamic shapes' },
    { name: '#[serde(with = "module")]', type: 'decorator', desc: 'Plug in custom serialize/deserialize functions for one field' },
  ],
  theory: [
    { heading: 'The data model', points: [
      'Serde splits the work in two: your types implement `Serialize`/`Deserialize` against an abstract data model (structs, sequences, maps, strings, numbers...), and a format crate (`serde_json`, `serde_yaml`, `toml`, `bincode`, `rmp-serde`) maps that model to bytes.',
      'Because of that split, the same `#[derive]` works for every format. Switching a config file from JSON to TOML changes one function call, not your structs.',
      'The derive macros generate the code at compile time: there is no reflection and no runtime schema, which is why serde is both fast and type-checked.',
      'Deserialization is driven by the target type: `serde_json::from_str::<Config>(s)` returns `Result<Config, serde_json::Error>` with the line and column of the first problem.',
    ] },
    { heading: 'Field and container attributes', points: [
      '`#[serde(rename_all = "camelCase")]` on the struct and `#[serde(rename = "type")]` on a field adapt Rust naming to the wire format without changing your code.',
      '`#[serde(default)]` fills a missing field from `Default` (or `#[serde(default = "path::to_fn")]` for a custom value). `Option<T>` fields are already optional when deserializing.',
      '`#[serde(skip)]` leaves a field out entirely; `skip_serializing_if = "Option::is_none"` omits it only when empty; `#[serde(flatten)]` inlines a nested struct or collects extra keys into a `HashMap<String, Value>`.',
      '`#[serde(deny_unknown_fields)]` rejects input with keys the struct does not know — great for config files, risky for API clients that must tolerate newer servers.',
      'Borrowing: `#[derive(Deserialize)] struct Row<\'a> { #[serde(borrow)] name: &\'a str }` deserializes without allocating, as long as the input outlives the value and the string needs no unescaping.',
    ] },
    { heading: 'Enum representations', points: [
      'Externally tagged (default): `{"Circle":{"r":1.0}}`, and unit variants become plain strings.',
      'Internally tagged `#[serde(tag = "type")]`: `{"type":"Circle","r":1.0}` — the most common choice for APIs and event payloads. It does not work for tuple variants.',
      'Adjacently tagged `#[serde(tag = "t", content = "c")]`: `{"t":"Circle","c":{"r":1.0}}`.',
      'Untagged `#[serde(untagged)]`: serde tries each variant in order and takes the first that fits. Convenient for "string or number" inputs, but error messages are vague and order matters.',
    ] },
    { heading: 'Dynamic data and custom formats', points: [
      '`serde_json::Value` is an enum of `Null`, `Bool`, `Number`, `String`, `Array` and `Object`. Use it for genuinely dynamic payloads, then convert pieces into typed structs with `serde_json::from_value`.',
      'For a single field with an unusual format (timestamps as strings, numbers as strings), use `#[serde(with = "my_module")]` where the module exposes `serialize` and `deserialize` functions, or `deserialize_with` for one direction.',
      'Hand-written `impl Serialize`/`impl Deserialize` (with a `Visitor`) is rarely needed: newtypes, `#[serde(try_from = "String")]` and `#[serde(from = "...")]` cover most validation and conversion cases with less code.',
      '`#[serde(try_from = "String")]` runs your `TryFrom<String>` impl during deserialization, so invalid values (an email without @, a negative quantity) never become a value of your type. The matching `#[serde(into = "String")]` for serialization clones the value first, so the type must implement `Clone`.',
    ] },
  ],
  codeTabs: [
    { label: 'Derive & attributes', language: 'rust', code: `use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct User {
    user_id: u64,
    display_name: String,
    #[serde(default)]
    is_admin: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    nickname: Option<String>,
    #[serde(skip)]
    password_hash: String,          // never leaves the process
}

fn main() -> Result<(), serde_json::Error> {
    let json = r#"{ "userId": 7, "displayName": "Ada" }"#;
    let u: User = serde_json::from_str(json)?;
    println!("{u:?}");
    // User { user_id: 7, display_name: "Ada", is_admin: false, nickname: None, password_hash: "" }

    println!("{}", serde_json::to_string(&u)?);
    // {"userId":7,"displayName":"Ada","isAdmin":false}

    let bad = serde_json::from_str::<User>(r#"{ "userId": "seven", "displayName": "Ada" }"#);
    println!("{}", bad.unwrap_err());
    Ok(())
}` },
    { label: 'Enum representations', language: 'rust', code: `use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
enum External { Active, Banned { reason: String } }

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type", rename_all = "snake_case")]
enum Event {
    OrderPlaced { id: u64, total_cents: u64 },
    OrderCancelled { id: u64 },
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(untagged)]
enum IdOrName { Id(u64), Name(String) }

fn main() {
    let a = serde_json::to_string(&External::Active).unwrap();
    let b = serde_json::to_string(&External::Banned { reason: "spam".into() }).unwrap();
    println!("{a} {b}");   // "Active" {"Banned":{"reason":"spam"}}

    let e = Event::OrderPlaced { id: 1, total_cents: 999 };
    println!("{}", serde_json::to_string(&e).unwrap());
    // {"type":"order_placed","id":1,"total_cents":999}

    let back: Event = serde_json::from_str(r#"{"type":"order_cancelled","id":4}"#).unwrap();
    println!("{back:?}");

    let x: Vec<IdOrName> = serde_json::from_str(r#"[42, "ada"]"#).unwrap();
    println!("{x:?}");     // [Id(42), Name("ada")]
}` },
    { label: 'Value, flatten, validation', language: 'rust', code: `use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

#[derive(Debug, Deserialize)]
struct Webhook {
    event: String,
    #[serde(flatten)]
    extra: HashMap<String, Value>,   // every other key lands here
}

// Validate during deserialization: invalid emails never exist as an Email
#[derive(Debug, Clone, Serialize, Deserialize)]  // into = "..." needs Clone
#[serde(try_from = "String", into = "String")]
struct Email(String);

impl TryFrom<String> for Email {
    type Error = String;
    fn try_from(s: String) -> Result<Self, Self::Error> {
        if s.contains('@') { Ok(Email(s)) } else { Err(format!("invalid email: {s}")) }
    }
}
impl From<Email> for String {
    fn from(e: Email) -> String { e.0 }
}

#[derive(Debug, Deserialize)]
struct Signup { email: Email }

fn main() {
    let w: Webhook = serde_json::from_value(json!({
        "event": "push", "repo": "devhub", "commits": 3
    })).unwrap();
    println!("{} {:?}", w.event, w.extra.get("commits")); // push Some(Number(3))

    let ok: Result<Signup, _> = serde_json::from_str(r#"{"email":"ada@example.com"}"#);
    let bad: Result<Signup, _> = serde_json::from_str(r#"{"email":"nope"}"#);
    println!("{:?}", ok.map(|s| s.email));
    println!("{}", bad.unwrap_err());
}` },
    { label: 'Custom field format', language: 'rust', code: `use serde::{Deserialize, Deserializer, Serialize, Serializer};

// Some APIs send big numbers as strings to protect JavaScript clients
mod string_u64 {
    use super::*;
    pub fn serialize<S: Serializer>(v: &u64, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&v.to_string())
    }
    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<u64, D::Error> {
        let s = String::deserialize(d)?;
        s.parse().map_err(serde::de::Error::custom)
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct Account {
    #[serde(with = "string_u64")]
    balance: u64,
}

fn main() {
    let a: Account = serde_json::from_str(r#"{"balance":"18446744073709551615"}"#).unwrap();
    println!("{a:?}");
    println!("{}", serde_json::to_string(&a).unwrap()); // {"balance":"18446744073709551615"}
    println!("{}", serde_json::from_str::<Account>(r#"{"balance":"12x"}"#).unwrap_err());
}` },
  ],
  mistakes: [
    { title: 'Expecting a non-Option field to be optional', wrong: `#[derive(Deserialize)]
struct Config { port: u16, verbose: bool }
// {"port": 8080}  ->  Error("missing field \`verbose\`")`, right: `#[derive(Deserialize)]
struct Config {
    port: u16,
    #[serde(default)]          // false when missing
    verbose: bool,
}`, explanation: 'Deserialize requires every non-Option field unless you opt in to #[serde(default)] — implementing Default on the type is not enough on its own.' },
    { title: 'Typos in config files silently ignored', wrong: `#[derive(Deserialize)]
struct Config { #[serde(default)] max_connections: u32 }
// {"max_conections": 500} parses fine and max_connections stays 0`, right: `#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Config { #[serde(default)] max_connections: u32 }
// error: unknown field \`max_conections\`, expected \`max_connections\``, explanation: 'Unknown keys are ignored by default. For config files, deny_unknown_fields turns a typo into a clear error instead of a silently ignored setting.' },
    { title: 'Using untagged enums for API payloads', wrong: `#[derive(Deserialize)]
#[serde(untagged)]
enum Msg { Ping { id: u64 }, Ack { id: u64 } }
// {"id": 1} always becomes Ping — Ack is unreachable`, right: `#[derive(Deserialize)]
#[serde(tag = "type")]
enum Msg { Ping { id: u64 }, Ack { id: u64 } }
// {"type": "Ack", "id": 1}`, explanation: 'Untagged enums pick the first variant whose shape matches. Variants with the same fields are indistinguishable, and failures produce vague "did not match any variant" errors. Prefer an explicit tag.' },
    { title: 'Leaking secrets through Serialize', wrong: `#[derive(Serialize)]
struct User { email: String, password_hash: String, api_key: String }
// Json(user) sends the hash and key to the client`, right: `#[derive(Serialize)]
struct User {
    email: String,
    #[serde(skip)] password_hash: String,
    #[serde(skip)] api_key: String,
}
// better still: a separate UserResponse type`, explanation: 'Deriving Serialize on an internal entity exposes every field. Skip secrets explicitly, or serialize a dedicated response type so new internal fields are never exposed by accident.' },
    { title: 'Parsing everything into serde_json::Value', wrong: `let v: Value = serde_json::from_str(body)?;
let total = v["items"][0]["price"].as_f64().unwrap_or(0.0); // silent 0.0 on a typo`, right: `#[derive(Deserialize)] struct Item { price: f64 }
#[derive(Deserialize)] struct Order { items: Vec<Item> }
let order: Order = serde_json::from_str(body)?; // shape checked once`, explanation: 'Indexing a Value returns Null for anything missing, so typos become silent defaults. Typed structs give real errors and compile-time field names; keep Value for genuinely dynamic data.' },
  ],
  challenge: {
    title: 'Parse a mixed event stream',
    language: 'rust',
    description: 'Each line of input is a JSON event: {"type":"login","user":"ada"}, {"type":"purchase","user":"ada","amountCents":1250} or {"type":"logout","user":"ada"}. Define an internally tagged enum (snake_case tags, camelCase fields), parse each line, skip and count invalid lines, and return the total purchase amount per user in a BTreeMap.',
    hints: ['#[serde(tag = "type", rename_all = "snake_case")] on the enum, and #[serde(rename_all = "camelCase")] on the purchase variant to read amountCents.', 'serde_json::from_str::<Event>(line) returns a Result — match on it to count failures.', 'BTreeMap gives deterministic output order.'],
    starterCode: `use std::collections::BTreeMap;
use serde::Deserialize;

// TODO: enum Event

fn totals(input: &str) -> (BTreeMap<String, u64>, usize) {
    todo!()
}

fn main() {
    let input = r#"{"type":"login","user":"ada"}
{"type":"purchase","user":"ada","amountCents":1250}
{"type":"purchase","user":"bob","amountCents":300}
not json
{"type":"purchase","user":"ada","amountCents":50}
{"type":"refund","user":"bob"}"#;
    println!("{:?}", totals(input));
}`,
    solution: `use std::collections::BTreeMap;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum Event {
    Login { user: String },
    #[serde(rename_all = "camelCase")]
    Purchase { user: String, amount_cents: u64 },
    Logout { user: String },
}

fn totals(input: &str) -> (BTreeMap<String, u64>, usize) {
    let mut sums = BTreeMap::new();
    let mut invalid = 0;
    for line in input.lines() {
        match serde_json::from_str::<Event>(line) {
            Ok(Event::Purchase { user, amount_cents }) => *sums.entry(user).or_insert(0) += amount_cents,
            Ok(_) => {}
            Err(_) => invalid += 1,
        }
    }
    (sums, invalid)
}

fn main() {
    let input = r#"{"type":"login","user":"ada"}
{"type":"purchase","user":"ada","amountCents":1250}
{"type":"purchase","user":"bob","amountCents":300}
not json
{"type":"purchase","user":"ada","amountCents":50}
{"type":"refund","user":"bob"}"#;
    println!("{:?}", totals(input));
    // ({"ada": 1300, "bob": 300}, 2)
}`,
  },
  quiz: [
    { q: 'What happens by default when JSON contains a key the struct does not have?', options: ['Deserialization fails', 'The key is ignored', 'It is stored in a hidden map', 'It panics'], answer: 1, explanation: 'Serde ignores unknown fields unless the type has #[serde(deny_unknown_fields)].' },
    { q: 'How does an internally tagged enum #[serde(tag = "type")] serialize Shape::Circle { r: 1.0 }?', options: ['{"Circle":{"r":1.0}}', '{"type":"Circle","r":1.0}', '{"t":"Circle","c":{"r":1.0}}', '{"r":1.0}'], answer: 1, explanation: 'Internal tagging puts the variant name in the given field alongside the variant fields. The first option is the default external tagging; the third is adjacent tagging; the last is untagged.' },
    { q: 'A struct field `count: u32` is missing from the JSON. What makes deserialization succeed with 0?', options: ['impl Default for the struct', '#[serde(default)] on the field (or struct)', '#[serde(skip_serializing_if)]', 'Nothing, u32 defaults automatically'], answer: 1, explanation: '#[serde(default)] tells serde to use Default::default() when the field is absent. Implementing Default alone does not change deserialization.' },
    { q: 'Why can one #[derive(Serialize)] work for JSON, TOML and bincode?', options: ['Serde uses runtime reflection', 'Types serialize into an abstract data model that each format crate maps to bytes', 'Each format re-parses Rust source', 'It does not; you need one derive per format'], answer: 1, explanation: 'Serialize targets serde\'s data model; the format crate implements a Serializer that turns that model into its own syntax.' },
    { q: 'What is the main risk of #[serde(untagged)]?', options: ['It is slow to compile', 'Variants with overlapping shapes are ambiguous and errors are vague', 'It cannot deserialize', 'It only works with numbers'], answer: 1, explanation: 'Serde picks the first variant that fits, so ambiguous shapes silently map to the wrong variant and failures report only that no variant matched.' },
  ],
  qna: [
    { q: 'How does serde achieve both speed and type safety?', a: 'The derive macros generate concrete `Serialize`/`Deserialize` implementations at compile time, so there is no reflection or runtime schema lookup, and monomorphisation specialises the code for each format. Deserialization is driven by the target type, so the result is either a fully valid value or a `Result::Err` with the location of the problem — never a half-filled object.' },
    { q: 'Which enum representation would you choose for an event API, and why?', a: 'Usually internally tagged (`#[serde(tag = "type")]`): the payload stays flat (`{"type":"order_placed","id":1}`), it reads naturally in other languages and logs, and adding a variant is backwards compatible for consumers that ignore unknown types. Adjacent tagging is useful when variants contain non-struct data; untagged is best reserved for "string or number" style inputs.' },
    { q: 'How do you validate data during deserialization?', a: 'Wrap the value in a newtype and use `#[serde(try_from = "String")]` (or another source type) with a `TryFrom` implementation that returns an error for invalid input. The invalid value can then never exist in your program, and the error flows back through `serde_json::Error` with its position. For whole-struct rules, validate after parsing or use a crate such as `validator`.' },
    { q: 'When do you write a manual Deserialize implementation?', a: 'Rarely — for formats that do not map onto a struct shape, for streaming or zero-copy parsing tricks, or for very custom error messages. Most needs are covered by attributes: `rename`, `default`, `flatten`, `with`/`deserialize_with` for one field, `try_from`/`from` for conversions. A manual impl requires a `Visitor` and is significantly more code to maintain.' },
    { q: 'What is the difference between serde_json::Value and a typed struct?', a: '`Value` represents any JSON document dynamically: flexible, but every access is unchecked and missing data turns into `Null`. A typed struct validates shape and types once at the boundary and gives compile-time field names afterwards. Use `Value` for passthrough or truly dynamic data, and convert sub-trees into types with `serde_json::from_value` as soon as you know their shape.' },
  ],
  revision: {
    oneLiner: 'Derive Serialize/Deserialize, shape the wire format with attributes, pick an explicit enum tag, and reach for custom code only when attributes cannot express the format.',
    mustKnow: [
      'Serde = data model + format crates; one derive works for JSON, TOML, YAML, bincode.',
      '`rename_all`, `rename`, `default`, `skip`, `skip_serializing_if`, `flatten` cover most mappings.',
      'Missing non-Option fields are errors unless `#[serde(default)]`.',
      'Unknown fields are ignored unless `deny_unknown_fields`.',
      'Enum styles: external (default), internal `tag`, adjacent `tag`+`content`, `untagged`.',
      '`try_from` / `with` handle validation and custom field formats.',
    ],
    interviewFocus: [
      'Explain serde\'s data-model design and why it needs no reflection.',
      'Choose an enum representation for an API and justify it.',
      'Show how to validate input during deserialization.',
    ],
  },
};
