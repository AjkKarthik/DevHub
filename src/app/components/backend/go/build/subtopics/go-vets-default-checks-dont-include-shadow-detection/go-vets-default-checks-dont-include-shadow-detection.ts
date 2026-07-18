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
  templateUrl: './go-vets-default-checks-dont-include-shadow-detection.html',
  styleUrl: './go-vets-default-checks-dont-include-shadow-detection.scss'
})
export class GoVetsDefaultChecksDontIncludeShadowDetectionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats go vet as catching "common bugs" broadly — one very common bug class is not in its default check list at all',
      points: [
        'The main page\'s own mistake entry and quiz both describe go vet in general terms: "catches common bugs: mismatched Printf format strings, unreachable code, incorrect mutex copying." Its CI code tab runs go vet ./... as a blanket bug-catching step, implying broad coverage of "common mistakes" as a category.',
        'The official cmd/vet documentation lists the exact analyzers enabled by default: "By default, all checks are performed" — and the named default set is appends, asmdecl, assign, atomic, bools, buildtag, cgocall, composites, copylocks, defers, directive, errorsas, framepointer, hostport, httpresponse, ifaceassert, loopclosure, lostcancel, nilfunc, printf, shift, sigchanyzer, slog, stdmethods, stdversion, stringintconv, structtag, testinggoroutine, tests, timeformat, unmarshal, unreachable, unsafeptr, unusedresult, waitgroup.',
        'Variable SHADOWING — a genuinely common, easy-to-write Go bug (an inner-scope err := shadowing an outer err, silently discarding an outer error check) — is conspicuously absent from that documented default list. It is a real, separate analyzer (shadow, part of golang.org/x/tools) that must be installed and invoked explicitly; it is not bundled into the default go vet ./... the main page\'s own CI pipeline runs.',
      ]
    },
    {
      heading: 'Why this specific omission is worth knowing, not just a trivia gap in the checklist',
      points: [
        'Shadowing bugs are exactly the kind of "compiles fine, silently wrong" mistake go vet is otherwise celebrated for catching (per the main page\'s own framing: "these bugs compile and tests may pass — vet catches them without running anything"). A developer who assumes go vet\'s general reputation for catching subtle mistakes extends to shadowing specifically would be relying on protection that the default check set, per its own documented analyzer list, simply does not provide.',
        'The fix is a genuinely separate step, not a flag on the existing go vet ./... command: installing golang.org/x/tools/go/analysis/passes/shadow/cmd/shadow and running it via go vet -vettool=$(which shadow) ./... — a completely different invocation from the main page\'s own CI code tab\'s plain go vet ./... line.',
        'This directly parallels the main page\'s own separate treatment of govulncheck — a distinct tool for a distinct concern, requiring its own install and invocation step, not bundled into vet or test. Shadow detection deserves the identical treatment (a clearly separate, opt-in CI step) but the main page never mentions it needs one at all.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A shadowing bug go vet ./... does not catch',
      language: 'typescript',
      code: `package main

import (
    "errors"
    "fmt"
)

func fetchUser(id int) (string, error) {
    if id <= 0 {
        return "", errors.New("invalid id")
    }
    return "Alice", nil
}

func process(id int) error {
    name, err := fetchUser(id)
    if err != nil {
        return err
    }

    if name == "" {
        // BUG: ":=" here declares a NEW, inner "err" that shadows
        // the outer one -- the outer err is never touched by this
        // block at all.
        result, err := someOtherCheck(name)
        if err != nil {
            fmt.Println("warning:", err) // only logged, not returned
        }
        _ = result
    }

    return nil // the OUTER err is still nil here -- always,
                 // regardless of what the inner err captured
}

func someOtherCheck(name string) (bool, error) {
    return false, errors.New("check failed")
}

// go vet ./...
// (no output at all -- this compiles and vets cleanly)
//
// Per the cmd/vet documentation's own default analyzer list --
// appends, asmdecl, assign, ... printf, ... unreachable, unsafeptr,
// unusedresult, waitgroup -- shadow is simply not one of them.
// This bug is completely invisible to the main page's own
// "go vet ./..." CI step.`,
    },
    {
      label: 'The separate tool that actually catches it',
      language: 'typescript',
      code: `# Install the shadow analyzer (a separate tool from vet's defaults):
go install golang.org/x/tools/go/analysis/passes/shadow/cmd/shadow@latest

# Run it via vet's -vettool flag -- NOT part of plain "go vet ./...":
go vet -vettool=$(which shadow) ./...

# Output for the exact code in the previous example:
# ./main.go:22:3: declaration of "err" shadows declaration at line 17

# This is a genuinely SEPARATE CI step from the main page's own
# "go vet ./..." line -- exactly as distinct as the main page's own
# separate "govulncheck ./..." step is from plain go test.

# A complete CI check sequence, adding shadow detection alongside
# the main page's own existing steps:
go vet ./...                              # default analyzers
go vet -vettool=$(which shadow) ./...     # shadow detection (separate)
govulncheck ./...                          # dependency CVEs (separate)
go test -race ./...                        # race detector`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s CI pipeline runs exactly the main page\'s own steps: go vet ./..., govulncheck ./..., and go test -race ./..., all green on every merge. A production incident traces back to a bug where an inner if block\'s := redeclared an err variable that shadowed an outer one, causing a real database error to be silently swallowed while the function returned nil as if nothing had gone wrong. The team is confused why their vet-clean, fully-tested CI pipeline never caught this. Using this subtopic\'s theory, explain precisely why, and identify the one additional CI step that would have caught it before the incident.',
    hint: 'Per this subtopic\'s theory, is variable shadowing detection part of the documented DEFAULT set of analyzers that plain "go vet ./..." runs? What separate tool and invocation does catching it actually require?',
    solution: 'This subtopic\'s theory explains the gap precisely: per the cmd/vet documentation\'s own default analyzer list, shadow detection is not among them at all — plain go vet ./..., exactly as the team\'s CI pipeline runs it, provides zero protection against this class of bug, regardless of how "vet-clean" the codebase otherwise is. Tests passing does not help either, since this subtopic\'s theory notes shadowing bugs are precisely the "compiles fine, silently wrong" category — the code runs without panicking, it just discards an error it should have propagated, which a test would only catch if it specifically exercised the exact code path AND asserted on the returned error rather than some other visible symptom. The one additional CI step that would have caught it, per this subtopic\'s theory, is installing and running the separate shadow analyzer: go install golang.org/x/tools/go/analysis/passes/shadow/cmd/shadow@latest, then go vet -vettool=$(which shadow) ./... as its own distinct CI step — not a flag or option on the existing go vet ./... line, but a genuinely separate tool requiring its own install and invocation, exactly parallel to how govulncheck is already a separate step in the team\'s own existing pipeline.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'go vet ./... is a comprehensive static analysis pass that catches "common Go bugs" as a general category — if a mistake is well-known and common in Go code, vet almost certainly catches it by default.',
      reality: 'This subtopic\'s theory lists the actual documented default analyzer set — appends, asmdecl, assign, atomic, bools, and about two dozen others — and shadow (variable shadowing detection) is not among them. A well-known, common Go mistake can be entirely absent from vet\'s default coverage, as this subtopic\'s exercise demonstrates concretely.'
    },
    {
      thought: 'Variable shadowing detection is available as a flag on the standard go vet command (similar to how -printf=false disables a specific default check) — it just needs to be explicitly enabled.',
      reality: 'This subtopic\'s theory and second code example show shadow detection requires installing a genuinely separate tool (golang.org/x/tools/go/analysis/passes/shadow/cmd/shadow) and invoking it via go vet -vettool=$(which shadow) ./... — an entirely different tool binary passed to vet, not a built-in flag toggling a bundled analyzer the way -printf=false does for the printf check.'
    },
    {
      thought: 'Since the main page\'s own CI code tab runs go vet ./... as a routine step, any team following that exact pattern has reasonable protection against shadowing-related bugs specifically.',
      reality: 'This subtopic\'s exercise shows a team following the main page\'s own CI pattern exactly (go vet, govulncheck, go test -race) still shipped a real shadowing bug to production — none of those three steps, run precisely as the main page demonstrates them, provide any shadow-detection coverage at all.'
    }
  ];
}
