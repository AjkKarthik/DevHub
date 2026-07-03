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
  selector: 'app-go-cli',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './cli.html',
  styleUrl: './cli.scss'
})
export class GoCli {
  readingTime = 22;
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  since = 'Go 1.21+';
  route = 'go-cli';
  nextRoute = '/go/profiling';
  nextLabel = 'Performance & Profiling';

  quickRef: QuickRefItem[] = [
    { name: 'flag.String/Int/Bool', type: 'function', desc: 'Define a flag; returns a pointer — dereference after flag.Parse()' },
    { name: 'flag.Parse()', type: 'function', desc: 'Parse os.Args[1:]; must be called before reading flag values' },
    { name: 'flag.Args()', type: 'function', desc: 'Returns non-flag arguments after flag.Parse()' },
    { name: 'os.Args', type: 'keyword', desc: 'Slice of raw command-line arguments: os.Args[0] is the binary name' },
    { name: 'cobra.Command', type: 'class', desc: 'spf13/cobra: structured subcommands, flags, help text, completions' },
    { name: 'os.Stdin / os.Stdout / os.Stderr', type: 'keyword', desc: 'Standard I/O streams — use for piped data and error output' },
    { name: 'bufio.Scanner', type: 'class', desc: 'Read stdin line by line: scanner.Scan() / scanner.Text()' },
    { name: 'fmt.Fprintf(os.Stderr, ...)', type: 'function', desc: 'Write errors to stderr — keeps stdout clean for piping' },
    { name: 'os.Exit(code)', type: 'function', desc: 'Exit with code 0 (success) or non-zero (error) — skips defers' },
    { name: 'cobra.Command.RunE', type: 'method', desc: 'Return error from command; cobra prints it and exits non-zero' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'stdlib flag package — simple CLIs',
      points: [
        'flag is the standard library package for command-line flags — no dependencies, suitable for simple tools.',
        'Define flags with flag.String, flag.Int, flag.Bool, flag.Duration — each returns a pointer to the value.',
        'flag.Parse() must be called after defining all flags. After that, dereference the pointer: *myFlag.',
        'flag.Args() returns the remaining non-flag positional arguments after parsing.',
        'flag.Usage can be replaced with a custom function for custom help text. Default prints flag definitions.',
      ]
    },
    {
      heading: 'cobra — production CLI framework',
      points: [
        'github.com/spf13/cobra is the de-facto standard for multi-subcommand CLIs (kubectl, gh, hugo all use it).',
        'cobra.Command defines a command with Use (syntax), Short (one-line help), Long (detailed help), and Run/RunE.',
        'RunE returns an error — cobra prints it and exits with code 1 automatically. Prefer RunE over Run.',
        'Persistent flags on rootCmd are inherited by all subcommands. Local flags apply only to the command that defines them.',
        'cobra integrates with viper for config-file + env-var + flag merging in a single priority hierarchy.',
      ]
    },
    {
      heading: 'Standard I/O and piping',
      points: [
        'os.Stdin, os.Stdout, os.Stderr are the three standard streams — all implement io.Reader or io.Writer.',
        'Write errors and diagnostics to os.Stderr; write output data to os.Stdout — keeps the tool composable in pipes.',
        'bufio.NewScanner(os.Stdin) reads stdin line by line — works for interactive input and piped data.',
        'Detect if stdin is a terminal with the isatty package or os.Stdin.Stat() to switch between interactive and piped mode.',
        'Use os.Exit(0) for success, os.Exit(1) for user errors, os.Exit(2) for misuse — matches Unix convention.',
      ]
    },
    {
      heading: 'Structured output and progress',
      points: [
        'Text output for human readability; JSON output (--output json) for machine readability — offer both.',
        'github.com/charmbracelet/lipgloss: terminal styling (colors, borders, padding) with good dark/light mode support.',
        'github.com/schollz/progressbar: simple progress bars for long-running operations.',
        'github.com/charmbracelet/bubbletea: full TUI framework (Elm-style model-update-view for interactive apps).',
        'Color only when stdout is a terminal — check isatty before writing ANSI codes.',
      ]
    },
    {
      heading: 'Distribution and installation',
      points: [
        'go install github.com/user/tool/cmd/mytool@latest installs a binary to $GOBIN.',
        'goreleaser automates multi-platform binary builds, checksums, and GitHub release uploads.',
        'Embed version info at build time: go build -ldflags "-X main.version=v1.2.3" ./cmd/mytool.',
        'Cobra integrates with cobra-cli generator (go install github.com/spf13/cobra-cli@latest) to scaffold subcommands.',
        'Cross-compile for target platforms: GOOS=linux GOARCH=amd64 go build -o tool-linux ./cmd/tool.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'stdlib flag',
      language: 'typescript',
      code: `// cmd/greet/main.go
package main

import (
    "flag"
    "fmt"
    "os"
    "strings"
)

func main() {
    // Define flags (returns pointers)
    name    := flag.String("name", "World", "Name to greet")
    count   := flag.Int("count", 1, "Number of times to greet")
    upper   := flag.Bool("upper", false, "Use uppercase")
    timeout := flag.Duration("timeout", 5*time.Second, "Request timeout")

    // Customise help text
    flag.Usage = func() {
        fmt.Fprintf(os.Stderr, "Usage: greet [flags] [extra-args...]\\n\\n")
        fmt.Fprintf(os.Stderr, "Flags:\\n")
        flag.PrintDefaults()
    }

    flag.Parse()  // must call before reading values

    // Dereference pointers after Parse
    greeting := fmt.Sprintf("Hello, %s!", *name)
    if *upper {
        greeting = strings.ToUpper(greeting)
    }

    for i := 0; i < *count; i++ {
        fmt.Println(greeting)
    }

    // Non-flag positional arguments
    extras := flag.Args()  // []string
    if len(extras) > 0 {
        fmt.Fprintln(os.Stderr, "Extra args:", extras)
    }

    _ = *timeout  // use in real code
}

// Usage:
// ./greet --name Alice --count 3 --upper
// HELLO, ALICE!
// HELLO, ALICE!
// HELLO, ALICE!`
    },
    {
      label: 'cobra Setup',
      language: 'typescript',
      code: `// go get github.com/spf13/cobra

// cmd/root.go
package cmd

import (
    "fmt"
    "os"
    "github.com/spf13/cobra"
)

var (
    verbose bool
    output  string
)

var rootCmd = &cobra.Command{
    Use:   "mytool",
    Short: "A CLI tool for doing things",
    Long:  "mytool is a demonstration of cobra CLI structure with subcommands.",
    // PersistentPreRunE runs before every subcommand:
    PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
        if verbose {
            fmt.Fprintln(os.Stderr, "verbose mode enabled")
        }
        return nil
    },
}

func Execute() {
    if err := rootCmd.Execute(); err != nil {
        os.Exit(1)
    }
}

func init() {
    // Persistent flags — inherited by all subcommands
    rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "Verbose output")
    rootCmd.PersistentFlags().StringVarP(&output, "output", "o", "text", "Output format (text|json)")
}

// cmd/get.go
var getCmd = &cobra.Command{
    Use:   "get [resource]",
    Short: "Fetch a resource",
    Args:  cobra.ExactArgs(1),  // validates exactly one positional arg
    RunE: func(cmd *cobra.Command, args []string) error {
        resource := args[0]
        // Return error — cobra prints it and exits 1
        data, err := fetchResource(resource)
        if err != nil {
            return fmt.Errorf("fetch %s: %w", resource, err)
        }
        fmt.Println(data)
        return nil
    },
}

func init() {
    // Local flag — only for 'get' subcommand
    getCmd.Flags().StringP("filter", "f", "", "Filter results by field")
    rootCmd.AddCommand(getCmd)
}

// cmd/main.go
func main() { cmd.Execute() }

// Usage:
// ./mytool get users --filter active --output json
// ./mytool --help
// ./mytool get --help`
    },
    {
      label: 'stdin / Piping',
      language: 'typescript',
      code: `// Tool that reads from stdin (works in pipes)
// echo "hello world" | ./wordcount

package main

import (
    "bufio"
    "fmt"
    "os"
    "strings"
)

func main() {
    // Detect if stdin is a terminal or pipe
    stat, _ := os.Stdin.Stat()
    isTTY := (stat.Mode() & os.ModeCharDevice) != 0

    if isTTY {
        fmt.Fprintln(os.Stderr, "Reading from stdin... (Ctrl+D to finish)")
    }

    scanner := bufio.NewScanner(os.Stdin)
    var words, lines int

    for scanner.Scan() {
        line := scanner.Text()
        lines++
        words += len(strings.Fields(line))
    }
    if err := scanner.Err(); err != nil {
        fmt.Fprintf(os.Stderr, "error reading stdin: %v\\n", err)
        os.Exit(1)
    }

    fmt.Printf("lines: %d, words: %d\\n", lines, words)
}

// --- Prompting for user input interactively ---
func promptUser(prompt string) string {
    fmt.Fprint(os.Stdout, prompt)
    scanner := bufio.NewScanner(os.Stdin)
    scanner.Scan()
    return strings.TrimSpace(scanner.Text())
}

// --- Write structured JSON to stdout ---
func outputJSON(v any) error {
    return json.NewEncoder(os.Stdout).Encode(v)
}

// Always write errors to stderr:
// fmt.Fprintf(os.Stderr, "error: %v\\n", err)
// os.Exit(1)

// Pipe example:
// cat file.txt | ./wordcount
// ./wordcount < file.txt
// ./wordcount | grep words`
    },
    {
      label: 'Spinner & Progress',
      language: 'typescript',
      code: `// Simple spinner using goroutines + channel
package main

import (
    "fmt"
    "os"
    "time"
)

func spinner(done <-chan struct{}) {
    frames := []string{"⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"}
    i := 0
    for {
        select {
        case <-done:
            fmt.Print("\\r")  // clear spinner line
            return
        default:
            fmt.Printf("\\r%s Working...", frames[i%len(frames)])
            i++
            time.Sleep(80 * time.Millisecond)
        }
    }
}

func doWork() error {
    time.Sleep(2 * time.Second)  // simulated work
    return nil
}

func main() {
    done := make(chan struct{})
    go spinner(done)

    err := doWork()
    close(done)

    if err != nil {
        fmt.Fprintf(os.Stderr, "error: %v\\n", err)
        os.Exit(1)
    }
    fmt.Println("Done!")
}

// --- Popular third-party options ---
// github.com/schollz/progressbar (progress bar):
// bar := progressbar.Default(100)
// for i := 0; i < 100; i++ { bar.Add(1); time.Sleep(10ms) }

// github.com/charmbracelet/lipgloss (styling):
// style := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#00ADD8"))
// fmt.Println(style.Render("Success!"))

// github.com/charmbracelet/bubbletea (full TUI):
// Model-update-view architecture for interactive terminal apps
// p := tea.NewProgram(initialModel()); p.Run()`
    },
    {
      label: 'Embed Version & Config',
      language: 'typescript',
      code: `// Embed version info at build time via ldflags

// main.go
package main

import (
    "fmt"
    "runtime"
    "github.com/spf13/cobra"
)

var (
    version = "dev"       // overwritten by -ldflags
    commit  = "unknown"
    date    = "unknown"
)

var versionCmd = &cobra.Command{
    Use:   "version",
    Short: "Print version information",
    Run: func(cmd *cobra.Command, args []string) {
        fmt.Printf("mytool %s (%s) built %s %s/%s\\n",
            version, commit, date, runtime.GOOS, runtime.GOARCH)
    },
}

// Build:
// go build \\
//   -ldflags "-X main.version=v1.2.3 -X main.commit=abc1234 -X main.date=2025-01-15" \\
//   -o mytool ./cmd/mytool

// goreleaser (automates this):
// # .goreleaser.yml
// builds:
//   - id: mytool
//     ldflags:
//       - -X main.version={{.Version}}
//       - -X main.commit={{.Commit}}
//       - -X main.date={{.Date}}
//     goos: [linux, darwin, windows]
//     goarch: [amd64, arm64]

// --- Config file with viper (cobra companion) ---
// go get github.com/spf13/viper
// viper.SetConfigName("config")
// viper.SetConfigType("yaml")
// viper.AddConfigPath("$HOME/.mytool")
// viper.AutomaticEnv()         // MYTOOL_OUTPUT -> output
// viper.ReadInConfig()
// output := viper.GetString("output")  // flag > env > config > default`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Reading flag values before flag.Parse()',
      wrong: `var name = flag.String("name", "World", "greeting name")

func main() {
    fmt.Println(*name)  // always prints "World" — Parse not called yet!
    flag.Parse()
}`,
      right: `var name = flag.String("name", "World", "greeting name")

func main() {
    flag.Parse()        // FIRST: parse os.Args
    fmt.Println(*name)  // now correctly reads the flag value
}`,
      explanation: 'flag.Parse() reads os.Args and populates the flag values. Reading a flag pointer before Parse always returns the default value — no error, no panic, just silently wrong. Always call flag.Parse() as the first statement in main (or early in cobra RunE) before reading any flag values.'
    },
    {
      title: 'Writing errors to stdout instead of stderr',
      wrong: `if err != nil {
    fmt.Printf("error: %v\\n", err)  // goes to stdout!
    os.Exit(1)
}`,
      right: `if err != nil {
    fmt.Fprintf(os.Stderr, "error: %v\\n", err)  // stderr
    os.Exit(1)
    // or with cobra: return fmt.Errorf("operation: %w", err)
}`,
      explanation: 'In Unix pipelines, stdout is the data channel and stderr is the diagnostic channel. Writing errors to stdout pollutes the data stream — downstream tools that parse your output receive error messages mixed in. Use fmt.Fprintf(os.Stderr, ...) for all errors, warnings, and progress messages. Tools like grep, jq, and other pipeline consumers only read stdout.'
    },
    {
      title: 'Using os.Exit in functions with deferred cleanup',
      wrong: `func run() error {
    f, _ := os.Create("output.txt")
    defer f.Close()  // NEVER runs if os.Exit is called

    if err := process(f); err != nil {
        os.Exit(1)  // skips defer f.Close() — file may be corrupt
    }
    return nil
}`,
      right: `func run() error {
    f, err := os.Create("output.txt")
    if err != nil { return err }
    defer f.Close()

    if err := process(f); err != nil {
        return fmt.Errorf("process: %w", err)  // caller handles exit
    }
    return nil
}

func main() {
    if err := run(); err != nil {
        fmt.Fprintln(os.Stderr, err)
        os.Exit(1)  // only in main, after all cleanup is done
    }
}`,
      explanation: 'os.Exit terminates the process immediately — deferred functions are NOT run. This means open files may not be flushed, database transactions left open, and temp files not cleaned up. The pattern: only call os.Exit in main. All other functions return errors. main calls os.Exit after all cleanup is complete.'
    },
    {
      title: 'Not validating positional arguments with cobra',
      wrong: `var listCmd = &cobra.Command{
    Use: "list [type]",
    Run: func(cmd *cobra.Command, args []string) {
        // args[0] — panics if user provides no arguments!
        fmt.Println("listing", args[0])
    },
}`,
      right: `var listCmd = &cobra.Command{
    Use:  "list [type]",
    Args: cobra.MaximumNArgs(1),  // 0 or 1 arg, cobra validates
    RunE: func(cmd *cobra.Command, args []string) error {
        listType := "all"
        if len(args) > 0 { listType = args[0] }
        return printList(listType)
    },
}`,
      explanation: 'cobra provides Args validators: ExactArgs(n), MinimumNArgs(n), MaximumNArgs(n), RangeArgs(min, max), NoArgs, ArbitraryArgs. They run before Run/RunE and print a clear error message if the constraint is violated. Without them, wrong argument counts cause panics or silent misbehaviour. Always set Args on commands that expect positional arguments.'
    },
    {
      title: 'Printing ANSI colours when stdout is not a terminal',
      wrong: `// Always prints colour codes — breaks piped output
fmt.Printf("\\033[32m%s\\033[0m\\n", "Success!")
// File contains: ESC[32mSuccessESC[0m`,
      right: `import "golang.org/x/term"

func isTerminal() bool {
    return term.IsTerminal(int(os.Stdout.Fd()))
}

func colorize(s, color string) string {
    if !isTerminal() { return s }
    return color + s + "\\033[0m"
}

fmt.Println(colorize("Success!", "\\033[32m"))`,
      explanation: 'ANSI escape codes render as visible control characters in log files, CI output, and piped commands. Check if stdout is a terminal before emitting colours. The golang.org/x/term package provides a clean isTerminal check. Many CLI libraries (lipgloss, etc.) do this automatically — use them if you need consistent coloured output.'
    },
    {
      title: 'Ignoring context in long-running CLI operations',
      wrong: `var rootCmd = &cobra.Command{
    RunE: func(cmd *cobra.Command, args []string) error {
        // Long operation — ignores Ctrl+C
        return downloadAllFiles(args)
    },
}`,
      right: `var rootCmd = &cobra.Command{
    RunE: func(cmd *cobra.Command, args []string) error {
        // cmd.Context() is cancelled on Ctrl+C (cobra sets this up)
        ctx := cmd.Context()
        return downloadAllFiles(ctx, args)
    },
}

// In main:
func main() {
    ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
    defer cancel()
    rootCmd.ExecuteContext(ctx)
}`,
      explanation: 'CLI tools should respond to Ctrl+C (SIGINT) gracefully — stop work, clean up temp files, and exit cleanly. Pass a context from signal.NotifyContext to cobra via rootCmd.ExecuteContext. The context is cancelled when the user presses Ctrl+C. cobra passes it to RunE via cmd.Context(). Any operation that accepts a context will then cancel cleanly.'
    },
  ];

  challenge: Challenge = {
    title: 'File Statistics CLI Tool',
    language: 'typescript',
    description: `Build a \`filestat\` CLI tool using the standard library \`flag\` package.

**Features to implement:**
1. Accept one or more file paths as positional arguments
2. Flag \`--json\` (bool, default false): output results as JSON instead of text
3. Flag \`--min-size\` (int, default 0): skip files smaller than N bytes
4. For each file, print: filename, size in bytes, last modified time, line count
5. Write a helper \`countLines(path string) (int, error)\` that reads the file and counts newlines
6. If a file does not exist or cannot be read, print the error to stderr and continue with the next file
7. At the end, print a summary: total files processed, total bytes

**Example output (text mode):**
\`\`\`
file: main.go  size: 1234 bytes  lines: 45  modified: 2025-01-15 10:30:00
file: go.mod   size: 234 bytes   lines: 12  modified: 2025-01-15 09:00:00
---
Processed: 2 files, 1468 bytes total
\`\`\``,
    hints: [
      'flag.Parse() before reading flag values; flag.Args() for positional file paths',
      'os.Stat(path) returns (FileInfo, error) — FileInfo has .Size() and .ModTime()',
      'bufio.NewScanner(f).Scan() counts lines; scanner.Err() for read errors',
      'json.NewEncoder(os.Stdout).Encode(results) for --json output',
    ],
    starterCode: `package main

import (
    "bufio"
    "encoding/json"
    "flag"
    "fmt"
    "os"
    "time"
)

type FileInfo struct {
    Name     string    'json:"name"'
    Size     int64     'json:"size"'
    Lines    int       'json:"lines"'
    Modified time.Time 'json:"modified"'
}

func countLines(path string) (int, error) {
    // TODO
    return 0, nil
}

func main() {
    // TODO: define flags
    // TODO: flag.Parse()
    // TODO: iterate over flag.Args()
    // TODO: for each file: stat + countLines
    // TODO: print results (text or JSON)
    // TODO: print summary
}`,
    solution: `package main

import (
    "bufio"
    "encoding/json"
    "flag"
    "fmt"
    "os"
    "time"
)

type FileInfo struct {
    Name     string    'json:"name"'
    Size     int64     'json:"size"'
    Lines    int       'json:"lines"'
    Modified time.Time 'json:"modified"'
}

func countLines(path string) (int, error) {
    f, err := os.Open(path)
    if err != nil { return 0, err }
    defer f.Close()

    s := bufio.NewScanner(f)
    count := 0
    for s.Scan() { count++ }
    return count, s.Err()
}

func main() {
    jsonOut  := flag.Bool("json", false, "Output as JSON")
    minSize  := flag.Int64("min-size", 0, "Skip files smaller than N bytes")
    flag.Parse()

    paths := flag.Args()
    if len(paths) == 0 {
        fmt.Fprintln(os.Stderr, "usage: filestat [flags] file [file...]")
        os.Exit(1)
    }

    var results []FileInfo
    var totalBytes int64

    for _, path := range paths {
        info, err := os.Stat(path)
        if err != nil {
            fmt.Fprintf(os.Stderr, "error: %v\\n", err)
            continue
        }
        if info.Size() < *minSize { continue }

        lines, err := countLines(path)
        if err != nil {
            fmt.Fprintf(os.Stderr, "error reading %s: %v\\n", path, err)
            continue
        }

        fi := FileInfo{
            Name:     path,
            Size:     info.Size(),
            Lines:    lines,
            Modified: info.ModTime().Truncate(time.Second),
        }
        results = append(results, fi)
        totalBytes += info.Size()
    }

    if *jsonOut {
        json.NewEncoder(os.Stdout).Encode(results)
        return
    }

    for _, r := range results {
        fmt.Printf("file: %-20s  size: %6d bytes  lines: %4d  modified: %s\\n",
            r.Name, r.Size, r.Lines, r.Modified.Format("2006-01-02 15:04:05"))
    }
    fmt.Println("---")
    fmt.Printf("Processed: %d files, %d bytes total\\n", len(results), totalBytes)
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What must you call before reading any flag values in the standard library `flag` package?',
      options: [
        'flag.Parse() — it reads os.Args and populates the flag pointer values',
        'flag.Init() — it initialises the flag registry',
        'Nothing — flag values are populated when you call flag.String/Int/Bool',
        'os.Args() — to make os.Args available to the flag package',
      ],
      answer: 0,
      explanation: 'flag.String, flag.Int, flag.Bool etc. register flags but do NOT parse os.Args. flag.Parse() does the actual parsing. Until you call it, every flag pointer holds its default value. flag.Parse() must be called in main before any code reads flag values — typically as the first thing after all flag definitions.'
    },
    {
      q: 'What is cobra.Command.RunE vs Run?',
      options: [
        'RunE returns an error; cobra prints it and exits non-zero. Run has no return value.',
        'RunE runs before Run — use RunE for validation, Run for the main action.',
        'RunE is for async commands; Run is synchronous.',
        'They are identical — RunE is a deprecated alias for Run.',
      ],
      answer: 0,
      explanation: 'RunE is the preferred form: func(cmd *cobra.Command, args []string) error. When RunE returns a non-nil error, cobra prints the error message and exits with code 1 automatically. Run is func(...) with no return — you have to call os.Exit manually or swallow errors. Always use RunE for clean error handling.'
    },
    {
      q: 'Where should CLI error messages be written, and why?',
      options: [
        'os.Stderr — keeps stdout clean for piped data; errors should not pollute the data stream',
        'os.Stdout — so the user always sees them in the terminal',
        'A log file — so they are preserved after the process exits',
        'Either stdout or stderr — there is no convention in Go',
      ],
      answer: 0,
      explanation: 'Unix convention: stdout is the data stream (what you pipe to the next command), stderr is the diagnostic stream (what you read as a human). Writing errors to stdout pollutes the data: jq, grep, and other pipeline consumers get error text mixed into the data they parse. Write all errors, warnings, and progress to os.Stderr.'
    },
    {
      q: 'What does calling os.Exit(1) inside a function with deferred cleanup do?',
      options: [
        'Deferred functions are skipped — os.Exit terminates the process immediately without running defers',
        'Deferred functions run first, then the process exits with code 1',
        'os.Exit panics, which causes deferred functions to run via stack unwinding',
        'Deferred functions run only if they were registered before os.Exit was called',
      ],
      answer: 0,
      explanation: 'os.Exit terminates the process immediately — it does NOT run deferred functions. Open files may not be flushed, temp files not cleaned up. The safe pattern: only call os.Exit in main. All other functions return errors. This lets deferred cleanup run normally as the call stack unwinds. main handles the final exit code.'
    },
    {
      q: 'How does cobra handle signal interruption (Ctrl+C) with contexts?',
      options: [
        'Use signal.NotifyContext + rootCmd.ExecuteContext(ctx); cobra passes ctx to RunE via cmd.Context()',
        'Cobra handles Ctrl+C automatically — no setup needed',
        'Use os.Signal channel and call cmd.Cancel() to stop running commands',
        'Cobra does not support graceful shutdown — the process must be killed',
      ],
      answer: 0,
      explanation: 'Create a context that is cancelled on SIGINT: ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt); defer cancel(). Pass it to cobra: rootCmd.ExecuteContext(ctx). Cobra sets cmd.Context() to this context for all commands. RunE functions retrieve it with cmd.Context() and pass it to long-running operations so they cancel cleanly on Ctrl+C.'
    },
    {
      q: 'A command defines both PreRunE and RunE. If PreRunE returns an error, does RunE still execute?',
      options: ['Yes, both always run regardless of errors', 'No — Cobra runs the Run hooks in order (PersistentPreRun(E), PreRun(E), Run(E), PostRun(E)) and stops at the first one that returns an error, skipping the rest', 'RunE runs first to decide whether PreRunE should run', 'PreRunE errors are only logged, never block execution'],
      answer: 1,
      explanation: 'Cobra executes command hooks in a fixed sequence and short-circuits on the first error: PersistentPreRunE, PreRunE, RunE, PostRunE, PersistentPostRunE. If PreRunE returns a non-nil error, Cobra stops immediately — RunE (and the Post hooks) never execute, and the error propagates up the same way a RunE error would. This makes PreRunE the right place for validation that should prevent the main action from running at all (e.g. checking required flag combinations that flag.Parse alone can\'t express).'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Persistent flags and local flags in cobra?',
      a: 'Persistent flags (rootCmd.PersistentFlags()) are inherited by all subcommands — useful for --verbose, --output, --config-file that should apply everywhere. Local flags (cmd.Flags()) only exist on the specific command that defines them. Persistent flags defined on a child command are inherited by that child\'s subcommands. Define persistent flags on rootCmd for truly global flags; use local flags for subcommand-specific options.'
    },
    {
      q: 'How do I read config files alongside flags in a cobra CLI?',
      a: 'Use github.com/spf13/viper alongside cobra. viper.SetConfigName, viper.AddConfigPath, viper.ReadInConfig for the file. viper.AutomaticEnv() maps env vars (MY_APP_OUTPUT -> output). viper.BindPFlag binds a cobra flag to a viper key. Priority order: flag > env var > config file > default. cobra\'s PersistentPreRunE is the right place to call viper.ReadInConfig so config is loaded before any subcommand runs.'
    },
    {
      q: 'How do I add shell completion to a cobra CLI?',
      a: 'Cobra generates shell completions automatically. Run: mytool completion bash > /etc/bash_completion.d/mytool. Supports bash, zsh, fish, powershell. Add custom completions per-flag: cmd.RegisterFlagCompletionFunc("output", func(cmd *cobra.Command, args []string, toComplete string) ([]string, cobra.ShellCompDirective) { return []string{"json", "text", "yaml"}, cobra.ShellCompDirectiveNoFileComp }). cobra-cli scaffolding generates a completion subcommand automatically.'
    },
    {
      q: 'How do I test cobra commands?',
      a: 'Inject commands without os.Exit in tests: create a new rootCmd, set output with cmd.SetOut(buf) and cmd.SetErr(errBuf), then call cmd.Execute() with args: rootCmd.SetArgs([]string{"get", "--output", "json"}); err := rootCmd.Execute(). Check buf.String() for output. This avoids spawning a subprocess and captures output in memory. Use testify/assert.NoError for the Execute return value.'
    },
    {
      q: 'How do I distribute a Go CLI binary for multiple platforms?',
      a: 'For manual builds: GOOS=linux GOARCH=amd64 go build -o dist/tool-linux-amd64 ./cmd/tool. For automated releases: goreleaser. Create .goreleaser.yml, tag a release (git tag v1.0.0), run goreleaser release. It builds for all configured GOOS/GOARCH combinations, generates sha256 checksums, and uploads to GitHub Releases. For simple personal tools: go install github.com/user/tool@latest installs directly from source.'
    },
    {
      q: 'When should I use stdlib flag vs cobra?',
      a: 'flag: single-command tools with a handful of flags, scripts, internal tools, tools where zero dependencies matters (go install without network). cobra: multi-subcommand tools (like git, kubectl), tools that need --help for each subcommand, shell completion, config-file integration via viper, or tools you will maintain long-term. If your tool has more than 3-4 flags or will grow subcommands, start with cobra — retrofitting it later is more work than starting with it.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Go CLIs: stdlib flag for simple tools (flag.Parse() before reading), cobra for multi-subcommand tools with RunE, structured I/O (errors to stderr), and graceful Ctrl+C via context.',
    mustKnow: [
      'flag.Parse() must be called before reading any flag pointer values.',
      'Errors and progress go to os.Stderr; data output goes to os.Stdout.',
      'os.Exit skips deferred functions — only call it in main after all cleanup.',
      'cobra: use RunE (returns error) not Run; use cobra.Command.Args validators.',
      'Persistent flags on rootCmd are inherited by all subcommands.',
      'Graceful Ctrl+C: signal.NotifyContext + rootCmd.ExecuteContext(ctx).',
      'Embed version at build time: -ldflags "-X main.version=v1.2.3".',
    ],
    interviewFocus: [
      'What does flag.Parse() do and why must it be called first?',
      'Why write errors to stderr instead of stdout?',
      'What happens to deferred functions when you call os.Exit?',
      'What is the difference between cobra RunE and Run?',
      'How do you make a Go CLI respond gracefully to Ctrl+C?',
    ],
  };
}
