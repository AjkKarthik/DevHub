import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './middleware-composition-first-wrap-runs-outermost.html',
  styleUrl: './middleware-composition-first-wrap-runs-outermost.scss'
})
export class MiddlewareCompositionFirstWrapRunsOutermostSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names the middleware pattern but never actually writes it in code',
      points: [
        'The main page\'s Quick Reference lists "Middleware (http.Handler) — func(next http.Handler) http.Handler — composable request pipeline," and its QnA describes composing one: "final := logging(auth(rateLimiter(baseHandler)))." Neither the theory section nor any of the five code tabs actually defines or wraps a real middleware chain — the pattern is named and its call-site shape is shown, but its execution order is never demonstrated.',
        'This is the same "named but never coded" gap this hub\'s own gRPC subtopic on bidirectional streaming found on that main page — a pattern the reader is told exists and roughly how to write it, without ever seeing what actually happens when it runs.',
        'Middleware composition is pure function composition: each middleware is a func(http.Handler) http.Handler that takes the NEXT handler in the chain and returns a NEW handler wrapping it. final := logging(auth(rateLimiter(baseHandler))) builds the chain from the inside out at CONSTRUCTION time — rateLimiter(baseHandler) is evaluated first, then auth(...) wraps that result, then logging(...) wraps that.',
      ]
    },
    {
      heading: 'Construction order and request-time execution order are opposite',
      points: [
        'Even though rateLimiter(baseHandler) is the innermost function CALL evaluated first while building the chain, logging is the handler actually invoked FIRST when an HTTP request arrives — because logging is the outermost wrapper, and the Go HTTP server calls final.ServeHTTP(w, r), which IS logging\'s own ServeHTTP.',
        'Each middleware\'s own function body is split by its call to next.ServeHTTP(w, r): code written BEFORE that call runs on the way IN (outermost first — logging, then auth, then rateLimiter, then baseHandler), and code written AFTER that call runs on the way OUT, in the exact reverse order (rateLimiter\'s post-logic first, then auth\'s, then logging\'s last).',
        'This is the identical "first wrap is outermost" relationship this hub\'s own gRPC subtopic already established for ChainUnaryInterceptor — the same construction-vs-execution-order distinction, just for HTTP middleware composed by hand instead of a gRPC-provided chaining helper.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A middleware chain the main page describes but never writes',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "net/http"
)

func logging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        fmt.Println("logging: before")
        next.ServeHTTP(w, r)
        fmt.Println("logging: after")
    })
}

func auth(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        fmt.Println("auth: before")
        next.ServeHTTP(w, r)
        fmt.Println("auth: after")
    })
}

func rateLimiter(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        fmt.Println("rateLimiter: before")
        next.ServeHTTP(w, r)
        fmt.Println("rateLimiter: after")
    })
}

func baseHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Println("baseHandler: handling request")
}

