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
  templateUrl: './ellipsis-wildcard-matches-remaining-segments.html',
  styleUrl: './ellipsis-wildcard-matches-remaining-segments.scss'
})
export class EllipsisWildcardMatchesRemainingSegmentsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own {id} example matches exactly one path segment — never more, never fewer',
      points: [
        'Every wildcard example on the main page — "GET /users/{id}", r.PathValue("id") extracting a single value — matches exactly ONE path segment between slashes. A request for "/users/42" matches; a request for "/users/42/settings" does NOT match "/users/{id}" at all, because that pattern has no way to account for the extra segment.',
        'This is precisely why the main page\'s own advice for serving static files reaches for a different mechanism entirely: "Use http.StripPrefix for serving static files under a sub-path," paired with a plain trailing-slash subtree pattern like "/static/". A single-segment wildcard like {id} genuinely cannot express "match any number of remaining segments" — StripPrefix combined with a subtree pattern was, before Go 1.22\'s fuller wildcard syntax, one of the few ways to approximate it for a whole directory tree.',
        'Go 1.22 added a dedicated wildcard specifically for this need. Per Go\'s own routing-enhancements blog post: "A wildcard can match an entire segment, like {id} in the example above, or if it ends in ... it can match all the remaining segments of the path, as in the pattern /files/{pathname...}." The trailing three dots turn a single-segment wildcard into a multi-segment one, capturing everything from that point in the path onward as one value.',
      ]
    },
    {
      heading: 'What this means for building a real file-serving or nested-resource handler',
      points: [
        'With "/files/{pathname...}", a request for "/files/2024/reports/summary.pdf" matches with r.PathValue("pathname") returning "2024/reports/summary.pdf" — the ENTIRE remaining path, slashes and all, captured as one string value, not split into separate named segments. This is fundamentally different from stacking multiple single-segment wildcards, which Go\'s pattern syntax does not support for an unknown, variable number of levels.',
        'This gives route authors a direct, declarative alternative to the main page\'s own StripPrefix-plus-subtree-pattern combination for cases where the handler genuinely needs the captured remainder as a distinct, named value (to validate it, log it, or pass it to a function expecting a clean relative path) rather than just needing http.FileServer to consume it opaquely.',
        'The multi-segment wildcard shares the exact same conflict-detection safety net this hub\'s own earlier subtopic describes for ordinary wildcards: registering "/files/{pathname...}" alongside another pattern that overlaps it without one being clearly more specific — say, a hypothetical "/files/{category}/index" competing for some of the same paths — triggers the identical registration-time panic, since the underlying precedence and conflict rules apply uniformly across every wildcard shape Go 1.22 supports, not just the single-segment kind.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A single-segment wildcard cannot match nested paths',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "net/http"
)

func main() {
    mux := http.NewServeMux()

    // {id} matches EXACTLY one segment -- this pattern matches
    // "/files/report.pdf" but does NOT match "/files/2024/report.pdf"
    // (too many segments) or "/files/" (too few -- {id} requires a
    // non-empty segment to be present).
    mux.HandleFunc("GET /files/{id}", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "file:", r.PathValue("id"))
    })

    // A request for a nested path like "/files/2024/reports/q1.pdf"
    // simply falls through to Go's default 404 handler here -- this
    // pattern has no way to account for the extra path segments.
}`,
    },
    {
      label: 'The {name...} wildcard captures every remaining segment as one value',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "net/http"
)

func main() {
    mux := http.NewServeMux()

    // The trailing "..." makes this a MULTI-segment wildcard --
    // pathname captures EVERYTHING after "/files/", slashes
    // included, as a single string value.
    mux.HandleFunc("GET /files/{pathname...}", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "requested path:", r.PathValue("pathname"))
    })

    // Now ALL of these match the SAME pattern:
    //   /files/report.pdf          -> pathname = "report.pdf"
    //   /files/2024/report.pdf     -> pathname = "2024/report.pdf"
    //   /files/2024/q1/summary.pdf -> pathname = "2024/q1/summary.pdf"
    // Exactly one handler, one pattern, arbitrary nesting depth --
    // something a single-segment {id} wildcard cannot express at all.
}`,
    },
    {
      label: 'Using the captured remainder with http.Dir and a safe path join',
      language: 'typescript',
      code: `package main

import (
    "net/http"
    "path/filepath"
)

func main() {
    mux := http.NewServeMux()
    root := "/var/data/uploads"

    mux.HandleFunc("GET /files/{pathname...}", func(w http.ResponseWriter, r *http.Request) {
        // The captured remainder is a genuine, named, inspectable
        // value here -- unlike an opaque StripPrefix handoff to
        // http.FileServer, this handler can validate or log the
        // requested relative path BEFORE deciding what to do with it.
        rel := r.PathValue("pathname")

        // filepath.Clean guards against a path like "../../etc/passwd"
        // smuggled through the wildcard capture -- always sanitize a
        // multi-segment wildcard value before using it for file access.
        full := filepath.Join(root, filepath.Clean("/"+rel))
        http.ServeFile(w, r, full)
    })
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team is migrating a legacy file-download endpoint from http.StripPrefix("/downloads/", http.FileServer(http.Dir("./data"))) registered on a plain "/downloads/" subtree pattern, to Go 1.22\'s newer pattern syntax, specifically because they now need to LOG the exact relative file path requested before serving it (for an audit trail), which the opaque StripPrefix-plus-FileServer combination does not give them easy access to. Using this subtopic\'s theory, describe the pattern they should register instead, and explain specifically why it solves the stated problem that StripPrefix does not.',
    hint: 'This subtopic\'s theory distinguishes StripPrefix-plus-subtree-pattern (which hands the whole remaining path opaquely to FileServer) from the {name...} wildcard (which captures the remaining path as a NAMED, inspectable value the handler itself receives directly). Which of the two approaches would let a handler function actually SEE and log the relative path before deciding what to do with it?',
    solution: 'The team should register "GET /downloads/{path...}" (or any chosen wildcard name) instead of the plain "/downloads/" subtree pattern, per this subtopic\'s theory and third code example. The key distinction that solves their stated problem: with the old StripPrefix-plus-subtree approach, the remaining path segment is stripped and handed directly to http.FileServer internally — the developer\'s own handler code never sees or has a chance to inspect that value at all, since FileServer consumes it opaquely inside the standard library\'s own implementation. With "/downloads/{path...}", the remaining path is captured as r.PathValue("path") — a genuine, named string value the team\'s OWN handler function receives directly, exactly as demonstrated in this subtopic\'s third code example — meaning the handler can log r.PathValue("path") (for the audit trail the team needs) BEFORE deciding to serve the file, validate or sanitize it explicitly, or apply any other custom logic, none of which was straightforward with the previous opaque StripPrefix handoff. The rest of the migration is mechanical: swap the FileServer/StripPrefix combination for a plain handler function that reads r.PathValue("path"), logs it, sanitizes it (per this subtopic\'s own filepath.Clean guidance against directory-traversal attempts), and then calls http.ServeFile with the resolved full path.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own single-segment {id} wildcard example already covers "matching a variable part of the path" in general — for a nested path with multiple variable segments, the natural extension would just be chaining several single-segment wildcards together, like /files/{dir}/{subdir}/{filename}.',
      reality: 'This subtopic\'s theory and first code example show a single-segment wildcard fundamentally cannot handle an UNKNOWN, VARIABLE number of nesting levels — chaining a fixed number of {segment} wildcards only matches paths with exactly that many segments, never more or fewer. The {name...} multi-segment wildcard exists specifically because Go\'s pattern syntax has no way to express "however many segments happen to follow" using single-segment wildcards alone, regardless of how many are chained.'
    },
    {
      thought: 'Since the main page\'s own advice for serving static files already recommends http.StripPrefix combined with a plain subtree pattern, and that combination genuinely works for serving nested files, the newer {name...} wildcard syntax is mostly a redundant alternative with no real advantage for that specific use case.',
      reality: 'This subtopic\'s exercise shows a concrete, practical advantage the StripPrefix approach lacks: {name...} captures the remaining path as a value the HANDLER ITSELF can inspect, log, or validate directly, whereas StripPrefix hands the stripped path opaquely straight to http.FileServer with no opportunity for the developer\'s own code to see or act on it first — a genuine capability gap, not just a stylistic difference.'
    },
    {
      thought: 'The value captured by a {name...} multi-segment wildcard is automatically safe to use for file-system access, since Go\'s own routing layer already validated it as a legitimate URL path before the handler ever sees it.',
      reality: 'This subtopic\'s third code example shows the opposite discipline is required: the captured remainder is still attacker-controlled request data, and using it directly for file-system access without sanitization (e.g., via filepath.Clean and a proper filepath.Join against a fixed root) risks a directory-traversal vulnerability from a crafted path like "../../etc/passwd" smuggled through the wildcard capture — the routing layer validates the URL is well-formed, not that the captured VALUE is safe for a specific downstream use like file access.'
    }
  ];
}
