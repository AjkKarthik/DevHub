import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-inside-backtracking-engine-nested-quantifiers-traced-step-by-step-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './inside-backtracking-engine-nested-quantifiers-traced-step-by-step.html',
  styleUrl: './inside-backtracking-engine-nested-quantifiers-traced-step-by-step.scss',
})
export class InsideBacktrackingEngineNestedQuantifiersTracedStepByStepSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states nested quantifiers cause "exponential time" — this is exactly what that explosion looks like',
      points: [
        'The main Regular Expressions page states that <code>(a+)+$</code> "backtracks exponentially on crafted input" without showing WHY. .NET\'s default regex engine is a BACKTRACKING engine (similar to Perl/PCRE) — it explores possible ways to match a pattern one choice at a time, and when a later part of the pattern fails, it goes BACK to try a different choice at an earlier decision point. Nested quantifiers create an enormous number of equally-valid ways to split the SAME input among themselves — and the engine tries all of them before giving up.',
      ],
    },
    {
      heading: 'The inner quantifier alone already has multiple ways to consume a run of "a"s — the outer quantifier multiplies that further',
      points: [
        'Given four consecutive "a" characters, the inner <code>a+</code> alone could consume them as one group of 4, or split as (1+3), (2+2), (3+1), (1+1+2), and so on — every possible way of partitioning the run into one-or-more non-empty pieces. The OUTER <code>(...)+</code> quantifier then repeats that inner group one-or-more times, meaning the SAME four characters can also be split ACROSS multiple outer repetitions in every possible combination.',
        'The total number of ways to partition N identical characters among nested one-or-more quantifiers grows like 2^N (related to the "compositions of N" count in combinatorics) — for N=30, that is over a BILLION distinct partitionings the engine may need to try before it can conclusively determine the overall pattern does not match the input (because of the trailing "!" that breaks the anchored <code>$</code>).',
      ],
    },
    {
      heading: 'A small trace makes the explosion concrete — even N=4 already shows the branching',
      points: [
        'For the input "aaaa" against <code>(a+)+</code> (ignoring the anchor for a moment), the inner <code>a+</code> can grab all 4 a\'s in one outer iteration, or the outer <code>+</code> can repeat with the inner group grabbing progressively smaller chunks each time — 1+1+1+1, 1+1+2, 1+2+1, 2+1+1, 1+3, 3+1, 2+2, or 4 — EIGHT distinct ways to partition just 4 characters. Each of those is a genuine backtracking branch the engine may explore, in the worst case, before concluding failure — and the branch count roughly DOUBLES with each additional character, which is precisely what "exponential" means in practice.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Every way to partition 4 "a"s across (a+)+ — the source of the explosion',
      language: 'csharp',
      code: `// Pattern: (a+)+   Input: "aaaa"  (4 a's, ignoring the anchor for now)
//
// The OUTER (...)+ repeats one-or-more times. Each repetition's INNER
// a+ consumes one-or-more consecutive a's. Every way of splitting the
// 4-character run into consecutive non-empty groups is a DIFFERENT
// way to satisfy the SAME overall pattern:
//
//   [aaaa]            <- one outer iteration, inner grabs all 4
//   [aaa][a]          <- two outer iterations: 3+1
//   [aa][aa]          <- 2+2
//   [a][aaa]          <- 1+3
//   [aa][a][a]        <- 2+1+1
//   [a][aa][a]        <- 1+2+1
//   [a][a][aa]        <- 1+1+2
//   [a][a][a][a]      <- 1+1+1+1
//
// EIGHT distinct partitionings for just 4 characters — this count is
// exactly 2^(N-1) for N characters (a well-known result: the number
// of "compositions" of N). For N=4: 2^3 = 8. For N=30: 2^29, over
// half a billion partitionings.`,
    },
    {
      label: 'Why the trailing "!" forces the engine to try EVERY partitioning before failing',
      language: 'csharp',
      code: `// Full pattern with anchors: ^(a+)+$   Input: "aaaa!"
//
// The trailing "!" means NONE of the 8 partitionings above can ever
// succeed — the $ anchor requires the match to reach the END of the
// string, but "!" is never consumable by (a+)+ at all.
//
// Critically, the engine does NOT know this in advance — it must
// try EACH partitioning, reach the "!" character, fail to match it
// against $, and then BACKTRACK to try the NEXT partitioning. Only
// after EVERY one of the 2^(N-1) partitionings has been tried and
// has failed does the engine conclude the overall match fails.
//
// This is precisely why the failing case (a mismatched trailing
// character) is the WORST case for this pattern shape — a successful
// match can often stop at the FIRST partitioning that works, but a
// failing match must exhaust ALL of them:

var evil = new Regex(@"^(a+)+$"); // NO timeout — for illustration only
// evil.IsMatch("aaaaaaaaaaaaaaaaaaaaaaaaaaaaa!"); // 29 a's + "!" —
// 2^28 partitionings (over 250 million) attempted before failing`,
    },
    {
      label: 'Rewriting to avoid the ambiguity entirely — the real fix, not just a timeout',
      language: 'csharp',
      code: `// The root cause: (a+)+ lets the SAME characters be partitioned in
// exponentially many equivalent ways — the inner and outer quantifiers
// are REDUNDANT with each other for this specific pattern shape.
//
// The genuine fix (beyond matchTimeout/NonBacktracking, which are
// safety nets, not root-cause fixes) is to remove the ambiguity:
// simplify (a+)+ down to what it actually MEANS — which is just a+,
// since nesting a one-or-more quantifier inside another one-or-more
// quantifier adds no new matching power, only ambiguity:

var simplified = new Regex(@"^a+$"); // functionally IDENTICAL matching
                                      // power to ^(a+)+$, with ZERO
                                      // backtracking ambiguity — this
                                      // runs in genuinely linear time,
                                      // no timeout or NonBacktracking
                                      // flag needed at all

// The general lesson: whenever you see a quantifier applied to a
// GROUP that ITSELF contains a quantifier over the same character
// class (e.g. (a+)+, (a*)+, (a+)*), ask whether the outer quantifier
// is actually necessary — very often it is redundant nesting that a
// human introduced accidentally while composing a larger pattern.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Explain why <code>(a|aa)+$</code> is ALSO vulnerable to the same kind of catastrophic backtracking as <code>(a+)+$</code>, even though it does not have an OUTER quantifier wrapping an INNER quantifier.',
    hint: 'Consider whether there is more than one way for the alternation (a|aa) to partition a run of "a" characters across its repetitions — ambiguity can come from alternation, not just nested quantifiers.',
    solution: `// (a|aa)+  against a run like "aaaa":
//
// Even though there's no NESTED quantifier here, the ALTERNATION
// (a|aa) itself creates the same kind of ambiguity — each repetition
// of the outer + can choose to match via the "a" branch OR the "aa"
// branch, and there are multiple ways to combine these choices to
// consume the SAME 4-character run:
//
//   [a][a][a][a]   <- four repetitions, each choosing the "a" branch
//   [aa][aa]       <- two repetitions, each choosing the "aa" branch
//   [aa][a][a]     <- mixed: aa, then a, then a
//   [a][aa][a]     <- mixed: a, then aa, then a
//   [a][a][aa]     <- mixed: a, then a, then aa
//
// This is STRUCTURALLY the same problem as (a+)+ — multiple distinct
// ways to partition the SAME input among repetitions of the pattern —
// it's just that the ambiguity comes from ALTERNATION choices instead
// of quantifier NESTING. Both shapes are classic "catastrophic
// backtracking" triggers, and both are fixed the same way: matchTimeout,
// NonBacktracking, OR removing the redundant ambiguity (here, "aa" is
// just two "a"s, so (a|aa)+ could be simplified to a+ with identical
// matching power and zero backtracking risk, exactly like the
// (a+)+ -> a+ simplification).`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'catastrophic backtracking only happens with explicitly nested quantifiers like (a+)+ — other pattern shapes are safe.',
      reality: 'any pattern shape that creates MULTIPLE ways to partition the same input among repeated sub-patterns is vulnerable — alternation like (a|aa)+ causes the identical exponential blowup, since the ambiguity comes from ANY source of multiple valid partitionings, not specifically nested quantifiers.',
    },
    {
      thought: 'matchTimeout and RegexOptions.NonBacktracking are the only ways to deal with a catastrophically backtracking pattern.',
      reality: 'many vulnerable patterns (like (a+)+) can be rewritten to remove the redundant ambiguity entirely — (a+)+ simplifies to a+ with identical matching power and zero backtracking risk, making matchTimeout/NonBacktracking unnecessary for that specific pattern.',
    },
    {
      thought: 'the exponential blowup only happens when a pattern successfully matches a huge, complex input.',
      reality: 'the WORST case is actually a FAILING match — a successful match can often stop at the first partitioning that works, but proving a pattern definitively does NOT match requires exhausting every possible partitioning, which is exactly why a mismatched trailing character (like a trailing "!") triggers the full exponential cost.',
    },
  ];
}
