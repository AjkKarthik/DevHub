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
  selector: 'app-python-fastapi',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fastapi.html',
  styleUrl: './fastapi.scss'
})
export class PythonFastapi {
  readingTime = 28; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'; since = 'FastAPI 0.100+';
  route = 'py-fastapi'; nextRoute = '/python/django'; nextLabel = 'Django';

  quickRef: QuickRefItem[] = [
    { name: '@app.get("/path")', type: 'decorator', desc: 'Route decorator. HTTP verbs: get, post, put, patch, delete, head, options. Path params in {braces}.' },
    { name: 'Depends(fn)', type: 'function', desc: 'Dependency injection. FastAPI calls fn (can be async) and passes its return value as the parameter.' },
    { name: 'HTTPException(status_code, detail)', type: 'class', desc: 'Raise to return an HTTP error response. detail is included in the JSON body as {"detail": ...}.' },
    { name: 'BackgroundTasks', type: 'class', desc: 'Run code after the response is sent. .add_task(fn, *args). Good for emails, analytics, cache invalidation.' },
    { name: 'APIRouter(prefix, tags)', type: 'class', desc: 'Group routes into a module. app.include_router(router). Prefix applied to all child routes.' },
    { name: 'lifespan(app)', type: 'function', desc: '@asynccontextmanager lifespan: setup before yield, teardown after. Replaces on_event("startup").' },
    { name: 'Request.state', type: 'keyword', desc: 'Arbitrary state attached to the request object. Used by middleware to pass data to route handlers.' },
    { name: 'OAuth2PasswordBearer', type: 'class', desc: 'Extracts Bearer token from Authorization header. Used as a Depends() dependency for protected routes.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Path Operations and Request Parsing',
      points: [
        'FastAPI route functions receive typed parameters that are automatically parsed and validated from the request. Path parameters (in {braces}) and query parameters (function args not in the body) are parsed from the URL. Body parameters are Pydantic models. FastAPI distinguishes them by their types and annotations.',
        'Pydantic models as function parameters are treated as request bodies. FastAPI calls model.model_validate(request_json) and injects the parsed model. If validation fails, FastAPI returns a 422 Unprocessable Entity with detailed error information. This removes all manual JSON parsing and validation boilerplate.',
        'Response models: set response_model=MyModel on the route decorator to filter and serialise the response. Fields not in the response model are automatically excluded. response_model_exclude_none=True omits null fields. This separates the internal representation (DB model with passwords) from the API response (model without passwords).',
        'Status codes: set status_code=201 for creation, 204 for deletion with no content. Use status.HTTP_201_CREATED from fastapi for named constants. For dynamic status codes, return Response(content=json.dumps(data), status_code=201, media_type="application/json").',
      ]
    },
    {
      heading: 'Dependency Injection',
      points: [
        'Depends() is FastAPI\'s dependency injection system. FastAPI inspects the signature of your dependency function and recursively resolves its dependencies too. Dependencies can be async or sync, can raise HTTPException (which cancels the request), and can yield (acting as context managers with cleanup).',
        'Generator dependencies: def get_db() -> Generator: db = SessionLocal(); try: yield db; finally: db.close(). FastAPI calls the generator, uses the yielded value for the duration of the request, then continues execution past the yield for cleanup. This is the standard pattern for database session management.',
        'Dependency caching: if the same dependency function appears multiple times in a route (directly and transitively), FastAPI calls it only once per request and caches the result. Override with use_cache=False in Depends(fn, use_cache=False).',
        'Security dependencies: OAuth2PasswordBearer returns the raw token. A custom get_current_user dependency uses that token to look up the user from the database. Stacking dependencies: authenticate → authorise → rate-limit. Each dependency can raise HTTPException(401), HTTPException(403), etc.',
      ]
    },
    {
      heading: 'Middleware, Lifespan, and Background Tasks',
      points: [
        'Middleware processes every request and response. Add with app.add_middleware(MyMiddleware) or @app.middleware("http"). Middleware receives the request and a call_next function: call_next(request) passes the request to the next middleware or route handler. Use middleware for: CORS, request logging, timing, auth header injection.',
        'Lifespan (FastAPI 0.93+): @asynccontextmanager async def lifespan(app): setup(); yield; teardown(). Pass to FastAPI(lifespan=lifespan). Code before yield runs on startup; code after yield runs on shutdown. Use for: creating DB connection pools, loading ML models, connecting to message brokers.',
        'BackgroundTasks: inject BackgroundTasks as a function parameter. Call .add_task(fn, *args). The task runs AFTER the response is sent to the client, in the same process (not in a separate worker). Good for: sending confirmation emails, logging audit events, cache invalidation. For heavy/reliable tasks, use Celery.',
        'CORS: app.add_middleware(CORSMiddleware, allow_origins=["https://myapp.com"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]). In development, allow_origins=["*"]. In production, list specific origins. CORS must be the outermost middleware — add it last.',
      ]
    },
    {
      heading: 'Routers, Testing, and Deployment',
      points: [
        'APIRouter organises routes into separate files: router = APIRouter(prefix="/users", tags=["users"]); @router.get("/{id}"); app.include_router(router). Tags group routes in the OpenAPI docs. Dependencies passed to include_router(router, dependencies=[Depends(auth)]) apply to ALL routes in that router.',
        'Testing with TestClient: from fastapi.testclient import TestClient; client = TestClient(app); response = client.get("/users/1"). TestClient runs the ASGI app in a synchronous wrapper. For async tests, use httpx.AsyncClient with ASGITransport: async with AsyncClient(app=app, base_url="http://test") as c: resp = await c.get("/").',
        'Deployment: run with uvicorn: uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4. For production, use gunicorn with uvicorn worker: gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker. Behind Nginx or a load balancer. Docker: uvicorn in CMD with --proxy-headers for correct IP forwarding.',
        'Performance tips: use async route functions only if you call async libraries (await db.fetch, await redis.get). Using async def with sync blocking calls (requests.get inside async def) BLOCKS the event loop — use run_in_executor. For pure sync code, sync route functions are fine — FastAPI runs them in a thread pool automatically.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Routes & models',
      language: 'typescript',
      code: `from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager
from typing import Annotated

# Database stub
fake_db: dict[int, dict] = {}

class UserCreate(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=100)]
    email: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup: init DB pool, load models, etc.
    print("Starting up...")
    yield
    # shutdown: cleanup
    print("Shutting down...")

app = FastAPI(title="User API", version="1.0", lifespan=lifespan)

# Dependency — DB session (generator pattern)
def get_db():
    db = fake_db   # in real app: SessionLocal()
    try:
        yield db
    finally:
        pass       # close session

DB = Annotated[dict, Depends(get_db)]

@app.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: DB, tasks: BackgroundTasks):
    new_id = max(db.keys(), default=0) + 1
    db[new_id] = {"id": new_id, "name": user.name, "email": user.email}
    tasks.add_task(send_welcome_email, user.email)   # after response
    return db[new_id]

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: DB):
    if user_id not in db:
        raise HTTPException(status_code=404, detail="User not found")
    return db[user_id]

@app.get("/users", response_model=list[UserResponse])
async def list_users(skip: int = 0, limit: int = 10, db: DB = None):
    users = list(db.values())
    return users[skip: skip + limit]

def send_welcome_email(email: str) -> None:
    print(f"Sending welcome email to {email}")   # runs after response`
    },
    {
      label: 'Auth & Routers',
      language: 'typescript',
      code: `from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import secrets

# --- Auth dependency chain ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

fake_users = {
    "alice": {"username": "alice", "hashed_password": "fakehash_secret", "role": "admin"}
}

def verify_token(token: str) -> dict:
    # In production: decode JWT, verify signature
    username = token.replace("Bearer_", "")
    if username not in fake_users:
        raise HTTPException(status_code=401, detail="Invalid token",
                            headers={"WWW-Authenticate": "Bearer"})
    return fake_users[username]

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    return verify_token(token)

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin required")
    return user

AdminUser = Annotated[dict, Depends(require_admin)]

# --- Auth router ---
auth_router = APIRouter(prefix="/auth", tags=["Auth"])

@auth_router.post("/token")
async def login(form: OAuth2PasswordRequestForm = Depends()):
    user = fake_users.get(form.username)
    if not user or form.password != "secret":
        raise HTTPException(status_code=401, detail="Bad credentials")
    token = f"Bearer_{form.username}"
    return {"access_token": token, "token_type": "bearer"}

# --- Admin router (all routes require admin) ---
admin_router = APIRouter(prefix="/admin", tags=["Admin"],
                         dependencies=[Depends(require_admin)])

@admin_router.get("/users")
async def admin_list_users():
    return list(fake_users.values())

# --- App ---
from fastapi import FastAPI
from typing import Annotated

app = FastAPI()
app.include_router(auth_router)
app.include_router(admin_router)

# Testing
from fastapi.testclient import TestClient
client = TestClient(app)

resp = client.post("/auth/token", data={"username": "alice", "password": "secret"})
token = resp.json()["access_token"]
resp2 = client.get("/admin/users", headers={"Authorization": f"Bearer {token}"})`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using async def with blocking sync code',
      wrong: `@app.get("/data")
async def get_data():
    resp = requests.get("https://api.example.com/data")   # blocks event loop!
    return resp.json()`,
      right: `@app.get("/data")
async def get_data():
    async with aiohttp.ClientSession() as s:
        async with s.get("https://api.example.com/data") as r:
            return await r.json()

# Or if you must use requests:
@app.get("/data")
async def get_data():
    return await asyncio.to_thread(lambda: requests.get("...").json())`,
      explanation: 'In async def route handlers, blocking calls (requests.get, time.sleep, synchronous file I/O) freeze the event loop — all other requests queue up. Use aiohttp/httpx for HTTP, asyncpg/aiomysql for databases, aiofiles for file I/O. If you must use a sync library, wrap with asyncio.to_thread().'
    },
    {
      title: 'Returning DB model directly instead of response_model',
      wrong: `@app.get("/users/{id}")
async def get_user(id: int, db: Session = Depends(get_db)):
    return db.query(User).filter(User.id == id).first()   # includes password_hash!`,
      right: `class UserResponse(BaseModel):
    id: int; name: str; email: str  # no password_hash

@app.get("/users/{id}", response_model=UserResponse)
async def get_user(id: int, db: Session = Depends(get_db)):
    return db.query(User).filter(User.id == id).first()`,
      explanation: 'Without response_model, FastAPI serialises whatever you return — including sensitive fields like password_hash, internal IDs, or raw ORM objects. response_model filters the response through a Pydantic model, ensuring only the intended fields are exposed. Always set response_model for GET endpoints.'
    },
    {
      title: 'Not using generator dependencies for DB sessions',
      wrong: `def get_db():
    return SessionLocal()   # session never closed if exception raised!`,
      right: `def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()   # always closes, even on exception`,
      explanation: 'Returning the session directly means there is no cleanup if an exception is raised during request processing. The generator pattern (yield + finally) guarantees cleanup: FastAPI calls the generator, uses the yielded value, and then resumes execution past the yield for cleanup — whether the route succeeded or raised an exception.'
    },
    {
      title: 'Using on_event instead of lifespan for startup/shutdown',
      wrong: `@app.on_event("startup")   # deprecated since FastAPI 0.93
async def startup(): await init_db()

@app.on_event("shutdown")
async def shutdown(): await close_db()`,
      right: `from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()     # startup
    yield
    await close_db()    # shutdown

app = FastAPI(lifespan=lifespan)`,
      explanation: 'on_event("startup") and on_event("shutdown") are deprecated. The lifespan context manager is the modern approach — it is a single function with clear before/after semantics, and it works correctly with tools that use ASGI lifespan events (like TestClient for async tests).'
    },
  ];

  challenge: Challenge = {
    title: 'Todo API with Auth and Pagination',
    language: 'typescript',
    description: 'Build a FastAPI app with: (1) POST /auth/token that accepts username/password and returns a Bearer token; (2) GET /todos?skip=0&limit=10 (auth required) returning paginated todos; (3) POST /todos (auth required) creating a new todo; (4) DELETE /todos/{id} (auth required, owner only). Use in-memory dict storage, Pydantic models, and proper status codes.',
    hints: [
      'Use OAuth2PasswordBearer for the token dependency',
      'Store todos as {id: {title, done, owner}} dict',
      'Check todo["owner"] == current_user for delete authorization',
    ],
    starterCode: `from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Annotated

app = FastAPI()
todos: dict[int, dict] = {}
users = {"alice": "secret"}`,
    solution: `from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Annotated

app = FastAPI()
todos: dict[int, dict] = {}
users = {"alice": "secret"}
next_id = 1

oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/token")

async def get_user(token: str = Depends(oauth2)) -> str:
    if token not in users:
        raise HTTPException(401, "Invalid token")
    return token

CurrentUser = Annotated[str, Depends(get_user)]

class TodoCreate(BaseModel):
    title: str

class TodoResponse(BaseModel):
    id: int; title: str; done: bool; owner: str

@app.post("/auth/token")
async def login(form: OAuth2PasswordRequestForm = Depends()):
    if users.get(form.username) != form.password:
        raise HTTPException(401, "Bad credentials")
    return {"access_token": form.username, "token_type": "bearer"}

@app.get("/todos", response_model=list[TodoResponse])
async def list_todos(user: CurrentUser, skip: int = 0, limit: int = 10):
    return list(todos.values())[skip: skip + limit]

@app.post("/todos", response_model=TodoResponse, status_code=201)
async def create_todo(body: TodoCreate, user: CurrentUser):
    global next_id
    todo = {"id": next_id, "title": body.title, "done": False, "owner": user}
    todos[next_id] = todo; next_id += 1
    return todo

@app.delete("/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: int, user: CurrentUser):
    if todo_id not in todos: raise HTTPException(404, "Not found")
    if todos[todo_id]["owner"] != user: raise HTTPException(403, "Not your todo")
    del todos[todo_id]`
  };

  quiz: QuizQuestion[] = [
    { q: 'How does FastAPI distinguish path params, query params, and body params?', options: ['They are always passed in a specific order', 'Path params are in {braces}; body params are Pydantic models; everything else is a query param', 'You must use @Path(), @Query(), @Body() decorators', 'FastAPI reads the HTTP method to decide'], answer: 1, explanation: 'Path parameters match {names} in the route path. Parameters typed as Pydantic BaseModel subclasses are treated as request bodies. All other typed function parameters without path matches are treated as query parameters. FastAPI infers the source from the type — no explicit @Path/@Query/@ Body decorators needed (though you can use them for metadata).' },
    { q: 'What is the advantage of a generator dependency over a plain function dependency?', options: ['Generators are faster', 'Generators allow cleanup code (finally block) to run after the request completes', 'Generators support async dependencies', 'Plain dependencies cannot receive arguments'], answer: 1, explanation: 'A plain dependency returns a value — no cleanup is possible after the request. A generator dependency yields a value and can run cleanup in finally — the code after yield runs after the route handler finishes, even on exception. This is the standard pattern for database session management: yield db; finally: db.close().' },
    { q: 'What does BackgroundTasks do in FastAPI?', options: ['Runs tasks in a separate process', 'Runs tasks AFTER the HTTP response is sent, in the same process', 'Schedules recurring tasks (like Celery Beat)', 'Runs tasks before the response is sent'], answer: 1, explanation: 'BackgroundTasks runs functions after the response is sent to the client — the client receives the response immediately and the background task runs asynchronously in the same server process. It is NOT a job queue — if the server restarts, tasks are lost. For reliable background jobs, use Celery or Redis Queue.' },
    { q: 'What is the purpose of response_model on a route decorator?', options: ['Validate the incoming request body', 'Filter and serialise the response, preventing sensitive fields from leaking', 'Set the HTTP status code', 'Add authentication to the route'], answer: 1, explanation: 'response_model=MySchema tells FastAPI to pass the return value through MySchema.model_validate() and serialise it. Only fields defined in MySchema are included in the response — internal fields like password_hash or private DB fields are automatically excluded. Without response_model, the raw returned object is serialised, potentially exposing sensitive data.' },
    { q: 'What is the difference between @app.middleware("http") and a dependency in FastAPI?', options: ['Middleware applies to all routes; dependencies apply per route or router', 'Dependencies are faster than middleware', 'Middleware can only modify responses; dependencies can only modify requests', 'They are identical'], answer: 0, explanation: 'Middleware wraps every request/response in the app regardless of route — ideal for CORS, logging, request timing. A dependency is declared per route, router, or app and has access to the route\'s context (path params, query params, etc.). Use middleware for cross-cutting concerns that apply to ALL routes; use dependencies for per-route logic like auth, rate limiting, or DB session injection.' },
    { q: 'What does HTTPException(status_code=422, detail=...) in FastAPI represent?', options: ['A server error (5xx)', 'An unprocessable entity — FastAPI raises this automatically when request validation fails', 'A redirect response', 'A custom exception class you must define'], answer: 1, explanation: 'FastAPI automatically raises HTTP 422 Unprocessable Entity when Pydantic validation of path params, query params, or request body fails. The detail field contains a list of validation errors. You can also raise it manually with raise HTTPException(status_code=422, detail="custom message"). For auth failures, raise HTTPException(status_code=401, ...) or 403.' },
  ];

  qna: QnaItem[] = [
    { q: 'How does FastAPI\'s dependency injection compare to other frameworks?', a: 'FastAPI uses Python function signatures as the DI contract — declare a parameter typed with Depends(fn) and FastAPI recursively resolves the dependency tree. Unlike Spring (Java) or NestJS where you register providers in a module, FastAPI resolves dependencies at request time by inspecting type hints. This is simpler but less configurable. For cross-cutting concerns (auth, rate limiting, logging), use dependencies rather than middleware so they can be applied per-route with full access to the route\'s scope.' },
    { q: 'How do you handle file uploads in FastAPI?', a: 'Use File and UploadFile from fastapi: async def upload(file: UploadFile = File(...)): contents = await file.read(); ... The UploadFile has attributes filename, content_type, and methods read(), seek(), close(). For multiple files: List[UploadFile]. Files are multipart form uploads — content_type should be "multipart/form-data". For large files, stream to disk with file.read(chunk_size) in a loop instead of await file.read() which loads everything.' },
    { q: 'How do you write integration tests for FastAPI?', a: 'Use FastAPI\'s TestClient (synchronous): client = TestClient(app). It wraps the ASGI app in a sync HTTP client. For async tests with pytest-asyncio, use httpx.AsyncClient(app=app, base_url="http://test") as an async context manager. Override dependencies in tests: app.dependency_overrides[get_db] = lambda: test_db. Clear overrides after tests. Use pytest fixtures to set up and tear down the test app and database.' },
    { q: 'How does FastAPI achieve high performance compared to traditional WSGI frameworks like Flask or Django (without ASGI)?', a: 'FastAPI is built on Starlette and uses ASGI (Asynchronous Server Gateway Interface) rather than the older synchronous WSGI standard, allowing it to natively support async/await for non-blocking I/O — a single worker process can handle many concurrent requests that are waiting on I/O (database queries, external API calls) without each one occupying a dedicated thread or worker slot. Combined with Pydantic\'s fast (Rust-backed in Pydantic v2) validation and Starlette\'s lightweight routing, this gives FastAPI a meaningful throughput advantage for I/O-bound workloads compared to traditional synchronous WSGI frameworks, though the actual gain depends heavily on whether your route handlers and their dependencies are genuinely async-compatible.' },
    { q: 'What is FastAPI dependency injection, and how does the Depends() system work?', a: 'FastAPI\'s Depends() lets you declare reusable, composable functions (or classes) as dependencies for a path operation — FastAPI automatically calls the dependency function, resolves its own nested dependencies recursively, and injects the result as a parameter into your route handler. Common uses: extracting and validating an authenticated user from a request header, providing a database session that is automatically created before the request and cleaned up after (using yield inside the dependency for setup/teardown), or enforcing shared query parameter validation across multiple endpoints — all without manually repeating that logic in every route.' },
    { q: 'Why does FastAPI recommend using async def for I/O-bound route handlers but warn against it for CPU-bound ones?', a: 'An async def route handler runs in the main event loop thread — if it performs purely async I/O (database calls via an async driver, async HTTP calls), it yields control during waits, allowing the event loop to serve other requests concurrently, which is the whole performance benefit. But if an async def handler executes CPU-bound, blocking, synchronous code (heavy computation, a synchronous library call) without ever awaiting, it blocks the entire event loop for that duration, stalling every other concurrent request — for genuinely CPU-bound or blocking-library work, a plain def handler is actually safer, since FastAPI automatically runs synchronous def handlers in a separate thread pool, avoiding event loop blockage.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'FastAPI auto-parses request params via Pydantic type hints, uses Depends() for DI and auth, response_model for safe serialisation, and lifespan for startup/shutdown.',
    mustKnow: [
      'Path params from {braces}; Pydantic models = body; others = query params.',
      'Depends(fn) injects dependencies; generator deps (yield) run cleanup after request.',
      'response_model filters output — prevents sensitive fields from leaking.',
      'BackgroundTasks: runs after response, same process — not a job queue.',
      'async def + sync blocking lib = freeze; use to_thread() or aiohttp.',
      'lifespan context manager: code before yield = startup, after = shutdown.',
    ],
    interviewFocus: [
      'How does FastAPI distinguish path, query, and body parameters?',
      'Why use a generator dependency for database sessions?',
      'What is the risk of using async def with requests.get()?',
    ]
  };
}
