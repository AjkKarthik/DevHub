module.exports = {
  slug: 'web-frameworks',
  subtitle: 'Axum 0.8 on Tokio, hyper and tower: routers, async handlers, extractors, shared State, IntoResponse and middleware layers, plus how Axum compares with Actix Web.',
  readingTime: 26,
  prerequisites: [
    { label: 'Async/Await', route: '/rust/async-await' },
    { label: 'Traits & Generics', route: '/rust/traits-generics' },
  ],
  apis: ['Router::route / nest / merge', 'Path / Query / Json / State', 'IntoResponse', 'FromRequestParts', 'axum::serve', 'tower-http layers'],
  tip: 'Read handler compile errors from the extractor list: every argument except the last must implement FromRequestParts, and the last may consume the body. Enabling the macros feature and adding #[debug_handler] turns the generic "Handler is not implemented" error into a precise message.',
  gotchas: [
    'Axum 0.8 changed path captures from /:id to /{id} and wildcards from /*rest to /{*rest}. The old syntax compiles but the router panics when the route is added.',
    'Body-consuming extractors (Json, Form, String, Bytes) must be the last handler argument, otherwise the handler does not implement Handler.',
    'A std::sync::MutexGuard held across .await makes the handler future !Send, and axum refuses it. Drop the guard before awaiting or use tokio::sync::Mutex.',
  ],
  quickRef: [
    { name: 'Router::new().route("/users/{id}", get(h))', type: 'function', desc: 'Map a path and method to a handler; captures use {name} since 0.8' },
    { name: 'async fn h(...) -> impl IntoResponse', type: 'function', desc: 'A handler: extractor arguments in, anything IntoResponse out' },
    { name: 'Path<T> / Query<T>', type: 'type', desc: 'Deserialize path captures and the query string with serde' },
    { name: 'Json<T>', type: 'type', desc: 'Extractor that parses the body (must be last) and a response that serializes T' },
    { name: 'State<S> + .with_state(s)', type: 'type', desc: 'Shared application state; S must be Clone (wrap expensive parts in Arc)' },
    { name: '(StatusCode, Json<T>)', type: 'syntax', desc: 'Tuples combine a status, headers and a body into one response' },
    { name: 'impl FromRequestParts<S>', type: 'interface', desc: 'Write a custom extractor (native async fn since 0.8, no #[async_trait])' },
    { name: '.layer(TraceLayer::new_for_http())', type: 'method', desc: 'Wrap routes in tower middleware; the last .layer call runs first' },
    { name: 'axum::serve(listener, app)', type: 'function', desc: 'Serve a Router on a tokio::net::TcpListener' },
    { name: 'app.oneshot(request)', type: 'method', desc: 'tower::ServiceExt: call the router in tests without a socket' },
  ],
  theory: [
    { heading: 'What Axum is made of', points: [
      'Axum is a thin routing and extraction layer maintained by the Tokio team. Tokio runs the tasks, hyper speaks HTTP/1 and HTTP/2, and tower supplies the `Service` and `Layer` abstractions that middleware is built from.',
      'A `Router` is itself a tower `Service`, so anything written for tower (timeouts, rate limits, tracing, compression, CORS from `tower-http`) plugs straight in.',
      'Handlers are plain `async fn`s. There are no handler traits to implement and no macros on the handler: axum implements `Handler` for any async function whose arguments are extractors and whose return type implements `IntoResponse`.',
      'Axum 0.8 (January 2025) changed the path syntax to `/{id}` and `/{*rest}`, removed `#[async_trait]` from `FromRequestParts`/`FromRequest` in favour of native async trait methods, and made `Option<T>` extraction require the new `OptionalFromRequestParts` trait.',
    ] },
    { heading: 'Extractors', points: [
      'An extractor pulls one piece of the request apart: `Path<T>`, `Query<T>`, `HeaderMap`, `Method`, `State<S>`, `Json<T>`, `Form<T>`, `String`, `Bytes`. If extraction fails, axum returns the extractor rejection (for example 400 or 422) and the handler never runs.',
      '`Path` and `Query` deserialize with serde, so `Path<u32>`, `Path<(String, u32)>` or a struct with `#[derive(Deserialize)]` all work.',
      'Extractors that only read the request head implement `FromRequestParts`. Extractors that consume the body implement `FromRequest`, and only one of those can run — that is why the body extractor must be the last argument.',
      'Wrapping an extractor in `Result<Json<T>, JsonRejection>` lets you handle the rejection yourself, for example to return your own error format.',
    ] },
    { heading: 'Responses', points: [
      'Anything that implements `IntoResponse` can be returned: `&str`, `String`, `StatusCode`, `Json<T>`, `Html<T>`, `Redirect`, and tuples that add a status code and headers in front of a body.',
      'Return `Result<T, E>` where both sides implement `IntoResponse` to use `?` in handlers. The usual pattern is one `AppError` enum with an `IntoResponse` impl that maps each variant to a status code (see the REST APIs page).',
      'When one handler returns different response types on different branches, call `.into_response()` on each so they share the concrete `Response` type.',
    ] },
    { heading: 'State and middleware', points: [
      '`Router::with_state(state)` provides a value that handlers receive through `State<S>`. axum clones it for every request, so keep it cheap to clone: put the database pool, configuration and caches behind an `Arc`.',
      'Mutable shared data needs interior mutability: `Arc<Mutex<T>>` or `Arc<RwLock<T>>`. A `std::sync::Mutex` is fine as long as the guard is dropped before any `.await`; use `tokio::sync::Mutex` only when you must hold the lock across an await.',
      '`.layer(L)` wraps every route added before it. Each additional `.layer` call wraps the previous result, so the layer added last is the outermost and sees the request first. `tower::ServiceBuilder` lists layers in top-to-bottom execution order instead.',
      '`route_layer` applies middleware only to matched routes (useful for authentication, so unknown paths still return 404 instead of 401). `axum::middleware::from_fn` turns an async function into a layer.',
    ] },
    { heading: 'Axum vs Actix Web', points: [
      'Both are fast, mature and production-ready; the measured difference in typical services is dominated by your database and serialization, not the framework.',
      'Actix Web runs one single-threaded Tokio runtime per worker thread, so handler futures do not need to be `Send`. Axum runs on the normal multi-threaded Tokio runtime, so handler futures must be `Send` — the source of the MutexGuard-across-await error.',
      'Actix Web has its own middleware and service traits; Axum reuses the tower ecosystem, which is also used by tonic (gRPC) and hyper-based clients.',
      'Pick Axum when you want plain async functions, tower middleware and close alignment with the Tokio ecosystem; Actix Web remains a good choice with a large existing ecosystem of its own.',
    ] },
  ],
  codeTabs: [
    { label: 'Router & server', language: 'rust', run: false, code: `use axum::{Router, routing::get};

async fn root() -> &'static str {
    "hello from axum"
}

async fn health() -> &'static str {
    "ok"
}

#[tokio::main]
async fn main() {
    let api = Router::new().route("/health", get(health));

    let app = Router::new()
        .route("/", get(root))
        .nest("/api", api);            // /api/health

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
    println!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}` },
    { label: 'Extractors & responses', language: 'rust', code: `use axum::{
    Json, Router,
    body::Body,
    extract::{Path, Query},
    http::{Request, StatusCode},
    response::IntoResponse,
    routing::{get, post},
};
use http_body_util::BodyExt;
use serde::{Deserialize, Serialize};
use tower::ServiceExt; // for oneshot

#[derive(Deserialize)]
struct Paging { page: Option<u32> }

#[derive(Deserialize)]
struct NewUser { name: String }

#[derive(Serialize)]
struct User { id: u32, name: String }

async fn get_user(Path(id): Path<u32>, Query(p): Query<Paging>) -> String {
    format!("user {id}, page {}", p.page.unwrap_or(1))
}

// Json body extractor is the LAST argument
async fn create_user(Json(input): Json<NewUser>) -> impl IntoResponse {
    (StatusCode::CREATED, Json(User { id: 7, name: input.name }))
}

async fn call(app: Router, req: Request<Body>) -> (StatusCode, String) {
    let res = app.oneshot(req).await.unwrap();
    let status = res.status();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    (status, String::from_utf8(bytes.to_vec()).unwrap())
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/users/{id}", get(get_user))
        .route("/users", post(create_user));

    let r = Request::get("/users/42?page=3").body(Body::empty()).unwrap();
    println!("{:?}", call(app.clone(), r).await);
    // (200, "user 42, page 3")

    let r = Request::get("/users/abc").body(Body::empty()).unwrap();
    println!("{:?}", call(app.clone(), r).await.0); // 400: Path rejection

    let r = Request::post("/users")
        .header("content-type", "application/json")
        .body(Body::from(r#"{"name":"ada"}"#))
        .unwrap();
    println!("{:?}", call(app.clone(), r).await);
    // (201, "{\\"id\\":7,\\"name\\":\\"ada\\"}")

    let r = Request::post("/users")
        .header("content-type", "application/json")
        .body(Body::from(r#"{"nme":"ada"}"#))
        .unwrap();
    println!("{:?}", call(app, r).await.0); // 422: missing field
}` },
    { label: 'State & layers', language: 'rust', code: `use std::sync::{Arc, Mutex};

use axum::{
    Router,
    body::Body,
    extract::State,
    http::Request,
    routing::{get, post},
};
use tower::ServiceExt;
use tower_http::trace::TraceLayer;

#[derive(Clone, Default)]
struct AppState {
    hits: Arc<Mutex<u64>>, // cheap to clone: just an Arc
}

async fn hit(State(state): State<AppState>) -> String {
    let n = {
        let mut hits = state.hits.lock().unwrap();
        *hits += 1;
        *hits
    }; // guard dropped here, before any .await
    format!("hit #{n}")
}

async fn count(State(state): State<AppState>) -> String {
    state.hits.lock().unwrap().to_string()
}

#[tokio::main]
async fn main() {
    let state = AppState::default();
    let app = Router::new()
        .route("/hit", post(hit))
        .route("/count", get(count))
        .layer(TraceLayer::new_for_http())
        .with_state(state.clone());

    for _ in 0..3 {
        let req = Request::post("/hit").body(Body::empty()).unwrap();
        app.clone().oneshot(req).await.unwrap();
    }
    println!("hits = {}", state.hits.lock().unwrap()); // hits = 3
}` },
    { label: 'Custom extractor', language: 'rust', code: `use axum::{
    Router,
    body::Body,
    extract::FromRequestParts,
    http::{Request, StatusCode, request::Parts},
    routing::get,
};
use tower::ServiceExt;

struct ApiKey(String);

// Axum 0.8: a native async fn, no #[async_trait]
impl<S: Send + Sync> FromRequestParts<S> for ApiKey {
    type Rejection = (StatusCode, &'static str);

    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, Self::Rejection> {
        parts
            .headers
            .get("x-api-key")
            .and_then(|v| v.to_str().ok())
            .map(|k| ApiKey(k.to_string()))
            .ok_or((StatusCode::UNAUTHORIZED, "missing x-api-key"))
    }
}

async fn secret(ApiKey(key): ApiKey) -> String {
    format!("welcome, key ending {}", &key[key.len() - 2..])
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/secret", get(secret));

    let ok = Request::get("/secret").header("x-api-key", "abc123").body(Body::empty()).unwrap();
    println!("{}", app.clone().oneshot(ok).await.unwrap().status()); // 200 OK

    let no = Request::get("/secret").body(Body::empty()).unwrap();
    println!("{}", app.oneshot(no).await.unwrap().status());         // 401 Unauthorized
}` },
  ],
  mistakes: [
    { title: 'Using the pre-0.8 :id path syntax', wrong: `Router::new().route("/users/:id", get(get_user))
// panics when the route is added in axum 0.8`, right: `Router::new().route("/users/{id}", get(get_user))
// wildcards: "/files/{*path}"`, explanation: 'Axum 0.8 switched to {capture} syntax. The old :id form still compiles but Router::route panics with "Path segments must not start with `:`. For capture groups, use `{capture}`" as soon as the router is built.' },
    { title: 'Putting the Json extractor before another argument', checkWrong: true, prelude: `use axum::{Json, Router, extract::Path, routing::post};
#[derive(serde::Deserialize)] struct NewUser { name: String }
fn app() -> Router {`, wrong: `async fn create(Json(u): Json<NewUser>, Path(id): Path<u32>) -> String { u.name }
Router::new().route("/teams/{id}/users", post(create))
}`, right: `async fn create(Path(id): Path<u32>, Json(u): Json<NewUser>) -> String { u.name }
Router::new().route("/teams/{id}/users", post(create))
}`, checkRight: true, explanation: 'Only the last argument may consume the request body (FromRequest). With Json first, the function does not implement Handler and the error points at post(create). #[debug_handler] (macros feature) explains exactly which argument is wrong.' },
    { title: 'Holding a std MutexGuard across .await', checkWrong: true, prelude: `use std::sync::{Arc, Mutex};
use axum::{Router, extract::State, routing::post};
async fn save(_n: u64) {}
fn app(state: Arc<Mutex<u64>>) -> Router {`, wrong: `async fn bump(State(s): State<Arc<Mutex<u64>>>) {
    let mut n = s.lock().unwrap();
    *n += 1;
    save(*n).await; // guard still alive here
}
Router::new().route("/bump", post(bump)).with_state(state)
}`, right: `async fn bump(State(s): State<Arc<Mutex<u64>>>) {
    let value = {
        let mut n = s.lock().unwrap();
        *n += 1;
        *n
    }; // guard dropped before awaiting
    save(value).await;
}
Router::new().route("/bump", post(bump)).with_state(state)
}`, checkRight: true, explanation: 'std::sync::MutexGuard is !Send, so a future holding it across an await is !Send and axum rejects the handler. Scope the guard so it drops before the await, or use tokio::sync::Mutex when the lock genuinely must span an await.' },
    { title: 'Forgetting with_state', checkWrong: true, prelude: `use axum::{Router, extract::State, routing::get};
#[derive(Clone)] struct AppState;
async fn h(State(_): State<AppState>) {}`, wrong: `async fn run(listener: tokio::net::TcpListener) {
    let app = Router::new().route("/", get(h));
    axum::serve(listener, app).await.unwrap();
}`, right: `async fn run(listener: tokio::net::TcpListener) {
    let app = Router::new().route("/", get(h)).with_state(AppState);
    axum::serve(listener, app).await.unwrap();
}`, checkRight: true, explanation: 'A router whose handlers need State<AppState> has type Router<AppState>; only Router<()> can be served. Calling with_state supplies the state and turns it into Router<()>.' },
    { title: 'Expecting the first .layer to run first', wrong: `Router::new()
    .route("/", get(h))
    .layer(auth_layer)      // runs SECOND
    .layer(trace_layer)     // runs FIRST (outermost)`, right: `use tower::ServiceBuilder;
Router::new()
    .route("/", get(h))
    .layer(ServiceBuilder::new()
        .layer(trace_layer)  // runs first
        .layer(auth_layer))  // then auth`, explanation: 'Each .layer call wraps everything before it, so the last one added is the outermost. ServiceBuilder reads top to bottom in execution order, which is easier to reason about when you stack several layers.' },
  ],
  challenge: {
    title: 'A tiny in-memory notes API',
    language: 'rust',
    description: 'Build a Router with shared state Arc<Mutex<Vec<String>>>: POST /notes takes a JSON body {"text": "..."} and returns 201 with the new note id (its index), GET /notes/{id} returns the note text or 404, and GET /notes returns the count. Exercise it with tower::ServiceExt::oneshot in main — no real socket.',
    hints: ['type Notes = Arc<Mutex<Vec<String>>>; and .with_state(notes)', 'Return Result<String, StatusCode> from get_note so a missing id becomes 404.', 'Read the response body with http_body_util::BodyExt::collect().'],
    starterCode: `use std::sync::{Arc, Mutex};
use axum::{Json, Router, extract::{Path, State}, http::StatusCode, routing::{get, post}};

type Notes = Arc<Mutex<Vec<String>>>;

#[derive(serde::Deserialize)]
struct NewNote { text: String }

// TODO: create_note, get_note, count_notes handlers

fn app(notes: Notes) -> Router {
    todo!()
}

#[tokio::main]
async fn main() {
    // TODO: build the app and call it with oneshot
}`,
    solution: `use std::sync::{Arc, Mutex};
use axum::{
    Json, Router,
    body::Body,
    extract::{Path, State},
    http::{Request, StatusCode},
    routing::{get, post},
};
use http_body_util::BodyExt;
use tower::ServiceExt;

type Notes = Arc<Mutex<Vec<String>>>;

#[derive(serde::Deserialize)]
struct NewNote { text: String }

async fn create_note(State(notes): State<Notes>, Json(n): Json<NewNote>) -> (StatusCode, String) {
    let mut v = notes.lock().unwrap();
    v.push(n.text);
    (StatusCode::CREATED, (v.len() - 1).to_string())
}

async fn get_note(State(notes): State<Notes>, Path(id): Path<usize>) -> Result<String, StatusCode> {
    notes.lock().unwrap().get(id).cloned().ok_or(StatusCode::NOT_FOUND)
}

async fn count_notes(State(notes): State<Notes>) -> String {
    notes.lock().unwrap().len().to_string()
}

fn app(notes: Notes) -> Router {
    Router::new()
        .route("/notes", post(create_note).get(count_notes))
        .route("/notes/{id}", get(get_note))
        .with_state(notes)
}

async fn send(app: &Router, req: Request<Body>) -> String {
    let res = app.clone().oneshot(req).await.unwrap();
    let status = res.status().as_u16();
    let body = res.into_body().collect().await.unwrap().to_bytes();
    format!("{status} {}", String::from_utf8_lossy(&body))
}

#[tokio::main]
async fn main() {
    let app = app(Notes::default());
    let post_note = |t: &str| Request::post("/notes")
        .header("content-type", "application/json")
        .body(Body::from(format!(r#"{{"text":"{t}"}}"#)))
        .unwrap();

    println!("{}", send(&app, post_note("buy milk")).await); // 201 0
    println!("{}", send(&app, post_note("ship it")).await);  // 201 1
    println!("{}", send(&app, Request::get("/notes/1").body(Body::empty()).unwrap()).await); // 200 ship it
    println!("{}", send(&app, Request::get("/notes/9").body(Body::empty()).unwrap()).await); // 404
    println!("{}", send(&app, Request::get("/notes").body(Body::empty()).unwrap()).await);   // 200 2
}`,
  },
  quiz: [
    { q: 'In axum 0.8, how do you declare a path capture named id?', options: ['/users/:id', '/users/{id}', '/users/<id>', '/users/*id'], answer: 1, explanation: 'Axum 0.8 uses {id} (and {*rest} for wildcards). The older :id form panics when the route is registered.' },
    { q: 'Which extractor must be the last handler argument?', options: ['Path<T>', 'State<S>', 'Json<T>', 'HeaderMap'], answer: 2, explanation: 'Json consumes the request body (FromRequest). Only the final argument may do that; the others implement FromRequestParts.' },
    { q: 'Why does axum reject a handler that holds a std::sync::MutexGuard across .await?', options: ['MutexGuard is not Clone', 'The handler future becomes !Send', 'Mutex is not allowed in State', 'It deadlocks at compile time'], answer: 1, explanation: 'Axum runs on the multi-threaded Tokio runtime, so handler futures must be Send. A std MutexGuard is !Send, so holding it across an await makes the future !Send.' },
    { q: 'Router::new().route(...).layer(A).layer(B) — which layer sees the request first?', options: ['A', 'B', 'Both at once', 'Neither, layers only see responses'], answer: 1, explanation: 'Each .layer wraps the existing service, so B wraps A and is the outermost layer that receives the request first.' },
    { q: 'What does a Path<u32> extractor do when the segment is "abc"?', options: ['Passes 0', 'Panics', 'Returns a 400 rejection without calling the handler', 'Calls the handler with None'], answer: 2, explanation: 'Extraction failures become rejections that are returned as responses (400 for a bad path parameter); the handler never runs.' },
    { q: 'What type must S be for State<S>?', options: ['Copy', 'Clone (and Send + Sync + static for serving)', 'Default', 'Serialize'], answer: 1, explanation: 'Axum clones the state for each request, so S must be Clone. Wrapping expensive parts in Arc keeps the clone cheap.' },
  ],
  qna: [
    { q: 'How does axum decide that an async function is a handler?', a: 'Axum implements the `Handler` trait for async functions of up to 16 arguments when every argument except the last implements `FromRequestParts<S>`, the last implements `FromRequest<S>`, and the output implements `IntoResponse`. There is no registration macro. When those bounds fail you get a long generic error at the `route` call; the `#[debug_handler]` attribute from the `macros` feature reports the specific argument or return type that is wrong.' },
    { q: 'How do you share a database pool or configuration between handlers?', a: 'Put it in a state struct that derives `Clone`, wrap anything expensive or mutable in `Arc` (for example `Arc<Config>` or a pool type that is already an `Arc` internally), call `.with_state(state)` on the router, and add `State(state): State<AppState>` to the handlers that need it. With `FromRef` you can also extract a sub-field such as `State<PgPool>` directly.' },
    { q: 'How do you test an axum application without opening a port?', a: 'A `Router` is a tower `Service`, so tests can build a `Request` with `Request::builder()` and call `app.oneshot(request).await` from `tower::ServiceExt`. Read the body with `http_body_util::BodyExt::collect()`. This exercises routing, extractors, handlers and layers exactly as in production, just without the network.' },
    { q: 'What changed in axum 0.8?', a: 'The main user-facing changes were the new path syntax (`/{id}` and `/{*rest}` instead of `/:id` and `/*rest`), native async trait methods in `FromRequestParts` and `FromRequest` (no `#[async_trait]`), and `Option<T>` extraction now requiring the extractor to implement `OptionalFromRequestParts`, so errors other than "missing" are no longer silently turned into `None`.' },
    { q: 'When would you pick Actix Web over Axum?', a: 'Both handle production load well. Actix Web runs one single-threaded runtime per worker, so its handlers do not need to be `Send`, which can simplify code that uses non-thread-safe types; it also has a long-established ecosystem of its own middleware. Axum fits best when you want plain async functions, the tower middleware ecosystem shared with tonic and hyper, and close alignment with Tokio.' },
  ],
  revision: {
    oneLiner: 'Axum turns plain async functions into handlers: extractors in, IntoResponse out, state via with_state and middleware via tower layers.',
    mustKnow: [
      'Path captures are `{id}` since axum 0.8; `:id` panics at route registration.',
      'Every argument but the last is `FromRequestParts`; the last may consume the body (`Json`, `Form`, `String`).',
      'Extraction failures return a rejection response; the handler does not run.',
      '`State<S>` needs `S: Clone`; keep it cheap with `Arc`.',
      'Handler futures must be `Send` — drop std mutex guards before `.await`.',
      'The last `.layer` added is the outermost; `ServiceBuilder` lists layers in execution order.',
      'Test with `tower::ServiceExt::oneshot`, no socket required.',
    ],
    interviewFocus: [
      'Explain how axum infers the Handler trait from a function signature.',
      'Explain why a MutexGuard across await breaks a handler.',
      'Compare axum with Actix Web (runtime model, Send requirements, middleware).',
      'Describe how you would structure shared state and testing for an axum service.',
    ],
  },
};
