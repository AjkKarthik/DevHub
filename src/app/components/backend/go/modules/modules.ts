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
  selector: 'app-go-modules',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './modules.html',
  styleUrl: './modules.scss'
})
export class GoModules {
  readingTime = 20;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  since = 'Go 1.21+';
  route = 'go-modules';
  nextRoute = '/go/testing';
  nextLabel = 'Testing';

  quickRef: QuickRefItem[] = [
    { name: 'go mod init <module>', type: 'function', desc: 'Create go.mod — declares the module path (e.g. github.com/user/repo)' },
    { name: 'go get package@version', type: 'function', desc: 'Add or upgrade a dependency; updates go.mod and go.sum' },
    { name: 'go mod tidy', type: 'function', desc: 'Add missing, remove unused deps; regenerate go.sum' },
    { name: 'go mod vendor', type: 'function', desc: 'Copy all deps into ./vendor for offline/reproducible builds' },
    { name: 'go get package@latest', type: 'function', desc: 'Upgrade to latest release (not pre-release)' },
    { name: 'go get package@none', type: 'function', desc: 'Remove a direct dependency' },
    { name: 'go list -m all', type: 'function', desc: 'List all modules in the build graph (direct + indirect)' },
    { name: 'go mod graph', type: 'function', desc: 'Print the dependency graph as edges' },
    { name: 'go work init ./a ./b', type: 'function', desc: 'Create go.work for multi-module workspace (local development)' },
    { name: 'GOFLAGS=-mod=vendor', type: 'keyword', desc: 'Force go commands to use ./vendor directory' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'go.mod — the module manifest',
      points: [
        'Every Go module starts with go.mod: module path (the import prefix), minimum Go version, and direct dependencies.',
        'The module path is how other modules import you: module github.com/alice/myapp means import "github.com/alice/myapp/pkg/util".',
        'require blocks list direct dependencies with minimum version. Indirect dependencies appear as // indirect comments.',
        'go <version> in go.mod sets the minimum Go version for the module — Go 1.21+ enables toolchain management.',
        'Never edit go.mod by hand for dependencies — use go get and go mod tidy instead to keep go.sum in sync.',
      ]
    },
    {
      heading: 'go.sum — cryptographic verification',
      points: [
        'go.sum records the expected cryptographic hash of every module version downloaded.',
        'The Go toolchain verifies each download against go.sum before using it — prevents supply-chain tampering.',
        'go.sum must be committed to version control. It is a security artifact, not a build artifact.',
        'go mod tidy updates both go.mod and go.sum consistently. Run it after every dependency change.',
        'The checksum database (sum.golang.org) provides a transparency log of all published module hashes.',
      ]
    },
    {
      heading: 'Semantic versioning and MVS',
      points: [
        'Go modules use semantic versioning: v1.2.3 — major.minor.patch. Breaking changes require a new major version (v2+).',
        'Minimum Version Selection (MVS): Go always picks the minimum version that satisfies all requirements — deterministic builds.',
        'If A requires pkg@v1.2 and B requires pkg@v1.5, Go uses v1.5 (minimum satisfying both). No "latest wins" surprises.',
        'v2+ modules must change their module path: module github.com/user/pkg/v2 — import paths include /v2.',
        'Pre-release versions (v1.2.0-beta.1) are never chosen automatically — must be specified explicitly.',
      ]
    },
    {
      heading: 'Workspaces (go.work)',
      points: [
        'go.work enables multi-module development without publishing to a registry or using replace directives.',
        'go work init ./moduleA ./moduleB creates go.work referencing both local modules.',
        'Any go command in a workspace respects go.work: imports resolve to local directories instead of the registry.',
        'go.work is for local development only — never commit it for libraries. It is listed in .gitignore for open-source projects.',
        'use directives list module directories; replace directives in go.work override individual module paths.',
      ]
    },
    {
      heading: 'Toolchain and build commands',
      points: [
        'go build ./... builds all packages. go build -o ./bin/app ./cmd/app builds a specific binary.',
        'go install installs a binary to $GOPATH/bin: go install github.com/user/tool@latest.',
        'toolchain directive in go.mod (Go 1.21+): toolchain go1.22.4 pins the exact Go version for reproducible builds.',
        'go env GOPATH, GOROOT, GOMODCACHE — inspect the toolchain environment.',
        'GONOSUMCHECK, GONOSUMDB, GOPRIVATE — bypass the checksum database for private modules.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'go.mod & go.sum',
      language: 'typescript',
      code: `// go.mod — module manifest
module github.com/alice/myapp  // import prefix for this module

go 1.22  // minimum Go version
toolchain go1.22.4  // exact toolchain (Go 1.21+)

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/jackc/pgx/v5 v5.5.4
    golang.org/x/sync v0.6.0

    // indirect: needed by direct deps, not imported by this module directly
    github.com/bytedance/sonic v1.11.3 // indirect
)

// go.sum — cryptographic hash for every version downloaded
// (generated automatically by go mod tidy / go get)
// github.com/gin-gonic/gin v1.9.1 h1:4idEAncQnU5cB7BeOkPtxjfCSye0AAm1R0RVIqJ+Jmg=
// github.com/gin-gonic/gin v1.9.1/go.mod h1:hPrL7YrpYKXt5YId3A/Tnip5kqbEAP+KLuI3SUcPTeU=

// --- Common commands ---
// go mod init github.com/alice/myapp    # create new module
// go get github.com/gin-gonic/gin@latest  # add dependency
// go get github.com/pkg@v1.2.3          # pin specific version
// go get github.com/pkg@none            # remove dependency
// go mod tidy                            # clean up go.mod + go.sum
// go mod vendor                          # copy deps to ./vendor`
    },
    {
      label: 'Module Layout',
      language: 'typescript',
      code: `// Recommended Go project layout
myapp/
  cmd/
    server/
      main.go          // entry point: package main
    migrate/
      main.go          // separate binary for DB migrations
  internal/            // code that CANNOT be imported by other modules
    user/
      service.go
      repository.go
    order/
      service.go
  pkg/                 // code that CAN be imported by other modules (if a library)
    util/
      strings.go
  api/
    v1/
      user.proto       // protobuf definitions
  config/
    config.go
  go.mod
  go.sum

// --- Package naming rules ---
// - Package name = last segment of import path: pkg/util -> package util
// - Package name should be short, lowercase, no underscores
// - internal/ subtree: only importable by the parent module
// - cmd/ packages are almost always package main

// --- Import example ---
// import (
//     "github.com/alice/myapp/internal/user"
//     "github.com/alice/myapp/pkg/util"
// )

// Error: cannot import internal from outside the module:
// import "github.com/alice/myapp/internal/user" // OK from within myapp
// import "github.com/alice/myapp/internal/user" // ERROR from other module`
    },
    {
      label: 'Dependency Management',
      language: 'typescript',
      code: `// === Adding dependencies ===
// go get github.com/gin-gonic/gin@latest    -> latest stable
// go get github.com/gin-gonic/gin@v1.9.1   -> exact version
// go get github.com/gin-gonic/gin@none      -> remove

// === Upgrading ===
// go get -u ./...                            -> upgrade all direct deps to latest patch
// go get -u=patch ./...                      -> patch updates only (safer)
// go list -m -u all                          -> list available upgrades

// === Auditing ===
// go list -m all                             -> all modules in build graph
// go mod why github.com/some/pkg             -> why is this dep required?
// go mod graph | grep some/pkg               -> who depends on it?

// === Private modules (e.g. company GitLab) ===
// GONOSUMDB="gitlab.company.com/*"
// GONOSUMCHECK="gitlab.company.com/*"
// GOPRIVATE="gitlab.company.com/*"          -> skip sum DB + auth bypass
// go env -w GOPRIVATE="gitlab.company.com/*"  -> persist setting

// === Replace directives (use local fork or local copy) ===
// In go.mod:
// replace github.com/upstream/pkg => ./local/pkg        // local path
// replace github.com/upstream/pkg v1.2.3 => github.com/myfork/pkg v1.2.4  // fork

// Clean up replace dirs before releasing — they are dev-only`
    },
    {
      label: 'Workspaces',
      language: 'typescript',
      code: `// Scenario: developing myapp + mylib simultaneously without publishing mylib

// Directory structure:
// workspace/
//   go.work
//   myapp/
//     go.mod  (module github.com/alice/myapp)
//     main.go
//   mylib/
//     go.mod  (module github.com/alice/mylib)
//     lib.go

// Create workspace:
// cd workspace
// go work init ./myapp ./mylib

// go.work contents:
// go 1.22
//
// use (
//     ./myapp
//     ./mylib
// )

// Now in myapp, import "github.com/alice/mylib" resolves to ./mylib locally
// No need to publish mylib or use replace directives in myapp/go.mod

// Build myapp (uses local mylib):
// go build ./myapp/...

// Test with workspace:
// go test ./...     <- runs all tests across all workspace modules

// IMPORTANT: go.work is for local dev only
// Add to .gitignore for libraries:
// echo "go.work\ngo.work.sum" >> .gitignore

// For CI: use GOWORK=off to disable workspace mode
// GOWORK=off go build ./...`
    },
    {
      label: 'Build Tags & Cross-Compile',
      language: 'typescript',
      code: `// Build tags restrict which files are compiled

// File: feature_postgres.go
// //go:build postgres
//
// package db
// func connect() *sql.DB { return connectPostgres() }

// File: feature_sqlite.go
// //go:build !postgres
//
// package db
// func connect() *sql.DB { return connectSQLite() }

// Build with tag:
// go build -tags postgres ./...
// go test -tags postgres ./...

// OS/arch-specific files (auto-applied by filename):
// user_linux.go     -> only on Linux
// user_windows.go   -> only on Windows
// user_darwin.go    -> only on macOS
// user_amd64.go     -> only on AMD64

// Cross-compilation — no cgo required:
// GOOS=linux GOARCH=amd64 go build -o app-linux ./cmd/app
// GOOS=windows GOARCH=amd64 go build -o app.exe ./cmd/app
// GOOS=darwin GOARCH=arm64 go build -o app-mac ./cmd/app

// Embed static files (Go 1.16+):
// //go:embed static/*
// var staticFiles embed.FS

// Linker flags (set version at build time):
// go build -ldflags "-X main.version=v1.2.3 -X main.commit=abc123" ./cmd/app`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Committing go.sum changes without running go mod tidy',
      wrong: `# Add a dependency manually in go.mod and commit
# go.sum is now out of sync — build fails for others
echo 'require github.com/new/pkg v1.0.0' >> go.mod
git add go.mod && git commit -m "add pkg"`,
      right: `go get github.com/new/pkg@v1.0.0  # updates both go.mod AND go.sum
go mod tidy                         # removes unused, adds missing
git add go.mod go.sum && git commit -m "add pkg"`,
      explanation: 'go.sum is a security artifact — it records the expected hash of every module version. Editing go.mod manually without updating go.sum leaves them out of sync; the build will fail with a checksum mismatch. Always use go get to add/update deps and go mod tidy to clean up.'
    },
    {
      title: 'Using GOPATH mode instead of module mode',
      wrong: `# Old GOPATH workflow — code must live in $GOPATH/src
mkdir -p $GOPATH/src/github.com/alice/myapp
cd $GOPATH/src/github.com/alice/myapp
# No go.mod — imports are resolved by directory location`,
      right: `# Module mode (default since Go 1.16)
mkdir myapp && cd myapp
go mod init github.com/alice/myapp
# go.mod created — can be anywhere on the filesystem`,
      explanation: 'GOPATH mode is deprecated. Module mode (GO111MODULE=on, default since Go 1.16) allows projects anywhere on the filesystem, versioned dependencies, and reproducible builds. Never create new projects in $GOPATH/src — always start with go mod init.'
    },
    {
      title: 'Importing internal packages from other modules',
      wrong: `// In an external module:
import "github.com/alice/myapp/internal/secret"
// compile error: use of internal package ... not allowed`,
      right: `// internal/ is accessible only within the same module.
// Move shared code to pkg/ if it needs to be exported:
import "github.com/alice/myapp/pkg/util" // OK from any module`,
      explanation: 'The internal/ package directory is a Go toolchain enforcement mechanism. Code under internal/ can only be imported by code in the parent directory tree of the internal/ directory. This is a compile-time error, not a runtime one. Use it for implementation details you do not want to export as a public API.'
    },
    {
      title: 'Using replace directives in released library modules',
      wrong: `// In go.mod of github.com/alice/mylib (a public library):
replace github.com/upstream/pkg => ./local-fork

// Users of mylib get your local fork forced on them!`,
      right: `// Use replace only for local development in applications.
// Remove before tagging a release for libraries.
// For applications: replace is fine in the app's go.mod.`,
      explanation: 'replace directives in a library\'s go.mod affect everyone who imports that library — they inherit your local path replacement, which does not exist on their machine. Replace directives are only safe in the top-level application module (the one with a main package). Always remove them from library modules before releasing.'
    },
    {
      title: 'Not pinning toolchain version for CI reproducibility',
      wrong: `# go.mod
go 1.21
# No toolchain line — CI uses whatever Go version is installed
# Different versions = different build outputs`,
      right: `# go.mod
go 1.22
toolchain go1.22.4  # pins exact Go toolchain (Go 1.21+)
# CI will download and use exactly go1.22.4`,
      explanation: 'Without a toolchain directive, different Go patch versions can produce different binaries or behave differently at the edges of specification. The toolchain directive (Go 1.21+) pins the exact patch version. go get toolchain@go1.22.4 updates it. CI always uses the exact version — no "works on my machine" surprises from minor toolchain differences.'
    },
    {
      title: 'Committing go.work to version control for a library',
      wrong: `# go.work is checked in to the library repo
# Every consumer who clones sees your workspace config
# Their go commands use your local paths which they don't have`,
      right: `# Add to .gitignore:
# go.work
# go.work.sum

# Workspace is local-dev only. CI uses GOWORK=off.`,
      explanation: 'go.work is a local development tool for working across multiple modules simultaneously. Committing it to a library repo forces all cloners to have the same local directory structure. Add go.work and go.work.sum to .gitignore and use GOWORK=off in CI to ensure the library builds with published dependencies.'
    },
  ];

  challenge: Challenge = {
    title: 'Module Setup & Dependency Audit',
    language: 'typescript',
    description: `This challenge tests your understanding of Go module commands — no coding, just commands.

**Scenario:** You are joining a Go project at \`~/projects/myservice\`. The project has a \`go.mod\` with several dependencies but no \`go.sum\`.

**Task — write the shell commands to:**
1. Verify the module path and list all direct dependencies
2. Generate a clean \`go.sum\` and remove unused dependencies
3. Check which dependencies have available upgrades
4. Upgrade only patch versions of all dependencies (safer than latest)
5. Add a new dependency \`github.com/rs/zerolog\` at the latest version
6. Find out why \`golang.org/x/net\` is in your dependency graph
7. Set \`GOPRIVATE\` for your company's GitLab at \`gitlab.mycompany.com\`
8. Vendor all dependencies for an offline build

Write one command per task.`,
    hints: [
      'Task 1: go list reads go.mod; -m flag shows module info',
      'Task 2: go mod tidy handles both go.sum generation and cleanup',
      'Task 3: go list -m -u all shows upgrade info',
      'Task 6: go mod why explains transitive dependencies',
    ],
    starterCode: `# Task 1: View module path and direct deps
# TODO

# Task 2: Generate go.sum and remove unused deps
# TODO

# Task 3: Check for available upgrades
# TODO

# Task 4: Upgrade patch versions only
# TODO

# Task 5: Add zerolog at latest version
# TODO

# Task 6: Why is golang.org/x/net in the graph?
# TODO

# Task 7: Set GOPRIVATE persistently
# TODO

# Task 8: Vendor all dependencies
# TODO`,
    solution: `# Task 1: View module path and direct deps
cat go.mod
# or: go list -m -json

# Task 2: Generate go.sum and remove unused deps
go mod tidy

# Task 3: Check for available upgrades
go list -m -u all

# Task 4: Upgrade patch versions only (safer)
go get -u=patch ./...
go mod tidy

# Task 5: Add zerolog at latest version
go get github.com/rs/zerolog@latest

# Task 6: Why is golang.org/x/net in the graph?
go mod why golang.org/x/net

# Task 7: Set GOPRIVATE persistently
go env -w GOPRIVATE="gitlab.mycompany.com/*"

# Task 8: Vendor all dependencies
go mod vendor
# Build using vendor:
go build -mod=vendor ./...`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does `go mod tidy` do?',
      options: [
        'Adds missing dependencies and removes unused ones; updates go.sum to match go.mod',
        'Upgrades all dependencies to their latest versions',
        'Formats go.mod according to canonical style',
        'Verifies that all module hashes match the checksum database',
      ],
      answer: 0,
      explanation: 'go mod tidy synchronises go.mod and go.sum with the actual import graph: it adds any packages imported in .go files that are missing from go.mod, removes packages no longer imported, and updates go.sum with the correct hashes. Run it after any dependency change and before committing.'
    },
    {
      q: 'What is the purpose of go.sum?',
      options: [
        'It records cryptographic hashes of all downloaded module versions to prevent tampering',
        'It lists the sum of all module sizes for disk space planning',
        'It tracks which modules have been updated since the last build',
        'It stores the checksum of the built binary for deployment verification',
      ],
      answer: 0,
      explanation: 'go.sum is a security file. Each line records the expected hash of a specific module version. When Go downloads a module, it verifies the hash against go.sum. If they don\'t match, the build fails with a checksum error — this prevents supply-chain attacks where a module is silently modified after publication.'
    },
    {
      q: 'What does Minimum Version Selection (MVS) mean in Go modules?',
      options: [
        'Go selects the minimum version that satisfies all requirements — no automatic upgrades to latest',
        'Go always installs the oldest version of each package to maximise stability',
        'Go selects the minimum number of packages needed to build the project',
        'Go requires all dependencies to specify a minimum compatible version',
      ],
      answer: 0,
      explanation: 'MVS makes builds deterministic. If module A requires pkg@v1.2 and module B requires pkg@v1.5, Go uses v1.5 (the minimum that satisfies both). It never automatically upgrades to v1.6 just because it exists. This means builds are reproducible by default and upgrades are explicit user actions.'
    },
    {
      q: 'What does the `internal/` directory enforce?',
      options: [
        'Code inside can only be imported by packages in the parent directory tree — enforced at compile time',
        'Code inside is excluded from go test runs',
        'Code inside is automatically private (unexported) even if identifiers are uppercase',
        'Code inside is compiled separately for performance',
      ],
      answer: 0,
      explanation: 'The internal/ directory is a compile-time restriction enforced by the Go toolchain. Code under github.com/alice/myapp/internal/ can only be imported by packages rooted at github.com/alice/myapp/ — not by any external module. This is how you expose implementation packages within a module without making them part of the public API.'
    },
    {
      q: 'When should you NOT commit go.work to version control?',
      options: [
        'For libraries — go.work is local-dev only; consumers should not inherit your workspace paths',
        'When the project has more than one module',
        'When using Go 1.21 or earlier — go.work did not exist',
        'go.work should never be committed — it is always machine-specific',
      ],
      answer: 0,
      explanation: 'For application repositories, committing go.work is sometimes fine if the whole team shares the same directory structure. For libraries, committing go.work forces all cloners to have matching local paths that likely don\'t exist on their machines. The rule: go.work.gitignore it from library repos; set GOWORK=off in CI.'
    },
    {
      q: 'What does go mod tidy do and when should you run it?',
      options: ['It upgrades all dependencies to the latest version', 'It adds missing and removes unused dependencies from go.mod and go.sum, then verifies that both files are consistent', 'It only updates go.sum', 'It removes the vendor directory'],
      answer: 1,
      explanation: 'go mod tidy reconciles go.mod with the actual imports in your code: it adds any packages you import but have not listed, and removes packages you list but no longer use. It also updates go.sum with the checksums for all required modules. Run it after: adding/removing imports, upgrading dependencies, or before committing to ensure go.mod and go.sum are not stale. CI should fail if go mod tidy changes anything.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between go get and go install?',
      a: 'go get adds or updates a dependency in the current module\'s go.mod — it manages the module graph. go install compiles and installs a binary to $GOBIN (or $GOPATH/bin) — it does not modify go.mod. Use go get github.com/pkg@v1.2 to add a library dependency. Use go install github.com/tool/cmd@latest to install a standalone CLI tool globally.'
    },
    {
      q: 'How do I use a v2+ module?',
      a: 'Modules with breaking changes use a v2+ major version suffix in both the module path and import paths. The go.mod declares module github.com/user/pkg/v2 and the import path becomes import "github.com/user/pkg/v2/subpkg". To add: go get github.com/user/pkg/v2@latest. v1 and v2 can coexist in the same build graph — they are treated as different modules by Go.'
    },
    {
      q: 'What is GOPRIVATE and when do I need it?',
      a: 'GOPRIVATE is a comma-separated list of module path patterns that should bypass the public checksum database (sum.golang.org) and the module proxy (proxy.golang.org). Use it for private repositories (internal company GitLab, GitHub private repos) where public infrastructure cannot access the code. Set it with: go env -w GOPRIVATE="gitlab.mycompany.com/*". Also requires authentication configuration (GOAUTH or SSH keys).'
    },
    {
      q: 'What is the difference between go mod vendor and using the module cache?',
      a: 'The module cache ($GOPATH/pkg/mod) stores all downloaded modules globally on the machine — shared across projects. go mod vendor copies all required module source into a ./vendor directory in the project. Vendor: offline builds, reproducible in air-gapped environments, can be audited by code review. Module cache: smaller repo size, shared across projects, requires internet access on first use. Both produce identical binaries.'
    },
    {
      q: 'How do I replace a dependency with a local version during development?',
      a: 'Two options: (1) replace directive in go.mod: replace github.com/upstream/pkg => ../local-pkg. This works but must be removed before releasing a library. (2) go.work workspace: go work init . ../local-pkg. The workspace resolves imports to local paths without modifying go.mod — preferred for local development as it leaves go.mod clean.'
    },
    {
      q: 'How do I embed static files into a Go binary?',
      a: 'Use the embed package (Go 1.16+): add //go:embed static/* above a variable of type embed.FS, string, or []byte. The embedded files become part of the compiled binary — no external file system access needed at runtime. Example: //go:embed templates/*.html \n var templateFS embed.FS. Access with fs.ReadFile(templateFS, "templates/index.html"). The embed directive must be in the same package as the variable it annotates.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Go modules use go.mod for the module path and dependencies, go.sum for cryptographic verification, and MVS for deterministic version selection.',
    mustKnow: [
      'go.mod declares the module path, Go version, and require dependencies.',
      'go.sum records hashes of every module version — commit it, never edit by hand.',
      'go mod tidy: add missing, remove unused, sync go.sum. Run after every dep change.',
      'go get pkg@version adds deps; go get pkg@none removes them.',
      'MVS: Go picks the minimum version satisfying all requirements — no automatic upgrades.',
      'internal/ packages can only be imported within the parent module — compile-time enforcement.',
      'go.work workspace: multi-module local dev without replace directives or publishing.',
    ],
    interviewFocus: [
      'What does go.sum do and why must it be committed?',
      'What is Minimum Version Selection and how does it ensure reproducible builds?',
      'What does the internal/ directory enforce?',
      'When would you use go.work vs replace directives?',
      'What is GOPRIVATE and when do you need it?',
    ],
  };
}
