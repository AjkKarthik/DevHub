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
  selector: 'app-rust-web-frameworks',
  standalone: true,
  imports: [PageMetaComponent, PrerequisitesComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './web-frameworks.html',
  styleUrl: './web-frameworks.scss'
})
export class RustWebFrameworks {
  readingTime = 26;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = "Rust 2024";
  route = 'rust-web-frameworks';
  nextRoute = '/rust/rest-apis';
  nextLabel = "Building REST APIs";

  prerequisites: Prerequisite[] = [
    {
      "label": "Async/Await",
      "route": "/rust/async-await"
    },
    {
      "label": "Traits & Generics",
      "route": "/rust/traits-generics"
    }
  ];

  quickRef: QuickRefItem[] = [
    {
      "name": "Router::new().route(\"/users/{id}\", get(h))",
      "type": "function",
      "desc": "Map a path and method to a handler; captures use {name} since 0.8"
    },
    {
      "name": "async fn h(...) -> impl IntoResponse",
      "type": "function",
      "desc": "A handler: extractor arguments in, anything IntoResponse out"
    },
    {
      "name": "Path<T> / Query<T>",
      "type": "type",
      "desc": "Deserialize path captures and the query string with serde"
    },
    {
      "name": "Json<T>",
      "type": "type",
      "desc": "Extractor that parses the body (must be last) and a response that serializes T"
    },
    {
      "name": "State<S> + .with_state(s)",
      "type": "type",
      "desc": "Shared application state; S must be Clone (wrap expensive parts in Arc)"
    },
    {
      "name": "(StatusCode, Json<T>)",
      "type": "syntax",
      "desc": "Tuples combine a status, headers and a body into one response"
    },
    {
      "name": "impl FromRequestParts<S>",
      "type": "interface",
      "desc": "Write a custom extractor (native async fn since 0.8, no #[async_trait])"
    },
    {
      "name": ".layer(TraceLayer::new_for_http())",
      "type": "method",
      "desc": "Wrap routes in tower middleware; the last .layer call runs first"
    },
    {
      "name": "axum::serve(listener, app)",
      "type": "function",
      "desc": "Serve a Router on a tokio::net::TcpListener"
    },
    {
      "name": "app.oneshot(request)",
      "type": "method",
      "desc": "tower::ServiceExt: call the router in tests without a socket"
    }
  ];