func main() {
    // Matches the main page's own QnA verbatim:
    // "final := logging(auth(rateLimiter(baseHandler)))"
    final := logging(auth(rateLimiter(http.HandlerFunc(baseHandler))))

    // Simulating one incoming request (no real server needed to see order):
    final.ServeHTTP(nil, &http.Request{})

    // Output, in this exact order:
    // logging: before
    // auth: before
    // rateLimiter: before
    // baseHandler: handling request
    // rateLimiter: after
    // auth: after
    // logging: after
}`,
    },
    {
      label: 'Order changes behavior, not just readability',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "net/http"
)

// A rate limiter that rejects a request BEFORE it reaches auth --
// so unauthenticated, rate-limited traffic never pays the cost of
// an auth check at all.
func rateLimiterFirst(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        fmt.Println("rateLimiter: before (checking quota)")
        // if overQuota { return without calling next -- auth never runs }
        next.ServeHTTP(w, r)
    })
}

func authSecond(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        fmt.Println("auth: before (checking credentials)")
        next.ServeHTTP(w, r)
    })
}

func baseHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Println("baseHandler: handling request")
}

func main() {
    // rateLimiter is now the OUTERMOST wrap -- it runs FIRST on every
    // request, before auth ever gets a chance to run at all.
    chainA := rateLimiterFirst(authSecond(http.HandlerFunc(baseHandler)))
    chainA.ServeHTTP(nil, &http.Request{})
    // rateLimiter: before (checking quota)
    // auth: before (checking credentials)
    // baseHandler: handling request

    fmt.Println("---")

    // Swap the wrap order: auth is now OUTERMOST, so every request pays
    // for a full credential check even if it would have been rejected
    // by the rate limiter anyway -- same two middlewares, different
    // runtime BEHAVIOR, purely from reordering the wrap expression.
    chainB := authSecond(rateLimiterFirst(http.HandlerFunc(baseHandler)))
    chainB.ServeHTTP(nil, &http.Request{})
    // auth: before (checking credentials)
    // rateLimiter: before (checking quota)
    // baseHandler: handling request
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Using the main page\'s own QnA wrap expression final := logging(auth(rateLimiter(baseHandler))), predict the exact print order if each of logging, auth, and rateLimiter prints "NAME: before" immediately before calling next.ServeHTTP(w, r), and "NAME: after" immediately after that call returns — for a single incoming request that reaches baseHandler successfully.',
    hint: 'Which middleware is the OUTERMOST wrapper in logging(auth(rateLimiter(baseHandler)))? Per this subtopic\'s theory, does the outermost wrapper\'s "before" code run first or last when a request actually arrives? What happens to that same ordering on the way back out, after baseHandler returns?',
    solution: 'The exact order is: "logging: before", "auth: before", "rateLimiter: before", baseHandler runs, then "rateLimiter: after", "auth: after", "logging: after" — matching this subtopic\'s first code example precisely. logging is the OUTERMOST wrapper (the last function applied when building the chain, per final := logging(auth(rateLimiter(baseHandler)))), so per this subtopic\'s theory it is the first ServeHTTP actually invoked when a request arrives, making its "before" print first. Each middleware then calls next.ServeHTTP(w, r) before running its own "after" print, so the "before" prints cascade inward in outermost-to-innermost order (logging, auth, rateLimiter), while the "after" prints unwind in the exact reverse, innermost-to-outermost order (rateLimiter, auth, logging) — the same nested-call-stack shape as ordinary Go function calls, since that is literally what next.ServeHTTP(w, r) is.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'In final := logging(auth(rateLimiter(baseHandler))), rateLimiter runs FIRST at request time, since rateLimiter(baseHandler) is the innermost function call and gets evaluated first when the expression is built.',
      reality: 'This subtopic\'s theory distinguishes CONSTRUCTION time from REQUEST time: rateLimiter(baseHandler) IS evaluated first while BUILDING the chain, but the resulting handler\'s ServeHTTP is invoked in the opposite order at REQUEST time — logging is the outermost wrapper and its ServeHTTP is what the HTTP server actually calls first, so logging\'s own "before" logic runs first, not rateLimiter\'s.'
    },
    {
      thought: 'Each middleware in the chain runs as one bundled unit, either entirely before or entirely after the inner handler — a middleware cannot have logic on both sides of the request.',
      reality: 'This subtopic\'s code examples show every middleware here is split around its own call to next.ServeHTTP(w, r) — code before that call runs on the way in, code after it runs on the way out, once the entire rest of the chain (including baseHandler) has finished. A single middleware routinely has logic on both sides, such as logging a request\'s start time before next and its duration after.'
    },
    {
      thought: 'The order middlewares are wrapped in — logging(auth(rateLimiter(...))) vs. auth(rateLimiter(logging(...))) — only affects log readability or code organization, not actual runtime behavior, since the same three middlewares still all run on every request either way.',
      reality: 'This subtopic\'s second code example shows wrap order changes real BEHAVIOR: with rateLimiter outermost, a request that fails the quota check never reaches the auth middleware at all, avoiding the cost of a credential check entirely — with auth outermost instead, every request pays for a full auth check even ones that would have been rejected by the rate limiter regardless, purely from reordering the same two middlewares.'
    }
  ];
}
