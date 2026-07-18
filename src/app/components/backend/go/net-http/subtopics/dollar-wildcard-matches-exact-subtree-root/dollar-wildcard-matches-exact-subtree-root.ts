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
  templateUrl: './dollar-wildcard-matches-exact-subtree-root.html',
  styleUrl: './dollar-wildcard-matches-exact-subtree-root.scss'
})
export class DollarWildcardMatchesExactSubtreeRootSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A plain trailing-slash pattern matches an entire subtree — not just the root itself',
      points: [
        'The main page\'s own theory lists three Go 1.22 pattern shapes: "\'GET /users\' (exact method), \'GET /users/{id}\' (wildcard), \'/prefix/\' (subtree match)." That third shape — a pattern ending in a plain trailing slash — is described accurately as a "subtree match," but the main page never spells out exactly how broad that subtree actually is, or how to narrow it to just the root path itself.',
        'A pattern like "/posts/" matches every path that begins with "/posts/" — "/posts/", "/posts/42", "/posts/latest/comments", all of it — the entire subtree rooted at that prefix. This is precisely why the main page\'s own advice to "use http.StripPrefix for serving static files under a sub-path" works the way it does: a subtree pattern is the natural fit for a file server or a catch-all handler responsible for everything under a given prefix.',
        'The problem this creates: what if a handler needs to respond to the subtree ROOT specifically — exactly "/posts/" and nothing else — while a DIFFERENT, more specific pattern handles everything else under that prefix? A plain "/posts/" pattern cannot express "only this exact path," because by definition it matches the whole subtree.',
      ]
    },
    {
      heading: 'The {$} suffix: matching a subtree root exactly, and nothing else',
      points: [
        'Go\'s own routing-enhancements blog post introduces the fix directly: "patterns ending in a slash, like /posts/, match all paths beginning with that string. To match only the path with the trailing slash, you can write /posts/{$}. That will match /posts/ but not /posts or /posts/234." The dollar-sign wildcard is a special marker meaning "end of path here" — not a named capture like {id}, but an anchor.',
        'This gives route authors a genuine choice previously unavailable without a third-party router: register "/posts/{$}" for logic specific to the collection root (e.g., a listing page) and "/posts/{id}" for logic specific to one item, as two separate, non-overlapping, individually testable handlers — rather than one catch-all subtree handler that has to branch internally on whether r.URL.Path happens to equal the bare prefix.',
        'Per the same precedence rule the main page\'s own theory already establishes ("more specific patterns win"), "/posts/{$}" is inherently MORE specific than the plain subtree pattern "/posts/" it might otherwise overlap with — its matches (exactly one path) are a strict subset of the subtree pattern\'s matches (every path under the prefix) — so the two can coexist on the same mux without triggering the registration-time conflict this hub\'s own previous subtopic describes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without {$}: one subtree handler branching internally',
      language: 'typescript',
      code: `package main

import "net/http"

// Before reaching for {$}, handling "the collection root vs. a
// specific item" inside ONE subtree handler means branching
// manually on the path -- exactly the kind of logic Go 1.22's
// pattern language exists to move OUT of handler bodies.
func postsHandler(w http.ResponseWriter, r *http.Request) {
    if r.URL.Path == "/posts/" {
        w.Write([]byte("post listing"))
        return
    }
    id := r.URL.Path[len("/posts/"):]
    w.Write([]byte("post: " + id))
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/posts/", postsHandler) // ONE handler for the
                                              // whole subtree, with
                                              // manual path branching
                                              // inside it.
}`,
    },
    {
      label: 'With {$}: two separate, precise, non-conflicting patterns',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "net/http"
)

func main() {
    mux := http.NewServeMux()

    // Matches EXACTLY "/posts/" -- nothing else. This is a
    // dedicated, single-purpose handler for the collection root,
    // with no manual path-string branching needed inside it.
    mux.HandleFunc("GET /posts/{$}", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "post listing")
    })

    // Matches any single segment under /posts/ EXCEPT the bare
    // root, since "/posts/{$}" above already claims that one exact
    // path more specifically -- no manual branching, no overlap.
    mux.HandleFunc("GET /posts/{id}", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "post:", r.PathValue("id"))
    })

    // Both patterns register cleanly -- "/posts/{$}"'s single exact
    // match is a strict subset of what "/posts/{id}" would otherwise
    // ALSO seem to overlap with, so the more-specific-wins rule
    // resolves this cleanly with no registration-time conflict.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team registers mux.HandleFunc("/files/", fileServerHandler) to serve static files from a directory, using http.StripPrefix as the main page\'s own advice recommends. They also want a SEPARATE, dedicated handler that returns a JSON directory listing specifically when a client requests exactly "/files/" (the bare root), while every other path under "/files/" continues to go to the file server. Using this subtopic\'s theory, describe the pattern to register for the directory-listing handler, and explain why it can coexist with the existing "/files/" subtree pattern without a registration conflict.',
    hint: 'What exact pattern syntax does this subtopic say matches ONLY a subtree root and nothing else? Is that pattern\'s set of matches (one single path) a STRICT SUBSET of what the existing "/files/" subtree pattern already matches (every path under the prefix, including that one)?',
    solution: 'The pattern to register for the directory-listing handler is "GET /files/{$}" — per this subtopic\'s theory, the {$} suffix matches exactly the bare subtree-root path ("/files/") and nothing else, unlike a plain "/files/" pattern which matches the entire subtree. This coexists cleanly with the existing "/files/" (or "GET /files/") pattern already registered for the file server, rather than triggering the registration-time conflict panic covered in this hub\'s prior subtopic, precisely because "/files/{$}"\'s set of matches (exactly one path) is a STRICT SUBSET of what "/files/" already matches (every path under that prefix, including the bare root itself) — one pattern IS unambiguously more specific than the other, which is exactly the condition under which Go\'s precedence rule ("more specific patterns win") applies cleanly instead of triggering a conflict. Once both are registered, a request for exactly "/files/" routes to the new, more-specific directory-listing handler, while every other path under the prefix ("/files/report.pdf", "/files/2024/summary.csv", etc.) still falls through to the original file-server handler — with neither handler needing any manual r.URL.Path branching to tell the two cases apart.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own description of a trailing-slash pattern like "/prefix/" as a "subtree match" means it matches the subtree\'s contents but not the bare prefix path itself — to actually match "/prefix/" exactly, a separate, different mechanism must be used from the start.',
      reality: 'This subtopic\'s theory and first code example show the opposite: a plain trailing-slash pattern like "/posts/" already matches the bare root path itself (exactly "/posts/") AS WELL AS everything nested under it — it is the ENTIRE subtree, root included, that gets matched by one handler by default. The {$} suffix exists specifically to carve the root OUT of that broad match into its own separate, dedicated pattern, not to add root-matching where it was previously missing.'
    },
    {
      thought: 'Since "/posts/{$}" and "/posts/" both, in some sense, involve matching the path "/posts/", registering both patterns on the same mux should trigger the same kind of registration-time conflict panic this hub\'s own prior subtopic describes for genuinely ambiguous overlapping patterns.',
      reality: 'This subtopic\'s theory and second code example show these two patterns do NOT conflict, precisely because one is unambiguously more specific than the other — "/posts/{$}" matches a single path that is a strict subset of everything "/posts/" already matches. The registration-time panic is reserved specifically for pairs where NEITHER pattern\'s matches contain the other\'s, which is not the case here.'
    },
    {
      thought: 'The {$} suffix is a rarely-needed, niche piece of syntax mainly useful for unusual edge cases — most services handling a subtree root differently from the rest of the subtree would just branch on r.URL.Path manually inside one shared handler, as shown in this subtopic\'s first code example, since that approach works fine too.',
      reality: 'This subtopic\'s exercise shows a genuinely common, practical use case — separating a directory-listing endpoint from a file-serving subtree — where {$} produces cleaner, more testable code than manual path branching: two small, single-purpose handlers registered declaratively via the pattern language itself, rather than one larger handler with conditional logic embedded inside it that has to be tested as a whole.'
    }
  ];
}
