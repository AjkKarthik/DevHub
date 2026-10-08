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
  selector: 'app-rust-serialization',
  standalone: true,
  imports: [PageMetaComponent, PrerequisitesComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './serialization.html',
  styleUrl: './serialization.scss'
})
export class RustSerialization {
  readingTime = 24;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = "Rust 2024";
  route = 'rust-serialization';
  nextRoute = '/rust/cli-tools';
  nextLabel = "CLI Tools";

  prerequisites: Prerequisite[] = [
    {
      "label": "Traits & Generics",
      "route": "/rust/traits-generics"
    },
    {
      "label": "Structs & Enums",
      "route": "/rust/structs-enums"
    }
  ];

  quickRef: QuickRefItem[] = [
    {
      "name": "#[derive(Serialize, Deserialize)]",
      "type": "decorator",
      "desc": "Generate (de)serialization for a struct or enum at compile time"
    },
    {
      "name": "serde_json::to_string(&v) / to_string_pretty",
      "type": "function",
      "desc": "Serialize to a JSON string"
    },
    {
      "name": "serde_json::from_str::<T>(s)",
      "type": "function",
      "desc": "Parse JSON into a typed value; returns Result"
    },
    {
      "name": "#[serde(rename_all = \"camelCase\")]",
      "type": "decorator",
      "desc": "Map snake_case Rust fields to camelCase JSON keys"
    },
    {
      "name": "#[serde(rename = \"type\")]",
      "type": "decorator",
      "desc": "Rename one field (useful for Rust keywords)"
    },
    {
      "name": "#[serde(default)]",
      "type": "decorator",
      "desc": "Use Default when the field is missing"
    },
    {
      "name": "#[serde(skip_serializing_if = \"Option::is_none\")]",
      "type": "decorator",
      "desc": "Omit None fields from the output"
    },
    {
      "name": "#[serde(tag = \"type\")] / untagged",
      "type": "decorator",
      "desc": "Choose how enums are represented"
    },
    {
      "name": "serde_json::Value / json!",
      "type": "type",
      "desc": "Untyped JSON tree for unknown or dynamic shapes"
    },
    {
      "name": "#[serde(with = \"module\")]",
      "type": "decorator",
      "desc": "Plug in custom serialize/deserialize functions for one field"
    }
  ];

