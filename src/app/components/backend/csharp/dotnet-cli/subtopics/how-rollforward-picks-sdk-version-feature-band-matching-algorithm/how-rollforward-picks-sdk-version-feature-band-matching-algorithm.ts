import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-how-rollforward-picks-sdk-version-feature-band-matching-algorithm-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-rollforward-picks-sdk-version-feature-band-matching-algorithm.html',
  styleUrl: './how-rollforward-picks-sdk-version-feature-band-matching-algorithm.scss',
})
export class HowRollforwardPicksSdkVersionFeatureBandMatchingAlgorithmSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page lists rollForward VALUES ("patch", "latestMinor", etc.) — this covers the ACTUAL algorithm behind them, including the "feature band" concept the table alone doesn\'t explain',
      points: [
        'The main .NET CLI &amp; Tooling page\'s <code>global.json</code> table lists <code>rollForward</code> options like <code>"latestMinor"</code> (recommended) as "same major, latest minor and patch." This describes the OUTCOME correctly, but SDK versions actually encode something more specific than a flat major.minor.patch — they encode a "feature band," and understanding it explains SDK version numbers that otherwise look confusingly non-sequential (why <code>9.0.100</code> jumps to <code>9.0.200</code>, skipping what looks like 100 patch versions).',
      ],
    },
    {
      heading: 'SDK version numbers are major.minor.SBBpp — the feature band digit groups SDK releases independently of the RUNTIME version',
      points: [
        'A .NET SDK version like <code>9.0.203</code> decodes as: major=9, minor=0, then <code>2</code>=feature band, <code>03</code>=patch WITHIN that band. The feature band (the hundreds digit, effectively) increments for SDK-only feature releases — new CLI templates, new <code>dotnet</code> command capabilities, tooling improvements — that ship on their OWN cadence, independent of whether the underlying .NET 9 RUNTIME itself has changed at all. This is why you see SDK versions like <code>9.0.100</code>, <code>9.0.101</code>, <code>9.0.102</code> (patches within feature band 1), then <code>9.0.200</code>, <code>9.0.201</code> (patches within feature band 2) — the jump from <code>...199</code>-style numbers straight to <code>...200</code> is not "100 skipped patches," it is a NEW feature band beginning.',
      ],
    },
    {
      heading: 'rollForward: "latestMinor" specifically means: find the HIGHEST installed feature band within the same major.minor, then the highest patch within THAT band',
      points: [
        'Given <code>global.json</code> pinning <code>"version": "9.0.100"</code> with <code>"rollForward": "latestMinor"</code>, and a machine with SDKs <code>9.0.100</code>, <code>9.0.203</code>, and <code>9.0.304</code> installed, the resolver does NOT simply pick the numerically highest overall version among ALL installed SDKs blindly — it specifically looks for the HIGHEST feature band available (band 3, since <code>9.0.304</code> exists), and within THAT band, the highest patch (<code>9.0.304</code> itself, since it is the only one in band 3). If band 3 did not exist, it would fall back to band 2\'s highest patch, and so on, always preferring the newest feature band actually installed, at whatever patch level is available within it.',
        'This distinction matters concretely: <code>"rollForward": "feature"</code> (a DIFFERENT, more conservative option) explicitly restricts resolution to the SAME feature band as pinned (or higher, but same MINOR — the exact semantics differ subtly from <code>latestMinor</code>) — meaning a team wanting SDK-feature stability but willing to accept patch updates would choose <code>"feature"</code>, while a team wanting to always ride the latest tooling improvements chooses <code>"latestMinor"</code>. Confusing these two is a real, if subtle, source of "why did CI pick a different SDK feature band than I expected" surprises.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Decoding an SDK version number — major.minor.SBBpp',
      language: 'csharp',
      code: `// dotnet --list-sdks might show:
// 8.0.404
// 9.0.100
// 9.0.101
// 9.0.203
// 9.0.304

// Decoding "9.0.304":
//   9    = major (.NET 9)
//   0    = minor (always 0 for .NET's current versioning scheme)
//   3    = FEATURE BAND — the 3rd SDK feature release for .NET 9
//   04   = patch WITHIN feature band 3 (the 4th patch/servicing release)

// The jump from "9.0.101" to "9.0.203" is NOT "102 patches were
// skipped" — it is: feature band 1's patch series ended at some point
// (maybe .101 was its last release), and feature band 2 STARTED its
// own patch series from .200. Each feature band restarts its OWN
// two-digit patch counter from 00.`,
    },
    {
      label: 'How rollForward: "latestMinor" actually resolves, step by step',
      language: 'csharp',
      code: `// global.json:
{
  "sdk": {
    "version": "9.0.100",
    "rollForward": "latestMinor"
  }
}

// Installed SDKs on this machine (via dotnet --list-sdks):
// 8.0.404
// 9.0.100
// 9.0.101
// 9.0.203
// 9.0.304

// THE ACTUAL RESOLUTION ALGORITHM for "latestMinor":
// 1. Filter to the SAME major.minor as pinned (9.0.xxx) — this
//    EXCLUDES 8.0.404 immediately, regardless of how new it is.
// 2. Among the remaining 9.0.xxx candidates, identify the HIGHEST
//    feature band actually INSTALLED — here, feature band 3
//    (from 9.0.304), since bands 1 and 2 are also present but LOWER.
// 3. Within that highest feature band, pick the highest patch
//    available — 9.0.304 (the only patch in band 3 on this machine).
//
// RESULT: dotnet commands in THIS repo resolve to SDK 9.0.304 —
// NOT simply "the newest installed SDK overall" (which happens to
// also be 9.0.304 here, but that is NOT how the algorithm actually
// reasons about it — it explicitly prefers the newest FEATURE BAND
// first, then the newest patch within it, always constrained to the
// pinned major.minor).

// dotnet --version  (run from this repo's directory)
// → 9.0.304`,
    },
    {
      label: '"latestMinor" vs "feature" — a real, subtle difference',
      language: 'csharp',
      code: `// SAME installed SDKs as before: 9.0.100, 9.0.101, 9.0.203, 9.0.304

// With rollForward: "feature" and pinned version "9.0.100":
{
  "sdk": { "version": "9.0.100", "rollForward": "feature" }
}
// "feature" restricts resolution to SDKs with a feature band >= the
// PINNED feature band (band 1, from "9.0.100"), but does NOT
// necessarily jump to the HIGHEST available band the way "latestMinor"
// does in every case — the exact tie-breaking and fallback behavior
// differs from "latestMinor" specifically in edge cases involving
// which bands/patches are actually present. In THIS specific example,
// both would happen to resolve to 9.0.304 — but the point is that
// "feature" and "latestMinor" are NOT simply synonyms with different
// names; they encode genuinely different resolution POLICIES, and a
// machine's specific mix of installed feature bands can make them
// diverge in ways that only become visible when the exact set of
// installed SDKs differs from this example.

// THE PRACTICAL TAKEAWAY: teams choosing between "feature" and
// "latestMinor" should verify their ACTUAL choice against a REALISTIC
// set of installed SDKs (matching what CI runners and developer
// machines really have), rather than assuming the two options are
// interchangeable "roll forward, but a little differently" settings —
// run "dotnet --version" from the repo root after any global.json
// change and confirm it resolves to the SDK you actually expect.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A CI runner has SDKs <code>9.0.100</code> and <code>9.0.101</code> installed (feature band 1 only — no band 2 or 3 available on this particular runner image). The repo\'s <code>global.json</code> pins <code>"version": "9.0.100"</code> with <code>"rollForward": "latestMinor"</code>. Explain which SDK version actually gets used, and why "latestMinor" does not mean "always jump to the newest feature band available anywhere."',
    hint: 'The algorithm only considers feature bands and patches that are ACTUALLY INSTALLED on the current machine — it cannot select a band 2 or 3 SDK that simply does not exist on this specific runner, no matter how "latest" the setting name sounds.',
    solution: `// global.json:
{
  "sdk": {
    "version": "9.0.100",
    "rollForward": "latestMinor"
  }
}

// Installed on THIS runner: 9.0.100, 9.0.101 — feature band 1 ONLY.
// (Bands 2 and 3 from the earlier example simply do not exist here —
// this is a DIFFERENT machine with a different, older SDK image.)

// THE RESOLUTION:
// 1. Filter to major.minor 9.0.xxx — both installed SDKs qualify.
// 2. Identify the HIGHEST feature band ACTUALLY INSTALLED — here,
//    that is band 1 (the ONLY band present at all on this runner),
//    not band 2 or 3, because those simply do not exist as options
//    to even consider.
// 3. Within band 1, pick the highest patch — 9.0.101.
//
// RESULT: dotnet --version on THIS runner resolves to 9.0.101.
//
// WHY THIS DOES NOT CONTRADICT "latestMinor": the setting name can be
// misleading if read as "always finds the absolute latest SDK
// anywhere" — but the algorithm is fundamentally CONSTRAINED to
// whatever is ACTUALLY INSTALLED on THIS SPECIFIC MACHINE. It cannot
// conjure a feature-band-3 SDK into existence just because the setting
// says "latest" — "latest" means "the latest AVAILABLE option among
// what's installed here," not "the latest version that exists
// anywhere in the world." This is precisely why global.json's
// rollForward setting does NOT, by itself, guarantee identical SDK
// versions across every machine — it guarantees "resolve to the best
// AVAILABLE match for this pin, given what happens to be installed
// on THIS machine," which is why CI runner images should be updated
// periodically to keep pace with newer feature bands used elsewhere,
// rather than relying on rollForward alone to bridge an out-of-date
// runner image and a team's actual expected SDK version.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"rollForward": "latestMinor" always resolves to the absolute newest .NET SDK version that exists, regardless of what happens to be installed on the current machine.',
      reality: 'the resolution algorithm is fundamentally constrained to SDKs actually installed on that specific machine — it finds the highest feature band and patch AVAILABLE there, and cannot select a version that simply is not installed, no matter how the setting name sounds.',
    },
    {
      thought: 'the jump between SDK version numbers like 9.0.101 and 9.0.203 means 101 patch releases were skipped.',
      reality: 'SDK versions encode a feature band digit (the hundreds place) that increments for SDK-only feature releases independent of patch count — each new feature band restarts its own two-digit patch counter from 00, so the jump reflects a new feature band beginning, not skipped patches.',
    },
    {
      thought: '"rollForward": "feature" and "rollForward": "latestMinor" are just two names for the same "always use the newest compatible SDK" behavior.',
      reality: 'they encode genuinely different resolution policies around which feature bands are eligible and how ties are broken — teams should verify their actual choice against the specific SDKs installed on their real CI runners and developer machines rather than assuming the two are interchangeable.',
    },
  ];
}
