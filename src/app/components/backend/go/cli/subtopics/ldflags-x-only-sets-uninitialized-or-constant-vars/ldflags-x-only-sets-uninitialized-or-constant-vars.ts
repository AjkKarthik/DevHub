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
  templateUrl: './ldflags-x-only-sets-uninitialized-or-constant-vars.html',
  styleUrl: './ldflags-x-only-sets-uninitialized-or-constant-vars.scss'
})
export class LdflagsXOnlySetsUninitializedOrConstantVarsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own version-embedding example works only because its variables happen to satisfy an unstated rule',
      points: [
        'The main page\'s own Embed Version & Config code tab declares var version = "dev", commit = "unknown", date = "unknown" — three package-level string variables, each initialized to a plain string literal — and builds with -ldflags "-X main.version=v1.2.3 -X main.commit=abc1234 -X main.date=2025-01-15". Its theory says only "Embed version info at build time," with no explanation of why THESE specific variable declarations are the ones that make -X work.',
        'The official linker documentation for -X states the exact rule: "Set the value of the string variable in importpath named name to value. This is only effective if the variable is declared in the source code either uninitialized or initialized to a constant string expression. -X will not work if the initializer makes a function call or refers to other variables."',
        'The main page\'s own var version = "dev" satisfies this precisely: "dev" is a constant string expression, not a function call or a reference to another variable. This is why the example works — not because -X is a general "override any variable" mechanism, but because this specific declaration shape happens to qualify.',
      ]
    },
    {
      heading: 'What -X does when the rule is not satisfied — and why the failure is easy to miss',
      points: [
        'A very natural refactor — computing a default at package-init time instead of hardcoding a literal, e.g. var version = getDefaultVersion() or var version = "v" + baseVersion — silently disqualifies the variable from -X entirely, per the documentation\'s own explicit exclusion: "-X will not work if the initializer makes a function call or refers to other variables."',
        'Critically, this is not a build error or link error — go build with an -X flag targeting a disqualified variable compiles and links successfully, and the binary runs fine. The ONLY symptom is that the variable silently keeps whatever value its own Go initializer produced at compile time, completely ignoring the -ldflags -X value that was supposed to override it.',
        'The importpath.name addressing also matters for variables outside package main: -X main.version=... only reaches a variable literally named version in package main. A version variable defined in an internal/build package (a common refactor once several binaries need to share version info) needs the FULL import path in the flag: -X github.com/alice/myapp/internal/build.version=v1.2.3 — using the bare package name instead of the full import path is a second, equally silent way for -X to have no effect.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own example -- why it actually works',
      language: 'typescript',
      code: `package main

import "fmt"

// This mirrors the main page's own declarations exactly.
var (
    version = "dev"       // constant string expression -- qualifies for -X
    commit  = "unknown"   // constant string expression -- qualifies for -X
    date    = "unknown"   // constant string expression -- qualifies for -X
)

func main() {
    fmt.Println(version, commit, date)
}

// go build -ldflags "-X main.version=v1.2.3 -X main.commit=abc1234 -X main.date=2025-01-15" -o mytool
// ./mytool
// v1.2.3 abc1234 2025-01-15
//
// Works, per the linker's own documented rule: each variable is
// "initialized to a constant string expression" -- exactly what -X
// requires.`,
    },
    {
      label: 'A natural refactor that silently breaks -X',
      language: 'typescript',
      code: `package main

import (
    "fmt"
    "runtime/debug"
)

// A team "improves" the version variable to derive a sensible
// default from build info, instead of a hardcoded "dev" literal:
var version = getDefaultVersion() // FUNCTION CALL -- disqualifies -X

func getDefaultVersion() string {
    if info, ok := debug.ReadBuildInfo(); ok {
        return info.Main.Version
    }
    return "dev"
}

func main() {
    fmt.Println(version)
}

// go build -ldflags "-X main.version=v1.2.3" -o mytool
// ./mytool
// (devel)     <-- NOT "v1.2.3"! The -X flag was silently ignored.
//
// Per the linker's own documentation: "-X will not work if the
// initializer makes a function call or refers to other variables."
// getDefaultVersion() is a function call -- version no longer
// qualifies as "uninitialized or initialized to a constant string
// expression," so -X has no effect at all. No build error, no link
// error, no warning -- the binary simply runs with whatever
// getDefaultVersion() produced at compile/run time instead.

// The fix: keep the -X target as a plain literal, and use the
// computed value only as a FALLBACK when -X was never passed:
var version = "dev" // qualifies for -X again

func printVersion() {
    v := version
    if v == "dev" {
        if info, ok := debug.ReadBuildInfo(); ok {
            v = info.Main.Version // fallback, not the -X target itself
        }
    }
    fmt.Println(v)
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A CI pipeline builds a Go CLI with go build -ldflags "-X main.version=v2.4.0" ./cmd/mytool, exactly following the main page\'s own pattern. A release goes out, and a user reports that ./mytool version prints "v0.0.0-dev" instead of "v2.4.0" — but the build logs show no errors of any kind, and the exact same -ldflags command has worked correctly for months on this codebase. Using this subtopic\'s theory, name the single most likely code change that would explain this regression, and describe what a `git blame` or recent-diff investigation on the version variable\'s own declaration would be looking for.',
    hint: 'Per this subtopic\'s theory, -X silently does nothing (with zero errors anywhere) if a targeted variable\'s declaration changes in one specific way. What is that one way, and would it show up as a change to the "var version = ..." line itself?',
    solution: 'The most likely explanation, per this subtopic\'s theory, is that the version variable\'s own declaration changed from a plain constant string literal (e.g. var version = "dev") to something involving a function call or a reference to another variable (e.g. var version = getDefaultVersion(), or var version = defaultVersionConst where defaultVersionConst is itself another variable) — exactly the disqualifying change this subtopic\'s second code example demonstrates. Per the linker\'s own documentation, "-X will not work if the initializer makes a function call or refers to other variables," and critically this produces zero build errors, zero link errors, and zero warnings — the CI logs staying clean is fully consistent with this exact failure mode, not evidence against it. A git blame or recent-diff investigation should specifically look at the "var version = ..." line\'s own right-hand side: did it change FROM a plain string literal TO anything involving parentheses (a function call) or a bare identifier (a variable reference)? That specific class of change is the one this subtopic\'s theory identifies as silently disqualifying the variable from -X, while leaving every other part of the build pipeline (the -ldflags command, the CI script, the Go compiler itself) completely unchanged and error-free.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '-ldflags -X can set any package-level string variable to a build-time value, regardless of how that variable is initialized in the source code.',
      reality: 'This subtopic\'s theory quotes the linker documentation directly: -X "is only effective if the variable is declared in the source code either uninitialized or initialized to a constant string expression." A variable initialized via a function call or a reference to another variable does not qualify, no matter how simple that function call is.'
    },
    {
      thought: 'If a -X flag targets a variable that does not qualify (e.g. one initialized via a function call), the build fails with a clear linker error identifying the problem.',
      reality: 'This subtopic\'s second code example shows the opposite: the build succeeds, the binary links and runs fine, and there is no error or warning of any kind. The only symptom is the targeted variable silently keeping whatever value its own Go initializer produced, completely ignoring the -X value.'
    },
    {
      thought: '-X main.version=... always targets a variable named "version" regardless of which package in the module actually declares it.',
      reality: 'This subtopic\'s theory clarifies the importpath.name addressing is literal: -X main.version only reaches a variable named version specifically inside package main. A version variable in any other package (e.g. an internal/build helper package) needs the full import path in the flag — using just the package\'s short name instead of its full import path is a second, equally silent way for -X to have no effect.'
    }
  ];
}
