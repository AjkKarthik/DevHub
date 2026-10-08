module.exports = {
  slug: 'modules-cargo',
  subtitle: 'Organise code with crates and modules, control visibility with pub, and manage dependencies, features and multi-crate workspaces with Cargo.',
  readingTime: 20,
  apis: ['mod / use / pub', 'pub(crate)', 'crate:: / super::', 'Cargo.toml [dependencies]', '[features]', '[workspace]'],
  tip: 'Keep a small public API: make items pub(crate) by default and promote them to pub only when another crate genuinely needs them. A smaller surface means fewer breaking changes when you publish.',
  gotchas: [
    'Writing a file src/util.rs does nothing until some parent module declares mod util; — modules are declared, not discovered.',
    'Cargo features must be additive: because features are unified across the dependency graph, enabling one must never remove functionality.',
    'Version "1.2" in Cargo.toml means ^1.2 (>=1.2.0, <2.0.0), not exactly 1.2 — use "=1.2.0" to pin.',
  ],
  quickRef: [
    { name: 'mod network;', type: 'keyword', desc: 'Declare a module whose body lives in network.rs or network/mod.rs' },
    { name: 'pub / pub(crate) / pub(super)', type: 'keyword', desc: 'Visibility: everywhere / this crate / parent module. Items are private by default' },
    { name: 'use crate::db::Pool;', type: 'keyword', desc: 'Bring a path into scope; crate:: is the crate root, super:: the parent, self:: the current module' },
    { name: 'pub use inner::Thing;', type: 'keyword', desc: 'Re-export to shape a flatter public API' },
    { name: 'cargo add serde --features derive', type: 'function', desc: 'Add a dependency with features to Cargo.toml' },
    { name: 'serde = "1.0"', type: 'syntax', desc: 'Caret requirement: any compatible 1.x version at or above 1.0.0' },
    { name: '[features] default = ["json"]', type: 'syntax', desc: 'Optional, additive functionality compiled in with --features' },
    { name: '[workspace] members = [...]', type: 'syntax', desc: 'Several crates sharing one Cargo.lock and target directory' },
    { name: 'cargo tree / cargo update', type: 'function', desc: 'Inspect the dependency graph / update Cargo.lock within requirements' },
  ],
  theory: [
    { heading: 'Packages, crates and modules', points: [
      'A package is a directory with a `Cargo.toml`. It contains at most one library crate (`src/lib.rs`) and any number of binary crates (`src/main.rs`, `src/bin/*.rs`).',
      'A crate is the unit of compilation. Inside it, modules form a tree rooted at `lib.rs` or `main.rs`.',
      '`mod name;` declares a child module and tells the compiler to load it from `name.rs` (or the older `name/mod.rs`). A file that is never declared is never compiled.',
      'Inline modules (`mod tests { ... }`) are common for unit tests, typically with `#[cfg(test)]` so they are compiled only for `cargo test`.',
    ] },
    { heading: 'Visibility and paths', points: [
      'Everything is private to its module by default. `pub` exposes an item to the parent and beyond; `pub(crate)` limits it to the crate; `pub(super)` to the parent module.',
      'A child module can see private items of its ancestors, but a parent cannot see a child\'s private items.',
      'For structs, the struct and each field have separate visibility. A struct with private fields cannot be built outside its module — a common way to force validation through a constructor.',
      'Enum variants inherit the enum\'s visibility: a `pub enum` exposes all its variants.',
      'Paths start at the crate root (`crate::`), the parent (`super::`) or the current module (`self::`). `pub use` re-exports items so users see a tidy API (`mylib::Client` instead of `mylib::net::http::client::Client`).',
    ] },
    { heading: 'Dependencies and versions', points: [
      'Dependencies are listed in `[dependencies]` and come from crates.io by default (git and path dependencies are also possible). `[dev-dependencies]` are only for tests, benches and examples.',
      'Cargo uses Semantic Versioning: a requirement like `"1.4"` means `^1.4`, any version `>=1.4.0, <2.0.0`. For 0.x crates the caret is stricter: `"0.3"` means `>=0.3.0, <0.4.0`.',
      '`Cargo.lock` records the exact versions resolved, giving reproducible builds. Commit it for applications; Cargo\'s current guidance is that libraries may commit it too, since it only affects builds of the library itself.',
      'Features are optional, additive pieces of a crate (`serde = { version = "1", features = ["derive"] }`, `default-features = false`). Cargo unifies features across the whole dependency graph, so they must never remove functionality.',
      'With the 2024 edition the default resolver is version 3, which prefers dependency versions compatible with your declared `rust-version` (MSRV).',
    ] },
    { heading: 'Workspaces', points: [
      'A workspace groups several packages in one repository. Members share one `Cargo.lock` and one `target/` directory, so common dependencies compile once.',
      'Shared versions can be declared once under `[workspace.dependencies]` and referenced from members with `serde.workspace = true`.',
      'A typical layout splits an application into a library crate (domain logic, easy to test) and thin binary crates (CLI, server) that depend on it.',
      'Commands accept `-p <package>` to target a member, and `cargo test --workspace` runs every member\'s tests.',
    ] },
  ],
  codeTabs: [
    { label: 'Module tree (one file)', language: 'rust', code: `// Inline modules show the same rules as separate files would.
mod shop {
    pub mod catalog {
        #[derive(Debug)]
        pub struct Product {
            pub name: String,
            price_cents: u64,           // private field
        }

        impl Product {
            // The only way to build a Product outside this module
            pub fn new(name: &str, price_cents: u64) -> Option<Product> {
                (price_cents > 0).then(|| Product { name: name.into(), price_cents })
            }
            pub fn price(&self) -> u64 { self.price_cents }
        }

        pub(crate) fn tax_rate() -> f64 { 0.2 }   // crate-visible only
    }

    pub mod checkout {
        use super::catalog::{self, Product};    // relative path via super

        pub fn total(items: &[Product]) -> f64 {
            let net: u64 = items.iter().map(|p| p.price()).sum();
            net as f64 * (1.0 + catalog::tax_rate()) / 100.0
        }
    }

    // Re-export so users write shop::Product
    pub use catalog::Product;
}

use shop::{checkout::total, Product};

fn main() {
    let items = vec![Product::new("book", 1500).unwrap(), Product::new("pen", 250).unwrap()];
    // Product { name: "x".into(), price_cents: 1 }  // error: field is private
    println!("{} items, total {:.2}", items.len(), total(&items));
    println!("{:?}", Product::new("free", 0));
}` },
    { label: 'Cargo.toml', language: 'bash', code: `[package]
name = "orders"
version = "0.3.1"
edition = "2024"
rust-version = "1.85"          # minimum supported Rust version

[dependencies]
serde = { version = "1", features = ["derive"] }   # ^1: >=1.0.0, <2.0.0
tokio = { version = "1.40", features = ["rt-multi-thread", "macros"] }
reqwest = { version = "0.12", default-features = false, features = ["json", "rustls-tls"] }
my-utils = { path = "../my-utils" }                # local crate

[dev-dependencies]
proptest = "1"

[features]
default = ["json"]
json = []                      # additive feature with no extra deps
metrics = ["dep:prometheus"]   # enables an optional dependency

[dependencies.prometheus]
version = "0.13"
optional = true

[profile.release]
lto = "thin"
codegen-units = 1` },
    { label: 'Workspace', language: 'bash', code: `# repo/Cargo.toml (workspace root)
[workspace]
resolver = "3"
members = ["crates/core", "crates/cli", "crates/server"]

[workspace.dependencies]
serde = { version = "1", features = ["derive"] }
anyhow = "1"

# crates/cli/Cargo.toml
[package]
name = "orders-cli"
version = "0.1.0"
edition = "2024"

[dependencies]
orders-core = { path = "../core" }
serde.workspace = true         # inherit version + features from the root
anyhow.workspace = true

# Commands
cargo build --workspace
cargo test -p orders-core
cargo run -p orders-cli -- --help
cargo tree -i serde            # who depends on serde?` },
  ],
  mistakes: [
    { title: 'Creating a file but never declaring the module', wrong: `// src/helpers.rs exists...
// src/main.rs
fn main() { helpers::greet(); } // error: failed to resolve: use of undeclared crate or module`, right: `// src/main.rs
mod helpers;
fn main() { helpers::greet(); }`, explanation: 'Rust has no automatic file discovery. Each module must be declared with mod name; in its parent; only then is name.rs compiled.' },
    { title: 'Forgetting pub on items or fields', checkWrong: true, wrapFn: true, wrong: `mod config {
    pub struct Settings { port: u16 }
}
let s = config::Settings { port: 8080 };`, right: `mod config {
    pub struct Settings { pub port: u16 }
}
let s = config::Settings { port: 8080 };`, explanation: 'A pub struct can still have private fields; constructing it outside the module fails (E0451). Make the field pub, or provide a pub constructor if you want to validate input.' },
    { title: 'Non-additive features', wrong: `[features]
no-std = []   # #[cfg(feature = "no-std")] removes std support`, right: `[features]
default = ["std"]
std = []      # #[cfg(feature = "std")] adds std support`, explanation: 'Cargo enables the union of all features requested anywhere in the dependency graph. A feature that removes functionality can break another crate that did not ask for it. Model "off" as the absence of an additive feature.' },
    { title: 'Exposing deep module paths as the public API', wrong: `// users must write
use mylib::transport::http::client::builder::ClientBuilder;`, right: `// lib.rs
pub use transport::http::client::builder::ClientBuilder;
// users write: use mylib::ClientBuilder;`, explanation: 'Internal layout changes then become breaking changes for users. Re-export the important types at the crate root and keep the internal tree private.' },
  ],
  challenge: {
    title: 'Encapsulate a validated type in a module',
    language: 'rust',
    description: 'Create a module accounts containing pub struct Email(String) with a private field and pub fn parse(s: &str) -> Result<Email, String> that accepts only strings with exactly one "@" and a "." after it; add pub fn as_str(&self) -> &str. Inside accounts add a nested module internal with a pub(super) helper domain_of(e: &str) -> &str used by a pub method Email::domain(&self). In main, show that Email can only be created through parse.',
    hints: ['Tuple-struct fields are private unless written pub, so Email(String) cannot be built outside the module.', 'pub(super) makes internal::domain_of visible to accounts but not to main.', 'split_once(\'@\') gives you (user, domain).'],
    starterCode: `mod accounts {
    pub struct Email(String);

    impl Email {
        pub fn parse(s: &str) -> Result<Email, String> { todo!() }
        pub fn as_str(&self) -> &str { todo!() }
        pub fn domain(&self) -> &str { todo!() }
    }

    mod internal {
        // pub(super) fn domain_of(...)
    }
}

fn main() {}`,
    solution: `mod accounts {
    #[derive(Debug)]
    pub struct Email(String);

    impl Email {
        pub fn parse(s: &str) -> Result<Email, String> {
            let (user, domain) = s.split_once('@').ok_or("missing @")?;
            if user.is_empty() || domain.contains('@') || !domain.contains('.') {
                return Err(format!("invalid email: {s}"));
            }
            Ok(Email(s.to_string()))
        }
        pub fn as_str(&self) -> &str { &self.0 }
        pub fn domain(&self) -> &str { internal::domain_of(&self.0) }
    }

    mod internal {
        pub(super) fn domain_of(e: &str) -> &str {
            e.split_once('@').map(|(_, d)| d).unwrap_or("")
        }
    }
}

use accounts::Email;

fn main() {
    // let e = Email("x".into());   // error: tuple field is private
    let e = Email::parse("ada@example.org").unwrap();
    println!("{} @ {}", e.as_str(), e.domain());
    for bad in ["no-at", "a@b", "a@@b.c", "@x.io"] {
        println!("{bad}: {:?}", Email::parse(bad).map(|e| e.as_str().to_string()));
    }
}`,
  },
  quiz: [
    { q: 'You add src/report.rs but main.rs cannot see it. Why?', options: ['Files must be in src/bin', 'No parent module declares mod report;', 'It needs pub fn main', 'Cargo.toml must list it'], answer: 1, explanation: 'Modules are only compiled when declared with mod in their parent module.' },
    { q: 'What does pub(crate) mean?', options: ['Visible to dependents on crates.io', 'Visible anywhere inside the current crate only', 'Visible only to the parent module', 'Private'], answer: 1, explanation: 'pub(crate) exposes an item to the whole crate but not to other crates that depend on it.' },
    { q: 'Which versions satisfy the requirement serde = "1.0.150"?', options: ['Exactly 1.0.150', '>=1.0.150, <2.0.0', '>=1.0.0, <1.1.0', 'Any version'], answer: 1, explanation: 'Cargo requirements default to caret semantics: compatible updates within the same major version.' },
    { q: 'Why must Cargo features be additive?', options: ['crates.io rejects other features', 'Features are unified across the dependency graph, so enabling one anywhere enables it for everyone', 'Features are compiled in alphabetical order', 'Only default features are used'], answer: 1, explanation: 'If two crates depend on the same library with different features, Cargo builds it once with the union. A feature that removed code would break crates that expected it.' },
    { q: 'What do workspace members share?', options: ['Only the git repository', 'One Cargo.lock and one target directory', 'A single crate root', 'The same package name'], answer: 1, explanation: 'Members are separate packages but share dependency resolution (Cargo.lock) and build output, so shared dependencies compile once.' },
  ],
  qna: [
    { q: 'What is the difference between a package, a crate and a module?', a: 'A package is what `Cargo.toml` describes: a name, a version and dependencies. It produces crates — at most one library and any number of binaries. A crate is one compilation unit with a module tree rooted at `lib.rs` or `main.rs`. Modules organise code and control privacy inside a crate.' },
    { q: 'How does visibility work in Rust?', a: 'Items are private to the module that defines them (and its descendants) unless marked `pub`. Restricted forms `pub(crate)`, `pub(super)` and `pub(in path)` limit visibility to a subtree. Struct fields have their own visibility, so you can expose a type while keeping its fields private and forcing construction through a validating constructor.' },
    { q: 'Should Cargo.lock be committed?', a: 'For applications, always: it makes builds and deployments reproducible. Cargo\'s guidance changed in 2023 so that libraries may commit it as well — it pins versions for the library\'s own CI and development, while downstream users still resolve dependencies themselves because a library\'s lock file is ignored when it is used as a dependency.' },
    { q: 'What are Cargo features and how should you design them?', a: 'Features are named flags that enable optional code (`#[cfg(feature = "json")]`) and optional dependencies (`dep:serde_json`). Users opt in with `features = [...]` or opt out of defaults with `default-features = false`. Because Cargo unifies features across the graph, design them to be additive and independent, keep the default set small and useful, and test feature combinations in CI.' },
    { q: 'Why split an application into a workspace?', a: 'Separating a library crate with the domain logic from thin binary crates (CLI, server, workers) gives clear boundaries, faster incremental builds (unchanged crates are not recompiled), and easier testing because logic is not tangled with I/O. A workspace keeps versions consistent through one `Cargo.lock` and `[workspace.dependencies]`.' },
  ],
  revision: {
    oneLiner: 'Packages contain crates, crates contain a module tree, everything is private by default, and Cargo resolves SemVer dependencies, additive features and workspaces.',
    mustKnow: [
      '`mod name;` declares a module from `name.rs`; undeclared files are not compiled.',
      'Private by default; `pub`, `pub(crate)`, `pub(super)`; fields have their own visibility.',
      '`crate::`, `super::`, `self::` paths; `pub use` re-exports a clean API.',
      'Requirements use caret semantics (`"1.4"` = `>=1.4.0, <2.0.0`).',
      'Features are unified across the graph and must be additive.',
      'Workspaces share `Cargo.lock` and `target/`; `[workspace.dependencies]` centralises versions.',
    ],
    interviewFocus: [
      'Explain package vs crate vs module.',
      'Use private fields plus a constructor to enforce invariants.',
      'Explain SemVer caret requirements and Cargo.lock.',
      'Explain why features must be additive.',
    ],
  },
};
