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
  templateUrl: './go-test-can-print-cached-instead-of-actually-running.html',
  styleUrl: './go-test-can-print-cached-instead-of-actually-running.scss'
})
export class GoTestCanPrintCachedInsteadOfActuallyRunningSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats "go test ./..." as always actually executing every test',
      points: [
        'The main page\'s own theory says only: "go test ./... discovers and runs all _test.go files recursively. Sub-test results are cached for identical inputs." That single clause — "results are cached" — is the entire treatment; it never explains what "identical inputs" means, what a cache hit actually looks like in output, or that a passing test in a log might not have run at all on that invocation.',
        'The official go command documentation is explicit about the mechanism: "go test caches successful package test results to avoid unnecessary repeated running of tests. When the result of a test can be recovered from the cache, go test will redisplay the previous output instead of running the test binary again. When this happens, go test prints \'(cached)\' in place of the elapsed time in the summary line."',
        'The cache key is narrower than "the whole environment": "the rule for a match in the cache is that the run involves the same test binary and the flags on the command line come entirely from a restricted set of \'cacheable\' test flags" (including -run, -v, -short, -parallel, -timeout, and a handful of others) — any OTHER flag, or any change to the test binary itself (source changes), invalidates the cache and forces a real re-run.',
      ]
    },
    {
      heading: 'What the cache does and does not track — and the exact fix',
      points: [
        'The documentation adds one further, easy-to-miss nuance: "Tests that open files within the package\'s module or that consult environment variables only match future runs in which the files and environment variables are unchanged." Go tracks file reads within the module and known environment variable reads — it does not track arbitrary external state a test might depend on (a live network call\'s response, a database\'s current row count, the system clock) that isn\'t expressed as a file read or an environment variable.',
        'Practical consequence: a test hitting a real external dependency (skipped in most suites, but common in integration-style tests gated by a build tag or env var) can show "(cached) PASS" on a CI re-run even though the external system\'s actual behavior changed since the last run — because from go test\'s own cache-matching perspective, nothing IT tracks changed, so it redisplays the old, stale result instead of re-executing anything.',
        'The documented fix for this exact situation: "the idiomatic way to disable test caching explicitly is to use -count=1." This bypasses the cache-matching logic entirely and forces every test to actually re-run, regardless of whether go believes its tracked inputs are unchanged — the standard recommendation for CI pipelines or local debugging sessions where "the test genuinely ran just now" needs to be a guarantee, not an inference.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What a cache hit actually looks like',
      language: 'typescript',
      code: `// First run -- actually executes, records the result in the cache:
// $ go test ./math/...
// ok      github.com/alice/myapp/math       0.412s

// Immediately running the exact same command again, with no
// source changes in between:
// $ go test ./math/...
// ok      github.com/alice/myapp/math       (cached)
//
// Per the go command's own documentation: "go test prints '(cached)'
// in place of the elapsed time in the summary line" -- the test
// binary was NOT re-executed here. This is the previous PASS result,
// redisplayed.

// Touching a source file (even a no-op whitespace change) and
// running again invalidates the cache -- this run DOES re-execute:
// $ touch math/add.go && go test ./math/...
// ok      github.com/alice/myapp/math       0.398s`,
    },
    {
      label: 'What the cache does NOT track -- and the fix',
      language: 'typescript',
      code: `// A test that depends on external state the cache cannot see:
func TestFeatureFlagIsEnabled(t *testing.T) {
    // Calls a real, live remote config service -- not a file read,
    // not an environment variable. Per the go command's own docs,
    // this kind of dependency is simply invisible to the cache
    // matching rule ("files within the package's module" and
    // "environment variables" are the only external inputs tracked).
    enabled := fetchFeatureFlag("new-checkout-flow")
    if !enabled {
        t.Fatal("expected new-checkout-flow to be enabled")
    }
}

// Day 1: the flag is enabled. Test passes, result is cached.
// $ go test -run TestFeatureFlagIsEnabled ./...
// ok      github.com/alice/myapp   0.891s

// Day 2: someone disables the flag remotely. No Go source changed,
// no tracked environment variable changed. Running the exact same
// command reports the STALE, day-1 result:
// $ go test -run TestFeatureFlagIsEnabled ./...
// ok      github.com/alice/myapp   (cached)
//
// The test did not actually run against today's (now-failing)
// state at all -- per the docs, this is exactly what "(cached)"
// means: redisplayed output, not a fresh execution.

// The fix -- force a real run, bypassing the cache entirely:
// $ go test -count=1 -run TestFeatureFlagIsEnabled ./...
// --- FAIL: TestFeatureFlagIsEnabled (0.34s)
//     flag_test.go:9: expected new-checkout-flow to be enabled
// FAIL`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A CI pipeline runs go test ./... on every commit and has been green for a week. A developer is confused: they are certain they broke a specific integration test two commits ago (it depends on a real external payment sandbox that started rejecting a certain request shape), yet CI keeps reporting that package as passing with "(cached)" next to it. Using this subtopic\'s theory, explain why CI can report a stale pass here, and identify the specific external dependency category — from this subtopic\'s theory — that explains why Go\'s cache never noticed the sandbox\'s behavior changed.',
    hint: 'Per this subtopic\'s theory, what two kinds of external input does the go test cache actually track when deciding whether a previous result still applies? Does a live network call to a third-party sandbox fall into either of those two tracked categories?',
    solution: 'This subtopic\'s theory identifies exactly two categories of external input the cache tracks: files read within the package\'s module, and environment variables. A live network call to an external payment sandbox is neither — it is not a file read within the module, and it is not an environment variable lookup, so per the documentation\'s own wording, this dependency is simply invisible to "the rule for a match in the cache." If the developer\'s two most recent commits did not touch any Go source file in that package (a plausible scenario if the actual behavioral change happened entirely on the SANDBOX\'s side, not in the developer\'s own code), go test has no tracked signal telling it anything changed, so it keeps redisplaying the old cached PASS result — exactly the mechanism this subtopic\'s second code example demonstrates with a feature-flag service instead of a payment sandbox. The fix is the same either way: running with -count=1 (or changing the test binary itself, e.g. by touching a source file) forces an actual re-execution against the sandbox\'s CURRENT behavior, which per the developer\'s own suspicion would now correctly surface as a failure instead of a stale cached pass.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A test package reporting "ok" with a normal elapsed time in go test output always means the test binary actually executed on that specific invocation.',
      reality: 'This subtopic\'s theory and first code example show "(cached)" appears in place of the elapsed time specifically to signal the OPPOSITE — per the go command\'s own documentation, "go test will redisplay the previous output instead of running the test binary again" when a cache match is found. A normal-looking elapsed time (not "(cached)") is the actual signal that real execution happened.'
    },
    {
      thought: 'go test\'s result cache tracks anything a test might depend on — network calls, database state, the system clock — since otherwise caching would obviously produce wrong results.',
      reality: 'This subtopic\'s theory quotes the documentation\'s own narrower scope directly: only "files within the package\'s module" and "environment variables" are tracked for cache invalidation. Any other external dependency — a live network call, database state, wall-clock time — is invisible to the cache, which is exactly what makes the stale-pass scenario in this subtopic\'s exercise possible.'
    },
    {
      thought: 'Since go test caching can hide a stale result, it is unsafe to rely on and should always be disabled with -count=1 on every single run, including routine local development.',
      reality: 'This subtopic\'s theory presents -count=1 as the fix for a SPECIFIC failure mode (external state outside the two tracked categories changing without a matching source change) — the caching mechanism itself is documented, intentional behavior that saves real time on genuinely unchanged packages. The targeted fix is using -count=1 when testing something outside the cache\'s tracked inputs, not disabling caching universally.'
    }
  ];
}
