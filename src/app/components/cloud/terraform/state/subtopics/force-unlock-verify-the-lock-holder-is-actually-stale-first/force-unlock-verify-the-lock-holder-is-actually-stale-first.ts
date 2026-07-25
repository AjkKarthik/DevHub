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
  templateUrl: './force-unlock-verify-the-lock-holder-is-actually-stale-first.html',
  styleUrl: './force-unlock-verify-the-lock-holder-is-actually-stale-first.scss'
})
export class ForceUnlockVerifyTheLockHolderIsActuallyStaleFirstSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the rule but not how to actually follow it',
      points: [
        'The main page\'s quick reference says <code>terraform force-unlock</code> is for releasing "a stuck state lock (after confirming no concurrent run)." The theory repeats this: "use terraform force-unlock LOCK_ID after verifying no other apply is running." Both mentions state the RULE — verify first — without ever showing HOW to actually verify it.',
      ]
    },
    {
      heading: 'The lock error message itself carries the verification information',
      points: [
        'When <code>terraform plan</code>/<code>apply</code> fails to acquire a lock, the error Terraform prints is not just "locked" — it includes the Lock ID, WHO holds it (the identity/user that acquired it), the operation type (plan or apply), and WHEN it was created. This information is the starting point for genuinely verifying staleness, not just a formality to read past on the way to running <code>force-unlock</code>.',
        'The practical check: if the lock holder identifies a CI/CD runner, confirm in the CI system whether that specific pipeline run is still actively executing. If it identifies a person, the safest verification is directly asking them whether they currently have a Terraform operation running — the lock error alone cannot distinguish "genuinely crashed and abandoned" from "still slowly running."',
      ]
    },
    {
      heading: 'force-unlock has no way to check the state file\'s own integrity — that is a separate, follow-up step',
      points: [
        'force-unlock releases the LOCK — it does not inspect or validate whether the state file itself was left in a consistent state by whatever process was interrupted. If the original operation was killed mid-WRITE (not just mid-wait), the state file underneath the now-released lock could itself be incomplete or corrupted, independent of the lock being stale or not.',
        'The recommended follow-up after any <code>force-unlock</code>, regardless of how confident the staleness verification was, is running <code>terraform state pull</code> and reviewing the retrieved state before running any further plan/apply — a cheap, read-only sanity check that catches an incomplete write the unlock itself cannot detect.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The lock error carries the verification data',
      language: 'bash',
      code: `$ terraform apply
Error: Error acquiring the state lock

Lock Info:
  ID:        7a4f2e91-3c8d-4b1a-9f6e-2d5c8a1b3e7f
  Path:      prod/terraform.tfstate
  Operation: OperationTypeApply
  Who:       ci-runner-42@github-actions
  Version:   1.7.5
  Created:   2026-07-25 03:14:22 UTC

# This is NOT just a formality to read past -- it is the
# actual data needed to verify staleness before force-unlock:
# - "Who" identifies WHICH runner/person to actually check
# - "Created" timestamp tells you how long it's been held
# - "Operation" tells you whether it was a quick plan or a
#   longer-running apply, informing how suspicious the age is`,
    },
    {
      label: 'The verification step, then the follow-up state check',
      language: 'bash',
      code: `# Step 1: Actually verify using the lock info -- don't skip
# straight to force-unlock just because the error is annoying.
# - Check the CI system: is ci-runner-42's pipeline run
#   (matching the timestamp) still actively executing?
# - If it names a person: ask them directly, right now, whether
#   they have a Terraform operation currently running.

# Step 2: Only once genuinely confirmed stale --
terraform force-unlock 7a4f2e91-3c8d-4b1a-9f6e-2d5c8a1b3e7f

# Step 3: force-unlock only releases the LOCK -- it cannot
# tell you whether the interrupted process left state itself
# incomplete. Always follow up with a read-only check:
terraform state pull > /tmp/post-unlock-state-check.json
# Review this before running any further plan/apply -- catches
# a mid-write corruption the unlock step itself can't detect.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A terraform apply fails with "Error acquiring the state lock," showing Who: ci-runner-42@github-actions and a Created timestamp from 40 minutes ago. Following only the main page\'s own stated rule ("verify no other apply is running"), a teammate immediately runs terraform force-unlock without checking anything further, since the lock has clearly been held "a while." What two concrete verification steps does the lock error actually enable that were skipped, and what follow-up check should happen even after a genuinely confirmed-stale unlock?',
    hint: 'The lock error message contains specific fields beyond just "locked" — what do they actually let you check, concretely, rather than just assuming staleness from how long ago the timestamp shows?',
    solution: 'The two skipped verification steps are: (1) using the "Who" field (ci-runner-42@github-actions) to actually check in the CI system whether that specific pipeline run is still executing — a 40-minute-old apply could be genuinely still running for a large, slow-provisioning configuration, not necessarily stale just because it is "a while"; (2) using the "Operation" field to gauge whether 40 minutes is actually suspicious for that operation type, rather than assuming any older lock is automatically dead. Even after genuinely confirming the lock is stale and running force-unlock, the follow-up step still matters: force-unlock only releases the lock, it cannot verify whether the interrupted process left the state file itself in a consistent state — running terraform state pull and reviewing the result before any further plan/apply is the recommended check to catch a mid-write corruption the unlock step itself cannot detect.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The lock error message is mostly noise to skim past on the way to running force-unlock — the important part is just knowing a lock exists.',
      reality: 'Per this subtopic\'s theory, the lock error\'s Who/Operation/Created fields are the actual data needed to genuinely verify staleness — checking a specific CI run or asking a specific person, rather than skimming past to force-unlock on assumption.'
    },
    {
      thought: 'A lock that has been held for a long time (many minutes) can be safely assumed stale without any further check, since a normal operation should have finished by then.',
      reality: 'Per this subtopic\'s theory, how long is "too long" depends on the specific operation — a large or slow-provisioning configuration can legitimately hold a lock for an extended time, which is exactly why the lock error\'s own Operation and Who fields need to be actually checked rather than judged by elapsed time alone.'
    },
    {
      thought: 'Once force-unlock successfully releases a lock, the state file is confirmed safe to use for the next plan/apply.',
      reality: 'Per this subtopic\'s theory, force-unlock only releases the LOCK — it has no way to check whether the interrupted process left the underlying state file itself incomplete or corrupted, which is why a terraform state pull review is the recommended follow-up regardless of how confident the staleness verification was.'
    }
  ];
}
