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
  selector: 'app-go-gin',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './gin.html',
  styleUrl: './gin.scss'
})
export class GoGin {
  readingTime = 24;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Gin v1.9+';
  route = 'go-gin';
  nextRoute = '/go/json-encoding';
  nextLabel = 'JSON Encoding';

  quickRef: QuickRefItem[] = [
    { name: 'gin.New()', type: 'function', desc: 'Create engine without Logger/Recovery middleware (add manually)' },
    { name: 'gin.Default()', type: 'function', desc: 'Engine with Logger + Recovery middleware pre-attached' },
    { name: 'r.GET/POST/PUT/DELETE(path, handlers…)', type: 'method', desc: 'Register route with one or more handler functions' },
    { name: 'c.Param("id")', type: 'method', desc: 'Extract URL path parameter: route "/users/:id"' },
    { name: 'c.Query("name")', type: 'method', desc: 'Read query string parameter; DefaultQuery for fallback' },
    { name: 'c.ShouldBindJSON(&v)', type: 'method', desc: 'Decode JSON body into struct; returns error without writing 400' },
    { name: 'c.JSON(status, obj)', type: 'method', desc: 'Write JSON response with status code' },
    { name: 'c.AbortWithStatusJSON(status, obj)', type: 'method', desc: 'Write JSON error and stop middleware chain' },
    { name: 'r.Group("/api/v1")', type: 'method', desc: 'Create route group with shared prefix and/or middleware' },
    { name: 'c.Set / c.Get("key")', type: 'method', desc: 'Share values between middleware and handlers via context' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Gin?',
      points: [
        'Gin is the most popular Go web framework — it wraps net/http with a faster router (httprouter), ergonomic handler API, and built-in middleware.',
        'The core abstraction is gin.Context, which merges http.Request and http.ResponseWriter into one convenient object.',
        'Gin is NOT a replacement for understanding net/http — it builds on it. Gin handlers still run in goroutines; middleware still chains as functions.',
        'gin.Default() adds Logger (request logging) and Recovery (panic → 500) middleware. gin.New() starts bare — use when you want full control.',
        'Gin uses a radix-tree router: O(log n) routing, no allocations on the hot path, and wildcard/param routes without ambiguity.',
      ]
    },
    {
      heading: 'Routing and parameters',
      points: [
        'Named parameters: /users/:id — extract with c.Param("id"). The colon prefix denotes a required segment.',
        'Catch-all parameters: /files/*path — c.Param("path") captures everything including slashes.',
        'Query parameters: c.Query("page") or c.DefaultQuery("page", "1"). c.QueryArray("tag") for repeated values.',
        'Route groups share a prefix and can attach middleware: r.Group("/api/v1", authMiddleware)',
        'Nested groups are fine: apiV1.Group("/users") creates /api/v1/users/* routes.',
      ]
    },
    {
      heading: 'Binding and validation',
      points: [
        'c.ShouldBindJSON(&v) decodes JSON and returns an error without writing a response — you decide the error format.',
        'c.BindJSON(&v) decodes JSON and automatically writes 400 if binding fails — less flexible.',
        'Struct tags drive validation: `binding:"required,min=1,max=100"` uses go-playground/validator under the hood.',
        'ShouldBind / ShouldBindQuery / ShouldBindHeader bind from different sources.',
        'For production APIs, prefer ShouldBind* and write a consistent error response helper.',
      ]
    },
    {
      heading: 'Middleware',
      points: [
        'Middleware is a gin.HandlerFunc that calls c.Next() to pass control to the next handler in the chain.',
        'Code before c.Next() runs on the way in (request phase); code after runs on the way out (response phase).',
        'c.Abort() / c.AbortWithStatusJSON() stops the chain — subsequent handlers (including the route handler) are skipped.',
        'c.Set("key", value) stores values; c.MustGet("key").(Type) retrieves — use for passing auth user, trace ID, etc.',
        'Apply middleware globally (r.Use), per group (group.Use), or per route (r.GET("/path", mw, handler)).',
      ]
    },
    {
      heading: 'Error handling and response patterns',
      points: [
        'Return early with c.JSON + return — Gin does not stop execution on JSON response calls.',
        'Wrap errors: c.Error(err) queues errors; a middleware can inspect c.Errors at the end of the chain.',
        'Use a typed error response struct: {"error":"message","code":"VALIDATION_FAILED"} for consistent APIs.',
        'gin.Recovery() catches panics and returns 500 — log the stack trace in production; never expose raw panics.',
        'Set gin.SetMode(gin.ReleaseMode) before creating the engine in production — removes debug output.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Server',
      language: 'typescript',
      code: `package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

type User struct {
    ID   string \`json:"id"\`
    Name string \`json:"name"\`
}

var users = map[string]User{
    "1": {ID: "1", Name: "Alice"},
    "2": {ID: "2", Name: "Bob"},
}

func main() {
    gin.SetMode(gin.ReleaseMode) // remove debug output in production

    r := gin.Default() // Logger + Recovery middleware

    r.GET("/users", func(c *gin.Context) {
        list := make([]User, 0, len(users))
        for _, u := range users {
            list = append(list, u)
        }
        c.JSON(http.StatusOK, list)
    })

    r.GET("/users/:id", func(c *gin.Context) {
        id := c.Param("id")
        u, ok := users[id]
        if !ok {
            c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
            return
        }
        c.JSON(http.StatusOK, u)
    })

    r.Run(":8080") // wraps http.ListenAndServe
}`
    },
    {
      label: 'Binding & Validation',
      language: 'typescript',
      code: `package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

type CreateUserRequest struct {
    Name  string \`json:"name"  binding:"required,min=2,max=50"\`
    Email string \`json:"email" binding:"required,email"\`
    Age   int    \`json:"age"   binding:"required,gte=18,lte=120"\`
}

type UserResponse struct {
    ID    string \`json:"id"\`
    Name  string \`json:"name"\`
    Email string \`json:"email"\`
}

func createUser(c *gin.Context) {
    var req CreateUserRequest
    // ShouldBindJSON returns error without auto-responding
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "validation failed",
            "detail": err.Error(),
        })
        return
    }

    resp := UserResponse{ID: "new-1", Name: req.Name, Email: req.Email}
    c.JSON(http.StatusCreated, resp)
}

func main() {
    r := gin.Default()
    r.POST("/users", createUser)
    r.Run(":8080")
}`
    },
    {
      label: 'Middleware',
      language: 'typescript',
      code: `package main

import (
    "net/http"
    "strings"
    "time"
    "github.com/gin-gonic/gin"
)

type contextKey string
const userIDKey contextKey = "userID"

// authMiddleware extracts a Bearer token and sets userID on context
func authMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        header := c.GetHeader("Authorization")
        if !strings.HasPrefix(header, "Bearer ") {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
            return
        }
        token := strings.TrimPrefix(header, "Bearer ")
        if token != "secret" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
            return
        }
        c.Set("userID", "user-42") // pass to downstream handlers
        c.Next()                   // continue chain
    }
}

func latencyMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        c.Next()
        // code here runs AFTER the handler returns
        c.Header("X-Response-Time", time.Since(start).String())
    }
}

func profile(c *gin.Context) {
    userID := c.MustGet("userID").(string)
    c.JSON(http.StatusOK, gin.H{"userID": userID, "profile": "data"})
}

func main() {
    r := gin.New()
    r.Use(gin.Recovery(), latencyMiddleware())

    // Apply authMiddleware only to the /api group
    api := r.Group("/api", authMiddleware())
    api.GET("/profile", profile)

    r.Run(":8080")
}`
    },
    {
      label: 'Route Groups',
      language: 'typescript',
      code: `package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func authRequired() gin.HandlerFunc {
    return func(c *gin.Context) {
        if c.GetHeader("Authorization") == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }
        c.Next()
    }
}

func main() {
    r := gin.Default()

    // Public routes — no auth
    public := r.Group("/api/v1")
    {
        public.GET("/health", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"status": "ok"})
        })
        public.POST("/login", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"token": "secret"})
        })
    }

    // Protected routes — auth required
    protected := r.Group("/api/v1", authRequired())
    {
        protected.GET("/users", func(c *gin.Context) {
            c.JSON(http.StatusOK, []gin.H{{"id": "1"}, {"id": "2"}})
        })
        protected.GET("/users/:id", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"id": c.Param("id")})
        })
    }

    r.Run(":8080")
}`
    },
    {
      label: 'Query Params & Custom Server',
      language: 'typescript',
      code: `package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "strconv"
    "syscall"
    "time"

    "github.com/gin-gonic/gin"
)

func listItems(c *gin.Context) {
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    search := c.Query("q")

    c.JSON(http.StatusOK, gin.H{
        "page":   page,
        "limit":  limit,
        "search": search,
        "items":  []string{"a", "b", "c"},
    })
}

func main() {
    gin.SetMode(gin.ReleaseMode)
    r := gin.Default()
    r.GET("/items", listItems)

    // Use http.Server directly for timeouts + graceful shutdown
    srv := &http.Server{
        Addr:         ":8080",
        Handler:      r,
        ReadTimeout:  5 * time.Second,
        WriteTimeout: 10 * time.Second,
    }

    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("listen: %v", err)
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    srv.Shutdown(ctx)
    log.Println("server stopped")
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting to return after c.JSON in error branches',
      wrong: `func handler(c *gin.Context) {
    if invalid {
        c.JSON(400, gin.H{"error": "bad"})
        // missing return — code continues executing!
    }
    c.JSON(200, gin.H{"result": "ok"}) // writes a second response
}`,
      right: `func handler(c *gin.Context) {
    if invalid {
        c.JSON(400, gin.H{"error": "bad"})
        return // stop here
    }
    c.JSON(200, gin.H{"result": "ok"})
}`,
      explanation: 'Unlike some frameworks, Gin does not stop handler execution when you call c.JSON(). It just writes the response. You must explicitly return after error responses, otherwise the function continues and attempts to write a second response, causing a "superfluous response.WriteHeader" warning.'
    },
    {
      title: 'Using c.BindJSON instead of c.ShouldBindJSON',
      wrong: `func createUser(c *gin.Context) {
    var req CreateUserRequest
    c.BindJSON(&req) // auto-writes 400 on failure — you lose control of the error format
    // ...
}`,
      right: `func createUser(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error(), "code": "VALIDATION_FAILED"})
        return
    }
}`,
      explanation: 'c.BindJSON writes a 400 response automatically on failure, giving you no control over the error format. c.ShouldBindJSON returns the error without writing anything — you decide what the client sees, enabling consistent error responses across your API.'
    },
    {
      title: 'Not setting gin.ReleaseMode in production',
      wrong: `// No mode set — gin defaults to DebugMode
r := gin.Default()
r.Run(":8080")
// Prints route list, debug logs — information leakage in production`,
      right: `gin.SetMode(gin.ReleaseMode) // set BEFORE creating the engine
r := gin.Default()
r.Run(":8080")`,
      explanation: 'Gin defaults to DebugMode, which prints all registered routes and verbose debug output to stdout. In production this leaks implementation details and wastes I/O. Set gin.SetMode(gin.ReleaseMode) before calling gin.New() or gin.Default().'
    },
    {
      title: 'Using r.Run() instead of http.Server for production',
      wrong: `r := gin.Default()
r.Run(":8080")
// r.Run wraps http.ListenAndServe — no timeouts, no graceful shutdown`,
      right: `srv := &http.Server{
    Addr: ":8080", Handler: r,
    ReadTimeout: 5 * time.Second, WriteTimeout: 10 * time.Second,
}
srv.ListenAndServe()`,
      explanation: 'r.Run() is a shortcut for http.ListenAndServe with no timeouts — fine for development, dangerous in production. Wrap the Gin engine (which implements http.Handler) in a configured http.Server to get read/write timeouts and graceful shutdown.'
    },
    {
      title: 'Sharing mutable state without a mutex in handlers',
      wrong: `var counter int // global — not safe for concurrent access

func increment(c *gin.Context) {
    counter++ // data race: Gin runs each request in its own goroutine
    c.JSON(200, gin.H{"count": counter})
}`,
      right: `var (
    mu      sync.Mutex
    counter int
)

func increment(c *gin.Context) {
    mu.Lock()
    counter++
    val := counter
    mu.Unlock()
    c.JSON(200, gin.H{"count": val})
}`,
      explanation: 'Gin runs every request handler in a concurrent goroutine. Any mutable state shared between handlers (counters, maps, slices) must be protected with a sync.Mutex or sync.RWMutex — the same rules as any concurrent Go code.'
    },
    {
      title: 'Blocking in middleware without calling c.Next()',
      wrong: `func logger() gin.HandlerFunc {
    return func(c *gin.Context) {
        log.Printf("request: %s %s", c.Request.Method, c.Request.URL)
        // forgot c.Next() — handler is never called!
    }
}`,
      right: `func logger() gin.HandlerFunc {
    return func(c *gin.Context) {
        log.Printf("request: %s %s", c.Request.Method, c.Request.URL)
        c.Next() // pass control to next handler in chain
        log.Printf("response status: %d", c.Writer.Status())
    }
}`,
      explanation: 'Middleware must call c.Next() to pass control to the next handler in the chain. Without it, the route handler is never reached — the request hangs or returns an empty response. Use c.Abort() only when you intentionally want to stop the chain (e.g., auth failure).'
    },
  ];

  challenge: Challenge = {
    title: 'Product API with Groups & Validation',
    language: 'typescript',
    description: `Build a Gin REST API for products with route groups and binding validation.

**Routes:**
- \`GET /api/v1/products\` — list all products (supports \`?category=\` filter)
- \`POST /api/v1/products\` — create product (requires auth header \`X-API-Key: secret\`)
- \`GET /api/v1/products/:id\` — get product by ID

**Product struct:**
\`\`\`go
type Product struct {
    ID       string  \`json:"id"\`
    Name     string  \`json:"name"\`
    Price    float64 \`json:"price"\`
    Category string  \`json:"category"\`
}
\`\`\`

**Create request:**
\`\`\`go
type CreateProductRequest struct {
    Name     string  \`json:"name"     binding:"required,min=2"\`
    Price    float64 \`json:"price"    binding:"required,gt=0"\`
    Category string  \`json:"category" binding:"required"\`
}
\`\`\`

Requirements:
- Public GET routes need no auth; POST route requires X-API-Key middleware
- Return 401 if key missing/wrong, 404 if product not found
- Use in-memory slice/map with sync.RWMutex`,
    hints: [
      'Use r.Group("/api/v1") for the shared prefix',
      'Apply the auth middleware only to the protected group or individual route',
      'c.Query("category") reads the filter; empty string means no filter',
      'c.ShouldBindJSON for the POST body — handle validation error with 422',
    ],
    starterCode: `package main

import (
    "net/http"
    "sync"
    "github.com/gin-gonic/gin"
)

type Product struct {
    ID       string  \`json:"id"\`
    Name     string  \`json:"name"\`
    Price    float64 \`json:"price"\`
    Category string  \`json:"category"\`
}

type CreateProductRequest struct {
    Name     string  \`json:"name"     binding:"required,min=2"\`
    Price    float64 \`json:"price"    binding:"required,gt=0"\`
    Category string  \`json:"category" binding:"required"\`
}

var (
    mu       sync.RWMutex
    products = []Product{
        {ID: "1", Name: "Widget", Price: 9.99, Category: "tools"},
        {ID: "2", Name: "Gadget", Price: 24.99, Category: "electronics"},
    }
    nextID = 3
)

func apiKeyAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        // TODO: check X-API-Key header == "secret"
    }
}

func listProducts(c *gin.Context) {
    // TODO: filter by ?category= if provided
}

func getProduct(c *gin.Context) {
    // TODO: find by :id, return 404 if not found
}

func createProduct(c *gin.Context) {
    // TODO: bind, validate, create, return 201
}

func main() {
    gin.SetMode(gin.TestMode)
    r := gin.Default()

    api := r.Group("/api/v1")
    // TODO: register routes
    _ = api

    r.Run(":8080")
}`,
    solution: `package main

import (
    "fmt"
    "net/http"
    "sync"
    "github.com/gin-gonic/gin"
)

type Product struct {
    ID       string  \`json:"id"\`
    Name     string  \`json:"name"\`
    Price    float64 \`json:"price"\`
    Category string  \`json:"category"\`
}

type CreateProductRequest struct {
    Name     string  \`json:"name"     binding:"required,min=2"\`
    Price    float64 \`json:"price"    binding:"required,gt=0"\`
    Category string  \`json:"category" binding:"required"\`
}

var (
    mu       sync.RWMutex
    products = []Product{
        {ID: "1", Name: "Widget", Price: 9.99, Category: "tools"},
        {ID: "2", Name: "Gadget", Price: 24.99, Category: "electronics"},
    }
    nextID = 3
)

func apiKeyAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        key := c.GetHeader("X-API-Key")
        if key != "secret" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid API key"})
            return
        }
        c.Next()
    }
}

func listProducts(c *gin.Context) {
    category := c.Query("category")
    mu.RLock()
    result := make([]Product, 0)
    for _, p := range products {
        if category == "" || p.Category == category {
            result = append(result, p)
        }
    }
    mu.RUnlock()
    c.JSON(http.StatusOK, result)
}

func getProduct(c *gin.Context) {
    id := c.Param("id")
    mu.RLock()
    for _, p := range products {
        if p.ID == id {
            mu.RUnlock()
            c.JSON(http.StatusOK, p)
            return
        }
    }
    mu.RUnlock()
    c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
}

func createProduct(c *gin.Context) {
    var req CreateProductRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
        return
    }
    mu.Lock()
    p := Product{ID: fmt.Sprintf("%d", nextID), Name: req.Name, Price: req.Price, Category: req.Category}
    products = append(products, p)
    nextID++
    mu.Unlock()
    c.JSON(http.StatusCreated, p)
}

func main() {
    gin.SetMode(gin.ReleaseMode)
    r := gin.Default()

    api := r.Group("/api/v1")
    api.GET("/products", listProducts)
    api.GET("/products/:id", getProduct)
    api.POST("/products", apiKeyAuth(), createProduct)

    r.Run(":8080")
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between c.BindJSON and c.ShouldBindJSON?',
      options: [
        'BindJSON auto-writes a 400 response on failure; ShouldBindJSON returns an error without writing anything',
        'ShouldBindJSON validates struct tags; BindJSON does not',
        'BindJSON is faster; ShouldBindJSON adds overhead from reflection',
        'They are identical — BindJSON is just an alias',
      ],
      answer: 0,
      explanation: 'c.BindJSON automatically writes a 400 Bad Request response when binding fails, taking control of the error format from you. c.ShouldBindJSON returns the error and writes nothing — letting you decide the response format. For consistent APIs, prefer ShouldBindJSON.'
    },
    {
      q: 'In Gin middleware, what happens if you call c.Abort() instead of c.Next()?',
      options: [
        'The remaining handlers in the chain are skipped; the current middleware continues executing',
        'The current middleware exits immediately',
        'The request is cancelled and the connection is closed',
        'An HTTP 503 response is sent to the client',
      ],
      answer: 0,
      explanation: 'c.Abort() sets a flag that prevents subsequent handlers in the chain (including the route handler) from being called. The current middleware function continues executing after Abort() — code after it still runs. c.AbortWithStatusJSON() is a convenience that also writes a JSON error response.'
    },
    {
      q: 'How do you extract the :id parameter from the path "/users/:id" in Gin?',
      options: [
        'c.Param("id")',
        'c.Query("id")',
        'c.PathValue("id")',
        'c.Get("id")',
      ],
      answer: 0,
      explanation: 'Named URL parameters (prefixed with ":") are extracted with c.Param("name"). c.Query reads URL query strings (?key=val). c.PathValue is the net/http 1.22 method, not Gin. c.Get reads values set on the context by middleware with c.Set.'
    },
    {
      q: 'Where should gin.SetMode(gin.ReleaseMode) be called?',
      options: [
        'Before calling gin.New() or gin.Default()',
        'After r.Run() to apply to active connections',
        'Inside each handler that needs release behavior',
        'It only affects tests, not the production server',
      ],
      answer: 0,
      explanation: 'gin.SetMode must be called before the engine is created. Gin reads the mode at engine creation time to configure loggers and other internals. Setting it after gin.Default() or gin.New() has no effect on the already-created engine.'
    },
    {
      q: 'How do you pass a value from middleware to a downstream handler in Gin?',
      options: [
        'c.Set("key", value) in middleware, then c.MustGet("key").(Type) in the handler',
        'Assign to a global variable in the middleware',
        'Return the value from the middleware function',
        'Use context.WithValue on r.Context()',
      ],
      answer: 0,
      explanation: 'gin.Context has its own key-value store for passing data within a request chain. c.Set("key", value) stores a value; c.Get("key") returns (value, exists); c.MustGet("key") panics if missing. This is idiomatic for passing auth user, trace IDs, etc. from middleware to handlers.'
    },
    {
      q: 'What is the difference between gin.Default() and gin.New()?',
      options: ['They are identical', 'gin.Default() includes the Logger and Recovery middleware; gin.New() creates a bare engine with no middleware', 'gin.New() is deprecated', 'gin.Default() only works in debug mode'],
      answer: 1,
      explanation: 'gin.Default() is a convenience constructor that attaches the Logger (request logging) and Recovery (panic → 500 response) middleware. gin.New() creates a clean engine with no middleware — use it in production when you want to add only your own structured logging, custom recovery handler, or observability middleware without the default output format.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use gin.Default() or gin.New() for a production server?',
      a: 'Prefer gin.New() with explicit middleware. gin.Default() attaches Logger and Recovery — both are reasonable for production, but gin.New() gives you control over which middleware runs and in what order. You can then add r.Use(gin.Recovery()) and a structured logger (zerolog, zap) that outputs JSON instead of colored text. Always add gin.Recovery() — without it, a panic in any handler kills the goroutine silently.'
    },
    {
      q: 'How do I return a custom error format across all handlers?',
      a: 'Write a helper function: func respondError(c *gin.Context, status int, code, msg string) { c.JSON(status, gin.H{"code": code, "message": msg}) }. Use it everywhere instead of inline c.JSON calls. For centralized error handling, use c.Error(err) throughout, then add an error-processing middleware that reads c.Errors and formats all errors at the end of the chain.'
    },
    {
      q: 'How do I add CORS headers in Gin?',
      a: 'Use the gin-contrib/cors package: import "github.com/gin-contrib/cors", then r.Use(cors.Default()) for development (allows all origins) or cors.New(cors.Config{...}) for production-safe configuration with specific origins, methods, and headers. Do not write CORS headers manually — the edge cases (OPTIONS preflight, credentialed requests) are subtle and the library handles them correctly.'
    },
    {
      q: 'How do I validate a path parameter (e.g., ensure :id is a number)?',
      a: 'Gin path parameters are always strings — parse and validate manually: id, err := strconv.ParseInt(c.Param("id"), 10, 64). If parsing fails, respond with 400 and return. For UUID validation, use github.com/google/uuid: uuid.Parse(c.Param("id")). Gin\'s binding tags do not apply to path parameters — only to struct fields bound from body/query.'
    },
    {
      q: 'What is gin.H and when should I use it?',
      a: 'gin.H is a type alias for map[string]any. It is a convenience for one-off JSON objects: c.JSON(200, gin.H{"id": 1, "name": "Alice"}). For responses with a fixed schema that appears repeatedly, define a proper struct — it documents the shape, enables IDE completion, and avoids typos in map keys. Reserve gin.H for simple, one-time-use response objects.'
    },
    {
      q: 'How does Gin handle panics in handlers?',
      a: 'gin.Recovery() middleware (included in gin.Default()) wraps every handler in a deferred recover(). If a handler panics, Recovery catches it, logs the stack trace, and returns a 500 Internal Server Error. Without Recovery, a panic in a handler goroutine kills that goroutine silently — the client gets a connection reset with no response. Always include Recovery in production.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Gin wraps net/http with a fast router, ergonomic gin.Context, and middleware chains — use ShouldBindJSON, set ReleaseMode, wrap in http.Server for production.',
    mustKnow: [
      'gin.SetMode(gin.ReleaseMode) must be called before creating the engine.',
      'c.ShouldBindJSON returns error without writing — preferred over c.BindJSON for custom error formats.',
      'Always return after error responses — Gin does not stop execution on c.JSON().',
      'Middleware must call c.Next() or c.Abort() — never just return without one of them.',
      'c.Set("key", val) / c.MustGet("key").(Type) to pass data from middleware to handlers.',
      'Wrap r in http.Server for timeouts and graceful shutdown — r.Run() has no timeouts.',
      'gin.Recovery() is essential — without it panics kill goroutines silently.',
    ],
    interviewFocus: [
      'What is the difference between c.BindJSON and c.ShouldBindJSON?',
      'How does middleware work in Gin and what do c.Next() and c.Abort() do?',
      'How do you pass auth user info from middleware to a route handler?',
      'Why use http.Server instead of r.Run() in production?',
      'How do you build a consistent error response format across all Gin handlers?',
    ],
  };
}
