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
  selector: 'app-rust-rest-apis',
  standalone: true,
  imports: [PageMetaComponent, PrerequisitesComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './rest-apis.html',
  styleUrl: './rest-apis.scss'
})
export class RustRestApis {
  readingTime = 26;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = "Rust 2024";
  route = 'rust-rest-apis';
  nextRoute = '/rust/serialization';
  nextLabel = "Serialization";

  prerequisites: Prerequisite[] = [
    {
      "label": "Web Frameworks",
      "route": "/rust/web-frameworks"
    },
    {
      "label": "Error Handling",
      "route": "/rust/error-handling"
    },
    {
      "label": "Serialization",
      "route": "/rust/serialization"
    }
  ];

  quickRef: QuickRefItem[] = [
    {
      "name": "enum AppError { NotFound, Validation(String), Internal(..) }",
      "type": "type",
      "desc": "One error type for the whole API"
    },
    {
      "name": "impl IntoResponse for AppError",
      "type": "interface",
      "desc": "Map each variant to a status code and JSON body"
    },
    {
      "name": "async fn h(..) -> Result<Json<T>, AppError>",
      "type": "function",
      "desc": "Handlers return Result so they can use ?"
    },
    {
      "name": "#[derive(thiserror::Error)] + #[from]",
      "type": "decorator",
      "desc": "Convert library errors into AppError automatically"
    },
    {
      "name": "(StatusCode::CREATED, [(LOCATION, url)], Json(v))",
      "type": "syntax",
      "desc": "201 with a Location header for the new resource"
    },
    {
      "name": "StatusCode::NO_CONTENT",
      "type": "token",
      "desc": "204 for a successful DELETE with no body"
    },
    {
      "name": "Query<Pagination> with #[serde(default)]",
      "type": "type",
      "desc": "Optional limit/offset with defaults"
    },
    {
      "name": "Arc<RwLock<HashMap<Id, T>>>",
      "type": "type",
      "desc": "Simple in-memory store shared through State"
    },
    {
      "name": "app.oneshot(req).await",
      "type": "method",
      "desc": "Test a handler end to end without a socket"
    }
  ];

