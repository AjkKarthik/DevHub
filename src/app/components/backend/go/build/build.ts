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
  selector: 'app-go-build',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './build.html',
  styleUrl: './build.scss'
})
export class GoBuild {
  readingTime = 22;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Go 1.21+';
  route = 'go-build';
  nextRoute = '/go/cheatsheet';
  nextLabel = 'Go Cheat Sheet';

  quickRef: QuickRefItem[] = [
    { name: 'go build -o ./bin/app ./cmd/app', type: 'function', desc: 'Build binary to a specific path' },
    { name: 'go build -ldflags "-s -w"', type: 'function', desc: 'Strip debug symbols and DWARF — reduces binary size by ~30%' },
    { name: 'GOOS=linux GOARCH=amd64 go build', type: 'keyword', desc: 'Cross-compile for Linux AMD64 from any platform' },
    { name: 'go build -tags prod', type: 'function', desc: 'Build with a specific build tag (//go:build prod in source)' },
    { name: 'CGO_ENABLED=0 go build', type: 'keyword', desc: 'Disable cgo — produces a fully static binary (no libc dependency)' },
    { name: 'go build -gcflags="-m"', type: 'function', desc: 'Print escape analysis decisions (what escapes to the heap)' },
    { name: 'go env GOPATH / GOROOT / GOARCH', type: 'function', desc: 'Inspect toolchain environment variables' },
    { name: 'docker build --target builder', type: 'keyword', desc: 'Multi-stage Docker build — copy only the binary to the final image' },
    { name: 'goreleaser release', type: 'keyword', desc: 'Build multi-platform binaries, checksums, and GitHub release assets' },
    { name: 'ko build ./cmd/app', type: 'keyword', desc: 'Build a Go binary directly into an OCI container image — no Dockerfile' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'go build basics',
      points: [
        'go build ./... builds all packages. go build -o ./bin/myapp ./cmd/myapp builds a named binary.',
        'Go produces a single statically-linked binary by default — no runtime dependency besides libc (when cgo is used).',
        'CGO_ENABLED=0 disables cgo completely — the binary has zero system library dependencies. Ideal for Alpine/scratch Docker images.',
        '-ldflags "-s -w" strips the symbol table and DWARF debug info — typically reduces binary size 25–35%.',
        'go build caches compiled packages in $GOPATH/pkg/mod/cache — incremental builds are fast.',
      ]
    },
    {
      heading: 'Cross-compilation',
      points: [
        'Set GOOS and GOARCH environment variables to cross-compile without any toolchain changes.',
        'Common GOOS values: linux, darwin, windows. Common GOARCH values: amd64, arm64, 386, arm.',
        'CGO_ENABLED=0 is required for cross-compilation when the target C library differs from the host.',
        'Cross-compile for all common targets in a loop: for os in linux darwin windows; do for arch in amd64 arm64; do ...',
        'goreleaser automates multi-platform builds with checksums and GitHub release uploads.',
      ]
    },
    {
      heading: 'Docker and container deployment',
      points: [
        'Multi-stage Docker builds: stage 1 (golang image) compiles the binary; stage 2 (scratch or distroless) copies just the binary.',
        'FROM scratch: zero base image — the smallest possible container. Requires CGO_ENABLED=0 (no dynamic linking).',
        'FROM gcr.io/distroless/static-debian12: scratch + CA certificates + timezone data — suitable for most production services.',
        'ko (github.com/ko-build/ko) builds Go binaries directly into OCI images without a Dockerfile — no Docker daemon needed.',
        'Set USER in Dockerfile — never run as root in containers.',
      ]
    },
    {
      heading: 'Health checks and graceful shutdown',
      points: [
        'Kubernetes SIGTERM → process should drain in-flight requests and exit cleanly within the termination grace period.',
        'Use signal.NotifyContext to catch SIGTERM/SIGINT and cancel the server context.',
        'http.Server.Shutdown(ctx) waits for active connections to finish, then stops accepting new ones.',
        'Readiness probe (/healthz/ready): returns 200 only when the service is ready to receive traffic.',
        'Liveness probe (/healthz/live): returns 200 to indicate the process is alive — if it fails, Kubernetes restarts the pod.',
      ]
    },
    {
      heading: 'CI/CD patterns',
      points: [
        'GitHub Actions: set up Go with actions/setup-go@v5, run go test -race ./..., go build -ldflags "-s -w" ./cmd/app.',
        'Go module cache: cache $GOCACHE and $GOPATH/pkg/mod across CI runs to speed up builds significantly.',
        'go vet ./... and staticcheck (or golangci-lint) catch common bugs and style issues before tests run.',
        'goreleaser.yml: configure builds, archives, checksums, Docker images, and GitHub release notes in one file.',
        'Security scanning: govulncheck ./... checks for known vulnerabilities in your dependencies.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Build Commands',
      language: 'typescript',
      code: `# Basic build
go build -o ./bin/myapp ./cmd/myapp

# Strip symbols (smaller binary):
go build -ldflags="-s -w" -o ./bin/myapp ./cmd/myapp

# Embed version at build time:
go build \\
  -ldflags="-s -w -X main.version=v1.2.3 -X main.commit=$(git rev-parse --short HEAD)" \\
  -o ./bin/myapp ./cmd/myapp

# Cross-compile (from any OS → Linux AMD64):
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 \\
  go build -ldflags="-s -w" -o ./bin/myapp-linux-amd64 ./cmd/myapp

# Common targets in a script:
PLATFORMS="linux/amd64 linux/arm64 darwin/amd64 darwin/arm64 windows/amd64"
for PLATFORM in $PLATFORMS; do
  OS=$(echo "$PLATFORM" | cut -d'/' -f1)
  ARCH=$(echo "$PLATFORM" | cut -d'/' -f2)
  OUTPUT="./dist/myapp-\${OS}-\${ARCH}"
  [ "$OS" = "windows" ] && OUTPUT="\${OUTPUT}.exe"
  GOOS=$OS GOARCH=$ARCH CGO_ENABLED=0 go build -ldflags="-s -w" -o $OUTPUT ./cmd/myapp
done

# Build with tags:
go build -tags prod ./cmd/myapp

# Inspect escape analysis:
go build -gcflags="-m=1" ./...

# Check binary size:
ls -lh ./bin/myapp
# or: go tool nm ./bin/myapp | head -20  (symbol table)`
    },
    {
      label: 'Dockerfile (Multi-stage)',
      language: 'typescript',
      code: `# Multi-stage Docker build — final image is ~10MB with scratch

# Stage 1: Build
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Cache dependencies separately from source (faster rebuilds)
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \\
    go build -ldflags="-s -w" -o /app/server ./cmd/server

# Stage 2: Run — FROM scratch (zero base image)
FROM scratch

# CA certificates for HTTPS calls (not in scratch by default)
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy the binary only
COPY --from=builder /app/server /server

# Run as non-root (UID 65534 = nobody)
USER 65534:65534

EXPOSE 8080
ENTRYPOINT ["/server"]

# --- Distroless alternative (CA certs + timezone data included) ---
# FROM gcr.io/distroless/static-debian12:nonroot
# COPY --from=builder /app/server /server
# ENTRYPOINT ["/server"]

# Build and run:
# docker build -t myapp:latest .
# docker run -p 8080:8080 myapp:latest`
    },
    {
      label: 'Graceful Shutdown',
      language: 'typescript',
      code: `package main

import (
    "context"
    "log/slog"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func main() {
    srv := &http.Server{
        Addr:         ":8080",
        Handler:      setupRouter(),
        ReadTimeout:  5 * time.Second,
        WriteTimeout: 10 * time.Second,
        IdleTimeout:  30 * time.Second,
    }

    // Health check endpoints
    http.HandleFunc("/healthz/live",  func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(200) })
    http.HandleFunc("/healthz/ready", func(w http.ResponseWriter, r *http.Request) {
        if !isReady() { w.WriteHeader(503); return }
        w.WriteHeader(200)
    })

    // Start server in background goroutine
    go func() {
        slog.Info("server started", "addr", srv.Addr)
        if err := srv.ListenAndServe(); err != http.ErrServerClosed {
            slog.Error("server error", "err", err)
            os.Exit(1)
        }
    }()

    // Wait for SIGTERM or SIGINT (Ctrl+C or Kubernetes shutdown)
    ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, os.Interrupt)
    defer stop()
    <-ctx.Done()

    slog.Info("shutdown signal received, draining...")

    // Give in-flight requests 30s to complete
    shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := srv.Shutdown(shutdownCtx); err != nil {
        slog.Error("graceful shutdown failed", "err", err)
        os.Exit(1)
    }
    slog.Info("server stopped cleanly")
}

// Kubernetes pod spec:
// terminationGracePeriodSeconds: 35  <- > the 30s shutdown timeout above`
    },
    {
      label: 'GitHub Actions CI',
      language: 'typescript',
      code: `# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, development]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true  # caches $GOCACHE and go module cache

      - name: Vet
        run: go vet ./...

      - name: Test with race detector
        run: go test -race -coverprofile=coverage.out ./...

      - name: Vulnerability check
        run: |
          go install golang.org/x/vuln/cmd/govulncheck@latest
          govulncheck ./...

      - name: Build
        run: |
          CGO_ENABLED=0 go build -ldflags="-s -w" -o ./bin/app ./cmd/app

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage.out

  release:
    if: startsWith(github.ref, 'refs/tags/')
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-go@v5
        with: { go-version: '1.22', cache: true }
      - name: Release with goreleaser
        uses: goreleaser/goreleaser-action@v5
        with: { args: release --clean }
        env: { GITHUB_TOKEN: '\${{ secrets.GITHUB_TOKEN }}' }`
    },
    {
      label: 'goreleaser Config',
      language: 'typescript',
      code: `# .goreleaser.yml — multi-platform release automation

version: 2

before:
  hooks:
    - go mod tidy
    - go test ./...

builds:
  - id: myapp
    main: ./cmd/myapp
    binary: myapp
    env:
      - CGO_ENABLED=0
    ldflags:
      - -s -w
      - -X main.version={{.Version}}
      - -X main.commit={{.Commit}}
      - -X main.date={{.Date}}
    goos: [linux, darwin, windows]
    goarch: [amd64, arm64]
    ignore:
      - goos: windows
        goarch: arm64

archives:
  - format: tar.gz
    format_overrides:
      - goos: windows
        format: zip
    name_template: "myapp_{{.Version}}_{{.Os}}_{{.Arch}}"

checksum:
  name_template: "checksums.txt"
  algorithm: sha256

docker_images:
  - image_templates:
      - "ghcr.io/user/myapp:{{.Version}}-amd64"
    dockerfile: Dockerfile
    goarch: amd64

changelog:
  sort: asc
  filters:
    exclude:
      - "^docs:"
      - "^test:"
      - "^chore:"

# Release:
# git tag -a v1.2.3 -m "Release v1.2.3"
# git push origin v1.2.3
# goreleaser release --clean`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Building with cgo for a scratch/alpine Docker image',
      wrong: `# Dockerfile
FROM golang:1.22 AS builder
RUN go build -o /app ./cmd/app  # cgo enabled by default!

FROM alpine
COPY --from=builder /app /app
# Error at runtime: /app: not found
# (dynamic linker /lib64/ld-linux-x86-64.so.2 not in scratch/alpine-musl)`,
      right: `FROM golang:1.22 AS builder
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app ./cmd/app

FROM scratch  # or alpine
COPY --from=builder /app /app
ENTRYPOINT ["/app"]`,
      explanation: 'When CGO_ENABLED=1 (default), the Go binary links against the system\'s C library dynamically. The scratch image has no C library at all; Alpine uses musl while the builder uses glibc — they are incompatible. CGO_ENABLED=0 produces a fully static binary with no system library dependencies, which runs in scratch or any Linux image.'
    },
    {
      title: 'Not caching Go modules in CI',
      wrong: `# .github/workflows/ci.yml
- uses: actions/setup-go@v5
  with:
    go-version: '1.22'
    # no cache: true

# Every CI run downloads all dependencies from the internet
# 2-5 minutes wasted on module downloads`,
      right: `- uses: actions/setup-go@v5
  with:
    go-version: '1.22'
    cache: true  # caches $GOCACHE + go module cache
                 # keyed on go.sum — invalidated only on dep change`,
      explanation: 'actions/setup-go@v5 with cache: true caches both the module download cache ($GOPATH/pkg/mod) and the build cache ($GOCACHE). The cache key is derived from go.sum — it is invalidated only when dependencies change. This saves 1-5 minutes per CI run depending on module count. Always enable it.'
    },
    {
      title: 'Running the container as root',
      wrong: `# Dockerfile — no USER instruction
FROM scratch
COPY --from=builder /app /app
ENTRYPOINT ["/app"]
# Process runs as UID 0 (root) inside the container
# If exploited, attacker has root in the container namespace`,
      right: `FROM scratch
COPY --from=builder /app /app
# nobody:nobody — UID 65534
USER 65534:65534
ENTRYPOINT ["/app"]

# distroless images provide a 'nonroot' tag:
# FROM gcr.io/distroless/static-debian12:nonroot`,
      explanation: 'Running as root in a container is a security risk. If an attacker exploits the application, they gain root inside the container, which may translate to host privileges depending on the container runtime configuration. Always add USER nobody (UID 65534) in the Dockerfile. The distroless:nonroot tag sets this by default.'
    },
    {
      title: 'Not setting a terminationGracePeriodSeconds longer than the shutdown timeout',
      wrong: `# pod spec
terminationGracePeriodSeconds: 10  # Kubernetes kills with SIGKILL after 10s

# In code: 30-second graceful shutdown timeout
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
srv.Shutdown(ctx)
// Kubernetes sends SIGKILL at 10s — in-flight requests are cut off!`,
      right: `# pod spec
terminationGracePeriodSeconds: 35  # > the 30s shutdown timeout

# In code:
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
srv.Shutdown(ctx)  // 30s to drain — Kubernetes gives 35s before SIGKILL`,
      explanation: 'Kubernetes sends SIGTERM, waits terminationGracePeriodSeconds, then sends SIGKILL. If your graceful shutdown drains connections for 30 seconds but the grace period is 10 seconds, Kubernetes force-kills the process at 10 seconds and active requests are abruptly cut off. Set terminationGracePeriodSeconds to slightly more than your longest drain timeout.'
    },
    {
      title: 'Not running go vet and govulncheck in CI',
      wrong: `# CI just runs:
go test ./...
# go vet is skipped — misuse of Printf format strings not caught
# govulncheck is skipped — known CVEs in deps go unnoticed`,
      right: `go vet ./...                  # catches common bugs (format strings, unreachable code)
govulncheck ./...             # check deps for known CVEs
go test -race ./...           # race detector
go build ./...                # confirm it compiles`,
      explanation: 'go vet catches real bugs: mismatched Printf format strings, unreachable code, incorrect mutex copying. govulncheck (golang.org/x/vuln) cross-references your dependencies against the Go vulnerability database and reports only vulnerabilities reachable from your code — low noise, high signal. Both are fast and should be part of every CI pipeline before go test.'
    },
    {
      title: 'Using CMD instead of ENTRYPOINT for the application binary',
      wrong: `# Dockerfile
CMD ["/app"]
# docker run myimage /bin/sh  <- replaces the CMD entirely — app never starts
# docker run myimage --config /etc/app.conf  <- also replaces CMD`,
      right: `# ENTRYPOINT: fixed binary
# CMD: default arguments (overridable)
ENTRYPOINT ["/app"]
CMD ["--config", "/etc/app/config.yaml"]  # default args

# docker run myimage --config /etc/custom.conf  <- passes to /app
# docker run myimage /bin/sh  <- wrong, but at least explicit`,
      explanation: 'CMD is the default command — docker run can replace it entirely. ENTRYPOINT is the fixed executable — docker run arguments are appended to it as additional arguments. For a Go binary, use ENTRYPOINT ["/app"] to ensure the binary always runs. Use CMD for default flags (like --config) that users might want to override without replacing the binary.'
    },
  ];

  challenge: Challenge = {
    title: 'Write a Production Dockerfile',
    language: 'typescript',
    description: `Write a production-ready multi-stage Dockerfile for a Go HTTP server.

**Requirements:**
1. Stage 1 (builder): Use \`golang:1.22-alpine\`. Copy go.mod/go.sum first (for layer caching), then source. Build with \`CGO_ENABLED=0\`, strip symbols with \`-ldflags="-s -w"\`.

2. Stage 2 (runtime): Use \`gcr.io/distroless/static-debian12:nonroot\` as the base.
   - Copy CA certificates from the builder stage
   - Copy only the compiled binary
   - Expose port 8080
   - Run as nonroot user (the :nonroot tag sets this automatically)

3. The binary lives at \`./cmd/server/main.go\` and should be named \`server\` in the image.

4. Below the Dockerfile, write the three Docker commands to:
   - Build the image tagged as \`myapp:latest\`
   - Run it with port 8080 mapped to localhost:8080
   - Check what is running inside (list processes)

**Bonus:** Add an ARG for the Go version so it can be overridden at build time.`,
    hints: [
      'Copy go.mod and go.sum before the full source — this way Docker caches the go mod download layer',
      'CGO_ENABLED=0 is set as an ENV or RUN env prefix; GOOS=linux forces Linux target',
      'distroless:nonroot already sets USER — no explicit USER instruction needed',
      'docker run -p 8080:8080 maps container port to host port',
    ],
    starterCode: `# Dockerfile

# Stage 1: Build
FROM golang:1.22-alpine AS builder
# TODO: set WORKDIR

# TODO: copy go.mod go.sum first, then run go mod download

# TODO: copy source and build with CGO_ENABLED=0 and stripped symbols

# Stage 2: Run
FROM gcr.io/distroless/static-debian12:nonroot
# TODO: copy binary from builder
# TODO: expose port and set entrypoint

# --- Docker commands ---
# TODO: build command
# TODO: run command
# TODO: list processes`,
    solution: `# Dockerfile

ARG GO_VERSION=1.22

# Stage 1: Build
FROM golang:\${GO_VERSION}-alpine AS builder

WORKDIR /app

# Copy deps first for better layer caching (only re-downloads on go.mod changes)
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \\
    go build -ldflags="-s -w" -o /server ./cmd/server

# Stage 2: Run — distroless:nonroot (includes CA certs + timezone)
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /server /server

EXPOSE 8080
ENTRYPOINT ["/server"]

# :nonroot tag sets USER nobody automatically — no explicit USER needed

# --- Docker commands ---

# Build:
docker build -t myapp:latest .
# With version override:
# docker build --build-arg GO_VERSION=1.23 -t myapp:latest .

# Run:
docker run -p 8080:8080 myapp:latest

# List processes inside (distroless has no shell — use nsenter or kubectl exec):
# For local debugging add a debug stage:
# FROM gcr.io/distroless/static-debian12:debug-nonroot
# docker run myapp:debug-latest /busybox/sh -c "ps aux"`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why do you need `CGO_ENABLED=0` when building for a scratch Docker image?',
      options: [
        'Without it, the binary links against the host\'s C library dynamically — scratch has no C library, so the binary fails at runtime',
        'CGO_ENABLED=0 is required to enable cross-compilation for any target platform',
        'Scratch images only support 32-bit binaries — CGO_ENABLED=0 enables 32-bit mode',
        'CGO_ENABLED=0 disables the garbage collector for smaller binaries',
      ],
      answer: 0,
      explanation: 'When CGO_ENABLED=1 (default), Go links your binary against the host\'s dynamic C library (glibc). The scratch image contains absolutely nothing — no C library, no shell, no filesystem utilities. Without the dynamic linker and libc the binary cannot start and you get "not found" or "exec format error" at runtime. CGO_ENABLED=0 produces a fully static binary that works in scratch.'
    },
    {
      q: 'What does `-ldflags="-s -w"` do to a Go binary?',
      options: [
        'Strips the symbol table (-s) and DWARF debug info (-w), reducing binary size by 25–35%',
        'Enables static linking (-s) and disables warnings during linking (-w)',
        'Speeds up the linker (-s for speed) and enables watch mode (-w for live reload)',
        'Sets the stack size (-s) and write permission for the binary (-w)',
      ],
      answer: 0,
      explanation: '-s strips the symbol table and -w strips the DWARF debug information. Together they reduce binary size by roughly 25–35% with no runtime behaviour change. The only downside: you cannot attach a debugger (dlv, gdb) to the stripped binary, and stack traces in panics lose file/line info. Use for production builds; keep symbols in debug/development builds.'
    },
    {
      q: 'What is the purpose of the multi-stage Docker build pattern in Go?',
      options: [
        'Stage 1 has the full Go toolchain for compilation; stage 2 copies only the binary into a minimal image — the toolchain is discarded',
        'Stage 1 runs tests; stage 2 runs the application — separating test and production code',
        'Stage 1 downloads dependencies; stage 2 compiles — parallelising the build for speed',
        'Stage 1 builds for AMD64; stage 2 builds for ARM64 — producing a multi-arch image in one build',
      ],
      answer: 0,
      explanation: 'The Go toolchain (golang base image) is hundreds of megabytes. The final running binary might be 10–30MB. Multi-stage builds discard the toolchain: stage 1 (golang image) compiles the binary; stage 2 (scratch, distroless, or alpine) copies only the binary. The final Docker image is just the binary plus the minimal base — dramatically smaller and with a smaller attack surface.'
    },
    {
      q: 'How does Kubernetes\'s `terminationGracePeriodSeconds` interact with graceful shutdown?',
      options: [
        'Kubernetes sends SIGTERM then waits terminationGracePeriodSeconds before SIGKILL — your shutdown timeout must be shorter than this period',
        'terminationGracePeriodSeconds sets how long the pod can run before it is automatically restarted',
        'It controls how long a pod waits for readiness probes to pass before receiving traffic',
        'It sets the maximum time for a single HTTP request before the connection is terminated',
      ],
      answer: 0,
      explanation: 'Kubernetes lifecycle on pod termination: sends SIGTERM to the container, waits terminationGracePeriodSeconds, then sends SIGKILL. Your graceful shutdown code (srv.Shutdown) must complete within that window. Set terminationGracePeriodSeconds to 5–10 seconds more than your longest shutdown timeout. If the grace period is shorter than your timeout, active requests get cut off by SIGKILL.'
    },
    {
      q: 'What does `go vet` do that `go test` does not?',
      options: [
        'Catches suspicious code patterns (wrong Printf format strings, unreachable code, incorrect sync usage) without running tests',
        'Checks that all functions have doc comments',
        'Runs static analysis to find security vulnerabilities in dependencies',
        'Verifies that all interfaces are correctly implemented at compile time',
      ],
      answer: 0,
      explanation: 'go vet analyses source code for common mistakes that are syntactically valid but semantically wrong: passing an int to Printf %s (format mismatch), comparing a function value with nil instead of calling it, copying a Mutex by value, unreachable code after return. These bugs compile and tests may pass — vet catches them without running anything. Always run go vet before go test in CI.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between FROM scratch and FROM distroless?',
      a: 'scratch is an empty image — nothing at all, not even a shell or filesystem. The binary must be fully static (CGO_ENABLED=0) and self-contained. distroless (gcr.io/distroless/*) adds minimal OS files like CA certificates, timezone data, and /etc/passwd without a shell or package manager. distroless:static is best for pure Go binaries. distroless:base adds libc for cgo binaries. Use :nonroot or -nonroot variants to run as a non-root user by default.'
    },
    {
      q: 'How do I optimise Docker layer caching for Go builds?',
      a: 'Copy go.mod and go.sum before the full source, then run go mod download. Docker caches each layer — the module download layer is only invalidated when go.mod or go.sum changes, not when source files change. After downloading modules, COPY . . and build. This means most builds skip the slow module download step. In CI, also use the GitHub Actions cache for the Docker build cache: --cache-from and --cache-to with a registry or local cache.'
    },
    {
      q: 'What is ko and when would I use it instead of Docker?',
      a: 'ko (github.com/ko-build/ko) builds Go binaries directly into OCI container images without a Dockerfile or Docker daemon. It calls the Go compiler internally, layers the binary over a base image (distroless by default), and pushes to a registry. ko build ./cmd/myapp builds and pushes in one step. Best for: Kubernetes-native Go services where you want to skip Dockerfile maintenance, fast iteration without Docker builds, and consistent secure base images. Not ideal for: apps with complex build requirements, non-Go components, or specific Dockerfile needs.'
    },
    {
      q: 'How do I configure readiness vs liveness probes in Kubernetes?',
      a: 'Liveness probe (/healthz/live): checks if the process is alive. Failing it causes Kubernetes to restart the pod. Keep it lightweight — just return 200 (no DB check). Readiness probe (/healthz/ready): checks if the pod is ready to receive traffic. Failing it removes the pod from the Service endpoints. Use it to check DB connectivity, warm-up completion, and dependencies. A pod can be live (not restarted) but not ready (no traffic). Always implement both.'
    },
    {
      q: 'What does govulncheck do and how is it different from Snyk or Dependabot?',
      a: 'govulncheck (golang.org/x/vuln) is the official Go vulnerability scanner. It analyses your binary or source code and reports only vulnerabilities that are reachable from your code — if you import a package with a CVE but never call the vulnerable function, govulncheck does not report it. This is low-noise compared to Dependabot (which flags all transitive deps with CVEs regardless of call graph) and Snyk. Run: go install golang.org/x/vuln/cmd/govulncheck@latest then govulncheck ./....'
    },
    {
      q: 'How do I pass configuration to a Go service in a Docker container?',
      a: 'Three common patterns: (1) Environment variables: os.Getenv("DB_URL") — simplest, works everywhere, Kubernetes Secret/ConfigMap mounted as env vars. (2) Config file: mount a ConfigMap volume at /etc/myapp/config.yaml, read with os.ReadFile or viper. (3) Command-line flags: pass as ENTRYPOINT arguments or CMD overrides. Best practice: use env vars for secrets (DB passwords, API keys) and config files for structured configuration. Never bake secrets into the image — use Kubernetes Secrets or a secrets manager.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Go builds produce static binaries — CGO_ENABLED=0 for scratch images, multi-stage Docker for minimal containers, goreleaser for multi-platform releases, and graceful SIGTERM shutdown with http.Server.Shutdown.',
    mustKnow: [
      'CGO_ENABLED=0 produces a fully static binary with no system library dependencies.',
      '-ldflags="-s -w" strips debug symbols — reduces binary size 25–35%.',
      'Multi-stage Docker: builder (golang image) → runtime (scratch/distroless), only the binary copied.',
      'Graceful shutdown: signal.NotifyContext + http.Server.Shutdown(ctx).',
      'terminationGracePeriodSeconds must exceed your shutdown drain timeout.',
      'go vet catches format-string bugs and sync mistakes — run before go test in CI.',
      'govulncheck reports only reachable CVEs — low-noise vulnerability scanning.',
    ],
    interviewFocus: [
      'Why do you need CGO_ENABLED=0 for a scratch Docker image?',
      'What does a multi-stage Docker build do and why does it matter for Go?',
      'How does Kubernetes SIGTERM interact with graceful shutdown?',
      'What is the difference between a readiness and liveness probe?',
      'What does -ldflags="-s -w" do to a Go binary?',
    ],
  };
}
