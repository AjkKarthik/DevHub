module.exports = {
  slug: 'rest-apis',
  subtitle: 'Build a CRUD REST service with Axum: one AppError type that maps to status codes, Result-returning handlers with ?, input validation, pagination, a repository behind shared state, and handler tests with oneshot.',
  readingTime: 26,
  prerequisites: [
    { label: 'Web Frameworks', route: '/rust/web-frameworks' },
    { label: 'Error Handling', route: '/rust/error-handling' },
    { label: 'Serialization', route: '/rust/serialization' },
  ],
  apis: ['impl IntoResponse for AppError', 'Result<Json<T>, AppError>', 'thiserror', 'Arc<RwLock<HashMap>>', 'Query<Pagination>', 'tower::ServiceExt::oneshot'],
  tip: 'Give the whole service one error enum with an IntoResponse impl. Handlers then return Result<_, AppError> and use ? everywhere, and the mapping from failure to status code lives in exactly one place.',
  gotchas: [
    'Returning anyhow::Error directly from a handler does not compile: it does not implement IntoResponse. Wrap it in your own error type.',
    'Never put internal error details (SQL text, file paths) in a 500 body. Log the source, return a generic message.',
    'PUT replaces the whole resource and must be idempotent; PATCH updates part of it. Model PATCH bodies with Option fields so absent fields stay unchanged.',
  ],
  quickRef: [
    { name: 'enum AppError { NotFound, Validation(String), Internal(..) }', type: 'type', desc: 'One error type for the whole API' },
    { name: 'impl IntoResponse for AppError', type: 'interface', desc: 'Map each variant to a status code and JSON body' },
    { name: 'async fn h(..) -> Result<Json<T>, AppError>', type: 'function', desc: 'Handlers return Result so they can use ?' },
    { name: '#[derive(thiserror::Error)] + #[from]', type: 'decorator', desc: 'Convert library errors into AppError automatically' },
    { name: '(StatusCode::CREATED, [(LOCATION, url)], Json(v))', type: 'syntax', desc: '201 with a Location header for the new resource' },
    { name: 'StatusCode::NO_CONTENT', type: 'token', desc: '204 for a successful DELETE with no body' },
    { name: 'Query<Pagination> with #[serde(default)]', type: 'type', desc: 'Optional limit/offset with defaults' },
    { name: 'Arc<RwLock<HashMap<Id, T>>>', type: 'type', desc: 'Simple in-memory store shared through State' },
    { name: 'app.oneshot(req).await', type: 'method', desc: 'Test a handler end to end without a socket' },
  ],
  theory: [
    { heading: 'Resources, verbs and status codes', points: [
      'Model nouns as resources (`/todos`, `/todos/{id}`) and let the HTTP method carry the verb: `GET` reads, `POST` creates, `PUT` replaces, `PATCH` partially updates, `DELETE` removes.',
      'Return the code that matches the outcome: `200 OK` with a body, `201 Created` plus a `Location` header after a create, `204 No Content` after a delete, `400`/`422` for bad input, `404` for a missing resource, `409` for a conflict, `500` only for real server faults.',
      '`GET`, `PUT` and `DELETE` should be idempotent: repeating the same request leaves the server in the same state. `POST` is not, so retries need an idempotency key if duplicates matter.',
    ] },
    { heading: 'One error type for the API', points: [
      'Define an `AppError` enum with a variant per failure category and implement `IntoResponse` for it. Each variant picks a status code and a JSON body such as `{ "error": "not found" }`.',
      'Derive `thiserror::Error` and add `#[from]` on wrapper variants so `?` converts database, IO or parse errors into `AppError` automatically.',
      'For the catch-all variant, log the underlying error with `tracing::error!` and return a generic 500 message. Leaking internal details helps attackers and confuses clients.',
      'Because `Result<T, E>` implements `IntoResponse` when both `T` and `E` do, a handler returning `Result<Json<Todo>, AppError>` can use `?` on every fallible step.',
    ] },
    { heading: 'Input, validation and pagination', points: [
      'Use separate input types for create and update requests (`CreateTodo`, `UpdateTodo`) rather than reusing the stored entity. This stops clients from setting server-owned fields such as `id` or `created_at`.',
      'Serde rejects malformed JSON with a 4xx before your handler runs; business rules (non-empty title, length limits) still need explicit checks that return `AppError::Validation`. Crates like `validator` or `garde` offer derive-based rules.',
      'A PATCH body is naturally `struct UpdateTodo { title: Option<String>, done: Option<bool> }`: `None` means "leave unchanged".',
      'Paginate list endpoints from day one: `Query<Pagination>` with `#[serde(default)]` limit and offset, a maximum limit enforced in the handler, and keyset pagination (`after_id`) once offsets become slow.',
    ] },
    { heading: 'State, storage and testing', points: [
      'Real services hold a connection pool (for example `sqlx::PgPool`, which is already cheap to clone) in the state. For examples and tests an `Arc<RwLock<HashMap<u64, Todo>>>` behaves the same way through the same handlers.',
      'Hiding storage behind a small repository struct or trait keeps handlers focused on HTTP concerns and lets tests swap in an in-memory implementation.',
      'Handler tests build the router, send `Request`s through `oneshot` and assert on status, headers and the decoded JSON body. They run in milliseconds and catch routing, extractor and serialization mistakes.',
      'Add `tower_http::trace::TraceLayer` for request logs, `CorsLayer` for browser clients and `TimeoutLayer` so a slow dependency cannot hold connections forever.',
    ] },
  ],
  codeTabs: [
    { label: 'AppError', language: 'rust', code: `use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("not found")]
    NotFound,
    #[error("validation failed: {0}")]
    Validation(String),
    #[error("conflict: {0}")]
    Conflict(String),
    #[error(transparent)]
    Internal(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::NotFound => (StatusCode::NOT_FOUND, self.to_string()),
            AppError::Validation(_) => (StatusCode::UNPROCESSABLE_ENTITY, self.to_string()),
            AppError::Conflict(_) => (StatusCode::CONFLICT, self.to_string()),
            AppError::Internal(err) => {
                eprintln!("internal error: {err:#}"); // tracing::error! in real code
                (StatusCode::INTERNAL_SERVER_ERROR, "internal server error".to_string())
            }
        };
        (status, Json(json!({ "error": message }))).into_response()
    }
}

fn main() {
    for e in [AppError::NotFound, AppError::Validation("title is empty".into()),
              AppError::Internal(anyhow::anyhow!("db timeout"))] {
        println!("{}", e.into_response().status());
    }
}` },
    { label: 'CRUD handlers', language: 'rust', run: false, code: `use std::{collections::HashMap, sync::{Arc, RwLock, atomic::{AtomicU64, Ordering}}};

use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::{StatusCode, header::LOCATION},
    response::IntoResponse,
    routing::get,
};
use serde::{Deserialize, Serialize};

#[derive(Debug)]
enum AppError { NotFound, Validation(String) }
impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        match self {
            AppError::NotFound => StatusCode::NOT_FOUND.into_response(),
            AppError::Validation(m) => (StatusCode::UNPROCESSABLE_ENTITY, m).into_response(),
        }
    }
}

#[derive(Clone, Serialize)]
struct Todo { id: u64, title: String, done: bool }

#[derive(Deserialize)]
struct CreateTodo { title: String }

#[derive(Deserialize)]
struct UpdateTodo { title: Option<String>, done: Option<bool> }

#[derive(Deserialize)]
struct Pagination {
    #[serde(default)] offset: usize,
    #[serde(default = "default_limit")] limit: usize,
}
fn default_limit() -> usize { 20 }

#[derive(Clone, Default)]
struct AppState {
    todos: Arc<RwLock<HashMap<u64, Todo>>>,
    next_id: Arc<AtomicU64>,
}

async fn list(State(s): State<AppState>, Query(p): Query<Pagination>) -> Json<Vec<Todo>> {
    let todos = s.todos.read().unwrap();
    let mut all: Vec<Todo> = todos.values().cloned().collect();
    all.sort_by_key(|t| t.id);
    Json(all.into_iter().skip(p.offset).take(p.limit.min(100)).collect())
}

async fn create(State(s): State<AppState>, Json(input): Json<CreateTodo>)
    -> Result<impl IntoResponse, AppError>
{
    let title = input.title.trim().to_string();
    if title.is_empty() {
        return Err(AppError::Validation("title must not be empty".into()));
    }
    let id = s.next_id.fetch_add(1, Ordering::Relaxed) + 1;
    let todo = Todo { id, title, done: false };
    s.todos.write().unwrap().insert(id, todo.clone());
    Ok((StatusCode::CREATED, [(LOCATION, format!("/todos/{id}"))], Json(todo)))
}

async fn get_one(State(s): State<AppState>, Path(id): Path<u64>) -> Result<Json<Todo>, AppError> {
    s.todos.read().unwrap().get(&id).cloned().map(Json).ok_or(AppError::NotFound)
}

async fn update(State(s): State<AppState>, Path(id): Path<u64>, Json(input): Json<UpdateTodo>)
    -> Result<Json<Todo>, AppError>
{
    let mut todos = s.todos.write().unwrap();
    let todo = todos.get_mut(&id).ok_or(AppError::NotFound)?;
    if let Some(title) = input.title { todo.title = title; }
    if let Some(done) = input.done { todo.done = done; }
    Ok(Json(todo.clone()))
}

async fn delete(State(s): State<AppState>, Path(id): Path<u64>) -> Result<StatusCode, AppError> {
    s.todos.write().unwrap().remove(&id).map(|_| StatusCode::NO_CONTENT).ok_or(AppError::NotFound)
}

fn router() -> Router {
    Router::new()
        .route("/todos", get(list).post(create))
        .route("/todos/{id}", get(get_one).patch(update).delete(delete))
        .with_state(AppState::default())
}

#[tokio::main]
async fn main() {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
    axum::serve(listener, router()).await.unwrap();
}` },
    { label: 'Handler tests', language: 'rust', code: `use axum::{Json, Router, body::Body, http::{Request, StatusCode}, routing::post};
use http_body_util::BodyExt;
use serde_json::{Value, json};
use tower::ServiceExt;

async fn echo_len(Json(v): Json<Value>) -> Result<Json<Value>, StatusCode> {
    let title = v["title"].as_str().ok_or(StatusCode::UNPROCESSABLE_ENTITY)?;
    Ok(Json(json!({ "len": title.len() })))
}

fn app() -> Router { Router::new().route("/len", post(echo_len)) }

async fn post_json(body: Value) -> (StatusCode, Value) {
    let req = Request::post("/len")
        .header("content-type", "application/json")
        .body(Body::from(body.to_string()))
        .unwrap();
    let res = app().oneshot(req).await.unwrap();
    let status = res.status();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    let json = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    (status, json)
}

#[tokio::test]
async fn returns_length() {
    let (status, body) = post_json(json!({ "title": "hello" })).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body, json!({ "len": 5 }));
}

#[tokio::test]
async fn rejects_missing_title() {
    let (status, _) = post_json(json!({ "name": "x" })).await;
    assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY);
}

fn main() {}`, test: true },
  ],
  mistakes: [
    { title: 'Returning anyhow::Error from a handler', checkWrong: true, prelude: `use axum::{Router, routing::get};`, wrong: `async fn h() -> Result<String, anyhow::Error> { Ok("hi".into()) }
fn app() -> Router { Router::new().route("/", get(h)) }`, right: `#[derive(Debug)]
struct AppError(anyhow::Error);
impl axum::response::IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        (axum::http::StatusCode::INTERNAL_SERVER_ERROR, "internal error").into_response()
    }
}
impl<E: Into<anyhow::Error>> From<E> for AppError {
    fn from(e: E) -> Self { AppError(e.into()) }
}
async fn h() -> Result<String, AppError> { Ok("hi".into()) }
fn app() -> Router { Router::new().route("/", get(h)) }`, checkRight: true, explanation: 'anyhow::Error does not implement IntoResponse, so the handler is rejected. A small newtype with an IntoResponse impl and a blanket From lets handlers keep using ? on any error.' },
    { title: 'Leaking internal error details', wrong: `AppError::Internal(err) =>
    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()).into_response()
// client sees: "error returned from database: relation \\"users\\" does not exist"`, right: `AppError::Internal(err) => {
    tracing::error!(error = ?err, "request failed");
    (StatusCode::INTERNAL_SERVER_ERROR, "internal server error").into_response()
}`, explanation: 'Database messages, file paths and stack details help attackers and mean nothing to clients. Log the real cause with a request id and return a generic message.' },
    { title: 'Reusing the stored entity as the input type', wrong: `#[derive(Deserialize)]
struct User { id: u64, email: String, is_admin: bool }
async fn create(Json(u): Json<User>) { /* stores is_admin from the client! */ }`, right: `#[derive(Deserialize)]
struct CreateUser { email: String }
async fn create(Json(input): Json<CreateUser>) {
    let user = User { id: next_id(), email: input.email, is_admin: false };
}`, explanation: 'Deserializing straight into the entity lets clients set server-owned fields (mass assignment). Separate request DTOs list exactly what a client may send.' },
    { title: 'Returning 200 with an error payload', wrong: `async fn get(Path(id): Path<u64>) -> Json<Value> {
    match find(id) {
        Some(t) => Json(json!(t)),
        None => Json(json!({ "error": "not found" })), // still 200!
    }
}`, right: `async fn get(Path(id): Path<u64>) -> Result<Json<Todo>, AppError> {
    find(id).map(Json).ok_or(AppError::NotFound)  // 404
}`, explanation: 'Clients, proxies, caches and monitoring rely on status codes. A 200 with an error body is cached as success and hides failures from dashboards.' },
    { title: 'Unbounded list endpoints', wrong: `async fn list(State(s): State<AppState>) -> Json<Vec<Todo>> {
    Json(s.all())   // 2 million rows one day
}`, right: `async fn list(State(s): State<AppState>, Query(p): Query<Pagination>) -> Json<Vec<Todo>> {
    Json(s.page(p.offset, p.limit.min(100)))
}`, explanation: 'Endpoints that return everything work in development and fall over in production. Paginate and cap the page size from the first version — adding it later is a breaking change.' },
  ],
  challenge: {
    title: 'Map domain errors to HTTP',
    language: 'rust',
    description: 'Write an AppError enum with NotFound, Validation(String) and Conflict(String) variants and implement IntoResponse so they become 404, 422 and 409 with a JSON body {"error": message}. Then write a create_user(existing: &[&str], email: &str) -> Result<String, AppError> function that rejects an email without "@" (Validation) or one that already exists (Conflict). In main, convert three results into responses and print their status codes.',
    hints: ['impl IntoResponse: let (status, msg) = match self { ... }; (status, Json(json!({"error": msg}))).into_response()', 'Check validation before the conflict lookup.', 'A Result<String, AppError> is itself IntoResponse, so you can call .into_response() on it directly.'],
    starterCode: `use axum::{Json, http::StatusCode, response::{IntoResponse, Response}};
use serde_json::json;

enum AppError {
    // TODO
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        todo!()
    }
}

fn create_user(existing: &[&str], email: &str) -> Result<String, AppError> {
    todo!()
}

fn main() {}`,
    solution: `use axum::{Json, http::StatusCode, response::{IntoResponse, Response}};
use serde_json::json;

#[derive(Debug)]
enum AppError {
    NotFound,
    Validation(String),
    Conflict(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, msg) = match self {
            AppError::NotFound => (StatusCode::NOT_FOUND, "not found".to_string()),
            AppError::Validation(m) => (StatusCode::UNPROCESSABLE_ENTITY, m),
            AppError::Conflict(m) => (StatusCode::CONFLICT, m),
        };
        (status, Json(json!({ "error": msg }))).into_response()
    }
}

fn create_user(existing: &[&str], email: &str) -> Result<String, AppError> {
    if !email.contains('@') {
        return Err(AppError::Validation(format!("invalid email: {email}")));
    }
    if existing.contains(&email) {
        return Err(AppError::Conflict(format!("{email} already registered")));
    }
    Ok(format!("created {email}"))
}

fn main() {
    let existing = ["ada@example.com"];
    for email in ["bob@example.com", "nope", "ada@example.com"] {
        let res = create_user(&existing, email).into_response();
        println!("{email}: {}", res.status());
    }
    println!("{}", AppError::NotFound.into_response().status());
    // bob@example.com: 200 OK
    // nope: 422 Unprocessable Entity
    // ada@example.com: 409 Conflict
    // 404 Not Found
}`,
  },
  quiz: [
    { q: 'What status code fits a successful POST that created a resource?', options: ['200 OK', '201 Created', '202 Accepted', '204 No Content'], answer: 1, explanation: '201 Created, ideally with a Location header pointing at the new resource. 202 means accepted for later processing; 204 means success with no body.' },
    { q: 'Why does a handler returning Result<String, anyhow::Error> fail to compile with axum?', options: ['anyhow is async-incompatible', 'anyhow::Error does not implement IntoResponse', 'Result cannot be returned', 'String is not a response'], answer: 1, explanation: 'Result<T, E> is a response only if both T and E implement IntoResponse. Wrap anyhow::Error in your own type that does.' },
    { q: 'Which method is NOT idempotent by definition?', options: ['GET', 'PUT', 'DELETE', 'POST'], answer: 3, explanation: 'Repeating a POST typically creates another resource. GET, PUT and DELETE leave the same state when repeated.' },
    { q: 'How should a PATCH body type represent "do not change this field"?', options: ['Empty string', 'Option<T> set to None', 'A separate endpoint', 'Default::default()'], answer: 1, explanation: 'Option fields that are absent in the JSON deserialize to None, which the handler treats as "leave unchanged".' },
    { q: 'What should a 500 response body contain?', options: ['The full error chain', 'The SQL that failed', 'A generic message (with a request id), while the details go to the logs', 'Nothing, 500 never has a body'], answer: 2, explanation: 'Internal details leak implementation information and are useless to clients. Log them server side and return a generic message.' },
  ],
  qna: [
    { q: 'How do you structure error handling in an axum REST API?', a: 'Define one `AppError` enum (usually with `thiserror`) that covers the categories clients care about — not found, validation, conflict, unauthorized, internal — implement `IntoResponse` once to map each to a status code and a consistent JSON body, and add `#[from]` conversions for library errors. Handlers return `Result<_, AppError>` and use `?`. Internal errors are logged with context and returned as a generic 500.' },
    { q: 'Why use separate request types instead of the database entity?', a: 'Request DTOs make the API contract explicit and prevent mass assignment: a client cannot set `id`, `is_admin` or `created_at` if those fields do not exist on `CreateUser`. They also let create and update differ (all fields required vs all optional) and keep the storage model free to evolve without breaking the HTTP API.' },
    { q: 'How do you test a REST handler in Rust?', a: 'Build the `Router` (with an in-memory or test database state), construct a `Request` with method, URI, headers and a JSON body, call `app.oneshot(request).await` from `tower::ServiceExt`, then assert on the status, headers and the body decoded with `serde_json::from_slice`. For database-backed tests, `sqlx::test` creates an isolated database per test.' },
    { q: 'Offset or cursor pagination?', a: '`LIMIT/OFFSET` is simple and supports "jump to page 7", but the database still walks the skipped rows, so deep pages get slow, and inserts shift results between requests. Keyset (cursor) pagination filters with `WHERE id > last_seen ORDER BY id LIMIT n`, which stays fast at any depth and is stable under concurrent writes. Many APIs use offsets for small admin lists and cursors for feeds and exports.' },
  ],
  revision: {
    oneLiner: 'A Rust REST API is a set of Result-returning axum handlers, a single AppError that maps to status codes, explicit request DTOs, pagination and oneshot tests.',
    mustKnow: [
      'Use the right status codes: 201 + Location, 204 on delete, 404, 409, 422, 500.',
      'One `AppError` with `IntoResponse`; handlers return `Result<_, AppError>` and use `?`.',
      '`anyhow::Error` cannot be returned directly — wrap it.',
      'Separate create/update DTOs; PATCH fields are `Option<T>`.',
      'Log internal errors, return generic 500 bodies.',
      'Paginate and cap list endpoints from the first version.',
    ],
    interviewFocus: [
      'Design the error type for a Rust web API.',
      'Explain idempotency of HTTP methods and how to handle POST retries.',
      'Explain how you test handlers without a running server.',
    ],
  },
};