  theory: TheoryPoint[] = [
    {
      "heading": "Resources, verbs and status codes",
      "points": [
        "Model nouns as resources (<code>/todos</code>, <code>/todos/{id}</code>) and let the HTTP method carry the verb: <code>GET</code> reads, <code>POST</code> creates, <code>PUT</code> replaces, <code>PATCH</code> partially updates, <code>DELETE</code> removes.",
        "Return the code that matches the outcome: <code>200 OK</code> with a body, <code>201 Created</code> plus a <code>Location</code> header after a create, <code>204 No Content</code> after a delete, <code>400</code>/<code>422</code> for bad input, <code>404</code> for a missing resource, <code>409</code> for a conflict, <code>500</code> only for real server faults.",
        "<code>GET</code>, <code>PUT</code> and <code>DELETE</code> should be idempotent: repeating the same request leaves the server in the same state. <code>POST</code> is not, so retries need an idempotency key if duplicates matter."
      ]
    },
    {
      "heading": "One error type for the API",
      "points": [
        "Define an <code>AppError</code> enum with a variant per failure category and implement <code>IntoResponse</code> for it. Each variant picks a status code and a JSON body such as <code>{ \"error\": \"not found\" }</code>.",
        "Derive <code>thiserror::Error</code> and add <code>#[from]</code> on wrapper variants so <code>?</code> converts database, IO or parse errors into <code>AppError</code> automatically.",
        "For the catch-all variant, log the underlying error with <code>tracing::error!</code> and return a generic 500 message. Leaking internal details helps attackers and confuses clients.",
        "Because <code>Result&lt;T, E&gt;</code> implements <code>IntoResponse</code> when both <code>T</code> and <code>E</code> do, a handler returning <code>Result&lt;Json&lt;Todo&gt;, AppError&gt;</code> can use <code>?</code> on every fallible step."
      ]
    },
    {
      "heading": "Input, validation and pagination",
      "points": [
        "Use separate input types for create and update requests (<code>CreateTodo</code>, <code>UpdateTodo</code>) rather than reusing the stored entity. This stops clients from setting server-owned fields such as <code>id</code> or <code>created_at</code>.",
        "Serde rejects malformed JSON with a 4xx before your handler runs; business rules (non-empty title, length limits) still need explicit checks that return <code>AppError::Validation</code>. Crates like <code>validator</code> or <code>garde</code> offer derive-based rules.",
        "A PATCH body is naturally <code>struct UpdateTodo { title: Option&lt;String&gt;, done: Option&lt;bool&gt; }</code>: <code>None</code> means \"leave unchanged\".",
        "Paginate list endpoints from day one: <code>Query&lt;Pagination&gt;</code> with <code>#[serde(default)]</code> limit and offset, a maximum limit enforced in the handler, and keyset pagination (<code>after_id</code>) once offsets become slow."
      ]
    },
    {
      "heading": "State, storage and testing",
      "points": [
        "Real services hold a connection pool (for example <code>sqlx::PgPool</code>, which is already cheap to clone) in the state. For examples and tests an <code>Arc&lt;RwLock&lt;HashMap&lt;u64, Todo&gt;&gt;&gt;</code> behaves the same way through the same handlers.",
        "Hiding storage behind a small repository struct or trait keeps handlers focused on HTTP concerns and lets tests swap in an in-memory implementation.",
        "Handler tests build the router, send <code>Request</code>s through <code>oneshot</code> and assert on status, headers and the decoded JSON body. They run in milliseconds and catch routing, extractor and serialization mistakes.",
        "Add <code>tower_http::trace::TraceLayer</code> for request logs, <code>CorsLayer</code> for browser clients and <code>TimeoutLayer</code> so a slow dependency cannot hold connections forever."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "AppError",
      "code": "use axum::{\n    Json,\n    http::StatusCode,\n    response::{IntoResponse, Response},\n};\nuse serde_json::json;\n\n#[derive(Debug, thiserror::Error)]\npub enum AppError {\n    #[error(\"not found\")]\n    NotFound,\n    #[error(\"validation failed: {0}\")]\n    Validation(String),\n    #[error(\"conflict: {0}\")]\n    Conflict(String),\n    #[error(transparent)]\n    Internal(#[from] anyhow::Error),\n}\n\nimpl IntoResponse for AppError {\n    fn into_response(self) -> Response {\n        let (status, message) = match &self {\n            AppError::NotFound => (StatusCode::NOT_FOUND, self.to_string()),\n            AppError::Validation(_) => (StatusCode::UNPROCESSABLE_ENTITY, self.to_string()),\n            AppError::Conflict(_) => (StatusCode::CONFLICT, self.to_string()),\n            AppError::Internal(err) => {\n                eprintln!(\"internal error: {err:#}\"); // tracing::error! in real code\n                (StatusCode::INTERNAL_SERVER_ERROR, \"internal server error\".to_string())\n            }\n        };\n        (status, Json(json!({ \"error\": message }))).into_response()\n    }\n}\n\nfn main() {\n    for e in [AppError::NotFound, AppError::Validation(\"title is empty\".into()),\n              AppError::Internal(anyhow::anyhow!(\"db timeout\"))] {\n        println!(\"{}\", e.into_response().status());\n    }\n}",
      "language": "rust"
    },
    {
      "label": "CRUD handlers",
      "code": "use std::{collections::HashMap, sync::{Arc, RwLock, atomic::{AtomicU64, Ordering}}};\n\nuse axum::{\n    Json, Router,\n    extract::{Path, Query, State},\n    http::{StatusCode, header::LOCATION},\n    response::IntoResponse,\n    routing::get,\n};\nuse serde::{Deserialize, Serialize};\n\n#[derive(Debug)]\nenum AppError { NotFound, Validation(String) }\nimpl IntoResponse for AppError {\n    fn into_response(self) -> axum::response::Response {\n        match self {\n            AppError::NotFound => StatusCode::NOT_FOUND.into_response(),\n            AppError::Validation(m) => (StatusCode::UNPROCESSABLE_ENTITY, m).into_response(),\n        }\n    }\n}\n\n#[derive(Clone, Serialize)]\nstruct Todo { id: u64, title: String, done: bool }\n\n#[derive(Deserialize)]\nstruct CreateTodo { title: String }\n\n#[derive(Deserialize)]\nstruct UpdateTodo { title: Option<String>, done: Option<bool> }\n\n#[derive(Deserialize)]\nstruct Pagination {\n    #[serde(default)] offset: usize,\n    #[serde(default = \"default_limit\")] limit: usize,\n}\nfn default_limit() -> usize { 20 }\n\n#[derive(Clone, Default)]\nstruct AppState {\n    todos: Arc<RwLock<HashMap<u64, Todo>>>,\n    next_id: Arc<AtomicU64>,\n}\n\nasync fn list(State(s): State<AppState>, Query(p): Query<Pagination>) -> Json<Vec<Todo>> {\n    let todos = s.todos.read().unwrap();\n    let mut all: Vec<Todo> = todos.values().cloned().collect();\n    all.sort_by_key(|t| t.id);\n    Json(all.into_iter().skip(p.offset).take(p.limit.min(100)).collect())\n}\n\nasync fn create(State(s): State<AppState>, Json(input): Json<CreateTodo>)\n    -> Result<impl IntoResponse, AppError>\n{\n    let title = input.title.trim().to_string();\n    if title.is_empty() {\n        return Err(AppError::Validation(\"title must not be empty\".into()));\n    }\n    let id = s.next_id.fetch_add(1, Ordering::Relaxed) + 1;\n    let todo = Todo { id, title, done: false };\n    s.todos.write().unwrap().insert(id, todo.clone());\n    Ok((StatusCode::CREATED, [(LOCATION, format!(\"/todos/{id}\"))], Json(todo)))\n}\n\nasync fn get_one(State(s): State<AppState>, Path(id): Path<u64>) -> Result<Json<Todo>, AppError> {\n    s.todos.read().unwrap().get(&id).cloned().map(Json).ok_or(AppError::NotFound)\n}\n\nasync fn update(State(s): State<AppState>, Path(id): Path<u64>, Json(input): Json<UpdateTodo>)\n    -> Result<Json<Todo>, AppError>\n{\n    let mut todos = s.todos.write().unwrap();\n    let todo = todos.get_mut(&id).ok_or(AppError::NotFound)?;\n    if let Some(title) = input.title { todo.title = title; }\n    if let Some(done) = input.done { todo.done = done; }\n    Ok(Json(todo.clone()))\n}\n\nasync fn delete(State(s): State<AppState>, Path(id): Path<u64>) -> Result<StatusCode, AppError> {\n    s.todos.write().unwrap().remove(&id).map(|_| StatusCode::NO_CONTENT).ok_or(AppError::NotFound)\n}\n\nfn router() -> Router {\n    Router::new()\n        .route(\"/todos\", get(list).post(create))\n        .route(\"/todos/{id}\", get(get_one).patch(update).delete(delete))\n        .with_state(AppState::default())\n}\n\n#[tokio::main]\nasync fn main() {\n    let listener = tokio::net::TcpListener::bind(\"127.0.0.1:3000\").await.unwrap();\n    axum::serve(listener, router()).await.unwrap();\n}",
      "language": "rust"
    },
    {
      "label": "Handler tests",
      "code": "use axum::{Json, Router, body::Body, http::{Request, StatusCode}, routing::post};\nuse http_body_util::BodyExt;\nuse serde_json::{Value, json};\nuse tower::ServiceExt;\n\nasync fn echo_len(Json(v): Json<Value>) -> Result<Json<Value>, StatusCode> {\n    let title = v[\"title\"].as_str().ok_or(StatusCode::UNPROCESSABLE_ENTITY)?;\n    Ok(Json(json!({ \"len\": title.len() })))\n}\n\nfn app() -> Router { Router::new().route(\"/len\", post(echo_len)) }\n\nasync fn post_json(body: Value) -> (StatusCode, Value) {\n    let req = Request::post(\"/len\")\n        .header(\"content-type\", \"application/json\")\n        .body(Body::from(body.to_string()))\n        .unwrap();\n    let res = app().oneshot(req).await.unwrap();\n    let status = res.status();\n    let bytes = res.into_body().collect().await.unwrap().to_bytes();\n    let json = serde_json::from_slice(&bytes).unwrap_or(Value::Null);\n    (status, json)\n}\n\n#[tokio::test]\nasync fn returns_length() {\n    let (status, body) = post_json(json!({ \"title\": \"hello\" })).await;\n    assert_eq!(status, StatusCode::OK);\n    assert_eq!(body, json!({ \"len\": 5 }));\n}\n\n#[tokio::test]\nasync fn rejects_missing_title() {\n    let (status, _) = post_json(json!({ \"name\": \"x\" })).await;\n    assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY);\n}\n\nfn main() {}",
      "language": "rust"
    }
  ];

  mistakes: CommonMistake[] = [
    {
      "title": "Returning anyhow::Error from a handler",
      "wrong": "async fn h() -> Result<String, anyhow::Error> { Ok(\"hi\".into()) }\nfn app() -> Router { Router::new().route(\"/\", get(h)) }",
      "right": "#[derive(Debug)]\nstruct AppError(anyhow::Error);\nimpl axum::response::IntoResponse for AppError {\n    fn into_response(self) -> axum::response::Response {\n        (axum::http::StatusCode::INTERNAL_SERVER_ERROR, \"internal error\").into_response()\n    }\n}\nimpl<E: Into<anyhow::Error>> From<E> for AppError {\n    fn from(e: E) -> Self { AppError(e.into()) }\n}\nasync fn h() -> Result<String, AppError> { Ok(\"hi\".into()) }\nfn app() -> Router { Router::new().route(\"/\", get(h)) }",
      "explanation": "anyhow::Error does not implement IntoResponse, so the handler is rejected. A small newtype with an IntoResponse impl and a blanket From lets handlers keep using ? on any error."
    },
    {
      "title": "Leaking internal error details",
      "wrong": "AppError::Internal(err) =>\n    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()).into_response()\n// client sees: \"error returned from database: relation \\\"users\\\" does not exist\"",
      "right": "AppError::Internal(err) => {\n    tracing::error!(error = ?err, \"request failed\");\n    (StatusCode::INTERNAL_SERVER_ERROR, \"internal server error\").into_response()\n}",
      "explanation": "Database messages, file paths and stack details help attackers and mean nothing to clients. Log the real cause with a request id and return a generic message."
    },
    {
      "title": "Reusing the stored entity as the input type",
      "wrong": "#[derive(Deserialize)]\nstruct User { id: u64, email: String, is_admin: bool }\nasync fn create(Json(u): Json<User>) { /* stores is_admin from the client! */ }",
      "right": "#[derive(Deserialize)]\nstruct CreateUser { email: String }\nasync fn create(Json(input): Json<CreateUser>) {\n    let user = User { id: next_id(), email: input.email, is_admin: false };\n}",
      "explanation": "Deserializing straight into the entity lets clients set server-owned fields (mass assignment). Separate request DTOs list exactly what a client may send."
    },
    {
      "title": "Returning 200 with an error payload",
      "wrong": "async fn get(Path(id): Path<u64>) -> Json<Value> {\n    match find(id) {\n        Some(t) => Json(json!(t)),\n        None => Json(json!({ \"error\": \"not found\" })), // still 200!\n    }\n}",
      "right": "async fn get(Path(id): Path<u64>) -> Result<Json<Todo>, AppError> {\n    find(id).map(Json).ok_or(AppError::NotFound)  // 404\n}",
      "explanation": "Clients, proxies, caches and monitoring rely on status codes. A 200 with an error body is cached as success and hides failures from dashboards."
    },
    {
      "title": "Unbounded list endpoints",
      "wrong": "async fn list(State(s): State<AppState>) -> Json<Vec<Todo>> {\n    Json(s.all())   // 2 million rows one day\n}",
      "right": "async fn list(State(s): State<AppState>, Query(p): Query<Pagination>) -> Json<Vec<Todo>> {\n    Json(s.page(p.offset, p.limit.min(100)))\n}",
      "explanation": "Endpoints that return everything work in development and fall over in production. Paginate and cap the page size from the first version — adding it later is a breaking change."
    }
  ];

  challenge: Challenge = {
    "title": "Map domain errors to HTTP",
    "language": "rust",
    "description": "Write an AppError enum with NotFound, Validation(String) and Conflict(String) variants and implement IntoResponse so they become 404, 422 and 409 with a JSON body {\"error\": message}. Then write a create_user(existing: &[&str], email: &str) -> Result<String, AppError> function that rejects an email without \"@\" (Validation) or one that already exists (Conflict). In main, convert three results into responses and print their status codes.",
    "hints": [
      "impl IntoResponse: let (status, msg) = match self { ... }; (status, Json(json!({\"error\": msg}))).into_response()",
      "Check validation before the conflict lookup.",
      "A Result<String, AppError> is itself IntoResponse, so you can call .into_response() on it directly."
    ],
    "starterCode": "use axum::{Json, http::StatusCode, response::{IntoResponse, Response}};\nuse serde_json::json;\n\nenum AppError {\n    // TODO\n}\n\nimpl IntoResponse for AppError {\n    fn into_response(self) -> Response {\n        todo!()\n    }\n}\n\nfn create_user(existing: &[&str], email: &str) -> Result<String, AppError> {\n    todo!()\n}\n\nfn main() {}",
    "solution": "use axum::{Json, http::StatusCode, response::{IntoResponse, Response}};\nuse serde_json::json;\n\n#[derive(Debug)]\nenum AppError {\n    NotFound,\n    Validation(String),\n    Conflict(String),\n}\n\nimpl IntoResponse for AppError {\n    fn into_response(self) -> Response {\n        let (status, msg) = match self {\n            AppError::NotFound => (StatusCode::NOT_FOUND, \"not found\".to_string()),\n            AppError::Validation(m) => (StatusCode::UNPROCESSABLE_ENTITY, m),\n            AppError::Conflict(m) => (StatusCode::CONFLICT, m),\n        };\n        (status, Json(json!({ \"error\": msg }))).into_response()\n    }\n}\n\nfn create_user(existing: &[&str], email: &str) -> Result<String, AppError> {\n    if !email.contains('@') {\n        return Err(AppError::Validation(format!(\"invalid email: {email}\")));\n    }\n    if existing.contains(&email) {\n        return Err(AppError::Conflict(format!(\"{email} already registered\")));\n    }\n    Ok(format!(\"created {email}\"))\n}\n\nfn main() {\n    let existing = [\"ada@example.com\"];\n    for email in [\"bob@example.com\", \"nope\", \"ada@example.com\"] {\n        let res = create_user(&existing, email).into_response();\n        println!(\"{email}: {}\", res.status());\n    }\n    println!(\"{}\", AppError::NotFound.into_response().status());\n    // bob@example.com: 200 OK\n    // nope: 422 Unprocessable Entity\n    // ada@example.com: 409 Conflict\n    // 404 Not Found\n}"
  };

  quiz: QuizQuestion[] = [
    {
      "q": "What status code fits a successful POST that created a resource?",
      "options": [
        "200 OK",
        "201 Created",
        "202 Accepted",
        "204 No Content"
      ],
      "answer": 1,
      "explanation": "201 Created, ideally with a Location header pointing at the new resource. 202 means accepted for later processing; 204 means success with no body."
    },
    {
      "q": "Why does a handler returning Result<String, anyhow::Error> fail to compile with axum?",
      "options": [
        "anyhow is async-incompatible",
        "anyhow::Error does not implement IntoResponse",
        "Result cannot be returned",
        "String is not a response"
      ],
      "answer": 1,
      "explanation": "Result<T, E> is a response only if both T and E implement IntoResponse. Wrap anyhow::Error in your own type that does."
    },
    {
      "q": "Which method is NOT idempotent by definition?",
      "options": [
        "GET",
        "PUT",
        "DELETE",
        "POST"
      ],
      "answer": 3,
      "explanation": "Repeating a POST typically creates another resource. GET, PUT and DELETE leave the same state when repeated."
    },
    {
      "q": "How should a PATCH body type represent \"do not change this field\"?",
      "options": [
        "Empty string",
        "Option<T> set to None",
        "A separate endpoint",
        "Default::default()"
      ],
      "answer": 1,
      "explanation": "Option fields that are absent in the JSON deserialize to None, which the handler treats as \"leave unchanged\"."
    },
    {
      "q": "What should a 500 response body contain?",
      "options": [
        "The full error chain",
        "The SQL that failed",
        "A generic message (with a request id), while the details go to the logs",
        "Nothing, 500 never has a body"
      ],
      "answer": 2,
      "explanation": "Internal details leak implementation information and are useless to clients. Log them server side and return a generic message."
    }
  ];

  qna: QnaItem[] = [
    {
      "q": "How do you structure error handling in an axum REST API?",
      "a": "Define one <code>AppError</code> enum (usually with <code>thiserror</code>) that covers the categories clients care about — not found, validation, conflict, unauthorized, internal — implement <code>IntoResponse</code> once to map each to a status code and a consistent JSON body, and add <code>#[from]</code> conversions for library errors. Handlers return <code>Result&lt;_, AppError&gt;</code> and use <code>?</code>. Internal errors are logged with context and returned as a generic 500."
    },
    {
      "q": "Why use separate request types instead of the database entity?",
      "a": "Request DTOs make the API contract explicit and prevent mass assignment: a client cannot set <code>id</code>, <code>is_admin</code> or <code>created_at</code> if those fields do not exist on <code>CreateUser</code>. They also let create and update differ (all fields required vs all optional) and keep the storage model free to evolve without breaking the HTTP API."
    },
    {
      "q": "How do you test a REST handler in Rust?",
      "a": "Build the <code>Router</code> (with an in-memory or test database state), construct a <code>Request</code> with method, URI, headers and a JSON body, call <code>app.oneshot(request).await</code> from <code>tower::ServiceExt</code>, then assert on the status, headers and the body decoded with <code>serde_json::from_slice</code>. For database-backed tests, <code>sqlx::test</code> creates an isolated database per test."
    },
    {
      "q": "Offset or cursor pagination?",
      "a": "<code>LIMIT/OFFSET</code> is simple and supports \"jump to page 7\", but the database still walks the skipped rows, so deep pages get slow, and inserts shift results between requests. Keyset (cursor) pagination filters with <code>WHERE id &gt; last_seen ORDER BY id LIMIT n</code>, which stays fast at any depth and is stable under concurrent writes. Many APIs use offsets for small admin lists and cursors for feeds and exports."
    }
  ];

  revision: RevisionSummary = {
    "oneLiner": "A Rust REST API is a set of Result-returning axum handlers, a single AppError that maps to status codes, explicit request DTOs, pagination and oneshot tests.",
    "mustKnow": [
      "Use the right status codes: 201 + Location, 204 on delete, 404, 409, 422, 500.",
      "One <code>AppError</code> with <code>IntoResponse</code>; handlers return <code>Result&lt;_, AppError&gt;</code> and use <code>?</code>.",
      "<code>anyhow::Error</code> cannot be returned directly — wrap it.",
      "Separate create/update DTOs; PATCH fields are <code>Option&lt;T&gt;</code>.",
      "Log internal errors, return generic 500 bodies.",
      "Paginate and cap list endpoints from the first version."
    ],
    "interviewFocus": [
      "Design the error type for a Rust web API.",
      "Explain idempotency of HTTP methods and how to handle POST retries.",
      "Explain how you test handlers without a running server."
    ]
  };
}
