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
  templateUrl: './bufio-scanner-has-a-64kb-default-token-limit.html',
  styleUrl: './bufio-scanner-has-a-64kb-default-token-limit.scss'
})
export class BufioScannerHasA64kbDefaultTokenLimitSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own wordcount tool checks scanner.Err() but never explains what it can actually return',
      points: [
        'The main page\'s own stdin/piping code tab builds a wordcount tool around bufio.NewScanner(os.Stdin), and does the right thing by checking if err := scanner.Err(); err != nil { ... } after the scan loop. But its theory only says "bufio.NewScanner(os.Stdin) reads stdin line by line — works for interactive input and piped data," with no mention of any limit on what a single line can contain.',
        'The bufio package documentation defines an explicit ceiling: "MaxScanTokenSize is the maximum size used to buffer a token unless the user provides an explicit buffer with Scanner.Buffer" — set to 64 * 1024, i.e. 64 KB. By default, every Scanner (including the main page\'s own bufio.NewScanner(os.Stdin) call) is bound by this limit.',
        'When a single token — for the default bufio.ScanLines split function, a single LINE — exceeds 64 KB, the documented behavior is not silent truncation: "bufio.Scanner: token too long" is the exact error (ErrTooLong) that scanner.Err() returns, and Scan() itself returns false, ending the loop early with whatever lines were already read.',
      ]
    },
    {
      heading: 'This is a real, common failure mode for exactly the kind of tool the main page builds',
      points: [
        'CLI tools that read arbitrary piped input — the main page\'s own wordcount example, or any log-processing, CSV-row, or minified-file-reading tool — are exactly the category most likely to eventually receive one abnormally long line: a single-line minified JS bundle, a CSV row with an enormous embedded text field, or a log line containing a full stack trace pasted onto one line.',
        'Because scanner.Err() genuinely returns a real, specific error (not a generic "something went wrong"), a tool that DOES check it (like the main page\'s own example) will at least report the failure rather than silently producing a wrong word count — but a tool that never checks scanner.Err() at all would simply stop counting partway through the input with no indication anything was truncated, since Scan() returning false looks identical whether the input legitimately ended or a token was too long.',
        'The documented fix is exactly the Buffer method the main page never mentions: "call Scanner.Buffer(buf, max) before Scan" — passing a larger max raises the ceiling for that Scanner instance. Buffer\'s own documentation adds one operational constraint worth knowing: "Buffer panics if it is called after scanning has started," so it must be called immediately after NewScanner, before the first Scan() call.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own wordcount -- silently stops on one long line',
      language: 'typescript',
      code: `package main

import (
    "bufio"
    "fmt"
    "os"
    "strings"
)

func main() {
    // Matches the main page's own stdin/piping example exactly.
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

// Piping input where line 3 (out of 5) is a single 200KB line
// (e.g. a minified JS bundle someone accidentally cat'd in):
//
// $ cat mixed-input.txt | ./wordcount
// error reading stdin: bufio.Scanner: token too long
//
// Per the bufio package's own documented default -- MaxScanTokenSize
// = 64 * 1024 -- this 200KB line exceeds the ceiling. The tool DOES
// report the error (because it checks scanner.Err()), but the word
// count for lines 4 and 5 -- which came AFTER the oversized line --
// is never produced at all. Scan() stopped there.`,
    },
    {
      label: 'The fix -- Scanner.Buffer raises the limit',
      language: 'typescript',
      code: `package main

import (
    "bufio"
    "fmt"
    "os"
    "strings"
)

func main() {
    scanner := bufio.NewScanner(os.Stdin)

    // Per the bufio package's own documentation: "Buffer panics if
    // it is called after scanning has started" -- this MUST come
    // before the first Scan() call.
    //
    // Raise the ceiling to 1MB per line (adjust based on the actual
    // maximum line length this tool needs to tolerate):
    const maxLineSize = 1024 * 1024 // 1 MB
    buf := make([]byte, 0, 64*1024) // initial buffer -- grows as needed
    scanner.Buffer(buf, maxLineSize)

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

// Same 200KB single-line input now scans successfully, since 200KB
// is comfortably under the new 1MB ceiling -- all 5 lines are
// counted, not just the first 2.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team builds a log-processing CLI tool using bufio.NewScanner(os.Stdin) exactly like the main page\'s own wordcount example, including the scanner.Err() check. In production, it occasionally reports "bufio.Scanner: token too long" and exits early, always on log files from one specific service that occasionally logs a full JSON payload (sometimes over 100KB) as a single unbroken line. Using this subtopic\'s theory, explain the root cause precisely, and describe the one-line fix, including exactly where in the code it must be added.',
    hint: 'Per this subtopic\'s theory, what is the DEFAULT maximum size bufio.Scanner allows for a single token (a single line, for the default split function)? Does the fact that scanner.Err() reports a specific "token too long" error, rather than a generic failure, help pinpoint the cause here?',
    solution: 'The root cause is exactly this subtopic\'s theory: bufio.Scanner defaults to a 64 KB maximum token size (MaxScanTokenSize = 64 * 1024), and for the default line-splitting behavior, a single "token" is a single line. The specific service\'s occasional 100KB+ single-line JSON payloads exceed that default ceiling, causing Scan() to return false and scanner.Err() to return the documented ErrTooLong error ("bufio.Scanner: token too long") — which is exactly why the error message is specific rather than generic; it directly identifies this exact failure mode once you know what it means. The fix, per this subtopic\'s theory, is calling scanner.Buffer(buf, max) with a max comfortably larger than the largest expected line (e.g. a few MB, to leave headroom above the observed 100KB+ payloads) — and per Buffer\'s own documented constraint ("Buffer panics if it is called after scanning has started"), this call must be placed immediately after bufio.NewScanner(os.Stdin) and before the first call to scanner.Scan(), exactly as this subtopic\'s second code example places it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'bufio.NewScanner(os.Stdin), used with the default line-splitting behavior, can read a line of any length — there is no practical limit for ordinary text input.',
      reality: 'This subtopic\'s theory quotes the documented default directly: MaxScanTokenSize is 64 * 1024 (64 KB), and this applies to every Scanner unless Scanner.Buffer is called to raise it. Any single line exceeding that default silently becomes a scan failure, not a length any "ordinary" text input is guaranteed to stay under.'
    },
    {
      thought: 'If a Scanner-based tool checks scanner.Err() (as the main page\'s own wordcount example correctly does), a "token too long" failure is caught and handled the same as any other read error — the specific cause does not matter for handling it correctly.',
      reality: 'This subtopic\'s exercise shows the SPECIFIC error text ("bufio.Scanner: token too long") is itself the diagnostic signal that immediately identifies the root cause (a line exceeding the 64 KB default) versus a generic I/O failure — recognizing this specific message is what tells a developer to reach for Scanner.Buffer rather than investigating an unrelated I/O problem.'
    },
    {
      thought: 'Scanner.Buffer can be called at any point during a scanning loop to adjust the limit on the fly, e.g. right before the specific line that turns out to be too long.',
      reality: 'This subtopic\'s theory quotes the documentation\'s own explicit constraint: "Buffer panics if it is called after scanning has started." It must be called once, immediately after creating the Scanner and before the first Scan() call — there is no way to raise the limit reactively mid-scan.'
    }
  ];
}
