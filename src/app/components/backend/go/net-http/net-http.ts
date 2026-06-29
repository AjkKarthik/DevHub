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
  selector: 'app-go-net-http',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './net-http.html',
  styleUrl: './net-http.scss'
})
export class GoNetHttp {
  readingTime = 26;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Go 1.22+';
  route = 'go-net-http';
  nextRoute = '/go/gin';
  nextLabel = 'Gin Framework';

  quickRef: QuickRefItem[] = [
    { name: 'http.ListenAndServe(addr, handler)', type: 'function', desc: 'Start HTTP server; pass nil to use DefaultServeMux' },
    { name: 'http.NewServeMux()', type: 'function', desc: 'Create an isolated router; Go 1.22 adds method+path patterns' },
    { name: 'mux.HandleFunc("GET /path", fn)', type: 'method', desc: 'Go 1.22+ method-aware pattern: "GET /users/{id}"' },
    { name: 'r.PathValue("id")', type: 'method', desc: 'Extract path parameter from Go 1.22 wildcard pattern' },
    { name: 'http.NewRequestWithContext(ctx, …)', type: 'function', desc: 'Create outgoing request with caller context for timeout/cancel' },
    { name: 'http.NewRequest + client.Do(req)', type: 'function', desc: 'Low-level pattern for full control over request headers' },
    { name: 'json.NewDecoder(r.Body).Decode(&v)', type: 'function', desc: 'Decode JSON request body into struct; limit body size first' },
    { name: 'json.NewEncoder(w).Encode(v)', type: 'function', desc: 'Write JSON response; sets Content-Type manually' },
    { name: 'http.Error(w, msg, code)', type: 'function', desc: 'Write error response with status code and plain-text body' },
    { name: 'http.MaxBytesReader(w, r.Body, n)', type: 'function', desc: 'Limit request body size to prevent memory exhaustion' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'net/http at a glance',
      points: [
        "Go's standard library net/http is a production-grade HTTP server and client — no framework needed for most services.",
        'An HTTP server needs two things: a router (multiplexer) that maps paths to handlers, and a ServeHTTP(w, r) implementation.',
        'http.Handler is the core interface: ServeHTTP(ResponseWriter, *Request). Functions can be handlers via http.HandlerFunc.',
        'Go 1.22 added method-and-wildcard routing directly in ServeMux: "GET /users/{id}" — eliminating a major reason to reach for third-party routers.',
        'The server is concurrent by default — every request runs in its own goroutine. Shared state must be protected.',
      ]
    },
    {
      heading: 'ServeMux and routing (Go 1.22+)',
      points: [
        'http.NewServeMux() creates an isolated mux. Prefer it over http.DefaultServeMux to avoid global state collisions.',
        'Go 1.22 patterns: "GET /users" (exact method), "GET /users/{id}" (wildcard), "/prefix/" (subtree match).',
        'More specific patterns win over less specific: "/users/new" matches before "/users/{id}" for that literal path.',
        'r.PathValue("id") extracts the named wildcard from the URL.',
        'Use http.StripPrefix for serving static files under a sub-path.',
      ]
    },
    {
      heading: 'Writing handlers',
      points: [
        'A handler receives http.ResponseWriter (for writing the response) and *http.Request (request data, context, body).',
        'Always set Content-Type before calling w.WriteHeader() — headers cannot be changed after WriteHeader or first Write.',
        'For JSON APIs: set Content-Type: application/json, encode with json.NewEncoder(w).Encode(v) — streaming, no extra allocation.',
        'Middleware is any function that wraps a handler: func logging(next http.Handler) http.Handler { return http.HandlerFunc(…) }.',
        'Chain middleware with simple function composition — no special framework needed.',
      ]
    },
    {
      heading: 'Making HTTP requests (client)',
      points: [
        'Always use a custom http.Client with Timeout set — http.DefaultClient has no timeout and will hang indefinitely.',
        'Pass context.Context via http.NewRequestWithContext(ctx, method, url, body) to respect cancellation and deadlines.',
        'Always close resp.Body with defer resp.Body.Close() even on error paths after checking resp != nil.',
        'Read the body with io.ReadAll(resp.Body) or stream directly — never leave it unread as it blocks connection reuse.',
        'Check resp.StatusCode before decoding — a 4xx/5xx body is typically an error message, not the expected JSON.',
      ]
    },
    {
      heading: 'Middleware and server configuration',
      points: [
        'Configure http.Server directly: ReadTimeout, WriteTimeout, IdleTimeout, MaxHeaderBytes — never use http.ListenAndServe in production (no timeouts).',
        'Middleware chains: handler = logging(auth(rateLimiter(mux))) — outermost runs first on request, last on response.',
        'The r.Context() inside a handler is cancelled when the client disconnects — pass it to downstream calls.',
        'For graceful shutdown: server.Shutdown(ctx) waits for active connections to finish up to the context deadline.',
        'Use http.MaxBytesReader(w, r.Body, maxBytes) on any endpoint that accepts a body to prevent oversized uploads.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Server',
      language: 'typescript',
      code: `package main

import (
    "encoding/json"
    "log"
    "net/http"
    "time"
)

type User struct {
    ID   string \`json:"id"\`
    Name string \`json:"name"\`
}

func getUser(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id") // Go 1.22+ wildcard extraction
    user := User{ID: id, Name: "Alice"}

    w.Header().Set("Content-Type", "application/json")
    if err := json.NewEncoder(w).Encode(user); err != nil {
        http.Error(w, "encode error", http.StatusInternalServerError)
    }
}

func createUser(w http.ResponseWriter, r *http.Request) {
    r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1 MB limit

    var u User
    if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
        http.Error(w, "bad request: "+err.Error(), http.StatusBadRequest)
        return
    }
    u.ID = "gen-123"

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(u)
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("GET /users/{id}", getUser)   // Go 1.22 method+wildcard
    mux.HandleFunc("POST /users", createUser)

    srv := &http.Server{
        Addr:         ":8080",
        Handler:      mux,
        ReadTimeout:  5 * time.Second,
        WriteTimeout: 10 * time.Second,
        IdleTimeout:  60 * time.Second,
    }
    log.Fatal(srv.ListenAndServe())
}`
    },
    {
      label: 'Middleware',
      language: 'typescript',
      code: `package main

import (
    "log"
    "net/http"
    "time"
)

// Middleware signature: wraps a handler and returns a new handler
func logging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r) // call the wrapped handler
        log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
    })
}

func auth(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token != "Bearer secret" {
            http.Error(w, "unauthorized", http.StatusUnauthorized)
            return // do NOT call next — short-circuit
        }
        next.ServeHTTP(w, r)
    })
}

func hello(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("hello, authenticated user"))
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("GET /hello", hello)

    // Chain: logging wraps auth wraps mux
    handler := logging(auth(mux))

    http.ListenAndServe(":8080", handler)
}`
    },
    {
      label: 'HTTP Client',
      language: 'typescript',
      code: `package main

import (
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
)

type Post struct {
    ID    int    \`json:"id"\`
    Title string \`json:"title"\`
}

// Reuse a single client across the application
var client = &http.Client{Timeout: 10 * time.Second}

func fetchPost(ctx context.Context, id int) (*Post, error) {
    url := fmt.Sprintf("https://jsonplaceholder.typicode.com/posts/%d", id)

    req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
    if err != nil {
        return nil, fmt.Errorf("build request: %w", err)
    }

    resp, err := client.Do(req)
    if err != nil {
        return nil, fmt.Errorf("do request: %w", err)
    }
    defer resp.Body.Close() // always close body

    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<10))
        return nil, fmt.Errorf("unexpected status %d: %s", resp.StatusCode, body)
    }

    var post Post
    if err := json.NewDecoder(resp.Body).Decode(&post); err != nil {
        return nil, fmt.Errorf("decode: %w", err)
    }
    return &post, nil
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    post, err := fetchPost(ctx, 1)
    if err != nil {
        fmt.Println("error:", err)
        return
    }
    fmt.Printf("Post #%d: %s\\n", post.ID, post.Title)
}`
    },
    {
      label: 'JSON API Pattern',
      language: 'typescript',
      code: `package main

import (
    "encoding/json"
    "log"
    "net/http"
    "time"
)

func writeJSON(w http.ResponseWriter, status int, v any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    if err := json.NewEncoder(w).Encode(v); err != nil {
        log.Printf("writeJSON: %v", err)
    }
}

func writeError(w http.ResponseWriter, status int, msg string) {
    writeJSON(w, status, map[string]string{"error": msg})
}

type CreateItemRequest struct {
    Name  string \`json:"name"\`
    Price int    \`json:"price"\`
}

type Item struct {
    ID    string \`json:"id"\`
    Name  string \`json:"name"\`
    Price int    \`json:"price"\`
}

func createItem(w http.ResponseWriter, r *http.Request) {
    r.Body = http.MaxBytesReader(w, r.Body, 64<<10) // 64 KB

    var req CreateItemRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
        return
    }
    if req.Name == "" {
        writeError(w, http.StatusUnprocessableEntity, "name is required")
        return
    }

    item := Item{ID: "item-1", Name: req.Name, Price: req.Price}
    writeJSON(w, http.StatusCreated, item)
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("POST /items", createItem)
    srv := &http.Server{Addr: ":8080", Handler: mux,
        ReadTimeout: 5 * time.Second, WriteTimeout: 10 * time.Second}
    log.Fatal(srv.ListenAndServe())
}`
    },
    {
      label: 'Graceful Shutdown',
      language: 'typescript',
      code: `package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("ok"))
    })

    srv := &http.Server{
        Addr:         ":8080",
        Handler:      mux,
        ReadTimeout:  5 * time.Second,
        WriteTimeout: 10 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    go func() {
        log.Println("listening on :8080")
        if err := srv.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatalf("listen: %v", err)
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    log.Println("shutting down...")

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil {
        log.Fatalf("shutdown error: %v", err)
    }
    log.Println("server stopped cleanly")
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using http.DefaultClient (no timeout)',
      wrong: `resp, err := http.Get("https://example.com/slow")
// DefaultClient has zero timeout — hangs indefinitely`,
      right: `client := &http.Client{Timeout: 10 * time.Second}
resp, err := client.Get("https://example.com/slow")`,
      explanation: 'http.DefaultClient has no timeout. A slow or unresponsive server will block the goroutine indefinitely, eventually exhausting goroutine and connection pools. Always configure a custom http.Client with an explicit Timeout or use context.WithTimeout.'
    },
    {
      title: 'Not closing response body',
      wrong: `resp, err := client.Do(req)
if err != nil { return err }
// forgot defer resp.Body.Close() — connection leaks`,
      right: `resp, err := client.Do(req)
if err != nil { return err }
defer resp.Body.Close() // must be after nil check`,
      explanation: 'The HTTP client reuses TCP connections only when the body is fully read and closed. Forgetting to close the body leaks connections, eventually exhausting the pool. Always defer resp.Body.Close() immediately after the nil check.'
    },
    {
      title: 'Writing headers after WriteHeader or Write',
      wrong: `w.WriteHeader(http.StatusOK)
w.Header().Set("Content-Type", "application/json") // too late`,
      right: `w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusOK)
json.NewEncoder(w).Encode(v)`,
      explanation: 'HTTP headers must be set before WriteHeader() is called. The first call to Write() also implicitly calls WriteHeader(200). Any Header.Set() calls after that point are silently ignored — the client never sees them.'
    },
    {
      title: 'Using http.ListenAndServe in production (no timeouts)',
      wrong: `http.ListenAndServe(":8080", mux)
// no read/write timeouts — slow clients hold connections forever`,
      right: `srv := &http.Server{Addr: ":8080", Handler: mux,
    ReadTimeout: 5 * time.Second, WriteTimeout: 10 * time.Second}
log.Fatal(srv.ListenAndServe())`,
      explanation: 'http.ListenAndServe creates a server with no timeouts. Slow or malicious clients can hold connections open indefinitely, causing goroutine and file-descriptor exhaustion. Always use an http.Server struct with ReadTimeout and WriteTimeout.'
    },
    {
      title: 'Not limiting request body size',
      wrong: `var payload BigPayload
json.NewDecoder(r.Body).Decode(&payload)
// attacker sends 1 GB — server crashes with OOM`,
      right: `r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1 MB cap
var payload BigPayload
if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
    http.Error(w, "request too large", http.StatusRequestEntityTooLarge)
    return
}`,
      explanation: 'Without a body size limit, any client can send an arbitrarily large body, consuming memory until the server OOM-crashes. http.MaxBytesReader wraps the body reader with a hard cap and returns a sensible error when exceeded.'
    },
    {
      title: 'Not checking response status before decoding',
      wrong: `resp, _ := client.Do(req)
defer resp.Body.Close()
json.NewDecoder(resp.Body).Decode(&result) // decodes error body as success`,
      right: `resp, err := client.Do(req)
if err != nil { return err }
defer resp.Body.Close()
if resp.StatusCode != http.StatusOK {
    body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<10))
    return fmt.Errorf("status %d: %s", resp.StatusCode, body)
}
json.NewDecoder(resp.Body).Decode(&result)`,
      explanation: 'A non-2xx response body is usually an error message in a different format. Decoding it into your success struct silently produces zero values. Always check the status code and handle error responses explicitly before decoding.'
    },
  ];

  challenge: Challenge = {
    title: 'REST API for a Task List',
    language: 'typescript',
    description: `Build a simple in-memory REST API for managing tasks using only \`net/http\`.

**Endpoints:**
- \`GET /tasks\` — return all tasks as JSON array
- \`POST /tasks\` — create task from JSON body \`{"title":"..."}\`, return 201 with created task
- \`DELETE /tasks/{id}\` — delete task by ID, return 204

**Task struct:**
\`\`\`go
type Task struct {
    ID    string \`json:"id"\`
    Title string \`json:"title"\`
}
\`\`\`

Requirements:
- Use Go 1.22 method+wildcard patterns
- Protect the task map with a \`sync.RWMutex\`
- Return \`{"error":"..."}\` JSON for validation failures
- Limit POST body to 64 KB`,
    hints: [
      'Use sync.RWMutex: RLock/RUnlock for GET reads, Lock/Unlock for POST/DELETE writes',
      'Use r.PathValue("id") for the delete endpoint to get the {id} wildcard',
      'A simple counter + fmt.Sprintf gives you unique string IDs',
      'w.WriteHeader(http.StatusNoContent) for DELETE — no body needed for 204',
    ],
    starterCode: `package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "sync"
    "time"
)

type Task struct {
    ID    string \`json:"id"\`
    Title string \`json:"title"\`
}

type Store struct {
    mu      sync.RWMutex
    tasks   map[string]Task
    counter int
}

func NewStore() *Store {
    return &Store{tasks: make(map[string]Task)}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(v)
}

func (s *Store) listTasks(w http.ResponseWriter, r *http.Request) {
    // TODO: return all tasks as JSON array
}

func (s *Store) createTask(w http.ResponseWriter, r *http.Request) {
    // TODO: decode body, validate title, create task, return 201
}

func (s *Store) deleteTask(w http.ResponseWriter, r *http.Request) {
    // TODO: extract id, delete, return 204
}

func main() {
    store := NewStore()
    mux := http.NewServeMux()
    mux.HandleFunc("GET /tasks", store.listTasks)
    mux.HandleFunc("POST /tasks", store.createTask)
    mux.HandleFunc("DELETE /tasks/{id}", store.deleteTask)

    srv := &http.Server{
        Addr: ":8080", Handler: mux,
        ReadTimeout: 5 * time.Second, WriteTimeout: 10 * time.Second,
    }
    log.Println("listening on :8080")
    log.Fatal(srv.ListenAndServe())
}`,
    solution: `package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "sync"
    "time"
)

type Task struct {
    ID    string \`json:"id"\`
    Title string \`json:"title"\`
}

type Store struct {
    mu      sync.RWMutex
    tasks   map[string]Task
    counter int
}

func NewStore() *Store { return &Store{tasks: make(map[string]Task)} }

func writeJSON(w http.ResponseWriter, status int, v any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(v)
}

func (s *Store) listTasks(w http.ResponseWriter, r *http.Request) {
    s.mu.RLock()
    list := make([]Task, 0, len(s.tasks))
    for _, t := range s.tasks { list = append(list, t) }
    s.mu.RUnlock()
    writeJSON(w, http.StatusOK, list)
}

func (s *Store) createTask(w http.ResponseWriter, r *http.Request) {
    r.Body = http.MaxBytesReader(w, r.Body, 64<<10)
    var body struct{ Title string \`json:"title"\` }
    if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
        writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
        return
    }
    if body.Title == "" {
        writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "title required"})
        return
    }
    s.mu.Lock()
    s.counter++
    t := Task{ID: fmt.Sprintf("%d", s.counter), Title: body.Title}
    s.tasks[t.ID] = t
    s.mu.Unlock()
    writeJSON(w, http.StatusCreated, t)
}

func (s *Store) deleteTask(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    s.mu.Lock()
    _, exists := s.tasks[id]
    if exists { delete(s.tasks, id) }
    s.mu.Unlock()
    if !exists {
        writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
        return
    }
    w.WriteHeader(http.StatusNoContent)
}

func main() {
    store := NewStore()
    mux := http.NewServeMux()
    mux.HandleFunc("GET /tasks", store.listTasks)
    mux.HandleFunc("POST /tasks", store.createTask)
    mux.HandleFunc("DELETE /tasks/{id}", store.deleteTask)

    srv := &http.Server{Addr: ":8080", Handler: mux,
        ReadTimeout: 5 * time.Second, WriteTimeout: 10 * time.Second}
    log.Println("listening on :8080")
    log.Fatal(srv.ListenAndServe())
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why should you never use http.DefaultClient in production?',
      options: [
        'It has no timeout — a slow server will block the goroutine indefinitely',
        'It does not support HTTPS',
        'It cannot handle concurrent requests',
        'It is not thread-safe',
      ],
      answer: 0,
      explanation: 'http.DefaultClient has zero Timeout, meaning if the remote server is slow or hangs, the goroutine blocks forever. This leads to goroutine and connection-pool exhaustion. Always create a custom http.Client with an explicit Timeout.'
    },
    {
      q: 'When must you set response headers in an HTTP handler?',
      options: [
        'Before calling w.WriteHeader() or the first w.Write()',
        'After w.WriteHeader() to ensure they are flushed',
        'At any point — headers can be changed until the handler returns',
        'Before returning from the handler function',
      ],
      answer: 0,
      explanation: 'Headers are sent as part of the HTTP status line. Once w.WriteHeader() is called (explicitly or implicitly by the first w.Write()), headers are sent to the client and cannot be changed. Any Header.Set() calls after that are silently dropped.'
    },
    {
      q: 'What does r.PathValue("id") do in Go 1.22?',
      options: [
        'Extracts the named wildcard segment from the URL matched by the 1.22 ServeMux pattern',
        'Reads the "id" field from the request body',
        'Returns the query parameter named "id"',
        'Parses the URL path and splits it by "/"',
      ],
      answer: 0,
      explanation: 'Go 1.22 added wildcard path segments to ServeMux: "GET /users/{id}" matches /users/42. Inside the handler, r.PathValue("id") returns the matched segment ("42"). Before 1.22, this required third-party routers like gorilla/mux or chi.'
    },
    {
      q: 'Why should you always call defer resp.Body.Close() after a successful client.Do()?',
      options: [
        'To allow the HTTP client to reuse the TCP connection for subsequent requests',
        'To free the response struct from memory',
        'Because the body reader holds a mutex that must be released',
        'To cancel the context associated with the request',
      ],
      answer: 0,
      explanation: "Go's HTTP client uses connection pooling. It reuses a TCP connection only when the response body is fully consumed and closed. If you don't close the body, the connection is not returned to the pool and a new TCP connection is opened for every request."
    },
    {
      q: 'What is the correct order of operations when writing a JSON response?',
      options: [
        'Set Content-Type header → WriteHeader(status) → Encode(body)',
        'WriteHeader(status) → Set Content-Type → Encode(body)',
        'Encode(body) → Set Content-Type → WriteHeader(status)',
        'WriteHeader(status) → Encode(body) → Set Content-Type',
      ],
      answer: 0,
      explanation: 'Headers must be set before WriteHeader() is called. The correct sequence is: w.Header().Set("Content-Type", "application/json") → w.WriteHeader(status) → json.NewEncoder(w).Encode(v).'
    },
    {
      q: 'What is http.ServeMux.Handle vs HandleFunc and when do you use each?',
      options: ['They are identical', 'Handle registers an http.Handler interface; HandleFunc wraps a func(ResponseWriter, *Request) as a handler — use HandleFunc for simple functions, Handle for reusable middleware types', 'HandleFunc is deprecated', 'Handle requires a separate mux'],
      answer: 1,
      explanation: 'http.HandleFunc("/path", myFunc) is shorthand for http.Handle("/path", http.HandlerFunc(myFunc)). Use HandleFunc for simple one-off route handlers. Use Handle when you have a type that implements http.Handler (e.g., a file server, reverse proxy, or custom middleware chain). Go 1.22+ pattern-matched mux supports method routing: mux.HandleFunc("GET /users/{id}", handler).'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a third-party router like Gin or Chi instead of net/http?',
      a: "Go 1.22's ServeMux now handles method routing and path wildcards, covering the primary use cases of third-party routers for straightforward APIs. Use a framework when you need built-in middleware ecosystems (rate limiting, CORS, auth), automatic request binding, structured validation, or OpenAPI generation — things that would take significant boilerplate to build from scratch with net/http."
    },
    {
      q: 'How do I handle CORS in a net/http server?',
      a: 'Write a middleware that sets the required headers: Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers. Handle OPTIONS preflight requests explicitly — return 200 immediately without calling the next handler. Wrap your mux with this middleware: handler = cors(mux). For production use, the rs/cors package handles all the edge cases correctly.'
    },
    {
      q: 'What is http.ErrServerClosed and when does it appear?',
      a: 'When you call server.Shutdown(ctx) or server.Close(), the server stops accepting new connections and ListenAndServe() returns http.ErrServerClosed. This is not a real error — it is the normal shutdown signal. Always check for it explicitly: if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed { log.Fatal(err) }.'
    },
    {
      q: 'How do I share state (like a database connection pool) across handlers?',
      a: 'Define a struct that holds shared dependencies (db pool, config, logger) and attach handlers as methods on it. This is idiomatic Go — no global variables, no context value abuse. type Server struct { db *sql.DB }; then func (s *Server) listUsers(w, r) { s.db.Query... }. Register with mux.HandleFunc("GET /users", s.listUsers).'
    },
    {
      q: 'How do I read query parameters from a request?',
      a: 'r.URL.Query() returns a url.Values map. Use r.URL.Query().Get("name") for a single value or r.URL.Query()["tags"] for repeated parameters. For required parameters, check if the value is empty and return a 400. Parse with strconv.Atoi for integers — query parameters are always strings, so validate and convert explicitly.'
    },
    {
      q: 'How does graceful shutdown work?',
      a: 'Start the server in a goroutine. Block on a channel receiving os.Signal (SIGINT, SIGTERM). When the signal arrives, call server.Shutdown(ctx) with a deadline context (e.g. 30s). Shutdown stops accepting new connections and waits for active connections to complete within the deadline. ListenAndServe returns http.ErrServerClosed once shutdown completes, avoiding dropped in-flight requests.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'net/http is a production HTTP library — use a custom http.Server with timeouts, http.NewServeMux for routing, and always close response bodies.',
    mustKnow: [
      'Configure http.Server with ReadTimeout/WriteTimeout/IdleTimeout — never use http.ListenAndServe bare.',
      'Go 1.22 ServeMux supports "METHOD /path/{wildcard}" — use r.PathValue("name") to extract.',
      'Always defer resp.Body.Close() after client.Do() to enable connection reuse.',
      'Set headers before WriteHeader() — they are immutable once the response starts.',
      'Use http.MaxBytesReader to cap incoming body size and prevent memory exhaustion.',
      'Use http.NewRequestWithContext to propagate cancellation to outgoing requests.',
      'For graceful shutdown: signal.Notify → server.Shutdown(ctx) — handle ErrServerClosed.',
    ],
    interviewFocus: [
      'Why does http.DefaultClient have no timeout and what are the consequences?',
      'What is the correct order for setting headers, status, and writing the body?',
      'How do you share a database connection across handlers without global state?',
      'How does graceful shutdown work with Shutdown() vs Close()?',
      'What new routing features did Go 1.22 add to http.ServeMux?',
    ],
  };
}
