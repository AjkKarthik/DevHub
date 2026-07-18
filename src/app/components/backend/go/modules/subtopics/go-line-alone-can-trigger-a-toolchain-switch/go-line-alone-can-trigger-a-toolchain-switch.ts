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
  templateUrl: './go-line-alone-can-trigger-a-toolchain-switch.html',
  styleUrl: './go-line-alone-can-trigger-a-toolchain-switch.scss'
})
export class GoLineAloneCanTriggerAToolchainSwitchSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats the toolchain line as the only thing that pins a Go version — the go line alone already does something',
      points: [
        'The main page\'s own theory and mistake entry both frame version pinning entirely around an EXPLICIT toolchain line: "toolchain directive in go.mod (Go 1.21+): toolchain go1.22.4 pins the exact Go version for reproducible builds," and its mistake example contrasts "go 1.21 / # No toolchain line" against "go 1.22 / toolchain go1.22.4" as if the plain go line by itself carries no such consequence.',
        'The official Go toolchain documentation states the opposite directly: "If the toolchain line is omitted, the module or workspace is considered to have an implicit toolchain go_V_ line, where V is the Go version from the go line... a go.mod that says go 1.21.0 with no toolchain line is interpreted as if it had a toolchain go1.21.0 line." The go line was never version-inert — it always implied a toolchain requirement, even in the main page\'s own "wrong" example.',
        'What actually happens when the locally installed go binary is OLDER than the go.mod\'s go line: per the docs, "if the file has a go <version> line and <version> is newer than the default Go toolchain, then the go command runs go<version> instead" — under the default GOTOOLCHAIN=auto setting, the go command automatically downloads and switches to a newer toolchain to satisfy the requirement, without the developer doing anything explicit.',
      ]
    },
    {
      heading: 'GOTOOLCHAIN controls whether this automatic download happens at all',
      points: [
        'GOTOOLCHAIN defaults to auto (documented shorthand for local+auto), which the docs describe as automatically selecting "a newer Go version as needed" and downloading it via the module proxy system when the go or toolchain line requires a version newer than what is locally installed.',
        'Setting GOTOOLCHAIN=local disables this entirely — the docs state the environment setting "can force a specific Go version, overriding the go and toolchain lines." A team member with GOTOOLCHAIN=local and an older Go binary would get a hard version-mismatch error instead of a silent download, for the exact same go.mod the main page\'s own "wrong" example uses.',
        'The practical consequence the main page\'s own mistake entry undersells: even the "wrong" go.mod (go 1.21, no explicit toolchain line) still pins SOME version — 1.21.0 implicitly — it simply pins it less precisely than an explicit toolchain go1.22.4 line would (which fixes the exact patch release, not just the go.mod\'s own version line).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own "no toolchain line" example -- not actually toolchain-less',
      language: 'typescript',
      code: `// go.mod -- this is the main page's own "wrong" example verbatim
module github.com/alice/myapp

go 1.21
// No explicit toolchain line -- the main page's theory implies this
// means "no version pinning happened."

// Per the Go toolchain documentation's own words:
// "If the toolchain line is omitted, the module... is considered
// to have an implicit toolchain go_V_ line, where V is the Go
// version from the go line."
//
// So this go.mod is treated identically to:
//
//   go 1.21
//   toolchain go1.21.0
//
// It IS pinned -- just to "1.21.0" specifically (the ".0" patch),
// not to whatever patch happens to be installed locally.`,
    },
    {
      label: 'What happens when the local Go binary is older',
      language: 'typescript',
      code: `// Scenario: go.mod says "go 1.22", but the developer's machine
// has Go 1.21.5 installed as the default "go" binary.

// go.mod:
// module github.com/alice/myapp
// go 1.22
// (no explicit toolchain line -- implicit "toolchain go1.22.0")

// Running any go command (go build, go test, go mod tidy) with the
// default GOTOOLCHAIN=auto:
//
// Per the docs: "if the file has a go <version> line and <version>
// is newer than the default Go toolchain, then the go command runs
// go<version> instead."
//
// $ go build ./...
// go: downloading go1.22.0 (windows/amd64)
// go: module github.com/alice/myapp requires go >= 1.22.0
//     (running go 1.22.0)
//
// The build proceeds using the newly-downloaded 1.22.0 toolchain --
// no manual "go install golang.org/dl/go1.22.0" step needed, and
// no error, because GOTOOLCHAIN=auto permits the download.

// If GOTOOLCHAIN=local instead:
//
// $ GOTOOLCHAIN=local go build ./...
// go: go.mod requires go >= 1.22.0 (running go 1.21.5)
//
// Per the docs: GOTOOLCHAIN=local "can force a specific Go version,
// overriding the go and toolchain lines" -- so instead of silently
// downloading a newer toolchain, the build simply fails.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two developers on the same team both have Go 1.21.5 installed locally as their default go binary. They both run go build on a project whose go.mod contains only "go 1.22" (no explicit toolchain line) — the exact "wrong" example from the main page\'s own mistake entry. Developer A has never touched GOTOOLCHAIN (leaving it at its default). Developer B has GOTOOLCHAIN=local set in their shell profile from an earlier project. Using this subtopic\'s theory, predict what happens for each developer, and explain why the main page\'s own framing of this go.mod as having "no toolchain line" is misleading for describing developer B\'s outcome.',
    hint: 'Per this subtopic\'s theory, what does GOTOOLCHAIN default to, and what does that default setting actually do when the go.mod line requires a newer version than what is installed? What does explicitly setting GOTOOLCHAIN=local change about that behavior?',
    solution: 'Developer A (default GOTOOLCHAIN=auto) sees the go command automatically download Go 1.22.0 and use it to complete the build, exactly as this subtopic\'s second code example shows — no error, no manual intervention, because auto "selects and runs a newer Go version as needed." Developer B (GOTOOLCHAIN=local) gets a hard failure instead: per this subtopic\'s theory, GOTOOLCHAIN=local "overrides the go and toolchain lines," so the automatic download never happens and the build simply reports that go.mod requires a newer version than what is installed. The main page\'s own "no toolchain line" framing is misleading here specifically because — per this subtopic\'s theory — the go.mod is NOT actually toolchain-less: "go 1.22" with no explicit toolchain line is treated as an implicit "toolchain go1.22.0" line. Developer B\'s failure is not caused by a missing pin; it is caused by GOTOOLCHAIN=local refusing to honor the pin that was always implicitly there, by downloading the toolchain it specifies.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A go.mod with only a "go 1.22" line and no explicit toolchain line is genuinely unpinned — it just tells the compiler "use whatever Go version happens to be installed, at least 1.22."',
      reality: 'This subtopic\'s theory quotes the documentation directly: an omitted toolchain line is treated as "an implicit toolchain go_V_ line, where V is the Go version from the go line" — meaning the go line alone already specifies an exact implicit toolchain version (e.g. go1.22.0), not merely a minimum floor for whatever is locally installed.'
    },
    {
      thought: 'If the locally installed Go version is older than what go.mod requires, every developer always gets the same clear version-mismatch error telling them to upgrade manually.',
      reality: 'This subtopic\'s theory and second code example show the DEFAULT behavior (GOTOOLCHAIN=auto) is the opposite of an error — the go command silently downloads and switches to a newer toolchain automatically. An explicit error only occurs if GOTOOLCHAIN has been set to local, which disables the automatic download entirely.'
    },
    {
      thought: 'GOTOOLCHAIN only matters for exotic CI setups or advanced multi-version workflows — a typical developer running go build locally never interacts with it.',
      reality: 'This subtopic\'s exercise shows GOTOOLCHAIN\'s default value (auto) is precisely what makes the main page\'s own "no toolchain line" go.mod work seamlessly for most developers without them ever setting it explicitly — it is silently active on every single go command by default, not an opt-in feature reserved for advanced setups.'
    }
  ];
}
