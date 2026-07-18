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
  templateUrl: './chain-interceptor-first-is-outermost.html',
  styleUrl: './chain-interceptor-first-is-outermost.scss'
})
export class ChainInterceptorFirstIsOutermostSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows one interceptor at a time — chaining several raises an ordering question it never answers',
      points: [
        'The main page\'s own theory covers grpc.UnaryInterceptor (a single interceptor) and mentions grpc.ChainUnaryInterceptor by name for attaching several, with a logging example and an auth example shown SEPARATELY, never actually chained together in one server. This leaves an important, easy-to-get-backwards question unanswered: when multiple interceptors run, in what order does control actually pass between them?',
        'grpc-go\'s own documentation for chaining interceptors states the rule directly: "The first interceptor will be the outer most, while the last interceptor will be the inner most wrapper around the real call." Passing grpc.ChainUnaryInterceptor(A, B, C) produces execution flowing A → B → C → the actual handler → C → B → A on the way back — a nested, onion-layer structure, not a flat sequential list.',
        'This mirrors exactly the middleware-wrapping pattern the main page\'s own theory already establishes for a SINGLE interceptor: "code before c.Next() runs on the way in... code after runs on the way out" (borrowing the same before/after phrasing this hub uses for Gin middleware, since gRPC interceptors follow an identical wrap-and-call-the-next-layer shape) — chaining just means each interceptor\'s own "next layer" is the NEXT interceptor in the list, not the handler directly, until the last one in the chain.',
      ]
    },
    {
      heading: 'Why getting this order backwards produces working-but-subtly-wrong behavior, not an obvious crash',
      points: [
        'This ordering rule matters concretely for interceptors whose relative order changes observable behavior — the canonical example being a LOGGING interceptor and an AUTH interceptor together. If auth is registered FIRST (outermost) and logging SECOND (innermost), an unauthenticated request never reaches the logging interceptor at all, since auth aborts the chain (returning an error instead of calling the next handler) before logging\'s own code ever runs — meaning unauthenticated request attempts go completely unlogged.',
        'Reversing the order — logging first (outermost), auth second (innermost) — means EVERY request, authenticated or not, gets logged before auth has a chance to reject it, since logging\'s own "before" code runs and then calls its next layer (auth) unconditionally, regardless of what auth eventually decides. This is a genuinely different, often more desirable behavior for security-relevant logging (recording rejected/unauthorized attempts, not just successful ones) — but it is entirely a consequence of REGISTRATION ORDER, not anything explicit in either interceptor\'s own code.',
        'This is precisely the kind of bug that produces no error, no panic, and no obviously broken behavior for the common case (successful, authenticated requests still work identically either way) — it only surfaces as a genuine gap in an audit trail or monitoring dashboard, discovered much later, specifically for the unauthenticated-request case neither interceptor\'s own tests may have been checking for order-sensitivity in the first place.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Auth first (outermost): unauthenticated requests are never logged',
      language: 'typescript',
      code: `package main

import (
    "context"
    "log"

    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
)

func authInterceptor(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
    // If auth fails, this returns WITHOUT ever calling handler(...) --
    // and since auth is registered FIRST (outermost) below, nothing
    // registered AFTER it (including logging) ever runs for this
    // particular request at all.
    if !isValidToken(ctx) {
        return nil, status.Errorf(codes.Unauthenticated, "invalid token")
    }
    return handler(ctx, req)
}

func loggingInterceptor(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
    log.Printf("request: %s", info.FullMethod)
    return handler(ctx, req)
}

func main() {
    // Per this subtopic's theory ("the first interceptor will be
    // the outer most"): authInterceptor is OUTERMOST here --
    // unauthenticated requests are rejected by auth BEFORE
    // loggingInterceptor's own code ever executes. The audit trail
    // this server produces has a genuine BLIND SPOT for every
    // rejected, unauthenticated attempt.
    s := grpc.NewServer(
        grpc.ChainUnaryInterceptor(authInterceptor, loggingInterceptor),
    )
    _ = s
}

func isValidToken(ctx context.Context) bool { return false /* simplified */ }`,
    },
    {
      label: 'Logging first (outermost): every attempt is logged, including rejections',
      language: 'typescript',
      code: `package main

import "google.golang.org/grpc"

func main() {
    // SAME two interceptors, SAME two functions, unchanged --
    // only the ORDER passed to ChainUnaryInterceptor is reversed.
    //
    // Per this subtopic's theory, loggingInterceptor is now
    // OUTERMOST: its own "before" code (the log.Printf call) always
    // runs first and unconditionally, THEN it calls its own next
    // layer (authInterceptor) -- which may still reject the
    // request, but only AFTER the log line has already been
    // written. Every request attempt, authenticated or not, now
    // appears in the audit trail.
    s := grpc.NewServer(
        grpc.ChainUnaryInterceptor(loggingInterceptor, authInterceptor),
    )
    _ = s
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team registers grpc.ChainUnaryInterceptor(rateLimitInterceptor, metricsInterceptor, authInterceptor) on their server, in that exact order, reasoning "we want to rate-limit first to protect the server from overload, THEN record metrics, THEN check auth." A security review later flags that failed authentication attempts are never appearing in the metrics dashboard\'s request-count totals, even though the team explicitly intended metrics to be recorded before auth runs. Using this subtopic\'s theory, explain whether the registration order actually achieves what the team intended, and if not, why.',
    hint: 'Per this subtopic\'s theory, does the order arguments are passed to ChainUnaryInterceptor determine which interceptor is OUTERMOST (runs first, wrapping everything after it) or INNERMOST (runs last, closest to the handler)? Given rateLimitInterceptor, metricsInterceptor, authInterceptor in that order, which one is genuinely running "before" which?',
    solution: 'The registration order DOES achieve what the team intended, and the security review\'s finding points to a different bug — most likely inside metricsInterceptor\'s own implementation, not the interceptor ordering itself. Per this subtopic\'s theory, "the first interceptor will be the outer most, while the last interceptor will be the inner most" — with grpc.ChainUnaryInterceptor(rateLimitInterceptor, metricsInterceptor, authInterceptor), execution genuinely flows rateLimitInterceptor (outermost, runs first) → metricsInterceptor (middle) → authInterceptor (innermost, runs last, closest to the actual handler) → back out in reverse. This means metricsInterceptor\'s own "before" code runs and calls its next layer (authInterceptor) BEFORE auth has any chance to reject the request — exactly matching the team\'s stated intent of recording metrics before auth runs, for every request including ones auth will go on to reject. If failed-auth attempts are genuinely missing from the metrics dashboard despite this correct ordering, the actual bug is almost certainly that metricsInterceptor\'s own code only records a metric AFTER calling handler(ctx, req) and observing a successful (non-error) result — i.e., it only counts the OUTGOING direction, not the incoming attempt — rather than recording "a request was attempted" unconditionally on the way IN, before calling its next layer. This is a genuinely different bug from an interceptor-ordering mistake: the interceptors are correctly ordered per this subtopic\'s theory, but metricsInterceptor\'s own internal logic (what it chooses to record, and at which point in its own before/after code) is what needs fixing, not the order it was registered in.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'grpc.ChainUnaryInterceptor(A, B, C) registers three interceptors that each run independently on every request, in no particular meaningful relationship to each other — the order they are listed in is mostly a cosmetic detail, similar to how the order of unrelated statements in a function body might not matter.',
      reality: 'This subtopic\'s theory and code examples show the order is genuinely load-bearing and produces a nested wrapping structure, not independent parallel execution: "the first interceptor will be the outer most, while the last interceptor will be the inner most wrapper around the real call," per grpc-go\'s own documentation. Swapping the order of two interceptors that each conditionally short-circuit the chain (like an auth check) can produce genuinely different observable behavior for rejected requests.'
    },
    {
      thought: 'Since the main page\'s own theory already establishes the before/after wrapping pattern for a SINGLE interceptor ("code before c.Next() runs on the way in; code after runs on the way out" — borrowed phrasing from this hub\'s own Gin coverage), understanding chained interceptors is a completely separate, additional concept requiring its own distinct mental model.',
      reality: 'This subtopic\'s theory shows chaining is a direct, natural extension of that exact same single-interceptor wrapping pattern — each interceptor in a chain still wraps a "next layer" and calls it the same way, the only difference chaining introduces is that the "next layer" for interceptor N is interceptor N+1 in the list, rather than the handler directly, until the very last interceptor in the chain.'
    },
    {
      thought: 'A bug where expected data (like the missing failed-auth-attempt metrics in this subtopic\'s exercise) doesn\'t show up as expected, in a system using chained interceptors, should be diagnosed first by checking and adjusting the interceptor REGISTRATION ORDER, since that is the most likely place a chained-interceptor system tends to go wrong.',
      reality: 'This subtopic\'s exercise demonstrates the opposite lesson directly: a CORRECTLY-ordered chain (verified against the documented outermost/innermost rule) can still produce a missing-data bug entirely due to what an individual interceptor\'s OWN code chooses to do with its position in the chain (e.g., only recording a metric after a successful call instead of unconditionally on entry) — diagnosing the actual interceptor\'s own before/after logic is at least as important as checking registration order, not a secondary concern to rule out only after re-checking the order first.'
    }
  ];
}
