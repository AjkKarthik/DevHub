import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Recommended Tool That Quietly Stopped Being Maintained',
    points: [
      'The main page originally named Optic alongside <code>openapi-diff</code> and Bump.sh, in six separate places, as a still-current tool for detecting breaking changes between two OpenAPI spec versions. Checking GitHub directly (the primary source, not a blog post) shows <code>opticdev/optic</code> was archived by its own maintainers on January 12, 2026 — "This repository was archived by the owner... It is now read-only" — following a 2024 Atlassian acquisition that never shipped the promised integration into Atlassian\'s own developer-experience tooling.',
      'This has now been fixed on the main page — every "still current" mention of Optic was replaced with <code>oasdiff</code>, the actively-maintained open-source tool that covers the identical use case (a CLI plus a GitHub Action that diffs two OpenAPI specs and classifies each change as breaking or non-breaking) — with a single explanatory note about the archival kept in the theory section rather than silently erased.',
      'A SEPARATE, related inaccuracy on the same page: a quiz question grouped Spectral alongside <code>openapi-diff</code> and Optic as a tool that "compares two OpenAPI spec versions." Spectral is structurally a different kind of tool — a linter that validates a SINGLE spec against a style ruleset (naming conventions, required descriptions). It has no mechanism for loading two spec versions and diffing them, and cannot detect breaking changes on its own — this has also been corrected.',
      'This is a distinct kind of "verify before trusting" bug from the code-logic bugs this hub usually finds: no line of code was ever wrong here — every claim was checking whether a NAMED THIRD-PARTY TOOL is still the tool a reader should actually reach for, which only a direct check of that tool\'s own current status (not the reasonableness of the surrounding prose) can catch.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Tool-Health Check, Concretely',
    language: 'typescript',
    code: `// A minimal illustration of what "verify a tool is still maintained"
// actually means mechanically -- parsing the same signal GitHub itself
// surfaces on an archived repo's own page.
interface RepoStatus {
  archived: boolean;
  archivedAt?: string;
  pushedAt: string; // last commit timestamp, ISO 8601
}

function assessToolHealth(status: RepoStatus, nowMs: number): 'healthy' | 'archived' | 'stale' {
  if (status.archived) return 'archived';

  const daysSinceLastPush = (nowMs - Date.parse(status.pushedAt)) / (1000 * 60 * 60 * 24);
  if (daysSinceLastPush > 365) return 'stale'; // no commits in over a year

  return 'healthy';
}

// Optic's own repo status, as confirmed directly from github.com/opticdev/optic
// on 2026-09-01:
const opticStatus: RepoStatus = {
  archived: true,
  archivedAt: '2026-01-12',
  pushedAt: '2025-08-01', // approximate date of the final v1.0.9 release
};

console.log(assessToolHealth(opticStatus, Date.parse('2026-09-01'))); // 'archived'

// oasdiff, by contrast (illustrative -- verify the real repo before trusting
// this specific snapshot too):
const oasdiffStatus: RepoStatus = {
  archived: false,
  pushedAt: '2026-08-20',
};

console.log(assessToolHealth(oasdiffStatus, Date.parse('2026-09-01'))); // 'healthy'

// The point isn't this specific function -- it's the HABIT: before adopting
// a tool a tutorial, blog post, or documentation page names, check the
// tool's OWN repository directly for an archived banner or a last-commit
// date, the same way this fix was made by checking github.com/opticdev/optic
// directly rather than trusting a single secondary source.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A blog post from 2023 recommends a CI tool with the sentence "actively maintained by a small team." You check the tool’s GitHub repo directly and see its last commit was 14 months ago, with no archived banner. Using <code>assessToolHealth()</code> from the codeTab, what status would this tool report, and is that the same as "archived"?',
  hint: 'The repo has no <code>archived: true</code> flag set — walk through what the function checks BEFORE it ever looks at the push date, and what <code>daysSinceLastPush</code> evaluates to for a 14-month gap.',
  solution: `// archived: false -- the function's first check does not trigger.
// 14 months = ~426 days, which is > 365.
//
// assessToolHealth({ archived: false, pushedAt: '<14 months ago>' }, now)
//   -> 'stale'
//
// 'stale' is a DIFFERENT, weaker signal than 'archived'. An archived repo
// is a DEFINITIVE, deliberate maintainer decision -- the project will
// never receive another update, full stop. A stale repo might just be
// feature-complete and quietly still working (a legitimate reason for a
// low commit rate), or it might be genuinely abandoned -- the last-commit
// signal alone can't distinguish the two. Optic's OWN status was the
// stronger, unambiguous 'archived' signal, which is exactly why it was
// safe to treat as a hard fact requiring a fix, not a softer judgment
// call the way a merely-stale repo would be.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A tool named in an educational resource (a tutorial, a docs page, a blog post) was presumably correct when written, so it’s still safe to recommend today without re-checking.',
    reality: 'Tool recommendations go stale the same way library-version claims or API defaults do — this page itself named Optic as current in six separate places, and by the time this correction was made, the tool had already been archived by its own maintainers for over half a year. Verifying a NAMED TOOL’s current status is a distinct check from verifying the surrounding technical claim is logically sound.',
  },
  {
    thought: 'Since Spectral and openapi-diff/oasdiff are both "OpenAPI tools mentioned in the same breath," they’re roughly interchangeable for detecting breaking changes.',
    reality: 'They solve genuinely different problems: Spectral lints ONE spec against style rules (is this field named consistently, does every endpoint have a description) and has no concept of "the previous version" at all; openapi-diff/oasdiff load TWO spec versions and report what changed between them. A team relying on Spectral alone to catch a removed required field would find nothing, since Spectral never sees the earlier version to compare against.',
  },
  {
    thought: 'GitHub’s "archived" status is mostly cosmetic — an archived repo can still receive community-maintained forks or patches through the same channel.',
    reality: 'Archiving a GitHub repo makes it read-only at the platform level — no new commits, issues, or pull requests can be merged into it at all. A fork can continue independently under a new name, but the ORIGINAL repository itself is permanently frozen at whatever state it was in when archived, exactly what happened to <code>opticdev/optic</code> at its final v1.0.9 release.',
  },
];

@Component({
  selector: 'app-api-breaking-changes-optic-archived',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './verifying-a-recommended-tool-is-still-maintained.html',
  styleUrl: './verifying-a-recommended-tool-is-still-maintained.scss',
})
export class VerifyingARecommendedToolIsStillMaintainedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
