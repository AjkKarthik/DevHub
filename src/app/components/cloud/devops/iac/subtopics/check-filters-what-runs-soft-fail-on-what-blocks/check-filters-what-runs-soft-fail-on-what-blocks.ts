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
  templateUrl: './check-filters-what-runs-soft-fail-on-what-blocks.html',
  styleUrl: './check-filters-what-runs-soft-fail-on-what-blocks.scss'
})
export class CheckFiltersWhatRunsSoftFailOnWhatBlocksSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Checkov code tab shows two commands back to back that look like two examples of one idea',
      points: [
        'The main page\'s own "Policy as Code with Checkov" code tab runs `checkov -d infra/ --framework terraform --check CKV_AZURE_1,CKV_AZURE_35` on one line, then `checkov -d infra/ --soft-fail-on LOW,MEDIUM` a few lines later — both presented under the same "Policy as Code" heading, with brief inline comments explaining what the two specific check IDs mean, but nothing distinguishing what the two commands\' FILTERING FLAGS actually do differently.',
        'They are not two variations on the same idea — Checkov\'s own documentation describes `--check` as controlling "which checks run or do not run for the overall scan," while `--soft-fail-on` "specif[ies] which failed checks will result in a soft fail result" — one flag decides what gets EVALUATED AT ALL, the other decides what happens AFTER a check has already run and failed.',
      ]
    },
    {
      heading: 'Why running the main page\'s own two commands as if they were interchangeable produces very different scan coverage',
      points: [
        'The first command, `--check CKV_AZURE_1,CKV_AZURE_35`, is an ALLOWLIST — per Checkov\'s own docs, "any check that is equal to or greater than that severity will be included" when severities are used, but for explicit check IDs like this, only those exact checks run at all. Every other check Checkov knows about (hundreds, covering S3 buckets, IAM policies, network rules, and more) is simply never evaluated — not run, not reported, not soft-failed, nothing.',
        'The second command, `--soft-fail-on LOW,MEDIUM` with no `--check` filter at all, runs the FULL default check set — every applicable rule Checkov has — and only changes what happens to LOW/MEDIUM findings specifically: per Checkov\'s own docs, "any failed check that does not match a criteria in the soft-fail list will result in an error exit code." HIGH/CRITICAL findings still fail the build; LOW/MEDIUM findings are reported but don\'t block.',
        'A team that copies the FIRST command into CI, believing it\'s "the Checkov step" this page recommends, gets a pipeline that only ever checks for two specific misconfigurations (HTTPS-only storage, no public blob access) and is structurally blind to everything else Checkov could catch — a very different, much narrower guarantee than the SECOND command\'s "check everything, but don\'t block on minor findings" approach, despite both appearing in the same code tab under the same heading with no comment marking this distinction.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own first command -- a narrow allowlist, not a starter example',
      language: 'bash',
      code: `# The main page's own exact command:
checkov -d infra/ --framework terraform --check CKV_AZURE_1,CKV_AZURE_35
# CKV_AZURE_1  = storage account requires HTTPS
# CKV_AZURE_35 = storage account public blob access disabled

# Per Checkov's own docs, --check controls "which checks run or
# do not run for the overall scan" -- with two explicit check IDs
# listed, ONLY those two checks are evaluated. Every other rule in
# Checkov's default set (S3/storage account misconfigurations
# beyond these two, open security groups, missing encryption,
# overly permissive IAM, hundreds of others) is not run AT ALL --
# not reported, not soft-failed, simply skipped entirely.

# A team assuming this command represents "running Checkov" on
# their infra gets exactly two specific guarantees and nothing
# else -- a scan this narrow is really a targeted spot-check, not
# a general security gate.`,
    },
    {
      label: 'The main page\'s own second command -- full coverage, selective blocking',
      language: 'bash',
      code: `# The main page's own exact command, no --check filter at all:
checkov -d infra/ --soft-fail-on LOW,MEDIUM

# Per Checkov's own docs, --soft-fail-on "specif[ies] which failed
# checks will result in a soft fail" -- this does NOT limit which
# checks run. Every default check Checkov has still executes
# against every applicable resource.
#
# What changes: findings at LOW or MEDIUM severity are reported
# but don't fail the build (a "soft fail"). Per Checkov's own docs,
# "any failed check that does NOT match a criteria in the soft-fail
# list will result in an error exit code" -- meaning HIGH and
# CRITICAL findings still block the pipeline exactly as if no
# --soft-fail-on flag were present at all.

# This is comprehensive-but-forgiving; the first command is
# narrow-but-strict. Using the wrong one for what a team actually
# wants (broad coverage vs. a specific mandatory check) produces
# very different real-world security outcomes from the same tool.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security team mandates that every Terraform PR must be scanned for ALL of Checkov\'s default checks, with HIGH/CRITICAL findings blocking merge and LOW/MEDIUM findings just reported for visibility. An engineer implements this by copying the main page\'s own FIRST Checkov command (`--check CKV_AZURE_1,CKV_AZURE_35`) into the CI pipeline, reasoning "this is the Checkov command from the DevOps docs." A HIGH-severity IAM misconfiguration ships to production a month later, never flagged by CI. Using this subtopic\'s theory, explain the gap.',
    hint: 'Per this subtopic\'s theory, does `--check CKV_AZURE_1,CKV_AZURE_35` run Checkov\'s full default rule set with those two IDs highlighted, or does it run ONLY those two checks and nothing else?',
    solution: 'The engineer implemented a fundamentally different scan than the security team actually mandated — per this subtopic\'s theory, `--check CKV_AZURE_1,CKV_AZURE_35` is an allowlist that, per Checkov\'s own docs, controls "which checks run... for the overall scan" — with those two specific IDs listed, ONLY those two checks ever execute. The HIGH-severity IAM misconfiguration was never caught because the check that would have flagged it was never even run — it isn\'t a LOW/MEDIUM finding that got soft-failed, it\'s a check that was entirely absent from the allowlist the engineer configured. The security team\'s actual requirement (full coverage, selective blocking by severity) matches the main page\'s own SECOND command instead — `checkov -d infra/ --soft-fail-on LOW,MEDIUM` with no `--check` filter — which runs every default check and only changes the pass/fail consequence for LOW/MEDIUM findings specifically, leaving HIGH/CRITICAL findings (including the IAM misconfiguration) fully able to block the build.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own two Checkov commands — one with --check and one with --soft-fail-on — are two equally-valid starting points for "running Checkov in CI," and either one gives roughly the same security coverage.',
      reality: 'Per this subtopic\'s theory, they produce genuinely different scan scope — `--check` with explicit IDs runs ONLY those checks (per Checkov\'s own docs, controlling "which checks run... at all"), while `--soft-fail-on` with no `--check` filter runs the FULL default rule set and only changes which severities can fail the build.'
    },
    {
      thought: '--check CKV_AZURE_1,CKV_AZURE_35 is a reasonable way to start using Checkov broadly, since it\'s just filtering which findings get reported, similar to --soft-fail-on.',
      reality: 'This subtopic\'s exercise shows this assumption has real consequences — `--check` with explicit IDs doesn\'t filter which findings are REPORTED, it filters which checks are RUN at all. Every check not on the allowlist is invisible to the scan entirely, not merely downgraded to non-blocking.'
    },
    {
      thought: 'A HIGH-severity Checkov finding will always block a CI pipeline, regardless of how the checkov command is configured, since HIGH severity is inherently serious.',
      reality: 'Per this subtopic\'s theory, severity alone doesn\'t guarantee a finding gets caught — if the specific check that would flag a HIGH-severity issue isn\'t included in a narrow `--check` allowlist, it never runs in the first place, so there\'s no finding of any severity to block on at all.'
    }
  ];
}