  theory: TheoryPoint[] = [
    {
      "heading": "What Axum is made of",
      "points": [
        "Axum is a thin routing and extraction layer maintained by the Tokio team. Tokio runs the tasks, hyper speaks HTTP/1 and HTTP/2, and tower supplies the <code>Service</code> and <code>Layer</code> abstractions that middleware is built from.",
        "A <code>Router</code> is itself a tower <code>Service</code>, so anything written for tower (timeouts, rate limits, tracing, compression, CORS from <code>tower-http</code>) plugs straight in.",
        "Handlers are plain <code>async fn</code>s. There are no handler traits to implement and no macros on the handler: axum implements <code>Handler</code> for any async function whose arguments are extractors and whose return type implements <code>IntoResponse</code>.",
        "Axum 0.8 (January 2025) changed the path syntax to <code>/{id}</code> and <code>/{*rest}</code>, removed <code>#[async_trait]</code> from <code>FromRequestParts</code>/<code>FromRequest</code> in favour of native async trait methods, and made <code>Option&lt;T&gt;</code> extraction require the new <code>OptionalFromRequestParts</code> trait."
      ]
    },
    {
      "heading": "Extractors",
      "points": [
        "An extractor pulls one piece of the request apart: <code>Path&lt;T&gt;</code>, <code>Query&lt;T&gt;</code>, <code>HeaderMap</code>, <code>Method</code>, <code>State&lt;S&gt;</code>, <code>Json&lt;T&gt;</code>, <code>Form&lt;T&gt;</code>, <code>String</code>, <code>Bytes</code>. If extraction fails, axum returns the extractor rejection (for example 400 or 422) and the handler never runs.",
        "<code>Path</code> and <code>Query</code> deserialize with serde, so <code>Path&lt;u32&gt;</code>, <code>Path&lt;(String, u32)&gt;</code> or a struct with <code>#[derive(Deserialize)]</code> all work.",
        "Extractors that only read the request head implement <code>FromRequestParts</code>. Extractors that consume the body implement <code>FromRequest</code>, and only one of those can run — that is why the body extractor must be the last argument.",
        "Wrapping an extractor in <code>Result&lt;Json&lt;T&gt;, JsonRejection&gt;</code> lets you handle the rejection yourself, for example to return your own error format."
      ]
    },
    {
      "heading": "Responses",
      "points": [
        "Anything that implements <code>IntoResponse</code> can be returned: <code>&amp;str</code>, <code>String</code>, <code>StatusCode</code>, <code>Json&lt;T&gt;</code>, <code>Html&lt;T&gt;</code>, <code>Redirect</code>, and tuples that add a status code and headers in front of a body.",
        "Return <code>Result&lt;T, E&gt;</code> where both sides implement <code>IntoResponse</code> to use <code>?</code> in handlers. The usual pattern is one <code>AppError</code> enum with an <code>IntoResponse</code> impl that maps each variant to a status code (see the REST APIs page).",
        "When one handler returns different response types on different branches, call <code>.into_response()</code> on each so they share the concrete <code>Response</code> type."
      ]
    },
    {
      "heading": "State and middleware",
      "points": [
        "<code>Router::with_state(state)</code> provides a value that handlers receive through <code>State&lt;S&gt;</code>. axum clones it for every request, so keep it cheap to clone: put the database pool, configuration and caches behind an <code>Arc</code>.",
        "Mutable shared data needs interior mutability: <code>Arc&lt;Mutex&lt;T&gt;&gt;</code> or <code>Arc&lt;RwLock&lt;T&gt;&gt;</code>. A <code>std::sync::Mutex</code> is fine as long as the guard is dropped before any <code>.await</code>; use <code>tokio::sync::Mutex</code> only when you must hold the lock across an await.",
        "<code>.layer(L)</code> wraps every route added before it. Each additional <code>.layer</code> call wraps the previous result, so the layer added last is the outermost and sees the request first. <code>tower::ServiceBuilder</code> lists layers in top-to-bottom execution order instead.",
        "<code>route_layer</code> applies middleware only to matched routes (useful for authentication, so unknown paths still return 404 instead of 401). <code>axum::middleware::from_fn</code> turns an async function into a layer."
      ]
    },
    {
      "heading": "Axum vs Actix Web",
      "points": [
        "Both are fast, mature and production-ready; the measured difference in typical services is dominated by your database and serialization, not the framework.",
        "Actix Web runs one single-threaded Tokio runtime per worker thread, so handler futures do not need to be <code>Send</code>. Axum runs on the normal multi-threaded Tokio runtime, so handler futures must be <code>Send</code> — the source of the MutexGuard-across-await error.",
        "Actix Web has its own middleware and service traits; Axum reuses the tower ecosystem, which is also used by tonic (gRPC) and hyper-based clients.",
        "Pick Axum when you want plain async functions, tower middleware and close alignment with the Tokio ecosystem; Actix Web remains a good choice with a large existing ecosystem of its own."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Router & server",
      "code": "use axum::{Router, routing::get};\n\nasync fn root() -> &'static str {\n    \"hello from axum\"\n}\n\nasync fn health() -> &'static str {\n    \"ok\"\n}\n\n#[tokio::main]\nasync fn main() {\n    let api = Router::new().route(\"/health\", get(health));\n\n    let app = Router::new()\n        .route(\"/\", get(root))\n        .nest(\"/api\", api);            // /api/health\n\n    let listener = tokio::net::TcpListener::bind(\"127.0.0.1:3000\").await.unwrap();\n    println!(\"listening on {}\", listener.local_addr().unwrap());\n    axum::serve(listener, app).await.unwrap();\n}",
      "language": "rust"
    },
    {
      "label": "Extractors & responses",
      "code": "use axum::{\n    Json, Router,\n    body::Body,\n    extract::{Path, Query},\n    http::{Request, StatusCode},\n    response::IntoResponse,\n    routing::{get, post},\n};\nuse http_body_util::BodyExt;\nuse serde::{Deserialize, Serialize};\nuse tower::ServiceExt; // for oneshot\n\n#[derive(Deserialize)]\nstruct Paging { page: Option<u32> }\n\n#[derive(Deserialize)]\nstruct NewUser { name: String }\n\n#[derive(Serialize)]\nstruct User { id: u32, name: String }\n\nasync fn get_user(Path(id): Path<u32>, Query(p): Query<Paging>) -> String {\n    format!(\"user {id}, page {}\", p.page.unwrap_or(1))\n}\n\n// Json body extractor is the LAST argument\nasync fn create_user(Json(input): Json<NewUser>) -> impl IntoResponse {\n    (StatusCode::CREATED, Json(User { id: 7, name: input.name }))\n}\n\nasync fn call(app: Router, req: Request<Body>) -> (StatusCode, String) {\n    let res = app.oneshot(req).await.unwrap();\n    let status = res.status();\n    let bytes = res.into_body().collect().await.unwrap().to_bytes();\n    (status, String::from_utf8(bytes.to_vec()).unwrap())\n}\n\n#[tokio::main]\nasync fn main() {\n    let app = Router::new()\n        .route(\"/users/{id}\", get(get_user))\n        .route(\"/users\", post(create_user));\n\n    let r = Request::get(\"/users/42?page=3\").body(Body::empty()).unwrap();\n    println!(\"{:?}\", call(app.clone(), r).await);\n    // (200, \"user 42, page 3\")\n\n    let r = Request::get(\"/users/abc\").body(Body::empty()).unwrap();\n    println!(\"{:?}\", call(app.clone(), r).await.0); // 400: Path rejection\n\n    let r = Request::post(\"/users\")\n        .header(\"content-type\", \"application/json\")\n        .body(Body::from(r#\"{\"name\":\"ada\"}\"#))\n        .unwrap();\n    println!(\"{:?}\", call(app.clone(), r).await);\n    // (201, \"{\\\"id\\\":7,\\\"name\\\":\\\"ada\\\"}\")\n\n    let r = Request::post(\"/users\")\n        .header(\"content-type\", \"application/json\")\n        .body(Body::from(r#\"{\"nme\":\"ada\"}\"#))\n        .unwrap();\n    println!(\"{:?}\", call(app, r).await.0); // 422: missing field\n}",
      "language": "rust"
    },
    {
      "label": "State & layers",
      "code": "use std::sync::{Arc, Mutex};\n\nuse axum::{\n    Router,\n    body::Body,\n    extract::State,\n    http::Request,\n    routing::{get, post},\n};\nuse tower::ServiceExt;\nuse tower_http::trace::TraceLayer;\n\n#[derive(Clone, Default)]\nstruct AppState {\n    hits: Arc<Mutex<u64>>, // cheap to clone: just an Arc\n}\n\nasync fn hit(State(state): State<AppState>) -> String {\n    let n = {\n        let mut hits = state.hits.lock().unwrap();\n        *hits += 1;\n        *hits\n    }; // guard dropped here, before any .await\n    format!(\"hit #{n}\")\n}\n\nasync fn count(State(state): State<AppState>) -> String {\n    state.hits.lock().unwrap().to_string()\n}\n\n#[tokio::main]\nasync fn main() {\n    let state = AppState::default();\n    let app = Router::new()\n        .route(\"/hit\", post(hit))\n        .route(\"/count\", get(count))\n        .layer(TraceLayer::new_for_http())\n        .with_state(state.clone());\n\n    for _ in 0..3 {\n        let req = Request::post(\"/hit\").body(Body::empty()).unwrap();\n        app.clone().oneshot(req).await.unwrap();\n    }\n    println!(\"hits = {}\", state.hits.lock().unwrap()); // hits = 3\n}",
      "language": "rust"
    },
    {
      "label": "Custom extractor",
      "code": "use axum::{\n    Router,\n    body::Body,\n    extract::FromRequestParts,\n    http::{Request, StatusCode, request::Parts},\n    routing::get,\n};\nuse tower::ServiceExt;\n\nstruct ApiKey(String);\n\n// Axum 0.8: a native async fn, no #[async_trait]\nimpl<S: Send + Sync> FromRequestParts<S> for ApiKey {\n    type Rejection = (StatusCode, &'static str);\n\n    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, Self::Rejection> {\n        parts\n            .headers\n            .get(\"x-api-key\")\n            .and_then(|v| v.to_str().ok())\n            .map(|k| ApiKey(k.to_string()))\n            .ok_or((StatusCode::UNAUTHORIZED, \"missing x-api-key\"))\n    }\n}\n\nasync fn secret(ApiKey(key): ApiKey) -> String {\n    format!(\"welcome, key ending {}\", &key[key.len() - 2..])\n}\n\n#[tokio::main]\nasync fn main() {\n    let app = Router::new().route(\"/secret\", get(secret));\n\n    let ok = Request::get(\"/secret\").header(\"x-api-key\", \"abc123\").body(Body::empty()).unwrap();\n    println!(\"{}\", app.clone().oneshot(ok).await.unwrap().status()); // 200 OK\n\n    let no = Request::get(\"/secret\").body(Body::empty()).unwrap();\n    println!(\"{}\", app.oneshot(no).await.unwrap().status());         // 401 Unauthorized\n}",
      "language": "rust"
    }
  ];

  mistakes: CommonMistake[] = [
    {
      "title": "Using the pre-0.8 :id path syntax",
      "wrong": "Router::new().route(\"/users/:id\", get(get_user))\n// panics when the route is added in axum 0.8",
      "right": "Router::new().route(\"/users/{id}\", get(get_user))\n// wildcards: \"/files/{*path}\"",
      "explanation": "Axum 0.8 switched to {capture} syntax. The old :id form still compiles but Router::route panics with \"Path segments must not start with :. For capture groups, use {capture}\" as soon as the router is built."
    },
    {
      "title": "Putting the Json extractor before another argument",
      "wrong": "async fn create(Json(u): Json<NewUser>, Path(id): Path<u32>) -> String { u.name }\nRouter::new().route(\"/teams/{id}/users\", post(create))\n}",
      "right": "async fn create(Path(id): Path<u32>, Json(u): Json<NewUser>) -> String { u.name }\nRouter::new().route(\"/teams/{id}/users\", post(create))\n}",
      "explanation": "Only the last argument may consume the request body (FromRequest). With Json first, the function does not implement Handler and the error points at post(create). #[debug_handler] (macros feature) explains exactly which argument is wrong."
    },
    {
      "title": "Holding a std MutexGuard across .await",
      "wrong": "async fn bump(State(s): State<Arc<Mutex<u64>>>) {\n    let mut n = s.lock().unwrap();\n    *n += 1;\n    save(*n).await; // guard still alive here\n}\nRouter::new().route(\"/bump\", post(bump)).with_state(state)\n}",
      "right": "async fn bump(State(s): State<Arc<Mutex<u64>>>) {\n    let value = {\n        let mut n = s.lock().unwrap();\n        *n += 1;\n        *n\n    }; // guard dropped before awaiting\n    save(value).await;\n}\nRouter::new().route(\"/bump\", post(bump)).with_state(state)\n}",
      "explanation": "std::sync::MutexGuard is !Send, so a future holding it across an await is !Send and axum rejects the handler. Scope the guard so it drops before the await, or use tokio::sync::Mutex when the lock genuinely must span an await."
    },
    {
      "title": "Forgetting with_state",
      "wrong": "async fn run(listener: tokio::net::TcpListener) {\n    let app = Router::new().route(\"/\", get(h));\n    axum::serve(listener, app).await.unwrap();\n}",
      "right": "async fn run(listener: tokio::net::TcpListener) {\n    let app = Router::new().route(\"/\", get(h)).with_state(AppState);\n    axum::serve(listener, app).await.unwrap();\n}",
      "explanation": "A router whose handlers need State<AppState> has type Router<AppState>; only Router<()> can be served. Calling with_state supplies the state and turns it into Router<()>."
    },
    {
      "title": "Expecting the first .layer to run first",
      "wrong": "Router::new()\n    .route(\"/\", get(h))\n    .layer(auth_layer)      // runs SECOND\n    .layer(trace_layer)     // runs FIRST (outermost)",
      "right": "use tower::ServiceBuilder;\nRouter::new()\n    .route(\"/\", get(h))\n    .layer(ServiceBuilder::new()\n        .layer(trace_layer)  // runs first\n        .layer(auth_layer))  // then auth",
      "explanation": "Each .layer call wraps everything before it, so the last one added is the outermost. ServiceBuilder reads top to bottom in execution order, which is easier to reason about when you stack several layers."
    }
  ];

  challenge: Challenge = {
    "title": "A tiny in-memory notes API",
    "language": "rust",
    "description": "Build a Router with shared state Arc<Mutex<Vec<String>>>: POST /notes takes a JSON body {\"text\": \"...\"} and returns 201 with the new note id (its index), GET /notes/{id} returns the note text or 404, and GET /notes returns the count. Exercise it with tower::ServiceExt::oneshot in main — no real socket.",
    "hints": [
      "type Notes = Arc<Mutex<Vec<String>>>; and .with_state(notes)",
      "Return Result<String, StatusCode> from get_note so a missing id becomes 404.",
      "Read the response body with http_body_util::BodyExt::collect()."
    ],
    "starterCode": "use std::sync::{Arc, Mutex};\nuse axum::{Json, Router, extract::{Path, State}, http::StatusCode, routing::{get, post}};\n\ntype Notes = Arc<Mutex<Vec<String>>>;\n\n#[derive(serde::Deserialize)]\nstruct NewNote { text: String }\n\n// TODO: create_note, get_note, count_notes handlers\n\nfn app(notes: Notes) -> Router {\n    todo!()\n}\n\n#[tokio::main]\nasync fn main() {\n    // TODO: build the app and call it with oneshot\n}",
    "solution": "use std::sync::{Arc, Mutex};\nuse axum::{\n    Json, Router,\n    body::Body,\n    extract::{Path, State},\n    http::{Request, StatusCode},\n    routing::{get, post},\n};\nuse http_body_util::BodyExt;\nuse tower::ServiceExt;\n\ntype Notes = Arc<Mutex<Vec<String>>>;\n\n#[derive(serde::Deserialize)]\nstruct NewNote { text: String }\n\nasync fn create_note(State(notes): State<Notes>, Json(n): Json<NewNote>) -> (StatusCode, String) {\n    let mut v = notes.lock().unwrap();\n    v.push(n.text);\n    (StatusCode::CREATED, (v.len() - 1).to_string())\n}\n\nasync fn get_note(State(notes): State<Notes>, Path(id): Path<usize>) -> Result<String, StatusCode> {\n    notes.lock().unwrap().get(id).cloned().ok_or(StatusCode::NOT_FOUND)\n}\n\nasync fn count_notes(State(notes): State<Notes>) -> String {\n    notes.lock().unwrap().len().to_string()\n}\n\nfn app(notes: Notes) -> Router {\n    Router::new()\n        .route(\"/notes\", post(create_note).get(count_notes))\n        .route(\"/notes/{id}\", get(get_note))\n        .with_state(notes)\n}\n\nasync fn send(app: &Router, req: Request<Body>) -> String {\n    let res = app.clone().oneshot(req).await.unwrap();\n    let status = res.status().as_u16();\n    let body = res.into_body().collect().await.unwrap().to_bytes();\n    format!(\"{status} {}\", String::from_utf8_lossy(&body))\n}\n\n#[tokio::main]\nasync fn main() {\n    let app = app(Notes::default());\n    let post_note = |t: &str| Request::post(\"/notes\")\n        .header(\"content-type\", \"application/json\")\n        .body(Body::from(format!(r#\"{{\"text\":\"{t}\"}}\"#)))\n        .unwrap();\n\n    println!(\"{}\", send(&app, post_note(\"buy milk\")).await); // 201 0\n    println!(\"{}\", send(&app, post_note(\"ship it\")).await);  // 201 1\n    println!(\"{}\", send(&app, Request::get(\"/notes/1\").body(Body::empty()).unwrap()).await); // 200 ship it\n    println!(\"{}\", send(&app, Request::get(\"/notes/9\").body(Body::empty()).unwrap()).await); // 404\n    println!(\"{}\", send(&app, Request::get(\"/notes\").body(Body::empty()).unwrap()).await);   // 200 2\n}"
  };

  quiz: QuizQuestion[] = [
    {
      "q": "In axum 0.8, how do you declare a path capture named id?",
      "options": [
        "/users/:id",
        "/users/{id}",
        "/users/<id>",
        "/users/*id"
      ],
      "answer": 1,
      "explanation": "Axum 0.8 uses {id} (and {*rest} for wildcards). The older :id form panics when the route is registered."
    },
    {
      "q": "Which extractor must be the last handler argument?",
      "options": [
        "Path<T>",
        "State<S>",
        "Json<T>",
        "HeaderMap"
      ],
      "answer": 2,
      "explanation": "Json consumes the request body (FromRequest). Only the final argument may do that; the others implement FromRequestParts."
    },
    {
      "q": "Why does axum reject a handler that holds a std::sync::MutexGuard across .await?",
      "options": [
        "MutexGuard is not Clone",
        "The handler future becomes !Send",
        "Mutex is not allowed in State",
        "It deadlocks at compile time"
      ],
      "answer": 1,
      "explanation": "Axum runs on the multi-threaded Tokio runtime, so handler futures must be Send. A std MutexGuard is !Send, so holding it across an await makes the future !Send."
    },
    {
      "q": "Router::new().route(...).layer(A).layer(B) — which layer sees the request first?",
      "options": [
        "A",
        "B",
        "Both at once",
        "Neither, layers only see responses"
      ],
      "answer": 1,
      "explanation": "Each .layer wraps the existing service, so B wraps A and is the outermost layer that receives the request first."
    },
    {
      "q": "What does a Path<u32> extractor do when the segment is \"abc\"?",
      "options": [
        "Passes 0",
        "Panics",
        "Returns a 400 rejection without calling the handler",
        "Calls the handler with None"
      ],
      "answer": 2,
      "explanation": "Extraction failures become rejections that are returned as responses (400 for a bad path parameter); the handler never runs."
    },
    {
      "q": "What type must S be for State<S>?",
      "options": [
        "Copy",
        "Clone (and Send + Sync + static for serving)",
        "Default",
        "Serialize"
      ],
      "answer": 1,
      "explanation": "Axum clones the state for each request, so S must be Clone. Wrapping expensive parts in Arc keeps the clone cheap."
    }
  ];

  qna: QnaItem[] = [
    {
      "q": "How does axum decide that an async function is a handler?",
      "a": "Axum implements the <code>Handler</code> trait for async functions of up to 16 arguments when every argument except the last implements <code>FromRequestParts&lt;S&gt;</code>, the last implements <code>FromRequest&lt;S&gt;</code>, and the output implements <code>IntoResponse</code>. There is no registration macro. When those bounds fail you get a long generic error at the <code>route</code> call; the <code>#[debug_handler]</code> attribute from the <code>macros</code> feature reports the specific argument or return type that is wrong."
    },
    {
      "q": "How do you share a database pool or configuration between handlers?",
      "a": "Put it in a state struct that derives <code>Clone</code>, wrap anything expensive or mutable in <code>Arc</code> (for example <code>Arc&lt;Config&gt;</code> or a pool type that is already an <code>Arc</code> internally), call <code>.with_state(state)</code> on the router, and add <code>State(state): State&lt;AppState&gt;</code> to the handlers that need it. With <code>FromRef</code> you can also extract a sub-field such as <code>State&lt;PgPool&gt;</code> directly."
    },
    {
      "q": "How do you test an axum application without opening a port?",
      "a": "A <code>Router</code> is a tower <code>Service</code>, so tests can build a <code>Request</code> with <code>Request::builder()</code> and call <code>app.oneshot(request).await</code> from <code>tower::ServiceExt</code>. Read the body with <code>http_body_util::BodyExt::collect()</code>. This exercises routing, extractors, handlers and layers exactly as in production, just without the network."
    },
    {
      "q": "What changed in axum 0.8?",
      "a": "The main user-facing changes were the new path syntax (<code>/{id}</code> and <code>/{*rest}</code> instead of <code>/:id</code> and <code>/*rest</code>), native async trait methods in <code>FromRequestParts</code> and <code>FromRequest</code> (no <code>#[async_trait]</code>), and <code>Option&lt;T&gt;</code> extraction now requiring the extractor to implement <code>OptionalFromRequestParts</code>, so errors other than \"missing\" are no longer silently turned into <code>None</code>."
    },
    {
      "q": "When would you pick Actix Web over Axum?",
      "a": "Both handle production load well. Actix Web runs one single-threaded runtime per worker, so its handlers do not need to be <code>Send</code>, which can simplify code that uses non-thread-safe types; it also has a long-established ecosystem of its own middleware. Axum fits best when you want plain async functions, the tower middleware ecosystem shared with tonic and hyper, and close alignment with Tokio."
    }
  ];

  revision: RevisionSummary = {
    "oneLiner": "Axum turns plain async functions into handlers: extractors in, IntoResponse out, state via with_state and middleware via tower layers.",
    "mustKnow": [
      "Path captures are <code>{id}</code> since axum 0.8; <code>:id</code> panics at route registration.",
      "Every argument but the last is <code>FromRequestParts</code>; the last may consume the body (<code>Json</code>, <code>Form</code>, <code>String</code>).",
      "Extraction failures return a rejection response; the handler does not run.",
      "<code>State&lt;S&gt;</code> needs <code>S: Clone</code>; keep it cheap with <code>Arc</code>.",
      "Handler futures must be <code>Send</code> — drop std mutex guards before <code>.await</code>.",
      "The last <code>.layer</code> added is the outermost; <code>ServiceBuilder</code> lists layers in execution order.",
      "Test with <code>tower::ServiceExt::oneshot</code>, no socket required."
    ],
    "interviewFocus": [
      "Explain how axum infers the Handler trait from a function signature.",
      "Explain why a MutexGuard across await breaks a handler.",
      "Compare axum with Actix Web (runtime model, Send requirements, middleware).",
      "Describe how you would structure shared state and testing for an axum service."
    ]
  };
}
