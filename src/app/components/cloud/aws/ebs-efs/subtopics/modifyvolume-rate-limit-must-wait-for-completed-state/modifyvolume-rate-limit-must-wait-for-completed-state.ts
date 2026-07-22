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
  templateUrl: './modifyvolume-rate-limit-must-wait-for-completed-state.html',
  styleUrl: './modifyvolume-rate-limit-must-wait-for-completed-state.scss'
})
export class ModifyvolumeRateLimitMustWaitForCompletedStateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents ModifyVolume as an instant, repeatable action',
      points: [
        'The main page\'s own "EBS Operations" theory bullet says: "ModifyVolume allows online resizing and type changes — no downtime for most volume types on Nitro-based instances." Its own code tab shows a single modify-volume call with no mention of what happens if you need to modify the SAME volume again shortly after.',
        'Nothing in the main page\'s own coverage suggests there is any limit on how often — or how soon — you can issue a second ModifyVolume request against the same volume.',
      ]
    },
    {
      heading: 'A volume must reach the completed state before it can be modified again — up to 4 times per rolling 24 hours',
      points: [
        'Per AWS\'s own documentation: "After you initiate a volume modification, you must wait for that modification to reach the completed state before you can initiate another modification for the same volume. You can modify a volume up to four times within a rolling 24-hour period, as long as the volume is in the in-use or available state, and all previous modifications for that volume are completed."',
        'This is a real operational constraint, not just a theoretical limit: AWS\'s own guidance notes a modification "can take from a few minutes to a few hours to complete," and specifically calls out that "a 1-TiB volume can take up to six hours to be modified" — meaning a second, urgently-needed modification (say, bumping IOPS again after realizing the first change wasn\'t enough) can be blocked for HOURS, not seconds, waiting for the first modification to reach completed.',
        'If you exceed the 4-modifications-per-rolling-24-hours limit, AWS\'s own documentation states you get an error message that tells you when the next modification is allowed — this is a hard quota, not just a recommendation, and there is no API call to bypass or expedite it.',
        'One size-increase nuance the main page\'s own "no downtime" framing glosses over: per AWS\'s own documentation, "size increases take effect once the volume modification reaches the optimizing state, which usually takes a few seconds" — so a SIZE increase is usable almost immediately, but the modification as a WHOLE (and therefore eligibility to modify again) doesn\'t reach completed until the full re-optimization finishes, which is the multi-hour part.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Hitting the wait-for-completed constraint',
      language: 'bash',
      code: `# Matching the main page's own example: resize + IOPS bump
aws ec2 modify-volume --volume-id vol-0abc123 --size 400 --iops 10000

# Check modification state
aws ec2 describe-volumes-modifications --volume-ids vol-0abc123 \\
  --query 'VolumesModifications[0].{State:ModificationState,Progress:Progress}'
# { "State": "optimizing", "Progress": 35 }
# -- the SIZE increase (400 GiB) is already usable at this point,
# per AWS's own documentation -- but the modification as a whole is
# NOT yet "completed".

# An engineer realizes 10,000 IOPS still isn't enough and tries to
# bump it further, immediately:
aws ec2 modify-volume --volume-id vol-0abc123 --iops 16000
# An error occurred (IncorrectModificationState): You cannot modify
# vol-0abc123. A previous modification for vol-0abc123 is still in
# progress.
# -- exactly the constraint the main page's own coverage never
# mentions -- you cannot queue up a second change while the first
# is still optimizing, no matter how urgent.

# Waiting for the first modification to actually reach completed --
# for a large volume, per AWS's own guidance, this can take HOURS:
aws ec2 wait volume-in-use --volume-ids vol-0abc123
aws ec2 describe-volumes-modifications --volume-ids vol-0abc123 \\
  --query 'VolumesModifications[0].ModificationState'
# "completed"   <- NOW a second modification is allowed.`,
    },
    {
      label: 'The 4-per-24-hours quota, and what happens when you exceed it',
      language: 'bash',
      code: `# Even after each individual modification reaches "completed",
# there is a SEPARATE limit: at most 4 modifications to the SAME
# volume within a rolling 24-hour window.
for i in 1 2 3 4; do
  aws ec2 modify-volume --volume-id vol-0abc123 --iops $((3000 + i * 1000))
  aws ec2 wait volume-in-use --volume-ids vol-0abc123
  # (wait for "completed" between each, per the constraint above)
done
# 4 modifications completed within the rolling 24h window.

# A 5th modification attempt, still within that same 24-hour window:
aws ec2 modify-volume --volume-id vol-0abc123 --iops 8000
# An error occurred (VolumeModificationRateExceeded): You've reached
# the maximum number of modifications allowed for vol-0abc123 within
# a 24-hour period. Try again after <timestamp>.
# -- AWS's own documented behavior: the error message states exactly
# when the next modification will be allowed -- there is no
# workaround or quota-increase request for this specific limit.

# For an EMERGENCY performance need that genuinely can't wait (older
# instance types, or a stuck modification), AWS's own guidance for
# error scenarios is:
# Non-root volume: detach, modify while detached, then reattach.
aws ec2 detach-volume --volume-id vol-0abc123
aws ec2 modify-volume --volume-id vol-0abc123 --iops 16000
aws ec2 attach-volume --volume-id vol-0abc123 --instance-id i-0def456 --device /dev/xvdf
# Root volume: stop the instance, modify, then restart it instead.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team follows the main page\'s own ModifyVolume example to resize a 1 TiB production database volume and bump its IOPS, expecting near-instant results since the main page describes this as "no downtime." Two hours later, under continued load, they realize the new IOPS still isn\'t enough and try to modify the SAME volume again to raise it further — the request fails. Using this subtopic\'s theory, explain why, and what the team\'s realistic options are right now.',
    hint: 'AWS explicitly states how long a 1 TiB volume modification can take to reach the "completed" state, and that a second modification cannot be initiated until the first one gets there — has enough time necessarily passed?',
    solution: 'Per this subtopic\'s theory, the second modification is very likely being rejected because the first modification hasn\'t reached the "completed" state yet — AWS\'s own documentation specifically notes that a 1 TiB volume modification can take up to six hours to complete, and only two hours have passed. The team\'s expectation of "no downtime" was correct for the SIZE portion (which becomes usable within seconds, once the volume reaches "optimizing"), but that\'s a different milestone from the full modification reaching "completed," which is what gates a SECOND modification request on the same volume — this distinction is exactly what the main page\'s own "no downtime" framing doesn\'t clarify. The team\'s realistic options right now, per this subtopic\'s theory: (1) check describe-volumes-modifications to confirm the actual current state and estimated remaining time, and simply wait it out if the workload can tolerate current IOPS a while longer; or (2) if the need is genuinely urgent and this is a non-root volume, detach it, apply the additional modification while detached, and reattach — which AWS\'s own documented guidance offers specifically as a way around a blocked or stuck modification, at the cost of a brief interruption while detached. There is no way to force, cancel, or expedite the in-progress modification directly — per AWS\'s own stated limitations, a submitted volume modification request cannot be canceled.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ModifyVolume can be called repeatedly on the same volume back-to-back, since it\'s an online, no-downtime operation matching the main page\'s own description.',
      reality: 'Per this subtopic\'s theory, a volume must reach the "completed" state — which can take from minutes up to several hours depending on size — before another modification can be initiated on that same volume; a second call while the first is still in progress is rejected outright.'
    },
    {
      thought: 'A volume size increase becoming usable within seconds (once the volume reaches "optimizing") means the modification is fully done and the volume is immediately eligible for another change.',
      reality: 'Per this subtopic\'s theory, the size increase being usable and the modification reaching "completed" are two different milestones — the "optimizing" phase that follows can still take hours, and that full completion is what gates a subsequent modification, not the earlier size-usable point.'
    },
    {
      thought: 'If a volume modification is taking too long or the wrong values were requested, it can be canceled and reissued correctly.',
      reality: 'Per AWS\'s own documented limitations (cited in this subtopic\'s theory), a submitted volume modification request cannot be canceled — the realistic options when a change is stuck or wrong are to wait it out, or, for a non-root volume, detach/modify/reattach.'
    }
  ];
}
