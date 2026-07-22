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
  templateUrl: './pattern-conflicts-panic-at-registration.html',
  styleUrl: './pattern-conflicts-panic-at-registration.scss'
})
export class PatternConflictsPanicAtRegistrationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '"More specific patterns win" only covers the cases where one pattern IS more specific',
      points: [
        'The main page\'s own theory states the precedence rule directly: "More specific patterns win over less specific: \'/users/new\' matches before \'/users/{id}\' for that literal path." That is accurate and matches Go\'s own documented rule — but it silently assumes every pair of overlapping patterns has one that is unambiguously more specific than the other. Not every pair does.',
        'Go\'s own blog post introducing the Go 1.22 routing enhancements poses the exact scenario where this assumption breaks: "What if two patterns overlap but neither is more specific? For example, /posts/{id} and /{resource}/latest both match /posts/latest. There is no obvious answer to which takes precedence, so we consider these patterns to conflict with each other." Neither pattern is a strict subset of the other\'s matches — each matches requests the other does not.',
        'The resolution Go chose is not a runtime coin-flip or a silent "first registered wins" rule — it is a hard failure, by design: "Registering both of them (in either order!) will panic." This happens at mux.HandleFunc/mux.Handle call time (typically during program startup), not per-request — meaning a genuine ambiguity is caught immediately when the conflicting route is added, not discovered later as confusing runtime routing behavior.',
      ]
    },
    {
      heading: 'Why panicking at registration is the right tradeoff, and what it means for route design',
      points: [
        'This is a deliberate design choice consistent with Go\'s general philosophy of failing loudly and early rather than silently picking an arbitrary winner that could differ across Go versions or implementation details. A silent precedence rule for genuinely ambiguous patterns would be fragile — two reasonable engineers could each expect their own pattern to win, and any change to the tie-breaking heuristic in a future Go release could silently flip which one actually matches, without any code change on the caller\'s part.',
        'Practically, this means a growing set of routes registered across multiple files or packages (a common pattern for larger services, where different features register their own subsets of routes on a shared mux) carries a real, if rare, risk: two features written independently, each using a wildcard segment, can define genuinely conflicting patterns without either author necessarily noticing the overlap until the program fails to even start.',
        'The main page\'s own REST-API challenge registers three non-overlapping patterns ("GET /tasks", "POST /tasks", "DELETE /tasks/{id}") — none conflict, which is exactly why this failure mode never surfaces in that example. The risk grows specifically as a service accumulates more wildcard-based routes across a larger URL space, making the panic-at-registration behavior something to actively design for testing (e.g., a `go test` that constructs and registers the FULL production mux, which would catch a conflict immediately) rather than something to only discover in production.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two genuinely ambiguous patterns: neither is more specific',
      language: 'typescript',
      code: `package main

import "net/http"

func main() {
    mux := http.NewServeMux()

    // Both patterns match "/posts/latest":
    //   /posts/{id}       -- matches any second segment under /posts/
    //   /{resource}/latest -- matches "latest" as the second segment
    //                          under ANY first segment
    // Neither is a strict subset of the other's matches: /posts/{id}
    // also matches "/posts/42" (which /{resource}/latest does NOT),
    // and /{resource}/latest also matches "/comments/latest" (which
    // /posts/{id} does NOT). Per this subtopic's theory, this is
    // EXACTLY the shape Go's own routing blog calls a genuine conflict.
    mux.HandleFunc("/posts/{id}", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("post: " + r.PathValue("id")))
    })

    // Registering this SECOND pattern panics immediately -- the
    // program never even reaches ListenAndServe:
    // panic: pattern "/{resource}/latest" (registered at ...)
    // conflicts with pattern "/posts/{id}" (registered at ...):
    // both match some paths, like "/posts/latest"
    mux.HandleFunc("/{resource}/latest", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("latest: " + r.PathValue("resource")))
    })
}`,
    },
    {
      label: 'The non-conflicting version: one pattern IS more specific',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "net/http"
)

func main() {
    mux := http.NewServeMux()

    // "GET /posts/{id}" and "GET /posts/latest" (a literal, not a
    // wildcard) DO NOT conflict -- the literal "/posts/latest" is a
    // strict subset of what "/posts/{id}" would otherwise match, so
    // per the precedence rule the main page's own theory states,
    // the MORE SPECIFIC literal pattern simply wins for that one
    // exact path, and both patterns register without any panic.
    mux.HandleFunc("GET /posts/latest", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "the literally-most-recent post")
    })
    mux.HandleFunc("GET /posts/{id}", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "post:", r.PathValue("id"))
    })

    // A request for /posts/latest is routed to the FIRST handler
    // (the literal match) -- a request for /posts/42 is routed to
    // the SECOND (the wildcard) -- no ambiguity, no panic, because
    // one pattern's matches are a strict subset of the other's.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A service has two independently-developed features, each registering its own routes on a shared mux in separate files: the "content" feature registers GET /{category}/featured, and the "posts" feature (written by a different engineer, unaware of the content feature\'s route) registers GET /posts/{slug}. Using this subtopic\'s theory, determine whether these two registrations conflict, and if so, explain exactly why, referencing which specific request path both patterns would match.',
    hint: 'Is /{category}/featured\'s set of matched paths a strict subset of /posts/{slug}\'s matched paths, or vice versa — or does neither contain the other? What literal path would need to exist for BOTH patterns to match it simultaneously?',
    solution: 'These two patterns DO conflict, for exactly the reason this subtopic\'s theory describes: neither is a strict subset of the other. /posts/{slug} matches any two-segment path starting with the literal "posts" (e.g. /posts/hello-world, /posts/featured); /{category}/featured matches any two-segment path ending with the literal "featured" (e.g. /movies/featured, /posts/featured). The specific literal path /posts/featured is matched by BOTH patterns simultaneously — it satisfies /posts/{slug} with slug="featured", and it also satisfies /{category}/featured with category="posts" — and per this subtopic\'s theory, there is no obvious rule for which pattern should take precedence for that one specific path, since neither pattern\'s full set of matches contains the other\'s. This is structurally identical to the /posts/{id} vs /{resource}/latest example from Go\'s own routing blog post that this subtopic\'s first code example reproduces. Registering both of these patterns on the same mux — in either file, in either order — will panic at program startup with a message identifying the conflicting patterns and where each was registered, exactly the safety net this subtopic\'s theory describes: the ambiguity is caught immediately rather than silently producing unpredictable routing behavior for the one specific overlapping path (/posts/featured) that both features happened to define, unbeknownst to either engineer.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own precedence rule — "more specific patterns win over less specific" — is a complete description of how Go 1.22\'s ServeMux resolves ANY two overlapping patterns; whichever one seems more specific by inspection will simply be chosen at request time.',
      reality: 'This subtopic\'s theory and first code example show the precedence rule only applies when one pattern IS more specific — meaning its matches are a strict subset of the other\'s. When two patterns overlap but NEITHER is more specific (each matches at least one path the other does not), Go does not pick a winner at all — it panics at registration time, refusing to even start the program with such an ambiguous route table.'
    },
    {
      thought: 'A pattern conflict panic is something that would only happen with deliberately contrived, unrealistic-looking patterns — in practice, a real service\'s routes are unlikely to ever trigger this failure mode.',
      reality: 'This subtopic\'s exercise shows a realistic, easy-to-reach scenario: two INDEPENDENTLY developed features, each written by a different engineer with no visibility into the other\'s routes, can define genuinely conflicting wildcard patterns without either author intending or noticing the overlap — this risk grows naturally as a service\'s route table grows and is split across multiple files or packages, not something reserved for contrived examples.'
    },
    {
      thought: 'Since a pattern-conflict panic happens "at registration," it would only be caught if the exact conflicting routes happen to be exercised by a request during testing — like any other runtime bug that depends on a specific code path being hit.',
      reality: 'This subtopic\'s theory clarifies the panic happens the MOMENT mux.HandleFunc/mux.Handle is called with the conflicting pattern — during program startup, before any request is ever served — not lazily on the first matching request. This means simply constructing and registering the full production mux (e.g., in a test that calls the same setup function used in main()) is sufficient to catch a conflict deterministically, with no need to actually simulate the specific overlapping request path.'
    }
  ];
}