  theory: TheoryPoint[] = [
    {
      "heading": "The data model",
      "points": [
        "Serde splits the work in two: your types implement <code>Serialize</code>/<code>Deserialize</code> against an abstract data model (structs, sequences, maps, strings, numbers...), and a format crate (<code>serde_json</code>, <code>serde_yaml</code>, <code>toml</code>, <code>bincode</code>, <code>rmp-serde</code>) maps that model to bytes.",
        "Because of that split, the same <code>#[derive]</code> works for every format. Switching a config file from JSON to TOML changes one function call, not your structs.",
        "The derive macros generate the code at compile time: there is no reflection and no runtime schema, which is why serde is both fast and type-checked.",
        "Deserialization is driven by the target type: <code>serde_json::from_str::&lt;Config&gt;(s)</code> returns <code>Result&lt;Config, serde_json::Error&gt;</code> with the line and column of the first problem."
      ]
    },
    {
      "heading": "Field and container attributes",
      "points": [
        "<code>#[serde(rename_all = \"camelCase\")]</code> on the struct and <code>#[serde(rename = \"type\")]</code> on a field adapt Rust naming to the wire format without changing your code.",
        "<code>#[serde(default)]</code> fills a missing field from <code>Default</code> (or <code>#[serde(default = \"path::to_fn\")]</code> for a custom value). <code>Option&lt;T&gt;</code> fields are already optional when deserializing.",
        "<code>#[serde(skip)]</code> leaves a field out entirely; <code>skip_serializing_if = \"Option::is_none\"</code> omits it only when empty; <code>#[serde(flatten)]</code> inlines a nested struct or collects extra keys into a <code>HashMap&lt;String, Value&gt;</code>.",
        "<code>#[serde(deny_unknown_fields)]</code> rejects input with keys the struct does not know — great for config files, risky for API clients that must tolerate newer servers.",
        "Borrowing: <code>#[derive(Deserialize)] struct Row&lt;'a&gt; { #[serde(borrow)] name: &amp;'a str }</code> deserializes without allocating, as long as the input outlives the value and the string needs no unescaping."
      ]
    },
    {
      "heading": "Enum representations",
      "points": [
        "Externally tagged (default): <code>{\"Circle\":{\"r\":1.0}}</code>, and unit variants become plain strings.",
        "Internally tagged <code>#[serde(tag = \"type\")]</code>: <code>{\"type\":\"Circle\",\"r\":1.0}</code> — the most common choice for APIs and event payloads. It does not work for tuple variants.",
        "Adjacently tagged <code>#[serde(tag = \"t\", content = \"c\")]</code>: <code>{\"t\":\"Circle\",\"c\":{\"r\":1.0}}</code>.",
        "Untagged <code>#[serde(untagged)]</code>: serde tries each variant in order and takes the first that fits. Convenient for \"string or number\" inputs, but error messages are vague and order matters."
      ]
    },
    {
      "heading": "Dynamic data and custom formats",
      "points": [
        "<code>serde_json::Value</code> is an enum of <code>Null</code>, <code>Bool</code>, <code>Number</code>, <code>String</code>, <code>Array</code> and <code>Object</code>. Use it for genuinely dynamic payloads, then convert pieces into typed structs with <code>serde_json::from_value</code>.",
        "For a single field with an unusual format (timestamps as strings, numbers as strings), use <code>#[serde(with = \"my_module\")]</code> where the module exposes <code>serialize</code> and <code>deserialize</code> functions, or <code>deserialize_with</code> for one direction.",
        "Hand-written <code>impl Serialize</code>/<code>impl Deserialize</code> (with a <code>Visitor</code>) is rarely needed: newtypes, <code>#[serde(try_from = \"String\")]</code> and <code>#[serde(from = \"...\")]</code> cover most validation and conversion cases with less code.",
        "<code>#[serde(try_from = \"String\")]</code> runs your <code>TryFrom&lt;String&gt;</code> impl during deserialization, so invalid values (an email without @, a negative quantity) never become a value of your type. The matching <code>#[serde(into = \"String\")]</code> for serialization clones the value first, so the type must implement <code>Clone</code>."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Derive & attributes",
      "code": "use serde::{Deserialize, Serialize};\n\n#[derive(Debug, Serialize, Deserialize)]\n#[serde(rename_all = \"camelCase\")]\nstruct User {\n    user_id: u64,\n    display_name: String,\n    #[serde(default)]\n    is_admin: bool,\n    #[serde(skip_serializing_if = \"Option::is_none\")]\n    nickname: Option<String>,\n    #[serde(skip)]\n    password_hash: String,          // never leaves the process\n}\n\nfn main() -> Result<(), serde_json::Error> {\n    let json = r#\"{ \"userId\": 7, \"displayName\": \"Ada\" }\"#;\n    let u: User = serde_json::from_str(json)?;\n    println!(\"{u:?}\");\n    // User { user_id: 7, display_name: \"Ada\", is_admin: false, nickname: None, password_hash: \"\" }\n\n    println!(\"{}\", serde_json::to_string(&u)?);\n    // {\"userId\":7,\"displayName\":\"Ada\",\"isAdmin\":false}\n\n    let bad = serde_json::from_str::<User>(r#\"{ \"userId\": \"seven\", \"displayName\": \"Ada\" }\"#);\n    println!(\"{}\", bad.unwrap_err());\n    Ok(())\n}",
      "language": "rust"
    },
    {
      "label": "Enum representations",
      "code": "use serde::{Deserialize, Serialize};\n\n#[derive(Serialize, Deserialize, Debug)]\nenum External { Active, Banned { reason: String } }\n\n#[derive(Serialize, Deserialize, Debug)]\n#[serde(tag = \"type\", rename_all = \"snake_case\")]\nenum Event {\n    OrderPlaced { id: u64, total_cents: u64 },\n    OrderCancelled { id: u64 },\n}\n\n#[derive(Serialize, Deserialize, Debug)]\n#[serde(untagged)]\nenum IdOrName { Id(u64), Name(String) }\n\nfn main() {\n    let a = serde_json::to_string(&External::Active).unwrap();\n    let b = serde_json::to_string(&External::Banned { reason: \"spam\".into() }).unwrap();\n    println!(\"{a} {b}\");   // \"Active\" {\"Banned\":{\"reason\":\"spam\"}}\n\n    let e = Event::OrderPlaced { id: 1, total_cents: 999 };\n    println!(\"{}\", serde_json::to_string(&e).unwrap());\n    // {\"type\":\"order_placed\",\"id\":1,\"total_cents\":999}\n\n    let back: Event = serde_json::from_str(r#\"{\"type\":\"order_cancelled\",\"id\":4}\"#).unwrap();\n    println!(\"{back:?}\");\n\n    let x: Vec<IdOrName> = serde_json::from_str(r#\"[42, \"ada\"]\"#).unwrap();\n    println!(\"{x:?}\");     // [Id(42), Name(\"ada\")]\n}",
      "language": "rust"
    },
    {
      "label": "Value, flatten, validation",
      "code": "use std::collections::HashMap;\nuse serde::{Deserialize, Serialize};\nuse serde_json::{Value, json};\n\n#[derive(Debug, Deserialize)]\nstruct Webhook {\n    event: String,\n    #[serde(flatten)]\n    extra: HashMap<String, Value>,   // every other key lands here\n}\n\n// Validate during deserialization: invalid emails never exist as an Email\n#[derive(Debug, Clone, Serialize, Deserialize)]  // into = \"...\" needs Clone\n#[serde(try_from = \"String\", into = \"String\")]\nstruct Email(String);\n\nimpl TryFrom<String> for Email {\n    type Error = String;\n    fn try_from(s: String) -> Result<Self, Self::Error> {\n        if s.contains('@') { Ok(Email(s)) } else { Err(format!(\"invalid email: {s}\")) }\n    }\n}\nimpl From<Email> for String {\n    fn from(e: Email) -> String { e.0 }\n}\n\n#[derive(Debug, Deserialize)]\nstruct Signup { email: Email }\n\nfn main() {\n    let w: Webhook = serde_json::from_value(json!({\n        \"event\": \"push\", \"repo\": \"devhub\", \"commits\": 3\n    })).unwrap();\n    println!(\"{} {:?}\", w.event, w.extra.get(\"commits\")); // push Some(Number(3))\n\n    let ok: Result<Signup, _> = serde_json::from_str(r#\"{\"email\":\"ada@example.com\"}\"#);\n    let bad: Result<Signup, _> = serde_json::from_str(r#\"{\"email\":\"nope\"}\"#);\n    println!(\"{:?}\", ok.map(|s| s.email));\n    println!(\"{}\", bad.unwrap_err());\n}",
      "language": "rust"
    },
    {
      "label": "Custom field format",
      "code": "use serde::{Deserialize, Deserializer, Serialize, Serializer};\n\n// Some APIs send big numbers as strings to protect JavaScript clients\nmod string_u64 {\n    use super::*;\n    pub fn serialize<S: Serializer>(v: &u64, s: S) -> Result<S::Ok, S::Error> {\n        s.serialize_str(&v.to_string())\n    }\n    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<u64, D::Error> {\n        let s = String::deserialize(d)?;\n        s.parse().map_err(serde::de::Error::custom)\n    }\n}\n\n#[derive(Debug, Serialize, Deserialize)]\nstruct Account {\n    #[serde(with = \"string_u64\")]\n    balance: u64,\n}\n\nfn main() {\n    let a: Account = serde_json::from_str(r#\"{\"balance\":\"18446744073709551615\"}\"#).unwrap();\n    println!(\"{a:?}\");\n    println!(\"{}\", serde_json::to_string(&a).unwrap()); // {\"balance\":\"18446744073709551615\"}\n    println!(\"{}\", serde_json::from_str::<Account>(r#\"{\"balance\":\"12x\"}\"#).unwrap_err());\n}",
      "language": "rust"
    }
  ];

  mistakes: CommonMistake[] = [
    {
      "title": "Expecting a non-Option field to be optional",
      "wrong": "#[derive(Deserialize)]\nstruct Config { port: u16, verbose: bool }\n// {\"port\": 8080}  ->  Error(\"missing field `verbose`\")",
      "right": "#[derive(Deserialize)]\nstruct Config {\n    port: u16,\n    #[serde(default)]          // false when missing\n    verbose: bool,\n}",
      "explanation": "Deserialize requires every non-Option field unless you opt in to #[serde(default)] — implementing Default on the type is not enough on its own."
    },
    {
      "title": "Typos in config files silently ignored",
      "wrong": "#[derive(Deserialize)]\nstruct Config { #[serde(default)] max_connections: u32 }\n// {\"max_conections\": 500} parses fine and max_connections stays 0",
      "right": "#[derive(Deserialize)]\n#[serde(deny_unknown_fields)]\nstruct Config { #[serde(default)] max_connections: u32 }\n// error: unknown field `max_conections`, expected `max_connections`",
      "explanation": "Unknown keys are ignored by default. For config files, deny_unknown_fields turns a typo into a clear error instead of a silently ignored setting."
    },
    {
      "title": "Using untagged enums for API payloads",
      "wrong": "#[derive(Deserialize)]\n#[serde(untagged)]\nenum Msg { Ping { id: u64 }, Ack { id: u64 } }\n// {\"id\": 1} always becomes Ping — Ack is unreachable",
      "right": "#[derive(Deserialize)]\n#[serde(tag = \"type\")]\nenum Msg { Ping { id: u64 }, Ack { id: u64 } }\n// {\"type\": \"Ack\", \"id\": 1}",
      "explanation": "Untagged enums pick the first variant whose shape matches. Variants with the same fields are indistinguishable, and failures produce vague \"did not match any variant\" errors. Prefer an explicit tag."
    },
    {
      "title": "Leaking secrets through Serialize",
      "wrong": "#[derive(Serialize)]\nstruct User { email: String, password_hash: String, api_key: String }\n// Json(user) sends the hash and key to the client",
      "right": "#[derive(Serialize)]\nstruct User {\n    email: String,\n    #[serde(skip)] password_hash: String,\n    #[serde(skip)] api_key: String,\n}\n// better still: a separate UserResponse type",
      "explanation": "Deriving Serialize on an internal entity exposes every field. Skip secrets explicitly, or serialize a dedicated response type so new internal fields are never exposed by accident."
    },
    {
      "title": "Parsing everything into serde_json::Value",
      "wrong": "let v: Value = serde_json::from_str(body)?;\nlet total = v[\"items\"][0][\"price\"].as_f64().unwrap_or(0.0); // silent 0.0 on a typo",
      "right": "#[derive(Deserialize)] struct Item { price: f64 }\n#[derive(Deserialize)] struct Order { items: Vec<Item> }\nlet order: Order = serde_json::from_str(body)?; // shape checked once",
      "explanation": "Indexing a Value returns Null for anything missing, so typos become silent defaults. Typed structs give real errors and compile-time field names; keep Value for genuinely dynamic data."
    }
  ];

  challenge: Challenge = {
    "title": "Parse a mixed event stream",
    "language": "rust",
    "description": "Each line of input is a JSON event: {\"type\":\"login\",\"user\":\"ada\"}, {\"type\":\"purchase\",\"user\":\"ada\",\"amountCents\":1250} or {\"type\":\"logout\",\"user\":\"ada\"}. Define an internally tagged enum (snake_case tags, camelCase fields), parse each line, skip and count invalid lines, and return the total purchase amount per user in a BTreeMap.",
    "hints": [
      "#[serde(tag = \"type\", rename_all = \"snake_case\")] on the enum, and #[serde(rename_all = \"camelCase\")] on the purchase variant to read amountCents.",
      "serde_json::from_str::<Event>(line) returns a Result — match on it to count failures.",
      "BTreeMap gives deterministic output order."
    ],
    "starterCode": "use std::collections::BTreeMap;\nuse serde::Deserialize;\n\n// TODO: enum Event\n\nfn totals(input: &str) -> (BTreeMap<String, u64>, usize) {\n    todo!()\n}\n\nfn main() {\n    let input = r#\"{\"type\":\"login\",\"user\":\"ada\"}\n{\"type\":\"purchase\",\"user\":\"ada\",\"amountCents\":1250}\n{\"type\":\"purchase\",\"user\":\"bob\",\"amountCents\":300}\nnot json\n{\"type\":\"purchase\",\"user\":\"ada\",\"amountCents\":50}\n{\"type\":\"refund\",\"user\":\"bob\"}\"#;\n    println!(\"{:?}\", totals(input));\n}",
    "solution": "use std::collections::BTreeMap;\nuse serde::Deserialize;\n\n#[derive(Debug, Deserialize)]\n#[serde(tag = \"type\", rename_all = \"snake_case\")]\nenum Event {\n    Login { user: String },\n    #[serde(rename_all = \"camelCase\")]\n    Purchase { user: String, amount_cents: u64 },\n    Logout { user: String },\n}\n\nfn totals(input: &str) -> (BTreeMap<String, u64>, usize) {\n    let mut sums = BTreeMap::new();\n    let mut invalid = 0;\n    for line in input.lines() {\n        match serde_json::from_str::<Event>(line) {\n            Ok(Event::Purchase { user, amount_cents }) => *sums.entry(user).or_insert(0) += amount_cents,\n            Ok(_) => {}\n            Err(_) => invalid += 1,\n        }\n    }\n    (sums, invalid)\n}\n\nfn main() {\n    let input = r#\"{\"type\":\"login\",\"user\":\"ada\"}\n{\"type\":\"purchase\",\"user\":\"ada\",\"amountCents\":1250}\n{\"type\":\"purchase\",\"user\":\"bob\",\"amountCents\":300}\nnot json\n{\"type\":\"purchase\",\"user\":\"ada\",\"amountCents\":50}\n{\"type\":\"refund\",\"user\":\"bob\"}\"#;\n    println!(\"{:?}\", totals(input));\n    // ({\"ada\": 1300, \"bob\": 300}, 2)\n}"
  };

  quiz: QuizQuestion[] = [
    {
      "q": "What happens by default when JSON contains a key the struct does not have?",
      "options": [
        "Deserialization fails",
        "The key is ignored",
        "It is stored in a hidden map",
        "It panics"
      ],
      "answer": 1,
      "explanation": "Serde ignores unknown fields unless the type has #[serde(deny_unknown_fields)]."
    },
    {
      "q": "How does an internally tagged enum #[serde(tag = \"type\")] serialize Shape::Circle { r: 1.0 }?",
      "options": [
        "{\"Circle\":{\"r\":1.0}}",
        "{\"type\":\"Circle\",\"r\":1.0}",
        "{\"t\":\"Circle\",\"c\":{\"r\":1.0}}",
        "{\"r\":1.0}"
      ],
      "answer": 1,
      "explanation": "Internal tagging puts the variant name in the given field alongside the variant fields. The first option is the default external tagging; the third is adjacent tagging; the last is untagged."
    },
    {
      "q": "A struct field count: u32 is missing from the JSON. What makes deserialization succeed with 0?",
      "options": [
        "impl Default for the struct",
        "#[serde(default)] on the field (or struct)",
        "#[serde(skip_serializing_if)]",
        "Nothing, u32 defaults automatically"
      ],
      "answer": 1,
      "explanation": "#[serde(default)] tells serde to use Default::default() when the field is absent. Implementing Default alone does not change deserialization."
    },
    {
      "q": "Why can one #[derive(Serialize)] work for JSON, TOML and bincode?",
      "options": [
        "Serde uses runtime reflection",
        "Types serialize into an abstract data model that each format crate maps to bytes",
        "Each format re-parses Rust source",
        "It does not; you need one derive per format"
      ],
      "answer": 1,
      "explanation": "Serialize targets serde's data model; the format crate implements a Serializer that turns that model into its own syntax."
    },
    {
      "q": "What is the main risk of #[serde(untagged)]?",
      "options": [
        "It is slow to compile",
        "Variants with overlapping shapes are ambiguous and errors are vague",
        "It cannot deserialize",
        "It only works with numbers"
      ],
      "answer": 1,
      "explanation": "Serde picks the first variant that fits, so ambiguous shapes silently map to the wrong variant and failures report only that no variant matched."
    }
  ];

  qna: QnaItem[] = [
    {
      "q": "How does serde achieve both speed and type safety?",
      "a": "The derive macros generate concrete <code>Serialize</code>/<code>Deserialize</code> implementations at compile time, so there is no reflection or runtime schema lookup, and monomorphisation specialises the code for each format. Deserialization is driven by the target type, so the result is either a fully valid value or a <code>Result::Err</code> with the location of the problem — never a half-filled object."
    },
    {
      "q": "Which enum representation would you choose for an event API, and why?",
      "a": "Usually internally tagged (<code>#[serde(tag = \"type\")]</code>): the payload stays flat (<code>{\"type\":\"order_placed\",\"id\":1}</code>), it reads naturally in other languages and logs, and adding a variant is backwards compatible for consumers that ignore unknown types. Adjacent tagging is useful when variants contain non-struct data; untagged is best reserved for \"string or number\" style inputs."
    },
    {
      "q": "How do you validate data during deserialization?",
      "a": "Wrap the value in a newtype and use <code>#[serde(try_from = \"String\")]</code> (or another source type) with a <code>TryFrom</code> implementation that returns an error for invalid input. The invalid value can then never exist in your program, and the error flows back through <code>serde_json::Error</code> with its position. For whole-struct rules, validate after parsing or use a crate such as <code>validator</code>."
    },
    {
      "q": "When do you write a manual Deserialize implementation?",
      "a": "Rarely — for formats that do not map onto a struct shape, for streaming or zero-copy parsing tricks, or for very custom error messages. Most needs are covered by attributes: <code>rename</code>, <code>default</code>, <code>flatten</code>, <code>with</code>/<code>deserialize_with</code> for one field, <code>try_from</code>/<code>from</code> for conversions. A manual impl requires a <code>Visitor</code> and is significantly more code to maintain."
    },
    {
      "q": "What is the difference between serde_json::Value and a typed struct?",
      "a": "<code>Value</code> represents any JSON document dynamically: flexible, but every access is unchecked and missing data turns into <code>Null</code>. A typed struct validates shape and types once at the boundary and gives compile-time field names afterwards. Use <code>Value</code> for passthrough or truly dynamic data, and convert sub-trees into types with <code>serde_json::from_value</code> as soon as you know their shape."
    }
  ];

  revision: RevisionSummary = {
    "oneLiner": "Derive Serialize/Deserialize, shape the wire format with attributes, pick an explicit enum tag, and reach for custom code only when attributes cannot express the format.",
    "mustKnow": [
      "Serde = data model + format crates; one derive works for JSON, TOML, YAML, bincode.",
      "<code>rename_all</code>, <code>rename</code>, <code>default</code>, <code>skip</code>, <code>skip_serializing_if</code>, <code>flatten</code> cover most mappings.",
      "Missing non-Option fields are errors unless <code>#[serde(default)]</code>.",
      "Unknown fields are ignored unless <code>deny_unknown_fields</code>.",
      "Enum styles: external (default), internal <code>tag</code>, adjacent <code>tag</code>+<code>content</code>, <code>untagged</code>.",
      "<code>try_from</code> / <code>with</code> handle validation and custom field formats."
    ],
    "interviewFocus": [
      "Explain serde's data-model design and why it needs no reflection.",
      "Choose an enum representation for an API and justify it.",
      "Show how to validate input during deserialization."
    ]
  };
}
